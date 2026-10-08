SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Pricing_Update
    @ActorID INT,
    @GiaID INT, @PhuThu DECIMAL(18,2), @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_BANG_GIA') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.BANGGIA WHERE GiaID = @GiaID)
        THROW 50210, N'Bảng giá không tồn tại.', 1;
    IF @PhuThu < 0 THROW 50209, N'Phụ thu không hợp lệ.', 1;
    UPDATE dbo.BANGGIA SET PhuThu = @PhuThu, TrangThai = @TrangThai WHERE GiaID = @GiaID;
    SELECT GiaID, RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai
    FROM dbo.BANGGIA WHERE GiaID = @GiaID;
END;
GO
