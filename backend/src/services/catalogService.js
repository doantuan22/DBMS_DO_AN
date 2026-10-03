import { executeProcedure, DbTypes } from '../db/procedureClient.js';
import { HttpError } from '../utils/httpError.js';
import { serializeDateOnly as dateOnly } from '../utils/dateTime.js';

const rowsAt = (result, index = 0) => result.recordsets?.[index] ?? (index === 0 ? result.recordset ?? [] : []);

function movieDto(row) {
  return {
    id: row.PhimID,
    title: row.TenPhim,
    durationMinutes: row.ThoiLuong,
    releaseDate: dateOnly(row.NgayKhoiChieu),
    endDate: dateOnly(row.NgayKetThuc),
    language: row.NgonNgu,
    subtitle: row.PhuDe,
    ageRating: row.DoTuoi,
    director: row.DaoDien,
    description: row.MoTa,
    posterUrl: row.PosterURL,
    trailerUrl: row.TrailerURL,
    status: row.TrangThai,
    averageRating: row.DiemDanhGiaTrungBinh,
    reviewCount: row.SoLuotDanhGia,
    genres: row.DanhSachTheLoai ? row.DanhSachTheLoai.split(', ') : [],
  };
}

function cinemaDto(row) {
  return {
    id: row.RapID,
    name: row.TenRap,
    address: row.DiaChi,
    city: row.ThanhPho,
    phone: row.SoDienThoai,
    description: row.MoTa,
    operatingSince: dateOnly(row.NgayHoatDong),
    status: row.TrangThai,
    coverImageUrl: row.AnhDaiDienURL ?? null,
  };
}

function cinemaImageDto(row) {
  return { id: row.HinhAnhRapID, cinemaId: row.RapID, url: row.URL, description: row.MoTa, cover: row.LaAnhDaiDien, displayOrder: row.ThuTuHienThi, status: row.TrangThai, createdAt: row.NgayTao };
}

function showtimeDto(row) {
  return {
    id: row.SuatChieuID,
    movieId: row.PhimID,
    movieTitle: row.TenPhim,
    posterUrl: row.PosterURL,
    durationMinutes: row.ThoiLuong,
    ageRating: row.DoTuoi,
    cinemaId: row.RapID,
    cinemaName: row.TenRap,
    cinemaAddress: row.DiaChiRap,
    city: row.ThanhPho,
    roomId: row.PhongID,
    roomName: row.TenPhong,
    roomType: row.LoaiPhong,
    startsAt: row.ThoiGianBatDau,
    endsAt: row.ThoiGianKetThuc,
    date: dateOnly(row.NgayChieu),
    startTime: row.GioBatDau,
    endTime: row.GioKetThuc,
    format: row.DinhDang,
    basePrice: row.GiaVeCoBan,
    status: row.TrangThaiSuatChieu,
    totalSeats: row.TongSoGhe,
    bookedSeats: row.SoGheDaDat,
    availableSeats: row.SoGheConLai,
  };
}

function detailActorDto(row) {
  return { id: row.DienVienID, name: row.HoTen, nationality: row.QuocTich, role: row.VaiDien };
}

function reviewDto(row) {
  return {
    id: row.DanhGiaID,
    reviewerName: row.NguoiDanhGia,
    rating: row.SoSao,
    content: row.NoiDung,
    createdAt: row.NgayDanhGia,
  };
}

export function createCatalogService({ execute = executeProcedure } = {}) {
  async function listGenres() {
    const result = await execute('GENRE_LIST');
    return (result.recordset ?? []).map((row) => ({ id: row.TheLoaiID, name: row.TenTheLoai }));
  }

  async function listMovies({ status, genreId, search }) {
    const result = await execute('MOVIE_LIST', {
      TrangThai: { type: DbTypes.NVarChar(50), value: status },
      TheLoaiID: { type: DbTypes.Int, value: genreId },
      SearchTerm: { type: DbTypes.NVarChar(100), value: search },
    });
    return rowsAt(result).map(movieDto);
  }

  async function getMovieDetail(movieId) {
    const result = await execute('MOVIE_GET_DETAIL', {
      PhimID: { type: DbTypes.Int, value: movieId },
    });
    const row = rowsAt(result, 0)[0];
    if (!row) throw new HttpError(404, 'MOVIE_NOT_FOUND', 'Movie was not found.');
    return {
      movie: movieDto(row),
      genres: rowsAt(result, 1).map((genre) => ({ id: genre.TheLoaiID, name: genre.TenTheLoai })),
      actors: rowsAt(result, 2).map(detailActorDto),
      reviews: rowsAt(result, 3).map(reviewDto),
    };
  }

  async function listCinemas({ city }) {
    const result = await execute('CINEMA_LIST', {
      ThanhPho: { type: DbTypes.NVarChar(100), value: city },
    });
    return (result.recordset ?? []).map(cinemaDto);
  }

  async function listCinemaImages(cinemaId) {
    const result = await execute('CINEMA_GET_IMAGES', { RapID: { type: DbTypes.Int, value: cinemaId } });
    return (result.recordset ?? []).map(cinemaImageDto);
  }

  async function listShowtimes({ movieId, cinemaId, date }) {
    const result = await execute('SHOWTIME_LIST_BY_MOVIE', {
      PhimID: { type: DbTypes.Int, value: movieId },
      RapID: { type: DbTypes.Int, value: cinemaId },
      NgayChieu: { type: DbTypes.Date, value: date ?? null },
    });
    return (result.recordset ?? []).map(showtimeDto);
  }

  async function getShowtimeDetail(showtimeId) {
    const result = await execute('SHOWTIME_GET_DETAIL', {
      SuatChieuID: { type: DbTypes.Int, value: showtimeId },
    });
    const row = result.recordset?.[0];
    if (!row) throw new HttpError(404, 'SHOWTIME_NOT_FOUND', 'Showtime was not found.');
    return showtimeDto(row);
  }

  return { listGenres, listMovies, getMovieDetail, listCinemas, listCinemaImages, listShowtimes, getShowtimeDetail };
}

export const catalogService = createCatalogService();
