# Concurrency: hai suất chiếu trùng giờ

Tất cả query window phải kết nối `DoanTuanIT / CinemaBookingDB`. Chạy `00_PRECHECK.sql` trước. Cần ba cửa sổ SSMS độc lập A, B, C để tạo ba SQL session riêng.

1. Session A: mở `01_session_a_hold.sql`. Script thêm fixture ID âm và giữ transaction/application lock. Để nguyên cửa sổ này.
2. Session B: mở `02_session_b_attempt.sql`. Script thử thêm suất trùng giờ và phải chờ lock của A.
3. Session C: chạy `03_monitor.sql`. Expected `LCK_M_X`, blocker là session A, verdict `PASS`.
4. Quay lại Session A: chạy `04_session_a_commit.sql`. A commit fixture rồi nhả lock.
5. Session B kết thúc với lỗi nghiệp vụ `50001`; dòng của B không được commit. Xem kết quả và verdict trong tab Messages/Results.
6. Sau khi B đã kết thúc, mở query window mới và chạy `05_cleanup.sql`. Expected fixture còn lại = 0 và DBCC không có vi phạm.

Nếu muốn hủy trước khi A commit, chạy `ROLLBACK TRANSACTION` trong cửa sổ A. Nếu A đã commit, phải đợi B trả về trước khi cleanup. Không đóng cửa sổ đang giữ transaction.

Bằng chứng runtime: `../evidence/main-ssms-schedule-concurrency-demo.json` (6/6 PASS; B chờ `LCK_M_X`, sau commit của A thì B bị từ chối 50001). Các file trong folder này là bản sao byte-for-byte của script đã chạy tại `database/14_audit/`.
