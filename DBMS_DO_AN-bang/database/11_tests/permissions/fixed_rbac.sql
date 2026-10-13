SET NOCOUNT ON;
-- Keep prefix fragments separate: legacy test runners substitute the canonical database name.
IF DB_NAME() NOT LIKE ('CinemaBooking' + 'DB_R0[_]%') AND DB_NAME() <> ('CinemaBooking' + 'DB_Test')
    THROW 51058, 'Fixed RBAC mutation tests require an isolated test database.', 1;
:r ./12_verify/verify_fixed_rbac.sql
DECLARE @BeforeRoles nvarchar(max)=(SELECT * FROM dbo.VAITRO ORDER BY VaiTroID FOR JSON PATH);
DECLARE @BeforePermissions nvarchar(max)=(SELECT * FROM dbo.QUYEN ORDER BY QuyenID FOR JSON PATH);
DECLARE @BeforeMatrix nvarchar(max)=(SELECT * FROM dbo.VAITRO_QUYEN ORDER BY VaiTroID,QuyenID FOR JSON PATH);
DECLARE @Cases TABLE(id int IDENTITY,command nvarchar(max));
INSERT INTO @Cases(command) VALUES
(N'EXEC dbo.sp_Admin_Role_Create @ActorID=1,@MaVaiTro=''FIXED_PROBE'',@TenVaiTro=N''Probe'';'),
(N'EXEC dbo.sp_Admin_Role_Update @ActorID=1,@VaiTroID=2,@TenVaiTro=N''Probe'';'),
(N'EXEC dbo.sp_Admin_Role_Delete @ActorID=1,@VaiTroID=2;'),
(N'EXEC dbo.sp_Admin_Permission_Create @ActorID=1,@MaQuyen=''FIXED_PROBE'',@TenQuyen=N''Probe'';'),
(N'EXEC dbo.sp_Admin_Permission_Update @ActorID=1,@QuyenID=1,@TenQuyen=N''Probe'';'),
(N'EXEC dbo.sp_Admin_Permission_Delete @ActorID=1,@QuyenID=1;'),
(N'EXEC dbo.sp_Admin_RolePermission_Set @ActorID=1,@VaiTroID=2,@QuyenIdList=''14,15,16'';');
DECLARE @n int=1,@command nvarchar(max),@denied bit;
WHILE @n<=7
BEGIN
    SELECT @command=command FROM @Cases WHERE id=@n;
    SET @denied=0;
    BEGIN TRY
        EXEC sys.sp_executesql @command;
    END TRY
    BEGIN CATCH
        IF ERROR_NUMBER()=50405 SET @denied=1; ELSE THROW;
    END CATCH;
    IF @denied=0 THROW 51058, 'Retired procedure permitted a write.',1;
    SET @n+=1;
END;
IF @BeforeRoles<>(SELECT * FROM dbo.VAITRO ORDER BY VaiTroID FOR JSON PATH)
 OR @BeforePermissions<>(SELECT * FROM dbo.QUYEN ORDER BY QuyenID FOR JSON PATH)
 OR @BeforeMatrix<>(SELECT * FROM dbo.VAITRO_QUYEN ORDER BY VaiTroID,QuyenID FOR JSON PATH)
 THROW 51058, 'RBAC rows changed after denied writes.',1;
PRINT 'PASS seven retired SPs return 50405 and preserve all RBAC rows';
GO
DECLARE @denied bit=0;
DECLARE @CustomerA int=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='customer1@example.test'),@CustomerB int=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='customer2@example.test');
BEGIN TRY
    BEGIN TRANSACTION;
    UPDATE dbo.NGUOIDUNG SET VaiTroID=CASE WHEN NguoiDungID=@CustomerA THEN 2 ELSE VaiTroID END
    WHERE NguoiDungID IN (@CustomerA,@CustomerB);
    ROLLBACK TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER()=50406 SET @denied=1; ELSE THROW;
END CATCH;
IF @denied=0 OR EXISTS(SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID IN(@CustomerA,@CustomerB) AND VaiTroID<>4)
 THROW 51058, 'Account role update was not rejected atomically.',1;
PRINT 'PASS existing account roles are immutable, including multi-row updates';
GO
CREATE USER FixedRbacExecutorProbe WITHOUT LOGIN;
ALTER ROLE db_executor ADD MEMBER FixedRbacExecutorProbe;
DECLARE @denied bit=0;
BEGIN TRY
    EXECUTE AS USER='FixedRbacExecutorProbe';
    BEGIN TRY
        EXEC dbo.sp_Admin_RolePermission_Set @ActorID=1,@VaiTroID=2,@QuyenIdList='14';
    END TRY
    BEGIN CATCH
        IF ERROR_NUMBER()=229 SET @denied=1; ELSE THROW;
    END CATCH;
    IF HAS_PERMS_BY_NAME('dbo.VAITRO','OBJECT','INSERT')<>0
       OR HAS_PERMS_BY_NAME('dbo.QUYEN','OBJECT','UPDATE')<>0
       OR HAS_PERMS_BY_NAME('dbo.VAITRO_QUYEN','OBJECT','DELETE')<>0
       THROW 51058, 'Application principal can mutate RBAC tables.',1;
    REVERT;
    DROP USER FixedRbacExecutorProbe;
    IF @denied=0 THROW 51058, 'Application principal can execute a retired SP.',1;
    PRINT 'PASS application principal denies RBAC DML and retired SP execution';
END TRY
BEGIN CATCH
    IF USER_NAME()='FixedRbacExecutorProbe' REVERT;
    IF USER_ID('FixedRbacExecutorProbe') IS NOT NULL DROP USER FixedRbacExecutorProbe;
    THROW;
END CATCH;
GO
