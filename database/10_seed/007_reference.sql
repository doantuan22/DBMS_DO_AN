IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 7. SEED PHONGCHIEU
SET IDENTITY_INSERT dbo.PHONGCHIEU ON;
INSERT INTO dbo.PHONGCHIEU (PhongID, RapID, TenPhong, LoaiPhong, TrangThai) VALUES
(1, 1, N'Phòng 1 - Cinema 1', N'2D', N'Hoạt động'),
(2, 1, N'Phòng 2 - IMAX Laser', N'IMAX', N'Hoạt động'),
(3, 1, N'Phòng 3 - VIP Deluxe', N'3D', N'Hoạt động'),
(4, 2, N'Phòng 1 - ScreenX', N'ScreenX', N'Hoạt động'),
(5, 2, N'Phòng 2 - Standard', N'2D', N'Hoạt động'),
(6, 3, N'Phòng 1 - Times Prime', N'2D', N'Hoạt động');
SET IDENTITY_INSERT dbo.PHONGCHIEU OFF;

END;
GO
