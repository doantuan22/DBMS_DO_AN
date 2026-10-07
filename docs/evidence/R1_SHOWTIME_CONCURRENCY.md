# TASK 3 — PHASE R1.2: CONCURRENT SHOWTIME OVERLAP SAFETY

**R1.2 DONE. I-03 RESOLVED R1.2.** Thực hiện từ07 đến08/10/2026 (Asia/Saigon). R0/R1.1 đã nghiệm thu được giữ nguyên; task dừng trước R2.

## 1. Phân tích implementation trước sửa

Đã trace route → authenticate/role/QL_SUAT_CHIEU → controller → service → whitelist/typed procedure client → SP và các helper/alias. Backend không có writer SQL trực tiếp.

| Câu hỏi bắt buộc | Trước sửa |
| --- | --- |
| 1. INSERT thực sự? | sp_Manager_Showtime_Create, usp_Admin_Showtime_Create. |
| 2. UPDATE thời gian? | sp_Manager_Showtime_Update, usp_Admin_Showtime_Update. |
| 3. Đổi PhongID? | Không có tham số/chức năng đổi phòng ở hai Update. |
| 4. Cancel hard delete? | Không; hai wrapper delegate sp_Showtime_CancelCascade, đổi trạng thái và giữ lịch sử. |
| 5. Overlap definition? | start < other_end AND end > other_start, cùng phòng, khác SuatChieuID. |
| 6. Active status? | Mọi trạng thái khác Đã hủy, gồm Mở bán/Đóng bán/Hoàn thành. |
| 7. end == start? | Hợp lệ, không overlap. |
| 8. Transaction? | Create không; Update có own-transaction/savepoint nhưng chưa XACT_ABORT ON; Cancel helper có ON và own/savepoint. |
| 9. Lock phòng? | Writer suất chưa khóa phòng trước; Update/Cancel khóa SUATCHIEU trước. |
| 10. Alias bypass? | sp_ThemSuatChieu delegate Manager Create, nên sẽ được bảo vệ qua canonical path. |
| 11. Ghi trực tiếp ngoài gateway? | Seed, migration/tooling và fixture SQL tin cậy có DML trực tiếp, chạy ngoài runtime. Không có business SQL ở Backend. |
| 12. Room Delete R1.1? | Parent UPDLOCK/HOLDLOCK → SUATCHIEU UPDLOCK/HOLDLOCK → giữ lịch sử/inactivate hoặc atomic hard delete. Giữ nguyên. |

Index hiện có: IX_SUATCHIEU_Phong_ThoiGian (PhongID,ThoiGianBatDau,ThoiGianKetThuc). RCSI ON được xác nhận live. Role/current-account/permission/scope guards và API parameter contracts đã đọc trước khi sửa.

## 2. Root cause I-03

AFTER trigger nhìn được các row của cùng statement/transaction nhưng RCSI có thể che row chưa commit của phiên khác. Hai writer ở cùng phòng chưa giữ một resource chung trước check/write; Update khóa hai suất khác nhau cũng chưa serialize lịch phòng. Vì vậy mỗi phiên có thể thấy schedule riêng hợp lệ rồi cùng commit overlap.

## 3. Danh sách tất cả writer của SUATCHIEU

| Procedure/path | Tác động | Canonical protection |
| --- | --- | --- |
| sp_Manager_Showtime_Create | INSERT | Own/savepoint, parent mutex, shared check |
| usp_Admin_Showtime_Create | INSERT | Cùng protocol |
| sp_Manager_Showtime_Update | UPDATE phim/time/format/price/status, không đổi phòng | Discover room → parent → current child → shared check |
| usp_Admin_Showtime_Update | UPDATE tương tự | Cùng protocol |
| sp_Showtime_CancelCascade | UPDATE status Đã hủy | Parent trước child/order/ticket, giữ cancellation policy |
| sp_Manager_Showtime_Cancel | Wrapper | Delegate canonical cancellation helper |
| usp_Admin_Showtime_Cancel | Wrapper | Delegate canonical cancellation helper |
| sp_ThemSuatChieu | Legacy wrapper | Delegate Manager Create, không writer riêng |

Không có gateway SP hard-delete SUATCHIEU hay chuyển phòng. sp_Showtime_ValidateTimes là validator, không writer. Trigger overlap không ghi SUATCHIEU. Direct DML trong source seed/tests là tooling serial/fixtures, không runtime gateway; task không cấp bảo đảm concurrency cho ad-hoc SQL bỏ qua mutex.

## 4. Các file đã thay đổi

- Sáu module hiện có: Manager/Admin Create/Update, sp_Showtime_CancelCascade, sp_Showtime_ValidateTimes.
- [Migration](../../database/13_migrations/r12_showtime_overlap_safety.sql); manifest và generated verify_objects/verify_procedures cập nhật từ source-built DB mới.
- Backend: managerService missing room/show error mappings, [showtimeConcurrency.test.js](../../backend/tests/showtimeConcurrency.test.js). Admin overlap mapping hiện có đã đủ; không đổi runtime Admin/Controller/Procedure Client/Frontend ở Task3.
- [SQL tests](../../database/11_tests/showtimes/overlap_safety.sql), [harness](../../database/11_tests/concurrency/showtime-overlap.mjs), README concurrency.
- Offline tooling `scripts/r12/{common,preserve-before,apply-disposable,sql-tests,nested-tests,api-tests,room-regression,checks,deploy,main-readonly,audit-status,final-checks}.mjs`.
- Báo cáo/evidence mới trong r12; thông báo trạng thái mới trong FULL_SYSTEM_AUDIT. Các file sửa của Task2 còn trong working tree vì chưa commit, được phân biệt bằng preservation hashes; không rollback/ghi đè Task2.

## 5. Transaction implementation

Create/Update và Cancel helper dùng XACT_ABORT ON khi validation/write; `@@TRANCOUNT=0` thì tự BEGIN/COMMIT, caller có transaction thì SAVE TRANSACTION và không commit caller. CATCH rollback toàn bộ khi XACT_STATE=-1; khi còn committable thì rollback own transaction hoặc về savepoint. Sau rollback, CATCH đặt XACT_ABORT OFF trước rethrow để không làm hỏng caller vẫn committable; SET option được SQL Server phục hồi khi procedure thoát. Transaction writes vẫn chạy với ON.

Lỗi doomed dưới ON không thể cứu bằng savepoint: toàn transaction phải rollback, đúng convention SQL hiện có. Không mở transaction trong Node runtime, không JS mutex/Redis. Harness dùng SQL BEGIN/COMMIT trên connection riêng để giữ khóa quan sát; không mssql.Transaction.

## 6. PHONGCHIEU mutex implementation

Create SELECT parent WITH(UPDLOCK,HOLDLOCK) trong transaction, lấy room/RapID thật, rồi resource validation/scope/time/overlap và INSERT. Update/cancel cần discovery PhongID từ SUATCHIEU bằng RCSI read, không giữ child update lock ở bước này; khóa parent rồi đọc lại child WITH(UPDLOCK,HOLDLOCK), ràng buộc cùng PhongID đã discover. Canonical Update không hỗ trợ đổi phòng nên không mở room-transfer feature.

Check dùng chung được bổ sung vào sp_Showtime_ValidateTimes bằng ba tham số **optional** @PhongID=NULL, @SuatChieuID=NULL, @TrangThai=Mở bán. Caller cũ truyền ba tham số time vẫn tương thích, đã gọi thật trên main. Predicate reuse trigger, exclude self khi update, đọc SUATCHIEU WITH(READCOMMITTEDLOCK) để lấy committed state hiện hành sau mutex. Parent mutex serialize cùng phòng; không thêm broad serializable range lock cho mọi Create, không đổi isolation DB.

## 7. Lock order

Các resource lịch chiếu: **PHONGCHIEU → SUATCHIEU → DONDATVE → CHITIETVE**. Không lock order/ticket ở Create. Update giữ nguyên order-history check. Cancel vẫn giữ customer-first NGUOIDUNG coordination có sẵn để tương thích booking/payment, sau đó parent trước show/order/ticket; các bước compensation/promotion/expiry không đổi policy. Đây là thứ tự cho bốn resource yêu cầu, không tuyên bố mọi lock khác đã được redesign.

Room Delete R1.1 vẫn parent → show range. Nested caller có thể đã giữ khóa từ trước; procedure không đảo thứ tự explicit của các schedule lock mới và không tự mở feature đổi phòng.

## 8. Manager Create/Update/Cancel

Create khóa phòng trước khi scope/check và insert. Update đọc RapID từ parent đã khóa, re-read current show, giữ guard order/lifecycle/time, exclude SuatChieuID của chính nó. Cancel wrapper giữ guards và delegate helper đã sửa lock order. Scope do fn_KiemTraQuanLyRapScope quyết định trong SQL; foreign/expired assignment reject, không tin RapID client.

Room/movie operational-state/release policy giữ như hiện có. Không thêm parent-status enforcement thuộc I-06/R2 hoặc thay metadata lifecycle I-09/R3.

## 9. Admin Create/Update/Cancel

Admin giữ active-account/ADMIN/QL_SUAT_CHIEU guards. Create/Update cùng parent mutex/shared check với Manager. Cancel vẫn delegate cùng helper, giữ paid-order compensation, active-hold rejection, idempotent cancellation và history. Không mở rộng Admin feature khác.

## 10. Legacy/alias handling

sp_ThemSuatChieu và whitelist ADD_SHOWTIME giữ nguyên signature/source, delegate Manager Create. SQL tests và races Manager/alias, alias/Manager chứng minh không bypass mutex. Không xóa alias. Hai Cancel wrapper cũng được bảo vệ transitively qua helper, không duplicate algorithm.

## 11. Trigger defense-in-depth

TRG_SuatChieu_KiemTraTrungLich giữ **nguyên definition**, vẫn enabled, AFTER INSERT/UPDATE, set-based với INSERTED và kiểm tra các cặp trong tập INSERTED. Predicate half-open và active definition không đổi. SQL multirow-overlap reject50001, multirow-boundary non-overlap commit và mixed canceled/active same interval commit đúng rule. Trigger tiếp tục bảo vệ statement; parent mutex ở SP là cơ chế concurrency chính.

## 12. Error contract / HTTP 409

Reuse50001 → **409 SHOWTIME_OVERLAP** ở cả Manager/Admin. Manager50056 →404 ROOM_NOT_FOUND,50058/50116 →404 SHOWTIME_NOT_FOUND,50050 →403 MANAGER_CINEMA_FORBIDDEN; time50216 →400 SHOWTIME_TIME_INVALID. Existing order/cancel restrictions giữ mã cũ. Unexpected DB error →500 Internal server error, không trả SQL statement/stack/connection detail. No extra error framework hoặc authoritative check ở JavaScript.

## 13. SQL tests

[sql-tests.json](r12/sql-tests.json): **49/49 PASS**. Hai vai trò được kiểm tra create clear/boundary/different room; exact/inside/containing/partial-head/partial-tail rejection; update clear/conflict/self/boundary; cancel/idempotence/create-after-cancel/completed/held restrictions; paid-order update guard; missing resources/invalid time. Manager foreign/expired scope, alias clear/overlap, ba multirow trigger cases bổ sung. Mỗi case assert expected SQL code, actual before/after rows, rejected-write preservation, overlap0, TRANCOUNT/XACT_STATE0. Fixture cleanup và strict metadata/fingerprint27 bảng PASS.

[nested-tests.json](r12/nested-tests.json): **14/14 PASS**. Manager/Admin ×Create/Update/Cancel, mỗi operation có caller-owned success và committable-error savepoint rollback; hai thêm nested overlap-doomed rollbacks. Xác nhận caller marker giữ được khi transaction còn committable, procedure không commit caller; caller rollback phục hồi cả marker/write. Lỗi doomed rollback tất cả, không để transaction mở.

Committable fault được tạo bằng missing dependency2812 với XACT_ABORT OFF trong callee chỉ trên session/fixture disposable; tạm instrument GetDetail/ExpirePending rồi phục hồi exact original prefix/source. Đây là SQL error thật để kiểm chứng CATCH/savepoint, không mock overlap hoặc dùng definition lỗi trong concurrency. Sau test, cả hai helper, mọi metadata và dữ liệu khớp trước test.

## 14. Concurrency tests từng scenario

[concurrency.json](r12/concurrency.json): **26/26 scenario cases PASS**, hai SPID thực, thêm connection chỉ đọc DMV. SQL gate giữ parent trước khi phát competing request, xác nhận lock wait thật trước khi chạy/commit winner. Different-room case buộc B commit khi A còn mở; không dùng random sleep làm chứng cứ.

| Scenario | Số case | Actual final state |
| --- | ---: | --- |
| Create+Create same room overlap | 6 | Một commit, một50001; active show1, overlap0; có Manager/Admin/alias |
| Create+Create same room non-overlap/boundary | 4 | Cả hai commit, end==start, overlap0 |
| Different rooms same time | 4 | B commit độc lập khi A còn open, mỗi phòng một show |
| Create+Update | 2 | Create commit, update conflict rollback; lịch cũ giữ nguyên |
| Update+Create | 2 | Update commit, create50001; final lịch hợp lệ |
| Update+Update, hai show cùng phòng | 2 | Một update commit, update còn lại50001, row bị reject giữ nguyên |
| Update+Update cùng một show | 2 | Cả hai có thể commit theo thứ tự, self-exclusion đúng, final một show hợp lệ |
| Cancel+Create | 2 | Cancel rồi create commit; canceled row giữ lại, một active interval |
| Create+Cancel | 2 | Create50001 vì show chưa hủy; cancel commit, history giữ lại |

JSON ghi operation, room/interval, SPID, timestamps, DMV wait/resource, kết quả commit/error, initial/final rooms/seats/shows/orders/tickets, actual overlap count và final transaction state. Từng case giữ nguyên ghế; SPID ổn định; cuối case transaction/state0.

## 15. Stress test >=100 race

**125/125 races PASS** cho Create+Create cùng phòng overlap:100 SQL-gated races có actual DMV blocking,25 phát hai request đồng thời không gate. Vai trò Manager/Admin/alias luân phiên. Mỗi iteration query state thật, assert đúng một success và một50001, show committed1, seats giữ nguyên, overlap0, không transaction leak. Không chỉ đếm response.

Sau cleanup, query toàn bộ disposable DB xác nhận **final committed overlap count=0**, artifact `globalFinalStateQuery=PASS`. Dữ liệu27 bảng/schema không đổi so với seed snapshot. Main read-only query cũng xác nhận overlap0; stress không chạy trên main.

## 16. R1.1 Room Delete regression

[room-delete-regression.json](r12/room-delete-regression.json): giữ nguyên logic runner/harness R1.1, chỉ redirect utility import/evidence filename vào r12; ghi source hashes. Không overwrite accepted r11 evidence.

- [20 SQL cases](r12/room-delete-sql-tests.json): PASS.
- [10 two-session cases](r12/room-delete-concurrency.json): PASS, Manager/Admin/alias, cả delete thắng và create thắng.
- Delete thắng: room/seats/shows0/0/0, creator50056 sau parent-lock wait.
- Create thắng: room1/seats2/shows1, room Ngưng hoạt động; từng row ghế/suất giữ nguyên.

Room Delete SP không sửa; R1.1 invariant all-or-nothing không regression.

## 17. Backend/Frontend regression

[checks.json](r12/checks.json): backend **126/126**, frontend **49/49**,0 skip; frontend lint/build PASS. Frontend không sửa trong Task3; flow hiện có hiển thị lỗi409, giữ form và không coi request lỗi là thành công. Bundle warning hiện có không nằm trong phạm vi.

[api-tests.json](r12/api-tests.json): **41 request thật PASS**; Manager/Admin create/update overlap409, boundary/self/update/cancel-after-create, missing room/show404, invalid-time400, scope403, injected-DB-error500 safe. Hai HTTP create đồng thời Manager/Admin có đúng một success và một409; state thật một show, overlap0. Rejected requests không đổi dữ liệu; fixture/schema cleanup PASS.

SQL regression nguyên suite PASS: smoke, timezone, pricing, compensation/schema, multirow triggers, constraints và EXECUTE-only. Procedure contract PASS112 methods/120 calls,0 missing source/problems; source/schema verification PASS159 modules.

## 18. No-SQL audit

[no-sql.txt](r12/no-sql.txt): **PASS**,93 backend source/test files, không raw business SQL/query/ORM. Transaction/mutex trong SQL SP; JavaScript chỉ bind typed params/execute/map error. Tooling offline không được import vào backend/src.

Initial scan bắt natural-language “Update” trong assertion; đổi wording thành “Editing”, giữ nguyên assertion và scanner. Initial nested suite đã PASS14 hành vi nhưng strict cleanup check phát hiện leading newline sau restore; sửa restoration prefix, không nới metadata assertion. Hai diagnostic logs `*-initial.txt` và checks history giữ FAIL ban đầu; current checks là kết quả chạy thật sau sửa.

## 19. Evidence đã tạo

[r12/README.md](r12/README.md) liệt kê raw JSON/log. DB test cuối: `CinemaBookingDB_R0_R12_20261007_02`, dựng lại từ source sau final SQL changes, seed convention hiện có. Không chạy lại R0 normalization hoặc ghi đè accepted R0/R1.1 evidence.

[main-migration.json](r12/main-migration.json): COPY_ONLY/CHECKSUM backup và RESTORE VERIFYONLY PASS trước migration; sáu existing modules ALTER, COMMIT; data27 bảng giữ nguyên, table/column/FK/CHECK/index/trigger/role/grants/actor-write signatures không đổi. Chỉ helper ValidateTimes có thêm optional parameters, ba tham số cũ giữ nguyên. Hai Room Delete, overlap trigger, alias definition giữ nguyên; source parity159 PASS. Không thêm object/table/index.

[main-readonly.json](r12/main-readonly.json): post-commit data fingerprint giữ nguyên, actual committed overlap0, RCSI ON,27 tables/125 SP/7 triggers, FK/CHECK enabled/trusted, caller helper ba tham số cũ PASS. [migration-replay.json](r12/migration-replay.json) xác nhận replay không đổi data/schema.

[current-audit-status.json](r12/current-audit-status.json): I-03 resolved; QLR-04/QLR-05/ADM-14 PARTIAL, không còn BROKEN vì I-03. Các vấn đề I-06/I-09 vẫn ACTIVE, không đổi policy hoặc tuyên bố toàn UC PASS. I-02 vẫn RESOLVED R1.1, QLR-02 PARTIAL. Tổng45 UC:7 PASS/37 PARTIAL/1 BROKEN;21 findings active.

## 20. Kết quả từng Exit Criteria

| # | Tiêu chí | Kết quả / evidence |
| --- | --- | --- |
| 1 | Manager Create parent lock trước overlap | PASS —SQL/source và races |
| 2 | Manager Update parent lock trước overlap | PASS —re-read/exclude self, update races |
| 3 | Manager Cancel protocol | PASS —canonical helper, cancel races/nested |
| 4 | Admin Create cùng mutex | PASS —mixed-role races |
| 5 | Admin Update cùng mutex | PASS —mixed-role update races |
| 6 | Admin Cancel cùng mutex | PASS —shared helper và cancel races |
| 7 | Alias không bypass | PASS —delegate SQL/alias races |
| 8 | XACT_ABORT/transaction đúng | PASS —ON writes, own/savepoint,14 nested cases |
| 9 | PHONGCHIEU→SUATCHIEU thống nhất | PASS —explicit retained schedule-lock order |
| 10 | Trigger giữ nguyên | PASS —source/hash/main deployment |
| 11 | Trigger multirow | PASS —overlap/non-overlap/canceled cases |
| 12 | Boundary end==start | PASS —SQL và real races |
| 13 | Create+Create overlap | PASS —6 scenarios +125 stress |
| 14 | Create+Create no-overlap | PASS —4 scenarios |
| 15 | Different-room independence | PASS —4 scenarios, B commit khi A open |
| 16 | Create+Update | PASS —hai thứ tự,4 scenarios |
| 17 | Update+Update | PASS —different/same show,4 scenarios |
| 18 | Cancel+Create | PASS —hai thứ tự,4 scenarios |
| 19 | RoomDelete+Create R1.1 | PASS —10 original harness cases |
| 20 | Stress>=100 | PASS —125 real races |
| 21 | Final committed overlap0 | PASS —per iteration/global disposable/main query |
| 22 | HTTP overlap409 | PASS —real API sequential +parallel |
| 23 | Backend regression | PASS —126/126,0 skip |
| 24 | SQL regression | PASS —49 SQL/14 nested/existing suite/R1.1 |
| 25 | No-SQL backend | PASS —93 files |
| 26 | Không thêm bảng | PASS —27 tables và schema unchanged |
| 27 | Không Node transaction/mutex | PASS —runtime scan; SQL-owned protocol |
| 28 | Evidence thật | PASS —raw SQL/DMV/HTTP/state/backup/metadata |

## 21. Issue ngoài scope chưa sửa

I-06 parent-status/release-window booking/show creation, I-07 promotion policy, I-08 Movie Actor, I-09 historical showtime metadata/R3, complaint/report/auth/dataset/Frontend async các phase sau giữ nguyên. Existing Cancel customer-wide coordination/coarse locks không tối ưu lại trong task này. Vite bundle warning I-24 còn. Không phát hiện committed overlap hoặc Room Delete partial state trong các ca đã chạy.

## 22. Kết luận

**R1.2 DONE.** Create+Create, Update+Create, Update+Update, Cancel+Create và RoomDelete+Create PASS.125 stress race thật, final overlap count0. I-03 resolved, R1.1 preserved. Dừng; không triển khai R2.

Chạy lại với tên DB disposable **mới**, tuần tự:

```powershell
node scripts/db/run.mjs build --database=CinemaBookingDB_R0_R12_Review
node scripts/r12/checks.mjs --database=CinemaBookingDB_R0_R12_Review
```

`checks` chạy cả SQL49/nested14/API41/concurrency26+stress125/R1.1 regression và các suite hiện có. Credentials đọc từ backend/.env, không in/ghi password/token. Core concurrency có thể chạy riêng bằng `database/11_tests/concurrency/showtime-overlap.mjs --database=<disposable>`. Không chạy fixture/concurrency trên main; module-only deployment dùng `scripts/r12/deploy.mjs --database=<target>` sau evidence PASS.
