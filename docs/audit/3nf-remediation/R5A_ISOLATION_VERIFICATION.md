# BÁO CÁO NGHIỆM THU CÔ LẬP VÀ XÁC MINH BASELINE (PHASE R5-A VERIFICATION)
## DỰ ÁN: CinemaBookingDB — STRICT 3NF NORMALIZATION

- **Cơ quan thẩm định:** Senior SQL Server DBA, Database Reliability Engineer & Security Auditor
- **Thời gian thực hiện:** 13/10/2026
- **Trạng thái:**
  - Login & Permissions: **VERIFIED PASS**
  - Production Access Blocking: **VERIFIED DENIED (ERROR 18456)**
  - Application Isolation: **VERIFIED PASS (.env.test ISOLATED)**
  - Baseline Persistence & Reload: **VERIFIED PASS (OPENJSON FIDELITY 100%)**

---

## 1. NGHIỆM THU TÀI KHOẢN VÀ BẢO MẬT LEAST-PRIVILEGE (R5-A3)

### 1.1 Khởi tạo Login và Cấp quyền Test
- Đã tạo Server Login `CinemaTestUser` với mật khẩu ngẫu nhiên mạnh được sinh trong session bảo mật.
- Kiểm tra quyền Server: `IS_SRVROLEMEMBER('sysadmin', 'CinemaTestUser') = 0` (**KHÔNG CÓ QUYỀN SYSADMIN**).
- Trong `CinemaBookingDB_Test`: User `CinemaTestUser` được gán role `db_owner`.

### 1.2 Kiểm tra Hiệu dụng Kết nối (Access Verification)
| Kịch bản Kiểm thử | Lệnh Thực thi | Kết quả Quan sát Thực tế | Đánh giá |
| :--- | :--- | :--- | :---: |
| **Truy cập Test DB (Positive)** | `sqlcmd -U CinemaTestUser -d CinemaBookingDB_Test` | `CurrentLogin: CinemaTestUser, CurrentDB: CinemaBookingDB_Test, IsDbOwner: 1` | **PASS** |
| **Truy cập Production (Negative)** | `sqlcmd -U CinemaTestUser -d CinemaBookingDB` | `Sqlcmd: Error: Login failed for user 'CinemaTestUser' (DENIED)` | **BLOCKED (PASS)** |

**Kết luận:** Cơ chế `DENY CONNECT TO [CinemaTestUser]` và thu hồi quyền `guest` trên `CinemaBookingDB` đã bảo vệ Production tuyệt đối khỏi mọi rủi ro can thiệp nhầm lẫn.

---

## 2. NGHIỆM THU TÍNH BỀN VỮNG VÀ KHẢ NĂNG NẠP LẠI BASELINE (R5-A4)

### 2.1 Thực thi Preflight và Lưu trữ Hai Tầng
1. Script [`01_preflight_checks.sql`](file:///d:/DBMS_DO_AN/database/13_migrations/3nf_remediation/01_preflight_checks.sql) được thực thi thành công trên `CinemaBookingDB_Test`:
   - 27 bảng được kiểm tra: ĐẠT.
   - Sai lệch số tiền (MismatchCount): 0.
   - Bản ghi mồ côi (OrphanCount): 0.
   - Tạo thành công bảng staging trong `tempdb`:
     - `tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test`
     - `tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test`
   - Bảng nghiệp vụ trên `CinemaBookingDB_Test` hoàn toàn sạch sẽ (0 bảng mới).
2. Mã băm toàn vẹn bảng (Table SHA-256 Checksum):  
   `05C7B81FD27713134DF9FE45201E4D3C1E939ED98F464A2C7DF78ACEF2FB40EE`

### 2.2 Xuất Artifact File và Kiểm định OPENJSON Reload
- Toàn bộ dữ liệu snapshot được xuất ra file JSON:  
  `docs/audit/3nf-remediation/baseline/pre_migration_baseline_CinemaBookingDB_Test.json`
- Đã chạy kiểm thử T-SQL nạp lại file JSON qua lệnh gốc `OPENJSON()`:
  - 4/4 bản ghi giao dịch (`ThanhToanID` từ 1 đến 4) được bóc tách chính xác 100% thuộc tính.
  - Số tiền vật lý gốc và số tiền tái dựng khớp nhau tuyệt đối (`99.000,00`, `99.000,00`, `247.500,00`, `100.000,00`).
- File JSON và file `.env.test` đã được cấu hình trong [`.gitignore`](file:///d:/DBMS_DO_AN/.gitignore) để **ngăn chặn tuyệt đối việc commit dữ liệu nhạy cảm vào Git**.

---

## 3. NGHIỆM THU CÔ LẬP ỨNG DỤNG VÀ DỊCH VỤ (R5-A5)

1. **Cấu hình Backend Test:**  
   File [`backend/.env.test`](file:///d:/DBMS_DO_AN/backend/.env.test) đã được tạo độc lập:
   - `PORT=4001` (khác với cổng 4000 của Production).
   - `DB_DATABASE=CinemaBookingDB_Test`.
   - `DB_USER=CinemaTestUser`.
   - `MOCK_NOTIFICATIONS=true`.
   - `MOCK_PAYMENT_GATEWAY=true`.
2. **Bảo vệ File Production:**  
   File [`backend/.env`](file:///d:/DBMS_DO_AN/backend/.env) được bảo toàn nguyên vẹn (`git diff` rỗng).
3. **Cô lập Tích hợp Ngoài:**  
   Không có Agent Job, không có worker, không có webhook hoặc cổng thanh toán thật nào được kết nối vào Database Test.

---

## 4. KẾT LUẬN CÔ LẬP R5-A

Môi trường kiểm thử `CinemaBookingDB_Test` đã hoàn thành khởi tạo và đáp ứng 100% tiêu chí cô lập an toàn nghiêm ngặt của dự án.
