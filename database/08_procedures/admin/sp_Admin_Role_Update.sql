SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Role_Update
(
    @VaiTroID INT,
    @TenVaiTro NVARCHAR(100),
    @MoTa NVARCHAR(255) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.VAITRO WHERE VaiTroID = @VaiTroID)
    BEGIN
        ;THROW 50090, N'Vai trò không tồn tại.', 1;
    END

    UPDATE dbo.VAITRO SET TenVaiTro = @TenVaiTro, MoTa = @MoTa WHERE VaiTroID = @VaiTroID;

    SELECT VaiTroID, MaVaiTro, TenVaiTro, MoTa FROM dbo.VAITRO WHERE VaiTroID = @VaiTroID;
END;
GO
