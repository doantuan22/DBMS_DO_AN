/*
===============================================================================
TEST ID       : DEFAULT-001
OBJECT        : Default constraints on application tables
LOẠI          : Constraint metadata / positive insert coverage reference
MỤC ĐÍCH      : Liệt kê toàn bộ DEFAULT constraint đang bật trên Main và xác
                nhận đủ 42 định nghĩa. File này không ghi dữ liệu.
KẾT QUẢ MONG ĐỢI: 42/42 tên, bảng, cột và biểu thức default được hiện ra.
AN TOÀN       : SELECT metadata only.
===============================================================================
*/
USE [CinemaBookingDB];
GO
SET NOCOUNT ON;

IF @@SERVERNAME<>N'DoanTuanIT' OR DB_NAME()<>N'CinemaBookingDB'
    THROW 51520,N'Sai SQL Server/Database; yêu cầu DoanTuanIT / CinemaBookingDB.',1;

DECLARE @Expected int=42;
DECLARE @Actual int;

SELECT dc.name AS ConstraintName,
       QUOTENAME(OBJECT_SCHEMA_NAME(dc.parent_object_id))+N'.'+QUOTENAME(OBJECT_NAME(dc.parent_object_id)) AS TableName,
       c.name AS ColumnName,
       dc.definition AS DefaultExpression,
       CASE WHEN dc.is_system_named=1 THEN N'System named' ELSE N'Named' END AS Naming
FROM sys.default_constraints dc
JOIN sys.tables t ON t.object_id=dc.parent_object_id
JOIN sys.columns c ON c.object_id=dc.parent_object_id AND c.column_id=dc.parent_column_id
WHERE t.is_ms_shipped=0 AND t.name<>N'sysdiagrams'
ORDER BY OBJECT_NAME(dc.parent_object_id),c.column_id;

SELECT @Actual=COUNT(*) FROM sys.default_constraints dc
JOIN sys.tables t ON t.object_id=dc.parent_object_id
WHERE t.is_ms_shipped=0 AND t.name<>N'sysdiagrams';

SELECT @Expected AS ExpectedCount,@Actual AS ActualCount,
       CASE WHEN @Actual=@Expected THEN N'PASS' ELSE N'FAIL' END AS Verdict;
IF @Actual<>@Expected THROW 51521,N'So luong DEFAULT constraint khac baseline 42.',1;
PRINT N'PASS DEFAULT-001: inventory 42 DEFAULT constraint. Gia tri default duoc xac nhan rieng trong cac luong INSERT thanh cong; file nay khong tao DML fixture.';
GO
