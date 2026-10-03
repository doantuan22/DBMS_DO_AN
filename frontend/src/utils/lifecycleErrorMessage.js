const messages = {
  SHOWTIME_CANNOT_CANCEL: 'Chỉ có thể hủy suất chiếu trước giờ bắt đầu.',
  SHOWTIME_HAS_ACTIVE_ORDERS: 'Suất chiếu đã có đơn; không thể đổi phim, giờ chiếu hoặc định dạng.',
  SHOWTIME_CANCEL_ROUTE_REQUIRED: 'Hãy dùng chức năng Hủy suất chiếu để hủy suất.',
  SEAT_HAS_TICKET_HISTORY: 'Ghế đã có vé hiệu lực cho suất chiếu tương lai, không thể đổi trạng thái.',
  SHOWTIME_UNAVAILABLE_FOR_PAYMENT: 'Suất chiếu đã đóng bán, đã hủy hoặc đã bắt đầu; không thể thanh toán.',
  ORDER_HOLD_EXPIRED: 'Đã hết hạn giữ ghế 5 phút. Vui lòng đặt vé lại.',
};

export function lifecycleErrorMessage(error) {
  return messages[error?.code] ?? error?.message ?? 'Không thể hoàn tất thao tác.';
}
