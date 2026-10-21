/*
  SSMS concurrency demo, Session B.
  Run on a second independent SQL Server connection after Session A's hold script.
  This INSERT should block on the room application lock. While it is blocked,
  run the monitor query in connection C, then commit A. B should return error
  50001 and output PASS; it always rolls back its own transaction.
*/
USE [CinemaBookingDB];
GO
IF @@SERVERNAME<>N'DoanTuanIT' OR DB_NAME()<>N'CinemaBookingDB'
    THROW 51920,N'Wrong target; connect to DoanTuanIT/CinemaBookingDB.',1;
IF @@TRANCOUNT<>0 THROW 51921,N'Close any existing transaction first.',1;
SET NOCOUNT ON;
SET XACT_ABORT OFF;
DECLARE @FixtureShowA int=-1900000123;
DECLARE @FixtureShowB int=-1900000124;
DECLARE @Room int=(SELECT TOP(1) PhongID FROM dbo.PHONGCHIEU ORDER BY PhongID);
DECLARE @Movie int=(SELECT TOP(1) PhimID FROM dbo.PHIM ORDER BY PhimID);
DECLARE @Start datetime2(0)='2098-01-15T20:30:00'; -- Deliberate overlap with A.
DECLARE @End datetime2(0)='2098-01-15T22:00:00';
DECLARE @Error int=0,@Actual nvarchar(200)=N'not executed',@RowsA int=0,@RowsB int=0;
IF EXISTS(SELECT 1 FROM dbo.SUATCHIEU WHERE SuatChieuID=@FixtureShowB)
    THROW 51922,N'Session B fixture ID already exists. Choose a new pair in both scripts.',1;
-- Session A's fixture is deliberately uncommitted while it owns the room lock.
-- Under RCSI another session cannot read that row here; the trigger is the oracle.
-- If A is not holding the lock, B's insert will succeed and this script will
-- report FAIL, then roll its own fixture back.

BEGIN TRANSACTION;
BEGIN TRY
    SET IDENTITY_INSERT dbo.SUATCHIEU ON;
    INSERT dbo.SUATCHIEU(SuatChieuID,PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
    VALUES(@FixtureShowB,@Movie,@Room,@Start,@End,N'2D',1000,N'Mở bán');
    SET IDENTITY_INSERT dbo.SUATCHIEU OFF;
    SET @Error=51924; SET @Actual=N'Overlapping insert unexpectedly succeeded.';
END TRY
BEGIN CATCH
    SET @Error=ERROR_NUMBER(); SET @Actual=CONCAT(N'SQL error ',@Error,N': ',ERROR_MESSAGE());
    BEGIN TRY SET IDENTITY_INSERT dbo.SUATCHIEU OFF; END TRY BEGIN CATCH END CATCH;
END CATCH;
IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
SELECT @RowsA=COUNT(*) FROM dbo.SUATCHIEU WHERE SuatChieuID=@FixtureShowA;
SELECT @RowsB=COUNT(*) FROM dbo.SUATCHIEU WHERE SuatChieuID=@FixtureShowB;
SELECT N'concurrent overlap rejected after A committed' AS Test,
       N'error 50001; exactly A row remains; B row absent' AS Expected,
       @Actual AS Actual,@RowsA AS SessionARows,@RowsB AS SessionBRows,
       IIF(@Error=50001 AND @RowsA=1 AND @RowsB=0,'PASS','FAIL') AS Verdict;
