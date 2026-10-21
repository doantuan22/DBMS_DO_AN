/*
===============================================================================
SUITE       : CinemaBookingDB SSMS verification
TEST ID     : PRECHECK-001
LOẠI        : Kiểm kê chỉ đọc và xác nhận database đích
MỤC ĐÍCH    : Xác nhận đúng Main database và phiên bản schema trước khi demo.
AN TOÀN     : Chỉ đọc metadata; không DML/DDL, không mở transaction.
===============================================================================
*/
USE [CinemaBookingDB];
GO
SET NOCOUNT ON;

IF @@SERVERNAME <> N'DoanTuanIT' OR DB_NAME() <> N'CinemaBookingDB'
    THROW 51500, N'Sai SQL Server/Database. Yêu cầu DoanTuanIT / CinemaBookingDB.', 1;
IF CONVERT(nvarchar(30), DATABASEPROPERTYEX(DB_NAME(), N'Status')) <> N'ONLINE'
    THROW 51501, N'CinemaBookingDB khong ONLINE.', 1;
IF @@TRANCOUNT <> 0
    THROW 51502, N'Hãy đóng transaction đang mở trong query window này trước khi chạy.', 1;

DECLARE @Actual table
(
    ObjectType nvarchar(40) NOT NULL,
    ObjectCount int NOT NULL,
    ExpectedCount int NOT NULL
);

INSERT @Actual(ObjectType, ObjectCount, ExpectedCount)
SELECT N'Table', COUNT(*), 29 FROM sys.tables
WHERE is_ms_shipped = 0 AND name <> N'sysdiagrams'
UNION ALL
SELECT N'Stored Procedure', COUNT(*), 147 FROM sys.procedures
WHERE is_ms_shipped = 0 AND name NOT IN
    (N'sp_alterdiagram',N'sp_creatediagram',N'sp_dropdiagram',N'sp_helpdiagramdefinition',
     N'sp_helpdiagrams',N'sp_renamediagram',N'sp_upgraddiagrams')
UNION ALL
SELECT N'View', COUNT(*), 6 FROM sys.views WHERE is_ms_shipped = 0
UNION ALL
SELECT N'Function', COUNT(*), 21 FROM sys.objects
WHERE type IN ('FN','IF','TF') AND is_ms_shipped = 0 AND name <> N'fn_diagramobjects'
UNION ALL
SELECT N'Trigger', COUNT(*), 9 FROM sys.triggers WHERE is_ms_shipped = 0
UNION ALL
SELECT N'Primary Key', COUNT(*), 29 FROM sys.key_constraints kc
JOIN sys.tables t ON t.object_id=kc.parent_object_id
WHERE kc.type='PK' AND t.name<>N'sysdiagrams'
UNION ALL
SELECT N'Unique Constraint', COUNT(*), 11 FROM sys.key_constraints kc
JOIN sys.tables t ON t.object_id=kc.parent_object_id
WHERE kc.type='UQ' AND t.name<>N'sysdiagrams'
UNION ALL
SELECT N'Foreign Key', COUNT(*), 37 FROM sys.foreign_keys fk
JOIN sys.tables t ON t.object_id=fk.parent_object_id
WHERE t.name<>N'sysdiagrams'
UNION ALL
SELECT N'Check Constraint', COUNT(*), 65 FROM sys.check_constraints cc
JOIN sys.tables t ON t.object_id=cc.parent_object_id
WHERE t.name<>N'sysdiagrams'
UNION ALL
SELECT N'Index', COUNT(*), 71 FROM sys.indexes i
JOIN sys.tables t ON t.object_id=i.object_id
WHERE i.index_id>0 AND t.name<>N'sysdiagrams'
UNION ALL
SELECT N'Default Constraint', COUNT(*), 42 FROM sys.default_constraints dc
JOIN sys.tables t ON t.object_id=dc.parent_object_id
WHERE t.name<>N'sysdiagrams';

SELECT @@SERVERNAME AS ServerName, DB_NAME() AS DatabaseName,
       CONVERT(nvarchar(30), DATABASEPROPERTYEX(DB_NAME(), N'Status')) AS DatabaseState,
       d.is_read_committed_snapshot_on AS RCSI,
       @@TRANCOUNT AS OpenTransactions
FROM sys.databases AS d WHERE d.database_id=DB_ID();

SELECT ObjectType, ExpectedCount, ObjectCount AS ActualCount,
       CASE WHEN ObjectCount=ExpectedCount THEN N'PASS' ELSE N'FAIL' END AS Verdict
FROM @Actual ORDER BY CASE ObjectType
    WHEN N'Table' THEN 1 WHEN N'Stored Procedure' THEN 2 WHEN N'View' THEN 3
    WHEN N'Function' THEN 4 WHEN N'Trigger' THEN 5 WHEN N'Primary Key' THEN 6
    WHEN N'Unique Constraint' THEN 7 WHEN N'Foreign Key' THEN 8
    WHEN N'Check Constraint' THEN 9 WHEN N'Index' THEN 10 ELSE 11 END;

IF EXISTS (SELECT 1 FROM @Actual WHERE ObjectCount<>ExpectedCount)
    THROW 51503, N'Inventory khác baseline. Dừng lại và đối chiếu OBJECT_TEST_MAP.csv.', 1;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1)
   OR EXISTS (SELECT 1 FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1)
   OR EXISTS (SELECT 1 FROM sys.triggers WHERE is_disabled=1)
   OR EXISTS (SELECT 1 FROM sys.indexes i JOIN sys.tables t ON t.object_id=i.object_id
              WHERE i.index_id>0 AND i.is_disabled=1 AND t.name<>N'sysdiagrams')
    THROW 51504, N'Có constraint/trigger/index bị disable hoặc untrusted.', 1;

PRINT N'PASS PRECHECK-001: đúng Main, inventory và trạng thái metadata đúng baseline.';
GO
