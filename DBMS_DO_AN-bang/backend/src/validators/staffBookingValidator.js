import { HttpError } from '../utils/httpError.js';
import { sqlId } from '../utils/inputContract.js';
import { positiveInteger, validateBooking } from './bookingValidator.js';

const statuses = ['Chờ thanh toán', 'Đã thanh toán', 'Hoàn thành', 'Đã hủy', 'Hết hạn', 'Hoàn tiền'];
function shape(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !keys.includes(key)))
    throw new HttpError(400, 'INVALID_REQUEST', 'Yêu cầu có trường không được hỗ trợ.');
  return value;
}
function search(value, required = false) {
  if (value == null && !required) return null;
  if (typeof value !== 'string' || value.trim().length > 100 || (required && value.trim().length < 2))
    throw new HttpError(400, 'INVALID_REQUEST', 'Tìm kiếm cần từ 2 đến 100 ký tự.');
  return value.trim() || null;
}
export const orderId = (value) => sqlId(value, 'orderId');
export function listFilters(value) {
  shape(value, ['search', 'status', 'cinemaId', 'page', 'pageSize']);
  const status = value.status || null;
  if (status && !statuses.includes(status)) throw new HttpError(400, 'INVALID_REQUEST', 'Trạng thái đơn không hợp lệ.');
  const page = value.page == null ? 1 : sqlId(value.page, 'page');
  const pageSize = value.pageSize == null ? 20 : sqlId(value.pageSize, 'pageSize');
  if (page > 100000 || pageSize > 100) throw new HttpError(400, 'INVALID_REQUEST', 'Phân trang vượt giới hạn.');
  return { search: search(value.search), status, cinemaId: value.cinemaId ? sqlId(value.cinemaId, 'cinemaId') : null, page, pageSize };
}
export function customerSearch(value) {
  shape(value, ['search']);
  return search(value.search, true);
}
export function bookingOptions(value) {
  shape(value, ['cinemaId', 'showtimeId', 'orderId']);
  const result = Object.fromEntries(['cinemaId', 'showtimeId', 'orderId'].map((key) => [key, value[key] ? sqlId(value[key], key) : null]));
  if (result.orderId && !result.showtimeId) throw new HttpError(400, 'INVALID_REQUEST', 'Chọn suất chiếu của đơn trước khi tải ghế.');
  return result;
}
export function createBooking(value) {
  shape(value, ['customerId', 'showtimeId', 'seatIds']);
  return { customerId: positiveInteger(value.customerId, 'customerId'), ...validateBooking({ showtimeId: value.showtimeId, seatIds: value.seatIds }) };
}
export function updateSeats(value) {
  shape(value, ['seatIds', 'expectedTicketIds']);
  const seatIds = validateBooking({ showtimeId: 1, seatIds: value.seatIds }).seatIds;
  const expectedTicketIds = validateBooking({ showtimeId: 1, seatIds: value.expectedTicketIds }).seatIds;
  return { seatIds, expectedTicketIds };
}
export function cancelBooking(value) {
  shape(value ?? {}, []);
}
