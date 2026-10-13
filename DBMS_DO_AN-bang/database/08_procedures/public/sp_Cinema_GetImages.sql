SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Cinema_GetImages
    @RapID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT i.HinhAnhRapID, i.RapID, i.URL, i.MoTa, i.LaAnhDaiDien, i.ThuTuHienThi, i.TrangThai, i.NgayTao
    FROM dbo.HINHANH_RAPCHIEUPHIM i
    INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = i.RapID
    WHERE i.RapID = @RapID AND r.TrangThai = N'Hoạt động' AND i.TrangThai = N'Hoạt động'
    ORDER BY i.ThuTuHienThi, i.HinhAnhRapID;
END;
GO
