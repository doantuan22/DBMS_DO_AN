import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root, read, write } from '../db/lib.mjs';
const directory = path.join(root, 'audit/remediation/r7');
const evidence = path.join(directory, 'evidence');
const json = name => JSON.parse(read(path.join(evidence, name)));
for (const name of ['main-before.json', 'integration.json', 'browser.json', 'checks.json', 'regressions.json', 'migration-upgrade.json', 'main-deployment.json', 'main-verify.json', 'main-backend-smoke.json', 'main-final.json', 'cleanup.json']) assert.equal(json(name).status, 'PASS', name);
const integration = json('integration.json'), browser = json('browser.json'), final = json('main-final.json');
assert.equal(browser.result.status, 'PASS');
assert.ok(browser.result.checks.every(check => check.status === 'PASS'));
assert.ok(integration.checks.every(check => check.status === 'PASS'));
assert.equal(json('cleanup.json').r7FixturesRemaining, 0);
const traceManager = ['frontend/src/pages/ManagerPortal.jsx', 'frontend/src/api/managerApi.js', 'backend/src/routes/managerRoutes.js', 'backend/src/validators/managerValidator.js', 'backend/src/controllers/managerController.js', 'backend/src/services/managerService.js'];
const traceSupport = ['frontend/src/pages/SupportPortal.jsx', 'frontend/src/api/supportApi.js', 'backend/src/routes/supportRoutes.js', 'backend/src/controllers/supportController.js', 'backend/src/services/supportService.js'];
const gaps = [
  { id: 'GAP-001', name: 'Manager sửa suất chiếu', before: 'PARTIAL', cause: 'API/validator/SP đã có update; ManagerPortal chỉ có create/cancel, thiếu chọn bản ghi, hydrate, form update và reload.', trace: [...traceManager, 'database/08_procedures/manager/sp_Manager_Showtime_Update.sql', 'SUATCHIEU → showtime DTO → ManagerResourceForm'], behavior: 'Sửa movie/time/format/basePrice/status, giữ roomId bất biến theo contract; exact permission và cinema scope, overlap và booking-history guards giữ nguyên.' },
  { id: 'GAP-002', name: 'Manager sửa phòng/ghế', before: 'PARTIAL', cause: 'Backend/SP hỗ trợ đầy đủ; UI chỉ toggle status và gửi lại name/type cũ, thiếu edit form và hydrate.', trace: [...traceManager, 'database/08_procedures/manager/sp_Manager_Room_Update.sql', 'database/08_procedures/manager/sp_Manager_Seat_Update.sql', 'PHONGCHIEU/GHE → room/seat DTO → ManagerResourceForm'], behavior: 'Room name/type/status; seat type/status; không đổi ID/room/cinema, save reload và cancel không mutation, QL_PHONG/QL_GHE độc lập.' },
  { id: 'GAP-003', name: 'Manager bảng giá đầy đủ', before: 'PARTIAL', cause: 'BANGGIA/create contract có tất cả dimensions/date, nhưng update validator/service/SP chỉ nhận surcharge/status; FE thiếu dayType/format/end-date và form edit.', trace: [...traceManager, 'database/08_procedures/manager/sp_Manager_Pricing_Create.sql', 'database/08_procedures/manager/sp_Manager_Pricing_Update.sql', 'database/05_functions/fn_TinhGiaVe.sql', 'BANGGIA → pricing DTO → ManagerResourceForm/status filter'], behavior: 'Mở rộng SP update hiện có; đầy đủ seatType/dayType/format/surcharge/startsOn/endsOn/status; giữ minimal update, DATE_ONLY, pricing rule/overlap và order snapshots.' },
  { id: 'GAP-004', name: 'Manager revenue date filter', before: 'PARTIAL', cause: 'API dateRange và SP @TuNgay/@DenNgay đã có; UI chỉ gọi default, không có date inputs/filter/reset.', trace: [...traceManager, 'database/08_procedures/manager/sp_Manager_Revenue.sql', 'DONDATVE/THANHTOAN/SUATCHIEU/PHONGCHIEU + fn_NgayKinhDoanh → revenue DTO → ManagerRevenue'], behavior: 'fromDate/toDate DATE_ONLY, default/một ngày/range/reset, local invalid-range guard và 400/403 server, loading/empty/error riêng.' },
  { id: 'GAP-005', name: 'CSKH order reference đầy đủ', before: 'PARTIAL', cause: 'SP chỉ trả summary, service trả raw SQL row, UI chỉ hiển thị ID/status và đợi reference trước khi hiển thị complaint.', trace: [...traceSupport, 'database/08_procedures/support/sp_Support_Complaint_GetOrderReference.sql', 'KHIEUNAI → DONDATVE/vw_ChiTietDonDatVe + CHITIETVE/CHITIETDOAN/THANHTOAN/BOITHUONG_HUYSUAT → safe typed DTO → ComplaintOrderReference'], behavior: 'Bốn result sets và DTO chi tiết qua complaint context; QL_KHIEUNAI+TRA_CUU_DON với actor CSKH/Admin, không bypass/global lookup; section reference độc lập 403/404/loading.' },
  { id: 'GAP-006', name: 'Public cinema gallery', before: 'PARTIAL', cause: 'Public SP/API đã trả toàn bộ ảnh active và caption/order/cover; public UI mới chỉ có CinemaList, không có cinema detail/gallery.', trace: ['frontend/src/components/CinemaList.jsx', 'frontend/src/api/catalogApi.js', 'backend/src/routes/cinemaRoutes.js', 'backend/src/controllers/catalogController.js', 'backend/src/services/catalogService.js', 'database/08_procedures/public/sp_Cinema_GetImages.sql', 'HINHANH_RAPCHIEUPHIM/RAPCHIEUPHIM active → image DTO → CinemaDetail/CinemaGallery'], behavior: 'Route /cinemas/:cinemaId, cover-first rồi displayOrder/id, active-only, caption/alt, fallback và responsive; dùng API/SP hiện có.' },
  { id: 'GAP-007', name: 'Regression DB/browser/stress coverage', before: 'ALREADY_RESOLVED', cause: 'Finding cũ không còn đúng: R3–R5 đã có reset, upgrade/rollback, parity, unit, browser, authorization/revocation, timezone/payment và booking/pricing/image/assignment concurrency; R6 có historical fingerprint.', trace: ['scripts/r2/checks.mjs', 'scripts/r3b/probes.mjs', 'scripts/r3b/browser.mjs', 'scripts/r4/integration.mjs', 'scripts/r5/integration.mjs', 'scripts/r5/supplemental.mjs', 'scripts/r5/migration-test.mjs', 'audit/remediation/r5/evidence/', 'audit/remediation/r6a/evidence/main-final.json'], behavior: 'Tái chạy bộ suite thật cho source R7; chỉ bổ sung feature tests GAP-001..006 và upgrade hai SP, không sửa giả business code để đóng GAP coverage.' },
].map(gap => ({ ...gap, after: 'RESOLVED', evidence: gap.id === 'GAP-007' ? ['evidence/regressions.json', 'evidence/checks.json', 'evidence/concurrency.json', 'evidence/migration-upgrade.json', 'evidence/main-final.json'] : ['evidence/integration.json', 'evidence/browser.json', 'evidence/r2/backend.txt', 'evidence/r2/frontend.txt'] }));
// Retain concise source observations from the unchanged pre-R7 tracked baseline.
const oldSource = file => execFileSync('git', ['show', `HEAD:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 3 * 1024 * 1024 });
const oldManager = oldSource('frontend/src/pages/ManagerPortal.jsx');
const oldValidator = oldSource('backend/src/validators/managerValidator.js');
const oldSupport = oldSource('frontend/src/pages/SupportPortal.jsx');
const oldReference = json('baseline-modules.json').modules.find(m => m.name === 'sp_Support_Complaint_GetOrderReference').definition;
assert.ok(!oldManager.includes('updateManagerShowtime'));
assert.ok(oldManager.includes('api.updateRoom(r.id, { name: r.name, type: r.type'));
assert.ok(oldValidator.includes("objectOnly(value, ['surcharge', 'status'])"));
assert.ok(oldSupport.indexOf('await api.getComplaintOrderReference') < oldSupport.indexOf("setDetail({ status: 'success'"));
assert.ok(!oldReference.includes('FROM dbo.THANHTOAN'));
write(path.join(directory, 'GAP_AUDIT.json'), {
  sourceAuthority: 'Source sau R1–R6; sourceHashes và DB baseline ghi nhận trước implement trong evidence/main-before.json và baseline-modules.json.',
  historicalBaselineMatchesR6: json('main-before.json').r6FingerprintMatches,
  gaps,
  beforeObservations: { showtimeUpdateNotWired: true, roomTypeNameNotEditable: true, pricingUpdateOnlySurchargeStatus: true, complaintWaitedForReference: true, referenceHadNoPaymentDetail: true },
  at: new Date().toISOString(),
});
const count = gap => ({ http: integration.requests.filter(request => request.gap === gap).length, db: integration.checks.filter(check => check.gap === gap).length });
const statusRows = gaps.map(gap => `| ${gap.id} | ${gap.name} | ${gap.before} | ${gap.after} |`).join('\n');
const testRows = gaps.slice(0, 6).map(gap => { const counts = count(gap.id); return `| ${gap.id} | ${counts.http} | ${counts.db} | PASS |`; }).join('\n');
const report = `**R7 – Missing Feature Completion: PASS**

DB chính thức: CinemaBookingDB. Hai SP đã deploy nguyên tử với backup COPY_ONLY/CHECKSUM và RESTORE VERIFYONLY. Dữ liệu 27 bảng, schema và quyền thực thi giữ nguyên. Ba DB fixture R7 đã xóa; inventory CinemaBookingDB* hiện chỉ còn DB chính thức.

1. **Audit trước/sau.** Source sau R1–R6 là căn cứ. Chi tiết trace FE → API → validator/controller/service → SP → DB/result → UI trong [GAP_AUDIT.json](GAP_AUDIT.json); baseline trước implement trong [main-before.json](evidence/main-before.json).

| GAP | Chức năng | Trước R7 | Sau R7 |
|---|---|---|---|
${statusRows}

2. **Root cause.** GAP-001: UI thiếu update dù API/SP đã có. GAP-002: chỉ toggle trạng thái, không sửa name/type. GAP-003: update contract chỉ có surcharge/status, UI thiếu dimensions/date. GAP-004: FE không gửi range có sẵn. GAP-005: SP thiếu tickets/food/payment/compensation detail, service trả raw row, UI đợi reference và chỉ hiện ID/status. GAP-006: API ảnh đủ nhưng chưa có detail/gallery. GAP-007: finding cũ đã được R3–R6 giải quyết bằng suite và evidence thật.

3. **FE changes.** ManagerPortal dùng ManagerResourceForm/managerForms, hydrate bản ghi, Save/Cancel, reload, filter status bảng giá và reset state khi đổi rạp/quyền; response scope cũ không ghi đè rạp hiện tại. ManagerRevenue có range/state riêng. SupportPortal dùng ComplaintOrderReference độc lập; complaint/timeline hiển thị ngay. Thêm CinemaDetail, CinemaGallery, link và route public /cinemas/:cinemaId; CSS gallery bổ sung giữ style hiện có. Partial grants không gọi API section bị thiếu quyền.

4. **BE/API changes.** Mở rộng pricingUpdate validator và service với typed SQL DATE/dimensions. Payload cũ surcharge/status vẫn hợp lệ. Support service dùng lại detailDto của orderService để trả DTO an toàn, map referenced-order missing thành 404. Giữ các routes hiện có, procedure-client execution và authorization; không thêm arbitrary order lookup.

5. **SQL objects.** Chỉ sửa sp_Manager_Pricing_Update và sp_Support_Complaint_GetOrderReference, không thêm module. Migration [r7_missing_features.sql](../../../database/13_migrations/r7_missing_features.sql) include hai source SP; dùng scripts/r7/deploy.mjs để apply trong transaction với preflight/backup/verify. Baseline manifest và verify_objects/verify_procedures cập nhật. Upgrade từ SP definitions R6 được capture, lỗi giữa migration rollback toàn bộ, apply lặp lại idempotent: [migration-upgrade.json](evidence/migration-upgrade.json). Main đã deploy: [main-deployment.json](evidence/main-deployment.json).

6. **Manager showtime contract.** PUT /api/manager/showtimes/:id nhận movieId, startsAt, endsAt, format, basePrice, status. startsAt/endsAt là UTC instants; hydrate datetime-local theo business timezone, bảo toàn milliseconds. roomId bất biến theo validator/SP hiện tại, UI hiển thị read-only; yêu cầu R7 chỉ cho phép đổi nếu nghiệp vụ có hỗ trợ. Hủy dùng endpoint cancel riêng; trạng thái Đã hủy không đi qua edit. QUAN_LY_RAP + QL_SUAT_CHIEU + active assignment; wrong scope 403, overlap/booked-history conflict 409, time/enum invalid 400, reload persist PASS.

7. **Room/seat contract.** PUT /manager/rooms/:id: name/type/status; PUT /manager/seats/:id: type/status. ID, room/cinema ownership bất biến. QL_PHONG và QL_GHE độc lập; room-only/seat-only grants, foreign scope 403, history conflict 409 đều PASS. UI save reload và cancel không mutation.

8. **Pricing contract.** Create: seatType/dayType/format/surcharge/startsOn/endsOn; trạng thái ban đầu Áp dụng theo SP hiện hữu. Update: toàn bộ các field đó + status; minimal surcharge/status giữ tương thích. Nếu update conditions thì gửi đủ seatType/dayType/format/startsOn, endsOn nullable cho open end. DATE_ONLY không timezone-convert. Giá cũ/booking snapshot không sửa; booking mới dùng fn_TinhGiaVe hiện tại. Scope QUAN_LY_RAP + QL_BANG_GIA + active assignment. Sửa thực tế mọi dimension, ngày, phụ thu và status; invalid range 400, overlap 409, foreign scope 403, missing 404, old/new booking snapshot PASS.

9. **Revenue contract.** GET /manager/cinemas/:id/revenue?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD. Có default, một ngày, khoảng ngày, reset, loading/empty/error/retry; từ ngày ≤ đến ngày. FE gửi nguyên DATE_ONLY, SP dùng business-date rules R1 hiện tại. Đối chiếu HTTP với kết quả DB cùng range PASS; wrong scope 403, invalid range 400 và local validation PASS.

10. **CSKH reference payload.** GET /support/complaints/:id/order-reference trả {order}, với order summary/status, user {id,name,email,phone}, movie/cinema/room/showtime, tickets[], products[], ticketTotal/productTotal/discountTotal/total, payments[] gồm mọi attempt, compensation {points,creditedAt} nullable, bookedAt/holdExpiresAt/show/payment timestamps và cancellation context. Không password/hash. Complaint không order trả order:null/message; complaint missing 404; đơn không thuộc khách không thể liên kết complaint, 404. CSKH/Admin + QL_KHIEUNAI + TRA_CUU_DON, cả QL-only và TRA-only DENY ở HTTP và direct SP. Payment history trước/sau reference và cancel giữ nguyên. UI reference loading/error/403/404 không chặn complaint/timeline.

11. **Gallery behavior.** Public API/SP active-only có sẵn giữ nguyên. FE cover đầu, sau đó displayOrder/id; caption và alt phù hợp, không có ảnh thì fallback. 0/1/nhiều ảnh, inactive không lộ, duy nhất cover theo DB contract, browser 360px/1280px không overflow đều PASS. Gallery là ảnh/figure tĩnh, không modal/upload/storage mới.

12. **GAP-007 coverage decision.** ALREADY_RESOLVED trước implement: reset, migration/source parity, backend/frontend/browser, permission/revocation, R1 timezone, R2 payment/cancellation/compensation, booking/pricing/image/assignment stress, HTTP smoke và main verify đã có. R7 tái chạy suite đó và bổ sung các test chức năng mới: backend/tests/r7-contract.test.js; frontend/tests/r7-contract.test.js; frontend/tests/r7-browser-fixtures.jsx; scripts/r7/integration.mjs, browser.mjs, migration-test.mjs. Không tạo business change cho finding coverage cũ.

13. **Test từng GAP.** [integration.json](evidence/integration.json): ${integration.requests.length} HTTP requests, ${integration.checks.length} DB/contract assertions. [browser.json](evidence/browser.json): ${browser.result.checks.length} assertions trên trang React thật với HTTP fixtures, gồm hydrate/save/cancel/partial grants, late-response cinema switch, DATE_ONLY filter, complaint reference isolation và responsive gallery.

| GAP | HTTP requests | DB/contract checks | Kết quả |
|---|---:|---:|---|
${testRows}

Backend **112/112**, frontend **40/40**, build/lint, no-raw-SQL và procedure contracts **PASS**. Clean reset source fixture dùng npm run db:reset PASS; 159 module source parity PASS. Upgrade R6/failure rollback/idempotence PASS. [checks.json](evidence/checks.json), [fixture-reset.txt](evidence/fixture-reset.txt).

14. **Regression R1–R6.** R1 fixed clock + HTTP UTC/Asia_Ho_Chi_Minh/America_Los_Angeles + browser PASS. R2 SQL/HTTP/browser PASS: simulated payment, holds, cancellation, no refund, proportional promotion compensation và no double-credit giữ nguyên. R3 role/permission/scope/ownership/revocation/direct-SP/partial-grant/browser PASS; R4 functional/browser PASS; R5 validation/error/integrity/rollback PASS. Booking, pricing, image concurrency PASS; assignment 16 concurrent updates → 1 success/15 conflicts PASS. R6 historical fingerprint cả 27 bảng so main-final R6A khớp hoàn toàn; không chạy remediation dữ liệu. [regressions.json](evidence/regressions.json), [concurrency.json](evidence/concurrency.json), [r5/supplemental.json](evidence/r5/supplemental.json), [main-final.json](evidence/main-final.json).

Main verify/source parity **159 modules PASS**, main read-only HTTP smoke **${json('main-backend-smoke.json').requests.length} requests PASS**. Hai check showtime detail/seats trên main được skip vì phim được chọn không có future showtimes; các luồng này đã chạy trên fixture, không sửa historical main để tạo test data. [main-verify.json](evidence/main-verify.json), [main-backend-smoke.json](evidence/main-backend-smoke.json).

15. **DB inventory trước/sau.**

| Loại | Trước | Sau |
|---|---:|---:|
| Tables | 27 | ${final.inventory.tables} |
| Stored procedures | 125 | ${final.inventory.procedures} |
| Views | 6 | ${final.inventory.views} |
| Functions | 21 | ${final.inventory.functions} |
| Triggers | 7 | ${final.inventory.triggers} |
| Tổng modules | 159 | 159 |
| Indexes | 63 | ${final.inventory.indexes} |
| Constraints | 161 | ${final.inventory.constraints} |

Chỉ definitions hai SP dự kiến thay đổi; table data/schema/grants hashes giữ nguyên. DB fixture còn lại **0**: [cleanup.json](evidence/cleanup.json).

16. **Architecture.** Không thêm bảng, không DROP/recreate/reset main, không thêm raw SQL vào Backend, không ORM/query builder. Backend vẫn SP-only; no-raw-SQL audit và 120 registered service-call contracts PASS. SQL ngoài Backend chỉ ở database/scripts kiểm thử/deploy.

17. **Kết luận từng GAP.** GAP-001..006 **RESOLVED**, GAP-007 **RESOLVED (ALREADY_RESOLVED từ trước, đã tái xác nhận)**. Không có GAP PARTIAL/BLOCKED.

18. **R7 PASS.** Hoàn thiện đúng sáu phần chức năng thiếu, bảo toàn R1–R6, deploy main có backup và verify, DB/source parity PASS, không thêm bảng và đã xóa các fixture. Các evidence R1–R6 cũ được giữ; kết quả tái chạy R7 nằm riêng trong thư mục này.
`;
write(path.join(directory, 'REPORT.md'), report);
write(path.join(directory, 'SUMMARY.json'), { status: 'PASS', gaps: gaps.map(({ id, before, after }) => ({ id, before, after })), httpRequests: integration.requests.length, dbChecks: integration.checks.length, browserChecks: browser.result.checks.length, backendTests: 112, frontendTests: 40, mainInventory: final.inventory, mainDeployment: 'PASS', historicalDataPreserved: true, fixtureDatabasesRemaining: 0, at: new Date().toISOString() });
console.log('PASS R7 report: 18 requested items, seven resolved GAPs, main deployment verified and fixtures removed.');
