IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 11. SEED PHIM
SET IDENTITY_INSERT dbo.PHIM ON;
INSERT INTO dbo.PHIM (PhimID, TenPhim, ThoiLuong, NgayKhoiChieu, NgayKetThuc, NgonNgu, PhuDe, DoTuoi, DaoDien, MoTa, PosterURL, TrailerURL, TrangThai) VALUES
(1, N'Dune: Hành Tinh Cát - Phần Hai', 166, DATEADD(DAY,-30,@SeedDay), DATEADD(YEAR,1,@SeedDay), N'Tiếng Anh', N'Phụ đề Tiếng Việt', N'T16', N'Denis Villeneuve', N'Paul Atreides hợp lực cùng Chani và tộc người Fremen để trả thù những kẻ đã hủy diệt gia đình anh.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800', 'https://youtube.com/watch?v=Way9Dexny3w', N'Đang chiếu'),
(2, N'Mai', 131, DATEADD(DAY,-30,@SeedDay), DATEADD(YEAR,1,@SeedDay), N'Tiếng Việt', N'Phụ đề Tiếng Anh', N'T18', N'Trấn Thành', N'Mai là một người phụ nữ làm nghề massage trị liệu với nhiều vết thương tâm hồn, tìm kiếm hạnh phúc bên chàng trai Dương.', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800', 'https://youtube.com/watch?v=exampleMai', N'Đang chiếu'),
(3, N'Oppenheimer', 180, DATEADD(DAY,-30,@SeedDay), DATEADD(YEAR,1,@SeedDay), N'Tiếng Anh', N'Phụ đề Tiếng Việt', N'T18', N'Christopher Nolan', N'Câu chuyện về nhà vật lý lý thuyết J. Robert Oppenheimer, cha đẻ của bom nguyên tử trong Thế chiến II.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800', 'https://youtube.com/watch?v=uYPbbksJxIg', N'Đang chiếu'),
(4, N'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô', 110, DATEADD(DAY,-30,@SeedDay), DATEADD(YEAR,1,@SeedDay), N'Tiếng Nhật', N'Phụ đề Tiếng Việt & Lồng tiếng', N'P', N'Nagaoka Chika', N'Cuộc đối đầu kịch tính tại Hakodate giữa Conan, Siêu đạo chích Kid và kiếm thủ Hattori Heiji.', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800', 'https://youtube.com/watch?v=exampleConan', N'Đang chiếu');
SET IDENTITY_INSERT dbo.PHIM OFF;

END;
GO
