IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
DECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));
-- 1. SEED VAITRO (4 Vai trò chính)
SET IDENTITY_INSERT dbo.VAITRO ON;
INSERT INTO dbo.VAITRO (VaiTroID, MaVaiTro, TenVaiTro, MoTa) VALUES
(1, 'ADMIN', N'Quản trị viên', N'Toàn quyền quản trị hệ thống, tài khoản, cấu hình và báo cáo'),
(2, 'QUAN_LY_RAP', N'Quản lý rạp', N'Quản lý phòng chiếu, ghế, suất chiếu và giá vé trong phạm vi rạp được phân công'),
(3, 'CSKH', N'Chăm sóc khách hàng', N'Tiếp nhận, tra cứu và xử lý khiếu nại của khách hàng'),
(4, 'KHACH_HANG', N'Khách hàng', N'Người dùng đặt vé xem phim, mua đồ ăn, đánh giá và gửi khiếu nại');
SET IDENTITY_INSERT dbo.VAITRO OFF;

END;
GO
