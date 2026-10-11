:on error exit
-- Apply in place to the explicitly selected database; no DROP, RESET or reseed.
-- Dependencies retained: NGUOIDUNG -> VAITRO, VAITRO_QUYEN -> VAITRO/QUYEN, auth readers.
-- All legacy write signatures stay intact and now refuse every caller.
SET XACT_ABORT ON;
:r ./12_verify/verify_fixed_rbac.sql
BEGIN TRANSACTION;
GO
:r ./08_procedures/admin/sp_Admin_Role_Create.sql
:r ./08_procedures/admin/sp_Admin_Role_Update.sql
:r ./08_procedures/admin/sp_Admin_Role_Delete.sql
:r ./08_procedures/admin/sp_Admin_Permission_Create.sql
:r ./08_procedures/admin/sp_Admin_Permission_Update.sql
:r ./08_procedures/admin/sp_Admin_Permission_Delete.sql
:r ./08_procedures/admin/sp_Admin_RolePermission_Set.sql
:r ./08_procedures/admin/sp_Admin_Role_List.sql
:r ./08_procedures/admin/sp_Admin_User_Create.sql
:r ./07_triggers/TRG_NguoiDung_VaiTroBatBien.sql
DENY EXECUTE ON OBJECT::dbo.sp_Admin_Role_Create TO [db_executor];
DENY EXECUTE ON OBJECT::dbo.sp_Admin_Role_Update TO [db_executor];
DENY EXECUTE ON OBJECT::dbo.sp_Admin_Role_Delete TO [db_executor];
DENY EXECUTE ON OBJECT::dbo.sp_Admin_Permission_Create TO [db_executor];
DENY EXECUTE ON OBJECT::dbo.sp_Admin_Permission_Update TO [db_executor];
DENY EXECUTE ON OBJECT::dbo.sp_Admin_Permission_Delete TO [db_executor];
DENY EXECUTE ON OBJECT::dbo.sp_Admin_RolePermission_Set TO [db_executor];
COMMIT TRANSACTION;
GO
PRINT 'Fixed RBAC migration applied without changing catalog, matrix or assignments.';
GO
