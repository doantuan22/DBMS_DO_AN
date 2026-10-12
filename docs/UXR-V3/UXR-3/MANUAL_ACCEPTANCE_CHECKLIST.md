# UXR-3 — Pending browser acceptance

Tất cả mục dưới đây hiện **NOT VERIFIED**, browser setup **BLOCKED**. Chỉ chạy khi renderer hoạt động, giữ test DB cô lập và xác minh identity trước mutation. Không thay RBAC hoặc thêm assignment chỉ để tạo PASS.

## Chung, cả sáu route và năm viewport

- Mở direct URL, reload và back/forward; xác minh đúng owner/context/active sidebar/breadcrumb. Legacy redirects giữ nguyên.
- Tại 390/768/1280/1440/1920px: navigation/mobile drawer, filter wrap, table overflow, map scroll/zoom, inspector, gallery và drawer không tràn viewport.
- Tab/Shift+Tab/Enter/Space/Escape; modal focus trap/restore, field error labels, danger confirmation Cancel/Confirm; không double-submit khi pending.
- Axe nếu chạy được, computed contrast/touch target và console errors; ghi network status/request scope không lộ credentials.
- Screenshot cùng viewport/dataset: map Admin và Manager, rooms Manager, cinema list/detail, image gallery/preview và 3A regression. Không dựng before screenshot sau khi source đã đổi; before chỉ từ baseline có thể khởi chạy riêng an toàn.

## Admin và Manager seats

- Chọn rạp A → phòng A1; đối chiếu từng label/hàng/số/ID nội bộ với API, không đưa technical ID vào UI.
- A1→A2→A1 và cinema A→B→A có response trễ: không giữ selection/data trước, dirty Cancel giữ draft, Confirm reset context phụ thuộc.
- Grid 130+ ghế: filter hàng/loại/tên/trạng thái không làm đổi vị trí; arrows/Home/End, Enter/Space select; danh sách fallback/page có đúng total.
- Add/edit/delete ghế không có history qua UI; exact payload. Ghế history update type/delete bị 409 và giữ data/draft. Không thử historical delete trên production.
- Chọn actual showtime đúng room, observed occupancy read-only, không có mutation bán vé; error khi suất không bookable, không giả trạng thái sold trong configuration.
- Manager forged foreign room/cinema URL và API đều denied. Khi có multi-assignment fixture hợp lệ, thử đổi rạp qua selector, hidden drafts, mutation lock; reload kiểm chứng assignment lại.

## Manager rooms và regression screens

- Actual seatCount từ complete SP, search/type/status rồi pagination; drawer tạo/sửa không chuyển cinema.
- Xem sơ đồ ghế liên kết đúng paired context; historical room delete nhận deactivate, không xóa history/seats.
- Rời room/seat giữ hidden draft cùng cinema; đổi cinema Cancel/Confirm. Booking draft/context không reset, không remount ngoài chủ đích; overview/showtime/pricing/CSKH guards hoạt động.

## Cinema và gallery

- Cinema search/city/status, optional full room counts; thiếu quyền/count API lỗi phải unknown, không 0 giả.
- Cinema detail → Rooms → Seats đúng cinema/room; Images đúng cinema. Showtimes link hiện có là danh sách chung, không nghiệm thu scoped filter chưa được triển khai.
- Cinema create/edit valid, delete dependency 409 giữ record; không cascade.
- Gallery A→B→A late responses, preview của cinema cũ đóng; create/edit URL/caption/order/status, cover chỉ một ảnh active, delete Confirm/Cancel.
- Mutation hoàn thành sau route unmount không refresh owner mới; pending giữ cinema. Asset/network unavailable độc lập API error; chỉnh URL thử lại nguồn. Chụp gallery empty/loading/error/unavailable khi có thể.

Ghi từng case PASS/FAIL và path screenshot/log mới; chỉ xét Exit Gate PASS khi có browser evidence bắt buộc cho cả Admin/Manager seat-map và regression phù hợp. Dừng ở UXR-3, không chuyển UXR-4.
