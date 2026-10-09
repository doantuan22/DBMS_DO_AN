# R6 Group B — Checkpoint A / inspection

Khảo sát ngày 2026-10-09, trước khi viết runner Nhóm B. Phạm vi chỉ R6.4–R6.7. Working tree ban đầu sạch; Nhóm A đã có acceptance PASS 26/26, không có production fix.

## Contract và implementation

- Runtime Express → validator → middleware role/permission → service → typed stored-procedure client `.execute()`. SQL trực tiếp chỉ được dùng trong offline fixture/verification.
- Showtime Update Manager/Admin không nhận `PhongID`/`roomId`. Validator từ chối trường lạ 400 `UNKNOWN_REQUEST_FIELD`; SQL từ chối tham số không tồn tại. Không triển khai chuyển phòng.
- Bất kỳ DONDATVE nào đều khóa tuple PhimID/start/end/format/base price: SQL 50120 → 409 `SHOWTIME_HAS_ORDERS`. Noop và đóng bán còn hợp lệ; cancel dùng cascade hiện có.
- Bất kỳ CHITIETVE nào đều khóa LoaiGhe: SQL 50207 → 409 `SEAT_HAS_TICKET_HISTORY`. Trạng thái vận hành còn phụ thuộc guard vé hiệu lực tương lai.
- `fn_KiemTraQuanLyRapScope` kiểm tra account/role, PHANCONG_RAP, ngày SQL `fn_HomNay()` và trạng thái assignment. SP suy ra RapID từ resource thực; foreign/expired/revoked → 50050 / 403 `MANAGER_CINEMA_FORBIDDEN`.
- Room Delete Manager/Admin: XACT_ABORT, TRY/CATCH, transaction, parent PHONGCHIEU `UPDLOCK,HOLDLOCK`, range SUATCHIEU. Không có suất: xóa ghế rồi phòng cùng transaction. Đã có suất bất kỳ trạng thái: HTTP 200, Deleted=false, Deactivated=true, phòng `Ngưng hoạt động`, giữ dependencies. Đây là policy đã chấp nhận của R1.1.
- Create/Update/Cancel serialize trên PHONGCHIEU trước SUATCHIEU; cascade giữ thứ tự room → show → order → ticket. Check overlap dùng committed-read dưới RCSI. Chỉ `Đã hủy` loại khỏi overlap; `Đóng bán`/`Hoàn thành` vẫn chiếm lịch. Trigger bổ sung set-based vẫn enabled.
- Error mapping hiện có: overlap SQL 50001 → HTTP 409 `SHOWTIME_OVERLAP`; FK/deadlock/timeout room-delete → 409 `ROOM_DELETE_CONFLICT`; lỗi bất ngờ → 500 message an toàn.

## Baseline và an toàn dữ liệu

Read-only R5.5 preflight đã xác nhận instance `DESKTOP-E67DPCV`, target mới **chưa tồn tại** `CinemaBookingDB_R0_R6B_20261009_01`, đường dẫn MDF/LDF riêng; evidence `docs/evidence/r55/runs/2026-10-09T11-51-41-980Z-38207fdc`. Tạo DB riêng bằng canonical build đã có, không reset DB cũ. Sau build phải preflight lại GUID/files/token, kiểm tra 159 module, 27 bảng, RCSI ON, seed-only trước mỗi run. So sánh fingerprints toàn DB test và DB chính trước/sau, cùng hash toàn bộ evidence cũ.

## Ma trận kiểm thử đã đối chiếu trước implementation

| Phase / ID | Test có sẵn / phần bổ sung | Assertion cần chạy thật |
|---|---|---|
| R6.4 monetary | R3.2 SQL + API, mỗi bộ 2 monetary regressions | Booking/payment thật, đổi pricing và product, đọc lại cùng order; ticket/food/order/payment snapshots bất biến; catalog thay đổi thật |
| R6.4 show/seat history | `scripts/r32/{sql-tests,api-tests,transaction-tests}.mjs` | 108 SQL cases, 82 HTTP cases, 8 caller cases; history mọi trạng thái, positive unused, operational states, scope/role, unsupported room, rollback |
| R6.5-01/02 | Bổ sung HTTP matrix trên API hiện có | Assigned/foreign cinema list/read; exact error, không lộ foreign data |
| R6.5-03/04 | Bổ sung assignment fixture, restore chính xác | Login thật trước khi expire/revoke assignment; request mới phải bị từ chối, full DB fingerprint không đổi |
| R6.5-05/06 | R1.1 đã có delete scope; bổ sung room read/update | Assigned success persisted, foreign deny; spoof allowed RapID query với actual foreign room |
| R6.5-07/08 | R3.2 đã có foreign updates; bổ sung read/create/update/cancel scope | Indirect room/seat/show resource; exact domain errors, allowed controls, wrong role/live permission |
| R6.6 functional | `scripts/r11/{sql-tests,api-tests}.mjs` | 20 SQL cases + REST states; missing/empty/seats/history/foreign, hai role, injected failure + FK rollback |
| R6.6 race / R6.7-07 | `database/11_tests/concurrency/room-delete-vs-showtime.mjs` | 10 races, independent sessions, actual DMV LCK wait, hai thứ tự commit, parent/dependencies nguyên vẹn |
| R6.7-01..06/09 | `database/11_tests/concurrency/showtime-overlap.mjs` + R1.2 API | 26 gated scenarios + 125 stress (100 gated/25 simultaneous); real lock waits, different-room independent commit, final overlap=0 |
| R6.7-08/09 | `scripts/r12/sql-tests.mjs` | 49 SQL cases, multi-row trigger, adjacency; all non-canceled statuses |
| R6.7-10 | `scripts/r12/nested-tests.mjs` | 14 caller/savepoint/rollback cases; reuse documented R3.2 fixture adaptation for Update's post-write fault |
| Final F | Chạy lại toàn bộ B–E trên seed restored | Backend tests, no-SQL audit, 159 module parity, enabled/trusted constraints, cleanup, main/evidence preservation |

Runner mới chỉ đổi nơi lưu evidence, bind test-target guard và redact secrets; không thay assertion/source/evidence cũ. Nếu fault injection Update cần adaptation, dùng đúng adaptation đã chấp nhận ở `scripts/r32/r1-regression.mjs`, không sửa production. Các counts ở đây là coverage kế hoạch từ source cũ; kết quả cuối lấy từ execution mới.

## Checkpoints

A: inspection này + preflight/build/baseline. B: historical. C: scope. D: room-delete. E: showtime concurrency. F: full replay B–E + integrity/regression/report. Mọi run có thư mục timestamp riêng; failed attempt nếu có vẫn giữ. Chỉ production defect đã reproduce mới được sửa; không chạy R6.8+.
