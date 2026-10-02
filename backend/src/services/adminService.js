import { DbTypes, executeProcedure, executeProcedureWithOutputs } from '../db/procedureClient.js';
import { hashPassword } from '../utils/password.js';
import { HttpError } from '../utils/httpError.js';

const int = (value) => ({ type: DbTypes.Int, value: value ?? null });
const text = (length, value) => ({ type: DbTypes.NVarChar(length), value: value ?? null });
const date = (value) => ({ type: DbTypes.Date, value: value ?? null });
const rows = (result, index = 0) => result.recordsets?.[index] ?? (index === 0 ? result.recordset ?? [] : []);

function mapAdminProcedureError(error) {
  const number = error.number ?? error.originalError?.info?.number ?? error.originalError?.number;
  switch (number) {
    case 50207:
      throw new HttpError(409, 'SEAT_HAS_TICKET_HISTORY', 'Seats with ticket history cannot be changed or deleted.');
    case 50118:
      throw new HttpError(409, 'SHOWTIME_HAS_HELD_ORDERS', 'A showtime with held seats cannot be cancelled.');
    case 50071:
      throw new HttpError(400, 'ASSIGNMENT_MANAGER_REQUIRED', 'The assigned user must have the manager role.');
    case 50200:
      throw new HttpError(404, 'CINEMA_NOT_FOUND', 'Cinema was not found.');
    case 50230:
      throw new HttpError(404, 'CINEMA_IMAGE_NOT_FOUND', 'Cinema image was not found in this cinema.');
    case 50232:
      throw new HttpError(409, 'CINEMA_IMAGE_INACTIVE', 'An inactive image cannot be the cover.');
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
    async cinemas() { return rows(await execute('ADMIN_CINEMA_LIST', { ThanhPho: text(100, null) })); },
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
    async setRolePermissions(roleId, permissionIds) { return rows(await execute('ADMIN_ROLE_PERMISSION_SET', { VaiTroID: int(roleId), QuyenIdList: { type: DbTypes.VarChar(DbTypes.MAX), value: permissionIds.join(',') } })); },
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
    async createShowtime(input) { return execute('ADMIN_SHOWTIME_CREATE', { PhimID: int(input.movieId), PhongID: int(input.roomId), ThoiGianBatDau: { type: DbTypes.DateTime2, value: new Date(input.startsAt) }, ThoiGianKetThuc: { type: DbTypes.DateTime2, value: new Date(input.endsAt) }, DinhDang: text(50, input.format), GiaVeCoBan: { type: DbTypes.Decimal(18, 2), value: input.basePrice } }); },
    async updateShowtime(id, input) { return execute('ADMIN_SHOWTIME_UPDATE', { SuatChieuID: int(id), PhimID: int(input.movieId), ThoiGianBatDau: { type: DbTypes.DateTime2, value: new Date(input.startsAt) }, ThoiGianKetThuc: { type: DbTypes.DateTime2, value: new Date(input.endsAt) }, DinhDang: text(50, input.format), GiaVeCoBan: { type: DbTypes.Decimal(18, 2), value: input.basePrice }, TrangThai: text(50, input.status) }); },
    async cancelShowtime(id) { return this.write('ADMIN_SHOWTIME_CANCEL', { SuatChieuID: int(id) }); },
    async createGenre(input) { return this.write('ADMIN_GENRE_CREATE', { TenTheLoai: text(100, input.name) }); },
    async updateGenre(id, input) { return this.write('ADMIN_GENRE_UPDATE', { TheLoaiID: int(id), TenTheLoai: text(100, input.name) }); },
    async deleteGenre(id) { return this.write('ADMIN_GENRE_DELETE', { TheLoaiID: int(id) }); },
    async createActor(input) { return this.write('ADMIN_ACTOR_CREATE', { HoTen: text(150, input.name), NgaySinh: date(input.birthDate), QuocTich: text(100, input.nationality) }); },
    async updateActor(id, input) { return this.write('ADMIN_ACTOR_UPDATE', { DienVienID: int(id), HoTen: text(150, input.name), NgaySinh: date(input.birthDate), QuocTich: text(100, input.nationality) }); },
    async deleteActor(id) { return this.write('ADMIN_ACTOR_DELETE', { DienVienID: int(id) }); },
    async deleteMovie(id) { return this.write('ADMIN_MOVIE_DELETE', { PhimID: int(id) }); },
    async createMovie(input) {
      const result = await executeWithOutputs('ADMIN_MOVIE_CREATE', {
        TenPhim: text(255, input.title), ThoiLuong: int(input.durationMinutes), NgayKhoiChieu: date(input.releaseDate),
        NgayKetThuc: date(input.endDate), NgonNgu: text(100, input.language), PhuDe: text(100, input.subtitle),
        DoTuoi: text(20, input.ageRating), DaoDien: text(150, input.director), MoTa: text(DbTypes.MAX, input.description),
        PosterURL: text(500, input.posterUrl), TrailerURL: text(500, input.trailerUrl),
        TheLoaiIdList: { type: DbTypes.VarChar(DbTypes.MAX), value: input.genreIds.join(',') || null },
      }, { NewPhimID: DbTypes.Int });
      return { movieId: result.output?.NewPhimID, detail: rows(result) };
    },
    async updateMovie(id, input) {
      return execute('ADMIN_MOVIE_UPDATE', {
        PhimID: int(id), TenPhim: text(255, input.title), ThoiLuong: int(input.durationMinutes), NgayKhoiChieu: date(input.releaseDate),
        NgayKetThuc: date(input.endDate), NgonNgu: text(100, input.language), PhuDe: text(100, input.subtitle),
        DoTuoi: text(20, input.ageRating), DaoDien: text(150, input.director), MoTa: text(DbTypes.MAX, input.description),
        PosterURL: text(500, input.posterUrl), TrailerURL: text(500, input.trailerUrl), TrangThai: text(50, input.status),
        TheLoaiIdList: { type: DbTypes.VarChar(DbTypes.MAX), value: input.genreIds.join(',') },
      });
    },
    async setMovieActors(id, cast) { return rows(await execute('ADMIN_MOVIE_ACTOR_SET', { PhimID: int(id), DanhSachJson: text(DbTypes.MAX, JSON.stringify(cast.map((actor) => ({ DienVienID: actor.actorId, VaiDien: actor.role })))) })); },
    async createProduct(input) { return this.write('ADMIN_PRODUCT_CREATE', { TenSanPham: text(150, input.name), LoaiSanPham: text(50, input.type), Gia: { type: DbTypes.Decimal(18, 2), value: input.price }, MoTa: text(255, input.description), HinhAnh: text(500, input.image) }); },
    async updateProduct(id, input) { return this.write('ADMIN_PRODUCT_UPDATE', { SanPhamID: int(id), TenSanPham: text(150, input.name), LoaiSanPham: text(50, input.type), Gia: { type: DbTypes.Decimal(18, 2), value: input.price }, MoTa: text(255, input.description), HinhAnh: text(500, input.image), TrangThai: text(50, input.status) }); },
    async deleteProduct(id) { return this.write('ADMIN_PRODUCT_DELETE', { SanPhamID: int(id) }); },
    async createPromotion(input) { return this.write('ADMIN_PROMOTION_CREATE', { MaCode: { type: DbTypes.VarChar(50), value: input.code }, MoTa: text(255, input.description), LoaiGiamGia: text(20, input.discountType), GiaTriGiam: { type: DbTypes.Decimal(18, 2), value: input.discountValue }, DonHangToiThieu: { type: DbTypes.Decimal(18, 2), value: input.minimumOrder ?? 0 }, GiamToiDa: { type: DbTypes.Decimal(18, 2), value: input.maximumDiscount }, NgayBatDau: { type: DbTypes.DateTime2, value: new Date(input.startsAt) }, NgayKetThuc: { type: DbTypes.DateTime2, value: new Date(input.endsAt) }, SoLuong: int(input.quantity) }); },
    async updatePromotion(id, input) { return this.write('ADMIN_PROMOTION_UPDATE', { KhuyenMaiID: int(id), MoTa: text(255, input.description), LoaiGiamGia: text(20, input.discountType), GiaTriGiam: { type: DbTypes.Decimal(18, 2), value: input.discountValue }, DonHangToiThieu: { type: DbTypes.Decimal(18, 2), value: input.minimumOrder ?? 0 }, GiamToiDa: { type: DbTypes.Decimal(18, 2), value: input.maximumDiscount }, NgayBatDau: { type: DbTypes.DateTime2, value: new Date(input.startsAt) }, NgayKetThuc: { type: DbTypes.DateTime2, value: new Date(input.endsAt) }, SoLuong: int(input.quantity), TrangThai: text(50, input.status) }); },
    async deletePromotion(id) { return this.write('ADMIN_PROMOTION_DELETE', { KhuyenMaiID: int(id) }); },
  };
}

export const adminService = createAdminService();
