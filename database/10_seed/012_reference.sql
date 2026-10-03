IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 12. SEED PHIM_THELOAI & PHIM_DIENVIEN
INSERT INTO dbo.PHIM_THELOAI (PhimID, TheLoaiID) VALUES
(1, 1), (1, 2), -- Dune: Hành động, Khoa học viễn tưởng
(2, 6), (2, 7), -- Mai: Tình cảm, Tâm lý
(3, 7),         -- Oppenheimer: Tâm lý - Kịch tính
(4, 5), (4, 1); -- Conan: Hoạt hình, Hành động

INSERT INTO dbo.PHIM_DIENVIEN (PhimID, DienVienID, VaiDien) VALUES
(2, 4, N'Ông Hoàng'),
(2, 5, N'Mai'),
(2, 6, N'Dương'),
(3, 2, N'J. Robert Oppenheimer');

END;
GO
