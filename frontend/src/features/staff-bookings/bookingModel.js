import { remainingHoldSeconds } from '../../utils/dateTime.js';
export const bookingStatuses = ['Chờ thanh toán', 'Đã thanh toán', 'Hoàn thành', 'Đã hủy', 'Hết hạn', 'Hoàn tiền'];
export const emptyBookingFilters = () => ({ search: '', status: '', cinemaId: '' });
export const activeTickets = (order) => (order?.tickets ?? []).filter((ticket) => ticket.status === 'Đã đặt');
export const emptyBookingDraft = (cinemaId = '') => ({ customer: null, cinemaId, showtimeId: '', seatIds: [] });
export function parseBookingQuery(query, cinemaId) {
  const params = new URLSearchParams(query), page = Number(params.get('page'));
  return { selectedId: params.get('orderId') ?? '', applied: { search: '', status: bookingStatuses.includes(params.get('status')) ? params.get('status') : '', cinemaId: cinemaId ?? params.get('cinemaId') ?? '', page: Number.isSafeInteger(page) && page > 0 ? page : 1, pageSize: 20 } };
}
export function bookingQuery(state) {
  // Customer search may include email/phone. Never serialize it.
  return new URLSearchParams(Object.entries({ orderId: state.selectedId, cinemaId: state.applied.cinemaId, status: state.applied.status, ...(state.applied.page > 1 ? { page: state.applied.page } : {}) }).filter(([, value]) => value !== '' && value != null)).toString();
}
export function bookingDirty(state) {
  if (state.editor === 'create') return Boolean(state.draft.customer || state.draft.showtimeId || state.draft.seatIds.length || state.customerSearch.trim());
  return state.editor === 'edit' && state.draft.seatIds.slice().sort((a, b) => a - b).join(',') !== (state.expectedSeatIds ?? []).slice().sort((a, b) => a - b).join(',');
}
export function bookingCanEdit(order, now = Date.now()) {
  return Boolean(order?.canEdit && order.holdExpiresAt && remainingHoldSeconds(order.holdExpiresAt, now) > 0);
}
export function bookingSelection(state) {
  const options = state.options, draft = state.draft;
  const current = options.status === 'success' && options.cinemaId === draft.cinemaId && options.showtimeId === draft.showtimeId && options.orderId === (state.editor === 'edit' ? state.selectedId : null);
  const seats = current ? options.data.seats : [];
  const selected = seats.filter((seat) => draft.seatIds.includes(seat.id));
  const valid = current && draft.seatIds.length > 0 && draft.seatIds.every((id) => seats.some((seat) => seat.id === id && seat.status === 'Trống' && Number.isFinite(Number(seat.price))));
  return { current, seats, selected, valid, preview: selected.reduce((sum, seat) => sum + Number(seat.price), 0) };
}
