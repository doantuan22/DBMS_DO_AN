-- Test the retained production role with an ephemeral database user; no server login/password.
SET NOCOUNT ON;
CREATE USER R0_PermissionProbe WITHOUT LOGIN;
ALTER ROLE db_executor ADD MEMBER R0_PermissionProbe;
GO
DECLARE @denied bit=0;
BEGIN TRY
 EXECUTE AS USER='R0_PermissionProbe';
 EXEC dbo.sp_System_HealthCheck;
 BEGIN TRY
  SELECT COUNT(*) AS ForbiddenDirectRead FROM dbo.NGUOIDUNG;
 END TRY
 BEGIN CATCH
  IF ERROR_NUMBER()=229 SET @denied=1; ELSE THROW;
 END CATCH;
 REVERT;
 DROP USER R0_PermissionProbe;
 IF @denied=0 THROW 51012, 'EXECUTE-only role allowed direct SELECT.', 1;
 PRINT 'PASS production role executes SP and denies direct table SELECT';
END TRY
BEGIN CATCH
 IF USER_NAME()='R0_PermissionProbe' REVERT;
 IF USER_ID('R0_PermissionProbe') IS NOT NULL DROP USER R0_PermissionProbe;
 THROW;
END CATCH;
GO
