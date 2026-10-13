# R8 PRODUCTION SECURITY READINESS REPORT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R8 — Final 3NF Certification & Production Release Readiness  
**Vai trò:** Principal Security Auditor, SQL Server DBA & Infrastructure Security Lead  
**Ngày thực hiện:** 13/10/2026  
**Chủ đề:** Thẩm định An ninh Triển khai Production, Rà soát Quyền Tối thiểu & Kế hoạch Hardening  

---

## 1. Rà soát Cấu hình Hiện hành & Nhận diện Lỗ hổng Trọng yếu (Security Audit)

### 1.1. Hiện trạng Cấu hình `backend/.env`
Khảo sát tệp cấu hình runtime của Backend:
```ini
PORT=4000
NODE_ENV=development
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=CinemaBookingDB
DB_USER=sa
DB_PASSWORD=[REDACTED]
```

### 1.2. Đánh giá Mức độ Rủi ro
- **Lỗ hổng nghiêm trọng:** Ứng dụng Backend đang cấu hình sử dụng tài khoản `sa` (System Administrator) để kết nối trực tiếp vào cơ sở dữ liệu Production (`CinemaBookingDB`).
- **Phân loại rủi ro:** **CRITICAL SECURITY RELEASE BLOCKER**.
- **Hệ quả tiềm tàng nếu đưa lên Production:**
  1. `sa` sở hữu đặc quyền tối cao `sysadmin` trên toàn bộ SQL Server instance.
  2. Bỏ qua hoàn toàn mọi cơ chế kiểm soát quyền hạn cấp độ Schema và Table (`GRANT`, `DENY`).
  3. Nếu ứng dụng có lỗ hổng thực thi mã từ xa (RCE) hoặc lỗi thư viện npm, kẻ tấn công có thể can thiệp vào các database khác trên cùng máy chủ, đọc file hệ thống hoặc kích hoạt thủ tục mở rộng nguy hiểm (`xp_cmdshell`).
  4. Vi phạm trực tiếp nguyên tắc "Quyền hạn Tối thiểu" (Principle of Least Privilege) và tiêu chuẩn an toàn thông tin OWASP ASVS / ISO 27001.

**Quyết định phê duyệt:** **TUYỆT ĐỐI KHÔNG PHÁT HÀNH PRODUCTION KHI ỨNG DỤNG CÒN CHẠY BẰNG TÀI KHOẢN `sa`**.

---

## 2. Thiết kế Kiến trúc Phân quyền Tối thiểu cho Production (Least Privilege Design)

Để bảo đảm an ninh tuyệt đối, hệ thống Production phải tách biệt rõ ràng giữa **Tài khoản Thực thi Ứng dụng (Application Account)** và **Tài khoản Di trú Hệ thống (Migration Account)**:

```text
┌────────────────────────────────────────────────────────┐
│            SQL Server Instance: DoanTuanIT             │
├───────────────────────────┬────────────────────────────┤
│   CinemaAppUser           │   CinemaDeployUser         │
│   (Application Runtime)   │   (Migration & DDL Only)   │
├───────────────────────────┼────────────────────────────┤
│ • KHÔNG sysadmin          │ • KHÔNG sysadmin           │
│ • DENY DML trên dbo       │ • Thành viên db_owner      │
│ • GRANT EXECUTE trên dbo  │   chỉ trên CinemaBookingDB │
│ • Chỉ dùng cho Backend    │ • Chỉ mở trong Maintenance │
│   chạy thường trực        │   Window khi chạy di trú   │
└───────────────────────────┴────────────────────────────┘
```

---

## 3. Quy trình Thiết lập Tài khoản Ứng dụng Hạn quyền (`CinemaAppUser`)

Kế hoạch thực thi cấu hình trên `CinemaBookingDB` (sẽ được chạy trong cửa sổ bảo trì của Gate C, **không chạy trong R8**):

```sql
USE [master];
GO

-- 1. Tạo SQL Server Login cho ứng dụng (mật khẩu mạnh được sinh ngẫu nhiên)
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'CinemaAppUser')
BEGIN
    CREATE LOGIN [CinemaAppUser] 
    WITH PASSWORD = N'<Strong_Random_App_Password_32_Chars!>',
         CHECK_EXPIRATION = OFF,
         CHECK_POLICY = ON;
END;
GO

USE [CinemaBookingDB];
GO

-- 2. Tạo Database User trong CinemaBookingDB
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'CinemaAppUser')
BEGIN
    CREATE USER [CinemaAppUser] FOR LOGIN [CinemaAppUser];
END;
GO

-- 3. Thiết lập chính sách Quyền hạn Tối thiểu (Least Privilege Policy)
-- Chặn tuyệt đối mọi lệnh DML trực tiếp vào bảng và view nghiệp vụ
DENY SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO [CinemaAppUser];

-- Chỉ cấp duy nhất quyền thực thi Stored Procedures và Functions
GRANT EXECUTE ON SCHEMA::dbo TO [CinemaAppUser];
GRANT VIEW DEFINITION ON SCHEMA::dbo TO [CinemaAppUser];
GO
```

---

## 4. Thẩm định Chuỗi Sở hữu SQL Server (Ownership Chaining & Dynamic SQL Audit)

### 4.1. Chuỗi Sở hữu Liền mạch (Unbroken Ownership Chaining)
- Trong SQL Server, khi một người dùng thực thi Stored Procedure do `dbo` sở hữu để truy xuất dữ liệu từ các bảng cũng do `dbo` sở hữu, Database Engine kích hoạt cơ chế **Ownership Chaining**.
- Kết quả: Người dùng `CinemaAppUser` có thể đọc và ghi dữ liệu thông qua Stored Procedure một cách hợp lệ mà **không cần được cấp quyền SELECT/INSERT/UPDATE/DELETE trực tiếp** trên các bảng bên dưới.
- Nếu người dùng hoặc kẻ tấn công cố tình thực hiện câu lệnh trực tiếp như `SELECT * FROM dbo.DONDATVE`, Database Engine kiểm tra quyền bảng và lập tức trả về lỗi **Msg 229 (Permission Denied)**.

### 4.2. Rà soát Mã SQL Động (Dynamic SQL Audit)
- Rà soát toàn bộ 134 Stored Procedures trong thư mục `database/08_procedures/`:
  - **Số lượng thủ tục sử dụng `sp_executesql` cho DML:** **0 (Không có)**.
  - **Số lượng thủ tục sử dụng lệnh `EXEC('...')` chuỗi:** **0 (Không có)**.
- Toàn bộ 134 thủ tục đều được viết bằng câu lệnh T-SQL tĩnh có tham số hóa.
- **Kết luận:** Chuỗi sở hữu (Ownership Chaining) được bảo toàn 100%, không bị đứt đoạn bởi Dynamic SQL, bảo đảm hoạt động hoàn hảo dưới quyền hạn tối thiểu.

---

## 5. Thẩm định Mô hình Phân quyền RBAC & Phạm vi Quản lý

1. **Phân quyền vai trò cố định (Fixed RBAC):**
   - Hệ thống có 4 vai trò cố định: `ADMIN`, `QUAN_LY_RAP`, `CSKH`, `KHACH_HANG`.
   - Các API thay đổi quyền hạn động đã được khóa chặt, trả về lỗi HTTP 403 `RBAC_FIXED`.
2. **Kiểm soát phạm vi quản lý rạp (Cinema Scoping):**
   - Hàm bảo mật `dbo.fn_KiemTraQuanLyRapScope(NguoiDungID, RapID)` kiểm tra hiệu lực phân công thực tế trong bảng `PHANCONG_RAP`. Quản lý rạp không thể xem hoặc sửa dữ liệu rạp khác.
3. **Bảo vệ quyền riêng tư khách hàng (PII Protection):**
   - Khi khách hàng tra cứu đơn hàng hoặc thanh toán, Stored Procedure đối soát `d.NguoiDungID = @NguoiDungID`. Nếu không khớp, thủ tục trả về mã lỗi chung 50033 (*"Đơn đặt vé không tồn tại"*), ngăn chặn triệt để kỹ thuật dò quét ID (ID Enumeration).

---

## 6. Kết luận & Điều kiện Tiên quyết cho Gate C

| Hạng mục An ninh | Hiện trạng Hiện tại | Trạng thái Nghiệm thu | Điều kiện trước Gate C |
|---|---|:---:|---|
| **Tài khoản Kết nối Backend** | `sa` (sysadmin) | **BLOCKER (NO-GO)** | Phải đổi sang `CinemaAppUser` (Least Privilege) |
| **Quyền DML trực tiếp** | Bị DENY trên Test user | **READY** | Áp dụng `DENY DML` trên Production |
| **Quyền Thực thi Stored Procedure** | `GRANT EXECUTE` | **READY** | Cấp quyền EXECUTE cho `CinemaAppUser` |
| **Chuỗi Sở hữu (Ownership Chain)** | 100% thuộc `dbo`, 0 Dynamic SQL | **READY** | Bảo toàn liền mạch |
| **Fixed RBAC & Scope Protection** | Hoàn thành và kiểm chứng | **READY** | Sẵn sàng hoạt động |
| **Bảo mật File Bí mật (`.env`)** | File `.env.production` chưa tạo | **ACTION REQUIRED** | Tạo file riêng ngoài git, phân quyền 600 |

**Kiến nghị Ban Chỉ đạo:** Đánh dấu **SECURITY HARDENING REQUIRED BEFORE GATE C CUTOVER**. Quá trình chuyển đổi tài khoản ứng dụng sang `CinemaAppUser` là điều kiện bắt buộc số 1 trong Kế hoạch Cutover Production.

