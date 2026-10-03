SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Permission_Create
(
    @MaQuyen VARCHAR(50),
    @TenQuyen NVARCHAR(100),
    @MoTa NVARCHAR(255) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.QUYEN WHERE MaQuyen = @MaQuyen)
    BEGIN
        ;THROW 50092, N'Mã quyền đã tồn tại.', 1;
    END

    INSERT INTO dbo.QUYEN (MaQuyen, TenQuyen, MoTa) VALUES (@MaQuyen, @TenQuyen, @MoTa);
    SELECT QuyenID, MaQuyen, TenQuyen, MoTa FROM dbo.QUYEN WHERE QuyenID = SCOPE_IDENTITY();
END;
GO
