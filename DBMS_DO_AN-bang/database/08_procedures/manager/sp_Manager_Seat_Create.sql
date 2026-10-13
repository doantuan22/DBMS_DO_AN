SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Seat_Create
(
    @NguoiDungID INT,
    @PhongID INT,
    @HangGhe VARCHAR(10),
    @SoGhe INT,
    @LoaiGhe NVARCHAR(50) = N'Thường'
)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('QUAN_LY_RAP'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_GHE') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    DECLARE @RapID INT;
    SELECT @RapID = RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.GHE WHERE PhongID = @PhongID AND HangGhe = @HangGhe AND SoGhe = @SoGhe)
    BEGIN
        ;THROW 50054, N'Vị trí ghế này đã tồn tại trong phòng chiếu.', 1;
    END

    INSERT INTO dbo.GHE (PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai)
    VALUES (@PhongID, @HangGhe, @SoGhe, @LoaiGhe, N'Hoạt động');

    SELECT GheID, PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai
    FROM dbo.GHE
    WHERE GheID = SCOPE_IDENTITY();
END;
GO
