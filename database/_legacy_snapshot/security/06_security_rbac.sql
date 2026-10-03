-- ============================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP
-- KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY
-- SCRIPT 06: BẢO MẬT & PHÂN QUYỀN TRÊN SQL SERVER (SECURITY & RBAC)
-- NGUYÊN TẮC: TÀI KHOẢN KẾT NỐI ỨNG DỤNG CHỈ ĐƯỢC EXECUTE STORED PROCEDURE,
-- TUYỆT ĐỐI BỊ DENY TRUY CẬP TRỰC TIẾP CÁC BẢNG (NO DIRECT TABLE DML/SELECT)
-- ============================================================================

-- CÁCH CHẠY TRONG SSMS: bật Query -> SQLCMD Mode rồi Execute (cần để $(AppPassword) được thay giá trị).
-- Mật khẩu của login ứng dụng (phải trùng DB_PASSWORD trong backend/.env). KHÔNG commit mật khẩu thật lên Git.
-- Khi chạy bằng deploy.ps1 thì dòng :setvar này được bỏ qua và mật khẩu lấy từ tham số -AppPassword.
-- Legacy password default removed. Supply environment credentials.

USE master
GO

-- 1. Tạo Login cấp Server cho ứng dụng (nếu chưa có)
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = N'CinemaAppUser')
BEGIN
    -- CHECK_POLICY = OFF: không áp chính sách mật khẩu Windows (môi trường đồ án/máy cá nhân).
    -- Môi trường thật: dùng mật khẩu mạnh và đổi thành CHECK_POLICY = ON.
    CREATE LOGIN CinemaAppUser WITH PASSWORD = N'$(AppPassword)', CHECK_POLICY = OFF;
    PRINT N'>>> Đã tạo Server Login: CinemaAppUser';
END
ELSE
BEGIN
    -- Tắt CHECK_POLICY trước để login đã tồn tại (đang bật chính sách) nhận được mật khẩu đơn giản
    ALTER LOGIN CinemaAppUser WITH CHECK_POLICY = OFF;
    ALTER LOGIN CinemaAppUser WITH PASSWORD = N'$(AppPassword)';
    PRINT N'>>> Đã cập nhật mật khẩu cho Server Login: CinemaAppUser';
END
GO

USE CinemaBookingDB
GO

-- 2. Tạo User trong database CinemaBookingDB map với Login
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = N'CinemaAppUser')
BEGIN
    CREATE USER CinemaAppUser FOR LOGIN CinemaAppUser;
    PRINT N'>>> Đã tạo Database User: CinemaAppUser trong CinemaBookingDB';
END
GO

-- 3. Tạo Database Role chuyên biệt: db_executor (Chỉ có quyền thực thi Stored Procedures)
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = N'db_executor' AND type = 'R')
BEGIN
    CREATE ROLE db_executor;
    PRINT N'>>> Đã tạo Database Role: db_executor';
END
GO

-- 4. Cấp quyền EXECUTE trên toàn bộ schema dbo cho db_executor
GRANT EXECUTE ON SCHEMA::dbo TO db_executor;
PRINT N'>>> Đã GRANT EXECUTE ON SCHEMA::dbo TO db_executor';
GO

-- 5. NGUYÊN TẮC BẢO MẬT BẮT BUỘC: DENY trực tiếp SELECT, INSERT, UPDATE, DELETE trên schema dbo
-- Điều này đảm bảo rằng ngay cả khi có kẻ tấn công inject SQL raw query từ backend, DBMS sẽ chặn ngay lập tức
DENY SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO db_executor;
PRINT N'>>> Đã DENY SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO db_executor (Cấm tuyệt đối truy vấn bảng trực tiếp)';
GO

-- 6. Gán User CinemaAppUser vào Role db_executor
ALTER ROLE db_executor ADD MEMBER CinemaAppUser;
PRINT N'>>> Đã gán CinemaAppUser vào role db_executor';
GO

-- 7. Truy vấn kiểm tra quyền của tài khoản ứng dụng
SELECT
    pr.name AS PrincipalName,
    pr.type_desc AS PrincipalType,
    pe.state_desc AS PermissionState,
    pe.permission_name AS PermissionName,
    OBJECT_SCHEMA_NAME(pe.major_id) AS SchemaName
FROM sys.database_permissions pe
INNER JOIN sys.database_principals pr ON pe.grantee_principal_id = pr.principal_id
WHERE pr.name IN ('CinemaAppUser', 'db_executor')
ORDER BY pr.name, pe.permission_name;
GO

PRINT N'>>> [06_security_rbac.sql] Cấu hình bảo mật và phân quyền tài khoản ứng dụng hoàn tất.';
GO
