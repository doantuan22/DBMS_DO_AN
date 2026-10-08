# Task 12 — R4.4 / I-17: Business Rule Ownership & Preview Consistency

**Status: DONE.** Ngày kiểm chứng: 08/10/2026. Chỉ thực hiện I-17/R4.4, dừng trước Task 13/R4.5. [Final checks](r44/final-checks.json) và [audit hiện hành](r44/current-audit-status.json) là kết quả nghiệm thu; những báo cáo R0–R4.3 giữ nguyên lịch sử.

## 1. Root cause I-17

Audit cũ ghi nhận provisional subtotal JavaScript và constants 10/10/99 lặp giữa FE/BE/DB nhưng chưa có ownership contract và test chống drift. Roadmap R4.4 cho phép UX guards, HTTP fail-fast và provisional subtotal nếu SQL giữ quyền quyết định cuối cùng. Vì vậy duplication đang đúng không cần loại bỏ.

Một mismatch được tái hiện trước sửa trên Express/typed client/SQL Server thật: hai ghế giá DECIMAL `0.10` và một sản phẩm `0.10` cho tổng JS `0.30000000000000004`. Typed `sqlDecimal` từ chối hơn hai decimals, endpoint preview trả **400 INVALID_REQUEST** trước khi gọi promotion SP; chính booking SP nhận IDs/quantity lại tạo được đơn với ticket `0.20`, food `0.10`, discount `0.10`, final `0.20`. Đây là binary addition noise ở input preview, không phải sai formula SQL. [Reproduction trước sửa](r44/preview-before.json) chứa input, HTTP error, SQL booking và fingerprint cleanup.

## 2. Scope thực hiện

Chỉ normalize provisional subtotal về scale2 trước bind DECIMAL(18,2), lập ownership contract, thêm kiểm thử/evidence liên quan. Không sửa limits, pricing function, promotion formula/locking/consume, booking transaction, historical writer, payment lifecycle/expiry, SQL schema/module hoặc Frontend production. Không triển khai R4.5–R4.7, R5–R9 hoặc finding khác.

Tái sử dụng Node test runner, typed executor, R2.1/R3.2 fixtures, verification scripts và Chrome/CDP đã có. SQL fixture chỉ chạy trên disposable `CinemaBookingDB_R0_R33_20261008_01`; main `CinemaBookingDB` chỉ đọc fingerprint. Không thêm dependency/framework/config table.

## 3. Audit before và baseline

Branch `tuan`, HEAD `8796e9b86f840e9f0ad56c843787fe9c4a08b737`. Baseline Task 12 là **working tree kết thúc Task 11**, bao gồm các thay đổi Task 9–11 chưa commit, không phải HEAD cũ. [Preserved-before](r44/preserved-before.json) đóng băng SHA-256 của **1.420 file** trước chỉnh sửa. [Audit-before](r44/audit-before.json) chứa main data/metadata fingerprint, live parameters/CHECK, limits và parity toàn bộ **159 modules**.

Đã đọc roadmap R4.4, finding I-17, thiết kế KH-06, SQL Function/CHECK/SP booking–promotion–payment và pricing consumers, validators/typed decimal guard/response mapping, FE SeatMap/ProductPicker/BookingPreparation/PaymentPage, evidence và source R0–R4.3. Ownership matrix được lập trước sửa production. [Source trước sửa](r44/before-source/backend/src/services/bookingService.js) và [diff riêng Task 12](r44/source-changes.patch) tách khỏi diff Task 9–11.

## 4. Business Rule Ownership Matrix

Matrix đầy đủ mapping source/enforcement/error/classification nằm trong [BUSINESS_RULE_OWNERSHIP.md](../contracts/BUSINESS_RULE_OWNERSHIP.md), gồm 12 nhóm thực tế. Tóm tắt:

| Rule | Frontend | Backend | Authoritative Database |
| --- | --- | --- | --- |
| Max seats/order =10 | SeatMap UX guard | bookingValidator fail-fast | fn_GioiHanGheMoiDon + sp_Booking_Create,50026 |
| Max quantity/product =10 | ProductPicker,0=deselection | positive integer/range/duplicate input | fn_GioiHanSoLuongSanPham + SP SUM duplicate product lines,50027/50402 |
| Percent value ≤99 | Admin input/server errors | adminValidator,99 | CK_KHUYENMAI_PhanTram99/native547 + promotion SP |
| Eligibility/quota | Show preview/errors | SP orchestration, no local acceptance | SQL time/status/minimum/config/quota; locked revalidation/consume,50029 |
| Provisional subtotal | Preview label, IDs/qty only | DB prices sum at scale2 | DB provides prices/preview discount; never persisted as final |
| Final booking amount | Use returned booking.total | Map SQL output only | Pricing/promotion SP and monetary snapshots in booking transaction |
| Payment/historical money | Use stored order/payment values | Typed SP calls, no client money | Stored order/ticket/food/payment snapshots |

Adjacent verified limits are **3 active holds/customer** and **5-minute hold**; existing parity/flow unchanged. Maximum discount amount is a nullable nonnegative money field; it is separate from percent99. Existing all-type discount cap is99% of subtotal, truncated to scale2; percentage may first be capped by GiamToiDa. No invented total-food cap: two different products of10 units each remain valid.

## 5. Mismatches và implementation

**MISMATCH:** binary subtotal precision before typed preview binding; fixed in `backend/src/services/bookingService.js` with `provisionalSum`, then `Number(provisionalSum.toFixed(2))`. Input prices are already DB DECIMAL(18,2), quantities integer; normalization removes JS arithmetic noise at the existing scale. The typed guard continues rejecting out-of-range/invalid bindings. SQL still computes preview discount and independently recalculates all final amounts.

**MATCHED:** verified values/conditions, preview read-only, locked promotion revalidation, final response/payment/snapshots. No ownership violation found in the audited paths. No SQL calculation moved into JavaScript and no new API field/response structure. Regression tests include fractional subtotal/minimum equality, one-cent-above minimum and99% truncated cap, rather than only integer examples.

## 6. Legitimate duplications và shared constants decision

Giữ seat/food FE guards và BE validators, Admin percentage fail-fast, typed range checks và SQL Function/CHECK/SP. Duplicate seat/product input rejection at HTTP is request-shape validation; direct SQL independently counts distinct seats and sums duplicate product quantities. Both cannot bypass the business limit.

**Không tạo shared constants module.** Existing values already match, import surfaces are used by existing guards/tests, and consolidation would change correct modules without correcting the reproduced decimal problem. New parity tests assert verified10/10/99,3/5 across FE/BE/canonical/live SQL. JavaScript constants never replace SQL enforcement.

## 7. Files changed và lý do

Chỉ hai file đã tồn tại thay đổi so với frozen Task 11 baseline:

| File | Thay đổi / lý do |
| --- | --- |
| backend/src/services/bookingService.js | Normalize preview subtotal at scale2 before typed binding; createBooking/mapping/error handling preserved |
| docs/FULL_SYSTEM_AUDIT.md | Prepend Task 12 status/links; preserve historical audit content |

Các file mới:

| File / nhóm | Lý do |
| --- | --- |
| backend/tests/businessOwnership.test.js | Eight unit/contract tests: parity, boundary, fractional binding, untrusted fields and authoritative output |
| frontend/tests/business-ownership.test.js | Three UX/contract tests: seat/quantity boundaries, labels and final-money consumers |
| frontend/tests/r44-browser-fixture.jsx | Real React/API/SQL browser scenarios without mocked API |
| docs/contracts/BUSINESS_RULE_OWNERSHIP.md | Ownership matrix, verified limits, preview/final contract and minimal decision |
| docs/evidence/R4_BUSINESS_RULE_OWNERSHIP.md | This17-section report |
| scripts/r44/common.mjs | Reuse existing tooling with separate evidence directory |
| scripts/r44/audit-before.mjs | Freeze Task 11 source and read-only main audit |
| scripts/r44/preview-before.mjs | One-time pre-fix reproduction; not a post-fix PASS test |
| scripts/r44/ownership-tests.mjs | Real boundary/stale/changed-price/payment/history and no-write checks |
| scripts/r44/browser.mjs | Existing Chrome/CDP harness adapted to real Task 12 UI proof |
| scripts/r44/checks.mjs | Clean source-only npm install/repeat/reverse and relevant regressions |
| scripts/r44/main-check.mjs | Read-only main fingerprint/source parity after tests |
| scripts/r44/final-checks.mjs | Preserved-file/tested-source/scope/status/link gates and Task 12 diff |
| docs/evidence/r44/ | Actual JSON/logs/before-source/regression artifacts isolated from prior evidence |

No old artifacts removed. Final checks verify **1.418 original files** remain byte-identical, including pending Task 9–11 implementation/contracts/evidence and all database source. Added files are limited to the listed Task 12 paths.

## 8. Preview / authoritative verification

`POST /api/promotions/validate` remains preview-only: DB-derived provisionalSubtotal and SQL-derived discountAmount/isValid. Repeated successful previews preserve every table row and SQL metadata; no quota consumption, order, ticket or food writes. `POST /api/bookings` accepts only show/seat/product IDs, integer quantity and promotionCode; SQL rereads prices, validates current protected promotion and atomically consumes quota/writes snapshots.

Verified current invalid promotion returns **409 PROMOTION_NOT_AVAILABLE**, no partial order or silent full-price fallback, after paused status, exhausted quota or raised minimum. Spoofed total/price/discountAmount/provisionalSubtotal/isValid/remainingQuota are rejected; payment amount is not accepted from the request.

Actual changed-price example: preview subtotal90000, discount1000 → estimated89000. Then Admin adds5000 surcharge, changes product to12000 and discount to2000. Booking response/tables return ticket85000 + food12000 − discount2000 = **95000**; payment gets **95000** from stored order. After payment success, pricing/product/promotion edits leave ticket/food/order/payment snapshots exactly unchanged. [Integration evidence](r44/ownership-tests.json) includes both pre/post snapshot values.

## 9. SQL Server boundary tests

[Ownership tests](r44/ownership-tests.json): **37 cases PASS,61 actual HTTP requests**, plus direct SQL SP/CHECK calls. Expected10/10/99 and cent amounts are established from design/functions/schema and explicit fixture inputs, independently of implementation output.

| Required ID | Real scenario / result |
| --- | --- |
| R4.4-01 /02 |9/10 seats: direct SP and HTTP201, expected stored amounts/ticket count PASS |
| R4.4-03 |11 seats: SQL50026 and HTTP400 SEAT_LIMIT_EXCEEDED, all rows unchanged |
| R4.4-04 /05 |9/10 units of one product: direct SP and HTTP201 PASS |
| R4.4-06 |11 units: SQL50027/HTTP400; duplicate6+6 cannot bypass;10+10 distinct products allowed |
| R4.4-07 |PERCENT99 preview/booking PASS, positive remainder preserved |
| R4.4-08 |PERCENT100: DB CHECK547 and Admin HTTP400, no partial update |
| R4.4-09 /10 |Direct HTTP bypass and direct SP limit rejection included in03/06; all data/metadata unchanged |
| R4.4-11 /12 |Fractional valid preview subtotal0.30/discount0.10 at minimum equality; no writes or quota consumption |
| R4.4-13 /14 |Three stale-promotion variants reject in SQL/HTTP with50029/409 and no fallback/partial booking |
| R4.4-15 /16 |Old quote89000 differs from final95000; response agrees with current DB snapshots |
| R4.4-17 /18 |Payment95000 matches stored order; post-payment catalog/discount edits preserve historical amounts |

Additional fractional99% test proves subtotal0.30 gives discount0.29/final0.01 per existing SQL truncation; minimum0.31 rejects0.30. Tests explicitly distinguish percentage, monetary maximum and all-type99% cap. Fixture/session cleanup PASS; fingerprints for all27 tables/data and SQL metadata match before/after.

## 10. Backend tests và reproducibility

[Checks](r44/checks.json): **158/158 PASS** in normal, repeat and reverse-file-order runs, each fail/cancelled/skipped/todo=0. Includes eight new Task 12 tests. Node24.21.0/npm11.19.0, `npm ci --no-audit --no-fund` from package-lock, existing `node:test`; no assertion removed/weakened or test skipped.

Clean-source staging copies byte-identical current proposed source including pending Tasks9–11 into an independent temp directory. It starts without `.env`, node_modules, database/_audit or docs/evidence, removes inherited DB/JWT/Node/TZ settings for unit tests, installs dependencies, runs the suite twice then reverses all test files with concurrency1. Audit artifacts remain absent throughout all Backend runs; input hashes unchanged afterward. This is clean-checkout-equivalent verification of the **uncommitted proposed source**, not a claim that HEAD already includes it. Existing committed-HEAD clone verification at R4.1 is preserved.

Logs: [install](r44/clean-npm-ci.txt), [normal](r44/backend.txt), [repeat](r44/backend-repeat.txt), [reverse](r44/backend-reverse.txt). Clean setup remains documented in [backend/TESTING.md](../../backend/TESTING.md).

## 11. Frontend tests và browser

**56/56 Frontend tests PASS**, fail/skip=0; `npm ci`, lint and build PASS from the same clean-source stage. Three new ownership tests reuse existing Vite SSR helper and test actual guard utilities/contract consumers. Frontend production source, forms and layout unchanged.

[Real Chrome browser](r44/browser.json): **8 checks PASS**, using actual React BookingPreparation/PaymentPage against real Express/SQL, actual customer/admin login and an isolated browser profile. Verified provisional label, stale preview rejection/no success/no automatic full-price retry, explicit review, fresh preview DB prices, final booking amount replacing preview, IDs/qty-only booking payload, stored order amount on payment page and stored-order payment amount. Browser quote differs from later booking because product price changes between requests; actual final UI/payment is93000. No API mocks. Fixture/payment/profile cleanup and all data/metadata fingerprints PASS.

Logs: [Frontend tests](r44/frontend-test.txt), [lint](r44/frontend-lint.txt), [build](r44/frontend-build.txt), [browser execution](r44/ownership-browser.txt).

## 12. Real integration và commands

All commands below actually ran; aggregate logs record executable, arguments, cwd, start/end and exitCode. Pre-fix reproduction is historical and intentionally expects the old400; do not rerun it against the corrected service.

```powershell
# Before production edits; saved audit/reproduction evidence:
node scripts/r44/audit-before.mjs --database=CinemaBookingDB
node scripts/r44/preview-before.mjs --database=CinemaBookingDB_R0_R33_20261008_01

# Post-fix real disposable SQL/API/UI; also rerun in clean source staging:
node scripts/r44/ownership-tests.mjs --database=CinemaBookingDB_R0_R33_20261008_01
node scripts/r44/browser.mjs --database=CinemaBookingDB_R0_R33_20261008_01
node scripts/r44/checks.mjs --database=CinemaBookingDB_R0_R33_20261008_01

# After regression, main SELECT-only and source/scope gates:
node scripts/r44/main-check.mjs --database=CinemaBookingDB
node scripts/r44/final-checks.mjs
```

`checks.mjs` runs locked dependency installs, Backend `npm test` twice/reverse, Frontend `npm run test/lint/build`, new real integration/browser, and the existing commands in section13. On Windows it invokes Node's npm-cli.js to avoid npm.ps1 execution policy; equivalent interactive commands use `npm.cmd`. SQL credentials come from existing setup and are not stored in evidence. Disposable fixtures require a transaction-free test DB with existing accepted modules; scripts refuse main DB. Main audit/check scripts use SELECT only.

## 13. Fresh relevant regression

All fresh regression proofs are copied under **r44/regression/**; previous r21/r22/r32/r42/r43 evidence remains byte-identical.

| Command in clean-source stage | Actual result / evidence |
| --- | --- |
| node scripts/r21/api-tests.mjs --database=CinemaBookingDB_R0_R33_20261008_01 |16 cases/107 requests +2 same-seat/overlapping-seat HTTP races PASS; [booking](r44/regression/r21/api-tests.json) |
| node scripts/r22/sql-tests.mjs --database=CinemaBookingDB_R0_R33_20261008_01 |28 SQL cases +6 CHECK cases; consume rollback injection/committed positive PASS; [SQL](r44/regression/r22/sql-tests.json) |
| node scripts/r22/api-tests.mjs --database=CinemaBookingDB_R0_R33_20261008_01 |14 cases/54 requests +2 last-quota HTTP races PASS; [API](r44/regression/r22/api-tests.json) |
| node database/11_tests/concurrency/promotion-atomicity.mjs --database=CinemaBookingDB_R0_R33_20261008_01 |2 last-quota SQL races +12 Admin/booking races PASS; [concurrency](r44/regression/r22/promotion-concurrency.json) |
| node scripts/r32/sql-tests.mjs --database=CinemaBookingDB_R0_R33_20261008_01 |108 historical metadata/money cases PASS; [history](r44/regression/r32/sql-tests.json) |
| node scripts/r43/pricing-tests.mjs --database=CinemaBookingDB_R0_R33_20261008_01 |44 SQL +40 API cases/55 requests PASS; [pricing SQL](r44/regression/r43/sql-tests.json), [pricing API](r44/regression/r43/api-tests.json) |
| node scripts/r42/report-tests.mjs --database=CinemaBookingDB_R0_R33_20261008_01 |22 SQL +32 API cases/37 requests PASS; [report SQL](r44/regression/r42/sql-tests.json), [report API](r44/regression/r42/api-tests.json) |
| node scripts/db/contract-check.mjs |112 methods/120 captured calls,missingSource0,problems[] PASS; [contract](r44/procedure-contract.txt) |
| node scripts/db/run.mjs test --database=CinemaBookingDB_R0_R33_20261008_01 |Full canonical Database test runner PASS; [log](r44/database-tests.txt) |
| node scripts/db/run.mjs verify --database=CinemaBookingDB_R0_R33_20261008_01 |Full Database verify +159 source definitions parity PASS; [verify](r44/verify-CinemaBookingDB_R0_R33_20261008_01.json) |

These are relevant existing tests, not new dataset/rebuild pipelines. Entire disposable DB data/metadata equals its pre-regression fingerprint after the run, asserted by [checks.json](r44/checks.json).

## 14. No-SQL Backend audit

`node scripts/audit-no-sql.mjs`: **PASS**, scanned97 files,25 reviewed non-SQL keyword matches, `NO RAW BUSINESS SQL IN BACKEND = PASS`. [Fresh log](r44/no-sql.txt). SQL fixture statements belong solely to offline verification scripts and existing SQL test tooling; Backend runtime remains fixed-whitelist typed Stored Procedure calls. No production service imports fixture scripts or embeds SQL queries.

## 15. Scope compliance và main preservation

[Main-unchanged](r44/main-unchanged.json): SELECT-only comparison against frozen before snapshot passes for data in **27 tables and all SQL metadata**, including signatures, constraints, indexes, triggers, grants and memberships; **159 live modules match canonical source**. Changed SQL modules=[]; no deployment required. No main fixture or data write performed.

[Final checks](r44/final-checks.json) enforces only the exact provisional subtotal replacement in the existing production service, existing createBooking and money mapping unchanged; only audit header added;1.418 other original files unchanged. All tested source hashes match current working files. Task9–11 work/evidence preserved, git diff --check and new script syntax PASS. Only finding **I-17** changes to RESOLVED R4.4; all other finding rows and the **entire45-UC matrix** are unchanged. Historical tables mentioning I-17 are retained as dated audit history, not silently rewritten.

## 16. Remaining limitations

No unverified blocker or remaining demonstrated mismatch in audited I-17 paths. Evidence reflects the proposed uncommitted working tree and real local SQL Server/Chrome on08/10/2026; committing/deploying Backend is outside this turn. Static constants still need deliberate updates and parity-test changes if the approved business contract changes later.

Preview intentionally cannot guarantee later success or lock future prices/quota; booking revalidation determines final result. Frontend asynchronous state races, command/query expiry semantics, other findings and broader UC acceptance remain in their own phases. The existing Vite bundle-size warning (>500kB) remains, build exit0; no out-of-scope optimization. No claim of full monetary representability across the entire SQL DECIMAL range in JavaScript; this fix covers demonstrated binary noise at the established preview scale, while final calculation stays in SQL.

## 17. Final status

**DONE — Task12/R4.4/I-17 only.** Audit/matrix, verified limits/SQL enforcement, minimal preview mismatch fix, legitimate duplication decision, authoritative preview/booking/payment/history contract, boundary/no-write tests, real SQL/HTTP/browser, clean-source Backend repeat/reverse, Frontend, relevant regression/No-SQL/full DB verification and scope/preservation checks PASS. Dừng tại R4.4; không triển khai Task13/R4.5.
