/*
===============================================================================
SUITE       : CinemaBookingDB SSMS verification
TEST ID     : FINAL-001
LOẠI        : Kiểm tra toàn vẹn cuối cùng, chỉ đọc
MỤC ĐÍCH    : Xác nhận database online, session không còn transaction,
              fixture concurrency đã cleanup và DBCC không có vi phạm.
===============================================================================
*/
USE [CinemaBookingDB];
GO
SET NOCOUNT ON;

IF @@SERVERNAME <> N'DoanTuanIT' OR DB_NAME() <> N'CinemaBookingDB'
    THROW 51510, N'Sai SQL Server/Database. Yêu cầu DoanTuanIT / CinemaBookingDB.', 1;
IF @@TRANCOUNT <> 0
    THROW 51511, N'Query window này còn transaction đang mở; rollback trước.', 1;

SELECT @@SERVERNAME AS ServerName, DB_NAME() AS DatabaseName,
       CONVERT(nvarchar(30), DATABASEPROPERTYEX(DB_NAME(), N'Status')) AS DatabaseState,
       @@TRANCOUNT AS OpenTransactions;

IF DATABASEPROPERTYEX(DB_NAME(), N'Status') <> N'ONLINE'
    THROW 51512, N'Database khong ONLINE.', 1;

SELECT SuatChieuID, PhongID, ThoiGianBatDau, ThoiGianKetThuc
FROM dbo.SUATCHIEU
WHERE SuatChieuID IN (-1900000123, -1900000124);
IF EXISTS (SELECT 1 FROM dbo.SUATCHIEU WHERE SuatChieuID IN (-1900000123, -1900000124))
    THROW 51513, N'Còn fixture của bài concurrency; chạy cleanup sau khi cả hai session kết thúc.', 1;

DBCC CHECKDB (N'CinemaBookingDB') WITH NO_INFOMSGS, ALL_ERRORMSGS;
CREATE TABLE #ConstraintViolations
(
    [Table] nvarchar(256) NULL,
    [Constraint] nvarchar(256) NULL,
    [Where] nvarchar(max) NULL
);
INSERT #ConstraintViolations([Table],[Constraint],[Where])
    EXEC(N'DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS, NO_INFOMSGS;');

DECLARE @ConstraintViolationCount int=(SELECT COUNT(*) FROM #ConstraintViolations);
SELECT N'Concurrency fixture absent' AS CheckName,
       CASE WHEN NOT EXISTS(SELECT 1 FROM dbo.SUATCHIEU WHERE SuatChieuID IN (-1900000123,-1900000124))
            THEN N'PASS' ELSE N'FAIL' END AS Verdict
UNION ALL
SELECT N'DBCC CHECKCONSTRAINTS',CASE WHEN @ConstraintViolationCount=0 THEN N'PASS' ELSE N'FAIL' END;
SELECT * FROM #ConstraintViolations;
IF @ConstraintViolationCount<>0
    THROW 51514, N'DBCC CHECKCONSTRAINTS tìm thấy vi phạm.', 1;

PRINT N'PASS cho fixture và CHECKCONSTRAINTS. DBCC CHECKDB cũng phải không trả error rows/messages trong output phía trên.';
GO
