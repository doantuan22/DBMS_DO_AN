IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 14. SEED SUATCHIEU
-- Tạo các suất chiếu: 1 suất trong quá khứ (để demo review) và các suất tương lai (để demo đặt vé)
SET IDENTITY_INSERT dbo.SUATCHIEU ON;
INSERT INTO dbo.SUATCHIEU (SuatChieuID, PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai) VALUES
-- Suất 1: Trong quá khứ (Dành cho kiểm thử Đánh giá phim đã xem)
(1, 1, 1, DATEADD(HOUR,18,CONVERT(datetime2,DATEADD(DAY,-2,@SeedDay))), DATEADD(MINUTE,1246,CONVERT(datetime2,DATEADD(DAY,-2,@SeedDay))), N'2D', 80000, N'Hoàn thành'),
-- Suất 2: Ngày mai rạp 1 phòng 1
(2, 1, 1, DATEADD(HOUR, 2, DATEADD(DAY,1,CONVERT(datetime2,@SeedDay))), DATEADD(MINUTE, 286, DATEADD(DAY,1,CONVERT(datetime2,@SeedDay))), N'2D', 85000, N'Mở bán'),
-- Suất 3: Ngày mai rạp 1 phòng 2 IMAX
(3, 1, 2, DATEADD(HOUR, 5, DATEADD(DAY,1,CONVERT(datetime2,@SeedDay))), DATEADD(MINUTE, 466, DATEADD(DAY,1,CONVERT(datetime2,@SeedDay))), N'IMAX', 120000, N'Mở bán'),
-- Suất 4: Phim Mai rạp 2 phòng 1
(4, 2, 4, DATEADD(HOUR, 3, DATEADD(DAY,1,CONVERT(datetime2,@SeedDay))), DATEADD(MINUTE, 311, DATEADD(DAY,1,CONVERT(datetime2,@SeedDay))), N'2D', 80000, N'Mở bán'),
-- Suất 5: Phim Conan rạp 3 phòng 1
(5, 4, 6, DATEADD(HOUR, 4, DATEADD(DAY,1,CONVERT(datetime2,@SeedDay))), DATEADD(MINUTE, 350, DATEADD(DAY,1,CONVERT(datetime2,@SeedDay))), N'2D', 75000, N'Mở bán');
SET IDENTITY_INSERT dbo.SUATCHIEU OFF;

END;
GO
