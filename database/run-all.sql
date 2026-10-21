-- Create the canonical CinemaBookingDB schema only.
-- The retired demo seed is not included. Run the reviewed production seed as a
-- separate, approved operation after schema and target verification.
:on error exit

USE [master];
GO

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

PRINT N'[1/3] Tao database CinemaBookingDB';
GO

:r ./00_database/002_create_database.sql
:r ./00_database/003_database_options.sql

PRINT N'[2/3] Tao schema, constraints, indexes va database modules';
GO

:r ./build-objects.sql

PRINT N'[3/3] Kiem tra schema, constraints, modules va permissions';
GO

:r ./12_verify/verify_database.sql

IF DB_NAME() <> N'CinemaBookingDB'
    THROW 51602, N'Kiểm tra không chạy trên CinemaBookingDB.', 1;
PRINT N'HOÀN TẤT: schema đã được tạo; seed chưa được nạp.';
SELECT DB_NAME() AS DatabaseName,
    (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped = 0 AND name<>N'sysdiagrams') AS Tables,
    (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0 AND name NOT IN (N'sp_alterdiagram',N'sp_creatediagram',N'sp_dropdiagram',N'sp_helpdiagramdefinition',N'sp_helpdiagrams',N'sp_renamediagram',N'sp_upgraddiagrams')) AS Procedures,
    (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped = 0) AS Views,
    (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped = 0 AND name<>N'fn_diagramobjects') AS Functions,
    (SELECT COUNT(*) FROM sys.triggers WHERE parent_class = 1) AS Triggers;
GO
