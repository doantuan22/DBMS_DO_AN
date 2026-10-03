IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 9. SEED THELOAI
SET IDENTITY_INSERT dbo.THELOAI ON;
INSERT INTO dbo.THELOAI (TheLoaiID, TenTheLoai) VALUES
(1, N'Hành động'),
(2, N'Khoa học viễn tưởng'),
(3, N'Kinh dị'),
(4, N'Hài kịch'),
(5, N'Hoạt hình'),
(6, N'Tình cảm'),
(7, N'Tâm lý - Kịch tính');
SET IDENTITY_INSERT dbo.THELOAI OFF;

END;
GO
