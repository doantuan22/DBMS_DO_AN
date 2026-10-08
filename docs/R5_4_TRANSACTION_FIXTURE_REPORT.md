# R5.4 — Transaction Data Fixture

```text
R5.4 SOURCE IMPLEMENTATION: DONE
LIVE SQL VERIFICATION: NOT RUN
```

Fixture source đáp ứng matrix theo contract hiện hành, chưa có blocker logic đã
biết. Static checks 9/9, Backend 191/191 và No-SQL PASS. Chưa compile hoặc chạy
fixture trên SQL Server: chưa xác nhận disposable target hiện hữu an toàn. Số
lượng bản ghi trong báo cáo là **dự kiến theo source**, không phải runtime evidence.

## A. Audit và hiện trạng

Đã đối chiếu task R5.4 trong [roadmap](../ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md),
[R5.1](R5_1_SEED_REPORT.md), [R5.2](R5_2_BASE_SEED_REPORT.md),
[R5.3](R5_3_DYNAMIC_SHOWTIME_REPORT.md), evidence trước đó và source hiện tại.
Các thay đổi R5.1–R5.3 vẫn chưa commit tại thời điểm bắt đầu, được giữ nguyên.
[audit-before.json](evidence/r54/audit-before.json) chụp 826 file protected và hash
của expanded seed/build/reset trước khi viết matrix/fixture. README test_fixture
là file hiện hữu duy nhất được phép sửa trong R5.4.

Trước R5.4 chưa có canonical transaction SQL trong `test_fixture/`; chỉ có inventory.
Base đã cung cấp actors/RBAC, profiles, 3 rạp/6 phòng/240 ghế, 5 products, giá và
promotion; Dynamic có 8 past + 24 future shows từ DB clock. Past show tự nó chưa
tạo eligible-review history. Seed/build/reset không gọi transaction fixture.

Audit transaction tables: DONDATVE, CHITIETVE, CHITIETDOAN, THANHTOAN, DANHGIAPHIM,
KHIEUNAI, XULY_KHIEUNAI, BOITHUONG_HUYSUAT. Đã đọc kiểu dữ liệu/identity/nullability,
FK, UNIQUE, CHECK, default; ticket room/conflict, review eligibility và hai complaint
processing triggers. Contract/call sites đối chiếu thực tế nằm trong
[contracts.json](evidence/r54/contracts.json).

| Contract hiện hành | Tác động tới fixture |
|---|---|
| Booking_Create: active customer + DAT_VE, IsBookable, ghế đúng room/không conflict, 5 phút hold, giá/food/promo do SQL | Năm đơn live gọi SP; pending tạo cuối; không kéo dài hold |
| Payment_CreateAttempt/UpdateResult: ownership, pending/live hold, future Mở bán, snapshot amount, final result không flip | Failed attempt riêng rồi new successful attempt trên cùng order; giữ đủ payment history |
| Order_ExpirePending / Order_Cancel | Expired chỉ aging NgayDat/HanGiuCho rồi gọi expiry; canceled gọi SP; quota và ticket được lifecycle giải phóng |
| Showtime_CancelCascade: actor quyền hợp lệ, future show, chặn active pending hold | Paid compensation trên show khác, Admin cancel, không bypass hold protection |
| BOITHUONG_HUYSUAT: unique order, helper proportional net ticket → FLOOR điểm | SP ghi ledger và cộng điểm; assert helper + delta; gọi lại không double-credit, không refund |
| Review_Create + review trigger: unique customer/movie, paid/completed history + start đã qua | Controlled paid history đầy đủ order/ticket/payment rồi tạo review bằng SP; negative input rollback riêng |
| Complaint_Create: linked order phải owned; NULL order hợp lệ | Hai unlinked, ba linked order của đúng customer |
| Support AddProcessing/UpdateStatus: active CSKH/Admin, cả QL_KHIEUNAI và XULY_KHIEUNAI | History tạo qua SP; parent do trigger chọn XuLyID lớn nhất; không tự UPDATE parent |

Các helper cũ đã đối chiếu: [r21](../scripts/r21/fixtures.mjs),
[r33](../scripts/r33/fixtures.mjs), [r47](../scripts/r47/fixtures.mjs),
[SQL smoke](../database/11_tests/procedures/smoke.sql) và
[compensation tests](../database/11_tests/payment/compensation.sql).
Tái sử dụng cách gọi SP/capture identity và controlled historical pattern. Các helper
JavaScript gắn private catalog/cleanup/runner của suite cũ; không import chúng để tạo
canonical SQL. Legacy fixture được giữ nguyên, không sao chép catalog hay fault DDL.

## B. Fixture Matrix và dependency

[Fixture Matrix](../database/10_seed/test_fixture/fixture-matrix.md) được viết
**trước implementation SQL**, bao gồm mục tiêu, dependency, expected assertion và
isolation của 16 scenario. Bộ tối thiểu:

| Fixture | Actor / trạng thái cuối | Ticket / food lines / payment attempts | Dependency chính |
|---|---|---|---|
| R54-O-EXPIRED | Customer 1 / Hết hạn | 1 / 1 / 0 | First future show, A1, CHAOBANMOI → expiry |
| R54-O-CANCELED | Customer 1 / Đã hủy | 1 / 1 / 0 | Cùng show, A2, CHAOBANMOI → customer cancel |
| R54-O-PAID | Customer 1 / Đã thanh toán | 1 / 1 / 2 (failed + success) | Cùng show, A3, CHAOBANMOI → retry |
| R54-O-COMPENSATED | Customer 3 / Đã hủy sau Paid | 2 / 2 / 1 success | Future show khác, A1/A2, CHAOBANMOI → Admin cancel |
| R54-O-HISTORY | Customer 1 / Đã thanh toán | 1 / 0 / 1 success | Latest completed past show, đúng room A1 → eligible review |
| R54-O-PENDING | Customer 2 / Chờ thanh toán | 1 / 0 / 0 | A1 đã được expiry giải phóng; tạo cuối |

Tổng: 6 orders, 7 tickets, 5 food lines, 4 payment attempts (1 failed + 3 success),
1 review, 1 compensation. Food quantity mỗi dòng là 1; nhiều product là hai dòng
khác product, không duplicate order/product.

| Complaint | Linked order | Trạng thái cuối | Processing events |
|---|---|---|---|
| R54-C-NEW | NULL, Customer 1 | Mới | 0 |
| R54-C-PROCESSING | Paid/retry của Customer 1 | Đang xử lý | 1 CSKH |
| R54-C-RESOLVED | History của Customer 1 | Đã giải quyết | 2 CSKH |
| R54-C-CLOSED | Compensated của Customer 3 | Đã đóng | 2 CSKH + 1 Admin |
| R54-C-REJECTED | NULL, Customer 2 | Từ chối | 1 CSKH |

Tổng 5 complaints/7 events; đúng ownership và latest XuLyID. Negative probes:
Customer 4 review cùng movie nhưng không có paid history → 50004;
Customer 1 duplicate review → 50040; Customer 4 complaint với order Customer 1 → 50041.
Đây là input qua SP rồi rollback, không có invalid persisted review/complaint.

Completed order / Used ticket: **NOT APPLICABLE cho workflow**. CHECK có state này,
nhưng chưa có SP hoàn tất/check-in; [order detail contract](contracts/ORDER_DETAIL_READ_ONLY.md)
xác nhận schema state không triển khai workflow mới. Review rule nhận paid history;
fixture giữ historical order Paid/ticket Đã đặt hợp lệ. Không phát minh transition.
Refund cũng N/A: cancel hiện hành là point compensation, giữ success payment.

Dependency lấy theo email của seed actors, bookable view và past show từ DB now,
room + A1/A2/A3, seed product ID 1/2 đã kiểm tồn tại/active, promo business key
CHAOBANMOI. Mọi transaction identity capture OUTPUT/SCOPE_IDENTITY hoặc complaint
title/customer key trong target trống. Không giả định identity kế tiếp hay dùng
lịch sử main database.

## C. Triển khai, tiền và thời gian

- [transaction-fixture.sql](../database/10_seed/test_fixture/transaction-fixture.sql):
  setup + assertion + default rollback, opt-in commit trong một outer transaction.
- [negative-probes.sql](../database/10_seed/test_fixture/negative-probes.sql):
  ba case độc lập trên positive fixture đã commit; snapshot review/complaint trước/sau
  rollback, assertion đúng error code và không leak transaction.
- [README](../database/10_seed/test_fixture/README.md): prerequisites, cách gọi thủ công,
  lifecycle N/A, persist/rollback và lifetime của pending.
- [checks.mjs](../scripts/r54/checks.mjs): offline source/contract checks, không DB call.

Normal booking/pay/expiry/cancel/review/complaint dùng SP hiện hữu. Ngoại lệ controlled
history: Booking/Payment SP từ chối suất past nên INSERT đúng ba bảng order/ticket/payment
với constraints/triggers bật; giá ticket gọi fn_TinhGiaVe; payment amount SELECT từ
order snapshot, unique ticket/payment reference NEWID. Ngày đặt = show start −1 giờ,
attempt = đặt +1 phút, settlement = đặt +2 phút; guard account creation ≤ order,
settlement < start, end < review. Điểm historical payment cộng bằng SQL CONVERT(INT,
SoTien/1000), cùng công thức Payment_UpdateResult. Không sửa giờ hoặc state show để
gọi SP live cho quá khứ. Expiry aging chỉ đổi hai timestamp fixture có kiểm soát.

Money assertion đối chiếu snapshot trước/sau lifecycle; SUM ticket price và food
quantity*DonGia bằng order totals; payment amount = tickets + food − discount;
discount đúng cap helper và total dương. Giá không hardcode, không tính authoritative
amount bằng Backend/JavaScript. Points giữ seed offsets rồi cộng mỗi successful
payment một lần và ledger compensation; quota giữ đúng một Paid promo usage cuối.
Compensation assertion dùng fn_TinhBoiThuongVe, một ledger, delta profile; cancel
lần hai giữ nguyên payment/ledger/points/quota. Snapshot success không bị đổi sang refund.

Timeline assertion bao gồm account/order/payment/show/review và complaint/event;
event NgayXuLy không trước complaint và không đảo thứ tự XuLyID. Seat assertion
giữ canceled expired ticket A1 rồi cho Pending reuse A1, đúng room, không hai active
tickets chiếm cùng show/seat theo fn_DonDangGiuGhe. Exact expected row counts và
trạng thái mỗi case được kiểm tra trước commit/rollback.

## D. Isolation và cách gọi

Chỉ chấp nhận current DB là CinemaBookingDB_Test hoặc CinemaBookingDB_R0_* và
SESSION_CONTEXT R54DisposableTarget khớp chính xác DB_NAME; caller đã xác nhận target
disposable hiện hữu, có current base/dynamic và bảng giao dịch trống. Kiểm FK/CHECK
trusted + triggers enabled trước setup. Có dữ liệu cũ thì fail, không delete/repair.
Không có USE main, create/drop/reset, persistent helper tables hoặc runner command mới.

SQL mặc định rollback; R54PersistFixtures=1 mới commit positive dataset. Negative
probes cần dataset đã commit, mỗi case rollback riêng vì review trigger error dưới
XACT_ABORT có thể làm transaction uncommittable. Source output gồm mapping fixture
ID/business IDs để caller đọc; ID từ lần rollback không tồn tại sau đó. Identity có
thể tăng dù rollback. Theo [README](../database/10_seed/test_fixture/README.md), gọi
thủ công bằng SQLCMD include trong cùng connection đã xác nhận, từ database directory.

Pending tạo cuối và phải còn hold hiệu lực ở assertion; sau commit hết hạn tự nhiên
theo deadline 5 phút. Dataset không cam kết pending vĩnh viễn. Target không chạy
writer/job đồng thời. Rerun trên committed dataset bị từ chối; cleanup/rebuild
orchestration thuộc R5.5 và chưa triển khai.

## E. Verification và evidence

| Kiểm chứng đã chạy | Kết quả | Evidence |
|---|---|---|
| node scripts/r54/checks.mjs | 9/9 STATIC PASS | [checks.json](evidence/r54/checks.json), [log](evidence/r54/checks.txt) |
| node --check scripts/r54/checks.mjs | PASS | [verification.json](evidence/r54/verification.json) |
| npm.cmd --prefix backend test | 191/191 PASS, 0 fail/skipped | [backend.txt](evidence/r54/backend.txt) |
| node scripts/audit-no-sql.mjs | PASS, 101 files | [no-sql.txt](evidence/r54/no-sql.txt) |
| git diff --check, tài liệu link và new-file whitespace | PASS | [verification.json](evidence/r54/verification.json) |
| SQL compilation / fixture runtime / monetary assertions | NOT RUN | Chưa có target an toàn đã xác nhận |
| HTTP / frontend / 45 UC integration | NOT RUN trong R5.4 | Backend/frontend production source giữ nguyên; R6/R7 chưa thực hiện |

Static checker kiểm hash 826 file, expanded entries, guards/default rollback, toàn
bộ dbo references, 28 main SP calls + 3 negative calls với signature/required/OUTPUT/
variable types/literal bounds; direct history INSERT columns/identity; matrix enums/
counts, DB clock và các predicate assertion. Source lexical check chỉ kiểm literal,
parentheses, TRY/CATCH boundaries, **không phải T-SQL compiler** hoặc tiền runtime.
Đọc [contracts.json](evidence/r54/contracts.json) để xem binding tới source thực tế.

Backend suite và No-SQL scan chạy offline, không được quy thành SQL integration PASS.
PowerShell chặn launcher npm.ps1 do execution policy; dùng npm.cmd để chạy đầy đủ suite,
không thay policy. Old evidence R5.1–R5.3 không overwrite hay chạy lại như snapshot mới;
hash bảo toàn source/evidence của các phase đó. Chỉ mới README fixture là existing edit;
seed-base, dynamic SQL, schema/module, runner và Backend/Frontend/API không đổi từ
snapshot đầu R5.4.

## F. Vấn đề còn lại và trạng thái

| Vấn đề / giới hạn | Tác động | Nơi xử lý |
|---|---|---|
| Chưa xác nhận existing disposable DB an toàn | Compile/runtime, trigger outcome, money, quota, compensation chưa được kiểm thật | Khi có target được xác nhận; target/rebuild pipeline thuộc R5.5 |
| Seed timestamp cũ hoặc show/promotion không còn đủ bookable | Fixture fail precondition, không sửa canonical seed hay kéo dài thời gian | Chuẩn bị target current theo R5.5 |
| Account được tạo sau historical order dự kiến | Fail guard, không tạo timeline bất khả thi | Baseline/time tương thích trên test target; không bypass account date |
| Completed/Used/refund thiếu workflow hiện hành | N/A, không chặn các lifecycle fixture được hỗ trợ | Business feature task riêng nếu được giao |
| Pending sau commit chỉ tồn tại tới deadline thật | Read/test phải biết time window; expiry job có thể chuyển state | Caller test có chủ đích; không đổi lifecycle |
| Không cleanup/rerun persistent dataset | Cần target trống; rollback mặc định dùng được lại dù identity tăng | R5.5 orchestration riêng |

Definition of Done source: audit + matrix trước SQL, supported orders/tickets, food
0/1/many, retry payment, eligible/negative review, linked/unlinked complaint + history,
real cancellation/compensation đều đã có source. Không có FK/UNIQUE/CHECK/lifecycle
hoặc monetary inconsistency đã biết theo audit. Checks/regression an toàn PASS, evidence
và hướng dẫn đầy đủ; R0–R5.3 được bảo toàn. Live SQL còn NOT RUN, chưa tuyên bố SQL
INTEGRATION PASS. Không tự chuyển sang R5.5/R6/R7.
