# GATE C BACKUP, ROLLBACK & DISASTER RECOVERY CERTIFICATION
**Project:** CinemaBookingDB — Strict 3NF Normalization Remediation  
**Phase:** Gate C Pre-Approval & Release Freeze  
**Auditor / Roles:** Senior SQL Server DBA, Database Reliability Engineer & Disaster Recovery Auditor  
**Date:** October 13, 2026  
**Recovery Target:** Target RTO $\le$ 20 minutes | Target RPO = 0  
**Recovery Status:** **FRAMEWORK DEFINED — ISOLATED CLONE RESTORE TEST PENDING**

---

## 1. PHÂN LOẠI 4 CHIẾN LƯỢC PHỤC HỒI HỆ THỐNG (4-TIER RECOVERY TAXONOMY)

Khi triển khai di trú schema trên môi trường Production, sự cố có thể phát sinh tại các thời điểm và mức độ nghiêm trọng khác nhau. Đội ngũ kỹ thuật phân định rạch ròi 4 cấp độ phục hồi:

```
                                  [ PHÁT SINH SỰ CỐ PRODUCTION ]
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
     [ TRONG CỬA SỔ BẢO TRÌ (Phút 0-40) ]                  [ SAU KHI ĐÃ MỞ LƯU LƯỢNG (Phút 40+) ]
  (Chưa có dữ liệu người dùng mới)                      (Đã phát sinh đơn vé & thanh toán mới)
                     │                                                     │
         ┌───────────┴───────────┐                             ┌───────────┴───────────┐
         ▼                       ▼                             ▼                       ▼
  [ Cấp 1: Immediate ]   [ Cấp 2: Restore Full ]        [ Cấp 3: Forward-Fix ]  [ Cấp 4: Point-In-Time ]
    Rollback Script       WITH REPLACE Backup             Hotfix trực tiếp        Differential / Log
```

### 1.1. Cấp 1: Hoàn tác tức thì bằng Script (Immediate Rollback via `99_rollback_all.sql`)
- **Điều kiện áp dụng:** Kích hoạt ngay trong cửa sổ bảo trì (trước Phút 40), khi phát hiện lỗi cú pháp T-SQL, lỗi phân quyền, hoặc không vượt qua kiểm tra đối soát `04_post_migration_reconciliation.sql`.
- **Đặc điểm:** Chưa có bất kỳ giao dịch người dùng mới nào phát sinh trên Production.
- **Hành động:** Thực thi kịch bản hoàn tác [99_rollback_all.sql](file:///d:/DBMS_DO_AN/database/13_migrations/3nf_remediation/99_rollback_all.sql). Thêm lại cột `SoTien`, nạp lại dữ liệu cột từ snapshot `DONDATVE`, tái tạo constraint `CK_THANHTOAN_SoTien`, và hoàn nguyên 9 SQL modules về mã nguồn cũ.
- **Thời gian thực thi đo đạc trên Test:** ~5 giây.

### 1.2. Cấp 2: Khôi phục toàn phần từ bản sao lưu trước Cutover (Pre-Cutover Full Restore)
- **Điều kiện áp dụng:** Kích hoạt khi quá trình di trú gặp sự cố phần cứng, lỗi I/O, cơ sở dữ liệu rơi vào trạng thái `SUSPECT`, hoặc kịch bản hoàn tác Cấp 1 bị lỗi nghiêm trọng.
- **Đặc điểm:** Toàn bộ dữ liệu Production được đưa trở lại chính xác trạng thái tại thời điểm bắt đầu bảo trì (02:00 AM).
- **Hành động:** Khôi phục từ tệp sao lưu kiểm định:
  ```sql
  RESTORE DATABASE CinemaBookingDB
  FROM DISK = 'D:\DBMS_DO_AN\backups\CinemaBookingDB_PreCutover_Full_20261013.bak'
  WITH REPLACE, RECOVERY;
  ```
- **Thời gian ước tính:** 2 – 5 phút (tùy thuộc tốc độ I/O ổ đĩa).

### 1.3. Cấp 3: Khắc phục tịnh tiến (Forward-Fix Strategy — ƯU TIÊN SỐ 1 SAU KHI MỞ CỔNG)
- **Điều kiện áp dụng:** Sự cố phát sinh **SAU KHI ĐÃ MỞ LƯU LƯỢNG NGƯỜI DÙNG** (hệ thống đã ghi nhận các đơn hàng, vé xem phim và thanh toán tiền thật mới).
- **Phân tích rủi ro:** Nếu lúc này thực hiện Rollback bằng script hoặc Restore Full Backup, **TOÀN BỘ GIAO DỊCH VÀ TIỀN CỦA KHÁCH HÀNG MỚI SẼ BỊ MẤT HOẶC MỒ CÔI (UNACCEPTABLE DATA LOSS)**.
- **Hành động:** Tuyệt đối không khôi phục đè database. Đội ngũ kỹ thuật xác định lỗi cụ thể (ví dụ: lỗi logic trong 1 Stored Procedure báo cáo), tiến hành tạo hotfix, kiểm thử nhanh trên môi trường Test, và áp dụng lệnh `CREATE OR ALTER PROCEDURE` trực tiếp trên Production mà không làm gián đoạn dòng dữ liệu đơn hàng mới.

### 1.4. Cấp 4: Phục hồi theo mốc thời gian (Point-In-Time Recovery - PITR)
- **Điều kiện áp dụng:** Sự cố phá hoại dữ liệu (Data Corruption) quy mô lớn sau khi đã vận hành sản xuất nhiều giờ.
- **Yêu cầu kỹ thuật:** Cơ sở dữ liệu `CinemaBookingDB` phải được cấu hình `FULL Recovery Model` và duy trì chuỗi Transaction Log Backup liên tục không bị đứt gãy (Log Chain Intact).
- **Hành động:** Thực hiện sao lưu log đuôi (`BACKUP LOG CinemaBookingDB WITH NORECOVERY`), khôi phục Full Backup kết hợp các Log Backup liên tiếp đến thời điểm ngay trước khi phát sinh sự cố (`STOPAT = 'YYYY-MM-DD HH:MM:SS'`).

---

## 2. NGUYÊN TẮC AN TOÀN SAO LƯU VÀ KHÔI PHỤC BẮT BUỘC

```
+---------------------------------------------------------------------------------------------------------+
|                                  DATABASE RECOVERY SAFETY GUARD-RAILS                                   |
+----+--------------------------------+-------------------------------------------------------------------+
| STT| Nguyên tắc an toàn             | Quy định chi tiết                                                 |
+----+--------------------------------+-------------------------------------------------------------------+
| 1  | Bắt buộc dùng WITH CHECKSUM    | Mọi lệnh BACKUP phải có WITH CHECKSUM để phát hiện lỗi hỏng trang |
| 2  | Bắt buộc RESTORE VERIFYONLY    | Kiểm tra tệp .bak đọc được trước khi thực hiện bất kỳ lệnh DDL nào|
| 3  | Không ghi đè Backup có giá trị | Tên tệp backup phải chứa timestamp duy nhất, không dùng WITH INIT  |
| 4  | Cấm tự động WITH REPLACE       | Không bao giờ nhúng WITH REPLACE trong script chạy tự động        |
| 5  | Kiểm tra Logical File Names    | Luôn chạy RESTORE FILELISTONLY để xác định tên tệp mdf/ldf        |
| 6  | Cấm tự Restore Production      | Lệnh RESTORE Production chỉ được chạy khi có lệnh từ Incident Lead|
+----+--------------------------------+-------------------------------------------------------------------+
```

### Mẫu lệnh kiểm tra Logical File Names chuẩn:
```sql
RESTORE FILELISTONLY 
FROM DISK = 'D:\DBMS_DO_AN\backups\CinemaBookingDB_PreCutover_Full_20261013.bak';
```
Kết quả phải xác nhận các logical name chuẩn (`CinemaBookingDB` và `CinemaBookingDB_log`).

---

## 3. PHÂN ĐỊNH MỤC TIÊU RTO / RPO VÀ ĐO ĐẠC THỰC TẾ

Báo cáo R8.1 từng có nhận định gây hiểu nhầm khi cho rằng "Rollback Production chỉ mất 5 giây". Nhóm kiểm toán an toàn làm rõ:

$$\begin{aligned}
\text{Script Execution Time (Đo đạc trên Test)} &= \mathbf{5.2\text{ giây}} \quad (\text{Chỉ là thời gian chạy T-SQL}) \\
\text{Production Target RTO (Thời gian phục hồi tối đa)} &= \mathbf{20\text{ phút}} \quad (\text{Bao gồm chẩn đoán, quyết định, restore, verify}) \\
\text{Production Target RPO (Điểm mất mát dữ liệu tối đa)} &= \mathbf{0\text{ giây}} \quad (\text{Không chấp nhận mất bất kỳ giao dịch nào})
\end{aligned}$$

---

## 4. TRẠNG THÁI KIỂM ĐỊNH THỰC TẾ (AUDIT VERDICT)

```
+---------------------------------------------------------------------------------------------------------+
|                                RECOVERY CAPABILITY VERIFICATION MATRIX                                  |
+-------------------------------------+------------------+------------------------------------------------+
| Hạng mục kiểm định                  | Trạng thái       | Bằng chứng / Giới hạn kiểm toán                |
+-------------------------------------+------------------+------------------------------------------------+
| Framework phân loại 4 cấp phục hồi  | VERIFIED PASS    | Định nghĩa rõ Immediate, Delayed, PITR, Fix    |
| Quy trình an toàn WITH CHECKSUM     | VERIFIED PASS    | Đã tích hợp trong Cutover Runbook             |
| Script Immediate Rollback           | VERIFIED ON TEST | Đã diễn tập thành công trên Test ở R5-B        |
| Thử nghiệm Restore trên Clone Prod  | NOT VERIFIED     | Chưa thực hiện khôi phục thử trên Clone Prod   |
+-------------------------------------+------------------+------------------------------------------------+
```

### Rủi ro còn lại (Residual Risk):
Việc khôi phục cơ sở dữ liệu toàn phần từ bản backup mới nhất trên một database clone độc lập chưa được diễn tập thực tế trong đợt audit này. Nhóm kiểm toán ghi nhận đây là một **Residual Risk có kiểm soát**, yêu cầu DBA phải thực hiện kiểm tra `RESTORE VERIFYONLY WITH CHECKSUM` nghiêm ngặt tại Bước 9 của Cutover Runbook.

