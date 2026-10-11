# UXR-V3 / UXR-0 — Screen Implementation Plan

**Phạm vi tài liệu:** kế hoạch screen/component cho UXR-1…7; UXR-0 không triển khai các thay đổi này.  
**Nguồn bắt buộc:** [Master Blueprint V3](../../MASTER_FRONTEND_UIUX_RESTRUCTURING_BLUEPRINT_V3.md), Use Case Matrix hiện hành và [Capability Matrix](API_UI_CAPABILITY_MATRIX.md).

## 1. Quy ước kế hoạch

- **Giữ nghiệp vụ:** mọi screen giữ route contract, permission, API payload, DB/SP guard, Manager scope, booking/payment/history và async guards hiện tại.
- **List-first:** filter ở trên danh sách; chỉ mở detail/form khi có tác vụ. Cột dùng tên/nhãn nghiệp vụ và STT; không hiển thị PK kỹ thuật như dữ liệu chính. Nếu cần định danh thao tác, dùng API ID ẩn phía sau; không tạo “mã đơn” mới.
- **Filter trung thực:** chỉ hiện filter nếu API có query hoặc dữ liệu đã tải đầy đủ và bounded. Các gap xem Matrix; filter cần API mới dừng ở approval.
- **Lookup theo tên:** người dùng tìm/chọn Customer, rạp, phòng, phim và resource bằng tên, email/SĐT/ngữ cảnh thật; payload tiếp tục dùng ID server cung cấp. Không nhập ID tay.
- **Responsive:** mọi slice chụp và kiểm tra 390/768/1280/1440/1920 px theo cùng fixture; không yêu cầu mọi bảng giữ desktop columns ở mobile. Mobile ưu tiên card/list, filter drawer/stack, giữ action access.
- **Component screen contract:** mỗi component dùng chung có props, variants, loading/error/empty/disabled states, breakpoint behavior, keyboard/focus/ARIA và interaction contract được ghi trước khi dùng nhiều nơi.

## 2. Admin — Enterprise Control Center (6 nhóm sidebar)

Sidebar giữ đúng sáu nhóm V3, không có role/permission CRUD:

1. **Tổng quan** — Tổng quan.
2. **Tài khoản & phân công** — Tài khoản; Phân công quản lý.
3. **Rạp & cơ sở vật chất** — Rạp; Ảnh rạp (tab/deep-link theo rạp); Phòng; Sơ đồ ghế.
4. **Nội dung** — Phim; Thể loại; Diễn viên.
5. **Kinh doanh & vận hành** — Suất chiếu; Quản lý đặt vé; Bảng giá; Khuyến mãi; Sản phẩm.
6. **Chăm sóc & báo cáo** — Khiếu nại; Doanh thu.

| Màn hình | Hiện tại → route target | Thay đổi dự kiến / component | UC / slice | Rủi ro / điều kiện |
|---|---|---|---|---|
| Dashboard | `/admin` local section → `/admin/overview` | KPI/report cards theo dữ liệu dashboard thực; date scope chỉ khi API hỗ trợ; PageHeader, MetricCard, AsyncState | ADM-16, UXR-5D | Không thêm KPI hoặc diễn giải sai metric; direct old entry hoạt động khi migrate. |
| Accounts | `/admin` → `/admin/access/users` | Filter status/role-at-create/search theo API; list-first, STT, tên/email/status; create role selector lúc tạo; status confirm | ADM-02, UXR-5A | Role immutable; không role edit, role CRUD, permission assignment. PII chỉ theo role/API cần thiết. |
| Manager assignments | `/admin` → `/admin/access/assignments` | Manager selector tên/email; cinema selector; show current assignment, effective dates/status; confirm transfer | ADM-06, UXR-5A | Giữ dates/scope và semantics assignment. Multi-assignment/transfer test cần fixture hợp lệ; không tự đổi rule. |
| Cinemas + images | `/admin` sections → `/admin/cinemas`, `/admin/cinemas/images` | Cinema list/detail; image gallery gắn cinema; cover/status/actions; reuse `CinemaImageManager` | ADM-07, UXR-3D | Giữ image ownership/request generation guard; không upload test ngoài fixture hoặc làm mất ảnh hiện có. |
| Rooms | `/admin` → `/admin/facilities/rooms` | Cinema selector → room list; curated columns; create/edit modal/form; room type/status labels | ADM-08, UXR-3A | Parent cinema consistency; không thêm search/paging nếu response không bounded. |
| Seats | `/admin` → `/admin/facilities/seats` | Hierarchy Rạp → Phòng → Ghế; grid từ row/number; side inspector/list fallback; tách CRUD physical seat khỏi per-showtime availability mode | ADM-08, UXR-3B | Không bịa aisle/coordinates/status. Guard lịch sử vé/suất, stale response, room scope và selected context. |
| Movies | `/admin` → `/admin/catalog/movies` | Search/status/genre API filters; title/poster/status; create/edit with genre/actor named selectors; cast editor | ADM-09, UXR-5B | Keep movie–actor relation; delete confirmation; no hidden API changes. |
| Genres / actors | `/admin` → `/admin/catalog/genres`, `/admin/catalog/actors` | Separate route/list/form, relations by labels; async/validation states | ADM-09/10, UXR-5B | No invented server search; do not break movie cast relation. |
| Showtime | `/admin` → `/admin/operations/showtimes` | Cinema/date filters supported; named cinema/room/movie selectors only with real data; default list; optional calendar only if same data/actions | ADM-14, UXR-4A | Overlap, timezone, cancel cascade/held order constraints; movie/room filters need Matrix resolution. |
| Staff bookings | `/admin/bookings` already separate; keep | Search/status/cinema/server paging; curated customer/movie/showtime/room/seat/status/snapshot; details; guided create/edit seats/cancel | ADM-18, UXR-4C/4D | Existing Customer + eligible status; 200 showtime option cap; no physical delete/payment mark; preserve lock, snapshot/history. |
| Pricing | `/admin` → `/admin/operations/pricing` | Cinema context/list; label type/day; create/edit dialog; show history/snapshot only if returned | ADM-13, UXR-4B | Type/day filters are API gap; no retroactive snapshot change. |
| Promotions / products | `/admin` → `/admin/commerce/promotions`, `/admin/commerce/products` | Separate list/edit forms, status/validity/price labels, consequence confirmation | ADM-11/12, UXR-5C | Add no customer checkout behaviors; filters must match SP. |
| Complaints | `/admin` → `/admin/service/complaints` | Queue/detail/reference/timeline, backed filters, processing/status confirmation | ADM-15, UXR-5D | Keep permission checks, append-only history and status transitions. |
| Revenue | `/admin` → `/admin/reports/revenue` | Date range/cinema filters, report table/cards | ADM-16, UXR-5D | Server source-of-truth only; no inferred totals. |

## 3. Manager — Cinema Operations Workspace

Persistent context header shows only assigned cinema(s) and selected current context from server-provided data. If more than one is assigned, switch context only through a selector populated by `/api/manager/cinemas`; clear dependent selections and guard late responses when context changes. If one assigned cinema, show it as read-only context rather than a fake selector.

| Màn hình | Hiện tại → route target | Thay đổi dự kiến / component | UC / slice | Rủi ro / điều kiện |
|---|---|---|---|---|
| Overview | `/manager` local section → `/manager/overview` | Cinema-context dashboard cards, date-based revenue only where supported | QLR-01/08/09, UXR-2 then UXR-5D | Scope verified server side; no global totals. |
| Rooms | `/manager` → `/manager/rooms` | Current cinema → room list/form, same reusable admin RoomTable/Form | QLR-02, UXR-3C | Do not change manager scope; clear room on context change. |
| Seats | `/manager` → `/manager/seats` | Cinema → room → physical seat grid + inspector/list fallback, shared facility components | QLR-03, UXR-3C | No raw room ID; no invented geometry or availability; preserve history guard. |
| Showtimes | `/manager` → `/manager/showtimes` | Date range/list; named room and movie controls from valid resources; show status/actions | QLR-04/05/06, UXR-4A | API filter gap for movie/room; overlap, timezone, cancellation/held orders. |
| Pricing | `/manager` → `/manager/pricing` | Cinema-scoped list/form; day type and seat type labels | QLR-07, UXR-4B | Server-side type/day filter unverified; snapshot history. |
| Bookings | `/manager/bookings` already separate; keep | Shared staff booking feature configured for Manager scope; preserve current cinema context | QLR-10, UXR-4C/4D | Never trust UI cinema filter as authorization; cross-cinema attempts must be denied by API/SP. |
| Revenue | `/manager` → `/manager/revenue` | Date range and current cinema; clear source and units | QLR-09, UXR-5D | No global cinema selector or client aggregation. |

## 4. CSKH — Case Management Workspace

Desktop target has three non-overlapping regions: **Queue | Chi tiết + Timeline | Đơn tham chiếu + Hành động**. Queue has its own scroll and applied filters; center owns selected case/detail/timeline; right owns linked order context and action. Mobile collapses to queue → case detail → context/action with clear back navigation; preserve selected case, current filter and unsaved draft.

| Screen/route | Hiện tại → target | Component/workflow | UC / slice | Risk |
|---|---|---|---|---|
| Queue/list | `/support` monolith → `/support` queue | `FilterBar`, queue rows/status/priority, applied-vs-draft filter state, deep-link selection | CSKH-01/02, UXR-1A then UXR-6A | Existing list filters only; filter change must not silently discard draft. |
| Detail/timeline | local selected state → `/support/complaints/:complaintId` | Case header, customer-safe context, append-only timeline, loading/error/404 | CSKH-03/05, UXR-6A | direct reload/back; async response must match current case; timeline remains append-only. |
| Reference/action | detail local content → right pane/context | Order reference read, processing form, valid status action + confirmation | CSKH-04/05/06, UXR-6A | API permissions and status rules; unsaved changes guard on navigation/filter/case switch. |

## 5. Customer/Public — Modern Cinematic Commerce

Không thay đổi business journey/API: trang chủ → phim/rạp → lịch chiếu → chọn ghế → booking/optional products/promotion → payment → order history; profile/complaints remain account paths. Visual direction white/blue with cinematic poster hierarchy, no dark-mode default, gradient spectacle or new functionality.

| Screen | Hiện tại → target | Component/workflow | UC / slice | Risk |
|---|---|---|---|---|
| Home `/` | Current home + DatabaseHealth | Hero backed by catalog data; quick booking only with real showtime options; now/coming soon status from API; movie cards | UXR-1B, KH-04/05, UXR-6B | Remove diagnostic DB panel; no invented availability. |
| Movie list/detail | Existing routes retained | Search/status/genre; cards, showtime/date/cinema selector; review section | KH-04/05/13, UXR-6B | Filters from API; keep eligibility/ownership. |
| Cinema list/detail | Existing routes retained | City filter, real image gallery and showtime selection | KH-05, UXR-6B | Image/font fallback; no fabricated cinema detail. |
| Booking preparation | `/booking/:showtimeId` | Seat map with showtime-specific availability; persistent summary; products/promotions only when API responds; recoverable errors | KH-06/07/08/09, UXR-6C | Preserve booking state, price authority, seat locks, expiry and async guards. No frontend price rule changes. |
| Orders/detail/payment | Existing `/orders*` | Status filter, order snapshot, ticket/payment history and payment CTA only when eligible | KH-10/11/12, UXR-6D | Ownership, payment attempts/results, no double submit, no history mutation. |
| Profile/account | `/profile`, `/account` | Clear profile/account hierarchy, editable fields only from contract | KH-01/02/03, UXR-6D | Keep role immutable; PII controls and auth semantics. |
| Complaints | `/complaints*` | Own complaints list/create/detail and linked order display | KH-14, UXR-6D | Customer ownership/permission; no CSKH-only action. |

## 6. Shared component architecture plan

| Component family | Planned ownership | Contract to specify before implementation |
|---|---|---|
| Shell / navigation | `layouts/` owns PublicShell and StaffShell; role nav data only | portal, active route, responsive drawer state; keyboard escape/focus return; no business rules. |
| PageHeader / Breadcrumbs | shared UI | title, description, breadcrumb items, primary action; responsive wrapping; semantic nav labels. |
| FilterBar / FilterField | shared UI; screen owns query mapping | typed fields, draft/applied values, clear/apply, URL/deep-link policy; loading/disabled; no filter without API/bounded data. |
| ResourceTable / DataTable | shared table, screen owns columns/row actions | column definitions, sort/page only if supported, row key, empty/loading/error, mobile card transform, headers/scope. |
| ResourceSelect / customer selector | shared input, screen owns lookup request | options/label/value/loading/search/error/selected; named UI, ID payload; debounce/cancel/stale guard, list limits. |
| FormField / Input / Select | shared UI | label, hint, error, required, disabled, variants; native semantics, focus, keyboard, touch. |
| Dialog / ConfirmDialog | shared UI | title, content, destructive variant, confirm/cancel/loading; focus trap/restore and Escape policy; no actions after permission loss. |
| StatusBadge / AsyncState | shared UI | explicit status map and semantic color; loading/empty/error/retry/conflict/forbidden/success. Text/icon must supplement color. |
| SeatGrid / SeatInspector | facility feature shared by Admin/Manager, not generic UI | rows/numbers/seat type from data, mode (physical vs showtime availability), selection rules only from API; accessible list alternative and history guard. |
| Booking workbench | `features/staff-bookings/` owns booking interactions | portal role scope/configuration passed in; component does not encode role/business decisions. Server remains authority. |
| Cinema image manager | existing feature owner | keep image upload/ownership/request guards; no cross-cinema stale result. |

For every new shared component, spec must record props, variants, states, interaction, responsive behavior and accessibility behavior (accessible name, focus, keyboard, error association, contrast). Keep role-specific workflows in route/page/feature modules, not shared primitives.

## 7. Ordered migration and acceptance for an individual screen

1. Verify route/UC and fill relevant Matrix row; resolve `NEEDS APPROVAL`/`BLOCKED` before UI design commits to that behavior.
2. Write one screen spec: actor, goal, route, data ownership, filters/table fields, actions/state transitions, loading/error/empty/conflict/forbidden, async guards, responsive and accessibility.
3. Implement within the planned slice only; retain old entry route until child route and deep-link/back/forward/reload are verified.
4. Verify UI and data: request parameters match visible filters; row/action data maps to correct resource; no manual IDs; errors remain actionable; no role/scope bypass.
5. Browser screenshot at all five viewport widths with same test fixture, compare before/after, keyboard/focus smoke, console/network review, relevant regression flow.
6. Record evidence and `PASS/FAIL/BLOCKED/NOT VERIFIED` honestly. A route screenshot is not E2E acceptance.

## 8. Cross-screen risk register

- Booking/payment/order lifecycle, seat concurrency, snapshot price, cancellation history: highest severity; feature slices must preserve DB/SP authority and prove state afterwards.
- Manager context transitions and exact scope: high; test assigned vs unassigned, stale requests and direct route reload.
- CSKH drafts/timeline: high; filter/case switch cannot erase text without confirmation; processing stays append-only.
- Admin destructive CRUD and cinema images: medium/high; explicit confirmation, ownership, image async guard.
- DTO-driven generic tables and raw IDs: usability/data mapping risk; curate columns but do not alter API semantics.
- Browser media assets: environment-dependent; verify network-permitted staging before concluding app asset defect.
- Responsive/accessibility: evidence exists for home/shell only at all widths; each screen requires later slice-specific five-width and keyboard validation.

