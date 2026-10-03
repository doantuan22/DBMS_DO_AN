SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Showtime_List
    @RapID INT = NULL, @TuNgay DATE = NULL, @DenNgay DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT sc.SuatChieuID, sc.PhimID, p.TenPhim, sc.PhongID, pc.TenPhong, pc.RapID, r.TenRap,
           sc.ThoiGianBatDau, sc.ThoiGianKetThuc, sc.DinhDang, sc.GiaVeCoBan, sc.TrangThai
    FROM dbo.SUATCHIEU sc
    INNER JOIN dbo.PHONGCHIEU pc ON pc.PhongID = sc.PhongID
    INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = pc.RapID
    INNER JOIN dbo.PHIM p ON p.PhimID = sc.PhimID
    WHERE (@RapID IS NULL OR pc.RapID = @RapID)
      AND (@TuNgay IS NULL OR dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) >= @TuNgay)
      AND (@DenNgay IS NULL OR dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) <= @DenNgay)
    ORDER BY sc.ThoiGianBatDau DESC;
END;
GO
