SET NOCOUNT ON;
IF DB_NAME() NOT IN (N'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012',N'CinemaBookingDB_R0_REAL_MEDIA_TEST_20261012')
 THROW 51100,'Seed v2 requires an exact allowlisted disposable target.',1;
IF CONVERT(nvarchar(128),SESSION_CONTEXT(N'SeedV2Target'))<>DB_NAME() OR SESSION_CONTEXT(N'SeedV2Target') IS NULL
 THROW 51100,'Explicit selected target context is required.',1;
IF EXISTS(SELECT 1 FROM sys.dm_exec_sessions WHERE session_id<>@@SPID AND database_id=DB_ID() AND is_user_process=1)
 THROW 51100,'Another user session is connected to target; stop writers before reset.',1;
IF EXISTS(SELECT 1 FROM dbo.NGUOIDUNG WHERE Email NOT IN ('admin1@example.test','admin2@example.test','manager1@example.test','manager2@example.test','support1@example.test','support2@example.test','customer1@example.test','customer2@example.test','customer3@example.test','customer4@example.test','customer5@example.test','customer6@example.test'))
 THROW 51100,'Unknown user provenance: do not delete. Create a new disposable target.',1;
IF (SELECT COUNT(*) FROM dbo.PHIM)<>18 OR (SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM WHERE TenRap LIKE N'CinemaStar Demo %')<>4
 THROW 51100,'Unknown catalog provenance: do not reset this target.',1;
IF EXISTS(SELECT 1 FROM dbo.DONDATVE d JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=d.NguoiDungID WHERE n.Email NOT IN ('customer1@example.test','customer2@example.test','customer3@example.test','customer4@example.test','customer5@example.test','customer6@example.test'))
 THROW 51100,'Unknown transaction owner provenance.',1;
-- CLI must also match its full external data fingerprint; email alone is never sufficient.
PRINT 'PASS exact target/provenance/writer SQL guard';
GO
