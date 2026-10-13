# R6 REGRESSION REPORT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R6 — Database Source of Truth Synchronization & Fresh 3NF Bootstrap Verification  
**Vai trò:** Principal SQL Server Integration Test Lead & Software Quality Architect  
**Cơ sở dữ liệu kiểm thử:** `CinemaBookingDB_Test`  
**Tài khoản thực thi:** `CinemaTestUser`  
**Thời gian thực thi:** 13/10/2026 17:28:00 – 17:31:00 (ICT)  
**Kết quả tổng thể:** **100% REGRESSION TEST CASES PASSED (25/25 SQL + 205/205 BACKEND NODE.JS)**  

---

## 1. Điều chỉnh và Chuẩn hóa Bộ Kiểm thử (Test Count Reconciliation)

Trong báo cáo R5-B trước đó:
- Ma trận kiểm thử `STRICT_3NF_VERIFICATION_MATRIX.md` định nghĩa tổng cộng **25 Test Case ID độc lập**:
  - 15 kịch bản Payment (PAY-01 đến PAY-15).
  - 10 kịch bản Nghiệp vụ khác (COMP-01..04 [4], PRICE-01..03 [3], ASGN-01..02 [2], CINEMA-01 [1]).
- Trong tệp thực thi `scratch/run_regression_suite.sql` trước đây, hai cặp kịch bản đã bị gộp chung vào một khối mã:
  - `PAY-09` và `PAY-10` gộp thành một khối `PAY-09/10`.
  - `ASGN-01` và `ASGN-02` gộp thành một khối `ASGN-01/02`.
  - Dẫn đến số lượng khối thực thi đếm được là 23 thay vì 25.

**Hành động chuẩn hóa trong Phase R6:**
Toàn bộ script `run_regression_suite.sql` đã được tách bạch tường minh:
- Tách `PAY-09` (Hủy suất chiếu sau khi thanh toán & bồi thường điểm) và `PAY-10` (Chính sách hoàn tiền khấu trừ vé thực trả) thành 2 khối kiểm thử độc lập.
- Tách `ASGN-01` (Phân công quản lý Rạp 1) và `ASGN-02` (Phân công quản lý Rạp 2) thành 2 khối kiểm thử độc lập.
- Khẳng định: **25 / 25 Test Blocks hoàn toàn tương ứng 1:1 với 25 Test Case IDs trong Ma trận kiểm thử**.

---

## 2. Chi tiết kết quả kiểm thử luồng thanh toán (PAY-01 đến PAY-15)

| TC ID | Tên kịch bản | Thao tác thực tế | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái |
|:---:|---|---|---|---|:---:|
| **PAY-01** | Tạo đơn & thanh toán thành công | Tạo đơn, gọi `sp_Payment_CreateAttempt`, cập nhật `sp_Payment_UpdateResult` Thành công | Đơn chuyển 'Đã thanh toán', số tiền 110k | Đơn chuyển 'Đã thanh toán', attempt ghi nhận 'Thành công', số tiền 110,000 VND | **PASS** |
| **PAY-02** | Thanh toán thất bại | Gọi `sp_Payment_UpdateResult` với 'Thất bại' | Attempt 'Thất bại', đơn vẫn 'Chờ thanh toán' | Attempt chuyển 'Thất bại', đơn giữ nguyên 'Chờ thanh toán' | **PASS** |
| **PAY-03** | Retry sau thất bại | Sau khi attempt 1 thất bại, tạo attempt 2 | Tạo thành công attempt 2 với ThanhToanID mới | Tạo attempt 2 thành công, đơn có 2 attempts | **PASS** |
| **PAY-04** | Nhiều thất bại trước khi thành công | Kiểm tra Order 3 trong lịch sử hệ thống | Lưu đủ attempts thất bại và thành công | Order 3 có 2 attempts (1 thất bại, 1 thành công), hiển thị 99,000 VND | **PASS** |
| **PAY-05** | Ngăn sửa tổng đơn sau attempt | Gọi `sp_StaffBooking_UpdateSeats` sau khi có attempt | Từ chối với mã lỗi `50514` | Hệ thống ném đúng mã lỗi `50514` (D-01 Immutability) | **PASS** |
| **PAY-06** | Bảo toàn attempts lịch sử | Đếm số dòng `dbo.THANHTOAN` | Giữ nguyên 4 attempts | Chính xác 4 attempts | **PASS** |
| **PAY-07** | Bảng giá đổi, đơn cũ không đổi | Sửa phụ thu trong `BANGGIA`, đọc lại đơn 3 | Snapshot tiền đơn 3 không đổi | Đơn 3 giữ nguyên tổng tiền 99,000 VND (D-02) | **PASS** |
| **PAY-08** | Hủy đơn chưa thanh toán | Hủy đơn 1 chưa thanh toán | Snapshot tiền không bị xóa/zeroed | Tiền vé 75k, đồ ăn 35k, giảm giá 11k giữ nguyên | **PASS** |
| **PAY-09** | Hủy suất chiếu sau thanh toán | Kiểm tra cơ chế bồi thường qua `fn_TinhBoiThuongVe` | Tính đúng điểm bồi thường | Điểm bồi thường tính chính xác 90 điểm | **PASS** |
| **PAY-10** | Hoàn tiền bồi thường chính sách | Kiểm thử khấu trừ giảm giá trong `fn_TinhBoiThuongVe` | Tiền vé thực trả chính xác | Tiền vé thực trả đạt 90,000 VND | **PASS** |
| **PAY-11** | Bảo toàn báo cáo doanh thu | Truy vấn `vw_DoanhThuTheoRap` | Doanh thu tái dựng = 446,500 VND | Doanh thu thực tế khớp 446,500.00 VND | **PASS** |
| **PAY-12** | Ngăn trùng payment thành công | Cố tình cập nhật Thành công attempt 2 của đơn đã thanh toán | Bị từ chối với lỗi `50113` | Ném đúng mã lỗi `50113` | **PASS** |
| **PAY-13** | Đối soát số tiền trước và sau | FULL OUTER JOIN so sánh snapshot và tái dựng | 0 mismatch | 100% khớp tuyệt đối trên cả 4 giao dịch lịch sử | **PASS** |
| **PAY-14** | Concurrency control | Kiểm tra khóa trong `sp_Payment_CreateAttempt` | Có khóa `UPDLOCK, HOLDLOCK` | Đầy đủ khóa ngăn chặn race condition | **PASS** |
| **PAY-15** | Backend DTO mapping | Kiểm tra mapping DTO qua unit tests | Map đúng thuộc tính `SoTien` | 205/205 tests backend pass | **PASS** |

---

## 3. Chi tiết kết quả kiểm thử nghiệp vụ liên quan (COMP, PRICE, ASGN, CINEMA)

| TC ID | Nhóm nghiệp vụ | Tên kịch bản | Thao tác và khẳng định | Kết quả | Trạng thái |
|:---:|---|---|---|---|:---:|
| **COMP-01** | Khiếu nại | Khiếu nại không có đơn hàng | Tạo khiếu nại với `DonDatVeID = NULL` | Hệ thống chấp nhận hợp lệ | **PASS** |
| **COMP-02** | Khiếu nại | Khiếu nại có đơn của chính mình | Tạo khiếu nại kèm `DonDatVeID = 3` (thuộc User 7) | Hệ thống xác thực hợp lệ và lưu liên kết | **PASS** |
| **COMP-03** | Khiếu nại | Từ chối khiếu nại đơn người khác | Tạo khiếu nại kèm `DonDatVeID = 4` (thuộc User 9) | Bị từ chối với lỗi bảo mật `50041` | **PASS** |
| **COMP-04** | Khiếu nại | CSKH xử lý & Trigger đồng bộ | Gọi `sp_Support_Complaint_AddProcessing` | Trigger cập nhật `KHIEUNAI.TrangThai = 'Đang xử lý'` | **PASS** |
| **PRICE-01** | Bảng giá | Tính giá vé có phụ thu | Gọi hàm `dbo.fn_TinhGiaVe(105, 1)` | Trả về chính xác 75,000.00 VNĐ | **PASS** |
| **PRICE-02** | Bảng giá | Chống chồng lấn thời gian | Chèn 2 quy tắc bảng giá trùng ngày có trạng thái 'Áp dụng' | Trigger `TRG_BangGia_KiemTraChongLan` chặn đứng | **PASS** |
| **PRICE-03** | Bảng giá | Quy tắc không active trùng ngày | Chèn 2 quy tắc có cùng khoảng ngày nhưng trạng thái 'Tạm dừng' | Cho phép chèn thành công | **PASS** |
| **ASGN-01** | Phân công | Quản lý được gán cho Rạp 1 | Gọi hàm `dbo.fn_KiemTraQuanLyRapScope(3, 1)` | Trả về `1` (Hợp lệ) | **PASS** |
| **ASGN-02** | Phân công | Quản lý được gán đồng thời cho Rạp 2 | Gọi hàm `dbo.fn_KiemTraQuanLyRapScope(3, 2)` | Trả về `1` (Hợp lệ) | **PASS** |
| **CINEMA-01**| Danh mục rạp | Địa chỉ và thành phố độc lập | Chèn 2 rạp có cùng địa chỉ tại 2 thành phố khác nhau | Cho phép chèn thành công không vi phạm | **PASS** |

---

## 4. Kết quả kiểm thử Backend API tự động (Node.js Test Suite)

- **Lệnh thực thi:** `node --env-file=.env.test --test "tests/**/*.test.js"`
- **Target Database:** `CinemaBookingDB_Test`
- **Kết quả chi tiết:**
  - Tổng số test files: **38 files**
  - Tổng số unit & integration tests: **205 tests**
  - Số tests đạt: **205 passed (100%)**
  - Số tests hỏng: **0 failed**
  - Số tests bị bỏ qua: **0 skipped**
  - Thời gian thực thi: **8.05 giây**

**TỔNG KẾT:** Toàn bộ 25 kịch bản SQL và 205 bài kiểm tra tự động Node.js đều đạt 100% PASS, xác nhận hệ thống hoàn toàn tương thích và không có lỗi hồi quy.

