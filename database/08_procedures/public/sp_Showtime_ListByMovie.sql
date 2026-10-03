SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/customer/customer_procedures.sql:164 (dbo.sp_Showtime_ListByMovie)
CREATE OR ALTER PROCEDURE dbo.sp_Showtime_ListByMovie
(
    @PhimID INT,
    @RapID INT = NULL,
    @NgayChieu DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        SuatChieuID,
        PhimID,
        TenPhim,
        PosterURL,
        ThoiLuong,
        DoTuoi,
        RapID,
        TenRap,
        DiaChiRap,
        ThanhPho,
        PhongID,
        TenPhong,
        LoaiPhong,
        ThoiGianBatDau,
        ThoiGianKetThuc,
        NgayChieu,
        GioBatDau,
        GioKetThuc,
        DinhDang,
        GiaVeCoBan,
        TrangThaiSuatChieu,
        TongSoGhe,
        SoGheDaDat,
        (TongSoGhe - SoGheDaDat) AS SoGheConLai
    FROM dbo.vw_LichChieuChiTiet
    WHERE PhimID = @PhimID
      AND (@RapID IS NULL OR RapID = @RapID)
      AND (@NgayChieu IS NULL OR NgayChieu = @NgayChieu)
      AND TrangThaiSuatChieu = N'Mở bán'
      AND ThoiGianBatDau > dbo.fn_BayGio()
    ORDER BY ThoiGianBatDau ASC;
END;
GO
