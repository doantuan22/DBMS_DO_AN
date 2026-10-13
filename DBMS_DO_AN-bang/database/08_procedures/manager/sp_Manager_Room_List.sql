SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Room_List
(
    @NguoiDungID INT,
    @RapID INT
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


    -- Kiểm tra scope phân công
    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp này.', 1;
    END

    SELECT
        pc.PhongID,
        pc.RapID,
        r.TenRap,
        pc.TenPhong,
        pc.LoaiPhong,
        pc.TrangThai,
        (SELECT COUNT(*) FROM dbo.GHE g WHERE g.PhongID = pc.PhongID) AS TongSoGhe
    FROM dbo.PHONGCHIEU pc
    INNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID
    WHERE pc.RapID = @RapID
    ORDER BY pc.TenPhong;
END;
GO
