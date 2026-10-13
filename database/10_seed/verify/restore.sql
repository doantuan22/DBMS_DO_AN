-- Chuẩn bị hoặc kiểm tra dữ liệu seed theo target đã xác nhận.
-- Offline manual recovery only. Never included in seed. Recheck server/GUID/files before use.
USE master;

GO

IF N'$(TargetDatabase)' NOT IN (
    N'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012',
    N'CinemaBookingDB_R0_REAL_MEDIA_TEST_20261012'
)
    THROW 51100, 'Refusing restore outside exact allowlist.', 1;
RESTORE VERIFYONLY
FROM
    DISK = N'$(BackupPath)'
WITH
    CHECKSUM;
RESTORE
DATABASE [$(TargetDatabase)]
FROM
    DISK = N'$(BackupPath)'
WITH
    REPLACE,
    CHECKSUM;

GO
