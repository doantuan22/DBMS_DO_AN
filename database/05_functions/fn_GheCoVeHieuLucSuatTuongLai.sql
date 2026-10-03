SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/014_showtime_lifecycle.sql:14 (dbo.fn_GheCoVeHieuLucSuatTuongLai)
CREATE OR ALTER FUNCTION dbo.fn_GheCoVeHieuLucSuatTuongLai(@GheID INT)
RETURNS BIT
AS
BEGIN
    DECLARE @CoVe BIT = 0;
    IF EXISTS (
        SELECT 1
        FROM dbo.CHITIETVE cv
        INNER JOIN dbo.DONDATVE ddv ON ddv.DonDatVeID = cv.DonDatVeID
        INNER JOIN dbo.SUATCHIEU sc ON sc.SuatChieuID = ddv.SuatChieuID
        WHERE cv.GheID = @GheID
          AND cv.TrangThai = N'Đã đặt'
          AND sc.ThoiGianBatDau > dbo.fn_BayGio()
          AND dbo.fn_DonDangGiuGhe(ddv.TrangThai, ddv.HanGiuCho, dbo.fn_BayGio()) = 1
    ) SET @CoVe = 1;
    RETURN @CoVe;
END;
GO
