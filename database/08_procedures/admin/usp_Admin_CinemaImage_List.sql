SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_CinemaImage_List
    @RapID INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)
        THROW 50200, N'Rạp không tồn tại.', 1;
    SELECT HinhAnhRapID, RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai, NgayTao
    FROM dbo.HINHANH_RAPCHIEUPHIM
    WHERE RapID = @RapID
    ORDER BY ThuTuHienThi, HinhAnhRapID;
END;
GO
