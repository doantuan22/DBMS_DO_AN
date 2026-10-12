-- Manual recovery after reviewing the recorded server, Main GUID and physical files.
-- Substitute the VERIFIED pre-promotion Main backup, never the demo backup.
USE master;
IF CONVERT(nvarchar(128),SERVERPROPERTY('ServerName'))<>N'$(ActualServer)' THROW 51110,'Wrong recovery server.',1;
IF NOT EXISTS(SELECT 1 FROM sys.database_recovery_status WHERE database_id=DB_ID(N'CinemaBookingDB') AND database_guid=N'$(CurrentMainGuid)') THROW 51110,'Wrong recovery database identity.',1;
IF EXISTS(SELECT 1 FROM sys.dm_exec_sessions WHERE is_user_process=1 AND session_id<>@@SPID AND database_id=DB_ID(N'CinemaBookingDB')) THROW 51110,'Close Main app connections before recovery.',1;
RESTORE VERIFYONLY FROM DISK=N'$(MainBackupPath)' WITH CHECKSUM;
BEGIN TRY
 ALTER DATABASE [CinemaBookingDB] SET SINGLE_USER WITH NO_WAIT;
 RESTORE DATABASE [CinemaBookingDB] FROM DISK=N'$(MainBackupPath)' WITH REPLACE,CHECKSUM,RECOVERY,
  MOVE N'$(MainDataLogical)' TO N'$(MainDataPath)',MOVE N'$(MainLogLogical)' TO N'$(MainLogPath)';
 ALTER DATABASE [CinemaBookingDB] SET MULTI_USER;
END TRY
BEGIN CATCH
 IF EXISTS(SELECT 1 FROM sys.databases WHERE name=N'CinemaBookingDB' AND state_desc=N'ONLINE') ALTER DATABASE [CinemaBookingDB] SET MULTI_USER;
 THROW;
END CATCH;
