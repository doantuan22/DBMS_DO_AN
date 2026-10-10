# R7.3 — Final Verification & Acceptance

> **Ghi chú lưu trữ (10/10/2026):** Theo yêu cầu thu gọn `docs`, evidence, contracts, archive và tài liệu hỗ trợ đã được xóa khỏi workspace. Các nhãn case/selector trong báo cáo là tham chiếu lịch sử, không còn liên kết tới raw artifact. Kết quả và verdict được ghi trong báo cáo không thay đổi.


**PHASE R7 = DONE — DATABASE/BACKEND REGRESSION ACCEPTED**  
**FRONTEND VERIFICATION PENDING R8**

Ngày nghiệm thu: 2026-10-09, Asia/Saigon. Baseline Git `9d68c6dbad0750de5ccb84eccbd6959dcf735845`, cộng diff R7.2 đã được phê duyệt. R7.3 thực hiện inspection, offline evidence audit và read-only SQL reconciliation. Không thay đổi SQL/business logic, backend, frontend, schema, manifest, seed hoặc database chính; không chạy lại stress R6. Đây là nghiệm thu Database/Backend trên canonical source và Test DB, chưa phải Final System Acceptance.

## A. Executive summary

| Hạng mục | Kết quả nghiệm thu |
| --- | --- |
| R7.1 / R7.2 / R7.3 | DONE / DONE / DONE; R7.3 nghiệm thu claims bằng source/raw evidence |
| Baseline | 45 UC duy nhất: 14 Customer / 9 Manager / 6 CSKH / 16 Admin; không ADM-17 |
| Database/Backend | 45 PASS; 0 PARTIAL / BROKEN / MISSING |
| Frontend và Overall | Mỗi layer 2 PASS / 43 PARTIAL; không nâng grade |
| Sáu gap R7.1 | 6/6 RESOLVED bằng raw evidence R7.2 |
| Approval | 3 quyết định APPROVED từ câu trả lời thực tế của người dùng |
| Canonical/Test DB | 27 tables / 125 SP / 21 functions / 6 views / 7 triggers; 159 definitions khớp source |
| Regression được tái xác minh | Backend 192/192 PASS; targeted 42/42; No-SQL PASS; typed contracts PASS |
| Database chính | MAIN_DB_DEPLOYMENT_PENDING: thiếu hai definition policy R7.2 |
| Material DB/BE defect còn mở | 0 trong phạm vi canonical source/Test DB đã kiểm chứng |
| Hạn chế artifact | Bốn embedded definition snapshot cũ; hai selector index R6-B cần dùng bảng đính chính R7.3 |

Kết luận dựa trên audit-final.json, environment.json và các raw artifacts được nối đến JSON Pointer, không kế thừa tự động chữ DONE trong báo cáo. `audit.json` cùng thư mục là checkpoint trước khi bổ sung phân loại historical probes và so sánh oracle độc lập; nghiệm thu dùng `audit-final.json`.

## B. Baseline, implementation và source integrity

Đối chiếu baseline chính thức, roadmap, accepted constraints và [đặc tả](<../Phân Tích _ Thiết Kế.md>). Đúng 45 ID/tên nghiệp vụ; hình ảnh rạp thuộc ADM-07, diễn viên/cast thuộc ADM-09, cấu hình hệ thống ngoài baseline. Mục tiêu, luồng baseline, tables, entry points, dependency closure, triggers/constraints, route/middleware/controller/service/whitelist, FE source và evidence từng UC được giữ trong [ma trận FINAL](USE_CASE_MATRIX_45.md). Audit `/UCs/0` đến `/UCs/44` lưu riêng objective, mapping, source hashes, authorization, accepted evidence IDs, freshness và acceptance rationale.

Canonical inventory không đổi. Đọc cả 159 module source, đối chiếu normalized definitions với Test DB; không chỉ so tổng object. So với HEAD, 157 definition không đổi, đúng hai procedure R7.2 thay đổi. Manifest không thêm/xóa object, không đổi schema; metadata parameter chỉ thêm `@MucDoUuTien NVARCHAR(50)` ở cuối signature. SQL Server lưu max_length 100 byte; default T-SQL NULL được kiểm tra từ source, không suy từ `sys.parameters.has_default_value`. 9 nhóm metadata Test DB — columns, parameters, keys, FK, CHECK, indexes, triggers, permissions, memberships — không missing/unexpected.

Diff production chỉ ba backend files (hai service và support validator), hai SP; hai test files và ba generated/manifest files đi kèm. R7.3 giữ nguyên tất cả. 262 source/test hashes khớp quality seal regression R7.2; 21 runner source hash R6-B/C khớp hiện hành. Backend tiếp tục `React → REST → Express → typed SP gateway → SQL Server`: whitelist 120 procedure, 112 service methods và 120 captured calls phù hợp signature, SQL defaults cho optional arguments. Một capture không chứng minh mọi branch; full regression và runtime R6/R7.2 bổ sung cho các branch tương ứng. Identity lấy từ authenticated context, permission hiện hành từ SQL; không thêm ORM/query builder/inline business SQL. SQL trực tiếp ở offline verification tooling không phải backend runtime.

**Manifest discrepancy được kiểm tra, không che đi:** `/sourceIntegrity/embeddedDefinitionSnapshotFindings` liệt kê `sp_Admin_Report_Revenue`, `sp_Order_GetDetailByCustomer`, `sp_User_UpdateProfile`, `usp_Admin_Pricing_Update`. Bốn `expected.objects[].definition` là snapshot cũ, đã tồn tại trước R7.2; không khớp canonical SQL hiện hành. [verify.mjs](../scripts/db/verify.mjs) dùng `manifest.modules` để đọc definition source và so với SQL DB, dùng expected objects cho SET options; [verify_objects.sql](../database/12_verify/verify_objects.sql) so schema/name/type. Do đó snapshot cũ không điều khiển deployment, gateway hay kết quả parity. Nghiệm thu **effective canonical definition parity PASS**, không tuyên bố mọi embedded snapshot trong manifest đã đồng bộ. Maintenance artifact này không có observed runtime defect; không sửa manifest/SQL verifier trong R7.3.

## C. Six-gap final acceptance

Gap definition gốc giữ nguyên tại [current frontend gap matrix](R8_FRONTEND_GAP_MATRIX.md). Verification matrix R7.2 có input, expected/actual, raw case selector, HTTP trace, SQL state, before/after fingerprints, cleanup và fix cho từng case. Audit R7.3 đối chiếu cả 83 case với raw, không chỉ đếm PASS.

| Gap | UC / evidence | Coverage được chấp nhận | Case count | Final |
| --- | --- | --- | ---: | --- |
| R71-DB-01 | [KH-13 / E432](USE_CASE_MATRIX_45.md#evidence-e432) | POST 201; SQL persisted và public list; chưa mua/paid future/pending past bị chặn; duplicate409; rating0/6/fraction/string400; missing grant/wrong role403; identity spoof400 | 12 | RESOLVED |
| R71-DB-02 | [QLR-07 / E433](USE_CASE_MATRIX_45.md#evidence-e433) | Manager POST201 và PUT/readback; ba day types, holiday400, NULL end/inclusive bounds, overlap409; foreign/revoked/expired assignment, grant/role denial; fn_TinhGiaVe và historical snapshots | 13 | RESOLVED |
| R71-DB-03 | [QLR-08 / E434](USE_CASE_MATRIX_45.md#evidence-e434) | Bốn approved metrics; raw room/seat/payment facts và show count assertion; UTC+7; cinema isolation/foreign403/revoked/expired/grant/role; GET no-write | 9 | RESOLVED |
| R71-DB-04 | [QLR-09 / E435](USE_CASE_MATRIX_45.md#evidence-e435) | Successful receipts SQL ledger; ticket aggregation riêng; decimal amounts/date bounds/default/empty; pending/failed/refunded không thành paid revenue; canceled có historical success vẫn ghi cash/order, canceled tickets bị loại; scope/auth/read-only | 17 | RESOLVED |
| R71-CT-01 | [CSKH-02 / E436](USE_CASE_MATRIX_45.md#evidence-e436) | Priority enum/filter AND status/type/search; empty/default; invalid HTTP400 và direct SQL50405; QL_KHIEUNAI/wrong role; shared Admin priority/default; no-write | 15 | RESOLVED |
| R71-CT-02 | [ADM-02 / E437](USE_CASE_MATRIX_45.md#evidence-e437) | Allowed3roles; Customer/custom HTTP403 và SQL50404; invalid FK400, duplicate email/phone409; no orphan/profile; grant/role/spoof; savepoint caller1/XACT_STATE1 rồi outer rollback0; list/status | 17 | RESOLVED |

51 P1 HTTP cases + 28 P2 HTTP cases + 4 direct SQL cases = 83 case records thuộc **sáu UC**, mô tả 45 scenario yêu cầu R7.2; không phải 45 UC mới chạy test. Tổng 98 HTTP requests bao gồm login/setup/readback. GET và negative operations so 27-table/metadata fingerprints không đổi; từng fixture cleanup trở về run baseline, DBCC constraints PASS, session transactionCount/XACT_STATE 0, không transaction rò rỉ ở connection khác. Main trước/sau giữ nguyên.

R7.3 còn so sánh lại độc lập 24 numeric/filter oracles trong raw evidence: recompute active rooms/seats và paid orders theo UTC+7 từ persisted facts; so revenue HTTP với successful receipt ledger và fixture decimal arithmetic; áp các predicate priority/status/type/search vào persisted complaint rows rồi so returned IDs. Oracle revenue không gọi production report SP/view/function, tách receipt và ticket aggregation để tránh fan-out. Dashboard expected 1 room / 9 seats / 2 shows / 3 paid orders; activeSeats có ghế hoạt động ở phòng ngưng hoạt động đúng contract SQL hiện tại. Biên payment00:30 local thuộc UTC ngày trước vẫn tính đúng. Các oracle/fixture setup không được gọi là backend inline SQL.

## D. Approved contracts và phạm vi fix

Approval provenance lấy từ actual `send_user_message_question_reply` trong cuộc hội thoại, tool call `call_d1c9a8afbbd34911bc2be562bcf8a4ab`, question ordinals 0–2. Người dùng/project owner chốt ngày 2026-10-09 trước reproduction/fix R7.2; không có exact timestamp của reply nên không tự tạo giờ. Policy document dùng corroboration, không tự sinh quyền phê duyệt.

| UC | Câu trả lời thực tế | Acceptance scope | Approval |
| --- | --- | --- | --- |
| CSKH-02 | “Bắt buộc thêm bộ lọc ưu tiên” | SQL/BE priority filter mandatory; FE wiring/browser R8 | APPROVED |
| ADM-02 | “Manager, CSKH và Admin” | Target MaVaiTro QUAN_LY_RAP/CSKH/ADMIN; exclude Customer/custom | APPROVED |
| QLR-08 | “Bốn số liệu hiện tại đủ cho R7.2” | activeRooms, activeSeats, showtimesToday, paidOrdersToday; không occupancy | APPROVED |

**CSKH-02:** SQL thêm optional last parameter `@MucDoUuTien NVARCHAR(50)=NULL`, enum giống CHECK, thực hiện AND predicate trong procedure. Validator nhận query priority, omitted/rỗng → NULL; typed binding NVARCHAR50; invalid50405 → HTTP400 `INVALID_PRIORITY`. QL_KHIEUNAI/current actor checks vẫn trước filter; sort/default/status/type/search giữ tương thích. Procedure dùng chung cho **CSKH-02 và ADM-15**; raw P2 `/cases/9` và `/cases/10` (`CSKH02-06-admin-consumer`, `CSKH02-06-admin-default`) kiểm chứng Admin priority/default bằng HTTP và SQL rows. Không sửa Frontend.

**ADM-02:** SQL check role code trong owned transaction/savepoint, `VAITRO WITH(HOLDLOCK)` qua insert; không hardcode RoleID. Existing forbidden role50404 → HTTP403 `ROLE_CREATE_FORBIDDEN`; role không tồn tại vẫn FK547 →400 `INVALID_REFERENCE`; duplicate email/phone contracts giữ nguyên. Allowed create HTTP **200** theo controller, không đổi thành201. Xóa nhánh insert Customer profile trái policy; tạo internal users không có profile. Current Admin + QL_NGUOIDUNG bắt buộc; list/status vẫn quản lý mọi tài khoản theo policy hiện hành. Direct SQL Customer/custom negatives và savepoint evidence xác nhận rule thuộc SQL, no-write/rollback đúng.

Freshness impact: 39 UC PASS R7.1 được giữ khi dependencies/source còn tương thích; ADM-15 có fresh shared-consumer regression. Bốn P1 UC bổ sung verification, không sửa production. Sáu UC newly PASS dùng E432–E437. E374–E376 là shape-only audit2026-10-07, bị loại khỏi current PASS; static historical replay R54 `sqlExecuted=false` không là DB proof. Pre-fix queue evidence chỉ giữ default/auth; pre-fix Admin create evidence không chứng minh allowlist mới. Tất cả historical records được giữ để truy vết.

## E. Evidence audit và reconciliation

Đọc và đối chiếu R6 A/B/C reports, năm Integration reports, acceptance JSON, verification matrices, regression logs và 437 registry records. `/registry/records` có artifact SHA256, exact pointer, class, selected status và acceptanceUse; `/UCs` nối evidence về source/action/scope cụ thể. 431 historical selectors trên 23 artifacts khớp hash R7.2 seal, tất cả resolve được; E432–E437 resolve đủ 83 raw case records, HTTP responses/domain errors, persisted state và cleanup. Unit/mock, source existence, historical empty GET hoặc controlled-browser response không tự tạo DB/BE PASS.

**Hai lỗi index R6-B đã reconcile tại R7.3:** original selectors `precision/0`, `outerTransaction/0` giả định scalar object là array. Raw file chứa object ở `/precision`, `/outerTransaction`, đều PASS, actual session clean; outer caller transaction1/XACT_STATE1, final orders/tickets/foods rỗng. Audit `/R6SelectorErrata` lưu exact corrected RFC6901 pointers, case IDs và unchanged runner source hash. Đọc corrected raw evidence để nghiệm thu; không sửa/ghi đè index R6-B. Đây là lỗi địa chỉ index, không phải test không chạy hoặc lỗi business rollback.

**Counts theo đúng đơn vị:**

| Nguồn final | Đơn vị được xác minh | HTTP requests | Ghi chú reuse |
| --- | --- | ---: | --- |
| R6-A final | 26 mandatory scenarios PASS; 3 supplemental records, tổng29 | 140 | Không cộng rounds/request thành scenario mới |
| R6-B final | 498 verification units, không đồng nghĩa498 UC/scenarios | 380 | Dùng final run; replay996 units/760 requests không cộng lại |
| R6-C final | 426 HTTP cases và147 SQL groups;5 R6.10 documents riêng | 609 | 68 Admin endpoint contracts; reused A/B không cộng lần nữa |
| R7.2 final | 83 case records trong45 required scenarios,6 UC | 98 | 79 HTTP/4 SQL; registry addresses không là test mới |
| Backend regression | 192 unit/contract tests PASS; fail/cancelled/skipped0 | — | 42 targeted là subset, không cộng với192 |

**Historical FAIL được bảo toàn và loại khỏi final acceptance:**

| Artifact | Nguyên nhân / resolution |
| --- | --- |
| R6-A 10:25:24 | COUNT_BIG string conversion của runner; no tests reached; corrected guard, final run PASS |
| R6-A 10:25:50 | Empty nested JSON NULL normalization/terminal failure recording; corrected tooling |
| R6-A 10:27:58 | Test nhầm list-summary field với detail; corrected detail payment history + list latest status assertions |
| R6-B failed scope cleanup | 8 scope scenarios PASS nhưng restore thiếu NgayGan; recovery khôi phục fingerprint; final PASS |
| R6-C failed fixture | New Admin fixture password6byte bị validation400; valid8byte positive và independent short-password negative PASS |
| R7.2 first checks FAIL | Test expected error table chưa thêm50404; cập nhật test, final42/192 PASS |
| R7.2 pre-fix reproduction | REPRODUCED mismatch priority400 / Customer create200; không dùng chứng minh approved current contracts |

R7.3 không rerun suites/stress còn valid. Chỉ chạy SQL SELECT đọc object definitions/metadata/protections và fingerprint tại hai DB, có target preflight/GUID check. Offline script không tạo runtime PASS mới; nó xác minh evidence đã chạy. Snapshot đầu R7.3 có 2230 files, gồm ignored raw evidence/logs; acceptance chỉ sửa matrix trong các file đã tồn tại. R7.1/R7.2/R6 reports và mọi evidence cũ giữ nguyên SHA256. Final file-preservation/link/grade checks nằm ở quality.json.

## F. Regression và integrity gates

| Gate | Acceptance | Evidence / JSON Pointer |
| --- | --- | --- |
| Baseline 45 UC | PASS | artifact `/baseline` |
| No-SQL Backend | PASS | artifact `/backendRegression` |
| Backend Regression | PASS | artifact `/backendRegression` |
| Canonical DB parity | PASS | artifact `/environments/0` |
| Authorization | PASS | artifact `/UCs` |
| Manager Scope | PASS | artifact `/checks` |
| Customer Ownership | PASS | artifact `/cases` |
| Historical Integrity | PASS | artifact `/checks` |
| Transaction/Rollback | PASS | artifact `/checks` |
| Booking Concurrency | PASS | artifact `/cases/14` |
| Showtime Concurrency | PASS | artifact `/integrity` |
| Room Delete Atomicity | PASS | artifact `/checks` |
| Complaint Trigger | PASS | artifact `/checks` |
| Admin Permissions | PASS | artifact `/checks` |
| R7.2 Contract Fixes | PASS | artifact `/R72` |
| R7.2 Six Gaps | RESOLVED | artifact `/R72/perUCCounts` |
| Evidence Integrity | PASS | artifact `/registry` |
| Database/Backend BROKEN | PASS | artifact `/knownMaterialDBBEDefects` |
| Database/Backend MISSING | PASS | artifact `/baseline/actorCounts` |

R6 booking có actual competing sessions, SQL barrier/wait graph, commit/rollback và persisted seat/quota/loyalty/payment assertions. R6-B có20 historical races,10 room races,26 showtime scenarios,125 stress races (100 gated +25 simultaneous),152 observed deterministic lock waits và4 independent-room commits; final committed overlaps0. Chỉ nêu các category từ acceptance, không cộng trộn thành tổng test. Room delete atomically bảo vệ room/seat/show references; showtime history/money/compensation được giữ; complaint bulk trigger dựa max XuLyID committed history; no-write ownership/auth và live revoked/expired scope được kiểm chứng. Các module liên quan không thay đổi sau R6; không cần rerun stress để tạo thêm PASS.

## G. Environment reconciliation

| Môi trường | Định nghĩa / cấu trúc | Trạng thái |
| --- | --- | --- |
| Canonical source + effective manifest contract | 159 module paths/definitions hiện hành; inventory và signature baseline đúng; bốn unused embedded snapshots được công khai ở B | CANONICAL_SOURCE_VERIFIED |
| CinemaBookingDB_R0_R72_20261009_02 | GUID D811515E-86AE-4B72-9A45-1E7E1B2ED950;125P/19FN+2IF/6V/7TR;27tables;159 definitions match;9 metadata groups no drift | TEST_DB_VERIFIED |
| CinemaBookingDB | Cùng inventory;157 definitions match; hai definition policy còn cũ; thiếu optional priority parameter; metadata khác chỉ parameter đó | MAIN_DB_DEPLOYMENT_PENDING |

Read-only evidence `/environments/0` và `/environments/1` có target identity, definitions/digests, before/after27-table/metadata fingerprints, trusted FK/CHECK, trigger enabled, @@TRANCOUNT/XACT_STATE0, không other user transactions. Hai DB data/metadata trước/sau đều khớp. Server DESKTOP-E67DPCV, SQL Server17.0.1000.7; task-owned Test DB là canonical R5 build sau fix, không reset DB có sẵn trong R7.3.

Hai procedure pending: `sp_Admin_User_Create`, `sp_Support_Complaint_List`. Backend priority binding hiện hành cần signature mới; không dùng database chính còn cũ để tuyên bố hai policy chạy đúng. Roadmap §9 Definition of Done Database/Backend yêu cầu canonical rebuild/verification, scope/atomicity/concurrency/history/regression và data scenarios; không có gate bắt buộc apply main. Prompt R7.3 cho phép Source/Test acceptance khi main pending. Vì vậy deployment pending không phủ định 45 DB/BE PASS **trong verified scope**, nhưng cản việc dùng main cho flow mới cho tới khi triển khai được chấp thuận và kiểm tra parity.

Dynamic data DoD dựa R5.4/R5.5 fixture rollback/commit/negative thực tế và các owned SQL/HTTP fixtures R6/R7.2 (future showtimes, orders/payment attempts/reviews/complaints/compensation). Evidence review R55 ở E377–E379 là actual execution, khác static replay. Test DB acceptance sau cleanup là seed-only, transaction tables rỗng; không tuyên bố hiện tại còn toàn bộ transaction fixture rows hoặc dataset còn phù hợp với clock tương lai. R8 phải chuẩn bị fixture hiện hành trên DB riêng trước browser verification.

## H. Acceptance counts theo actor/layer

### Database/Backend

| Actor | Total | PASS | PARTIAL | BROKEN | MISSING |
| --- | ---: | ---: | ---: | ---: | ---: |
| Customer | 14 | 14 | 0 | 0 | 0 |
| Manager | 9 | 9 | 0 | 0 | 0 |
| CSKH | 6 | 6 | 0 | 0 | 0 |
| Admin | 16 | 16 | 0 | 0 | 0 |
| Total | 45 | 45 | 0 | 0 | 0 |

### Frontend

| Actor | Total | PASS | PARTIAL | BROKEN | MISSING |
| --- | ---: | ---: | ---: | ---: | ---: |
| Customer | 14 | 2 | 12 | 0 | 0 |
| Manager | 9 | 0 | 9 | 0 | 0 |
| CSKH | 6 | 0 | 6 | 0 | 0 |
| Admin | 16 | 0 | 16 | 0 | 0 |
| Total | 45 | 2 | 43 | 0 | 0 |

### Overall

| Actor | Total | PASS | PARTIAL | BROKEN | MISSING |
| --- | ---: | ---: | ---: | ---: | ---: |
| Customer | 14 | 2 | 12 | 0 | 0 |
| Manager | 9 | 0 | 9 | 0 | 0 |
| CSKH | 6 | 0 | 6 | 0 | 0 |
| Admin | 16 | 0 | 16 | 0 | 0 |
| Total | 45 | 2 | 43 | 0 | 0 |

DB/BE completion45/45 =100%. FE/Overall scoring `(2 + 43×0.5)/45 = 52.22%` theo roadmap; score PARTIAL không có nghĩa52.22% browser journeys đã verified. KH-02 và KH-03 giữ provisional FE PASS cho actual Login/AuthProvider→realAPI/SQL và Profile read/update/readback; fixture MemoryRouter không mount toàn AppRoutes. Không suy ra toàn App E2E hoặc staff login đã verified.

## I. Outstanding items và R8 Frontend Handoff

| Item | Owner / next phase | Trạng thái / ảnh hưởng |
| --- | --- | --- |
| 43 R71-FE-* | R8 Frontend Stabilization | DEFER_TO_R8; FE/Overall43PARTIAL |
| Hai procedure trên main | Deployment task riêng có phê duyệt, trước R8 dùng main | MAIN_DB_DEPLOYMENT_PENDING; không apply trong R7.3 |
| Bốn unused embedded definition snapshots | Database artifact maintenance task riêng | NONBLOCKING; effective verifier/source/Test DB đúng; giữ nguyên trong R7.3 |
| Hai R6-B scalar selectors | Evidence consumers | RESOLVED_BY_R73_ERRATA; dùng `/precision`, `/outerTransaction`; index cũ giữ nguyên |
| Material canonical DB/BE bug/gap | — | 0 OPEN; nếu source sau này đổi phải verification lại phần ảnh hưởng |

### Deployment prerequisites — tách khỏi Frontend stabilization

1. Người chịu trách nhiệm deployment review hai approved SP definitions và backend version tương ứng, backup/rollback plan rồi phê duyệt apply riêng trên main; R7.3 không cung cấp/apply migration mới.
2. Sau deployment, kiểm tra all159 definition parity, optional priority signature và inventory/constraints/triggers; targeted priority/default/Admin shared consumer và role allowlist denial/allowed create trên DB kiểm thử phù hợp. Giữ dữ liệu main, không reset/seed để regression.
3. R8 chọn DB/API source tương thích: dùng verified Test DB riêng cùng owned current fixtures, hoặc main sau deployment/verification. Không chạy browser mutating fixtures lên main chưa đủ prerequisites. Điều kiện này do mismatch đã quan sát, không phải cảnh báo giả định.

### R8 Frontend Handoff

Bàn giao toàn bộ [43 FRONTEND_GAP trong backlog](R8_FRONTEND_GAP_MATRIX.md), giữ nguyên UC IDs/priority/issue; không tự mở R8 trong task này. Bảng dưới nối expected UI flow, evidence hiện có và browser proof còn thiếu cho từng UC. Full mapping/API/SQL/selectors ở matrix; current DB/BE không thay thế browser assertions. R8 phải mount actual AppRoutes/guards/state, dùng API→SQL thật, kiểm loading/error/empty/success, valid/invalid actions, current authorization/ownership/scope, record UI/network/SQL assertions và console/runtime errors trong phạm vi từng gap. Controlled mocks và unit tests phải phân loại riêng.

Policy handoff bắt buộc: CSKH-02 thêm priority control và gửi query đúng enum/AND; ADM-15 shared queue tương thích priority/default; ADM-02 role options chỉ Manager/CSKH/Admin (IDs tra từ data), phản ánh403 ROLE_CREATE_FORBIDDEN; QLR-08 bốn metrics approved, không thêm occupancy theo suy đoán. UI list/status Admin vẫn xem mọi tài khoản theo quyền hiện hành. Việc hiện thực các control/options này và browser acceptance thuộc R8.

| Gap / UC | Priority | Expected FE action | Current evidence | Missing browser proof | Status |
| --- | --- | --- | --- | --- | --- |
| [R71-FE-KH-01](R8_FRONTEND_GAP_MATRIX.md) / KH-01 | P3 | 201 tạo đúng Customer + profile; duplicate/invalid không tạo dòng; thông báo và sang đăng nhập. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-kh-01); E001, E002, E003, E004, E380, E381, E382, E383 | R45 browser chỉ kiểm 429 và retry duplicate409; chưa UI đăng ký201, duplicate phone, input invalid và chuyển /login. | DEFER_TO_R8 |
| [R71-FE-KH-04](R8_FRONTEND_GAP_MATRIX.md) / KH-04 | P3 | List/detail phim, genres và cast đúng; missing movie404; lọc phù hợp. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-kh-04); E031 | Chưa browser list/filter/detail, cast/genres, empty404 và retry. | DEFER_TO_R8 |
| [R71-FE-KH-05](R8_FRONTEND_GAP_MATRIX.md) / KH-05 | P3 | Lịch chiếu đúng phim/rạp/ngày và show detail; chỉ suất khả dụng theo contract. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-kh-05); E031, E032, E033 | Chưa browser chọn rạp/ngày, đổi filter, empty lịch và điều hướng booking. | DEFER_TO_R8 |
| [R71-FE-KH-06](R8_FRONTEND_GAP_MATRIX.md) / KH-06 | P3 | Trạng thái free/held/sold và giá đúng; selection ≤10; conflict không gây giữ hai lần. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-kh-06); E031, E034, E035, E036, E037, E038, E039, E040, E389, E390 | R44 chỉ chọn ghế free; chưa browser held/sold, ghế11, concurrent conflict và refresh sau409. | DEFER_TO_R8 |
| [R71-FE-KH-07](R8_FRONTEND_GAP_MATRIX.md) / KH-07 | P3 | 201 một đơn, ticket snapshots/foods/quota đầy đủ; giữ5phút; invalid/concurrent/fault rollback toàn bộ. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-kh-07); E031, E041, E042, E043, E034, E035, E036, E037, E044, E045, E032, E033, E038, E039, E040, E046, E047, E048, E391, E389, E390 | R44 real booking 201 và stale promo409; chưa UI mất ghế, hết hold/max holds, double-submit và payment-link navigation. | DEFER_TO_R8 |
| [R71-FE-KH-08](R8_FRONTEND_GAP_MATRIX.md) / KH-08 | P3 | Có/không food đúng; mỗi dòng quantity/unit snapshot; reject unavailable/qty11 hoặc duplicate split vượt10. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-kh-08); E031, E041, E042, E045, E047, E373, E392, E389, E390 | R44 browser chọn1food và snapshot authoritative; chưa qty0/10/11, nhiều product, inactive product và empty list. | DEFER_TO_R8 |
| [R71-FE-KH-09](R8_FRONTEND_GAP_MATRIX.md) / KH-09 | P3 | Preview read only; final tái kiểm dưới lock, discount snapshot/quota đúng; invalid yêu cầu409, không âm thầm full price. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-kh-09); E031, E049, E050, E037, E051, E047, E048, E373, E393, E391, E394, E392, E389, E429, E430, E431 | R44 browser real stale/pause/requote/final price; R22 controlled timing. Chưa UI quota/minimum/expired, đổi code/seat/food với SQL thật. | DEFER_TO_R8 |
| [R71-FE-KH-10](R8_FRONTEND_GAP_MATRIX.md) / KH-10 | P3 | Attempt amount=stored order; fail/retry/success history, terminal idempotence/flip409, loyalty once, wrong owner404; hold không kéo dài. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-kh-10); E052, E053, E054, E055, E056, E057, E058, E059, E373, E395, E396 | R44 browser successful payment/SQL amount; chưa UI failed→retry history, expiry, revoked permission, terminal replay/flip. | DEFER_TO_R8 |
| [R71-FE-KH-11](R8_FRONTEND_GAP_MATRIX.md) / KH-11 | P3 | Chỉ đơn của Customer, lịch sử paid/failed/expired và số tiền snapshot đúng; không lộ đơn khác. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-kh-11); E052, E060 | Chưa browser history nonempty/mixed statuses, empty, direct navigation và error retry. | DEFER_TO_R8 |
| [R71-FE-KH-12](R8_FRONTEND_GAP_MATRIX.md) / KH-12 | P3 | Bốn recordsets đúng order/tickets/foods/payments; foreign404; GET expiry projection không write/quota mutation. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-kh-12); E031, E037, E052, E053, E373 | Chưa browser full detail và expired/effective status, foreign404, timeline/foodempty; R44 PaymentPage order read không chứng minh OrderDetail component. | DEFER_TO_R8 |
| [R71-FE-KH-13](R8_FRONTEND_GAP_MATRIX.md) / KH-13 | P3 | 201 review hợp lệ; noneligible403, duplicate409, invalidrating400; read after write list đúng. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-kh-13); E374, E377, E378, E379, E432 | Chưa browser review create/list, eligibility/duplicate/permission/errors. | DEFER_TO_R8 |
| [R71-FE-KH-14](R8_FRONTEND_GAP_MATRIX.md) / KH-14 | P3 | 201 linked/unlinked, own list/detail + permitted processing timeline; foreign/missing order404, không lộ staff identity. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-kh-14); E110, E111, E112, E113, E114, E115, E116, E117, E118, E119 | Chưa browser linked/unlinked complaint submit, list/detail, status refresh và customer-safe timeline. | DEFER_TO_R8 |
| [R71-FE-QLR-01](R8_FRONTEND_GAP_MATRIX.md) / QLR-01 | P3 | Login Manager; assigned list chỉ phân công còn hiệu lực; token cũ không giữ scope revoked/expired. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-qlr-01); E012, E006, E007, E008, E009, E010, E011, E061, E062, E063 | Chưa browser login Manager→/manager, assigned selector và empty/expired/revoked scope. | DEFER_TO_R8 |
| [R71-FE-QLR-02](R8_FRONTEND_GAP_MATRIX.md) / QLR-02 | P3 | Scoped rooms CRUD; history guard/deactivate policy; concurrent dependency không partial delete; foreign403. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-qlr-02); E064, E062, E063, E065, E066, E069, E070, E071, E072, E073, E074, E075, E076, E077, E078, E079, E080, E081 | Chưa browser room CRUD, history/deactivate conflict, denied scope and refresh list. | DEFER_TO_R8 |
| [R71-FE-QLR-03](R8_FRONTEND_GAP_MATRIX.md) / QLR-03 | P3 | Seat CRUD đúng room; type lịch sử immutable; active future ticket bảo vệ deactivate/delete; foreign403. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-qlr-03); E062, E063, E067, E082, E083, E084, E085, E086, E087, E088, E089, E425, E426, E427, E428 | R32 controlled browser edit/retry; chưa SQL-backed seat create/delete, layout và future-seat/history conflict UI. | DEFER_TO_R8 |
| [R71-FE-QLR-04](R8_FRONTEND_GAP_MATRIX.md) / QLR-04 | P3 | 201 correctshow; overlap409 kể cả concurrency; invalid parents/foreign scope không write. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-qlr-04); E062, E063, E068, E090, E091, E092, E093, E094, E095, E100, E101, E102 | Chưa browser show create, room/movie selection, overlap conflict and successful reload. | DEFER_TO_R8 |
| [R71-FE-QLR-05](R8_FRONTEND_GAP_MATRIX.md) / QLR-05 | P3 | 200 allowed edits; overlap409/history409; payload không reset identity/price/time ngoài intention. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-qlr-05); E062, E063, E068, E096, E097, E098, E100, E101, E102, E103, E104, E105, E106, E417, E418, E419, E420 | R32 controlled browser persisted edit/retry; chưa realSQL full update/history/overlap UI. | DEFER_TO_R8 |
| [R71-FE-QLR-06](R8_FRONTEND_GAP_MATRIX.md) / QLR-06 | P3 | Cancel200 preserve history; started show/live order reject409; expired/canceled orders do not block incorrectly. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-qlr-06); E062, E063, E068, E099, E367, E368, E369 | Chưa browser cancel success, held/paid denial, expired-order policy and refresh show list. | DEFER_TO_R8 |
| [R71-FE-QLR-07](R8_FRONTEND_GAP_MATRIX.md) / QLR-07 | P3 | Scoped create/update/readback; overlap409; three official day types, open ended dateNULL; authoritative ticket price. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-qlr-07); E064, E107, E108, E109, E433 | Chưa browser Manager pricing create/update/full condition/NULL dates/overlap/assigned access; R43 browser chỉ Admin form. | DEFER_TO_R8 |
| [R71-FE-QLR-08](R8_FRONTEND_GAP_MATRIX.md) / QLR-08 | P3 | Room/seat active counts, today shows/paid orders scoped and businessdate correct; foreign403. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-qlr-08); E375, E434 | Chưa browser metrics, đổi cinema, empty/zero data, loading/error and denied scope. | DEFER_TO_R8 |
| [R71-FE-QLR-09](R8_FRONTEND_GAP_MATRIX.md) / QLR-09 | P3 | Only successful receipts scoped to cinema/date; ticket/food/discount/paid totals SQL-derived; no false revenue from pending/failed. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-qlr-09); E376, E435 | Chưa browser date filtering, numeric totals, empty/retry/foreign cinema and zero rows. | DEFER_TO_R8 |
| [R71-FE-CSKH-01](R8_FRONTEND_GAP_MATRIX.md) / CSKH-01 | P3 | Login200 current CSKH identity/grants; active-account recheck; route appropriate area. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-cskh-01); E013, E006, E007, E008, E009, E010, E011 | Chưa browser login CSKH→support, missingQL permission/forbidden, refresh session. | DEFER_TO_R8 |
| [R71-FE-CSKH-02](R8_FRONTEND_GAP_MATRIX.md) / CSKH-02 | P3 | Queue permitted complaints; design calls for status/priority filter; current supports status/type/search, priority sort only. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-cskh-02); E120, E121, E122, E123, E436 | Chưa browser queue/filter/empty/error/retry; priority filter contract discrepancy follows DB/BE decision, UI followup deferredR8. | DEFER_TO_R8 |
| [R71-FE-CSKH-03](R8_FRONTEND_GAP_MATRIX.md) / CSKH-03 | P3 | Read parent/customer/order IDs and full allowed processing history; missing404; no unrelated scope restrictions invented. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-cskh-03); E124, E125, E126, E127 | Chưa browser select/switch complaint, full timeline, notfound/retry, detail stale-response guard. | DEFER_TO_R8 |
| [R71-FE-CSKH-04](R8_FRONTEND_GAP_MATRIX.md) / CSKH-04 | P3 | Linked full referenced order+items+payments; unlinked order:null message; missingonegrant403 no leakage. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-cskh-04); E128, E129, E130, E131, E132 | Chưa browser linked/unlinked, each denied permission, switchingcomplaint and full monetary/payment reference. | DEFER_TO_R8 |
| [R71-FE-CSKH-05](R8_FRONTEND_GAP_MATRIX.md) / CSKH-05 | P3 | 201 appended processing and parentstatus; no overwrite oldevents; invalid/writefault complete rollback. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-cskh-05); E133, E134, E135, E150, E151 | Chưa browser append, validation/denied permissions, detail/queue refresh and timeline after retry. | DEFER_TO_R8 |
| [R71-FE-CSKH-06](R8_FRONTEND_GAP_MATRIX.md) / CSKH-06 | P3 | Status command appends auditprocessing, deterministic parentstatus independent manipulated timestamps; no partialwrite. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-cskh-06); E136, E137, E138, E150, E151 | Chưa browser status change, audit append, validation/permission denial and refreshed detail/queue. | DEFER_TO_R8 |
| [R71-FE-ADM-01](R8_FRONTEND_GAP_MATRIX.md) / ADM-01 | P3 | Login200 ADMIN/current grants; revoked grant affects operation despite old token. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-01); E014, E006, E007, E008, E009, E010, E011 | Chưa browser Admin login→portal, module access after permission removal, session reload. | DEFER_TO_R8 |
| [R71-FE-ADM-02](R8_FRONTEND_GAP_MATRIX.md) / ADM-02 | P3 | List/create user và status change readback; no arbitrary role/owner input, invalid/reference/duplicate không write. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-02); E152, E153, E154, E155, E156, E157, E158, E159, E160, E161, E437 | User create/status/list UI, duplicate/invalidrole, lockedaccount and reload. | DEFER_TO_R8 |
| [R71-FE-ADM-03](R8_FRONTEND_GAP_MATRIX.md) / ADM-03 | P3 | List/create/update/delete safe role; dependency conflicts keep references. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-03); E162, E163, E164, E165, E166, E167, E168, E169, E170, E171, E172 | Role CRUD form, usedrole delete conflict and list reload. | DEFER_TO_R8 |
| [R71-FE-ADM-04](R8_FRONTEND_GAP_MATRIX.md) / ADM-04 | P3 | List/create/update/delete allowedpermission; duplicate/dependency conflicts safe. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-04); E173, E174, E175, E176, E177, E178, E179, E180, E181, E182, E183, E184 | Permission CRUD, usedgrant delete conflict, missingpermission behavior. | DEFER_TO_R8 |
| [R71-FE-ADM-05](R8_FRONTEND_GAP_MATRIX.md) / ADM-05 | P3 | List current grants, set full list/empty atomically; stale token sees current permissions. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-05); E185, E186, E187, E188, E189 | Role grant editor load/set/explicitempty, invalidFK keeps grants, currentUI access update. | DEFER_TO_R8 |
| [R71-FE-ADM-06](R8_FRONTEND_GAP_MATRIX.md) / ADM-06 | P3 | Assignment read/create/update/revoke; Manager assigned scope immediately follows persisted date/status. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-06); E190, E191, E192, E193, E194, E195, E196, E197, E198, E199, E200 | Assignment create/update/revoke forms, manager/cinema validation, scope refresh. | DEFER_TO_R8 |
| [R71-FE-ADM-07](R8_FRONTEND_GAP_MATRIX.md) / ADM-07 | P3 | Cinema CRUD; image list/create/update/delete/setcover persists; invalidforeignimage does not mutate. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-07); E201, E202, E203, E204, E205, E206, E207, E208, E209, E210, E211, E212, E213, E214, E215, E216, E217, E218, E219, E220, E221, E222 | Cinema and image CRUD/setcover/reorder selection, orphan/foreignimage denial and empty images. | DEFER_TO_R8 |
| [R71-FE-ADM-08](R8_FRONTEND_GAP_MATRIX.md) / ADM-08 | P3 | Allsystem room/seat CRUD + safe history/delete; no Manager assignment needed for Admin. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-08); E223, E224, E225, E226, E227, E228, E229, E230, E231, E232, E233, E234, E235, E236, E237, E238, E239, E240, E241, E242, E353, E354, E355, E356, E357, E370, E371, E078, E421, E422, E423, E424 | Room/seat create/delete/history conflicts and SQL-backed edit; R32 controlled updates cover only a subset. | DEFER_TO_R8 |
| [R71-FE-ADM-09](R8_FRONTEND_GAP_MATRIX.md) / ADM-09 | P3 | Movie/actor CRUD, correctcast hydrate/set/clear; invalidgenre/cast leaves full old data. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-09); E243, E244, E245, E246, E247, E248, E249, E250, E251, E252, E253, E254, E255, E256, E257, E258, E259, E260, E261, E262, E263, E264, E327, E407, E408, E409, E410, E411, E412 | SQL-backed movie/actor CRUD/castsetclear, malformed/error/retry; R31 controlled editor covers cast UI only. | DEFER_TO_R8 |
| [R71-FE-ADM-10](R8_FRONTEND_GAP_MATRIX.md) / ADM-10 | P3 | Genre CRUD + duplicate/dependency safety. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-10); E265, E266, E267, E268, E269, E270, E271, E272, E273, E274, E275 | Genre CRUD and referenced deletion conflict, loading/empty/error. | DEFER_TO_R8 |
| [R71-FE-ADM-11](R8_FRONTEND_GAP_MATRIX.md) / ADM-11 | P3 | Product CRUD and activecatalog reflection; historical unitprice/amount unchanged. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-11); E276, E277, E278, E279, E280, E281, E282, E283, E284, E285, E373 | Product CRUD, invalidprice/useddelete, catalogrefresh/historicaldisplay. | DEFER_TO_R8 |
| [R71-FE-ADM-12](R8_FRONTEND_GAP_MATRIX.md) / ADM-12 | P3 | Promotion CRUD valid fields/time/quota; percent100 reject/no writes; booked discount snapshot unchanged. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-12); E286, E287, E288, E289, E290, E291, E292, E293, E294, E295, E296, E373 | Promo CRUD, dates/percent100/quota validation, deletion/reference, formerror/retry. | DEFER_TO_R8 |
| [R71-FE-ADM-13](R8_FRONTEND_GAP_MATRIX.md) / ADM-13 | P3 | List/create/update full pricing dimensions/range/surcharge/status, overlap409 readback; no holiday type. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-13); E297, E298, E299, E300, E301, E302, E303, E304, E305, E328, E329, E330, E397, E398, E399, E400, E401, E402, E403, E404, E405, E406 | R43 real browser update/hydration/NULLdate/overlap/retry; still missing create/list acrosscinemas and deniedgrant UI. | DEFER_TO_R8 |
| [R71-FE-ADM-14](R8_FRONTEND_GAP_MATRIX.md) / ADM-14 | P3 | Allsystem show list/create/update/cancel; no partialwrite/overlap, history preserved. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-14); E306, E307, E308, E309, E310, E311, E312, E313, E314, E315, E316, E317, E358, E359, E360, E361, E362, E363, E364, E365, E366, E101, E372, E413, E414, E415, E416 | R32 controlled edit; missing realSQL create/cancel/history/overlap and filter UI. | DEFER_TO_R8 |
| [R71-FE-ADM-15](R8_FRONTEND_GAP_MATRIX.md) / ADM-15 | P3 | Admin queue/detail/reference/process/status complete, safe linked/unlinked and correct timeline. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-15); E139, E140, E141, E142, E143, E144, E145, E146, E147, E148, E149, E150, E151, E318, E319, E320, E321, E322 | Admin complaint select/process/status then queue+detail refresh, linked/unlinked reference/deniedgrant; source already calls load+openComplaint after writes. | DEFER_TO_R8 |
| [R71-FE-ADM-16](R8_FRONTEND_GAP_MATRIX.md) / ADM-16 | P3 | System totals + cinema/movie/date breakdown reconcile, date/cinema filters/empty cases and grant403. | [Source + exact registry](USE_CASE_MATRIX_45.md#uc-adm-16); E323, E324, E325, E326, E331, E332, E333, E334, E335, E336, E337, E338, E339, E340, E341, E342, E343, E344, E345, E346, E347, E348, E349, E350, E351, E352 | Dashboard/revenue form, four numerical breakdowns, filters/empty/error, deniedgrant; no existing realreport browser. | DEFER_TO_R8 |

## J. Final conclusion

| Phase / acceptance | Trạng thái |
| --- | --- |
| R7.1 Baseline & Evidence Mapping | DONE; artifacts lịch sử giữ nguyên |
| R7.2 Use Case Regression & Gap Resolution | DONE;6gaps RESOLVED;approved fixes được nghiệm thu |
| R7.3 Final Verification & Acceptance | DONE;45-UC matrix FINAL cho verified DB/BE scope |
| PHASE R7 | DONE — DATABASE/BACKEND REGRESSION ACCEPTED |
| Database/Backend Acceptance | PASS trên canonical source và verified Test DB |
| Frontend Acceptance | DEFERRED_TO_R8; giữ đúng scope hai provisional PASS |
| Frontend verification | PENDING R8;2provisionalPASS/43PARTIAL |
| Main database deployment | PENDING hai procedure R7.2;chưa nghiệm thu deployed contracts |
| Readiness R8 | READY cho frontend stabilization trên verified compatible Test DB/current fixtures; dùng main cần hoàn tất deployment prerequisites |
| Final System Acceptance | Chưa thực hiện; không được suy từ R7 DONE |

**PHASE R7 = DONE — DATABASE/BACKEND REGRESSION ACCEPTED.**  
**FRONTEND VERIFICATION PENDING R8.**

Dừng tại R7.3. Quy trình Test DB hiện hành tại [current Test DB pipeline](../scripts/db/TEST_PIPELINE.md); acceptance/gates có JSON Pointer và hash tại acceptance.json.
