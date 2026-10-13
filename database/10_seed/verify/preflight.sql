-- Chuẩn bị hoặc kiểm tra dữ liệu seed theo target đã xác nhận.
-- Read-only. Actual target, UTC/business clock, schema, row counts, dependencies and active writers.
SET NOCOUNT ON;
SELECT
    CONVERT(nvarchar(128), SERVERPROPERTY('ServerName')) ServerName,
    DB_NAME() DatabaseName,
    dbo.fn_BayGio() UtcNow,
    dbo.fn_NgayKinhDoanh(dbo.fn_BayGio()) BusinessDay,
    (
        SELECT
            COUNT(*)
        FROM
            sys.tables
        WHERE
            is_ms_shipped = 0
    ) Tables,
    (
        SELECT
            COUNT(*)
        FROM
            sys.sql_modules
    ) Modules;
SELECT
    t.name TableName,
    SUM(p.rows) RowsAffected
FROM
    sys.tables t
    JOIN sys.partitions p ON p.object_id = t.object_id
    AND p.index_id IN (0, 1)
GROUP BY
    t.name
ORDER BY
    t.name;
SELECT
    name,
    OBJECT_NAME(parent_object_id) ChildTable,
    OBJECT_NAME(referenced_object_id) ParentTable,
    is_disabled,
    is_not_trusted
FROM
    sys.foreign_keys
ORDER BY
    name;
SELECT
    s.session_id,
    s.program_name,
    s.host_name,
    r.command,
    r.status,
    r.database_id
FROM
    sys.dm_exec_sessions s
    LEFT JOIN sys.dm_exec_requests r ON r.session_id = s.session_id
WHERE
    s.session_id <> @@SPID
    AND (
        s.database_id = DB_ID()
        OR r.database_id = DB_ID()
    );

GO
