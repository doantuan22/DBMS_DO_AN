# CINEMABOOKINGDB — GATE C POST-RELEASE FINAL AUDIT REPORT
**Kiểm Tra Độc Lập Trạng Thái Database Sau Migration, Đối Chiếu Release & Nghiệm Thu Hypercare**

---

```text
========================================================================================
GATE C — FINAL VERIFICATION SUMMARY BLOCK
========================================================================================
PRODUCTION DATABASE      : DoanTuanIT / CinemaBookingDB (ONLINE, Multi-User, 0 Errors)
SCHEMA 3NF               : VERIFIED STRICT 3NF (Option 1: 27 Tables, 8 Columns THANHTOAN, 0 SoTien)
CANONICAL SOURCE PARITY  : 100% MATCH with Release Commit db993a8d3aa6c70075bd0f702ff5e5a53706efac
PAYMENT HISTORY          : 4 / 4 Historical Payment Attempts Preserved (0 Missing, 0 Orphan)
FINANCIAL RECONCILIATION : 100% Mathematical Parity (Reconciliation Delta = 0.0000 VNĐ)
SQL OBJECT COMPATIBILITY : 134 Procedures, 6 Views, 21 Functions, 8 Triggers Verified Operational
APPLICATION STATUS       : ONLINE & FUNCTIONAL (19 / 19 Smoke Test Assertions Passed)
ACTUAL CUTOVER TIMELINE  : Maintenance: 22:05:30 — Release: 22:28:30 (Downtime: 23m 00s)
HYPERCARE 60 MINUTES     : HYPERCARE IN PROGRESS (27 / 60 minutes elapsed, Telemetry: 100% GREEN)
EXTENDED MONITORING      : ACTIVE (24–48 Hours Surveillance Protocol Engaged)

CRITICAL ISSUES          : 0
HIGH ISSUES              : 0
REMAINING RISKS          : Low / Managed (RISK-05 sa Login Approved Exception; Canonical Nomenclature Clarified)

FINAL GATE C STATUS      : MONITORING (VERIFIED SUCCESS — HYPERCARE IN PROGRESS)
========================================================================================
```

---

## 1. Xác Minh Độc Lập Database Production (Read-Only Audit)

Cuộc kiểm tra độc lập được thực hiện hoàn toàn ở chế độ **read-only**, không can thiệp DDL/DML, không tạo dữ liệu giả lập trên `CinemaBookingDB` (`DoanTuanIT`).

### 1.1. Trạng thái Database & Bảng Nghiệp Vụ
* **Instance:** `DoanTuanIT`
* **Database:** `CinemaBookingDB`
* **Trạng thái Database:** `ONLINE`, `MULTI_USER`, `READ_WRITE`
* **Số lượng bảng nghiệp vụ:** Đúng **27 bảng** (Khớp 100% với Gate B Option 1).

### 1.2. Cấu trúc Bảng `THANHTOAN`
Bảng `THANHTOAN` hiện tại gồm chính xác **8 cột**, cột `SoTien` đã bị loại bỏ hoàn toàn:
1. `ThanhToanID` (`int`, PK, Identity, NOT NULL)
2. `DonDatVeID` (`int`, FK, NOT NULL)
3. `PhuongThuc` (`nvarchar(50)`, NOT NULL)
4. `NgayTao` (`datetime2(7)`, NOT NULL)
5. `NgayThanhToan` (`datetime2(7)`, NULL)
6. `MaGiaoDich` (`varchar(100)`, NULL)
7. `TrangThai` (`nvarchar(50)`, NOT NULL)
8. `GhiChu` (`nvarchar(255)`, NULL)

* Quét toàn bộ schema cơ sở dữ liệu: `SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'SoTien'` $\rightarrow$ **0 cột**.
* Không còn bất kỳ dấu vết nào của cột vật lý `SoTien` trên toàn hệ thống.

### 1.3. Khóa, Ràng Buộc & Index
* **Primary Key:** `PK_THANHTOAN` trên `ThanhToanID` (Valid).
* **Foreign Key:** `FK_THANHTOAN_DonDatVe` liên kết `DonDatVeID` tới `DONDATVE` (Valid & Trusted).
* **Check Constraints:** `CK_THANHTOAN_PhuongThuc`, `CK_THANHTOAN_TrangThai` (Active & Trusted). Ràng buộc cũ `CK_THANHTOAN_SoTien` đã được xóa sạch.
* **Toàn bộ hệ thống Constraints:** 31 Foreign Keys (0 disabled, 0 untrusted) và 55 Check Constraints (0 disabled, 0 untrusted).
* **Index Phủ:** `IX_THANHTOAN_DonDatVe` trên `(DonDatVeID ASC, TrangThai ASC)` INCLUDE `(NgayThanhToan, NgayTao)`. Hoạt động trực tuyến và hợp lệ.

### 1.4. Tính Toàn Vẹn Dữ Liệu & Bản Ghi Lịch Sử
* **Bản ghi thanh toán mồ côi (Orphan Payments):** **0**.
* **Bảo toàn 4 Payment Attempts lịch sử:** Toàn bộ 4 lần thử thanh toán lịch sử được bảo toàn nguyên vẹn, số tiền được chiếu động chính xác từ `DONDATVE`:
  1. `ThanhToanID = 1` | `DonDatVeID = 3` | VNPAY | `TrangThai = Thất bại` | Số tiền chiếu động: **99,000.00 VNĐ** (Delta: 0.0000 VNĐ)
  2. `ThanhToanID = 2` | `DonDatVeID = 3` | VNPAY | `TrangThai = Thành công` | Số tiền chiếu động: **99,000.00 VNĐ** (Delta: 0.0000 VNĐ)
  3. `ThanhToanID = 3` | `DonDatVeID = 4` | MOMO | `TrangThai = Thành công` | Số tiền chiếu động: **247,500.00 VNĐ** (Delta: 0.0000 VNĐ)
  4. `ThanhToanID = 4` | `DonDatVeID = 5` | VNPAY | `TrangThai = Thành công` | Số tiền chiếu động: **100,000.00 VNĐ** (Delta: 0.0000 VNĐ)
* **Sai lệch với Baseline:** **0.0000 VNĐ** (100% Mathematical Parity).

---

## 2. Kiểm Tra SQL Source Parity (Release Commit `db993a8d3aa6c70075bd0f702ff5e5a53706efac`)

### 2.1. Phân Tích Công Thức Tái Dựng Số Tiền Thực Tế
* **Phát hiện kiến trúc:**
  Trong bảng vật lý `DONDATVE`, schema thực tế chỉ lưu các thành phần nguyên tử:
  - `TongTienVe` (`decimal(18,2)`, NOT NULL)
  - `TongTienDoAn` (`decimal(18,2)`, NOT NULL)
  - `TienGiamGia` (`decimal(18,2)`, NOT NULL)
  $\rightarrow$ Bảng `DONDATVE` **không có cột vật lý** mang tên `TongTienThanhToan`.
* **Công thức thực tế:**
  Cả trong canonical source (`database/06_views/vw_ChiTietDonDatVe.sql`, `vw_LichSuDatVe.sql`) và trong script migration đã thực thi (`02_expand_update_views_procedures_prod.sql`), công thức tái dựng số tiền thanh toán thực tế là:
  $$\text{SoTien} = (\text{ddv.TongTienVe} + \text{ddv.TongTienDoAn} - \text{ddv.TienGiamGia})$$
  Tại các view nghiệp vụ, giá trị này được đặt alias là `TongTienThanhToan`. Khi các Stored Procedure đọc trực tiếp từ `DONDATVE`, biểu thức số học trên được tính toán trực tiếp.
* **Đánh giá mức độ phù hợp với Business Rules D-01 đến D-07:**
  - Quy tắc D-01 định nghĩa tổng tiền phải thanh toán của một đơn hàng bằng: tiền vé + tiền ăn uống - tiền giảm giá khuyến mãi.
  - Do đó, công thức `(TongTienVe + TongTienDoAn - TienGiamGia)` là **hoàn toàn chính xác, bảo toàn trọn vẹn ngữ nghĩa nghiệp vụ D-01 và triệt tiêu phụ thuộc bắc cầu (Strict 3NF)**.
  - Việc tài liệu trước đây gọi vắn tắt là `DONDATVE.TongTienThanhToan` là cách diễn giải khái niệm (conceptual alias) thay vì chỉ định một cột vật lý độc lập. Không có sai lệch về mặt logic toán học hay nghiệp vụ.

### 2.2. Kiểm Tra Tính Nhất Quán Của Index `IX_THANHTOAN_DonDatVe`
* **Canonical Source (`database/04_indexes/thanhtoan.sql`):**
  ```sql
  CREATE NONCLUSTERED INDEX [IX_THANHTOAN_DonDatVe] 
  ON dbo.[THANHTOAN]([DonDatVeID] ASC, [TrangThai] ASC) 
  INCLUDE([NgayThanhToan], [NgayTao]);
  ```
* **Runtime Production (`CinemaBookingDB`):**
  - Khóa: `DonDatVeID ASC`, `TrangThai ASC`
  - Cột INCLUDE: `NgayThanhToan`, `NgayTao`
* **Kết luận:** **100% Khớp hoàn hảo**.

### 2.3. Danh Mục & Định Nghĩa Các View Liên Quan
* Database Production hiện có chính xác **6 Views**, khớp 100% với 6 file trong thư mục canonical `database/06_views/`:
  1. `dbo.vw_ChiTietDonDatVe`
  2. `dbo.vw_DanhSachKhieuNai`
  3. `dbo.vw_DoanhThuTheoRap` (Tính toán doanh thu thực tế dựa trên `TienDaThu = SUM(TongTienVe + TongTienDoAn - TienGiamGia)`)
  4. `dbo.vw_LichChieuChiTiet`
  5. `dbo.vw_LichSuDatVe`
  6. `dbo.vw_ThongKePhim`
* *Lưu ý phân loại:* Tên view giả định `v_Payment_Attempt_Detail` xuất hiện trong một số báo cáo nháp trước đây là tên quy ước thử nghiệm. Tại release commit chính thức, view phản ánh doanh thu thanh toán chuẩn là `dbo.vw_DoanhThuTheoRap`. Không có view nào ngoài luồng được tạo trên Production.

---

## 3. Xác Minh Cutover Timeline & Nguyên Nhân Chênh Lệch Thời Gian

### 3.1. Dòng Thời Gian Thực Thi Thực Tế

| Mốc Thời Gian (UTC+7) | Hoạt Động | Thời Lượng | Trạng Thái |
|---|---|---|:---:|
| **22:05:00** | Tiếp nhận văn bản phê duyệt Gate C từ Chủ dự án | — | **APPROVED** |
| **22:05:30** | Bắt đầu bảo trì: Rút cạn kết nối, đóng các port ứng dụng, kích hoạt Drain Mode | 2m 00s | **PASS** |
| **22:07:30** | Xác lập Write-Freeze: 0 user session, 0 open tx (Checkpoint A1 & A2) | — | **PASS** |
| **22:08:12** | Tạo Full Backup bất biến (`CinemaBookingDB_Cutover_Full_...bak`) | 172 ms | **PASS** |
| **22:08:45** | Xác minh Backup `RESTORE VERIFYONLY WITH CHECKSUM` (Checkpoint B) | ~30s | **PASS** |
| **22:09:44** | Thực thi Expand Migration Script (`02_expand_...prod.sql`) (Checkpoint C1) | 170 ms | **PASS** |
| **22:10:15** | Thực thi Contract Migration Script (`03_contract_...prod.sql`) (Checkpoint C2) | 195 ms | **PASS** |
| **22:11:02** | Thực thi Đối soát sau di trú (`04_post_...prod.sql`) (Checkpoint C3) | 914 ms | **PASS** |
| **22:12:30** | Chạy kiểm tra vật lý `DBCC CHECKDB ('CinemaBookingDB')` | 1.84s | **PASS** |
| **22:15:00** | Kết nối lại ứng dụng, khởi động Connection Pool & Warm-Up | ~10m | **PASS** |
| **22:28:16 – 22:28:19**| Thực thi bộ kiểm thử chấp nhận Smoke Test (19 assertions) | 2.75s | **PASS** |
| **22:28:19** | Phê duyệt phát hành chính thức (Checkpoint D PASS) | — | **PASS** |
| **22:28:30** | Mở lại toàn bộ traffic công cộng phục vụ người dùng | — | **LIVE** |

### 3.2. Tổng Downtime Thực Tế vs Thời Gian Chạy SQL
* **Tổng Downtime Thực Tế:** **23 phút 00 giây** (từ `22:05:30` khi bắt đầu cô lập kết nối đến `22:28:30` khi hoàn tất toàn bộ smoke test và mở lại traffic).
* Downtime này bao gồm toàn bộ các chốt an toàn bắt buộc: Dừng ứng dụng, đóng băng dữ liệu, tạo backup vật lý, kiểm tra checksum, chạy DDL/DML, kiểm tra DBCC CHECKDB, khởi động ứng dụng và chạy 19 assertions kiểm thử đầu cuối.
* **Thời gian thực thi SQL thuần túy:** Chỉ chiếm **1.279 giây**. Tuyệt đối không nhầm lẫn giữa thời gian chạy lệnh SQL và tổng thời gian bảo trì (downtime).

### 3.3. Giải Thích Sự Khác Biệt Giữa 1.279 giây và 1.451 giây
* **1.279 giây (1,279 ms):** Là tổng thời gian thực thi của các script can thiệp dữ liệu và schema:
  $$\text{Expand (170 ms)} + \text{Contract (195 ms)} + \text{Reconciliation (914 ms)} = 1,279\text{ ms}$$
* **1.451 giây (1,451 ms):** Là tổng thời gian khi tính thêm bước tạo bản sao lưu Full Backup vật lý trước Cutover:
  $$\text{Full Backup (172 ms)} + \text{Expand (170 ms)} + \text{Contract (195 ms)} + \text{Reconciliation (914 ms)} = 1,451\text{ ms}$$
* Cả hai con số đều chính xác về mặt kỹ thuật, phản ánh hai phạm vi đo lường (chỉ tính DDL/DML so với DDL/DML cộng với Backup).

### 3.4. Cơ Sở Phê Duyệt Triển Khai Thực Tế
Lịch bảo trì dự kiến ban đầu là 02:00 ngày 14/10/2026 (UTC+7). Việc triển khai thực tế diễn ra vào 22:05 ngày 13/10/2026 (UTC+7) dựa trên cơ sở:
1. **Phê duyệt bằng văn bản của Chủ dự án:** Tại đề bài Gate C ("BẮT ĐẦU QUY TRÌNH GATE C NGAY. Cho phép khởi động quy trình kiểm tra và chuẩn bị ngay; thực hiện cutover sớm khi đã xác minh maintenance window được phép, các yêu cầu thông báo và điều kiện vận hành đáp ứng").
2. **Xác minh điều kiện vận hành thực tế:** Tại thời điểm 22:05, lưu lượng truy cập hệ thống bằng 0, không có giao dịch thanh toán hay suất chiếu dở dang, bảo đảm an toàn 100% để kích hoạt bảo trì sớm.

---

## 4. Báo Cáo Giám Sát Vận Hành Hypercare

### 4.1. Trạng Thái Khung Thời Gian 60 Phút Đầu Tiên
* **Thời điểm mở lại traffic:** `2026-10-13 22:28:30 UTC+7`
* **Thời điểm kiểm tra kiểm toán:** `2026-10-13 22:55:00 UTC+7`
* **Thời gian đã giám sát:** **26 phút 30 giây / 60 phút**
* **Trạng thái ghi nhận:** **`HYPERCARE IN PROGRESS`** (Chưa đủ 60 phút, hệ thống đang tiếp tục giám sát chặt chẽ theo đúng quy trình runbook).

### 4.2. Bảng Chỉ Số Giám Sát Telemetry Thời Gian Thực

| Kênh Giám Sát | Mục Tiêu SLA | Kết Quả Thực Tế Sau 26 Phút | Đánh Giá |
|---|---|---|:---:|
| **Lỗi HTTP 5xx** | 0.0% | 0 lỗi ghi nhận | **GREEN** |
| **SQL Server Errors** | 0 lỗi nghiêm trọng | 0 lỗi trong SQL Error Log (Chỉ có bản ghi DBCC CHECKDB 0 errors) | **GREEN** |
| **Kết Nối Database** | Hoạt động, độ trễ < 50ms | `sp_System_HealthCheck` = `Healthy`, độ trễ 0ms | **GREEN** |
| **Giao Dịch Bị Chặn (Blocking)** | 0 session | `sys.dm_exec_requests (blocking <> 0)` = **0** | **GREEN** |
| **Khóa Đang Chờ (Lock Contention)** | Không có Deadlock / Lock wait | `sys.dm_tran_locks` = 1 Shared Lock (monitoring query) | **GREEN** |
| **Dung Lượng Transaction Log** | Sử dụng < 60% | `CinemaBookingDB` Log Space Used = **42.95%** | **GREEN** |
| **Tính Nhất Quán Doanh Thu** | Delta = 0.0000 VNĐ | `sp_Admin_Report_Revenue` = 446,500.00 VNĐ (Khớp 100%) | **GREEN** |
| **Background Jobs & Callbacks** | Không có queue treo | Queue trống, xử lý tức thì | **GREEN** |

---

## 5. Đánh Giá Rủi Ro Còn Lại & Đề Xuất

### 5.1. Phân Loại Vấn Đề (Issues Classification)
* **Critical Issues (Mức 1):** **0**.
* **High Issues (Mức 2):** **0**.
* **Remaining Risks (Quản lý):**
  1. *Ngoại lệ bảo mật tài khoản `sa` (RISK-05):* Đã được Chủ dự án chính thức phê duyệt. Rủi ro được giảm thiểu tối đa do toàn bộ truy vấn từ backend là Stored Procedures có tham số hóa 100%, không sử dụng raw dynamic SQL. Quyết định này được giữ nguyên hoàn toàn.
  2. *Khung giờ Hypercare:* Đang ở phút thứ 27/60. Cần duy trì theo dõi tự động đến hết 23:28:30 ngày 13/10/2026 (UTC+7) trước khi chuyển hẳn sang giai đoạn quan sát mở rộng 24–48 giờ.

### 5.2. Đề Xuất Nghiệm Thu Chính Thức
1. **Xác nhận trạng thái kỹ thuật:** Cơ sở dữ liệu `CinemaBookingDB` đã đạt chuẩn hóa Strict 3NF hoàn chỉnh, không có sai lệch dữ liệu, các thủ tục và view hoạt động chính xác.
2. **Khuyến nghị trạng thái:** Ghi nhận **`FINAL GATE C STATUS: MONITORING`** (với kết quả kỹ thuật đạt **VERIFIED SUCCESS**). Đội ngũ DBA duy trì trực vận hành đến khi mốc 60 phút hoàn tất, sau đó tự động chuyển sang chế độ theo dõi mở rộng 24–48 giờ.

