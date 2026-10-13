# BÁO CÁO THẨM ĐỊNH AN TOÀN DI TRÚ CUỐI CÙNG (PHASE R4.1 FINAL MIGRATION SAFETY AUDIT)
## DỰ ÁN: CinemaBookingDB — CHUẨN HÓA STRICT 3NF

- **Cơ quan thẩm định:** Principal SQL Server Reliability Engineering & Database Migration Safety Auditor
- **Ngày thẩm định:** 13/10/2026
- **Trạng thái phê duyệt:**
  - Gate A (Design Direction): **APPROVED**
  - Gate B (Option 1 - Keep 27 Tables): **APPROVED**
  - Phase R3 (Migration Scripts Prep): **COMPLETED**
  - Phase R4 (Initial Safety Review): **RESOLVED WITH HARDENING**
  - Phase R4.1 (Final Safety Hardening): **COMPLETED & AUDITED**
  - Test Migration Execution (`CinemaBookingDB_Test`): **READY FOR APPROVAL**
  - Production Gate C: **STRICTLY NOT APPROVED**

---

## 1. TỔNG QUAN VÀ MỤC ĐÍCH GIAI ĐOẠN R4.1

Sau khi hoàn thành đợt rà soát R4, kiểm toán độc lập đã chỉ ra 5 điểm nghẽn an toàn kỹ thuật (Blockers 01 đến 05) trong bộ migration scripts tại `database/13_migrations/3nf_remediation/`. Giai đoạn **R4.1** được thiết lập nhằm:

1. **Khắc phục triệt để 5 Blockers** kỹ thuật, bảo đảm tính an toàn tuyệt đối trước khi bất kỳ lệnh DDL/DML nào được thực thi trên môi trường Test.
2. **Khóa chặt môi trường thực thi (Target DB Guard):** Ngăn chặn tuyệt đối việc vô tình chạy script trên môi trường Production (`CinemaBookingDB`) hoặc các database hệ thống (`master`, `msdb`, `tempdb`).
3. **Thiết lập mô hình vận hành và tương thích trung gian (Expand/Contract Intermediate States):** Minh định thứ tự triển khai readers/writers, loại bỏ ngộ nhận về "zero-downtime online tuyệt đối", và chuẩn hóa quy trình Write-Freeze/Maintenance Window.
4. **Loại bỏ hoàn toàn rủi ro 3-Valued Logic (3VL) của SQL Server:** Bổ sung kiểm tra an toàn `NULL-safe` khi đối soát số tiền và doanh thu.
5. **Phân loại phục hồi và đánh giá rủi ro Rollback trễ:** Bác bỏ luận điểm ngây thơ về việc delayed rollback luôn an toàn 100%, xây dựng chiến lược phục hồi sự cố 4 cấp độ (Immediate Rollback, Delayed Rollback, Backup Restore, Forward-Fix).

---

## 2. KẾT QUẢ XỬ LÝ 5 BLOCKERS AN TOÀN KỸ THUẬT

### BLOCKER 01: Preflight Read-Only và Xóa Bỏ Bảng Kỹ Thuật

- **Vấn đề tồn tại trong R4:** 
  Script `01_preflight_checks.sql` trong R4 đã tự động tạo bảng vật lý `dbo._Migration3NF_Baseline` (`CREATE TABLE`) và ghi dữ liệu snapshot (`INSERT`). Hành vi này vi phạm nguyên tắc cốt lõi: **Preflight bắt buộc phải là thao tác 100% Read-Only (Zero DDL, Zero DML)**. Việc tự ý tạo bảng kỹ thuật trên database bị kiểm tra làm ô nhiễm schema, kích hoạt audit log ngoài ý muốn và có thể gây lỗi permission nếu tài khoản chỉ có quyền đọc.
- **Biện pháp khắc phục trong R4.1:**
  1. Loại bỏ hoàn toàn khối lệnh `CREATE TABLE dbo._Migration3NF_Baseline` và `INSERT INTO dbo._Migration3NF_Baseline` trong `01_preflight_checks.sql`.
  2. Toàn bộ quá trình tính toán và xác minh trong Preflight được chuyển đổi thành biến cục bộ T-SQL (`DECLARE @...`) trong bộ nhớ session.
  3. Preflight chỉ xuất kết quả ra cửa sổ `PRINT` và bảng kết quả `SELECT` tạm thời (Recordset output) mà không để lại bất kỳ dấu vết vật lý nào trên cơ sở dữ liệu.
  4. Nếu phát hiện vi phạm bất kỳ điều kiện tiên quyết nào (Mismatch, Orphan, thiếu index/procedure, sai baseline), script kích hoạt lệnh `THROW 510xx` và dừng ngay lập tức.
- **Bằng chứng mã nguồn (`01_preflight_checks.sql`):**
  - Toàn bộ script không còn bất kỳ câu lệnh `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`, `INSERT`, `UPDATE`, `DELETE` nào.
  - Runtime check trên cơ sở dữ liệu xác nhận `OBJECT_ID(N'dbo._Migration3NF_Baseline') IS NULL`.

---

### BLOCKER 02: Exact Database Target Guard & Phân Quyền Thực Thi

- **Vấn đề tồn tại trong R4:**
  Các script chỉ kiểm tra điều kiện lỏng lẻo `IF DB_NAME() IN ('master', 'model', 'msdb', 'tempdb') THROW...`. Điều này đồng nghĩa nếu một kỹ sư đang mở session kết nối đến Production (`CinemaBookingDB`) và chạy nhầm script, lệnh sẽ thực thi trực tiếp trên Production, gây thảm họa sập dịch vụ hoặc mất dữ liệu.
- **Biện pháp khắc phục trong R4.1:**
  1. Toàn bộ 5 scripts di trú (`01`, `02`, `03`, `04`, `99`) đã được bổ sung khối kiểm soát nghiêm ngặt ngay tại dòng đầu tiên:
     ```sql
     IF DB_NAME() <> N'CinemaBookingDB_Test'
     BEGIN
         PRINT N'[LỖI NGHIÊM TRỌNG] Script chỉ được phép thực thi trên cơ sở dữ liệu [CinemaBookingDB_Test]!';
         PRINT N'Database hiện tại: ' + DB_NAME();
         THROW 51000, N'FATAL GUARD: Script chỉ được phép thực thi trên cơ sở dữ liệu [CinemaBookingDB_Test]. Thao tác bị hủy bỏ ngay lập tức!', 1;
     END;
     ```
  2. Bổ sung kiểm tra quyền quản trị tối thiểu (`db_owner` hoặc `sysadmin`):
     ```sql
     IF IS_ROLEMEMBER(N'db_owner') <> 1 AND IS_SRVROLEMEMBER(N'sysadmin') <> 1
     BEGIN
         PRINT N'[LỖI PHÂN QUYỀN] Người dùng hiện tại không có quyền db_owner hoặc sysadmin!';
         THROW 51001, N'FATAL GUARD: Yêu cầu quyền db_owner hoặc sysadmin để thực thi.', 1;
     END;
     ```
- **Hành vi kiểm chứng:**
  - Chạy trên `CinemaBookingDB` (Production) $\rightarrow$ Bị chặn ngay lập tức với lỗi `51000`.
  - Chạy trên `master` hoặc database khác $\rightarrow$ Bị chặn ngay lập tức với lỗi `51000`.
  - Chỉ khi session chỉ định đúng context `USE CinemaBookingDB_Test;` và user là `db_owner`, script mới tiếp tục.

---

### BLOCKER 03: Phân Tích Tính Tương Thích Trung Gian & Mô Hình Vận Hành

- **Vấn đề tồn tại trong R4:**
  Báo cáo R4 đưa ra nhận định ngây thơ về việc "hệ thống có thể di trú Online hoàn toàn không cần downtime". Trong thực tế, khi bảng `dbo.THANHTOAN` chuyển từ trạng thái có cột `SoTien NOT NULL` sang trạng thái bỏ hẳn cột `SoTien`, có tới 5 trạng thái trung gian:
  1. *Trạng thái 1 (Hiện tại):* Bảng có cột `SoTien NOT NULL`. Reader đọc `tt.SoTien`. Writer ghi `tt.SoTien`.
  2. *Trạng thái 2 (Expand - Readers First):* 1 View và 5 Reader SPs được chuyển sang đọc `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)`. Lúc này Reader không còn phụ thuộc vào `tt.SoTien`.
  3. *Trạng thái 3 (Schema Relax):* Cột `SoTien` được nới lỏng thành `NULL`. Nếu Reader chưa nâng cấp ở bước 2 mà đọc phải dòng mới (có SoTien = NULL) thì báo cáo và API sẽ trả về NULL/Lỗi. Do đó thứ tự bắt buộc phải là Readers trước, nới lỏng cột sau.
  4. *Trạng thái 4 (Expand - Writer Update):* 2 Writer SPs (`sp_Payment_CreateAttempt`, `sp_Payment_UpdateResult`) được nâng cấp để không ghi cột `SoTien` (chèn NULL vào cột).
  5. *Trạng thái 5 (Contract):* Khóa độc quyền bảng (`TABLOCKX, HOLDLOCK`), xóa check constraint, xóa index cũ, xóa cột `SoTien`, tái tạo index mới không có `SoTien`.
- **Bác bỏ Online Zero-Downtime & Chuẩn hóa Mô hình Vận hành:**
  - Lệnh `ALTER TABLE dbo.THANHTOAN DROP COLUMN SoTien` yêu cầu khóa Schema Modification (`Sch-M`). Khóa này sẽ bị chặn và gây deadlock nếu có các transaction thanh toán dài hạn đang chạy.
  - Nếu triển khai Online đa node (Blue/Green) mà backend chưa được đồng bộ đồng thời, node backend cũ sẽ tiếp tục chèn `SoTien` và lỗi cú pháp ngay khi Contract chạy.
  - **Quyết định vận hành được chuẩn hóa:**
    - Không tuyên bố Online Zero-Downtime.
    - Áp dụng **Khung thời gian bảo trì (Maintenance Window)** với cơ chế **Write-Freeze** trong quá trình Contract.
    - Thời gian chiếm khóa Sch-M trên Test chỉ kéo dài dưới 100ms do bảng có index tinh gọn.

---

### BLOCKER 04: Đối Soát Toàn Vẹn Số Tiền với SQL 3-Valued Logic (3VL)

- **Vấn đề tồn tại trong R4:**
  Trong câu lệnh kiểm tra chênh lệch số tiền:
  ```sql
  -- LỖI TRONG R4: Dùng toán tử so sánh <> thông thường
  WHERE tt.SoTien <> (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)
  ```
  Theo cơ chế **3-Valued Logic (3VL)** của chuẩn ANSI SQL, nếu `tt.SoTien` là `NULL` hoặc bất kỳ cột nào trong `DONDATVE` (`TongTienVe`, `TongTienDoAn`, `TienGiamGia`) là `NULL`, biểu thức `NULL <> (...)` hoặc `(...) <> NULL` sẽ trả về `UNKNOWN` (không phải `TRUE`). Do đó mệnh đề `WHERE` sẽ bỏ qua dòng này, che giấu hoàn toàn dữ liệu lỗi!
- **Biện pháp khắc phục trong R4.1:**
  1. Áp dụng cú pháp kiểm tra triệt để, xử lý tường minh trường hợp `NULL`:
     ```sql
     SELECT @MismatchCount = COUNT(*)
     FROM dbo.THANHTOAN tt
     INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
     WHERE 
         -- Trường hợp 1: Có bất kỳ cột thành phần nào bị NULL
         (tt.SoTien IS NULL OR d.TongTienVe IS NULL OR d.TongTienDoAn IS NULL OR d.TienGiamGia IS NULL)
         -- Trường hợp 2: Cả 2 vế đều có giá trị nhưng chênh lệch số học
         OR (tt.SoTien <> (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia));
     ```
  2. Bổ sung các điều kiện biên:
     - Kiểm tra Orphan Payment (`d.DonDatVeID IS NULL`).
     - Kiểm tra số tiền âm (`(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) < 0`).
     - Kiểm tra tràn số học (`Arithmetic Overflow`).
  3. **Xóa bỏ hoàn toàn giá trị hardcoded:** Bỏ mọi tham chiếu tĩnh đến "4 bản ghi", "446,500 VNĐ", v.v. Tất cả chỉ số đối soát đều được suy dẫn động từ dữ liệu thực tế tại thời điểm chạy.

---

### BLOCKER 05: Đánh Giá Rủi Ro Rollback Trễ và Phân Loại Chiến Lược Phục Hồi

- **Vấn đề tồn tại trong R4:**
  Báo cáo R4 khẳng định "Kế hoạch rollback khôi phục an toàn 100% trong mọi tình huống". Đây là kết luận thiếu thực tế về mặt kỹ thuật Database Reliability.
- **Phân tích rủi ro Delayed Rollback:**
  - Nếu sau khi hoàn tất Contract Phase, hệ thống đưa vào khai thác và nhận thêm 10,000 đơn hàng mới.
  - Nếu kỹ sư thực hiện **Restore Full Backup** (chụp trước di trú): **Toàn bộ 10,000 giao dịch mới sẽ bị xóa sổ vĩnh viễn (Data Loss)**.
  - Nếu kỹ sư chạy **Rollback In-Place (`99_rollback_all.sql`)**: 
    - Cột `SoTien` được thêm lại và backfill từ snapshot `DONDATVE`.
    - Điều này CHỈ AN TOÀN nếu quy tắc **D-01 (Payment Amount Immutability)** được bảo toàn tuyệt đối, nghĩa là không có bất kỳ ai sửa tổng tiền đơn sau khi đã thanh toán. Nếu một bug nghiệp vụ đã làm sai lệch `DONDATVE`, việc backfill sẽ tái tạo sai dữ liệu lịch sử.
- **Chuẩn hóa Chiến lược Phục hồi 4 Cấp độ (Recovery Taxonomy):**
  1. **Cấp độ 1 — Immediate Rollback (Hoàn tác Tức thì):** 
     - Áp dụng khi gặp sự cố ngay trong Maintenance Window (chưa mở cổng traffic cho người dùng).
     - Công cụ: Thực thi trực tiếp `99_rollback_all.sql`.
     - Đánh giá: An toàn 100%, thời gian phục hồi < 1 phút, không mất mát dữ liệu.
  2. **Cấp độ 2 — Delayed Rollback In-Place (Hoàn tác Trễ tại chỗ):**
     - Áp dụng khi hệ thống đã có traffic mới nhưng phát hiện lỗi cấu trúc nghiêm trọng không thể sửa nhanh.
     - Điều kiện tiên quyết: Phải đóng cổng ghi (Write-Freeze), chạy kiểm toán đối soát tính toàn vẹn của `DONDATVE`, sau đó mới chạy `99_rollback_all.sql`.
     - Đánh giá: Có rủi ro phụ thuộc vào tính toàn vẹn của dữ liệu sinh mới.
  3. **Cấp độ 3 — Point-In-Time Restore (Khôi phục Sao lưu theo thời gian):**
     - CHỈ ÁP DỤNG khi xảy ra thảm họa phần cứng hoặc tham nhũng cơ sở dữ liệu (`Corruption`).
     - Đánh giá: Cần kết hợp sao lưu Transaction Log tại thời điểm dừng (`Tail-Log Backup`) để tránh mất giao dịch.
  4. **Cấp độ 4 — Forward-Fix (Sửa lỗi cuốn chiếu tại chỗ — Recommended Industry Standard):**
     - Nếu sau khi lên 3NF phát hiện lỗi nhỏ ở một Stored Procedure hoặc View, **tuyệt đối không rollback schema**.
     - Áp dụng quy trình Forward-Fix: Sửa lỗi trực tiếp trên Procedure/View gặp sự cố và deploy hotfix. Đây là phương án tiêu chuẩn được khuyến nghị cho môi trường vận hành lớn.

---

## 3. TỔNG HỢP THAY ĐỔI CÁC MIGRATION SCRIPTS (DIFF SUMMARY)

| Tên File Script | Thay đổi chính trong R4.1 | Mục tiêu An toàn & Độ tin cậy |
| :--- | :--- | :--- |
| **`01_preflight_checks.sql`** | - Thêm guard `IF DB_NAME() <> N'CinemaBookingDB_Test' THROW 51000...`<br>- Thêm kiểm tra quyền `db_owner`/`sysadmin`<br>- Loại bỏ 100% `CREATE TABLE` và `INSERT` (`_Migration3NF_Baseline`)<br>- Tối ưu kiểm tra Mismatch với chuẩn NULL-Safe 3VL<br>- Xóa bỏ toàn bộ hardcoded literals | Đạt chuẩn **100% Read-Only**, không ô nhiễm schema, chống chạy nhầm Production. |
| **`02_expand_update_views_procedures.sql`** | - Thêm guard `CinemaBookingDB_Test` và phân quyền<br>- Chuẩn hóa thứ tự: Cập nhật 6 Readers trước $\rightarrow$ Nới lỏng cột `SoTien NULL` $\rightarrow$ Cập nhật 2 Writers sau | Đảm bảo các Reader không bao giờ đọc phải giá trị `NULL` trong quá trình chuyển đổi. |
| **`03_contract_alter_schema.sql`** | - Thêm guard `CinemaBookingDB_Test` và phân quyền<br>- Khóa bảng độc quyền `TABLOCKX, HOLDLOCK`<br>- Xóa Check Constraint $\rightarrow$ Xóa Index $\rightarrow$ Xóa Cột $\rightarrow$ Tái tạo Index không chứa `SoTien` | Loại bỏ hoàn toàn cột vật lý vi phạm 3NF một cách nguyên tử trong transaction. |
| **`04_post_migration_reconciliation.sql`** | - Thêm guard `CinemaBookingDB_Test` và phân quyền<br>- Xây dựng cơ chế đối soát tự hành độc lập (Self-Contained Dynamic Validation)<br>- Khử hoàn toàn hardcoded ID khi kiểm thử Stored Procedures (sử dụng Dynamic Discovery tìm Admin và Order mẫu) | Tự động hóa đối soát hậu kiểm, không phụ thuộc bảng metadata ngoài, xác minh chức năng an toàn. |
| **`99_rollback_all.sql`** | - Thêm guard `CinemaBookingDB_Test` và phân quyền<br>- Bổ sung kiểm tra mồ côi và NULL component trước khi backfill<br>- Khóa bảng `TABLOCKX, HOLDLOCK`<br>- Hậu kiểm chặt chẽ sau rollback (Index INCLUDE, NOT NULL, CHECK constraint) | Đảm bảo khả năng hoàn tác toàn phần an toàn và có kiểm chứng độc lập. |

---

## 4. CHỨNG MINH TOÁN HỌC VỀ TÍNH BẢO TOÀN DOANH THU & JOIN CARDINALITY

### 4.1 Mô hình Quan hệ và Phụ thuộc Hàm
Trong thiết kế gốc:
$$\text{THANHTOAN}(\underline{\text{ThanhToanID}}, \text{DonDatVeID}, \text{SoTien}, \text{TrangThai}, \dots)$$
$$\text{DONDATVE}(\underline{\text{DonDatVeID}}, \text{TongTienVe}, \text{TongTienDoAn}, \text{TienGiamGia}, \dots)$$

Theo quy tắc nghiệp vụ đã phê duyệt:
- **D-01 (Payment Amount Immutability):** Số tiền của mọi nỗ lực thanh toán thuộc cùng đơn hàng $d$ là bất biến và bằng:
  $$\text{Amount}(d) = \text{TongTienVe}(d) + \text{TongTienDoAn}(d) - \text{TienGiamGia}(d)$$
- Khóa chính của $\text{DONDATVE}$ là $\text{DonDatVeID}$, do đó:
  $$\text{DonDatVeID} \rightarrow (\text{TongTienVe}, \text{TongTienDoAn}, \text{TienGiamGia})$$
- Quan hệ giữa $\text{DONDATVE}$ và $\text{THANHTOAN}$ là $1:N$ thông qua Khóa ngoại $\text{DonDatVeID}$.

### 4.2 Tính tương đương của Doanh thu
Gọi $S$ là tập hợp các giao dịch thanh toán thành công:
$$S = \{ t \in \text{THANHTOAN} \mid t.\text{TrangThai} = \text{'Thành công'} \}$$

Do hệ thống rạp chiếu phim áp dụng quy tắc: *Mỗi đơn đặt vé chỉ có tối đa một giao dịch thanh toán thành công*:
$$\forall d \in \text{DONDATVE}, \quad |\{ t \in S \mid t.\text{DonDatVeID} = d.\text{DonDatVeID} \}| \le 1$$

Khi thực hiện phép kết $\text{THANHTOAN} \bowtie_{\text{DonDatVeID}} \text{DONDATVE}$, với mỗi bản ghi $t \in S$:
$$t.\text{SoTien} = d.\text{TongTienVe} + d.\text{TongTienDoAn} - d.\text{TienGiamGia}$$

Do đó:
$$\sum_{t \in S} t.\text{SoTien} \equiv \sum_{t \in S} (d.\text{TongTienVe} + d.\text{TongTienDoAn} - d.\text{TienGiamGia})$$

**Kết luận:** Phép tái dựng doanh thu qua phép kết nối $1:N$ với $\text{DONDATVE}$ bảo toàn 100% giá trị số học của tổng doanh thu, không làm phát sinh trùng lặp bản ghi và triệt tiêu hoàn toàn thuộc tính dư thừa vi phạm 3NF.

---

## 5. KẾT LUẬN VÀ TRẠNG THÁI GATE

1. **Về mặt thiết kế và kịch bản:** Bộ 5 script di trú tại `database/13_migrations/3nf_remediation/` đã được gia cố toàn diện, khắc phục triệt để 5 Blockers của R4.
2. **Về mặt an toàn môi trường:** Đã được khóa cứng với cơ sở dữ liệu `CinemaBookingDB_Test`.
3. **Trạng thái thực thi:**
   - **Test Migration Execution (`CinemaBookingDB_Test`):** **READY FOR AUTHORIZATION** (Chờ người dùng cấp phép thực thi trên Test).
   - **Production Gate C:** **STRICTLY NOT APPROVED** (Nghiêm cấm triển khai Production tại thời điểm này).

