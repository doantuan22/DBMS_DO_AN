-- Chuẩn bị hoặc kiểm tra dữ liệu seed theo target đã xác nhận.
SET NOCOUNT ON;
SELECT
    (
        SELECT
            CONVERT(nvarchar(4000), SERVERPROPERTY('InstanceDefaultBackupPath')) BackupPath
        FOR JSON
            PATH
    ) Result;

GO
