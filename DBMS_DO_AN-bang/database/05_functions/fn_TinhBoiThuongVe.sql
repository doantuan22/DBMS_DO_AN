SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER FUNCTION dbo.fn_TinhBoiThuongVe (
    @TongTienVe DECIMAL(18,2), @TongTienDoAn DECIMAL(18,2), @TienGiamGia DECIMAL(18,2)
)
RETURNS TABLE
AS RETURN (
    -- Proportional allocation: Ve - Giam * Ve / (Ve + DoAn).
    -- Integer cents are exact DECIMAL values, not a monetary rounding step.
    -- Use the remainder to avoid division rounding a sub-point value up before FLOOR.
    SELECT CAST(ISNULL(n.TuSo / NULLIF(c.TongCent * CAST(100 AS DECIMAL(3,0)), 0), 0) AS DECIMAL(38,6)) AS TienVeThucTra,
           CAST(FLOOR(ISNULL((n.TuSo - n.TuSo % NULLIF(p.MauDiem, 0)) / NULLIF(p.MauDiem, 0), 0)) AS BIGINT) AS DiemCong
    FROM (SELECT CAST(ISNULL(@TongTienVe,0) * 100 AS DECIMAL(19,0)) AS VeCent,
                 CAST((ISNULL(@TongTienVe,0) + ISNULL(@TongTienDoAn,0)) * 100 AS DECIMAL(19,0)) AS TongCent,
                 CAST(ISNULL(@TienGiamGia,0) * 100 AS DECIMAL(19,0)) AS GiamCent) c
    CROSS APPLY (SELECT CAST(CASE WHEN c.TongCent <= c.GiamCent OR c.VeCent <= 0 THEN 0
                           ELSE c.VeCent * (c.TongCent - c.GiamCent) END AS DECIMAL(38,0)) AS TuSo) n
    CROSS APPLY (SELECT CAST(c.TongCent * CAST(100000 AS DECIMAL(6,0)) AS DECIMAL(25,0)) AS MauDiem) p
);
GO
