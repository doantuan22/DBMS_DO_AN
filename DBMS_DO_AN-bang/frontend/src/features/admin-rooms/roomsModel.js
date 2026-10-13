import { ROOM_TYPES, RESOURCE_STATUSES } from '../../../../shared/resourceContract.mjs';

export const emptyRoomFilters = { search: '', type: '', status: '' };
const normalize = (value) => String(value ?? '').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
const positive = (value, fallback) => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
export function parseRoomsQuery(query = '') {
  const params = new URLSearchParams(query);
  return {
    cinemaId: params.get('cinemaId') ?? '',
    applied: { search: (params.get('q') ?? '').slice(0, 100), type: ROOM_TYPES.includes(params.get('type')) ? params.get('type') : '', status: RESOURCE_STATUSES.rooms.includes(params.get('status')) ? params.get('status') : '' },
    page: positive(params.get('page'), 1),
    pageSize: [10, 20, 50].includes(Number(params.get('pageSize'))) ? Number(params.get('pageSize')) : 10,
  };
}
export function roomsQuery(state) {
  const params = new URLSearchParams();
  if (state.cinemaId) params.set('cinemaId', state.cinemaId);
  if (state.applied.search) params.set('q', state.applied.search);
  if (state.applied.type) params.set('type', state.applied.type);
  if (state.applied.status) params.set('status', state.applied.status);
  if (state.page > 1) params.set('page', String(state.page));
  if (state.pageSize !== 10) params.set('pageSize', String(state.pageSize));
  return params.toString();
}
export function roomsView(state) {
  const rows = state.resource.status === 'success' && state.resource.cinemaId === state.cinemaId ? state.resource.rows : [];
  const query = normalize(state.applied.search);
  const filtered = rows.filter((row) => (!query || normalize(row.TenPhong).includes(query)) &&
    (!state.applied.type || row.LoaiPhong === state.applied.type) && (!state.applied.status || row.TrangThai === state.applied.status));
  const page = Math.min(state.page, Math.max(1, Math.ceil(filtered.length / state.pageSize)));
  return { rows: filtered.slice((page - 1) * state.pageSize, page * state.pageSize), total: filtered.length, page,
    types: [...new Set(rows.map((row) => row.LoaiPhong).filter(Boolean))], scopeTotal: rows.length };
}
export function roomValues(row) {
  return { name: row?.TenPhong ?? '', type: row?.LoaiPhong ?? '2D', status: row?.TrangThai ?? 'Hoạt động' };
}
export function validateRoom(values, editing) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Nhập tên phòng chiếu.';
  else if (values.name.trim().length > 100) errors.name = 'Tên phòng tối đa 100 ký tự.';
  if (!ROOM_TYPES.includes(values.type)) errors.type = 'Chọn loại phòng hợp lệ.';
  if (editing && !RESOURCE_STATUSES.rooms.includes(values.status)) errors.status = 'Chọn trạng thái hợp lệ.';
  return errors;
}
export function roomPayload(editor, cinemaId) {
  const body = { name: editor.values.name.trim(), type: editor.values.type };
  return editor.mode === 'create' ? { cinemaId: Number(cinemaId), ...body } : { ...body, status: editor.values.status };
}
export const roomSeatsPath = (row) => `/admin/facilities/seats?${new URLSearchParams({ cinemaId: String(row.RapID), roomId: String(row.PhongID) })}`;
export function sameRoomsScope(destination, cinemaId) {
  const url = new URL(destination, 'http://local');
  return url.pathname === '/admin/facilities/rooms' && (url.searchParams.get('cinemaId') ?? '') === cinemaId;
}
export const resolveSeatRoom = (rows, cinemaId, roomId) => rows.find((row) => String(row.RapID) === String(cinemaId) && String(row.PhongID) === String(roomId));
export function roomsError(error) {
  const messages = {
    ROOM_NAME_CONFLICT: 'Tên phòng đã tồn tại trong rạp. Hãy chọn tên khác.',
    ROOM_NOT_FOUND: 'Phòng không còn tồn tại. Vui lòng tải lại danh sách.',
    ROOM_HAS_SHOWTIMES: 'Phòng có lịch sử suất chiếu nên không thể xóa. Có thể chuyển trạng thái sang Ngưng hoạt động.',
    ROOM_DELETE_CONFLICT: 'Chưa thể xóa phòng do xung đột dữ liệu. Danh sách được giữ nguyên; hãy tải lại trước khi thử lại.',
  };
  return Object.assign(new Error(messages[error?.code] ?? error?.message ?? 'Không thể hoàn tất thao tác.'), { status: error?.status, code: error?.code });
}
