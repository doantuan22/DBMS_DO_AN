# test_fixture — canonical R5.4 và danh mục hiện có

## Canonical Transaction Fixture R5.4

[Fixture Matrix](fixture-matrix.md) được lập trước implementation và mô tả dependency,
trạng thái hỗ trợ/N/A, timeline và isolation cho từng scenario.
[transaction-fixture.sql](transaction-fixture.sql) tạo bộ tối thiểu và tự assertion:
6 orders, 7 tickets, 5 food lines, 4 payments (1 failed + 3 success), 1 eligible review,
5 complaints, 7 processing events, 1 compensation. Đây là **số lượng dự kiến theo
source**, chưa phải kết quả chạy SQL. [negative-probes.sql](negative-probes.sql)
gọi ba input bị từ chối (không đủ điều kiện review, duplicate review, foreign order);
mỗi case có transaction rollback riêng và kiểm tra history không đổi.

Điều kiện chạy thủ công: database disposable **đã tồn tại và được xác nhận an toàn**,
đã có Base/Dynamic Seed hiện hành, 32 shows (8 past + 24 bookable future), mọi bảng
giao dịch trống, FK/CHECK trusted và trigger bật. Tên được chấp nhận là
`CinemaBookingDB_Test` hoặc `CinemaBookingDB_R0_*`; session context phải khớp chính
xác database hiện tại. Không chạy trên `CinemaBookingDB`. Không chạy Backend/job
writer đồng thời với fixture. SQL từ chối precondition sai, không xóa dữ liệu để
chạy lại, không sửa source SP/seed để vượt guard.

Ví dụ **chỉ sau khi target đã được xác nhận**, mở SSMS SQLCMD mode hoặc sqlcmd kết
nối đúng target, đặt working directory là `database/`, chạy trong **cùng session**:

```sql
-- Thay bằng tên database disposable đã xác nhận, phải bằng DB_NAME() của connection.
EXEC sys.sp_set_session_context @key = N'R54DisposableTarget', @value = N'<confirmed-test-database>';
EXEC sys.sp_set_session_context @key = N'R54PersistFixtures', @value = 0;
GO
:r ./10_seed/test_fixture/transaction-fixture.sql
```

Mặc định `R54PersistFixtures = 0`/không đặt: toàn bộ setup/assertion rồi ROLLBACK;
rollback kiểm tra bảng giao dịch, điểm, quota, status show trở về baseline. Identity
có thể bị tiêu thụ; output ID sau rollback không phải dữ liệu đã lưu.

Muốn giữ dataset để đọc hoặc chạy negative probes, chủ động đặt
`R54PersistFixtures = 1` **trước lần chạy positive fixture trên target trống**. Sau
COMMIT thành công, chạy thủ công `:r ./10_seed/test_fixture/negative-probes.sql`
trong session đã xác nhận target. Negative probes không commit. Pending dùng hold
thật 5 phút, tạo cuối setup và sẽ hết hạn tự nhiên; không sửa deadline để giữ trạng
thái vô thời hạn. Script không có cleanup/rebuild; orchestration thuộc R5.5.

Giá/discount/payment snapshot do SP/SQL quyết định. Paid history cho past show được
INSERT có kiểm soát vì Booking/Payment SP không nhận suất quá khứ: đúng room/seat,
giá `fn_TinhGiaVe`, payment amount từ order snapshot, account → order → attempt →
settlement → show → review; điểm payment áp dụng công thức SQL hiện có. Giữ constraint
và trigger. Cancellation dùng SP thật và `BOITHUONG_HUYSUAT`; successful payment giữ
nguyên, cancel lần hai không cộng điểm hoặc trả quota lần nữa.

Order Completed và ticket Used: N/A cho workflow vì hệ thống chưa có hoàn tất/check-in.
Past paid history đủ điều kiện review theo contract; không tạo invalid review lưu
vào DB hay refund mechanism. Xem [fixture matrix](fixture-matrix.md) và [quy trình Test DB](../../../scripts/db/TEST_PIPELINE.md).

Phase-specific offline checkers and fixture runners have been retired. The R5.4/R5.5
statuses above are historical records, not replayable commands. Current Test DB
preflight and target limits are in the [test pipeline](../../../scripts/db/TEST_PIPELINE.md).

## Test fixtures

Fixtures remain separate from application seed data. The default SQL regression suite
runs through `npm run db:test` and `database/11_tests/test-all.sql`. JavaScript suites
that can write data are described in the [concurrency guide](../../11_tests/concurrency/README.md)
and require a separate disposable database.

Shared concurrency helpers are maintained in `scripts/db/concurrency-support/`.
Current SQL test files remain under `database/11_tests/`; retired phase runners and
historical caller inventories were removed. Never include test fixtures in
`seed-all.sql`, reset, or production build workflows.
