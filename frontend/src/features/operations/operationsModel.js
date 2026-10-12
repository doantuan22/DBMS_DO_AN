import { businessDate, defaultShowtimeLocal, formatDateTime } from '../../utils/dateTime.js';

export const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);
export const positiveId = (value) => /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value));
export function defaultFilters(kind) {
  return kind === 'showtimes'
    ? { roomId: '', movieId: '', status: '', fromDate: businessDate(), toDate: defaultShowtimeLocal(6, '00:00').slice(0, 10) }
    : { seatType: '', dayType: '', format: '', status: '', effectiveOn: '' };
}
export function parseOperationsQuery(kind, query) {
  const params = new URLSearchParams(query), applied = defaultFilters(kind);
  for (const key of Object.keys(applied)) if (params.has(key)) applied[key] = params.get(key);
  const page = Number(params.get('page'));
  return { cinemaId: params.get('cinemaId') ?? '', applied, page: Number.isSafeInteger(page) && page > 0 ? page : 1 };
}
export function operationsQuery(state) {
  return new URLSearchParams(Object.entries({ cinemaId: state.cinemaId, ...state.applied, ...(state.page > 1 ? { page: state.page } : {}) }).filter(([, value]) => value !== '' && value != null)).toString();
}
export function validateRange(filters) {
  const date = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!date(filters.fromDate) || !date(filters.toDate) || filters.fromDate > filters.toDate) return 'Chọn khoảng ngày hợp lệ: từ ngày không sau đến ngày.';
  if ((Date.parse(filters.toDate) - Date.parse(filters.fromDate)) / 86400000 > 30) return 'Mỗi lần tra cứu tối đa 31 ngày. Thu hẹp khoảng ngày để tải lịch.';
  return null;
}
export function operationsView(state, kind) {
  const f = state.applied;
  const rows = state.resource.rows.filter((row) => kind === 'showtimes'
    ? (!f.roomId || String(row.roomId) === f.roomId) && (!f.movieId || String(row.movieId) === f.movieId) && (!f.status || row.status === f.status)
    : (!f.seatType || row.seatType === f.seatType) && (!f.dayType || row.dayType === f.dayType) && (!f.format || row.format === f.format) && (!f.status || row.status === f.status) && (!f.effectiveOn || row.startsOn <= f.effectiveOn && (!row.endsOn || row.endsOn >= f.effectiveOn)));
  const sorted = rows.slice().sort((a, b) => kind === 'showtimes' ? a.startsAt.localeCompare(b.startsAt) || a.id - b.id : b.startsOn.localeCompare(a.startsOn) || a.id - b.id);
  const page = Math.min(state.page, Math.max(1, Math.ceil(sorted.length / state.pageSize)));
  return { rows: sorted.slice((page - 1) * state.pageSize, page * state.pageSize), total: sorted.length, page };
}
export const operationLabel = (kind, row) => kind === 'showtimes' ? `${row.movieTitle} · ${row.roomName} · ${formatDateTime(row.startsAt)}` : `${row.seatType} · ${row.dayType} · ${row.format}`;
export function operationsError(error) {
  const messages = {
    SHOWTIME_OVERLAP: 'Phòng đã có suất chiếu trùng thời gian. Chọn giờ khác và lưu lại.',
    SHOWTIME_HAS_HELD_ORDERS: 'Suất chiếu còn đơn đang giữ ghế nên chưa thể hủy.',
    SHOWTIME_HAS_ORDERS: 'Suất chiếu đã có lịch sử đơn; không thể đổi phim, thời gian, định dạng hoặc giá.',
    SHOWTIME_NOT_CANCELLABLE: 'Suất đã bắt đầu hoặc hoàn thành nên không thể hủy.',
    SHOWTIME_ALREADY_CANCELLED: 'Suất chiếu đã được hủy. Tải lại danh sách.',
    SHOWTIME_TIME_INVALID: 'Thời gian suất chiếu không phù hợp thời lượng phim hoặc quy định bắt đầu.',
    PRICING_OVERLAP: 'Đã có bảng giá cùng điều kiện áp dụng trong khoảng ngày này.',
    PRICING_INVALID: 'Điều kiện hoặc thời gian áp dụng bảng giá chưa hợp lệ.',
  };
  return Object.assign(new Error(messages[error.code] ?? error.message ?? 'Không thể thực hiện thao tác. Thử tải lại.'), { status: error.status, code: error.code });
}
