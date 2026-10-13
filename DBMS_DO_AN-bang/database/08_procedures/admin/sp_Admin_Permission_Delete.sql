SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Permission_Delete
(
    @ActorID INT,
    @QuyenID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    -- ADM-03/04/05 RETIRED. Kept as a refusal point; no RBAC writes remain.
    THROW 50405, N'Vai trò, danh mục quyền và ma trận quyền là cố định.', 1;
END;
GO
