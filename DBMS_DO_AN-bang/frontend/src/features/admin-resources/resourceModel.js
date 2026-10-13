import { businessDate, formatDate, formatDateTime, instantToBusinessLocal, businessLocalToInstant } from '../../utils/dateTime.js';
import { RESOURCE_STATUSES, AGE_RATINGS, PRODUCT_TYPES, DISCOUNT_TYPES } from '../../../../shared/resourceContract.mjs';

export const money = (value) => value == null ? 'Chưa có dữ liệu' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 2 }).format(value);
export const positiveId = (value) => /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value));
const field = (name, label, type, column, extra = {}) => ({ name, label, type, column, ...extra });
const amount = (name, label, column, extra = {}) => field(name, label, 'number', column, { min: 0, decimal: true, exclusiveMax: 1e16, ...extra });
export const discount = (r) => ['Phần trăm', 'PERCENT'].includes(r.LoaiGiamGia) ? `${r.GiaTriGiam}%` : money(r.GiaTriGiam);
export const resourceDefinitions = {
  users: { title: 'Tài khoản', permission: 'QL_NGUOIDUNG', id: 'NguoiDungID', name: (row) => row.HoTen, description: 'Tra cứu tài khoản và trạng thái. Vai trò được xác định khi tạo tài khoản.',
    filters: { search: '', roleId: '', status: '' },
    fields: [field('name', 'Họ tên', 'text', 'HoTen', { maxLength: 100 }), field('email', 'Email', 'email', 'Email', { maxLength: 150 }), field('phone', 'Số điện thoại', 'tel', 'SoDienThoai', { optional: true, maxLength: 20 }), field('roleId', 'Vai trò tài khoản nội bộ', 'resource', 'VaiTroID', { lookup: 'roles' }), field('password', 'Mật khẩu ban đầu', 'password', null, { maxLength: 72 })],
    editFields: [field('status', 'Trạng thái tài khoản', 'select', 'TrangThai', { options: RESOURCE_STATUSES.users })],
    details: [['Email', 'Email'], ['Số điện thoại', 'SoDienThoai'], ['Vai trò', 'TenVaiTro'], ['Ngày tạo', 'NgayTao', formatDateTime], ['Điểm tích lũy', 'DiemTichLuy']],
  },
  assignments: { title: 'Phân công', permission: 'PHANCONG_RAP', id: 'PhanCongID', name: (row) => `${row.TenQuanLy} · ${row.TenRap}`, description: 'Phân công hoặc chuyển một phân công của Manager; giữ nguyên các phân công khác.',
    filters: { search: '', userId: '', cinemaId: '', status: '', effectiveOn: '' },
    fields: [field('userId', 'Manager', 'resource', 'NguoiDungID', { lookup: 'managers', immutable: true }), field('cinemaId', 'Rạp phân công', 'resource', 'RapID', { lookup: 'cinemas' }), field('startsOn', 'Ngày bắt đầu', 'date', 'NgayBatDau'), field('endsOn', 'Ngày kết thúc', 'date', 'NgayKetThuc', { optional: true })],
    statusField: field('status', 'Trạng thái phân công', 'select', 'TrangThai', { options: RESOURCE_STATUSES.assignments }),
    details: [['Manager', 'TenQuanLy'], ['Email', 'Email'], ['Rạp', 'TenRap'], ['Ngày bắt đầu', 'NgayBatDau', formatDate], ['Ngày kết thúc', 'NgayKetThuc', formatDate]],
  },
  movies: { title: 'Phim', permission: 'QL_DANHMUC_PHIM', id: 'PhimID', name: (r) => r.TenPhim, description: 'Danh mục phim, thể loại và diễn viên. Thông tin phim và danh sách diễn viên được chỉnh sửa riêng.', removable: true,
    filters: { search: '', genreId: '', status: '', minDuration: '', maxDuration: '' },
    fields: [field('title', 'Tên phim', 'text', 'TenPhim', { maxLength: 255 }), field('durationMinutes', 'Thời lượng (phút)', 'number', 'ThoiLuong', { min: 1, integer: true, default: 120 }), field('releaseDate', 'Ngày khởi chiếu', 'date', 'NgayKhoiChieu'), field('endDate', 'Ngày kết thúc', 'date', 'NgayKetThuc', { optional: true }), field('language', 'Ngôn ngữ', 'text', 'NgonNgu', { optional: true, maxLength: 100 }), field('subtitle', 'Phụ đề', 'text', 'PhuDe', { optional: true, maxLength: 100 }), field('ageRating', 'Phân loại độ tuổi', 'select', 'DoTuoi', { options: AGE_RATINGS }), field('director', 'Đạo diễn', 'text', 'DaoDien', { optional: true, maxLength: 150 }), field('description', 'Mô tả phim', 'textarea', 'MoTa', { optional: true }), field('posterUrl', 'URL poster', 'text', 'PosterURL', { optional: true, maxLength: 500 }), field('trailerUrl', 'URL trailer', 'text', 'TrailerURL', { optional: true, maxLength: 500 }), field('genreIds', 'Thể loại phim', 'multi-resource', 'TheLoaiIdList', { lookup: 'genres', optional: true })],
    statusField: field('status', 'Trạng thái phim', 'select', 'TrangThai', { options: RESOURCE_STATUSES.movies }),
    details: [['Đạo diễn', 'DaoDien'], ['Thời lượng (phút)', 'ThoiLuong'], ['Ngày khởi chiếu', 'NgayKhoiChieu', formatDate], ['Ngày kết thúc', 'NgayKetThuc', formatDate], ['Ngôn ngữ', 'NgonNgu'], ['Phụ đề', 'PhuDe'], ['Độ tuổi', 'DoTuoi'], ['Mô tả', 'MoTa']],
    deleteNotice: 'Phim có suất chiếu hoặc đánh giá sẽ bị từ chối xóa. Có thể chuyển trạng thái Ngừng chiếu để giữ lịch sử.',
  },
  actors: { title: 'Diễn viên', permission: 'QL_DANHMUC_PHIM', id: 'DienVienID', name: (r) => r.HoTen, description: 'Tra cứu diễn viên và các phim đã liên kết.', removable: true,
    filters: { search: '', movieId: '' }, fields: [field('name', 'Họ tên diễn viên', 'text', 'HoTen', { maxLength: 150 }), field('birthDate', 'Ngày sinh', 'date', 'NgaySinh', { optional: true }), field('nationality', 'Quốc tịch', 'text', 'QuocTich', { optional: true, maxLength: 100 })],
    details: [['Ngày sinh', 'NgaySinh', formatDate], ['Quốc tịch', 'QuocTich']], deleteNotice: 'Diễn viên đang tham gia phim sẽ bị từ chối xóa. Các liên kết phim không bị xóa hàng loạt.',
  },
  genres: { title: 'Thể loại', permission: 'QL_THELOAI', id: 'TheLoaiID', name: (r) => r.TenTheLoai, description: 'Danh mục thể loại và số phim liên kết khi được phép tra cứu.', removable: true,
    filters: { search: '' }, fields: [field('name', 'Tên thể loại', 'text', 'TenTheLoai', { maxLength: 100 })], details: [['Tên', 'TenTheLoai']], deleteNotice: 'Thể loại đang được gán cho phim sẽ bị từ chối xóa. Không xóa các liên kết thay cho thao tác này.',
  },
  products: { title: 'Sản phẩm', permission: 'QL_SANPHAM', id: 'SanPhamID', name: (r) => r.TenSanPham, description: 'Quản lý giá và trạng thái bán. Giá đã lưu trong đơn hàng được giữ theo lịch sử giao dịch.', removable: true,
    filters: { search: '', type: '', status: '', minPrice: '', maxPrice: '' },
    fields: [field('name', 'Tên sản phẩm', 'text', 'TenSanPham', { maxLength: 150 }), field('type', 'Loại sản phẩm', 'select', 'LoaiSanPham', { options: PRODUCT_TYPES }), amount('price', 'Giá bán (VND)', 'Gia'), field('description', 'Mô tả sản phẩm', 'textarea', 'MoTa', { maxLength: 255, optional: true }), field('image', 'URL hoặc đường dẫn ảnh', 'text', 'HinhAnh', { maxLength: 500, optional: true })],
    statusField: field('status', 'Trạng thái sản phẩm', 'select', 'TrangThai', { options: RESOURCE_STATUSES.products }),
    details: [['Loại', 'LoaiSanPham'], ['Giá hiện tại', 'Gia', money], ['Mô tả', 'MoTa']], deleteNotice: 'Sản phẩm có trong đơn hàng sẽ bị từ chối xóa. Chuyển trạng thái Ngừng bán để giữ lịch sử.',
  },
  promotions: { title: 'Khuyến mãi', permission: 'QL_KHUYENMAI', id: 'KhuyenMaiID', name: (r) => r.MaCode, description: 'Điều kiện áp dụng, thời gian và hạn mức từ hệ thống. Mã được giữ cố định sau khi tạo.', removable: true,
    filters: { search: '', discountType: '', status: '', fromDate: '', toDate: '' },
    fields: [field('code', 'Mã khuyến mãi', 'text', 'MaCode', { maxLength: 50, createOnly: true }), field('description', 'Mô tả khuyến mãi', 'textarea', 'MoTa', { maxLength: 255, optional: true }), field('discountType', 'Loại giảm giá', 'select', 'LoaiGiamGia', { options: DISCOUNT_TYPES }), amount('discountValue', 'Giá trị giảm (% hoặc VND)', 'GiaTriGiam', { min: 0.01 }), amount('minimumOrder', 'Giá trị đơn tối thiểu (VND)', 'DonHangToiThieu', { optional: true, default: 0 }), amount('maximumDiscount', 'Giảm tối đa (VND)', 'GiamToiDa', { optional: true }), field('startsAt', 'Bắt đầu (giờ Việt Nam)', 'datetime-local', 'NgayBatDau'), field('endsAt', 'Kết thúc (giờ Việt Nam)', 'datetime-local', 'NgayKetThuc'), field('quantity', 'Tổng số lượt', 'number', 'SoLuong', { min: 1, integer: true })],
    statusField: field('status', 'Trạng thái khuyến mãi', 'select', 'TrangThai', { options: RESOURCE_STATUSES.promotions }),
    details: [['Mã', 'MaCode'], ['Mô tả', 'MoTa'], ['Loại giảm', 'LoaiGiamGia'], ['Đơn tối thiểu', 'DonHangToiThieu', money], ['Giảm tối đa', 'GiamToiDa', money], ['Bắt đầu', 'NgayBatDau', formatDateTime], ['Kết thúc', 'NgayKetThuc', formatDateTime], ['Tổng lượt', 'SoLuong'], ['Đã dùng', 'SoLuongDaDung']],
    deleteNotice: 'Khuyến mãi đã gắn với đơn hàng sẽ bị từ chối xóa. Chuyển trạng thái Tạm dừng để giữ lịch sử.',
  },
};
export function movieGenreIds(row) {
  if (!Object.hasOwn(row, 'TheLoaiIdList')) throw new Error('Thiếu dữ liệu thể loại hiện tại; tải lại trước khi sửa.');
  const value = row.TheLoaiIdList;
  if (value == null || value === '') return [];
  if (typeof value !== 'string' || !/^\d+(?:,\d+)*$/.test(value)) throw new Error('Dữ liệu thể loại chưa hợp lệ; tải lại trước khi sửa.');
  const ids = value.split(',').map(Number); if (ids.some((id) => !positiveId(id)) || new Set(ids).size !== ids.length) throw new Error('Danh sách thể loại chưa hợp lệ.');
  return ids;
}
export function movieCast(row) {
  if (!Object.hasOwn(row, 'DanhSachDienVienJson')) throw new Error('Thiếu dữ liệu diễn viên hiện tại; tải lại trước khi sửa.');
  // The current SP/driver returns explicit null for zero relations (verified on DB test).
  if (row.DanhSachDienVienJson === null) return [];
  let parsed; try { parsed = JSON.parse(row.DanhSachDienVienJson); } catch { throw new Error('Không đọc được danh sách diễn viên hiện tại.'); }
  if (!Array.isArray(parsed) || parsed.some((r) => !positiveId(r.actorId) || r.role != null && typeof r.role !== 'string') || new Set(parsed.map((r) => r.actorId)).size !== parsed.length) throw new Error('Danh sách diễn viên hiện tại chưa hợp lệ.');
  return parsed.map((r) => ({ actorId: Number(r.actorId), role: r.role ?? '' }));
}
export function movieRelations(row) {
  try { return { genreIds: movieGenreIds(row), cast: movieCast(row), error: null }; }
  catch (error) { return { genreIds: [], cast: [], error }; }
}
export function linkedMovies(kind, row, lookup) {
  if (lookup?.status !== 'success' || lookup.rows.some((m) => movieRelations(m.row).error)) return null;
  return lookup.rows.filter((m) => kind === 'actors' ? movieCast(m.row).some((c) => c.actorId === row.DienVienID) : movieGenreIds(m.row).includes(row.TheLoaiID));
}
export function resourceFields(kind, editing = false) {
  const definition = resourceDefinitions[kind];
  return editing && definition.editFields ? definition.editFields : [...definition.fields.filter((f) => !editing || !f.createOnly), ...(editing && definition.statusField ? [definition.statusField] : [])];
}
export function resourceValues(kind, row, mode) {
  if (mode === 'cast') return { cast: movieCast(row) };
  return Object.fromEntries(resourceFields(kind, Boolean(row)).map((f) => [f.name, f.type === 'multi-resource' ? row ? movieGenreIds(row) : [] : row ? f.type === 'datetime-local' ? instantToBusinessLocal(row[f.column]) : String(row[f.column] ?? '') : f.default ?? (['startsOn', 'releaseDate'].includes(f.name) ? businessDate() : f.options?.[0] ?? '')]));
}
export function validateResource(kind, values, row, lookups) {
  const errors = {};
  for (const f of resourceFields(kind, Boolean(row))) {
    const value = values[f.name];
    if (!f.optional && !String(value ?? '').trim()) errors[f.name] = 'Vui lòng nhập hoặc chọn giá trị.';
    if (f.maxLength && String(value ?? '').length > f.maxLength) errors[f.name] = `Tối đa ${f.maxLength} ký tự.`;
    if (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(value)) errors[f.name] = 'Email chưa hợp lệ.';
    if (f.type === 'password' && (new TextEncoder().encode(value ?? '').length < 8 || new TextEncoder().encode(value ?? '').length > 72)) errors[f.name] = 'Mật khẩu cần từ 8 đến 72 byte UTF-8.';
    if (f.options && !f.options.includes(value)) errors[f.name] = 'Giá trị không thuộc danh mục cho phép.';
    if (f.type === 'number' && !(f.optional && value === '') && (!Number.isFinite(Number(value)) || f.integer && !Number.isSafeInteger(Number(value)) || Number(value) < (f.min ?? 0) || Number(value) > (f.max ?? (f.decimal ? 1e16 : 2147483647)) || f.exclusiveMax && Number(value) >= f.exclusiveMax || f.decimal && !decimalFits(value))) errors[f.name] = 'Nhập số trong giới hạn; tiền và tỷ lệ tối đa 2 chữ số thập phân.';
    if (f.type === 'datetime-local') { try { businessLocalToInstant(value); } catch { errors[f.name] = 'Thời gian chưa hợp lệ (giờ Việt Nam).'; } }
    if (f.type === 'date' && value) { try { formatDate(value); } catch { errors[f.name] = 'Ngày chưa hợp lệ.'; } }
    if (f.type === 'multi-resource' && (!Array.isArray(value) || new Set(value).size !== value.length || value.some((id) => !positiveId(id)) || value.length && (lookups[f.lookup]?.status !== 'success' || value.some((id) => !lookups[f.lookup].rows.some((r) => r.id === id))))) {
      const unchanged = row && JSON.stringify(value) === JSON.stringify(movieGenreIds(row)); if (!unchanged) errors[f.name] = 'Chọn từ danh mục thể loại được phép.';
    }
    if (f.type === 'resource' && !(row && f.immutable && String(row[f.column]) === value) && (!positiveId(value) || lookups[f.lookup]?.status !== 'success' || !lookups[f.lookup].rows.some((item) => String(item.id) === value))) errors[f.name] = 'Chọn từ danh mục được phép, hoặc tải lại danh mục.';
  }
  if (kind === 'assignments' && values.endsOn && values.endsOn < values.startsOn) errors.endsOn = 'Ngày kết thúc không được trước ngày bắt đầu.';
  if (kind === 'movies' && values.endDate && values.endDate < values.releaseDate) errors.endDate = 'Ngày kết thúc không được trước ngày khởi chiếu.';
  if (kind === 'actors' && values.birthDate && values.birthDate > businessDate()) errors.birthDate = 'Ngày sinh không được trong tương lai.';
  if (kind === 'promotions') {
    if (['Phần trăm', 'PERCENT'].includes(values.discountType) && Number(values.discountValue) > 99) errors.discountValue = 'Phần trăm phải lớn hơn 0 và không quá 99%.';
    if (values.endsAt < values.startsAt) errors.endsAt = 'Kết thúc không được trước bắt đầu.';
    if (row && Number(values.quantity) < row.SoLuongDaDung) errors.quantity = `Tổng lượt không được thấp hơn ${row.SoLuongDaDung} lượt đã dùng.`;
  }
  if (kind === 'users' && !row && !lookups.roles?.rows.some((role) => String(role.id) === values.roleId && ['ADMIN', 'CSKH', 'QUAN_LY_RAP'].includes(role.code))) errors.roleId = 'Chỉ tạo tài khoản nội bộ được phép.';
  return errors;
}
export function resourceBody(kind, values, row) {
  return Object.fromEntries(resourceFields(kind, Boolean(row)).map((f) => [f.name, f.optional && values[f.name] === '' ? f.type === 'date' ? null : undefined : f.type === 'datetime-local' ? businessLocalToInstant(values[f.name]) : ['resource', 'number'].includes(f.type) ? Number(values[f.name]) : f.type === 'multi-resource' ? [...values[f.name]] : values[f.name]]).filter(([, value]) => value !== undefined));
}
function decimalCents(value) {
  const text = String(value).trim().toLowerCase();
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/.test(text)) return null;
  const [mantissa, exponent = '0'] = text.split('e'), [whole, fraction = ''] = mantissa.replace(/^[+-]/, '').split('.');
  let digits = `${whole}${fraction}`.replace(/^0+/, '');
  if (!digits) return 0n;
  let scale = fraction.length - Number(exponent);
  if (!Number.isSafeInteger(scale)) return null;
  if (scale > 2) { const drop = Math.min(digits.match(/0+$/)?.[0].length ?? 0, scale - 2); if (drop) { digits = digits.slice(0, -drop); scale -= drop; } }
  if (scale > 2 || scale < -16 || digits.length > 18) return null;
  return BigInt(digits) * 10n ** BigInt(2 - scale) * (text.startsWith('-') ? -1n : 1n);
}
function decimalFits(value) {
  const original = decimalCents(value);
  // Reject a value if conversion to the existing JSON-number contract would change its cents.
  return original !== null && original === decimalCents(Number(value));
}
export function resourceQuery(state, _kind) {
  const safe = Object.fromEntries(Object.entries(state.applied).filter(([key, value]) => key !== 'search' && value !== ''));
  return new URLSearchParams({ ...safe, ...(state.selectedId ? { selectedId: state.selectedId } : {}), ...(state.page > 1 ? { page: String(state.page) } : {}) }).toString();
}
export function parseResourceQuery(kind, query) {
  const params = new URLSearchParams(query), applied = { ...resourceDefinitions[kind].filters };
  for (const key of Object.keys(applied)) if (key !== 'search' && params.has(key)) applied[key] = params.get(key);
  const page = Number(params.get('page'));
  return { applied, selectedId: params.get('selectedId') ?? '', page: Number.isSafeInteger(page) && page > 0 ? page : 1 };
}
export function resourceView(state, kind) {
  const f = state.applied, search = f.search.trim().toLocaleLowerCase('vi');
  const rows = state.resource.rows.filter((row) => kind === 'users'
    ? (!search || [row.HoTen, row.Email, row.SoDienThoai].some((value) => String(value ?? '').toLocaleLowerCase('vi').includes(search))) && (!f.roleId || String(row.VaiTroID) === f.roleId) && (!f.status || row.TrangThai === f.status)
    : kind === 'assignments' ? (!search || [row.TenQuanLy, row.Email, row.TenRap].some((value) => String(value ?? '').toLocaleLowerCase('vi').includes(search))) && (!f.userId || String(row.NguoiDungID) === f.userId) && (!f.cinemaId || String(row.RapID) === f.cinemaId) && (!f.status || row.TrangThai === f.status) && (!f.effectiveOn || row.NgayBatDau <= f.effectiveOn && (!row.NgayKetThuc || row.NgayKetThuc >= f.effectiveOn))
      : kind === 'movies' ? (!search || [row.TenPhim, row.DaoDien].some((v) => String(v ?? '').toLocaleLowerCase('vi').includes(search))) && (!f.status || row.TrangThai === f.status) && (!f.genreId || movieRelations(row).genreIds.includes(Number(f.genreId))) && (!f.minDuration || row.ThoiLuong >= Number(f.minDuration)) && (!f.maxDuration || row.ThoiLuong <= Number(f.maxDuration))
        : kind === 'products' ? (!search || [row.TenSanPham, row.MoTa].some((v) => String(v ?? '').toLocaleLowerCase('vi').includes(search))) && (!f.status || row.TrangThai === f.status) && (!f.type || row.LoaiSanPham === f.type) && (!f.minPrice || row.Gia >= Number(f.minPrice)) && (!f.maxPrice || row.Gia <= Number(f.maxPrice))
          : kind === 'promotions' ? (!search || [row.MaCode, row.MoTa].some((v) => String(v ?? '').toLocaleLowerCase('vi').includes(search))) && (!f.status || row.TrangThai === f.status) && (!f.discountType || row.LoaiGiamGia === f.discountType) && (!f.fromDate || businessDate(row.NgayKetThuc) >= f.fromDate) && (!f.toDate || businessDate(row.NgayBatDau) <= f.toDate)
            : (!search || resourceDefinitions[kind].name(row).toLocaleLowerCase('vi').includes(search)) && (!f.movieId || linkedMovies(kind, row, state.lookups.movies)?.some((movie) => String(movie.id) === f.movieId)));
  const page = Math.min(state.page, Math.max(1, Math.ceil(rows.length / state.pageSize)));
  return { total: rows.length, page, rows: rows.slice((page - 1) * state.pageSize, page * state.pageSize) };
}
