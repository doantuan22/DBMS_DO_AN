-- Cấp quyền thực thi và hạn chế truy cập trực tiếp vào bảng.
-- DEV connects as sa from environment. Keep the EXECUTE-only production role.
CREATE
ROLE [db_executor];
GRANT
EXECUTE ON
SCHEMA :: dbo TO [db_executor];
DENY
SELECT
    ,
INSERT
,
UPDATE,
DELETE ON
SCHEMA :: dbo TO [db_executor];
-- Fixed RBAC: ownership chaining must not expose the retired write procedures.
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

GO

-- Map an existing application login, without creating/resetting any server password.
IF SUSER_ID(N'CinemaAppUser') IS NOT NULL
BEGIN
    CREATE
    USER [CinemaAppUser] FOR
    LOGIN [CinemaAppUser];
    ALTER
    ROLE [db_executor]
    ADD MEMBER [CinemaAppUser];
END;

GO
