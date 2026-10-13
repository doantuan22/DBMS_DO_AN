IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
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
(23, 'XEM_BAO_CAO_TOANHE', N'Báo cáo doanh thu toàn hệ thống', N'Xem doanh thu toàn chuỗi rạp');
SET IDENTITY_INSERT dbo.QUYEN OFF;

END;
GO
