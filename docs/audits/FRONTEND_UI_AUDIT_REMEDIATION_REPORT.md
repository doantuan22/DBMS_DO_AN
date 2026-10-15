# Báo cáo khắc phục Frontend UI Audit — CinemaStar

Ngày: 15/10/2026  
Phạm vi: 14 phát hiện trong `docs/audit/FRONTEND_UI_AUDIT.md`; frontend React, các bài kiểm thử frontend và browser audit. Không sửa backend, API contract, stored procedure, schema DB hay RBAC phía server.

## A. Tóm tắt

- Tổng số phát hiện: **14**.
- Đã khắc phục và xác minh: **14**.
- Chưa khắc phục: **0**.
- Blocked: **0**.
- Unit/component tests: **252/252 PASS**.
- Browser E2E cuối: **67 PASS / 0 FAIL / 0 SKIP** trên Microsoft Edge/Playwright, ghi dữ liệu vào `CinemaBookingDB_Test` bằng `CinemaTestUser`.
- axe-core: **44 route × 4 viewport = 176 lượt**, không có vi phạm WCAG 2.2 A/AA được phát hiện.
- Build production: PASS. Lint: exit code 0, còn 7 warning ở component không thuộc phần sửa.

Đã giữ luồng DBMS-first và quyền ở backend. Các luồng booking, thanh toán, quyền Manager, khiếu nại, lịch sử, chống ghi trùng và xử lý response cũ vẫn qua regression/E2E tương ứng.

### Tài liệu tham chiếu

Đã đọc audit chính `docs/audit/FRONTEND_UI_AUDIT.md`. Không tìm thấy các tài liệu được yêu cầu theo đúng tên trong repository và Downloads: `MASTER_FRONTEND_UIUX_RESTRUCTURING_BLUEPRINT_V3.md`, `ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md`, `Phân Tích _ Thiết Kế.docx` và `KeHoach_PhatTrien_DuAn_DatVeXemPhim_DBMS_First_v2 (1).docx`.

Trong Downloads có bản tham chiếu tương ứng `RBAC_FIXED_DOCS_UPDATE/docs/UX_ARCHITECTURE_BLUEPRINT.md` (Phase 1) và `docs/standards/FRONTEND_UIUX_DESIGN_STANDARDS.md`; đã đọc các phần về palette, typography, navigation, table/drawer, responsive và WCAG. Không suy diễn nội dung của roadmap hoặc hai DOCX còn thiếu. Tìm kiếm rộng hơn toàn bộ `C:\Users\doant` bị hệ điều hành từ chối quyền truy cập; do đó đã giới hạn tra cứu ngoài repo ở Downloads có thể đọc được.

## B. Ma trận khắc phục từng phát hiện

| Mục | Nguyên nhân và xử lý | Kiểm chứng / bằng chứng | Trạng thái |
|---|---|---|---|
| FIX-01 — Manager Overview trắng | Selector CSS toàn cục ẩn `#manager-overview` và `.catalog-page` sau khi dữ liệu tải. Đã bỏ đúng selector lỗi, giữ nguyên CSS của các trang khác và không đổi API/scope. `/manager` tiếp tục đi tới workspace Overview. | `managerRoutes.test.js`; browser route audit ở 390×844, 768×1024, 1366×900 và 683×450; kiểm tra thêm 1280/1440/1920. Ảnh `evidence/after/manager-overview-desktop.png`, `manager-overview-tablet.png`, `manager-overview-mobile.png`. | **PASS** |
| FIX-02 — Portal thiếu quyền | Route vào trước đây chỉ dựa trên role và có thể tạo shell rỗng; lỗi khôi phục phiên cũng chưa phân biệt hết hạn với lỗi tải quyền. Đã điều hướng tới section đầu tiên được phép, hiện trạng thái không có workspace, retry khi quyền/session không tải được, giải thích session hết hạn và hiển thị quyền/phân công rạp trong hồ sơ. Backend vẫn là nơi quyết định authorization cuối cùng. | `permission-ux.test.js`, `adminRoutes.test.js`, `managerRoutes.test.js`, `role-aware-profile.test.js`; `E2E-RBAC-ROUTES`; kiểm tra các vai trò Customer/Manager/CSKH/Admin. | **PASS** |
| FIX-03 — Lọc giá “Tất cả” làm rỗng bảng | Giá trị hiển thị “Tất cả” bị dùng như một giá trị dữ liệu thực. Đã dùng sentinel lọc rỗng riêng, giữ nguyên wildcard nghiệp vụ `LoaiNgay = Tất cả`; không đổi cách tính giá. | `operations.test.js`; `E2E-MGR-PRICING`, `E2E-ADM-FACILITY`; ảnh `manager-pricing-desktop.png`, `admin-pricing-desktop.png`. | **PASS** |
| FIX-04 — Nút tìm kiếm trùng | `FacilityScreen` tự vẽ nút trong khi `FilterBar` đã gửi form. Đã để `FilterBar` là cơ chế submit duy nhất; Enter hoạt động qua form và pending khóa submit lặp. | `facilities.test.js`; browser E2E phòng/ghế và kiểm tra responsive các portal dùng filter. | **PASS** |
| FIX-05 — Chi tiết nằm dưới bảng, focus không chuyển | Một số trang render chi tiết sau danh sách. Đã chuyển chi tiết tài nguyên Admin, khiếu nại, vận hành và ngữ cảnh cơ sở vật chất sang inspector drawer; dialog quản lý focus, đóng drawer xóa lựa chọn ghế và trả focus về điều khiển mở. | `adminResources.test.js`, `facilities.test.js`, `operations.test.js`; `E2E-MGR-SEAT`, `E2E-ADM-ROOMS-SEATS`, `E2E-ADM-COMPLAINT`; kiểm thử Escape/focus trong `E2E-A11Y-KEYBOARD`. Ảnh drawer `evidence/after/admin-complaint-inspector-desktop.png`. | **PASS** |
| FIX-06 — “Tìm phim” không focus ô tìm | Link đưa tới URL danh mục nhưng không focus trường tìm kiếm. Đã đồng bộ state local với query URL, focus ô tìm khi mở link và giữ điều hướng bằng Enter/query. | `catalogPages.test.js`; `E2E-MOVIE-SEARCH-NAV`. | **PASS** |
| FIX-07 — Header/breadcrumb bị ẩn | CSS ẩn breadcrumb, mô tả và cả PageHeader khi thiếu action; shell còn lặp tên route. Đã gỡ các selector che header và bỏ tiêu đề trùng trong Admin shell. | `uiShell.test.js`; 176 lượt axe/responsive; ảnh overview Admin/Manager và trang giá trong `evidence/after/`. | **PASS** |
| FIX-08 — Chữ quản trị quá nhỏ | Một số label, nút và chữ phụ xuống 9.6–13 px. Đã nâng cỡ chữ nhỏ lên hệ thống tối thiểu khoảng 14 px và giữ bố cục responsive, không thu nhỏ chữ để xử lý tràn. | Browser ở 390×844, 768×1024, 1366×900, viewport tương đương 200% và ba kích thước bổ sung. Ảnh Manager/Admin ở `evidence/after/`. | **PASS** |
| FIX-09 — Filter dày và thiếu nhất quán | Nhiều tiêu chí nâng cao luôn chiếm chỗ, thiếu chip/kết quả áp dụng nhất quán. Đã nhóm tiêu chí nâng cao trong disclosure khi có nhiều trường, giữ rõ trạng thái draft/applied, chip và feedback kết quả; không thay đổi tiêu chí/API. | `operations.test.js`, `uiShell.test.js` và test màn hình liên quan; browser pricing/Admin/users; ảnh `manager-pricing-*`, `admin-users-filter-desktop.png`. | **PASS** |
| FIX-10 — FilterBar rỗng khi tải/lỗi đặt vé | Shell booking nhân viên tạo thanh lọc không có trường ở trạng thái loading/error. Đã chỉ render FilterBar khi có schema filter thực. | `staffBookings.test.js`; `E2E-MGR-BOOKING`; route audit desktop/tablet/mobile. | **PASS** |
| FIX-11 — Tương phản chat khách hàng thấp | Token muted của shell tối bị áp lên card chat trắng; legacy rule `!important` thắng rule cục bộ trước đó. Đã thêm ngoại lệ có scope cho chat trong public shell: heading `#0F172A`, số tin nhắn `#475569` trên trắng. | axe 44 route × 4 viewport; ảnh thực `customer-complaint-chat-desktop.png` và `customer-complaint-chat-mobile.png`. Browser computed style trên complaint fixture: heading `rgb(15, 23, 42)`, count `rgb(71, 85, 105)`, background `rgb(255, 255, 255)`. | **PASS** |
| FIX-12 — Log chat CSKH không nhận focus | Vùng cuộn có `role=log` nhưng không thể focus bằng bàn phím. Đã đặt tên accessible, `tabIndex=0`, focus ring nhìn thấy, trạng thái loading/empty/error và bảo vệ response cũ; không tự cuộn làm mất vị trí đọc. | `supportChat.test.js`; axe ở bốn viewport; `E2E-A11Y-KEYBOARD`; ảnh `support-complaint-chat-desktop.png`. | **PASS** |
| FIX-13 — Link Khiếu nại bị lặp | `PublicShell` thêm link dù `AreaLayout` đã cung cấp cùng đích. Đã tránh phát sinh link trùng theo nhãn/route. | `uiShell.test.js`; `E2E-CUST-COMPLAINT`, axe route audit Customer. | **PASS** |
| FIX-14 — E2E bàn phím sai lệch focus | Assertion cũ chỉ kiểm tra chữ của phần tử sau Tab, không theo dõi đường focus sau khi mở lại route. Đã kiểm tra href/đích skip link, trace focus thật, Enter tới main; không bỏ hoặc làm yếu assertion. Điều hướng seat map bằng mũi tên/Space và focus/close/restore của dialog vẫn được kiểm tra. | `E2E-A11Y-KEYBOARD` PASS trên Edge; ảnh và log trong `.audit-output/acceptance/`. | **PASS** |

## C. Kết quả regression

| Kiểm tra | Kết quả |
|---|---|
| Frontend unit/component tests | `npm.cmd test` — 252 pass, 0 fail, 0 skipped |
| Lint | `npm.cmd run lint` — exit 0; 7 warning còn lại ở `CustomerPointsViewer.jsx` (1), `AdminEscalationModule.jsx` (3), `SupportEscalationManager.jsx` (3); không có warning mới ở source được sửa |
| Production build | `npm.cmd run build -- --outDir ../.audit-output/frontend-build-final2` — PASS, 238 modules; CSS 186.79 kB, JS 922.62 kB (264.33 kB gzip). Vite cảnh báo chunk JS trên ngưỡng 500 kB |
| Browser E2E | Microsoft Edge/Playwright, `CinemaBookingDB_Test as CinemaTestUser`: 67 PASS / 0 FAIL / 0 SKIP; JSON tại `.audit-output/acceptance/browser-e2e.json` |
| axe + route audit | 44 route cho Public/Customer/Manager/CSKH/Admin trên 1366×900, 768×1024, 390×844 và 683×450 CSS px ở DPR 2: 176 lượt; không có axe violation, overflow ngang, runtime error, API 5xx hoặc ảnh hỏng cùng origin |
| Viewport bổ sung theo UX standards | 21 lượt trên các màn hình đại diện tại 1280×800, 1440×900, 1920×1080; main content hiển thị, không overflow, console/runtime error hoặc API 5xx. Ảnh Manager Overview/pricing lưu ở `evidence/after/` |
| Luồng mobile và keyboard | `E2E-RESP-MOBILE-FLOWS` PASS: đặt vé bằng bottom bar và mở/chọn route trong staff drawer; `E2E-A11Y-KEYBOARD` PASS: chọn ghế bằng phím, skip link, dialog focus/Escape/restore |
| Tính toàn vẹn DB | Tất cả POST-DB checks PASS; inventory giữ nguyên 29 tables, 147 procedures, 6 views, 21 functions, 9 triggers; không có orphan, trùng ghế, xung đột lịch/giá hoặc lỗi constraint |

Lượt 200% dùng viewport CSS tương đương 683×450 với `deviceScaleFactor: 2`, không điều khiển mức zoom trong UI trình duyệt. Ba kích thước 1280/1440/1920 chỉ kiểm tra content, console/API và overflow ở các màn hình đại diện; axe đã chạy toàn bộ 44 route ở bốn viewport nêu trên.

## D. Ảnh trước/sau

Ảnh trước giữ tại `evidence/before/`; ảnh sau từ Microsoft Edge thật giữ tại `evidence/after/`. Không tạo ảnh giả.

Ảnh sau tiêu biểu:

- Manager Overview: `manager-overview-desktop.png`, `manager-overview-tablet.png`, `manager-overview-mobile.png`.
- Pricing filters: `manager-pricing-desktop.png`, `manager-pricing-mobile.png`, `admin-pricing-desktop.png`.
- PageHeader và toolbar: `admin-overview-desktop.png`, `admin-users-filter-desktop.png`.
- Data detail/drawer: `admin-complaint-inspector-desktop.png`.
- Chat Customer và CSKH: `customer-complaint-chat-desktop.png`, `customer-complaint-chat-mobile.png`, `support-complaint-chat-desktop.png`, `support-case-processing-desktop.png`.
- Mobile navigation: `admin-mobile-navigation-drawer.png`.
- Breakpoint 1280×800, 1440×900, 1920×1080: `manager-overview-*`, `manager-pricing-*` theo kích thước trong tên file.

## E. File được sửa hoặc thêm

### Frontend source

- `frontend/src/context/AuthContext.jsx` — phân biệt trạng thái hết phiên và lỗi khôi phục.
- `frontend/src/components/NoWorkspaceAccess.jsx` — trạng thái workspace không có quyền.
- `frontend/src/features/admin-resources/AdminResourceScreen.jsx` — detail inspector.
- `frontend/src/features/admin-service/AdminComplaints.jsx` — complaint inspector.
- `frontend/src/features/facilities/FacilityScreen.jsx`, `frontend/src/features/facilities/facilityController.js` — filter submit, inspector, đóng/clear selection.
- `frontend/src/features/operations/OperationsScreen.jsx` — sentinel lọc giá, inspector và nhóm filter.
- `frontend/src/features/staff-bookings/StaffBookings.jsx` — bỏ FilterBar rỗng.
- `frontend/src/features/support/SupportChatBox.jsx`, `frontend/src/features/support/support-chat.css` — chat log accessibility, loading/error/empty và style.
- `frontend/src/layouts/AdminShell.jsx`, `frontend/src/layouts/PublicShell.jsx` — bỏ tiêu đề/link trùng, điều hướng tìm phim.
- `frontend/src/pages/Forbidden.jsx`, `frontend/src/pages/Movies.jsx`, `frontend/src/pages/auth/Login.jsx`, `frontend/src/pages/auth/Profile.jsx` — thông báo quyền/session, sync URL và thông tin quyền.
- `frontend/src/routes/AdminEntryRoute.jsx`, `frontend/src/routes/SessionRecovery.jsx` — chọn section có quyền và retry session/quyền.
- `frontend/src/routes/ManagerSectionRoute.jsx`, `frontend/src/routes/RequireAuth.jsx`, `frontend/src/routes/RequireRole.jsx`, `frontend/src/routes/adminSectionRoutes.js`, `frontend/src/routes/index.jsx`, `frontend/src/routes/managerSectionRoutes.js` — route theo section được phép và trạng thái bảo vệ.
- `frontend/src/styles/admin-tailadmin.css`, `frontend/src/styles/components.css`, `frontend/src/styles/public/public-components.css` — hiển thị PageHeader, typography, filter/drawer layout và contrast chat.

### Tests và browser scenarios

- Đã sửa: `frontend/tests/adminResources.test.js`, `adminRoutes.test.js`, `catalogPages.test.js`, `facilities.test.js`, `managerRoutes.test.js`, `operations.test.js`, `role-aware-profile.test.js`, `staffBookings.test.js`, `uiShell.test.js`.
- Đã thêm: `frontend/tests/permission-ux.test.js`, `frontend/tests/supportChat.test.js`.
- `scripts/audit/browser-scenarios-hardening.mjs` — tìm phim, zoom-equivalent audit, focus keyboard và ảnh drawer mobile. File này đã có thay đổi từ trước trong working tree; phần sẵn có được giữ nguyên.
- `scripts/audit/browser-scenarios-manager.mjs` — xác minh đóng inspector và focus trả lại.

### Ảnh bằng chứng

- `docs/audits/FRONTEND_UI_AUDIT_REMEDIATION_REPORT.md` — báo cáo nghiệm thu này.
- `docs/audits/evidence/before/` (18 ảnh): `admin-admin_access_users.png`, `admin-admin_operations_pricing.png`, `admin-admin_overview.png`, `customer-complaints_75.png`, `E2E-A11Y-DESKTOP.png`, `E2E-A11Y-KEYBOARD.FAIL.png`, `E2E-A11Y-KEYBOARD.png`, `E2E-A11Y-MOBILE.png`, `E2E-A11Y-TABLET.png`, `E2E-ADM-COMPLAINT.png`, `E2E-CSKH-PROCESS.png`, `E2E-CUST-COMPLAINT.png`, `E2E-MGR-PRICING.png`, `E2E-RESP-MOBILE-FLOWS.png`, `manager-manager_overview.png`, `manager-manager_pricing.png`, `public-home.png`, `support-support_complaints_75.png`.
- `docs/audits/evidence/after/` (20 ảnh): `admin-complaint-inspector-desktop.png`, `admin-mobile-navigation-drawer.png`, `admin-overview-desktop.png`, `admin-pricing-desktop.png`, `admin-users-filter-desktop.png`, `customer-complaint-chat-desktop.png`, `customer-complaint-chat-mobile.png`, `manager-overview-desktop.png`, `manager-overview-mobile.png`, `manager-overview-tablet.png`, `manager-pricing-desktop.png`, `manager-pricing-mobile.png`, `manager-overview-1280x800.png`, `manager-pricing-1280x800.png`, `manager-overview-1440x900.png`, `manager-pricing-1440x900.png`, `manager-overview-1920x1080.png`, `manager-pricing-1920x1080.png`, `support-case-processing-desktop.png`, `support-complaint-chat-desktop.png`.

## F. Rủi ro còn lại

- Còn 7 lint warning ở ba component không thuộc thay đổi; chúng không làm lint fail.
- Bundle JavaScript 922.62 kB minified vượt cảnh báo 500 kB của Vite; build vẫn thành công, có thể tách chunk trong một nhiệm vụ hiệu năng riêng.
- Không kiểm chứng được nội dung roadmap và hai DOCX bị thiếu; UX được đối chiếu với blueprint/standards Phase 1 tìm thấy trong Downloads.
- Ma trận browser bao phủ 44 route và các luồng test đã có, không phải mọi dữ liệu, trình duyệt, thiết bị hoặc trạng thái mạng có thể có. Host ngoài bị môi trường hạn chế mạng không được tính là ảnh lỗi ứng dụng.

Không tạo commit, push hoặc merge.
