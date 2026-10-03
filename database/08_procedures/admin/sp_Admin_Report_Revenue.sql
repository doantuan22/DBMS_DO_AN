SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Report_Revenue
(
    @TuNgay DATE = NULL,
    @DenNgay DATE = NULL,
    @RapID INT = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Doanh thu chỉ tính THANHTOAN có TrangThai = 'Thành công', theo ngày thanh toán
    CREATE TABLE #DonDaThu (
        DonDatVeID INT PRIMARY KEY,
        RapID INT NOT NULL,
        TongTienVe DECIMAL(18,2),
        TongTienDoAn DECIMAL(18,2),
        TienGiamGia DECIMAL(18,2),
        TienDaThu DECIMAL(18,2),
        SoVe INT
    );

    INSERT INTO #DonDaThu (DonDatVeID, RapID, TongTienVe, TongTienDoAn, TienGiamGia, TienDaThu, SoVe)
    SELECT
        ddv.DonDatVeID,
        pc.RapID,
        ddv.TongTienVe,
        ddv.TongTienDoAn,
        ddv.TienGiamGia,
        SUM(tt.SoTien),
        (SELECT COUNT(*) FROM dbo.CHITIETVE cv
         WHERE cv.DonDatVeID = ddv.DonDatVeID AND cv.TrangThai <> N'Đã hủy')
    FROM dbo.DONDATVE ddv
    INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
    INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
    INNER JOIN dbo.THANHTOAN tt ON tt.DonDatVeID = ddv.DonDatVeID AND tt.TrangThai = N'Thành công'
    WHERE (@RapID IS NULL OR pc.RapID = @RapID)
    GROUP BY ddv.DonDatVeID, pc.RapID, ddv.TongTienVe, ddv.TongTienDoAn, ddv.TienGiamGia
    HAVING (@TuNgay IS NULL OR dbo.fn_NgayKinhDoanh(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao))) >= @TuNgay)
       AND (@DenNgay IS NULL OR dbo.fn_NgayKinhDoanh(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao))) <= @DenNgay);

    -- Recordset 1: Doanh thu theo từng rạp
    SELECT
        r.RapID,
        r.TenRap,
        r.ThanhPho,
        COUNT(d.DonDatVeID) AS SoDon,
        ISNULL(SUM(d.SoVe), 0) AS SoVeBan,
        ISNULL(SUM(d.TongTienVe), 0) AS DoanhThuVe,
        ISNULL(SUM(d.TongTienDoAn), 0) AS DoanhThuDoAn,
        ISNULL(SUM(d.TienGiamGia), 0) AS TongTienGiam,
        ISNULL(SUM(d.TienDaThu), 0) AS DoanhThuThucTe
    FROM dbo.RAPCHIEUPHIM r
    LEFT JOIN #DonDaThu d ON d.RapID = r.RapID
    WHERE (@RapID IS NULL OR r.RapID = @RapID)
    GROUP BY r.RapID, r.TenRap, r.ThanhPho;

    -- Recordset 2: Tổng hợp toàn hệ thống
    SELECT
        COUNT(DonDatVeID) AS TongSoDonToanHeThong,
        ISNULL(SUM(SoVe), 0) AS TongSoVeBan,
        ISNULL(SUM(TongTienVe), 0) AS TongDoanhThuVe,
        ISNULL(SUM(TongTienDoAn), 0) AS TongDoanhThuDoAn,
        ISNULL(SUM(TienGiamGia), 0) AS TongTienGiam,
        ISNULL(SUM(TienDaThu), 0) AS TongDoanhThuThucTe
    FROM #DonDaThu;

    DROP TABLE #DonDaThu;
END;
GO
