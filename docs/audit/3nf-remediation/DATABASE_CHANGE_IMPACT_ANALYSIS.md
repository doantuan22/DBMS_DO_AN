# DATABASE CHANGE IMPACT ANALYSIS — CINEMABOOKINGDB
**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Chuyên gia phụ trách:** Principal Database Architect & Software Migration Architect  
**Tài liệu:** Phân tích Tác động Phụ thuộc và Đảm bảo Hợp đồng Kỹ thuật (Impact Analysis)  
**Ngày cập nhật:** 13/10/2026  
**Trạng thái tài liệu:** **GATE B TECHNICAL SUBMISSION — LOCKED SCOPE (27 TABLES)**  

---

## 1. Tổng quan Phạm vi Tác động Kỹ thuật

Theo quyết định Gate B của Chủ dự án:
- **Lựa chọn mô hình `KHIEUNAI`:** **Phương án 1 — Giữ nguyên 27 bảng**. Không thêm bảng `KHIEUNAI_DONDATVE`, không thay đổi schema của `KHIEUNAI`.
- **Lựa chọn mô hình `THANHTOAN`:** **Phương án A — Loại bỏ cột vật lý `SoTien`**.
- **Tổng số bảng thay đổi schema:** **1 bảng duy nhất** (`dbo.THANHTOAN`).
- **Tổng số cột bị loại bỏ:** **1 cột duy nhất** (`THANHTOAN.SoTien`).
- **Tổng số module SQL chịu ảnh hưởng:** **8 Stored Procedures + 1 View**.
- **Tác động đến Backend/Frontend:** **0 dòng code thay đổi**. Hợp đồng REST API và JSON DTO giữ nguyên 100%.

---

## 2. Chi tiết các SQL Objects bị ảnh hưởng trực tiếp

### 2.1. Cấu trúc Bảng và Ràng buộc Vật lý (Schema & Constraints)
1. **Bảng `dbo.THANHTOAN`:**
   - **Vị trí file:** `database/02_tables/thanhtoan.sql` ([thanhtoan.sql:6](file:///d:/DBMS_DO_AN/database/02_tables/thanhtoan.sql#L6))
   - **Thay đổi:** Loại bỏ định nghĩa cột `[SoTien] decimal(18, 2) NOT NULL`.
   - **Tác động vật lý:** Giảm 9 bytes/dòng dữ liệu, tối ưu hóa kích thước trang (Page Density).
2. **Check Constraint `dbo.CK_THANHTOAN_SoTien`:**
   - **Vị trí file:** `database/03_constraints/003_check_constraints.sql` ([003_check_constraints.sql:584](file:///d:/DBMS_DO_AN/database/03_constraints/003_check_constraints.sql#L584))
   - **Thay đổi:** `ALTER TABLE dbo.THANHTOAN DROP CONSTRAINT CK_THANHTOAN_SoTien;`
   - **Tác động:** Hủy ràng buộc tương ứng với cột bị loại bỏ.
3. **Index `dbo.IX_THANHTOAN_DonDatVe`:**
   - **Vị trí file:** `database/04_indexes/thanhtoan.sql` ([thanhtoan.sql:3](file:///d:/DBMS_DO_AN/database/04_indexes/thanhtoan.sql#L3))
   - **Thay đổi:** Tái tạo lại index không còn `[SoTien]` trong mệnh đề `INCLUDE`:
     ```sql
     CREATE NONCLUSTERED INDEX [IX_THANHTOAN_DonDatVe] 
     ON dbo.[THANHTOAN]([DonDatVeID] ASC, [TrangThai] ASC) 
     INCLUDE([NgayThanhToan], [NgayTao]);
     ```
   - **Tác động:** Giảm kích thước trang chỉ mục, tăng hiệu năng ghi khi tạo attempt mới.

---

### 2.2. Danh sách 8 Stored Procedures và 1 View chịu ảnh hưởng

Toàn bộ các module đều được điều chỉnh tại mệnh đề chiếu (SELECT projection) để bảo toàn tên trường `SoTien`:

| STT | Module Name | Loại | Vị trí file | Dòng tham chiếu | Bản chất thay đổi | Đảm bảo tương thích |
|---:|---|:---:|---|:---:|---|---|
| 1 | `sp_Payment_CreateAttempt` | SP | `database/08_procedures/payment/sp_Payment_CreateAttempt.sql` | [L138](file:///d:/DBMS_DO_AN/database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L138), [L150](file:///d:/DBMS_DO_AN/database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L150) | Bỏ `SoTien` khỏi câu lệnh `INSERT INTO dbo.THANHTOAN`; câu lệnh `SELECT` cuối thủ tục trả về `@Amount AS SoTien`. | Backend `paymentAttemptDto` nhận đủ `row.SoTien`. |
| 2 | `sp_Payment_UpdateResult` | SP | `database/08_procedures/payment/sp_Payment_UpdateResult.sql` | [L98](file:///d:/DBMS_DO_AN/database/08_procedures/payment/sp_Payment_UpdateResult.sql#L98) | Đọc `@Amount = (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)` từ bảng `DONDATVE d` (đã có JOIN sẵn trong SP). | Điểm tích lũy `@Points = @Amount / 1000` tính toán chính xác 100%. |
| 3 | `sp_Order_GetDetailByCustomer` | SP | `database/08_procedures/customer/sp_Order_GetDetailByCustomer.sql` | [L118](file:///d:/DBMS_DO_AN/database/08_procedures/customer/sp_Order_GetDetailByCustomer.sql#L118) | Resultset thứ 4 đổi thành: `SELECT tt.ThanhToanID, tt.PhuongThuc, (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien, ... FROM dbo.THANHTOAN tt INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID`. | Backend `paymentDto` nhận đúng `row.SoTien`. |
| 4 | `sp_StaffBooking_Detail` | SP | `database/08_procedures/staff_booking/sp_StaffBooking_Detail.sql` | [L203](file:///d:/DBMS_DO_AN/database/08_procedures/staff_booking/sp_StaffBooking_Detail.sql#L203) | Resultset attempt đổi sang chiếu `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien`. | Giao diện quản lý nhân viên hiển thị chính xác. |
| 5 | `sp_Support_Complaint_GetOrderReference` | SP | `database/08_procedures/support/sp_Support_Complaint_GetOrderReference.sql` | [L120](file:///d:/DBMS_DO_AN/database/08_procedures/support/sp_Support_Complaint_GetOrderReference.sql#L120) | Resultset attempt đổi sang chiếu `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien`. | Màn hình hỗ trợ CSKH hiển thị chính xác. |
| 6 | `sp_Admin_Report_Revenue` | SP | `database/08_procedures/admin/sp_Admin_Report_Revenue.sql` | [L76](file:///d:/DBMS_DO_AN/database/08_procedures/admin/sp_Admin_Report_Revenue.sql#L76) | Thay `SUM(tt.SoTien)` bằng `SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia)` cho các đơn có `tt.TrangThai = 'Thành công'`. | Báo cáo doanh thu Admin khớp 100%. |
| 7 | `sp_Manager_Revenue` | SP | `database/08_procedures/manager/sp_Manager_Revenue.sql` | [L64](file:///d:/DBMS_DO_AN/database/08_procedures/manager/sp_Manager_Revenue.sql#L64) | Thay `SUM(tt.SoTien) AS TienDaThu` bằng `SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia) AS TienDaThu`. | Báo cáo doanh thu Quản lý rạp khớp 100%. |
| 8 | `sp_Admin_Dashboard` | SP | `database/08_procedures/admin/sp_Admin_Dashboard.sql` | [L90](file:///d:/DBMS_DO_AN/database/08_procedures/admin/sp_Admin_Dashboard.sql#L90) | Thay `SUM(SoTien)` bằng `SUM(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)` kết nối với `DONDATVE d`. | Dashboard Admin hiển thị đúng tổng doanh thu toàn thời gian. |
| 9 | `vw_DoanhThuTheoRap` | View | `database/06_views/vw_DoanhThuTheoRap.sql` | [L18](file:///d:/DBMS_DO_AN/database/06_views/vw_DoanhThuTheoRap.sql#L18) | Thay `SUM(tt.SoTien) AS TienDaThu` bằng `SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia) AS TienDaThu`. | View doanh thu rạp khớp 100%, không thêm phép JOIN mới. |

---

## 3. Bảo toàn Hợp đồng Backend và API (Zero Code Change)

### 3.1. Đối chiếu Client & DTO Mappings trong Backend
Trong `backend/src/services/orderService.js` ([orderService.js#L67](file:///d:/DBMS_DO_AN/backend/src/services/orderService.js#L67), [orderService.js#L118](file:///d:/DBMS_DO_AN/backend/src/services/orderService.js#L118)):
```javascript
function paymentDto(row) {
  return {
    id: row.ThanhToanID,
    method: row.PhuongThuc,
    amount: number(row.SoTien),       // <-- Đọc trực tiếp thuộc tính row.SoTien từ SP resultset
    createdAt: row.NgayTao,
    paidAt: row.NgayThanhToan,
    transactionCode: row.MaGiaoDich,
    status: row.TrangThai,
    note: row.GhiChu,
  };
}
```
- **Cam kết:** Do các Stored Procedure chiếu bí danh `AS SoTien`, driver `mssql` tiếp tục trả về JavaScript object có key `row.SoTien` với kiểu dữ liệu `decimal(18,2)`.
- **Hợp đồng REST API:** JSON response giữ nguyên trường `amount`, không bị đổi tên hay đổi cấu trúc:
  ```json
  {
    "id": 2,
    "method": "VNPAY",
    "amount": 99000,
    "createdAt": "2026-10-12T15:45:46.291Z",
    "status": "Thành công"
  }
  ```
- **Frontend UI:** Giao diện người dùng tiếp tục hoạt động hoàn hảo mà không cần bất kỳ chỉnh sửa nào.

---

## 4. Bảo đảm Bất biến DBMS-First

1. **Khóa đóng băng tiền:** Thủ tục `sp_StaffBooking_UpdateSeats` ([sp_StaffBooking_UpdateSeats.sql#L90-L98](file:///d:/DBMS_DO_AN/database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql#L90-L98)) kiểm tra `IF EXISTS (SELECT 1 FROM dbo.THANHTOAN WHERE DonDatVeID = @DonDatVeID) THROW 50514`. Bất biến này hoạt động dựa trên sự tồn tại dòng (`EXISTS 1`), không phụ thuộc vào cột `SoTien`.
2. **Phân quyền bảo mật:** Role `db_executor` ([001_execute_role.sql:8](file:///d:/DBMS_DO_AN/database/09_security/001_execute_role.sql#L8)) chỉ cấp quyền `EXECUTE` trên Stored Procedure, ngăn chặn tuyệt đối các ứng dụng thực thi lệnh DML trực tiếp.

---
*Tài liệu phân tích tác động phục vụ Gate B. Không thực hiện chỉnh sửa source SQL khi chưa có quyết định chính thức.*
