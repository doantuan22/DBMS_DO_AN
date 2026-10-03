SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Permission_Delete
(
    @QuyenID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.QUYEN WHERE QuyenID = @QuyenID)
    BEGIN
        ;THROW 50093, N'Quyền không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.VAITRO_QUYEN WHERE QuyenID = @QuyenID)
    BEGIN
        ;THROW 50094, N'Quyền đang được gán cho vai trò nên không thể xóa.', 1;
    END

    DELETE FROM dbo.QUYEN WHERE QuyenID = @QuyenID;
    SELECT N'Đã xóa quyền.' AS [Message];
END;
GO
