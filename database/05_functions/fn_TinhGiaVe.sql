SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- ---------------------------------------------------------------------------------------------
-- (2) Weekend independent of configuration.
-- Rule kept exactly as before: Saturday and Sunday are "Cuối tuần" (DATEPART(dw) IN (1, 7) under the default
-- DATEFIRST 7 / us_english). 1900-01-01 was a Monday, so DATEDIFF(DAY, '19000101', date) % 7 is 0 = Monday ...
-- 5 = Saturday, 6 = Sunday, whatever DATEFIRST or the language is (style 112 is language independent too).
-- Everything else in the function is unchanged from migration 012.
-- ---------------------------------------------------------------------------------------------
CREATE OR ALTER FUNCTION dbo.fn_TinhGiaVe
(
    @SuatChieuID INT,
    @GheID INT
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @GiaVeCoBan DECIMAL(18,2) = 0;
    DECLARE @RapID INT;
    DECLARE @DinhDang NVARCHAR(50);
    DECLARE @ThoiGianBatDau DATETIME2;
    DECLARE @LoaiGhe NVARCHAR(50);
    DECLARE @LoaiNgay NVARCHAR(50);
    DECLARE @NgayChieu DATE;
    DECLARE @PhuThu DECIMAL(18,2) = 0;

    SELECT
        @GiaVeCoBan = sc.GiaVeCoBan,
        @DinhDang = sc.DinhDang,
        @ThoiGianBatDau = sc.ThoiGianBatDau,
        @RapID = pc.RapID,
        @NgayChieu = dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau)
    FROM dbo.SUATCHIEU sc
    INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
    WHERE sc.SuatChieuID = @SuatChieuID;

    IF @GiaVeCoBan IS NULL RETURN 0;

    SELECT @LoaiGhe = LoaiGhe
    FROM dbo.GHE
    WHERE GheID = @GheID;

    IF @LoaiGhe IS NULL SET @LoaiGhe = N'Thường';

    -- 5 = Saturday, 6 = Sunday counted from a Monday (independent of DATEFIRST and language)
    IF DATEDIFF(DAY, CONVERT(DATE, '19000101', 112), @NgayChieu) % 7 IN (5, 6)
        SET @LoaiNgay = N'Cuối tuần';
    ELSE
        SET @LoaiNgay = N'Ngày thường';

    -- R0: Ngày thường / Cuối tuần / Tất cả. SQL remains the authoritative price calculator.
    -- All matching surcharges are added (migration 012)
    SELECT @PhuThu = ISNULL(SUM(PhuThu), 0)
    FROM dbo.BANGGIA bg
    WHERE bg.RapID = @RapID
      AND bg.TrangThai = N'Áp dụng'
      AND @NgayChieu >= bg.NgayBatDau
      AND (@NgayChieu <= bg.NgayKetThuc OR bg.NgayKetThuc IS NULL)
      AND (bg.LoaiGhe = @LoaiGhe OR bg.LoaiGhe = N'Tất cả')
      AND (bg.LoaiNgay = @LoaiNgay OR bg.LoaiNgay = N'Tất cả')
      AND (bg.DinhDang = @DinhDang OR bg.DinhDang = N'Tất cả');

    RETURN (@GiaVeCoBan + ISNULL(@PhuThu, 0));
END;
GO
