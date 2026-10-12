# UXR-3A — Remaining browser / test DB acceptance

Toàn bộ checklist dưới: **NOT VERIFIED**, renderer hiện **BLOCKED**. Chỉ chuyển từng mục PASS sau khi thao tác application thật, lưu screenshot/network log và kiểm tra hậu quả trên test DB; không dùng controller fixtures thay E2E. Không tạo fixture trên production.

## Fixture và scope

Cần test DB có cinema A/B (tên thật), rạp trống C; nhiều hơn 10 rooms trong một rạp, tên/số/type/status khác nhau, room 0 ghế và room có ghế; một room chưa có showtime, một room có history SUATCHIEU. Actors: Admin QL_PHONG+QL_RAP+QL_GHE, Admin thiếu từng dependency, foreign Manager/Customer. Dùng fixtures có sẵn được phép; ID test nội bộ không đưa vào screenshot captions công khai.

## Các bước nghiệm thu

| Case | Thao tác và expected | Status |
|---|---|---|
| Route/reload/history | Deep link Rooms có cinema/filter/page; reload/back/forward chọn đúng scope/page, sidebar active đúng, unknown route 404, missing QL_PHONG/foreign role 403 | NOT VERIFIED |
| Named selector | Chọn A/B bằng tên; không cần nhập ID; QL_PHONG-only không gọi cinemas API và hiển thị limitation rạp trống | NOT VERIFIED |
| Scope/count | A chỉ rooms A; B chỉ B; count từng room khớp COUNT(GHE) test DB, zero đúng, không dùng số rows một trang ghế | NOT VERIFIED |
| Search/filter/page | Tìm tên không dấu/số trong TenPhong; type/status từ contract; kết quả toàn scope được lọc trước phân trang, STT tiếp nối đúng, reset giữ cinema | NOT VERIFIED |
| Fast switches | Throttle network A→B→A và trả responses đảo thứ tự: không thấy rooms A trong B hoặc dữ liệu A cũ đè A mới | NOT VERIFIED |
| Create | Thêm phòng mở drawer; tên rạp read-only, type whitelist, required/max100 errors; payload cinemaId thật; double click chỉ một POST; row mới/count authoritative | NOT VERIFIED |
| Edit/dirty | Sửa name/type/status; không đổi cinema; Escape/Hủy/backdrop → Cancel giữ values, Confirm bỏ đúng draft; same-cinema query history giữ draft; route departure hỏi; pending khóa thao tác | NOT VERIFIED |
| Errors | Force test DB/API 403/404/409/name conflict/network: state riêng, reason đúng, draft còn, không success/empty giả, không retry write | NOT VERIFIED |
| Delete cancel/normal | Menu Khác → Xóa: confirm nêu tên/rạp/status và cả outcomes; Cancel không DELETE; confirm room chưa history xóa ghế+room đúng SP trên test DB | NOT VERIFIED |
| Historical delete | Room có SUATCHIEU: authoritative Deactivated/Message, refresh thấy Ngưng hoạt động; history/ghế không tự xóa; 409 rollback giữ data | NOT VERIFIED |
| Seat handoff | A1 → seats query đúng cinema A/room A1; validation + GET seats(roomId) đúng; label tên rạp/phòng, create room bound; pair A/room B→404; missing permissions→403; unscoped route seats vẫn hoạt động | NOT VERIFIED |
| Permission revocation | Thu hồi quyền theo flow hiện có: server từ chối read/write, UI không tự cấp quyền hoặc scope | NOT VERIFIED |

## Responsive / accessibility / screenshots

Tại **390/768/1280/1440/1920px**, kiểm tra cùng fixture và cùng URL: list/filter/actions không overflow; bảng desktop đọc được, stacked mobile đủ tên/count/status/seat/edit/menu-delete; drawer không che footer hoặc mất scroll; CTA/control touch targets, contrast và zoom 200%. StaffShell drawer mở bằng keyboard, Escape đóng, nav chọn đúng route, focus trap/restore. Room drawer focus tên; confirm focus Cancel, Tab/Shift+Tab trong modal, Escape với dirty confirm, focus trả opener; field errors có label/aria-describedby. Chạy axe nếu môi trường hỗ trợ, ghi kết quả thực.

Before screenshot cần baseline pre-3A có cùng fixture/viewport; after chụp list A/B, filtered/page2, create/edit drawer, delete/dirty confirm, seat destination. Baseline source được lưu tại `.audit-output/uxr3a-baseline/`; không checkout đè working tree. Nếu dựng preview baseline, dùng workspace tách biệt và bảo toàn source hiện tại. Ghi chú baseline renderer chưa chụp được; không đặt screenshot after vào ô before.

Khi xong chỉ nghiệm thu UXR-3A; các gates toàn phase UXR-3 gồm seat-map Admin/Manager vẫn thuộc slices sau, không làm tiếp trong phiên này.
