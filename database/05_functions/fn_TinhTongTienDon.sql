SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER FUNCTION dbo.fn_TinhTongTienDon
(
    @DonDatVeID INT
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @TongTienVe DECIMAL(18,2) = 0;
    DECLARE @TongTienDoAn DECIMAL(18,2) = 0;
    DECLARE @TienGiamGia DECIMAL(18,2) = 0;
    DECLARE @TongThanhToan DECIMAL(18,2) = 0;

    SELECT
        @TongTienVe = TongTienVe,
        @TongTienDoAn = TongTienDoAn,
        @TienGiamGia = TienGiamGia
    FROM dbo.DONDATVE
    WHERE DonDatVeID = @DonDatVeID;

    SET @TongThanhToan = @TongTienVe + @TongTienDoAn - @TienGiamGia;

    IF @TongThanhToan < 0 SET @TongThanhToan = 0;

    RETURN @TongThanhToan;
END;
GO
