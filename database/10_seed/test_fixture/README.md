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
vào DB hay refund mechanism. Xem [báo cáo R5.4](../../../docs/R5_4_TRANSACTION_FIXTURE_REPORT.md).

Kiểm nguồn offline (không kết nối DB): `node scripts/r54/checks.mjs` từ repo root.
Trạng thái tại thời điểm R5.4: **SOURCE IMPLEMENTATION DONE; LIVE SQL VERIFICATION NOT RUN**.
R5.5 đã kiểm chứng SQL thật, rollback/commit/negative probes và hai rebuild: **PASS**.
Xem [runtime evidence R5.5](../../../docs/R5_5_TEST_DATABASE_REBUILD_REPORT.md).
Không include fixture vào seed/build/reset hoặc thay runner; không phải R5.5/R6/R7.

## Danh mục legacy giữ nguyên

Nhóm logic phục vụ kiểm thử, tách khỏi seed ứng dụng. R5.1 không tạo fixture giao
dịch mới và không đưa fixture vào `seed-all.sql`. Các fixture hiện có giữ vị trí
vì gắn với suite, import, guard database, transaction và cleanup riêng.

| Vị trí hiện có | Mục đích / dữ liệu | Caller và dependency |
| --- | --- | --- |
| `database/11_tests/procedures/smoke.sql` | Auth/catalog/booking/payment/review/complaint/manager/support/admin smoke; dữ liệu ghi trong rollback fixture | `11_tests/test-all.sql`; cần baseline catalog |
| `database/11_tests/{timezone,pricing,payment,triggers,integrity,permissions}/*.sql` | Biên thời gian/giá, bồi thường, multirow, FK/CHECK và EXECUTE-only | `test-all.sql`; một số probe permission tạo/xóa test principal riêng |
| `database/11_tests/{rooms,showtimes,booking,admin,history,complaints,profile,orders}/*.sql` | SQL rollback/regression task chuyên biệt | Suite task tương ứng; không phải tất cả được include bởi test-all |
| `database/11_tests/concurrency/*.mjs` | Race phòng/lịch/booking/promotion/cast/history/complaint | Import task tooling; có commit nên yêu cầu disposable |
| `database/11_tests/schema/*.sql` | Tamper/restore định nghĩa/trigger để chứng minh verify fail | Verification chuyên biệt; không seed ứng dụng |
| `scripts/r11/common.mjs` | Phòng và ghế tạm cho delete-vs-showtime | r11 suites; r12, r21…r47 common dùng lại helper |
| `scripts/r21/fixtures.mjs` | Rạp/phim/phòng/ghế/suất/sản phẩm/promotion và booking helper | r21/r22; r31/r32/r33; r42/r44; concurrency SQL |
| `scripts/r31/fixtures.mjs` | Phim/diễn viên/cast cho kiểm thử atomic replacement | r31 SQL/API/concurrency; r32/r33 regression |
| `scripts/r32/fixtures.mjs` | Mở rộng r21 với tiền/sản phẩm/bảng giá/historical metadata | r32 suites; r33 regression; r42 report; r43 pricing/browser |
| `scripts/r33/fixtures.mjs` | Khiếu nại, processing và bulk history | r33 SQL/API/concurrency; cleanup và trạng thái theo fixture |
| `scripts/r46/fixtures.mjs` | User 4 vai trò + custom role/profile, snapshot/reset/cleanup | r46 profile/browser; không tạo base RBAC |
| `scripts/r47/fixtures.mjs` | Catalog riêng, booking/payment/expiry phục vụ read-only order detail | r47 detail-before/detail-tests; cleanup riêng |
| `scripts/r1/sql-fixtures.mjs` | Biên hold/timezone/giá; clock/DDL probe rollback-only | npm r1:sql-tests; r2 checks; chỉ R1 disposable |
| `scripts/r1/migration-fixture.mjs`, `scripts/r2fix/migration-tests.mjs`, `scripts/r3b/migration-fixture.mjs` | Dựng/replay schema/seed lịch sử để test migration | Pinned commit hoặc source build; giữ path theo đúng phiên bản |
| `scripts/r0/{pricing-api,verify}.mjs` | Pricing rows và legacy-precondition fixture | R0 disposable guard; không dùng làm seed demo |
| `scripts/r3b/probes.mjs`, `scripts/r42/report-tests.mjs`, `scripts/r43/pricing-tests.mjs`, `scripts/r44/ownership-tests.mjs` | Quyền tạm, booking/payment/financial/pricing fixtures dùng lại helpers | Checks tương ứng; có cleanup/rollback riêng |
| `scripts/r5/integration.mjs`, `scripts/r7/integration.mjs`, `scripts/r8/{flows,browser-run,security,transactions}.mjs` | Fixture HTTP/SQL lịch sử: paid/review/complaint/security/concurrency | Suite cũ; không phải roadmap R5.1–R5.5, không tự chạy lại |
| `scripts/db/backend-smoke.mjs`, `scripts/audit-full-20261003/*.mjs`, `scripts/uiux/audit.mjs` | HTTP/browser flow tạo/đọc fixture theo suite/manifest | Có thể ghi qua API dù không có INSERT; phải đọc target/guard trước chạy |
| `frontend/tests/*browser-fixture*.jsx`, `scripts/r1/browser-forms.mjs` | Mock HTTP/browser fixture | Không phải SQL seed; giữ nguyên frontend |

Không kết luận file hết sử dụng từ việc không có import trực tiếp. Nhiều suite được
gọi qua npm, command line, subprocess, regression source replay hoặc pinned commit.
Danh mục chi tiết các caller/tables/include hiện có:
[seed-inventory.json](../../../docs/evidence/r51/seed-inventory.json).

SQL fixture không tự động đồng nghĩa rollback an toàn: concurrency có commit,
schema tamper có DDL, rollback vẫn có thể tiêu thụ identity; một số tooling cũ
phụ thuộc audit artifact hoặc nhắm main. Không chạy toàn bộ thư mục như một seed group.

Ghi nhận tại R5.1: nhóm này mới có convention/danh mục, chưa có SQL placeholder hay
entry point cho fixture mới. R5.4 hiện bổ sung hai SQL thủ công ở phần canonical
phía trên. Test DB/rebuild pipeline thuộc R5.5.
