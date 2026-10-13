# CHECKLIST PHỤ THUỘC SQL TOÀN DIỆN (PHASE R3)
## CinemaBookingDB — Bảng Rà Soát Phụ Thuộc Chuẩn Hóa Strict 3NF

**Tài liệu:** `R3_SQL_DEPENDENCY_CHECKLIST.md`  
**Chuyên gia phụ trách:** Principal Database Architect & SQL Server Specialist  
**Ngày lập:** 13/10/2026  
**Mục tiêu:** Rà soát 100% các đối tượng SQL chịu ảnh hưởng trực tiếp và gián tiếp khi loại bỏ cột `dbo.THANHTOAN.SoTien`.

---

## 1. Bảng DDL & Ràng Buộc (Tables, Constraints & Indexes)

| Đối tượng | Loại | File định nghĩa gốc | Ảnh hưởng di trú | Hành động kỹ thuật |
|:---|:---:|:---|:---|:---|
| `dbo.THANHTOAN` | Table | `02_tables/thanhtoan.sql` | Cột `SoTien` bị loại bỏ | Giữ nguyên 8 cột còn lại. Giữ nguyên PK `ThanhToanID` |
| `dbo.THANHTOAN.SoTien` | Column | `02_tables/thanhtoan.sql:6` | Vi phạm 3NF (phụ thuộc bắc cầu) | Thực hiện `ALTER TABLE dbo.THANHTOAN DROP COLUMN SoTien` |
| `CK_THANHTOAN_SoTien` | Check Constraint | `03_constraints/003_check_constraints.sql:584` | Ràng buộc kiểm tra `SoTien >= 0` | Xóa bằng `DROP CONSTRAINT CK_THANHTOAN_SoTien` trước khi DROP COLUMN |
| `CK_THANHTOAN_PhuongThuc`| Check Constraint | `03_constraints/003_check_constraints.sql:569` | Không ảnh hưởng | **BẢO TOÀN NGUYÊN VẸN** |
| `CK_THANHTOAN_TrangThai` | Check Constraint | `03_constraints/003_check_constraints.sql:592` | Không ảnh hưởng | **BẢO TOÀN NGUYÊN VẸN** |
| `FK_THANHTOAN_DONDATVE` | Foreign Key | `03_constraints/002_foreign_keys.sql` | Không ảnh hưởng | **BẢO TOÀN NGUYÊN VẸN** |
| `PK_THANHTOAN` | Primary Key | `03_constraints/001_primary_unique.sql` | Không ảnh hưởng | **BẢO TOÀN NGUYÊN VẸN** |
| `IX_THANHTOAN_DonDatVe` | Nonclustered Index | `04_indexes/thanhtoan.sql:3` | `INCLUDE` cột `SoTien` gây lỗi DROP | Drop index cũ, tạo lại index mới chỉ gồm `INCLUDE([NgayThanhToan], [NgayTao])` |
| `UQ_THANHTOAN_MaGiaoDich`| Unique Index | `04_indexes/thanhtoan.sql:7` | Không ảnh hưởng | **BẢO TOÀN NGUYÊN VẸN** |

---

## 2. Views (Lớp Khung Nhìn Dữ Liệu)

| Tên View | File định nghĩa | Trạng thái phụ thuộc `SoTien` | Hành động kỹ thuật |
|:---|:---|:---:|:---|
| `dbo.vw_DoanhThuTheoRap` | `06_views/vw_DoanhThuTheoRap.sql` | **Trực tiếp** (dòng 18: `SUM(tt.SoTien)`) | Cập nhật trong Expand Phase: thay bằng `SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia) AS TienDaThu` |
| `dbo.vw_ChiTietDonDatVe` | `06_views/vw_ChiTietDonDatVe.sql` | **Không phụ thuộc** | Đã rà soát: Tính `TongTienThanhToan` từ `DONDATVE`, không đọc `THANHTOAN`. **Giữ nguyên.** |
| `dbo.vw_LichSuDatVe` | `06_views/vw_LichSuDatVe.sql` | **Không phụ thuộc** | Đã rà soát: Chỉ đọc `tt.TrangThai` và `tt.ThanhToanID`. **Giữ nguyên.** |

---

## 3. Stored Procedures Chịu Ảnh Hưởng Trực Tiếp (8 Procedures)

| STT | Tên Stored Procedure | File định nghĩa | Dòng ảnh hưởng | Biểu thức thay thế (Strict 3NF) |
|:---:|:---|:---|:---:|:---|
| 1 | `dbo.sp_Payment_CreateAttempt` | `08_procedures/payment/sp_Payment_CreateAttempt.sql` | Dòng 138, 150 | - Bỏ `SoTien` khỏi `INSERT dbo.THANHTOAN`<br>- SELECT trả `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien` |
| 2 | `dbo.sp_Payment_UpdateResult` | `08_procedures/payment/sp_Payment_UpdateResult.sql` | Dòng 98 | Thay `@Amount = t.SoTien` bằng `@Amount = (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)` |
| 3 | `dbo.sp_Admin_Dashboard` | `08_procedures/admin/sp_Admin_Dashboard.sql` | Dòng 90 | Thay `ISNULL(SUM(SoTien), 0)` bằng `ISNULL(SUM(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia), 0)` via JOIN `DONDATVE` |
| 4 | `dbo.sp_Admin_Report_Revenue` | `08_procedures/admin/sp_Admin_Report_Revenue.sql` | Dòng 76 | Thay `SUM(tt.SoTien)` bằng `SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia)` |
| 5 | `dbo.sp_Manager_Revenue` | `08_procedures/manager/sp_Manager_Revenue.sql` | Dòng 64 | Thay `SUM(tt.SoTien) AS TienDaThu` bằng `SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia) AS TienDaThu` |
| 6 | `dbo.sp_Order_GetDetailByCustomer` | `08_procedures/customer/sp_Order_GetDetailByCustomer.sql` | Dòng 118 | Recordset 4: SELECT `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien` via INNER JOIN `DONDATVE d` |
| 7 | `dbo.sp_StaffBooking_Detail` | `08_procedures/staff_booking/sp_StaffBooking_Detail.sql` | Dòng 203 | Recordset 4: SELECT `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien` via INNER JOIN `DONDATVE d` |
| 8 | `dbo.sp_Support_Complaint_GetOrderReference` | `08_procedures/support/sp_Support_Complaint_GetOrderReference.sql` | Dòng 120 | Recordset 4: SELECT `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien` via INNER JOIN `DONDATVE d` |

---

## 4. Stored Procedures Tham Chiếu THANHTOAN Nhưng Không Đọc SoTien (Đã Thẩm Định An Toàn)

| Tên Stored Procedure | File định nghĩa | Mục đích sử dụng `THANHTOAN` | Đánh giá Tương thích 3NF |
|:---|:---|:---|:---:|
| `dbo.sp_XuLyThanhToan` | `08_procedures/payment/sp_XuLyThanhToan.sql` | Wrapper ủy quyền gọi `sp_Payment_UpdateResult` | **TƯƠNG THÍCH 100%** |
| `dbo.sp_Manager_Dashboard` | `08_procedures/manager/sp_Manager_Dashboard.sql` | Kiểm tra tồn tại giao dịch thành công trong ngày | **TƯƠNG THÍCH 100%** |
| `dbo.sp_StaffBooking_Cancel` | `08_procedures/staff_booking/sp_StaffBooking_Cancel.sql` | Khóa `THANHTOAN` khi hủy đơn | **TƯƠNG THÍCH 100%** |
| `dbo.sp_StaffBooking_List` | `08_procedures/staff_booking/sp_StaffBooking_List.sql` | Truy vấn `TrangThaiThanhToanMoiNhat` | **TƯƠNG THÍCH 100%** |
| `dbo.sp_StaffBooking_UpdateSeats` | `08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql` | Kiểm tra trạng thái thanh toán | **TƯƠNG THÍCH 100%** |
| `dbo.sp_Showtime_CancelCascade` | `08_procedures/system/sp_Showtime_CancelCascade.sql` | Tra cứu đơn đã thanh toán để bồi thường | **TƯƠNG THÍCH 100%** |

---

## 5. Functions & Triggers (Hàm & Kích Hoạt)

- **Functions:**
  - `dbo.fn_TinhTongTienDon`: Đã tính từ `dbo.DONDATVE` (`TongTienVe + TongTienDoAn - TienGiamGia`), hoàn toàn không tham chiếu `THANHTOAN.SoTien`.
  - `dbo.fn_ThoiGianGiaHanThanhToanPhut`, `dbo.fn_BayGio`, `dbo.fn_NgayKinhDoanh`, `dbo.fn_HomNay`: Không phụ thuộc `THANHTOAN.SoTien`.
- **Triggers:**
  - Không có bất kỳ Trigger nào trong cơ sở dữ liệu tham chiếu đến bảng `THANHTOAN` hoặc cột `SoTien`.

---

## 6. Seed Scripts & Test Fixtures (Dữ Liệu Khởi Tạo & Kiểm Thử)

Các file này không thực thi trong quá trình di trú, nhưng cần được ghi nhận để đồng bộ hóa mã nguồn dài hạn sau khi Gate C hoàn tất:

| File | Dòng tham chiếu | Nội dung tham chiếu | Hướng xử lý sau Gate C |
|:---|:---:|:---|:---|
| `10_seed/test_fixture/lifecycle-v2.sql` | 848, 871, 1289, 1385 | Insert dữ liệu thanh toán mẫu có cột `SoTien` | Cập nhật bỏ cột `SoTien` khỏi câu lệnh INSERT seed |
| `10_seed/verify/functional-state.sql` | 116 | Truy vấn kiểm tra `t.SoTien` | Cập nhật truy vấn qua JOIN `DONDATVE` |
| `10_seed/verify/seed-v2.sql` | 60 | So sánh `t.SoTien <> d.TongTienVe + ...` | Xóa điều kiện thừa vì `t.SoTien` không còn tồn tại |
| `11_tests/r6-group-a/integrity.sql` | 102 | Test asserting redundancy `t.SoTien = d.TongTien...` | Thay thế bằng test đối soát tái dựng từ View/SP |

---

## 7. Baseline Verification Scripts (`database/12_verify/`)

Cơ sở dữ liệu có cơ chế kiểm tra baseline snapshot qua JSON manifests:
- `12_verify/verify_schema.sql` (dòng 3129: chứa manifest kỳ vọng cột `SoTien`).
- `12_verify/verify_constraints.sql` (dòng 1294: chứa manifest kỳ vọng constraint `CK_THANHTOAN_SoTien`).
- `12_verify/verify_objects.sql` (dòng 492, 5450, 5521: so sánh mã nguồn Stored Procedures dạng text).

*Khuyến nghị kỹ thuật:* Trong Phase R4 sau khi hoàn tất migration, nếu chạy pipeline xác minh baseline toàn cục `verify_objects.sql`, cần cập nhật baseline manifests theo schema 3NF đã duyệt.

---

## 8. Backend & API Contract Checklist

| Module Backend | File | Cách sử dụng `SoTien` | Đánh giá Rủi ro |
|:---|:---|:---|:---:|
| `orderService.js` | `backend/src/services/orderService.js:67, 118` | `amount: number(row.SoTien)` | **ZERO RỦI RO** (SP trả về alias `AS SoTien`) |
| `bookingService.js` | `backend/src/services/bookingService.js` | Nhận kết quả từ `sp_Booking_Create` | **ZERO RỦI RO** |
| `procedures.js` | `backend/src/db/procedures.js` | Gọi SP `sp_Payment_CreateAttempt` | **ZERO RỦI RO** (Parameters không đổi) |
| Backend Tests | `backend/tests/orderService.test.js` | Assert thuộc tính `amount` | **ZERO RỦI RO** (Thuộc tính JSON giữ nguyên) |
| Backend Tests | `backend/tests/orderDetailReadOnly.test.js` | Assert chi tiết đơn hàng | **ZERO RỦI RO** |

