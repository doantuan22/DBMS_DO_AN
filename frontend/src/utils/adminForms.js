import { instantToBusinessLocal, businessLocalToInstant } from './dateTime.js';
import { DAY_TYPES } from '../../../shared/resourceContract.mjs';

export const adminForms = {
  users: { path: 'users', id: 'NguoiDungID', fields: [['name', 'Họ tên', 'text', 'HoTen'], ['email', 'Email', 'email', 'Email'], ['phone', 'Điện thoại', 'text', 'SoDienThoai'], ['roleId', 'Mã vai trò', 'number', 'VaiTroID']], createOnly: [['password', 'Mật khẩu ban đầu', 'password', '']], editFields: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  roles: { path: 'roles', id: 'VaiTroID', fields: [['name', 'Tên vai trò', 'text', 'TenVaiTro'], ['description', 'Mô tả', 'text', 'MoTa']], createOnly: [['code', 'Mã vai trò', 'text', 'MaVaiTro']] },
  permissions: { path: 'permissions', id: 'QuyenID', fields: [['name', 'Tên quyền', 'text', 'TenQuyen'], ['description', 'Mô tả', 'text', 'MoTa']], createOnly: [['code', 'Mã quyền', 'text', 'MaQuyen']] },
  assignments: { path: 'assignments', id: 'PhanCongID', fields: [['userId', 'Mã quản lý', 'number', 'NguoiDungID'], ['cinemaId', 'Mã rạp', 'number', 'RapID'], ['startsOn', 'Ngày bắt đầu', 'date', 'NgayBatDau'], ['endsOn', 'Ngày kết thúc', 'date', 'NgayKetThuc'], ['status', 'Trạng thái', 'text', 'TrangThai']] },
  cinemas: { path: 'cinemas', id: 'RapID', fields: [['name', 'Tên rạp', 'text', 'TenRap'], ['address', 'Địa chỉ', 'text', 'DiaChi'], ['city', 'Thành phố', 'text', 'ThanhPho'], ['phone', 'Điện thoại', 'text', 'SoDienThoai'], ['description', 'Mô tả', 'text', 'MoTa']], createOnly: [['operatingSince', 'Ngày hoạt động', 'date', 'NgayHoatDong']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  rooms: { path: 'rooms', id: 'PhongID', fields: [['name', 'Tên phòng', 'text', 'TenPhong'], ['type', 'Loại phòng', 'text', 'LoaiPhong']], createOnly: [['cinemaId', 'Mã rạp', 'number', 'RapID']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  seats: { path: 'seats', id: 'GheID', fields: [['type', 'Loại ghế', 'text', 'LoaiGhe']], createOnly: [['roomId', 'Mã phòng', 'number', 'PhongID'], ['row', 'Hàng', 'text', 'HangGhe'], ['number', 'Số ghế', 'number', 'SoGhe']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  movies: { path: 'movies', id: 'PhimID', fields: [['title', 'Tên phim', 'text', 'TenPhim'], ['durationMinutes', 'Thời lượng (phút)', 'number', 'ThoiLuong'], ['releaseDate', 'Ngày khởi chiếu', 'date', 'NgayKhoiChieu'], ['endDate', 'Ngày kết thúc', 'date', 'NgayKetThuc'], ['language', 'Ngôn ngữ', 'text', 'NgonNgu'], ['subtitle', 'Phụ đề', 'text', 'PhuDe'], ['ageRating', 'Độ tuổi', 'text', 'DoTuoi'], ['director', 'Đạo diễn', 'text', 'DaoDien'], ['description', 'Mô tả', 'text', 'MoTa'], ['posterUrl', 'Poster URL', 'text', 'PosterURL'], ['trailerUrl', 'Trailer URL', 'text', 'TrailerURL'], ['genreIds', 'Mã thể loại (phân cách dấu phẩy)', 'csv', '']], createOnly: [], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  genres: { path: 'genres', id: 'TheLoaiID', fields: [['name', 'Tên thể loại', 'text', 'TenTheLoai']] },
  actors: { path: 'actors', id: 'DienVienID', fields: [['name', 'Họ tên', 'text', 'HoTen'], ['birthDate', 'Ngày sinh', 'date', 'NgaySinh'], ['nationality', 'Quốc tịch', 'text', 'QuocTich']] },
  products: { path: 'products', id: 'SanPhamID', fields: [['name', 'Tên sản phẩm', 'text', 'TenSanPham'], ['type', 'Loại sản phẩm', 'text', 'LoaiSanPham'], ['price', 'Giá', 'number', 'Gia'], ['description', 'Mô tả', 'text', 'MoTa'], ['image', 'Hình ảnh URL', 'text', 'HinhAnh']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  promotions: { path: 'promotions', id: 'KhuyenMaiID', fields: [['description', 'Mô tả', 'text', 'MoTa'], ['discountType', 'Loại giảm giá', 'text', 'LoaiGiamGia'], ['discountValue', 'Giá trị giảm', 'number', 'GiaTriGiam'], ['minimumOrder', 'Đơn tối thiểu', 'number', 'DonHangToiThieu'], ['maximumDiscount', 'Giảm tối đa', 'number', 'GiamToiDa'], ['startsAt', 'Bắt đầu (giờ Việt Nam)', 'datetime-local', 'NgayBatDau'], ['endsAt', 'Kết thúc (giờ Việt Nam)', 'datetime-local', 'NgayKetThuc'], ['quantity', 'Số lượng', 'number', 'SoLuong']], createOnly: [['code', 'Mã khuyến mãi', 'text', 'MaCode']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  pricing: { path: 'pricing', id: 'GiaID', fields: [['surcharge', 'Phụ thu', 'number', 'PhuThu'], ['seatType', 'Loại ghế', 'text', 'LoaiGhe'], ['dayType', 'Loại ngày', 'text', 'LoaiNgay'], ['format', 'Định dạng', 'text', 'DinhDang'], ['startsOn', 'Ngày bắt đầu', 'date', 'NgayBatDau'], ['endsOn', 'Ngày kết thúc', 'date', 'NgayKetThuc']], createOnly: [['cinemaId', 'Mã rạp', 'number', 'RapID']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  showtimes: { path: 'showtimes', id: 'SuatChieuID', fields: [['movieId', 'Mã phim', 'number', 'PhimID'], ['startsAt', 'Bắt đầu (giờ Việt Nam)', 'datetime-local', 'ThoiGianBatDau'], ['endsAt', 'Kết thúc (giờ Việt Nam)', 'datetime-local', 'ThoiGianKetThuc'], ['format', 'Định dạng', 'text', 'DinhDang'], ['basePrice', 'Giá vé cơ bản', 'number', 'GiaVeCoBan']], createOnly: [['roomId', 'Mã phòng', 'number', 'PhongID']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
};


export const formFields = (definition, editing) => editing
  ? definition.editFields ?? [...definition.fields, ...(definition.editOnly ?? [])]
  : [...definition.fields, ...(definition.createOnly ?? [])];
export const inputValue = (value, kind) => {
  if (value == null) return '';
  if (kind === 'csv' && Array.isArray(value)) return value.join(',');
  if (kind === 'csv') return String(value);
  if (kind === 'datetime-local') return instantToBusinessLocal(value);
  if (kind === 'date') return String(value).slice(0, 10);
  return String(value);
};
export const toBody = (values, fields) => Object.fromEntries(fields.map(([name, , kind]) => {
  const value = values[name];
  if (name === 'dayType' && !DAY_TYPES.includes(value)) throw new Error('Loại ngày không hợp lệ.');
  if (kind === 'csv' && (value === '' || value === undefined || value === null)) return [name, []];
  if (value === '' || value === undefined) return [name, null];
  if (kind === 'datetime-local') return [name, businessLocalToInstant(value)];
  if (kind === 'number') return [name, Number(value)];
  if (kind === 'csv') return [name, value.split(',').filter(part => part.trim()).map(part => Number(part.trim()))];
  return [name, value];
}));
