SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/manager/manager_procedures.sql:752 (dbo.sp_Manager_Revenue)
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Revenue
(
    @NguoiDungID INT,
    @RapID INT,
    @TuNgay DATE = NULL,
    @DenNgay DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền truy cập báo cáo rạp này.', 1;
    END

    IF @TuNgay IS NULL SET @TuNgay = DATEADD(DAY, -30, dbo.fn_HomNay());
    IF @DenNgay IS NULL SET @DenNgay = dbo.fn_HomNay();

    -- Doanh thu theo ngày thanh toán: chỉ tính THANHTOAN có TrangThai = 'Thành công'
    ;WITH DonDaThu AS (
        SELECT
            ddv.DonDatVeID,
            ddv.TongTienVe,
            ddv.TongTienDoAn,
            ddv.TienGiamGia,
            SUM(tt.SoTien) AS TienDaThu,
            CAST(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao)) AS DATE) AS NgayThu,
            (SELECT COUNT(*) FROM dbo.CHITIETVE cv
             WHERE cv.DonDatVeID = ddv.DonDatVeID AND cv.TrangThai <> N'Đã hủy') AS SoVe
        FROM dbo.DONDATVE ddv
        INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
        INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
        INNER JOIN dbo.THANHTOAN tt ON tt.DonDatVeID = ddv.DonDatVeID AND tt.TrangThai = N'Thành công'
        WHERE pc.RapID = @RapID
        GROUP BY ddv.DonDatVeID, ddv.TongTienVe, ddv.TongTienDoAn, ddv.TienGiamGia
    )
    SELECT
        NgayThu AS Ngay,
        COUNT(*) AS SoDon,
        SUM(SoVe) AS SoVeBan,
        SUM(TongTienVe) AS DoanhThuVe,
        SUM(TongTienDoAn) AS DoanhThuDoAn,
        SUM(TienGiamGia) AS TienGiamGia,
        SUM(TienDaThu) AS DoanhThuThucTe
    FROM DonDaThu
    WHERE NgayThu BETWEEN @TuNgay AND @DenNgay
    GROUP BY NgayThu
    ORDER BY Ngay DESC;
END;
GO
