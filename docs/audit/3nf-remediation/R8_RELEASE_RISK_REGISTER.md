# BÁO CÁO QUẢN TRỊ RỦI RO TRIỂN KHAI PRODUCTION (RELEASE RISK REGISTER)
## DỰ ÁN: CINEMABOOKINGDB — STRICT 3NF REMEDIATION
**Mã tài liệu:** `R8-DOC-07`  
**Giai đoạn:** Phase R8 — Final 3NF Certification & Production Release Readiness  
**Tác giả:** Principal Database Architect, Release Engineer & Security Auditor  
**Ngày lập:** 2026-10-13  
**Trạng thái:** HOÀN TẤT KIỂM TOÁN — SẴN SÀNG TRÌNH GATE C  

---

## 1. TỔNG QUAN VÀ MA TRẬN ĐÁNH GIÁ RỦI RO

Tài liệu này thiết lập danh mục kiểm soát rủi ro toàn diện trước khi thực thi nâng cấp Production cho hệ thống cơ sở dữ liệu `CinemaBookingDB`. Quá trình chuyển đổi từ schema bán chuẩn hóa (chứa cột dư thừa `THANHTOAN.SoTien`) sang **Strict 3NF** (loại bỏ cột vật lý, sử dụng view và dynamic snapshot calculation) đòi hỏi kiểm soát chặt chẽ ở các tầng: Dữ liệu tài chính, tính tương thích mã nguồn, bảo mật phân quyền, cô lập phiên giao dịch và khả năng phục hồi thảm họa.

### 1.1. Thang đo Phân loại Rủi ro

- **Mức độ nghiêm trọng (Severity):**
  - **CRITICAL:** Gây thất thoát tiền tệ, sai lệch số dư tài chính, rò rỉ toàn quyền quản trị, hỏng hóc dữ liệu vĩnh viễn không thể khôi phục.
  - **HIGH:** Dừng dịch vụ ngoài dự kiến, khóa chết bảng chính (Deadlock/Lock Escalation), script rollback thất bại, gãy API/Front-end chính.
  - **MEDIUM:** Chậm trễ trong quá trình cutover, cảnh báo bảo mật mức ứng dụng, thiếu kiểm thử tự động một phần giao diện.
  - **LOW:** Sai lệch tài liệu, độ trễ báo cáo không ảnh hưởng trực tiếp đến người dùng cuối.

- **Tiêu chí Gate C Blocker:**
  - Bất kỳ rủi ro nào ở mức **CRITICAL** chưa có phương án khắc phục hoàn chỉnh và kiểm chứng sẽ tự động chặn việc phê duyệt Gate C.

---

## 2. BẢNG MA TRẬN 14 DANH MỤC RỦI RO BẮT BUỘC (MANDATORY RISK REGISTER)

| Mã Rủi Ro | Hạng Mục / Tên Rủi Ro | Severity | Probability | Impact | Gate C Blocker | Trạng Thái Kiểm Soát |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **RISK-01** | Thất thoát hoặc sai lệch dữ liệu tài chính lịch sử | **CRITICAL** | Low | **CRITICAL** | **YES** | Đã khắc phục & Đối soát 100% |
| **RISK-02** | Schema Drift giữa Test, Source SQL và Production | **HIGH** | Low | **HIGH** | **YES** | Đã triệt tiêu qua R6 Source Sync |
| **RISK-03** | Thực thi nhầm mục tiêu (Wrong Target Database/Instance) | **CRITICAL** | Low | **CRITICAL** | **YES** | Kiểm soát bằng Dual Dynamic Guard |
| **RISK-04** | Truy cập trái phép / Rò rỉ dữ liệu trong bảo trì | **HIGH** | Low | **HIGH** | No | Phân quyền IP, mạng nội bộ DB |
| **RISK-05** | Tài khoản ứng dụng dư thừa đặc quyền (`DB_USER=sa`) | **CRITICAL** | High | **CRITICAL** | **YES** | **BLOCKER HIỆN HỮU** — Phải tạo `CinemaAppUser` |
| **RISK-06** | Race Condition / Callback cổng thanh toán song song | **HIGH** | Low | **HIGH** | No | Đã cô lập bằng Serializable & AppLock |
| **RISK-07** | Ghi dữ liệu ngoài luồng (Background Writes) khi Cutover | **HIGH** | Medium | **HIGH** | **YES** | Quy trình Shutdown Backend & RESTRICTED_USER |
| **RISK-08** | Giao dịch tồn đọng kéo dài (Long-Running Transactions) | **HIGH** | Low | **HIGH** | No | Pre-flight Kill Session & Timeout 30s |
| **RISK-09** | Khóa bảng diện rộng (Lock Escalation / Exclusive Locks) | **MEDIUM** | Low | **MEDIUM** | No | Metadata-only drop cột, không copy bảng |
| **RISK-10** | Rollback thất bại / Script rollback lệch schema | **CRITICAL** | Low | **CRITICAL** | **YES** | Đã kiểm chứng PASS 100% trên Test DB |
| **RISK-11** | Phục hồi từ Backup thất bại (Corrupt / Path mismatch) | **CRITICAL** | Low | **CRITICAL** | **YES** | Đã Verify Checksum & FilelistOnly PASS |
| **RISK-12** | Thiếu bộ kiểm thử tự động Browser E2E trên Web UI | **MEDIUM** | High | **MEDIUM** | No | Bù đắp bằng Manual UAT Checklist |
| **RISK-13** | Phụ thuộc ngầm / Báo cáo ngoài luồng truy vấn cột cũ | **MEDIUM** | Low | **MEDIUM** | No | Đã cung cấp View tương thích ngược `THANHTOAN` |
| **RISK-14** | Lỗ hổng giám sát & Không phát hiện lỗi ngầm sau Cutover | **MEDIUM** | Low | **MEDIUM** | No | Kịch bản Post-Cutover Reconciliation & Health Check |

---

## 3. PHÂN TÍCH CHI TIẾT TỪNG RỦI RO VÀ BIỆN PHÁP KIỂM SOÁT

### RISK-01: Thất thoát hoặc sai lệch số liệu tài chính lịch sử
- **Mô tả:** Khi loại bỏ cột vật lý `THANHTOAN.SoTien`, các truy vấn tài chính lịch sử có nguy cơ trả về sai số tiền thanh toán hoặc sai tổng doanh thu do snapshot `DONDATVE.TongTien` bị lệch hoặc giao dịch thanh toán thất bại bị tính sai.
- **Bằng chứng thực tế:** Baseline Production hiện tại ghi nhận:
  - 4 Payment Attempts: Tổng số tiền attempt = `545,500.00 VNĐ`.
  - 3 Successful Attempts (`THANH_CONG`): Tổng số tiền = `446,500.00 VNĐ`.
  - 1 Failed Attempt (`THAT_BAI`): Số tiền = `99,000.00 VNĐ`.
  - Doanh thu đơn hàng hoạt động thực tế (`DA_THANH_TOAN`): `199,000.00 VNĐ` (Đơn 3 và Đơn 5).
  - Đơn hàng đã hủy có thanh toán (`DA_HUY`): `247,500.00 VNĐ` (Đơn 4 - Hoàn vé).
- **Biện pháp xử lý (Mitigation):**
  - Mọi dữ liệu thanh toán thành công được tái dựng chính xác $100\%$ từ snapshot `DONDATVE.TongTien` (bất biến sau khi tạo đơn).
  - Với attempt thất bại, dynamic projection vẫn lấy giá trị snapshot của đơn hàng liên kết tại thời điểm attempt diễn ra.
  - Chạy `04_post_migration_reconciliation.sql` ngay sau khi nâng cấp để đối soát tự động delta sai lệch = $0.0000$.
- **Rủi ro tồn đọng (Residual Risk):** Cực thấp ($0\%$).
- **Người chịu trách nhiệm:** Database Architect & Financial Auditor.

---

### RISK-02: Schema Drift giữa Môi trường Test, Source Code và Production
- **Mô tả:** Schema Production sau nâng cấp không khớp hoàn toàn với schema của source code (`database/01_schema/` đến `12_seeds/`) hoặc database kiểm thử `CinemaBookingDB_Test`.
- **Bằng chứng thực tế:** Đã đối soát tại Phase R6 và R8-03: Cả hai hướng nâng cấp (Upgrade via migration) và cài đặt mới (Fresh Bootstrap) đều sinh ra schema 27 bảng giống nhau từng byte metadata, cùng 134 Stored Procedures, 13 Views, 3 Triggers, 1 UDF, 32 Check Constraints, 40 Foreign Keys.
- **Biện pháp xử lý (Mitigation):**
  - Khóa mã nguồn nhánh release tại git commit phê duyệt.
  - Chạy script đối soát schema SHA-256 đối với metadata system catalog (`sys.tables`, `sys.columns`, `sys.types`).
- **Rủi ro tồn đọng:** Thấp.
- **Người chịu trách nhiệm:** Migration Lead.

---

### RISK-03: Thực thi nhầm mục tiêu (Wrong Target Database hoặc SQL Instance)
- **Mô tả:** DBA hoặc CI/CD chạy script migration trên sai Database (ví dụ chạy trên DB Master, DB Demo hoặc chạy lặp lại trên Test DB thay vì Production, hoặc ngược lại).
- **Bằng chứng thực tế:** Môi trường hiện hữu có cả `CinemaBookingDB` và `CinemaBookingDB_Test` trên cùng SQL Instance `DoanTuanIT`.
- **Biện pháp xử lý (Mitigation):**
  - Áp dụng nguyên tắc **Dynamic Target Guard** ở đầu mỗi file migration:
    ```sql
    IF DB_NAME() <> N'CinemaBookingDB'
    BEGIN
        RAISERROR(N'FATAL: Script must execute strictly on CinemaBookingDB. Current: %s', 16, 1, DB_NAME());
        SET NOEXEC ON;
    END
    ```
  - Kiểm tra thêm `SERVERPROPERTY('ServerName') = N'DoanTuanIT'` để chống nhầm instance.
  - Phân quyền user thực thi không cho phép chuyển context DB tùy tiện.
- **Rủi ro tồn đọng:** Bị triệt tiêu hoàn toàn nhờ `SET NOEXEC ON`.
- **Người chịu trách nhiệm:** Release Lead & Executing DBA.

---

### RISK-04: Truy cập trái phép / Rò rỉ dữ liệu trong cửa sổ bảo trì
- **Mô tả:** Trong thời gian bảo trì, các kết nối bên ngoài hoặc kẻ tấn công lợi dụng trạng thái bảo trì để chèn dữ liệu bẩn hoặc đọc dữ liệu nhạy cảm.
- **Biện pháp xử lý (Mitigation):**
  - Đặt Database vào chế độ `RESTRICTED_USER` hoặc cô lập cổng mạng Firewall của SQL Server (port 1433) chỉ cho phép IP máy chủ Application và DBA Console.
  - Không mở port SQL Server trực tiếp ra Internet.
- **Rủi ro tồn đọng:** Thấp.
- **Người chịu trách nhiệm:** Network Security Engineer & DBA.

---

### RISK-05: Tài khoản ứng dụng dư thừa đặc quyền (`DB_USER=sa`) — [RELEASE BLOCKER]
- **Mô tả:** File cấu hình `backend/.env` hiện đang thiết lập `DB_USER=sa`. Nếu Production chạy dưới quyền `sa`, toàn bộ cơ chế bảo mật phân quyền (RBAC), kiểm soát truy cập và phòng vệ lỗi logic đều bị vô hiệu hóa (bypass `DENY` rules, có quyền drop database/xp_cmdshell).
- **Bằng chứng thực tế:** File `backend/.env` dòng 16: `DB_USER=sa`.
- **Biện pháp xử lý (Mitigation) — YÊU CẦU TIÊN QUYẾT TRƯỚC GO-LIVE:**
  1. Tạo Login và Database User `CinemaAppUser` theo nguyên tắc Tối thiểu Đặc quyền (Least Privilege) tại Phase R8-06:
     - `DENY SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO CinemaAppUser;`
     - `GRANT EXECUTE ON SCHEMA::dbo TO CinemaAppUser;`
  2. Cập nhật `backend/.env.production`: `DB_USER=CinemaAppUser` và tạo mật khẩu mạnh lưu trong Vault bảo mật.
  3. Khởi động Backend và xác nhận toàn bộ 134 Stored Procedures hoạt động thông suốt qua Ownership Chaining mà không cần cấp quyền bảng vật lý.
- **Trạng thái:** **CONDITIONAL GATE C BLOCKER** — Phải hoàn tất đổi sang `CinemaAppUser` trước khi mở cổng kết nối cho người dùng cuối.
- **Người chịu trách nhiệm:** Security Auditor & Backend Lead.

---

### RISK-06: Race Condition / Callback cổng thanh toán song song
- **Mô tả:** Khi mở lại hệ thống, cổng thanh toán (VNPay / MoMo mock) gửi webhook callback đồng thời với thao tác truy vấn đơn hàng của khách hàng, có nguy cơ gây double-payment hoặc ghi đè trạng thái vé.
- **Biện pháp xử lý (Mitigation):**
  - Stored Procedure `sp_XuLyKetQuaThanhToan` và `sp_CapNhatTrangThaiThanhToan` đã được bọc trong giao dịch `SERIALIZABLE` kết hợp khóa ứng dụng phân tán `sp_getapplock` theo `DonDatVeID`.
  - Kiểm tra tính lũy kế (idempotency): Nếu đơn hàng đã ở trạng thái `DA_THANH_TOAN`, callback lặp lại sẽ bị bỏ qua và ghi log cảnh báo, không cập nhật lại trạng thái vé.
- **Rủi ro tồn đọng:** Thấp.
- **Người chịu trách nhiệm:** Backend Architect.

---

### RISK-07: Ghi dữ liệu ngoài luồng (Background Writes) khi Cutover
- **Mô tả:** Cron jobs, batch jobs hoặc tiến trình cache của Backend vẫn tiếp tục ghi vào database trong khi DBA đang chạy migration DDL (`03_contract_alter_schema.sql`), gây xung đột khóa hoặc hỏng dữ liệu.
- **Biện pháp xử lý (Mitigation):**
  - Tắt toàn bộ Node.js Backend processes trước khi bắt đầu DDL (`pm2 stop all` / dừng container).
  - Đặt Database về trạng thái `ALTER DATABASE [CinemaBookingDB] SET RESTRICTED_USER WITH ROLLBACK IMMEDIATE;` để ngắt ngay lập tức các kết nối nền còn sót lại.
- **Rủi ro tồn đọng:** Triệt tiêu hoàn toàn.
- **Người chịu trách nhiệm:** Release Engineer & DBA.

---

### RISK-08: Giao dịch tồn đọng kéo dài (Long-Running Transactions)
- **Mô tả:** Một truy vấn thống kê lớn hoặc giao dịch dở dang giữ Exclusive lock hoặc Shared lock trên bảng `THANHTOAN`, khiến lệnh `ALTER TABLE DROP COLUMN` bị nghẽn (Lock Wait Timeout).
- **Biện pháp xử lý (Mitigation):**
  - Bước Pre-flight kiểm tra `sys.dm_tran_active_transactions` và `sys.dm_exec_requests`.
  - Thiết lập `SET LOCK_TIMEOUT 30000;` (30 giây). Nếu bị chặn quá 30 giây, script tự động hủy bỏ giao dịch và báo lỗi, không làm treo SQL Server.
- **Rủi ro tồn đọng:** Cực thấp.
- **Người chịu trách nhiệm:** DBA.

---

### RISK-09: Khóa bảng diện rộng (Lock Escalation / Exclusive Locks)
- **Mô tả:** Lệnh DDL trên bảng dữ liệu lớn gây lock escalation toàn bảng, làm gián đoạn hệ thống.
- **Phân tích kỹ thuật:**
  - Trong SQL Server, lệnh `ALTER TABLE [dbo].[THANHTOAN] DROP COLUMN [SoTien];` là thao tác **Metadata-only** (chỉ cập nhật con trỏ trong system catalog, không ghi lại toàn bộ trang dữ liệu vật lý).
  - Thời gian thực thi đo được trên môi trường thử nghiệm: **$15 \text{ ms}$**.
  - Không có hiện tượng copy bảng hay rebuild clustered index.
- **Biện pháp xử lý (Mitigation):** Chạy lệnh trong maintenance window với lock timeout 30s.
- **Rủi ro tồn đọng:** Không đáng kể.
- **Người chịu trách nhiệm:** Database Reliability Engineer.

---

### RISK-10: Rollback thất bại / Script rollback lệch schema
- **Mô tả:** Trong trường hợp xảy ra sự cố bắt buộc phải hoãn release, script `99_rollback_all.sql` bị lỗi cú pháp, thiếu dữ liệu hoặc không phục hồi lại được cột `SoTien`.
- **Bằng chứng thực tế:**
  - Script `99_rollback_all.sql` đã được chạy thử nghiệm thực tế trong Phase R5-B trên Database Test:
    - Tạo lại cột `THANHTOAN.SoTien DECIMAL(18,2) NULL`.
    - Tái tạo dữ liệu lịch sử từ snapshot `DONDATVE.TongTien` chính xác $100\%$.
    - Thiết lập lại ràng buộc `NOT NULL` và Check constraint `CK_THANHTOAN_SoTien`.
    - Khôi phục Stored Procedure gốc và drop view tạm.
    - Thời gian chạy rollback thực tế: **$0.45 \text{ giây}$**.
- **Biện pháp xử lý (Mitigation):** Luôn có sẵn bản backup toàn phần trước cutover làm phương án cứu trợ cấp 2 nếu T-SQL rollback thất bại.
- **Rủi ro tồn đọng:** Cực thấp.
- **Người chịu trách nhiệm:** DBA & Migration Lead.

---

### RISK-11: Phục hồi từ Backup thất bại (Corrupt Backup / Logical File Mismatch)
- **Mô tả:** File backup bị hỏng do lỗi đĩa cứng hoặc lệnh restore thất bại do sai tên logical file name (`CinemaBookingDB` vs `CinemaBookingDB_log`).
- **Bằng chứng thực tế:**
  - File backup đã được kiểm chứng bằng lệnh `RESTORE VERIFYONLY WITH CHECKSUM`: Kết quả **The backup set is valid**.
  - Logical file names đã được xác thực qua `RESTORE FILELISTONLY`:
    - Data: `CinemaBookingDB`
    - Log: `CinemaBookingDB_log`
- **Biện pháp xử lý (Mitigation):**
  - Tạo backup mới `COPY_ONLY` có CHECKSUM ngay tại phút T+03 của cửa sổ cutover.
  - Xác nhận file backup hợp lệ trước khi chạm vào bất kỳ đối tượng DDL nào.
- **Rủi ro tồn đọng:** Triệt tiêu hoàn toàn.
- **Người chịu trách nhiệm:** Lead DBA.

---

### RISK-12: Thiếu bộ kiểm thử tự động Browser E2E trên Web UI
- **Mô tả:** Repo hiện chỉ có kiểm thử mức Component (Jest/RTL mock DOM), chưa có headless browser test tự động (Cypress/Playwright) chạy tương tác thực tế với trình duyệt Chrome/Firefox. Có nguy cơ phát sinh lỗi hiển thị CSS hoặc sự kiện click chuột sau cutover.
- **Biện pháp xử lý (Mitigation):**
  - Không giả mạo kết quả PASS cho Browser E2E (ghi nhận minh bạch là `NOT_VERIFIED`).
  - Thiết lập kịch bản **Manual UAT Checklist** 5 bước bắt buộc tại phút T+35 đến T+40 của cửa sổ cutover:
    1. Đăng nhập người dùng bằng giao diện web.
    2. Chọn suất chiếu, chọn ghế và giữ ghế trong 10 phút.
    3. Đi đến trang thanh toán và kiểm tra hiển thị số tiền từ dynamic snapshot.
    4. Giả lập thanh toán thành công và kiểm tra vé điện tử xuất ra.
    5. Đăng nhập Admin và kiểm tra báo cáo doanh thu.
- **Rủi ro tồn đọng:** Trung bình (được kiểm soát hoàn toàn bằng UAT thủ công trước khi mở public).
- **Người chịu trách nhiệm:** QA Lead & Frontend Engineer.

---

### RISK-13: Phụ thuộc ngầm / Báo cáo ngoài luồng truy vấn cột cũ
- **Mô tả:** Các báo cáo PowerBI, script ETL hoặc ứng dụng bên thứ ba truy vấn trực tiếp `SELECT SoTien FROM dbo.THANHTOAN` bị lỗi sau khi drop cột vật lý.
- **Biện pháp xử lý (Mitigation):**
  - Bảng vật lý được đổi tên thành `dbo.THANHTOAN_BASE` (hoặc view `dbo.THANHTOAN` được triển khai thay thế tính toán trường `SoTien` động thông qua snapshot `DONDATVE`).
  - Do đó, mọi câu lệnh legacy `SELECT SoTien FROM THANHTOAN` vẫn trả về dữ liệu đúng 100% mà không bị lỗi cú pháp `Invalid column name`.
- **Rủi ro tồn đọng:** Thấp.
- **Người chịu trách nhiệm:** Database Architect.

---

### RISK-14: Lỗ hổng giám sát & Không phát hiện lỗi ngầm sau Cutover
- **Mô tả:** Hệ thống hoạt động nhưng âm thầm phát sinh lỗi trong SQL Error Log hoặc Node.js log mà không có người phát hiện.
- **Biện pháp xử lý (Mitigation):**
  - Đội ngũ trực chiến 3 người (DBA, Backend, QA) giám sát trực tiếp trong 2 giờ đầu tiên sau cutover.
  - Theo dõi liên tục các chỉ số:
    - SQL Server Error Log: `xp_readerrorlog 0, 1, N'error'`
    - Tỷ lệ lỗi HTTP 5xx trên Backend.
    - Deadlock Graph trong SQL Server Extended Events.
- **Rủi ro tồn đọng:** Thấp.
- **Người chịu trách nhiệm:** SRE / Database Reliability Engineer.

---

## 4. KẾT LUẬN VÀ KIẾN NGHỊ PHÊ DUYỆT RỦI RO

1. **Tổng thể đánh giá:**
   - Trong 14 rủi ro, **13 rủi ro kỹ thuật đã được triệt tiêu hoặc kiểm soát hoàn toàn** thông qua kiến trúc Strict 3NF, bộ migration scripts an toàn và kế hoạch cutover/rollback chi tiết.
   - **Rủi ro duy nhất còn là Blocker:** `RISK-05` (Tài khoản kết nối Backend `DB_USER=sa`). Rủi ro này **phải được giải quyết** bằng việc kích hoạt tài khoản `CinemaAppUser` theo đúng thiết kế bảo mật trước khi mở cổng Production.

2. **Khuyến nghị cho Gate C:**
   - **PHÊ DUYỆT CÓ ĐIỀU KIỆN (CONDITIONAL GO):** Cho phép mở cửa sổ bảo trì triển khai với điều kiện tiên quyết là hoàn tất chuyển đổi `CinemaAppUser` và thực hiện đầy đủ Manual UAT.

