/* Main PK/UNIQUE/FK DML verification. Every case runs in a transaction and rolls back. */
USE [CinemaBookingDB];
GO
SET NOCOUNT ON;
SET XACT_ABORT OFF;
IF @@SERVERNAME<>N'DoanTuanIT' OR DB_NAME()<>N'CinemaBookingDB'
  THROW 51200,'Wrong SQL Server or database; expected DoanTuanIT/CinemaBookingDB.',1;
IF DATABASEPROPERTYEX(DB_NAME(),'Status')<>N'ONLINE' THROW 51201,'Main database is not ONLINE.',1;

DECLARE @Results table(ObjectType varchar(8),ConstraintName sysname,Expected nvarchar(60),ActualError int,ActualMessage nvarchar(2048),Verdict varchar(8));
DECLARE @Kind varchar(8),@Constraint sysname,@ObjectId int,@IndexId int,@Schema sysname,@Table sysname,@TableQ nvarchar(300),@Identity sysname;
DECLARE @Columns nvarchar(max),@Exprs nvarchar(max),@Sql nvarchar(max),@JoinPk nvarchar(max),@PkDiff nvarchar(max),@KeyDiff nvarchar(max),@SetKeys nvarchar(max);
DECLARE @Error int,@Message nvarchar(2048),@AuditId int=-2000000000;

/* Duplicate every installed primary key by copying one existing valid row. */
DECLARE keycur CURSOR LOCAL FAST_FORWARD FOR
 SELECT kc.name,kc.parent_object_id,kc.unique_index_id,s.name,t.name
 FROM sys.key_constraints kc JOIN sys.tables t ON t.object_id=kc.parent_object_id JOIN sys.schemas s ON s.schema_id=t.schema_id
 WHERE kc.type='PK' ORDER BY s.name,t.name,kc.name;
OPEN keycur; FETCH NEXT FROM keycur INTO @Constraint,@ObjectId,@IndexId,@Schema,@Table;
WHILE @@FETCH_STATUS=0 BEGIN
 SET @Error=0;SET @Message=NULL;SET @TableQ=QUOTENAME(@Schema)+N'.'+QUOTENAME(@Table);SET @Identity=NULL;
 SELECT TOP(1) @Identity=name FROM sys.identity_columns WHERE object_id=@ObjectId;
 SELECT @Columns=STRING_AGG(QUOTENAME(c.name),N',') WITHIN GROUP(ORDER BY c.column_id)
 FROM sys.columns c WHERE c.object_id=@ObjectId AND c.is_computed=0 AND c.system_type_id<>189;
 IF @Table=N'sysdiagrams' AND NOT EXISTS(SELECT 1 FROM dbo.sysdiagrams) BEGIN
   SET @Error=51110;SET @Message=N'Support table has no existing source row; dedicated synthetic fixture follows.';
 END ELSE BEGIN
   SET @Sql=CASE WHEN @Identity IS NULL THEN N'' ELSE N'SET IDENTITY_INSERT '+@TableQ+N' ON; BEGIN TRY ' END
     +N'INSERT INTO '+@TableQ+N'('+@Columns+N') SELECT TOP(1) '+@Columns+N' FROM '+@TableQ+N' AS src;'
     +CASE WHEN @Identity IS NULL THEN N'' ELSE N' SET IDENTITY_INSERT '+@TableQ+N' OFF; END TRY BEGIN CATCH SET IDENTITY_INSERT '+@TableQ+N' OFF; THROW; END CATCH;' END;
   BEGIN TRAN;
   BEGIN TRY
     EXEC sys.sp_executesql @Sql;
     SET @Error=51111;SET @Message=N'Copied row did not hit a duplicate primary key.';
   END TRY BEGIN CATCH SET @Error=ERROR_NUMBER();SET @Message=ERROR_MESSAGE(); END CATCH;
   IF @@TRANCOUNT>0 ROLLBACK;
 END;
 IF @Table<>N'sysdiagrams' INSERT @Results VALUES('PK',@Constraint,N'2627 + exact name',@Error,@Message,
   IIF(@Error=2627 AND CHARINDEX(@Constraint,COALESCE(@Message,N''))>0,'PASS',IIF(@Error=51110,'BLOCKED','FAIL')));
 FETCH NEXT FROM keycur INTO @Constraint,@ObjectId,@IndexId,@Schema,@Table;
END;CLOSE keycur;DEALLOCATE keycur;

/* Test the two empty SQL Diagram support-table keys with negative explicit IDs. */
IF OBJECT_ID(N'dbo.sysdiagrams',N'U') IS NOT NULL BEGIN
 DECLARE @DiagramId int=-2000000000-ABS(CHECKSUM(NEWID())%100000000),@DiagramName sysname=CONCAT(N'AUDIT_',CONVERT(nvarchar(36),NEWID())),@Principal int=DATABASE_PRINCIPAL_ID(N'dbo');
 SET @Error=0;SET @Message=NULL;BEGIN TRAN;
 BEGIN TRY SET IDENTITY_INSERT dbo.sysdiagrams ON;
   INSERT dbo.sysdiagrams(diagram_id,name,principal_id,version,definition) VALUES(@DiagramId,@DiagramName,@Principal,1,0x01);
   INSERT dbo.sysdiagrams(diagram_id,name,principal_id,version,definition) VALUES(@DiagramId,CONCAT(@DiagramName,N'_other'),@Principal,1,0x01);
   SET @Error=51111;SET @Message=N'Duplicate diagram_id unexpectedly succeeded.';
 END TRY BEGIN CATCH SET @Error=ERROR_NUMBER();SET @Message=ERROR_MESSAGE();END CATCH;
 BEGIN TRY SET IDENTITY_INSERT dbo.sysdiagrams OFF;END TRY BEGIN CATCH END CATCH;
 IF @@TRANCOUNT>0 ROLLBACK;
 INSERT @Results VALUES('PK',N'PK__sysdiagr__C2B05B616F48F256',N'2627 + exact name',@Error,@Message,IIF(@Error=2627 AND CHARINDEX(N'PK__sysdiagr__C2B05B616F48F256',COALESCE(@Message,N''))>0,'PASS','FAIL'));

 SET @Error=0;SET @Message=NULL;BEGIN TRAN;
 BEGIN TRY SET IDENTITY_INSERT dbo.sysdiagrams ON;
   INSERT dbo.sysdiagrams(diagram_id,name,principal_id,version,definition) VALUES(@DiagramId-1,@DiagramName,@Principal,1,0x01);
   INSERT dbo.sysdiagrams(diagram_id,name,principal_id,version,definition) VALUES(@DiagramId-2,@DiagramName,@Principal,2,0x02);
   SET @Error=51112;SET @Message=N'Duplicate diagram owner/name unexpectedly succeeded.';
 END TRY BEGIN CATCH SET @Error=ERROR_NUMBER();SET @Message=ERROR_MESSAGE();END CATCH;
 BEGIN TRY SET IDENTITY_INSERT dbo.sysdiagrams OFF;END TRY BEGIN CATCH END CATCH;
 IF @@TRANCOUNT>0 ROLLBACK;
 INSERT @Results VALUES('UQ',N'UK_principal_name',N'2627 + exact name',@Error,@Message,IIF(@Error=2627 AND CHARINDEX(N'UK_principal_name',COALESCE(@Message,N''))>0,'PASS','FAIL'));
END;

/* Every application UNIQUE constraint: update a valid row to another row's key. */
DECLARE uqcur CURSOR LOCAL FAST_FORWARD FOR
 SELECT kc.name,kc.parent_object_id,kc.unique_index_id,s.name,t.name
 FROM sys.key_constraints kc JOIN sys.tables t ON t.object_id=kc.parent_object_id JOIN sys.schemas s ON s.schema_id=t.schema_id
 WHERE kc.type='UQ' AND t.name<>N'sysdiagrams' ORDER BY s.name,t.name,kc.name;
OPEN uqcur;FETCH NEXT FROM uqcur INTO @Constraint,@ObjectId,@IndexId,@Schema,@Table;
WHILE @@FETCH_STATUS=0 BEGIN
 SET @Error=0;SET @Message=NULL;SET @TableQ=QUOTENAME(@Schema)+N'.'+QUOTENAME(@Table);
 SELECT @JoinPk=STRING_AGG(N't.'+QUOTENAME(c.name)+N'=p.'+QUOTENAME(CONCAT(N'd',ic.key_ordinal)),N' AND ') WITHIN GROUP(ORDER BY ic.key_ordinal)
 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
 WHERE ic.object_id=@ObjectId AND ic.index_id=(SELECT unique_index_id FROM sys.key_constraints WHERE name=@Constraint AND parent_object_id=@ObjectId) AND ic.key_ordinal>0
   AND EXISTS(SELECT 1 FROM sys.key_constraints pk WHERE pk.parent_object_id=@ObjectId AND pk.type='PK' AND pk.unique_index_id=ic.index_id);
 /* Resolve the actual PK columns separately; the key is always a table-level PK. */
 SELECT @JoinPk=STRING_AGG(N't.'+QUOTENAME(c.name)+N'=p.'+QUOTENAME(CONCAT(N'd',ic.key_ordinal)),N' AND ') WITHIN GROUP(ORDER BY ic.key_ordinal)
 FROM sys.key_constraints pk JOIN sys.index_columns ic ON ic.object_id=pk.parent_object_id AND ic.index_id=pk.unique_index_id
 JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
 WHERE pk.parent_object_id=@ObjectId AND pk.type='PK' AND ic.key_ordinal>0;
 SELECT @PkDiff=STRING_AGG(N'a.'+QUOTENAME(c.name)+N'<>b.'+QUOTENAME(c.name),N' OR ') WITHIN GROUP(ORDER BY ic.key_ordinal)
 FROM sys.key_constraints pk JOIN sys.index_columns ic ON ic.object_id=pk.parent_object_id AND ic.index_id=pk.unique_index_id
 JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE pk.parent_object_id=@ObjectId AND pk.type='PK' AND ic.key_ordinal>0;
 SELECT @KeyDiff=STRING_AGG(N'(a.'+QUOTENAME(c.name)+N'<>b.'+QUOTENAME(c.name)+N' OR a.'+QUOTENAME(c.name)+N' IS NULL AND b.'+QUOTENAME(c.name)+N' IS NOT NULL OR a.'+QUOTENAME(c.name)+N' IS NOT NULL AND b.'+QUOTENAME(c.name)+N' IS NULL)',N' OR ') WITHIN GROUP(ORDER BY ic.key_ordinal),
        @SetKeys=STRING_AGG(QUOTENAME(c.name)+N'=p.'+QUOTENAME(CONCAT(N's',ic.key_ordinal)),N',') WITHIN GROUP(ORDER BY ic.key_ordinal)
 FROM sys.key_constraints uq JOIN sys.index_columns ic ON ic.object_id=uq.parent_object_id AND ic.index_id=uq.unique_index_id
 JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE uq.parent_object_id=@ObjectId AND uq.name=@Constraint AND ic.key_ordinal>0;
 DECLARE @PairSelect nvarchar(max),@PairSql nvarchar(max),@PairCols nvarchar(max),@PairPk nvarchar(max),@PairUk nvarchar(max);
 SELECT @PairPk=STRING_AGG(N'a.'+QUOTENAME(c.name)+N' AS '+QUOTENAME(CONCAT(N'd',ic.key_ordinal)),N',') WITHIN GROUP(ORDER BY ic.key_ordinal)
 FROM sys.key_constraints pk JOIN sys.index_columns ic ON ic.object_id=pk.parent_object_id AND ic.index_id=pk.unique_index_id
 JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE pk.parent_object_id=@ObjectId AND pk.type='PK' AND ic.key_ordinal>0;
 SELECT @PairUk=STRING_AGG(N'b.'+QUOTENAME(c.name)+N' AS '+QUOTENAME(CONCAT(N's',ic.key_ordinal)),N',') WITHIN GROUP(ORDER BY ic.key_ordinal)
 FROM sys.key_constraints uq JOIN sys.index_columns ic ON ic.object_id=uq.parent_object_id AND ic.index_id=uq.unique_index_id
 JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE uq.parent_object_id=@ObjectId AND uq.name=@Constraint AND ic.key_ordinal>0;
 SET @PairCols=CONCAT(@PairPk,N',',@PairUk);
 SET @PairSelect=N';WITH p AS(SELECT TOP(1) '+@PairCols+N' FROM '+@TableQ+N' a CROSS JOIN '+@TableQ+N' b WHERE ('+COALESCE(@PkDiff,N'1=0')+N') AND ('+COALESCE(@KeyDiff,N'1=0')+N')) UPDATE t SET '+COALESCE(@SetKeys,N'')+N' FROM '+@TableQ+N' t JOIN p ON '+COALESCE(@JoinPk,N'1=0')+N'; IF @@ROWCOUNT<>1 THROW 51113,''No distinct source pair for unique key test.'',1;';
 BEGIN TRAN;
 BEGIN TRY EXEC sys.sp_executesql @PairSelect;SET @Error=51114;SET @Message=N'Unique key duplicate unexpectedly succeeded.';END TRY
 BEGIN CATCH SET @Error=ERROR_NUMBER();SET @Message=ERROR_MESSAGE();END CATCH;
 IF @@TRANCOUNT>0 ROLLBACK;
 INSERT @Results VALUES('UQ',@Constraint,N'2601/2627 + exact name',@Error,@Message,IIF(@Error IN(2601,2627) AND CHARINDEX(@Constraint,COALESCE(@Message,N''))>0,'PASS',IIF(@Error=51113,'BLOCKED','FAIL')));
 FETCH NEXT FROM uqcur INTO @Constraint,@ObjectId,@IndexId,@Schema,@Table;
END;CLOSE uqcur;DEALLOCATE uqcur;

/* Every foreign key: clone a source row but replace its FK value with a missing integer key. */
DECLARE fkcur CURSOR LOCAL FAST_FORWARD FOR
 SELECT fk.name,fk.parent_object_id,fk.referenced_object_id,fkc.parent_column_id,s.name,t.name
 FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id
 JOIN sys.tables t ON t.object_id=fk.parent_object_id JOIN sys.schemas s ON s.schema_id=t.schema_id
 ORDER BY s.name,t.name,fk.name;
DECLARE @RefObject int,@FkColumnId int,@FkColumn sysname,@RefTableQ nvarchar(300),@TargetColumn sysname;
OPEN fkcur;FETCH NEXT FROM fkcur INTO @Constraint,@ObjectId,@RefObject,@FkColumnId,@Schema,@Table;
WHILE @@FETCH_STATUS=0 BEGIN
 SET @Error=0;SET @Message=NULL;SET @TableQ=QUOTENAME(@Schema)+N'.'+QUOTENAME(@Table);SET @Identity=NULL;
 SELECT @FkColumn=name FROM sys.columns WHERE object_id=@ObjectId AND column_id=@FkColumnId;
 SELECT @TargetColumn=rc.name FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id
 JOIN sys.columns rc ON rc.object_id=fk.referenced_object_id AND rc.column_id=fkc.referenced_column_id WHERE fk.name=@Constraint AND fk.parent_object_id=@ObjectId;
 SELECT @RefTableQ=QUOTENAME(OBJECT_SCHEMA_NAME(@RefObject))+N'.'+QUOTENAME(OBJECT_NAME(@RefObject));
 SELECT TOP(1) @Identity=name FROM sys.identity_columns WHERE object_id=@ObjectId;
 SELECT @Columns=STRING_AGG(QUOTENAME(c.name),N',') WITHIN GROUP(ORDER BY c.column_id),
 @Exprs=STRING_AGG(CASE
   WHEN c.is_identity=1 THEN N'@AuditId'
   WHEN c.column_id=@FkColumnId THEN N'CONVERT(int,-2147483647)'
   WHEN @Table=N'THANHTOAN' AND c.name=N'MaGiaoDich' THEN N'CONCAT(''AUDIT-'',CONVERT(varchar(36),NEWID()))'
   WHEN @Table=N'YEUCAU_CHUYENCAP' AND c.name=N'KhieuNaiID' THEN N'(SELECT TOP(1) k.KhieuNaiID FROM dbo.KHIEUNAI k WHERE NOT EXISTS(SELECT 1 FROM dbo.YEUCAU_CHUYENCAP y WHERE y.KhieuNaiID=k.KhieuNaiID AND y.TrangThai IN(N''Chờ tiếp nhận'',N''Đang xử lý'')) ORDER BY k.KhieuNaiID)'
   WHEN @Table=N'CHITIETVE' AND c.name=N'MaVe' THEN N'CONCAT(''AUDIT-'',CONVERT(varchar(36),NEWID()))'
   WHEN @Table=N'NGUOIDUNG' AND c.name=N'Email' THEN N'CONCAT(''audit.'',CONVERT(varchar(36),NEWID()),''@invalid.example'')'
   ELSE N's.'+QUOTENAME(c.name) END,N',') WITHIN GROUP(ORDER BY c.column_id)
 FROM sys.columns c WHERE c.object_id=@ObjectId AND c.is_computed=0 AND c.system_type_id<>189;
 SELECT TOP(1) @Kind=CASE WHEN system_type_id IN(48,52,56,127) THEN 'INT' ELSE 'OTHER' END
 FROM sys.columns WHERE object_id=@ObjectId AND column_id=@FkColumnId;
 IF @Kind<>'INT' BEGIN SET @Error=51115;SET @Message=N'FK type not covered by integer sentinel.';END
 ELSE IF NOT EXISTS(SELECT 1 FROM sys.tables WHERE object_id=@ObjectId) BEGIN SET @Error=51116;SET @Message=N'Child table is not a user table.';END
 ELSE BEGIN
   SET @Sql=CASE WHEN @Identity IS NULL THEN N'' ELSE N'SET IDENTITY_INSERT '+@TableQ+N' ON; BEGIN TRY ' END
     +N'INSERT INTO '+@TableQ+N'('+@Columns+N') SELECT TOP(1) '+@Exprs+N' FROM '+@TableQ+N' AS s;'
     +CASE WHEN @Identity IS NULL THEN N'' ELSE N' SET IDENTITY_INSERT '+@TableQ+N' OFF; END TRY BEGIN CATCH SET IDENTITY_INSERT '+@TableQ+N' OFF; THROW; END CATCH;' END;
   BEGIN TRAN;
   BEGIN TRY
     EXEC sys.sp_executesql @Sql,N'@AuditId int',@AuditId=@AuditId;
     SET @Error=51117;SET @Message=N'Invalid foreign key unexpectedly succeeded.';
   END TRY BEGIN CATCH SET @Error=ERROR_NUMBER();SET @Message=ERROR_MESSAGE();END CATCH;
   IF @@TRANCOUNT>0 ROLLBACK;
 END;
 INSERT @Results VALUES('FK',@Constraint,N'547 + exact name',@Error,@Message,IIF(@Error=547 AND CHARINDEX(@Constraint,COALESCE(@Message,N''))>0,'PASS',IIF(@Error IN(51115,51116),'BLOCKED','FAIL')));
 SET @AuditId+=1;
 FETCH NEXT FROM fkcur INTO @Constraint,@ObjectId,@RefObject,@FkColumnId,@Schema,@Table;
END;CLOSE fkcur;DEALLOCATE fkcur;

SELECT ObjectType,ConstraintName,Expected,ActualError,ActualMessage,Verdict FROM @Results ORDER BY ObjectType,ConstraintName;
