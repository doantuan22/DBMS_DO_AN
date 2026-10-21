/* Run only after the two-session race has returned; exact negative test IDs only. */
USE [CinemaBookingDB];
GO
IF @@SERVERNAME<>N'DoanTuanIT' OR DB_NAME()<>N'CinemaBookingDB'
    THROW 51940,N'Wrong target; connect to DoanTuanIT/CinemaBookingDB.',1;
IF @@TRANCOUNT<>0 THROW 51941,N'Close any existing transaction before fixture cleanup.',1;
DECLARE @A int=-1900000123,@B int=-1900000124;
IF EXISTS(SELECT 1 FROM dbo.SUATCHIEU WHERE SuatChieuID=@A
          AND NOT(ThoiGianBatDau='2098-01-15T20:00:00' AND ThoiGianKetThuc='2098-01-15T21:30:00'))
    THROW 51942,N'Refusing to delete Session A ID: row does not match the exact test interval.',1;
IF EXISTS(SELECT 1 FROM dbo.SUATCHIEU WHERE SuatChieuID=@B
          AND NOT(ThoiGianBatDau='2098-01-15T20:30:00' AND ThoiGianKetThuc='2098-01-15T22:00:00'))
    THROW 51943,N'Refusing to delete Session B ID: row does not match the exact test interval.',1;
BEGIN TRANSACTION;
DELETE dbo.SUATCHIEU WHERE SuatChieuID IN(@A,@B);
COMMIT TRANSACTION;
DECLARE @Remaining int=(SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE SuatChieuID IN(@A,@B));
DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS;
SELECT N'exact concurrency fixture cleanup' AS Test,
       N'no test rows remain; inspect DBCC CHECKCONSTRAINTS output for any findings' AS Expected,
       CONCAT(N'remaining fixture rows=',@Remaining) AS Actual,
       IIF(@Remaining=0,'PASS','FAIL') AS Verdict;
