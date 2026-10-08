import { parseApiInstant, serializeDateOnly } from '../utils/dateTime.js';
import { DbTypes, executeProcedure } from '../db/procedureClient.js';
import { HttpError } from '../utils/httpError.js';

const rows = (result, index = 0) => result.recordsets?.[index] ?? (index === 0 ? result.recordset ?? [] : []);
const sqlError = (error) => error.number ?? error.originalError?.info?.number ?? error.originalError?.number;
const number = (value) => value == null ? null : Number(value);

function managerError(error) {
  if (error instanceof HttpError) throw error;
  switch (sqlError(error)) {
    case 50209: throw new HttpError(400, 'PRICING_INVALID', 'The pricing conditions or date range are invalid.');
    case 50120: throw new HttpError(409, 'SHOWTIME_HAS_ORDERS', 'A showtime with order history cannot change its film, room, times, format or base price.');
    case 50123: throw new HttpError(409, 'SHOWTIME_CANCEL_ROUTE_REQUIRED', 'Use the separate showtime cancellation operation.');
    case 50216: throw new HttpError(400, 'SHOWTIME_TIME_INVALID', 'Showtime times violate the existing duration or start-time contract.');
    case 50207: throw new HttpError(409, 'SEAT_HAS_TICKET_HISTORY', 'Seat changes conflict with ticket history or active future tickets.');
    case 50050: throw new HttpError(403, 'MANAGER_CINEMA_FORBIDDEN', 'You are not assigned to this cinema.');
    case 50001: throw new HttpError(409, 'SHOWTIME_OVERLAP', 'The room already has an overlapping showtime.');
    case 50051: throw new HttpError(409, 'ROOM_NAME_CONFLICT', 'This room name already exists in the cinema.');
    case 50053: throw new HttpError(409, 'ROOM_HAS_SHOWTIMES', 'A room with showtime history cannot be deleted.');
    case 50054: throw new HttpError(409, 'SEAT_POSITION_CONFLICT', 'This seat position already exists in the room.');
    case 50055: throw new HttpError(409, 'SEAT_LAYOUT_LOCKED', 'The room has ticket history.');
    case 50057: throw new HttpError(400, 'SHOWTIME_TIME_INVALID', 'Showtime end must be after its start.');
    case 50052: throw new HttpError(404, 'ROOM_NOT_FOUND', 'Room was not found.');
    case 50217: throw new HttpError(409, 'ROOM_DELETE_CONFLICT', 'Room deletion conflicted with another operation. Reload and retry.');
    case 50056: throw new HttpError(404, 'ROOM_NOT_FOUND', 'Room was not found.');
    case 50058:
    case 50116: throw new HttpError(404, 'SHOWTIME_NOT_FOUND', 'Showtime was not found.');
    case 50109:
      throw new HttpError(404, 'MANAGER_RESOURCE_NOT_FOUND', 'Manager resource was not found.');
    case 50110: throw new HttpError(409, 'SEAT_HAS_TICKETS', 'A seat with tickets cannot be deleted.');
    case 50215: throw new HttpError(409, 'PRICING_OVERLAP', 'An active pricing rule with the same conditions already covers part of this period.');
    case 50117: throw new HttpError(409, 'SHOWTIME_ALREADY_CANCELLED', 'Showtime is already cancelled.');
    case 50118: throw new HttpError(409, 'SHOWTIME_HAS_HELD_ORDERS', 'A showtime with held seats cannot be cancelled.');
    case 50119: throw new HttpError(409, 'SHOWTIME_NOT_CANCELLABLE', 'A showtime that has started or completed cannot be cancelled.');
    default: throw error;
  }
}

const int = (value) => ({ type: DbTypes.Int, value });
const text = (length, value) => ({ type: DbTypes.NVarChar(length), value });
const date = (value) => ({ type: DbTypes.Date, value });

function cinemaDto(row) {
  return { assignmentId: row.PhanCongID, id: row.RapID, name: row.TenRap, address: row.DiaChi, city: row.ThanhPho, phone: row.SoDienThoai, startsOn: serializeDateOnly(row.NgayBatDau), endsOn: serializeDateOnly(row.NgayKetThuc), assignmentStatus: row.TrangThaiPhanCong };
}
function roomDto(row) {
  return { id: row.PhongID, cinemaId: row.RapID, cinemaName: row.TenRap, name: row.TenPhong, type: row.LoaiPhong, status: row.TrangThai, seatCount: row.TongSoGhe };
}
function seatDto(row) {
  return { id: row.GheID, roomId: row.PhongID, row: row.HangGhe, number: row.SoGhe, label: row.TenGhe, type: row.LoaiGhe, status: row.TrangThai };
}
function showtimeDto(row) {
  return { id: row.SuatChieuID, movieId: row.PhimID, movieTitle: row.TenPhim, roomId: row.PhongID, roomName: row.TenPhong, cinemaId: row.RapID, cinemaName: row.TenRap, startsAt: row.ThoiGianBatDau, endsAt: row.ThoiGianKetThuc, format: row.DinhDang, basePrice: number(row.GiaVeCoBan), status: row.TrangThai ?? row.TrangThaiSuatChieu };
}
function pricingDto(row) {
  return { id: row.GiaID, cinemaId: row.RapID, seatType: row.LoaiGhe, dayType: row.LoaiNgay, format: row.DinhDang, surcharge: number(row.PhuThu), startsOn: serializeDateOnly(row.NgayBatDau), endsOn: serializeDateOnly(row.NgayKetThuc), status: row.TrangThai };
}

export function createManagerService({ execute = executeProcedure } = {}) {
  async function call(key, params) {
    try {
      return await execute(key, params);
    } catch (error) {
      managerError(error);
    }
  }
  return {
    async listCinemas(userId) {
      return rows(await call('MANAGER_LIST_ASSIGNED_CINEMAS', { NguoiDungID: int(userId) })).map(cinemaDto);
    },
    async listRooms(userId, cinemaId) {
      return rows(await call('MANAGER_ROOM_LIST', { NguoiDungID: int(userId), RapID: int(cinemaId) })).map(roomDto);
    },
    async createRoom(userId, cinemaId, input) { return roomDto(rows(await call('MANAGER_ROOM_CREATE', { NguoiDungID: { type: DbTypes.Int, value: userId }, RapID: { type: DbTypes.Int, value: cinemaId }, TenPhong: { type: DbTypes.NVarChar(100), value: input.name }, LoaiPhong: { type: DbTypes.NVarChar(50), value: input.type } }))[0]); },
    async updateRoom(userId, id, input) { return roomDto(rows(await call('MANAGER_ROOM_UPDATE', { NguoiDungID: { type: DbTypes.Int, value: userId }, PhongID: { type: DbTypes.Int, value: id }, TenPhong: { type: DbTypes.NVarChar(100), value: input.name }, LoaiPhong: { type: DbTypes.NVarChar(50), value: input.type }, TrangThai: { type: DbTypes.NVarChar(50), value: input.status } }))[0]); },
    async deleteRoom(userId, id) {
      const result = rows(await call('MANAGER_ROOM_DELETE', { NguoiDungID: int(userId), PhongID: int(id) }))[0];
      return { deleted: Boolean(result.Deleted), deactivated: Boolean(result.Deactivated), roomId: result.PhongID, status: result.TrangThai, message: result.Message };
    },
    async listSeats(userId, id) { return rows(await call('MANAGER_SEAT_LIST_BY_ROOM', { NguoiDungID: int(userId), PhongID: int(id) })).map(seatDto); },
    async createSeat(userId, roomId, input) { return seatDto(rows(await call('MANAGER_SEAT_CREATE', { NguoiDungID: { type: DbTypes.Int, value: userId }, PhongID: { type: DbTypes.Int, value: roomId }, HangGhe: { type: DbTypes.VarChar(10), value: input.row }, SoGhe: { type: DbTypes.Int, value: input.number }, LoaiGhe: { type: DbTypes.NVarChar(50), value: input.type } }))[0]); },
    async updateSeat(userId, id, input) { return seatDto(rows(await call('MANAGER_SEAT_UPDATE', { NguoiDungID: { type: DbTypes.Int, value: userId }, GheID: { type: DbTypes.Int, value: id }, LoaiGhe: { type: DbTypes.NVarChar(50), value: input.type }, TrangThai: { type: DbTypes.NVarChar(50), value: input.status } }))[0]); },
    async deleteSeat(userId, id) { await call('MANAGER_SEAT_DELETE', { NguoiDungID: int(userId), GheID: int(id) }); },
    async listShowtimes(userId, cinemaId, range) { return rows(await call('MANAGER_SHOWTIME_LIST', { NguoiDungID: { type: DbTypes.Int, value: userId }, RapID: { type: DbTypes.Int, value: cinemaId }, TuNgay: { type: DbTypes.Date, value: range.fromDate }, DenNgay: { type: DbTypes.Date, value: range.toDate } })).map(showtimeDto); },
    async createShowtime(userId, input) { return showtimeDto(rows(await call('MANAGER_SHOWTIME_CREATE', { NguoiDungID: { type: DbTypes.Int, value: userId }, PhimID: { type: DbTypes.Int, value: input.movieId }, PhongID: { type: DbTypes.Int, value: input.roomId }, ThoiGianBatDau: { type: DbTypes.DateTime2, value: parseApiInstant(input.startsAt, 'startsAt') }, ThoiGianKetThuc: { type: DbTypes.DateTime2, value: parseApiInstant(input.endsAt, 'endsAt') }, DinhDang: { type: DbTypes.NVarChar(50), value: input.format }, GiaVeCoBan: { type: DbTypes.Decimal(18, 2), value: input.basePrice } }))[0]); },
    async updateShowtime(userId, id, input) { return showtimeDto(rows(await call('MANAGER_SHOWTIME_UPDATE', { NguoiDungID: { type: DbTypes.Int, value: userId }, SuatChieuID: { type: DbTypes.Int, value: id }, PhimID: { type: DbTypes.Int, value: input.movieId }, ThoiGianBatDau: { type: DbTypes.DateTime2, value: parseApiInstant(input.startsAt, 'startsAt') }, ThoiGianKetThuc: { type: DbTypes.DateTime2, value: parseApiInstant(input.endsAt, 'endsAt') }, DinhDang: { type: DbTypes.NVarChar(50), value: input.format }, GiaVeCoBan: { type: DbTypes.Decimal(18, 2), value: input.basePrice }, TrangThai: { type: DbTypes.NVarChar(50), value: input.status } }))[0]); },
    async cancelShowtime(userId, id, reason) { await call('MANAGER_SHOWTIME_CANCEL', { NguoiDungID: { type: DbTypes.Int, value: userId }, SuatChieuID: { type: DbTypes.Int, value: id }, LyDo: { type: DbTypes.NVarChar(255), value: reason ?? null } }); },
    async listPricing(userId, cinemaId) { return rows(await call('MANAGER_PRICING_LIST', { NguoiDungID: { type: DbTypes.Int, value: userId }, RapID: { type: DbTypes.Int, value: cinemaId } })).map(pricingDto); },
    async createPricing(userId, cinemaId, input) { return pricingDto(rows(await call('MANAGER_PRICING_CREATE', { NguoiDungID: { type: DbTypes.Int, value: userId }, RapID: { type: DbTypes.Int, value: cinemaId }, LoaiGhe: { type: DbTypes.NVarChar(50), value: input.seatType }, LoaiNgay: { type: DbTypes.NVarChar(50), value: input.dayType }, DinhDang: { type: DbTypes.NVarChar(50), value: input.format }, PhuThu: { type: DbTypes.Decimal(18, 2), value: input.surcharge }, NgayBatDau: { type: DbTypes.Date, value: input.startsOn }, NgayKetThuc: { type: DbTypes.Date, value: input.endsOn } }))[0]); },
    async updatePricing(userId, id, input) {
      const conditions = input.seatType === undefined ? {} : {
        LoaiGhe: text(50, input.seatType), LoaiNgay: text(50, input.dayType),
        DinhDang: text(50, input.format), NgayBatDau: date(input.startsOn),
        NgayKetThuc: date(input.endsOn), CapNhatDieuKien: { type: DbTypes.Bit, value: true },
      };
      return pricingDto(rows(await call('MANAGER_PRICING_UPDATE', {
        NguoiDungID: int(userId), GiaID: int(id),
        PhuThu: { type: DbTypes.Decimal(18, 2), value: input.surcharge },
        TrangThai: text(50, input.status), ...conditions,
      }))[0]);
    },
    async dashboard(userId, cinemaId) { const r = rows(await call('MANAGER_DASHBOARD', { NguoiDungID: { type: DbTypes.Int, value: userId }, RapID: { type: DbTypes.Int, value: cinemaId } }))[0]; return r && { cinemaId: r.RapID, cinemaName: r.TenRap, city: r.ThanhPho, activeRooms: r.TongPhongChieu, activeSeats: r.TongGhe, showtimesToday: r.SuatChieuHomNay, paidOrdersToday: r.DonDatVeHomNay }; },
    async revenue(userId, cinemaId, range) { return rows(await call('MANAGER_REVENUE', { NguoiDungID: { type: DbTypes.Int, value: userId }, RapID: { type: DbTypes.Int, value: cinemaId }, TuNgay: { type: DbTypes.Date, value: range.fromDate }, DenNgay: { type: DbTypes.Date, value: range.toDate } })).map((r) => ({ date: serializeDateOnly(r.Ngay), orderCount: r.SoDon, ticketCount: r.SoVeBan, ticketRevenue: number(r.DoanhThuVe), productRevenue: number(r.DoanhThuDoAn), discount: number(r.TienGiamGia), totalRevenue: number(r.DoanhThuThucTe) })); },
  };
}
export const managerService = createManagerService();
