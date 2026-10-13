SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/admin/admin_procedures.sql:156 (dbo.sp_Admin_RolePermission_Set)
CREATE OR ALTER PROCEDURE dbo.sp_Admin_RolePermission_Set
(
    @ActorID INT,
    @VaiTroID INT,
    @QuyenIdList VARCHAR(MAX) -- '1,2,3,4'
)
AS
BEGIN
    SET NOCOUNT ON;
    -- ADM-03/04/05 RETIRED. Kept as a refusal point; no RBAC writes remain.
    THROW 50405, N'Vai trò, danh mục quyền và ma trận quyền là cố định.', 1;
END;
GO
