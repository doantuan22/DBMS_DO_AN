import { adminApi } from '../../api/adminApi.js';
import * as managerApi from '../../api/managerApi.js';
import { getMovies } from '../../api/catalogApi.js';
import { userCanAct } from '../../utils/authorization.js';

export const adminShowtime = (r) => ({
  id: r.SuatChieuID,
  cinemaId: r.RapID,
  cinemaName: r.TenRap,
  roomId: r.PhongID,
  roomName: r.TenPhong,
  movieId: r.PhimID,
  movieTitle: r.TenPhim,
  startsAt: r.ThoiGianBatDau,
  endsAt: r.ThoiGianKetThuc,
  format: r.DinhDang,
  basePrice: r.GiaVeCoBan,
  status: r.TrangThai,
});
export const adminPricing = (r) => ({
  id: r.GiaID,
  cinemaId: r.RapID,
  cinemaName: r.TenRap,
  seatType: r.LoaiGhe,
  dayType: r.LoaiNgay,
  format: r.DinhDang,
  surcharge: r.PhuThu,
  startsOn: r.NgayBatDau,
  endsOn: r.NgayKetThuc,
  status: r.TrangThai,
});
export function operationsAdapter(kind, user, managerState) {
  const manager = Boolean(managerState),
    role = manager ? 'QUAN_LY_RAP' : 'ADMIN';
  const can = (permission) => userCanAct(user, role, permission);
  return {
    kind,
    manager,
    allowed: can(kind === 'showtimes' ? 'QL_SUAT_CHIEU' : 'QL_BANG_GIA'),
    canRooms: can('QL_PHONG'),
    cinemaId: managerState?.cinemaId,
    cinemas: manager ? managerState.cinemas : null,
    cinemasLookup:
      can('QL_RAP') && !manager
        ? async () =>
            (await adminApi.cinemas()).cinemas.map((row) => ({ id: row.RapID, name: row.TenRap }))
        : null,
    rooms: can('QL_PHONG')
      ? async (cinemaId) =>
          manager
            ? (await managerApi.getRooms(cinemaId)).rooms
            : (await adminApi.rooms({ cinemaId })).rooms.map((row) => ({
                id: row.PhongID,
                cinemaId: row.RapID,
                name: row.TenPhong,
                status: row.TrangThai,
              }))
      : null,
    movies: async () =>
      !manager && can('QL_PHIM')
        ? (await adminApi.movies()).movies.map((row) => ({
            id: row.PhimID,
            title: row.TenPhim,
            posterUrl: row.PosterURL,
            status: row.TrangThai,
          }))
        : await getMovies(),
    list: async (cinemaId, filters) => {
      if (kind === 'showtimes') {
        const range = { fromDate: filters.fromDate, toDate: filters.toDate };
        return manager
          ? (await managerApi.getManagerShowtimes(cinemaId, `?${new URLSearchParams(range)}`))
              .showtimes
          : (await adminApi.showtimes({ cinemaId, ...range })).showtimes.map(adminShowtime);
      }
      return manager
        ? (await managerApi.getPricing(cinemaId)).pricing
        : (await adminApi.pricing({ cinemaId })).pricing.map(adminPricing);
    },
    save: (cinemaId, row, body) =>
      manager
        ? kind === 'showtimes'
          ? row
            ? managerApi.updateManagerShowtime(row.id, body)
            : managerApi.createManagerShowtime(body)
          : row
            ? managerApi.updatePricing(row.id, body)
            : managerApi.createPricing(cinemaId, body)
        : row
          ? adminApi.update(`${kind}/${row.id}`, body)
          : adminApi.create(
              kind,
              kind === 'pricing' ? { ...body, cinemaId: Number(cinemaId) } : body,
            ),
    cancel: (row) =>
      manager
        ? managerApi.cancelManagerShowtime(row.id)
        : adminApi.create(`showtimes/${row.id}/cancel`, {}),
  };
}
