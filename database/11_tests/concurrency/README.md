# Concurrency tests

Booking, pricing overlap và cinema image lock stress chuyển từ source cũ vào đây. Wrapper db:smoke --stress chỉ chạy trên disposable CinemaBookingDB_R0_*.

Chạy 24 competing booking một ghế, 32 booking tập ghế giao nhau, burst 4 order/khách, 4 pricing rounds ×2, 40 image update/cover request. Film 4 dài 110 phút phù hợp suất 120 phút của stress. Không thay business rule để test qua.

Test để lại customer/showtime/pricing fixture trong disposable DB; reset/drop DB đó sau khi đọc kết quả. db:test thông thường dùng rollback và không bao gồm stress.
