SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Role_Delete
(
    @VaiTroID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.VAITRO WHERE VaiTroID = @VaiTroID)
    BEGIN
        ;THROW 50090, N'Vai trò không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE VaiTroID = @VaiTroID)
       OR EXISTS (SELECT 1 FROM dbo.VAITRO_QUYEN WHERE VaiTroID = @VaiTroID)
    BEGIN
        ;THROW 50091, N'Vai trò đang được gán cho người dùng hoặc quyền nên không thể xóa.', 1;
    END

    DELETE FROM dbo.VAITRO WHERE VaiTroID = @VaiTroID;
    SELECT N'Đã xóa vai trò.' AS [Message];
END;
GO
