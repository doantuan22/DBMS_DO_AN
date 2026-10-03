SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER VIEW dbo.vw_DoanhThuTheoRap
AS
-- Doanh thu tính từ THANHTOAN có TrangThai = 'Thành công' (không dựa vào trạng thái đơn).
-- Giao dịch 'Thất bại' / 'Đang xử lý' / 'Đã hoàn tiền' không được tính.
WITH DonDaThu AS (
    SELECT
        ddv.DonDatVeID,
        pc.RapID,
        ddv.TongTienVe,
        ddv.TongTienDoAn,
        ddv.TienGiamGia,
        SUM(tt.SoTien) AS TienDaThu,
        (SELECT COUNT(*) FROM dbo.CHITIETVE cv
         WHERE cv.DonDatVeID = ddv.DonDatVeID AND cv.TrangThai <> N'Đã hủy') AS SoVeCuaDon
    FROM dbo.DONDATVE ddv
    INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
    INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
    INNER JOIN dbo.THANHTOAN tt ON tt.DonDatVeID = ddv.DonDatVeID AND tt.TrangThai = N'Thành công'
    GROUP BY ddv.DonDatVeID, pc.RapID, ddv.TongTienVe, ddv.TongTienDoAn, ddv.TienGiamGia
),
SuatChieuTheoRap AS (
    SELECT
        pc.RapID,
        COUNT(DISTINCT sc.SuatChieuID) AS TongSoSuatChieu
    FROM dbo.PHONGCHIEU pc
    LEFT JOIN dbo.SUATCHIEU sc ON pc.PhongID = sc.PhongID
    GROUP BY pc.RapID
)
SELECT
    r.RapID,
    r.TenRap,
    r.ThanhPho,
    COUNT(dh.DonDatVeID) AS TongSoDon,
    ISNULL(sc_rap.TongSoSuatChieu, 0) AS TongSoSuatChieu,
    ISNULL(SUM(dh.SoVeCuaDon), 0) AS TongSoVeBan,
    ISNULL(SUM(dh.TongTienVe), 0) AS DoanhThuVe,
    ISNULL(SUM(dh.TongTienDoAn), 0) AS DoanhThuDoAn,
    ISNULL(SUM(dh.TienGiamGia), 0) AS TongTienGiam,
    ISNULL(SUM(dh.TienDaThu), 0) AS DoanhThuThucTe
FROM dbo.RAPCHIEUPHIM r
LEFT JOIN DonDaThu dh ON r.RapID = dh.RapID
LEFT JOIN SuatChieuTheoRap sc_rap ON r.RapID = sc_rap.RapID
GROUP BY r.RapID, r.TenRap, r.ThanhPho, sc_rap.TongSoSuatChieu;
GO
