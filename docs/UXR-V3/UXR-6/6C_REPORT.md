# UXR-6C — nghiệm thu

Trạng thái: **PASS** trong phạm vi Chrome/API/SP đã chạy. Composition `BookingExperience` tách presentation khỏi hook nghiệp vụ cũ; các bước anchor ghế/sản phẩm/kiểm tra, summary sticky desktop và sequential mobile, nút/ghế tối thiểu 44px, scroll trong sơ đồ. Mỗi giá ghế/đơn giá lấy từ API, preview tổng trước ưu đãi lấy từ API promotion; không cộng giá thành tổng phía frontend. Receipt tổng và hạn giữ ghế dùng response tạo đơn thực. Guest đăng nhập giữ đường quay lại suất chiếu. Pending khóa input/seat và rời màn hình; có cảnh báo lựa chọn chưa tạo đơn.

`6C-before.json`: 5 captures snapshot. `6C-browser.json`: 10 checks PASS, 26 API records. Thực sự tạo đơn competing Customer, nhận 409 ở UI, làm mới ghế/clear selection; thực sự tạo một đơn Customer có vé và sản phẩm qua UI double-click; kiểm tra tổng/hạn với detail API, giới hạn 10 ghế và promotion không hợp lệ giữ lựa chọn. Hai đơn fixture đã hủy bằng business API rồi cleanup ID+owner; không thay đổi seed/production. 27 tests liên quan PASS; lint không cảnh báo.

Giữ nguyên actor/showtime remount, request generations, preview invalidation, PROMOTION_NOT_AVAILABLE/SHOWTIME_UNAVAILABLE handling và create payload. Chưa tuyên bố kiểm chứng mọi cuộc đua thời gian; expiry/payment được kiểm tra thêm trong 6D. Chưa kiểm chứng thiết bị cảm ứng vật lý.
