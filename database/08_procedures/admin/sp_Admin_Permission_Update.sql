SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Permission_Update
(
    @QuyenID INT,
    @TenQuyen NVARCHAR(100),
    @MoTa NVARCHAR(255) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.QUYEN WHERE QuyenID = @QuyenID)
    BEGIN
        ;THROW 50093, N'Quyền không tồn tại.', 1;
    END

    UPDATE dbo.QUYEN SET TenQuyen = @TenQuyen, MoTa = @MoTa WHERE QuyenID = @QuyenID;
    SELECT QuyenID, MaQuyen, TenQuyen, MoTa FROM dbo.QUYEN WHERE QuyenID = @QuyenID;
END;
GO
