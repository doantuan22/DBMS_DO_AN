// Mirrors the existing SQL CHECK constraints; parity is verified by R5 tests.
export const ROOM_TYPES = ['2D', '3D', 'IMAX', '4DX', 'ScreenX'];
export const SEAT_TYPES = ['Thường', 'VIP', 'Sweetbox', 'Đôi'];
export const RESOURCE_STATUSES = Object.freeze({
  users: ['Hoạt động', 'Bị khóa', 'Chưa kích hoạt'],
  assignments: ['Hiệu lực', 'Hết hạn', 'Đã hủy'],
  cinemas: ['Hoạt động', 'Bảo trì', 'Tạm đóng'],
  rooms: ['Hoạt động', 'Bảo trì', 'Ngưng hoạt động'],
  seats: ['Hoạt động', 'Hỏng', 'Bảo trì'],
  movies: ['Sắp chiếu', 'Đang chiếu', 'Ngừng chiếu'],
  products: ['Đang bán', 'Hết hàng', 'Ngừng bán'],
  promotions: ['Hoạt động', 'Hết hạn', 'Tạm dừng'],
  pricing: ['Áp dụng', 'Hết hạn', 'Tạm dừng'],
  showtimes: ['Mở bán', 'Đóng bán', 'Đã hủy', 'Hoàn thành'],
  cinemaImages: ['Hoạt động', 'Tạm ẩn'],
});
export const DAY_TYPES = ['Ngày thường', 'Cuối tuần', 'Ngày lễ', 'Tất cả'];
export const PRODUCT_TYPES = ['Bắp rang', 'Nước ngọt', 'Combo', 'Snack', 'Khác'];
export const DISCOUNT_TYPES = ['Phần trăm', 'Số tiền', 'PERCENT', 'FIXED'];
export const AGE_RATINGS = ['P', 'K', 'T13', 'T16', 'T18', 'C'];
