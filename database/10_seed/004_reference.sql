IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 4. SEED NGUOIDUNG & HOSOKHACHHANG (Tài khoản mẫu 4 vai trò)
-- Mật khẩu mặc định của mọi tài khoản demo: 123456 (lưu dạng bcrypt hash; backend so sánh bằng bcrypt)
SET IDENTITY_INSERT dbo.NGUOIDUNG ON;
INSERT INTO dbo.NGUOIDUNG (NguoiDungID, VaiTroID, HoTen, Email, MatKhau, SoDienThoai, NgayTao, TrangThai) VALUES
(1, 1, N'Quản trị viên Hệ thống', 'admin@cinemadb.vn', '$2b$10$8tgi4pX7cNyczr/vOe6iy.ZXU6zs3NgNeu/myqJoRLM1oDpz8Jk/S', '0901000001', '2026-01-01', N'Hoạt động'),
(2, 2, N'Nguyễn Văn Quản Lý 1', 'manager.q1@cinemadb.vn', '$2b$10$8tgi4pX7cNyczr/vOe6iy.ZXU6zs3NgNeu/myqJoRLM1oDpz8Jk/S', '0902000001', '2026-01-05', N'Hoạt động'),
(3, 2, N'Trần Thị Quản Lý 2', 'manager.binhthanh@cinemadb.vn', '$2b$10$8tgi4pX7cNyczr/vOe6iy.ZXU6zs3NgNeu/myqJoRLM1oDpz8Jk/S', '0902000002', '2026-01-05', N'Hoạt động'),
(4, 3, N'Lê Thị Chăm Sóc KH', 'cskh@cinemadb.vn', '$2b$10$8tgi4pX7cNyczr/vOe6iy.ZXU6zs3NgNeu/myqJoRLM1oDpz8Jk/S', '0903000001', '2026-01-10', N'Hoạt động'),
(5, 4, N'Đoàn Anh Tuấn', 'khachhang1@gmail.com', '$2b$10$8tgi4pX7cNyczr/vOe6iy.ZXU6zs3NgNeu/myqJoRLM1oDpz8Jk/S', '0904000001', '2026-02-01', N'Hoạt động'),
(6, 4, N'Ung Văn Trí', 'khachhang2@gmail.com', '$2b$10$8tgi4pX7cNyczr/vOe6iy.ZXU6zs3NgNeu/myqJoRLM1oDpz8Jk/S', '0904000002', '2026-02-05', N'Hoạt động'),
(7, 4, N'Lý Đông Thịnh', 'khachhang3@gmail.com', '$2b$10$8tgi4pX7cNyczr/vOe6iy.ZXU6zs3NgNeu/myqJoRLM1oDpz8Jk/S', '0904000003', '2026-02-10', N'Hoạt động'),
(8, 4, N'Ngô Anh Bằng', 'khachhang4@gmail.com', '$2b$10$8tgi4pX7cNyczr/vOe6iy.ZXU6zs3NgNeu/myqJoRLM1oDpz8Jk/S', '0904000004', '2026-02-15', N'Hoạt động');
SET IDENTITY_INSERT dbo.NGUOIDUNG OFF;

INSERT INTO dbo.HOSOKHACHHANG (NguoiDungID, NgaySinh, GioiTinh, DiemTichLuy) VALUES
(5, '2002-05-15', N'Nam', 150),
(6, '2001-08-20', N'Nam', 80),
(7, '2003-11-10', N'Nam', 45),
(8, '2002-03-25', N'Nam', 0);

END;
GO
