-- Explicitly authorized local deployment. Exact source/destination; no wildcard/reset alias.
USE master;
:r ./deployments/seed-v2-main/identity.sql
IF EXISTS(SELECT 1 FROM sys.dm_exec_sessions WHERE is_user_process=1 AND session_id<>@@SPID AND database_id IN(DB_ID(N'CinemaBookingDB'),DB_ID(N'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012'))) THROW 51110,'Close Main/demo app connections before promotion.',1;
CREATE TABLE #PromotionExpectedSnapshot(DatabaseName sysname,Snapshot nvarchar(max));
INSERT #PromotionExpectedSnapshot VALUES(N'CinemaBookingDB',N'$(MainSnapshot)'),(N'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012',N'$(DemoSnapshot)');
BEGIN TRY
 -- NO_WAIT refuses connected applications; it never kills their transactions.
 ALTER DATABASE [CinemaBookingDB] SET SINGLE_USER WITH NO_WAIT;
 ALTER DATABASE [CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012] SET SINGLE_USER WITH NO_WAIT;
 USE [CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012];
 EXEC sys.sp_executesql N'$(SnapshotSQL)';
 BACKUP DATABASE [CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012] TO DISK=N'$(DemoBackupPath)' WITH COPY_ONLY,CHECKSUM,INIT;
 USE [CinemaBookingDB];
 EXEC sys.sp_executesql N'$(SnapshotSQL)';
 BACKUP DATABASE [CinemaBookingDB] TO DISK=N'$(MainBackupPath)' WITH COPY_ONLY,CHECKSUM,INIT;
 USE master;
 RESTORE VERIFYONLY FROM DISK=N'$(MainBackupPath)' WITH CHECKSUM;
 RESTORE VERIFYONLY FROM DISK=N'$(DemoBackupPath)' WITH CHECKSUM;
 -- Map only onto reviewed Main files. The demo MDF/LDF are never overwritten.
 RESTORE DATABASE [CinemaBookingDB] FROM DISK=N'$(DemoBackupPath)' WITH REPLACE,CHECKSUM,RECOVERY,
  MOVE N'$(DemoDataLogical)' TO N'$(MainDataPath)',MOVE N'$(DemoLogLogical)' TO N'$(MainLogPath)';
 ALTER DATABASE [CinemaBookingDB] SET MULTI_USER;
 ALTER DATABASE [CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012] SET MULTI_USER;
 PRINT 'PASS demo backup promoted to Main; both databases MULTI_USER';
END TRY
BEGIN CATCH
 USE master;
 IF EXISTS(SELECT 1 FROM sys.databases WHERE name=N'CinemaBookingDB' AND state_desc=N'ONLINE') ALTER DATABASE [CinemaBookingDB] SET MULTI_USER;
 IF EXISTS(SELECT 1 FROM sys.databases WHERE name=N'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012' AND state_desc=N'ONLINE') ALTER DATABASE [CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012] SET MULTI_USER;
 THROW;
END CATCH;
