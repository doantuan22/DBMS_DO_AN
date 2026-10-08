import { HOLD_MINUTES, MAX_HOLDING_ORDERS, MAX_PRODUCT_QUANTITY, MAX_SEATS_PER_ORDER } from '../constants/bookingLimits';

export const SEAT_LIMIT_MESSAGE = `Mỗi đơn chỉ được chọn tối đa ${MAX_SEATS_PER_ORDER} ghế.`;
export const QUANTITY_LIMIT_MESSAGE = `Mỗi sản phẩm chỉ được đặt tối đa ${MAX_PRODUCT_QUANTITY}.`;

// Adds or removes a seat. Selecting an extra seat beyond the limit is refused (selection unchanged, limitReached = true).
export function toggleSeatSelection(selectedIds, seatId, max = MAX_SEATS_PER_ORDER) {
  if (selectedIds.includes(seatId)) return { selectedIds: selectedIds.filter((id) => id !== seatId), limitReached: false };
  if (selectedIds.length >= max) return { selectedIds, limitReached: true };
  return { selectedIds: [...selectedIds, seatId], limitReached: false };
}

// Parses a typed quantity into 0..max; limited = the user asked for more than max.
export function clampQuantity(value, max = MAX_PRODUCT_QUANTITY) {
  const parsed = Math.max(0, Number.parseInt(value, 10) || 0);
  return { quantity: Math.min(parsed, max), limited: parsed > max };
}

// Friendly Vietnamese text for API errors of the booking and payment flow (null = use the server message).
export function bookingErrorMessage(error) {
  switch (error?.code) {
    case 'SHOWTIME_HAS_ORDERS': return 'Suất chiếu đã có lịch sử đơn. Không thể đổi phim, phòng, thời gian, định dạng hoặc giá vé cơ bản; trạng thái vẫn theo quy định vận hành.';
    case 'SEAT_HAS_TICKET_HISTORY': return 'Không thể đổi loại ghế đã có lịch sử vé. Ghế có vé hiệu lực ở suất tương lai cũng bị hạn chế cập nhật.';
    case 'PROMOTION_NOT_AVAILABLE': return 'Khuyến mãi không còn khả dụng. Vui lòng kiểm tra lại giá và đơn trước khi đặt.';
    case 'SHOWTIME_UNAVAILABLE': return 'Suất chiếu không còn đủ điều kiện đặt vé. Vui lòng quay lại lịch chiếu và chọn suất khác.';
    case 'ACTIVE_ORDER_LIMIT_REACHED':
      return `Bạn đang giữ ${MAX_HOLDING_ORDERS} đơn chưa thanh toán. Hãy thanh toán hoặc chờ đơn cũ hết hạn (${HOLD_MINUTES} phút) rồi đặt tiếp.`;
    case 'SEAT_LIMIT_EXCEEDED': return SEAT_LIMIT_MESSAGE;
    case 'PRODUCT_QUANTITY_LIMIT_EXCEEDED': return QUANTITY_LIMIT_MESSAGE;
    case 'ORDER_HOLD_EXPIRED': return `Đơn đã hết thời gian giữ ghế (${HOLD_MINUTES} phút). Vui lòng đặt vé lại.`;
    case 'SHOWTIME_HAS_HELD_ORDERS': return 'Không thể hủy suất chiếu vì còn đơn giữ ghế/chờ thanh toán còn hiệu lực. Hãy chờ các đơn được thanh toán hoặc hết hạn.';
    case 'SHOWTIME_NOT_CANCELLABLE': return 'Không thể hủy suất chiếu đã bắt đầu hoặc hoàn thành.';
    case 'SHOWTIME_NOT_PAYABLE': return 'Suất chiếu không còn hợp lệ để thanh toán.';
    default: return null;
  }
}
