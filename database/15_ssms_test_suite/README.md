# Bộ SQL Test Suite SSMS — CinemaBookingDB

Bộ test này đóng gói các script SQL đã chạy trên SQL Server Main và bảng ánh xạ để tra cứu object. Target là `DoanTuanIT / CinemaBookingDB`; mỗi file có target guard trước khi kiểm thử.

## Thứ tự chạy

1. Kết nối SSMS tới đúng instance `DoanTuanIT`, chọn `CinemaBookingDB`, chạy `00_PRECHECK.sql`.
2. Chạy các bài đọc và metadata: `02_FUNCTIONS_VIEWS_INDEXES/01_functions_views_indexes.sql`, `04_CONSTRAINTS/03_default_constraint_catalog.sql` và `01_STORED_PROCEDURES/01_readonly_core.sql`.
3. Chạy các bài DML có rollback: Trigger, CHECK, PK/UQ/FK, booking atomicity và Admin CRUD.
4. Chạy bài concurrency riêng trên nhiều query window theo `06_CONCURRENCY/README.md`.
5. Sau khi mọi cửa sổ đã kết thúc, chạy `10_FINAL_VERIFICATION.sql`.

Các bài DML trong suite dùng transaction và rollback. Riêng concurrency suất chiếu, Session A commit fixture ID âm để Session B kiểm tra trùng lịch; phải chạy `05_cleanup.sql` sau khi Session B kết thúc. Không đóng cửa sổ A khi transaction đang mở. IDENTITY có thể tăng sau rollback; không reseed.

## Nội dung và kết quả mong đợi

| Nhóm | File SSMS | Expected result |
|---|---|---|
| Target/inventory | `00_PRECHECK.sql` | Đúng server/database, ONLINE; 29 table, 147 SP, 6 view, 21 function, 9 trigger, 142 PK/UQ/FK/CHECK, 71 index và 42 DEFAULT constraint. Tất cả verdict PASS. |
| Stored Procedure đọc | `01_STORED_PROCEDURES/01_readonly_core.sql` | 14 assertion PASS, có kết quả lấy từ Main. |
| Stored Procedure ghi — Admin CRUD | `01_STORED_PROCEDURES/02_admin_crud_success.sql` | 16 assertion PASS; fixture Actor/Genre/Product/Promotion/Cinema được tạo, cập nhật, xóa trong transaction và rollback. |
| Function/View/Index | `02_FUNCTIONS_VIEWS_INDEXES/01_functions_views_indexes.sql` | 45 assertion PASS; metadata index/constraint, STATISTICS IO/TIME và actual execution plan đại diện. |
| Trigger | `03_TRIGGERS/01_trigger_dml.sql` | 21 assertion PASS cho cả 9 trigger: DML hợp lệ, bị từ chối và nhiều dòng; rollback. |
| CHECK | `04_CONSTRAINTS/01_check_constraints.sql` | 65 assertion PASS; SQL Server từ chối đúng CHECK constraint; rollback. |
| PK/UQ/FK | `04_CONSTRAINTS/02_primary_unique_foreign_keys.sql` | 79 assertion PASS: 77 constraint ứng dụng và 2 key của SQL Diagram support; rollback. |
| DEFAULT | `04_CONSTRAINTS/03_default_constraint_catalog.sql` | 42/42 định nghĩa DEFAULT được kiểm kê từ metadata. Đây là bài chỉ đọc; không tuyên bố đã thử INSERT riêng cho từng DEFAULT. |
| Transaction | `05_TRANSACTIONS/01_booking_atomicity.sql` | PASS khi gặp lỗi mong đợi `50410`; promo/order/ticket/food không bị partial commit và fixture được rollback. |
| Concurrency | 5 file trong `06_CONCURRENCY/` | Session B đợi application lock, sau commit của A thì bị từ chối `50001`; cleanup fixture A. |
| Integrity cuối | `10_FINAL_VERIFICATION.sql` | Database ONLINE; fixture concurrency không còn; DBCC CHECKDB/CHECKCONSTRAINTS không có vi phạm. |

## Stored Procedure và bảng ánh xạ object

`OBJECT_TEST_MAP.csv` có một dòng cho từng table, Stored Procedure, function, view, trigger, constraint, default constraint và index có trên Main. Cột `SSMSReplayFile` chỉ tới file SQL thực sự gọi object. Cột `RuntimeRunner`/`EvidenceFile` dẫn tới kiểm thử và bằng chứng runtime Main. Một runner Node dùng `mssql` không được ghi nhầm thành file SSMS.

Audit Main trước đó đã gọi runtime 147/147 Stored Procedure: 69 luồng đọc/validation và 78 luồng ghi thành công. Từng SP có actual result và evidence được ánh xạ. Suite có lời gọi SSMS trực tiếp cho 28 SP; 15 success path Admin CRUD có positive SSMS test. `sp_Booking_Create` có SSMS test lỗi giữa chừng/rollback; success path của nó có bằng chứng runner riêng. 63 writer success paths còn lại được kiểm tra qua runner `mssql`. CSV đánh dấu rõ `SSMSReplayFile`, `ExecutionMode` và `CoverageNote`.

Đối chiếu bằng chứng chi tiết tại `database/14_audit/MAIN_DATABASE_AUDIT_REPORT.md`; các JSON cần tra cứu đã được đóng gói trong `evidence/`. Bảy trong mười hai SQL demo được sao chép byte-for-byte từ `14_audit`; năm file được thêm `USE [CinemaBookingDB]`/`GO` và/hoặc siết target guard để xác minh server. Hash nằm ở `evidence/sql-copy-hashes.json`.

## An toàn và khôi phục

- Chỉ tiếp tục nếu `00_PRECHECK.sql` PASS và session không có transaction mở.
- Khi có lỗi ngoài dự kiến, script DML rollback trong `CATCH` rồi phát sinh lỗi; xem tab Messages trước khi chạy tiếp.
- Với concurrency, chạy đúng thứ tự ở README con. Không chạy cleanup trong lúc Session B còn block.
- Nếu muốn hủy khi A chưa commit, chạy `ROLLBACK TRANSACTION` tại chính cửa sổ A. Nếu A đã commit, đợi B kết thúc rồi mới chạy cleanup.
- Chạy `10_FINAL_VERIFICATION.sql` sau cleanup. Không restore đè lên database chính để dọn demo.
- `USE [CinemaBookingDB]` không thay thế việc kết nối đúng server; precheck xác minh cả `@@SERVERNAME` và `DB_NAME()`.

## Trạng thái phạm vi

Các test SQL Main đã có bằng chứng runtime PASS trong audit hiện tại; suite này tổ chức chúng để trình diễn lại, không chạy lại hàng loạt những ca đã PASS. Trong lượt đóng gói này, `00_PRECHECK.sql`, DEFAULT metadata và `10_FINAL_VERIFICATION.sql` đã được chạy trên Main; output lưu trong `evidence/`. 42 DEFAULT constraint được kiểm tra inventory và biểu thức metadata; chưa có DML assertion độc lập cho từng default. Backend/payment mô phỏng có bằng chứng 15/15 riêng; worker thường và provider thanh toán thật không được khởi động. Vì vậy không tuyên bố `FULL SYSTEM E2E VERIFIED`.
