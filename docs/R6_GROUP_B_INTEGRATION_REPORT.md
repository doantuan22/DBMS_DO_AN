# R6 Group B — Database & Backend Integration Verification

**Group B: DONE.** Chỉ R6.4–R6.7; không triển khai R6.8+. Final verification: **498/498 PASS**, FAIL=0, BLOCKED=0, 380 request HTTP thật; backend **191/191**, no-SQL audit PASS. Không phát hiện production defect, không sửa production code.

## A. Implementation Summary

Khảo sát roadmap, [ma trận Checkpoint A](R6_GROUP_B_INSPECTION.md), baseline/canonical build, Express routes/validators/middleware/services/procedure bindings, Manager scope function, Manager/Admin Show/Seat Update, Room Delete, cancel cascade, time/overlap validator và trigger set-based. Working tree ban đầu sạch, Group A acceptance giữ nguyên.

Tái sử dụng R3.2 SQL/API/transaction/historical concurrency và R1.1/R1.2 SQL/API/nested/concurrency; giữ nguyên source và assertion. Runner mới chỉ guard database thật, redirect evidence vào thư mục mới, resolve import và ghi trace HTTP đã redact. Nested Update dùng đúng fixture adaptation R3.2 đã chấp nhận: fault sau UPDATE thay vì public detail reader; cả 14 assertion giữ nguyên, bốn module khôi phục.

Bổ sung [8 Manager scope scenarios](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/scope/scope.json) cho expired/revoked assignment sau login, direct/indirect resource, spoof RapID, role và live permission; thêm [8 overlap cases với Đóng bán/Hoàn thành](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/status-overlap/status-overlap.json). Fixture/setup/verification dùng SQL trực tiếp offline; backend runtime tiếp tục stored-procedure-only.

File mới: scripts/r6-group-b/{common,run,scope,status-overlap,report}.mjs và README; inspection/report; database build inventory và evidence mới trong R5.5/R6B. Không đổi backend/frontend/shared, canonical SQL/schema/seed/manifest, test source hay evidence cũ.

Một **lỗi fixture**, đã giải quyết: attempt [2026-10-09T11-58-18-786Z-315d5993](evidence/r6-group-b/runs/2026-10-09T11-58-18-786Z-315d5993/result.json) có 8/8 business scope scenarios PASS nhưng cleanup FAIL vì INSERT restore quyền bỏ cột NgayGan và dùng default timestamp. Sửa offline restore để truyền đầy đủ NgayGan; [recovery](evidence/r6-group-b/recovery-permission-fixture.json) chứng minh toàn bộ DB khớp fingerprint trước attempt. Hai lần full replay sau đó dùng fixture độc lập và cleanup PASS. Không xóa/sửa failed evidence.

## B. Verification Matrix

Đếm **assertion group/scenario/race round thực thi** trong final run, không đếm số request thành scenario. R6.4 gồm 108 SQL cases + 2 monetary + 4 injected rollback + 1 native precision + 1 outer transaction; 82 API cases + 2 monetary; 8 caller cases; 20 historical races. R6.6 gồm 20 SQL cases, 7 REST state groups, 10 races. R6.7 gồm 49 SQL cases, 3 REST state groups, 14 nested cases, 8 status cases, 26 races và 125 stress rounds. R6.5 là đúng 8 ID, 47 HTTP requests. R6.7-07 tham chiếu cùng 10 room races của R6.6, không đếm lại.

| Phase | PASS | FAIL | BLOCKED | Status |
|---|---:|---:|---:|---|
| R6.4 | 228 | 0 | 0 | DONE |
| R6.5 | 8 | 0 | 0 | DONE |
| R6.6 | 37 | 0 | 0 | DONE |
| R6.7 | 225 | 0 | 0 | DONE |
| **GROUP B** | **498** | **0** | **0** | **DONE** |

[Machine acceptance](evidence/r6-group-b/acceptance.json), [per-case IDs/input/expected/actual/SQL assertion/cleanup index](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json), [final run](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/result.json). Hai full passing runs: Checkpoints B–E **2026-10-09T12-00-17-510Z-fe3ddabb**, Final F **2026-10-09T12-02-23-892Z-64ec76fa**; tổng 996 PASS units, 760 HTTP requests. Các số bảng là final acceptance, không che attempt fixture thất bại đã ghi ở A.

## C. Database Integrity Results

- **Money PASS:** tạo booking, payment attempt/result thành công qua API/SP thật; pricing 15000→45000 và product 10000→40000 thay đổi persisted. Giá vé cũ 95000, đơn giá food 10000, payment/order total 199000 cùng discount/ticket/food/order snapshots không đổi khi đọc lại cùng order; giá vé catalog hiện tại 125000. Product name đọc label hiện tại đúng policy.
- **Show history PASS:** mọi trạng thái order (pending, paid, canceled, expired, completed, refunded, pending hết hold) đều khóa movie/start/end/format/base-price; 409 SHOWTIME_HAS_ORDERS / SQL50120, trạng thái và monetary data không bị side effect. Room binding không có trong SP; API roomId →400 UNKNOWN_REQUEST_FIELD, SQL unsupported parameter bị từ chối. Unused controls, noop, đóng bán và cancellation contract còn hoạt động.
- **Seat history PASS:** kể cả vé canceled/used vẫn khóa type; 409 SEAT_HAS_TICKET_HISTORY / SQL50207. Positive unused type, trạng thái hoạt động/bảo trì/hỏng với canceled history, used noop hoạt động; guard vé hiệu lực tương lai vẫn giữ.
- **Scope PASS:** resource thực quyết định cinema, kể cả query RapID hợp lệ/actor spoof. Expired assignment vẫn Hiệu lực nhưng ngày đã hết và revoked status Đã hủy đều mất scope ngay sau login; token cũ không bypass. Foreign →403 MANAGER_CINEMA_FORBIDDEN; customer →403 MANAGER_REQUIRED; thiếu permission mới →403 FORBIDDEN. Mỗi denied request so sánh toàn bộ table/metadata fingerprint trước/sau.
- **Room atomicity PASS:** missing404 ROOM_NOT_FOUND; empty/seats-only hard-delete; historical dependencies bất kỳ status được giữ. Create commit trước →delete **200 Deleted=false/Deactivated=true**, phòng Ngưng hoạt động, ghế/suất nguyên vẹn; đây là policy R1.1 hiện hành. Delete commit trước →creator không commit (SQL50056); không có room còn/show tồn tại nhưng mất ghế. Unexpected fault sau seat-delete rollback an toàn; FK fault →409 ROOM_DELETE_CONFLICT.
- **Overlap/transactions PASS:** mọi status trừ Đã hủy chiếm lịch; final active overlap=0. Boundary end==start hợp lệ. Multi-row trigger reject toàn statement khi overlap, accept adjacency/canceled rows. Caller success/committable fault giữ @@TRANCOUNT=1/XACT_STATE=1 và chỉ rollback phần procedure; doomed error rollback toàn transaction, trạng thái cuối 0/0.

Target riêng **CinemaBookingDB_R0_R6B_20261009_01**, SQL Server **DESKTOP-E67DPCV**, version 17.0.1000.7, RCSI=ON; actual GUID và MDF/LDF trong preflight/result. Build từ canonical source qua R5.5, không reset DB có sẵn. Cả 27 table data fingerprints và metadata khớp trước/sau từng suite và cả run; 159 module source parity PASS; transaction tables seed-only rỗng sau cleanup. Không FK/check untrusted/disabled, không trigger disabled; overlap trigger enabled. DB test giữ lại để review, identity counters tăng theo fixture inserts; dữ liệu seed và definitions không thay đổi.

DB chính CinemaBookingDB chỉ đọc: before/after fingerprints giống nhau ở build và cả ba attempts. **931 evidence files cũ** có SHA256 không đổi qua replay (bao gồm Group A). [Final integrity/preservation](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/result.json).

## D. Concurrency Evidence

| Concurrent scenario | Final runs | SQL overlap / outcome / persisted invariant | Evidence |
|---|---:|---|---|
| Booking vs historical show/seat/movie update | 20 | SPID độc lập; DMV LCK waits + resource/index locks; COMMIT/ROLLBACK hai thứ tự, revalidate snapshot/history, không drift | [historical races](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-concurrency/historical-concurrency.json) |
| Room Delete vs Create (R6.6 / R6.7-07) | 10 | Manager/Admin/alias, hai thứ tự thắng; LCK wait trên transaction mở thật; delete trước room/seats/show=[] hoặc create trước room deactivated/seats/show giữ nguyên | [room races](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-concurrency/concurrency.json) |
| Showtime create/update/cancel matrix | 26 | 22 same-room gated waits; 4 different-room writers commit trong khi A vẫn mở; final overlap=0, session 0/0 | [showtime races](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-concurrency/concurrency.json) |
| Overlap stress | 125 | 100 actual SQL gated lock waits + 25 simultaneous real SP races; mỗi round đúng 1 success/1 SQL50001, final 1 show/overlap=0 | [stress timeline](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-concurrency/concurrency.json) |

Mỗi evidence có contender input/procedure/actor, distinct SQL session IDs, timestamp timeline, wait/blocker và commit/rollback outcome, persisted state, cleanup. Tổng 152 deterministic actual lock waits + 4 independent commits mỗi full run. 25 simultaneous rounds có DMV sampling khi bắt được; không dùng Promise.all hoặc thời gian response làm bằng chứng lock bắt buộc. Parent barrier nằm ở SQL transaction, không có JS mutex. Hai full runs đều đạt ≥100 stress, không benchmark.

| R6.7 ID | Coverage |
|---|---|
| 01 | overlap create/create Manager/Admin/alias, 6 gated scenarios +125 stress |
| 02 | same room non_overlap, 4 role pairings, cả hai commit |
| 03 | different_rooms, 4 role pairings, independent commit |
| 04 | create_update và update_create, hai thứ tự Manager/Admin |
| 05 | update_update và same_show_updates, hai thứ tự Manager/Admin |
| 06 | cancel_create và create_cancel, cancellation/final states đúng contract |
| 07 | 10 room delete/create races của R6.6 |
| 08 | R1.2 multirow_overlap/multirow_clear/multirow_cancelled, enabled trigger |
| 09 | SQL/API boundary +4 non_overlap races, end==start |
| 10 | 14 R1.2 nested transaction/savepoint cases |

## E. Regression Results

| Suite | PASS groups/rounds | HTTP requests | Evidence |
|---|---:|---:|---|
| r32-sql | 108 + 2 monetary + 4 rollback + 1 precision + 1 outer transaction | 0 | [PASS](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json) |
| r32-api | 82 + 2 monetary | 240 | [PASS](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-api/api-tests.json) |
| r32-transactions | 8 | 0 | [PASS](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-transactions/transaction-tests.json) |
| r32-concurrency | 20 | 0 | [PASS](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-concurrency/historical-concurrency.json) |
| scope | 8 | 47 | [PASS](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/scope/scope.json) |
| r11-sql | 20 | 0 | [PASS](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-sql/sql-tests.json) |
| r11-api | 7 | 34 | [PASS](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-api/api-tests.json) |
| r11-concurrency | 10 | 0 | [PASS](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-concurrency/concurrency.json) |
| r12-sql | 49 | 0 | [PASS](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-sql/sql-tests.json) |
| r12-api | 3 | 41 | [PASS](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-api/api-tests.json) |
| r12-nested | 14 | 0 | [PASS](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-nested/nested-tests.json) |
| status-overlap | 8 | 18 | [PASS](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/status-overlap/status-overlap.json) |
| r12-concurrency | 26 + 125 stress | 0 | [PASS](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-concurrency/concurrency.json) |

Backend 191/191, skipped=0: [log](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/backend.log); stored-procedure-only runtime [no-SQL audit](evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/no-sql.log) PASS. All 159 modules match canonical source after every suite. Không production fix ảnh hưởng booking/payment, do đó không cần full Group A rerun theo yêu cầu; Group A evidence/source vẫn nguyên. Monetary booking/payment integration được chạy lại thực tế trong R3.2 replay.

## F. Outstanding Issues

Không có material defect, blocker, FAIL hoặc test chưa chạy trong R6.4–R6.7 sau fix fixture. Failed attempt giữ nguyên và đã có recovery/regression. Verification dùng Express in-process listen localhost với middleware/services/SQL Server thật và offline DMV sessions; SQL account là cấu hình local hiện có, không phải least-privilege deployment verification. Không chạy scheduler/background process hay UI/browser; không nằm trong matrix Nhóm B. Không triển khai R6.8+, không đổi business scope/lock mechanism.

## G. Final Conclusion

R6.4 **DONE** · R6.5 **DONE** · R6.6 **DONE** · R6.7 **DONE** · **Group B DONE**. Historical integrity, scope isolation, atomicity, concurrency/rollback và regressions đều được xác nhận bằng persisted SQL Server/Backend evidence mới. Dừng tại R6.7.
