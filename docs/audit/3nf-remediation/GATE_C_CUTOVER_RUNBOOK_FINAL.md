# GATE C PRODUCTION CUTOVER RUNBOOK & OPERATIONAL INTEGRITY
**Project:** CinemaBookingDB — Strict 3NF Normalization Remediation  
**Phase:** Gate C Pre-Approval & Release Freeze  
**Auditor / Roles:** Production Deployment Engineer, Senior SQL Server DBA & Reliability Lead  
**Date:** October 13, 2026  
**Execution Window:** **45-MINUTE SCHEDULED MAINTENANCE WINDOW (OFF-PEAK: 02:00 – 02:45 AM)**  
**Target Environment:** Production Instance `DoanTuanIT` | Database `CinemaBookingDB`  
**Runbook Status:** **HARDENED & READY FOR FORMAL OWNER APPROVAL**

---

## 1. NGUYÊN TẮC BẢO VỆ ĐÓNG BĂNG DÒNG DỮ LIỆU (WRITE-FREEZE HARDENING)

### 1.1. Lỗ hổng kỹ thuật của việc chỉ dựa vào `RESTRICTED_USER`
Trong các tài liệu sơ khai, phương án đóng băng ghi dữ liệu thường đề xuất:
```sql
ALTER DATABASE CinemaBookingDB SET RESTRICTED_USER WITH ROLLBACK IMMEDIATE;
```
**CẢNH BÁO KIỂM TOÁN AN TOÀN:**
Hệ thống backend hiện tại được phép kết nối bằng tài khoản `sa` (thuộc vai trò `sysadmin`). Theo kiến trúc Microsoft SQL Server, các thành viên của vai trò `sysadmin` hoặc `dbcreator` **VẪN CÓ QUYỀN TRUY CẬP VÀ GHI DỮ LIỆU BÌNH THƯỜNG** vào cơ sở dữ liệu ở chế độ `RESTRICTED_USER`. Do đó, nếu chỉ đặt `RESTRICTED_USER` mà không tắt ứng dụng, các request tồn đọng từ backend vẫn có thể ghi dữ liệu xen kẽ trong quá trình chạy migration!

### 1.2. Quy trình 4 bước đóng băng ghi dữ liệu tuyệt đối (Absolute Write-Freeze Protocol)
Để đảm bảo $\text{Write Traffic} = 0$, quy trình bắt buộc phải thực thi 4 bước tuần tự:
1. **Lớp Reverse Proxy / API Gateway:** Bật trang phản hồi bảo trì định kỳ (HTTP 503 Maintenance Mode) tại Nginx / Cloudflare, từ chối mọi traffic người dùng và webhook thanh toán từ bên ngoài.
2. **Dừng triệt để tiến trình Ứng dụng Backend:** Dừng tiến trình Node.js trên máy chủ:
   ```powershell
   Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue;
   ```
3. **Kiểm tra và ngắt các Worker chạy ngầm:** Đảm bảo không còn tiến trình cron job hoặc worker background nào đang chạy (ví dụ: tiến trình tự động hủy đơn hết hạn `sp_Order_ExpirePending`).
4. **Kiểm tra giao dịch đang hoạt động (Active Transactions):** Truy vấn kiểm tra không còn transaction nào treo:
   ```sql
   SELECT COUNT(*) AS ActiveTransactions 
   FROM sys.dm_tran_active_transactions 
   WHERE transaction_type IN (1, 2);
   -- Bắt buộc phải trả về 0 trước khi chuyển sang bước tiếp theo
   ```
5. **Kích hoạt `RESTRICTED_USER` làm hàng rào phụ:** Ngăn chặn các kết nối ad-hoc khác từ nhân viên quản trị.

---

## 2. MA TRẬN 18 BƯỚC THỰC THI CUTOVER CHUẨN XÁC (18-CHECKPOINT EXECUTION MATRIX)

```
+---------------------------------------------------------------------------------------------------------+
|                                18-CHECKPOINT CUTOVER TIMELINE & PROTOCOL                                |
+----+--------------------------------+-----------+--------------------+----------------------------------+
| STT| Bước thực hiện                 | Thời lượng| Thời gian tích lũy | Tiêu chí nghiệm thu (Exit Criteria)|
+----+--------------------------------+-----------+--------------------+----------------------------------+
| 1  | Bật Maintenance Mode Gateway   | 2 phút    | Phút 00:00 - 00:02 | HTTP 503 trả về cho public       |
| 2  | Dừng toàn bộ Write Traffic (App)| 2 phút    | Phút 00:02 - 00:04 | Process Node.js đã tắt hoàn toàn |
| 3  | Dừng Background Workers & Crons| 2 phút    | Phút 00:04 - 00:06 | 0 background job đang thực thi   |
| 4  | Xử lý xong Pending Callbacks   | 1 phút    | Phút 00:06 - 00:07 | Hàng đợi callback thanh toán = 0 |
| 5  | Kiểm tra Active Transactions   | 1 phút    | Phút 00:07 - 00:08 | Active Transactions = 0          |
| 6  | Chạy Preflight Checks          | 2 phút    | Phút 00:08 - 00:10 | 27 bảng, 9 cột THANHTOAN tồn tại |
| 7  | Chụp Historical Baseline JSON  | 2 phút    | Phút 00:10 - 00:12 | Tệp pre_cutover_baseline.json tạo|
| 8  | Full Backup WITH CHECKSUM      | 5 phút    | Phút 00:12 - 00:17 | File .bak tạo thành công         |
| 9  | RESTORE VERIFYONLY CHECKSUM    | 3 phút    | Phút 00:17 - 00:20 | Backup is valid (100% verified)  |
| 10 | Expand Phase Migration (02)    | 3 phút    | Phút 00:20 - 00:23 | 8 SPs + 1 View updated           |
| 11 | Contract Phase Migration (03)  | 2 phút    | Phút 00:23 - 00:25 | SoTien dropped atomically        |
| 12 | Cross-Script Reconciliation(04)| 3 phút    | Phút 00:25 - 00:28 | Delta = 0.0000 VNĐ               |
| 13 | SQL Database Health Checks     | 2 phút    | Phút 00:28 - 00:30 | DBCC CHECKDB không lỗi metadata  |
| 14 | Khởi động Backend & Smoke Test | 4 phút    | Phút 00:30 - 00:34 | /api/health trả lời HTTP 200     |
| 15 | Browser UAT Nhanh (Playwright) | 4 phút    | Phút 00:34 - 00:38 | Đặt vé & Thanh toán smoke pass   |
| 16 | **GO / NO-GO CHECKPOINT**      | 2 phút    | Phút 00:38 - 00:40 | Quyết định chính thức của Lead   |
| 17 | Tắt Bảo trì & Mở Traffic       | 2 phút    | Phút 00:40 - 00:42 | Gateway chuyển tiếp lưu lượng    |
| 18 | Hypercare Monitoring Khởi đầu  | 3 phút    | Phút 00:42 - 00:45 | Bàn giao sang Hypercare 24h      |
+----+--------------------------------+-----------+--------------------+----------------------------------+
```

---

## 3. THIẾT KẾ ĐIỂM QUYẾT ĐỊNH GO / NO-GO (CHECKPOINT 16)

Trước khi mở lại lưu lượng cho người dùng tại Phút 40, Lead DBA và Release Engineer bắt buộc phải kiểm tra bảng tiêu chí:

```
+---------------------------------------------------------------------------------------------------------+
|                                  GATE C GO / NO-GO DECISION MATRIX                                      |
+-------------------------------------------------------+---------------------+---------------------------+
| Tiêu chí bắt buộc                                     | Kết quả yêu cầu     | Hành động nếu Không đạt   |
+-------------------------------------------------------+---------------------+---------------------------+
| 1. Backup hoàn toàn hợp lệ (RESTORE VERIFYONLY)       | THÀNH CÔNG          | NO-GO (Hủy bảo trì)       |
| 2. Migration 02, 03 hoàn tất không có lỗi T-SQL      | THÀNH CÔNG          | ROLLBACK TỨC THÌ (99)     |
| 3. Post-reconciliation Delta                          | CHÍNH XÁC = 0.00 đ  | ROLLBACK TỨC THÌ (99)     |
| 4. Backend khởi động và kết nối CSDL bình thường      | HTTP 200 OK         | Khắc phục cấu hình hoặc RB|
| 5. UAT đặt vé thử nghiệm hoạt động bình thường        | THÀNH CÔNG          | ROLLBACK HOẶC FORWARD-FIX |
| 6. Thời gian còn lại trước khi hết khung 45 phút      | >= 5 phút           | ROLLBACK KHẨN CẤP         |
+-------------------------------------------------------+---------------------+---------------------------+
```

---

## 4. KẾ HOẠCH THEO DÕI HẬU PHÁT HÀNH (EXTENDED HYPERCARE MONITORING)

Báo cáo R8.1 từng đề xuất thời lượng giám sát sau cutover chỉ là 5 phút. Nhóm kiểm toán an toàn hệ thống khẳng định **5 phút là không đủ để phát hiện các lỗi bất thường về phân phối tải hoặc bất đồng bộ thanh toán thực tế**.

Kế hoạch Hypercare chính thức được cấu trúc thành 2 giai đoạn:
1. **Giai đoạn Hypercare Thời gian thực (Real-time Initial Hypercare - 60 phút):**
   - Đội ngũ DBA và Backend Engineer duy trì phiên trực chiến trực tiếp sau khi mở traffic.
   - Theo dõi biểu đồ CPU, RAM, Disk I/O trên SQL Server.
   - Theo dõi lỗi kết nối trong `backend/logs/` và tỷ lệ HTTP 5xx.
   - Xác nhận các đơn hàng và giao dịch thanh toán đầu tiên của khách hàng thật trên Production.
2. **Giai đoạn Hypercare Mở rộng (Extended Hypercare - 24 đến 48 giờ):**
   - Theo dõi báo cáo doanh thu cuối ngày qua `sp_Admin_Report_Revenue`.
   - Kiểm tra định kỳ bảng `dbo.KHIEUNAI` để kịp thời phát hiện phản ánh của khách hàng.
   - Chạy lệnh kiểm tra tính toàn vẹn `DBCC CHECKDB` trong ca đêm kế tiếp.

---

## 5. KẾT LUẬN

Quy trình Cutover đã được gia cố toàn diện:
- Lỗ hổng write-freeze của tài khoản `sa` đã được khắc phục triệt để bằng việc tắt tiến trình Node.js và chặn cổng Gateway.
- Lịch trình 18 bước cung cấp phân bổ thời gian thực tế, có điểm quyết định GO/NO-GO rõ ràng.
- Giai đoạn Hypercare được kéo dài đúng tiêu chuẩn công nghiệp (60 phút trực chiến + 24 giờ giám sát mở rộng).
- **RUNBOOK ĐÃ ĐẠT CHUẨN SẴN SÀNG TRIỂN KHAI PRODUCTION.**

