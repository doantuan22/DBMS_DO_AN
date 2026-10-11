# UXR-V3 — Roadmap UXR-1 đến UXR-7

Roadmap phân rã theo [Master Blueprint V3](../../MASTER_FRONTEND_UIUX_RESTRUCTURING_BLUEPRINT_V3.md) §§11–14. Đây là kế hoạch sau UXR-0, không phải ủy quyền triển khai. **Chỉ bắt đầu slice sau khi chủ dự án phê duyệt.** Không mở rộng ngoài 44 UC active và contract đã tồn tại.

## Thứ tự phụ thuộc

```text
UXR-0 baseline + approvals
  → UXR-1 safety fixes
  → UXR-2 shared foundation + route ownership
  → UXR-3 facilities (Admin/Manager)
  → UXR-4 showtimes / pricing / staff bookings
  → UXR-5 remaining Admin operations
  → UXR-6 CSKH + Customer
  → UXR-7 integration acceptance for all 44 active UC
```

UXR-3 có thể chuẩn bị screen specs song song với UXR-2, nhưng implementation dùng shared patterns/route ownership đã được xác nhận trước. UXR-4 phải dựa capability matrix; nếu phát hiện cần đổi API/SP thì tách request có approval riêng, không gộp thành “UI-only”. UXR-7 chỉ đến sau khi các screen slice đã có evidence và regression state.

## UXR-1 — Safety fixes trước refactor

| Slice | Phạm vi | Dependencies | Acceptance criteria |
|---|---|---|---|
| **1A — CSKH draft/filter** | Tách filter draft khỏi applied query; giữ selected case và draft; xác nhận trước khi bỏ thay đổi; handle out-of-order queue/detail response | Support API hiện tại; test case có sẵn | Browser nhập draft → đổi filter/case/back/deep-link; draft không mất thầm lặng; request theo filter đã apply; stale response không thay case mới; dirty confirmation hoạt động bàn phím/mobile. |
| **1B — Public diagnostics** | Gỡ `DatabaseHealth` khỏi trang khách/public; xem xét riêng payload/network để tránh lộ cấu hình diagnostic | Home route + API health behavior inventory | Home ở 390 px không có diagnostic panel hoặc tràn do panel; không lộ DB identity/connection/diagnostics trong public UI. Không thay đổi health API/backend trong slice. |
| **1C — Staff mobile drawer** | Drawer focus entry, containment, close/restore; keyboard/touch | `StaffShell` hiện tại | 390/768 px drawer mở bằng keyboard/touch; focus vào menu; Escape/close; restore focus; active link/route; no background scroll/interaction regression. |
| **1D — Manager selectors** | Thay raw numeric Movie ID/room ID bằng named selectors từ resource APIs đã có | Manager cinema/room context, catalog list, stale request guard | Chọn phim/phòng bằng nhãn thật, payload đúng ID, invalid/stale choices bị clear; assigned cinema scope đúng. Nếu lookup không đầy đủ/bounded, dừng và ghi blocker thay vì thêm endpoint tự ý. |

**Gate UXR-1:** mỗi fix có before/after screenshot, test route/permission liên quan và xác nhận booking state/Manager scope/draft không bị ảnh hưởng.

## UXR-2 — Shared foundation và route ownership

| Slice | Nội dung | Dependencies | Acceptance criteria |
|---|---|---|---|
| **2A — Component contract** | `PageHeader`, `Breadcrumbs`, `FilterBar`, column-schema `DataTable/ResourceTable`, named `ResourceSelect`, `ConfirmDialog`, `AsyncState`, `StatusBadge` | UXR-1 completed; official tokens | Props/variants/states/responsive/accessibility/interaction spec và unit/component checks; contrast/keyboard/focus; shared components không giữ business logic role-specific. |
| **2B — Portal navigation** | Chia child route theo Admin 6 nhóm; Manager routes giữ cinema context; support detail deep-link | 2A, current route inventory | Direct URL/reload/back/forward/active nav đúng; cũ và mới cùng hoạt động khi migration dần; route-level RBAC/403 giữ nguyên; không tạo API/permission do route mới. |
| **2C — Shell responsive** | PublicShell/StaffShell, mobile navigation and page content contracts | 2A/2B | Five viewports, keyboard/touch, responsive overflow/focus; screenshots same fixture; route unauthorized still blocked. |

**Gate UXR-2:** component APIs được review, route smoke đủ role, no regression in auth/scope/booking flow; merge không redirect big-bang.

## UXR-3 — Cơ sở vật chất, ưu tiên Admin/Manager

| Slice | Màn hình | Dependencies | Acceptance criteria |
|---|---|---|---|
| **3A — Admin rooms** | cinema filter → list-first → curated columns → room form | UXR-2; Admin room API | Rạp selector tên; API filter khớp lựa chọn; empty/loading/error; create/edit guards đúng parent; no unbounded fake filter. |
| **3B — Admin seat map** | Cinema → room → physical seat grid + inspector/list fallback; two modes separate | 3A; row/number data; verified safe test fixtures | Grid chứa đúng 240 fixture seats/row labels; no invented aisle; keyboard/list alternative; physical CRUD không hiện sold/held nếu không theo showtime; test history/deletion guard and stale hierarchy. |
| **3C — Manager facilities** | Manager rooms/seats with shared components and assigned-cinema context | 3A/3B; Manager API scope | Assigned-only direct route; context switch clears children; no raw IDs; attempt outside scope is denied server-side; screenshots with valid multi-context fixture if available. |
| **3D — Cinema/image management** | cinema detail and image gallery | UXR-2; existing image manager | Correct cinema ownership, cover/order state and upload response; stale request cannot overwrite another cinema; image not lost on cancel/error. |

**Gate UXR-3:** screenshots for real room in both portals, tests for history guard and manager scope; no seat geometry additions.

## UXR-4 — Suất chiếu, giá và đặt vé staff

| Slice | Màn hình | Dependencies | Acceptance criteria |
|---|---|---|---|
| **4A — Showtimes** | Admin/Manager date/cinema list; named movie/room controls; optional calendar only if grounded by same API data | UXR-2; showtime APIs; 3C resources | Query filters match API; overlap/timezone/cancel/held-order errors are shown; Manager scope verified; no new business rule. Movie/room filters wait for matrix approval if server query needed. |
| **4B — Pricing** | Admin/Manager cinema context, day/seat types, create/edit | UXR-2, pricing SP semantics | Show exact day/seat types and effective data; historical price snapshots stay unchanged; unsupported type/day server filters are clearly blocked or use only proven complete bounded data. |
| **4C — Booking list/detail** | Shared feature list/status/search/paging, details and ticket snapshot | UXR-2; `sp_StaffBooking_*` contract | Visible search/status/cinema/page sent to API; Admin sees system scope; Manager only assigned scope; customer identity shown only as needed; details map status/tickets/payment history accurately. |
| **4D — Create/edit/cancel** | Guided customer → showtime → available seats; edit eligible seats; cancel confirmation | 4C; already approved business scope; test fixtures | Select existing active Customer by name/email/phone; pending/nonexpired/no payment attempt/promotion/food only for seat edit; no payment marking; price snapshot retained for unchanged seats/current price for new seats; old tickets remain canceled; cancel is nonphysical; conflict/double-submit/concurrency tested. Showtime list >200 remains blocked until approved/query contract resolves. |

**Gate UXR-4:** transactional checks prove state in isolated DB after UI action; seat locking, history, payment guards and cross-role scope pass. Do not report only visual completion.

## UXR-5 — Admin catalog và operations còn lại

| Slice | Màn hình | Acceptance criteria |
|---|---|---|
| **5A — Access** | Users + Manager assignments | Role is immutable after creation; allowed role-at-create preserved; Manager assignment current/transfer confirmation/effective dates; no role-permission CRUD. |
| **5B — Catalog** | Movies/actors/genres | Relations by name; search/status/genre request values verified; cast update persists; deletion guard/business errors clear. |
| **5C — Commerce catalog** | Products/promotions | List/detail/forms match schemas/status/date/amount limits; unsupported filters absent; booking price/promo remains server-authoritative. |
| **5D — Service & reporting** | Admin complaints, overview, revenue | Complaint history append-only and allowed state transitions; report date/cinema query is server-side; dashboard metrics source documented. |

**Gate UXR-5:** each route has five-width screenshot, keyboard smoke, API/RBAC regression, loading/error/empty/success feedback and test evidence.

## UXR-6 — CSKH và Customer

| Slice | Màn hình | Acceptance criteria |
|---|---|---|
| **6A — CSKH workspace** | Queue/detail/timeline/reference/action three-pane desktop and mobile flow | Deep-link/reload; selected case/filter persists; draft warning; append-only timeline; scoped order reference; correct status transitions; no race/stale overwrite. Depends UXR-1A. |
| **6B — Public discovery** | Home, movie catalog/detail, cinema catalog/detail | White/blue design, real data only, accessible movie cards, no database diagnostic, graceful unavailable image/font fallback, correct catalog filters. Depends UXR-1B/2. |
| **6C — Customer booking** | Showtime/seat map/summary/products/promo | Seat map mirrors API availability; keyboard selection and summary; booking state/error/retry/expiry preserved; server price authority; payment untouched. |
| **6D — Orders/account/support** | Orders/detail/payment/profile/complaints | Ownership guard, status and payment history, no duplicate payment action, profile role immutable, complaint own-data guard, correct errors and empty state. |

**Gate UXR-6:** Customer and CSKH flows are browser verified for success and key negative states; no change to payment/RBAC/business logic.

## UXR-7 — Integration acceptance, all 44 active UC

- Replay all 44 current active UC using role-specific browser journeys and isolated DB fixtures; historical PASS does not transfer automatically to redesigned UI.
- Use evidence to link UC → route/component → API/SP → before/after screenshot → test and DB postcondition. Keep `PASS`, `FAIL`, `BLOCKED`, `NOT VERIFIED` distinct.
- Run frontend/backend tests, lint, production build and DBMS-first/no-direct-SQL scan according to repository scripts; record actual outputs.
- Test role/access negative cases, Manager assigned/unassigned scope, booking lifecycle/payment/history/seat concurrency, CSKH transitions, async stale responses and validation.
- Accessibility: keyboard/manual review and automated axe-equivalent; responsive/browser checks at 390/768/1280/1440/1920; contrast WCAG 2.2 AA.
- Review screenshot diffs with same data fixture; verify console/network and no new external-asset assumption.

**Final gate:** only all required evidence without critical regression permits overall frontend UX acceptance. If fixture, API, DB or browser cannot test a case, mark BLOCKED; do not infer from source inspection or previous snapshots.

## Cross-stage slice completion contract

For every screen slice: approved scope → screen spec → confirmed API/SP/filter contract → implementation → tests and browser evidence → regression assessment → owner review. Every screen includes loading, error, empty, success, forbidden and relevant conflict states; table/form and dialog have keyboard/focus/accessibility contract; screenshots use the same fixture across five viewports. No phase may silently absorb unrelated backend, DB, API, RBAC or business logic work.

