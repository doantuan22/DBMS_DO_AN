# TASK 6 — R3.1: Movie–Actor Atomic Replacement

Ngày nghiệm thu: 08/10/2026. **R3.1 DONE — I-08 RESOLVED.** Database kiểm thử cuối: `CinemaBookingDB_R0_R31_20261008_02`. Main: `CinemaBookingDB`. [Kiểm tra cuối](r31/final-checks.json): 34/34 tiêu chí PASS; không skip. Các dữ liệu và artifact đã nghiệm thu R0/R1/R2 được bảo toàn.

## 1. Phân tích implementation trước khi sửa

Đã đọc roadmap R3.1, schema/PK/FK, writers/readers, RBAC, controller/service, procedure whitelist/binding, validator, AdminPortal và tests. [Trace trước implementation](r31/trace-before.md) trả lời đủ 15 câu hỏi của task. [Source trước thay đổi](r31/before-source/database/08_procedures/admin/sp_Admin_MovieActor_Set.sql) và [fingerprint ban đầu](r31/preserved-before.json) được lưu trước implementation.

`PHIM_DIENVIEN` có PK `(PhimID,DienVienID)`, role nullable `NVARCHAR(150)` và hai FK cascade tới PHIM/DIENVIEN. Không có production trigger trên association. SQL cho phép role NULL/omitted; HTTP hiện yêu cầu role string. Giữ nguyên các contract theo từng layer.

## 2. Root cause I-08

Procedure cũ DELETE cast rồi INSERT từ `OPENJSON ... INNER JOIN DIENVIEN`. JOIN bỏ qua actor không tồn tại; `GROUP BY/MAX(VaiDien)` gộp duplicate; procedure vẫn COMMIT. Một reference sai dẫn tới danh sách thiếu; tất cả references sai dẫn tới cast rỗng. Transaction cũ bảo vệ lỗi ghi nhưng chưa bảo vệ tính hợp lệ của toàn request.

## 3. Movie–Actor writers/callers

- Canonical replacement: PUT `/api/admin/movies/:movieId/actors` → `adminController.setMovieActors` → `adminService.setMovieActors` → whitelist `ADMIN_MOVIE_ACTOR_SET` → `dbo.sp_Admin_MovieActor_Set`.
- Movie Create/Update ghi PHIM/PHIM_THELOAI, không thay cast. Movie Delete có FK cascade hiện hữu, được thử race với replacement.
- Actor Delete có FK cascade hiện hữu; được sửa locking/transaction để giữ rule actor đang tham gia phim phải reject50101.
- Readers: `sp_Movie_GetDetail` recordset3; `usp_Admin_Movie_List.DanhSachDienVienJson`; frontend AdminPortal/adminApi. Không có writer thay cast khác.

## 4. Movie–Actor replacement contract

| Layer | Input/result |
|---|---|
| HTTP | `{cast:[{actorId,role}]}`; actorId là số nguyên dương trong SQL INT, role là string ≤150 UTF-16 units |
| SQL | `ActorID INT`, `PhimID INT`, `DanhSachJson NVARCHAR(MAX)`; JSON `[{DienVienID,VaiDien}]` |
| SQL role | String ≤150 UTF-16 units, string rỗng, NULL hoặc omitted; không enum mới |
| Empty | `[]` xóa cast trong transaction; NULL/missing/malformed input reject |
| Duplicate | Mỗi DienVienID xuất hiện một lần/phim; duplicate reject toàn request |
| Success | Persist đầy đủ request; DTO giữ `{PhimID,DienVienID,HoTen,VaiDien}` |
| Failure | Không thay cast cũ, không chèn một phần, không tự tạo actor |

Authority nằm tại SQL Server; identity và permission lấy từ DB/authentication, không từ payload.

## 5. Các file đã thay đổi

| File/nhóm | Thay đổi |
|---|---|
| `database/08_procedures/admin/sp_Admin_MovieActor_Set.sql` | Parse/validate trước DELETE, locks, own/savepoint, persisted response snapshot |
| `database/08_procedures/admin/sp_Admin_Actor_Delete.sql` | Actor X lock trước association check, own/savepoint transaction |
| `backend/tests/adminService.test.js` | Shape/binding/error mapping regression cho casting |
| `frontend/src/pages/AdminPortal.jsx` | Bỏ blank→[] fallback; reset notice khi submit cast |
| `database/baseline-manifest.json`, `database/12_verify/verify_objects.sql` | Rebuild expectations từ source, cập nhật hai module hashes |
| `database/13_migrations/r31_movie_actor_atomicity.sql` | Migration đúng hai module hiện hữu |
| `database/11_tests/admin/movie_actor_atomicity.sql` | Disposable-only injected failure trigger |
| `database/11_tests/concurrency/movie-actor-replacement.mjs` | Real two-session replacement/Actor Delete/Movie Delete |
| `scripts/r31/` | Fixtures, SQL/API/browser runners, R1/R2 replay, deployment/parity, final checks |
| `frontend/tests/r31-browser-fixtures.jsx` | Tương tác AdminPortal thật trong Chrome, HTTP timing controlled |
| `docs/FULL_SYSTEM_AUDIT.md`, báo cáo/evidence R3.1 | Trạng thái hiện hành I-08/ADM-09 và raw evidence |

Backend runtime, schema, routes, DTO và module R1/R2 giữ nguyên. [Patch và inventory](r31/source-changes.json) liệt kê file cụ thể.

## 6. JSON parsing implementation

Kiểm tra ISJSON, root array và mọi phần tử object. OPENJSON giữ raw value/type/property-count trong table variable trước conversion. DienVienID phải có đúng một field, JSON number dạng số nguyên dương và TRY_CONVERT được SQL INT. Mọi phần tử vẫn được giữ để kiểm tra; không lọc phần tử lỗi.

Role giữ NVARCHAR(MAX) đến khi kiểm tra type và `DATALENGTH ≤300`; sau đó mới convert NVARCHAR(150). Cách này bắt cả trailing-space overflow, tránh truncate trước validation. Duplicate JSON keys của ID/role bị reject. Whitespace JSON và Unicode/trailing spaces có positive persisted evidence. SQL vẫn bỏ qua thuộc tính không thuộc association như contract cũ; HTTP whitelist chặn field ngoài contract.

## 7. Duplicate validation

Sau staging, `GROUP BY DienVienID HAVING COUNT(*)>1` chỉ phát hiện lỗi rồi THROW50103. Không GROUP BY/MAX hoặc DISTINCT trong INSERT replacement. Duplicate cùng ID khác role được thử cả SQL/API và giữ nguyên cast cũ.

## 8. Actor reference validation

Đối chiếu COUNT requested với COUNT matched DIENVIEN dưới HOLDLOCK. Một hoặc toàn bộ actor thiếu → THROW50100 trước DELETE. Khóa shared trên actor giữ tới hết transaction. INSERT dùng trực tiếp tập staging đã validate; không dùng JOIN để lọc request khi ghi. [SQL](r31/sql-tests.json), [API](r31/api-tests.json) ghi state trước/sau và chứng minh không tạo actor.

## 9. Movie reference validation

Resolve `PHIM` bằng UPDLOCK/HOLDLOCK trong transaction; thiếu phim →50102. Parent lock cũng bảo vệ thời điểm movie bị xóa. RBAC hiện hữu kiểm tra active account, ADMIN và QL_DANHMUC_PHIM trước dữ liệu. Movie-missing, non-Admin, inactive identity và thiếu live permission đều có evidence từ DB/API.

## 10. Transaction implementation

SET XACT_ABORT ON; TRY/CATCH; own transaction nếu `@@TRANCOUNT=0`, savepoint khi caller đã có transaction. Thứ tự: parent lock → parse → duplicates → toàn actor references → DELETE → INSERT → count/result check. Chỉ COMMIT transaction do procedure sở hữu.

Result được capture từ association persisted khi còn khóa phim; COMMIT rồi trả đúng DTO. Response của request đầu không bị replacement kế tiếp thay đổi. Positive gọi trong outer transaction giữ `@@TRANCOUNT=1`, `XACT_STATE=1`; caller ROLLBACK khôi phục cast.

## 11. Rollback behavior

XACT_STATE=-1 → rollback toàn transaction đã doomed. XACT_STATE=1 → rollback own transaction hoặc savepoint của procedure. THROW lại lỗi; API không trả success khi rollback.

Validation failure trong transaction XACT_ABORT ON có thể doom caller, theo convention đã nghiệm thu. Test outer validation failure và outer trigger failure xác nhận toàn caller rollback, data phục hồi và session0/0. Các SQL errors dưới trigger được quan sát thực tế; không giả định caller còn committable.

## 12. Empty list semantics

`[]` clear cast và trả actors rỗng. SQL NULL, JSON null, blank, malformed, wrong root reject50103; omitted mandatory SQL parameter reject201; HTTP omitted/null cast reject400. UI blank/malformed JSON không gửi request.

Read contract hiện hữu: public detail trả `actors:[]`; scalar `FOR JSON PATH` của Admin list trả SQL NULL khi cast rỗng trên SQL Server này. UI đã hydrate NULL thành `[]`. [Raw empty-read evidence](r31/empty-read-contract.json) xác nhận; reader/DTO không bị thay đổi. NULL **input** vẫn reject.

## 13. Concurrency/locking behavior

| Resource | Lock/lifetime | Mục đích |
|---|---|---|
| PHIM target | UPDLOCK/HOLDLOCK tới transaction end | Serialize hai replacements, phối hợp movie deletion |
| DIENVIEN requested | Shared HOLDLOCK tới transaction end | Actor không biến mất giữa validate và INSERT |
| Actor Delete parent | XLOCK/HOLDLOCK trước association read | Chờ replacement, sau đó kiểm tra association theo trạng thái đã commit |

Replacement thắng/commit → Actor Delete reject50101. Actor Delete thắng/commit → replacement reject50100 trước DELETE. Rollback-first cho phép writer thứ hai thực hiện đúng trạng thái đã khôi phục. Movie Delete tuân theo FK cascade hiện hữu và parent lock. Không thêm lock table/index/service/versioning.

## 14. Backend error mapping

| Tình huống | SQL/HTTP code | HTTP |
|---|---|---|
| Movie thiếu |50102 → MOVIE_NOT_FOUND|404|
| Actor thiếu |50100 → ACTOR_NOT_FOUND|404|
| Duplicate/JSON association invalid |50103 → MOVIE_CAST_INVALID|400|
| HTTP shape invalid |INVALID_REQUEST/UNKNOWN_REQUEST_FIELD|400|
| Admin thiếu quyền |50302 → FORBIDDEN|403|
| Non-Admin tại route |ADMIN_REQUIRED|403|
| Actor đang dùng |50101 → ACTOR_IN_USE|409|
| DB failure bất ngờ |Existing error convention, message `Internal server error`|500|

Reuse mapping hiện hữu; không tạo error framework/code mới. Unit test kiểm tra nested SQL errors và toàn bộ duplicate payload vẫn được bind đến procedure. API injected500 không expose SQL text/stack/trigger number. Backend chỉ typed binding/execute/mapping.

## 15. Frontend changes

AdminPortal parse JSON đúng nội dung ô nhập; blank không còn fallback thành `[]`. Reset notice trước submit. Reject hiển thị feedback hiện hữu, giữ input để sửa; success sau explicit retry reload danh sách persisted. [8 Chrome checks](r31/browser.json) kiểm tra hydrate, rejection, không fake success, giữ input/cast, retry/reload, blank, malformed và explicit clear. Layout, palette và component hierarchy giữ nguyên.

## 16. SQL positive tests

[9 committed positives](r31/sql-tests.json): old3→new2; cùng danh sách; đổi role; boundary150; roleNULL; omitted role; empty string role; clear[]; restore list. Mỗi case đối chiếu bảng association thật sau commit, reader recordset3, movie khác và PHIM/DIENVIEN/genres. Supplementary Unicode/whitespace case giữ role chính xác.

## 17. SQL negative tests

[30 negative cases](r31/sql-tests.json): one/all missing actor; duplicate; movie missing; malformed; object/null/scalar root; SQLNULL/blank; scalar/null/array item; missing/null/string/bool/decimal/overflow/zero/negative ID; role number/object/array/151/trailing overflow; duplicate ID/role JSON keys; non-Admin/inactive identity.

Mỗi negative xác nhận đúng SQL error, cast cũ nguyên vẹn, movie khác và actors/genres không đổi, fingerprint data cả27 bảng trước/sau giống nhau, `@@TRANCOUNT=0`/`XACT_STATE=0`. Omitted parameter và outer transaction có evidence riêng. Actor Delete bổ sung referenced50101, missing50100, unused success.

## 18. Rollback injection evidence

Trigger disposable AFTER INSERT ghi SESSION_CONTEXT trước khi THROW51031: `oldRemaining=0`, `newInserted=2`. Điều này chứng minh DELETE đã xảy ra và write phase chưa hoàn tất thành công. Sau lỗi toàn cast cũ phục hồi, không còn association mới, session0/0. Trigger được DROP trong finally; metadata/schema fingerprint sau cleanup bằng trước test.

[Injection state](r31/sql-tests.json) có initial/observed/final. Thử thêm trigger RAISERROR50000 trong outer transaction cũng phục hồi dữ liệu và rollback caller. Production source không chứa test hook.

## 19. API integration tests

[59 HTTP requests/19 cases](r31/api-tests.json) chạy Express thật, authentication thật và SQL Server disposable thật. Cover success, one/all invalid, duplicate, missing movie, null/omitted/wrong shape, missing/string ID, role length/null, identity spoof, non-Admin, unauthenticated, malformed HTTP JSON, thiếu live permission, injected500 và clear[].

Success/reject đều GET public detail và Admin list rồi so persisted association. Negative kiểm tra state/fingerprint, không chỉ HTTP status. Permission fixture khôi phục đúng timestamp datetime2(7); cleanup hoàn toàn dữ liệu và schema.

## 20. Concurrency tests

[10 real two-session races](r31/movie-actor-concurrency.json):

| Nhóm | Cases | Kết quả |
|---|---:|---|
| Same movie replacement |4|A→B, B→A, first rollback, clear→replace: final cast đúng request thứ hai; không trộn; response đúng từng request|
| Actor Delete interaction |4|Replacement/delete thắng trước, mỗi hướng COMMIT/ROLLBACK: references hợp lệ hoặc reject toàn replacement|
| Movie Delete interaction |2|Replacement-first cascade theo serial order; delete-first replacement reject50102|

DMV ghi SPIDs khác nhau, LCK_M_* wait, resource/index locks, timeline, uncommitted state và final state. Mọi session kết thúc0/0; dữ liệu ngoài phim target giữ nguyên theo operation contract. Suite cleanup không data/schema drift.

## 21. Regression R1/R2

Original runners được replay, chỉ đổi utility import/output destination vào r31; giữ source hashes và raw evidence cũ.

| Phase | Evidence đã chạy lại | Kết quả |
|---|---|---|
|R1.1|20 SQL cases;10 room/showtime races|PASS|
|R1.2|49 SQL;14 nested;26 scenarios và125 stress races|PASS;0 overlap|
|R2.1|30 SQL;107 API requests;14 parent races;2 HTTP seat races|PASS|
|R2.2|28 SQL+6 constraints;54 API requests;2 last-quota+12 Admin SQL races;2 HTTP quota races;10 Chrome checks|PASS|

[R1](r31/r1-regression.json), [R2.1](r31/r21-regression.json), [R2.2](r31/r22-regression.json). I-02/I-03/I-06/I-07 giữ RESOLVED.

## 22. Backend/Frontend regression

[15 check groups](r31/checks.json) đều PASS: backend full129 tests, frontend49 tests, no-SQL, frontend lint/build, procedure contract, R3.1 SQL/API/concurrency/browser, accepted R2.2/R2.1/R1 replay, SQL regression và verification. **0 skipped**. Chrome thêm8 cast checks và10 accepted promotion checks. Build giữ warning bundle >500KB hiện hữu, thuộc I-24 đã defer.

## 23. No-SQL audit

[Audit](r31/no-sql.txt):93 files,22 keyword matches đã review; `NO RAW BUSINESS SQL IN BACKEND = PASS`. Backend runtime không đổi; không có Node transaction/mutex/test-tool import. Reference validation và transaction đều trong SQL. SQL offline fixtures/migration không nằm trong backend runtime.

## 24. Source/schema parity

Manifest được rebuild từ source bằng disposable manifest DB; final disposable build/verification [159 modules,0 problems](r31/source-parity.json). Tables=27; PHIM/DIENVIEN/PHIM_DIENVIEN schemas, keys, FKs, checks, grants và signatures giữ nguyên.

[Migration replay](r31/migration-replay.json) từ hai definitions trước R3.1 sang source hiện tại PASS. [Main deployment](r31/main-migration.json): COPY_ONLY backup/CHECKSUM, RESTORE VERIFYONLY PASS, atomic DDL đúng hai procedures, mọi data hash27 bảng giữ nguyên từ task start. Các module khác giữ definition chính xác. [Post-deployment read-only](r31/main-readonly.json): parity/data/schema PASS, RCSI và trusted constraints giữ nguyên,0 overlap,0 invalid quota,0 cast orphan. Không reset/seed main.

## 25. Evidence đã tạo

| Nhóm | Files trong r31 |
|---|---|
|Trace/preservation|trace-before.md, preserved-before.json, before-source/, source-changes.json/.patch|
|SQL/state/rollback|sql-tests.json, movie-cast-sql.txt, empty-read-contract.json|
|API|api-tests.json, movie-cast-http.txt|
|Concurrency/UI|movie-actor-concurrency.json, browser.json, r22-browser.json|
|Regression|checks.json, backend.txt, frontend.txt, no-sql.txt, procedure-contract.json, r1/r21/r22 regression JSON và từng raw suite|
|Parity/main|source-parity.json, migration-replay.json, main-before-tests.json, main-test-isolation.json, main-migration.json, main-readonly.json|
|Acceptance|current-audit-status.json, final-checks.json|

Exploratory FAIL được giữ: API trial01 dùng temp table trong sp_executesql scope; trial02 giả định Admin empty JSON là `[]` trong khi raw read trảNULL; SQL trial01/02 giả định trigger RAISERROR còn committable nhưng thực tế rollback caller. Runner đã sửa theo scope/contract đo được và chạy lại toàn bộ các invariants. R2.2 replay trial01 lỗi import redirection của tooling, đã sửa và full accepted replay PASS. Không sửa production expectations để che lỗi; các invariant data/rollback/reference giữ nguyên.

Reproduce bằng DB mới, không cần manual fixtures:

```powershell
node scripts/db/run.mjs build --database=CinemaBookingDB_R0_R31_Recheck
node scripts/r31/checks.mjs --database=CinemaBookingDB_R0_R31_Recheck
```

Credentials lấy từ backend/.env theo convention; không lưu password/JWT vào evidence. Fixture/trigger cleanup chạy finally. Main deployment runner có gate toàn bộ evidence PASS, main isolation và backup verification.

## 26. Kết quả từng Exit Criteria

Đối chiếu đúng thứ tự34 criteria của task; [machine-readable acceptance](r31/final-checks.json).

|#|Tiêu chí|Kết quả/evidence|
|---:|---|---|
|1|Trace tất cả canonical writers|PASS — trace-before.md|
|2|Xác định root cause I-08|PASS — trace-before.md|
|3|Parse JSON an toàn|PASS — sql-tests.json|
|4|Malformed khác empty|PASS — sql-tests.json/browser.json|
|5|Duplicate đúng contract|PASS — sql-tests.json/api-tests.json|
|6|MovieID validated|PASS — sql-tests.json|
|7|Tất cả ActorID validated trước DELETE|PASS — sql-tests.json|
|8|Một ActorID sai làm toàn request fail|PASS — sql-tests.json/api-tests.json|
|9|Không silently bỏ ActorID|PASS — sql-tests.json|
|10|Không auto-create actor|PASS — snapshots data27|
|11|Transaction trong SP|PASS — source/outer transaction tests|
|12|TRY/CATCH/rollback đúng|PASS — sql-tests.json|
|13|Không partial association insert|PASS — rollbackInjection|
|14|Giữ cast khi validation fail|PASS —30 negative states|
|15|Failure giữa write phase rollback|PASS — oldRemaining0/newInserted2/old cast restored|
|16|Empty semantics đúng|PASS — SQL/API/browser|
|17|Chỉ target movie thay đổi khi success|PASS — positive state comparisons|
|18|Backend error mapping|PASS — API và backend129|
|19|Admin authorization giữ nguyên|PASS — API live permission/non-Admin và SQL|
|20|SQL positives PASS|PASS —9 committed positives|
|21|SQL negatives PASS|PASS —30 negatives và omitted case|
|22|Rollback injection PASS|PASS — sql-tests.json|
|23|API integration PASS|PASS —59 requests/19 cases|
|24|Concurrent replacement không mixed/partial|PASS —4 replacement races;6 delete races|
|25|Backend regression PASS|PASS —129 tests,0 skips|
|26|SQL regression PASS|PASS — sql-regression-detail.txt và R1/R2 replay|
|27|No-SQL Backend PASS|PASS — no-sql.txt|
|28|Source/schema parity PASS|PASS — modules159; main-migration.json|
|29|Không thêm bảng|PASS — tables27/source metadata|
|30|PHIM_DIENVIEN schema giữ nguyên|PASS — protected source hashes/main metadata|
|31|Không SQL nghiệp vụ trong backend|PASS — audit/runtime unchanged|
|32|Không redesign frontend|PASS — minimal patch/Chrome8|
|33|DB state thật|PASS — committed snapshots/API GET/race final states|
|34|I-08 RESOLVED bằng evidence|PASS — current-audit-status.json/final-checks.json|

## 27. Issue ngoài scope chưa sửa

I-09 historical metadata/R3.2, I-16 complaint trigger/R3.3 và các hạng mục R4–R9 giữ ngoài phạm vi. Không bổ sung lịch sử, pricing/report, auth policy, dataset tổng hay frontend stabilization. ADM-09 **PARTIAL** vì broader Movie/Actor acceptance và historical policy vẫn cần nghiệm thu riêng. [Trạng thái hiện hành](r31/current-audit-status.json) chỉ resolve I-08; các artifact trước giữ nguyên.

## 28. Kết luận

**R3.1 DONE. I-08 RESOLVED.** Movie–Actor replacement all-or-nothing; invalid actor reference reject without data loss, có SQL/API/state/rollback/concurrency thật.34/34 exit criteria PASS;918 artifact/source đã có được bảo toàn; main data27 và modules ngoài hai procedures giữ nguyên. ADM-09 không còn BROKEN vì I-08 và chưa được đánh dấu toàn Use Case PASS.

**DỪNG TẠI R3.1. KHÔNG TRIỂN KHAI R3.2.**
