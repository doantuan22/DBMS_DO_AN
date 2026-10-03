:on error exit
USE CinemaBookingDB;
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @day date = TRY_CONVERT(date,N'$(SeedDate)',126);
IF @day IS NULL THROW 51004, 'SeedDate must be YYYY-MM-DD.', 1;
EXEC sys.sp_set_session_context @key=N'CinemaSeedDay',@value=@day;
DECLARE @skip int = CASE WHEN EXISTS(SELECT 1 FROM dbo.NGUOIDUNG WHERE Email='admin@cinemadb.vn') THEN 1 ELSE 0 END;
IF @skip=0 AND EXISTS(SELECT 1 FROM dbo.VAITRO) THROW 51004, 'Partial/nonempty reference data: reset before seed.', 1;
EXEC sys.sp_set_session_context @key=N'CinemaSeedSkip',@value=@skip;
BEGIN TRANSACTION;
GO
:r ./10_seed/001_reference.sql
:r ./10_seed/002_reference.sql
:r ./10_seed/003_reference.sql
:r ./10_seed/004_reference.sql
:r ./10_seed/005_reference.sql
:r ./10_seed/006_reference.sql
:r ./10_seed/007_reference.sql
:r ./10_seed/008_reference.sql
:r ./10_seed/009_reference.sql
:r ./10_seed/010_reference.sql
:r ./10_seed/011_reference.sql
:r ./10_seed/012_reference.sql
:r ./10_seed/013_reference.sql
:r ./10_seed/014_reference.sql
:r ./10_seed/015_reference.sql
:r ./10_seed/016_reference.sql
:r ./10_seed/017_cinema_images.sql
:r ./12_verify/verify_seed.sql
COMMIT TRANSACTION;
EXEC sys.sp_set_session_context @key=N'CinemaSeedSkip',@value=NULL;
EXEC sys.sp_set_session_context @key=N'CinemaSeedDay',@value=NULL;
PRINT 'PASS reference/demo seed (idempotent, no historical audit fixtures)';
GO
