SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Seat_Create

    @ActorID INT,
    @PhongID INT, @HangGhe VARCHAR(10), @SoGhe INT, @LoaiGhe NVARCHAR(50) = N'Thường'
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_GHE') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID)
        THROW 50204, N'Phòng không tồn tại.', 1;
    IF EXISTS (SELECT 1 FROM dbo.GHE WHERE PhongID = @PhongID AND HangGhe = @HangGhe AND SoGhe = @SoGhe)
        THROW 50205, N'Vị trí ghế đã tồn tại trong phòng.', 1;
    INSERT dbo.GHE (PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai)
    VALUES (@PhongID, @HangGhe, @SoGhe, @LoaiGhe, N'Hoạt động');
    SELECT GheID, PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai FROM dbo.GHE WHERE GheID = SCOPE_IDENTITY();
END;
GO
