IF EXISTS (SELECT 1 FROM sys.sql_expression_dependencies WHERE referenced_id IS NULL AND referenced_database_name IS NULL AND referenced_server_name IS NULL AND referenced_schema_name IS NOT NULL)
BEGIN
 SELECT OBJECT_NAME(referencing_id) AS ReferencingObject,referenced_schema_name,referenced_entity_name FROM sys.sql_expression_dependencies WHERE referenced_id IS NULL;
 THROW 51003, 'Unresolved local dependency.', 1;
END;
IF EXISTS(SELECT 1 FROM sys.sql_modules WHERE definition IS NULL) THROW 51003, 'Encrypted or unavailable module.', 1;
DECLARE @function nvarchar(517),@bound int;
DECLARE function_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT QUOTENAME(SCHEMA_NAME(schema_id))+'.'+QUOTENAME(name) FROM sys.objects WHERE type IN('FN','IF','TF') AND is_ms_shipped=0;
OPEN function_cursor;FETCH NEXT FROM function_cursor INTO @function;
WHILE @@FETCH_STATUS=0 BEGIN SELECT @bound=COUNT(*) FROM sys.dm_sql_referenced_entities(@function,'OBJECT'); FETCH NEXT FROM function_cursor INTO @function; END;
CLOSE function_cursor;DEALLOCATE function_cursor;
PRINT 'PASS dependencies and function bindings';
GO
