# Final System Re-Audit

## Quản lý đặt vé Admin / Manager — 11/10/2026

**Kết quả task:** đã triển khai repository và xác minh phạm vi đã được chủ dự án chấp thuận trên DB kiểm thử riêng. **Chưa triển khai migration vào Main.** Dừng ở task này; Phase 3 chưa được mở. Baseline mới **44 Use Case hoạt động**: Customer 14, Manager 10, CSKH 6, Admin 14; 3 RETIRED, tổng 47 ID truy vết. Thêm `QLR-10` và `ADM-18`; không thêm `ADM-17`. Các báo cáo R8.3 và fixed RBAC bên dưới là snapshot lịch sử, không phải nghiệm thu 44/44 mới.

### Nghiệp vụ đã triển khai

- Admin quản lý đơn toàn hệ; Manager chỉ trong các rạp được phân công còn hiệu lực. Role chính xác và quyền `DAT_VE` hiện có được kiểm tra ở API và SP. Ma trận cố định 4 role / 23 quyền / 40 mapping giữ nguyên; không thêm quyền, gán quyền hoặc đổi vai trò.
- Danh sách phân trang SQL, tìm theo mã đơn/vé, tên/email/SĐT Customer và phim; lọc trạng thái/rạp. Chi tiết gồm Customer, phim, show, rạp/phòng, ghế, loại vé, snapshot giá, hold, trạng thái, vé đã hủy, payment history và đồ ăn/khuyến mãi nếu có.
- Tạo chỉ cho tài khoản Customer có sẵn, đúng `KHACH_HANG`, đang hoạt động; selector tên/email/SĐT, không nhập ID. SP giữ lock Customer và các parent, scope, show bookability, đúng phòng/ghế và giữ/bán ghế; delegates `sp_Booking_Create` hiện hữu. Đơn luôn Chờ thanh toán, không có payment do nhân viên tạo.
- **Sửa đúng phạm vi được phê duyệt:** chỉ đổi ghế cùng show khi pending còn hold, chưa có bất kỳ payment attempt, không promotion/food/used. Retained ticket giữ ID/code/giá; vé bỏ lưu Đã hủy; vé mới lấy giá hiện tại và mã mới. Owner/show/hold không đổi. `expectedTicketIds` là optimistic concurrency guard, không phải quyền do client quyết định. SQL rechecks authoritative state và locks, transaction rollback khi lỗi.
- Hủy toàn bộ pending order theo quy tắc hiện có, nhả ghế, giữ order/ticket/payment history và xử lý quota khuyến mãi hiện hữu. Chặn used/in-flight/success/refunded payment. Paid/used chỉ xem, không xóa vật lý hoặc hoàn tiền tự nguyện. DELETE trả 405, không ghi dữ liệu.
- `/admin/bookings` và `/manager/bookings` dùng StaffShell, shared DataTable/FilterBar/FormField/Select/Button/StatusBadge/AsyncState/ConfirmDialog và SeatMap. Có named selectors, dirty confirmation, GET abort guards, immediate busy ref, loading/error/empty/denied/conflict/success. Giữ sáu nhóm Admin, legacy portal routes và palette trắng–xanh.

### File thay đổi

| Nhóm | File / phạm vi |
| --- | --- |
| Baseline, phân tích và roadmap | `README.md`, `Phân Tích _ Thiết Kế.md`, `docs/USE_CASE_MATRIX_45.md`, báo cáo này; ma trận 44 active / 47 ID, UC specification và ERD dependency/history; roadmap hiện hành nằm trong Blueprint §7.1/§10 |
| Thiết kế | `docs/UX_ARCHITECTURE_BLUEPRINT.md`, `docs/standards/FRONTEND_UIUX_DESIGN_STANDARDS.md`: route/menu, 17 Admin destinations (16 legacy + 1 module), workflow, component ownership, trạng thái và acceptance rules |
| DBMS mới | `database/08_procedures/staff_booking/sp_StaffBooking_{Authorize,LockShow,Customers,Options,List,Detail,Create,UpdateSeats,Cancel}.sql` — 9 SP; không sửa Customer SP/table/FK/seed |
| DBMS build/migration/verification | `database/build-objects.sql`, `13_migrations/r10_staff_booking.sql`, `baseline-manifest.json`, `12_verify/verify_objects.sql`, `12_verify/verify_procedures.sql`, `database/README.md` |
| SQL regression | `database/11_tests/staff_booking/regression.sql`, `11_tests/test-all.sql` |
| Backend | mới `backend/src/routes/staffBookingRoutes.js`, `services/staffBookingService.js`, `validators/staffBookingValidator.js`; cập nhật `routes/adminRoutes.js`, `routes/managerRoutes.js`, `db/procedures.js` |
| Frontend | mới `frontend/src/features/staff-bookings/StaffBookings.jsx`, `useBookingDraftGuard.js`, `staff-bookings.css`, `frontend/src/api/staffBookingApi.js`; cập nhật `layouts/StaffShell.jsx`, `routes/index.jsx`, `utils/authorization.js` |
| Tests / tooling | mới `backend/tests/staffBooking.test.js`, `frontend/tests/staffBookings.test.js`, `scripts/db/staff-booking-smoke.mjs`, `staff-booking-browser.mjs`; cập nhật `backend/tests/sqlErrorCoverage.test.js`, `scripts/db/contract-check.mjs` |

Canonical inventory: **27 bảng / 169 module** = **134 SP, 6 view, 21 function, 8 trigger**. Hai helper SP không có API/Backend whitelist; bảy nghiệp vụ gọi qua typed RPC. Không cài dependency hoặc UI framework.

### API module mới

Hai prefix `/api/admin/bookings` và `/api/manager/bookings` có cùng contract; actor lấy từ authenticated user, portal role cố định phía server, không nhận authority/price/payment fields từ body.

| Method / suffix | Input / output chính |
| --- | --- |
| GET `/` | search/status/cinemaId/page/pageSize; orders + total/page/pageSize; pageSize tối đa 100 |
| GET `/customers` | search 2–100 ký tự; top 50 active Customer tên/email/SĐT + total |
| GET `/options` | cinemaId/showtimeId/orderId khi sửa; scoped cinemas, top 200 bookable shows + total, seats/giá/trạng thái; own retained seats trả snapshot |
| GET `/:orderId` | authoritative detail/history + SQL `canEdit`/`canCancel` |
| POST `/` | customerId/showtimeId/seatIds; 201 orderId pending |
| PUT `/:orderId/seats` | seatIds/expectedTicketIds; authoritative updated detail/history |
| POST `/:orderId/cancel` | body trống; authoritative canceled detail/history |
| DELETE `/:orderId` | 405 HISTORY_PRESERVED; không gọi SP ghi |

### Kết quả kiểm thử thực tế

Target: **`CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2`**, SQL Server `DoanTuanIT`, seed day 2026-10-11. Preflight trước khi tạo; build/seed từ source, migration áp dụng lại trên target này. Main không dùng làm test target, không reset/seed/deploy Main.

| Kiểm tra | Kết quả |
| --- | --- |
| Backend tests | **198/198 PASS**, 0 failed/skipped, gồm validator/service/router/error coverage module mới |
| Frontend tests | **69/69 PASS**, 0 failed/skipped, gồm exact role/DAT_VE, SSR shell/filter/loading/menu và client portal whitelist |
| Frontend lint | **PASS**, không warning |
| Backend lint bằng Oxlint hiện có | Exit 0; **1 warning có sẵn** ở `backend/tests/adminPricing.test.js:30` (`endsOn` không dùng); không thêm warning |
| Backend syntax / build | `node --check` **106 file PASS**. Backend native ESM không có build/lint script; không ghi production build Backend PASS |
| Frontend production build | **PASS**, 114 module; JS 577.91 kB / gzip 167.85 kB, CSS 45.74 kB. Chunk >500 kB warning. Default dist bị EPERM khi Vite dọn assets; build được chạy ở output riêng rồi lưu dưới `.audit-output/staff-booking-production-build/` |
| Real HTTP / SQL | **79 checks PASS**: 4 role login; unauth/cross-role deny; list/lookup; missing/wrong-role/locked Customer; bad show/room/seat/dupe/status spoof; Admin và Manager create/edit/cancel; paid/in-flight refusal; 405 physical delete; foreign scope/no-leak; unchanged snapshots/hold/history |
| Concurrency | **PASS thực tế**: hai HTTP create cùng ghế → đúng một 201, một 409; hai edit cùng expected version → một 200, một ORDER_CHANGED. Customer payment sau edit lấy đúng total snapshot, payment thất bại rồi logical cancel giữ history |
| SQL approved-edit rules | **PASS**: đổi bảng giá trong rollback fixture; vé giữ giá/ID, vé bỏ giữ canceled row, vé mới current price, total đúng và owner/show/hold unchanged. Stale/missing/wrong-role Customer, role spoof, duplicate seats, expired hold, promotion/product order, used-ticket edit/cancel, failed/in-flight payment và foreign/expired Manager scope bị từ chối; closed show không tạo được |
| Canonical SQL regression | **PASS**: auth/public/booking/payment/orders/reviews/complaints/Manager/CSKH/Admin/reports, timezone/pricing/compensation, trigger/integrity/execute-only/fixed RBAC và staff booking. Fixtures SQL rollback |
| Source parity / DB verify | **PASS 169/169 module**; fixed RBAC exact catalog/matrix còn nguyên |
| DBMS-first audit | **PASS**, 69 runtime files, không raw business SQL Backend |
| SP contracts | **PASS**, 110 service methods / 118 captured calls, 0 missing source, problems=[]; stub binding check bổ sung cho real HTTP/SQL evidence |
| Real browser Edge | **32 checks PASS**, actual React/Vite → Express → SQL target trên cả Admin và Manager; create/edit/cancel, empty filter, named Customer, single mutation khi double-click, discard cancel retains draft, dialog focus/Tab excludes background/Escape, paid read-only deep link, Manager foreign detail denial, real competing-seat 409 retains draft, quay về module legacy đúng menu/hash, 0 Runtime exceptions |
| Responsive screenshots | **PASS 390/768/1280/1440/1920 px** cho cả hai portal, không document horizontal overflow; table/SeatMap cuộn nội bộ. 14 screenshots, có edited-history và conflict. Đã mở xem ảnh 390px/1440px |
| Toàn bộ 44 browser journeys / full WCAG audit | **NOT RUN**, không kế thừa PASS lịch sử. Không kiểm thử controlled out-of-order responses, tất cả permission-revocation race hoặc stress/load lớn |
| Diff whitespace | **PASS**; chỉ cảnh báo LF/CRLF từ Git |

Các lần thử đầu không được ghi PASS: build Test DB đầu lỗi khai báo table variable, đã sửa và build fresh V2; browser đầu cần headless Edge tắt sandbox renderer, một assertion Tab đã chỉnh để phản ánh native dialog cho phép focus browser chrome nhưng không background controls; legacy SQL smoke một lần đụng seat đang được fixture browser lỗi giữ, chạy lại đạt sau fixture hết hiệu lực. Không quy các lần lỗi này thành nghiệp vụ PASS chưa chạy lại.

Evidence ignored trên máy này: [HTTP results](../.audit-output/staff-booking-http-results.json), [browser results](../.audit-output/staff-booking-browser-results.json), [screenshots](../.audit-output/staff-booking-browser/), [Backend tests](../.audit-output/staff-booking-backend-final.log), [Frontend tests](../.audit-output/staff-booking-frontend-tests.log), [build](../.audit-output/staff-booking-build.log), [SQL regression run](../.audit-output/staff-booking-full-sql.log), [verify](../.audit-output/staff-booking-final-verify.log), [contracts](../.audit-output/staff-booking-contract.log), [DBMS-first](../.audit-output/staff-booking-dbms-first.log). Đây là local artifacts, không đưa profile/session token hoặc screenshot vào git.

### Regression risk, giới hạn và blocker

1. **Main chưa có r10 migration.** `database/README.md` yêu cầu deployment Main được phê duyệt rõ ràng và review target; task yêu cầu repository, không chỉ định deployment Main. Source routes cần 9 SP mới trên DB chạy ứng dụng. [r10_staff_booking.sql](../database/13_migrations/r10_staff_booking.sql) sẵn sàng review, không reset/reseed, yêu cầu fixed RBAC; target chưa có r9 cần áp dụng r9 trước. Chưa chứng minh upgrade Main bằng deployment thực tế.
2. **Hoàn tiền tự nguyện/hủy paid hoặc xóa riêng vé đã thanh toán không có quy tắc hiện hữu.** Phạm vi được duyệt giữ read-only; không dùng hủy show/bồi thường thay thế, không xóa lịch sử. Đây là giới hạn nghiệp vụ đã nêu, không bổ sung quy tắc suy đoán.
3. Lookup giới hạn 50 Customer/200 show, danh sách phân trang SQL. Chọn rạp/thu hẹp keyword khi bị cắt kết quả. Không thêm API lịch hay tìm show mới ngoài phạm vi.
4. Parent/show locks bảo vệ availability/pricing/payment và scope; booking/mutation trên cùng show có thể chờ nhau. Đã test tranh chấp thực tế, chưa benchmark tải lớn. CSV params do Backend typed arrays tạo, SQL kiểm tra lại; API không cho sửa owner/show/payment/giá/role.
5. DB đầu `CinemaBookingDB_R0_STAFF_BOOKING_20261011` build dang dở được giữ riêng; không reset/drop hoặc sử dụng làm evidence thành công. HTTP/browser histories chỉ ở V2. Không cleanup DB bằng xóa lịch sử nghiệp vụ.
6. Giữ production chunk warning và Backend lint warning có sẵn; không refactor bundling/pricing/portal khác. Frontend routes cũ vẫn giữ source; regression toàn bộ UI 44 UC thuộc nghiệm thu riêng, không tự mở Phase 3.

## Snapshot lịch sử — Fixed RBAC cleanup & implementation, trước module đặt vé

**Trạng thái:** đã triển khai source theo phạm vi task và kiểm thử trên database riêng; **chưa triển khai migration vào Main**, chưa nghiệm thu toàn bộ 42 hành trình UI. Kết quả R8.3 bên dưới là snapshot lịch sử, không phải verdict cho thay đổi này. Không chuyển Phase 3.

### Quyết định và thay đổi nghiệp vụ

- Baseline hiện hành: **42 Use Case hoạt động** (Customer 14, Manager 9, CSKH 6, Admin 13); `ADM-03`, `ADM-04`, `ADM-05` **RETIRED**. Giữ 45 ID và evidence lịch sử trong [Use Case Matrix](USE_CASE_MATRIX_45.md).
- Bốn vai trò cố định: Customer, Manager, CSKH, Admin. Vai trò chỉ xác định khi tạo tài khoản; không sửa sau đó. Customer tự đăng ký; Admin tạo Manager/CSKH/Admin theo nghiệp vụ hiện có. Seed giữ 4 vai trò, 23 quyền và 40 cặp Role–Permission, không xóa mã quyền lịch sử có dependency.
- Xóa menu/section/form/grant workflow và các service/whitelist ghi RBAC. Các URL ghi cũ trả `403 RBAC_FIXED` cho Admin đã xác thực; người chưa đăng nhập vẫn 401 và role khác bị 403. GET `/admin/roles` chỉ là lookup cho tạo tài khoản, yêu cầu `QL_NGUOIDUNG`; GET permission catalog/grants cũ không còn API route (404). Auth permission readers và enforcement giữ nguyên.
- Bảy SP ghi cũ giữ signature nhưng luôn `THROW 50405`; `db_executor` bị DENY EXECUTE rõ ràng. Trigger `TRG_NguoiDung_VaiTroBatBien` chặn thay đổi vai trò tài khoản (`50406`), kể cả cập nhật nhiều dòng. Không drop bảng, constraint hay SP. Đã đọc metadata Main: không có SQL module gọi bảy SP ghi bị retired; FK và các auth/read dependency được giữ.
- Admin phân công/chuyển rạp bằng selector tên Manager/email và tên rạp. Hiển thị các phân công đã lưu cùng ngày/trạng thái; Manager giữ cố định khi sửa một phân công. Chuyển rạp có xác nhận tên Manager, rạp cũ → mới trước khi gửi PUT. Scope, thời hạn và khả năng nhiều phân công vẫn do SQL hiện có kiểm tra. Không thay đổi nghiệp vụ module Admin khác, palette hoặc booking state.
- Backend tiếp tục gọi Stored Procedure; không đưa business SQL vào runtime Backend. Canonical inventory mới: **27 bảng / 160 module** (125 SP, 6 view, 21 function, 8 trigger).

### File đã sửa trong task

| Nhóm | File/phạm vi thay đổi |
| --- | --- |
| Thiết kế hiện hành | `docs/standards/FRONTEND_UIUX_DESIGN_STANDARDS.md`, `docs/UX_ARCHITECTURE_BLUEPRINT.md`: baseline 42, bỏ route/wireframe/grant acceptance cũ, giữ sáu nhóm Admin và đổi nhóm thành Tài khoản & phân công |
| Baseline/phân tích/roadmap | `README.md`, `Phân Tích _ Thiết Kế.md`, `docs/USE_CASE_MATRIX_45.md`: bốn role cố định, ba UC retired và mapping lịch sử; roadmap hiện hành dùng Blueprint §7.2 vì file roadmap độc lập không còn trong repo |
| Audit lịch sử | Báo cáo này; `docs/R8_FRONTEND_GAP_MATRIX.md`, `docs/audits/frontend-deep-audit/FRONTEND_DEEP_AUDIT_REPORT.md`, `docs/R7_3_FINAL_ACCEPTANCE_REPORT.md`, `docs/R8_3_FINAL_ACCEPTANCE_REPORT.md`, `docs/R8_3_REACCEPTANCE_REPORT.md`, `docs/MAIN_DATABASE_SYNC_REPORT.md`, `docs/PHASE_2_DESIGN_SYSTEM_REPORT.md`: ghi rõ quyết định mới thay thế yêu cầu RBAC CRUD/grants; giữ verdict lịch sử |
| Backend | `backend/src/routes/adminRoutes.js`, `controllers/adminController.js`, `services/adminService.js`, `validators/adminValidator.js`, `db/procedures.js` |
| DBMS | Bảy `sp_Admin_Role_*` / `sp_Admin_Permission_*` write SP và `sp_Admin_RolePermission_Set.sql`; `sp_Admin_Role_List.sql`, `sp_Admin_User_Create.sql`; trigger mới; `09_security/001_execute_role.sql`, `10_seed/seed_base/003_reference.sql` (comment, không đổi dữ liệu), `build-objects.sql`, `baseline-manifest.json`, generated verification và `12_verify/verify_database.sql` |
| Migration/SQL checks | `database/13_migrations/r9_fixed_rbac.sql`, `12_verify/verify_fixed_rbac.sql`, `11_tests/permissions/fixed_rbac.sql`, `11_tests/test-all.sql`, `database/README.md` |
| Frontend | `frontend/src/pages/AdminPortal.jsx`, `layouts/StaffShell.jsx`, `api/adminApi.js`, `utils/authorization.js`, `utils/adminForms.js`; mới `components/ManagerAssignmentFields.jsx`, `utils/managerAssignments.js` |
| Tests/tooling | `backend/tests/fixedRbac.test.js`, `adminService.test.js`, `r4Password.test.js`, `r5-contract.test.js`, `sqlErrorCoverage.test.js`; `frontend/tests/adminPortal.test.js`, `r3b-browser-fixtures.jsx`; `scripts/db/contract-check.mjs`, `scripts/db/generate-verification.mjs` (giữ fixed RBAC check khi regenerate), `scripts/db/fixed-rbac-smoke.mjs`, `backend/TESTING.md` |

Working tree đã có thay đổi Phase 2 trước task, gồm shell/shared UI và CSS. Các thay đổi đó được giữ; bảng trên chỉ mô tả phần fixed RBAC, không quy toàn bộ git diff cho task này. Không tạo tài liệu mới.

### Kết quả đã thực sự chạy

Test target: `CinemaBookingDB_R0_FIXED_RBAC_20261011`, SQL Server `DoanTuanIT`. Target được preflight trước khi tạo, build/seed từ canonical source; không reset hay seed Main. Migration được kiểm thử áp dụng lại trên DB này; chưa kiểm thử upgrade một bản Main cũ bằng deployment thực tế.

| Kiểm tra | Kết quả thực tế |
| --- | --- |
| Backend `npm --prefix backend test` | **194/194 PASS**, 0 failed/skipped |
| Frontend `npm --prefix frontend test` | **66/66 PASS**, 0 failed/skipped; có SSR selector theo tên, role create-only và menu retired |
| Frontend lint | **PASS**, không warning |
| Backend lint bằng Oxlint hiện có | Exit 0; **1 warning có sẵn**: `endsOn` chưa dùng ở `backend/tests/adminPricing.test.js:30` |
| Backend syntax | **PASS**, `node --check` cho 102 file JS source/test; package native ESM **không có build/lint script**, không ghi Backend production build PASS |
| Frontend production build | **PASS**, 98 module; JS 553.11 kB / gzip 161.14 kB; Vite cảnh báo chunk >500 kB |
| Real HTTP/SP/SQL smoke | **72/72 PASS**: bốn vai trò login/me; truy cập đúng portal và từ chối ba role khác; POST/PUT/PATCH/DELETE URL RBAC cũ bị từ chối; tạo account đúng quyền; từ chối Customer/role không tồn tại trong Admin create; chặn injection vào register/status; phân công và chuyển rạp |
| Manager scope | **PASS thực tế**: dùng JWT cũ, sau chuyển rạp API rạp cũ trả 403 và rạp mới trả 200; `/auth/me` phản ánh phân công mới |
| SQL fixed RBAC | **PASS**: exact seed/matrix; bảy SP trả 50405 và fingerprint các bảng RBAC không đổi; multi-row role update trả 50406, rollback; principal db_executor không được DML/execute SP retired |
| Canonical SQL regression | **PASS**, `node scripts/db/run.mjs test --database=...`: auth/public/booking/payment/customer/manager/support/admin/report smoke, integrity/trigger/pricing/compensation/execute-only checks và fixed RBAC checks |
| Canonical source parity/verify | **PASS**, 160/160 module, `node scripts/db/run.mjs verify --database=...` |
| DBMS-first audit | **PASS**, `scripts/audit-no-sql.mjs`: 66 runtime file |
| SP contract check | **PASS**, 103 service methods / 111 captured calls; 0 missing source, `problems=[]` |
| Diff whitespace | **PASS**, `git diff --check`; Git chỉ cảnh báo chuẩn hóa LF/CRLF |
| Browser confirmation/cancel và hành trình UI toàn bộ UC | **NOT RUN**; không gán PASS cho native confirm, responsive hay 42 UC end-to-end trong task này |

Evidence local được giữ trong ignored `.audit-output/`: [HTTP results](../.audit-output/fixed-rbac-http-results.json), [Backend tests](../.audit-output/fixed-rbac-backend-tests.log), [Frontend tests](../.audit-output/fixed-rbac-frontend-tests.log), [build](../.audit-output/fixed-rbac-build.log), [migration](../.audit-output/fixed-rbac-migration.log), [SQL assertions](../.audit-output/fixed-rbac-sql-tests.log), [SQL regression](../.audit-output/fixed-rbac-regression-sql.log), [source verify](../.audit-output/fixed-rbac-db-verify.log), [contracts](../.audit-output/fixed-rbac-contract-check.log). Raw evidence chỉ tồn tại trên máy kiểm thử, không nằm trong git.

### Regression risk và blocker triển khai

1. **Main chưa có migration.** Theo `database/README.md` §Build and test, Main chỉ được ghi khi có deployment được duyệt rõ ràng và review target. Task thực hiện trên repository và Test DB; Main chỉ đọc metadata. API source mới đã chặn write, nhưng SP trên Main cũ còn có thể ghi nếu gọi trực tiếp cho tới khi triển khai [r9_fixed_rbac.sql](../database/13_migrations/r9_fixed_rbac.sql). Đây là blocker cho tuyên bố đã triển khai đầy đủ vào Main. Migration không hardcode target, không reset/reseed, giữ dependency và transaction; dừng nếu catalog/matrix khác seed. Chưa tự triển khai Main.
2. Client cũ gọi API retired sẽ nhận 403/404 như trên. Permission codes lịch sử vẫn tồn tại để giữ fixed seed/dependency, không dùng chúng để mở UI CRUD/grants.
3. Không chạy browser journey mới; UI selectors/current-assignment có unit/SSR evidence và transfer nghiệp vụ có API/SQL evidence, nhưng native confirm/cancel còn cần kiểm tra trên browser. Không kế thừa PASS 45 UC cũ để kết luận 42 UC mới.
4. Backend build không có script; lint warning pricing test và Frontend chunk warning được ghi đúng kết quả. Không thêm dependency hay refactor pricing/bundle ngoài phạm vi.

## Snapshot lịch sử — system re-audit 10/10/2026

> **Quyết định RBAC cố định (11/10/2026):** 42 Use Case hoạt động: Customer 14, Manager 9, CSKH 6, Admin 13. `ADM-03`, `ADM-04`, `ADM-05` là **RETIRED**; giữ ID/evidence lịch sử trong ma trận 45 ID. Chỉ có Customer (`KHACH_HANG`), Manager (`QUAN_LY_RAP`), CSKH và Admin (`ADMIN`). Vai trò xác định khi tạo tài khoản và bất biến sau đó; danh mục quyền và Role–Permission bất biến đối với ứng dụng. Customer tự đăng ký; Admin chỉ tạo Manager/CSKH/Admin. Admin tiếp tục phân công/chuyển rạp cho Manager bằng selector tên, hiển thị phân công hiện tại và xác nhận chuyển rạp; giữ scope/thời hạn và khả năng nhiều phân công hiện có. Các verdict, wireframe, route và kế hoạch 45 UC/RBAC CRUD trong báo cáo này là lịch sử trước quyết định; yêu cầu triển khai ADM-03/04/05 và partial grant bị hủy. Nghiệm thu mới không kế thừa PASS lịch sử.


> **Ghi chú lưu trữ (10/10/2026):** Theo yêu cầu thu gọn `docs`, evidence, contracts, archive và tài liệu hỗ trợ đã được xóa khỏi workspace. Các nhãn case/selector trong báo cáo là tham chiếu lịch sử, không còn liên kết tới raw artifact. Kết quả và verdict được ghi trong báo cáo không thay đổi.


**Ngày kiểm tra:** 10/10/2026 (Asia/Saigon)  
**Phạm vi:** repository, architecture, database parity/safety, backend, frontend, regression và evidence cho baseline 45 Use Case.  
**Kết luận:** **SYSTEM RE-AUDIT PASS. R8.3 ACCEPTED — PHASE R8 DONE.**

## Baseline và kết luận

Baseline giữ nguyên: React, Node.js/Express, Microsoft SQL Server, 45 Use Case; ADM-17 ngoài phạm vi. Hệ thống vẫn DBMS-first và Stored-Procedure-Only. Tiền, trạng thái booking, quyền, phạm vi rạp, transaction và concurrency do SQL Server quyết định. Không thêm bảng, API nghiệp vụ mới, ORM hay query builder.

Không còn Critical hoặc High issue mở trong phạm vi re-audit. Hai lỗi ADM-07 từng làm R8.3 thất bại đã được sửa và kiểm tra lại bằng browser thật. R8.3 hiện **ACCEPTED** theo [formal re-acceptance report](R8_3_REACCEPTANCE_REPORT.md) và acceptance manifest tại thời điểm nghiệm thu. Báo cáo lịch sử [R8.3 acceptance checkpoint](R8_3_FINAL_ACCEPTANCE_REPORT.md) không bị sửa và vẫn ghi **44/45, PARTIAL** tại thời điểm trước hotfix.

## Use Case và Frontend gaps

Roll-up hiện tại dựa trên 44 bộ evidence còn hợp lệ từ regression trước và evidence mới cho ADM-07. Các case không bị thay đổi về behavior được tái sử dụng; đợt nghiệm thu này không chạy lại 44 browser journeys. ADM-07 được kiểm tra lại qua React AppRoutes, Express và SQL Server Test DB. Mỗi UC có status và selector trong acceptance manifest tại thời điểm nghiệm thu.

| Vai trò  |   Tổng |   PASS | PARTIAL | BROKEN | MISSING |
| -------- | -----: | -----: | ------: | -----: | ------: |
| Customer |     14 |     14 |       0 |      0 |       0 |
| Manager  |      9 |      9 |       0 |      0 |       0 |
| CSKH     |      6 |      6 |       0 |      0 |       0 |
| Admin    |     16 |     16 |       0 |      0 |       0 |
| **Tổng** | **45** | **45** |   **0** |  **0** |   **0** |

ADM-17 không nằm trong mẫu số. Trạng thái bảng Use Case và gap matrix được giữ nguyên như snapshot lịch sử R8.3; không sửa ngược kết luận của phase. Bốn issue I-11, I-15, I-19, I-21 giữ trạng thái đã được xác minh ở R8.3. Trong 43 Frontend gaps, 42 evidence RESOLVED được giữ lại và gap R71-FE-ADM-07 được nghiệm thu lại; tổng hợp hiện tại là **43/43 RESOLVED**.

ADM-07 có **19/19 browser checks PASS**: 7 `REAL_BROWSER_SQL` và 12 `CONTROLLED_TRANSPORT`. Các kiểm tra bao gồm chuyển A→B→A khi response đảo thứ tự, GET ảnh B trả 503, retry đúng API danh sách rạp/ảnh, mutation đang pending khi đổi rạp, ownership/authorization âm, double-submit, SQL no-write và phục hồi thao tác sau retry. Controlled Transport được phân loại riêng, không tính là SQL/browser mutation evidence. Raw run mới nằm ở ignored `.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/`; trạng thái bền vững ở acceptance manifest tại thời điểm nghiệm thu.

Evidence mới được giữ trong ignored `.audit-output/` theo yêu cầu; không chứa trong git và có trên máy kiểm thử:

- [Browser cases](../.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/browser-cases.json) — 19/19 PASS.
- [SQL assertions](../.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/sql-assertions.json) — các assertion SQL đều PASS.
- [Fixture cleanup](../.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/fixture-cleanup.json) — PASS.
- [Main DB preservation](../.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/main-preservation.json) — PASS, `mainWrites=0`.
- [Final read-only database audit](../.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/final-read-only-audit.json) — PASS.
- [Environment result](../.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/environment-result.json).
- [ADM-07 hotfix causes, fix and re-acceptance evidence](R8_3_REACCEPTANCE_REPORT.md).

Trace chi tiết hiện tại ở [Use Case Matrix](USE_CASE_MATRIX_45.md), [Frontend Gap Matrix](R8_FRONTEND_GAP_MATRIX.md), [R8.3 re-acceptance report](R8_3_REACCEPTANCE_REPORT.md) và acceptance manifest tại thời điểm nghiệm thu. R8.3 checkpoint cũ được giữ riêng làm lịch sử.

## Kiến trúc, Backend và bảo mật

Đường đi request được kiểm tra là React → REST route → middleware → controller → service → procedure client → stored procedure → SQL Server. `audit:no-sql` PASS trên 66 file Backend runtime; không thấy business SQL inline, ORM hoặc query builder. DB contract check PASS: 112 service methods, 120 captured calls, 0 missing contract và 0 problems. SQL procedure client tiếp tục bind tham số có kiểu và procedure name được whitelist.

Authentication, role/permission checks, ownership và Manager scope tiếp tục được bao phủ bởi backend tests và các browser/API/SQL evidence đã lưu từ các phase trước; hotfix thêm negative ownership và no-write checks trên browser thật. Không có API contract, RBAC rule hay Stored Procedure contract nào được đổi trong đợt này. Runtime secret scan không tìm thấy literal secret/password; cấu hình lấy JWT secret và DB password từ environment. Một lệnh console nằm trong centralized logger; không tìm thấy console debug rải trong runtime.

## Database và an toàn dữ liệu

Canonical SQL inventory vẫn có **27 tables / 159 modules**. Source-definition parity với isolated Test DB PASS cho cả 159 modules. Browser mutation chỉ kết nối `CinemaBookingDB_R0_R81_20261010_3d49fc44` trên `DESKTOP-E67DPCV`, `database_id=48`, GUID `33876608-D109-43B5-ACEC-0B84C2639A73`. Main DB preservation PASS với 0 write; fixture cleanup so khớp fingerprint trước/sau. Final read-only audit không phát hiện FK/CHECK không trusted hoặc disabled, trigger bị disable, transaction mở hay test runtime user còn sót.

Không chạy mutation trên `CinemaBookingDB`. Không thay đổi schema hoặc định nghĩa Stored Procedure. Các chỉnh sửa SQL chỉ reflow whitespace trong 19 FK, 14 CHECK và 5 stored procedure; token sequence, string literal và số batch `GO` được so sánh với HEAD và giữ nguyên.

## Repository cleanup và code quality

Inventory Markdown ở đợt cleanup trước có 129 file, sau đợt đó còn 75; đợt thu gọn report-only ngày 10/10/2026 giữ lại 7 báo cáo Markdown quan trọng. Phân loại 129 file gốc: 74 KEEP, 17 MERGE, 1 ARCHIVE và 37 DELETE. Năm báo cáo seed R5 được hợp nhất vào hướng dẫn Database/seed và test pipeline; bốn báo cáo R7.1/R7.2 được hợp nhất vào baseline, Use Case matrix và policy đã duyệt; tám báo cáo R8.1/R8.2/hotfix được hợp nhất vào báo cáo tái nghiệm thu, hai matrix và evidence manifest.

Đã xóa 37 Markdown lỗi thời hoặc trùng lặp, gồm báo cáo R6 trung gian, audit R0 cũ, bản tổng hợp/report draft và checkpoint R8.2. Đồng thời xóa 53 file không phải Markdown trong hai snapshot audit R0 đã retired (probe/report-generation helpers, logs và generated data) cùng 8 metadata/evidence draft trùng lặp của R6; hai JSON cần làm input lịch sử cho R11 khi đó được chuyển sang `scripts/r11/fixtures/` và khóa bằng SHA-256; thư mục harness phase sau đó được gỡ và helper concurrency còn dùng được gom vào `scripts/db/concurrency-support/`. Raw evidence R6/R7/R8 từng được giữ trong các run đã nghiệm thu tại thời điểm audit; artifacts trong `docs/evidence` đã bị xóa trong đợt thu gọn report-only theo yêu cầu.

Đã gỡ report/checker cũ phụ thuộc vào các deliverable bị hợp nhất. R6 Group C verifier kiểm tra acceptance, HTTP/SQL selectors, cleanup, parity và test status từ raw evidence; nó không còn đòi report draft hoặc khẳng định source lịch sử vẫn byte-identical sau các phase tiếp theo. Freeze của runner R6 Group C chỉ băm evidence cùng baseline/matrix/constraints hiện hành. R11 kiểm tra hash của hai fixture thực sự dùng; preservation helpers R12/R21 không còn đọc snapshot R0 đã loại bỏ. At audit time, canonical documents linked to the archive, acceptance report and database guide; after report-only cleanup, `docs` keeps only 7 important reports.. Generated run output nằm trong `.audit-output/` và được ignore chính xác, không dùng wildcard ignore che tài liệu hợp lệ.

README đã được cập nhật với cấu trúc, setup, lệnh test/format và quy tắc DBMS-first; root có cấu hình Prettier cùng `format`/`format:check`. `debug.log` cũ được chuyển nguyên nội dung vào `.audit-output/legacy/debug-2026-09-30.log`.

Git snapshot khi kết thúc: branch `tuan`, HEAD `98a542e`; working tree vẫn có 674 changed paths chưa commit, bao gồm các thay đổi triển khai/kiểm thử R6–R8 đã có từ trước và cleanup hiện tại. Không commit hoặc hoàn nguyên các thay đổi đó.

Prettier check bao phủ 553 file JS/JSX/CSS/HTML/MJS; 502 file source/test/script hiện có diff sau format và các chỉnh sửa hẹp liên quan. Các thay đổi behavior gồm fix stale/wrong-resource và retry lifecycle trong `CinemaImageManager`, cùng loại bỏ cập nhật generation không cần thiết trong cleanup của `MovieReviews`. Test harnesses chỉ được làm bền vững với SQL/JS multiline sau formatting; assertion nghiệp vụ không bị bỏ.

## Regression và quality gates

| Kiểm tra                               | Kết quả                                                            |
| -------------------------------------- | ------------------------------------------------------------------ |
| Backend tests                          | **192/192 PASS**                                                   |
| Frontend tests                         | **65/65 PASS**                                                     |
| Frontend lint                          | **PASS**, không warning                                            |
| Frontend production build              | **PASS**, 93 modules                                               |
| Prettier `format:check`                | **PASS**, toàn bộ matched files                                    |
| Backend no-SQL audit                   | **PASS**, 66 runtime files                                         |
| DB service contract check              | **PASS**, 112 methods / 120 calls                                  |
| SQL source parity                      | **PASS**, 159/159 modules                                          |
| ADM-07 browser regression              | **PASS**, 19/19 checks; 15 SQL assertions, 8 no-write fingerprints |
| Fixture cleanup / Main DB preservation | **PASS / PASS**, Main writes 0                                     |
| Documentation references               | **PASS**, current workspace keeps 7 report Markdown files; retained links checked with no broken links |
| Script integrity / whitespace           | **PASS**, 327 MJS + 4 Python files / `git diff --check`            |
| Historical R6 raw-evidence verifier     | **PASS**, 426 HTTP cases / 147 SQL groups / 609 requests           |

Các regression cũ về booking/payment, permission/ownership, Manager scope, complaint, CRUD, report, concurrency và KH-02/KH-03 được tái sử dụng theo evidence phase còn hiệu lực; không phát lại toàn bộ suite 45 Use Case. Build giữ cảnh báo Vite về một chunk 545.57 kB vượt ngưỡng 500 kB; build thành công và đây chưa phải lỗi runtime.

## Vấn đề còn lại và verdict

- **Critical:** 0. **High:** 0.
- Cảnh báo build chunk như trên; không có material defect mới được xác nhận.
- 44 browser journeys không chạy lại trong đợt này; evidence từng UC, cleanup, source freshness và artifact links được đối chiếu trước khi kế thừa. ADM-07 có 19 checks chạy mới. Báo cáo R8.3 lịch sử vẫn là 44/45 tại checkpoint của nó.
- **System re-audit: PASS (45/45 UC; 43/43 Frontend gaps).**
- **R8.3: ACCEPTED. PHASE R8: DONE.** Không chuyển phase tiếp theo.
