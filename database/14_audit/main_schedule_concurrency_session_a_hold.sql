/*
  SSMS concurrency demo, Session A setup.
  Run in one query window on DoanTuanIT/CinemaBookingDB. Keep the session open.
  Then start main_schedule_concurrency_session_b.sql from a second connection.
  While B waits, run main_schedule_concurrency_monitor.sql in a third connection;
  then run main_schedule_concurrency_session_a_commit.sql in this same A window.

  The negative identity and far-future time are test fixtures. The script checks
  both keys and the exact schedule interval before writing. Cleanup is separate.
*/
USE [CinemaBookingDB];
GO
IF @@SERVERNAME<>N'DoanTuanIT' OR DB_NAME()<>N'CinemaBookingDB'
    THROW 51900,N'Wrong target; connect to DoanTuanIT/CinemaBookingDB.',1;
IF DATABASEPROPERTYEX(DB_NAME(),N'Status')<>N'ONLINE'
    THROW 51901,N'Main database is not ONLINE.',1;
IF @@TRANCOUNT<>0 THROW 51902,N'Close any existing transaction first.',1;
SET NOCOUNT ON;
SET XACT_ABORT OFF;

DECLARE @FixtureShowA int=-1900000123; -- Keep the same value in Session B and cleanup.
DECLARE @FixtureShowB int=-1900000124;
DECLARE @Room int=(SELECT TOP(1) PhongID FROM dbo.PHONGCHIEU ORDER BY PhongID);
DECLARE @Movie int=(SELECT TOP(1) PhimID FROM dbo.PHIM ORDER BY PhimID);
DECLARE @Start datetime2(0)='2098-01-15T20:00:00';
DECLARE @End datetime2(0)='2098-01-15T21:30:00';
IF @Room IS NULL OR @Movie IS NULL THROW 51903,N'No parent movie/room fixture is available.',1;
IF EXISTS(SELECT 1 FROM dbo.SUATCHIEU WHERE SuatChieuID IN(@FixtureShowA,@FixtureShowB))
    THROW 51904,N'Fixture showtime IDs already exist. Choose a new pair and update Session B/cleanup.',1;
IF EXISTS(SELECT 1 FROM dbo.SUATCHIEU WHERE PhongID=@Room AND TrangThai<>N'Đã hủy'
          AND ThoiGianBatDau<@End AND ThoiGianKetThuc>@Start)
    THROW 51905,N'Chosen test interval is occupied. Edit @Start/@End and both Session B values.',1;

BEGIN TRANSACTION;
BEGIN TRY
    SET IDENTITY_INSERT dbo.SUATCHIEU ON;
    INSERT dbo.SUATCHIEU(SuatChieuID,PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
    VALUES(@FixtureShowA,@Movie,@Room,@Start,@End,N'2D',1000,N'Mở bán');
    SET IDENTITY_INSERT dbo.SUATCHIEU OFF;
    SELECT N'READY: Session A owns the room application lock; leave this transaction open.' AS Actual,
           N'Insert succeeds and applock remains owned until A commits.' AS Expected,
           @FixtureShowA AS ShowtimeID,@Room AS RoomID,@Start AS StartsAt,@End AS EndsAt,
           @@SPID AS SessionA,@@TRANCOUNT AS OpenTransactions;
END TRY
BEGIN CATCH
    BEGIN TRY SET IDENTITY_INSERT dbo.SUATCHIEU OFF; END TRY BEGIN CATCH END CATCH;
    IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
