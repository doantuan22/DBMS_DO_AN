# UXR-V3 — UXR-1C: StaffShell mobile keyboard focus

**Kết quả: PASS trong phạm vi slice UXR-1C.** Drawer trên mobile đã có focus ban đầu, focus trap, điều khiển bằng Escape và restore focus; trạng thái modal áp dụng cho Admin, Manager và CSKH. Sidebar ở desktop vẫn điều hướng bình thường. Không sửa routes, Backend, Database, API, RBAC hay nghiệp vụ. Không bắt đầu UXR-1D/UXR-2.

## Thay đổi

| File | Thay đổi |
|---|---|
| `frontend/src/layouts/StaffShell.jsx` | Theo dõi breakpoint hiện hành; mở drawer với focus vào mục nav sau chuyển động mở; trap Tab/Shift+Tab trong drawer; thêm nút đóng bên trong; Escape/đóng khôi phục focus; route selection đóng drawer; breakpoint mobile → desktop đóng drawer và chuyển focus về nội dung. Drawer mobile có dialog semantics, sidebar đóng và nền nhận trạng thái `inert`; toggle đang mở được loại khỏi tab order/accessibility tree. Nếu không có mục nav được cấp quyền, focus vào nút đóng và hiển thị trạng thái rỗng. Desktop không dùng dialog hoặc focus trap. |
| `frontend/src/styles/shell.css` | Thêm kiểu cho heading/nút đóng drawer và trạng thái không có nav; giữ breakpoint, kích thước sidebar, animation và scroll hiện hành. Toggle header ẩn khi drawer modal mở để tránh nút đóng trùng. |
| `frontend/tests/uxr1c-browser-fixture.jsx` | Fixture render trực tiếp component `StaffShell` với từng nhóm nav hiện có và trường hợp không có quyền; chỉ dùng dữ liệu UI test, không gọi API. |
| `browser-evidence.json`, `screenshots/before/`, `screenshots/after/` | Lưu trạng thái kiểm thử Edge, accessibility tree và ảnh trước/sau. |

Không thêm thư viện hoặc thay đổi route/RBAC. Nhóm nav trong fixture lấy permission codes và chính component hiện có; fixture không kiểm thử cấp quyền ở server.

## Kiểm thử Edge

Microsoft Edge headless được điều khiển qua Chrome DevTools Protocol để gửi sự kiện bàn phím/thao tác chuột, đọc focus thực tế, accessibility tree, DOM và chụp ảnh. Baseline render từ `StaffShell.jsx` ở Git commit `5d2dcac1752947a5aed2095b15dbeaae97d35f64`; bản sau render từ source đã sửa. Cùng fixture và CSS shell được dùng ở hai lượt; các selector mới chỉ ảnh hưởng markup mới.

| Vai trò | 390 px | 768 px | 1280 px | 1440 px | 1920 px |
|---|---|---|---|---|---|
| Admin | PASS | PASS | PASS | PASS | PASS |
| Manager | PASS | PASS | PASS | PASS | PASS |
| CSKH | PASS | PASS | PASS | PASS | PASS |

**15/15** tổ hợp viewport/vai trò không tràn ngang. Ở 390/768 px, nav đóng có `inert`; ở desktop sidebar không `inert`, không là dialog. Ảnh đóng menu được lưu cho cả 15 tổ hợp ở thư mục `before` và `after`; ảnh drawer mở 390 px có đủ ba vai trò.

**10 kịch bản bàn phím PASS:** ở 390 và 768 px cho mỗi vai trò, Edge thực hiện Open → Tab → Shift+Tab → kiểm tra vòng focus ở biên → Escape → focus trở lại nút mở → mở lại bằng Enter → đi tới mục khác → drawer tự đóng. Tab tiến sang control kế tiếp, Shift+Tab quay về control trước; các vị trí focus ở biên quay vòng trong dialog. Drawer vẫn đóng đúng khi chuyển route hoặc mục nav.

Các kiểm tra thêm PASS:

- Manager với danh sách permission rỗng vẫn mở được drawer; trạng thái rỗng nhận diện được, Tab giữ focus ở nút đóng và Escape phục hồi focus về toggle.
- Khi drawer đang mở, resize 390 → 1280 px đóng drawer và đưa focus vào main; desktop giữ Tab mặc định, không chặn phím. Quay lại 390 px không tự mở drawer.
- Accessibility tree của Edge xác nhận 6/6 trạng thái drawer (3 vai trò × 390/768 px) có role `dialog`, accessible name đúng theo portal và `modal=true`.
- Không có JavaScript runtime exception hoặc console error trong fixture.

| Vai trò | Ảnh drawer mở trước | Ảnh drawer mở sau |
|---|---|---|
| Admin | [390 px](screenshots/before/admin-drawer-390.png) | [390 px](screenshots/after/admin-drawer-390.png) |
| Manager | [390 px](screenshots/before/manager-drawer-390.png) | [390 px](screenshots/after/manager-drawer-390.png) |
| CSKH | [390 px](screenshots/before/support-drawer-390.png) | [390 px](screenshots/after/support-drawer-390.png) |

| Viewport | Shell đóng trước: Admin · Manager · CSKH | Shell đóng sau: Admin · Manager · CSKH |
|---:|---|---|
| 390 px | [Admin](screenshots/before/admin-390.png) · [Manager](screenshots/before/manager-390.png) · [CSKH](screenshots/before/support-390.png) | [Admin](screenshots/after/admin-390.png) · [Manager](screenshots/after/manager-390.png) · [CSKH](screenshots/after/support-390.png) |
| 768 px | [Admin](screenshots/before/admin-768.png) · [Manager](screenshots/before/manager-768.png) · [CSKH](screenshots/before/support-768.png) | [Admin](screenshots/after/admin-768.png) · [Manager](screenshots/after/manager-768.png) · [CSKH](screenshots/after/support-768.png) |
| 1280 px | [Admin](screenshots/before/admin-1280.png) · [Manager](screenshots/before/manager-1280.png) · [CSKH](screenshots/before/support-1280.png) | [Admin](screenshots/after/admin-1280.png) · [Manager](screenshots/after/manager-1280.png) · [CSKH](screenshots/after/support-1280.png) |
| 1440 px | [Admin](screenshots/before/admin-1440.png) · [Manager](screenshots/before/manager-1440.png) · [CSKH](screenshots/before/support-1440.png) | [Admin](screenshots/after/admin-1440.png) · [Manager](screenshots/after/manager-1440.png) · [CSKH](screenshots/after/support-1440.png) |
| 1920 px | [Admin](screenshots/before/admin-1920.png) · [Manager](screenshots/before/manager-1920.png) · [CSKH](screenshots/before/support-1920.png) | [Admin](screenshots/after/admin-1920.png) · [Manager](screenshots/after/manager-1920.png) · [CSKH](screenshots/after/support-1920.png) |

Số liệu chi tiết từ browser: [browser-evidence.json](browser-evidence.json).

## Kiểm thử dự án

| Lệnh | Kết quả |
|---|---|
| `npm.cmd --prefix frontend test` | **PASS — 75/75** |
| `npm.cmd --prefix frontend run lint` | **PASS**, không có lint warning. |
| `npm.cmd --prefix frontend run build` | **PASS**; bundle JS 583.61 kB vượt ngưỡng cảnh báo 500 kB của Vite. |
| Edge: keyboard, roles, viewport, focus, accessibility tree, screenshot | **PASS — 15 tổ hợp viewport/vai trò, 10 kịch bản bàn phím, 6 accessibility tree checks.** |
| axe | **NOT RUN — BLOCKED bởi môi trường:** `axe-core` và `@axe-core/playwright` không có sẵn; không cài dependency. |

## Giới hạn và regression risk

- Fixture kiểm tra component và nav filtering trên browser thật, nhưng không đăng nhập vào từng tài khoản, không gọi API/Backend và không tái chạy nghiệp vụ hay RBAC server. Các route và quyền server không thay đổi.
- Chưa kiểm thử bằng screen reader hoặc axe. Accessibility tree của Edge chỉ xác minh role/name/modal semantics; đây không thay thế đánh giá WCAG đầy đủ.
- Drawer đặt focus sau khi hoàn tất CSS transition mở để control không nhận focus khi còn đang trượt ngoài viewport. Nếu token thời lượng transition thay đổi, thời gian chờ lấy từ computed style hiện hành.
- Build giữ cảnh báo bundle size trên 500 kB; đây không nằm trong phạm vi UXR-1C.

## Exit gate

- Mở drawer chuyển focus vào nav phù hợp; khi không có nav, focus vào nút đóng: **PASS**.
- Tab/Shift+Tab giữ focus trong mobile modal, kể cả tại hai biên: **PASS**.
- Escape/đóng khôi phục focus; chọn nav đóng drawer và giữ focus ở control hiển thị: **PASS**.
- `aria-expanded`, `aria-controls`, dialog/navigation semantics và trạng thái nền: **PASS**.
- Sidebar desktop không khóa focus; breakpoint change đóng drawer và phục hồi điều hướng: **PASS**.
- Ba portal, năm viewport, tests/lint/build: **PASS**.
- **UXR-1C tổng thể: PASS** trong phạm vi đã kiểm tra. Axe và screen reader chưa kiểm thử. Dừng để nghiệm thu; chưa bắt đầu UXR-1D/UXR-2.
