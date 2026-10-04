SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Room_Update
(
    @NguoiDungID INT,
    @PhongID INT,
    @TenPhong NVARCHAR(100),
    @LoaiPhong NVARCHAR(50),
    @TrangThai NVARCHAR(50)
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_PHONG') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    DECLARE @RapID INT;
    SELECT @RapID = RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;

    IF @RapID IS NULL
    BEGIN
        ;THROW 50052, N'Phòng chiếu không tồn tại.', 1;
    END

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp chứa phòng này.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID = @RapID AND TenPhong = @TenPhong AND PhongID <> @PhongID)
    BEGIN
        ;THROW 50051, N'Tên phòng chiếu đã trùng với phòng khác trong cùng rạp.', 1;
    END

    UPDATE dbo.PHONGCHIEU
    SET TenPhong = @TenPhong,
        LoaiPhong = @LoaiPhong,
        TrangThai = @TrangThai
    WHERE PhongID = @PhongID;

    SELECT PhongID, RapID, TenPhong, LoaiPhong, TrangThai
    FROM dbo.PHONGCHIEU
    WHERE PhongID = @PhongID;
END;
GO
