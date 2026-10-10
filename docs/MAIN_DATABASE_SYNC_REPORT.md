# Main Database Sync — R7.2 Approved Procedures

> **Ghi chú lưu trữ (10/10/2026):** Theo yêu cầu thu gọn `docs`, evidence, contracts, archive và tài liệu hỗ trợ đã được xóa khỏi workspace. Các nhãn case/selector trong báo cáo là tham chiếu lịch sử, không còn liên kết tới raw artifact. Kết quả và verdict được ghi trong báo cáo không thay đổi.


**MAIN DATABASE SYNC: DONE**  
**CinemaBookingDB: CANONICAL 159/159 VERIFIED**  
**DATA PRESERVATION: PASS**  
**FOLLOW-UP: R8.3 ACCEPTED — PHASE R8 DONE**

## A. Deployment Summary

| Hạng mục | Kết quả |
| --- | --- |
| Actual server / version | DESKTOP-E67DPCV / SQL Server17.0.1000.7 |
| Actual target | CinemaBookingDB, database_id19, GUID96F850EA-987F-41A1-9086-38F6597968C8 |
| Deployment ID | 2026-10-09T17-02-33-287770Z-8abb07d2 |
| Execution time | 2026-10-10 00:10:51.521–00:10:58.585, Asia/Saigon (UTC+7) |
| Commit | 2026-10-10 00:10:57.735, UTC+7; runner timestamp2026-10-09T17:10:57.735Z |
| Source version | HEAD9d68c6dbad0750de5ccb84eccbd6959dcf735845 + approved R7.2 working-tree changes, unchanged since R7.3 |
| Changed objects | dbo.sp_Admin_User_Create; dbo.sp_Support_Complaint_List |
| Transaction | COMMIT_TWO_PROCEDURES, atomic all-or-nothing |
| Final deployment | SUCCESS; MAIN_DB_DEPLOYMENT_PENDING → MAIN_DB_DEPLOYMENT_VERIFIED |
| Business data | 27/27 table fingerprints và identity counters không đổi |
| Backend | Fresh192/192 tests PASS; No-SQL PASS; typed contracts PASS;14 safe real service/SP main probes PASS |

Người dùng cấp quyền triển khai trực tiếp trong attachment “Deploy R7.2 Approved Stored Procedures to CinemaBookingDB — Direct Execution Authorized”. Đã thực thi deployment, không chỉ chuẩn bị script. Không đổi SQL source/backend/frontend/manifest, không seed/reset/rebuild/drop database, không sửa table/trigger/function/view/SP thứ ba, không thay đổi RBAC hoặc dữ liệu nghiệp vụ. Dừng tại Database Sync; chưa thực hiện R8.

Evidence chính: result.json, final-state.json. Scope, strategy và commands: [deployment plan](../database/deployments/r7-2-main/PLAN.md), [README](../database/deployments/r7-2-main/README.md).

## B. Preflight

Đọc [R7.3 acceptance](R7_3_FINAL_ACCEPTANCE_REPORT.md), approved policies, manifest, hai canonical source files và existing deployment/backup/verification tools. Kiểm tra Git working tree; 262 source/test hashes và toàn bộ artifact seal R7.3 vẫn khớp. Các R7.2 modifications đã có trước task được giữ nguyên; không có production source change mới làm acceptance stale. Không triển khai từ bốn embedded manifest snapshots cũ. Trạng thái frontend sau đó được chốt riêng tại [R8.3 re-acceptance](R8_3_REACCEPTANCE_REPORT.md).

Actual SQL connection dùng project configuration, không hardcode/ghi password. preflight.json và execution-preflight.json xác nhận:

- ServerName/MachineName DESKTOP-E67DPCV, version17.0.1000.7; actual database name/GUID đúng, ONLINE, writable.
- Có VIEW DEFINITION và ALTER trên đúng hai dbo procedures; existing object type P.
- Inventory27tables/125P/19FN+2IF/6V/7TR =159 modules. 157 definition khớp source; chỉ hai procedure trong scope còn khác.
- Object names/types/SET options và structural metadata phù hợp baseline; trước deploy thiếu optional priority parameter đúng dự kiến.
- Không active request/open user transaction trên main ở final gate. Không kill session hoặc terminate application. Request timeout30s, lock timeout5s; backup/VERIFYONLY timeout180s riêng.

**Backup readiness:** full COPY_ONLY/CHECKSUM backup tại SQL Server configured backup directory, tên unique, kiểm tra destination chưa tồn tại, không overwrite backup cũ. RESTORE VERIFYONLY WITH CHECKSUM và HEADERONLY PASS: đúng DatabaseName, IsCopyOnly, HasBackupChecksums; backup-set GUID2438BF12-8314-4FE7-A466-05FF4D65B050, size13722624bytes. Đây là kiểm tra backup có thể đọc/xác minh, không phải một lần restore rehearsal. File .bak nằm ngoài Git và chứa dữ liệu riêng tư; không đưa vào repository.

Agent không có quyền đọc trực tiếp file .bak qua filesystem do ACL thư mục backup của SQL Server; không tính SHA256 của toàn file hoặc thay đổi ACL. Kết quả backup PASS dựa trên RESTORE VERIFYONLY WITH CHECKSUM và HEADERONLY thực tế của SQL Server. Hai private rollback SQL files có thể đọc và kiểm tra SHA256 riêng.

backup.json có exact server backup path và private rollback directory. Hai original definitions được trích xuất đầy đủ thành SQL rollback riêng, kèm raw/normalized SHA256, signature/dependencies/metadata, database identity, source version, timestamp, deployment ID. Private SQL/metadata nằm ngoài repository tại OS temp directory, được tạo trước ALTER và không sửa sau đó. PARSEONLY kiểm tra syntax trên separate connection PASS; execution bị tắt trong bước này. Hai rollback files còn tồn tại và hash được xác minh trong quality check. Temp files cần lưu vào private archive nếu muốn giữ lâu dài; full backup nằm ở server backup directory.

Initial read-only diagnostic từng thấy `@@TRANCOUNT=0, XACT_STATE=1` khi lấy state cùng batch đọc metadata. Standalone XACT_STATE, session open_transaction_count và DMV đều xác nhận không có user transaction. Đã sửa **verification tooling mới** để sample standalone sau batch, không nới safety gate hoặc sửa production. preflight-diagnostic.json giữ observed values và resolution; chưa có DDL/DML ở thời điểm diagnostic này.

## C. Execution

| Object | Canonical source SHA256 | Applied / accepted |
| --- | --- | --- |
| dbo.sp_Admin_User_Create | 5a892a1b8f880d0b2f34e02846a27aca29605cb84c98272e019330ac036d14c9 | APPLIED_IN_TRANSACTION → COMMITTED → definition parity PASS |
| dbo.sp_Support_Complaint_List | 588c2b11d5b0db9bf97abc3ba0157dfdfe50432895442e58088e23a480c500af | APPLIED_IN_TRANSACTION → COMMITTED → definition parity PASS |

[deploy.mjs](../database/deployments/r7-2-main/deploy.mjs) lấy nguyên canonical SQL files hiện hành, split GO đúng batch rules; SET ANSI_NULLS/QUOTED_IDENTIFIER trong batch riêng, CREATE OR ALTER PROCEDURE đầu batch DDL. Không tự viết lại business logic. Hai apply nằm trong cùng pinned mssql Transaction, SERIALIZABLE/XACT_ABORT ON. Bounded shared TABLOCK/HOLDLOCK reads trên 27 tables tạo baseline nhất quán và tạm chặn concurrent writes trong cửa sổ DDL; không dùng việc khác nhau do concurrent writes để kết luận mất dữ liệu.

Trước COMMIT, before-atomic.json và applied-before-commit.json chứng minh đúng hai definitions thay đổi, all159 source parity PASS, cùng27-table data/identity hashes, không object/schema ngoài scope thay đổi. Source seal được kiểm lại trước COMMIT. Commit cả hai lúc00:10:57.735 UTC+7; không partial deployment.

Rollback strategy đã chuẩn bị và parse-check, không cần thực thi trên successful run. Trước COMMIT có lỗi thì rollback transaction và so original fingerprints; nếu mandatory post-check lỗi sau COMMIT thì runner atomically restore chỉ hai saved definitions/SET options, so complete normalized original definitions/data/unrelated metadata. CREATE/ALTER spelling của SQL module header có thể khác khi restore; original raw backup bytes/hash vẫn giữ, normalized comparison bảo toàn SQL literals/logic. Nếu targeted restore lỗi thì stop writes/report actual state. Không tự restore toàn database hoặc sửa business rows để ép fingerprints.

## D. Post-deployment Verification

### Canonical parity và signature

Actual main **159/159 MATCH** trước COMMIT, sau COMMIT và final state. Không chỉ so tên/count. Cùng inventory27tables/125SP/21FN/6V/7TR; SQL definitions và SET options khớp effective source paths trong manifest.modules. Columns, parameters, keys, FK, CHECK, indexes, triggers, database permissions/memberships và các unrelated dependencies/objects/principals/schemas giữ đúng baseline. No disabled/untrusted FK/CHECK, no disabled trigger. 157 other modules nguyên definition; object inventory không thêm/xóa.

`sp_Support_Complaint_List` có parameter_id5 `@MucDoUuTien`, nvarchar, max_length100bytes =NVARCHAR(50), optional NULL được xác nhận từ canonical source và default runtime invocation. Bốn parameter trước giữ nguyên. Enum `Thấp`, `Trung bình`, `Cao`, `Khẩn cấp`; SQL AND priority/status/type/search predicate và QL_KHIEUNAI/current actor checks khớp accepted definition. SQL50405 → backend400 INVALID_PRIORITY được thực thi trên main. SQL metadata has_default_value không được dùng để suy default T-SQL.

`sp_Admin_User_Create` giữ signature6params, @VaiTroID INT; allowlist role codes QUAN_LY_RAP/CSKH/ADMIN authoritative trong SQL, không hardcode IDs. Không còn nhánh insert HOSOKHACHHANG trái policy. Current active Admin +QL_NGUOIDUNG và transaction/savepoint/rollback logic khớp canonical. Existing Customer role bị SQL50404 trước INSERT, service mapping403 ROLE_CREATE_FORBIDDEN; invalid actor SQL50300 cũng bị chặn trước DML.

### Data preservation và transaction cleanup

Tất cả27 tables có exact before/after row counts và SHA256 fingerprint giống nhau; kiểm tra trước/sau atomic DDL, sau COMMIT, trước/sau safe functional probes và final transaction release. `sys.identity_columns.last_value` không đổi: không có successful insert hoặc identity advance do hậu kiểm. Bảo toàn users/profile, order/ticket/seat/payment, complaints/history, pricing/promotion và mọi bảng khác. Metadata ngoài scope hai SP không đổi; chỉ expected procedure definition/modify_date/signature/dependency thay đổi. Không seed/reset, không disable constraints/triggers, không DML business data.

Post-check dùng một read-only verification transaction, XACT_ABORT OFF để expected-denial/savepoint probes giữ caller transaction committable. Sau probes transactionCount1/XACT_STATE1 đúng vì verification transaction còn mở; snapshot chứng minh data/metadata/identity không đổi. Sau explicit ROLLBACK read-only transaction, final @@TRANCOUNT0/XACT_STATE0, không active main request/open user transaction hoặc locks bất thường còn lại. postdeploy.json và final-state.json ghi từng state.

### Backend compatibility — mức chứng cứ

| Check | Evidence level / actual result |
| --- | --- |
| Backend regression | Fresh192/192 tests, fail/cancelled/skipped0; unit/contract tests, không main HTTP E2E |
| No-SQL architecture | Fresh audit PASS; không thêm ORM/inline business SQL |
| Typed contracts | Fresh PASS:112 service methods/120 captured calls/120 whitelist entries; signature mới phù hợp |
| Query validator/error contracts | Existing source seal +fresh tests:priority enum/optional NULL, NVARCHAR50,50405→400;50404→403,roleId INT |
| Main queue service runtime | 10 real calls:default và4 priorities cho existing Admin/CSKH, actual backend service → actual typed procedureClient → main SP |
| Main priority invalid | Actual SQL50405, service400 INVALID_PRIORITY |
| Main wrong role | Actual SQL50301 qua support service/gateway; không gọi đây là HTTP middleware SUPPORT_REQUIRED test |
| Main forbidden Customer create | Actual SQL50404, service403 ROLE_CREATE_FORBIDDEN; không user/profile/identity mutation |
| Main invalid actor | Actual direct SQL50300; không DML |
| Main HTTP/browser | NOT_RUN; không tuyên bố HTTP server/session/AppRoutes E2E PASS |

Tổng **14 safe main service/SP probes PASS**. Main hiện không có complaint rows:10 queue calls đều trả empty đúng persisted KHIEUNAI; chứng minh signature/default/valid enum/shared consumer invocation, **không tự tạo nonempty priority-filter oracle trên main**. Nonempty enum/AND filters, Customer/custom denial, allowed3role create, duplicate/FK/list/status/savepoint scenarios đã có raw SQL/HTTP evidence tại verified Test DB R7.2; [E436](USE_CASE_MATRIX_45.md#evidence-e436), [E437](USE_CASE_MATRIX_45.md#evidence-e437). Không tạo custom role/account thật, booking/payment/review/complaint fixture trên main để bổ sung PASS. Full159 main definition parity +fresh safe runtime/binding/error checks là cơ sở compatibility; broader mutation/browser evidence vẫn tách riêng.

## E. Evidence

Thư mục immutable run: `docs/evidence/main-db-deployment/runs/2026-10-09T17-02-33-287770Z-8abb07d2/`. Các file bên dưới lấy trực tiếp từ **CinemaBookingDB**, trừ backend unit/contract và Test DB evidence được ghi rõ:

| Artifact | Nội dung / selectors |
| --- | --- |
| preflight.json | `/identity`, `/activity`, `/state`, `/parity`:actual target và157match/2pending |
| execution-preflight.json | Final gate trước backup/ALTER |
| backup.json | `/fullBackup`, `/procedures/0`, `/procedures/1`:backup header/paths/hashes/parsecheck |
| before-atomic.json | `/fingerprints`, `/metadata`, `/session`:consistent pre-ALTER baseline |
| applied-before-commit.json | `/parity`, `/preservation`, `/state`:159match/data unchanged before COMMIT |
| postdeploy.json | `/functional/cases/0`–`/functional/cases/13`, `/functionalPreservation`:14 safe runtime cases/data unchanged |
| final-state.json | `/metadata/parameters`, `/fingerprints`, `/protections`, `/session`:actual final main state |
| backend-compatibility.json | Fresh test execution192/192,No-SQL,typed checks |
| backend-regression.log | TAP192pass/fail0/skipped0 |
| no-sql.log / backend-contract-check.json | Fresh architecture audit / typed inputs and whitelist |
| result.json | `/steps`, `/changedModules`, `/finalParity`, `/dataPreservation`, `/finalSession`, `/finalActivity`:SUCCESS/VERIFIED |
| quality.json | Evidence/tool/report hashes,paths/selectors,private backup existence/hashes,2243original-file preservation |

Rollback SQL files và full .bak nằm ngoài Git, không được copy vào evidence public. Fingerprints chỉ xuất counts/hashes; queue case JSON không xuất complaint contents/email/name hoặc bcrypt payload. Timestamps của runner dùng UTC/ISO; SQL backup header datetime là server-local clock được driver biểu diễn qua Date, không tự coi suffixZ của header là clock UTC thật.

## F. Outstanding Issues

- **Pending deployment:0** cho hai procedure; không module ngoài scope cần apply.
- Bốn embedded manifest definition snapshots cũ vẫn NONBLOCKING đúng phân loại R7.3; không sửa trong deployment. Effective source parity159/159 không dùng các snapshot này làm definition authority.
- Không main HTTP/browser E2E và không positive mutation suite trên main; queue data empty nên nonempty filtering oracle tái sử dụng verified Test DB. Không nâng FE/Overall vì deployment thành công.
- Original R6/R7 reports/matrix/evidence giữ nguyên như historical acceptance. Các chữ MAIN_DB_DEPLOYMENT_PENDING ở R7.3 phản ánh thời điểm trước deployment; **trạng thái hiện hành nằm ở báo cáo này và result.json**, không overwrite historical artifacts/seals.
- Expected SQL denials50405/50301/50404/50300 đã được đối chiếu; không có unexpected execution error/rollback failure. Preflight tooling diagnostic đã resolve trước DDL và vẫn được lưu.
- R8 cần current owned fixtures trên môi trường kiểm thử phù hợp cho browser stabilization; không seed main hoặc dùng synthetic transaction data trên main để phục vụ acceptance. R8/R9 chưa triển khai.

## G. Conclusion

| Acceptance | Final status |
| --- | --- |
| Deployment | SUCCESS — atomic COMMIT của đúng hai procedure |
| Canonical main parity | PASS — 159/159 normalized module definitions |
| Data preservation | PASS — 27tables/identity counters/unrelated metadata unchanged |
| Constraint/trigger protection | PASS — FK/CHECK trusted/enabled, no disabled trigger |
| Main DB sync | VERIFIED — MAIN_DB_DEPLOYMENT_VERIFIED |
| Backend compatibility | PASS — source seal/fresh192tests/No-SQL/typed contracts và14 main service/SP probes; HTTP/browser NOT_RUN |
| Transaction/session cleanup | PASS — final0/0 vàno other active user transaction/request |
| R8 readiness | READY FOR R8 FRONTEND STABILIZATION; không bắt đầu R8 trong task này |
| FE / Overall | Giữ2PASS/43PARTIAL theo R7.3; không Final System Acceptance |

**MAIN DATABASE SYNC: DONE**  
**CinemaBookingDB: CANONICAL 159/159 VERIFIED**  
**DATA PRESERVATION: PASS**  
**READY FOR R8 FRONTEND STABILIZATION**
