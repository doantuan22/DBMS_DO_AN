SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Showtime_GetDetail
(
    @SuatChieuID INT
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
    WHERE SuatChieuID = @SuatChieuID AND IsBookable = 1;
END;
GO
