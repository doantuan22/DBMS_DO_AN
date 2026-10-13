-- Kiểm tra target và thực hiện triển khai hoặc phục hồi đã xác nhận.
-- Offline deployment only. Every placeholder is supplied by reviewed preflight.
IF DB_NAME() <> N'master'
    THROW 51110, 'Main promotion must connect to master.', 1;
IF CONVERT(nvarchar(128), SERVERPROPERTY('ServerName')) <> N'$(ActualServer)'
    THROW 51110, 'Server changed.', 1;
IF NOT EXISTS (
    SELECT
        1
    FROM
        sys.databases d
        JOIN sys.database_recovery_status r ON r.database_id = d.database_id
    WHERE
        d.name = N'CinemaBookingDB'
        AND r.database_guid = N'$(MainGuid)'
        AND d.state_desc = N'ONLINE'
        AND d.is_read_only = 0
)
    THROW 51110, 'Main identity changed.', 1;
IF NOT EXISTS (
    SELECT
        1
    FROM
        sys.databases d
        JOIN sys.database_recovery_status r ON r.database_id = d.database_id
    WHERE
        d.name = N'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012'
        AND r.database_guid = N'$(DemoGuid)'
        AND d.state_desc = N'ONLINE'
        AND d.is_read_only = 0
)
    THROW 51110, 'Demo identity changed.', 1;
IF(
    SELECT
        COUNT(*)
    FROM
        sys.master_files
    WHERE
        database_id = DB_ID(N'CinemaBookingDB')
) <> 2
    THROW 51110, 'Unexpected Main file layout.', 1;
IF NOT EXISTS (
    SELECT
        1
    FROM
        sys.master_files
    WHERE
        database_id = DB_ID(N'CinemaBookingDB')
        AND
    type = 0
    AND physical_name = N'$(MainDataPath)'
)
    OR NOT EXISTS (
    SELECT
        1
    FROM
        sys.master_files
    WHERE
        database_id = DB_ID(N'CinemaBookingDB')
        AND
    type = 1
    AND physical_name = N'$(MainLogPath)'
)
    THROW 51110, 'Main paths changed.', 1;
IF EXISTS (
    SELECT
        1
    FROM
        sys.master_files a
        JOIN sys.master_files b ON a.physical_name = b.physical_name
    WHERE
        a.database_id = DB_ID(N'CinemaBookingDB')
        AND b.database_id = DB_ID(N'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012')
)
    THROW 51110, 'Source and destination share physical files.', 1;
