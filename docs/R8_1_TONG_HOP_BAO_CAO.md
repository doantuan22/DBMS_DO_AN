# R8.1 — Báo cáo tổng hợp

Tài liệu này gộp đầy đủ bốn báo cáo được tạo trong work package **R8.1 — Frontend Inspection, Contract Alignment & Test Environment**. Backlog R8.2 bên dưới là đầu ra chuẩn bị của R8.1; các công việc sửa lỗi và nghiệm thu R8.2/R8.3 chưa được thực hiện.

**R8.1 DONE — FRONTEND AUDITED & BROWSER TEST ENVIRONMENT READY**

- Đã mapping 45 use case và khảo sát 43 inherited frontend gaps.
- Giữ nguyên 2 provisional FE PASS / 43 PARTIAL.
- Backlog: 7 FIX_REQUIRED, 7 CONTRACT_ALIGNMENT_REQUIRED, 29 TEST_REQUIRED, 0 BLOCKED.
- Browser smoke 8/8 PASS; frontend tests 62/62 PASS; lint/build PASS.
- Database test riêng xác minh 159 modules/27 tables; cleanup và main preservation PASS.
- Không sửa production functionality hoặc database chính.

**43 FRONTEND GAPS PENDING R8.2**

## Mục lục và nguồn

| Phần | Nội dung trong file tổng hợp | Báo cáo gốc |
| --- | --- | --- |
| 1 | [Khảo sát frontend và kết luận R8.1](#phan-1) | [Frontend Inspection Report](R8_1_FRONTEND_INSPECTION_REPORT.md) |
| 2 | [Ma trận frontend đủ 45 use case](#phan-2) | [Frontend Gap Matrix](R8_FRONTEND_GAP_MATRIX.md) |
| 3 | [Backlog thực thi R8.2 cho 43 gaps](#phan-3) | [R8.2 Execution Backlog](R8_2_EXECUTION_BACKLOG.md) |
| 4 | [Môi trường browser test, fixtures và commands](#phan-4) | [Test Environment Report](R8_TEST_ENVIRONMENT.md) |

Nội dung từng báo cáo được giữ đầy đủ; chỉ điều chỉnh cấp heading và liên kết giữa bốn phần để đọc trong cùng một file. Các liên kết đến source, tài liệu lịch sử và evidence vẫn trỏ đến artifact gốc trong repository. Số liệu và kết luận bên dưới phản ánh lần kiểm chứng R8.1 ngày 10/10/2026, không phải một lần chạy test mới.

---

<a id="phan-1"></a>

## R8.1 — Frontend Inspection, Contract Alignment & Test Environment

**R8.1 DONE — FRONTEND AUDITED & BROWSER TEST ENVIRONMENT READY**

Ngày thực hiện: 10/10/2026, UTC+7. Đây là work package inspection/environment trong phương án ba task R8. Roadmap item R8.1/I-11 và I-15/I-19/I-21 vẫn **PENDING FIX/VERIFICATION tại R8.2**. Không sửa production functionality; không thay grade nghiệm thu frontend.

### A. Project Context

Repository baseline: `f3da7f6a1b06fa30ffe223d8e0ed3e5e8cee714a`. Đã đọc các nguồn bắt buộc, API contracts, React source/tests, backend routes/validators/controllers/services và R5 test-target workflow. [Source audit](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/source-audit.json) ghi hash/line counts của tài liệu và 176 source files; import graph có 69 file reachable từ entry thật. [Baseline hashes](evidence/r8-1/runs/2026-10-10T01-58-04-401313Z-3d49fc44/repository-all-before.json) bao gồm cả evidence cũ và file ignored, không xuất nội dung secrets.

[R7.3 acceptance](R7_3_FINAL_ACCEPTANCE_REPORT.md) bàn giao 45/45 DB/BE PASS, backend regression 192/192 và No-SQL Audit PASS; đó là kết quả lịch sử, không phải bộ test được chạy lại ở R8.1. [Main Database Sync](MAIN_DATABASE_SYNC_REPORT.md) là nguồn mới hơn cho việc triển khai hai approved SP R7.2 và parity 159/159 trên main. Không coi ghi chú main-sync pending trong tài liệu lịch sử là trạng thái hiện tại. Các báo cáo lịch sử được giữ nguyên.

R8.1 dùng database mới qua R5 canonical pipeline; main `CinemaBookingDB` chỉ được fingerprint read-only trước/sau. [Final quality gate](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/quality-gate.json) kiểm tra bảo toàn source/evidence và các đầu ra của task.

### B. Frontend Architecture

| Hạng mục | Quan sát từ source/config và runtime |
| --- | --- |
| React | package range `^19.2.8`; installed/smoke runtime **19.3.0** |
| Build | Vite range `^8.3.0`; installed **8.3.1**; plugin React; ES modules |
| Routing | `react-router-dom ^7.18.4`; BrowserRouter, nested Routes/Outlet |
| State | AuthContext/AuthProvider; local useState/useRef/useEffect/useCallback; không có Redux/query store |
| API | Shared fetch/httpClient; các module auth/catalog/orders/feedback/manager/support/admin; `/api` mặc định, override VITE_API_BASE_URL |
| Session | sessionStorage `cinema_access_token`; login rồi me để nạp role/grants/assignments hiện hành |
| Forms | Controlled native HTML inputs/select; required/min/max và helpers; backend validator + SQL vẫn authoritative |
| UI/CSS | Component tự viết, CSS tokens/Grid/Flex; không framework UI/form mới |
| Tests | Node built-in test runner, frontend 62 tests; browser tooling Chrome CDP có sẵn trong các phase trước; không thêm Playwright/Cypress/dependency |
| Scripts thật | frontend `dev`, `build`, `test`, `lint`, `preview` trong [package.json](../frontend/package.json) |

Đường mount thật: [main.jsx](../frontend/src/main.jsx) → StrictMode → [App.jsx](../frontend/src/App.jsx) → ErrorBoundary/AuthProvider/BrowserRouter → [AppRoutes](../frontend/src/routes/index.jsx) → AreaLayout + RequireAuth/RequireRole → page → component → API client → Express controller → typed SP gateway → SQL. AuthProvider bao router theo implementation hiện hành; không dựng một app fixture thay thế AppRoutes.

| Area | Routes hiện hành / guard |
| --- | --- |
| Public | `/`, `/movies`, `/movies/:movieId`, `/cinemas`, `/cinemas/:cinemaId`, `/booking/:showtimeId`, `/login`, `/register`, `/forbidden`, fallback `*` |
| Profile | `/profile`, RequireAuth; staff cũng có hồ sơ, không mặc định chỉ Customer |
| Customer | `/orders`, `/orders/:orderId`, `/orders/:orderId/payment`, `/complaints`, `/complaints/:complaintId`, `/account`; RequireRole Customer |
| Manager | `/manager`, RequireRole Manager; workspace scope theo assigned cinema và functional permission |
| CSKH | `/support`, RequireRole CSKH + `QL_KHIEUNAI`; các thao tác có grant riêng |
| Admin | `/admin`, RequireRole Admin; modules/actions phản ánh current functional grants |

Shared components đang được mount gồm AreaLayout, CatalogStates, StatusBadge, HoldDeadline, SeatMap, ProductPicker, MovieReviews, CinemaImageManager và ComplaintOrderReference. Import graph xác nhận **ComplaintOrderReference được dùng bởi SupportPortal; AdminPortal dùng reference inline riêng**. Mô tả cũ suy rộng component này sang Admin được hiệu chỉnh ở báo cáo này, không sửa evidence lịch sử.

RequireAuth/RequireRole chờ init, chuyển `/login` với internal return path hoặc `/forbidden`; navigation theo role/grants. `httpClient` giữ status/code/message, lỗi 401 phát sự kiện hết session, 403 refresh current user. Browser smoke Customer vào `/admin` bị đưa tới `/forbidden`; đây là kiểm tra guard tối thiểu, chưa thay bộ denied-route/action/grant/assignment tests của R8.2. Backend/SQL vẫn bảo vệ action dù DOM bị sửa; không bypass auth khi test.

Async protections khác nhau theo workspace: Admin generic list có loadRequest; Manager có request generation/scope key; MovieDetail và shared order reference có abort/active guards; Support detail có detailGeneration. Các protections này không tự bảo vệ mọi queue, mutation hoặc resource request. ErrorBoundary/global session handlers không thay local error/empty/retry.

### C. Existing UI Identity

[index.css](../frontend/src/index.css) định nghĩa blue primary `#1e3a8a`, hover `#1e40af`, active `#172554`; amber accent `#f59e0b`; page `#f8fafc`, surface `#fff`, surface-alt `#f1f5f9`, text `#0f172a`, muted `#64748b`, border `#e2e8f0`. Font stack Plus Jakarta Sans → Inter → system fallback. Giữ CinemaStar/blue-amber star identity, tokens spacing/radius/shadow và typography hiện có.

AreaLayout giữ sticky header, role links, account menu, skip link, main Outlet và footer. Auth card, catalog section/card, table-wrap, catalog form/actions/buttons, list/status badge và live/alert feedback là conventions hiện hành. SeatMap dùng rows/legend và trạng thái accessible pressed. Layout dùng Grid/Flex, mobile breakpoint 768px và minimum body width 320px. Native `window.confirm` xuất hiện ở một số Admin delete/status/cancel actions; không mặc định mọi Manager mutation có confirm.

Đã lưu 1440px desktop cho public và bốn portal, Admin complaints; 390px mobile cho Customer trong [run browser](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/browser-smoke.json). Google Font bị môi trường mạng từ chối, nên screenshots dùng **fallback font hiện có**, không phải visual baseline chuẩn font brand. Chưa kiểm tra toàn bộ keyboard/a11y/responsive flows. R8.2 giữ UI identity, bổ sung controls/state feedback tối thiểu và kiểm tra regressions quanh phần sửa.

### D. 45 UC Frontend Coverage

| Actor | UC | FE PASS sơ bộ giữ nguyên | Gap inspected | Ready for R8.2 |
| --- | ---: | ---: | ---: | ---: |
| Customer | 14 | 2 | 12 | 12 |
| Manager | 9 | 0 | 9 | 9 |
| CSKH | 6 | 0 | 6 | 6 |
| Admin | 16 | 0 | 16 | 16 |
| Total | 45 | 2 | 43 | 43 |

KH-02/KH-03 vẫn provisional PASS, chưa full application acceptance. 43 UC còn lại vẫn PARTIAL; không thêm UC. [Gap matrix](#phan-2) và [raw mapping](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json) có đủ entry/route/page/component/client/method/path/contract/auth/form/async/success/error/loading-empty-retry/evidence/missing/risk cho từng UC, cùng endpoint → controller → service → SP chain.

52 legacy browser registry selectors đã được resolve vào artifact thật và hash trong source audit. Một số evidence chỉ mount component/MemoryRouter destination stub, không được coi là full AppRoutes E2E. Những UC ghi BROWSER_MISSING nghĩa là chưa có proof phù hợp cho **business behavior**; smoke login/portal mới chỉ bổ sung environment readiness. SOURCE_MAPPED/STATE_RACE_RISK/CONTRACT_MISMATCH/READY_FOR_R8_2 là classifications, không thay official grades. Fixture mở rộng được thiết kế, chưa materialize toàn bộ 43 journeys.

### E. Four Critical Issues

| Issue / UC | Current implementation và protection | Cơ chế/rủi ro cần R8.2 kiểm chứng | Hành động và browser plan |
| --- | --- | --- | --- |
| I-11 / ADM-15 | [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx#L132) `openComplaint`; list loadRequest chỉ bảo vệ list | Detail/reference awaits không có generation/abort/selected-ID guard; A về muộn có thể ghi detail A khi selected B. Mutation dùng selected.id rồi refresh captured selection; switch khi pending có thể khôi phục complaint cũ | Fix tối thiểu identity/generation cho detail/reference/write refresh; A chậm/B nhanh, late success/error, đổi module, write pending, target B trùng nội dung visible, retry/abort |
| I-15 / CSKH-02 | [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx#L26) loadQueue không guard; detailGeneration bảo vệ detail riêng; Admin list đã có guard | Queue A có thể ghi rows/loading/error sau B. Filter mới chưa có priority. Không có pagination hiện hành để giả định kiểm chứng | Bảo vệ queue lifecycle; status+priority+type+search AND; A chậm/B nhanh, stale error, empty, retry; shared Admin query chỉ kiểm khi có dùng filter |
| I-19 / KH-05…09 | [BookingPreparation.jsx](../frontend/src/pages/BookingPreparation.jsx#L21); show detail/products có AbortController, quote có previewVersion | Khi params đổi, thiếu reset/key cho quantities/code/result/error/busy; selected seats chỉ lọc sau response seats, chưa reset đầu context. Seat success và booking response/refresh chưa gắn generation; quote finally busy không guard | Scope state theo showtime, guard responses; A→B trong cùng mount, no seat/quote/result A, payload không trộn A/B, pending navigation, double click, 409/reload/failure |
| I-21 / CSKH-04, ADM-15; thêm KH-14 cùng pattern | [ComplaintOrderReference.jsx](../frontend/src/components/ComplaintOrderReference.jsx) đã có active guard và loading/error/empty/retry. [Complaints.jsx](../frontend/src/pages/Complaints.jsx#L22) catch→applyOrders([]); Admin inline catch→message | CSKH không còn source anti-pattern catch-empty. Customer che 403/network/backend error thành empty và xóa order selection. Admin hiện message lỗi, nhưng mất status/error taxonomy và reference retry riêng; không nói Admin literal empty | Giữ protection đúng của CSKH, test linked/unlinked/403/404/500/network/retry/switching; sửa Customer error state; Admin phân biệt legitimate unlinked với lỗi và retry |

Đây là inspection source và root-cause hypotheses; **chưa chạy race injection hoặc các business mutation journeys**. FIX_REQUIRED là kế hoạch cho source-confirmed omissions/shared fixes, không phải tuyên bố đã tái hiện mọi race. Controlled response delay/fault tests ở R8.2 phải ghi loại transport test; vẫn cần successful real SQL journeys độc lập. I-21 không được mặc định yêu cầu sửa component CSKH vốn đang có guards đúng.

### F. Contract Alignment

| Contract | Source hiện hành / kết luận | R8.2 |
| --- | --- | --- |
| CSKH priority | Support filters chỉ status/type/search; API helper có thể serialize query nhưng UI không tạo priority. Approved enum **Thấp, Trung bình, Cao, Khẩn cấp**, optional empty omitted; SQL AND filter; invalid400 | CSKH-02 alignment; giữ filters cũ và I-15 race guard. Không đổi SQL/validator |
| ADM-02 allowed create roles | Generic create form nhận numeric roleId; không dropdown/hardcoded role IDs hay Customer options. UI có thể gửi arbitrary numeric ID; SQL allowlist Manager/CSKH/Admin trả403 cho Customer/custom; generic error notice + current-user refresh | UI chọn vai trò hợp lệ theo authoritative mapping hiện có; không mở create allowlist sang user list/status. Admin có QL_NGUOIDUNG nhưng thiếu QL_VAITRO cần UX dùng nguồn role mapping được phép; không tự cấp grant hoặc thêm backend API |
| QLR-08 Dashboard | UI đọc activeRooms/activeSeats/showtimesToday/paidOrdersToday đúng bốn fields. activeSeats không tự suy ra từ rooms; paidOrders theo successful payment và SQL business date | TEST_REQUIRED: nonzero/zero/null-missing semantics, assignment isolation, date boundary; không thêm occupancy |
| Monetary ownership | UI gửi IDs/quantities/code/payment method/result; SQL quyết giá/discount/total/payment/snapshot/revenue. VND formatter làm tròn hiển thị 0 decimal, không thay authoritative amount | Test decimal values, preview/final/historical assertions; không thêm công thức React |
| Admin decimal inputs | Generic number inputs thiếu step phù hợp cho giá/discount/surcharge/base price decimal(18,2); Manager form đã step0.01 | ADM-11/12/13/14 CONTRACT_ALIGNMENT_REQUIRED; kiểm tra browser validity với decimal hợp lệ rồi minimal input fix |
| ADM-16 Revenue | Current DTO có summary/byCinema/byMovie/byDate; `dataRows` lấy array đầu tiên, UI hiện chỉ một dimension | Alignment consumption approved DTO; không tạo metric mới; test đủ existing summary/dimensions và filters |

Per-UC mapping ghi method/path, casing/typed IDs, body/query/default/null, SQL money/date/UTC ISO và response envelope/list/nullable fields, grant/assignment/ownership, statuses/message/code. Không giả định mọi endpoint có pagination hay 422: production error handler hiện có 400/401/403/404/409, auth429 và failure500/503 tùy nhánh. Frontend DOM validation chỉ hỗ trợ UX; không phải authority cho role/price/scope.

### G. Browser Test Readiness

**READY**, run thành công 09:07:03–09:07:17 UTC+7: [environment-result.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/environment-result.json). Chi tiết commands/fixtures/limitations: [Test Environment](#phan-4).

| Gate | Evidence/kết quả |
| --- | --- |
| Test DB | DESKTOP-E67DPCV / CinemaBookingDB_R0_R81_20261010_3d49fc44 / id48 / GUID33876608-D109-43B5-ACEC-0B84C2639A73; mới, seed-only sau cleanup |
| Canonical | R5 build PASS; 27 tables, 159 canonical modules gồm hai approved SP R7.2; definitions/SET/schema/dependency verification; FK/CHECK trusted, triggers enabled |
| Runtime | Chrome155.0.8059.39 + existing CDP pattern, Node24.21.0; actual Vite frontend60267 → Express60266 → typed SP → test SQL |
| Credentials | Unique test-only SQL login, EXECUTE on test dbo, thử kết nối main bị từ chối; random fixture passwords/JWT secret ở runtime/private temp, không public |
| Smoke | **8/8 PASS**, bốn role login/me/portal/read/guard tối thiểu; actual network và actual SP execute trace, không mock |
| Cleanup | Bốn complaint rows removed; bốn seeded password hashes restored; runtime DB user/login dropped; 27 data/metadata hashes restored, @@TRANCOUNT0, no open user transactions; services/pool/browser stopped |
| Main preservation | 27 data/metadata fingerprints trước/sau bằng nhau, mainWrites0; không deploy SP hoặc tạo fixtures trên main |
| Existing FE checks | 62/62 Node tests PASS khi cwd frontend, lint PASS, build PASS vào evidence build directory; không overwrite frontend/dist |

SMOKE-01 actual entry/routes, -02 health exactDB, -03 Customer me/guard/profile, -04 Manager assignments/dashboard, -05 support queue, -06 Admin grants/modules, -07 isolation/cleanup, -08 collected diagnostics. Những kiểm tra này **không nâng UC FE acceptance**.

Hai attempt lỗi được giữ nguyên: CDP Page.enable timeout trước DevTools HTTP ready; sau đó diagnostics strict assertion bắt cảnh báo key/GoogleFont. Test-only runner dùng bounded readiness retry và exact diagnostics classification; không sửa React. Logs chạy frontend tests sai cwd được giữ với canonical invocation PASS, không cộng chúng thành regression failures của production.

### H. Findings

| Primary backlog category | Gaps | Ý nghĩa |
| --- | ---: | --- |
| FIX_REQUIRED | 7 | KH-05…09 shared I-19, KH-14 masked lookup, ADM-15 I-11/I-21 |
| CONTRACT_ALIGNMENT_REQUIRED | 7 | CSKH-02 priority, ADM-02 roles, ADM-11…14 decimal fields, ADM-16 revenue DTO |
| TEST_REQUIRED | 29 | Có source; cần browser proof, gồm các risk hypotheses chưa đủ để yêu cầu fix |
| BLOCKED | 0 | Runtime/fixtures tối thiểu đã chạy; expanded fixtures tạo per journey |

Confirmed source omissions/contract limits ở các bảng trên chưa được sửa. Cảnh báo browser **R81-FIND-KEY-01**: một React console.error “Each child in a list should have a unique key prop”, render AdminPortal. Exact collection/root cause cần R8.2 trace; không gán đoán cho complaint row đã có key. Đã gắn finding vào ADM-15 execution item và chung portal regression, không mở UC mới.

Browser ghi 151 network responses, 0 Runtime exceptions, 1 known key warning; 18 loading failures gồm 6 local canceled requests do navigation/StrictMode và 12 Google Font access denied. Không có unexplained local API failure/API error. External font restriction và build chunk>500kB là limitations, không blocker chức năng environment. Không dùng các screenshots fallback để kết luận font visual parity.

Suspected risks còn ở Payment/OrderDetail/ComplaintDetail/MovieReviews resource change, Support processing/status duplicate/pending selection, Admin grant/image mutations và generic pending controls. Những gap này giữ TEST_REQUIRED khi chưa có reliable wrong-behavior proof; scenario được ghi trong backlog. Không coi mọi PARTIAL là lỗi production.

Execution order đề xuất: P1 I-11/I-15/I-19/I-21 và write-target correctness → P2 approved role/money/revenue alignment → P3 journeys per role, denied auth/scope và mutations trước simple reads. CSKH-02 P1 vì I-15 shared risk; priority-control alignment riêng thuộc P2. Counts theo gap: P1=11, P2=6, P3=26. Đây là thứ tự thực hiện, original issue/gap severity P3 giữ nguyên. [R8.2 backlog](#phan-3) có 43 actionable records, acceptance/fixtures/dependencies; tất cả PENDING_R8_2.

### I. Conclusion

**R8.1 DONE — FRONTEND AUDITED & BROWSER TEST ENVIRONMENT READY**

45 UC đã mapping, 43 inherited gaps đã inspected và ready cho R8.2; không có environment blocker chưa giải thích. Production frontend/backend/SQL và historical reports/evidence được bảo toàn; main không bị mutation. DB test giữ seed-only; test services và credentials đã thu hồi, R8.2 phải reprovision secrets mới.

**43 FRONTEND GAPS PENDING R8.2**. Giữ 2 provisional FE PASS / 43 PARTIAL. Dừng ở R8.1; chưa thực hiện fixes hoặc R8.3 acceptance.


---

<a id="phan-2"></a>

## R8 Frontend Gap Matrix — work package R8.1

45 UC được khảo sát; giữ **2 provisional FE PASS / 43 PARTIAL** và tất cả `R71-FE-*` IDs. Đây là mapping/inspection, không Final Frontend Acceptance.

Work package R8.1 hiện tại là inspection/environment; roadmap R8.1/I-11 vẫn pending fix R8.2. SOURCE_MAPPED/BROWSER_PARTIAL/BROWSER_MISSING/CONTRACT_MISMATCH/STATE_RACE_RISK/KNOWN_UI_DEFECT/READY_FOR_R8_2 là classification hỗ trợ, không thay thế grade. READY_FOR_R8_2 nghĩa là có kế hoạch và environment dùng được; không có nghĩa mọi scenario fixture đã tạo.

Nguồn: [baseline45](USE_CASE_BASELINE_45.md), [matrix lịch sử](USE_CASE_MATRIX_45.md), [R7.3](R7_3_FINAL_ACCEPTANCE_REPORT.md), [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

| UC / Actor | FE baseline | Gap | Mounted route / component | Classification | R8.2 action / order |
| --- | --- | --- | --- | --- | --- |
| [KH-01](#uc-kh-01) / Customer | PARTIAL | R71-FE-KH-01 | /register → Register | SOURCE_MAPPED, BROWSER_PARTIAL, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [KH-02](#uc-kh-02) / Customer | PASS | — | /login → Login / AuthProvider / authSession | SOURCE_MAPPED, BROWSER_PARTIAL | PRESERVE_PROVISIONAL_PASS / P3 |
| [KH-03](#uc-kh-03) / Customer | PASS | — | /profile → Profile / RequireAuth | SOURCE_MAPPED, BROWSER_PARTIAL | PRESERVE_PROVISIONAL_PASS / P3 |
| [KH-04](#uc-kh-04) / Customer | PARTIAL | R71-FE-KH-04 | /movies; /movies/:movieId → Movies / MovieGrid / MovieDetail | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [KH-05](#uc-kh-05) / Customer | PARTIAL | R71-FE-KH-05 | /movies/:movieId; /booking/:showtimeId → ShowtimeBrowser / ShowtimeList | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, READY_FOR_R8_2 | FIX_REQUIRED / P1 |
| [KH-06](#uc-kh-06) / Customer | PARTIAL | R71-FE-KH-06 | /booking/:showtimeId → BookingPreparation / SeatMap | SOURCE_MAPPED, BROWSER_PARTIAL, STATE_RACE_RISK, READY_FOR_R8_2 | FIX_REQUIRED / P1 |
| [KH-07](#uc-kh-07) / Customer | PARTIAL | R71-FE-KH-07 | /booking/:showtimeId → BookingPreparation / HoldDeadline | SOURCE_MAPPED, BROWSER_PARTIAL, STATE_RACE_RISK, READY_FOR_R8_2 | FIX_REQUIRED / P1 |
| [KH-08](#uc-kh-08) / Customer | PARTIAL | R71-FE-KH-08 | /booking/:showtimeId → ProductPicker / BookingPreparation | SOURCE_MAPPED, BROWSER_PARTIAL, STATE_RACE_RISK, READY_FOR_R8_2 | FIX_REQUIRED / P1 |
| [KH-09](#uc-kh-09) / Customer | PARTIAL | R71-FE-KH-09 | /booking/:showtimeId → BookingPreparation promotion preview | SOURCE_MAPPED, BROWSER_PARTIAL, STATE_RACE_RISK, READY_FOR_R8_2 | FIX_REQUIRED / P1 |
| [KH-10](#uc-kh-10) / Customer | PARTIAL | R71-FE-KH-10 | /orders/:orderId/payment → PaymentPage / HoldDeadline / StatusBadge | SOURCE_MAPPED, BROWSER_PARTIAL, STATE_RACE_RISK, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [KH-11](#uc-kh-11) / Customer | PARTIAL | R71-FE-KH-11 | /orders → Orders / StatusBadge | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [KH-12](#uc-kh-12) / Customer | PARTIAL | R71-FE-KH-12 | /orders/:orderId → OrderDetail / HoldDeadline | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [KH-13](#uc-kh-13) / Customer | PARTIAL | R71-FE-KH-13 | /movies/:movieId → MovieReviews | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [KH-14](#uc-kh-14) / Customer | PARTIAL | R71-FE-KH-14 | /complaints; /complaints/:complaintId → Complaints / ComplaintDetail | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, KNOWN_UI_DEFECT, READY_FOR_R8_2 | FIX_REQUIRED / P1 |
| [QLR-01](#uc-qlr-01) / Manager | PARTIAL | R71-FE-QLR-01 | /login; /manager → ManagerPortal / RequireRole | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-02](#uc-qlr-02) / Manager | PARTIAL | R71-FE-QLR-02 | /manager → ManagerWorkspace / ManagerResourceForm room | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-03](#uc-qlr-03) / Manager | PARTIAL | R71-FE-QLR-03 | /manager → ManagerWorkspace / ManagerResourceForm seat | SOURCE_MAPPED, BROWSER_PARTIAL, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-04](#uc-qlr-04) / Manager | PARTIAL | R71-FE-QLR-04 | /manager → ManagerResourceForm showtime create | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-05](#uc-qlr-05) / Manager | PARTIAL | R71-FE-QLR-05 | /manager → ManagerResourceForm showtime edit | SOURCE_MAPPED, BROWSER_PARTIAL, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-06](#uc-qlr-06) / Manager | PARTIAL | R71-FE-QLR-06 | /manager → ManagerWorkspace cancel action | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-07](#uc-qlr-07) / Manager | PARTIAL | R71-FE-QLR-07 | /manager → ManagerResourceForm pricing | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-08](#uc-qlr-08) / Manager | PARTIAL | R71-FE-QLR-08 | /manager → ManagerWorkspace dashboard | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-09](#uc-qlr-09) / Manager | PARTIAL | R71-FE-QLR-09 | /manager → ManagerRevenue | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [CSKH-01](#uc-cskh-01) / CSKH | PARTIAL | R71-FE-CSKH-01 | /login; /support → Login / SupportPortal / RequireRole | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [CSKH-02](#uc-cskh-02) / CSKH | PARTIAL | R71-FE-CSKH-02 | /support → SupportPortal queue | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, CONTRACT_MISMATCH, READY_FOR_R8_2 | CONTRACT_ALIGNMENT_REQUIRED / P1 |
| [CSKH-03](#uc-cskh-03) / CSKH | PARTIAL | R71-FE-CSKH-03 | /support → SupportPortal detail/timeline | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [CSKH-04](#uc-cskh-04) / CSKH | PARTIAL | R71-FE-CSKH-04 | /support → ComplaintOrderReference / OrderReferenceDetails | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P1 |
| [CSKH-05](#uc-cskh-05) / CSKH | PARTIAL | R71-FE-CSKH-05 | /support → SupportPortal processing form | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, READY_FOR_R8_2 | TEST_REQUIRED / P1 |
| [CSKH-06](#uc-cskh-06) / CSKH | PARTIAL | R71-FE-CSKH-06 | /support → SupportPortal status form | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, READY_FOR_R8_2 | TEST_REQUIRED / P1 |
| [ADM-01](#uc-adm-01) / Admin | PARTIAL | R71-FE-ADM-01 | /login; /admin → Login / AdminPortal / RequireRole | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-02](#uc-adm-02) / Admin | PARTIAL | R71-FE-ADM-02 | /admin → AdminPortal section users | SOURCE_MAPPED, BROWSER_MISSING, CONTRACT_MISMATCH, READY_FOR_R8_2 | CONTRACT_ALIGNMENT_REQUIRED / P2 |
| [ADM-03](#uc-adm-03) / Admin | PARTIAL | R71-FE-ADM-03 | /admin → AdminPortal section roles | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-04](#uc-adm-04) / Admin | PARTIAL | R71-FE-ADM-04 | /admin → AdminPortal section permissions | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-05](#uc-adm-05) / Admin | PARTIAL | R71-FE-ADM-05 | /admin → AdminPortal section permissions / role grants | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-06](#uc-adm-06) / Admin | PARTIAL | R71-FE-ADM-06 | /admin → AdminPortal section assignments | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-07](#uc-adm-07) / Admin | PARTIAL | R71-FE-ADM-07 | /admin → AdminPortal section cinemas / cinemaImages / CinemaImageManager | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-08](#uc-adm-08) / Admin | PARTIAL | R71-FE-ADM-08 | /admin → AdminPortal section rooms / seats | SOURCE_MAPPED, BROWSER_PARTIAL, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-09](#uc-adm-09) / Admin | PARTIAL | R71-FE-ADM-09 | /admin → AdminPortal section movies / actors / cast | SOURCE_MAPPED, BROWSER_PARTIAL, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-10](#uc-adm-10) / Admin | PARTIAL | R71-FE-ADM-10 | /admin → AdminPortal section genres | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-11](#uc-adm-11) / Admin | PARTIAL | R71-FE-ADM-11 | /admin → AdminPortal section products | SOURCE_MAPPED, BROWSER_MISSING, CONTRACT_MISMATCH, READY_FOR_R8_2 | CONTRACT_ALIGNMENT_REQUIRED / P2 |
| [ADM-12](#uc-adm-12) / Admin | PARTIAL | R71-FE-ADM-12 | /admin → AdminPortal section promotions | SOURCE_MAPPED, BROWSER_MISSING, CONTRACT_MISMATCH, READY_FOR_R8_2 | CONTRACT_ALIGNMENT_REQUIRED / P2 |
| [ADM-13](#uc-adm-13) / Admin | PARTIAL | R71-FE-ADM-13 | /admin → AdminPortal section pricing | SOURCE_MAPPED, BROWSER_PARTIAL, CONTRACT_MISMATCH, READY_FOR_R8_2 | CONTRACT_ALIGNMENT_REQUIRED / P2 |
| [ADM-14](#uc-adm-14) / Admin | PARTIAL | R71-FE-ADM-14 | /admin → AdminPortal section showtimes | SOURCE_MAPPED, BROWSER_PARTIAL, CONTRACT_MISMATCH, READY_FOR_R8_2 | CONTRACT_ALIGNMENT_REQUIRED / P2 |
| [ADM-15](#uc-adm-15) / Admin | PARTIAL | R71-FE-ADM-15 | /admin → AdminPortal section complaints | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, KNOWN_UI_DEFECT, READY_FOR_R8_2 | FIX_REQUIRED / P1 |
| [ADM-16](#uc-adm-16) / Admin | PARTIAL | R71-FE-ADM-16 | /admin → AdminPortal section dashboard / revenue | SOURCE_MAPPED, BROWSER_MISSING, CONTRACT_MISMATCH, READY_FOR_R8_2 | CONTRACT_ALIGNMENT_REQUIRED / P2 |

<a id="uc-kh-01"></a>

### KH-01 — Đăng ký

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /register → auth/Register.jsx |
| Mounted component | Register;  |
| API client | authApi.registerCustomer |
| Authorization | Public; limiter endpoint/IP; không nhận role/actor/grant của client. |
| Request / type / null / money / date / identity | HoTen1–100, Email≤150, MatKhau8–72 UTF8 bytes, nullable SoDienThoai≤20/NgaySinh YYYY-MM-DD/GioiTinh Nam,Nữ,Khác; không actor/role |
| Response / arrays / empty / nullable | {user}; HTTP201, redirect /login; SQL Customer/profile; no invented pagination envelope |
| Form state / async / pending / success/error | Controlled registration form; busy disables submit; retained inputs/error; success navigation /login. No async ownership fields. |
| Success behavior required | 201 tạo đúng Customer + profile; duplicate/invalid không tạo dòng; thông báo và sang đăng nhập. |
| Actual error contracts | 400 invalid/access fields;409 duplicate email/phone;429 auth limiter;500/503 unavailable; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E380](USE_CASE_MATRIX_45.md#evidence-e380) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. ; [E381](USE_CASE_MATRIX_45.md#evidence-e381) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. ; [E382](USE_CASE_MATRIX_45.md#evidence-e382) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. ; [E383](USE_CASE_MATRIX_45.md#evidence-e383) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. |
| Missing verification | R45 browser chỉ kiểm 429 và retry duplicate409; chưa UI đăng ký201, duplicate phone, input invalid và chuyển /login. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Register valid201 then /login; duplicate email/phone, invalid/multibyte password;429 retained inputs/manual retry; SQL no orphan. |
| Fixture / dependency | F-CUSTOMER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/auth/register | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.register → authService.registerCustomer → AUTH_REGISTER_CUSTOMER → dbo.sp_Auth_RegisterCustomer |

Current UI source: [Register.jsx](../frontend/src/pages/auth/Register.jsx). Raw mapping selector `/UCs/0` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-02"></a>

### KH-02 — Đăng nhập

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /login → auth/Login.jsx |
| Mounted component | Login / AuthProvider / authSession;  |
| API client | authApi.login/getCurrentUser |
| Authorization | Public login; GETme/permissions authenticate; DB/current account là authority. |
| Request / type / null / money / date / identity | Email≤150 + MatKhau1–72 UTF8 bytes; token nhận từ login, me tải current grants |
| Response / arrays / empty / nullable | {token,user} rồi {user}; role/current permissions/assignments; no invented pagination envelope |
| Form state / async / pending / success/error | Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role. |
| Success behavior required | Giữ provisional scope của R7.3 |
| Actual error contracts | 400 invalid;401 credentials/account;429;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E384](USE_CASE_MATRIX_45.md#evidence-e384) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. ; [E385](USE_CASE_MATRIX_45.md#evidence-e385) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. ; [E386](USE_CASE_MATRIX_45.md#evidence-e386) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. ; [E387](USE_CASE_MATRIX_45.md#evidence-e387) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. |
| Missing verification | Full application E2E beyond provisional scope |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Provisional PASS retained; no new UC acceptance claim. |
| Fixture / dependency | F-CUSTOMER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/auth/login | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.login → authService.login → AUTH_LOGIN → dbo.sp_Auth_Login |
| GET /api/auth/me | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentUser → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/auth/permissions | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentPermissions → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

Current UI source: [Login.jsx](../frontend/src/pages/auth/Login.jsx). Raw mapping selector `/UCs/1` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-03"></a>

### KH-03 — Profile

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /profile → auth/Profile.jsx |
| Mounted component | Profile / RequireAuth;  |
| API client | authApi.getCurrentUser/updateCurrentUser |
| Authorization | authenticate; ownership bằng req.user.userId; không functional permission mới. |
| Request / type / null / money / date / identity | HoTen1–100; nullable phone≤20/birthday DATE/gender enum; staff gửi birthday/gender NULL; identity JWT |
| Response / arrays / empty / nullable | {user}; name/phone/birthday/gender/loyaltyPoints nullable; no invented pagination envelope |
| Form state / async / pending / success/error | Controlled form from current user, busy/error/success; current identity from AuthProvider; staff null-specific fields. |
| Success behavior required | Giữ provisional scope của R7.3 |
| Actual error contracts | 400 invalid;401;409 phone duplicate;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E388](USE_CASE_MATRIX_45.md#evidence-e388) Customer only; actual Profile/AuthProvider, real GETme/PUTme/read after write + post-UI SQL row check. Staff profile cases do not prove staff login areas. |
| Missing verification | Full application E2E beyond provisional scope |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Provisional PASS retained; no new UC acceptance claim. |
| Fixture / dependency | F-CUSTOMER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/auth/me | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentUser → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| PUT /api/auth/me | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.updateCurrentUser → authService.updateProfile → USER_UPDATE_PROFILE → dbo.sp_User_UpdateProfile; USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

Current UI source: [Profile.jsx](../frontend/src/pages/auth/Profile.jsx). Raw mapping selector `/UCs/2` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-04"></a>

### KH-04 — Xem phim/list/detail

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /movies; /movies/:movieId → Movies.jsx; MovieDetail.jsx |
| Mounted component | Movies / MovieGrid / MovieDetail;  |
| API client | catalogApi.getMovies/getGenres/getMovieDetail |
| Authorization | Public: không requirePermission XEM_PHIM. |
| Request / type / null / money / date / identity | GET search≤100/genreId positive INT; movieId path positive INT; public; không body |
| Response / arrays / empty / nullable | {movies[]}, {genres[]}, {movie,genres[],actors[]}; no invented pagination envelope |
| Form state / async / pending / success/error | search/genre/attempt; AbortController +180ms debounce + requestKey guards success/loading; retry; valid empty. detail keyed movieId, showtimes keyed movie/cinema/date, AbortController; selected filters; no retry for detail/show list; review state separate. |
| Success behavior required | List/detail phim, genres và cast đúng; missing movie404; lọc phù hợp. |
| Actual error contracts | 400 invalid IDs/query;404 movie detail;500/503; không403 permission public; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser list/filter/detail, cast/genres, empty404 và retry. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Search/genre A→B with late A; list/detail genres/cast;404 detail; empty200; network error+retry. |
| Fixture / dependency | F-CUSTOMER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/movies | [movieRoutes.js](../backend/src/routes/movieRoutes.js) → catalogController.listMovies → catalogService.listMovies → MOVIE_LIST → dbo.sp_Movie_List |
| GET /api/movies/:movieId | [movieRoutes.js](../backend/src/routes/movieRoutes.js) → catalogController.getMovieDetail → catalogService.getMovieDetail → MOVIE_GET_DETAIL → dbo.sp_Movie_GetDetail |
| GET /api/genres | [genreRoutes.js](../backend/src/routes/genreRoutes.js) → catalogController.listGenres → catalogService.listGenres → GENRE_LIST → dbo.sp_Genre_List |

Current UI source: [Movies.jsx](../frontend/src/pages/Movies.jsx), [MovieDetail.jsx](../frontend/src/pages/MovieDetail.jsx). Raw mapping selector `/UCs/3` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-05"></a>

### KH-05 — Xem lịch chiếu

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /movies/:movieId; /booking/:showtimeId → MovieDetail.jsx; BookingPreparation.jsx |
| Mounted component | ShowtimeBrowser / ShowtimeList;  |
| API client | catalogApi.getCinemas/getShowtimes/getShowtimeDetail |
| Authorization | Public reads; write booking riêng KH-07. |
| Request / type / null / money / date / identity | movieId path; optional cinemaId positive INT/date DATE; showtimeId path; public |
| Response / arrays / empty / nullable | {cinemas[]}, {showtimes[]}, flat showtime detail; startsAt/endsAt UTC ISO; no invented pagination envelope |
| Form state / async / pending / success/error | detail keyed movieId, showtimes keyed movie/cinema/date, AbortController; selected filters; no retry for detail/show list; review state separate. show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. |
| Success behavior required | Lịch chiếu đúng phim/rạp/ngày và show detail; chỉ suất khả dụng theo contract. |
| Actual error contracts | 400 query/path;404 detail;500/503; empty list200; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser chọn rạp/ngày, đổi filter, empty lịch và điều hướng booking. |
| Known/suspected issue | I-19 |
| Browser scenarios | Cinema/date filters A→B; empty schedule; available show link; SPA showtime A→B entry and back navigation. |
| Fixture / dependency | F-CUSTOMER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Minimal state/identity/error fix after targeted reproduction; no redesign. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/cinemas | [cinemaRoutes.js](../backend/src/routes/cinemaRoutes.js) → catalogController.listCinemas → catalogService.listCinemas → CINEMA_LIST → dbo.sp_Cinema_List |
| GET /api/movies/:movieId/showtimes | [movieRoutes.js](../backend/src/routes/movieRoutes.js) → catalogController.listShowtimes → catalogService.listShowtimes → SHOWTIME_LIST_BY_MOVIE → dbo.sp_Showtime_ListByMovie |
| GET /api/showtimes/:showtimeId | [showtimeRoutes.js](../backend/src/routes/showtimeRoutes.js) → catalogController.getShowtimeDetail → catalogService.getShowtimeDetail → SHOWTIME_GET_DETAIL → dbo.sp_Showtime_GetDetail |

Current UI source: [MovieDetail.jsx](../frontend/src/pages/MovieDetail.jsx), [BookingPreparation.jsx](../frontend/src/pages/BookingPreparation.jsx). Raw mapping selector `/UCs/4` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-06"></a>

### KH-06 — Chọn ghế

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /booking/:showtimeId → BookingPreparation.jsx |
| Mounted component | BookingPreparation / SeatMap;  |
| API client | catalogApi.getShowtimeDetail/getSeats |
| Authorization | Seat read public; Customer+DAT_VE khi submit booking. |
| Request / type / null / money / date / identity | GET showtimeId positive INT; public; chọn IDs numeric, không gửi price |
| Response / arrays / empty / nullable | {seats[]} id,label,row,number,type,status,price SQL; detail flat; no invented pagination envelope |
| Form state / async / pending / success/error | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. |
| Success behavior required | Trạng thái free/held/sold và giá đúng; selection ≤10; conflict không gây giữ hai lần. |
| Actual error contracts | 400 invalid;404 showtime;500/503;409 chỉ booking shared KH-07; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E389](USE_CASE_MATRIX_45.md#evidence-e389) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E390](USE_CASE_MATRIX_45.md#evidence-e390) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. |
| Missing verification | R44 chỉ chọn ghế free; chưa browser held/sold, ghế11, concurrent conflict và refresh sau409. |
| Known/suspected issue | I-19 |
| Browser scenarios | Free/held/sold/maintenance disabled; select/unselect0/10/11; switch showtime mid-load; concurrent seat lost→409 refresh. |
| Fixture / dependency | F-CUSTOMER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Minimal state/identity/error fix after targeted reproduction; no redesign. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/showtimes/:showtimeId | [showtimeRoutes.js](../backend/src/routes/showtimeRoutes.js) → catalogController.getShowtimeDetail → catalogService.getShowtimeDetail → SHOWTIME_GET_DETAIL → dbo.sp_Showtime_GetDetail |
| GET /api/showtimes/:showtimeId/seats | [showtimeRoutes.js](../backend/src/routes/showtimeRoutes.js) → bookingController.listSeats → bookingService.listSeats → SEAT_LIST_BY_SHOWTIME → dbo.sp_Seat_ListByShowtime |

Current UI source: [BookingPreparation.jsx](../frontend/src/pages/BookingPreparation.jsx). Raw mapping selector `/UCs/5` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-07"></a>

### KH-07 — Đặt vé

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /booking/:showtimeId → BookingPreparation.jsx |
| Mounted component | BookingPreparation / HoldDeadline;  |
| API client | catalogApi.createBooking |
| Authorization | authenticate→requireCustomer→requirePermission(DAT_VE); NguoiDungID trusted; SQL active/role/grant. |
| Request / type / null / money / date / identity | showtimeId INT; distinct seatIds number[]1–10; products[{productId,quantity1–10}]; optional trimmed promotionCode≤50; không amount/owner |
| Response / arrays / empty / nullable | {booking} HTTP201; id,total,holdExpiresAt do SQL chốt; no invented pagination envelope |
| Form state / async / pending / success/error | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. |
| Success behavior required | 201 một đơn, ticket snapshots/foods/quota đầy đủ; giữ5phút; invalid/concurrent/fault rollback toàn bộ. |
| Actual error contracts | 400 invalid/limits;401;403 Customer/DAT_VE;404 refs;409 seat/hold/show/promo;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E391](USE_CASE_MATRIX_45.md#evidence-e391) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E389](USE_CASE_MATRIX_45.md#evidence-e389) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E390](USE_CASE_MATRIX_45.md#evidence-e390) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. |
| Missing verification | R44 real booking 201 và stale promo409; chưa UI mất ghế, hết hold/max holds, double-submit và payment-link navigation. |
| Known/suspected issue | I-19 |
| Browser scenarios | Create201 once; immediate double click; stale mutation response after show switch; max3 live holds;409 seat/promo;201 total/hold/paymentlink+SQLsnapshot. |
| Fixture / dependency | F-CUSTOMER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Minimal state/identity/error fix after targeted reproduction; no redesign. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/bookings | [bookingRoutes.js](../backend/src/routes/bookingRoutes.js) → bookingController.createBooking → bookingService.createBooking → BOOKING_CREATE → dbo.sp_Booking_Create |

Current UI source: [BookingPreparation.jsx](../frontend/src/pages/BookingPreparation.jsx). Raw mapping selector `/UCs/6` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-08"></a>

### KH-08 — Đồ ăn kèm vé

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /booking/:showtimeId → BookingPreparation.jsx |
| Mounted component | ProductPicker / BookingPreparation;  |
| API client | catalogApi.getProducts/createBooking |
| Authorization | Products public; booking Customer+DAT_VE, không permission food mới. |
| Request / type / null / money / date / identity | GET products public; booking quantity0 loại bỏ, mỗi product1–10, không trần tổng10; cùng body KH-07 |
| Response / arrays / empty / nullable | {products[]} id/name/price/type + {booking}; product snapshot SQL; no invented pagination envelope |
| Form state / async / pending / success/error | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. |
| Success behavior required | Có/không food đúng; mỗi dòng quantity/unit snapshot; reject unavailable/qty11 hoặc duplicate split vượt10. |
| Actual error contracts | GET500/503; write400/401/403/404/409 theoKH-07; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E392](USE_CASE_MATRIX_45.md#evidence-e392) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E389](USE_CASE_MATRIX_45.md#evidence-e389) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E390](USE_CASE_MATRIX_45.md#evidence-e390) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. |
| Missing verification | R44 browser chọn1food và snapshot authoritative; chưa qty0/10/11, nhiều product, inactive product và empty list. |
| Known/suspected issue | I-19 |
| Browser scenarios | Zero removes line; quantity1/10/11 for each product, multiple products total>10 valid; inactive/empty/errors; A→B quantities reset. |
| Fixture / dependency | F-CUSTOMER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Minimal state/identity/error fix after targeted reproduction; no redesign. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/products | [productRoutes.js](../backend/src/routes/productRoutes.js) → bookingController.listProducts → bookingService.listProducts → PRODUCT_LIST_ACTIVE → dbo.sp_Product_ListActive |
| POST /api/bookings | [bookingRoutes.js](../backend/src/routes/bookingRoutes.js) → bookingController.createBooking → bookingService.createBooking → BOOKING_CREATE → dbo.sp_Booking_Create |

Current UI source: [BookingPreparation.jsx](../frontend/src/pages/BookingPreparation.jsx). Raw mapping selector `/UCs/7` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-09"></a>

### KH-09 — Khuyến mãi

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /booking/:showtimeId → BookingPreparation.jsx |
| Mounted component | BookingPreparation promotion preview;  |
| API client | catalogApi.validatePromotion/createBooking |
| Authorization | authenticate→Customer→DAT_VE; promotion SP nhận trusted customer; client không gửi accepted/amount. |
| Request / type / null / money / date / identity | POST showtimeId/seatIds/products/promotionCode bắt buộc; code≤50; không preview subtotal/accepted discount |
| Response / arrays / empty / nullable | {promotion} isValid/message/discountAmount provisional; booking.total final; no invented pagination envelope |
| Form state / async / pending / success/error | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. |
| Success behavior required | Preview read only; final tái kiểm dưới lock, discount snapshot/quota đúng; invalid yêu cầu409, không âm thầm full price. |
| Actual error contracts | 400 invalid;401;403 DAT_VE/role;409 changed promotion khi booking;500/503; invalid preview có thể200 isValid=false; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E393](USE_CASE_MATRIX_45.md#evidence-e393) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E391](USE_CASE_MATRIX_45.md#evidence-e391) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E394](USE_CASE_MATRIX_45.md#evidence-e394) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E392](USE_CASE_MATRIX_45.md#evidence-e392) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E389](USE_CASE_MATRIX_45.md#evidence-e389) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E429](USE_CASE_MATRIX_45.md#evidence-e429) Controlled HTTP timing stale-preview/explicitretry supplement; never HTTP_SQL. ; [E430](USE_CASE_MATRIX_45.md#evidence-e430) Controlled HTTP timing stale-preview/explicitretry supplement; never HTTP_SQL. ; [E431](USE_CASE_MATRIX_45.md#evidence-e431) Controlled HTTP timing stale-preview/explicitretry supplement; never HTTP_SQL. |
| Missing verification | R44 browser real stale/pause/requote/final price; R22 controlled timing. Chưa UI quota/minimum/expired, đổi code/seat/food với SQL thật. |
| Known/suspected issue | I-19 |
| Browser scenarios | Valid/invalid/expired/exhausted/minimum promo; edit seat/product/code while quote pending; latequote after A→B;409 forces deliberate review, no silent no-promo booking. |
| Fixture / dependency | F-CUSTOMER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Minimal state/identity/error fix after targeted reproduction; no redesign. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/promotions/validate | [promotionRoutes.js](../backend/src/routes/promotionRoutes.js) → bookingController.validatePromotion → bookingService.validatePromotion → SEAT_LIST_BY_SHOWTIME → dbo.sp_Seat_ListByShowtime; PRODUCT_LIST_ACTIVE → dbo.sp_Product_ListActive; PROMOTION_VALIDATE → dbo.sp_Promotion_Validate |
| POST /api/bookings | [bookingRoutes.js](../backend/src/routes/bookingRoutes.js) → bookingController.createBooking → bookingService.createBooking → BOOKING_CREATE → dbo.sp_Booking_Create |

Current UI source: [BookingPreparation.jsx](../frontend/src/pages/BookingPreparation.jsx). Raw mapping selector `/UCs/8` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-10"></a>

### KH-10 — Thanh toán

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /orders/:orderId/payment → PaymentPage.jsx |
| Mounted component | PaymentPage / HoldDeadline / StatusBadge;  |
| API client | ordersApi.getOrder/createPaymentAttempt/submitPaymentResult |
| Authorization | authenticate→Customer; pay writes THANH_TOAN; SQL ownership NguoiDungID và DonDatVeID/ThanhToanID. |
| Request / type / null / money / date / identity | orderId/paymentId path INT; {paymentMethod} enum6; {status} Thành công/Thất bại; UI hiện chỉ confirm Thành công; khôngamount |
| Response / arrays / empty / nullable | {order}; {payment}; {order} sau result; total/payments/compensation SQL; no invented pagination envelope |
| Form state / async / pending / success/error | resource/orderId load without generation, method/busy/message/deadline timers; reload after error; readonly GET cannot run expiry; result locks SQL, route-change stale risk. |
| Success behavior required | Attempt amount=stored order; fail/retry/success history, terminal idempotence/flip409, loyalty once, wrong owner404; hold không kéo dài. |
| Actual error contracts | 400 method/result;401;403 Customer/THANH_TOAN;404 owner-hidden order/payment;409 expiry/terminal;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E395](USE_CASE_MATRIX_45.md#evidence-e395) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E396](USE_CASE_MATRIX_45.md#evidence-e396) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. |
| Missing verification | R44 browser successful payment/SQL amount; chưa UI failed→retry history, expiry, revoked permission, terminal replay/flip. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Live successful payment amount; failed→retry branch availability;holdexpiry/terminal replay/no double-submit;foreignorder404/revokedgrant;order A→B stale result. |
| Fixture / dependency | F-CUSTOMER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/orders/:orderId/payments | [orderRoutes.js](../backend/src/routes/orderRoutes.js) → orderController.createPayment → orderService.createPaymentAttempt → ORDER_GET_DETAIL_BY_CUSTOMER → dbo.sp_Order_GetDetailByCustomer; PAYMENT_CREATE_ATTEMPT → dbo.sp_Payment_CreateAttempt |
| POST /api/orders/:orderId/payments/:paymentId/result | [orderRoutes.js](../backend/src/routes/orderRoutes.js) → orderController.updatePayment → orderService.updatePaymentResult → PAYMENT_UPDATE_RESULT → dbo.sp_Payment_UpdateResult; ORDER_GET_DETAIL_BY_CUSTOMER → dbo.sp_Order_GetDetailByCustomer |
| GET /api/orders/:orderId | [orderRoutes.js](../backend/src/routes/orderRoutes.js) → orderController.getOrder → orderService.getOrderDetail → ORDER_GET_DETAIL_BY_CUSTOMER → dbo.sp_Order_GetDetailByCustomer |

Current UI source: [PaymentPage.jsx](../frontend/src/pages/PaymentPage.jsx). Raw mapping selector `/UCs/9` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-11"></a>

### KH-11 — Lịch sử đơn

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /orders → Orders.jsx |
| Mounted component | Orders / StatusBadge;  |
| API client | ordersApi.getOrders |
| Authorization | authenticate→Customer; own GET không DAT_VE/THANH_TOAN write permission. |
| Request / type / null / money / date / identity | GET own /orders; không body; statusFilter là UX filter trên own returned list |
| Response / arrays / empty / nullable | {orders[]} owner-specific total/latestPaymentStatus; empty[]; no invented pagination envelope |
| Form state / async / pending / success/error | resource loading/error/retry/empty; statusFilter local on own rows; readonly list; no mutation. |
| Success behavior required | Chỉ đơn của Customer, lịch sử paid/failed/expired và số tiền snapshot đúng; không lộ đơn khác. |
| Actual error contracts | 401;403 wrong Customer role;500/503; không write grant bắt buộc; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser history nonempty/mixed statuses, empty, direct navigation và error retry. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Own pending/paid/expired/canceled list;zeroorders;localfilter;error/retry;crossroleguard and readable own list without writegrant. |
| Fixture / dependency | F-CUSTOMER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/orders | [orderRoutes.js](../backend/src/routes/orderRoutes.js) → orderController.listOrders → orderService.listOrders → ORDER_LIST_BY_CUSTOMER → dbo.sp_Order_ListByCustomer |

Current UI source: [Orders.jsx](../frontend/src/pages/Orders.jsx). Raw mapping selector `/UCs/10` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-12"></a>

### KH-12 — Chi tiết đơn

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /orders/:orderId → OrderDetail.jsx |
| Mounted component | OrderDetail / HoldDeadline;  |
| API client | ordersApi.getOrder |
| Authorization | authenticate→Customer; SQL trusted owner; GET không write permission. |
| Request / type / null / money / date / identity | GET orderId INT; owner JWT; no mutation/expiry job in GET |
| Response / arrays / empty / nullable | {order} tickets[]/products[]/payments[]/compensation&#124;null, totals SQL; no invented pagination envelope |
| Form state / async / pending / success/error | resource/orderId, loading/error/retry; hold timer/deadline; no generation/abort on route change; terminal money from SQL. |
| Success behavior required | Bốn recordsets đúng order/tickets/foods/payments; foreign404; GET expiry projection không write/quota mutation. |
| Actual error contracts | 400 path;401;403 wrong role;404 ownership/missing;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser full detail và expired/effective status, foreign404, timeline/foodempty; R44 PaymentPage order read không chứng minh OrderDetail component. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Own detail tickets/food/payments/compensation;foreign404;readonly SQLfingerprint;UTCdisplay/elapsedhold reload;order A→B race. |
| Fixture / dependency | F-CUSTOMER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/orders/:orderId | [orderRoutes.js](../backend/src/routes/orderRoutes.js) → orderController.getOrder → orderService.getOrderDetail → ORDER_GET_DETAIL_BY_CUSTOMER → dbo.sp_Order_GetDetailByCustomer |

Current UI source: [OrderDetail.jsx](../frontend/src/pages/OrderDetail.jsx). Raw mapping selector `/UCs/11` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-13"></a>

### KH-13 — Đánh giá

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /movies/:movieId → MovieDetail.jsx |
| Mounted component | MovieReviews;  |
| API client | feedbackApi.getReviews/createReview |
| Authorization | Public list; create authenticate→Customer→DANH_GIA; SQL current grant + eligibility trigger. |
| Request / type / null / money / date / identity | movieId INT; POST {rating number integer1–5,content nullable text≤1000}; no reviewerId |
| Response / arrays / empty / nullable | {reviews[]} public reviewerName; {review}201; eligibility SQL; no invented pagination envelope |
| Form state / async / pending / success/error | detail keyed movieId, showtimes keyed movie/cinema/date, AbortController; selected filters; no retry for detail/show list; review state separate. |
| Success behavior required | 201 review hợp lệ; noneligible403, duplicate409, invalidrating400; read after write list đúng. |
| Actual error contracts | GET400/500/503; POST400/401/403 DANH_GIA/409 ineligible or duplicate/500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser review create/list, eligibility/duplicate/permission/errors. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Eligible paid/past review201→list;ineligible/duplicate409;rating1/5/invalid;nullcontent/max1000;revokedgrant;movie A→B late list/submit. |
| Fixture / dependency | F-CUSTOMER + F-HISTORY/COMPLAINT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/movies/:movieId/reviews | [movieRoutes.js](../backend/src/routes/movieRoutes.js) → feedbackController.listReviews → feedbackService.listReviews → REVIEW_LIST_BY_MOVIE → dbo.sp_Review_ListByMovie |
| POST /api/movies/:movieId/reviews | [movieRoutes.js](../backend/src/routes/movieRoutes.js) → feedbackController.createReview → feedbackService.createReview → REVIEW_CREATE → dbo.sp_Review_Create |

Current UI source: [MovieDetail.jsx](../frontend/src/pages/MovieDetail.jsx). Raw mapping selector `/UCs/12` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-14"></a>

### KH-14 — Khiếu nại

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /complaints; /complaints/:complaintId → Complaints.jsx; ComplaintDetail.jsx |
| Mounted component | Complaints / ComplaintDetail;  |
| API client | feedbackApi.getComplaints/createComplaint/getComplaint; ordersApi.getOrders |
| Authorization | Customer; create GUI_KHIEU_NAI; own reads không cần write grant; trusted owner. |
| Request / type / null / money / date / identity | POST {type≤100,title≤200,content nonempty NVARCHARMAX,orderId nullable INT&#124;string digits}; own reads |
| Response / arrays / empty / nullable | {complaints[]}, {complaint}201 or detail with processingHistory[]; no invented pagination envelope |
| Form state / async / pending / success/error | list/submit controlled state, busy/error; order prefill ownership checks; getOrders failure becomes [] without feedback; no explicit order lookup retry. resource/complaintId loading/error/retry; no request generation; timeline+linked order display. |
| Success behavior required | 201 linked/unlinked, own list/detail + permitted processing timeline; foreign/missing order404, không lộ staff identity. |
| Actual error contracts | 400 invalid;401;403 Customer/GUI_KHIEU_NAI create;404 linked ownership/detail;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser linked/unlinked complaint submit, list/detail, status refresh và customer-safe timeline. |
| Known/suspected issue | I-21 |
| Browser scenarios | Linked/unlinked create201,ownhistory/timeline;spoof/foreign404;orderslookup403/500/network must not become [];retry;complaint A→B late detail. |
| Fixture / dependency | F-CUSTOMER + F-HISTORY/COMPLAINT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Minimal state/identity/error fix after targeted reproduction; no redesign. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/complaints | [complaintRoutes.js](../backend/src/routes/complaintRoutes.js) → feedbackController.createComplaint → feedbackService.createComplaint → COMPLAINT_CREATE → dbo.sp_Complaint_Create |
| GET /api/complaints | [complaintRoutes.js](../backend/src/routes/complaintRoutes.js) → feedbackController.listComplaints → feedbackService.listComplaints → COMPLAINT_LIST_BY_CUSTOMER → dbo.sp_Complaint_ListByCustomer |
| GET /api/complaints/:complaintId | [complaintRoutes.js](../backend/src/routes/complaintRoutes.js) → feedbackController.getComplaint → feedbackService.getComplaint → COMPLAINT_GET_BY_CUSTOMER → dbo.sp_Complaint_GetByCustomer |

Current UI source: [Complaints.jsx](../frontend/src/pages/Complaints.jsx), [ComplaintDetail.jsx](../frontend/src/pages/ComplaintDetail.jsx). Raw mapping selector `/UCs/13` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-01"></a>

### QLR-01 — Đăng nhập/rạp phân công

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /login; /manager → auth/Login.jsx; ManagerPortal.jsx |
| Mounted component | ManagerPortal / RequireRole;  |
| API client | authApi.login/getCurrentUser; managerApi.getAssignedCinemas |
| Authorization | authenticate→Manager; GETcinemas bootstrap không functional grant; SQL role+live assignment. |
| Request / type / null / money / date / identity | Email/MatKhau như KH-02; bootstrap GET manager/cinemas không functional grant |
| Response / arrays / empty / nullable | {user} role QUAN_LY_RAP/permissions/cinemaAssignments; {cinemas[]}; no invented pagination envelope |
| Form state / async / pending / success/error | Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role. assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | Login Manager; assigned list chỉ phân công còn hiệu lực; token cũ không giữ scope revoked/expired. |
| Actual error contracts | login400/401/429/500/503; manager401/403 wrong role; empty assigned200; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser login Manager→/manager, assigned selector và empty/expired/revoked scope. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Manager form login/me/grants;single/multiple/noassigned cinemas;revoked/expiredassignment with oldJWT;wrongrole/lockedaccount;realcinemalist. |
| Fixture / dependency | F-MANAGER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/auth/login | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.login → authService.login → AUTH_LOGIN → dbo.sp_Auth_Login |
| GET /api/auth/me | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentUser → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/auth/permissions | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentPermissions → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/manager/cinemas | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.listCinemas → managerService.listCinemas → MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

Current UI source: [Login.jsx](../frontend/src/pages/auth/Login.jsx), [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/14` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-02"></a>

### QLR-02 — Quản lý phòng

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerWorkspace / ManagerResourceForm room;  |
| API client | managerApi.getRooms/createRoom/updateRoom/deleteRoom |
| Authorization | authenticate→Manager→QL_PHONG; SQL scope từ phòng→rạp; không tin spoof cinemaId. |
| Request / type / null / money / date / identity | cinemaId/roomId path INT; create{name≤100,type enum}; update adds status enum; DELETE no body |
| Response / arrays / empty / nullable | {rooms[]}; {room}201/create or200/update; delete {message} authoritative; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | Scoped rooms CRUD; history guard/deactivate policy; concurrent dependency không partial delete; foreign403. |
| Actual error contracts | 400;401;403 QL_PHONG/current scope;404 refs;409 history;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser room CRUD, history/deactivate conflict, denied scope and refresh list. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Room create/edit/delete empty;referencedhistory409;scope/permissiondenied;refresh;switch cinema midload/write;error does not erase other grantedsections. |
| Fixture / dependency | F-MANAGER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/manager/cinemas/:cinemaId/rooms | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.listRooms → managerService.listRooms → MANAGER_ROOM_LIST → dbo.sp_Manager_Room_List |
| POST /api/manager/cinemas/:cinemaId/rooms | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.createRoom → managerService.createRoom → MANAGER_ROOM_CREATE → dbo.sp_Manager_Room_Create |
| PUT /api/manager/rooms/:roomId | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.updateRoom → managerService.updateRoom → MANAGER_ROOM_UPDATE → dbo.sp_Manager_Room_Update |
| DELETE /api/manager/rooms/:roomId | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.deleteRoom → managerService.deleteRoom → MANAGER_ROOM_DELETE → dbo.sp_Manager_Room_Delete |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/15` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-03"></a>

### QLR-03 — Quản lý sơ đồ ghế

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerWorkspace / ManagerResourceForm seat;  |
| API client | managerApi.getSeats/createSeat/updateSeat/deleteSeat |
| Authorization | Manager+QL_GHE; indirect parent scope và current grant ở BE+SQL. |
| Request / type / null / money / date / identity | roomId/seatId INT; create{row≤10,number positive INT,type}; update{type,status}; không đổi row/number |
| Response / arrays / empty / nullable | {seats[]} camelCase; {seat}; delete{deleted:true}; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | Seat CRUD đúng room; type lịch sử immutable; active future ticket bảo vệ deactivate/delete; foreign403. |
| Actual error contracts | 400;401;403 QL_GHE/scope;404;409 ticket/history/duplicates;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E425](USE_CASE_MATRIX_45.md#evidence-e425) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E426](USE_CASE_MATRIX_45.md#evidence-e426) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E427](USE_CASE_MATRIX_45.md#evidence-e427) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E428](USE_CASE_MATRIX_45.md#evidence-e428) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. |
| Missing verification | R32 controlled browser edit/retry; chưa SQL-backed seat create/delete, layout và future-seat/history conflict UI. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Seat room loading/edit/delete/empty;row-number immutable update;ticket history409;wrongroom/grantdenied;late room A load after B. |
| Fixture / dependency | F-MANAGER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/manager/rooms/:roomId/seats | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.listSeats → managerService.listSeats → MANAGER_SEAT_LIST_BY_ROOM → dbo.sp_Manager_Seat_ListByRoom |
| POST /api/manager/rooms/:roomId/seats | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.createSeat → managerService.createSeat → MANAGER_SEAT_CREATE → dbo.sp_Manager_Seat_Create |
| PUT /api/manager/seats/:seatId | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.updateSeat → managerService.updateSeat → MANAGER_SEAT_UPDATE → dbo.sp_Manager_Seat_Update |
| DELETE /api/manager/seats/:seatId | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.deleteSeat → managerService.deleteSeat → MANAGER_SEAT_DELETE → dbo.sp_Manager_Seat_Delete |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/16` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-04"></a>

### QLR-04 — Tạo suất chiếu

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerResourceForm showtime create;  |
| API client | managerApi.getManagerShowtimes/createManagerShowtime |
| Authorization | Manager+QL_SUAT_CHIEU; scope from actual room; role/assignment live. |
| Request / type / null / money / date / identity | {movieId,roomId INT,startsAt/endsAt UTC ISO,format enum,basePrice DECIMAL18,2≥0}; end>start |
| Response / arrays / empty / nullable | {showtime}201; {showtimes[]}; UTC times; no holiday; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | 201 correctshow; overlap409 kể cả concurrency; invalid parents/foreign scope không write. |
| Actual error contracts | 400;401;403 QL_SUAT_CHIEU/scope;404 refs;409 overlap;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser show create, room/movie selection, overlap conflict and successful reload. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Future show create UTC201;end/start/duration invalid;overlap409;foreignroom403;selectedcinemascope;reloadpersisted shows. |
| Fixture / dependency | F-MANAGER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/manager/cinemas/:cinemaId/showtimes | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.listShowtimes → managerService.listShowtimes → MANAGER_SHOWTIME_LIST → dbo.sp_Manager_Showtime_List |
| POST /api/manager/showtimes | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.createShowtime → managerService.createShowtime → MANAGER_SHOWTIME_CREATE → dbo.sp_Manager_Showtime_Create |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/17` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-05"></a>

### QLR-05 — Sửa suất chiếu

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerResourceForm showtime edit;  |
| API client | managerApi.updateManagerShowtime |
| Authorization | Manager+QL_SUAT_CHIEU; show→room→cinema trusted scope. |
| Request / type / null / money / date / identity | {movieId,startsAt,endsAt,format,basePrice,status}; roomId không thuộc update; UTC offset bắt buộc |
| Response / arrays / empty / nullable | {showtime}; history immutability SQL; refresh list; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | 200 allowed edits; overlap409/history409; payload không reset identity/price/time ngoài intention. |
| Actual error contracts | 400;401;403 scope/grant;404;409 history/overlap/cancel route;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E417](USE_CASE_MATRIX_45.md#evidence-e417) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E418](USE_CASE_MATRIX_45.md#evidence-e418) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E419](USE_CASE_MATRIX_45.md#evidence-e419) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E420](USE_CASE_MATRIX_45.md#evidence-e420) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. |
| Missing verification | R32 controlled browser persisted edit/retry; chưa realSQL full update/history/overlap UI. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Hydrate/edit allowed future show;roomId excluded;historyimmutable409;overlap;switch scope midwrite;no stale editor changes. |
| Fixture / dependency | F-MANAGER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/manager/cinemas/:cinemaId/showtimes | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.listShowtimes → managerService.listShowtimes → MANAGER_SHOWTIME_LIST → dbo.sp_Manager_Showtime_List |
| PUT /api/manager/showtimes/:showtimeId | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.updateShowtime → managerService.updateShowtime → MANAGER_SHOWTIME_UPDATE → dbo.sp_Manager_Showtime_Update |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/18` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-06"></a>

### QLR-06 — Hủy suất chiếu

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerWorkspace cancel action;  |
| API client | managerApi.cancelManagerShowtime |
| Authorization | Manager+QL_SUAT_CHIEU; resource-derived cinema scope; trusted user ID. |
| Request / type / null / money / date / identity | POST /cancel reason optional≤255; UI default{}; identity JWT, no status PUT shortcut |
| Response / arrays / empty / nullable | {cancelled:true}; reload showtimes; compensation SQL; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | Cancel200 preserve history; started show/live order reject409; expired/canceled orders do not block incorrectly. |
| Actual error contracts | 400 invalid reason/path;401;403 scope/grant;404;409 held/started;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser cancel success, held/paid denial, expired-order policy and refresh show list. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Cancel unusedfuture show;heldorder409;started/historyrules;paid cancellation compensation exactlyonce;reload;scope/grantdenied. |
| Fixture / dependency | F-MANAGER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/manager/showtimes/:showtimeId/cancel | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.cancelShowtime → managerService.cancelShowtime → MANAGER_SHOWTIME_CANCEL → dbo.sp_Manager_Showtime_Cancel |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/19` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-07"></a>

### QLR-07 — Cấu hình bảng giá

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerResourceForm pricing;  |
| API client | managerApi.getPricing/createPricing/updatePricing |
| Authorization | Manager+QL_BANG_GIA; create/list actual cinema, update lookup pricing→cinema; no scope spoof. |
| Request / type / null / money / date / identity | seatType/dayType/format enums; surcharge DECIMAL18,2≥0; startsOn DATE/endsOn nullable DATE; update addsstatus/fullgroup |
| Response / arrays / empty / nullable | {pricing[]}; {pricing}; price function SQL; no Ngày lễ; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | Scoped create/update/readback; overlap409; three official day types, open ended dateNULL; authoritative ticket price. |
| Actual error contracts | 400;401;403 QL_BANG_GIA/scope;404;409 overlap;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser Manager pricing create/update/full condition/NULL dates/overlap/assigned access; R43 browser chỉ Admin form. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Create/full edit all dimensions/nullend/status;decimal surcharge;daytype3/noholiday;overlap409;current scope;filter;historicalprices unchanged. |
| Fixture / dependency | F-MANAGER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/manager/cinemas/:cinemaId/pricing | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.listPricing → managerService.listPricing → MANAGER_PRICING_LIST → dbo.sp_Manager_Pricing_List |
| POST /api/manager/cinemas/:cinemaId/pricing | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.createPricing → managerService.createPricing → MANAGER_PRICING_CREATE → dbo.sp_Manager_Pricing_Create |
| PUT /api/manager/pricing/:pricingId | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.updatePricing → managerService.updatePricing → MANAGER_PRICING_UPDATE → dbo.sp_Manager_Pricing_Update |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/20` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-08"></a>

### QLR-08 — Dashboard hoạt động rạp

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerWorkspace dashboard;  |
| API client | managerApi.getDashboard |
| Authorization | Manager+XEM_BAO_CAO_RAP; fn_KiemTraQuanLyRapScope current, not Admin report authority. |
| Request / type / null / money / date / identity | GET cinemaId INT; no occupancy input/newformula |
| Response / arrays / empty / nullable | {dashboard} activeRooms/activeSeats/showtimesToday/paidOrdersToday; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | Room/seat active counts, today shows/paid orders scoped and businessdate correct; foreign403. |
| Actual error contracts | 400 path;401;403 XEM_BAO_CAO_RAP/current scope;404 cinema;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser metrics, đổi cinema, empty/zero data, loading/error and denied scope. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Independently seeded active/inactive rooms/seats,today/canceled shows,receipt midnight UTC+7;assert four metrics including active seats in inactive room;scope/denied/zero/error. |
| Fixture / dependency | F-MANAGER + F-REPORT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/manager/cinemas/:cinemaId/dashboard | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.dashboard → managerService.dashboard → MANAGER_DASHBOARD → dbo.sp_Manager_Dashboard |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/21` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-09"></a>

### QLR-09 — Doanh thu rạp

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerRevenue;  |
| API client | managerApi.getRevenue |
| Authorization | Manager+XEM_BAO_CAO_RAP; live assigned scope; Admin revenue tests cannot substitute Manager. |
| Request / type / null / money / date / identity | GET cinemaId; optional fromDate/toDate DATE inclusive; absent dates SQL default; from≤to |
| Response / arrays / empty / nullable | {revenue[]} date,totalRevenue,orderCount; receipts/snapshots SQL; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. ManagerRevenue active effect guard/attempt retry; range form validates from≤to. |
| Success behavior required | Only successful receipts scoped to cinema/date; ticket/food/discount/paid totals SQL-derived; no false revenue from pending/failed. |
| Actual error contracts | 400 path/range;401;403 XEM_BAO_CAO_RAP/scope;404 cinema;500/503; empty200; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser date filtering, numeric totals, empty/retry/foreign cinema and zero rows. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Independent paidreceipt ledger across midnight/failed/canceled;inclusive/default/datebounds;empty/error/retry;scope/grantrevocation;SQLtotals rendered. |
| Fixture / dependency | F-MANAGER + F-REPORT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/manager/cinemas/:cinemaId/revenue | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.revenue → managerService.revenue → MANAGER_REVENUE → dbo.sp_Manager_Revenue |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/22` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-cskh-01"></a>

### CSKH-01 — Đăng nhập

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /login; /support → auth/Login.jsx; SupportPortal.jsx |
| Mounted component | Login / SupportPortal / RequireRole;  |
| API client | authApi.login/getCurrentUser |
| Authorization | Public login; authenticated support route CSKH + QL_KHIEUNAI; SQL active/current role. |
| Request / type / null / money / date / identity | Email/MatKhau; current role CSKH plus QL_KHIEUNAI for /support guard |
| Response / arrays / empty / nullable | {user} current permissions; no inherited Admin bypass; no invented pagination envelope |
| Form state / async / pending / success/error | Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role. queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. |
| Success behavior required | Login200 current CSKH identity/grants; active-account recheck; route appropriate area. |
| Actual error contracts | login400/401/429/500/503; area401/403 role/grants; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser login CSKH→support, missingQL permission/forbidden, refresh session. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Login CSKH/me;QL_KHIEUNAI area grant;wrongrole/missinggrant/inactiveoldJWT;no unintended Admin navigation. |
| Fixture / dependency | F-SUPPORT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/auth/login | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.login → authService.login → AUTH_LOGIN → dbo.sp_Auth_Login |
| GET /api/auth/me | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentUser → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/auth/permissions | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentPermissions → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

Current UI source: [Login.jsx](../frontend/src/pages/auth/Login.jsx), [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx). Raw mapping selector `/UCs/23` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-cskh-02"></a>

### CSKH-02 — Hàng chờ khiếu nại

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /support → SupportPortal.jsx |
| Mounted component | SupportPortal queue;  |
| API client | supportApi.getSupportComplaints |
| Authorization | authenticate→requireSupport→QL_KHIEUNAI; SQL allows CSKH/Admin + exact grant. |
| Request / type / null / money / date / identity | GET status≤50/type≤100/search≤100/priority≤50 enum4; omit empty; AND SQL; current UI lacks priority |
| Response / arrays / empty / nullable | {complaints[]} id,title,priority,status,senderName,processingCount; empty[]; no invented pagination envelope |
| Form state / async / pending / success/error | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. |
| Success behavior required | Queue permitted complaints; design calls for status/priority filter; current supports status/type/search, priority sort only. |
| Actual error contracts | 400 INVALID_PRIORITY/unknown query;401;403 CSKH+QL_KHIEUNAI;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser queue/filter/empty/error/retry; priority filter contract discrepancy follows DB/BE decision, UI followup deferredR8. |
| Known/suspected issue | I-15; R72 priority |
| Browser scenarios | Status+priority+type+search AND oracle;all4 enum/default/invalid400;filter A slow→B fast;queue/loading/error onlyB;empty/error/retry. |
| Fixture / dependency | F-SUPPORT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Align supported controls/response display/decimal input; keep backend authority. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/support/complaints | [supportRoutes.js](../backend/src/routes/supportRoutes.js) → supportController.list → supportService.list → SUPPORT_COMPLAINT_LIST → dbo.sp_Support_Complaint_List |

Current UI source: [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx). Raw mapping selector `/UCs/24` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-cskh-03"></a>

### CSKH-03 — Chi tiết khiếu nại

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /support → SupportPortal.jsx |
| Mounted component | SupportPortal detail/timeline;  |
| API client | supportApi.getSupportComplaint |
| Authorization | CSKH + QL_KHIEUNAI; authenticate current user; SQL staff-role/grant. |
| Request / type / null / money / date / identity | complaintId path INT; role CSKH +QL_KHIEUNAI; no body |
| Response / arrays / empty / nullable | {complaint} plus processings[]; nullable orderId/processorName; no invented pagination envelope |
| Form state / async / pending / success/error | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. |
| Success behavior required | Read parent/customer/order IDs and full allowed processing history; missing404; no unrelated scope restrictions invented. |
| Actual error contracts | 400 path;401;403;404 COMPLAINT_NOT_FOUND;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser select/switch complaint, full timeline, notfound/retry, detail stale-response guard. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Detail A slow→B fast guarded;timeline/maxidentity order;404/grant403;retry;unmount;selection consistent. |
| Fixture / dependency | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/support/complaints/:complaintId | [supportRoutes.js](../backend/src/routes/supportRoutes.js) → supportController.detail → supportService.detail → SUPPORT_COMPLAINT_GET_DETAIL → dbo.sp_Support_Complaint_GetDetail |

Current UI source: [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx). Raw mapping selector `/UCs/25` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-cskh-04"></a>

### CSKH-04 — Đơn tham chiếu

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /support → SupportPortal.jsx |
| Mounted component | ComplaintOrderReference / OrderReferenceDetails;  |
| API client | supportApi.getComplaintOrderReference |
| Authorization | requirePermission AND(QL_KHIEUNAI,TRA_CUU_DON); SQL repeats both; staff trusted identity. |
| Request / type / null / money / date / identity | GET complaintId; QL_KHIEUNAI AND TRA_CUU_DON; key remount selectedId/permission |
| Response / arrays / empty / nullable | {order:null,message} unlinked OR {order} tickets/products/payments/history/total; no invented pagination envelope |
| Form state / async / pending / success/error | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. Shared reference has active request guard, explicit loading/error/empty/retry; mounted only by SupportPortal. |
| Success behavior required | Linked full referenced order+items+payments; unlinked order:null message; missingonegrant403 no leakage. |
| Actual error contracts | 400 path;401;403 grants;404 COMPLAINT_NOT_FOUND/ORDER_NOT_FOUND;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser linked/unlinked, each denied permission, switchingcomplaint and full monetary/payment reference. |
| Known/suspected issue | I-21 |
| Browser scenarios | Linked full order;unlinked200 ordernull;403/404/500/network visibly error with retry;late A reference after B;current permission removal. |
| Fixture / dependency | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/support/complaints/:complaintId/order-reference | [supportRoutes.js](../backend/src/routes/supportRoutes.js) → supportController.orderReference → supportService.orderReference → SUPPORT_COMPLAINT_GET_ORDER_REFERENCE → dbo.sp_Support_Complaint_GetOrderReference |

Current UI source: [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx). Raw mapping selector `/UCs/26` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-cskh-05"></a>

### CSKH-05 — Ghi lần xử lý

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /support → SupportPortal.jsx |
| Mounted component | SupportPortal processing form;  |
| API client | supportApi.addComplaintProcessing |
| Authorization | AND(QL_KHIEUNAI,XULY_KHIEUNAI) at route+SQL; role CSKH/Admin. |
| Request / type / null / money / date / identity | POST {content nonempty NVARCHARMAX,nextStatus enum excluding Mới}; complaintId path; current actor |
| Response / arrays / empty / nullable | {processing}; append history, refresh queue/detail; no invented pagination envelope |
| Form state / async / pending / success/error | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. |
| Success behavior required | 201 appended processing and parentstatus; no overwrite oldevents; invalid/writefault complete rollback. |
| Actual error contracts | 400 invalid;401;403 QL_KHIEUNAI+XULY_KHIEUNAI;404;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser append, validation/denied permissions, detail/queue refresh and timeline after retry. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Append processing then queue+detail refresh;switch selection while write pending;double submit;invalid/Mới400;grantdeny;exact actor/complaintSQL. |
| Fixture / dependency | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/support/complaints/:complaintId/processings | [supportRoutes.js](../backend/src/routes/supportRoutes.js) → supportController.addProcessing → supportService.addProcessing → SUPPORT_COMPLAINT_ADD_PROCESSING → dbo.sp_Support_Complaint_AddProcessing |

Current UI source: [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx). Raw mapping selector `/UCs/27` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-cskh-06"></a>

### CSKH-06 — Đổi trạng thái

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /support → SupportPortal.jsx |
| Mounted component | SupportPortal status form;  |
| API client | supportApi.updateComplaintStatus |
| Authorization | AND(QL_KHIEUNAI,XULY_KHIEUNAI); current staff role/grants and trusted actor. |
| Request / type / null / money / date / identity | PUT {status} processing enum excluding Mới; complaintId path; current actor |
| Response / arrays / empty / nullable | {complaint:{id,status}}; append timeline SQL; no invented pagination envelope |
| Form state / async / pending / success/error | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. |
| Success behavior required | Status command appends auditprocessing, deterministic parentstatus independent manipulated timestamps; no partialwrite. |
| Actual error contracts | 400 invalid;401;403 QL_KHIEUNAI+XULY_KHIEUNAI;404;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser status change, audit append, validation/permission denial and refreshed detail/queue. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Status change appendhistory;switch selection pending;double click;invalid/Mới400;latest committed status;grantdeny;reloadtimeline. |
| Fixture / dependency | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| PUT /api/support/complaints/:complaintId/status | [supportRoutes.js](../backend/src/routes/supportRoutes.js) → supportController.updateStatus → supportService.updateStatus → SUPPORT_COMPLAINT_UPDATE_STATUS → dbo.sp_Support_Complaint_UpdateStatus |

Current UI source: [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx). Raw mapping selector `/UCs/28` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-01"></a>

### ADM-01 — Đăng nhập

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /login; /admin → auth/Login.jsx; AdminPortal.jsx |
| Mounted component | Login / AdminPortal / RequireRole;  |
| API client | authApi.login/getCurrentUser |
| Authorization | Public login; /admin role ADMIN; each API authenticate→Admin→exact grant. |
| Request / type / null / money / date / identity | Email/MatKhau; default /admin; section gates by current grants; route role ADMIN |
| Response / arrays / empty / nullable | {user} current permissions; no all-permission shortcut; no invented pagination envelope |
| Form state / async / pending / success/error | Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role. active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Login200 ADMIN/current grants; revoked grant affects operation despite old token. |
| Actual error contracts | login400/401/429/500/503; admin401/403; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser Admin login→portal, module access after permission removal, session reload. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Admin login/currentgrants/defaultarea;deniedmodules hidden;wrongrole/lockedJWT;no all-grant shortcut;modulepermission removal. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/auth/login | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.login → authService.login → AUTH_LOGIN → dbo.sp_Auth_Login |
| GET /api/auth/me | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentUser → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/auth/permissions | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentPermissions → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

Current UI source: [Login.jsx](../frontend/src/pages/auth/Login.jsx), [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/29` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-02"></a>

### ADM-02 — Tài khoản người dùng

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section users;  |
| API client | adminApi.users/create/update(users/:id/status) |
| Authorization | authenticate→requireAdmin→QL_NGUOIDUNG; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | create{name≤100,email≤150,password8–72bytes,phone optional≤20,roleId INT}; raw roleId field currently unbounded by role code; status only update |
| Response / arrays / empty / nullable | {users[]} raw SQL columns; {user}200 create; list/status includesallroles; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | List/create user và status change readback; no arbitrary role/owner input, invalid/reference/duplicate không write. |
| Actual error contracts | 400 refs/input;401;403 QL_NGUOIDUNG/ROLE_CREATE_FORBIDDEN;404 user;409 duplicates;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | User create/status/list UI, duplicate/invalidrole, lockedaccount and reload. |
| Known/suspected issue | R72 create allowlist UX |
| Browser scenarios | Role choice onlyManager/CSKH/Admin from authoritative IDs;threecreates200/noCustomerprofile;tampered Customer/custom403 visible;duplicates;list/statusallroles;double submit. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Align supported controls/response display/decimal input; keep backend authority. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/users | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.users → adminService.users → ADMIN_USER_LIST → dbo.sp_Admin_User_List |
| POST /api/admin/users | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createUser → adminService.createUser → ADMIN_USER_CREATE → dbo.sp_Admin_User_Create |
| PUT /api/admin/users/:userId/status | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateUserStatus → adminService.setUserStatus → ADMIN_USER_UPDATE_STATUS → dbo.sp_Admin_User_UpdateStatus |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/30` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-03"></a>

### ADM-03 — Vai trò

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section roles;  |
| API client | adminApi.roles/create/update/remove |
| Authorization | authenticate→requireAdmin→QL_VAITRO; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | create{code≤50,name≤100,description nullable≤255}; update no code; DELETE roleId |
| Response / arrays / empty / nullable | {roles[]} SQL columns; {role}; delete{result}; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | List/create/update/delete safe role; dependency conflicts keep references. |
| Actual error contracts | 400;401;403 QL_VAITRO;404 role;409 role in use/duplicate;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Role CRUD form, usedrole delete conflict and list reload. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Create/edit/delete unused role;code immutable;role in use409;empty/error/retry;currentgrant;no crossmodule editor/write response. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/roles | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.roles → adminService.roles → ADMIN_ROLE_LIST → dbo.sp_Admin_Role_List |
| POST /api/admin/roles | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createRole → adminService.createRole → ADMIN_ROLE_CREATE → dbo.sp_Admin_Role_Create |
| PUT /api/admin/roles/:roleId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateRole → adminService.updateRole → ADMIN_ROLE_UPDATE → dbo.sp_Admin_Role_Update |
| DELETE /api/admin/roles/:roleId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteRole → adminService.deleteRole → ADMIN_ROLE_DELETE → dbo.sp_Admin_Role_Delete |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/31` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-04"></a>

### ADM-04 — Danh mục quyền

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section permissions;  |
| API client | adminApi.permissions/create/update/remove |
| Authorization | authenticate→requireAdmin→QL_QUYEN; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | create{code≤50,name≤100,description nullable≤255}; update no code; DELETE permissionId |
| Response / arrays / empty / nullable | {permissions[]} SQL columns; {permission}; delete{result}; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | List/create/update/delete allowedpermission; duplicate/dependency conflicts safe. |
| Actual error contracts | 400;401;403 QL_QUYEN;404;409 permission in use/duplicate;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Permission CRUD, usedgrant delete conflict, missingpermission behavior. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Create/edit/delete unusedpermission;code immutable;referenced409;invalid/duplicates;error/retry/currentgrant. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/permissions | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.permissions → adminService.permissions → ADMIN_PERMISSION_LIST → dbo.sp_Admin_Permission_List |
| POST /api/admin/permissions | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createPermission → adminService.createPermission → ADMIN_PERMISSION_CREATE → dbo.sp_Admin_Permission_Create |
| PUT /api/admin/permissions/:permissionId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updatePermission → adminService.updatePermission → ADMIN_PERMISSION_UPDATE → dbo.sp_Admin_Permission_Update |
| DELETE /api/admin/permissions/:permissionId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deletePermission → adminService.deletePermission → ADMIN_PERMISSION_DELETE → dbo.sp_Admin_Permission_Delete |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/32` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-05"></a>

### ADM-05 — Gán quyền vai trò

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section permissions / role grants;  |
| API client | adminApi.rolePermissions/update(roles/:id/permissions) |
| Authorization | authenticate→requireAdmin→QL_QUYEN; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | roleId path INT; PUT {permissionIds:number[]} CSV→array, []valid; authenticated Admin QL_QUYEN |
| Response / arrays / empty / nullable | {permissions[]} SQL QuyenID; authoritative atomic replace, no additive client assumption; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | List current grants, set full list/empty atomically; stale token sees current permissions. |
| Actual error contracts | 400 array/INT;401;403 QL_QUYEN;404 role/permission;409 refs/conflict;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Role grant editor load/set/explicitempty, invalidFK keeps grants, currentUI access update. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Read grants A slow→B fast;atomicreplaceempty/nonempty;unknown/duplicateIDs;revokedQL_QUYEN;writepending target unchanged;live sessiongrant refresh. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/roles/:roleId/permissions | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.rolePermissions → adminService.rolePermissions → ADMIN_ROLE_PERMISSION_LIST → dbo.usp_Admin_RolePermission_List |
| PUT /api/admin/roles/:roleId/permissions | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.setRolePermissions → adminService.setRolePermissions → ADMIN_ROLE_PERMISSION_SET → dbo.sp_Admin_RolePermission_Set |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/33` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-06"></a>

### ADM-06 — Phân công quản lý

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section assignments;  |
| API client | adminApi.assignments/create/update |
| Authorization | authenticate→requireAdmin→PHANCONG_RAP; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | {userId,cinemaId INT,startsOn DATE,endsOn nullable DATE,status}; create only Hiệu lực; ends≥starts |
| Response / arrays / empty / nullable | {assignments[]} SQL cols; {assignment}; no DELETE workflow; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Assignment read/create/update/revoke; Manager assigned scope immediately follows persisted date/status. |
| Actual error contracts | 400;401;403 PHANCONG_RAP;404;409 duplicate;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Assignment create/update/revoke forms, manager/cinema validation, scope refresh. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Assign Manager to cinema with dynamicdates;revoke/end assignment;overlap/duplicate409;invalidwrongrole/date400;reload and current Manager scope effect. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/assignments | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.assignments → adminService.assignments → ADMIN_ASSIGNMENT_LIST → dbo.sp_Admin_Assignment_List |
| POST /api/admin/assignments | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createAssignment → adminService.createAssignment → ADMIN_ASSIGNMENT_CREATE → dbo.sp_Admin_Assignment_Create |
| PUT /api/admin/assignments/:assignmentId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateAssignment → adminService.updateAssignment → ADMIN_ASSIGNMENT_UPDATE → dbo.usp_Admin_Assignment_Update |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/34` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-07"></a>

### ADM-07 — Rạp và hình ảnh

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section cinemas / cinemaImages / CinemaImageManager;  |
| API client | adminApi.cinemas/create/update/remove + cinema image helpers |
| Authorization | authenticate→requireAdmin→QL_RAP; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | cinema create/update name150/address255/city100/phone20/description500/status; images url500/description255/displayOrder INT/status/cover BIT |
| Response / arrays / empty / nullable | {cinemas[]} raw rows; {cinema}; {images[]}; {image}201/create; cover PATCH; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Cinema CRUD; image list/create/update/delete/setcover persists; invalidforeignimage does not mutate. |
| Actual error contracts | 400 types/enums/url;401;403 QL_RAP;404 scope/image;409 inactive cover/referenced cinema;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Cinema and image CRUD/setcover/reorder selection, orphan/foreignimage denial and empty images. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | CinemaCRUD/useddelete409;images add/edit/delete/cover;inactivecover409;switchcinema whileload/write;singlecoverSQL;imagefallback/publicgallery;errors/grants. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/cinemas | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.cinemas → adminService.cinemas → ADMIN_CINEMA_LIST → dbo.usp_Admin_Cinema_List |
| POST /api/admin/cinemas | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createCinema → adminService.createCinema → ADMIN_CINEMA_CREATE → dbo.sp_Admin_Cinema_Create |
| PUT /api/admin/cinemas/:cinemaId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateCinema → adminService.updateCinema → ADMIN_CINEMA_UPDATE → dbo.sp_Admin_Cinema_Update |
| DELETE /api/admin/cinemas/:cinemaId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteCinema → adminService.deleteCinema → ADMIN_CINEMA_DELETE → dbo.sp_Admin_Cinema_Delete |
| GET /api/admin/cinemas/:cinemaId/images | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.cinemaImages → adminService.cinemaImages → ADMIN_CINEMA_IMAGE_LIST → dbo.usp_Admin_CinemaImage_List |
| POST /api/admin/cinemas/:cinemaId/images | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createCinemaImage → adminService.createCinemaImage → ADMIN_CINEMA_IMAGE_CREATE → dbo.usp_Admin_CinemaImage_Create |
| PUT /api/admin/cinemas/:cinemaId/images/:imageId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateCinemaImage → adminService.updateCinemaImage → ADMIN_CINEMA_IMAGE_UPDATE → dbo.usp_Admin_CinemaImage_Update |
| DELETE /api/admin/cinemas/:cinemaId/images/:imageId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteCinemaImage → adminService.deleteCinemaImage → ADMIN_CINEMA_IMAGE_DELETE → dbo.usp_Admin_CinemaImage_Delete |
| PATCH /api/admin/cinemas/:cinemaId/images/:imageId/cover | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.setCinemaImageCover → adminService.setCinemaImageCover → ADMIN_CINEMA_IMAGE_SET_COVER → dbo.usp_Admin_CinemaImage_SetCover |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/35` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-08"></a>

### ADM-08 — Phòng và ghế toàn hệ

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section rooms / seats;  |
| API client | adminApi.rooms/seats/create/update/remove |
| Authorization | authenticate→requireAdmin→QL_GHE, QL_PHONG; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | rooms create cinemaId/name100/type; seats roomId/row10/number/type; update names/type/status; DELETE specificresource |
| Response / arrays / empty / nullable | {rooms[]},{seats[]} SQL raw columns; {room}/{seat}/{result}; no client seatCountauthority; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Allsystem room/seat CRUD + safe history/delete; no Manager assignment needed for Admin. |
| Actual error contracts | 400;401;403 QL_PHONG or QL_GHE;404;409 history/references;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E421](USE_CASE_MATRIX_45.md#evidence-e421) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E422](USE_CASE_MATRIX_45.md#evidence-e422) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E423](USE_CASE_MATRIX_45.md#evidence-e423) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E424](USE_CASE_MATRIX_45.md#evidence-e424) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. |
| Missing verification | Room/seat create/delete/history conflicts and SQL-backed edit; R32 controlled updates cover only a subset. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Rooms/seats CRUD and empty-delete;referenced show/ticket409;immutable seat row-number;appropriategrants each;refresh/editor scope. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/rooms | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.rooms → adminService.rooms → ADMIN_ROOM_LIST → dbo.usp_Admin_Room_List |
| POST /api/admin/rooms | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createRoom → adminService.createRoom → ADMIN_ROOM_CREATE → dbo.usp_Admin_Room_Create |
| PUT /api/admin/rooms/:roomId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateRoom → adminService.updateRoom → ADMIN_ROOM_UPDATE → dbo.usp_Admin_Room_Update |
| DELETE /api/admin/rooms/:roomId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteRoom → adminService.deleteRoom → ADMIN_ROOM_DELETE → dbo.usp_Admin_Room_Delete |
| GET /api/admin/seats | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.seats → adminService.seats → ADMIN_SEAT_LIST → dbo.usp_Admin_Seat_List |
| POST /api/admin/seats | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createSeat → adminService.createSeat → ADMIN_SEAT_CREATE → dbo.usp_Admin_Seat_Create |
| PUT /api/admin/seats/:seatId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateSeat → adminService.updateSeat → ADMIN_SEAT_UPDATE → dbo.usp_Admin_Seat_Update |
| DELETE /api/admin/seats/:seatId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteSeat → adminService.deleteSeat → ADMIN_SEAT_DELETE → dbo.usp_Admin_Seat_Delete |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/36` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-09"></a>

### ADM-09 — Phim và diễn viên

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section movies / actors / cast;  |
| API client | adminApi.movies/actors/create/update/remove + update(movies/:id/actors) |
| Authorization | authenticate→requireAdmin→QL_DANHMUC_PHIM; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | movies title255/duration INT/release DATE/end nullable/genreIds[]/optionaltext; cast[{actorId,role≤150}]; actors name150/birthDate DATE/nationality100 |
| Response / arrays / empty / nullable | {movies[]},{actors[]} rawrows; {movie}201/create; {actors} cast result; currentcatalog labels; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Movie/actor CRUD, correctcast hydrate/set/clear; invalidgenre/cast leaves full old data. |
| Actual error contracts | 400 INT/dates/enums/cast;401;403 QL_DANHMUC_PHIM;404;409 history/refs/duplicate;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E407](USE_CASE_MATRIX_45.md#evidence-e407) Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim. ; [E408](USE_CASE_MATRIX_45.md#evidence-e408) Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim. ; [E409](USE_CASE_MATRIX_45.md#evidence-e409) Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim. ; [E410](USE_CASE_MATRIX_45.md#evidence-e410) Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim. ; [E411](USE_CASE_MATRIX_45.md#evidence-e411) Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim. ; [E412](USE_CASE_MATRIX_45.md#evidence-e412) Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim. |
| Missing verification | SQL-backed movie/actor CRUD/castsetclear, malformed/error/retry; R31 controlled editor covers cast UI only. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Movie/actorCRUD,genres[],cast atomicreplacement/emptylist;invalidrefs/duplicate cast;futurebirthdate/datewindow;historicalusage409;hydrateedit/fullrawcolumns. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/movies | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.movies → adminService.movies → ADMIN_MOVIE_LIST → dbo.usp_Admin_Movie_List |
| POST /api/admin/movies | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createMovie → adminService.createMovie → ADMIN_MOVIE_CREATE → dbo.sp_Admin_Movie_Create |
| PUT /api/admin/movies/:movieId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateMovie → adminService.updateMovie → ADMIN_MOVIE_UPDATE → dbo.sp_Admin_Movie_Update |
| DELETE /api/admin/movies/:movieId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteMovie → adminService.deleteMovie → ADMIN_MOVIE_DELETE → dbo.sp_Admin_Movie_Delete |
| PUT /api/admin/movies/:movieId/actors | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.setMovieActors → adminService.setMovieActors → ADMIN_MOVIE_ACTOR_SET → dbo.sp_Admin_MovieActor_Set |
| GET /api/admin/actors | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.actors → adminService.actors → ADMIN_ACTOR_LIST → dbo.sp_Admin_Actor_List |
| POST /api/admin/actors | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createActor → adminService.createActor → ADMIN_ACTOR_CREATE → dbo.sp_Admin_Actor_Create |
| PUT /api/admin/actors/:actorId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateActor → adminService.updateActor → ADMIN_ACTOR_UPDATE → dbo.sp_Admin_Actor_Update |
| DELETE /api/admin/actors/:actorId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteActor → adminService.deleteActor → ADMIN_ACTOR_DELETE → dbo.sp_Admin_Actor_Delete |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/37` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-10"></a>

### ADM-10 — Thể loại

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section genres;  |
| API client | adminApi.genres/create/update/remove |
| Authorization | authenticate→requireAdmin→QL_THELOAI; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | {name≤100}; genreId path; SQL authoritative CRUD/references |
| Response / arrays / empty / nullable | {genres[]} SQLraw; {genre}; {result}; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Genre CRUD + duplicate/dependency safety. |
| Actual error contracts | 400;401;403 QL_THELOAI;404;409 referenced/duplicate;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Genre CRUD and referenced deletion conflict, loading/empty/error. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | GenreCRUD/unreferenceddelete;referenced409;duplicate/invalid400;deniedgrant;reload/error/empty. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/genres | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.genres → adminService.genres → ADMIN_GENRE_LIST → dbo.sp_Admin_Genre_List |
| POST /api/admin/genres | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createGenre → adminService.createGenre → ADMIN_GENRE_CREATE → dbo.sp_Admin_Genre_Create |
| PUT /api/admin/genres/:genreId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateGenre → adminService.updateGenre → ADMIN_GENRE_UPDATE → dbo.sp_Admin_Genre_Update |
| DELETE /api/admin/genres/:genreId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteGenre → adminService.deleteGenre → ADMIN_GENRE_DELETE → dbo.sp_Admin_Genre_Delete |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/38` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-11"></a>

### ADM-11 — Sản phẩm đồ ăn

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section products;  |
| API client | adminApi.products/create/update/remove |
| Authorization | authenticate→requireAdmin→QL_SANPHAM; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | {name150,type enum,price DECIMAL18,2≥0,description255/image500nullable}; update addsstatus; number inputs have no explicitdecimalstep |
| Response / arrays / empty / nullable | {products[]} SQLraw; {product}201/create; catalog price not historical snapshot; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Product CRUD and activecatalog reflection; historical unitprice/amount unchanged. |
| Actual error contracts | 400 decimals/enum;401;403 QL_SANPHAM;404;409 referenced/duplicate;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Product CRUD, invalidprice/useddelete, catalogrefresh/historicaldisplay. |
| Known/suspected issue | Decimal number-input UX mismatch (source confirmed, browser validity pending) |
| Browser scenarios | ProductCRUD,decimalprice0/100.25;inactive/reference rules;optionalnulltext;invalidenum/negative;formvalidity and reloadSQL;deniedgrant. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Align supported controls/response display/decimal input; keep backend authority. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/products | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.products → adminService.products → ADMIN_PRODUCT_LIST → dbo.usp_Admin_Product_List |
| POST /api/admin/products | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createProduct → adminService.createProduct → ADMIN_PRODUCT_CREATE → dbo.sp_Admin_Product_Create |
| PUT /api/admin/products/:productId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateProduct → adminService.updateProduct → ADMIN_PRODUCT_UPDATE → dbo.sp_Admin_Product_Update |
| DELETE /api/admin/products/:productId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteProduct → adminService.deleteProduct → ADMIN_PRODUCT_DELETE → dbo.sp_Admin_Product_Delete |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/39` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-12"></a>

### ADM-12 — Chương trình khuyến mãi

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section promotions;  |
| API client | adminApi.promotions/create/update/remove |
| Authorization | authenticate→requireAdmin→QL_KHUYENMAI; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | discountType enum/value>0; percent≤99; min/max DECIMALnullable; quantity INT; UTC startsAt/endsAt; code≤50 createonly; missingexplicitdecimalstep |
| Response / arrays / empty / nullable | {promotions[]} SQLraw; {promotion}201/create; quota/effectiveness SQL; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Promotion CRUD valid fields/time/quota; percent100 reject/no writes; booked discount snapshot unchanged. |
| Actual error contracts | 400 percent/decimal/date/enum;401;403 QL_KHUYENMAI;404;409 duplicate/inuse;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Promo CRUD, dates/percent100/quota validation, deletion/reference, formerror/retry. |
| Known/suspected issue | Decimal number-input UX mismatch (source confirmed, browser validity pending) |
| Browser scenarios | PromotionCRUD percent1/99/100,flatdecimal;quota;nullable min/max;UTCwindow;historical/inuseerrors;decimal form validity;no change quotas in JS. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Align supported controls/response display/decimal input; keep backend authority. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/promotions | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.promotions → adminService.promotions → ADMIN_PROMOTION_LIST → dbo.sp_Admin_Promotion_List |
| POST /api/admin/promotions | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createPromotion → adminService.createPromotion → ADMIN_PROMOTION_CREATE → dbo.sp_Admin_Promotion_Create |
| PUT /api/admin/promotions/:promotionId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updatePromotion → adminService.updatePromotion → ADMIN_PROMOTION_UPDATE → dbo.sp_Admin_Promotion_Update |
| DELETE /api/admin/promotions/:promotionId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deletePromotion → adminService.deletePromotion → ADMIN_PROMOTION_DELETE → dbo.sp_Admin_Promotion_Delete |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/40` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-13"></a>

### ADM-13 — Bảng giá toàn hệ

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section pricing;  |
| API client | adminApi.pricing/create/update |
| Authorization | authenticate→requireAdmin→QL_BANG_GIA; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | cinemaIdcreate; seatType/dayType/format/startsOn/endsOnnullable +surcharge DECIMAL18,2≥0/status; missingexplicitdecimalstep |
| Response / arrays / empty / nullable | {pricing[]} SQLraw; {pricing}; no Ngày lễ; nullopenend not omitted mistakenly; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | List/create/update full pricing dimensions/range/surcharge/status, overlap409 readback; no holiday type. |
| Actual error contracts | 400 enum/group/date/decimal;401;403 QL_BANG_GIA;404;409 overlap;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E397](USE_CASE_MATRIX_45.md#evidence-e397) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E398](USE_CASE_MATRIX_45.md#evidence-e398) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E399](USE_CASE_MATRIX_45.md#evidence-e399) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E400](USE_CASE_MATRIX_45.md#evidence-e400) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E401](USE_CASE_MATRIX_45.md#evidence-e401) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E402](USE_CASE_MATRIX_45.md#evidence-e402) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E403](USE_CASE_MATRIX_45.md#evidence-e403) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E404](USE_CASE_MATRIX_45.md#evidence-e404) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E405](USE_CASE_MATRIX_45.md#evidence-e405) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E406](USE_CASE_MATRIX_45.md#evidence-e406) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. |
| Missing verification | R43 real browser update/hydration/NULLdate/overlap/retry; still missing create/list acrosscinemas and deniedgrant UI. |
| Known/suspected issue | Decimal number-input UX mismatch (source confirmed, browser validity pending) |
| Browser scenarios | Pricing create/full edit/nullend;decimal surcharge;allallowed dimensions/status;holiday400/overlap409;immutable monetaryhistorical snapshots;errors/grants. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Align supported controls/response display/decimal input; keep backend authority. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/pricing | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.pricing → adminService.pricing → ADMIN_PRICING_LIST → dbo.usp_Admin_Pricing_List |
| POST /api/admin/pricing | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createPricing → adminService.createPricing → ADMIN_PRICING_CREATE → dbo.usp_Admin_Pricing_Create |
| PUT /api/admin/pricing/:pricingId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updatePricing → adminService.updatePricing → ADMIN_PRICING_UPDATE → dbo.usp_Admin_Pricing_Update |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/41` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-14"></a>

### ADM-14 — Suất chiếu toàn hệ

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section showtimes;  |
| API client | adminApi.showtimes/create/update/create(showtimes/:id/cancel) |
| Authorization | authenticate→requireAdmin→QL_SUAT_CHIEU; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | movieId/roomIdcreate INT; UTC startsAt/endsAt; format/basePrice DECIMAL/status; cancelPOST{}; missingexplicitdecimalstep |
| Response / arrays / empty / nullable | {showtimes[]} SQLraw; {showtime}; {result}; historyimmutability SQL; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Allsystem show list/create/update/cancel; no partialwrite/overlap, history preserved. |
| Actual error contracts | 400;401;403 QL_SUAT_CHIEU;404;409 overlap/history/held/cancel;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E413](USE_CASE_MATRIX_45.md#evidence-e413) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E414](USE_CASE_MATRIX_45.md#evidence-e414) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E415](USE_CASE_MATRIX_45.md#evidence-e415) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E416](USE_CASE_MATRIX_45.md#evidence-e416) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. |
| Missing verification | R32 controlled edit; missing realSQL create/cancel/history/overlap and filter UI. |
| Known/suspected issue | Decimal number-input UX mismatch (source confirmed, browser validity pending) |
| Browser scenarios | Show create/edit/cancel;decimalbaseprice;UTCtimes;filters/canceled/history/overlap;heldorder409;paidcompensation;correct editor/resource/no duplicatewrites. |
| Fixture / dependency | F-ADMIN + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Align supported controls/response display/decimal input; keep backend authority. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/showtimes | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.showtimes → adminService.showtimes → ADMIN_SHOWTIME_LIST → dbo.usp_Admin_Showtime_List |
| POST /api/admin/showtimes | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createShowtime → adminService.createShowtime → ADMIN_SHOWTIME_CREATE → dbo.usp_Admin_Showtime_Create |
| PUT /api/admin/showtimes/:showtimeId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateShowtime → adminService.updateShowtime → ADMIN_SHOWTIME_UPDATE → dbo.usp_Admin_Showtime_Update |
| POST /api/admin/showtimes/:showtimeId/cancel | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.cancelShowtime → adminService.cancelShowtime → ADMIN_SHOWTIME_CANCEL → dbo.usp_Admin_Showtime_Cancel |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/42` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-15"></a>

### ADM-15 — Xử lý khiếu nại

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section complaints; Current AdminPortal does not import/mount ComplaintOrderReference; historical FE prose naming it is corrected here without changing R7 artifacts. |
| API client | adminApi.complaints/complaint/complaintOrderReference/addComplaintProcessing/updateComplaintStatus |
| Authorization | authenticate→requireAdmin→QL_KHIEUNAI, TRA_CUU_DON, XULY_KHIEUNAI; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | same support query priority/status/type/search contract; default UI calls no params; ID path; processing/statusbodies; reference separate request |
| Response / arrays / empty / nullable | {complaints[]},{complaint.processings[]},{order&#124;null,message}; Admin uses own inline reference, not sharedcomponent; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Admin queue/detail/reference/process/status complete, safe linked/unlinked and correct timeline. |
| Actual error contracts | 400 including INVALID_PRIORITY;401;403 QL_KHIEUNAI +write/reference grants;404 complaint/order;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Admin complaint select/process/status then queue+detail refresh, linked/unlinked reference/deniedgrant; source already calls load+openComplaint after writes. |
| Known/suspected issue | I-11; I-21; I-15 shared query coverage; R81-FIND-KEY-01 |
| Browser scenarios | I-11 A slow/B fast detail+reference;write target equals visible B;module switch/writepending;I-21 unlinked vs403/404/500+retry;shared priority default/AND;key warning exact collection. |
| Fixture / dependency | F-ADMIN + F-HISTORY/COMPLAINT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Minimal state/identity/error fix after targeted reproduction; no redesign. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/complaints | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → wrapSupport → supportService.list → SUPPORT_COMPLAINT_LIST → dbo.sp_Support_Complaint_List |
| GET /api/admin/complaints/:complaintId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → wrapSupport → supportService.detail → SUPPORT_COMPLAINT_GET_DETAIL → dbo.sp_Support_Complaint_GetDetail |
| GET /api/admin/complaints/:complaintId/order-reference | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → wrapSupport → supportService.orderReference → SUPPORT_COMPLAINT_GET_ORDER_REFERENCE → dbo.sp_Support_Complaint_GetOrderReference |
| POST /api/admin/complaints/:complaintId/processings | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → wrapSupport → supportService.addProcessing → SUPPORT_COMPLAINT_ADD_PROCESSING → dbo.sp_Support_Complaint_AddProcessing |
| PUT /api/admin/complaints/:complaintId/status | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → wrapSupport → supportService.updateStatus → SUPPORT_COMPLAINT_UPDATE_STATUS → dbo.sp_Support_Complaint_UpdateStatus |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/43` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-16"></a>

### ADM-16 — Báo cáo toàn hệ

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section dashboard / revenue;  |
| API client | adminApi.dashboard/revenue |
| Authorization | authenticate→requireAdmin→XEM_BAO_CAO_TOANHE; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | GET report fromDate/toDate DATE/cinemaIdoptional INT; UI only date range; no revenuecalculationinReact |
| Response / arrays / empty / nullable | {summary,byCinema[],byMovie[],byDate[],cinemas[],totals}; UI dataRows uses first array byCinema only; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | System totals + cinema/movie/date breakdown reconcile, date/cinema filters/empty cases and grant403. |
| Actual error contracts | 400 range/ID;401;403 XEM_BAO_CAO_TOANHE;500/503; empty report200 zero summary; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Dashboard/revenue form, four numerical breakdowns, filters/empty/error, deniedgrant; no existing realreport browser. |
| Known/suspected issue | R4.2 report four-set UI consumption |
| Browser scenarios | Render summary/byCinema/byMovie/byDate independently;date/cinemafilters;receipt ledger/UTC+7;empty0/error/retry;aliases not countedtwice;currentgrants. |
| Fixture / dependency | F-ADMIN + F-REPORT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Align supported controls/response display/decimal input; keep backend authority. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/dashboard | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.dashboard → adminService.dashboard → ADMIN_DASHBOARD → dbo.sp_Admin_Dashboard |
| GET /api/admin/reports/revenue | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.revenue → adminService.revenue → ADMIN_REPORT_REVENUE → dbo.sp_Admin_Report_Revenue |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/44` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).


---

<a id="phan-3"></a>

## R8.2 Execution Backlog — prepared by R8.1

**PENDING R8.2: 43 inherited Frontend gaps.** Không gap nào RESOLVED; giữ issue IDs và historical backlog. [backlog.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/backlog.json) lưu từng field và counts.

Primary action categories loại trừ nhau: {'TEST_REQUIRED': 29, 'FIX_REQUIRED': 7, 'CONTRACT_ALIGNMENT_REQUIRED': 7}; BLOCKED0. STATE_RACE_RISK/KNOWN_UI_DEFECT/CONTRACT_MISMATCH có thể giao nhau; không cộng chúng thành số gap. FIX_REQUIRED bao gồm UC dùng chung BookingPreparation cần reset context; không phải bảy defect độc lập. Contract alignment còn cần UI validation/proof, không đồng nghĩa SQL/backend sai.

P1/P2/P3 dưới đây là thứ tự thực hiện R8.2; priority P3 của backlog lịch sử giữ nguyên. ENV-R81 = [môi trường đã smoke](#phan-4).

| Work item / original roadmap | UC | Root mechanism / current protection | R8.2 scope / verification |
| --- | --- | --- | --- |
| I-11 / roadmap R8.1 | ADM-15 | Admin loadRequest bảo vệ list, không openComplaint/detail/reference; selected/write ID có thể khác visible detail. | Latest request +resource identity; protect write refresh/module switch; delayed A/B, write targetB,abort/error/retry. |
| I-15 / roadmap R8.2 | CSKH-02; ADM-15 shared contract | Support queue thiếu guard; detail đã có generation; Admin list đã có loadRequest. | Guard current queue filters/loading/error; AND priority; no old rows; do not remove existing detail/list protections. |
| I-19 / roadmap R8.3 | KH-05..09 | Detail abort/promo version chỉ partial protection; quantities/code/booking result persist; seats old before new response. | Context keyed byshowtime for seat/food/code/quote/result/error/loading; latewrites/quotes ignored; no wrong-context submit. |
| I-21 / roadmap R8.4 | CSKH-04; KH-14; ADM-15 | Shared CSKH component đã error/retry; Customer getOrders.catch→[]; Admin catch→message loses status/retry. | Preserve existing good component; fix actual remaining paths; linked/unlinked/403/404/500/network+retry. |
| CT-PRIORITY | CSKH-02; ADM-15 shared | API can serialize priority, controls absent. | Approved4options/omit empty/AND SQL/error400/stale guards. |
| CT-ADMIN-ROLE | ADM-02 | Numeric roleId field; no role option source or hardcoded IDs; generic403 visible. | Constrained role choices from permissible authoritative IDs; handle lacking QL_VAITRO without adding grants/new API; list/status stillallroles. |
| CT-DASHBOARD | QLR-08 | Four fields already matched; zero fallback can hide missing-field contract regressions. | Test independent numeric semantics; retain four metrics, no occupancy. |
| CT-DECIMAL | ADM-11..14 | Generic number fields no explicit step; browser defaultinteger conflicts with valid2decimal payload. | Incremental step/validation only; real HTML validity +API +persisted decimals; no final-money JSformula. |
| CT-REPORT | ADM-16 | Generic dataRows consumes first report array; other three canonical sections undisplayed. | Incremental rendering four sets; SQL totals, range/empty/retry; preserve layout/colors. |
| R81-FIND-KEY-01 | ADM-15 / AdminPortal collection | Actual Chrome console key warning; exact source collection root cause pending. | Reproduce warning, inspect affected keys under dashboard/complaints, fix stable identity without UI redesign; diagnostic console clean afterward. |

Suggested order: ENV/fixtures → I-11/I-15/I-19/I-21 → approved contracts/decimal/report → auth/grant and booking/payment journeys → remaining Manager/CSKH/Admin CRUD/report scenarios. Expand fixtures per isolated journey; no main mutation. Controlled delay/fault cases retain provenance of real API responses and are labeled CONTROLLED_TRANSPORT; separate uninjected real SQL E2E assertions.

Common acceptance: actual AppRoutes (not component-only mount), recorded UI/network and SQL state assertions, allowed+denied grants/ownership/scope, error distinct from empty, deterministic latest state, pending/double-submit behavior, no fatal console errors, fixture cleanup. Minimal accessibility/responsive regression checks preserve labels/focus/keyboard/390px and1440px baseline. Unit/mock green alone does not resolve a gap.

Fixture specs F-* và commands: [R8_TEST_ENVIRONMENT.md](#phan-4). Each gap below remains actionable independently even when one journey covers several UCs.

<a id="gap-adm-15"></a>

### R71-FE-ADM-15 — Xử lý khiếu nại

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-15 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | FIX_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section complaints; adminApi.complaints/complaint/complaintOrderReference/addComplaintProcessing/updateComplaintStatus |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. ['I-11', 'I-21', 'I-15 shared query coverage', 'R81-FIND-KEY-01'] |
| Contract | same support query priority/status/type/search contract; default UI calls no params; ID path; processing/statusbodies; reference separate request → {complaints[]},{complaint.processings[]},{order&#124;null,message}; Admin uses own inline reference, not sharedcomponent; 400 including INVALID_PRIORITY;401;403 QL_KHIEUNAI +write/reference grants;404 complaint/order;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-15); Admin complaint select/process/status then queue+detail refresh, linked/unlinked reference/deniedgrant; source already calls load+openComplaint after writes. |
| Required UI behavior | Admin queue/detail/reference/process/status complete, safe linked/unlinked and correct timeline. |
| Recommended change | Minimal state/identity/error fix after targeted reproduction; no redesign. |
| Browser scenarios | I-11 A slow/B fast detail+reference;write target equals visible B;module switch/writepending;I-21 unlinked vs403/404/500+retry;shared priority default/AND;key warning exact collection. |
| Fixture / dependencies | F-ADMIN + F-HISTORY/COMPLAINT; ENV-R81, current canonical SQL/backend contracts, I-11, I-21, I-15 shared query coverage, R81-FIND-KEY-01; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-cskh-02"></a>

### R71-FE-CSKH-02 — Hàng chờ khiếu nại

| Field | Plan |
| --- | --- |
| UC / actor / state | CSKH-02 / CSKH / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | CONTRACT_ALIGNMENT_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /support; SupportPortal.jsx; SupportPortal queue; supportApi.getSupportComplaints |
| Current implementation / known risk | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. ['I-15', 'R72 priority'] |
| Contract | GET status≤50/type≤100/search≤100/priority≤50 enum4; omit empty; AND SQL; current UI lacks priority → {complaints[]} id,title,priority,status,senderName,processingCount; empty[]; 400 INVALID_PRIORITY/unknown query;401;403 CSKH+QL_KHIEUNAI;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-cskh-02); Chưa browser queue/filter/empty/error/retry; priority filter contract discrepancy follows DB/BE decision, UI followup deferredR8. |
| Required UI behavior | Queue permitted complaints; design calls for status/priority filter; current supports status/type/search, priority sort only. |
| Recommended change | Align supported controls/response display/decimal input; keep backend authority. |
| Browser scenarios | Status+priority+type+search AND oracle;all4 enum/default/invalid400;filter A slow→B fast;queue/loading/error onlyB;empty/error/retry. |
| Fixture / dependencies | F-SUPPORT; ENV-R81, current canonical SQL/backend contracts, I-15, R72 priority; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-cskh-04"></a>

### R71-FE-CSKH-04 — Đơn tham chiếu

| Field | Plan |
| --- | --- |
| UC / actor / state | CSKH-04 / CSKH / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /support; SupportPortal.jsx; ComplaintOrderReference / OrderReferenceDetails; supportApi.getComplaintOrderReference |
| Current implementation / known risk | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. Shared reference has active request guard, explicit loading/error/empty/retry; mounted only by SupportPortal. ['I-21'] |
| Contract | GET complaintId; QL_KHIEUNAI AND TRA_CUU_DON; key remount selectedId/permission → {order:null,message} unlinked OR {order} tickets/products/payments/history/total; 400 path;401;403 grants;404 COMPLAINT_NOT_FOUND/ORDER_NOT_FOUND;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-cskh-04); Chưa browser linked/unlinked, each denied permission, switchingcomplaint and full monetary/payment reference. |
| Required UI behavior | Linked full referenced order+items+payments; unlinked order:null message; missingonegrant403 no leakage. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Linked full order;unlinked200 ordernull;403/404/500/network visibly error with retry;late A reference after B;current permission removal. |
| Fixture / dependencies | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, current canonical SQL/backend contracts, I-21; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-cskh-05"></a>

### R71-FE-CSKH-05 — Ghi lần xử lý

| Field | Plan |
| --- | --- |
| UC / actor / state | CSKH-05 / CSKH / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /support; SupportPortal.jsx; SupportPortal processing form; supportApi.addComplaintProcessing |
| Current implementation / known risk | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. [] |
| Contract | POST {content nonempty NVARCHARMAX,nextStatus enum excluding Mới}; complaintId path; current actor → {processing}; append history, refresh queue/detail; 400 invalid;401;403 QL_KHIEUNAI+XULY_KHIEUNAI;404;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-cskh-05); Chưa browser append, validation/denied permissions, detail/queue refresh and timeline after retry. |
| Required UI behavior | 201 appended processing and parentstatus; no overwrite oldevents; invalid/writefault complete rollback. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Append processing then queue+detail refresh;switch selection while write pending;double submit;invalid/Mới400;grantdeny;exact actor/complaintSQL. |
| Fixture / dependencies | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-cskh-06"></a>

### R71-FE-CSKH-06 — Đổi trạng thái

| Field | Plan |
| --- | --- |
| UC / actor / state | CSKH-06 / CSKH / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /support; SupportPortal.jsx; SupportPortal status form; supportApi.updateComplaintStatus |
| Current implementation / known risk | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. [] |
| Contract | PUT {status} processing enum excluding Mới; complaintId path; current actor → {complaint:{id,status}}; append timeline SQL; 400 invalid;401;403 QL_KHIEUNAI+XULY_KHIEUNAI;404;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-cskh-06); Chưa browser status change, audit append, validation/permission denial and refreshed detail/queue. |
| Required UI behavior | Status command appends auditprocessing, deterministic parentstatus independent manipulated timestamps; no partialwrite. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Status change appendhistory;switch selection pending;double click;invalid/Mới400;latest committed status;grantdeny;reloadtimeline. |
| Fixture / dependencies | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-05"></a>

### R71-FE-KH-05 — Xem lịch chiếu

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-05 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | FIX_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /movies/:movieId; /booking/:showtimeId; MovieDetail.jsx; BookingPreparation.jsx; ShowtimeBrowser / ShowtimeList; catalogApi.getCinemas/getShowtimes/getShowtimeDetail |
| Current implementation / known risk | detail keyed movieId, showtimes keyed movie/cinema/date, AbortController; selected filters; no retry for detail/show list; review state separate. show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. ['I-19'] |
| Contract | movieId path; optional cinemaId positive INT/date DATE; showtimeId path; public → {cinemas[]}, {showtimes[]}, flat showtime detail; startsAt/endsAt UTC ISO; 400 query/path;404 detail;500/503; empty list200 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-05); Chưa browser chọn rạp/ngày, đổi filter, empty lịch và điều hướng booking. |
| Required UI behavior | Lịch chiếu đúng phim/rạp/ngày và show detail; chỉ suất khả dụng theo contract. |
| Recommended change | Minimal state/identity/error fix after targeted reproduction; no redesign. |
| Browser scenarios | Cinema/date filters A→B; empty schedule; available show link; SPA showtime A→B entry and back navigation. |
| Fixture / dependencies | F-CUSTOMER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts, I-19; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-06"></a>

### R71-FE-KH-06 — Chọn ghế

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-06 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | FIX_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /booking/:showtimeId; BookingPreparation.jsx; BookingPreparation / SeatMap; catalogApi.getShowtimeDetail/getSeats |
| Current implementation / known risk | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. ['I-19'] |
| Contract | GET showtimeId positive INT; public; chọn IDs numeric, không gửi price → {seats[]} id,label,row,number,type,status,price SQL; detail flat; 400 invalid;404 showtime;500/503;409 chỉ booking shared KH-07 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-06); R44 chỉ chọn ghế free; chưa browser held/sold, ghế11, concurrent conflict và refresh sau409. |
| Required UI behavior | Trạng thái free/held/sold và giá đúng; selection ≤10; conflict không gây giữ hai lần. |
| Recommended change | Minimal state/identity/error fix after targeted reproduction; no redesign. |
| Browser scenarios | Free/held/sold/maintenance disabled; select/unselect0/10/11; switch showtime mid-load; concurrent seat lost→409 refresh. |
| Fixture / dependencies | F-CUSTOMER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts, I-19; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-07"></a>

### R71-FE-KH-07 — Đặt vé

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-07 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | FIX_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /booking/:showtimeId; BookingPreparation.jsx; BookingPreparation / HoldDeadline; catalogApi.createBooking |
| Current implementation / known risk | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. ['I-19'] |
| Contract | showtimeId INT; distinct seatIds number[]1–10; products[{productId,quantity1–10}]; optional trimmed promotionCode≤50; không amount/owner → {booking} HTTP201; id,total,holdExpiresAt do SQL chốt; 400 invalid/limits;401;403 Customer/DAT_VE;404 refs;409 seat/hold/show/promo;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-07); R44 real booking 201 và stale promo409; chưa UI mất ghế, hết hold/max holds, double-submit và payment-link navigation. |
| Required UI behavior | 201 một đơn, ticket snapshots/foods/quota đầy đủ; giữ5phút; invalid/concurrent/fault rollback toàn bộ. |
| Recommended change | Minimal state/identity/error fix after targeted reproduction; no redesign. |
| Browser scenarios | Create201 once; immediate double click; stale mutation response after show switch; max3 live holds;409 seat/promo;201 total/hold/paymentlink+SQLsnapshot. |
| Fixture / dependencies | F-CUSTOMER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts, I-19; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-08"></a>

### R71-FE-KH-08 — Đồ ăn kèm vé

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-08 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | FIX_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /booking/:showtimeId; BookingPreparation.jsx; ProductPicker / BookingPreparation; catalogApi.getProducts/createBooking |
| Current implementation / known risk | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. ['I-19'] |
| Contract | GET products public; booking quantity0 loại bỏ, mỗi product1–10, không trần tổng10; cùng body KH-07 → {products[]} id/name/price/type + {booking}; product snapshot SQL; GET500/503; write400/401/403/404/409 theoKH-07 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-08); R44 browser chọn1food và snapshot authoritative; chưa qty0/10/11, nhiều product, inactive product và empty list. |
| Required UI behavior | Có/không food đúng; mỗi dòng quantity/unit snapshot; reject unavailable/qty11 hoặc duplicate split vượt10. |
| Recommended change | Minimal state/identity/error fix after targeted reproduction; no redesign. |
| Browser scenarios | Zero removes line; quantity1/10/11 for each product, multiple products total>10 valid; inactive/empty/errors; A→B quantities reset. |
| Fixture / dependencies | F-CUSTOMER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts, I-19; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-09"></a>

### R71-FE-KH-09 — Khuyến mãi

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-09 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | FIX_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /booking/:showtimeId; BookingPreparation.jsx; BookingPreparation promotion preview; catalogApi.validatePromotion/createBooking |
| Current implementation / known risk | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. ['I-19'] |
| Contract | POST showtimeId/seatIds/products/promotionCode bắt buộc; code≤50; không preview subtotal/accepted discount → {promotion} isValid/message/discountAmount provisional; booking.total final; 400 invalid;401;403 DAT_VE/role;409 changed promotion khi booking;500/503; invalid preview có thể200 isValid=false |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-09); R44 browser real stale/pause/requote/final price; R22 controlled timing. Chưa UI quota/minimum/expired, đổi code/seat/food với SQL thật. |
| Required UI behavior | Preview read only; final tái kiểm dưới lock, discount snapshot/quota đúng; invalid yêu cầu409, không âm thầm full price. |
| Recommended change | Minimal state/identity/error fix after targeted reproduction; no redesign. |
| Browser scenarios | Valid/invalid/expired/exhausted/minimum promo; edit seat/product/code while quote pending; latequote after A→B;409 forces deliberate review, no silent no-promo booking. |
| Fixture / dependencies | F-CUSTOMER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts, I-19; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-14"></a>

### R71-FE-KH-14 — Khiếu nại

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-14 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | FIX_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /complaints; /complaints/:complaintId; Complaints.jsx; ComplaintDetail.jsx; Complaints / ComplaintDetail; feedbackApi.getComplaints/createComplaint/getComplaint; ordersApi.getOrders |
| Current implementation / known risk | list/submit controlled state, busy/error; order prefill ownership checks; getOrders failure becomes [] without feedback; no explicit order lookup retry. resource/complaintId loading/error/retry; no request generation; timeline+linked order display. ['I-21'] |
| Contract | POST {type≤100,title≤200,content nonempty NVARCHARMAX,orderId nullable INT&#124;string digits}; own reads → {complaints[]}, {complaint}201 or detail with processingHistory[]; 400 invalid;401;403 Customer/GUI_KHIEU_NAI create;404 linked ownership/detail;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-14); Chưa browser linked/unlinked complaint submit, list/detail, status refresh và customer-safe timeline. |
| Required UI behavior | 201 linked/unlinked, own list/detail + permitted processing timeline; foreign/missing order404, không lộ staff identity. |
| Recommended change | Minimal state/identity/error fix after targeted reproduction; no redesign. |
| Browser scenarios | Linked/unlinked create201,ownhistory/timeline;spoof/foreign404;orderslookup403/500/network must not become [];retry;complaint A→B late detail. |
| Fixture / dependencies | F-CUSTOMER + F-HISTORY/COMPLAINT; ENV-R81, current canonical SQL/backend contracts, I-21; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-02"></a>

### R71-FE-ADM-02 — Tài khoản người dùng

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-02 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | CONTRACT_ALIGNMENT_REQUIRED / P2; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section users; adminApi.users/create/update(users/:id/status) |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. ['R72 create allowlist UX'] |
| Contract | create{name≤100,email≤150,password8–72bytes,phone optional≤20,roleId INT}; raw roleId field currently unbounded by role code; status only update → {users[]} raw SQL columns; {user}200 create; list/status includesallroles; 400 refs/input;401;403 QL_NGUOIDUNG/ROLE_CREATE_FORBIDDEN;404 user;409 duplicates;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-02); User create/status/list UI, duplicate/invalidrole, lockedaccount and reload. |
| Required UI behavior | List/create user và status change readback; no arbitrary role/owner input, invalid/reference/duplicate không write. |
| Recommended change | Align supported controls/response display/decimal input; keep backend authority. |
| Browser scenarios | Role choice onlyManager/CSKH/Admin from authoritative IDs;threecreates200/noCustomerprofile;tampered Customer/custom403 visible;duplicates;list/statusallroles;double submit. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts, R72 create allowlist UX; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-11"></a>

### R71-FE-ADM-11 — Sản phẩm đồ ăn

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-11 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | CONTRACT_ALIGNMENT_REQUIRED / P2; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section products; adminApi.products/create/update/remove |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. ['Decimal number-input UX mismatch (source confirmed, browser validity pending)'] |
| Contract | {name150,type enum,price DECIMAL18,2≥0,description255/image500nullable}; update addsstatus; number inputs have no explicitdecimalstep → {products[]} SQLraw; {product}201/create; catalog price not historical snapshot; 400 decimals/enum;401;403 QL_SANPHAM;404;409 referenced/duplicate;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-11); Product CRUD, invalidprice/useddelete, catalogrefresh/historicaldisplay. |
| Required UI behavior | Product CRUD and activecatalog reflection; historical unitprice/amount unchanged. |
| Recommended change | Align supported controls/response display/decimal input; keep backend authority. |
| Browser scenarios | ProductCRUD,decimalprice0/100.25;inactive/reference rules;optionalnulltext;invalidenum/negative;formvalidity and reloadSQL;deniedgrant. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts, Decimal number-input UX mismatch (source confirmed, browser validity pending); full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-12"></a>

### R71-FE-ADM-12 — Chương trình khuyến mãi

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-12 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | CONTRACT_ALIGNMENT_REQUIRED / P2; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section promotions; adminApi.promotions/create/update/remove |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. ['Decimal number-input UX mismatch (source confirmed, browser validity pending)'] |
| Contract | discountType enum/value>0; percent≤99; min/max DECIMALnullable; quantity INT; UTC startsAt/endsAt; code≤50 createonly; missingexplicitdecimalstep → {promotions[]} SQLraw; {promotion}201/create; quota/effectiveness SQL; 400 percent/decimal/date/enum;401;403 QL_KHUYENMAI;404;409 duplicate/inuse;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-12); Promo CRUD, dates/percent100/quota validation, deletion/reference, formerror/retry. |
| Required UI behavior | Promotion CRUD valid fields/time/quota; percent100 reject/no writes; booked discount snapshot unchanged. |
| Recommended change | Align supported controls/response display/decimal input; keep backend authority. |
| Browser scenarios | PromotionCRUD percent1/99/100,flatdecimal;quota;nullable min/max;UTCwindow;historical/inuseerrors;decimal form validity;no change quotas in JS. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts, Decimal number-input UX mismatch (source confirmed, browser validity pending); full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-13"></a>

### R71-FE-ADM-13 — Bảng giá toàn hệ

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-13 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | CONTRACT_ALIGNMENT_REQUIRED / P2; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section pricing; adminApi.pricing/create/update |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. ['Decimal number-input UX mismatch (source confirmed, browser validity pending)'] |
| Contract | cinemaIdcreate; seatType/dayType/format/startsOn/endsOnnullable +surcharge DECIMAL18,2≥0/status; missingexplicitdecimalstep → {pricing[]} SQLraw; {pricing}; no Ngày lễ; nullopenend not omitted mistakenly; 400 enum/group/date/decimal;401;403 QL_BANG_GIA;404;409 overlap;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-13); R43 real browser update/hydration/NULLdate/overlap/retry; still missing create/list acrosscinemas and deniedgrant UI. |
| Required UI behavior | List/create/update full pricing dimensions/range/surcharge/status, overlap409 readback; no holiday type. |
| Recommended change | Align supported controls/response display/decimal input; keep backend authority. |
| Browser scenarios | Pricing create/full edit/nullend;decimal surcharge;allallowed dimensions/status;holiday400/overlap409;immutable monetaryhistorical snapshots;errors/grants. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts, Decimal number-input UX mismatch (source confirmed, browser validity pending); full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-14"></a>

### R71-FE-ADM-14 — Suất chiếu toàn hệ

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-14 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | CONTRACT_ALIGNMENT_REQUIRED / P2; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section showtimes; adminApi.showtimes/create/update/create(showtimes/:id/cancel) |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. ['Decimal number-input UX mismatch (source confirmed, browser validity pending)'] |
| Contract | movieId/roomIdcreate INT; UTC startsAt/endsAt; format/basePrice DECIMAL/status; cancelPOST{}; missingexplicitdecimalstep → {showtimes[]} SQLraw; {showtime}; {result}; historyimmutability SQL; 400;401;403 QL_SUAT_CHIEU;404;409 overlap/history/held/cancel;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-14); R32 controlled edit; missing realSQL create/cancel/history/overlap and filter UI. |
| Required UI behavior | Allsystem show list/create/update/cancel; no partialwrite/overlap, history preserved. |
| Recommended change | Align supported controls/response display/decimal input; keep backend authority. |
| Browser scenarios | Show create/edit/cancel;decimalbaseprice;UTCtimes;filters/canceled/history/overlap;heldorder409;paidcompensation;correct editor/resource/no duplicatewrites. |
| Fixture / dependencies | F-ADMIN + F-BOOKING; ENV-R81, current canonical SQL/backend contracts, Decimal number-input UX mismatch (source confirmed, browser validity pending); full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-16"></a>

### R71-FE-ADM-16 — Báo cáo toàn hệ

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-16 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | CONTRACT_ALIGNMENT_REQUIRED / P2; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section dashboard / revenue; adminApi.dashboard/revenue |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. ['R4.2 report four-set UI consumption'] |
| Contract | GET report fromDate/toDate DATE/cinemaIdoptional INT; UI only date range; no revenuecalculationinReact → {summary,byCinema[],byMovie[],byDate[],cinemas[],totals}; UI dataRows uses first array byCinema only; 400 range/ID;401;403 XEM_BAO_CAO_TOANHE;500/503; empty report200 zero summary |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-16); Dashboard/revenue form, four numerical breakdowns, filters/empty/error, deniedgrant; no existing realreport browser. |
| Required UI behavior | System totals + cinema/movie/date breakdown reconcile, date/cinema filters/empty cases and grant403. |
| Recommended change | Align supported controls/response display/decimal input; keep backend authority. |
| Browser scenarios | Render summary/byCinema/byMovie/byDate independently;date/cinemafilters;receipt ledger/UTC+7;empty0/error/retry;aliases not countedtwice;currentgrants. |
| Fixture / dependencies | F-ADMIN + F-REPORT; ENV-R81, current canonical SQL/backend contracts, R4.2 report four-set UI consumption; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-01"></a>

### R71-FE-ADM-01 — Đăng nhập

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-01 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /login; /admin; auth/Login.jsx; AdminPortal.jsx; Login / AdminPortal / RequireRole; authApi.login/getCurrentUser |
| Current implementation / known risk | Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role. active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | Email/MatKhau; default /admin; section gates by current grants; route role ADMIN → {user} current permissions; no all-permission shortcut; login400/401/429/500/503; admin401/403 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-01); Chưa browser Admin login→portal, module access after permission removal, session reload. |
| Required UI behavior | Login200 ADMIN/current grants; revoked grant affects operation despite old token. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Admin login/currentgrants/defaultarea;deniedmodules hidden;wrongrole/lockedJWT;no all-grant shortcut;modulepermission removal. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-03"></a>

### R71-FE-ADM-03 — Vai trò

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-03 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section roles; adminApi.roles/create/update/remove |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | create{code≤50,name≤100,description nullable≤255}; update no code; DELETE roleId → {roles[]} SQL columns; {role}; delete{result}; 400;401;403 QL_VAITRO;404 role;409 role in use/duplicate;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-03); Role CRUD form, usedrole delete conflict and list reload. |
| Required UI behavior | List/create/update/delete safe role; dependency conflicts keep references. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Create/edit/delete unused role;code immutable;role in use409;empty/error/retry;currentgrant;no crossmodule editor/write response. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-04"></a>

### R71-FE-ADM-04 — Danh mục quyền

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-04 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section permissions; adminApi.permissions/create/update/remove |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | create{code≤50,name≤100,description nullable≤255}; update no code; DELETE permissionId → {permissions[]} SQL columns; {permission}; delete{result}; 400;401;403 QL_QUYEN;404;409 permission in use/duplicate;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-04); Permission CRUD, usedgrant delete conflict, missingpermission behavior. |
| Required UI behavior | List/create/update/delete allowedpermission; duplicate/dependency conflicts safe. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Create/edit/delete unusedpermission;code immutable;referenced409;invalid/duplicates;error/retry/currentgrant. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-05"></a>

### R71-FE-ADM-05 — Gán quyền vai trò

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-05 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section permissions / role grants; adminApi.rolePermissions/update(roles/:id/permissions) |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | roleId path INT; PUT {permissionIds:number[]} CSV→array, []valid; authenticated Admin QL_QUYEN → {permissions[]} SQL QuyenID; authoritative atomic replace, no additive client assumption; 400 array/INT;401;403 QL_QUYEN;404 role/permission;409 refs/conflict;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-05); Role grant editor load/set/explicitempty, invalidFK keeps grants, currentUI access update. |
| Required UI behavior | List current grants, set full list/empty atomically; stale token sees current permissions. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Read grants A slow→B fast;atomicreplaceempty/nonempty;unknown/duplicateIDs;revokedQL_QUYEN;writepending target unchanged;live sessiongrant refresh. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-06"></a>

### R71-FE-ADM-06 — Phân công quản lý

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-06 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section assignments; adminApi.assignments/create/update |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | {userId,cinemaId INT,startsOn DATE,endsOn nullable DATE,status}; create only Hiệu lực; ends≥starts → {assignments[]} SQL cols; {assignment}; no DELETE workflow; 400;401;403 PHANCONG_RAP;404;409 duplicate;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-06); Assignment create/update/revoke forms, manager/cinema validation, scope refresh. |
| Required UI behavior | Assignment read/create/update/revoke; Manager assigned scope immediately follows persisted date/status. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Assign Manager to cinema with dynamicdates;revoke/end assignment;overlap/duplicate409;invalidwrongrole/date400;reload and current Manager scope effect. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-07"></a>

### R71-FE-ADM-07 — Rạp và hình ảnh

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-07 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section cinemas / cinemaImages / CinemaImageManager; adminApi.cinemas/create/update/remove + cinema image helpers |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | cinema create/update name150/address255/city100/phone20/description500/status; images url500/description255/displayOrder INT/status/cover BIT → {cinemas[]} raw rows; {cinema}; {images[]}; {image}201/create; cover PATCH; 400 types/enums/url;401;403 QL_RAP;404 scope/image;409 inactive cover/referenced cinema;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-07); Cinema and image CRUD/setcover/reorder selection, orphan/foreignimage denial and empty images. |
| Required UI behavior | Cinema CRUD; image list/create/update/delete/setcover persists; invalidforeignimage does not mutate. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | CinemaCRUD/useddelete409;images add/edit/delete/cover;inactivecover409;switchcinema whileload/write;singlecoverSQL;imagefallback/publicgallery;errors/grants. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-08"></a>

### R71-FE-ADM-08 — Phòng và ghế toàn hệ

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-08 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section rooms / seats; adminApi.rooms/seats/create/update/remove |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | rooms create cinemaId/name100/type; seats roomId/row10/number/type; update names/type/status; DELETE specificresource → {rooms[]},{seats[]} SQL raw columns; {room}/{seat}/{result}; no client seatCountauthority; 400;401;403 QL_PHONG or QL_GHE;404;409 history/references;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-08); Room/seat create/delete/history conflicts and SQL-backed edit; R32 controlled updates cover only a subset. |
| Required UI behavior | Allsystem room/seat CRUD + safe history/delete; no Manager assignment needed for Admin. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Rooms/seats CRUD and empty-delete;referenced show/ticket409;immutable seat row-number;appropriategrants each;refresh/editor scope. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-09"></a>

### R71-FE-ADM-09 — Phim và diễn viên

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-09 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section movies / actors / cast; adminApi.movies/actors/create/update/remove + update(movies/:id/actors) |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | movies title255/duration INT/release DATE/end nullable/genreIds[]/optionaltext; cast[{actorId,role≤150}]; actors name150/birthDate DATE/nationality100 → {movies[]},{actors[]} rawrows; {movie}201/create; {actors} cast result; currentcatalog labels; 400 INT/dates/enums/cast;401;403 QL_DANHMUC_PHIM;404;409 history/refs/duplicate;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-09); SQL-backed movie/actor CRUD/castsetclear, malformed/error/retry; R31 controlled editor covers cast UI only. |
| Required UI behavior | Movie/actor CRUD, correctcast hydrate/set/clear; invalidgenre/cast leaves full old data. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Movie/actorCRUD,genres[],cast atomicreplacement/emptylist;invalidrefs/duplicate cast;futurebirthdate/datewindow;historicalusage409;hydrateedit/fullrawcolumns. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-10"></a>

### R71-FE-ADM-10 — Thể loại

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-10 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section genres; adminApi.genres/create/update/remove |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | {name≤100}; genreId path; SQL authoritative CRUD/references → {genres[]} SQLraw; {genre}; {result}; 400;401;403 QL_THELOAI;404;409 referenced/duplicate;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-10); Genre CRUD and referenced deletion conflict, loading/empty/error. |
| Required UI behavior | Genre CRUD + duplicate/dependency safety. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | GenreCRUD/unreferenceddelete;referenced409;duplicate/invalid400;deniedgrant;reload/error/empty. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-cskh-01"></a>

### R71-FE-CSKH-01 — Đăng nhập

| Field | Plan |
| --- | --- |
| UC / actor / state | CSKH-01 / CSKH / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /login; /support; auth/Login.jsx; SupportPortal.jsx; Login / SupportPortal / RequireRole; authApi.login/getCurrentUser |
| Current implementation / known risk | Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role. queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. [] |
| Contract | Email/MatKhau; current role CSKH plus QL_KHIEUNAI for /support guard → {user} current permissions; no inherited Admin bypass; login400/401/429/500/503; area401/403 role/grants |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-cskh-01); Chưa browser login CSKH→support, missingQL permission/forbidden, refresh session. |
| Required UI behavior | Login200 current CSKH identity/grants; active-account recheck; route appropriate area. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Login CSKH/me;QL_KHIEUNAI area grant;wrongrole/missinggrant/inactiveoldJWT;no unintended Admin navigation. |
| Fixture / dependencies | F-SUPPORT; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-cskh-03"></a>

### R71-FE-CSKH-03 — Chi tiết khiếu nại

| Field | Plan |
| --- | --- |
| UC / actor / state | CSKH-03 / CSKH / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /support; SupportPortal.jsx; SupportPortal detail/timeline; supportApi.getSupportComplaint |
| Current implementation / known risk | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. [] |
| Contract | complaintId path INT; role CSKH +QL_KHIEUNAI; no body → {complaint} plus processings[]; nullable orderId/processorName; 400 path;401;403;404 COMPLAINT_NOT_FOUND;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-cskh-03); Chưa browser select/switch complaint, full timeline, notfound/retry, detail stale-response guard. |
| Required UI behavior | Read parent/customer/order IDs and full allowed processing history; missing404; no unrelated scope restrictions invented. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Detail A slow→B fast guarded;timeline/maxidentity order;404/grant403;retry;unmount;selection consistent. |
| Fixture / dependencies | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-01"></a>

### R71-FE-KH-01 — Đăng ký

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-01 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /register; auth/Register.jsx; Register; authApi.registerCustomer |
| Current implementation / known risk | Controlled registration form; busy disables submit; retained inputs/error; success navigation /login. No async ownership fields. [] |
| Contract | HoTen1–100, Email≤150, MatKhau8–72 UTF8 bytes, nullable SoDienThoai≤20/NgaySinh YYYY-MM-DD/GioiTinh Nam,Nữ,Khác; không actor/role → {user}; HTTP201, redirect /login; SQL Customer/profile; 400 invalid/access fields;409 duplicate email/phone;429 auth limiter;500/503 unavailable |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-01); R45 browser chỉ kiểm 429 và retry duplicate409; chưa UI đăng ký201, duplicate phone, input invalid và chuyển /login. |
| Required UI behavior | 201 tạo đúng Customer + profile; duplicate/invalid không tạo dòng; thông báo và sang đăng nhập. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Register valid201 then /login; duplicate email/phone, invalid/multibyte password;429 retained inputs/manual retry; SQL no orphan. |
| Fixture / dependencies | F-CUSTOMER; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-04"></a>

### R71-FE-KH-04 — Xem phim/list/detail

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-04 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /movies; /movies/:movieId; Movies.jsx; MovieDetail.jsx; Movies / MovieGrid / MovieDetail; catalogApi.getMovies/getGenres/getMovieDetail |
| Current implementation / known risk | search/genre/attempt; AbortController +180ms debounce + requestKey guards success/loading; retry; valid empty. detail keyed movieId, showtimes keyed movie/cinema/date, AbortController; selected filters; no retry for detail/show list; review state separate. [] |
| Contract | GET search≤100/genreId positive INT; movieId path positive INT; public; không body → {movies[]}, {genres[]}, {movie,genres[],actors[]}; 400 invalid IDs/query;404 movie detail;500/503; không403 permission public |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-04); Chưa browser list/filter/detail, cast/genres, empty404 và retry. |
| Required UI behavior | List/detail phim, genres và cast đúng; missing movie404; lọc phù hợp. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Search/genre A→B with late A; list/detail genres/cast;404 detail; empty200; network error+retry. |
| Fixture / dependencies | F-CUSTOMER; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-10"></a>

### R71-FE-KH-10 — Thanh toán

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-10 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /orders/:orderId/payment; PaymentPage.jsx; PaymentPage / HoldDeadline / StatusBadge; ordersApi.getOrder/createPaymentAttempt/submitPaymentResult |
| Current implementation / known risk | resource/orderId load without generation, method/busy/message/deadline timers; reload after error; readonly GET cannot run expiry; result locks SQL, route-change stale risk. [] |
| Contract | orderId/paymentId path INT; {paymentMethod} enum6; {status} Thành công/Thất bại; UI hiện chỉ confirm Thành công; khôngamount → {order}; {payment}; {order} sau result; total/payments/compensation SQL; 400 method/result;401;403 Customer/THANH_TOAN;404 owner-hidden order/payment;409 expiry/terminal;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-10); R44 browser successful payment/SQL amount; chưa UI failed→retry history, expiry, revoked permission, terminal replay/flip. |
| Required UI behavior | Attempt amount=stored order; fail/retry/success history, terminal idempotence/flip409, loyalty once, wrong owner404; hold không kéo dài. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Live successful payment amount; failed→retry branch availability;holdexpiry/terminal replay/no double-submit;foreignorder404/revokedgrant;order A→B stale result. |
| Fixture / dependencies | F-CUSTOMER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-11"></a>

### R71-FE-KH-11 — Lịch sử đơn

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-11 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /orders; Orders.jsx; Orders / StatusBadge; ordersApi.getOrders |
| Current implementation / known risk | resource loading/error/retry/empty; statusFilter local on own rows; readonly list; no mutation. [] |
| Contract | GET own /orders; không body; statusFilter là UX filter trên own returned list → {orders[]} owner-specific total/latestPaymentStatus; empty[]; 401;403 wrong Customer role;500/503; không write grant bắt buộc |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-11); Chưa browser history nonempty/mixed statuses, empty, direct navigation và error retry. |
| Required UI behavior | Chỉ đơn của Customer, lịch sử paid/failed/expired và số tiền snapshot đúng; không lộ đơn khác. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Own pending/paid/expired/canceled list;zeroorders;localfilter;error/retry;crossroleguard and readable own list without writegrant. |
| Fixture / dependencies | F-CUSTOMER; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-12"></a>

### R71-FE-KH-12 — Chi tiết đơn

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-12 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /orders/:orderId; OrderDetail.jsx; OrderDetail / HoldDeadline; ordersApi.getOrder |
| Current implementation / known risk | resource/orderId, loading/error/retry; hold timer/deadline; no generation/abort on route change; terminal money from SQL. [] |
| Contract | GET orderId INT; owner JWT; no mutation/expiry job in GET → {order} tickets[]/products[]/payments[]/compensation&#124;null, totals SQL; 400 path;401;403 wrong role;404 ownership/missing;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-12); Chưa browser full detail và expired/effective status, foreign404, timeline/foodempty; R44 PaymentPage order read không chứng minh OrderDetail component. |
| Required UI behavior | Bốn recordsets đúng order/tickets/foods/payments; foreign404; GET expiry projection không write/quota mutation. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Own detail tickets/food/payments/compensation;foreign404;readonly SQLfingerprint;UTCdisplay/elapsedhold reload;order A→B race. |
| Fixture / dependencies | F-CUSTOMER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-13"></a>

### R71-FE-KH-13 — Đánh giá

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-13 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /movies/:movieId; MovieDetail.jsx; MovieReviews; feedbackApi.getReviews/createReview |
| Current implementation / known risk | detail keyed movieId, showtimes keyed movie/cinema/date, AbortController; selected filters; no retry for detail/show list; review state separate. [] |
| Contract | movieId INT; POST {rating number integer1–5,content nullable text≤1000}; no reviewerId → {reviews[]} public reviewerName; {review}201; eligibility SQL; GET400/500/503; POST400/401/403 DANH_GIA/409 ineligible or duplicate/500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-13); Chưa browser review create/list, eligibility/duplicate/permission/errors. |
| Required UI behavior | 201 review hợp lệ; noneligible403, duplicate409, invalidrating400; read after write list đúng. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Eligible paid/past review201→list;ineligible/duplicate409;rating1/5/invalid;nullcontent/max1000;revokedgrant;movie A→B late list/submit. |
| Fixture / dependencies | F-CUSTOMER + F-HISTORY/COMPLAINT; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-01"></a>

### R71-FE-QLR-01 — Đăng nhập/rạp phân công

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-01 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /login; /manager; auth/Login.jsx; ManagerPortal.jsx; ManagerPortal / RequireRole; authApi.login/getCurrentUser; managerApi.getAssignedCinemas |
| Current implementation / known risk | Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role. assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | Email/MatKhau như KH-02; bootstrap GET manager/cinemas không functional grant → {user} role QUAN_LY_RAP/permissions/cinemaAssignments; {cinemas[]}; login400/401/429/500/503; manager401/403 wrong role; empty assigned200 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-01); Chưa browser login Manager→/manager, assigned selector và empty/expired/revoked scope. |
| Required UI behavior | Login Manager; assigned list chỉ phân công còn hiệu lực; token cũ không giữ scope revoked/expired. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Manager form login/me/grants;single/multiple/noassigned cinemas;revoked/expiredassignment with oldJWT;wrongrole/lockedaccount;realcinemalist. |
| Fixture / dependencies | F-MANAGER; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-02"></a>

### R71-FE-QLR-02 — Quản lý phòng

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-02 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerWorkspace / ManagerResourceForm room; managerApi.getRooms/createRoom/updateRoom/deleteRoom |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | cinemaId/roomId path INT; create{name≤100,type enum}; update adds status enum; DELETE no body → {rooms[]}; {room}201/create or200/update; delete {message} authoritative; 400;401;403 QL_PHONG/current scope;404 refs;409 history;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-02); Chưa browser room CRUD, history/deactivate conflict, denied scope and refresh list. |
| Required UI behavior | Scoped rooms CRUD; history guard/deactivate policy; concurrent dependency không partial delete; foreign403. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Room create/edit/delete empty;referencedhistory409;scope/permissiondenied;refresh;switch cinema midload/write;error does not erase other grantedsections. |
| Fixture / dependencies | F-MANAGER; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-03"></a>

### R71-FE-QLR-03 — Quản lý sơ đồ ghế

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-03 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerWorkspace / ManagerResourceForm seat; managerApi.getSeats/createSeat/updateSeat/deleteSeat |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | roomId/seatId INT; create{row≤10,number positive INT,type}; update{type,status}; không đổi row/number → {seats[]} camelCase; {seat}; delete{deleted:true}; 400;401;403 QL_GHE/scope;404;409 ticket/history/duplicates;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-03); R32 controlled browser edit/retry; chưa SQL-backed seat create/delete, layout và future-seat/history conflict UI. |
| Required UI behavior | Seat CRUD đúng room; type lịch sử immutable; active future ticket bảo vệ deactivate/delete; foreign403. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Seat room loading/edit/delete/empty;row-number immutable update;ticket history409;wrongroom/grantdenied;late room A load after B. |
| Fixture / dependencies | F-MANAGER; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-04"></a>

### R71-FE-QLR-04 — Tạo suất chiếu

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-04 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerResourceForm showtime create; managerApi.getManagerShowtimes/createManagerShowtime |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | {movieId,roomId INT,startsAt/endsAt UTC ISO,format enum,basePrice DECIMAL18,2≥0}; end>start → {showtime}201; {showtimes[]}; UTC times; no holiday; 400;401;403 QL_SUAT_CHIEU/scope;404 refs;409 overlap;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-04); Chưa browser show create, room/movie selection, overlap conflict and successful reload. |
| Required UI behavior | 201 correctshow; overlap409 kể cả concurrency; invalid parents/foreign scope không write. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Future show create UTC201;end/start/duration invalid;overlap409;foreignroom403;selectedcinemascope;reloadpersisted shows. |
| Fixture / dependencies | F-MANAGER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-05"></a>

### R71-FE-QLR-05 — Sửa suất chiếu

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-05 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerResourceForm showtime edit; managerApi.updateManagerShowtime |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | {movieId,startsAt,endsAt,format,basePrice,status}; roomId không thuộc update; UTC offset bắt buộc → {showtime}; history immutability SQL; refresh list; 400;401;403 scope/grant;404;409 history/overlap/cancel route;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-05); R32 controlled browser persisted edit/retry; chưa realSQL full update/history/overlap UI. |
| Required UI behavior | 200 allowed edits; overlap409/history409; payload không reset identity/price/time ngoài intention. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Hydrate/edit allowed future show;roomId excluded;historyimmutable409;overlap;switch scope midwrite;no stale editor changes. |
| Fixture / dependencies | F-MANAGER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-06"></a>

### R71-FE-QLR-06 — Hủy suất chiếu

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-06 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerWorkspace cancel action; managerApi.cancelManagerShowtime |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | POST /cancel reason optional≤255; UI default{}; identity JWT, no status PUT shortcut → {cancelled:true}; reload showtimes; compensation SQL; 400 invalid reason/path;401;403 scope/grant;404;409 held/started;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-06); Chưa browser cancel success, held/paid denial, expired-order policy and refresh show list. |
| Required UI behavior | Cancel200 preserve history; started show/live order reject409; expired/canceled orders do not block incorrectly. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Cancel unusedfuture show;heldorder409;started/historyrules;paid cancellation compensation exactlyonce;reload;scope/grantdenied. |
| Fixture / dependencies | F-MANAGER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-07"></a>

### R71-FE-QLR-07 — Cấu hình bảng giá

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-07 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerResourceForm pricing; managerApi.getPricing/createPricing/updatePricing |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | seatType/dayType/format enums; surcharge DECIMAL18,2≥0; startsOn DATE/endsOn nullable DATE; update addsstatus/fullgroup → {pricing[]}; {pricing}; price function SQL; no Ngày lễ; 400;401;403 QL_BANG_GIA/scope;404;409 overlap;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-07); Chưa browser Manager pricing create/update/full condition/NULL dates/overlap/assigned access; R43 browser chỉ Admin form. |
| Required UI behavior | Scoped create/update/readback; overlap409; three official day types, open ended dateNULL; authoritative ticket price. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Create/full edit all dimensions/nullend/status;decimal surcharge;daytype3/noholiday;overlap409;current scope;filter;historicalprices unchanged. |
| Fixture / dependencies | F-MANAGER; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-08"></a>

### R71-FE-QLR-08 — Dashboard hoạt động rạp

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-08 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerWorkspace dashboard; managerApi.getDashboard |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | GET cinemaId INT; no occupancy input/newformula → {dashboard} activeRooms/activeSeats/showtimesToday/paidOrdersToday; 400 path;401;403 XEM_BAO_CAO_RAP/current scope;404 cinema;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-08); Chưa browser metrics, đổi cinema, empty/zero data, loading/error and denied scope. |
| Required UI behavior | Room/seat active counts, today shows/paid orders scoped and businessdate correct; foreign403. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Independently seeded active/inactive rooms/seats,today/canceled shows,receipt midnight UTC+7;assert four metrics including active seats in inactive room;scope/denied/zero/error. |
| Fixture / dependencies | F-MANAGER + F-REPORT; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-09"></a>

### R71-FE-QLR-09 — Doanh thu rạp

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-09 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerRevenue; managerApi.getRevenue |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. ManagerRevenue active effect guard/attempt retry; range form validates from≤to. [] |
| Contract | GET cinemaId; optional fromDate/toDate DATE inclusive; absent dates SQL default; from≤to → {revenue[]} date,totalRevenue,orderCount; receipts/snapshots SQL; 400 path/range;401;403 XEM_BAO_CAO_RAP/scope;404 cinema;500/503; empty200 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-09); Chưa browser date filtering, numeric totals, empty/retry/foreign cinema and zero rows. |
| Required UI behavior | Only successful receipts scoped to cinema/date; ticket/food/discount/paid totals SQL-derived; no false revenue from pending/failed. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Independent paidreceipt ledger across midnight/failed/canceled;inclusive/default/datebounds;empty/error/retry;scope/grantrevocation;SQLtotals rendered. |
| Fixture / dependencies | F-MANAGER + F-REPORT; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |


---

<a id="phan-4"></a>

## R8 — Browser Test Environment, verified tại work package R8.1

**READY**: [final environment result](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/environment-result.json), 8/8 smoke PASS. Readiness chỉ chứng minh infrastructure, không phải nghiệm thu 43 business UC.

### Architecture và tooling

Real Chrome → production `index.html/main.jsx` → StrictMode/App/AuthProvider/BrowserRouter/AppRoutes → real same-origin fetch `/api` → Vite proxy → real Express → existing typed Stored Procedure gateway → SQL Server **test DB**. Không mock API, không destination stub thay app, không sửa production components/config. Quan sát SP bằng wrapper giữ nguyên `Request.execute`; chỉ ghi tên SP/parameter names/time/result, không values.

| Runtime | Actual version/config |
| --- | --- |
| Node | 24.21.0 |
| React / Vite | Installed19.3.0 / 8.3.1; package ranges lần lượt ^19.2.8 / ^8.3.0 |
| Browser | Chrome155.0.8059.39, Chrome DevTools Protocol; browser JSON có protocol version |
| Runner | [browser.mjs](../scripts/r8-1/browser.mjs), kế thừa CDP pattern của repository; không thêm framework/dependencies |
| Browser profile | Dedicated random OS temp directory; không dùng user Chrome profile; owned child process windowsHide/headless |
| Capture | Network method/URL/status, console/errors, Runtime exceptions, loading failures, screenshots; không request headers/bodies hoặc auth/me sensitive response |
| Timing | CDP command timeout và bounded polling theo runner; startup DevTools HTTP readiness retry; không sleep chặn vô hạn |

Browser implementation kiểm tra me response thật từ request UI bằng CDP response body rồi chỉ export actorID/currentRole/grant count/assignment count. Token/password/email không được ghi vào public artifacts. Current runner là smoke tối thiểu; R8.2 controlled response delays/fault injection cần record riêng, không được gắn nhãn real SQL success cho response giả.

### Exact database identity và canonical parity

| Field | Reviewed actual identity |
| --- | --- |
| SQL Server | DESKTOP-E67DPCV, SQL Server17.0.1000.7 |
| Database | `CinemaBookingDB_R0_R81_20261010_3d49fc44` |
| database_id / GUID | 48 / `33876608-D109-43B5-ACEC-0B84C2639A73` |
| SQL create_date | `2026-10-10T08:59:01.693`, local server value |
| Data file | `C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\DATA\CinemaBookingDB_R0_R81_20261010_3d49fc44.mdf` |
| Log file | Same directory, `CinemaBookingDB_R0_R81_20261010_3d49fc44_log.ldf` |
| Existing-target review token | `890876ca47bae59b6fd04ac49725ac43aa30bd5e90dfd73ba7f282c3c04c51bf`; applies only to this current identity |
| Canonical | 27 tables, 159 modules: SP125/FN21/V6/TR7; source definitions/SET/schema/dependencies verified; approved R7.2 SP included |
| Protection | FK/CHECK enabled and trusted, triggers enabled; no protection disabled for fixtures/cleanup |
| Final state | ONLINE, seed-only retained; no test DB user/server login remains |

R5 absent-target preflight: [run](evidence/r55/runs/2026-10-10T01-58-48-895Z-85141ab6/). Build: [run](evidence/r55/runs/2026-10-10T01-58-57-223Z-7aafc8c9/). Existing-target identity review: [run](evidence/r55/runs/2026-10-10T02-02-19-997Z-43001564/). Verification: [unique database audit](../database/_audit/verify-CinemaBookingDB_R0_R81_20261010_3d49fc44.json). Source parity and cleanup evidence are in the final R8.1 run.

Target was absent before build; no existing DB reset. Main `CinemaBookingDB` GUID96F850EA-987F-41A1-9086-38F6597968C8 was only read for fingerprints. Test runtime login was denied main access. No R7.2 re-deployment to main in this task.

### Test-only configuration

[smoke.mjs](../scripts/r8-1/smoke.mjs) refuses a non-R81 name, missing R5 identity, wrong confirmation, existing result output or non-fresh transaction tables. Fixture SQL is prefixed by R5 exact identity guard. Environment overrides occur **before importing backend production configuration**.

| Setting | Value / ownership |
| --- | --- |
| NODE_ENV | test |
| DB_DATABASE | Exact test name above |
| DB_SERVER/DB_PORT/DB_ENCRYPT/DB_TRUST_SERVER_CERTIFICATE | Local connection settings from existing R5 operator configuration; no value/credential copied into reports |
| DB_USER / DB_PASSWORD | Generated unique test-only SQL login/password; EXECUTE on dbo in this test DB only; no direct table DML grants for backend runtime |
| JWT_SECRET | Random runtime-only secret for this test backend |
| VITE_API_BASE_URL | `/api` |
| Express host/port | 127.0.0.1, OS-assigned port0; successful run60266 |
| Vite host/port | 127.0.0.1, OS-assigned port0; successful run60267; actual existing vite.config + test-only proxy override; HMR off |
| Artifact output | New directory under docs/evidence/r8-1/runs; refuses overwrite |
| Recovery material | Dedicated private OS temp directory; not .env/repository/public evidence |

SQL provisioning uses the existing local operator access required by R5; **backend runtime uses a newly generated separate login**, not the operator/main credentials. Setup chooses existing seeded actor IDs, not hardcoded role IDs. Secrets are randomized, passed in memory and redacted from artifacts; private recovery files include original hashes and owned IDs for failure recovery. No secret-bearing `.env` or package change is created.

Services are launched together by the harness and automatically stopped in finally. Reported URLs describe the completed run, **currently stopped**. Rerun reprovisions credentials and selects fresh ports; do not expect old URLs/passwords to work.

### Commands: identity, startup, smoke, cleanup

Run from repository root `D:\DBMS_DO_AN`. Dependencies are already installed; runner uses existing frontend/backend node_modules. R5 preflight emits its actual output/confirmation; do not substitute a token from a different identity.

For a **new absent** test database, choose a new R81-prefixed name, then use existing R5 CLI:

```powershell
node scripts/db/run.mjs preflight-test --database=CinemaBookingDB_R0_R81_NEW_UNIQUE_NAME
node scripts/db/run.mjs build-test --database=CinemaBookingDB_R0_R81_NEW_UNIQUE_NAME --confirm-target=TOKEN_FROM_THAT_PREFLIGHT
```

These placeholders are deliberate, not commands used for the already built DB. Review absence/server/files before build; do not use reset-existing to resolve a test error. Successful R5 commands/results for this task are preserved in the linked runs.

Read-only current identity check, verified at completion:

```powershell
node scripts/r8-1/prepare.mjs --database=CinemaBookingDB_R0_R81_20261010_3d49fc44 --check
```

To create a **fresh** run context for the retained seed-only test DB:

```powershell
node scripts/r8-1/prepare.mjs --database=CinemaBookingDB_R0_R81_20261010_3d49fc44
```

[prepare.mjs](../scripts/r8-1/prepare.mjs) exports reviewed identity/token and a concrete `nextCommand` with new output directory. Review that identity, then execute the emitted command. It launches real backend/frontend/browser, sets up disposable fixtures, runs smoke and cleans up automatically. Syntax and read-only target-review mode verified; no additional mutating smoke was needed after the final successful run.

The actual final smoke command was:

```powershell
node scripts/r8-1/smoke.mjs --output=docs/evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee --confirm-target=890876ca47bae59b6fd04ac49725ac43aa30bd5e90dfd73ba7f282c3c04c51bf
```

That historical command now correctly **refuses overwrite**; use prepare to get a new output. No standalone cleanup command is required after normal completion: this same smoke command invokes its guarded finally cleanup on success/failure. Verify `fixture-cleanup.json`, `main-preservation.json` and `environment-result.json` after every run.

For an abrupt process/OS termination, finally may not run. Inspect the latest run's private recovery directory (`setup-complete.private.json`, or earlier `recovery.private.json`), re-review exact GUID/files/server, stop only that run's browser/backend connections, remove only recorded owned complaint processing/complaint IDs, restore recorded seeded hashes, then drop only the recorded test DB user/login. Recheck all27 fingerprints/parity/constraints/transactions. Recovery is an operator procedure, **not an implemented/tested standalone command**. Do not publish recovery contents, reset main, disable FK/triggers or delete a DB to conceal failed cleanup. If setup did not complete, compare the seed baseline to identify only that interrupted run's `R81 Smoke` owned rows before recovery.

Frontend package-equivalent checks already executed: cwd frontend for `node --test --test-concurrency=1 tests/*.test.js` (62/62), existing oxlint over src/tests (PASS), Vite build to the fresh evidence `build/` directory (PASS). Wrong-cwd diagnostic logs remain separate. Production frontend/dist was preserved.

### Fixtures: created minimum and R8.2 design

Verified minimum: four existing seeded users, one per role, temporary random passwords restored afterward; Manager has one assigned cinema; full-grant Admin23/Manager8/CSKH4/Customer5 permissions. Four owned **unlinked** complaints cover Thấp/Trung bình/Cao/Khẩn cấp and populate actual Support/Admin queues. No order/payment/review fixture or full business flow was created for these smoke checks.

Canonical seed supplies catalog/cinemas/rooms/seats/prices/products/promotions and date-relative showtimes. SQL clock at setup: business date **2026-10-10**, future showtimes derived at R5 build (24 future shows/960 available seats), not fixed calendar literals. A later rerun must check that seed shows are still future; create a new dated R5 target when necessary, not reset an existing target with valuable data.

| Fixture group | R8.2 concrete design / dependencies |
| --- | --- |
| F-CUSTOMER | Current valid Customer; owned second Customer for cross-owner denial; private test roles/grants for revoked DAT_VE/payment/review permissions; registration unique email/phone; strict cleanup ownership |
| F-BOOKING | Two future SQL-clock shows A/B, seat sets disjoint with known occupied/held/free statuses, products quantities0/1/10/11, valid/expired/inactive promotions, SQL-priced decimal snapshots, held/expired orders and payment attempts. Book through real UI/SP; competing requests through controlled harness for409/concurrency |
| F-HISTORY/COMPLAINT | Owned paid past show/order eligible review; unpaid/future/not-owned/ineligible counterparts; linked and unlinked complaints, missing/denied references, processing timeline/status matrix. Build history with approved R5 fixture-test workflow, preserving source SP; do not fabricate future eligibility in React |
| F-MANAGER | Valid single/multi-cinema assignments, none/revoked/expired assignments; permission-limited manager; owned room/seat/show/pricing CRUD and wrong-scope counterparts; compare Dashboard four SQL metrics and scoped revenue |
| F-SUPPORT | Full grants plus owned limited-grant actors missing each QL_KHIEUNAI/TRA_CUU_DON/XULY_KHIEUNAI. Queue matrix all4 priorities × chosen statuses/types/search markers; linked order/timeline fixture from F-HISTORY/COMPLAINT; filter AND expected IDs |
| F-ADMIN | Full and individually limited-grant Admin actors; authoritative current role mapping for Manager/CSKH/Admin create, Customer/custom denial; owned CRUD records across all inherited modules, grant/assignment fixtures; never modify main roles/users |
| F-REPORT | Nonzero/zero paid orders, refunds/compensations and dated cinema/movie dimensions as allowed by current report contract; SQL expected totals, historical snapshots, date boundary; no new occupancy/revenue formula |

These expanded fixtures are **planned, not yet materialized**. Per-gap scenarios/dependencies/acceptance in [R8.2 backlog](#phan-3) refer to these groups. They can share a browser journey but require independent UC evidence mapping. Denied actors live only in this disposable test DB; fixtures may provision cloned limited roles/assignments with operator access, without changing production role policy or granting the runtime SQL login DML. Current grants must be loaded through auth/me; do not modify client session claims to fake authorization.

Dynamic dates use `dbo.fn_BayGio()`/`dbo.fn_HomNay()` and SQL business-date conventions. Future shows, hold/payment expiry, promotion windows and assignment dates are computed at scenario setup; controlled expired/historical cases explicitly label their intended state. No `new Date()` frontend override as a substitute for SQL authoritative clock.

Normal R8.1 cleanup order: owned XULY_KHIEUNAI → KHIEUNAI; restore four original NGUOIDUNG hashes; drop runtime test DB user and unique server login; verify fingerprints/parity/protections/transactions; close all pools. No FK/trigger disable and no identity reseed. Test DB identity counters may advance under existing R5 fixture convention, explicitly excluded from data/metadata fingerprint equality.

R8.2 cleanup must use recorded owned IDs and dependency order appropriate to the created graph: complaint processing/complaints/reviews before linked resources, compensation/payment before order details/order, order before showtime, pricing and seats before room/cinema, image/cast/genre joins before parents; restore touched promotion usage/loyalty/grants/assignments from recorded baselines. Determine actual FK graph before execution rather than use this list as generic DELETE SQL. Fingerprint seeded rows/metadata and require no open user transactions. Prefer fresh owned targets per complex journey when side effects cannot be safely restored; never drop/reset main or another user's target.

### Smoke and evidence

Final run: `docs/evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/`.

| Smoke | Real verification |
| --- | --- |
| SMOKE-01 | Actual main/App/AppRoutes/layout render, public screenshot, no fatal runtime exception |
| SMOKE-02 | Browser health/db response identifies exact Test DB through owned proxy/backend |
| SMOKE-03 | Customer actual Login form→me/current grants→default `/`; forbidden Admin guard; profile mount/mobile |
| SMOKE-04 | Manager Login→me→`/manager`; assigned cinemas/read Dashboard from real SQL |
| SMOKE-05 | CSKH Login→me→`/support`; nonempty four-priority queue read from real SQL |
| SMOKE-06 | Admin Login→me→`/admin`; module navigation and complaints queue with current grants |
| SMOKE-07 | Unique backend DB identity/login denied main; owned cleanup; main unchanged |
| SMOKE-08 | Console/network/Runtime diagnostics retained; no unexplained local API/fatal failures |

[startup.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/startup.json), [procedure trace](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/procedure-trace.json), [browser smoke](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/browser-smoke.json), [fixture setup](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/fixture-setup.json), [cleanup](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/fixture-cleanup.json), [main preservation](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/main-preservation.json), [quality gate](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/quality-gate.json). Browser network trace is embedded in browser-smoke, not a separate HAR invented by this report. Screenshots are PNG files in that run; source/mapping/backlog JSON provide traceability.

Failed attempts retained: initial base run CDP startup timeout, second `2026-10-10T02-04-56-770842Z-c3fe5006` strict diagnostics assertion. Both cleanup/main preservation PASS; neither is re-labelled a successful smoke. Test-only CDP retry reuses Chrome's initial about:blank page; exact known diagnostics handling keeps warnings in final evidence.

### Known limitations and final state

One actual React console.error is a missing-key warning in AdminPortal (R81-FIND-KEY-01, pending R8.2); it is not hidden or “zero console errors”. Google Font stylesheet has `ERR_NETWORK_ACCESS_DENIED` (12 failures); screenshots use existing fallback font. Six local ERR_ABORTED requests are navigation/StrictMode cancellations. Final capture has151 responses, zero Runtime exceptions and no unexplained API errors; successful smoke only verifies readiness.

Existing build chunk>500kB warning and external output directory warning are retained; no code-splitting/redesign changes. Frontend test initial cwd mistakes are separately retained; canonical frontend invocation passed62/62. Race/double-submit/403/404/500/fault/a11y/responsive suites for the43 gaps have not been executed.

Cleanup **PASS**, main preservation **PASS**, canonical parity **PASS**, @@TRANCOUNT0/no open user transactions. Test DB remains fresh seed-only; browser/Express/Vite/pools stopped and test runtime credentials dropped. Private temp recovery material stays outside repository/public evidence. Reprovision per next run; old credentials are unusable. No environment blocker preventing R8.2.
