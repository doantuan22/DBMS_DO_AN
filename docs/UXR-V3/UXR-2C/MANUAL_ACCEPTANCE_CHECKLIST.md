# UXR-2C — Browser acceptance còn lại

Tất cả checklist dưới đây hiện **NOT VERIFIED / BLOCKED**. Chỉ ghi PASS khi có session, screenshot/console/network evidence thật. Dùng môi trường test có Manager được assignment đồng thời rạp A/B, actor thiếu từng permission, actor khác role và cinema ngoài scope C. Mutation chỉ chạy trên test data đã xác nhận.

1. Chạy renderer preflight: HTML đơn giản, JavaScript, nhập input, click button, screenshot. Nếu fail, dừng browser acceptance và lưu startup logs.
2. Mở trực tiếp từng route overview/rooms/seats/showtimes/pricing/revenue/bookings, reload, kiểm tra đúng screen, breadcrumb và duy nhất một active nav. `/manager` và từng `#manager-*` phải replace tới mapping đúng; path lạ phải 404 trong shell.
3. Điều hướng tất cả routes bằng sidebar, keyboard, browser Back/Forward. Cinema B đã chọn phải được giữ, cả sau ghé bookings. Reload giữ B nếu assignment API còn hợp lệ; ID session không hợp lệ phải bị loại.
4. Rạp A: sửa create/edit form rooms, seat theo room, showtimes, pricing. Chuyển screen rồi trở lại: đúng draft và selected resource. Đổi rạp → Cancel: selector, form, room/seat selection giữ nguyên. Confirm: clear dependent selection/drafts; A→B→A không khôi phục draft bị discard.
5. Draft ở screen đã rời vẫn phải làm đổi cinema hỏi xác nhận. Chuyển room không dùng draft seat của room khác. Rời Manager qua brand/public link hoặc browser Back: Cancel ở guard giữ công việc; Confirm rời; reload/close cảnh báo native khi dirty.
6. Throttle/defer list, seat, movie lookup, revenue request ở A; chuyển B, trả response A; thử A→B→A. Không payload A cũ được áp dụng vào B hoặc phiên A mới. Đổi screen giữa request; response không cập nhật owner mới. Mutation pending khóa cinema và user navigation; lỗi không mất draft, không tự retry writes.
7. Assignment refresh còn B giữ B/draft; revoke B loại B, reset scope đúng. Thiếu permission hiển thị forbidden; API 403/404 giữ lỗi, không biến thành empty. Thử endpoint/ID ngoài assignment C và xác nhận server từ chối; frontend UI không phải bằng chứng RBAC server.
8. Bookings: chọn filter/orderId, create/edit draft, thay query/filter theo guard cũ; cập nhật context/provider không remount/reset workspace. Rời booking có dirty vẫn hỏi theo guard booking. Đọc toàn bộ A/B được phép, không thay payload/price/hold/seat guards.
9. Tại **390/768/1280/1440/1920px**, mở từng route và chụp ảnh. 390/768: mở drawer bằng keyboard, focus item đầu, Tab/Shift+Tab containment, Escape, focus restore, background inert; chọn nav link đóng drawer. Resize qua 960px không mất focus. Kiểm tra overflow, form/select/dialog controls, focus visibility và khả năng thao tác ở từng viewport.
10. Browser smoke UXR-1A/B/C/D, Admin UXR-2B, shared UXR-2A và StaffBookings; ghi runtime exceptions, request status, screenshots và mọi FAIL riêng. Không đổi các blocker lịch sử thành PASS nếu chưa retest chúng.

| Route | 390 | 768 | 1280 | 1440 | 1920 |
|---|---|---|---|---|---|
| overview | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| rooms | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| seats | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| showtimes | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| pricing | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| revenue | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| bookings | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
