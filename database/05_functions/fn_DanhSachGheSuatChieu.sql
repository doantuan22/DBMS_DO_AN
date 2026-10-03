SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: functions/02_functions.sql:203 (dbo.fn_DanhSachGheSuatChieu)
CREATE OR ALTER FUNCTION dbo.fn_DanhSachGheSuatChieu
(
    @SuatChieuID INT
)
RETURNS TABLE
AS
RETURN
(
    WITH GhePhong AS (
        SELECT
            g.GheID,
            g.PhongID,
            g.HangGhe,
            g.SoGhe,
            (g.HangGhe + CAST(g.SoGhe AS VARCHAR(10))) AS TenGhe,
            g.LoaiGhe,
            g.TrangThai AS TrangThaiGheVatLy
        FROM dbo.SUATCHIEU sc
        INNER JOIN dbo.GHE g ON sc.PhongID = g.PhongID
        WHERE sc.SuatChieuID = @SuatChieuID
    ),
    GheChiemCho AS (
        -- Mức 2 = đã bán (đơn đã thanh toán), mức 1 = đang giữ chỗ chờ thanh toán
        SELECT
            cv.GheID,
            MAX(CASE WHEN ddv.TrangThai = N'Chờ thanh toán' THEN 1 ELSE 2 END) AS Muc
        FROM dbo.CHITIETVE cv
        INNER JOIN dbo.DONDATVE ddv ON cv.DonDatVeID = ddv.DonDatVeID
        WHERE ddv.SuatChieuID = @SuatChieuID
          AND cv.TrangThai <> N'Đã hủy'
          AND dbo.fn_DonDangGiuGhe(ddv.TrangThai, ddv.HanGiuCho, dbo.fn_BayGio()) = 1
        GROUP BY cv.GheID
    )
    SELECT
        gp.GheID,
        gp.PhongID,
        gp.HangGhe,
        gp.SoGhe,
        gp.TenGhe,
        gp.LoaiGhe,
        dbo.fn_TinhGiaVe(@SuatChieuID, gp.GheID) AS GiaVe,
        CASE
            WHEN gp.TrangThaiGheVatLy <> N'Hoạt động' THEN N'Bảo trì'
            WHEN gdd.Muc = 2 THEN N'Đã đặt'
            WHEN gdd.Muc = 1 THEN N'Đang giữ'
            ELSE N'Trống'
        END AS TrangThaiGhe
    FROM GhePhong gp
    LEFT JOIN GheChiemCho gdd ON gp.GheID = gdd.GheID
);
GO
