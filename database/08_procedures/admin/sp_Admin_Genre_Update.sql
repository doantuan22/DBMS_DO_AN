SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Genre_Update
(
    @TheLoaiID INT,
    @TenTheLoai NVARCHAR(100)
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.THELOAI WHERE TheLoaiID = @TheLoaiID)
    BEGIN
        ;THROW 50098, N'Thể loại không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.THELOAI WHERE TenTheLoai = @TenTheLoai AND TheLoaiID <> @TheLoaiID)
    BEGIN
        ;THROW 50097, N'Thể loại đã tồn tại.', 1;
    END

    UPDATE dbo.THELOAI SET TenTheLoai = @TenTheLoai WHERE TheLoaiID = @TheLoaiID;
    SELECT TheLoaiID, TenTheLoai FROM dbo.THELOAI WHERE TheLoaiID = @TheLoaiID;
END;
GO
