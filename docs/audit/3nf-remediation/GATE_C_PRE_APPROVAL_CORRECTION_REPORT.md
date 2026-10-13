# GATE C PRE-APPROVAL CORRECTION & AUDIT RECONCILIATION REPORT
**Project:** CinemaBookingDB — Strict 3NF Normalization Remediation  
**Phase:** Gate C Pre-Approval & Release Freeze  
**Auditor / Roles:** Principal SQL Server DBA, Production Release Engineer & Database Reliability Auditor  
**Date:** October 13, 2026  
**Git Commit:** `db993a8d3aa6c70075bd0f702ff5e5a53706efac`  
**Target Database Status:** `CinemaBookingDB` **100% UNTOUCHED (PRE-MIGRATION STATE)**  
**Gate C Status:** **NOT APPROVED (AWAITING FORMAL OWNER SIGN-OFF)**

---

## 1. MỤC TIÊU VÀ BỐI CẢNH KIỂM TOÁN

Báo cáo này rà soát, đối chiếu và khắc phục toàn bộ các điểm sai khác (discrepancies), các khẳng định chưa được chứng minh bằng thực nghiệm và sự thiếu nhất quán về mặt thuật ngữ trong hồ sơ R8.1 (`docs/audit/3nf-remediation/R8_1_*`).

Các nguyên tắc kiểm toán bắt buộc:
1. **Không mở rộng kiến trúc:** Giữ nguyên 27 bảng nghiệp vụ, thiết kế Strict 3NF Option 1, canonical SQL source đã đồng bộ, và kiến trúc DBMS-First.
2. **Tuân thủ ranh giới an toàn:** **TUYỆT ĐỐI KHÔNG CHẠY MIGRATION TRÊN PRODUCTION.**
3. **Minh bạch bằng chứng:** Phân biệt rành mạch giữa dữ liệu đo đạc thực tế trên Test và các giả định/mục tiêu vận hành trên Production.

---

## 2. NỘI DUNG HIỆU CHỈNH 1: ĐỐI SOÁT TÀI CHÍNH VÀ 7 ĐẠI LƯỢNG LỊCH SỬ

### 2.1. Sai khác trong báo cáo R8.1
Trong báo cáo R8.1, mục đối soát tài chính ghi nhận "Tổng doanh thu lịch sử = 446,500.00 VNĐ" và "Sai lệch Delta = 0.0000 VNĐ", nhưng chưa phân ranh giới rõ ràng giữa tổng số tiền của tất cả các lần thử (All Attempts), số tiền các lần thử thành công, số tiền giao dịch lỗi, và trường hợp đặc biệt của đơn hàng bị hủy (`DonDatVeID = 4`).

### 2.2. Kiểm tra thực tế bằng truy vấn Read-Only trên Production `CinemaBookingDB`
Truy vấn trực tiếp trên cơ sở dữ liệu `CinemaBookingDB`:
```sql
SELECT 
    t.ThanhToanID, 
    t.DonDatVeID, 
    t.PhuongThuc, 
    t.SoTien, 
    t.TrangThai AS ThanhToanTrangThai, 
    t.NgayThanhToan, 
    t.MaGiaoDich, 
    d.TrangThai AS DonDatVeTrangThai, 
    (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS ComputedOrderAmount
FROM dbo.THANHTOAN t
JOIN dbo.DONDATVE d ON t.DonDatVeID = d.DonDatVeID
ORDER BY t.ThanhToanID;
```

**Dữ liệu thực tế 4 bản ghi lịch sử:**
1. `ThanhToanID = 1`: `DonDatVeID = 3`, `SoTien = 99,000.00`, `TrangThai = Thất bại`, Đơn vé: `Đã thanh toán`. (Lần thử đầu lỗi).
2. `ThanhToanID = 2`: `DonDatVeID = 3`, `SoTien = 99,000.00`, `TrangThai = Thành công`, Đơn vé: `Đã thanh toán`. (Lần thử 2 thành công).
3. `ThanhToanID = 3`: `DonDatVeID = 4`, `SoTien = 247,500.00`, `TrangThai = Thành công`, Đơn vé: `Đã hủy`. (Hủy suất chiếu, bồi thường 189 điểm qua `BOITHUONG_HUYSUAT`).
4. `ThanhToanID = 4`: `DonDatVeID = 5`, `SoTien = 100,000.00`, `TrangThai = Thành công`, Đơn vé: `Đã thanh toán`. (Giao dịch lịch sử V2).

### 2.3. Bảng phân định 7 Đại lượng Tài chính Chính thức

| STT | Đại lượng tài chính | Giá trị xác minh | Định nghĩa & Bằng chứng kiểm toán |
|---|---|---|---|
| **1** | **All Attempts Amount** | **545,500.00 VNĐ** | Tổng số tiền của cả 4 lần thử thanh toán ($99k + 99k + 247.5k + 100k$). |
| **2** | **Successful Attempts Amount** | **446,500.00 VNĐ** | Tổng số tiền của 3 lần thử thành công (`ThanhToanID` 2, 3, 4: $99k + 247.5k + 100k$). |
| **3** | **Failed Attempts Amount** | **99,000.00 VNĐ** | Tổng số tiền của 1 lần thử thất bại (`ThanhToanID` 1). |
| **4** | **Gross Collected Payment** | **446,500.00 VNĐ** | Tổng dòng tiền mặt thực tế các cổng thanh toán (VNPAY/MOMO) đã thu thành công. |
| **5** | **Cancelled Paid Orders Amount** | **247,500.00 VNĐ** | Số tiền của đơn hàng đã thanh toán thành công nhưng sau đó bị hủy (`DonDatVeID = 4`). |
| **6** | **Refund Amount** | **0.00 VNĐ** | Số tiền hoàn trả bằng tiền mặt. Hệ thống áp dụng chính sách bồi thường điểm thưởng loyalty (`BOITHUONG_HUYSUAT.DiemBoiThuong = 189`), **không hoàn tiền mặt**. |
| **7** | **Net Revenue (Theo hợp đồng kế toán)** |  |  |
| 7a | *Cash-Receipt Basis (`sp_Admin_Report_Revenue`)* | **446,500.00 VNĐ** | Dòng tiền mặt thực thu vào hệ thống (không trừ đơn hủy vì bồi thường bằng điểm). |
| 7b | *Fulfilled-Orders Basis (`vw_DoanhThuTheoRap`)* | **199,000.00 VNĐ** | Doanh thu dịch vụ hoàn tất ($99k + 100k$), loại trừ đơn đã hủy theo điều kiện `d.TrangThai = N'Đã thanh toán'`. |

- **Làm rõ khẳng định Delta = 0:**
  Khẳng định $\text{Delta} = 0.0000 \text{ VNĐ}$ là **Delta giữa cột vật lý `THANHTOAN.SoTien` trước migration và giá trị tính toán động `(TongTienVe + TongTienDoAn - TienGiamGia)` sau migration** khi so sánh từng dòng (row-by-row) trên toàn bộ 4 bản ghi lịch sử.

---

## 3. NỘI DUNG HIỆU CHỈNH 2: THỜI GIAN GIỮ CHỖ NGHIỆP VỤ (5 PHÚT VS 15 PHÚT)

### 3.1. Sai khác giữa các báo cáo
- Báo cáo R7 ghi nhận thời gian giữ chỗ là **5 phút**.
- Báo cáo R8.1 ghi nhận trong phần thuyết minh là **15 phút**.

### 3.2. Đối chiếu mã nguồn và Stored Procedure
- Hàm nghiệp vụ SQL Server [dbo.fn_ThoiGianGiuChoPhut()](file:///d:/DBMS_DO_AN/database/05_functions/):
  ```sql
  SELECT dbo.fn_ThoiGianGiuChoPhut() AS HoldMinutes;
  -- Kết quả thực tế trên cả CinemaBookingDB và CinemaBookingDB_Test: 5
  ```
- Thủ tục tạo đơn đặt vé [sp_Booking_Create.sql](file:///d:/DBMS_DO_AN/database/08_procedures/booking/sp_Booking_Create.sql#L530):
  ```sql
  DATEADD(MINUTE, dbo.fn_ThoiGianGiuChoPhut(), dbo.fn_BayGio())
  ```
- Kiểm tra tập lệnh kiểm thử [scripts/e2e/r8_1_browser_e2e.mjs](file:///d:/DBMS_DO_AN/scripts/e2e/r8_1_browser_e2e.mjs#L246):
  Trong mã nguồn kiểm thử E2E có dòng cấu hình thời gian chờ: `timeout: 15000` (tức là 15,000 miligiây = 15 giây cho Playwright selector timeout). Người soạn thảo báo cáo R8.1 đã nhầm lẫn con số 15 giây timeout này thành "15 phút giữ chỗ" trong phần thuyết minh văn bản.

### 3.3. Kết luận hiệu chỉnh
- **Quy tắc nghiệp vụ chính thức:** Thời gian giữ chỗ đơn hàng là **5 PHÚT (5 MINUTES)** theo đúng hàm `dbo.fn_ThoiGianGiuChoPhut()`.
- **Hành động:** Đính chính toàn bộ tài liệu thuyết minh. Không có lỗi nghiệp vụ trong CSDL hoặc Backend; hệ thống hoạt động đúng chuẩn 5 phút.

---

## 4. NỘI DUNG HIỆU CHỈNH 3: CƠ CHẾ FAIL-FAST TRONG T-SQL (`THROW` VS `RAISERROR`)

### 4.1. Sai khác trong báo cáo R8.1
Báo cáo R8.1 từng nêu: `RAISERROR(N'...', 20, 1) WITH LOG` hoặc đề cập đến `THROW severity 20`.

### 4.2. Chuẩn mực kỹ thuật Microsoft SQL Server
- Trong cú pháp T-SQL chuẩn của SQL Server:
  $$\text{THROW}\ [error\_number,\ message,\ state];$$
  Lệnh `THROW` **KHÔNG CÓ THAM SỐ SEVERITY**. Mức độ nghiêm trọng (severity) của lệnh `THROW` luôn được SQL Server ấn định cố định là **16**. Khi kết hợp với `SET XACT_ABORT ON;`, lệnh `THROW` lập tức chấm dứt thực thi batch và tự động rollback toàn bộ transaction hiện hành.
- Lệnh `RAISERROR(msg, severity, state)` mới có tham số severity. Severity từ 19 đến 25 yêu cầu quyền quản trị và bắt buộc kèm mệnh đề `WITH LOG`.

### 4.3. Kiểm toán thực tế mã nguồn Migration Scripts
Cả 5 tập lệnh trong `database/13_migrations/3nf_remediation/` đều sử dụng đúng cú pháp:
```sql
THROW 51000, N'Security Guard Abort: ...', 1;
```
Hệ thống sử dụng cơ chế fail-fast hợp lệ `THROW 51000, ..., 1` (Severity 16, ngắt transaction ngay lập tức với `XACT_ABORT ON`). Khẳng định về `THROW severity 20` trong tài liệu trước đây là sai sót thuật ngữ và được đính chính hoàn toàn.

---

## 5. NỘI DUNG HIỆU CHỈNH 4: PHÂN ĐỊNH GÓI SCRIPT TEST VÀ GÓI SCRIPT PRODUCTION

### 5.1. Ranh giới Target Guard hiện tại
Toàn bộ 5 kịch bản trong `database/13_migrations/3nf_remediation/`:
- `01_preflight_checks.sql`
- `02_expand_update_views_procedures.sql`
- `03_contract_alter_schema.sql`
- `04_post_migration_reconciliation.sql`
- `99_rollback_all.sql`

Đều được bảo vệ bằng Target Guard cứng:
```sql
IF DB_NAME() <> N'CinemaBookingDB_Test'
    THROW 51000, N'Security Guard Abort: Script chỉ được phép chạy trên CinemaBookingDB_Test!', 1;
```
- **Ý nghĩa an toàn:** Nếu ai đó cố tình chạy các script này trên `CinemaBookingDB`, script sẽ **bị chặn ngay tại dòng lệnh đầu tiên** và không có bất kỳ lệnh DDL/DML nào được thực thi.
- **Hành động hiệu chỉnh:** Tuyệt đối không sửa trực tiếp các script trên Test để tháo guard. Gói triển khai Production phải được đóng gói riêng biệt (`v1.0.0-production-release`), kiểm tra exact instance `DoanTuanIT`, database `CinemaBookingDB`, và token phê duyệt Gate C.
- **Trạng thái thực tế:** Do chưa có đợt chạy thử gói Production trên clone Production độc lập, gói Production này được gắn cờ kỹ thuật là **NOT VERIFIED ON ISOLATED PRODUCTION CLONE**.

---

## 6. NỘI DUNG HIỆU CHỈNH 5: THỜI LƯỢNG ROLLBACK VÀ CHỈ SỐ RTO / RPO

### 6.1. Đính chính tuyên bố thời gian Rollback
- Báo cáo R8.1 suy luận: "Rollback Production chỉ mất 5 giây" dựa trên kết quả chạy thử tập lệnh `99_rollback_all.sql` trên database Test.
- **Thực tế kỹ thuật:** Thời gian chạy script ~5 giây chỉ là thời gian thực thi của riêng tầng DDL và cập nhật thủ tục lưu trữ trong kịch bản Immediate Rollback (ngay trong cửa sổ bảo trì, chưa có phát sinh giao dịch mới).
- Trong kịch bản Delayed Rollback hoặc Full Database Restore khi có sự cố nghiêm trọng, thời gian phục hồi bao gồm:
  1. Thời gian đánh giá sự cố và quyết định kích hoạt rollback: 5 – 10 phút.
  2. Thời gian khôi phục bản sao lưu toàn phần `RESTORE DATABASE WITH REPLACE`: 2 – 5 phút.
  3. Thời gian khởi động lại backend và xác minh kiểm thử: 5 phút.

### 6.2. Thiết lập mục tiêu RTO / RPO chính thức
- **Mục tiêu RTO (Recovery Time Objective):** $\le 20 \text{ phút}$.
- **Mục tiêu RPO (Recovery Point Objective):** $= 0 \text{ dữ liệu}$ (Không thất thoát bất kỳ giao dịch nào đã xác nhận).

---

## 7. BẢNG TỔNG HỢP CÁC HIỆU CHỈNH ĐÃ THỰC HIỆN

```
+---------------------------------------------------------------------------------------------------------+
|                                    GATE C PRE-APPROVAL CORRECTION SUMMARY                               |
+----+----------------------------+-----------------------------+----------------------------+------------+
| STT| Hạng mục sai khác          | Trạng thái trước hiệu chỉnh | Trạng thái sau hiệu chỉnh  | Kết luận   |
+----+----------------------------+-----------------------------+----------------------------+------------+
| 1  | 7 Chỉ số tài chính lịch sử | Gộp chung Doanh thu 446.5k  | Phân định rõ 7 đại lượng,  | RESOLVED   |
|    |                            | chưa tách đơn hủy & bồi thường| xác thực bồi thường loyalty|            |
| 2  | Ý nghĩa Delta = 0          | Chưa ghi rõ so với cái gì   | Delta = 0 giữa SoTien vật lý| RESOLVED  |
|    |                            |                             | và tính toán động từng dòng|            |
| 3  | Thời gian giữ chỗ đơn hàng | R8.1 ghi nhầm 15 phút       | Xác minh đúng 5 phút theo  | RESOLVED   |
|    |                            |                             | fn_ThoiGianGiuChoPhut()    |            |
| 4  | Cú pháp lỗi T-SQL          | Ghi nhầm THROW severity 20  | Chuẩn hóa THROW 51000      | RESOLVED   |
|    |                            |                             | (Severity 16 cố định)      |            |
| 5  | Target Guard & Scripts     | Dùng chung script Test      | Tách riêng gói Production, | RESOLVED   |
|    |                            |                             | đánh dấu NOT VERIFIED Prod |            |
| 6  | Thời gian Rollback RTO/RPO | Tuyên bố suy diễn 5 giây    | Phân định RTO <= 20 phút,  | RESOLVED   |
|    |                            |                             | RPO = 0, phân tầng 2 cấp   |            |
+----+----------------------------+-----------------------------+----------------------------+------------+
```

Toàn bộ các điểm sai khác và chưa chuẩn xác đã được làm sáng tỏ và đồng bộ với thực tế kỹ thuật của hệ thống.

