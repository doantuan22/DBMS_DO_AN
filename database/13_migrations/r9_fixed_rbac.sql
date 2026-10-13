-- Áp dụng thay đổi schema hoặc module theo migration.
:on error exit

-- Apply in place to the explicitly selected database; no DROP, RESET or reseed.
-- Dependencies retained: NGUOIDUNG -> VAITRO, VAITRO_QUYEN -> VAITRO/QUYEN, auth readers.
-- All legacy write signatures stay intact and now refuse every caller.
SET XACT_ABORT ON;

-- Chạy các bước kiểm tra database.
:r ./12_verify/verify_fixed_rbac.sql

-- Mở transaction để các bước ghi được xử lý cùng nhau.
BEGIN TRANSACTION;

GO

-- Tạo stored procedure theo từng nhóm chức năng.
:r ./08_procedures/admin/sp_Admin_Role_Create.sql

:r ./08_procedures/admin/sp_Admin_Role_Update.sql

:r ./08_procedures/admin/sp_Admin_Role_Delete.sql

:r ./08_procedures/admin/sp_Admin_Permission_Create.sql

:r ./08_procedures/admin/sp_Admin_Permission_Update.sql

:r ./08_procedures/admin/sp_Admin_Permission_Delete.sql

:r ./08_procedures/admin/sp_Admin_RolePermission_Set.sql

:r ./08_procedures/admin/sp_Admin_Role_List.sql

:r ./08_procedures/admin/sp_Admin_User_Create.sql

-- Tạo trigger kiểm tra toàn vẹn dữ liệu.
:r ./07_triggers/TRG_NguoiDung_VaiTroBatBien.sql

DENY
EXECUTE ON OBJECT :: dbo.sp_Admin_Role_Create TO [db_executor];
DENY
EXECUTE ON OBJECT :: dbo.sp_Admin_Role_Update TO [db_executor];
DENY
EXECUTE ON OBJECT :: dbo.sp_Admin_Role_Delete TO [db_executor];
DENY
EXECUTE ON OBJECT :: dbo.sp_Admin_Permission_Create TO [db_executor];
DENY
EXECUTE ON OBJECT :: dbo.sp_Admin_Permission_Update TO [db_executor];
DENY
EXECUTE ON OBJECT :: dbo.sp_Admin_Permission_Delete TO [db_executor];
DENY
EXECUTE ON OBJECT :: dbo.sp_Admin_RolePermission_Set TO [db_executor];
-- Chốt các thay đổi của transaction.
COMMIT TRANSACTION;

GO

PRINT 'Fixed RBAC migration applied without changing catalog, matrix or assignments.';

GO
