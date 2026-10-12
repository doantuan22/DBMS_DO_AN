-- Hashes only. Never export user rows/passwords or PII. Deterministic PK ordering.
SET NOCOUNT ON;
CREATE TABLE #Hashes(TableName sysname,Rows bigint,Sha256 varchar(64));
DECLARE @Table sysname,@Keys nvarchar(max),@SQL nvarchar(max);
DECLARE tables CURSOR LOCAL FAST_FORWARD FOR SELECT name FROM sys.tables WHERE is_ms_shipped=0 ORDER BY name;
OPEN tables;FETCH NEXT FROM tables INTO @Table;
WHILE @@FETCH_STATUS=0 BEGIN
 SELECT @Keys=STRING_AGG(CONVERT(nvarchar(max),QUOTENAME(c.name)),N',') WITHIN GROUP(ORDER BY ic.key_ordinal)
 FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
 WHERE i.object_id=OBJECT_ID(N'dbo.'+QUOTENAME(@Table)) AND i.is_primary_key=1 AND ic.key_ordinal>0;
 IF @Keys IS NULL THROW 51100,'Snapshot requires primary keys.',1;
 SET @SQL=N'INSERT #Hashes SELECT @Name,COUNT_BIG(*),CONVERT(varchar(64),HASHBYTES(''SHA2_256'',(SELECT * FROM dbo.'+QUOTENAME(@Table)+N' ORDER BY '+@Keys+N' FOR JSON PATH,INCLUDE_NULL_VALUES)),2) FROM dbo.'+QUOTENAME(@Table)+N';';
 EXEC sys.sp_executesql @SQL,N'@Name sysname',@Name=@Table;
 FETCH NEXT FROM tables INTO @Table;
END;
CLOSE tables;DEALLOCATE tables;
-- Optional deployment guard compares full data under exclusive access, before backup/restore.
IF OBJECT_ID(N'tempdb..#PromotionExpectedSnapshot') IS NOT NULL
BEGIN
 DECLARE @ExpectedSnapshot nvarchar(max)=(SELECT Snapshot FROM #PromotionExpectedSnapshot WHERE DatabaseName=DB_NAME());
 IF @ExpectedSnapshot IS NULL THROW 51110,'Missing reviewed snapshot.',1;
 IF EXISTS(SELECT TableName,Rows,Sha256 FROM #Hashes EXCEPT SELECT TableName,Rows,Sha256 FROM OPENJSON(@ExpectedSnapshot) WITH(TableName sysname,Rows bigint,Sha256 varchar(64)))
 OR EXISTS(SELECT TableName,Rows,Sha256 FROM OPENJSON(@ExpectedSnapshot) WITH(TableName sysname,Rows bigint,Sha256 varchar(64)) EXCEPT SELECT TableName,Rows,Sha256 FROM #Hashes)
 THROW 51110,'Data changed since reviewed preflight; refuse promotion.',1;
END;
SELECT (SELECT TableName,Rows,Sha256 FROM #Hashes ORDER BY TableName FOR JSON PATH) Result;
DROP TABLE #Hashes;
GO

