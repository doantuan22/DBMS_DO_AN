-- FILE ĐIỀU PHỐI KHỞI TẠO DATABASE ĐẦY ĐỦ.
-- Chạy từ thư mục database bằng sqlcmd; các file thành phần phải nằm đúng vị trí.
-- Các lệnh :r cần SQLCMD Mode nếu chạy bằng SSMS.
-- Tạo mới CinemaBookingDB; không xóa hoặc ghi đè database đã tồn tại.
:on error exit
:setvar SeedProfile "demo-dynamic"

USE [master];
GO

-- 1. Kiểm tra điều kiện trước mọi bước ghi dữ liệu.
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF @@TRANCOUNT <> 0
    THROW 51600, N'Không chạy khởi tạo trong transaction đang mở.', 1;
IF CONVERT(int, SERVERPROPERTY('ProductMajorVersion')) < 13
    THROW 51600, N'Cần SQL Server 2016 SP1 trở lên.', 1;
IF DB_ID(N'CinemaBookingDB') IS NOT NULL
    THROW 51601, N'CinemaBookingDB đã tồn tại; không có dữ liệu nào bị ghi đè.', 1;
IF COALESCE(HAS_PERMS_BY_NAME(NULL, NULL, 'CREATE ANY DATABASE'), 0) <> 1
    THROW 51600, N'Tài khoản SQL cần quyền tạo database.', 1;

-- Xóa context cũ để không tái sử dụng quyền nạp seed của lượt trước.
EXEC sys.sp_set_session_context @key = N'RunAllNewDatabaseGuid', @value = NULL;
EXEC sys.sp_set_session_context @key = N'RunAllCreateDate', @value = NULL;
EXEC sys.sp_set_session_context @key = N'SeedV2Target', @value = NULL;
PRINT N'[1/4] Tạo database, bảng, ràng buộc và các module SQL';
GO

-- 2. Build theo thứ tự phụ thuộc trong file build-objects.sql.
:r ./build-objects.sql

-- Xác nhận database mới để seed không được chạy trên database khác.
IF DB_NAME() <> N'CinemaBookingDB'
    THROW 51602, N'Kết nối không ở database vừa tạo.', 1;
DECLARE @NewGuid uniqueidentifier, @CreateDate datetime;
SELECT @NewGuid = r.database_guid, @CreateDate = d.create_date
FROM master.sys.databases d
JOIN master.sys.database_recovery_status r ON r.database_id = d.database_id
WHERE d.database_id = DB_ID();
IF @NewGuid IS NULL OR @CreateDate IS NULL
    THROW 51602, N'Không xác minh được database vừa tạo.', 1;
EXEC sys.sp_set_session_context @key = N'RunAllNewDatabaseGuid', @value = @NewGuid;
EXEC sys.sp_set_session_context @key = N'RunAllCreateDate', @value = @CreateDate;
EXEC sys.sp_set_session_context @key = N'SeedV2Target', @value = N'CinemaBookingDB';
PRINT N'[2/4] Nạp catalog, lịch chiếu và các trạng thái giao dịch demo';
GO

-- 3. Seed dùng các file canonical; ngày dữ liệu lấy từ đồng hồ SQL Server.
:r ./10_seed/seed-all.sql

PRINT N'[3/4] Kiểm tra cấu trúc, quyền, tham số và khả năng biên dịch';
GO

-- 4. Đối chiếu schema, constraints, indexes, trigger, permissions và fixed RBAC.
:r ./12_verify/verify_database.sql

PRINT N'[4/4] Kiểm tra toàn vẹn dữ liệu seed và snapshot tiền';
GO

-- 5. Kiểm tra catalog, lịch trùng, ghế trùng và số tiền của đơn/thanh toán.
:r ./10_seed/verify/seed-v2.sql

-- 6. Dọn context khởi tạo và thông báo kết quả chỉ khi mọi bước đã thành công.
IF @@TRANCOUNT <> 0 OR XACT_STATE() <> 0
    THROW 51603, N'Cài đặt chưa đóng hết transaction.', 1;
EXEC sys.sp_set_session_context @key = N'RunAllNewDatabaseGuid', @value = NULL;
EXEC sys.sp_set_session_context @key = N'RunAllCreateDate', @value = NULL;
EXEC sys.sp_set_session_context @key = N'SeedV2Target', @value = NULL;
PRINT N'HOÀN TẤT: database đã có schema, nghiệp vụ, seed và verification.';
SELECT DB_NAME() AS DatabaseName,
    (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped = 0) AS Tables,
    (SELECT COUNT(*) FROM sys.sql_modules) AS Modules,
    (SELECT COUNT(*) FROM dbo.NGUOIDUNG) AS Users,
    (SELECT COUNT(*) FROM dbo.PHIM) AS Movies,
    (SELECT COUNT(*) FROM dbo.SUATCHIEU) AS Showtimes,
    (SELECT COUNT(*) FROM dbo.DONDATVE) AS Orders;
GO
