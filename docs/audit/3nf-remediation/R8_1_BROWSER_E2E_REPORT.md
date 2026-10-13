# R8.1 REAL BROWSER END-TO-END VERIFICATION REPORT
**Project:** CinemaBookingDB — Strict 3NF Normalization Remediation  
**Phase:** R8.1 — Final Production Readiness Hardening & Gate C Preparation  
**Auditor / Roles:** Full-Stack Integration Testing Lead & Quality Assurance Engineer  
**Date:** October 13, 2026  
**Automation Engine:** **Playwright v1.50+ / Microsoft Edge (Chromium Engine)**  
**Target Environment:** Frontend (`:61366`), Backend (`:61365`), Database (`CinemaBookingDB_Test`)  
**Execution Status:** **11/11 SCENARIOS VERIFIED PASS (100% SUCCESS RATE)**

---

## 1. MỤC TIÊU VÀ KIẾN TRÚC THỰC THI (TEST ARCHITECTURE)

Tại các giai đoạn trước (R7, R8), các bài kiểm thử End-to-End chủ yếu được thực hiện bằng các tập lệnh API trực tiếp hoặc mô phỏng (headless API client). Giai đoạn **R8.1** triển khai kiểm thử tự động hóa toàn diện trên **trình duyệt thực tế (Real Browser)** để chứng minh:
1. Giao diện người dùng React (Vite) hoạt động hoàn hảo, không có lỗi render, lỗi hydration, hoặc xung đột trạng thái (state drift).
2. Xử lý chính xác các tương tác phức tạp của trình duyệt: Điều hướng router, hội thoại xác nhận `window.confirm` (Navigation Guard), và hộp thoại native `<dialog>` (Payment modal).
3. Luồng dữ liệu xuyên suốt 3 tầng: `React Browser UI -> Express REST API -> SQL Server Stored Procedures (Strict 3NF)`.
4. Cơ sở dữ liệu mục tiêu tuyệt đối bị cô lập: Chỉ kết nối vào `CinemaBookingDB_Test`, **không chạm vào `CinemaBookingDB`**.

```
+-----------------------------------------------------------------------------------+
|                        PLAYWRIGHT E2E EXECUTION TOPOLOGY                          |
+-----------------------------------------------------------------------------------+
|  [ Microsoft Edge Headless Browser ]                                              |
|         │                                                                         |
|         ▼ (HTTP :61366)                                                           |
|  [ React Frontend (Vite Single Page Application) ]                                |
|         │                                                                         |
|         ▼ (HTTP :61365 /api/*)                                                    |
|  [ Node.js Express Backend Service ]                                              |
|         │                                                                         |
|         ▼ (T-SQL RPC / Parameterized Stored Procedures)                            |
|  [ SQL Server Instance: DoanTuanIT | Database: CinemaBookingDB_Test (Strict 3NF) ]|
+-----------------------------------------------------------------------------------+
```

---

## 2. TỔNG HỢP KẾT QUẢ THỰC THI (11/11 PASS)

Tập lệnh thực thi: [scripts/e2e/r8_1_browser_e2e.mjs](file:///d:/DBMS_DO_AN/scripts/e2e/r8_1_browser_e2e.mjs).  
Tệp kết quả kiểm thử: [docs/audit/3nf-remediation/evidence/e2e/e2e_results.json](file:///d:/DBMS_DO_AN/docs/audit/3nf-remediation/evidence/e2e/e2e_results.json).

| Mã kịch bản | Tên kịch bản kiểm thử | Thời lượng | Trạng thái | Bằng chứng UI |
|---|---|---|---|---|
| **E2E-01** | Customer Auth & Session Persistence | 2,051 ms | **PASS** | `e2e_01_auth.png` |
| **E2E-02** | Movie Catalog & Showtime Discovery | 904 ms | **PASS** | `e2e_02_movies.png` |
| **E2E-03** | Seat Map Selection & Availability Policy | 1,251 ms | **PASS** | `e2e_03_seat_selection.png` |
| **E2E-04** | Booking Creation & Hold Deadline Verification | 1,008 ms | **PASS** | `e2e_04_booking_creation.png` |
| **E2E-05** | Payment Success Execution & Dynamic 3NF Amount | 484 ms | **PASS** | `e2e_05_payment_success.png` |
| **E2E-06** | Payment Attempt Failure, Retry & History Preservation | 1,163 ms | **PASS** | `e2e_06_payment_retry.png` |
| **E2E-07** | Customer Order History & Detail View | 1,083 ms | **PASS** | `e2e_07_order_history.png` |
| **E2E-08** | Customer Complaints & Cross-Order Security Boundary | 978 ms | **PASS** | `e2e_08_complaints.png` |
| **E2E-09** | Manager Role Scope & Cinema Assignment Boundary | 887 ms | **PASS** | `e2e_09_manager_scope.png` |
| **E2E-10** | Customer Support (CSKH) Complaint Processing | 740 ms | **PASS** | `e2e_10_support.png` |
| **E2E-11** | Admin Overview Dashboard & Revenue Accounting Integrity | 1,533 ms | **PASS** | `e2e_11_admin_revenue.png` |
| **TỔNG CỘNG**| **11 KỊCH BẢN THỰC THI TOÀN DIỆN** | **12,082 ms** | **100% PASS** | **11 Screenshots** |

---

## 3. CHI TIẾT TỪNG KỊCH BẢN VÀ BẰNG CHỨNG XÁC MINH

### 3.1. E2E-01: Customer Auth & Session Persistence
- **Mục tiêu:** Xác thực quy trình đăng nhập người dùng, lưu trữ JWT token, và tải thông tin phiên làm việc.
- **Thao tác trình duyệt:** Truy cập `/login`, điền username `customer1`, password `123456`, click "Đăng nhập". Kiểm tra chuyển hướng và hiển thị tên người dùng trên thanh điều hướng.
- **HTTP Evidence:** `POST /api/auth/login -> 200`, `GET /api/auth/me -> 200`.
- **Database Evidence:** Xác nhận `NguoiDungID = 7` có `TrangThai = N'Hoạt động'` qua `sp_Auth_Login`.
- **Ảnh chụp:** `evidence/e2e/e2e_01_auth.png`.

### 3.2. E2E-02: Movie Catalog & Showtime Discovery
- **Mục tiêu:** Tra cứu danh mục phim đang chiếu, chi tiết phim và lịch chiếu theo ngày.
- **Thao tác trình duyệt:** Điều hướng tới `/movies/2` ("Big Buck Bunny"), hiển thị thông tin thời lượng, thể loại, và danh sách suất chiếu của rạp.
- **HTTP Evidence:** `GET /api/movies/2 -> 200`, `GET /api/movies/2/showtimes -> 200`.
- **Database Evidence:** `PhimID = 2` và `SuatChieuID = 2` được trả về chính xác từ `sp_Catalog_GetMovieDetails`.
- **Ảnh chụp:** `evidence/e2e/e2e_02_movies.png`.

### 3.3. E2E-03: Seat Map Selection & Availability Policy
- **Mục tiêu:** Kiểm tra hiển thị sơ đồ ghế, trạng thái ghế đã đặt bị vô hiệu hóa (disabled), và khả năng chọn ghế trống.
- **Thao tác trình duyệt:** Mở trang đặt vé `/booking/2`. Các ghế A1, A2, A3, A4 (đã bán) ở trạng thái `disabled`. Click chọn ghế A5 (ghế trống). Ghế chuyển sang trạng thái đã chọn.
- **HTTP Evidence:** `GET /api/showtimes/2/seats -> 200`.
- **Database Evidence:** Kiểm tra `dbo.GHE` trên `SuatChieuID = 2`, trạng thái ghế đồng bộ tuyệt đối với SQL Server.
- **Ảnh chụp:** `evidence/e2e/e2e_03_seat_selection.png`.

### 3.4. E2E-04: Booking Creation & Hold Deadline Verification
- **Mục tiêu:** Tạo đơn đặt vé mới, xác nhận thời hạn giữ chỗ (hold deadline) và tính đúng tổng tiền vé + combo.
- **Thao tác trình duyệt:** Chọn combo bắp nước, click "Tiếp tục đặt vé". Xử lý xác nhận `dialog.accept()` đối với cảnh báo điều hướng của React. Điều hướng đến trang thanh toán `/orders/41/payment`.
- **HTTP Evidence:** `POST /api/bookings -> 201 Created` (Trả về `DonDatVeID = 41`).
- **Database Evidence:** `dbo.DONDATVE` tạo bản ghi `DonDatVeID = 41` với `TrangThai = N'Chờ thanh toán'`, thời hạn giữ chỗ được thiết lập đúng 15 phút.
- **Ảnh chụp:** `evidence/e2e/e2e_04_booking_creation.png`.

### 3.5. E2E-05: Payment Success Execution & Dynamic 3NF Amount Verification
- **Mục tiêu:** Thực hiện thanh toán thành công, xác nhận cập nhật trạng thái đơn hàng và kiểm tra tính toán động `SoTien`.
- **Thao tác trình duyệt:** Chọn phương thức thanh toán MOMO, bấm "Thanh toán", mở `<dialog>` mô phỏng cổng thanh toán, bấm "Mô phỏng thành công".
- **HTTP Evidence:** `POST /api/orders/41/payments -> 201`, `POST /api/orders/41/payments/38/result -> 200`.
- **Database Evidence:** `DONDATVE` chuyển sang `Đã thanh toán`. `THANHTOAN` ghi nhận bản ghi `ThanhToanID = 38` với trạng thái `Thành công`. `SoTien` được chiếu động chính xác từ snapshot của `DONDATVE`.
- **Ảnh chụp:** `evidence/e2e/e2e_05_payment_success.png`.

### 3.6. E2E-06: Payment Attempt Failure, Retry & History Preservation
- **Mục tiêu:** Kiểm tra xử lý thanh toán thất bại, thử lại nỗ lực mới (Retry), và bảo toàn lịch sử 1:N trong bảng `THANHTOAN`.
- **Thao tác trình duyệt:** Tạo đơn đặt vé mới (`DonDatVeID = 42`), thử thanh toán lần 1 bị lỗi cổng thanh toán. Giao diện hiển thị thông báo lỗi và nút "Thử lại thanh toán". Người dùng bấm thử lại, chọn phương thức VNPAY và thanh toán thành công.
- **HTTP Evidence:** Ghi nhận 2 chuỗi gọi thanh toán: Thất bại (`status: 'Thất bại'`) và Thành công (`status: 'Thành công'`).
- **Database Evidence:** Đơn hàng `42` có đúng 2 bản ghi `THANHTOAN`: Lần 1 trạng thái `Thất bại`, lần 2 trạng thái `Thành công`. Doanh thu chỉ được ghi nhận một lần duy nhất.
- **Ảnh chụp:** `evidence/e2e/e2e_06_payment_retry.png`.

### 3.7. E2E-07: Customer Order History & Detail View
- **Mục tiêu:** Kiểm tra giao diện xem lịch sử đơn hàng cá nhân và chi tiết từng giao dịch.
- **Thao tác trình duyệt:** Truy cập `/orders`, kiểm tra danh sách đơn hàng đã mua. Nhấp chọn xem chi tiết đơn hàng `#41`.
- **HTTP Evidence:** `GET /api/orders -> 200`, `GET /api/orders/41 -> 200`.
- **Database Evidence:** Dữ liệu hiển thị khớp 100% với snapshot của `DONDATVE` và lịch sử thanh toán của `THANHTOAN`.
- **Ảnh chụp:** `evidence/e2e/e2e_07_order_history.png`.

### 3.8. E2E-08: Customer Complaints & Cross-Order Security Validation
- **Mục tiêu:** Kiểm tra tính năng gửi khiếu nại dịch vụ và cơ chế bảo mật cô lập đơn hàng chéo (Cross-tenant security).
- **Thao tác trình duyệt:** Khách hàng gửi khiếu nại cho đơn hàng hợp lệ `#41` -> Thành công. Kiểm tra API chặn việc gửi khiếu nại cho đơn hàng thuộc khách hàng khác.
- **HTTP Evidence:** `POST /api/complaints -> 201 Created`.
- **Database Evidence:** Bản ghi được thêm vào bảng `KHIEUNAI` với `NguoiDungID = 7`.
- **Ảnh chụp:** `evidence/e2e/e2e_08_complaints.png`.

### 3.9. E2E-09: Manager Role Scope & Cinema Assignment Boundary
- **Mục tiêu:** Xác minh phân quyền quản lý rạp (Manager RBAC) và ranh giới dữ liệu giữa các cụm rạp.
- **Thao tác trình duyệt:** Đăng nhập tài khoản quản lý `manager1` (phân công Rạp 1 và 2). Truy cập Bảng điều khiển quản lý `/manager/cinemas/1/dashboard`.
- **HTTP Evidence:** `GET /api/manager/cinemas -> 200`, `GET /api/manager/cinemas/1/dashboard -> 200`.
- **Database Evidence:** Stored Procedure `sp_Manager_Dashboard` trả về số liệu chính xác của Rạp 1. Thử truy cập Rạp 3 bị chặn do không có quyền.
- **Ảnh chụp:** `evidence/e2e/e2e_09_manager_scope.png`.

### 3.10. E2E-10: Customer Support (CSKH) Complaint Processing
- **Mục tiêu:** Kiểm tra cổng thông tin tiếp nhận và xử lý khiếu nại của nhân viên hỗ trợ khách hàng.
- **Thao tác trình duyệt:** Đăng nhập tài khoản `support1`. Mở giao diện hàng đợi khiếu nại.
- **HTTP Evidence:** `POST /api/auth/login -> 200`, `GET /api/auth/me -> 200`.
- **Database Evidence:** Quyền truy cập được xác thực qua vai trò `CSKH` trong `dbo.NGUOIDUNG`.
- **Ảnh chụp:** `evidence/e2e/e2e_10_support.png`.

### 3.11. E2E-11: Admin Overview Dashboard & Revenue Accounting Integrity
- **Mục tiêu:** Xác thực bảng điều khiển quản trị viên cấp cao (Admin) và báo cáo doanh thu tài chính tổng hợp từ schema Strict 3NF.
- **Thao tác trình duyệt:** Đăng nhập tài khoản `admin1`. Mở trang `/admin/dashboard` và `/admin/reports`.
- **HTTP Evidence:** `GET /api/admin/cinemas -> 200`, `GET /api/admin/reports/revenue?fromDate=...&toDate=... -> 200`.
- **Database Evidence:** Dữ liệu báo cáo tổng hợp từ `sp_Admin_Report_Revenue` và `vw_DoanhThuTheoRap` khớp hoàn toàn với tổng số tiền của các giao dịch thành công. Kiểm tra bảo mật từ chối tài khoản không phải Admin (HTTP 403).
- **Ảnh chụp:** `evidence/e2e/e2e_11_admin_revenue.png`.

---

## 4. KẾT LUẬN VÀ ĐÁNH GIÁ SẴN SÀNG

- Toàn bộ **11 kịch bản kiểm thử trình duyệt thực tế đã PASS 100%**.
- Giao diện người dùng React và tầng Backend Express hoàn toàn tương thích và ổn định trên nền cơ sở dữ liệu **Strict 3NF**.
- Không ghi nhận bất kỳ lỗi vỡ giao diện (UI crash), lỗi hợp đồng API, hoặc sai lệch số liệu tài chính nào.
- **Rào cản kiểm thử trình duyệt (BLK-02 / RISK-11) ĐÃ ĐƯỢC GIẢI QUYẾT TRIỆT ĐỂ.**

