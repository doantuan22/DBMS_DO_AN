SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Genre_Delete
(
    @TheLoaiID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.THELOAI WHERE TheLoaiID = @TheLoaiID)
    BEGIN
        ;THROW 50098, N'Thể loại không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.PHIM_THELOAI WHERE TheLoaiID = @TheLoaiID)
    BEGIN
        ;THROW 50099, N'Thể loại đang được gán cho phim nên không thể xóa.', 1;
    END

    DELETE FROM dbo.THELOAI WHERE TheLoaiID = @TheLoaiID;
    SELECT N'Đã xóa thể loại.' AS [Message];
END;
GO
