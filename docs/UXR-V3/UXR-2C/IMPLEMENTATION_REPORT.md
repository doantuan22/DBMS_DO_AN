# UXR-2C — Manager Route Ownership

Ngày: 12/10/2026, Asia/Bangkok.

**Source và automated checks: PASS. Exit Gate/browser acceptance: BLOCKED.** Đã triển khai sáu Manager screen routes và giữ bookings. Edge/Chrome thực đều lỗi GPU renderer trước preflight, nên chưa thể nghiệm thu browser, keyboard/focus hoặc responsive. Không đánh dấu browser blocker của UXR-2A/2B là PASS.

## Kết quả triển khai

React Router sở hữu overview, rooms, seats, showtimes, pricing và revenue; từng child route khai báo section, permission guard và renderer cụ thể. `/manager` replace redirect tới overview; legacy `#manager-*` được map sang route tương ứng, giữ query. Sidebar dùng Link/active pathname/aria-current; breadcrumb dùng PageHeader hiện có. Route không tồn tại trả NotFound trong StaffShell. Chi tiết trong [ROUTE_MAPPING.md](ROUTE_MAPPING.md).

ManagerLayout giữ cinema context qua các sibling routes, gồm bookings. Selected cinema ID lưu riêng trong session theo user; sau reload phải qua `getAssignedCinemas` và assignment snapshot mới được dùng. Assignment reload còn hợp lệ giữ selection/draft; mất quyền loại context cũ. Frontend không grant permission mới hoặc thay server scope.

Form draft nằm trong memory theo section, kind, resource và room đối với ghế. Chuyển route khôi phục values/baseline, editing selection và các screen controls hiện có. Khi đổi cinema có dirty draft, shared ConfirmDialog mở: Cancel giữ nguyên context; Confirm xóa draft/selection/filter phụ thuộc, tăng epoch rồi tải dữ liệu mới. Draft ở screen không đang mở vẫn được kiểm tra. Rời vùng Manager trong SPA dùng extension tùy chọn của dirty guard hiện có; reload/close dùng native beforeunload. Mutation pending khóa đổi cinema và điều hướng bằng link/history.

Request owner kiểm tra cinema + epoch + screen lifecycle + request channel generation, bổ sung vào list/seat/movie guards. A→B→A không cho response A của epoch cũ cập nhật epoch A mới. Lookup movie tiếp tục có AbortController; revenue giữ active-effect guard và được remount đúng context. Mutation chỉ clear draft sau response thành công, không tự retry, không refresh owner đã rời. Form có synchronous submit lock.

ManagerPortal vẫn giữ các renderer và handlers nghiệp vụ hiện có; app truyền routeSection để chỉ render screen đang mở và tải resource/lookup cần thiết. Standalone legacy fixtures vẫn dùng workspace cũ. Không làm seat-map, schedule, list/form redesign hoặc UXR-3/4.

`StaffBookings.jsx` không bị sửa trong UXR-2C; key/component/query/filter/cinema selectors, API và handlers hiện có được giữ. ManagerLayout/Outlet không có key theo cinema, dirty state hay assignment response. Hook booking chỉ thêm optional scope/readState/message; hành vi mặc định của bookings giữ nguyên. Config-level test xác minh đổi orderId giữ cùng route element, **không tuyên bố mounted lifecycle trên browser đã PASS**.

## Audit và phạm vi

[AUDIT_REPORT.md](AUDIT_REPORT.md) ghi baseline, state/request ownership, components, API services và source enforcement. Working tree đã có thay đổi chưa commit của UXR-2A/2B và `note.md`; đã lưu baseline các file chồng phạm vi và chỉnh tiếp trên source hiện hành, không reset/ghi đè bằng HEAD. Không sửa Backend, Database, Stored Procedure, REST clients, resource contract, RBAC hoặc CSS/brand tokens. Không thay Admin routing/draft ownership.

API/DBMS vẫn là authority: source service truyền actor vào SP, SP kiểm tra assignment scope; 50050 map thành 403. Live out-of-scope API/DB test **NOT VERIFIED** trong slice này; không lấy frontend guard làm bằng chứng server acceptance.

## Verification matrix

| Kiểm tra | Verdict / mức bằng chứng |
|---|---|
| Actual AppRoutes: sáu screens + bookings + legacy index + wildcard | **PASS — route-tree tests** |
| Mỗi screen deep link và fresh-router reload, Back/Forward | **PASS — MemoryRouter history**; browser **NOT VERIFIED** |
| Breadcrumb/title, permission thiếu hoặc role khác, 404 | **PASS — SSR tests**; browser **NOT VERIFIED** |
| Sidebar đủ bảy routes, đúng một active aria-current | **PASS — SSR tests** |
| API calls đúng screen/cinema, dependency permission, 403/404 không empty | **PASS — unit/service-boundary tests với injected API** |
| A→B→A, dirty Cancel/Confirm reset, hidden draft, invalid cinema | **PASS — store tests**; UI dialog interactions **NOT VERIFIED** |
| Assignment retain/revoke, reload preference kiểm tra quyền | **PASS — store tests**; real sessionStorage/API **NOT VERIFIED** |
| Late list/seat/movie response, route dispose, repeated generation, StrictMode owner reactivation | **PASS — request-owner tests**; network/browser **NOT VERIFIED** |
| Mutation pending lock và draft hydration | **PASS — store + SSR form tests**; real submissions **NOT VERIFIED** |
| Manager internal navigation/leave-scope Cancel/Confirm; booking default guard | **PASS — guard decision tests**; native events/history rollback **NOT VERIFIED** |
| Booking query giữ route identity, không cinema key ở layout | **PASS — actual route-tree/history tests**; component mount/reset runtime **NOT VERIFIED** |
| Standalone legacy Manager fixture | **PASS — SSR render without supplied Router** |
| Frontend suite gồm UXR-1A/B/C/D, UXR-2A/2B regressions | **PASS — 102/102**, 14 test mới UXR-2C; [log](frontend-tests.log) |
| Lint | **PASS — exit 0**; [log](frontend-lint.log) |
| Production build | **PASS — exit 0**, isolated `.audit-output/uxr2c-build-review-20261012`; [log](frontend-build.log) |
| Browser renderer preflight: Edge + Chrome | **BLOCKED — GPU child 0xC0000022/fatal**; [evidence](BROWSER_EVIDENCE.md) |
| Browser acceptance của tất cả routes, live reload/history/API/scope/drafts/bookings | **BLOCKED / NOT VERIFIED** |
| StaffShell mobile drawer, keyboard/focus, responsive 390/768/1280/1440/1920px | **BLOCKED / NOT VERIFIED**, không có screenshot |

Không có FAIL trong automated checks đã chạy. Các mục chưa chạy không được suy diễn thành PASS. Build còn warning bundle JS 601.78 kB > 500 kB; command thành công. PowerShell ghi warning stderr thành NativeCommandError trong log build nhưng process exit code là 0, Vite hoàn thành build; không phải compilation failure.

## File thay đổi riêng của UXR-2C

| Loại | File | Nội dung |
|---|---|---|
| Sửa | `frontend/src/routes/index.jsx` | Manager child routes + persistent layout |
| Sửa | `frontend/src/layouts/StaffShell.jsx` | Manager route links/active mapping |
| Sửa | `frontend/src/pages/ManagerPortal.jsx` | Route-scoped renderer/requests, draft/context integration |
| Sửa | `frontend/src/components/ManagerResourceForm.jsx` | Optional draft contract, submit lock |
| Sửa | `frontend/src/components/ManagerRevenue.jsx` | Optional filter-state restoration |
| Sửa | `frontend/src/features/staff-bookings/useBookingDraftGuard.js` | Optional scope/readState/message, giữ booking defaults |
| Thêm | `frontend/src/routes/managerSectionRoutes.js` | Canonical routes/labels/permissions/legacy mapping |
| Thêm | `frontend/src/routes/ManagerSectionRoute.jsx` | Section guards, entry redirect |
| Thêm | `frontend/src/layouts/ManagerLayout.jsx` | Provider, assigned cinemas, persistence, ConfirmDialog |
| Thêm | `frontend/src/features/manager/ManagerCinemaContext.js` | Shared context hook |
| Thêm | `frontend/src/features/manager/managerCinemaStore.js` | Cinema/drafts/screens/pending/context epoch |
| Thêm | `frontend/src/features/manager/managerScreenRequests.js` | Per-screen API ownership và async request guards |
| Thêm | `frontend/tests/managerRoutes.test.js` | 14 automated route/context/guard regressions |
| Thêm | `docs/UXR-V3/UXR-2C/` | Audit, mapping, report, manual checklist, renderer runners/logs/JSON, screenshot status |

`StaffBookings.jsx`, Admin files, shared UI foundation và stylesheet xuất hiện trong git status vì đã có sửa trước task; không gộp những sửa đó vào danh sách UXR-2C.

## Giới hạn và điểm dừng

Draft chỉ tồn tại trong memory của Manager layout; không lưu nội dung form vào sessionStorage hoặc URL. Khi người dùng xác nhận reload/rời vùng Manager, draft bị bỏ. Chỉ cinema ID được lưu qua reload và luôn được xác minh lại. Booking giữ controls/scope nhiều rạp hiện có, không ép theo cinema của sáu screens.

Browser smoke là Exit Gate của §11.3. Cần host có renderer để chạy [MANUAL_ACCEPTANCE_CHECKLIST.md](MANUAL_ACCEPTANCE_CHECKLIST.md), bổ sung screenshot/console/network và kiểm tra mounted booking/drawer/history thực tế. Blockers lịch sử nằm riêng trong UXR-2A/2B, không sửa verdict của chúng.

**Dừng tại UXR-2C, chờ nghiệm thu. Không merge/commit tự động; không chuyển UXR-3 hoặc phase khác.**
