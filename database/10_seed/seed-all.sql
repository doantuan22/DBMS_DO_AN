-- Chuẩn bị hoặc kiểm tra dữ liệu seed theo target đã xác nhận.
:on error exit

-- Seed thông thường dùng demo/test; run-all chỉ được nạp vào database vừa tạo.
SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @InitialInstall bit = 0;
IF DB_NAME() = N'CinemaBookingDB'
    AND TRY_CONVERT(uniqueidentifier, SESSION_CONTEXT(N'RunAllNewDatabaseGuid')) =
        (SELECT database_guid FROM master.sys.database_recovery_status WHERE database_id = DB_ID())
    AND TRY_CONVERT(datetime, SESSION_CONTEXT(N'RunAllCreateDate')) =
        (SELECT create_date FROM master.sys.databases WHERE database_id = DB_ID())
    SET @InitialInstall = 1;
IF DB_NAME() NOT IN (
    N'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012',
    N'CinemaBookingDB_R0_REAL_MEDIA_TEST_20261012'
)
    AND @InitialInstall = 0
    THROW 51100, 'Seed refuses Main and non-allowlisted targets.', 1;
-- Không dùng context khởi tạo để nạp thêm dữ liệu vào database đã có bản ghi.
IF @InitialInstall = 1 AND EXISTS (
    SELECT 1
    FROM sys.tables t
    JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
    WHERE t.is_ms_shipped = 0 AND p.rows > 0
)
    THROW 51100, N'Database khởi tạo không còn trống; dừng nạp seed.', 1;
IF SESSION_CONTEXT(N'SeedV2Target') IS NULL
    OR CONVERT(nvarchar(128), SESSION_CONTEXT(N'SeedV2Target')) <> DB_NAME()
    THROW 51100, 'Verified seed target context required.', 1;
DECLARE @Profile varchar(30) = '$(SeedProfile)';
IF @Profile NOT IN ('base', 'demo-dynamic')
    THROW 51100, 'Invalid seed profile.', 1;
EXEC sys.sp_set_session_context @key = N'SeedV2Profile',
    @value = @Profile;
DECLARE @SeedDayV2 date = dbo.fn_NgayKinhDoanh(dbo.fn_BayGio());
EXEC sys.sp_set_session_context @key = N'CinemaSeedDay',
    @value = @SeedDayV2;
DECLARE @SkipV2 int = CASE
    WHEN EXISTS (
        SELECT
            1
        FROM
            dbo.VAITRO
    ) THEN 1
    ELSE 0
END;
IF @SkipV2 = 0
    AND EXISTS (
    SELECT
        1
    FROM
        sys.tables t
        JOIN sys.partitions p ON p.object_id = t.object_id
        AND p.index_id IN (0, 1)
    WHERE
        p.rows > 0
)
    THROW 51100, 'Partial or foreign database; seed requires empty target.', 1;
EXEC sys.sp_set_session_context @key = N'CinemaSeedSkip',
    @value = @SkipV2;
-- Mở transaction để các bước ghi được xử lý cùng nhau.
BEGIN TRANSACTION;

GO

-- Nạp hoặc kiểm tra dữ liệu seed.
:r ./10_seed/seed_base/001_reference.sql

:r ./10_seed/seed_base/002_reference.sql

:r ./10_seed/seed_base/003_reference.sql

DECLARE @Now datetime2 = dbo.fn_BayGio(),
    @Day date = dbo.fn_NgayKinhDoanh(dbo.fn_BayGio());
DECLARE @BaseNew bit = CASE
    WHEN CONVERT(int, SESSION_CONTEXT(N'CinemaSeedSkip')) = 0 THEN 1
    ELSE 0
END;
DECLARE @DynamicNew bit = CASE
    WHEN NOT EXISTS (
        SELECT
            1
        FROM
            dbo.SUATCHIEU
    )
    AND SESSION_CONTEXT(N'SeedV2Profile') = N'demo-dynamic' THEN 1
    ELSE 0
END;

:r ./10_seed/seed_base/020_users.sql

:r ./10_seed/seed_base/030_cinemas.sql

:r ./10_seed/seed_base/040_movies.sql

:r ./10_seed/seed_base/050_commerce.sql

:r ./10_seed/verify/expected-catalog.sql

:r ./10_seed/verify/catalog.sql

:r ./10_seed/seed_demo_dynamic/060_showtimes.sql

-- Chốt các thay đổi của transaction.
COMMIT TRANSACTION;
EXEC sys.sp_set_session_context @key = N'CinemaSeedSkip',
    @value = NULL;
EXEC sys.sp_set_session_context @key = N'CinemaSeedDay',
    @value = NULL;
PRINT 'PASS v2 base/dynamic catalog; no legacy sentinel';

GO

:r ./10_seed/seed_demo_dynamic/070_transactions.sql

EXEC sys.sp_set_session_context @key = N'SeedV2Profile',
    @value = NULL;

GO
