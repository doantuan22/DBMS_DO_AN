# Task 14 — R4.6 / I-20: Role-aware Profile Update

## 1. Scope

Chỉ I-20/R4.6. Baseline là working state cuối Task13 trên branch `tuan`, HEAD `8796e9b86f840e9f0ad56c843787fe9c4a08b737`, có Tasks9–13 chưa commit. Không reset/commit, không quy diff tích lũy cho Task14. Không R4.7, R5–R9, redesign Auth/Profile, cleanup dữ liệu, đổi schema hoặc framework.

## 2. Root cause I-20

SP cũ UPDATE `NGUOIDUNG`, sau đó chọn UPDATE/INSERT `HOSOKHACHHANG` theo EXISTS profile mà không đọc role. Mọi authenticated role có thể PUT/me; Staff thiếu profile sẽ INSERT dù optional fields NULL. [Before proof](r46/profile-before.json) chạy thật trên disposable DB, cả Manager/CSKH/Admin từ0→1 profile; cleanup đối chiếu toàn bộ dữ liệu/metadata PASS.

## 3. Audit before

[Audit](r46/audit-before.json) đóng băng main27 bảng,159 module, schema/role/constraints/signature/dependencies; [SHA baseline](r46/preserved-before.json) có1529 file. SP/Form/Audit trước sửa tại `r46/before-source/`. Backend/authController→validateProfile→authService→typed client đã bind đúng self identity và năm inputs; không sửa Backend production. [Frontend before](r46/frontend-before.json) chứng minh form cũ tự gửi date/gender của Staff có profile bất thường khi sửa tên, gây403 sau khi SQL enforce role. Đây là lý do trực tiếp cho sửa form tối thiểu.

```powershell
node scripts/r46/audit-before.mjs --database=CinemaBookingDB
node scripts/r46/profile-before.mjs --database=CinemaBookingDB_R0_R33_20261008_01
```

Hai lệnh trên đã chạy trước implementation; không chạy lại để ghi đè baseline. Test DB được xác nhận tồn tại, không mặc định tồn tại và không rebuild.

## 4. Schema và role model

Một account có một `VaiTroID NOT NULL` FK `VAITRO`. Codes: KHACH_HANG, QUAN_LY_RAP, CSKH, ADMIN. Không multi-role, không trạng thái active/inactive role. Custom role code hợp lệ theo schema được test bằng fixture `R46_CUSTOM`, common-only. Null/invalid role FK không thể tạo hợp lệ; thiếu account hoặc account không active bị từ chối.

HS profile PK/FK `NguoiDungID`, date/gender nullable, gender CHECK Nam/Nữ/Khác, points nonnegative default0; common fields whitelist chỉ HoTen/SoDienThoai. Main trước/sau có **0** hồ sơ non-Customer; không xóa hồ sơ thật hoặc sửa dữ liệu lịch sử.

## 5. SP before/after

Sửa đúng `sp_User_UpdateProfile`: locked current active user→VAITRO; Customer-only HS branch; Staff specific non-NULL→50301 trước common write. Giữ duplicate-phone50015, future-birth50400, five-parameter signature và `EXEC sp_User_GetCurrent` result. Reuse transaction ownership/savepoint conventions, rollback doomed hoặc savepoint committable. Không SP mới, schema/permissions mới, Backend SQL hoặc Backend transaction. [Diff độc lập Task14](r46/source-changes.patch).

## 6. Role behavior matrix

| Scenario | NGUOIDUNG | HOSOKHACHHANG |
|---|---|---|
| Active Customer existing | Common UPDATE | Specific UPDATE, points giữ nguyên |
| Active Customer missing | Common UPDATE | Valid INSERT, optional NULL, points0 |
| Manager/CSKH/Admin/custom role, optional NULL | Common UPDATE | Không ghi |
| Non-Customer abnormal existing profile, optional NULL | Common UPDATE | Không ghi/xóa |
| Non-Customer specific non-NULL |50301/FORBIDDEN trước ghi | Không ghi |
| Missing/locked/unactivated account |50300 direct SQL; live auth401 HTTP | Không ghi |

[Contract đầy đủ](../contracts/ROLE_AWARE_PROFILE_UPDATE.md): PUT omitted/blank/null→NULL; Staff NULL không xóa abnormal profile. SQL authoritative khi UI/authentication có role cũ.

## 7. Files changed và lý do

Ba file có sẵn thay đổi so với frozen Task13:

- `database/08_procedures/auth/sp_User_UpdateProfile.sql`: role authority, Customer-only HS branch và atomic transaction.
- `frontend/src/pages/auth/Profile.jsx`: guard đúng DOB/gender/points trên form hiện hữu và specific payload NULL cho Staff; lỗi tương thích được tái hiện trước sửa. Không đổi layout/theme/Auth flow.
- `docs/FULL_SYSTEM_AUDIT.md`: prepend nghiệm thu R4.6, giữ nguyên toàn bộ audit lịch sử.

File mới: Backend `roleAwareProfile.test.js` (8 tests); Frontend `role-aware-profile.test.js` (4 tests) và `r46-browser-fixture.jsx`; `database/11_tests/profile/update_rollback.sql` (temporary offline trigger); contract/report; `scripts/r46/{common,audit-before,fixtures,profile-before,deploy,profile-tests,browser,checks,main-check,final-checks}.mjs`; evidence `r46/`. Các runner tái sử dụng mssql/Vite/Chrome và tooling hiện hữu, không framework mới. Danh sách chính xác và SHA preservation trong [final gate](r46/final-checks.json).

## 8. Customer flows

Common name/phone, valid date/gender, NULL clearing, existing points23 preserved PASS. Missing profile INSERT optional NULL/points0; repeated calls không duplicate. API write/read-after-write current DTO PASS; current SQL Customer sau role switch vẫn tạo hợp lệ với identity-only JWT. Customer CHECK failure hoặc fault injection không làm mất giá trị cũ.

## 9. Staff flows

Manager/CSKH/Admin common update nhiều lần và concurrent Staff update không tạo HS. Mỗi role được dựng abnormal profile riêng trong test DB: common NULL không sửa DOB/gender/points; non-NULL specific bị50301, không partial common update. Temporary HS trigger không chạy với Staff common update. Chrome thực tế cho bốn role xác nhận Staff form common-only sửa thành công, anomaly preserved; Customer field edits vẫn hoạt động.

## 10. Atomicity

Real CHECK547 trên existing/missing HS và NameNULL515 rollback common write; duplicate50015 không ghi. Temporary AFTER INSERT/UPDATE trigger chỉ tác động own fixture theo session context hoặc email+name fixture; quan sát tên đã đổi trước THROW51046 để chứng minh lỗi bước thứ hai. Existing/missing profile cả direct SQL lẫn real HTTP rollback hai bảng; HTTP500 giữ convention `EREQUEST`/generic message, không lộ SQL details. Trigger luôn DROP trong finally, không deploy main.

Caller transaction: success giữ@@TRANCOUNT1 và caller rollback cả hai bảng; committable CHECK error rollback savepoint, giữ caller marker; doomed XACT_ABORT ON rollback toàn bộ, không transaction mở. Bốn race thật dùng hai connection độc lập: missing Customer, existing Customer, Staff common-only, role change. DMV xác nhận blocking session và LCK wait trước khi commit; cuối cùng không duplicate/partial profile, SQL đọc role mới sau block. [Race và rollback proof](r46/profile-tests.json).

## 11. Security/authorization

Identity vẫn `req.user.userId`, không targetID/role param mới. Body role/roleId/userId/NguoiDungID/permissions/status/email/password/points bị400, toàn27 bảng/metadata không đổi. Extra direct SP role parameter bị8144/8145. Missing/locked/unactivated directSQL50300; HTTP live auth401. Invalid/missing JWT401. Customer→Staff giữa authenticate và actual typed service bị403 trước ghi; Staff→Customer SQL current role cho phép đúng Customer branch. Wrapper offline chỉ chèn role change của own fixture rồi gọi service thật, không thay SQL response hoặc mock PASS. JWT/RBAC/rate limiter source nguyên byte.

## 12. SQL Server integration results

```powershell
node scripts/r46/deploy.mjs --database=CinemaBookingDB_R0_R33_20261008_01 --apply
node scripts/r46/profile-tests.mjs --database=CinemaBookingDB_R0_R33_20261008_01
node scripts/r46/browser.mjs --database=CinemaBookingDB_R0_R33_20261008_01
```

**PASS**41 SQL/HTTP cases,38 HTTP requests,4 actual races; **PASS**16 actual Chrome checks. [Deployment](r46/test-deployment.json), [SQL/API proof](r46/profile-tests.json), [browser](r46/browser.json), clean-source logs [first](r46/profile-sql-http.txt)/[repeat](r46/profile-repeat.txt)/[Chrome](r46/profile-browser.txt). Các run có exit0; test repeat cùng behavior/count, fixtures cleanup và toàn27 bảng/all metadata restored.

| Required scenario | Actual evidence trong profile-tests.json |
|---|---|
|01–02 Customer existing common/specific | R4.6-01, R4.6-02 |
|03 missing Customer;16 repeated | R4.6-03/16 |
|04–09 Staff common/no profile;15 repeated | Ba case R4.6-4/5,6/7,8/9, mỗi case3 lần gọi; Staff race |
|10 role spoof | API whitelist + direct extra-param + current role switches |
|11 constraint INSERT;14 invalid field | R4.6-11/14 |
|12 second write failure | SQL/HTTP fault cases, caller/savepoint cases |
|13 missing user | R4.6-13 |
|17 valid custom role | R4.6-17 |
|18 abnormal Staff | Ba R4.6-18 cases, no-write trigger proof |
|19 concurrent Customer creation | R4.6-19 race observed LCK |
|20 unrelated preservation | Per-spoof full snapshot + final cleanup fingerprint |

## 13. Backend tests và clean reproducibility

```powershell
node scripts/r46/checks.mjs --database=CinemaBookingDB_R0_R33_20261008_01
# Runner tạo source-only staging, dùng Node npm-cli tương đương các lệnh:
cd backend
npm.cmd ci --no-audit --no-fund
node --test tests/roleAwareProfile.test.js
npm.cmd test
npm.cmd test
# Reverse file order + --test-concurrency=1: exact args trong backend-reverse.txt
```

Node24.21.0/npm11.19.0. **184/184 PASS** trong cả ba full runs,0 fail/skip/cancel/todo. **50/50 auth-focused** (8 new profile +42 existing auth). Signature/types, self identity, whitelist, Customer/Staff DTO, live reload, domain/native error contract tests đều PASS. Không skip/làm yếu test cũ. Clean staging không `.env`, node_modules/audit/evidence cũ; `npm ci`; Backend unit runs không audit artifact. Profile integration replay cũng không phụ thuộc before-source artifact; dữ liệu test được tạo deterministic từ versioned fixture SQL/scripts.

Logs: [install](r46/clean-npm-ci.txt), [focused](r46/auth-focused.txt), [full](r46/backend.txt), [repeat](r46/backend-repeat.txt), [reverse](r46/backend-reverse.txt), [17-check runner](r46/checks.json).

## 14. Regression

**Auth real SQL/HTTP14 cases52 requests PASS**: registration, bcrypt, JWT claims, live four-role permissions/assignments, status/rejection, rate threshold/expiry/short circuit. [Proof](r46/regression/r45/auth-tests.json), [log](r46/auth-sql-http.txt). **Historical108 SQL cases PASS**, gồm loyalty/paid monetary snapshot consumers, savepoint/rollback và immutable metadata; [proof](r46/regression/r32/sql-tests.json), [log](r46/r32-history.txt).

**Frontend62/62**, lint/build PASS: [tests](r46/frontend-test.txt), [lint](r46/frontend-lint.txt), [build](r46/frontend-build.txt). Không chạy lại browser/concurrency unrelated; toàn bộ Backend regression vẫn chạy. Vite bundle-size warning hiện hữu không thuộc I-20; không đổi dependencies.

## 15. No-SQL, contracts, DB verify

```powershell
node scripts/audit-no-sql.mjs
node scripts/db/contract-check.mjs
node scripts/db/run.mjs verify --database=CinemaBookingDB_R0_R33_20261008_01
```

Chạy trong isolated clean-source stage để không ghi đè evidence cũ. **No-SQL PASS**100 files,26 reviewed non-SQL matches: [log](r46/no-sql.txt). **Contract PASS**112 service methods120 captured calls/120 whitelist entries: [JSON](r46/backend-contract-check.json), [log](r46/procedure-contract.txt). **Full DB verify PASS**159 canonical/live module definitions, all parameter parity/constraints/schema verify: [log](r46/database-verify.txt), [detail](r46/verify-CinemaBookingDB_R0_R33_20261008_01.log).

## 16. Source/Database preservation và main deployment

Test DB all27 data/table fingerprints và metadata trước/sau cleanup giống nhau. Main test-isolation read-only trước deployment PASS, no test fixture writes: [proof](r46/main-test-isolation.json). Sau toàn bộ test PASS, đã dùng workflow backup hiện hữu được cho phép, không reset/reseed main:

```powershell
node scripts/r46/main-check.mjs --database=CinemaBookingDB --mode=isolation
node scripts/r46/deploy.mjs --database=CinemaBookingDB --apply
node scripts/r46/main-check.mjs --database=CinemaBookingDB --mode=readonly
node scripts/r46/final-checks.mjs
```

**Main deployment PASS**: COPY_ONLY/CHECKSUM backup + RESTORE VERIFYONLY trước ALTER. Chỉ `sp_User_UpdateProfile` thay đổi;27 tables/data, schema, keys/constraints, five-param signature, grants, roles/permissions/assignments và158 other modules preserved. Main đã re-verify159 source/live modules và all parameter parity; login+GETme+permissions bốn role PASS, full before/after readonly fingerprint identical, anomaly count0 không đổi. Không PUT fixture trên main. [Backup/deploy](r46/main-deployment.json), [main readonly](r46/main-readonly.json).

1526 original files ngoài ba file được phép giữ nguyên SHA; nguồn và evidence Tasks9–13/R0–R3.3 bảo toàn. [Final gate](r46/final-checks.json) kiểm tested-source hash, new-file allowlist, independent patch, git diff --check, syntax và evidence links. [Current audit](r46/current-audit-status.json) chỉ resolve I-20,45 UC grades và finding khác nguyên trạng.

## 17. Remaining limitations

Không cleanup hồ sơ non-Customer đã tồn tại (main quan sát0); không data migration. Custom role schema-valid common-only, không thử phá FK để tạo invalid role. Main đã deploy SP và read-only verification; destructive/negative/fault/concurrent fixtures chỉ chạy disposable DB. UI role guard phản ánh state hiện hành, SQL rechecks khi role thay đổi; stale UI có thể nhận403 đúng contract. R4.7/I-22 và broader UC acceptance không triển khai. Evidence từ before audit giữ nguyên lịch sử, không coi audit artifact là runtime/test-suite dependency.

## 18. Final status

**DONE — R4.6/I-20.** Audit trước sửa, role matrix, minimal SP/form fix, actual positive/negative SQL/API/races/atomic rollback/browser, full Backend clean/repeat/reverse, relevant Auth/history regression, DB verify/No-SQL/contracts, source/data preservation và safe main deployment/reverify đều PASS với commands/logs bên trên. Không commit source, không triển khai Task15.
