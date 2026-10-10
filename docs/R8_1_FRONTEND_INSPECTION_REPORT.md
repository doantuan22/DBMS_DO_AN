# R8.1 — Frontend Inspection, Contract Alignment & Test Environment

**R8.1 DONE — FRONTEND AUDITED & BROWSER TEST ENVIRONMENT READY**

Ngày thực hiện: 10/10/2026, UTC+7. Đây là work package inspection/environment trong phương án ba task R8. Roadmap item R8.1/I-11 và I-15/I-19/I-21 vẫn **PENDING FIX/VERIFICATION tại R8.2**. Không sửa production functionality; không thay grade nghiệm thu frontend.

## A. Project Context

Repository baseline: `f3da7f6a1b06fa30ffe223d8e0ed3e5e8cee714a`. Đã đọc các nguồn bắt buộc, API contracts, React source/tests, backend routes/validators/controllers/services và R5 test-target workflow. [Source audit](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/source-audit.json) ghi hash/line counts của tài liệu và 176 source files; import graph có 69 file reachable từ entry thật. [Baseline hashes](evidence/r8-1/runs/2026-10-10T01-58-04-401313Z-3d49fc44/repository-all-before.json) bao gồm cả evidence cũ và file ignored, không xuất nội dung secrets.

[R7.3 acceptance](R7_3_FINAL_ACCEPTANCE_REPORT.md) bàn giao 45/45 DB/BE PASS, backend regression 192/192 và No-SQL Audit PASS; đó là kết quả lịch sử, không phải bộ test được chạy lại ở R8.1. [Main Database Sync](MAIN_DATABASE_SYNC_REPORT.md) là nguồn mới hơn cho việc triển khai hai approved SP R7.2 và parity 159/159 trên main. Không coi ghi chú main-sync pending trong tài liệu lịch sử là trạng thái hiện tại. Các báo cáo lịch sử được giữ nguyên.

R8.1 dùng database mới qua R5 canonical pipeline; main `CinemaBookingDB` chỉ được fingerprint read-only trước/sau. [Final quality gate](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/quality-gate.json) kiểm tra bảo toàn source/evidence và các đầu ra của task.

## B. Frontend Architecture

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

## C. Existing UI Identity

[index.css](../frontend/src/index.css) định nghĩa blue primary `#1e3a8a`, hover `#1e40af`, active `#172554`; amber accent `#f59e0b`; page `#f8fafc`, surface `#fff`, surface-alt `#f1f5f9`, text `#0f172a`, muted `#64748b`, border `#e2e8f0`. Font stack Plus Jakarta Sans → Inter → system fallback. Giữ CinemaStar/blue-amber star identity, tokens spacing/radius/shadow và typography hiện có.

AreaLayout giữ sticky header, role links, account menu, skip link, main Outlet và footer. Auth card, catalog section/card, table-wrap, catalog form/actions/buttons, list/status badge và live/alert feedback là conventions hiện hành. SeatMap dùng rows/legend và trạng thái accessible pressed. Layout dùng Grid/Flex, mobile breakpoint 768px và minimum body width 320px. Native `window.confirm` xuất hiện ở một số Admin delete/status/cancel actions; không mặc định mọi Manager mutation có confirm.

Đã lưu 1440px desktop cho public và bốn portal, Admin complaints; 390px mobile cho Customer trong [run browser](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/browser-smoke.json). Google Font bị môi trường mạng từ chối, nên screenshots dùng **fallback font hiện có**, không phải visual baseline chuẩn font brand. Chưa kiểm tra toàn bộ keyboard/a11y/responsive flows. R8.2 giữ UI identity, bổ sung controls/state feedback tối thiểu và kiểm tra regressions quanh phần sửa.

## D. 45 UC Frontend Coverage

| Actor | UC | FE PASS sơ bộ giữ nguyên | Gap inspected | Ready for R8.2 |
| --- | ---: | ---: | ---: | ---: |
| Customer | 14 | 2 | 12 | 12 |
| Manager | 9 | 0 | 9 | 9 |
| CSKH | 6 | 0 | 6 | 6 |
| Admin | 16 | 0 | 16 | 16 |
| Total | 45 | 2 | 43 | 43 |

KH-02/KH-03 vẫn provisional PASS, chưa full application acceptance. 43 UC còn lại vẫn PARTIAL; không thêm UC. [Gap matrix](R8_FRONTEND_GAP_MATRIX.md) và [raw mapping](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json) có đủ entry/route/page/component/client/method/path/contract/auth/form/async/success/error/loading-empty-retry/evidence/missing/risk cho từng UC, cùng endpoint → controller → service → SP chain.

52 legacy browser registry selectors đã được resolve vào artifact thật và hash trong source audit. Một số evidence chỉ mount component/MemoryRouter destination stub, không được coi là full AppRoutes E2E. Những UC ghi BROWSER_MISSING nghĩa là chưa có proof phù hợp cho **business behavior**; smoke login/portal mới chỉ bổ sung environment readiness. SOURCE_MAPPED/STATE_RACE_RISK/CONTRACT_MISMATCH/READY_FOR_R8_2 là classifications, không thay official grades. Fixture mở rộng được thiết kế, chưa materialize toàn bộ 43 journeys.

## E. Four Critical Issues

| Issue / UC | Current implementation và protection | Cơ chế/rủi ro cần R8.2 kiểm chứng | Hành động và browser plan |
| --- | --- | --- | --- |
| I-11 / ADM-15 | [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx#L132) `openComplaint`; list loadRequest chỉ bảo vệ list | Detail/reference awaits không có generation/abort/selected-ID guard; A về muộn có thể ghi detail A khi selected B. Mutation dùng selected.id rồi refresh captured selection; switch khi pending có thể khôi phục complaint cũ | Fix tối thiểu identity/generation cho detail/reference/write refresh; A chậm/B nhanh, late success/error, đổi module, write pending, target B trùng nội dung visible, retry/abort |
| I-15 / CSKH-02 | [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx#L26) loadQueue không guard; detailGeneration bảo vệ detail riêng; Admin list đã có guard | Queue A có thể ghi rows/loading/error sau B. Filter mới chưa có priority. Không có pagination hiện hành để giả định kiểm chứng | Bảo vệ queue lifecycle; status+priority+type+search AND; A chậm/B nhanh, stale error, empty, retry; shared Admin query chỉ kiểm khi có dùng filter |
| I-19 / KH-05…09 | [BookingPreparation.jsx](../frontend/src/pages/BookingPreparation.jsx#L21); show detail/products có AbortController, quote có previewVersion | Khi params đổi, thiếu reset/key cho quantities/code/result/error/busy; selected seats chỉ lọc sau response seats, chưa reset đầu context. Seat success và booking response/refresh chưa gắn generation; quote finally busy không guard | Scope state theo showtime, guard responses; A→B trong cùng mount, no seat/quote/result A, payload không trộn A/B, pending navigation, double click, 409/reload/failure |
| I-21 / CSKH-04, ADM-15; thêm KH-14 cùng pattern | [ComplaintOrderReference.jsx](../frontend/src/components/ComplaintOrderReference.jsx) đã có active guard và loading/error/empty/retry. [Complaints.jsx](../frontend/src/pages/Complaints.jsx#L22) catch→applyOrders([]); Admin inline catch→message | CSKH không còn source anti-pattern catch-empty. Customer che 403/network/backend error thành empty và xóa order selection. Admin hiện message lỗi, nhưng mất status/error taxonomy và reference retry riêng; không nói Admin literal empty | Giữ protection đúng của CSKH, test linked/unlinked/403/404/500/network/retry/switching; sửa Customer error state; Admin phân biệt legitimate unlinked với lỗi và retry |

Đây là inspection source và root-cause hypotheses; **chưa chạy race injection hoặc các business mutation journeys**. FIX_REQUIRED là kế hoạch cho source-confirmed omissions/shared fixes, không phải tuyên bố đã tái hiện mọi race. Controlled response delay/fault tests ở R8.2 phải ghi loại transport test; vẫn cần successful real SQL journeys độc lập. I-21 không được mặc định yêu cầu sửa component CSKH vốn đang có guards đúng.

## F. Contract Alignment

| Contract | Source hiện hành / kết luận | R8.2 |
| --- | --- | --- |
| CSKH priority | Support filters chỉ status/type/search; API helper có thể serialize query nhưng UI không tạo priority. Approved enum **Thấp, Trung bình, Cao, Khẩn cấp**, optional empty omitted; SQL AND filter; invalid400 | CSKH-02 alignment; giữ filters cũ và I-15 race guard. Không đổi SQL/validator |
| ADM-02 allowed create roles | Generic create form nhận numeric roleId; không dropdown/hardcoded role IDs hay Customer options. UI có thể gửi arbitrary numeric ID; SQL allowlist Manager/CSKH/Admin trả403 cho Customer/custom; generic error notice + current-user refresh | UI chọn vai trò hợp lệ theo authoritative mapping hiện có; không mở create allowlist sang user list/status. Admin có QL_NGUOIDUNG nhưng thiếu QL_VAITRO cần UX dùng nguồn role mapping được phép; không tự cấp grant hoặc thêm backend API |
| QLR-08 Dashboard | UI đọc activeRooms/activeSeats/showtimesToday/paidOrdersToday đúng bốn fields. activeSeats không tự suy ra từ rooms; paidOrders theo successful payment và SQL business date | TEST_REQUIRED: nonzero/zero/null-missing semantics, assignment isolation, date boundary; không thêm occupancy |
| Monetary ownership | UI gửi IDs/quantities/code/payment method/result; SQL quyết giá/discount/total/payment/snapshot/revenue. VND formatter làm tròn hiển thị 0 decimal, không thay authoritative amount | Test decimal values, preview/final/historical assertions; không thêm công thức React |
| Admin decimal inputs | Generic number inputs thiếu step phù hợp cho giá/discount/surcharge/base price decimal(18,2); Manager form đã step0.01 | ADM-11/12/13/14 CONTRACT_ALIGNMENT_REQUIRED; kiểm tra browser validity với decimal hợp lệ rồi minimal input fix |
| ADM-16 Revenue | Current DTO có summary/byCinema/byMovie/byDate; `dataRows` lấy array đầu tiên, UI hiện chỉ một dimension | Alignment consumption approved DTO; không tạo metric mới; test đủ existing summary/dimensions và filters |

Per-UC mapping ghi method/path, casing/typed IDs, body/query/default/null, SQL money/date/UTC ISO và response envelope/list/nullable fields, grant/assignment/ownership, statuses/message/code. Không giả định mọi endpoint có pagination hay 422: production error handler hiện có 400/401/403/404/409, auth429 và failure500/503 tùy nhánh. Frontend DOM validation chỉ hỗ trợ UX; không phải authority cho role/price/scope.

## G. Browser Test Readiness

**READY**, run thành công 09:07:03–09:07:17 UTC+7: [environment-result.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/environment-result.json). Chi tiết commands/fixtures/limitations: [Test Environment](R8_TEST_ENVIRONMENT.md).

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

## H. Findings

| Primary backlog category | Gaps | Ý nghĩa |
| --- | ---: | --- |
| FIX_REQUIRED | 7 | KH-05…09 shared I-19, KH-14 masked lookup, ADM-15 I-11/I-21 |
| CONTRACT_ALIGNMENT_REQUIRED | 7 | CSKH-02 priority, ADM-02 roles, ADM-11…14 decimal fields, ADM-16 revenue DTO |
| TEST_REQUIRED | 29 | Có source; cần browser proof, gồm các risk hypotheses chưa đủ để yêu cầu fix |
| BLOCKED | 0 | Runtime/fixtures tối thiểu đã chạy; expanded fixtures tạo per journey |

Confirmed source omissions/contract limits ở các bảng trên chưa được sửa. Cảnh báo browser **R81-FIND-KEY-01**: một React console.error “Each child in a list should have a unique key prop”, render AdminPortal. Exact collection/root cause cần R8.2 trace; không gán đoán cho complaint row đã có key. Đã gắn finding vào ADM-15 execution item và chung portal regression, không mở UC mới.

Browser ghi 151 network responses, 0 Runtime exceptions, 1 known key warning; 18 loading failures gồm 6 local canceled requests do navigation/StrictMode và 12 Google Font access denied. Không có unexplained local API failure/API error. External font restriction và build chunk>500kB là limitations, không blocker chức năng environment. Không dùng các screenshots fallback để kết luận font visual parity.

Suspected risks còn ở Payment/OrderDetail/ComplaintDetail/MovieReviews resource change, Support processing/status duplicate/pending selection, Admin grant/image mutations và generic pending controls. Những gap này giữ TEST_REQUIRED khi chưa có reliable wrong-behavior proof; scenario được ghi trong backlog. Không coi mọi PARTIAL là lỗi production.

Execution order đề xuất: P1 I-11/I-15/I-19/I-21 và write-target correctness → P2 approved role/money/revenue alignment → P3 journeys per role, denied auth/scope và mutations trước simple reads. CSKH-02 P1 vì I-15 shared risk; priority-control alignment riêng thuộc P2. Counts theo gap: P1=11, P2=6, P3=26. Đây là thứ tự thực hiện, original issue/gap severity P3 giữ nguyên. [R8.2 backlog](R8_2_EXECUTION_BACKLOG.md) có 43 actionable records, acceptance/fixtures/dependencies; tất cả PENDING_R8_2.

## I. Conclusion

**R8.1 DONE — FRONTEND AUDITED & BROWSER TEST ENVIRONMENT READY**

45 UC đã mapping, 43 inherited gaps đã inspected và ready cho R8.2; không có environment blocker chưa giải thích. Production frontend/backend/SQL và historical reports/evidence được bảo toàn; main không bị mutation. DB test giữ seed-only; test services và credentials đã thu hồi, R8.2 phải reprovision secrets mới.

**43 FRONTEND GAPS PENDING R8.2**. Giữ 2 provisional FE PASS / 43 PARTIAL. Dừng ở R8.1; chưa thực hiện fixes hoặc R8.3 acceptance.
