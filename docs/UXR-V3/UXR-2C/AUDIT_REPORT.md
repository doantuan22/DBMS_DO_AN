# UXR-2C — Audit trước triển khai

Ngày: 12/10/2026, Asia/Bangkok. Phạm vi: Blueprint V3 §3.3, §10, §11.3; chỉ Manager route ownership.

## Baseline và working tree

Working tree đã có source và tài liệu chưa commit của UXR-2A/2B, cùng `note.md`. Đã đọc source hiện hành; không reset/checkout/revert hoặc dùng bản HEAD ghi đè chúng. Bản sao trước sửa của bốn file chồng phạm vi nằm tại `.audit-output/uxr2c-baseline/`, cùng `git-status.txt` trước task. Các thay đổi của slice này được liệt kê riêng trong IMPLEMENTATION_REPORT, không coi toàn bộ `git diff` là UXR-2C.

## Kết quả audit

| Thành phần | Trước UXR-2C | Quyết định |
|---|---|---|
| `routes/index.jsx` | `/manager` render ManagerPortal; chỉ bookings có route con | Child routes tường minh; entry replace redirect; wildcard Manager 404 |
| `StaffShell` | Manager dùng `/manager#manager-*`; active theo hash | React Router Link + route map; giữ groups/permission/mobile drawer logic hiện có |
| `ManagerPortal` | Cùng URL render dashboard, rooms, seats, showtimes, pricing và revenue; tải bốn resource được cấp quyền | Giữ renderer/handlers; route khai báo screen; chỉ tải resource của screen và lookup cần thiết |
| Cinema selection | Local state; list từ `getAssignedCinemas`, giao với assignment snapshot; keyed workspace theo cinema/user/permissions | Provider sống trên layout chung; giữ cinema qua cả bookings; ID session được kiểm tra lại bằng assignment response |
| Dirty forms | Chỉ báo boolean theo cinema/kind; `window.confirm` khi đổi rạp; draft nằm trong form | Draft thật theo section/kind/resource/room; shared ConfirmDialog trước reset context |
| Requests | List/seat/movie generation, mounted guard; movie AbortController | Giữ guard hiện có và bổ sung owner theo context epoch + screen lifecycle; phân biệt A cũ với A sau B |
| `ManagerResourceForm` | Named ResourceSelect của UXR-1D/2A, DTO payload giữ nguyên | Thêm optional draft hydration/change callback, khóa submit bằng ref; không thay field/payload |
| `ManagerRevenue` | Active-effect guard; filter local | Giữ guard và query contract; lưu filter trong screen cache cùng context |
| `StaffBookings` | Workspace riêng, server scope, query `orderId`, own filters/cinema selectors, abort và dirty guard | Giữ file/component/key/handlers; provider không key Outlet theo cinema; chỉ mở rộng hook guard bằng optional scope, default bookings giữ nguyên |
| UXR-2B | Route map + section guard + shared shell/header | Tái sử dụng pattern; không sửa Admin renderer, route map, draft store |
| Shared UXR-2A | PageHeader/Breadcrumbs, ResourceSelect, ConfirmDialog đã có | Dùng các component hiện có; không thêm UI primitive/CSS/token mới |

## API/DBMS scope — read-only audit

`frontend/src/api/managerApi.js` đã có assigned cinemas, room/seat/showtime/pricing/dashboard/revenue methods; không cần endpoint mới. `loadAuthorizedSections` bỏ API khi thiếu permission và giữ lỗi từng section.

`backend/src/services/managerService.js` truyền actor `NguoiDungID` vào procedure, ánh xạ SQL error 50050 thành HTTP 403 `MANAGER_CINEMA_FORBIDDEN`. `sp_Manager_ListAssignedCinemas` lọc assignment hiệu lực và ngày bắt đầu/kết thúc; `sp_Manager_Room_List` kiểm tra role/permission rồi `fn_KiemTraQuanLyRapScope`. Đây là bằng chứng source, **không phải live API/DB acceptance**. Backend, DB, SP, REST clients và RBAC không bị sửa; DB không được khởi chạy/ghi trong slice này.

## Migration boundaries

Giữ form-first/list presentation, seat list, API payload, date/time conversion, price day-type whitelist và mutation handlers hiện có. Không triển khai seat-map, schedule redesign, CRUD contract mới hoặc UXR-3/4. Standalone `ManagerPortal` không truyền routeSection vẫn render legacy workspace để giữ fixtures lịch sử; app route luôn truyền section từ React Router.
