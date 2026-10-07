# TASK 2 — PHASE R1.1: MANAGER ROOM DELETE ATOMICITY

Kết quả: **R1.1 DONE**, 07/10/2026 (Asia/Saigon). I-02 **RESOLVED R1.1**. Phạm vi triển khai dừng ở room-delete. R0 và raw evidence cũ được giữ nguyên; chưa triển khai R1.2.

## 1. Phân tích implementation trước khi sửa

Đã trace Manager route → authenticate/requireManager/QL_PHONG → controller → service → whitelist/typed procedure client → SP → SQL Server. Admin dùng authenticate/ADMIN/QL_PHONG → cùng gateway. Không có caller xóa qua ORM/raw SQL.

| Câu hỏi bắt buộc | Implementation trước sửa |
| --- | --- |
| 1. Thứ tự DELETE? | Check SUATCHIEU, DELETE GHE, DELETE PHONGCHIEU. |
| 2. Transaction? | Manager không; Admin BEGIN TRAN/COMMIT và rollback trong CATCH. |
| 3. XACT_ABORT? | Cả hai chưa bật. |
| 4. Lock PHONGCHIEU? | Manager không; Admin UPDLOCK/HOLDLOCK trong transaction. |
| 5. Scope Manager từ đâu? | fn_KiemTraQuanLyRapScope dùng PHANCONG_RAP, trạng thái tài khoản/vai trò và khoảng hiệu lực theo fn_HomNay. |
| 6. Tin RapID request? | Không. Service chỉ bind identity và PhongID; SP đọc RapID từ phòng, nhưng chưa khóa. |
| 7. Phòng có suất chiếu? | Manager THROW 50053; Admin THROW 50203, yêu cầu tự đổi trạng thái. |
| 8. Admin khác Manager? | Admin đã có transaction, lock parent, not-found 50202, TRY/CATCH. Manager thiếu các bước này và missing room dễ thành scope403. |
| 9. FK gây partial delete? | FK_SUATCHIEU_Phong chặn DELETE PHONGCHIEU sau khi GHE đã autocommit. FK_CHITIETVE_Ghe có thể chặn xóa ghế lịch sử; FK_GHE_Phong giữ quan hệ ghế/phòng. Tất cả NO ACTION được giữ nguyên. |
| 10. Creator đồng thời? | sp_Manager_Showtime_Create, usp_Admin_Showtime_Create và alias sp_ThemSuatChieu. Các creator chưa có shared room mutex. |

Đã đọc schema/CHECK và hai trigger liên quan: TRG_SuatChieu_KiemTraTrungLich, TRG_ChiTietVe_KiemTraGheDungPhong. Index hiện có IX_SUATCHIEU_Phong_ThoiGian hỗ trợ truy vấn theo phòng; không thêm index/bảng/trigger production.

## 2. Root cause của I-02

Kiểm tra lịch rồi xóa bằng hai statement autocommit không bảo đảm kiểm tra còn đúng khi xóa. Một creator có thể chèn SUATCHIEU sau check; DELETE GHE commit, DELETE PHONGCHIEU lỗi FK. CATCH ở backend không thể hoàn tác statement đã commit. Transaction SQL phải bao trọn cả kiểm tra và hai DELETE.

## 3. Các file đã thay đổi

- SQL: [Manager](../../database/08_procedures/manager/sp_Manager_Room_Delete.sql), [Admin](../../database/08_procedures/admin/usp_Admin_Room_Delete.sql), [migration](../../database/13_migrations/r11_room_delete_atomicity.sql).
- Source manifest/verification: `database/baseline-manifest.json`, `database/12_verify/verify_objects.sql`, cập nhật definition hai module từ DB disposable được dựng bằng source.
- Backend: `managerService.js`, `adminService.js`, `managerController.js`; tests `roomDelete.test.js`, bổ sung code50217 vào coverage Admin.
- Frontend: `ManagerPortal.jsx`, `AdminPortal.jsx`, chỉ dùng Message từ kết quả và refresh list hiện có.
- SQL tests: [delete_atomicity.sql](../../database/11_tests/rooms/delete_atomicity.sql).
- Harness: [room-delete-vs-showtime.mjs](../../database/11_tests/concurrency/room-delete-vs-showtime.mjs), README concurrency.
- Offline tooling: `scripts/r11/{common,sql-tests,api-tests,checks,deploy,main-readonly,audit-status}.mjs`.
- Báo cáo này, `docs/evidence/r11/*`, thông báo cập nhật trong `docs/FULL_SYSTEM_AUDIT.md`. Matrix/evidence R0 gốc không sửa.

## 4. Thay đổi Stored Procedure

Cả hai SP bật XACT_ABORT, mở transaction trong TRY, khóa phòng rồi kiểm tra suất chiếu bằng UPDLOCK/HOLDLOCK. Có bất kỳ SUATCHIEU nào thì UPDATE trạng thái phòng; nếu chưa từng có thì DELETE GHE rồi DELETE PHONGCHIEU. COMMIT trước khi trả result. CATCH rollback nếu XACT_STATE khác0; lỗi FK547/deadlock1205/lock-timeout1222 chuyển thành domain50217, lỗi khác THROW nguyên để middleware trả500 an toàn.

Result gồm `PhongID`, `Deleted`, `Deactivated`, `TrangThai`, `Message`. Historical usage là **success có Deactivated=true, Deleted=false**, không biến thành HTTP409 vì chuyển trạng thái đã thành công. Các mapping history cũ được giữ để tương thích, nhưng hai SP delete mới không còn phát lỗi history đó.

## 5. Transaction và locking protocol

Thứ tự explicit: **PHONGCHIEU → SUATCHIEU → DELETE GHE/PHONGCHIEU hoặc UPDATE PHONGCHIEU → COMMIT**. Không truy cập/khóa order hoặc ticket để xóa lịch sử. Các khóa transaction giữ đến commit/rollback, và check SUATCHIEU là current read ngay cả khi RCSI ON.

UPDLOCK của phòng vẫn tương thích với một số S lock kiểm tra FK của creator; không coi nó là mutex hoàn chỉnh cho mọi thao tác tạo lịch. HOLDLOCK trên range SUATCHIEU bảo vệ khoảng chưa có suất đến commit. Nếu SQL chọn deadlock victim/xảy ra lỗi FK, rollback vẫn phục hồi toàn bộ ghế. Creator/create-vs-create/update overlap là phạm vi R1.2, chưa thay đổi.

Transaction nghiệp vụ chỉ nằm trong SP. Harness/deployment dùng SQL `BEGIN TRAN/COMMIT` trên session riêng để giữ khóa phục vụ kiểm chứng; không dùng `mssql.Transaction`, không có transaction trong backend runtime. Nested harness transaction giữ khóa qua commit của SP; lỗi SP rollback toàn bộ SQL transaction theo pattern yêu cầu.

## 6. Manager scope enforcement

Trong transaction, lấy RapID từ PHONGCHIEU đã khóa; missing room THROW50052 →404 ROOM_NOT_FOUND trước scope. Gọi fn_KiemTraQuanLyRapScope với identity và RapID thật. Scope sai/hết hạn THROW50050 →403 MANAGER_CINEMA_FORBIDDEN, giữ convention hiện có cho ROOM_SCOPE_FORBIDDEN. Role/current-account/permission guards503xx được giữ. RapID/body/query và actor giả từ client không được bind vào SP.

## 7. Historical room behavior

Literal `N'Ngưng hoạt động'` có sẵn trong CHECK và shared contract. Bốn trạng thái SUATCHIEU Mở bán/Đóng bán/Hoàn thành/Đã hủy đều tính là đã sử dụng phòng. Phòng có lịch sử giữ nguyên ghế, suất, order và ticket; chỉ đổi trạng thái phòng. Gọi lại delete trên phòng này tiếp tục trả deactivated thành công, không mất dữ liệu.

## 8. Backend/Frontend thay đổi

Service Manager map result do SQL quyết định, bind hai tham số typed như cũ. Controller trả DTO thực tế thay cho deleted:true cố định. Admin giữ envelope `result`; thêm mapping409 ROOM_DELETE_CONFLICT ở cả hai service. Missing room404, scope403 và unexpected DB500 được phân biệt; client không nhận message SQL thô. Giao diện dùng Message từ SP và reload danh sách/status; không đổi layout/palette/hierarchy.

## 9. SQL tests

[sql-tests.json](r11/sql-tests.json): **20/20 PASS**, kiểm tra before/after state thật:

- Manager/Admin mỗi bên: missing, empty, seats-only, bốn trạng thái suất có order/ticket, lỗi chèn giữa hai DELETE, FK conflict547 được map50217.
- Manager ngoài scope và phân công quá hạn, kể cả bản ghi assignment vẫn ghi Hiệu lực nhưng ngày kết thúc đã qua.
- Trigger test INSTEAD OF DELETE PHONGCHIEU chỉ trên disposable xác nhận GHE đã biến mất trong transaction trước khi phát59801 hoặc gây FK547. Sau SP lỗi, room và đủ ghế được phục hồi, không còn transaction mở.
- So sánh toàn bộ row ghế/suất/order/ticket, không chỉ rowcount/message. Fixture và trigger được dọn; fingerprint27 bảng và metadata trước/sau trùng nhau. Không disable/alter FK, không thêm bảng production.

File này cố ý không nằm trong `db:test` mặc định có thể trỏ DB chính. Runner có guard DB disposable và ghi báo cáo trạng thái; suite SQL hiện có vẫn chạy nguyên vẹn.

## 10. Concurrency test

[concurrency.json](r11/concurrency.json): **10/10 PASS**, DB `CinemaBookingDB_R0_R11_20261007_01`, RCSI ON. Hai session nghiệp vụ SQL thật A=70/B=71; connection quan sát chỉ đọc DMV để xác nhận blocker/wait thực, không giả lập cạnh tranh. Mỗi pairing chạy hai thứ tự:

| Delete / Create | Delete thắng: room/seats/shows | Create thắng: room/seats/shows | Kết quả |
| --- | --- | --- | --- |
| Manager / Manager | 0/0/0 | 1/2/1, phòng Ngưng hoạt động | PASS |
| Manager / Admin | 0/0/0 | 1/2/1, phòng Ngưng hoạt động | PASS |
| Manager / sp_ThemSuatChieu | 0/0/0 | 1/2/1, phòng Ngưng hoạt động | PASS |
| Admin / Manager | 0/0/0 | 1/2/1, phòng Ngưng hoạt động | PASS |
| Admin / Admin | 0/0/0 | 1/2/1, phòng Ngưng hoạt động | PASS |

Ban đầu mỗi fixture có room1/seats2/shows0. Delete thắng: A thực thi SP trong SQL transaction giữ mở; B gọi creator và bị chặn bởi A; DMV xác nhận lock wait; A COMMIT; B lỗi547 FK_SUATCHIEU_Phong; final0/0/0. Create thắng: B chèn suất qua SP thật rồi giữ transaction; A delete bị chặn; B COMMIT; A đọc lịch đã commit, chuyển inactive và COMMIT; final1/2/1, ghế và suất giữ nguyên từng row. JSON chứa timestamps, SPID, lock wait/resource, result/error, initial/final đầy đủ. Mọi session cuối cùng TRANCOUNT0, invariant PASS, fixture cleanup/fingerprint27 bảng PASS.

Deterministic gating chứng minh hai thứ tự hợp lệ và lock interaction của delete-vs-create; không chứng nhận absence deadlock cho mọi workload hay create-vs-create overlap.

## 11. Regression tests

[checks.json](r11/checks.json): tất cả PASS:

| Kiểm tra | Kết quả |
| --- | --- |
| Backend toàn suite | 124/124, 0 skip |
| Frontend toàn suite | 49/49, 0 skip |
| No-SQL backend | PASS, 92 file |
| FE lint/build | PASS; warning bundle hiện có, không đổi phạm vi |
| Procedure contract | PASS, 112 methods/120 calls, missing source0/problems0 |
| SQL regression hiện có | PASS, smoke/timezone/pricing/payment/trigger/integrity/EXECUTE-only |
| SQL verification/source parity | PASS, 159 modules, drift0 |
| Room concurrency | 10/10 PASS |
| REST integration mới | [34 request](r11/api-tests.json), PASS: CRUD phòng tối thiểu, kết quả history, refresh GET, idempotence, spoofed RapID,404/403/409/500/401 |

Không skip/comment test hoặc đổi expected sai để chạy xanh. Lỗi giả lập bất ngờ được log nội bộ; HTTP chỉ trả Internal server error.

## 12. Evidence đã tạo

Evidence raw mới nằm tại [r11/](r11/); các file JSON/log ở mục9–11 chứng minh kết quả chạy thật. Không dùng mock làm chứng cứ concurrency hoặc final state.

[main-migration.json](r11/main-migration.json): COPY_ONLY/CHECKSUM backup, RESTORE VERIFYONLY PASS; migration COMMIT trên CinemaBookingDB. Chỉ sp_Manager_Room_Delete/usp_Admin_Room_Delete thay đổi definition; dữ liệu27 bảng giữ nguyên, columns/keys/FK/CHECK/indexes/triggers/signatures/principals/permissions/memberships giữ nguyên, source parity159 PASS. [migration-replay.json](r11/migration-replay.json) chứng minh apply lại không đổi dữ liệu/schema. [main-readonly.json](r11/main-readonly.json) xác nhận sau deployment dữ liệu vẫn giống snapshot, 27 tables/125 SP/7 triggers, RCSI ON, FK/CHECK enabled/trusted.

DB disposable giữ sẵn để kiểm tra lại; fixture room/show/seat/order/ticket và trigger test đã dọn. R0 baseline/evidence không chạy lại hoặc viết lại. [current-audit-status.json](r11/current-audit-status.json) là cập nhật riêng R1.1: I-02 resolved, QLR-02 PARTIAL; 7 PASS/34 PARTIAL/4 BROKEN trên45 UC; còn22 findings active. Không nâng cả Room CRUD lên PASS dựa trên delete-only evidence.

## 13. Kết quả từng Exit Criteria

| # | Exit criterion | Kết quả / bằng chứng |
| --- | --- | --- |
| 1 | Manager delete transaction đúng | PASS — SQL SP + SQL/REST state |
| 2 | SET XACT_ABORT ON | PASS — hai SP |
| 3 | TRY/CATCH rollback đúng | PASS —59801/FK547 phục hồi đủ dữ liệu |
| 4 | Lock PHONGCHIEU trước resource validation/delete | PASS — parent UPDLOCK/HOLDLOCK rồi missing/scope/history |
| 5 | Scope derive từ room thật | PASS — RapID đọc dưới khóa |
| 6 | Không tin RapID client | PASS — chỉ bind identity/PhongID, REST spoof test |
| 7 | No-history hard delete an toàn | PASS — empty/seats-only/race delete thắng |
| 8 | Historical room không hard delete | PASS — bốn trạng thái + REST idempotence |
| 9 | Seats/room all-or-nothing | PASS — before/after rollback/hard delete |
| 10 | Không partial delete | PASS — failure injection và10 race final state |
| 11 | Admin tương thích lock protocol | PASS — cùng parent→showtime, SQL/Admin races |
| 12 | SQL tests PASS | PASS —20 cases |
| 13 | Manager scope tests PASS | PASS — foreign/expired/spoofed cinema |
| 14 | Two-session delete-vs-create PASS | PASS —10 deterministic races, DMV wait thật |
| 15 | Final-state invariant PASS | PASS —0/0/0 hoặc1/2/1 inactive, từng row ghế giữ nguyên |
| 16 | Backend regression PASS | PASS —124 tests,0 skip |
| 17 | No-SQL backend PASS | PASS —scanner92 files |
| 18 | Không thêm bảng | PASS —schema27 tables giữ nguyên |
| 19 | Không transaction Node.js | PASS —không mssql.Transaction; transaction trong SP/SQL test batches |
| 20 | Có evidence thực tế | PASS —SQL/HTTP/concurrency/migration JSON/log |

## 14. Các issue ngoài scope chưa sửa

I-03/R1.2: create/update suất chiếu cùng phòng chưa serialize chung để bảo đảm không overlapping dưới RCSI. I-06: tạo/đặt suất chưa enforce đầy đủ trạng thái room/cinema/movie; phòng chuyển inactive không đồng nghĩa tự hủy hay ngừng bán suất tương lai. Giữ dữ liệu đúng rule Task2; không sửa booking/showtime lifecycle. I-24 bundle warning vẫn còn. Không phát sinh issue mới cần mở rộng phạm vi.

## 15. Kết luận

**R1.1 DONE.** Room delete all-or-nothing, no partial commit; concurrency thực PASS và có final database state. I-02 resolved; QLR-02 không còn BROKEN vì I-02. Dừng ở Task2, không triển khai R1.2.

Chạy lại trên một DB disposable mới theo convention repo:

```powershell
node scripts/db/run.mjs build --database=CinemaBookingDB_R0_R11_Review
node scripts/r11/sql-tests.mjs --database=CinemaBookingDB_R0_R11_Review
node scripts/r11/api-tests.mjs --database=CinemaBookingDB_R0_R11_Review
node scripts/r11/checks.mjs --database=CinemaBookingDB_R0_R11_Review
```

Các runner dùng backend/.env cho credentials, không in/ghi password; build chỉ dùng tên DB mới. Chạy SQL/HTTP/race tuần tự vì cùng tạo và dọn fixture, tránh chạy song song trên cùng DB. `db:refresh-manifest` chỉ cần khi source module thay đổi; migration có thể chạy lại bằng `scripts/r11/deploy.mjs --database=<target>` sau khi evidence kiểm thử PASS.
