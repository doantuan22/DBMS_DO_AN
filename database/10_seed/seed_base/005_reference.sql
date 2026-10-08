IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 5. SEED RAPCHIEUPHIM (3 Rạp chiếu)
SET IDENTITY_INSERT dbo.RAPCHIEUPHIM ON;
INSERT INTO dbo.RAPCHIEUPHIM (RapID, TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai) VALUES
(1, N'Cinema Star Hai Bà Trưng', N'123 Hai Bà Trưng, Phường Bến Nghé, Quận 1', N'Hồ Chí Minh', '02838220001', N'Cụm rạp flagship trung tâm Sài Gòn với phòng chiếu IMAX hiện đại', '2024-01-01', N'Hoạt động'),
(2, N'Cinema Star Landmark', N'208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh', N'Hồ Chí Minh', '02838220002', N'Rạp chiếu phim cao cấp tại Landmark với màn hình ScreenX 270 độ', '2024-06-01', N'Hoạt động'),
(3, N'Cinema Star Times City', N'458 Minh Khai, Vĩnh Tuy, Hai Bà Trưng', N'Hà Nội', '02438220003', N'Cụm rạp tiêu chuẩn quốc tế lớn nhất miền Bắc', '2024-03-01', N'Hoạt động');
SET IDENTITY_INSERT dbo.RAPCHIEUPHIM OFF;

END;
GO
