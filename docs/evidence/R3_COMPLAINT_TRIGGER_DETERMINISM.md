# TASK 8 — R3.3: Complaint Multi-row Trigger Determinism

Nghiệm thu 08/10/2026: **R3.3 DONE — I-16 RESOLVED, 33/33 exit criteria PASS**. Phạm vi duy nhất R3.3, dừng trước R4. Destructive fixtures chỉ chạy trên SQL Server disposable rebuild từ source: `CinemaBookingDB_R0_R33_20261008_01`. Main không seed/reset hoặc chạy fixture.

## 1. Phân tích implementation trước sửa

[Trace trước implementation](r33/trace-before.md) trả lời đủ 20 câu hỏi về trigger/events/identity/PK/FK/states/writers/readers/transaction/auth/frontend. [Freeze](r33/preserved-before.json) bảo vệ 1.147 file trước task, gồm toàn bộ implementation/evidence R0/R1/R2/R3.1/R3.2 và backend/frontend hiện tại. Bốn mutable files được copy nguyên bản vào `r33/before-source/`.

Chỉ có hai canonical processing writers: AddProcessing và UpdateStatus; alias sp_XuLyKhieuNai delegate AddProcessing. Customer Create tạo parent Mới. Không writer runtime UPDATE/DELETE history; không có direct parent-status writer trong SP. Admin dùng cùng support service/SPs. Không thêm batch HTTP endpoint.

## 2. Root cause I-16

Trigger cũ UPDATE parent từ JOIN toàn bộ INSERTED; một target có nhiều source rows không có rule chọn max XuLyID. SQL plan hiện tại có thể tình cờ chọn đúng: [bốn ordinary batches trước sửa](r33/before-probe.json) đều khớp max ID, không được suy diễn thành deterministic contract.

[Hai race trước sửa](r33/before-concurrency.json) tái hiện lỗi qua actual canonical SPs: identity nhỏ bị giữ tại test-only gate trước status synchronization, identity lớn commit trước, sau đó identity nhỏ hoàn tất và ghi đè parent. Cả CSKH-first và Admin-first đều có mismatch=true so với max persisted XuLyID, cả hai writer đã commit. Vì vậy chỉ rank INSERTED chưa đủ; cần parent barrier và đọc toàn affected history.

## 3. Complaint processing business contract

KHIEUNAI(1)→XULY_KHIEUNAI(N) qua KhieuNaiID. XuLyID INT IDENTITY(1,1), clustered unique PK; không tie. Parent CHECK cho Mới/Đang xử lý/Đã giải quyết/Đã đóng/Từ chối; processing CHECK chỉ bốn trạng thái cuối. `Chờ phản hồi` trong ví dụ request không thuộc schema, được dùng làm negative input.

Processing append-only qua runtime. Parent status sau INSERT được quyết định bởi processing event có XuLyID lớn nhất của complaint; không dùng timestamp, text MAX/MIN, physical input order hoặc last JavaScript array element. Trigger chỉ quản lý TrangThai. CSKH/Admin có global complaint access theo current contract; Customer chỉ xem complaint của mình. Không thêm terminal-state rule mới.

## 4. Trigger trước sửa

Tên: `dbo.TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai`; event AFTER INSERT, không UPDATE/DELETE. [Source trước task](r33/before-source/database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql):

```sql
UPDATE kn SET kn.TrangThai = i.TrangThaiSauXuLy
FROM dbo.KHIEUNAI kn
INNER JOIN INSERTED i ON kn.KhieuNaiID = i.KhieuNaiID;
```

Không TOP1/order/ranking hoặc scalar complaint variable. Status trigger không có side effect ngoài parent status. Trigger role `TRG_XuLyKhieuNai_KiemTraVaiTro` AFTER INSERT,UPDATE dùng EXISTS set-based, THROW50005 nếu actor không active CSKH/Admin; giữ nguyên enabled/events/definition.

## 5. Trigger sau sửa

Sửa tại chỗ, cùng tên/event, SET NOCOUNT ON. Statement thứ nhất lấy U/HOLD trên distinct affected KHIEUNAI; aggregate @AffectedCount chỉ phục vụ resource lock, không chọn một complaint hoặc quyết định status. Statement tiếp theo rank toàn XULY_KHIEUNAI thuộc affected set và UPDATE rn=1.

Không thêm trigger production song song, table/column/index hoặc reset status cũ. Migration chỉ ALTER một trigger hiện hữu. Backend/frontend không sửa.

## 6. ROW_NUMBER/set-based implementation

```sql
;WITH Affected AS
(
    SELECT DISTINCT KhieuNaiID FROM inserted
), LatestProcessing AS
(
    SELECT xl.KhieuNaiID, xl.TrangThaiSauXuLy,
        ROW_NUMBER() OVER (
            PARTITION BY xl.KhieuNaiID ORDER BY xl.XuLyID DESC
        ) AS rn
    FROM dbo.XULY_KHIEUNAI xl
    INNER JOIN Affected a ON a.KhieuNaiID = xl.KhieuNaiID
)
UPDATE kn SET kn.TrangThai = latest.TrangThaiSauXuLy
FROM dbo.KHIEUNAI kn
INNER JOIN LatestProcessing latest
    ON latest.KhieuNaiID = kn.KhieuNaiID AND latest.rn = 1;
```

PK unique đảm bảo một latest row/parent. Chỉ affected IDs được đọc/rank/update. Không cursor, WHILE, row-by-row loop, NOLOCK, MAX/MIN status hoặc multi-source UPDATE không lọc winner.

## 7. Multiple processing rows logic

Mọi processing row của batch được lưu; trigger không gộp/xóa history. Tám permutation cases có bốn status khác nhau cho cùng complaint và history cũ. Expected luôn tính từ persisted XuLyID thật, không giả định VALUES/OPENJSON order quyết định identity. Mỗi record mới được đối chiếu complaint/actor/content/status và count/unique persisted identity.

## 8. Multiple complaints logic

Distinct affected set và PARTITION BY KhieuNaiID cập nhật độc lập tất cả complaints. Tests có mỗi complaint một row và mỗi complaint bốn rows. Một parent không nhận status của parent khác; không scalar-ID shortcut. Unrelated parent/history giữ nguyên, kể cả unrelated complaint đã có processing history.

## 9. Mixed batch handling

SQL mixed case trộn single-row/multi-row parents và different statuses. API integration INSERT batch SQL bốn events cho hai complaints rồi đọc qua CSKH/Admin/Customer HTTP. Two-session mixed batch tests có overlapping parents, first commit/rollback; mỗi final parent bằng max committed identity của chính nó.

## 10. Existing history preservation

SQL/API giữ đầy đủ old records; so persisted fields theo XuLyID, không overwrite content/actor/time/status cũ. Trigger không INSERT history, không sửa customer/order/title/content/priority/time của parent. Parent comparison cho phép duy nhất TrangThai thay đổi.

Queue view giữ TOP1 ORDER BY XuLyID DESC cho latest descriptors/count. Customer và Support detail giữ ORDER BY NgayXuLy ASC hiện hữu; API checks membership/content/status và chronological order. Status authority vẫn XuLyID, không đổi contract timeline hoặc xử lý stale-response R8. Không bổ sung history UPDATE/DELETE feature; status trigger không đăng ký các events đó.

## 11. Transaction/rollback behavior

Trigger chạy cùng transaction của INSERT, không BEGIN/COMMIT riêng hoặc TRY/CATCH nuốt lỗi. Existing SP BEGIN/COMMIT/CATCH rollback convention giữ nguyên. Caller success vẫn giữ transaction ngoài; lỗi trigger qua canonical SP rollback caller theo convention hiện hữu.

Caller batch rollback được quan sát trước rollback: sáu new rows, ba parent statuses mới và @@TRANCOUNT=1/XACT_STATE=1; rollback khôi phục toàn parent/history cũ. Fault sau parent UPDATE quan sát ba statuses mới rồi THROW51034, statement và child rows rollback cùng nhau. Sau mỗi cleanup session 0/0, schema/data hashes toàn 27 bảng được đối chiếu.

## 12. Concurrency/locking implications

[Thiết kế và raw race evidence](r33/concurrency-design.md). Identity allocation không bảo đảm trigger/commit order. Parent U/HOLD barrier được lấy trước một history SELECT riêng; với READ COMMITTED/RCSI hiện hữu, sau thời gian chờ, SELECT thấy own pending row và history của writer đã commit. Đây là lý do rank toàn history thay vì chỉ INSERTED.

Giữ FK và parent resources hiện hữu, không child SERIALIZABLE range lock, new lock table, Node transaction hoặc distributed mechanism. Index processing theo KhieuNaiID/NgayXuLy và clustered XuLyID được giữ nguyên. Không tuyên bố deadlock-free: nhiều parent/FK lock conversion vẫn có thể tranh chấp ở lịch khác; SQL victim phải rollback. Tested schedules ghi actual outcomes, không retry âm thầm.

[12 current races](r33/complaint-concurrency.json): 8 canonical CSKH/Admin × AddProcessing/UpdateStatus × first COMMIT/ROLLBACK; 2 overlapping mixed batches; 2 delayed-smaller-identity schedules. Có SPIDs khác nhau, actual DMV LCK_M waits, parent/child lock resources/indexes, intermediate/final rows và clean sessions. Hai delayed cases đều high identity commit trước, low identity hoàn tất sau, cả hai lưu thành công và parent vẫn bằng high identity, mismatch=false.

## 13. Các file đã thay đổi

[Inventory/hashes](r33/changed-files.json), [patch riêng Task8](r33/source-changes.patch):

- `database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql` — implementation duy nhất của runtime.
- `database/baseline-manifest.json`, `database/12_verify/verify_objects.sql` — regenerated parity từ source rebuild.
- `docs/FULL_SYSTEM_AUDIT.md` — current head R3.3; các audit cũ giữ lịch sử.
- `database/13_migrations/r33_complaint_trigger_determinism.sql` — include đúng trigger.
- `database/11_tests/complaints/processing_rollback.sql`, `database/11_tests/concurrency/complaint-processing.mjs` — disposable-only fault/race tests.
- Offline runners `scripts/r33/`, report và raw evidence `docs/evidence/r33/`.

Không sửa source/tests backend/frontend hoặc các accepted runner/evidence. Git diff tổng vẫn chứa R3.1/R3.2 chưa commit; không coi đó là thay đổi Task8 và không tự commit.

## 14. SQL single-row tests

[SQL raw](r33/sql-tests.json): canonical CSKH/Admin AddProcessing qua đủ bốn valid statuses; processing response identity đúng record đã lưu; mỗi lần append một row và cập nhật parent đúng. UpdateStatus append event thứ năm, alias sp_XuLyKhieuNai cùng behavior. Direct single INSERT và new single khi có existing history PASS. Missing unrelated parent changes được assert bằng full fixture state.

## 15. SQL multi-row tests

29 cases gồm **22 positive / 7 negative**, ngoài sáu rollback cases. Positive cover multiple complaints one each, same complaint eight input orders, all complaints multiple rows, mixed batches, four same-status batches, preexisting history và identity-vs-timestamp. Cả hai readers/global queue tiếp tục nhìn đúng parent/history trong API suite.

Backdated/timestamp-opposite case chứng minh winner chọn identity; các processing timestamps không quyết định parent. Expected tính từ database thật sau INSERT. Statement có empty INSERTED giữ nguyên tất cả parent/history. Không chỉ assert rows inserted.

## 16. Edge-case tests

Negative batch trộn valid row với missing parent FK547, missing actor FK547, invalid status CHECK547, initial Mới processing CHECK547, customer actor50005, manager actor50005, null content515. Whole batch fail và full state/27-table data hashes giữ nguyên.

Existing history, unrelated complaint đã có history, same statuses, timestamp ngược, zero-row INSERT và caller-owned transaction đều có raw states. UPDATE processing cũ là **N/A cho event của status trigger** và không được expose trong runtime; không mở rộng AFTER INSERT thành UPDATE/DELETE. Role trigger event hiện hữu giữ nguyên.

## 17. Rollback injection tests

[Sáu SQL rollback cases](r33/sql-tests.json): explicit caller batch rollback; AFTER parent UPDATE fault trong multi-row statement; canonical caller failures cho CSKH/Admin AddProcessing/UpdateStatus. [Bốn HTTP fault cases](r33/api-tests.json) trả sanitized500 và đọc lại parent/history cũ.

Hook chỉ là disposable trigger `R33_ParentFailure` trên KHIEUNAI, được drop sau test; production không có hook. Gate dùng unrelated existing fixture complaint và session context, source trigger restored bằng repository SQL-token normalizer; data và mọi metadata khác so exact. SQL verification sau suites PASS, không schema drift hoặc transaction leak.

## 18. API integration

[158 real Express/SQL requests, 45 cases](r33/api-tests.json): Customer create→detail; CSKH/Admin processing đủ bốn statuses; status update append-only; queue/detail Customer history/list; multi-row SQL write rồi đọc qua real HTTP; other Customer own complaint; canonical missing/resource/validation; live permission removal/restoration và safe trigger errors. Complaint không linked order vẫn trả null/reference message theo contract.

Sau write, DB được query để xác nhận latest ID, parent/history, unrelated rows và preservation; sau reject so full state và data hashes. Support POST processing giữ201; Admin wrapper giữ200. Typed fixed whitelist/DTO/mapping/auth không thay đổi. Không lưu token/login response trong raw evidence.

## 19. RBAC/authorization regression

Customer/manager không thể dùng support interface; Customer không thể dùng Admin interface; unauthenticated401. Other Customer đọc complaint của người khác404 COMPLAINT_NOT_FOUND. CSKH/Admin xử lý complaints toàn hệ là current contract, không thêm owner/cinema scope không có trong schema/API.

Live grants QL_KHIEUNAI và XULY_KHIEUNAI được lần lượt remove cho cả CSKH/Admin: POST processing và PUT status403, direct SQL procedures50302. Exact grant rows gồm datetime2(7) được restore. Unknown actor spoof field400, invalid/omitted/null input400, missing complaint404. Role trigger/FK/CHECK giữ nguyên; backend full authorization tests PASS.

## 20. R1 regression

[Full R1 replay](r33/r1-regression.json): R1.1 20 SQL + 10 room-delete races; R1.2 49 SQL + 14 nested + 26 scenarios/125 stress races. Committed overlap count0. R3.2 đã nghiệm thu adaptation của Update return-fault fixture được reuse nguyên vẹn; không sửa accepted test assertions hoặc artifacts. Outputs chỉ redirect về r33.

## 21. R2 regression

[R2.1](r33/r21-regression.json): 30 SQL, 107 API, 14 parent races, 2 HTTP seat conflict races. [R2.2](r33/r22-regression.json): 28 SQL + 6 constraints, 54 API, 2 HTTP quota races, 2 SQL last-quota races, 12 Admin races và 10 browser checks. Tất cả PASS, không skip/overwrite evidence cũ.

## 22. R3.1/R3.2 regression

[R3.1](r33/r31-regression.json): 9 SQL positive + 30 negative, rollback/reference/JSON checks, 59 API/19 cases, 4 replacement + 4 Actor Delete + 2 Movie Delete races, 8 browser checks PASS.

[R3.2](r33/r32-regression.json): 108 SQL + monetary/rollback/precision checks, 240 API/82 cases, 20 booking/update races, 8 caller cases, 24 browser checks PASS. Source/protected hashes và prior RESOLVED issues giữ nguyên.

## 23. Backend/Frontend regression

[16 check groups](r33/checks.json) PASS: backend full **131 tests**, frontend **49 tests**, **0 skip**; lint/build, SQL regression, procedure contracts và source verification PASS. Backend/frontend file hashes đều thuộc protected pre-task freeze, không đổi UI/API/component hierarchy. Browser các phase liên quan replay thật; không thêm UI mock làm business evidence của R3.3.

## 24. No-SQL audit

[No-SQL log](r33/no-sql.txt) PASS. Không history/latest logic trong JavaScript runtime, không ORM/query builder/raw SQL/Node transactions/mutex. SQL fixture/snapshot/DMV/backup helpers chỉ là offline tooling theo convention. Final evidence scan không có configured DB password hoặc JWT. Không thêm audit exemption hoặc sửa test cũ để che lỗi.

## 25. Source/schema parity

[Disposable source parity](r33/source-parity.json) và [main migration](r33/main-migration.json):159 modules khớp normalized source. Migration replay old trigger→current trên disposable PASS; 27-table data/schema/signatures/grants giữ nguyên. Production vẫn 27 tables,7 triggers; không thêm LastProcessingID, history table/index hoặc đổi events/role trigger.

[Main isolation](r33/main-test-isolation.json) chứng minh không đổi main trong disposable tests. Backup `CinemaBookingDB_pre_R33_1791441845969.bak` tại SQL Server backup directory, COPY_ONLY/CHECKSUM và RESTORE VERIFYONLY PASS. DDL transaction thay đúng một trigger; 158 module còn lại và data hashes 27 bảng exact unchanged. [Read-only sau deploy](r33/main-readonly.json) PASS, complaint0/processing0/anomaly0; RCSI/constraints trusted/overlap0 và prior quotas/references giữ nguyên. Không mass-correct historical statuses; anomaly observation trước/sau được lưu riêng.

## 26. Evidence đã tạo

[Index](r33/README.md) tập hợp trace/freeze/before-source, before ordinary probes và canonical race reproduction, SQL/API/DMV/fault states, regression outputs/logs, checks/contracts/no-SQL/parity, source inventory/patch, migration replay/main backup/isolation/read-only, audit và final checklist.

Một trial của harness trước sửa được giữ: code ban đầu giả định ordinary SQL plan phải tái hiện mismatch; plan thực tế chọn đúng max ID, nên assertion FAIL. Final before-probe ghi đúng observation (không invent lỗi), sau đó controlled canonical identity inversion tái hiện defect thật hai lần. Trial không phải final acceptance. Không fake/suy diễn PASS hoặc overwrite accepted evidence.

## 27. Kết quả từng Exit Criteria

| # | Exit criterion | Result | Raw evidence |
|---|---|---|---|
| 1 | Trace trigger và mọi processing writers | PASS | trace-before.md |
| 2 | Root cause I-16 xác định | PASS | before-concurrency.json |
| 3 | Trigger set-based | PASS | source-changes.patch |
| 4 | Không cursor | PASS | trigger source; final-checks.json |
| 5 | Không WHILE/row-by-row | PASS | trigger source; final-checks.json |
| 6 | Không giả định INSERTED một row | PASS | sql-tests.json |
| 7 | ROW_NUMBER/PARTITION BY complaint/ORDER BY XuLyID DESC | PASS | source-changes.patch |
| 8 | Một latest row/complaint | PASS | sql-tests.json |
| 9 | Parent bằng latest processing status | PASS | complaint-concurrency.json |
| 10 | Single-row không regression | PASS | sql-tests.json; api-tests.json |
| 11 | Multiple complaints một INSERT | PASS | sql-tests.json |
| 12 | Multiple rows cùng complaint | PASS | sql-tests.json |
| 13 | Mixed batch | PASS | sql-tests.json; complaint-concurrency.json |
| 14 | Different statuses chính xác | PASS | sql-tests.json |
| 15 | Unrelated complaint không đổi | PASS | sql-tests.json; api-tests.json |
| 16 | Existing history giữ nguyên | PASS | sql-tests.json; api-tests.json |
| 17 | Rollback phục hồi parent | PASS | sql-tests.json |
| 18 | Rollback không giữ history mới | PASS | sql-tests.json |
| 19 | SQL positive tests | PASS | sql-tests.json |
| 20 | SQL negative tests | PASS | sql-tests.json |
| 21 | Multi-row SQL integration | PASS | api-tests.json |
| 22 | CSKH API flow | PASS | api-tests.json |
| 23 | Customer read/timeline | PASS | api-tests.json |
| 24 | Permission/authorization giữ nguyên | PASS | api-tests.json |
| 25 | Backend regression | PASS | checks.json |
| 26 | No-SQL Backend | PASS | no-sql.txt |
| 27 | Prior phase regressions liên quan | PASS | r1/r21/r22/r31/r32-regression.json |
| 28 | Source/schema parity | PASS | source-parity.json; main-migration.json |
| 29 | Không thêm bảng | PASS | main-migration.json |
| 30 | Không LastProcessingID column | PASS | main-migration.json |
| 31 | Không redesign Frontend | PASS | preserved-before.json; final-checks.json |
| 32 | Final DB state evidence thật | PASS | SQL/API/concurrency JSON |
| 33 | I-16 RESOLVED | PASS | current-audit-status.json; final-checks.json |

[Machine-checked acceptance](r33/final-checks.json), [criteria có raw links](r33/exit-criteria.md). Không nâng toàn bộ Complaint Use Cases lên PASS.

## 28. Issue ngoài scope chưa sửa

R4 và các phase sau chưa triển khai. I-15 support queue stale-response, I-11 Admin selected/detail risk, I-21 complaint linked-order lookup UX và các ACTIVE findings khác giữ nguyên. Explicit SNAPSHOT/ad-hoc privileged history UPDATE/DELETE nằm ngoài canonical READ COMMITTED append-only contract; không mở rộng trigger events hoặc mass correction.

[Audit hiện hành](r33/current-audit-status.json) chỉ resolve I-16, giữ I-02/I-03/I-06/I-07/I-08/I-09 RESOLVED và tất cả45 UC grades. KH-14, CSKH-02/03/05/06, ADM-15 tiếp tục PARTIAL vì broader acceptance. Không sửa evidence đã nghiệm thu.

## 29. Kết luận

**R3.3 DONE — 33/33 exit criteria PASS.** Trigger status hiện hữu xác định đúng latest persisted XuLyID cho single/multiple/mixed inserts và canonical concurrent completion; history, rollback, permission và prior phase behaviors được kiểm chứng bằng real SQL/HTTP states. Main scoped migration đã backup/verify và bảo toàn dữ liệu/schema.

**DỪNG TẠI R3.3. KHÔNG TRIỂN KHAI R4.**
