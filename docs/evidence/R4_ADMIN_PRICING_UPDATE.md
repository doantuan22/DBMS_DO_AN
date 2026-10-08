# Task 11 — R4.3 / I-14: Admin Pricing Update

**Status: DONE.** Chỉ thực hiện R4.3. Evidence thực tế ngày 08/10/2026; không triển khai R4.4–R4.7 hoặc task tiếp theo. Kết quả tổng hợp có machine checks: [final-checks.json](r43/final-checks.json).

## 1. Scope

Hoàn thiện bảy-field Admin Pricing Update qua SP hiện hữu, validator, typed service và binding form hiện hữu. Tái sử dụng disposable `CinemaBookingDB_R0_R33_20261008_01`, fixtures R2.1/R3.2, test runner Node, DB verification và Chrome/CDP đã có. Không framework, dependency hoặc pipeline R5 mới.

## 2. Root cause I-14

Admin Create nhận seat/day/format/date; Manager Update đã hỗ trợ full condition group. Admin Update bị giới hạn surcharge/status tại **cả SP, validator, service và `adminForms.pricing.createOnly`**. Do đó field hợp lệ không có đường cập nhật từ form đến SQL, trái ADM-13. Không phải lỗi công thức giá hoặc trigger.

## 3. Audit before

Đã đối chiếu roadmap R4.3, finding I-14, thiết kế ADM-13/QLR-07, BANGGIA, ba SP thật, overlap trigger, fn_TinhGiaVe, dependencies, Backend route/controller/client/error mapping, Admin form hydration/payload/reload và consumers R3.2/R4.2. [audit-before.json](r43/audit-before.json) chứa signature live trước sửa, direct dependencies và fingerprint main; [before-source](r43/before-source/database/08_procedures/admin/usp_Admin_Pricing_Update.sql) giữ SP trước sửa.

BANGGIA giữ nguyên identity PK GiaID, FK RapID NO ACTION, types/nullability, defaults và CHECK. Chỉ NgayKetThuc nullable trong bảy thuộc tính. Enums/ngày/overlap được mô tả đúng schema trong [contract](../contracts/ADMIN_PRICING_UPDATE.md).

## 4. Admin Create / Update / Manager comparison

| Field | Admin Create | Admin Update trước | Manager Update | Admin Update sau |
| --- | --- | --- | --- | --- |
| LoaiGhe | Có | Không | Có | Có |
| LoaiNgay | Có | Không | Có | Có |
| DinhDang | Có | Không | Có | Có |
| PhuThu | Có | Có | Có | Có |
| NgayBatDau | Có | Không | Có | Có |
| NgayKetThuc | Optional/NULL | Không | Optional/NULL | Optional/NULL |
| TrangThai | SQL tạo Áp dụng | Có | Có | Có |

Manager giữ scope theo phân công rạp; Admin giữ global scope theo role/permission. Không đổi Manager/Create.

## 5. Files changed

| File | Lý do trực tiếp I-14 |
| --- | --- |
| database/08_procedures/admin/usp_Admin_Pricing_Update.sql | Append condition parameters/default flag; atomic full update |
| backend/src/validators/adminValidator.js | Whitelist full condition group; enum/date/null/range validation |
| backend/src/services/adminService.js | Bind nhóm mới bằng SQL types; giữ caller cũ |
| frontend/src/utils/adminForms.js | Chuyển năm condition fields từ createOnly sang shared fields; cinema create-only |
| database/baseline-manifest.json | Cập nhật đúng signature fixture cho một SP |
| database/12_verify/verify_procedures.sql | Cập nhật cùng expected signature; giữ nguyên assertion so sánh và compile |
| backend/tests/adminPricing.test.js | 11 focused validator/binding/error tests |
| frontend/tests/admin-pricing.test.js | 4 focused hydration/payload/null/day tests |
| frontend/tests/r43-browser-fixture.jsx | Actual form interaction qua HTTP/SQL thật |
| scripts/r43/*.mjs | Audit/deploy, targeted fixture sync, SQL/API/browser/regression/scope verification theo convention cũ |
| docs/contracts/ADMIN_PRICING_UPDATE.md | Contract trước/sau, defaults/NULL, error/response |
| docs/evidence/R4_ADMIN_PRICING_UPDATE.md, docs/evidence/r43/* | Kết quả thực tế, logs, fingerprints, backup/deploy |
| docs/FULL_SYSTEM_AUDIT.md | Thêm trạng thái riêng I-14; giữ nội dung audit lịch sử |

Diff riêng Task 11 so với working state cuối Task 10: [source-changes.patch](r43/source-changes.patch). Không gộp thay đổi R4.1/R4.2 đã có vào kết quả Task 11. Chưa tạo commit; source/test/doc hiện nằm trong working tree để review.

## 6. Stored Procedure contract

Trước: bốn parameters ActorID/GiaID/PhuThu/TrangThai. Sau: giữ nguyên bốn parameters đầu; append LoaiGhe/LoaiNgay/DinhDang NVARCHAR(50), NgayBatDau/NgayKetThuc DATE default NULL, CapNhatDieuKien BIT default 0. Flag 0 giữ điều kiện cũ; flag 1 yêu cầu nhóm đầy đủ, end nullable. Một UPDATE giữ RapID/GiaID. Transaction/savepoint và row lock theo convention Manager; missing row vẫn 50210, surcharge/range 50209.

[signature-fixture-update.json](r43/signature-fixture-update.json) và final checks chứng minh chỉ signature SP này đổi; tất cả parameter rows khác và verification body/assertions được giữ nguyên. Không regenerate toàn baseline/schema.

## 7. Validator / Service / Form

Payload cũ surcharge/status hợp lệ và không bind parameters mới. Bất kỳ condition field nào kích hoạt nhóm đầy đủ seatType/dayType/format/startsOn; omitted hoặc NULL endsOn = open end trong nhóm đó. Incomplete group bị reject, không âm thầm set NULL vào cột bắt buộc. SQL flag không nằm trong body whitelist.

Service chỉ gọi `ADMIN_PRICING_UPDATE` qua typed client, types đúng live sys.parameters; không query, SQL động, Backend transaction hoặc JS overlap. Route PUT, RBAC, resource ID, raw-column DTO và domain mappings giữ nguyên. Form chỉ sửa định nghĩa fields: hydrate hiện có, explicit NULL khi end trống, reload/error/retry đã hoạt động. Chrome kiểm tra toàn bộ luồng thật.

## 8. Overlap / Atomicity

Giữ nguyên `TRG_BangGia_KiemTraChongLan` và mọi CHECK/FK. Direct SQL và HTTP đều reject conflict seat/day/format/start/end, inclusive boundary và simultaneous dimensions. Adjacent non-overlap và no-op active rule PASS. Lỗi trả HTTP 409 PRICING_OVERLAP và giữ toàn bộ pricing rows/monetary state.

Một transient AFTER UPDATE fault trigger **chỉ trên disposable DB** xác nhận inserted đã nhận surcharge mới trước khi RAISERROR. SP rollback toàn thao tác; SQL/API đều đọc lại row cũ, session không còn transaction. Trigger fault được drop; original metadata fingerprint khớp. Không disable/bypass trigger hoặc constraint thật. Caller-owned transaction và savepoint failure cũng PASS.

## 9. Historical integrity

Canonical booking thật: hai VIP tickets **95.000/vé**, food **10.000**, discount **1.000**, successful receipt/revenue **199.000**. Sau full Admin PUT (format 2D, surcharge 45.000, nhóm dates/conditions): current fn_TinhGiaVe = **125.000/vé**, nhưng CHITIETVE.GiaVe, CHITIETDOAN.DonGia, DONDATVE monetary totals/discount, THANHTOAN.SoTien và bốn revenue groups giữ nguyên. [sql-tests.json](r43/sql-tests.json), [api-tests.json](r43/api-tests.json) lưu trước/sau và actual oracle.

## 10. Database test results

Lệnh: `node scripts/r43/pricing-tests.mjs --database=CinemaBookingDB_R0_R33_20261008_01`.

**PASS 44 SQL cases**, bao gồm toàn bộ R4.3-01…20: từng bảy field, all fields, overlap/non-overlap, invalid enums/day/date/surcharge, missing ID, role/permission, omitted/null, fault rollback, paid history, no-op và Admin/Manager parity. Additional NULL-required, legacy SQL flag, caller transaction/savepoint, Manager scope đều PASS. Actual log: [admin-pricing.txt](r43/admin-pricing.txt); full results: [sql-tests.json](r43/sql-tests.json).

Fixtures được cleanup và toàn bộ 27 data/metadata fingerprints khớp trước/sau. Identity counters có thể tăng do fixture/rollback, không reseed; không coi sequence allocation là monetary/business row change.

## 11. Backend / Frontend test results

Lệnh aggregate: `node scripts/r43/checks.mjs --database=CinemaBookingDB_R0_R33_20261008_01`.

Source-only staging lấy **current working source + proposed changes**, byte-identical, không copy .env/node_modules/database/_audit/docs evidence. `npm ci` từ lockfile, Backend unit chạy không DB/JWT env, **150/150 PASS ở cả ba lượt**: normal, repeat, reversed file order/concurrency 1; 0 fail/skip/cancel/todo. Đây là clean source của proposed changes, không tuyên bố HEAD đã chứa các file chưa commit.

Frontend clean `npm ci`, **53/53 tests PASS**, lint/build PASS. Counts đọc từ test runner, không hardcode count Task 10. [checks.json](r43/checks.json), [backend.txt](r43/backend.txt), [backend-repeat.txt](r43/backend-repeat.txt), [backend-reverse.txt](r43/backend-reverse.txt), [frontend-test.txt](r43/frontend-test.txt), [frontend-build.txt](r43/frontend-build.txt).

## 12. Real integration / RBAC / Browser

**40 API cases / 55 real HTTP requests PASS**, actual Express → typed client → SQL Server. Admin positive/read-after-write, five dimension/date conflicts, full/legacy/open-end edits, invalid whitelist/date/enum/amount, missing ID, unauthenticated, Manager/CSKH/Customer denied, live revoked QL_BANG_GIA and paid history PASS. Manager full/partial API + readback và direct SQL scope cũng PASS. [api-tests.json](r43/api-tests.json).

Lệnh browser: `node scripts/r43/browser.mjs --database=CinemaBookingDB_R0_R33_20261008_01`. **10 checks PASS** bằng dedicated headless Chrome, actual AdminPortal → Vite proxy → real Backend/SQL, không mock HTTP: hydrate đủ fields, immutable cinema, day dropdown, exact payload, persisted reload, explicit NULL, conflict/error/editability và valid retry. [browser.json](r43/browser.json), [admin-pricing-browser.txt](r43/admin-pricing-browser.txt).

## 13. Regression / Safe deployment

Aggregate checks PASS existing pricing/Manager/auth suites; R3.3 complaints, R3.2 historical money/metadata, R3.1 cast atomicity, R2.2 promotions, R2.1 operational, R1.1 room delete, R1.2 showtime, R4.2 report financial SQL/API. Fresh old-suite results nằm ở [regression](r43/regression/r42/sql-tests.json), không ghi đè evidence đã chấp nhận. Existing DB constraints/triggers/smoke và verify PASS; source parity **159 modules**, procedure contract/no-SQL audit PASS. [no-sql.txt](r43/no-sql.txt), [procedure-contract.txt](r43/procedure-contract.txt), [database-tests.txt](r43/database-tests.txt), [database-verify.txt](r43/database-verify.txt).

Test deploy chỉ đổi Admin Pricing SP: [test-deployment.json](r43/test-deployment.json). Main isolation so audit-before fingerprint PASS: [main-test-isolation.json](r43/main-test-isolation.json). Theo workflow đã cho phép, main backup COPY_ONLY/CHECKSUM và RESTORE VERIFYONLY PASS trước atomic ALTER. Chỉ một module `usp_Admin_Pricing_Update` đổi, **158 module khác, dữ liệu 27 bảng, schema/constraints/security và signature ngoài SP này giữ nguyên**. [main-deployment.json](r43/main-deployment.json) ghi vị trí backup server.

Reverify main: `node scripts/r43/main-check.mjs --database=CinemaBookingDB --mode=readonly`: actual authenticated GET pricing 200, tất cả sys.parameters khớp versioned fixture, all 159 modules khớp canonical source, data/metadata fingerprint không đổi. [main-readonly.json](r43/main-readonly.json). Không chạy destructive fixture hoặc pricing write trên main. Rollback: transaction ALTER tự rollback nếu verification fail; sau commit có before-source SP để ALTER khôi phục signature/definition và verified backup để recovery theo workflow. Không reset/reseed/drop main.

## 14. Scope compliance

[final-checks.json](r43/final-checks.json) kiểm tra SHA-256 mọi original file: chỉ bảy existing files nêu trên thay đổi; toàn bộ prior evidence/files R0–R4.2 còn nguyên. New files chỉ nằm ở focused tests, contract, scripts/evidence r43. Không đổi BANGGIA/schema/trigger/fn_TinhGiaVe/Manager/Create/booking/payment/promotion/auth/route/controller hoặc UX/layout. Không thêm persistent DB objects, enum hoặc business rule. Không skip/weaken tests. Chỉ I-14 được resolved ở [current-audit-status.json](r43/current-audit-status.json), mọi finding khác và 45 UC grades giữ nguyên; ADM-13 full acceptance vẫn PARTIAL, pricing contract có evidence PASS riêng.

## 15. Remaining limitations / Verification corrections

Các finding khác vẫn ngoài scope. Main verification là source/signature/read-only; toàn bộ write/negative/fault/browser tests chạy trên disposable SQL Server thật. Unit bindings dùng mock hợp lệ và không được tính thành DB evidence. Windows hiện có SQL Server và Chrome; môi trường khác cần cung cấp SQL Server phù hợp và Chrome (`R43_CHROME_PATH` nếu khác default). `npm.cmd` dùng trên PowerShell có execution policy chặn npm.ps1; không thay đổi policy/dependencies.

Trong xây dựng test mới đã gặp mismatch thứ tự keys binding/list TenRap, No-SQL scanner nhận nhầm JavaScript delete, timestamp cấp quyền bị default khi restore fixture, và Unicode bị mất khi tạo browser SQL qua Windows pipeline. Đã sửa **test/setup**, giữ assertions về đủ fields/all-row fingerprints/no-SQL. Disposable cleanup recovery chỉ commit khi toàn bộ original fingerprints khớp: [fixture-cleanup-recovery.json](r43/fixture-cleanup-recovery.json), [browser-setup-recovery.json](r43/browser-setup-recovery.json). Main không bị ghi dữ liệu bởi các thử nghiệm. Toàn bộ final source regression đã chạy lại sau correction và PASS.

Reproduce: cài Backend/Frontend bằng lockfile, cấu hình SQL qua existing .env/process env, dùng disposable prefix được tooling guard, deploy SP `node scripts/r43/deploy.mjs --database=<disposable> --apply`, rồi chạy checks. Không cần missing audit artifact; versioned expected signature đã đồng bộ. `audit-before.mjs`/`sync-signature.mjs` là chứng cứ migration một lần, không cần chạy lại để test source hiện tại.

## 16. Final status

**DONE — R4.3 / I-14.** Đủ audit, bảy fields, compatible/null semantics, typed bindings/form, SQL enforcement/atomicity/history, real SQL/API/RBAC/browser, clean-source full regression, safe main deployment/reverify và scope checks. Dừng tại R4.3; không triển khai Task 12.
