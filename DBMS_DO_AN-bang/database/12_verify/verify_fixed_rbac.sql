SET NOCOUNT ON;
-- Fixed source seed, including retained legacy permission codes for traceability.
DECLARE @ExpectedVAITRO TABLE (VaiTroID int,MaVaiTro varchar(50),TenVaiTro nvarchar(100),MoTa nvarchar(255));
INSERT INTO @ExpectedVAITRO VALUES
(1, 'ADMIN', N'Quản trị viên', N'Toàn quyền quản trị hệ thống, tài khoản, cấu hình và báo cáo'),
(2, 'QUAN_LY_RAP', N'Quản lý rạp', N'Quản lý phòng chiếu, ghế, suất chiếu và giá vé trong phạm vi rạp được phân công'),
(3, 'CSKH', N'Chăm sóc khách hàng', N'Tiếp nhận, tra cứu và xử lý khiếu nại của khách hàng'),
(4, 'KHACH_HANG', N'Khách hàng', N'Người dùng đặt vé xem phim, mua đồ ăn, đánh giá và gửi khiếu nại');
IF EXISTS(SELECT VaiTroID,MaVaiTro,TenVaiTro,MoTa FROM @ExpectedVAITRO EXCEPT SELECT VaiTroID,MaVaiTro,TenVaiTro,MoTa FROM dbo.VAITRO)
 OR EXISTS(SELECT VaiTroID,MaVaiTro,TenVaiTro,MoTa FROM dbo.VAITRO EXCEPT SELECT VaiTroID,MaVaiTro,TenVaiTro,MoTa FROM @ExpectedVAITRO)
 THROW 51057, 'Fixed RBAC catalog differs from approved seed. Reconcile explicitly before migration.',1;
DECLARE @ExpectedQUYEN TABLE (QuyenID int,MaQuyen varchar(50),TenQuyen nvarchar(100),MoTa nvarchar(255));
INSERT INTO @ExpectedQUYEN VALUES
(1, 'XEM_PHIM', N'Xem thông tin phim và lịch chiếu', N'Khách hàng xem danh mục phim, lịch chiếu'),
(2, 'DAT_VE', N'Đặt vé xem phim', N'Chọn ghế, áp dụng khuyến mãi, tạo đơn đặt vé'),
(3, 'THANH_TOAN', N'Thanh toán đơn hàng', N'Thực hiện thanh toán trực tuyến cho vé và đồ ăn'),
(4, 'DANH_GIA', N'Đánh giá phim đã xem', N'Gửi số sao và nhận xét cho phim đã xem'),
(5, 'GUI_KHIEU_NAI', N'Gửi khiếu nại', N'Tạo khiếu nại gửi bộ phận chăm sóc khách hàng'),
(6, 'QL_PHONG', N'Quản lý phòng chiếu rạp', N'Thêm, sửa phòng chiếu thuộc rạp phân công'),
(7, 'QL_GHE', N'Quản lý sơ đồ ghế rạp', N'Thêm, sửa sơ đồ ghế thuộc phòng chiếu'),
(8, 'QL_SUAT_CHIEU', N'Quản lý suất chiếu rạp', N'Lập lịch, điều chỉnh, hủy suất chiếu rạp'),
(9, 'QL_BANG_GIA', N'Cấu hình bảng giá rạp', N'Cài đặt phụ thu bảng giá rạp'),
(10, 'XEM_BAO_CAO_RAP', N'Xem báo cáo doanh thu rạp', N'Xem thống kê doanh thu rạp phân công'),
(11, 'QL_KHIEUNAI', N'Xem danh sách khiếu nại', N'Truy cập hàng đợi khiếu nại'),
(12, 'XULY_KHIEUNAI', N'Ghi nhận xử lý khiếu nại', N'Ghi nhận tiến trình và đổi trạng thái khiếu nại'),
(13, 'TRA_CUU_DON', N'Tra cứu đơn tham chiếu', N'Xem thông tin đơn đặt vé liên quan đến khiếu nại'),
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
IF EXISTS(SELECT QuyenID,MaQuyen,TenQuyen,MoTa FROM @ExpectedQUYEN EXCEPT SELECT QuyenID,MaQuyen,TenQuyen,MoTa FROM dbo.QUYEN)
 OR EXISTS(SELECT QuyenID,MaQuyen,TenQuyen,MoTa FROM dbo.QUYEN EXCEPT SELECT QuyenID,MaQuyen,TenQuyen,MoTa FROM @ExpectedQUYEN)
 THROW 51057, 'Fixed RBAC catalog differs from approved seed. Reconcile explicitly before migration.',1;
DECLARE @ExpectedMatrix TABLE(VaiTroID int,QuyenID int);
INSERT INTO @ExpectedMatrix VALUES
(4,1), (4,2), (4,3), (4,4), (4,5), (2,1), (2,2), (2,3), (2,6), (2,7), (2,8), (2,9), (2,10), (3,1), (3,11), (3,12), (3,13);
INSERT INTO @ExpectedMatrix SELECT 1,QuyenID FROM @ExpectedQUYEN;
IF EXISTS(SELECT VaiTroID,QuyenID FROM @ExpectedMatrix EXCEPT SELECT VaiTroID,QuyenID FROM dbo.VAITRO_QUYEN)
 OR EXISTS(SELECT VaiTroID,QuyenID FROM dbo.VAITRO_QUYEN EXCEPT SELECT VaiTroID,QuyenID FROM @ExpectedMatrix)
 THROW 51057, 'Fixed role-permission matrix differs from approved seed.',1;
PRINT 'PASS fixed RBAC seed: 4 roles, 23 permissions, 40 mappings';
GO
