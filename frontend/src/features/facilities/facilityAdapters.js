import { adminApi } from '../../api/adminApi';
import * as managerApi from '../../api/managerApi';
import { userCanAct } from '../../utils/authorization';
import { adminCinema, adminRoom, adminSeat, adminImage } from './facilityModel';

export function facilityAdapter(kind, user, managerState) {
  const manager = Boolean(managerState),
    role = manager ? 'QUAN_LY_RAP' : 'ADMIN';
  const can = (permission) => userCanAct(user, role, permission);
  const permission = { seats: 'QL_GHE', rooms: 'QL_PHONG', cinemas: 'QL_RAP', images: 'QL_RAP' }[
    kind
  ];
  const common = {
    kind,
    allowed: can(permission),
    canRooms: can('QL_PHONG'),
    canShowtimes: can('QL_SUAT_CHIEU'),
    can,
    managerCinemaId: managerState?.cinemaId,
    cinemas: manager ? managerState.cinemas : kind === 'cinemas' ? [] : undefined,
    listCinemas: async () => {
      if (can('QL_RAP')) return { rows: (await adminApi.cinemas()).cinemas.map(adminCinema) };
      if (!can('QL_PHONG'))
        throw Object.assign(new Error('Không có quyền tải tên rạp/phòng.'), { status: 403 });
      const rooms = (await adminApi.rooms()).rooms;
      return {
        rows: [
          ...new Map(
            rooms.map((room) => [room.RapID, { id: room.RapID, name: room.TenRap }]),
          ).values(),
        ],
        limited: true,
      };
    },
    rooms: async (cinemaId) =>
      manager
        ? (await managerApi.getRooms(cinemaId)).rooms
        : (await adminApi.rooms({ cinemaId })).rooms.map(adminRoom),
    showtimes: async (scope) => {
      const rows = manager
        ? (await managerApi.getManagerShowtimes(scope.cinemaId)).showtimes
        : (await adminApi.showtimes({ cinemaId: scope.cinemaId })).showtimes.map((row) => ({
            id: row.SuatChieuID,
            roomId: row.PhongID,
            cinemaId: row.RapID,
            movieTitle: row.TenPhim,
            startsAt: row.ThoiGianBatDau,
          }));
      if (rows.some((row) => String(row.cinemaId) !== scope.cinemaId))
        throw new Error('Suất chiếu không khớp rạp.');
      return rows.filter((row) => String(row.roomId) === scope.roomId);
    },
  };
  if (kind === 'seats')
    return {
      ...common,
      list: async (scope) =>
        manager
          ? (await managerApi.getSeats(scope.roomId)).seats
          : (await adminApi.seats({ roomId: scope.roomId })).seats.map(adminSeat),
      save: (scope, row, body) =>
        manager
          ? row
            ? managerApi.updateSeat(row.id, body)
            : managerApi.createSeat(scope.roomId, body)
          : row
            ? adminApi.update(`seats/${row.id}`, body)
            : adminApi.create('seats', { roomId: Number(scope.roomId), ...body }),
      remove: (_scope, row) =>
        manager ? managerApi.deleteSeat(row.id) : adminApi.remove(`seats/${row.id}`),
    };
  if (kind === 'rooms')
    return {
      ...common,
      list: async (scope) => (await managerApi.getRooms(scope.cinemaId)).rooms,
      save: (scope, row, body) =>
        row ? managerApi.updateRoom(row.id, body) : managerApi.createRoom(scope.cinemaId, body),
      remove: (_scope, row) => managerApi.deleteRoom(row.id),
    };
  if (kind === 'cinemas')
    return {
      ...common,
      list: async () => (await adminApi.cinemas()).cinemas.map(adminCinema),
      counts: can('QL_PHONG')
        ? async () => (await adminApi.rooms()).rooms.map(adminRoom)
        : undefined,
      save: (_scope, row, body) =>
        row ? adminApi.update(`cinemas/${row.id}`, body) : adminApi.create('cinemas', body),
      remove: (_scope, row) => adminApi.remove(`cinemas/${row.id}`),
    };
  return {
    ...common,
    list: async (scope) => (await adminApi.cinemaImages(scope.cinemaId)).images.map(adminImage),
    save: (scope, row, body) =>
      row
        ? adminApi.updateCinemaImage(scope.cinemaId, row.id, body)
        : adminApi.createCinemaImage(scope.cinemaId, body),
    remove: (scope, row) => adminApi.deleteCinemaImage(scope.cinemaId, row.id),
    cover: (scope, row) => adminApi.setCinemaImageCover(scope.cinemaId, row.id),
  };
}
