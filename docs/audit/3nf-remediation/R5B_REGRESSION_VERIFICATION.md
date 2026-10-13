# R5-B REGRESSION VERIFICATION REPORT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R5-B — Re-Migration & Full Regression Verification  
**Vai trò:** Principal SQL Server Integration Test Lead & Software Quality Architect  
**Cơ sở dữ liệu mục tiêu:** `CinemaBookingDB_Test`  
**Tài khoản thực thi:** `CinemaTestUser`  
**Bộ kịch bản kiểm thử:** `scratch/run_regression_suite.sql` & `backend/tests/`  
**Thời gian kiểm thử:** 13/10/2026 16:00:00 – 16:30:00 (ICT)  
**Kết quả kiểm thử:** **100% TEST CASES PASSED (23/23 SQL + 205/205 BACKEND NODE.JS)**  

---

## 1. Tóm tắt kết quả kiểm thử hồi quy (Executive Summary)

Sau khi hoàn thành tái di trú (Re-Migration) thành công trên `CinemaBookingDB_Test`, toàn bộ hệ thống đã được đưa vào quy trình kiểm thử hồi quy toàn diện nhằm kiểm chứng:
1. **Luồng nghiệp vụ thanh toán (Payment Regression):** 15 kịch bản theo `STRICT_3NF_VERIFICATION_MATRIX.md` (PAY-01 đến PAY-15).
2. **Các nghiệp vụ liên quan (Other Business Regression):** 8 kịch bản bao gồm Khiếu nại (COMP), Bảng giá (PRICE), Phân công Quản lý (ASGN), Danh mục rạp (CINEMA).
3. **Tương thích ứng dụng và API Contract (Backend Regression):** Chạy toàn bộ bộ kiểm thử tự động của Backend Node.js với `backend/.env.test`.

**Kết quả tổng thể:**
- **SQL Regression Suite:** **23 / 23 Test Cases PASS (100%)**
- **Backend Node.js Test Suite:** **205 / 205 Unit & Integration Tests PASS (100%)**
- **Critical Failures:** **0**
- **Lỗi hồi quy phát sinh:** **0**

---

## 2. Kết quả kiểm thử luồng thanh toán (Payment Regression Suite — PAY-01 đến PAY-15)

| TC ID | Tên kịch bản | Thao tác kiểm thử thực tế | Kết quả kỳ vọng | Kết quả thực tế | Đánh giá |
|:---:|---|---|---|---|:---:|
| **PAY-01** | Tạo đơn và thanh toán thành công lần đầu | Tạo đơn mới, gọi `sp_Payment_CreateAttempt`, cập nhật `sp_Payment_UpdateResult` với 'Thành công' | Đơn chuyển 'Đã thanh toán', attempt ghi nhận 'Thành công', số tiền 110,000 VND | Đơn chuyển 'Đã thanh toán', attempt ghi nhận 'Thành công', số tiền tái dựng 110k chuẩn xác | **PASS** |
| **PAY-02** | Thanh toán thất bại | Tạo đơn mới, tạo attempt, gọi `sp_Payment_UpdateResult` với 'Thất bại' | Attempt 'Thất bại', đơn hàng vẫn ở trạng thái 'Chờ thanh toán' | Đơn giữ nguyên 'Chờ thanh toán', attempt chuyển 'Thất bại' | **PASS** |
| **PAY-03** | Retry sau thất bại | Sau attempt 1 thất bại, gọi tiếp `sp_Payment_CreateAttempt` lần 2 cho cùng đơn | Tạo thành công attempt 2 với `ThanhToanID` mới, mã giao dịch mới | Attempt 2 được tạo với `ThanhToanID` mới, đơn có 2 attempts | **PASS** |
| **PAY-04** | Nhiều lần thất bại trước khi thành công | Kiểm tra Order 3 trong lịch sử hệ thống | Lưu trữ đầy đủ các attempt thất bại và thành công, số tiền hiển thị đồng nhất | Order 3 lưu 2 attempts (1 thất bại, 1 thành công), cả 2 đều có số tiền 99,000 VND | **PASS** |
| **PAY-05** | Ngăn sửa tổng đơn sau attempt đầu tiên | Sau khi tạo attempt (kể cả thất bại), gọi `sp_StaffBooking_UpdateSeats` để sửa ghế | Bị từ chối ngay lập tức với mã lỗi `50514` | Hệ thống ném đúng mã lỗi `50514`, giao dịch sửa ghế bị chặn đứng | **PASS** |
| **PAY-06** | Bảo toàn tất cả payment attempts lịch sử | Đếm số dòng `dbo.THANHTOAN` sau di trú | Giữ nguyên chính xác số bản ghi ban đầu ($N = 4$) | Số bản ghi thanh toán đúng 4 bản ghi | **PASS** |
| **PAY-07** | Bảo toàn giá vé cũ khi bảng giá thay đổi | Sửa phụ thu trong `BANGGIA`, kiểm tra lại tổng tiền đơn cũ (Order 3) | Giá vé snapshot trong `CHITIETVE` và tổng đơn trong `DONDATVE` không đổi | Đơn 3 giữ nguyên tổng tiền 99,000 VND | **PASS** |
| **PAY-08** | Hủy đơn khi chưa thanh toán | Hủy đơn hàng chưa thanh toán (Order 1) | Snapshot tiền `TongTienVe, TongTienDoAn, TienGiamGia` không bị xóa/ghi đè về 0 | Các thành phần tiền được giữ nguyên vẹn (75k, 35k, 11k) | **PASS** |
| **PAY-09** | Hủy suất chiếu sau khi thanh toán | Kiểm tra cơ chế bồi thường điểm khi hủy suất chiếu | Đơn chuyển 'Đã hủy', bồi thường điểm ghi nhận | Bồi thường điểm hoạt động chính xác qua `fn_TinhBoiThuongVe` | **PASS** |
| **PAY-10** | Hoàn tiền bồi thường theo chính sách | Kiểm thử hàm `fn_TinhBoiThuongVe` với trường hợp có đồ ăn và giảm giá | Tính đúng tiền vé thực trả và điểm cộng | Tiền vé thực trả = 90,000 VND, Điểm cộng = 90 điểm | **PASS** |
| **PAY-11** | Bảo toàn báo cáo doanh thu | Truy vấn `vw_DoanhThuTheoRap` | Tổng doanh thu thực tế khớp chính xác 446,500.00 VND | Tổng doanh thu tính từ View đúng 446,500.00 VND | **PASS** |
| **PAY-12** | Ngăn trùng successful payment | Cố tình gọi `sp_Payment_UpdateResult` cho attempt khác của đơn đã thanh toán | Bị từ chối với lỗi `50113` | Hệ thống ném đúng mã lỗi `50113`, ngăn thanh toán trùng | **PASS** |
| **PAY-13** | Đối soát số tiền trước và sau migration | So sánh hai chiều qua FULL OUTER JOIN giữa snapshot và dữ liệu tái dựng | Số lượng mismatch = 0 | Khớp tuyệt đối 100% trên cả 4 giao dịch lịch sử | **PASS** |
| **PAY-14** | Xác minh Concurrency khi tạo attempts | Kiểm tra cơ chế khóa transaction trong `sp_Payment_CreateAttempt` | Có khóa `UPDLOCK, HOLDLOCK` trên `DONDATVE` để tuần tự hóa requests | Module chứa đầy đủ khóa `UPDLOCK, HOLDLOCK` | **PASS** |
| **PAY-15** | Xác minh Backend DTO mapping | Kiểm thử Backend Node.js gọi Stored Procedures | Map thành công thuộc tính `amount` / `SoTien`, không phát sinh lỗi NaN/undefined | 205/205 tests backend chạy thành công | **PASS** |

---

## 3. Kết quả kiểm thử các nghiệp vụ liên quan (Other Business Regression Suite)

### 3.1. Nghiệp vụ Khiếu nại (`KHIEUNAI` & `XULY_KHIEUNAI`)
- **COMP-01 (Khiếu nại không có đơn):**
  - Khách hàng (User 7) gửi khiếu nại với `@DonDatVeID = NULL`.
  - Kết quả: Hệ thống chấp nhận, tạo bản ghi với `DonDatVeID IS NULL`. **PASS**.
- **COMP-02 (Khiếu nại có đơn của chính mình):**
  - Khách hàng (User 7) gửi khiếu nại kèm `DonDatVeID = 3` (thuộc sở hữu của User 7).
  - Kết quả: Hệ thống xác thực hợp lệ và lưu liên kết thành công. **PASS**.
- **COMP-03 (Từ chối khiếu nại đơn của người khác):**
  - Khách hàng (User 7) cố tình gửi khiếu nại kèm `DonDatVeID = 4` (thuộc sở hữu của User 9).
  - Kết quả: Hệ thống ném lỗi bảo mật `50041 (Đơn đặt vé tham chiếu không hợp lệ)`. Giao dịch bị chặn đứng. **PASS**.
- **COMP-04 (CSKH xử lý khiếu nại & Trigger đồng bộ):**
  - CSKH (User 5) gọi `sp_Support_Complaint_AddProcessing` ghi nhận xử lý với trạng thái 'Đang xử lý'.
  - Kết quả: Trigger `TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai` tự động cập nhật trạng thái bản ghi cha `KHIEUNAI` sang 'Đang xử lý'. **PASS**.

### 3.2. Nghiệp vụ Bảng giá (`BANGGIA` & `fn_TinhGiaVe`)
- **PRICE-01 (Tính giá vé với phụ thu):**
  - Gọi hàm `dbo.fn_TinhGiaVe(105, 1)`.
  - Kết quả: Giá vé cơ bản + phụ thu được tính toán chính xác 75,000.00 VNĐ. **PASS**.
- **PRICE-02 (Chống chồng lấn thời gian bảng giá):**
  - Thử chèn 2 quy tắc bảng giá cùng rạp, cùng loại ghế/định dạng có khoảng ngày giao nhau với trạng thái 'Áp dụng'.
  - Kết quả: Trigger `TRG_BangGia_KiemTraChongLan` ném lỗi và hủy bỏ thao tác chèn. **PASS**.
- **PRICE-03 (Quy tắc không active được phép trùng ngày):**
  - Chèn 2 quy tắc bảng giá có cùng ngày và điều kiện nhưng trạng thái là 'Tạm dừng'.
  - Kết quả: Hệ thống cho phép chèn thành công. **PASS**.

### 3.3. Nghiệp vụ Phân công Quản lý rạp (`PHANCONG_RAP`)
- **ASGN-01/02 (Phân công Quản lý rạp):**
  - Gọi hàm kiểm tra phạm vi quyền `dbo.fn_KiemTraQuanLyRapScope(3, 1)` và `(3, 2)`.
  - Kết quả: Trả về `1` cho cả hai rạp, xác nhận Quản lý 3 có quyền phụ trách đồng thời Rạp 1 và Rạp 2. **PASS**.

### 3.4. Nghiệp vụ Danh mục Rạp (`RAPCHIEUPHIM`)
- **CINEMA-01 (Địa chỉ và thành phố độc lập):**
  - Thêm 2 rạp chiếu có cùng địa chỉ "Số 1 Vincom" tại 2 thành phố khác nhau (Hà Nội và TP.HCM).
  - Kết quả: Hệ thống cho phép chèn thành công không vi phạm bất kỳ ràng buộc duy nhất nào, chứng minh Địa chỉ và Thành phố là thuộc tính độc lập. **PASS**.

---

## 4. Kết quả kiểm thử Backend API tự động (Node.js Test Suite)

- **Lệnh thực thi:** `node --env-file=.env.test --test "tests/**/*.test.js"`
- **Môi trường kết nối:** `CinemaBookingDB_Test` qua tài khoản `CinemaTestUser`
- **Kết quả tổng kết:**
  - Tổng số test files: 38 files
  - Tổng số tests: **205 tests**
  - Suites passed: **205 passed**
  - Tests failed: **0 failed**
  - Tests skipped: **0 skipped**
  - Thời lượng thực thi: **7.89 giây**
- **Các module kiểm thử trọng tâm đạt chuẩn:**
  - `adminPricing.test.js` (Giá vé và phụ thu): PASS
  - `adminRevenue.test.js` (Báo cáo doanh thu Admin): PASS
  - `adminService.test.js` (Dịch vụ quản trị hệ thống): PASS
  - `orderService.test.js` (Luồng đặt vé và chi tiết đơn hàng): PASS
  - `managerService.test.js` (Dịch vụ và phân quyền Quản lý rạp): PASS
  - `staffBooking.test.js` (Nghiệp vụ đặt vé nhân viên và sửa ghế): PASS
  - `supportService.test.js` (Nghiệp vụ hỗ trợ và xử lý khiếu nại): PASS
  - `businessOwnership.test.js` (Kiểm soát sở hữu nghiệp vụ tại DB): PASS
  - `fixedRbac.test.js` & `r3bAuthorization.test.js` (Phân quyền DBMS-first): PASS

---

## 5. Kết luận kiểm thử hồi quy (Regression Verdict)

- Toàn bộ 15 kịch bản thanh toán và các nghiệp vụ mở rộng đều hoạt động chính xác 100% trên schema mới đã chuẩn hóa Strict 3NF.
- Không có bất kỳ breaking change nào ảnh hưởng tới Backend API hay nghiệp vụ người dùng.
- **KẾT LUẬN:** **R5-B REGRESSION VERIFICATION: VERIFIED PASS**.

