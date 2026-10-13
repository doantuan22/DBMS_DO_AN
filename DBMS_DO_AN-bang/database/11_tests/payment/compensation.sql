SET NOCOUNT ON;
DECLARE @Cases TABLE (Ve DECIMAL(18,2), DoAn DECIMAL(18,2), Giam DECIMAL(18,2), Tien DECIMAL(38,6), Diem BIGINT);
INSERT @Cases VALUES
 (120000,0,0,120000,120), (120000,80000,0,120000,120),
 (120000,80000,50000,90000,90), (120000,0,20000,100000,100),
 (0,0,0,0,0), (0,80000,10000,0,0), (120000,80000,250000,0,0),
 (120999.99,0,0,120999.99,120), (1234.56,2345.67,321.09,1123.839496,1);
IF EXISTS (SELECT 1 FROM @Cases c CROSS APPLY dbo.fn_TinhBoiThuongVe(c.Ve,c.DoAn,c.Giam) f
           WHERE ABS(f.TienVeThucTra - c.Tien) > 0.000001 OR f.DiemCong <> c.Diem)
BEGIN
    SELECT c.*,f.* FROM @Cases c CROSS APPLY dbo.fn_TinhBoiThuongVe(c.Ve,c.DoAn,c.Giam) f;
    THROW 51030, 'R2 proportional compensation failed.', 1;
END;
-- The exact amount is just BELOW 1,000, but decimal division can display 1,000.000000.
-- Points must still be 0; never FLOOR an already rounded monetary display value.
IF (SELECT DiemCong FROM dbo.fn_TinhBoiThuongVe(1000,999999999999000,0.01)) <> 0
    THROW 51030, 'R2 final FLOOR boundary failed.', 1;
PRINT 'PASS R2 DECIMAL proportional compensation, zero total, food exclusion and final FLOOR';
GO
