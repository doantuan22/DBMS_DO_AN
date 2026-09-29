-- ============================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP
-- KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY
-- SCRIPT 07: DỮ LIỆU MẪU ĐẦY ĐỦ (SEED DATA)
-- CUNG CẤP TÀI KHOẢN 4 VAI TRÒ, RẠP, PHÒNG, GHẾ, PHIM, SUẤT CHIẾU,
-- BẢNG GIÁ, SẢN PHẨM, KHUYẾN MÃI, ĐƠN MẪU, REVIEW VÀ KHIẾU NẠI
-- ============================================================================

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- XÓA DỮ LIỆU CŨ TRƯỚC KHI RE-SEED ĐẢM BẢO TÍNH TOÀN VẸN
DELETE FROM dbo.XULY_KHIEUNAI;
DELETE FROM dbo.KHIEUNAI;
DELETE FROM dbo.DANHGIAPHIM;
DELETE FROM dbo.THANHTOAN;
DELETE FROM dbo.CHITIETDOAN;
DELETE FROM dbo.SANPHAM;
DELETE FROM dbo.CHITIETVE;
DELETE FROM dbo.DONDATVE;
DELETE FROM dbo.KHUYENMAI;
DELETE FROM dbo.BANGGIA;
DELETE FROM dbo.SUATCHIEU;
DELETE FROM dbo.PHIM_DIENVIEN;
DELETE FROM dbo.DIENVIEN;
DELETE FROM dbo.PHIM_THELOAI;
DELETE FROM dbo.THELOAI;
DELETE FROM dbo.PHIM;
DELETE FROM dbo.GHE;
DELETE FROM dbo.PHONGCHIEU;
DELETE FROM dbo.PHANCONG_RAP;
DELETE FROM dbo.RAPCHIEUPHIM;
DELETE FROM dbo.HOSOKHACHHANG;
DELETE FROM dbo.NGUOIDUNG;
DELETE FROM dbo.VAITRO_QUYEN;
DELETE FROM dbo.QUYEN;
DELETE FROM dbo.VAITRO;
GO

-- 1. SEED VAITRO (4 Vai trò chính)
SET IDENTITY_INSERT dbo.VAITRO ON;
INSERT INTO dbo.VAITRO (VaiTroID, MaVaiTro, TenVaiTro, MoTa) VALUES
(1, 'ADMIN', N'Quản trị viên', N'Toàn quyền quản trị hệ thống, tài khoản, cấu hình và báo cáo'),
(2, 'QUAN_LY_RAP', N'Quản lý rạp', N'Quản lý phòng chiếu, ghế, suất chiếu và giá vé trong phạm vi rạp được phân công'),
(3, 'CSKH', N'Chăm sóc khách hàng', N'Tiếp nhận, tra cứu và xử lý khiếu nại của khách hàng'),
(4, 'KHACH_HANG', N'Khách hàng', N'Người dùng đặt vé xem phim, mua đồ ăn, đánh giá và gửi khiếu nại');
SET IDENTITY_INSERT dbo.VAITRO OFF;
GO

-- 2. SEED QUYEN (Danh mục quyền chức năng)
SET IDENTITY_INSERT dbo.QUYEN ON;
INSERT INTO dbo.QUYEN (QuyenID, MaQuyen, TenQuyen, MoTa) VALUES
-- Khách hàng
(1, 'XEM_PHIM', N'Xem thông tin phim và lịch chiếu', N'Khách hàng xem danh mục phim, lịch chiếu'),
(2, 'DAT_VE', N'Đặt vé xem phim', N'Chọn ghế, áp dụng khuyến mãi, tạo đơn đặt vé'),
(3, 'THANH_TOAN', N'Thanh toán đơn hàng', N'Thực hiện thanh toán trực tuyến cho vé và đồ ăn'),
(4, 'DANH_GIA', N'Đánh giá phim đã xem', N'Gửi số sao và nhận xét cho phim đã xem'),
(5, 'GUI_KHIEU_NAI', N'Gửi khiếu nại', N'Tạo khiếu nại gửi bộ phận chăm sóc khách hàng'),
-- Quản lý rạp
(6, 'QL_PHONG', N'Quản lý phòng chiếu rạp', N'Thêm, sửa phòng chiếu thuộc rạp phân công'),
(7, 'QL_GHE', N'Quản lý sơ đồ ghế rạp', N'Thêm, sửa sơ đồ ghế thuộc phòng chiếu'),
(8, 'QL_SUAT_CHIEU', N'Quản lý suất chiếu rạp', N'Lập lịch, điều chỉnh, hủy suất chiếu rạp'),
(9, 'QL_BANG_GIA', N'Cấu hình bảng giá rạp', N'Cài đặt phụ thu bảng giá rạp'),
(10, 'XEM_BAO_CAO_RAP', N'Xem báo cáo doanh thu rạp', N'Xem thống kê doanh thu rạp phân công'),
-- CSKH
(11, 'QL_KHIEUNAI', N'Xem danh sách khiếu nại', N'Truy cập hàng đợi khiếu nại'),
(12, 'XULY_KHIEUNAI', N'Ghi nhận xử lý khiếu nại', N'Ghi nhận tiến trình và đổi trạng thái khiếu nại'),
(13, 'TRA_CUU_DON', N'Tra cứu đơn tham chiếu', N'Xem thông tin đơn đặt vé liên quan đến khiếu nại'),
-- Admin
(14, 'QL_NGUOIDUNG', N'Quản lý tài khoản', N'Xem, khóa, mở khóa, tạo tài khoản'),
(15, 'QL_VAITRO', N'Quản lý vai trò', N'Thêm, sửa danh mục vai trò'),
(16, 'QL_QUYEN', N'Quản lý quyền', N'Quản lý danh mục quyền và gán quyền'),
(17, 'PHANCONG_RAP', N'Phân công quản lý rạp', N'Gán rạp quản lý cho tài khoản quản lý rạp'),
(18, 'QL_RAP', N'Quản lý rạp chiếu phim', N'Thêm, sửa rạp trên toàn hệ thống'),
(19, 'QL_DANHMUC_PHIM', N'Quản lý phim', N'Thêm, sửa, xóa danh mục phim và diễn viên'),
(20, 'QL_THELOAI', N'Quản lý thể loại', N'Thêm, sửa thể loại phim'),
(21, 'QL_SANPHAM', N'Quản lý sản phẩm đồ ăn', N'Thêm, sửa giá sản phẩm ăn uống'),
(22, 'QL_KHUYENMAI', N'Quản lý khuyến mãi', N'Tạo và cấu hình mã giảm giá'),
(23, 'XEM_BAO_CAO_TOANHE', N'Báo cáo doanh thu toàn hệ thống', N'Xem doanh thu toàn chuỗi rạp'),
(24, 'CAU_HINH_HETHONG', N'Cấu hình hệ thống', N'Quản lý các thông số cấu hình hệ thống');
SET IDENTITY_INSERT dbo.QUYEN OFF;
GO

-- 3. SEED VAITRO_QUYEN (Gán quyền cho 4 Vai trò)
-- Khách hàng: QuyenID 1..5
INSERT INTO dbo.VAITRO_QUYEN (VaiTroID, QuyenID) VALUES
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5);

-- Quản lý rạp: QuyenID 1..3, 6..10
INSERT INTO dbo.VAITRO_QUYEN (VaiTroID, QuyenID) VALUES
(2, 1), (2, 2), (2, 3), (2, 6), (2, 7), (2, 8), (2, 9), (2, 10);

-- CSKH: QuyenID 1, 11..13
INSERT INTO dbo.VAITRO_QUYEN (VaiTroID, QuyenID) VALUES
(3, 1), (3, 11), (3, 12), (3, 13);

-- Admin: Toàn bộ quyền 1..24
INSERT INTO dbo.VAITRO_QUYEN (VaiTroID, QuyenID)
SELECT 1, QuyenID FROM dbo.QUYEN;
GO

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
GO

INSERT INTO dbo.HOSOKHACHHANG (NguoiDungID, NgaySinh, GioiTinh, DiemTichLuy) VALUES
(5, '2002-05-15', N'Nam', 150),
(6, '2001-08-20', N'Nam', 80),
(7, '2003-11-10', N'Nam', 45),
(8, '2002-03-25', N'Nam', 0);
GO

-- 5. SEED RAPCHIEUPHIM (3 Rạp chiếu)
SET IDENTITY_INSERT dbo.RAPCHIEUPHIM ON;
INSERT INTO dbo.RAPCHIEUPHIM (RapID, TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai) VALUES
(1, N'Cinema Star Hai Bà Trưng', N'123 Hai Bà Trưng, Phường Bến Nghé, Quận 1', N'Hồ Chí Minh', '02838220001', N'Cụm rạp flagship trung tâm Sài Gòn với phòng chiếu IMAX hiện đại', '2024-01-01', N'Hoạt động'),
(2, N'Cinema Star Landmark', N'208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh', N'Hồ Chí Minh', '02838220002', N'Rạp chiếu phim cao cấp tại Landmark với màn hình ScreenX 270 độ', '2024-06-01', N'Hoạt động'),
(3, N'Cinema Star Times City', N'458 Minh Khai, Vĩnh Tuy, Hai Bà Trưng', N'Hà Nội', '02438220003', N'Cụm rạp tiêu chuẩn quốc tế lớn nhất miền Bắc', '2024-03-01', N'Hoạt động');
SET IDENTITY_INSERT dbo.RAPCHIEUPHIM OFF;
GO

-- 6. SEED PHANCONG_RAP (Gán quyền quản lý rạp)
INSERT INTO dbo.PHANCONG_RAP (NguoiDungID, RapID, NgayBatDau, NgayKetThuc, TrangThai) VALUES
(2, 1, '2026-01-01', '2027-12-31', N'Hiệu lực'), -- Manager 1 quản lý Rạp 1
(3, 2, '2026-01-01', '2027-12-31', N'Hiệu lực'); -- Manager 2 quản lý Rạp 2
GO

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
GO

-- 8. SEED GHE (Sinh ghế chi tiết cho Phòng 1, 2, 3, 4, 5, 6)
-- Tạo ghế cho Phòng 1 (5 hàng A..E, mỗi hàng 8 ghế = 40 ghế)
DECLARE @p INT;
DECLARE @h INT;
DECLARE @s INT;
DECLARE @hChar CHAR(1);
DECLARE @lGhe NVARCHAR(50);

SET @p = 1;
WHILE @p <= 6
BEGIN
    SET @h = 1;
    WHILE @h <= 5
    BEGIN
        SET @hChar = CHAR(64 + @h); -- A, B, C, D, E
        IF @h IN (1, 2) SET @lGhe = N'Thường';
        ELSE IF @h IN (3, 4) SET @lGhe = N'VIP';
        ELSE SET @lGhe = N'Sweetbox';

        SET @s = 1;
        WHILE @s <= 8
        BEGIN
            INSERT INTO dbo.GHE (PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai)
            VALUES (@p, @hChar, @s, @lGhe, N'Hoạt động');
            SET @s = @s + 1;
        END
        SET @h = @h + 1;
    END
    SET @p = @p + 1;
END;
GO

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
GO

-- 10. SEED DIENVIEN
SET IDENTITY_INSERT dbo.DIENVIEN ON;
INSERT INTO dbo.DIENVIEN (DienVienID, HoTen, NgaySinh, QuocTich) VALUES
(1, N'Tom Cruise', '1962-07-03', N'Mỹ'),
(2, N'Cillian Murphy', '1976-05-25', N'Ireland'),
(3, N'Margot Robbie', '1990-07-02', N'Úc'),
(4, N'Trấn Thành', '1987-02-05', N'Việt Nam'),
(5, N'Phương Anh Đào', '1992-04-30', N'Việt Nam'),
(6, N'Tuấn Trần', '1992-11-20', N'Việt Nam');
SET IDENTITY_INSERT dbo.DIENVIEN OFF;
GO

-- 11. SEED PHIM
SET IDENTITY_INSERT dbo.PHIM ON;
INSERT INTO dbo.PHIM (PhimID, TenPhim, ThoiLuong, NgayKhoiChieu, NgayKetThuc, NgonNgu, PhuDe, DoTuoi, DaoDien, MoTa, PosterURL, TrailerURL, TrangThai) VALUES
(1, N'Dune: Hành Tinh Cát - Phần Hai', 166, '2026-01-01', '2026-12-31', N'Tiếng Anh', N'Phụ đề Tiếng Việt', N'T16', N'Denis Villeneuve', N'Paul Atreides hợp lực cùng Chani và tộc người Fremen để trả thù những kẻ đã hủy diệt gia đình anh.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800', 'https://youtube.com/watch?v=Way9Dexny3w', N'Đang chiếu'),
(2, N'Mai', 131, '2026-01-10', '2026-12-31', N'Tiếng Việt', N'Phụ đề Tiếng Anh', N'T18', N'Trấn Thành', N'Mai là một người phụ nữ làm nghề massage trị liệu với nhiều vết thương tâm hồn, tìm kiếm hạnh phúc bên chàng trai Dương.', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800', 'https://youtube.com/watch?v=exampleMai', N'Đang chiếu'),
(3, N'Oppenheimer', 180, '2025-12-01', '2026-06-30', N'Tiếng Anh', N'Phụ đề Tiếng Việt', N'T18', N'Christopher Nolan', N'Câu chuyện về nhà vật lý lý thuyết J. Robert Oppenheimer, cha đẻ của bom nguyên tử trong Thế chiến II.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800', 'https://youtube.com/watch?v=uYPbbksJxIg', N'Đang chiếu'),
(4, N'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô', 110, '2026-03-01', '2026-12-31', N'Tiếng Nhật', N'Phụ đề Tiếng Việt & Lồng tiếng', N'P', N'Nagaoka Chika', N'Cuộc đối đầu kịch tính tại Hakodate giữa Conan, Siêu đạo chích Kid và kiếm thủ Hattori Heiji.', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800', 'https://youtube.com/watch?v=exampleConan', N'Đang chiếu');
SET IDENTITY_INSERT dbo.PHIM OFF;
GO

-- 12. SEED PHIM_THELOAI & PHIM_DIENVIEN
INSERT INTO dbo.PHIM_THELOAI (PhimID, TheLoaiID) VALUES
(1, 1), (1, 2), -- Dune: Hành động, Khoa học viễn tưởng
(2, 6), (2, 7), -- Mai: Tình cảm, Tâm lý
(3, 7),         -- Oppenheimer: Tâm lý - Kịch tính
(4, 5), (4, 1); -- Conan: Hoạt hình, Hành động
GO

INSERT INTO dbo.PHIM_DIENVIEN (PhimID, DienVienID, VaiDien) VALUES
(2, 4, N'Ông Hoàng'),
(2, 5, N'Mai'),
(2, 6, N'Dương'),
(3, 2, N'J. Robert Oppenheimer');
GO

-- 13. SEED BANGGIA (Cấu hình phụ thu rạp)
INSERT INTO dbo.BANGGIA (RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai) VALUES
(1, N'VIP', N'Tất cả', N'Tất cả', 15000, '2026-01-01', NULL, N'Áp dụng'),
(1, N'Sweetbox', N'Tất cả', N'Tất cả', 30000, '2026-01-01', NULL, N'Áp dụng'),
(1, N'Tất cả', N'Cuối tuần', N'Tất cả', 10000, '2026-01-01', NULL, N'Áp dụng'),
(1, N'Tất cả', N'Tất cả', N'IMAX', 50000, '2026-01-01', NULL, N'Áp dụng'),
(2, N'VIP', N'Tất cả', N'Tất cả', 15000, '2026-01-01', NULL, N'Áp dụng'),
(2, N'Sweetbox', N'Tất cả', N'Tất cả', 25000, '2026-01-01', NULL, N'Áp dụng'),
(3, N'VIP', N'Tất cả', N'Tất cả', 10000, '2026-01-01', NULL, N'Áp dụng');
GO

-- 14. SEED SUATCHIEU
-- Tạo các suất chiếu: 1 suất trong quá khứ (để demo review) và các suất tương lai (để demo đặt vé)
SET IDENTITY_INSERT dbo.SUATCHIEU ON;
INSERT INTO dbo.SUATCHIEU (SuatChieuID, PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai) VALUES
-- Suất 1: Trong quá khứ (Dành cho kiểm thử Đánh giá phim đã xem)
(1, 1, 1, '2026-02-10 18:00:00', '2026-02-10 20:46:00', N'2D', 80000, N'Hoàn thành'),
-- Suất 2: Ngày mai rạp 1 phòng 1
(2, 1, 1, DATEADD(HOUR, 2, SYSDATETIME()), DATEADD(MINUTE, 286, SYSDATETIME()), N'2D', 85000, N'Mở bán'),
-- Suất 3: Ngày mai rạp 1 phòng 2 IMAX
(3, 1, 2, DATEADD(HOUR, 5, SYSDATETIME()), DATEADD(MINUTE, 466, SYSDATETIME()), N'IMAX', 120000, N'Mở bán'),
-- Suất 4: Phim Mai rạp 2 phòng 1
(4, 2, 4, DATEADD(HOUR, 3, SYSDATETIME()), DATEADD(MINUTE, 311, SYSDATETIME()), N'2D', 80000, N'Mở bán'),
-- Suất 5: Phim Conan rạp 3 phòng 1
(5, 4, 6, DATEADD(HOUR, 4, SYSDATETIME()), DATEADD(MINUTE, 350, SYSDATETIME()), N'2D', 75000, N'Mở bán');
SET IDENTITY_INSERT dbo.SUATCHIEU OFF;
GO

-- 15. SEED SANPHAM (Đồ ăn, thức uống, Combo)
SET IDENTITY_INSERT dbo.SANPHAM ON;
INSERT INTO dbo.SANPHAM (SanPhamID, TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai) VALUES
(1, N'Bắp rang bơ phô mai lớn', N'Bắp rang', 45000, N'Bắp ngô nở đều phủ ngập phô mai cheddar thơm lừng', 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400', N'Đang bán'),
(2, N'Bắp rang bơ Caramel vừa', N'Bắp rang', 40000, N'Vị ngọt ngào của sốt caramel truyền thống', 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400', N'Đang bán'),
(3, N'Coca-Cola tươi lớn', N'Nước ngọt', 30000, N'Ly nước ngọt có gas mát lạnh sảng khoái', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400', N'Đang bán'),
(4, N'Nước suối Dasani 500ml', N'Nước ngọt', 20000, N'Nước khoáng tinh khiết đóng chai', 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400', N'Đang bán'),
(5, N'Combo Couple (1 Bắp lớn + 2 Nước)', N'Combo', 95000, N'Gói tiết kiệm trọn vẹn trải nghiệm xem phim cho cặp đôi', 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400', N'Đang bán');
SET IDENTITY_INSERT dbo.SANPHAM OFF;
GO

-- 16. SEED KHUYENMAI
SET IDENTITY_INSERT dbo.KHUYENMAI ON;
INSERT INTO dbo.KHUYENMAI (KhuyenMaiID, MaCode, MoTa, LoaiGiamGia, GiaTriGiam, DonHangToiThieu, GiamToiDa, NgayBatDau, NgayKetThuc, SoLuong, SoLuongDaDung, TrangThai) VALUES
(1, 'CHAOBANMOI', N'Giảm 10% cho khách hàng mới', N'Phần trăm', 10.00, 100000, 50000, '2026-01-01', '2026-12-31', 1000, 15, N'Hoạt động'),
(2, 'GIAM30K', N'Giảm trực tiếp 30.000 đ cho đơn từ 150k', N'Số tiền', 30000, 150000, NULL, '2026-01-01', '2026-12-31', 500, 20, N'Hoạt động'),
(3, 'VIPMEMBER', N'Giảm 20% cho thành viên thân thiết', N'Phần trăm', 20.00, 200000, 100000, '2026-01-01', '2026-12-31', 200, 5, N'Hoạt động');
SET IDENTITY_INSERT dbo.KHUYENMAI OFF;
GO

-- 17. SEED DƠN ĐẶT VÉ, VÉ, THANH TOÁN (Lịch sử đã xem để test Đánh giá phim)
SET IDENTITY_INSERT dbo.DONDATVE ON;
INSERT INTO dbo.DONDATVE (DonDatVeID, NguoiDungID, SuatChieuID, KhuyenMaiID, NgayDat, TongTienVe, TongTienDoAn, TienGiamGia, TrangThai) VALUES
(1, 5, 1, 1, '2026-02-09 14:00:00', 80000, 30000, 11000, N'Đã thanh toán'),
(2, 6, 1, NULL, '2026-02-09 15:30:00', 80000, 0, 0, N'Đã thanh toán');
SET IDENTITY_INSERT dbo.DONDATVE OFF;
GO

-- Lấy ID của ghế A1 và A2 của phòng 1
DECLARE @GheA1 INT = (SELECT TOP 1 GheID FROM dbo.GHE WHERE PhongID = 1 AND HangGhe = 'A' AND SoGhe = 1);
DECLARE @GheA2 INT = (SELECT TOP 1 GheID FROM dbo.GHE WHERE PhongID = 1 AND HangGhe = 'A' AND SoGhe = 2);

INSERT INTO dbo.CHITIETVE (DonDatVeID, GheID, GiaVe, MaVe, TrangThai) VALUES
(1, @GheA1, 80000, 'TK-20260209-001', N'Đã sử dụng'),
(2, @GheA2, 80000, 'TK-20260209-002', N'Đã sử dụng');
GO

INSERT INTO dbo.CHITIETDOAN (DonDatVeID, SanPhamID, SoLuong, DonGia) VALUES
(1, 3, 1, 30000);
GO

INSERT INTO dbo.THANHTOAN (DonDatVeID, PhuongThuc, SoTien, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai, GhiChu) VALUES
(1, N'VNPAY', 99000, '2026-02-09 14:02:00', '2026-02-09 14:05:00', 'TXN-VNPAY-20260209-001', N'Thành công', N'Thanh toán hoàn tất'),
(2, N'MOMO', 80000, '2026-02-09 15:31:00', '2026-02-09 15:33:00', 'TXN-MOMO-20260209-002', N'Thành công', N'Thanh toán hoàn tất');
GO

-- 18. SEED DANHGIAPHIM (Khách hàng 5 đánh giá phim 1 vì đã xem suất chiếu 1)
INSERT INTO dbo.DANHGIAPHIM (PhimID, NguoiDungID, SoSao, NoiDung, NgayDanhGia) VALUES
(1, 5, 5, N'Phim kỹ xảo quá mãn nhãn, âm thanh sống động, xứng đáng siêu phẩm!', '2026-02-11 09:30:00');
GO

-- 19. SEED KHIEUNAI & XULY_KHIEUNAI
SET IDENTITY_INSERT dbo.KHIEUNAI ON;
INSERT INTO dbo.KHIEUNAI (KhieuNaiID, NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai) VALUES
(1, 5, 1, N'Chất lượng dịch vụ', N'Phòng chiếu máy lạnh hơi lạnh', N'Nhiệt độ phòng chiếu hơi lạnh trong suốt buổi chiếu, mong rạp điều chỉnh hợp lý hơn.', N'Thấp', '2026-02-11 10:00:00', N'Đã giải quyết'),
(2, 6, NULL, N'Hỗ trợ tài khoản', N'Cần hướng dẫn đổi số điện thoại', N'Tôi bị mất số điện thoại cũ nên cần hỗ trợ xác minh đổi số mới.', N'Trung bình', '2026-02-15 14:20:00', N'Mới');
SET IDENTITY_INSERT dbo.KHIEUNAI OFF;
GO

INSERT INTO dbo.XULY_KHIEUNAI (KhieuNaiID, NguoiXuLyID, NoiDungXuLy, NgayXuLy, TrangThaiSauXuLy) VALUES
(1, 4, N'Đã liên hệ quản lý rạp 1 để kiểm tra và cân chỉnh nhiệt độ điều hòa ở mức 24 độ C.', '2026-02-11 11:30:00', N'Đã giải quyết');
GO

PRINT N'>>> [07_seed_data.sql] Đã nạp dữ liệu mẫu (Seed Data) thành công cho toàn bộ hệ thống.';
GO
