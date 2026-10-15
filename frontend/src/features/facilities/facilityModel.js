import { ROOM_TYPES, SEAT_TYPES, RESOURCE_STATUSES } from '../../../../shared/resourceContract.mjs';

export const textMatch = (value, query) =>
  String(value ?? '')
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .includes(
      String(query ?? '')
        .toLocaleLowerCase('vi')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .trim(),
    );
export const adminRoom = (row) => ({
  id: row.PhongID,
  cinemaId: row.RapID,
  cinemaName: row.TenRap,
  name: row.TenPhong,
  type: row.LoaiPhong,
  status: row.TrangThai,
  seatCount: row.TongSoGhe,
});
export const adminSeat = (row) => ({
  id: row.GheID,
  roomId: row.PhongID,
  cinemaId: row.RapID,
  row: row.HangGhe,
  number: row.SoGhe,
  label: row.TenGhe,
  type: row.LoaiGhe,
  status: row.TrangThai,
});
export const adminCinema = (row) => ({
  id: row.RapID,
  name: row.TenRap,
  address: row.DiaChi,
  city: row.ThanhPho,
  phone: row.SoDienThoai,
  description: row.MoTa,
  operatingSince: row.NgayHoatDong,
  status: row.TrangThai,
});
export const adminImage = (row) => ({
  id: row.HinhAnhRapID,
  cinemaId: row.RapID,
  url: row.URL,
  description: row.MoTa,
  cover: Boolean(row.LaAnhDaiDien),
  displayOrder: row.ThuTuHienThi,
  status: row.TrangThai,
});
export const positiveId = (value) =>
  /^[1-9]\d*$/.test(String(value ?? '')) && Number.isSafeInteger(Number(value));
export const freshFilters = () => ({ search: '', row: '', type: '', status: '', city: '' });
export const facilityLabels = { seats: 'ghế', rooms: 'phòng', cinemas: 'rạp', images: 'ảnh rạp' };
export function parseFacilityQuery(query) {
  const params = new URLSearchParams(query);
  return {
    scope: { cinemaId: params.get('cinemaId') ?? '', roomId: params.get('roomId') ?? '' },
    applied: {
      ...freshFilters(),
      search: (params.get('q') ?? '').slice(0, 150),
      ...Object.fromEntries(
        ['row', 'type', 'status', 'city'].map((key) => [
          key,
          (params.get(key) ?? '').slice(0, 100),
        ]),
      ),
    },
    page: positiveId(params.get('page')) ? Number(params.get('page')) : 1,
    showtimeId: params.get('showtimeId') ?? '',
    mode:
      params.has('showtimeId') || params.get('mode') === 'occupancy'
        ? 'occupancy'
        : 'configuration',
  };
}
export function facilityQuery(state) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state.scope)) if (value) params.set(key, value);
  for (const [key, value] of Object.entries(state.applied))
    if (value) params.set(key === 'search' ? 'q' : key, value);
  if (state.page > 1) params.set('page', state.page);
  if (state.mode === 'occupancy') {
    params.set('mode', 'occupancy');
    if (state.showtimeId) params.set('showtimeId', state.showtimeId);
  }
  return params.toString();
}
export function matchesResource(row, filters) {
  const searchFields = row.address
    ? [row.name, row.address, row.city]
    : [row.label ?? row.name ?? row.description];
  return (
    searchFields.some((value) => textMatch(value, filters.search)) &&
    ['row', 'type', 'status', 'city'].every(
      (key) => !filters[key] || String(row[key]) === filters[key],
    )
  );
}
export function resourceView(state) {
  const all = state.resource.status === 'success' ? state.resource.rows : [];
  const filtered = all.filter((row) => matchesResource(row, state.applied));
  const page = Math.min(state.page, Math.max(1, Math.ceil(filtered.length / state.pageSize)));
  return {
    all,
    filtered,
    page,
    rows: filtered.slice((page - 1) * state.pageSize, page * state.pageSize),
    total: filtered.length,
  };
}
export function seatRows(seats) {
  const groups = new Map(),
    positions = new Set();
  for (const seat of seats) {
    if (
      !seat.row ||
      !Number.isInteger(seat.number) ||
      seat.number <= 0 ||
      positions.has(`${seat.row}:${seat.number}`)
    )
      return null;
    positions.add(`${seat.row}:${seat.number}`);
    if (!groups.has(seat.row)) groups.set(seat.row, []);
    groups.get(seat.row).push(seat);
  }
  // Keep the row sequence supplied by the scoped SP; never infer physical aisles.
  return [...groups].map(([row, items]) => [row, items.toSorted((a, b) => a.number - b.number)]);
}
export function editorValues(kind, row) {
  if (kind === 'seats')
    return row ? { type: row.type, status: row.status } : { row: '', number: '', type: 'Thường' };
  if (kind === 'rooms')
    return row ? { name: row.name, type: row.type, status: row.status } : { name: '', type: '2D' };
  if (kind === 'images')
    return {
      url: row?.url ?? '',
      description: row?.description ?? '',
      displayOrder: row?.displayOrder ?? 0,
      status: row?.status ?? 'Hoạt động',
      ...(row ? {} : { cover: false }),
    };
  return {
    name: row?.name ?? '',
    address: row?.address ?? '',
    city: row?.city ?? '',
    phone: row?.phone ?? '',
    description: row?.description ?? '',
    ...(row ? { status: row.status } : { operatingSince: '' }),
  };
}
export function validateFacility(kind, values, editing) {
  const errors = {};
  const required = (key, max) => {
    if (!String(values[key] ?? '').trim()) errors[key] = 'Vui lòng nhập thông tin này.';
    else if (String(values[key]).trim().length > max) errors[key] = `Tối đa ${max} ký tự.`;
  };
  if (kind === 'seats') {
    if (!editing) {
      required('row', 10);
      if (!positiveId(values.number) || Number(values.number) > 2147483647)
        errors.number = 'Số ghế phải là số nguyên dương hợp lệ.';
    }
    if (!SEAT_TYPES.includes(values.type)) errors.type = 'Chọn loại ghế hợp lệ.';
  } else if (kind === 'rooms') {
    required('name', 100);
    if (!ROOM_TYPES.includes(values.type)) errors.type = 'Chọn loại phòng hợp lệ.';
  } else if (kind === 'images') {
    required('url', 500);
    if (!/^https?:\/\/\S+$/i.test(values.url.trim()) && !/^\/\S+/.test(values.url.trim()))
      errors.url = 'Nhập URL http/https hoặc đường dẫn bắt đầu bằng /.';
    if (
      !Number.isInteger(Number(values.displayOrder)) ||
      Number(values.displayOrder) < 0 ||
      Number(values.displayOrder) > 2147483647
    )
      errors.displayOrder = 'Thứ tự phải là số nguyên không âm hợp lệ.';
    if (String(values.description).length > 255) errors.description = 'Tối đa 255 ký tự.';
  } else {
    required('name', 150);
    required('address', 255);
    required('city', 100);
    if (String(values.phone).length > 20) errors.phone = 'Tối đa 20 ký tự.';
    if (String(values.description).length > 500) errors.description = 'Tối đa 500 ký tự.';
    if (
      !editing &&
      values.operatingSince &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(values.operatingSince) ||
        !Number.isFinite(Date.parse(values.operatingSince)) ||
        new Date(values.operatingSince).toISOString().slice(0, 10) !== values.operatingSince)
    )
      errors.operatingSince = 'Ngày không hợp lệ.';
  }
  const statuses = RESOURCE_STATUSES[kind === 'images' ? 'cinemaImages' : kind];
  if ((editing || kind === 'images') && !statuses.includes(values.status))
    errors.status = 'Chọn trạng thái hợp lệ.';
  return errors;
}
export function facilityPayload(kind, values) {
  const result = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim() : value,
    ]),
  );
  if (kind === 'seats' && 'number' in result) result.number = Number(result.number);
  if (kind === 'images') result.displayOrder = Number(result.displayOrder);
  if (kind === 'cinemas' && 'operatingSince' in result && !result.operatingSince)
    delete result.operatingSince;
  if (kind === 'cinemas')
    for (const key of ['phone', 'description']) if (result[key] === '') result[key] = null;
  return result;
}
export function facilityError(error) {
  const messages = {
    SEAT_HAS_TICKET_HISTORY:
      'Ghế có lịch sử vé hoặc vé hiệu lực tương lai. Không thể thực hiện thao tác; ghế và bản nháp được giữ nguyên.',
    SEAT_HAS_TICKETS: 'Ghế có lịch sử vé nên không thể xóa. Ghế được giữ nguyên.',
    SEAT_LAYOUT_LOCKED: 'Phòng có lịch sử vé nên không thể thay đổi cấu hình này.',
    SEAT_POSITION_CONFLICT: 'Hàng và số ghế đã tồn tại trong phòng.',
    SEAT_NOT_FOUND: 'Ghế không còn tồn tại. Hãy tải lại phòng.',
    ROOM_NAME_CONFLICT: 'Tên phòng đã tồn tại trong rạp.',
    ROOM_HAS_SHOWTIMES: 'Phòng có lịch sử suất chiếu; không thể xóa.',
    ROOM_DELETE_CONFLICT: 'Xung đột khi xử lý phòng. Dữ liệu được giữ nguyên; hãy tải lại.',
    CINEMA_HAS_DEPENDENCIES:
      'Rạp có dữ liệu liên quan nên không thể xóa. Có thể sửa trạng thái thành Tạm đóng.',
    CINEMA_IMAGE_INACTIVE: 'Ảnh Tạm ẩn không thể làm ảnh chính. Hãy sửa trạng thái trước.',
  };
  return Object.assign(
    new Error(messages[error?.code] ?? error?.message ?? 'Không thể hoàn tất thao tác.'),
    { status: error?.status, code: error?.code },
  );
}
