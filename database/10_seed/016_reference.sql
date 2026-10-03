IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 16. SEED KHUYENMAI
SET IDENTITY_INSERT dbo.KHUYENMAI ON;
INSERT INTO dbo.KHUYENMAI (KhuyenMaiID, MaCode, MoTa, LoaiGiamGia, GiaTriGiam, DonHangToiThieu, GiamToiDa, NgayBatDau, NgayKetThuc, SoLuong, SoLuongDaDung, TrangThai) VALUES
(1, 'CHAOBANMOI', N'Giảm 10% cho khách hàng mới', N'Phần trăm', 10.00, 100000, 50000, dbo.fn_UtcTuGioRap(CONVERT(datetime2,DATEADD(DAY,-30,@SeedDay))), dbo.fn_UtcTuGioRap(CONVERT(datetime2,DATEADD(YEAR,1,@SeedDay))), 1000, 0, N'Hoạt động'),
(2, 'GIAM30K', N'Giảm trực tiếp 30.000 đ cho đơn từ 150k', N'Số tiền', 30000, 150000, NULL, dbo.fn_UtcTuGioRap(CONVERT(datetime2,DATEADD(DAY,-30,@SeedDay))), dbo.fn_UtcTuGioRap(CONVERT(datetime2,DATEADD(YEAR,1,@SeedDay))), 500, 0, N'Hoạt động'),
(3, 'VIPMEMBER', N'Giảm 20% cho thành viên thân thiết', N'Phần trăm', 20.00, 200000, 100000, dbo.fn_UtcTuGioRap(CONVERT(datetime2,DATEADD(DAY,-30,@SeedDay))), dbo.fn_UtcTuGioRap(CONVERT(datetime2,DATEADD(YEAR,1,@SeedDay))), 200, 0, N'Hoạt động');
SET IDENTITY_INSERT dbo.KHUYENMAI OFF;

END;
GO
