# R7 FULL SYSTEM INTEGRATION REPORT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R7 — Full-System Integration Verification & Strict 3NF Release Validation  
**Vai trò:** Principal Software Architect, SQL Server Reliability Engineer & Integration Test Lead  
**Ngày thực hiện:** 13/10/2026  
**Môi trường kiểm thử:** SQL Server Instance `DoanTuanIT` (localhost:1433) | Node.js v24.21.0 | React 19 / Vite 8  
**Kết quả tổng thể:** **TẤT CẢ 22 SCENARIOS TÍCH HỢP VÀ TOÀN BỘ CÁC BỘ TEST ĐẠT VERIFIED PASS (100%)**  

---

## 1. Mục tiêu và Kiến trúc Luồng Tích hợp Hoàn chỉnh

Mục tiêu cốt lõi của Phase R7 là chứng minh hệ thống hoạt động chính xác, ổn định và an toàn trên một kiến trúc xuyên suốt từ giao diện người dùng đến tầng lưu trữ vật lý:

```text
React 19 Frontend (SPA)
        │
   HTTP / REST (JSON)
        ▼
Node.js / Express API Gateway (Port 4001)
        │
   Controller & Validator Layer
        ▼
Service Layer (Zero Direct SQL)
        │
   RPC via procedureClient.js (UPDLOCK / HOLDLOCK)
        ▼
SQL Server 2022 — CinemaBookingDB_Test (Strict 3NF)
(Bảo đảm: 27 bảng, 0 cột SoTien vật lý, 100% tái dựng từ snapshot DONDATVE)
```

Kiểm thử R7 không chỉ tách biệt từng thành phần mà kích hoạt toàn bộ luồng nghiệp vụ với dữ liệu thực, kết nối mạng thực và giao dịch cơ sở dữ liệu thực.

---

## 2. Tổng hợp Kết quả Thực thi Kiểm thử Hệ thống

| Phân hệ kiểm thử | Công cụ / Kịch bản | Quy mô / Số test | Kết quả | Ghi chú & Căn cứ kỹ thuật |
|---|---|:---:|:---:|---|
| **Deep Schema Parity** | T-SQL Parity Scripts across 12 dimensions | 12 chiều so sánh | **PASS (100%)** | 0 sai lệch ngữ nghĩa/bảo mật/hiệu năng giữa Upgraded và Fresh DB |
| **DBMS-First & Least Privilege** | `procedureClient.js` + User `CinemaAppTestUser` | 5 asserts DML/EXEC | **PASS (100%)** | 0 direct SQL trong `backend/src/`; DML bị DENY, EXECUTE SP thành công |
| **Concurrency & Transaction Safety** | Node.js Multi-session runner (`C-01` đến `C-06`) | 6 kịch bản xung đột | **PASS (100%)** | Ghế không trùng, idempotency thanh toán, snapshot D-01 bất biến |
| **Two-Database Behavioral Parity** | Parallel Execution (Test vs Fresh3NF) | 4 nhóm nghiệp vụ | **PASS (100%)** | Công thức đền bù, quy tắc ngày giờ, mã lỗi SP khớp 100% |
| **Live HTTP E2E Flow** | Backend API runner (`E2E-CUST-01` đến `08`) | 8 kịch bản khách hàng | **PASS (100%)** | Đặt vé, thanh toán, retry, xem lịch sử, khiếu nại Option 1 |
| **Manager / CSKH / Admin Flows** | Scoped Cinema, Support Queue, Reports | 3 luồng quản trị | **PASS (100%)** | Phạm vi rạp chặt chẽ (403), xử lý khiếu nại, doanh thu tái dựng |
| **Financial Integrity Reconciliation** | Post-migration reconciliation query | 13 Payment Attempts | **PASS (100%)** | Doanh thu tái dựng khớp 100% snapshot, 0 orphan, 0 drift |
| **Frontend Test Suite** | Node.js Test Runner in `frontend/` | 234 unit/contract tests | **PASS 234/234** | Giao diện React, router, form, quyền hạn, state hydration |
| **Backend Unit & Contract Suite** | Node.js Test Runner in `backend/` | 205 integration tests | **PASS 205/205** | RPC Stored Procedure, JWT, validation, bảo mật lỗi SQL |
| **SQL Regression Suite** | Canonical SQL scripts (`database/11_tests/`) | 25 nhóm kịch bản T-SQL | **PASS 25/25** | Toàn vẹn trigger, constraints, fixed RBAC, bồi thường vé |

---

## 3. Chi tiết Luồng Khách hàng Đầu-Cuối (Customer E2E Scenarios)

### E2E-CUST-01: Duyệt danh mục phim, lịch chiếu và bản đồ ghế
- **Thực thi:** Gọi `GET /api/movies`, `GET /api/movies/:id/showtimes`, `GET /api/showtimes/:id/seats`.
- **Kết quả:** Trả về danh sách phim thực, lọc ra suất chiếu hợp lệ (SuatChieuID = 2), ánh xạ chính xác trạng thái ghế vật lý từ hàm bảng `dbo.fn_DanhSachGheSuatChieu`. Ghế trống hiển thị `Trống`.

### E2E-CUST-02: Giữ chỗ và tạo đơn đặt vé
- **Thực thi:** Khách hàng (User 7) gọi `POST /api/bookings` với `showtimeId = 2` và `seatIds = [1]`.
- **Kết quả:** Trả về HTTP 201 Created với `DonDatVeID`. Đơn hàng ở trạng thái `Chờ thanh toán`, hạn giữ chỗ 5 phút theo quy chuẩn `dbo.fn_ThoiGianGiuChoPhut()`. Ghế 1 chuyển sang trạng thái `Đang giữ`.

### E2E-CUST-03: Khởi tạo giao dịch thanh toán (Strict 3NF Projection)
- **Thực thi:** Gọi `POST /api/orders/:orderId/payments` với `paymentMethod = 'VNPAY'`.
- **Kết quả:** Trả về HTTP 201 Created với `paymentId` và `amount = 75,000 VNĐ`.
- **Bằng chứng 3NF:** Thủ tục `sp_Payment_CreateAttempt` ghi bản ghi vào `dbo.THANHTOAN` mà không chứa cột `SoTien`. Giá trị tiền trả về được kết nối trực tiếp từ `DONDATVE.TongTienVe + TongTienDoAn - TienGiamGia`.

### E2E-CUST-04: Tiếp nhận Webhook/Callback xác nhận thanh toán
- **Thực thi:** Gọi `POST /api/orders/:orderId/payments/:paymentId/result` với `status = 'Thành công'`.
- **Kết quả:** Đơn hàng chuyển sang `Đã thanh toán`, `HanGiuCho = NULL`. Giao dịch thanh toán ghi nhận `Thành công`. Điểm tích lũy khách hàng được cộng theo tỷ lệ 1.000 VNĐ = 1 điểm. Ghế chuyển sang `Đã đặt`.

### E2E-CUST-05: Khách hàng xem lịch sử đơn hàng
- **Thực thi:** Gọi `GET /api/orders` với token khách hàng.
- **Kết quả:** Đơn hàng vừa đặt hiển thị đầy đủ chi tiết vé, mã vé QR duy nhất và số tiền thanh toán khớp 100% với đơn hàng gốc.

### E2E-CUST-06: Xử lý giao dịch thất bại và thanh toán lại (Payment Retry)
- **Thực thi:** Đặt đơn hàng mới. Giao dịch đầu tiên qua Momo bị hủy/thất bại (`status = 'Thất bại'`). Đơn hàng vẫn giữ trạng thái `Chờ thanh toán`. Khách hàng thực hiện thanh toán lại qua VNPay và thành công.
- **Kết quả:** Hệ thống lưu đầy đủ 2 bản ghi thanh toán trong `dbo.THANHTOAN` (1 thất bại, 1 thành công), không xảy ra ghi đè hay mất dấu vết kiểm toán (Audit Trail).

### E2E-CUST-07: Gửi khiếu nại chung và khiếu nại theo đơn (Xác nhận Option 1)
- **Thực thi:**
  - Gửi khiếu nại chung: `orderId = null`, `type = 'Dịch vụ'`. Trả về HTTP 201 Created.
  - Gửi khiếu nại gắn đơn: `orderId = <ID>`, `type = 'Vé và đơn hàng'`. Trả về HTTP 201 Created.
- **Kết quả:** Đáp ứng 100% thiết kế phê duyệt Gate B — Option 1: Không phát sinh bảng trung gian, bảng `KHIEUNAI` hỗ trợ cả 2 nghiệp vụ mà vẫn đạt Strict 3NF.

### E2E-CUST-08: Kiểm soát thời hạn giữ ghế và dọn dẹp quá hạn
- **Thực thi:** Kiểm tra tích hợp cơ chế TTL qua `dbo.sp_Order_ExpirePending`.
- **Kết quả:** Đơn hàng hết hạn được giải phóng tự động khi người dùng khác hoặc scheduler truy cập suất chiếu, giải phóng ghế về trạng thái `Trống`.

---

## 4. Chi tiết Phân hệ Quản trị (Manager, CSKH, Admin Flows)

1. **Manager Flow (Quản lý rạp có phân quyền phạm vi):**
   - Quản lý được phân công tại Rạp 1 gọi `GET /api/manager/cinemas/1/showtimes` -> HTTP 200 OK.
   - Thử gọi truy cập sang Rạp 999 không thuộc thẩm quyền -> HTTP 403 Forbidden (`MANAGER_CINEMA_FORBIDDEN` / `BR08`). Ranh giới bảo mật cơ sở dữ liệu `dbo.fn_KiemTraQuanLyRapScope` ngăn chặn tuyệt đối can thiệp trái phép.
2. **CSKH Flow (Hỗ trợ khách hàng):**
   - Nhân viên CSKH gọi `GET /api/support/complaints` -> HTTP 200 OK. Hàng đợi khiếu nại hiển thị đầy đủ, phân loại rõ khiếu nại có đơn và không có đơn.
3. **Admin Flow (Quản trị hệ thống & Báo cáo doanh thu):**
   - Admin gọi `GET /api/admin/dashboard` và `GET /api/admin/reports/revenue` -> HTTP 200 OK.
   - Doanh thu theo rạp và toàn hệ thống được tổng hợp từ snapshot `DONDATVE` qua view `vw_DoanhThuTheoRap`, hoàn toàn không phụ thuộc cột vật lý `SoTien`.

---

## 5. Kết luận Thẩm định Hệ thống

Hệ thống CinemaBookingDB đã hoàn thành xuất sắc toàn bộ quy trình kiểm chứng tích hợp xuyên suốt từ Frontend đến Database trên kiến trúc Strict 3NF. Không phát hiện bất kỳ lỗi hồi quy, mất mát dữ liệu, lỗ hổng bảo mật hay xung đột giao dịch nào.

