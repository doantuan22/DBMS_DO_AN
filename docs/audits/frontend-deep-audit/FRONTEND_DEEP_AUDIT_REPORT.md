# Frontend Deep Audit — Consolidated Report

> **Quyết định RBAC cố định (11/10/2026):** 42 Use Case hoạt động: Customer 14, Manager 9, CSKH 6, Admin 13. `ADM-03`, `ADM-04`, `ADM-05` là **RETIRED**; giữ ID/evidence lịch sử trong ma trận 45 ID. Chỉ có Customer (`KHACH_HANG`), Manager (`QUAN_LY_RAP`), CSKH và Admin (`ADMIN`). Vai trò xác định khi tạo tài khoản và bất biến sau đó; danh mục quyền và Role–Permission bất biến đối với ứng dụng. Customer tự đăng ký; Admin chỉ tạo Manager/CSKH/Admin. Admin tiếp tục phân công/chuyển rạp cho Manager bằng selector tên, hiển thị phân công hiện tại và xác nhận chuyển rạp; giữ scope/thời hạn và khả năng nhiều phân công hiện có. Các verdict, wireframe, route và kế hoạch 45 UC/RBAC CRUD trong báo cáo này là lịch sử trước quyết định; yêu cầu triển khai ADM-03/04/05 và partial grant bị hủy. Nghiệm thu mới không kế thừa PASS lịch sử.


Audit date: 2026-10-11 (Asia/Bangkok). This file consolidates the audit reports and collected evidence summaries. The source reports were merged without changing application code.

## Contents

- [Evidence Index](#evidence-index)
- [Executive Summary](#executive-summary)
- [01 Frontend Inventory](#inventory)
- [02 Information Architecture](#information-architecture)
- [03 Visual Design](#visual-design)
- [04 Admin Portal](#admin-portal)
- [05 CSKH Portal](#cskh-portal)
- [06 Manager and Customer](#manager-customer)
- [07 Frontend Architecture](#frontend-architecture)
- [08 Responsive, Accessibility and Performance](#responsive-accessibility-performance)
- [09 User Flow Audit](#user-flows)
- [10 Root Cause Analysis](#root-causes)
- [11 Restructuring Readiness](#restructuring-readiness)
- [Issue Register](#issue-register)
- [Page Scorecard](#page-scorecard)
- [45 Use Case Coverage](#use-case-coverage)
- [Restructuring Backlog](#restructuring-backlog)
- [Evidence — Static Accessibility Review](#accessibility-evidence)
- [Evidence — Frontend Checks](#frontend-check-evidence)
- [Evidence — Local Vite Smoke](#local-vite-smoke)
- [Evidence — Production Build](#performance-build)
- [Evidence — Screenshots](#screenshots)

<a id="evidence-index"></a>
## Evidence Index

The evidence summaries below record frontend tests, lint, production build, local Vite HTTP smoke and static accessibility review. Browser screenshots and end-to-end role journeys were not available in this audit. Historical acceptance artifacts referenced in repository reports are not present in this checkout.

<a id="executive-summary"></a>

## Executive Summary — Frontend Deep Audit

**Audit date:** 2026-10-11 (Asia/Bangkok)  
**Scope:** React frontend, 45 official use cases, routes, static UI architecture, existing frontend checks and local Vite serving.  
**Mode:** Read only. Application source, API contracts, backend and database were not changed.

## A. Overall health

**Provisional quality score: 56/100 (2.8/5), moderate to weak for continued feature growth.** This is a source based score, not a usability lab result. The current build and checks are healthy, and the frontend has useful permission, async state and shared styling foundations. Admin and CSKH workflows and the boundaries of the Admin portal are the main sources of user and maintenance cost.

| Dimension | Score | Weight | Basis |
|---|---:|---:|---|
| Code and verification reliability | 15/20 | 20 | 65 frontend tests, lint and build passed; no current browser or backend journey was run. |
| Architecture and maintainability | 10/20 | 20 | AdminPortal is 906 lines and combines 18 sections, data loading, forms, permissions and writes. |
| Information architecture and workflow | 9/20 | 20 | Admin has a flat in-page section switcher; CSKH filters and selected-case context have weak commit and navigation boundaries. |
| Design system consistency | 12/15 | 15 | Color, spacing, radius and status tokens plus shared state components exist; styling is concentrated in one 1,635-line global stylesheet. |
| Accessibility and responsive readiness | 5/10 | 10 | Skip link, labels and focus styles exist; browser and assistive technology verification was unavailable. |
| Runtime and performance evidence | 5/15 | 15 | Vite serves the app and the build succeeds; the single JavaScript chunk is 545.57 kB minified and no interactive browser run was possible. |

Portal scores are source review estimates. Visual values in the page scorecard are styling proxies because screenshots were not available.

| Portal | Provisional score | Assessment |
|---|---:|---|
| Customer | 3.3/5 | Most workflows have dedicated pages and state components; booking remains a dense multi-step page. |
| Manager | 2.7/5 | Nine use cases share one workspace and cinema context; operations are accessible but concentrated. |
| CSKH | 2.2/5 | Queue, filters, case, timeline and two write workflows share one route and one long screen. |
| Admin | 2.1/5 | Broad coverage exists, but navigation is flat and table/grant workflows expose technical data shapes. |

**Issue distribution:** P0: 0, P1: 1, P2: 5, P3: 1. No data loss, authorization bypass, or broken workflow was confirmed in this audit. P1 denotes a high consequence usability risk from manually granting role permissions using numeric IDs and comma separated permission IDs; runtime misuse was not observed.

## B. Verification and confidence

- Frontend tests: **65/65 passed**.
- Frontend lint: **passed**.
- Production build: **passed**, 93 modules transformed. Vite reports a 545.57 kB minified JavaScript chunk, above its 500 kB warning threshold; gzip size is 159.04 kB.
- Local Vite smoke: **HTTP 200** for the app document and transformed route module.
- Browser inspection, screenshots, full responsive testing, axe/WCAG scan, and current end-to-end use-case journeys: **not verified**. The frontend package has no Playwright/browser automation dependency and no browser tool was available in this session. No demo account or controlled backend/database fixture was used.
- Historical baseline: current official documents report R8.3 accepted and 45/45 use cases passed. Raw acceptance artifacts are absent from this checkout. The older R8.3 checkpoint records the two ADM-07 failures before the later re-acceptance. Current CinemaImageManager source contains ownership and request-generation guards, but this audit did not replay its browser regression cases.

**Confidence:** High for file structure, source behavior and executed frontend checks; medium for architecture/workflow impact; low for live visual quality, responsive behavior and current end-to-end business behavior.

## C. Top findings

1. **P1 — Admin permission grants require manually entering role and permission IDs.** This places a high consequence access task behind raw identifiers and comma separated text. See FE-03.
2. **P2 — Admin is a flat 18-section in-page portal with a 906-line orchestration component.** The URL remains /admin as the user changes modules, and unrelated CRUD and reports share state and rendering logic. See FE-01.
3. **P2 — Admin tables display every field in the returned object.** Labels and columns follow API DTO shape rather than the task; the table relies on horizontal scrolling and has no visible search, sort or paging controls in this component. See FE-02.
4. **P2 — CSKH reloads the queue for each filter change.** Typing a search term produces a request per keystroke; the visible filter submit action issues another request. Changing any filter clears the selected case. See FE-04.
5. **P2 — CSKH case state is not addressable in the URL.** Refresh, direct links and browser history cannot restore the selected complaint, filters or in-progress screen context. See FE-05.
6. **P2 — One global stylesheet owns the full UI.** It is 1,635 lines with one responsive breakpoint; this makes feature-specific changes and responsive regression review harder. See FE-06.
7. **P3 — All route code is delivered in one JavaScript chunk.** The production build crosses Vite's size warning threshold. See FE-07.

## D. Root causes

- Admin work was added as resource sections to one workspace rather than being separated around the staff member's work tasks.
- Generic rendering uses API response object keys as table columns, so backend DTO structure becomes the visible UI model.
- CSKH selection and filters are local component state, while the screen itself has no case route or state-restoration contract.
- Shared styling started with useful design tokens, but page and feature styles accumulated in one global file without module ownership.
- Async request safety is implemented locally with request counters, refs and generation checks; the behaviors are guarded, but there is no shared feature-level pattern.

## E. Restructuring readiness

Incremental restructuring is feasible. Preserve the existing REST contract, backend/SQL authority, role/permission checks, booking limits, date/time conversion, error states and the current ADM-07 ownership guards. Standardize route and async-state tests before moving behavior.

Admin and CSKH are **redesign candidates for information architecture and task flow**, not candidates for a full rebuild. Keep the shared shell, token palette, status and loading primitives, API clients, authorization helpers and customer booking foundations. See [11 Restructuring Readiness](#restructuring-readiness).

## F. Recommended next steps

1. Resolve the P1 grant workflow by selecting role and permission names, with explicit review of changes before submit.
2. Split Admin into feature modules and give each module a stable route/deep link before changing its visual design.
3. Make CSKH filtering an explicit query action (or debounce it deliberately), preserve selection where safe, and give each case a URL.
4. Define curated, task-specific tables and shared search/sort/paging/empty/error patterns.
5. Split global styles by shell, primitives and feature ownership while keeping the established token values.
6. Add browser evidence for 45 primary routes/use cases, 390 px and desktop viewports, keyboard/focus, network errors and the ADM-07 race/retry cases before accepting the restructure.
7. Evaluate route-level code splitting against real navigation and performance measurements.

No refactor or redesign was started.

---

<a id="inventory"></a>

## 01 — Frontend Inventory

## Scope and evidence

Inventory is derived from `frontend/package.json`, `frontend/src`, `frontend/tests`, the route table, the shared 45-use-case matrix, and the current source. Counts are file counts, not unique React component declarations. No browser session was available.

## A1. Source and technology inventory

| Area | Current implementation | Audit notes |
|---|---|---|
| React | React / React DOM 19.2 line | App root is wrapped in StrictMode. |
| Build | Vite 8.3 line with React plugin | SPA build; one emitted JS entry chunk. |
| Routing | React Router DOM 7.18 line | Routes are declared centrally in `src/routes/index.jsx`; portal sub-sections are local state, not routes. |
| Styling | One global `src/index.css`, 1,635 lines | CSS variables for brand/status colors, spacing, radius, shadow and transitions. One media query at 768 px. |
| UI component library | None | Shared React components are project-owned. |
| Icons | No icon dependency | Brand mark is a text star; no icon system was identified. |
| Forms | Native controls and controlled React state | No form library or schema library. Constraints are split between HTML attributes and per-feature helpers. |
| Data fetching | Native `fetch` through `src/api/httpClient.js` and API modules | JSON REST client; credentials included; bearer token read from session storage; no query/cache library. |
| State | React local state, refs, effects, and AuthContext | No Redux, Zustand or other global state package. Async ownership patterns vary by feature. |
| Authentication | AuthContext, authSession service, sessionStorage token | Login restores current user; front-end route gates are UX guards. Backend remains authoritative. |
| Permissions | `authorization.js`, role and permission constants | Admin sections and actions are permission-filtered; route guards check role/permission. |
| Error handling | Shared HTTP error object plus Loading/Empty/Error state components | Some features have their own retry and feedback lifecycle. |
| API organization | 10 API modules under `src/api` | Modules cover auth, catalog, order, support, manager, admin, health and feedback. |
| Test tools | Node built-in test runner; Oxlint | 65 frontend tests pass. No Playwright, Cypress, axe-core or component test framework is declared. |
| Date/time | `@js-temporal/polyfill` plus `utils/dateTime.js` | Existing tests cover local date/time conversion and timezone boundaries. |
| Design tokens | CSS custom properties in `index.css` | A genuine token layer exists, though token use and feature ownership remain concentrated in one file. |

## A2. Route inventory

Every path below is statically mounted. “Static only” means the current audit did not navigate it in a browser. Official repository documents report the 45 use cases accepted in a later R8.3 re-acceptance; raw run artifacts are not present here.

| Path | Page/component | Layout and access | Main API dependency | Status in this audit |
|---|---|---|---|---|
| `/` | Home, DatabaseHealth | Public AreaLayout | Movies, DB health | Mounted; static only |
| `/movies` | Movies | Public AreaLayout | Movies, genres | Mounted; static only |
| `/movies/:movieId` | MovieDetail, MovieReviews | Public AreaLayout | Movie, cinema, showtime, review APIs | Mounted; static only |
| `/cinemas` | Cinemas | Public AreaLayout | Cinema list | Mounted; static only |
| `/cinemas/:cinemaId` | CinemaDetail, CinemaGallery | Public AreaLayout | Cinema and image APIs | Mounted; static only |
| `/booking/:showtimeId` | BookingPreparation, SeatMap, ProductPicker | Public AreaLayout | Showtime, seats, products, promotion, booking APIs | Mounted; static only |
| `/login` | Login | Public AreaLayout | Auth APIs | Mounted; static only |
| `/register` | Register | Public AreaLayout | Auth registration | Mounted; static only |
| `/forbidden` | Forbidden | Public AreaLayout | None | Mounted; static only |
| `/profile` | Profile | RequireAuth, AreaLayout | Current user/profile APIs | Mounted; static only |
| `/orders` | Orders | Customer role, AreaLayout | Order history | Mounted; static only |
| `/orders/:orderId` | OrderDetail | Customer role, AreaLayout | Order detail | Mounted; static only |
| `/orders/:orderId/payment` | PaymentPage | Customer role, AreaLayout | Payment attempt/result APIs | Mounted; static only |
| `/complaints` | Complaints | Customer role, AreaLayout | Complaint list/create | Mounted; static only |
| `/complaints/:complaintId` | ComplaintDetail | Customer role, AreaLayout | Complaint detail | Mounted; static only |
| `/manager` | ManagerPortal | Manager role, AreaLayout | Manager room, seat, showtime, pricing and report APIs | Mounted; static only |
| `/support` | SupportPortal | Support role and QL_KHIEUNAI, AreaLayout | Queue, detail, reference, processing and status APIs | Mounted; static only |
| `/account` | CustomerArea | Customer role and customer permission, AreaLayout | None; shortcut hub | Mounted; static only |
| `/admin` | AdminPortal, CinemaImageManager | Admin role, AreaLayout | Admin resource APIs | Mounted; static only |
| `*` | NotFound | Public AreaLayout | None | Mounted; static only |

There are 20 route patterns including the wildcard. There are no separate Admin section or CSKH complaint-detail routes. `Forbidden` is rendered in the public shell; a dedicated error layout is not used.

## A3. Component and responsibility inventory

There are 25 page files, 19 JSX component files under `src/components`, 10 API modules and one 1,635-line stylesheet. Major source sizes:

| File | Lines | Responsibilities observed |
|---|---:|---|
| `pages/AdminPortal.jsx` | 906 | 18 sections, permission filtering, loading, generic rows, edit forms, CRUD actions, grants, complaints and reports |
| `index.css` | 1,635 | Tokens, app shell, public catalog, forms, tables, booking, statuses, portal and responsive rules |
| `pages/ManagerPortal.jsx` | 377 | Cinema selection, dashboard, rooms/seats, showtimes, pricing, reports and writes |
| `components/CinemaImageManager.jsx` | 368 | Cinema/image loading, selection, ownership checks, image editor and mutations |
| `pages/BookingPreparation.jsx` | 362 | Showtime, seats, products, promotion, booking, hold and submit/error state |
| `pages/SupportPortal.jsx` | 297 | Queue filters, selection, case detail, order reference, timeline and two write workflows |

All 19 JSX component files have at least one relative import in the source. This is a static import scan; dynamic import and indirect usage are not inferred. Shared state/UI pieces include CatalogStates, StatusBadge, HoldDeadline, MovieGrid and ComplaintOrderReference. AdminPortal and SupportPortal implement overlapping complaint detail/timeline/processing/status workflows; permission and endpoint differences mean a shared visual primitive should not silently merge their business rules.

For a reproducible state-complexity signal, literal hook-call counts in the largest pages are:

| Page | useState | useEffect | useCallback | useRef |
|---|---:|---:|---:|---:|
| AdminPortal | 14 | 2 | 1 | 10 |
| SupportPortal | 8 | 2 | 2 | 6 |
| ManagerPortal | 10 | 3 | 1 | 4 |
| BookingPreparation | 12 | 3 | 1 | 5 |

These counts are not complexity scores. A parser-based cyclomatic score, prop fan-out and dependency graph metric was not available, so responsibility/state ownership is assessed from source paths instead of inferred from LOC alone.

Component dependency and ownership summary:

- Shared shell and auth are centralized in `AreaLayout`, `AuthContext`, `RequireAuth` and `RequireRole`.
- Shared state display is centralized in `CatalogStates`; status display in `StatusBadge`.
- Customer catalog/booking pages are mostly separate page components with focused reusable child components.
- Admin and Manager each expose several business areas from one route. Admin is the clearest responsibility hotspot.
- UI, data orchestration and API actions coexist inside Admin, Support and Manager page components.
- The generic Admin table takes column names and cells from API object keys rather than curated per-resource column definitions.
- API client boundaries are clear at the module level, but request ownership/cancellation is implemented per page using a mix of AbortController and generation refs.

## Use-case baseline

Repository baseline is 45 official use cases: Customer 14, Manager 9, CSKH 6 and Admin 16. ADM-17 remains out of scope. The latest matrix says 45/45 PASS; the older R8.3 checkpoint is historical and records the state before later ADM-07 re-acceptance. See [45 Use Case Coverage](#use-case-coverage) for per-UC mapping and current verification limits.

## Evidence links

- [Routes](../../../frontend/src/routes/index.jsx#L1)
- [Admin portal](../../../frontend/src/pages/AdminPortal.jsx#L14)
- [Support portal](../../../frontend/src/pages/SupportPortal.jsx#L1)
- [Frontend package](../../../frontend/package.json)
- [Use case matrix](../../USE_CASE_MATRIX_45.md)

---

<a id="information-architecture"></a>

## 02 — Information Architecture Audit

## Summary

Public customer discovery uses recognizable route-level pages. Staff portals are organized mostly as one URL per role followed by in-page module switches. The Admin portal exposes 18 sections in one flat control group; Manager exposes multiple work areas on one page; CSKH keeps queue, case and processing actions in one route. The information architecture follows implementation/resource groupings more than staff task sequences.

## B1. Navigation architecture

| Finding | Evidence | User effect |
|---|---|---|
| Shared header is the only global navigation shell | `AreaLayout` renders a flex header, role-visible links and account actions. | Public links and role portals coexist in one shell. There is no separate staff navigation hierarchy. |
| Admin modules are buttons on `/admin` | Admin section names are a flat array; `switchSection` changes local state. | Modules have no direct URL, bookmark or browser-history entry. A return visit starts at the default or first allowed section. |
| Admin exposes up to 18 section choices | `sections` contains dashboard plus 17 operational/report areas; permission filtering removes inaccessible items. | Users with broad grants must scan a long, flat menu. No grouping or progressive disclosure is present in the section definition. |
| Manager combines nine use cases in `/manager` | Cinema context and multiple workspace sections live in ManagerPortal. | Work areas are reachable without navigation, but the single page can become long and its task hierarchy is not represented in URLs. |
| CSKH has queue and detail on `/support` | Selection and detail live in local state; no complaint identifier route is declared. | A case cannot be shared as a link or restored through refresh/back navigation. |
| Customer actions have route-level URLs | Orders, payments, complaints, details and profile are separate paths. | Customer navigation has stronger direct-link and browser-history behavior than internal portals. |

The app has a skip link and navigation landmarks. Breadcrumbs are not implemented; staff return context depends on the global shell and local state.

## B2. Cognitive load

### Admin

- 18 section buttons can compete for attention; there is no grouping by identity/access, cinema operations, catalog, booking or service work.
- The active section is local state and the headings are generated from the same section array, so the user's location is visually named but not reflected in the URL.
- The generic resource table displays all returned object properties. This can make the first view broad and technical before the user has selected a task.
- Permission grants ask the administrator to enter a role ID and a comma-separated list of permission IDs. This is the highest consequence interaction risk found.
- Create/edit forms share a generic renderer, but resource-specific guidance and validation context are sparse in the visible form source.

### CSKH

- Four filters appear together (status, priority, type and free-text search), followed by the queue, selected case, reference order, timeline and two separate write forms.
- Search is coupled to filter state changes: each keystroke updates state, which changes the queue loader and triggers the queue effect. The explicit submit button calls the same loader again.
- Changing any filter clears the current selection and detail. This is safe against showing a case that no longer matches, but it can discard the agent's immediate context without a confirmation or saved selection.
- Processing note and status change are separate forms. The user must understand which action records a timeline event and which changes the case status.

### Manager

- One cinema selector scopes dashboard and operational data. The selected cinema is important context but not part of the route.
- Room, seat, showtime and pricing operations are combined in one workspace. Separate shared form components keep some field logic out of the page, but the page remains a 377-line orchestration unit.

## B3. Workflow-oriented navigation

Public customer routes largely follow a journey: discover movie/cinema, select showtime, book, pay, review order or file a complaint. Admin is resource-oriented and CSKH is queue-oriented. Manager is grouped by cinema resources and reports. The staff portals do not provide explicit task queues or an at-a-glance “next action” hierarchy beyond the CSKH queue itself.

### Keep

- Route-level customer order and payment details.
- Role and permission filtering at navigation and action boundaries.
- The CSKH queue as the entry point for work.
- Manager cinema context selector.

### Change direction in a later phase

- Group Admin sections by staff task and expose stable deep links.
- Give CSKH cases a selected-case route and preserve non-sensitive queue filters in query parameters.
- Make filter commit behavior predictable and protect unsaved processing text when filters or cases change.
- Separate Manager overview from operational tasks if browser observation confirms excessive scroll or context switching.

## Verification status

Static source verified. No screenshots or user sessions were available, so visual hierarchy, navigation discoverability and scroll cost remain not runtime verified.

## Evidence links

- [Route structure](../../../frontend/src/routes/index.jsx#L38)
- [Shared navigation shell](../../../frontend/src/layouts/AreaLayout.jsx#L1)
- [Admin section model](../../../frontend/src/pages/AdminPortal.jsx#L14)
- [CSKH filters and queue](../../../frontend/src/pages/SupportPortal.jsx#L21)

---

<a id="visual-design"></a>

## 03 — Visual Design Audit

## Scope limitation

No browser automation or browser inspection tool was available, so this is a source styling audit. No screenshot is presented as evidence and no claim is made about pixel-level appearance, contrast in rendered states, font loading or visual regressions. Visual scorecard values are provisional styling proxies.

## C1. Visual hierarchy and layout

- A shared header, main region, footer, page and section classes establish a consistent shell.
- Public catalog pages use shared hero, card, grid, list, form and state classes.
- Admin and Support reuse the same `catalog-*` style vocabulary as customer pages. This provides some consistency, while leaving staff workflows without a clearly separate dense-workspace visual language.
- Admin section buttons use `aria-pressed` and selected styling. There is no declared hierarchy or grouping for the 18 modules.
- Admin tables wrap in a horizontal overflow container. The rule protects page width but can shift the task to horizontal scanning on narrower viewports.
- The booking seat map has specialized visual rules and status legend styles.

## C2. Design consistency

The CSS file contains a real token layer: brand and semantic colors, spacing, radii, shadows, transitions, focus border and typography family. Shared loading, empty, error and status components exist. This is more than disconnected styling, but it is not yet a complete, feature-owned design system:

- Tokens and all feature selectors are in one 1,635-line global stylesheet.
- The root defines spacing tokens, while many component rules still use direct numeric values.
- No shared table, filter bar, staff workspace, dialog or form-field component system was identified.
- There is no external component library or documented usage catalog.
- The same broad catalog form/table vocabulary serves customer and operations surfaces.

## C3. Maturity assessment

**Maturity: Level 2 of 4 — shared tokens and primitives, incomplete pattern system.**

| Capability | Status | Evidence |
|---|---|---|
| Color/status tokens | Present | CSS custom properties in `:root` |
| Spacing/radius/shadow tokens | Present | CSS custom properties in `:root` |
| Shared shell | Present | `AreaLayout` |
| Loading/empty/error state pattern | Present | `CatalogStates` |
| Status component | Present | `StatusBadge` |
| Table pattern | Partial | Shared CSS, but Admin creates columns from arbitrary response keys |
| Form pattern | Partial | Shared CSS and native controls, but field behavior is distributed across pages |
| Staff workflow patterns | Missing/limited | No shared queue/detail or portal navigation primitive identified |
| Component documentation/visual catalogue | Not found | No Storybook or similar dependency/configuration found |

## C4. Direction

Keep the current visual identity and token values until evidence supports changing them. In a later phase, establish shared table columns, filter controls, form fields, feedback messages and staff portal navigation as code-owned patterns. Split CSS by shell, primitive and feature ownership without changing business behavior in the same step.

## Verification status

Source-only. The browser-based visual audit, 390 px/768 px/1440 px screenshots, rendered color contrast and visual comparisons are **BLOCKED** by missing browser automation in this session.

## Evidence links

- [Global token layer and shell](../../../frontend/src/index.css#L1)
- [Responsive rules](../../../frontend/src/index.css#L1618)
- [Admin table implementation](../../../frontend/src/pages/AdminPortal.jsx#L829)
- [Shared UI state components](../../../frontend/src/components/CatalogStates.jsx)

---

<a id="admin-portal"></a>

## 04 — Admin Portal Audit

## Executive assessment

Admin is the largest workflow and maintenance risk. It statically covers all 16 Admin use cases and filters sections/actions by role permissions. However, 18 sections share `/admin`, a flat in-page button navigation and a single 906-line page component. Common operations are available, but the interface is organized around resource modules and API DTOs rather than task groups.

**Score:** 2.1/5 provisional source review.  
**Runtime:** Not verified in this audit. Current official repository documents report Admin use cases passed in historical acceptance; raw evidence is absent from this checkout.

## D1. Administrative usability

The portal defines dashboard, users, roles, permissions, assignments, cinemas, cinema images, rooms, seats, movies, genres, actors, products, promotions, pricing, showtimes, complaints and revenue. A user with broad access sees many peer choices in one group. The portal title and current section heading are present, but the active module is not in the URL.

Role permissions are applied to sections and actions. This is an important foundation to preserve. User access checks use the authenticated user and DB-loaded grants; the backend/database remain authoritative.

## D2. Data table audit

The generic table at AdminPortal lines 829–903 derives columns from `Object.keys(rows[0])` and cells from every `Object.entries(row)`. It formats values, but does not define a per-resource column set in this rendering path. Labels are transformations of response keys, not user-centered names. CSS places the table inside horizontal overflow.

No visible search, sort or pagination control is rendered in this table block. This may be acceptable for small lists, but collection sizes and actual behavior were not verified. If the endpoints return broad catalogs, users must scan technical fields and long lists.

## D3. CRUD and permission workflows

- Resource forms are generated from shared field definitions, and status/day values use constrained selects. Keep these contract-aware helpers.
- Create/edit state and resource writes remain in the page. A single submit path handles multiple resources and many field kinds.
- Role-permission grants ask for a numeric role ID, an explicit “read current permissions” step, and comma-separated QuyenID text. The interface does not offer a role-name selector and permission-name checklist in this workflow. A valid but unintended ID can configure access incorrectly; this is a high-consequence usability risk, not a confirmed authorization bypass.
- Cast editing accepts JSON text, another technical representation exposed directly to an operator.
- Complaint handling and order reference are embedded in the same module, using the same long-page pattern as CRUD sections.

## D4. Dashboard and reports

Dashboard and revenue are separate sections, and revenue has a date range. Data display is delegated to AdminRevenue for the report view. The default generic row adapter also converts arbitrary object values into rows; inspect the DTO/report contract before changing this behavior.

## D5. Recommended direction

1. Replace manual grant IDs with permission names and selectable grants, showing the before/after set and role name before submit.
2. Group portal navigation into identity/access, cinema operations, catalog/booking and service/report tasks; add route-backed deep links.
3. Define task-oriented tables with curated fields, search, sort, pagination where data volume warrants it, and stable row actions.
4. Split Admin by feature while keeping shared authorization and request behavior explicit.
5. Keep audit-sensitive confirmation and backend validation. Do not move permission or business authority into client-only rules.

## Findings

- FE-01: flat navigation and oversized orchestration component.
- FE-02: generic DTO-driven tables.
- FE-03: historical manual numeric permission grant flow; RETIRED on 11/10/2026.
- FE-06: global style and responsive ownership limits.

## Evidence

- `frontend/src/pages/AdminPortal.jsx:14-33` — 18 section definitions.
- `frontend/src/pages/AdminPortal.jsx:79-133` — portal state and permission model.
- `frontend/src/pages/AdminPortal.jsx:483-522` — same route section switcher.
- `frontend/src/pages/AdminPortal.jsx:523-550` — raw role/permission ID grant flow.
- `frontend/src/pages/AdminPortal.jsx:829-903` — generic table and row actions.
- `frontend/src/utils/authorization.js:10-30` — role/permission mapping.

---

<a id="cskh-portal"></a>

## 05 — CSKH Portal Audit

## Executive assessment

The Support portal has the essential case-work pieces: a queue, four filters, case detail, order reference, processing timeline, processing note and status change. Permission checks distinguish processing from order lookup. Request generations and write locks guard stale reads and duplicate writes. The main weakness is that all work is in one local-state screen and queue updates are tied directly to each filter edit.

**Score:** 2.2/5 provisional source review.  
**Runtime:** Not verified in this audit. Historical repository documents report the six CSKH use cases accepted; this audit did not replay them.

## E1. Complaint queue

The queue has status, priority, complaint type and free-text fields. Each input calls `changeFilter`, which updates filter state and clears the selected complaint/detail. The queue loader depends on filters and is run by an effect. Consequently typing into the search input initiates a request for each keystroke. Submitting the form calls `loadQueue` again for the same filters.

This behavior is code-confirmed. Request generation counters prevent older queue responses from replacing newer results. The issue is unnecessary reads, waiting/refresh churn and a confusing relationship between live filters and the explicit “filter queue” action.

## E2. Complaint detail and timeline

Selecting a case loads detail into local state below the queue. Detail includes sender, type, status, content, reference order and processing history. The selection button has a clear keyboard target, but the selected case is not reflected in the URL and its selected visual/assistive state is not represented with `aria-pressed` in the source.

## E3–E5. Handling and safety

- Processing and status change are separate forms with distinct controls.
- The user must hold the processing permission to write. Order reference has an independent permission check.
- A write lock prevents duplicate local submissions. After a write, the queue and selected complaint are refreshed if the selection context is still current.
- Request generation checks prevent stale detail from applying to a newly selected case.
- No real mutation was attempted in this audit. Rejected writes, duplicate-submit behavior and authorization were not runtime re-tested.

## E6. Workflow efficiency and direction

Separate queue filters into draft and applied state, or explicitly debounce the search field; avoid both per-keystroke loads and a redundant submit request. Preserve active case context when safe, and add a case-specific route. Keep unsaved processing text visible and make the effect of changing a filter or case clear before discarding it.

## Findings

- FE-04: filter edits cause repeated queue requests and clear case context.
- FE-05: case/filters are not addressable or restorable in route state.
- FE-06: current global styles do not define a distinct staff queue/detail responsive pattern.

## Evidence

- `frontend/src/pages/SupportPortal.jsx:21-38` — local queue, selection and filter state.
- `frontend/src/pages/SupportPortal.jsx:40-61` — filter-dependent queue loader.
- `frontend/src/pages/SupportPortal.jsx:62-77` — filter change clears current selection.
- `frontend/src/pages/SupportPortal.jsx:90-102` — load effects.
- `frontend/src/pages/SupportPortal.jsx:145-185` — filters and explicit submit.
- `frontend/src/pages/SupportPortal.jsx:211-289` — case, timeline and write forms.
- `frontend/src/routes/index.jsx:118-134` — only `/support` route.

---

<a id="manager-customer"></a>

## 06 — Manager and Customer Audit

## Manager portal

**Provisional score: 2.7/5.** One `/manager` page covers login/scope, room, seat, showtime create/update/cancel, pricing, dashboard and revenue. The selected cinema is the primary scope. Permission and server validation must remain authoritative.

Positive foundations:

- Cinema selection is explicit and labeled.
- Resource editing is partly delegated to `ManagerResourceForm` and revenue to `ManagerRevenue`.
- Pricing options and date/time conversion have dedicated helpers and existing tests.
- Existing source uses explicit loading/error/empty states and write feedback.

Risks and limitations:

- All nine use cases share one route and the 377-line `ManagerPortal.jsx` orchestration component.
- Cinema selection and most module context are not encoded in the URL. Refresh/back restoration is therefore limited.
- Room, seat, showtime and pricing work is presented in one workspace; a live review is needed to judge scroll and section visibility.
- Seat lookup accepts a room identifier, so verify the user can select a room by name in the rendered path rather than relying on IDs.

No manager use case was exercised against a live API in this audit.

## Customer portal

**Provisional score: 3.3/5.** Customer flows have the strongest route separation: public catalog, movie/cinema details, booking, order history/detail/payment, complaints, profile and account shortcuts. Shared cards, state components, seat map, product picker, hold deadline, review and gallery components keep major responsibilities separated.

Positive foundations to preserve:

- Public routes are available without auth where expected; order and complaint routes are protected by customer role.
- Booking selection is represented in components for seats/products/promotions and uses server-provided state/deadlines.
- Date/time conversion and booking limits are centralized and covered by current frontend tests.
- API calls use the shared REST client; frontend forms do not own authoritative price, permission or booking outcomes.

Risks and limitations:

- `BookingPreparation.jsx` is 362 lines and coordinates multiple asynchronous requests and writes. Keep its flow intact while separating presentation from orchestration.
- CustomerArea is a shortcut page rather than a data dashboard; this is not a defect if that is the intended task entry point.
- No browser validation of seat-map fit, payment states, error recovery, keyboard flow or mobile layout was possible.

## KEEP / IMPROVE

| Area | Direction |
|---|---|
| Customer catalog/detail routes | KEEP; preserve existing route and API contracts |
| Booking limits, hold deadline and date/time helpers | KEEP; treat as regression-sensitive behavior |
| Customer account/order navigation | IMPROVE after browser review; preserve direct order/payment URLs |
| Manager cinema scope and permission guards | KEEP; add route/history tests before modularization |
| Manager one-page information architecture | IMPROVE or REFACTOR after real task observation |
| Booking page state orchestration | REFACTOR incrementally; do not change booking semantics |

## Evidence

- `frontend/src/pages/ManagerPortal.jsx:12-377`
- `frontend/src/components/ManagerResourceForm.jsx`
- `frontend/src/pages/BookingPreparation.jsx:1-362`
- `frontend/src/components/SeatMap.jsx`
- `frontend/src/constants/bookingLimits.js`
- `frontend/src/utils/dateTime.js`
- `frontend/src/routes/index.jsx:38-151`

---

<a id="frontend-architecture"></a>

## 07 — Frontend Architecture Audit

## G1. Component architecture

The repository has a clear top-level separation between pages, API modules, shared components, route guards, auth context, utilities and feature services. This is a workable foundation. Component responsibility becomes broad at the staff portal boundary:

| Component | Size | Responsibility assessment |
|---|---:|---|
| AdminPortal | 906 lines | High: 18 module definitions, permission filtering, asynchronous loading, form hydration, CRUD, grants, complaints, reports and table rendering |
| ManagerPortal | 377 lines | Medium-high: cinema scope plus rooms, seats, showtimes, pricing and dashboard/revenue |
| BookingPreparation | 362 lines | Medium-high: multi-request booking orchestration, selection and submit/error state |
| CinemaImageManager | 368 lines | High but cohesive: one resource domain with explicit owner and request guards |
| SupportPortal | 297 lines | Medium-high: queue, selection, detail, reference, timeline and writes |

LOC is not the issue by itself; Admin's unrelated domain responsibilities and shared state are the stronger signal. `CinemaImageManager` is similarly large, but its operations all belong to one resource and its current source includes request/ownership guards.

## G2. State management

- Global identity state is small and centralized in AuthContext.
- Feature state is local, appropriate for most pages.
- Admin, Support and CinemaImageManager use generation counters and refs to avoid applying stale responses or writes across resource switches.
- Public catalog pages more often use AbortController. Other modules rely on generation IDs. This diversity works in the current source but raises review and test burden.
- Portal selection state is not route state, reducing history and restoration.
- No shared query cache or state machine library is used. Do not add one without evidence that it solves an observed problem.

## G3. API integration

The API boundary is a positive architectural choice: pages call feature API modules, and a shared HTTP client handles JSON, credentials, auth token and status-bearing errors. No database objects are exposed to the frontend through the client contract. Existing source keeps business decisions such as booking, price and authorization on the server/database side.

The main improvement area is request lifecycle consistency: cancellation, generation checks, retry and state transitions are repeated in pages. Create a small documented async resource pattern before extracting helpers; preserve existing concurrency guards and error semantics.

## G4. Styling architecture

There is a coherent CSS token layer and shared global patterns. However, the whole design sits in one 1,635-line stylesheet with global selectors and a single responsive breakpoint. There are no CSS modules, feature style files or component library. This concentrates visual ownership and increases regression radius.

## G5. Maintainability and quality gates

The current frontend test, lint and production build gates pass. Test coverage is focused on source/React contracts and selected behavior. The package contains no browser E2E or accessibility automation dependency. Build output is one 545.57 kB minified JavaScript chunk; the production build warns at the 500 kB limit.

## Architecture score

**2.5/5 — viable incremental structure, with concentrated portal orchestration and global styling.** A full rebuild is unsupported by the evidence. Feature extraction can proceed incrementally after screen behavior and regression expectations are captured.

## Boundaries to protect

- REST contract and central HTTP error semantics.
- DBMS-first / Stored-Procedure-Only business authority.
- Auth session and role/permission semantics.
- Booking limits, deadlines, date/time conversion and payment state.
- Manager cinema scope.
- ADM-07 image ownership, request ordering and retry behavior.
- CSKH duplicate-write and stale-selection guards.

## Evidence

- `frontend/src/pages/AdminPortal.jsx` — 906 lines.
- `frontend/src/pages/ManagerPortal.jsx` — 377 lines.
- `frontend/src/pages/BookingPreparation.jsx` — 362 lines.
- `frontend/src/api/httpClient.js`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/components/CinemaImageManager.jsx`
- `frontend/src/index.css` — 1,635 lines.

---

<a id="responsive-accessibility-performance"></a>

## 08 — Responsive, Accessibility and Performance

## Verification status

This audit could not open a browser, run Playwright or capture screenshots. The source has an explicit 768 px media query, but actual viewport behavior is **NOT VERIFIED**. No axe/WCAG scan was run. Findings below distinguish source evidence from rendered outcomes.

## H1. Responsive source review

Positive source signals:

- Header navigation and catalog action groups use flex wrapping.
- Forms use wrapping controls.
- Tables are wrapped in an overflow-x container.
- A mobile breakpoint adjusts main padding, header padding, movie detail layout and seat-map padding.
- Body minimum width is 320 px.

Risks to verify:

- Only one media query exists, at 768 px; there is no separate mobile navigation pattern.
- The Admin section group can contain 18 buttons at every viewport and wraps into multiple rows rather than collapsing or grouping.
- The generic Admin table intentionally permits horizontal scrolling. Verify critical row actions remain reachable at 320/390 px.
- CSKH queue/detail stacking, processing forms and long timelines need 390 px and zoom checks.
- Seat map is a dense spatial control and needs pinch/scroll, keyboard and focus review.

## H2. Accessibility source review

Positive signals:

- Shared shell has a skip link, header, navigation, main and footer landmarks.
- Main navigation has a label; staff sub-navigation has accessible names and Admin `aria-pressed` states.
- Many input controls have native labels or `aria-label`; CSKH notices use status/alert roles.
- Error and loading states are shared components; form controls have visible focus styling in CSS.
- Seat controls have accessible labels according to existing tests.

Unverified or follow-up areas:

- No browser keyboard/focus journey was run; focus order, focus restoration and visible focus across every button are unknown.
- Admin tables generate headings from response property names and do not declare a caption or per-column scope in the generic renderer.
- CSKH case selection does not expose selected state with `aria-pressed` in the source.
- Contrast was not measured from rendered CSS; comments about token intent are not a WCAG result.
- No screen reader, zoom, reduced motion or automated axe check was available.

## H3. Performance

Current production build: 93 modules transformed; JS 545.57 kB minified / 159.04 kB gzip, CSS 26.79 kB / 5.27 kB gzip. Vite emits a chunk-size warning above 500 kB. Route components are statically imported in the central route module; there is no route-level lazy import in the current source.

This is a measurable bundle warning, not a measured user-visible delay. No browser timing, Core Web Vitals, network throttling or React Profiler data was captured. Treat route-level code splitting as a P3 improvement candidate and measure before/after on target devices.

## Quality gates run

| Check | Result |
|---|---|
| Frontend Node tests | 65 passed, 0 failed |
| Oxlint | Passed |
| Vite production build | Passed; warning for 545.57 kB JS chunk |
| Local dev HTTP smoke | Root and transformed route module returned HTTP 200 |
| Browser visual/responsive | Not verified |
| Accessibility automation | Not available/not run |
| End-to-end role journeys | Not verified in this audit |

## Evidence

- `frontend/src/index.css:1-71`, `:90-107`, `:1618-1635`
- `frontend/src/layouts/AreaLayout.jsx:11-90`
- `frontend/src/pages/AdminPortal.jsx:829-903`
- `frontend/src/pages/SupportPortal.jsx:145-289`
- Build and HTTP evidence in [production build evidence](#performance-build) and [local Vite smoke evidence](#local-vite-smoke).

---

<a id="user-flows"></a>

## 09 — User Flow Audit

## Method and limits

Flows were traced through route definitions, React components and API modules. No browser journey, account login or API write was performed. “Source trace” is not represented as a runtime pass.

| Actor / task | Source route and flow | Static assessment | Current runtime status |
|---|---|---|---|
| Guest discovers a movie | `/` → `/movies` → `/movies/:movieId` → showtime selection | Route sequence is clear; data loads through catalog APIs and shared loading/error states. | Not verified |
| Customer books seats | `/movies/:movieId` → `/booking/:showtimeId` → seat/product/promotion selection → booking submit | Components exist for each selection and limits; booking orchestration is concentrated in BookingPreparation. Database remains authority for availability/price. | Not verified |
| Customer pays and checks order | `/orders` → `/orders/:orderId` → payment route | Direct paths support refresh/deep link better than staff portal state. Payment API outcome remains authoritative. | Not verified |
| Customer raises a complaint | `/complaints` → `/complaints/:complaintId` | Dedicated list/detail routes exist; preserve them during restructuring. | Not verified |
| Manager changes cinema operations | Login → `/manager` → select cinema → room/seat/showtime/pricing/report sections | Scope selector is explicit; module state is on one page and not encoded in URL. | Not verified |
| CSKH handles a case | Login → `/support` → filter queue → select case → reference/timeline → processing or status update | Work pieces are present. Every filter change reloads and clears selection; case has no route. | Not verified |
| Admin edits a resource | Login → `/admin` → choose a flat section → inspect generic table → select row or create form → save | CRUD exists through shared form definitions; table exposes response fields and module context is not bookmarkable. | Not verified |
| Admin configures grants | `/admin` → permissions → type role ID → load grants → edit comma-separated permission IDs → save | Directly supported but relies on numeric identifiers and manual text for a security-sensitive task. | Not verified; no mutation attempted |

## Async and interaction safety review

The source has several defensive mechanisms: AbortController in catalog reads; request-generation counters in Support and Admin; ownership and current-context checks in CinemaImageManager; write-pending locks in several workflows; and server-owned business outcomes. These are strong foundations but are implemented through different local patterns.

No assertion is made that race conditions or duplicate writes currently occur. Current behavior under delayed, reordered, aborted and failed requests requires controlled browser/API fixtures to verify.

## Prioritized flow checks for the next browser audit

1. CSKH: type a search phrase, edit multiple filters, submit, select a case, return/back, refresh, and preserve/clear unsaved processing text deliberately.
2. Admin: use all-permission and partial-permission users; navigate directly to each module; grant and revoke using visible names; retry failed requests.
3. Admin image manager: replay A→B→A, stale list response, failed list retry, and writes pending during cinema switch. Historical R8.3 materials say these were checked after the earlier failure, but raw artifacts are absent here.
4. Manager: switch cinema while dashboard/resources are loading; ensure rows and writes stay in the selected scope.
5. Customer booking: expired hold, seat conflict, duplicate submit, API timeout, promotion rejection, payment failure and mobile seat map.
6. All roles: 390 px and 1440 px, keyboard-only, zoom, focus return, empty/error/loading states.

## Findings

FE-01 through FE-07 are detailed in the [Issue Register](#issue-register). Source trace is static evidence; no workflow was marked runtime verified.

---

<a id="root-causes"></a>

## 10 — Root Cause Analysis

## Executive diagnosis

The frontend does not show evidence of a failed framework or missing React foundation. The main problem is accumulated coupling at the portal and presentation layers: broad staff workflows are mounted as local sections inside large pages, API response shapes leak into generic tables, and shared CSS has grown without feature ownership. The browser-critical evidence needed to claim that every flow is currently sound is not present in this checkout.

## Root cause map

| Root cause | Evidence | User effect | Development effect | Confidence |
|---|---|---|---|---|
| Resource modules were accumulated inside one Admin workspace | AdminPortal is 906 lines and defines 18 sections, shared state, loaders and row/form actions | Staff scan a flat menu and lose direct links to current work | Small module edits can affect shared loading, selected row, notices and form state | High, static |
| UI tables are driven by response object shape | Generic table uses keys/entries from the first/all rows | Technical fields and wide columns burden scanning | DTO changes can alter visible columns without explicit UI review | High, static |
| Security administration is exposed as raw identifiers | Role ID input and comma-separated QuyenID field | Admin must know internal IDs and may select an unintended valid grant | No visible human-readable diff or typed permission set to test | High, static; misuse not observed |
| CSKH state transitions are tied to each filter edit | Loader depends on filters; changeFilter clears selection; form also submits loader | Search can feel noisy and case context disappears while filtering | Extra reads and interdependent queue/detail state increase test surface | High, static |
| Staff workflow state is not represented as route state | Only `/support`, `/admin`, `/manager`; sub-selections use local state | Refresh, browser back and deep links do not restore a specific task | Navigation, regression tests and support reproduction are harder | High, static |
| Styling is shared globally without feature ownership | One 1,635-line stylesheet and one 768 px media query | Portal-specific responsive needs are harder to target consistently | Visual fixes have a broad regression radius | High, static; effect not browser verified |
| Browser proof is not reproducible from current checkout | No Playwright dependency/tool; historical raw evidence referenced by docs is absent | Current screen quality and behavior cannot be independently rechecked here | Audit and future refactor lack a self-contained visual regression baseline | High, repository/tool inventory |

## Why frontend work feels difficult

Admin changes touch a large conditional component where active module, resource rows, edit state, notices, grants and complaint state coexist. Shared generic rendering reduces some duplication but makes each new resource depend on broad conventions. Support and Manager repeat their own async guards and section logic. CSS changes have no feature boundary. Existing tests offer good contract and behavior checks, but they do not replace route-level browser reproduction for layout, responsive and accessibility outcomes.

## Why UI feels hard to use

The customer side has route-level journeys. Admin and Manager expose many tasks on one screen, while CSKH combines queue and case processing with immediate filter side effects. Admin tables present fields as returned rather than helping answer a task question. The permission grant form is the clearest example where the UI exposes implementation identifiers instead of the operator's mental model.

## What is not a root cause

- React, Vite or React Router are not by themselves implicated.
- The frontend's thin REST client and DBMS-first business authority are appropriate boundaries.
- The source does not support a conclusion that all CRUD or business workflows are broken.
- Line count alone does not justify a rewrite; the responsibility and state coupling do.

## Order of causes to address

1. Add reproducible browser journeys and protect backend/business contracts.
2. Fix the grant workflow and CSKH task-state boundaries.
3. Introduce route-backed feature modules and curated table contracts.
4. Separate CSS ownership after shared patterns are identified.
5. Measure and split bundles based on route usage and target devices.

---

<a id="restructuring-readiness"></a>

## 11 — Restructuring Readiness

## Classification

| Area | Classification | Decision and basis |
|---|---|---|
| AuthContext, route guards and authorization helpers | KEEP | Small, explicit role/permission boundaries; existing tests cover role and grant behavior. |
| Shared HTTP client and API modules | KEEP | Maintains REST-only frontend boundary and status-bearing errors. |
| Catalog state primitives, StatusBadge and CSS tokens | KEEP | Useful common foundation; extend only with real repeated patterns. |
| Customer catalog, profile, order and complaint routes | KEEP / IMPROVE | Route separation supports navigation; verify rendered quality before visual changes. |
| Booking flow | REFACTOR incrementally | Orchestration is large and stateful, but limits, deadlines, API contract and payment behavior are regression-sensitive. |
| Manager portal | IMPROVE / REFACTOR | Separate task modules and possibly route state after observing real role tasks. |
| CSKH portal | REDESIGN CANDIDATE for information architecture | Queue/detail/action flow is present but local-state-only and filter behavior is inefficient. Preserve write and permission guards. |
| Admin portal | REDESIGN CANDIDATE for information architecture; REFACTOR component boundaries | Broad task set is flat and generic. Current evidence supports incremental modularization, not a full rebuild. |
| Global CSS | REFACTOR | Keep token values and identity; split ownership and document shared patterns. |
| Full frontend | No REBUILD recommendation | Build/tests pass; route/API/component foundations are usable and business behavior has extensive historical acceptance claims. |

## L1. Target architecture (proposal only)

```text
Application shell
├── Public / Customer portal
│   ├── catalog
│   ├── booking and payment
│   ├── orders and complaints
│   └── profile
├── Manager portal
│   ├── overview
│   ├── cinema operations
│   ├── schedules and pricing
│   └── revenue
├── CSKH portal
│   ├── queue route with applied filters
│   └── complaint detail route with timeline and actions
├── Admin portal
│   ├── identity and access
│   ├── cinema operations
│   ├── catalog and booking resources
│   └── customer service and reports
└── Shared UI patterns
    ├── buttons, fields, status and feedback
    ├── data table and filter bar
    ├── async state and confirmation
    └── design tokens and feature-owned styles
```

Feature modules own their screen state and call the existing API modules. Route state carries safe navigation context such as selected module/case; sensitive values remain out of URLs. Business calculations, authorization and database decisions stay in the backend/Stored Procedures.

## L2. Risk assessment

| Risk | Likelihood | Impact | Protection |
|---|---|---|---|
| Route or direct-link regression | Medium | High for staff task restoration | Define route map and backward-compatible redirects; test all 45 use cases |
| RBAC navigation drift | Medium | High | Preserve role/permission contract and test full, partial and revoked grants |
| API contract mismatch | Low-medium | High | Keep API modules stable; use request/response fixtures and contract tests |
| CRUD behavior changes during extraction | Medium | High | Move one feature at a time; compare payloads and server validation outcomes |
| Lost unsaved state on route change | Medium | Medium | Define draft preservation/confirmation behavior before route conversion |
| Async race/double submit regression | Medium | High for wrong resource/write attempts | Preserve generation/ownership guards; run controlled reversed-response cases |
| Visual or responsive regression | Medium | Medium | Capture baseline screenshots and keyboard/viewport checks before style work |
| Business logic migrates into frontend | Low if boundary is explicit | Critical | Keep DBMS-first policy as an acceptance gate; frontend displays server results only |

## L3. Suggested sequence

1. Recover or recreate test-only browser fixtures and baseline screenshots; verify current accepted ADM-07 cases.
2. Improve permission grants as a small isolated feature with preview and tests.
3. Split Admin routing/module ownership without changing API payloads or visual identity.
4. Curate Admin tables and add selection/filter/pagination only where data volume requires it.
5. Give CSKH an applied-filter model and deep-linkable case detail; preserve write locks and permissions.
6. Split shared CSS by shell/primitives/features while holding token values constant.
7. Extract Manager and booking modules in small slices after portal tests exist.
8. Measure startup and route navigation; apply lazy imports only if the result justifies the added boundaries.

## Compatibility requirements

- Preserve all 45 use-case IDs and route/API semantics unless an explicit migration is accepted.
- Preserve frontend role checks as UX and backend/database authorization as authority.
- Preserve booking limits, time zone conversion, hold/payment rules, manager scope, complaint transitions and image ownership checks.
- Add verification for empty/error/retry, 401/403, duplicate submit, stale response, refresh/back and direct links.
- Do not infer a database or backend change from a frontend UX problem.

## Readiness verdict

**Ready for incremental restructuring after browser evidence is restored.** Admin and CSKH merit task-flow redesign research. No full rebuild is supported. Design token values should be preserved while component and style ownership are clarified.

---

<a id="issue-register"></a>

## Frontend Issue Register

## Severity and verification rules

- **P0:** confirmed app-wide outage, data corruption or authorization escape.
- **P1:** major role workflow is blocked or a high-consequence action has a strong usability risk.
- **P2:** significant recurring usability or maintainability cost.
- **P3:** measurable optimization or lower-impact consistency work.

The source fields below are confirmed by static inspection. “Observed behavior” describes source behavior unless explicitly marked runtime. No interactive issue was observed in a browser during this audit.

## Distribution

| Severity | Count | Notes |
|---|---:|---|
| P0 | 0 | No confirmed outage, data corruption or authorization bypass. |
| P1 | 1 | High-consequence role-permission configuration is exposed as raw IDs. |
| P2 | 5 | Admin architecture/table, CSKH query and context, shared styling ownership. |
| P3 | 1 | Production bundle warning. |
| **Total** | **7** | Static evidence; runtime impact remains unverified where noted. |

## FE-01 — Admin workspace combines 18 sections in one route and component

**Severity:** P2  
**Category:** Information architecture / frontend architecture  
**Affected portal:** Admin  
**Affected route:** `/admin`  
**Affected component:** AdminPortal / AdminWorkspace  
**Source file:** `frontend/src/pages/AdminPortal.jsx`, lines 14–33, 79–133, 178–207, 483–522, 699–906  
**Confidence:** HIGH CONFIDENCE  
**Verification status:** STATIC VERIFIED

**Problem description:** Eighteen section definitions, route-level permissions, loaders, form state, generic table rendering, CRUD, grants, complaint handling and reports are concentrated in one 906-line page. Section changes are local state; the path remains `/admin`.

**Observed behavior:** Source shows a flat section button group and one AdminWorkspace owning resource and complaint state. No browser observation was made.

**Expected behavior:** Each task area should have a clear group and stable route/deep link, with feature state isolated enough to review and test independently.

**User impact:** Users with broad grants scan many peer actions and cannot bookmark or restore the active module through route history.

**Root cause:** Resource features accumulated inside a single portal rather than being grouped around staff tasks.

**Reproduction steps:** Open `/admin`; inspect section definitions; switch one section and observe in source that selection does not update route state.

**Evidence:** [AdminPortal](../../../frontend/src/pages/AdminPortal.jsx#L14), [route table](../../../frontend/src/routes/index.jsx#L151). Static source only.

**Recommended direction:** Group sections by task, add route-backed modules, and extract one feature at a time while preserving permission gates and API contracts.

**Estimated complexity:** High  
**Regression risk:** High

## FE-02 — Admin tables mirror raw response objects

**Severity:** P2  
**Category:** UX / data presentation  
**Affected portal:** Admin  
**Affected route:** `/admin`  
**Affected component:** AdminWorkspace generic table  
**Source file:** `frontend/src/pages/AdminPortal.jsx`, lines 58–65 and 829–903; `frontend/src/index.css`, lines 997–1027  
**Confidence:** HIGH CONFIDENCE  
**Verification status:** STATIC VERIFIED

**Problem description:** Headers are generated from every key on the first response row and each row prints every object entry. The table uses horizontal overflow and has no search/sort/paging controls in this rendering block.

**Observed behavior:** Source behavior is confirmed; actual row counts, widths and operator comprehension were not observed.

**Expected behavior:** Each resource should expose curated, human-readable fields and primary actions, with find/sort/page behavior appropriate to returned list size.

**User impact:** Technical DTO fields can dominate the view, make scanning difficult and widen the table. API response shape becomes an implicit visual contract.

**Root cause:** Generic object rendering was used to cover many resources in one screen.

**Reproduction steps:** Select a data-backed Admin section; compare rendered column construction to `Object.keys(rows[0])` and row construction to `Object.entries(row)`.

**Evidence:** [Admin table source](../../../frontend/src/pages/AdminPortal.jsx#L829), [table styles](../../../frontend/src/index.css#L997). Static source only.

**Recommended direction:** Add per-resource column definitions and task-specific row actions; use pagination/filtering only where collection size supports it.

**Estimated complexity:** Medium  
**Regression risk:** Medium

## FE-03 — RETIRED: historical role grants require manual numeric IDs

**Current decision:** remove the entire grant workflow. The diagnosis below is historical; no selector, grant editor or write route will replace it.

**Severity:** P1  
**Category:** Admin workflow / permission safety  
**Affected portal:** Admin  
**Affected route:** `/admin` → permissions  
**Affected component:** AdminWorkspace grant form  
**Source file:** `frontend/src/pages/AdminPortal.jsx`, lines 523–550  
**Confidence:** HIGH CONFIDENCE  
**Verification status:** STATIC VERIFIED

**Problem description:** The operator enters a numeric role ID, loads current grants, edits a comma-separated list of QuyenID values, then saves. The workflow does not present role names and permission choices in the grant form or a before/after permission diff.

**Observed behavior:** The raw-ID workflow is explicit in the form source. No grant was submitted and no incorrect access result was observed.

**Expected behavior:** An administrator should identify the role and permissions by their names, review the exact grants to add/remove, and confirm the change before submit.

**User impact:** A mistyped or unintended valid permission ID can change staff access. This is a high-consequence operator error risk, not evidence of a backend authorization flaw.

**Root cause:** Database/API identifiers are exposed directly instead of presenting an access-management task model.

**Reproduction steps:** Open Admin permissions section and inspect the role ID and QuyenID controls; no runtime mutation is needed to verify the interaction design.

**Evidence:** [Grant form](../../../frontend/src/pages/AdminPortal.jsx#L523). Static source only.

**Recommended direction:** Use a role-name selector and permission checklist, show current vs proposed permissions, and require an explicit review before saving. Preserve server-side validation and audit behavior.

**Estimated complexity:** Medium  
**Regression risk:** High

## FE-04 — CSKH filtering reloads on each edit and again on submit

**Severity:** P2  
**Category:** Workflow / async efficiency  
**Affected portal:** CSKH  
**Affected route:** `/support`  
**Affected component:** SupportWorkspace  
**Source file:** `frontend/src/pages/SupportPortal.jsx`, lines 40–77, 90–102, 145–185  
**Confidence:** HIGH CONFIDENCE  
**Verification status:** STATIC VERIFIED

**Problem description:** Queue loading depends on the filters object. Every filter change updates that object and triggers the effect; typing into search can therefore request on each keystroke. The form submit handler calls the same loader again. Every filter change also clears selection and detail.

**Observed behavior:** Confirmed from the state/effect wiring; network request frequency was not observed in a browser.

**Expected behavior:** A predictable query commit boundary: explicit apply, or deliberate debounce with clear feedback. Repeated edits should not produce avoidable requests, and case context should not disappear unexpectedly.

**User impact:** Noisy waiting/refresh behavior, repeated reads and loss of current case context during search refinement.

**Root cause:** Draft filter values and applied query state are the same state object, coupled to an auto-running effect while retaining an explicit submit button.

**Reproduction steps:** Type a multi-character search term, then press the filter button; source predicts one queue effect per changed value plus the submit load.

**Evidence:** [Support filter state and effects](../../../frontend/src/pages/SupportPortal.jsx#L40), [filter form](../../../frontend/src/pages/SupportPortal.jsx#L145). Static source only.

**Recommended direction:** Separate draft and applied filters or debounce search; avoid duplicate submit reads; define how selected case and unsaved processing text behave when query changes.

**Estimated complexity:** Medium  
**Regression risk:** Medium

## FE-05 — CSKH case and queue context are not route-addressable

**Severity:** P2  
**Category:** Navigation / work context  
**Affected portal:** CSKH  
**Affected route:** `/support`  
**Affected component:** SupportWorkspace  
**Source file:** `frontend/src/pages/SupportPortal.jsx`, lines 21–38; `frontend/src/routes/index.jsx`, lines 118–134  
**Confidence:** HIGH CONFIDENCE  
**Verification status:** STATIC VERIFIED

**Problem description:** Selected complaint and filters are only component state; there is only one `/support` route and no complaint ID or filter query state.

**Observed behavior:** Source does not update route state on selection. Browser-back/refresh behavior was not exercised.

**Expected behavior:** An operator can reopen a case directly, share an internal case URL when authorized, and return to a queue state without losing useful context.

**User impact:** Refresh, history navigation or sharing a case reference cannot restore the working case and applied filters.

**Root cause:** Work context is modeled as ephemeral local state instead of navigable task state.

**Reproduction steps:** Select a queue item in the current source flow; inspect the route definition and state owner. No live case was opened.

**Evidence:** [Support state](../../../frontend/src/pages/SupportPortal.jsx#L21), [Support route](../../../frontend/src/routes/index.jsx#L118). Static source only.

**Recommended direction:** Add a complaint detail route and safe query parameters for applied filters; do not encode sensitive content or draft text in the URL.

**Estimated complexity:** Medium  
**Regression risk:** Medium-high

## FE-06 — Global stylesheet has no feature ownership

**Severity:** P2  
**Category:** Styling architecture / responsive risk  
**Affected portal:** Shared, Admin, CSKH, Manager, Customer  
**Affected route:** All routes  
**Affected component:** Global stylesheet  
**Source file:** `frontend/src/index.css`, lines 1–71 and 1618–1635  
**Confidence:** HIGH CONFIDENCE  
**Verification status:** STATIC VERIFIED

**Problem description:** All UI styling is concentrated in one 1,635-line global stylesheet. It has a single media query at 768 px; staff-specific navigation, tables and workspaces do not have a separate responsive pattern layer.

**Observed behavior:** File scope and breakpoint count are static facts. No rendered overflow or style collision was observed.

**Expected behavior:** Shared tokens should remain centralized, while shell, primitives and feature layouts have clear ownership and viewport behavior.

**User impact:** Responsive issues can be hard to isolate and a local style change can affect unrelated portal pages. Actual breakage remains unverified.

**Root cause:** Styles were centralized for reuse without later feature-level ownership boundaries.

**Reproduction steps:** Inspect stylesheet length, selectors and media query; compare the single mobile override with the Admin and CSKH surface area.

**Evidence:** [Token and shell styles](../../../frontend/src/index.css#L1), [only responsive query](../../../frontend/src/index.css#L1618). Static source only.

**Recommended direction:** Preserve token values; split style ownership by shell, shared primitives and feature modules, then validate screenshots at 320/390/768/1440 px.

**Estimated complexity:** Medium  
**Regression risk:** Medium-high

## FE-07 — Production bundle exceeds Vite warning threshold

**Severity:** P3  
**Category:** Performance / bundling  
**Affected portal:** All routes  
**Affected route:** Initial app load  
**Affected component:** App route bundle  
**Source file:** `frontend/src/routes/index.jsx` (static imports); `frontend/package.json`  
**Confidence:** HIGH CONFIDENCE  
**Verification status:** STATIC VERIFIED

**Problem description:** Production build emits one JavaScript chunk at 545.57 kB minified (159.04 kB gzip), above Vite's 500 kB warning threshold. Route components are statically imported.

**Observed behavior:** Build output warning was reproduced. No actual browser download or interaction timing was measured.

**Expected behavior:** Startup and route navigation should meet agreed performance budgets on target devices.

**User impact:** Potentially slower first load on constrained devices, particularly where users need only a small public route.

**Root cause:** The SPA route graph is bundled as a single eager client entry.

**Reproduction steps:** Run `npm.cmd --prefix frontend run build` and inspect emitted asset sizes and warning.

**Evidence:** Current Vite production build; full metrics in [build evidence](#performance-build). No browser timing evidence.

**Recommended direction:** Measure startup and route use first, then consider route-level dynamic imports and verify the change against a defined budget.

**Estimated complexity:** Low-medium  
**Regression risk:** Low-medium

---

<a id="page-scorecard"></a>

## Frontend Page Scorecard

## Scoring method

Scores are 1–5, source review estimates, not usability study results. UX and architecture scores use route/component evidence. Visual scores are styling proxies only; browser screenshots were unavailable. Risk is restructuring regression risk: Low, Medium or High. Verdicts use KEEP, IMPROVE, REFACTOR or REDESIGN CANDIDATE; none implies that a change was implemented.

| Portal | Route | UX | Visual | Architecture | Risk | Verdict |
|---|---|---:|---:|---:|---|---|
| Customer | `/` | 3 | 3* | 3 | Medium | KEEP / IMPROVE — shared catalog states and home discovery exist; live fold not reviewed. |
| Customer | `/movies` | 3 | 3* | 3 | Medium | KEEP — route and filters are distinct; verify search behavior in browser. |
| Customer | `/movies/:movieId` | 3 | 3* | 3 | Medium | KEEP / IMPROVE — details, showtimes and reviews are mapped; verify page density. |
| Customer | `/cinemas` | 3 | 3* | 3 | Low | KEEP — dedicated list route and shared states. |
| Customer | `/cinemas/:cinemaId` | 3 | 3* | 3 | Low | KEEP — dedicated detail and gallery components. |
| Customer | `/booking/:showtimeId` | 3 | 3* | 2 | High | REFACTOR — useful selection components, but 362-line orchestration and business regressions need protection. |
| Shared | `/login` | 3 | 3* | 3 | Medium | KEEP — isolated auth form and shared session handling. |
| Shared | `/register` | 3 | 3* | 3 | Medium | KEEP — isolated registration route and role not client-selectable. |
| Shared | `/forbidden` | 3 | 3* | 3 | Low | KEEP — explicit access-denied route. |
| Shared | `/profile` | 3 | 3* | 3 | Medium | KEEP — authenticated, role-aware profile fields. |
| Customer | `/orders` | 3 | 3* | 3 | High | KEEP — direct route and dedicated history page; verify empty/error paths live. |
| Customer | `/orders/:orderId` | 3 | 3* | 3 | High | KEEP — direct detail route and server-owned order state. |
| Customer | `/orders/:orderId/payment` | 3 | 3* | 3 | High | KEEP — direct payment route; high regression sensitivity. |
| Customer | `/complaints` | 3 | 3* | 3 | Medium | KEEP — list/create route separation exists. |
| Customer | `/complaints/:complaintId` | 3 | 3* | 3 | Medium | KEEP — direct detail route. |
| Manager | `/manager` | 2.7 | 2.5* | 2.5 | High | IMPROVE — nine use cases share one workspace and local scope. |
| CSKH | `/support` | 2.2 | 2.5* | 2 | High | REDESIGN CANDIDATE — queue, case and actions lack deep links; filters trigger redundant reads. |
| Customer | `/account` | 3 | 3* | 3 | Low | KEEP — simple role-protected shortcut hub. |
| Admin | `/admin` | 2.1 | 2.5* | 1.5 | High | REDESIGN CANDIDATE — flat 18-section IA, generic tables, raw grant IDs and monolithic page. |
| Shared | `*` | 3 | 3* | 3 | Low | KEEP — explicit not-found route inside public shell. |

*Visual proxy based on shared CSS classes/tokens, not a rendered screenshot.

## Portal overview

| Portal | UX | Visual proxy | Architecture | Evidence confidence |
|---|---:|---:|---:|---|
| Customer | 3.3 | 3.0 | 2.9 | Medium; static routes/tests, no browser run |
| Manager | 2.7 | 2.5 | 2.5 | Medium-low; static page only |
| CSKH | 2.2 | 2.5 | 2.0 | High for source issues; no runtime observation |
| Admin | 2.1 | 2.5 | 1.5 | High for architecture; no runtime observation |

Scores are comparative audit judgments. They should not be read as independent usability measurements.

---

<a id="use-case-coverage"></a>

## Frontend Use Case Coverage

## Baseline and status interpretation

The official scope is exactly 45 use cases: Customer 14, Manager 9, CSKH 6, Admin 16. ADM-17 is excluded. The current repository matrix and later re-acceptance/system audit report 45/45 PASS. The older R8.3 checkpoint records the pre-hotfix ADM-07 state. This checkout does not include the referenced raw acceptance artifacts.

“Historical PASS” is the status in retained repository documents. “Current runtime: not verified” is this audit's status: the audit did not replay any business journey. A static route/component mapping is not proof that a workflow currently succeeds end to end.

| UC ID | Role | Use case | Route/page | Component mapping | UI flow mapping | Known issue | UI readiness | Runtime evidence |
|---|---|---|---|---|---|---|---|---|
| KH-01 | Customer | Đăng ký | `/register` | Register | Enter customer details → submit → login | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| KH-02 | Customer | Đăng nhập | `/login` | Login, AuthContext | Credentials → session → return to app | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| KH-03 | Customer | Hồ sơ | `/profile` | Profile, AuthContext | Load current user → edit allowed profile fields → save | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| KH-04 | Customer | Xem phim/list/detail | `/movies`, `/movies/:movieId` | Movies, MovieGrid, MovieDetail | Browse/search → open movie | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| KH-05 | Customer | Xem lịch chiếu | `/movies/:movieId`, `/booking/:showtimeId` | MovieDetail, ShowtimeBrowser | Choose cinema/date → choose showtime | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| KH-06 | Customer | Chọn ghế | `/booking/:showtimeId` | BookingPreparation, SeatMap | Load seats → select available seats | Global FE-06/07 only | Mapped; static; regression-sensitive | Historical PASS; current runtime not verified |
| KH-07 | Customer | Đặt vé | `/booking/:showtimeId` | BookingPreparation, HoldDeadline | Review selection → submit booking → show hold result | Global FE-06/07 only | Mapped; static; regression-sensitive | Historical PASS; current runtime not verified |
| KH-08 | Customer | Đồ ăn kèm vé | `/booking/:showtimeId` | ProductPicker, BookingPreparation | Select product quantities → submit with booking | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| KH-09 | Customer | Khuyến mãi | `/booking/:showtimeId` | BookingPreparation | Enter code → validate → review server response | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| KH-10 | Customer | Thanh toán | `/orders/:orderId/payment` | PaymentPage, HoldDeadline | Load order/hold → create payment attempt → show outcome | Global FE-06/07 only | Mapped; static; regression-sensitive | Historical PASS; current runtime not verified |
| KH-11 | Customer | Lịch sử đơn | `/orders` | Orders, StatusBadge | Load own orders → open detail | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| KH-12 | Customer | Chi tiết đơn | `/orders/:orderId` | OrderDetail, HoldDeadline | Load order and payment state | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| KH-13 | Customer | Đánh giá | `/movies/:movieId` | MovieDetail, MovieReviews | Load reviews → submit eligible review | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| KH-14 | Customer | Khiếu nại | `/complaints`, `/complaints/:complaintId` | Complaints, ComplaintDetail | Create complaint → open status/timeline | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| QLR-01 | Manager | Đăng nhập/rạp phân công | `/login`, `/manager` | Login, RequireRole, ManagerPortal | Authenticate → load allowed cinema scope | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| QLR-02 | Manager | Quản lý phòng | `/manager` | ManagerPortal, ManagerResourceForm | Select cinema → create/update room | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| QLR-03 | Manager | Quản lý sơ đồ ghế | `/manager` | ManagerPortal | Choose room → view and update seats | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| QLR-04 | Manager | Tạo suất chiếu | `/manager` | ManagerPortal, ManagerResourceForm | Select cinema/resource → create showtime | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| QLR-05 | Manager | Sửa suất chiếu | `/manager` | ManagerPortal, ManagerResourceForm | Select showtime → hydrate fields → update | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| QLR-06 | Manager | Hủy suất chiếu | `/manager` | ManagerPortal | Select showtime → request cancellation | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| QLR-07 | Manager | Cấu hình bảng giá | `/manager` | ManagerPortal, ManagerResourceForm | Select cinema/day type → create/update price | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| QLR-08 | Manager | Dashboard hoạt động rạp | `/manager` | ManagerPortal | Select cinema → view dashboard metrics | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| QLR-09 | Manager | Doanh thu rạp | `/manager` | ManagerPortal, ManagerRevenue | Select cinema/date range → view revenue | Global FE-06/07 only | Mapped; static | Historical PASS; current runtime not verified |
| CSKH-01 | CSKH | Đăng nhập | `/login`, `/support` | Login, RequireRole, SupportPortal | Authenticate with support role/permission | FE-04/05, global FE-06/07 | Mapped; workflow should be reviewed | Historical PASS; current runtime not verified |
| CSKH-02 | CSKH | Hàng chờ khiếu nại | `/support` | SupportWorkspace | Set filters → load queue → select case | FE-04/05, global FE-06/07 | Mapped; filters and route context need improvement | Historical PASS; current runtime not verified |
| CSKH-03 | CSKH | Chi tiết khiếu nại | `/support` | SupportWorkspace | Select case → inspect content/timeline | FE-05, global FE-06/07 | Mapped; no case deep link | Historical PASS; current runtime not verified |
| CSKH-04 | CSKH | Đơn tham chiếu | `/support` | ComplaintOrderReference | Select case → request authorized order reference | FE-05, global FE-06/07 | Mapped; static | Historical PASS; current runtime not verified |
| CSKH-05 | CSKH | Ghi lần xử lý | `/support` | SupportWorkspace | Enter processing note/status → save → reload detail | FE-04/05, global FE-06/07 | Mapped; preserve write/refresh guards | Historical PASS; current runtime not verified |
| CSKH-06 | CSKH | Đổi trạng thái | `/support` | SupportWorkspace | Select case → choose next status → save | FE-04/05, global FE-06/07 | Mapped; preserve write/permission guards | Historical PASS; current runtime not verified |
| ADM-01 | Admin | Đăng nhập | `/login`, `/admin` | Login, RequireRole, AdminPortal | Authenticate → render permitted sections | FE-01, global FE-06/07 | Mapped; static | Historical PASS; current runtime not verified |
| ADM-02 | Admin | Tài khoản người dùng | `/admin` → users | AdminWorkspace | Load user rows → select/edit or change status | FE-01/02, global FE-06/07 | Mapped; table UX concern | Historical PASS; current runtime not verified |
| ADM-03 | Admin | Vai trò | `/admin` → roles | AdminWorkspace | Load roles → create/update | FE-01/02, global FE-06/07 | Mapped; static | Historical PASS; current runtime not verified |
| ADM-04 | Admin | Danh mục quyền | `/admin` → permissions | AdminWorkspace | Load permission catalog | FE-01/02, global FE-06/07 | Mapped; static | Historical PASS; current runtime not verified |
| ADM-05 | Admin | Gán quyền vai trò | `/admin` → permissions/grants | AdminWorkspace | Enter role ID → load IDs → edit CSV → save | FE-01/03, global FE-06/07 | Mapped; high-consequence UX risk | Historical PASS; current runtime not verified |
| ADM-06 | Admin | Phân công quản lý | `/admin` → assignments | AdminWorkspace | Load assignment rows → create/update assignment | FE-01/02, global FE-06/07 | Mapped; static | Historical PASS; current runtime not verified |
| ADM-07 | Admin | Rạp và hình ảnh | `/admin` → cinemas/cinemaImages | AdminWorkspace, CinemaImageManager | Manage cinema → select cinema → manage images | FE-01/02, global FE-06/07; verify historical hotfix | Mapped; current source has ownership/request guards | Historical PASS in later re-acceptance; current runtime not verified |
| ADM-08 | Admin | Phòng và ghế toàn hệ | `/admin` → rooms/seats | AdminWorkspace | Load and manage room/seat resources | FE-01/02, global FE-06/07 | Mapped; table UX concern | Historical PASS; current runtime not verified |
| ADM-09 | Admin | Phim và diễn viên | `/admin` → movies/actors | AdminWorkspace | Manage movies; edit cast JSON | FE-01/02, global FE-06/07 | Mapped; cast editor is technical | Historical PASS; current runtime not verified |
| ADM-10 | Admin | Thể loại | `/admin` → genres | AdminWorkspace | Load and manage genre catalog | FE-01/02, global FE-06/07 | Mapped; table UX concern | Historical PASS; current runtime not verified |
| ADM-11 | Admin | Sản phẩm đồ ăn | `/admin` → products | AdminWorkspace | Load and manage products | FE-01/02, global FE-06/07 | Mapped; table UX concern | Historical PASS; current runtime not verified |
| ADM-12 | Admin | Chương trình khuyến mãi | `/admin` → promotions | AdminWorkspace | Load and manage promotions | FE-01/02, global FE-06/07 | Mapped; table UX concern | Historical PASS; current runtime not verified |
| ADM-13 | Admin | Bảng giá toàn hệ | `/admin` → pricing | AdminWorkspace | Load and manage price rules | FE-01/02, global FE-06/07 | Mapped; table UX concern | Historical PASS; current runtime not verified |
| ADM-14 | Admin | Suất chiếu toàn hệ | `/admin` → showtimes | AdminWorkspace | Load/update/cancel showtimes | FE-01/02, global FE-06/07 | Mapped; table UX concern | Historical PASS; current runtime not verified |
| ADM-15 | Admin | Xử lý khiếu nại | `/admin` → complaints | AdminWorkspace | Open complaint/reference/timeline → process/status | FE-01/02, global FE-06/07 | Mapped; same-route detail and table concern | Historical PASS; current runtime not verified |
| ADM-16 | Admin | Báo cáo toàn hệ | `/admin` → dashboard/revenue | AdminWorkspace, AdminRevenue | Select report → set date range → view metrics | FE-01, global FE-06/07 | Mapped; static | Historical PASS; current runtime not verified |

## Coverage conclusion

All 45 use cases have a statically identifiable route or portal section and component mapping. No “missing UI” claim is supported by this source audit. This means only that UI entry points and code paths exist; it does not prove API success, data correctness, permissions or workflow completion. Current runtime coverage is 0/45 in this audit; historical accepted coverage is 45/45 in retained repository documents.

---

<a id="restructuring-backlog"></a>

## Frontend Restructuring Backlog

Proposal only. Nothing in this backlog was implemented during the audit.

| Task ID | Objective | Affected modules | Related issues | Expected UX improvement | Architecture dependency | Complexity | Risk | Priority | Acceptance criteria | Regression test requirements |
|---|---|---|---|---|---|---|---|---|---|---|
| FE-BL-00 | Restore reproducible browser baseline for 45 UCs and current ADM-07 cases | All portals; test fixtures; evidence | All | Gives teams verifiable current behavior before redesign | Test-only accounts and isolated data/backend required | High | High | P1 | Each official UC has a browser entry point, assertions, role, route and evidence status; no production data mutation | 45 primary journeys; auth/RBAC; 390/1440 widths; errors/retry; ADM-07 A→B→A and no-write rejection |
| FE-BL-01 | RETIRED — remove RBAC mutation workflows | Historical Admin permissions/grants | FE-03; ADM-03/04/05 RETIRED | Four fixed roles and immutable seed matrix | Retire write APIs and disable seven write SPs; preserve auth reads | Closed by fixed RBAC decision | High | RETIRED | No role/permission/grant menu, form or mutation; account role selected only at creation | API/SP no-write checks; fixed matrix; four-role login; immutable account role; Manager assignment scope |
| FE-BL-02 | Split Admin modules and add stable section routes | Admin routing, AdminPortal features | FE-01 | Direct links, clearer groups and smaller task screens | Preserve current shell, auth guard and API modules | High | High | P1 | Every permitted section has stable path; denied section remains inaccessible; refresh/back restores active section; no route loses current API behavior | ADM-01..16, partial grants, direct URLs, refresh/back, route fallback, write/error/async guards |
| FE-BL-03 | Define curated tables per Admin resource | Admin table and resource definitions | FE-02 | Improves scanability and focuses row actions | Feature column contracts and current DTOs | Medium | Medium | P2 | Each resource documents columns, human labels, primary identifiers and row actions; long list behavior is explicit | all Admin list/edit flows, empty response, extra DTO property, long values, horizontal viewport, keyboard actions |
| FE-BL-04 | Make CSKH filters deliberate and cases deep-linkable | Support routes, queue, detail, forms | FE-04, FE-05 | Less request churn and better context recovery | Add safe route/query state; preserve permission checks | Medium-high | High | P1 | Search is debounced or applied explicitly; changing filters has defined selection behavior; selected case survives refresh/back; drafts are protected | CSKH-01..06, request-count test, reordered responses, failed retry, unsaved text, duplicate writes, forbidden reference |
| FE-BL-05 | Define feature-owned style and responsive patterns | Shared CSS, portal navigation/tables/forms | FE-06 | Portal layouts can be tuned without broad visual side effects | Shared token and primitive inventory | Medium | Medium-high | P2 | Token values remain stable; shell/primitives/features have scoped ownership; 320/390/768/1440 screenshots reviewed | all page scorecard routes, keyboard/focus, overflow, high zoom, theme/status contrast |
| FE-BL-06 | Measure and selectively split route bundles | App routes and Vite build | FE-07 | Potentially faster initial route load | Performance budget and route-use data | Low-medium | Low-medium | P3 | Initial bundle and route chunks measured on a defined baseline; no material regression in navigation or error handling | production build budget, cold-load and route transition tests, direct/deep-link refresh |

---

<a id="accessibility-evidence"></a>

## Accessibility Static Review

## Present in source

- Shared shell includes a skip link, header, labeled navigation, main content and footer.
- Forms use native inputs/selects/textareas; many controls have explicit labels or accessible names.
- Admin portal section buttons expose `aria-pressed` state.
- CSKH write feedback uses status/alert roles.
- Shared loading/empty/error components exist.
- CSS contains visible focus rules for the skip link and catalog form fields.

## Follow-up evidence needed

- No keyboard-only browser run or focus restoration check.
- No screen reader review, zoom/reflow inspection or reduced-motion check.
- No rendered contrast measurement or axe/WCAG automation.
- Admin generic table has generated headings without a table caption or explicit per-column scope in its renderer.
- CSKH case list buttons do not expose selected state in the source.

**Status:** Static review only. No WCAG conformance claim is made.

---

<a id="frontend-check-evidence"></a>

## Frontend Check Results

**Date:** 2026-10-11 (Asia/Bangkok)  
**Commands:**

- `npm.cmd --prefix frontend test`
- `npm.cmd --prefix frontend run lint`
- `npm.cmd --prefix frontend run build`

| Check | Result |
|---|---|
| Node test runner | 65 passed; 0 failed, skipped or todo |
| Oxlint | Exit 0; no findings printed |
| Vite production build | Exit 0; 93 modules transformed |
| Chunk warning | JavaScript output is 545.57 kB minified, above 500 kB threshold |

The test command caused Vite to re-optimize dependencies because the config had changed. No application source was edited. These checks do not replace route-level browser or end-to-end verification.

---

<a id="local-vite-smoke"></a>

## Local Vite HTTP Smoke

**Date:** 2026-10-11 (Asia/Bangkok)  
**Purpose:** Confirm that the current frontend dev server starts and serves its SPA document and transformed route module. This is not a browser journey.

| Request | Result |
|---|---|
| `GET http://127.0.0.1:5173/` | HTTP 200, `text/html` |
| `GET http://127.0.0.1:5173/src/routes/index.jsx` | HTTP 200, transformed module response length 28,844 bytes |

Vite reported ready on port 5173. The process was stopped after the requests. No backend, database or business write was invoked. This evidence does not verify rendering, route interactions, authentication, API behavior, accessibility or responsiveness.

---

<a id="performance-build"></a>

## Production Build Summary

**Date:** 2026-10-11 (Asia/Bangkok)  
**Command:** `npm.cmd --prefix frontend run build`

| Artifact | Minified size | Gzip size |
|---|---:|---:|
| `dist/index.html` | 0.80 kB | 0.46 kB |
| JavaScript entry | 545.57 kB | 159.04 kB |
| CSS | 26.79 kB | 5.27 kB |

Vite transformed 93 modules and completed successfully. It warned that a chunk exceeded its 500 kB threshold. No browser timing, CPU profile, cache behavior, route transition or Core Web Vitals were measured. The warning is a bundle-size signal, not proof of a user-visible latency defect.

---

<a id="screenshots"></a>

## Screenshots

No screenshots were captured for this audit. Browser automation and a browser inspection tool were unavailable in the session. This directory is reserved for future route-, role- and viewport-named captures. No visual result is implied by the empty directory.

---
