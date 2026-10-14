-- Tra cứu lịch sử phân công khiếu nại: sp_Complaint_Assignment_History
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Complaint_Assignment_History
    (
    @NguoiDungID INT,
    @KhieuNaiID INT
    )
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra tài khoản
    IF NOT EXISTS (
        SELECT 1 FROM dbo.NGUOIDUNG
        WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;

    -- Kiểm tra vai trò CSKH hoặc ADMIN
    IF NOT EXISTS (
        SELECT 1 FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('CSKH', 'ADMIN')
    )
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;

    -- Kiểm tra quyền QL_KHIEUNAI
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_KHIEUNAI') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)
        THROW 50061, N'Khiếu nại không tồn tại.', 1;

    SELECT
        ls.LichSuID,
        ls.KhieuNaiID,
        ls.NhanVienCuID,
        nd_cu.HoTen AS TenNhanVienCu,
        ls.NhanVienMoiID,
        nd_moi.HoTen AS TenNhanVienMoi,
        ls.NguoiThucHienID,
        nd_th.HoTen AS TenNguoiThucHien,
        vt_th.TenVaiTro AS VaiTroNguoiThucHien,
        ls.ThoiGian,
        ls.LyDo
    FROM dbo.LICHSU_PHANCONG_KHIEUNAI ls
    LEFT JOIN dbo.NGUOIDUNG nd_cu ON nd_cu.NguoiDungID = ls.NhanVienCuID
    LEFT JOIN dbo.NGUOIDUNG nd_moi ON nd_moi.NguoiDungID = ls.NhanVienMoiID
    INNER JOIN dbo.NGUOIDUNG nd_th ON nd_th.NguoiDungID = ls.NguoiThucHienID
    INNER JOIN dbo.VAITRO vt_th ON vt_th.VaiTroID = nd_th.VaiTroID
    WHERE ls.KhieuNaiID = @KhieuNaiID
    ORDER BY ls.ThoiGian ASC, ls.LichSuID ASC;
END;

GO
