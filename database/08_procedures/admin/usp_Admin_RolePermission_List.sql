SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_RolePermission_List @VaiTroID INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.VAITRO WHERE VaiTroID = @VaiTroID)
        THROW 50214, N'Vai trò không tồn tại.', 1;
    SELECT vq.VaiTroID, q.QuyenID, q.MaQuyen, q.TenQuyen
    FROM dbo.VAITRO_QUYEN vq INNER JOIN dbo.QUYEN q ON q.QuyenID = vq.QuyenID
    WHERE vq.VaiTroID = @VaiTroID ORDER BY q.MaQuyen;
END;
GO
