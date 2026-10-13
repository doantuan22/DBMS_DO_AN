SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Pricing_Create

    @ActorID INT,
    @RapID INT, @LoaiGhe NVARCHAR(50), @LoaiNgay NVARCHAR(50), @DinhDang NVARCHAR(50),
    @PhuThu DECIMAL(18,2), @NgayBatDau DATE, @NgayKetThuc DATE = NULL
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

    IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)
        THROW 50208, N'Rạp không tồn tại.', 1;
    IF @PhuThu < 0 OR (@NgayKetThuc IS NOT NULL AND @NgayKetThuc < @NgayBatDau)
        THROW 50209, N'Khoảng ngày hoặc phụ thu không hợp lệ.', 1;
    INSERT dbo.BANGGIA (RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai)
    VALUES (@RapID, @LoaiGhe, @LoaiNgay, @DinhDang, @PhuThu, @NgayBatDau, @NgayKetThuc, N'Áp dụng');
    SELECT GiaID, RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai
    FROM dbo.BANGGIA WHERE GiaID = SCOPE_IDENTITY();
END;
GO
