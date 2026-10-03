import { parseApiInstant } from '../utils/dateTime.js';
import { DbTypes, executeProcedure, executeProcedureWithOutputs } from '../db/procedureClient.js';
import { hashPassword } from '../utils/password.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

const int = (value) => ({ type: DbTypes.Int, value: value ?? null });
const text = (length, value) => ({ type: DbTypes.NVarChar(length), value: value ?? null });
const date = (value) => ({ type: DbTypes.Date, value: value ?? null });
const rows = (result, index = 0) => result.recordsets?.[index] ?? (index === 0 ? result.recordset ?? [] : []);

// Native SQL Server constraint errors (no business 50xxx code). The client only gets a fixed message:
// table/constraint names and the raw SQL text stay in the server log.
function mapConstraintError(number, error) {
  const sqlMessage = String(error.message ?? error.originalError?.message ?? '');
  logger.error('Database constraint violation mapped to a client error', { sqlNumber: number, sqlMessage });
  if (number === 2627 || number === 2601) {
    throw new HttpError(409, 'DUPLICATE_RECORD', 'A record with the same unique value already exists.');
  }
  const statement = /^The (INSERT|UPDATE|DELETE|MERGE) statement conflicted/i.exec(sqlMessage)?.[1]?.toUpperCase();
  if (statement === 'DELETE') throw new HttpError(409, 'RECORD_IN_USE', 'This record is referenced by other data and cannot be deleted.');
  if (statement) throw new HttpError(400, 'INVALID_REFERENCE', 'The request references data that does not exist or is not allowed.');
  throw new HttpError(400, 'INVALID_REFERENCE', 'The request conflicts with existing data.');
}

// Status rules: invalid input -> 400, missing object -> 404, state/constraint conflict -> 409.
// Every business error number thrown by an admin procedure must be listed here
// (tests/adminService.test.js scans the admin SQL sources and fails on an unmapped one).
export function mapAdminProcedureError(error) {
  if (error instanceof HttpError) throw error;
  const number = error.number ?? error.originalError?.info?.number ?? error.originalError?.number;
  switch (number) {
    case 50207:
      throw new HttpError(409, 'SEAT_HAS_TICKET_HISTORY', 'Seats with ticket history cannot be changed or deleted.');
    case 50118:
      throw new HttpError(409, 'SHOWTIME_HAS_HELD_ORDERS', 'A showtime with held seats cannot be cancelled.');
    case 50071:
      throw new HttpError(400, 'ASSIGNMENT_MANAGER_REQUIRED', 'The assigned user must have the manager role.');
    case 50200:
    case 50095:
    case 50208:
      throw new HttpError(404, 'CINEMA_NOT_FOUND', 'Cinema was not found.');
    case 50230:
      throw new HttpError(404, 'CINEMA_IMAGE_NOT_FOUND', 'Cinema image was not found in this cinema.');
    case 50232:
      throw new HttpError(409, 'CINEMA_IMAGE_INACTIVE', 'An inactive image cannot be the cover.');
    case 50070:
      throw new HttpError(409, 'EMAIL_ALREADY_EXISTS', 'This email already exists.');
    case 50072:
      throw new HttpError(409, 'PROMOTION_CODE_EXISTS', 'This promotion code already exists.');
    case 50090:
    case 50214:
      throw new HttpError(404, 'ROLE_NOT_FOUND', 'Role was not found.');
    case 50091:
      throw new HttpError(409, 'ROLE_IN_USE', 'A role assigned to users or permissions cannot be deleted.');
    case 50092:
      throw new HttpError(409, 'PERMISSION_CODE_EXISTS', 'This permission code already exists.');
    case 50093:
      throw new HttpError(404, 'PERMISSION_NOT_FOUND', 'Permission was not found.');
    case 50094:
      throw new HttpError(409, 'PERMISSION_IN_USE', 'A permission assigned to roles cannot be deleted.');
    case 50096:
      throw new HttpError(409, 'CINEMA_HAS_DEPENDENCIES', 'A cinema with rooms, assignments, pricing or images cannot be deleted; change its status instead.');
    case 50097:
      throw new HttpError(409, 'GENRE_ALREADY_EXISTS', 'This genre already exists.');
    case 50098:
      throw new HttpError(404, 'GENRE_NOT_FOUND', 'Genre was not found.');
    case 50099:
      throw new HttpError(409, 'GENRE_IN_USE', 'A genre assigned to movies cannot be deleted.');
    case 50100:
      throw new HttpError(404, 'ACTOR_NOT_FOUND', 'Actor was not found.');
    case 50101:
      throw new HttpError(409, 'ACTOR_IN_USE', 'An actor who appears in movies cannot be deleted.');
    case 50102:
      throw new HttpError(404, 'MOVIE_NOT_FOUND', 'Movie was not found.');
    case 50103:
      throw new HttpError(400, 'MOVIE_CAST_INVALID', 'The cast list must be valid.');
    case 50104:
      throw new HttpError(409, 'MOVIE_HAS_DEPENDENCIES', 'A movie with showtimes or reviews cannot be deleted; change its status instead.');
    case 50105:
      throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Product was not found.');
    case 50106:
      throw new HttpError(409, 'PRODUCT_IN_USE', 'A product used in orders cannot be deleted; change its status instead.');
    case 50107:
      throw new HttpError(404, 'PROMOTION_NOT_FOUND', 'Promotion was not found.');
    case 50108:
      throw new HttpError(409, 'PROMOTION_IN_USE', 'A promotion used in orders cannot be deleted; change its status instead.');
    case 50201:
      throw new HttpError(409, 'ROOM_NAME_CONFLICT', 'This room name already exists in the cinema.');
    case 50202:
    case 50204:
    case 50056:
      throw new HttpError(404, 'ROOM_NOT_FOUND', 'Room was not found.');
    case 50203:
      throw new HttpError(409, 'ROOM_HAS_SHOWTIMES', 'A room with showtime history cannot be deleted; change its status instead.');
    case 50205:
      throw new HttpError(409, 'SEAT_POSITION_CONFLICT', 'This seat position already exists in the room.');
    case 50206:
      throw new HttpError(404, 'SEAT_NOT_FOUND', 'Seat was not found.');
    case 50209:
      throw new HttpError(400, 'PRICING_INVALID', 'The pricing date range or surcharge is invalid.');
    case 50210:
      throw new HttpError(404, 'PRICING_NOT_FOUND', 'Pricing entry was not found.');
    case 50211:
      throw new HttpError(400, 'SHOWTIME_TIME_INVALID', 'Showtime end must be after its start.');
    case 50058:
    case 50116:
      throw new HttpError(404, 'SHOWTIME_NOT_FOUND', 'Showtime was not found.');
    case 50117:
      throw new HttpError(409, 'SHOWTIME_ALREADY_CANCELLED', 'Showtime is already cancelled.');
    case 50001:
      throw new HttpError(409, 'SHOWTIME_OVERLAP', 'The room already has an overlapping showtime.');
    case 50215:
      throw new HttpError(409, 'PRICING_OVERLAP', 'An active pricing rule with the same conditions already covers part of this period.');
    case 50212:
      throw new HttpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment was not found.');
    case 50213:
      throw new HttpError(400, 'ASSIGNMENT_PERIOD_INVALID', 'The assignment period is invalid.');
    case 50220:
      throw new HttpError(400, 'CINEMA_IMAGE_URL_REQUIRED', 'The image URL must not be empty.');
    case 50221:
      throw new HttpError(400, 'CINEMA_IMAGE_ORDER_INVALID', 'The display order must be zero or greater.');
    case 2627:
    case 2601:
    case 547:
      mapConstraintError(number, error);
      break;
    default:
      throw error;
  }
}

export function createAdminService({ execute = executeProcedure, executeWithOutputs = executeProcedureWithOutputs } = {}) {
  return {
    async write(key, params) {
      try { return rows(await execute(key, params))[0] ?? null; } catch (error) { mapAdminProcedureError(error); }
    },
    async dashboard() {
      return rows(await execute('ADMIN_DASHBOARD'))[0] ?? {};
    },
    async users(filters = {}) {
      return rows(await execute('ADMIN_USER_LIST', {
        VaiTroID: int(filters.roleId), TrangThai: text(50, filters.status), SearchTerm: text(100, filters.search),
      }));
    },
    async roles() { return rows(await execute('ADMIN_ROLE_LIST')); },
    async permissions() { return rows(await execute('ADMIN_PERMISSION_LIST')); },
    async assignments(filters = {}) {
      return rows(await execute('ADMIN_ASSIGNMENT_LIST', { RapID: int(filters.cinemaId), NguoiDungID: int(filters.userId) }));
    },
    async cinemas() { return rows(await execute('ADMIN_CINEMA_LIST')); },
    async movies(filters = {}) {
      return rows(await execute('ADMIN_MOVIE_LIST', {
        TrangThai: text(50, filters.status), TheLoaiID: int(filters.genreId), SearchTerm: text(100, filters.search),
      }));
    },
    async genres() { return rows(await execute('ADMIN_GENRE_LIST')); },
    async actors() { return rows(await execute('ADMIN_ACTOR_LIST')); },
    async products() { return rows(await execute('ADMIN_PRODUCT_LIST')); },
    async promotions() { return rows(await execute('ADMIN_PROMOTION_LIST')); },
    async revenue(filters = {}) {
      const result = await execute('ADMIN_REPORT_REVENUE', {
        TuNgay: date(filters.fromDate), DenNgay: date(filters.toDate), RapID: int(filters.cinemaId),
      });
      return { cinemas: rows(result), totals: rows(result, 1)[0] ?? {} };
    },
    async createUser(input) {
      return this.write('ADMIN_USER_CREATE', {
        HoTen: text(100, input.name), Email: { type: DbTypes.VarChar(150), value: input.email },
        MatKhauHash: { type: DbTypes.VarChar(255), value: await hashPassword(input.password) },
        SoDienThoai: { type: DbTypes.VarChar(20), value: input.phone ?? null }, VaiTroID: int(input.roleId),
      });
    },
    async setUserStatus(userId, status) { return this.write('ADMIN_USER_UPDATE_STATUS', { NguoiDungID: int(userId), TrangThai: text(50, status) }); },
    async createRole(input) { return this.write('ADMIN_ROLE_CREATE', { MaVaiTro: { type: DbTypes.VarChar(50), value: input.code }, TenVaiTro: text(100, input.name), MoTa: text(255, input.description) }); },
    async updateRole(id, input) { return this.write('ADMIN_ROLE_UPDATE', { VaiTroID: int(id), TenVaiTro: text(100, input.name), MoTa: text(255, input.description) }); },
    async deleteRole(id) { return this.write('ADMIN_ROLE_DELETE', { VaiTroID: int(id) }); },
    async createPermission(input) { return this.write('ADMIN_PERMISSION_CREATE', { MaQuyen: { type: DbTypes.VarChar(50), value: input.code }, TenQuyen: text(100, input.name), MoTa: text(255, input.description) }); },
    async updatePermission(id, input) { return this.write('ADMIN_PERMISSION_UPDATE', { QuyenID: int(id), TenQuyen: text(100, input.name), MoTa: text(255, input.description) }); },
    async deletePermission(id) { return this.write('ADMIN_PERMISSION_DELETE', { QuyenID: int(id) }); },
    async setRolePermissions(roleId, permissionIds) {
      try { return rows(await execute('ADMIN_ROLE_PERMISSION_SET', { VaiTroID: int(roleId), QuyenIdList: { type: DbTypes.VarChar(DbTypes.MAX), value: permissionIds.join(',') } })); } catch (error) { mapAdminProcedureError(error); }
    },
    async rolePermissions(roleId) { return rows(await execute('ADMIN_ROLE_PERMISSION_LIST', { VaiTroID: int(roleId) })); },
    async createAssignment(input) { return this.write('ADMIN_ASSIGNMENT_CREATE', { NguoiDungID: int(input.userId), RapID: int(input.cinemaId), NgayBatDau: date(input.startsOn), NgayKetThuc: date(input.endsOn) }); },
    async updateAssignment(id, input) { return this.write('ADMIN_ASSIGNMENT_UPDATE', { PhanCongID: int(id), NguoiDungID: int(input.userId), RapID: int(input.cinemaId), NgayBatDau: date(input.startsOn), NgayKetThuc: date(input.endsOn), TrangThai: text(50, input.status) }); },
    async createCinema(input) { return this.write('ADMIN_CINEMA_CREATE', { TenRap: text(150, input.name), DiaChi: text(255, input.address), ThanhPho: text(100, input.city), SoDienThoai: { type: DbTypes.VarChar(20), value: input.phone ?? null }, MoTa: text(500, input.description), NgayHoatDong: date(input.operatingSince) }); },
    async updateCinema(id, input) { return this.write('ADMIN_CINEMA_UPDATE', { RapID: int(id), TenRap: text(150, input.name), DiaChi: text(255, input.address), ThanhPho: text(100, input.city), SoDienThoai: { type: DbTypes.VarChar(20), value: input.phone ?? null }, MoTa: text(500, input.description), TrangThai: text(50, input.status) }); },
    async deleteCinema(id) { return this.write('ADMIN_CINEMA_DELETE', { RapID: int(id) }); },
    async cinemaImages(cinemaId) { return rows(await execute('ADMIN_CINEMA_IMAGE_LIST', { RapID: int(cinemaId) })); },
    async createCinemaImage(cinemaId, input) {
      return this.write('ADMIN_CINEMA_IMAGE_CREATE', { RapID: int(cinemaId), URL: text(500, input.url), MoTa: text(255, input.description), LaAnhDaiDien: { type: DbTypes.Bit, value: input.cover ?? false }, ThuTuHienThi: int(input.displayOrder), TrangThai: text(50, input.status ?? 'Hoạt động') });
    },
    async updateCinemaImage(cinemaId, imageId, input) {
      return this.write('ADMIN_CINEMA_IMAGE_UPDATE', { RapID: int(cinemaId), HinhAnhRapID: int(imageId), URL: text(500, input.url), MoTa: text(255, input.description), ThuTuHienThi: int(input.displayOrder), TrangThai: text(50, input.status) });
    },
    async deleteCinemaImage(cinemaId, imageId) { return this.write('ADMIN_CINEMA_IMAGE_DELETE', { RapID: int(cinemaId), HinhAnhRapID: int(imageId) }); },
    async setCinemaImageCover(cinemaId, imageId, cover) {
      if (!cover) throw new HttpError(400, 'INVALID_REQUEST', 'Set cover to true; use the image lifecycle controls to remove a cover.');
      return this.write('ADMIN_CINEMA_IMAGE_SET_COVER', { RapID: int(cinemaId), HinhAnhRapID: int(imageId) });
    },
    async rooms(filters = {}) { return rows(await execute('ADMIN_ROOM_LIST', { RapID: int(filters.cinemaId) })); },
    async createRoom(input) { return this.write('ADMIN_ROOM_CREATE', { RapID: int(input.cinemaId), TenPhong: text(100, input.name), LoaiPhong: text(50, input.type) }); },
    async updateRoom(id, input) { return this.write('ADMIN_ROOM_UPDATE', { PhongID: int(id), TenPhong: text(100, input.name), LoaiPhong: text(50, input.type), TrangThai: text(50, input.status) }); },
    async deleteRoom(id) { return this.write('ADMIN_ROOM_DELETE', { PhongID: int(id) }); },
    async seats(filters = {}) { return rows(await execute('ADMIN_SEAT_LIST', { PhongID: int(filters.roomId) })); },
    async createSeat(input) { return this.write('ADMIN_SEAT_CREATE', { PhongID: int(input.roomId), HangGhe: { type: DbTypes.VarChar(10), value: input.row }, SoGhe: int(input.number), LoaiGhe: text(50, input.type) }); },
    async updateSeat(id, input) { return this.write('ADMIN_SEAT_UPDATE', { GheID: int(id), LoaiGhe: text(50, input.type), TrangThai: text(50, input.status) }); },
    async deleteSeat(id) { return this.write('ADMIN_SEAT_DELETE', { GheID: int(id) }); },
    async pricing(filters = {}) { return rows(await execute('ADMIN_PRICING_LIST', { RapID: int(filters.cinemaId) })); },
    async createPricing(input) { return this.write('ADMIN_PRICING_CREATE', { RapID: int(input.cinemaId), LoaiGhe: text(50, input.seatType), LoaiNgay: text(50, input.dayType), DinhDang: text(50, input.format), PhuThu: { type: DbTypes.Decimal(18, 2), value: input.surcharge }, NgayBatDau: date(input.startsOn), NgayKetThuc: date(input.endsOn) }); },
    async updatePricing(id, input) { return this.write('ADMIN_PRICING_UPDATE', { GiaID: int(id), PhuThu: { type: DbTypes.Decimal(18, 2), value: input.surcharge }, TrangThai: text(50, input.status) }); },
    async showtimes(filters = {}) { return rows(await execute('ADMIN_SHOWTIME_LIST', { RapID: int(filters.cinemaId), TuNgay: date(filters.fromDate), DenNgay: date(filters.toDate) })); },
    async createShowtime(input) {
      try { return await execute('ADMIN_SHOWTIME_CREATE', { PhimID: int(input.movieId), PhongID: int(input.roomId), ThoiGianBatDau: { type: DbTypes.DateTime2, value: parseApiInstant(input.startsAt, 'startsAt') }, ThoiGianKetThuc: { type: DbTypes.DateTime2, value: parseApiInstant(input.endsAt, 'endsAt') }, DinhDang: text(50, input.format), GiaVeCoBan: { type: DbTypes.Decimal(18, 2), value: input.basePrice } }); } catch (error) { mapAdminProcedureError(error); }
    },
    async updateShowtime(id, input) {
      try { return await execute('ADMIN_SHOWTIME_UPDATE', { SuatChieuID: int(id), PhimID: int(input.movieId), ThoiGianBatDau: { type: DbTypes.DateTime2, value: parseApiInstant(input.startsAt, 'startsAt') }, ThoiGianKetThuc: { type: DbTypes.DateTime2, value: parseApiInstant(input.endsAt, 'endsAt') }, DinhDang: text(50, input.format), GiaVeCoBan: { type: DbTypes.Decimal(18, 2), value: input.basePrice }, TrangThai: text(50, input.status) }); } catch (error) { mapAdminProcedureError(error); }
    },
    async cancelShowtime(id) { return this.write('ADMIN_SHOWTIME_CANCEL', { SuatChieuID: int(id) }); },
    async createGenre(input) { return this.write('ADMIN_GENRE_CREATE', { TenTheLoai: text(100, input.name) }); },
    async updateGenre(id, input) { return this.write('ADMIN_GENRE_UPDATE', { TheLoaiID: int(id), TenTheLoai: text(100, input.name) }); },
    async deleteGenre(id) { return this.write('ADMIN_GENRE_DELETE', { TheLoaiID: int(id) }); },
    async createActor(input) { return this.write('ADMIN_ACTOR_CREATE', { HoTen: text(150, input.name), NgaySinh: date(input.birthDate), QuocTich: text(100, input.nationality) }); },
    async updateActor(id, input) { return this.write('ADMIN_ACTOR_UPDATE', { DienVienID: int(id), HoTen: text(150, input.name), NgaySinh: date(input.birthDate), QuocTich: text(100, input.nationality) }); },
    async deleteActor(id) { return this.write('ADMIN_ACTOR_DELETE', { DienVienID: int(id) }); },
    async deleteMovie(id) { return this.write('ADMIN_MOVIE_DELETE', { PhimID: int(id) }); },
    async createMovie(input) {
      let result;
      try {
        result = await executeWithOutputs('ADMIN_MOVIE_CREATE', {
          TenPhim: text(255, input.title), ThoiLuong: int(input.durationMinutes), NgayKhoiChieu: date(input.releaseDate),
          NgayKetThuc: date(input.endDate), NgonNgu: text(100, input.language), PhuDe: text(100, input.subtitle),
          DoTuoi: text(20, input.ageRating), DaoDien: text(150, input.director), MoTa: text(DbTypes.MAX, input.description),
          PosterURL: text(500, input.posterUrl), TrailerURL: text(500, input.trailerUrl),
          TheLoaiIdList: { type: DbTypes.VarChar(DbTypes.MAX), value: input.genreIds.join(',') || null },
        }, { NewPhimID: DbTypes.Int });
      } catch (error) { mapAdminProcedureError(error); }
      return { movieId: result.output?.NewPhimID, detail: rows(result) };
    },
    async updateMovie(id, input) {
      try {
        return await execute('ADMIN_MOVIE_UPDATE', {
          PhimID: int(id), TenPhim: text(255, input.title), ThoiLuong: int(input.durationMinutes), NgayKhoiChieu: date(input.releaseDate),
          NgayKetThuc: date(input.endDate), NgonNgu: text(100, input.language), PhuDe: text(100, input.subtitle),
          DoTuoi: text(20, input.ageRating), DaoDien: text(150, input.director), MoTa: text(DbTypes.MAX, input.description),
          PosterURL: text(500, input.posterUrl), TrailerURL: text(500, input.trailerUrl), TrangThai: text(50, input.status),
          TheLoaiIdList: { type: DbTypes.VarChar(DbTypes.MAX), value: input.genreIds.join(',') },
        });
      } catch (error) { mapAdminProcedureError(error); }
    },
    async setMovieActors(id, cast) {
      try { return rows(await execute('ADMIN_MOVIE_ACTOR_SET', { PhimID: int(id), DanhSachJson: text(DbTypes.MAX, JSON.stringify(cast.map((actor) => ({ DienVienID: actor.actorId, VaiDien: actor.role })))) })); } catch (error) { mapAdminProcedureError(error); }
    },
    async createProduct(input) { return this.write('ADMIN_PRODUCT_CREATE', { TenSanPham: text(150, input.name), LoaiSanPham: text(50, input.type), Gia: { type: DbTypes.Decimal(18, 2), value: input.price }, MoTa: text(255, input.description), HinhAnh: text(500, input.image) }); },
    async updateProduct(id, input) { return this.write('ADMIN_PRODUCT_UPDATE', { SanPhamID: int(id), TenSanPham: text(150, input.name), LoaiSanPham: text(50, input.type), Gia: { type: DbTypes.Decimal(18, 2), value: input.price }, MoTa: text(255, input.description), HinhAnh: text(500, input.image), TrangThai: text(50, input.status) }); },
    async deleteProduct(id) { return this.write('ADMIN_PRODUCT_DELETE', { SanPhamID: int(id) }); },
    async createPromotion(input) { return this.write('ADMIN_PROMOTION_CREATE', { MaCode: { type: DbTypes.VarChar(50), value: input.code }, MoTa: text(255, input.description), LoaiGiamGia: text(20, input.discountType), GiaTriGiam: { type: DbTypes.Decimal(18, 2), value: input.discountValue }, DonHangToiThieu: { type: DbTypes.Decimal(18, 2), value: input.minimumOrder ?? 0 }, GiamToiDa: { type: DbTypes.Decimal(18, 2), value: input.maximumDiscount }, NgayBatDau: { type: DbTypes.DateTime2, value: parseApiInstant(input.startsAt, 'startsAt') }, NgayKetThuc: { type: DbTypes.DateTime2, value: parseApiInstant(input.endsAt, 'endsAt') }, SoLuong: int(input.quantity) }); },
    async updatePromotion(id, input) { return this.write('ADMIN_PROMOTION_UPDATE', { KhuyenMaiID: int(id), MoTa: text(255, input.description), LoaiGiamGia: text(20, input.discountType), GiaTriGiam: { type: DbTypes.Decimal(18, 2), value: input.discountValue }, DonHangToiThieu: { type: DbTypes.Decimal(18, 2), value: input.minimumOrder ?? 0 }, GiamToiDa: { type: DbTypes.Decimal(18, 2), value: input.maximumDiscount }, NgayBatDau: { type: DbTypes.DateTime2, value: parseApiInstant(input.startsAt, 'startsAt') }, NgayKetThuc: { type: DbTypes.DateTime2, value: parseApiInstant(input.endsAt, 'endsAt') }, SoLuong: int(input.quantity), TrangThai: text(50, input.status) }); },
    async deletePromotion(id) { return this.write('ADMIN_PROMOTION_DELETE', { KhuyenMaiID: int(id) }); },
  };
}

export const adminService = createAdminService();
