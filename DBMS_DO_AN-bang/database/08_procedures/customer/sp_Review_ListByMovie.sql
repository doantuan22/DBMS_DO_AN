SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Review_ListByMovie
(
    @PhimID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        dg.DanhGiaID,
        dg.PhimID,
        dg.NguoiDungID,
        nd.HoTen AS NguoiDanhGia,
        dg.SoSao,
        dg.NoiDung,
        dg.NgayDanhGia
    FROM dbo.DANHGIAPHIM dg
    INNER JOIN dbo.NGUOIDUNG nd ON dg.NguoiDungID = nd.NguoiDungID
    WHERE dg.PhimID = @PhimID
    ORDER BY dg.NgayDanhGia DESC;
END;
GO
