SET NOCOUNT ON;
DECLARE @expected nvarchar(max) = N'[{"principalName":"db_executor","state_desc":"DENY","permission_name":"DELETE","class_desc":"SCHEMA","objectName":null,"schemaName":"dbo"},{"principalName":"db_executor","state_desc":"GRANT","permission_name":"EXECUTE","class_desc":"SCHEMA","objectName":null,"schemaName":"dbo"},{"principalName":"db_executor","state_desc":"DENY","permission_name":"INSERT","class_desc":"SCHEMA","objectName":null,"schemaName":"dbo"},{"principalName":"db_executor","state_desc":"DENY","permission_name":"SELECT","class_desc":"SCHEMA","objectName":null,"schemaName":"dbo"},{"principalName":"db_executor","state_desc":"DENY","permission_name":"UPDATE","class_desc":"SCHEMA","objectName":null,"schemaName":"dbo"}]';
SELECT [principalName] COLLATE DATABASE_DEFAULT AS [principalName],[state_desc] COLLATE DATABASE_DEFAULT AS [state_desc],[permission_name] COLLATE DATABASE_DEFAULT AS [permission_name],[class_desc] COLLATE DATABASE_DEFAULT AS [class_desc],[objectName] COLLATE DATABASE_DEFAULT AS [objectName],[schemaName] COLLATE DATABASE_DEFAULT AS [schemaName] INTO #Expected_executePermissions FROM OPENJSON(@expected) WITH ([principalName] nvarchar(4000) '$.principalName',[state_desc] nvarchar(4000) '$.state_desc',[permission_name] nvarchar(4000) '$.permission_name',[class_desc] nvarchar(4000) '$.class_desc',[objectName] nvarchar(4000) '$.objectName',[schemaName] nvarchar(4000) '$.schemaName');
SELECT [principalName] COLLATE DATABASE_DEFAULT AS [principalName],[state_desc] COLLATE DATABASE_DEFAULT AS [state_desc],[permission_name] COLLATE DATABASE_DEFAULT AS [permission_name],[class_desc] COLLATE DATABASE_DEFAULT AS [class_desc],[objectName] COLLATE DATABASE_DEFAULT AS [objectName],[schemaName] COLLATE DATABASE_DEFAULT AS [schemaName] INTO #Actual_executePermissions FROM (SELECT USER_NAME(grantee_principal_id) principalName,state_desc,permission_name,class_desc,OBJECT_NAME(CASE WHEN class=1 THEN major_id END) objectName,SCHEMA_NAME(CASE WHEN class=3 THEN major_id END) schemaName FROM sys.database_permissions WHERE USER_NAME(grantee_principal_id)='db_executor') actual;
IF EXISTS (SELECT * FROM #Expected_executePermissions EXCEPT SELECT * FROM #Actual_executePermissions) OR EXISTS (SELECT * FROM #Actual_executePermissions EXCEPT SELECT * FROM #Expected_executePermissions)
BEGIN
 SELECT 'Missing or changed' AS Difference,* FROM (SELECT * FROM #Expected_executePermissions EXCEPT SELECT * FROM #Actual_executePermissions) missing;
 SELECT 'Unexpected or changed' AS Difference,* FROM (SELECT * FROM #Actual_executePermissions EXCEPT SELECT * FROM #Expected_executePermissions) extra;
 THROW 51001, 'Verify executePermissions failed.', 1;
END;
DROP TABLE #Expected_executePermissions; DROP TABLE #Actual_executePermissions;
PRINT 'PASS executePermissions';
GO
IF NOT EXISTS(SELECT 1 FROM sys.database_principals WHERE name='db_executor' AND type='R') THROW 51006, 'Missing EXECUTE-only role.', 1;
IF SUSER_ID(N'CinemaAppUser') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM sys.database_role_members WHERE USER_NAME(role_principal_id)='db_executor' AND USER_NAME(member_principal_id)='CinemaAppUser') THROW 51006, 'Missing application role membership.', 1;
PRINT 'PASS production role permissions';
GO
