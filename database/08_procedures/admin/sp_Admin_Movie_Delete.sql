SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Movie_Delete
(
    @PhimID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.PHIM WHERE PhimID = @PhimID)
    BEGIN
        ;THROW 50102, N'Phim không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.SUATCHIEU WHERE PhimID = @PhimID)
       OR EXISTS (SELECT 1 FROM dbo.DANHGIAPHIM WHERE PhimID = @PhimID)
    BEGIN
        ;THROW 50104, N'Phim đã có suất chiếu hoặc đánh giá. Hãy chuyển trạng thái sang Ngừng chiếu thay vì xóa.', 1;
    END

    DELETE FROM dbo.PHIM WHERE PhimID = @PhimID;
    SELECT N'Đã xóa phim.' AS [Message];
END;
GO
