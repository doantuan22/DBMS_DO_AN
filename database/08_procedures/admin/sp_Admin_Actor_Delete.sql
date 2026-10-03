SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Actor_Delete
(
    @DienVienID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.DIENVIEN WHERE DienVienID = @DienVienID)
    BEGIN
        ;THROW 50100, N'Diễn viên không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.PHIM_DIENVIEN WHERE DienVienID = @DienVienID)
    BEGIN
        ;THROW 50101, N'Diễn viên đang tham gia phim nên không thể xóa.', 1;
    END

    DELETE FROM dbo.DIENVIEN WHERE DienVienID = @DienVienID;
    SELECT N'Đã xóa diễn viên.' AS [Message];
END;
GO
