IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 13. SEED BANGGIA (Cấu hình phụ thu rạp)
INSERT INTO dbo.BANGGIA (RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai) VALUES
(1, N'VIP', N'Tất cả', N'Tất cả', 15000, DATEADD(DAY,-30,@SeedDay), NULL, N'Áp dụng'),
(1, N'Sweetbox', N'Tất cả', N'Tất cả', 30000, DATEADD(DAY,-30,@SeedDay), NULL, N'Áp dụng'),
(1, N'Tất cả', N'Cuối tuần', N'Tất cả', 10000, DATEADD(DAY,-30,@SeedDay), NULL, N'Áp dụng'),
(1, N'Tất cả', N'Tất cả', N'IMAX', 50000, DATEADD(DAY,-30,@SeedDay), NULL, N'Áp dụng'),
(2, N'VIP', N'Tất cả', N'Tất cả', 15000, DATEADD(DAY,-30,@SeedDay), NULL, N'Áp dụng'),
(2, N'Sweetbox', N'Tất cả', N'Tất cả', 25000, DATEADD(DAY,-30,@SeedDay), NULL, N'Áp dụng'),
(3, N'VIP', N'Tất cả', N'Tất cả', 10000, DATEADD(DAY,-30,@SeedDay), NULL, N'Áp dụng');

END;
GO
