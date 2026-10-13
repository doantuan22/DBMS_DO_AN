-- Chuẩn bị hoặc kiểm tra dữ liệu seed theo target đã xác nhận.
-- Backup path is supplied only by the offline CLI from the verified SQL default backup directory.
BACKUP
DATABASE [$(TargetDatabase)] TO DISK = N'$(BackupPath)'
WITH
    COPY_ONLY,
    CHECKSUM,
    INIT;
RESTORE VERIFYONLY
FROM
    DISK = N'$(BackupPath)'
WITH
    CHECKSUM;

GO
