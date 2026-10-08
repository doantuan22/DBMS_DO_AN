IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 6. SEED PHANCONG_RAP (Gán quyền quản lý rạp)
INSERT INTO dbo.PHANCONG_RAP (NguoiDungID, RapID, NgayBatDau, NgayKetThuc, TrangThai) VALUES
(2, 1, DATEADD(DAY,-30,@SeedDay), DATEADD(YEAR,2,@SeedDay), N'Hiệu lực'), -- Manager 1 quản lý Rạp 1
(3, 2, DATEADD(DAY,-30,@SeedDay), DATEADD(YEAR,2,@SeedDay), N'Hiệu lực'); -- Manager 2 quản lý Rạp 2

END;
GO
