:on error exit
-- Canonical v2 entry. Connection must already select a guarded disposable target.
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() NOT IN (N'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012',N'CinemaBookingDB_R0_REAL_MEDIA_TEST_20261012') THROW 51100,'Seed refuses Main and non-allowlisted targets.',1;
IF SESSION_CONTEXT(N'SeedV2Target') IS NULL OR CONVERT(nvarchar(128),SESSION_CONTEXT(N'SeedV2Target'))<>DB_NAME() THROW 51100,'CLI preflight context required.',1;
DECLARE @Profile varchar(30)='$(SeedProfile)';
IF @Profile NOT IN ('base','demo-dynamic') THROW 51100,'Invalid seed profile.',1;
EXEC sys.sp_set_session_context @key=N'SeedV2Profile',@value=@Profile;
DECLARE @SeedDayV2 date=dbo.fn_NgayKinhDoanh(dbo.fn_BayGio());
EXEC sys.sp_set_session_context @key=N'CinemaSeedDay',@value=@SeedDayV2;
DECLARE @SkipV2 int=CASE WHEN EXISTS(SELECT 1 FROM dbo.VAITRO) THEN 1 ELSE 0 END;
IF @SkipV2=0 AND EXISTS(SELECT 1 FROM sys.tables t JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN(0,1) WHERE p.rows>0) THROW 51100,'Partial or foreign database; seed requires empty target.',1;
EXEC sys.sp_set_session_context @key=N'CinemaSeedSkip',@value=@SkipV2;
BEGIN TRANSACTION;
GO
:r ./10_seed/seed_base/001_reference.sql
:r ./10_seed/seed_base/002_reference.sql
:r ./10_seed/seed_base/003_reference.sql
DECLARE @Now datetime2=dbo.fn_BayGio(),@Day date=dbo.fn_NgayKinhDoanh(dbo.fn_BayGio());
DECLARE @BaseNew bit=CASE WHEN CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip'))=0 THEN 1 ELSE 0 END;
DECLARE @DynamicNew bit=CASE WHEN NOT EXISTS(SELECT 1 FROM dbo.SUATCHIEU) AND SESSION_CONTEXT(N'SeedV2Profile')=N'demo-dynamic' THEN 1 ELSE 0 END;
:r ./10_seed/seed_base/020_users.sql
:r ./10_seed/seed_base/030_cinemas.sql
:r ./10_seed/seed_base/040_movies.sql
:r ./10_seed/seed_base/050_commerce.sql
:r ./10_seed/verify/expected-catalog.sql
:r ./10_seed/verify/catalog.sql
:r ./10_seed/seed_demo_dynamic/060_showtimes.sql
COMMIT TRANSACTION;
EXEC sys.sp_set_session_context @key=N'CinemaSeedSkip',@value=NULL;
EXEC sys.sp_set_session_context @key=N'CinemaSeedDay',@value=NULL;
PRINT 'PASS v2 base/dynamic catalog; no legacy sentinel';
GO
:r ./10_seed/seed_demo_dynamic/070_transactions.sql
EXEC sys.sp_set_session_context @key=N'SeedV2Profile',@value=NULL;
GO
