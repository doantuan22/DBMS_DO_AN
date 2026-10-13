# R5-B DATA RECONCILIATION REPORT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R5-B — Post-Migration Data Reconciliation  
**Vai trò:** Principal Database Reliability Engineer & Data Audit Specialist  
**Cơ sở dữ liệu mục tiêu:** `CinemaBookingDB_Test`  
**Tài khoản thực thi:** `CinemaTestUser`  
**MigrationRunID:** `A0DC51EF-214B-4169-8FDE-D53F0DB17FAD` (và `AB352E8F-0734-4401-8355-CC6D51AC13C5`)  
**Script đối soát:** `database/13_migrations/3nf_remediation/04_post_migration_reconciliation.sql`  
**Thời gian đối soát:** 13/10/2026 15:47:00 – 15:56:00 (ICT)  
**Trạng thái kiểm toán:** **100% VERIFIED PASS — KHỚP CHÍNH XÁC TUYỆT ĐỐI**  

---

## 1. Tóm tắt kết quả đối soát dữ liệu (Executive Summary)

Sau khi hoàn thành Contract Phase (loại bỏ cột vật lý `dbo.THANHTOAN.SoTien`), quy trình đối soát dữ liệu tự động hai chiều (Bidirectional Reconciliation via FULL OUTER JOIN) đã được thực thi đối chiếu giữa:
- **Nguồn đối soát gốc (Pre-Migration Baseline):** Được đóng băng tại `tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test` và file artifact JSON ngoại vi.
- **Nguồn dữ liệu hiện tại (Post-Migration Runtime):** Bảng `dbo.THANHTOAN` liên kết động với `dbo.DONDATVE` trên database `CinemaBookingDB_Test`.

**Kết quả tổng quát:**
- 0 bản ghi thanh toán bị thiếu (Missing = 0).
- 0 bản ghi thanh toán bị thừa (Extra = 0).
- 0 sai lệch số tiền tái dựng (Amount Mismatch = 0).
- 0 sai lệch trạng thái giao dịch (Status Mismatch = 0).
- 0 bản ghi mồ côi (Orphan Payments = 0).
- 100% doanh thu lịch sử được tái dựng chính xác đến từng đồng (446,500.00 VNĐ).

---

## 2. Đối soát cấp độ tổng hợp (Aggregate Level Reconciliation)

Bảng đối chiếu toàn diện các chỉ số vĩ mô trước và sau khi chuẩn hóa 3NF:

| Chỉ số kiểm toán (Metric) | Pre-Migration Baseline | Post-Migration Reconstructed | Chênh lệch (Delta) | Đánh giá |
|---|:---:|:---:|:---:|:---:|
| **Số lượng bảng nghiệp vụ** | 27 | 27 | 0 | **PASS** |
| **Tổng số Payment Attempts** | 4 | 4 | 0 | **PASS** |
| **Số đơn hàng có thanh toán** | 3 | 3 | 0 | **PASS** |
| **Số giao dịch Thành công** | 3 | 3 | 0 | **PASS** |
| **Số giao dịch Thất bại** | 1 | 1 | 0 | **PASS** |
| **Giao dịch Đang xử lý / Hoàn tiền** | 0 | 0 | 0 | **PASS** |
| **Tổng doanh thu thực tế (VNĐ)** | **446,500.00** | **446,500.00** | **0.00** | **PASS** |
| **Số bản ghi SoTien IS NULL** | 0 | N/A (Đã drop cột) | 0 | **PASS** |
| **Số đơn hàng có thành phần NULL** | 0 | 0 | 0 | **PASS** |
| **Số tiền tái dựng âm (< 0)** | 0 | 0 | 0 | **PASS** |
| **Số bản ghi mồ côi (Orphan)** | 0 | 0 | 0 | **PASS** |

---

## 3. Đối soát chi tiết hai chiều từng dòng (Bidirectional Row-by-Row Reconciliation)

Truy vấn đối soát hai chiều được thực hiện thông qua mệnh đề `FULL OUTER JOIN`:

```sql
SELECT 
    @MissingAttemptsCount = SUM(CASE WHEN tt.ThanhToanID IS NULL THEN 1 ELSE 0 END),
    @ExtraAttemptsCount   = SUM(CASE WHEN b.ThanhToanID IS NULL THEN 1 ELSE 0 END),
    @AmountMismatchCount  = SUM(CASE WHEN b.ThanhToanID IS NOT NULL AND tt.ThanhToanID IS NOT NULL 
                                     AND b.SoTien <> (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) THEN 1 ELSE 0 END),
    @StatusMismatchCount  = SUM(CASE WHEN b.ThanhToanID IS NOT NULL AND tt.ThanhToanID IS NOT NULL 
                                     AND b.TrangThai <> tt.TrangThai COLLATE DATABASE_DEFAULT THEN 1 ELSE 0 END),
    @OrderMismatchCount   = SUM(CASE WHEN b.ThanhToanID IS NOT NULL AND tt.ThanhToanID IS NOT NULL 
                                     AND b.DonDatVeID <> tt.DonDatVeID THEN 1 ELSE 0 END)
FROM tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test b
FULL OUTER JOIN dbo.THANHTOAN tt ON tt.ThanhToanID = b.ThanhToanID
LEFT JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID;
```

### Bảng kê chi tiết toàn bộ 4 bản ghi thanh toán:

| ThanhToanID | DonDatVeID | Phương thức | Số tiền vật lý gốc | Số tiền tái dựng từ DONDATVE | Trạng thái gốc | Trạng thái sau di trú | Mã giao dịch | Kết quả |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|:---:|
| **1** | 3 | VNPAY | 99,000.00 | 99,000.00 | Thất bại | Thất bại | `TXN-20261012154546-3-9FDA66` | **MATCH** |
| **2** | 3 | VNPAY | 99,000.00 | 99,000.00 | Thành công | Thành công | `TXN-20261012154546-3-3F17CD` | **MATCH** |
| **3** | 4 | MOMO | 247,500.00 | 247,500.00 | Thành công | Thành công | `TXN-20261012154546-4-FE5934` | **MATCH** |
| **4** | 5 | VNPAY | 100,000.00 | 100,000.00 | Thành công | Thành công | `V2-HISTORY-5` | **MATCH** |

### Phân tích nghiệp vụ sâu (In-depth Business Proof):
1. **Đơn hàng 3 (DonDatVeID = 3):**
   - Đơn hàng này có **2 Payment Attempts** (ThanhToanID 1 thất bại, ThanhToanID 2 thành công).
   - Trước di trú: Cả 2 attempt đều lưu giá trị vật lý `SoTien = 99,000.00`.
   - Sau di trú: Cả 2 attempt đều được tái dựng từ `DONDATVE` (`TongTienVe (75k) + TongTienDoAn (35k) - TienGiamGia (11k) = 99,000.00`).
   - Cả 2 attempt hiển thị cùng một số tiền chính xác, không bị gộp dòng, không bị mất attempt thất bại ban đầu.
   - Khi tính doanh thu tại View và Procedure: Chỉ attempt thành công (ThanhToanID = 2) được tính, đảm bảo **không bao giờ bị tính trùng doanh thu** cho đơn hàng có nhiều attempt.
2. **Đơn hàng 4 (DonDatVeID = 4):**
   - Số tiền tái dựng: 247,500.00 VNĐ. Khớp 100% với số tiền vật lý ban đầu.
3. **Đơn hàng 5 (DonDatVeID = 5):**
   - Số tiền tái dựng: 100,000.00 VNĐ. Khớp 100% với số tiền vật lý ban đầu.

---

## 4. Kiểm thử chức năng các module SQL phụ thuộc (Functional Module Validation)

Script đối soát `04_post_migration_reconciliation.sql` đã tự động phát hiện tham số động (Dynamic Discovery) và thực thi kiểm thử 5 module:

1. **`dbo.vw_DoanhThuTheoRap` (View):**
   - Thực thi thành công, trả về dữ liệu doanh thu của **4 rạp chiếu**.
   - Tổng doanh thu thực tế tính toán từ View: **446,500.00 VNĐ**.
   - Trạng thái: **PASS**.
2. **`dbo.sp_Admin_Dashboard` (Stored Procedure):**
   - Thực thi với `@ActorID = 1` (Admin).
   - Truy vấn dashboard tổng quan toàn hệ thống thành công không phát sinh lỗi cột thiếu.
   - Trạng thái: **PASS**.
3. **`dbo.sp_Admin_Report_Revenue` (Stored Procedure):**
   - Thực thi với `@ActorID = 1` (Admin).
   - Báo cáo doanh thu phân tích theo rạp và theo ngày khớp chính xác 446,500.00 VNĐ.
   - Trạng thái: **PASS**.
4. **`dbo.sp_Order_GetDetailByCustomer` (Stored Procedure):**
   - Thực thi với `@NguoiDungID = 7, @DonDatVeID = 1`.
   - Trả về đủ 4 result sets (Thông tin đơn, Chi tiết vé, Chi tiết đồ ăn, Lịch sử thanh toán).
   - Trường `SoTien` trong result set 4 trả về đúng kiểu `DECIMAL(18,2)`.
   - Trạng thái: **PASS**.
5. **`dbo.sp_StaffBooking_Detail` (Stored Procedure):**
   - Thực thi với `@ActorID = 1, @PortalRole = 'ADMIN', @DonDatVeID = 1`.
   - Trả về thông tin chi tiết đặt vé nhân viên với trường `SoTien` hợp lệ.
   - Trạng thái: **PASS**.

---

## 5. Kết luận đối soát dữ liệu (Reconciliation Conclusion)

- **Độ chính xác dữ liệu:** 100.0000% (Không sai lệch dù chỉ 1 xu).
- **Tính toàn vẹn lịch sử:** Toàn bộ các attempt thành công lẫn thất bại được bảo lưu nguyên trạng.
- **Tuân thủ chuẩn 3NF:** Thuộc tính dư thừa `THANHTOAN.SoTien` bị loại bỏ vật lý mà không làm ảnh hưởng đến tính đúng đắn của bất kỳ truy vấn hay báo cáo tài chính nào.
- **KẾT LUẬN:** **R5-B DATA RECONCILIATION: VERIFIED PASS**.

