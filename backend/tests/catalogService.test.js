import assert from 'node:assert/strict';
import test from 'node:test';
import { createCatalogService } from '../src/services/catalogService.js';

function fixture() {
  const calls = [];
  const results = new Map();
  const execute = async (key, params) => {
    calls.push({ key, params });
    if (!results.has(key)) throw new Error(`Unexpected procedure ${key}`);
    return results.get(key);
  };
  return { service: createCatalogService({ execute }), calls, results };
}

test('movie list calls only the database list procedure with the contract filters', async () => {
  const { service, calls, results } = fixture();
  results.set('MOVIE_LIST', { recordset: [{
    PhimID: 7, TenPhim: 'Dune', ThoiLuong: 166, NgayKhoiChieu: new Date('2026-01-01T00:00:00Z'),
    NgayKetThuc: null, NgonNgu: 'English', PhuDe: 'Vietnamese', DoTuoi: 'T16', DaoDien: 'Director',
    PosterURL: 'https://example.com/poster.jpg', TrailerURL: null, TrangThai: 'Đang chiếu',
    DiemDanhGiaTrungBinh: 4.5, SoLuotDanhGia: 2, DanhSachTheLoai: 'Action, Sci-Fi',
  }] });

  const movies = await service.listMovies({ status: 'Đang chiếu', genreId: 3, search: 'Dune' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].key, 'MOVIE_LIST');
  assert.deepEqual(Object.fromEntries(Object.entries(calls[0].params).map(([key, value]) => [key, value.value])), {
    TrangThai: 'Đang chiếu', TheLoaiID: 3, SearchTerm: 'Dune',
  });
  assert.deepEqual(movies[0], {
    id: 7, title: 'Dune', durationMinutes: 166, releaseDate: '2026-01-01', endDate: null,
    language: 'English', subtitle: 'Vietnamese', ageRating: 'T16', director: 'Director',
    description: undefined, posterUrl: 'https://example.com/poster.jpg', trailerUrl: null,
    status: 'Đang chiếu', averageRating: 4.5, reviewCount: 2, genres: ['Action', 'Sci-Fi'],
  });
});

test('movie detail maps all four stored-procedure recordsets', async () => {
  const { service, calls, results } = fixture();
  results.set('MOVIE_GET_DETAIL', { recordsets: [
    [{ PhimID: 2, TenPhim: 'Mai', ThoiLuong: 131, NgayKhoiChieu: new Date('2026-01-10T00:00:00Z'), TrangThai: 'Đang chiếu' }],
    [{ TheLoaiID: 6, TenTheLoai: 'Romance' }],
    [{ DienVienID: 5, HoTen: 'Actor', QuocTich: 'VN', VaiDien: 'Lead' }],
    [{ DanhGiaID: 11, NguoiDanhGia: 'Customer', SoSao: 5, NoiDung: 'Good', NgayDanhGia: new Date('2026-01-12T00:00:00Z') }],
  ] });

  const detail = await service.getMovieDetail(2);
  assert.equal(calls[0].key, 'MOVIE_GET_DETAIL');
  assert.equal(calls[0].params.PhimID.value, 2);
  assert.equal(detail.movie.title, 'Mai');
  assert.deepEqual(detail.genres, [{ id: 6, name: 'Romance' }]);
  assert.deepEqual(detail.actors, [{ id: 5, name: 'Actor', nationality: 'VN', role: 'Lead' }]);
  assert.equal(detail.reviews[0].rating, 5);
});

test('missing movie and showtime rows map to the API not-found contract', async () => {
  const { service, results } = fixture();
  results.set('MOVIE_GET_DETAIL', { recordsets: [[], [], [], []] });
  results.set('SHOWTIME_GET_DETAIL', { recordset: [] });
  await assert.rejects(service.getMovieDetail(999), { status: 404, code: 'MOVIE_NOT_FOUND' });
  await assert.rejects(service.getShowtimeDetail(999), { status: 404, code: 'SHOWTIME_NOT_FOUND' });
});

test('cinema list and showtime filters call their own stored procedures', async () => {
  const { service, calls, results } = fixture();
  results.set('CINEMA_LIST', { recordset: [{ RapID: 2, TenRap: 'Cinema', DiaChi: 'Address', ThanhPho: 'City', TrangThai: 'Hoạt động' }] });
  results.set('SHOWTIME_LIST_BY_MOVIE', { recordset: [] });
  results.set('SHOWTIME_GET_DETAIL', { recordset: [{
    SuatChieuID: 25, PhimID: 7, TenPhim: 'Dune', RapID: 2, TenRap: 'Cinema', PhongID: 3,
    TenPhong: 'Room 3', ThoiGianBatDau: new Date('2026-10-01T12:00:00Z'),
    NgayChieu: new Date('2026-10-01T00:00:00Z'), GioBatDau: '19:00', GiaVeCoBan: 85000,
    TrangThaiSuatChieu: 'Mở bán', TongSoGhe: 80, SoGheDaDat: 20, SoGheConLai: 60,
  }] });

  assert.equal((await service.listCinemas({ city: 'City' }))[0].id, 2);
  assert.deepEqual(await service.listShowtimes({ movieId: 7, cinemaId: 2, date: '2026-10-01' }), []);
  const dateParameter = calls[1].params.NgayChieu.value;
  assert.equal(dateParameter, '2026-10-01');
  assert.deepEqual(calls.map((call) => call.key), ['CINEMA_LIST', 'SHOWTIME_LIST_BY_MOVIE']);
  const showtime = await service.getShowtimeDetail(25);
  assert.equal(showtime.id, 25);
  assert.equal(showtime.availableSeats, 60);
  assert.equal(calls[2].key, 'SHOWTIME_GET_DETAIL');
});

test('cinema list maps nullable cover images and gallery uses one stored procedure', async () => {
  const { service, calls, results } = fixture();
  results.set('CINEMA_LIST', { recordset: [{ RapID: 2, TenRap: 'Cinema', DiaChi: 'Address', ThanhPho: 'City', TrangThai: 'Hoạt động', AnhDaiDienURL: null }] });
  results.set('CINEMA_GET_IMAGES', { recordset: [{ HinhAnhRapID: 8, RapID: 2, URL: '/images/cinema.jpg', MoTa: 'Lobby', LaAnhDaiDien: true, ThuTuHienThi: 0, TrangThai: 'Hoạt động' }] });
  const cinemas = await service.listCinemas({ city: null });
  const images = await service.listCinemaImages(2);
  assert.equal(cinemas[0].coverImageUrl, null);
  assert.deepEqual(images[0], { id: 8, cinemaId: 2, url: '/images/cinema.jpg', description: 'Lobby', cover: true, displayOrder: 0, status: 'Hoạt động', createdAt: undefined });
  assert.deepEqual(calls.map((call) => call.key), ['CINEMA_LIST', 'CINEMA_GET_IMAGES']);
  assert.equal(calls[1].params.RapID.value, 2);
});
