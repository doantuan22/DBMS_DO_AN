-- Nhân viên CSKH theo dõi danh sách yêu cầu chuyển cấp: sp_Escalation_List_CSKH
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Escalation_List_CSKH
    (
    @NguoiDungID INT,
    @KhieuNaiID INT = NULL,
    @TrangThai NVARCHAR(50) = NULL
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

    -- Kiểm tra vai trò CSKH
    IF NOT EXISTS (
        SELECT 1 FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro = 'CSKH'
    )
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;

    -- Kiểm tra quyền CHUYENCAP_XEM
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'CHUYENCAP_XEM') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    SELECT
        yc.YeuCauID,
        yc.KhieuNaiID,
        kn.TieuDe AS TieuDeKhieuNai,
        kn.LoaiKhieuNai,
        kn.MucDoUuTien AS MucDoUuTienKhieuNai,
        nd_kh.HoTen AS HoTenKhachHang,
        yc.NguoiYeuCauID,
        nd_yc.HoTen AS TenNguoiYeuCau,
        yc.LyDo,
        yc.MucDoUuTien,
        yc.AdminPhuTrachID,
        nd_adm.HoTen AS TenAdminPhuTrach,
        yc.TrangThai,
        yc.ThoiGianGui,
        yc.ThoiGianTiepNhan,
        yc.KetQuaXuLy,
        yc.ThoiGianHoanTat
    FROM dbo.YEUCAU_CHUYENCAP yc
    INNER JOIN dbo.KHIEUNAI kn ON kn.KhieuNaiID = yc.KhieuNaiID
    INNER JOIN dbo.NGUOIDUNG nd_kh ON nd_kh.NguoiDungID = kn.NguoiDungID
    INNER JOIN dbo.NGUOIDUNG nd_yc ON nd_yc.NguoiDungID = yc.NguoiYeuCauID
    LEFT JOIN dbo.NGUOIDUNG nd_adm ON nd_adm.NguoiDungID = yc.AdminPhuTrachID
    WHERE (yc.NguoiYeuCauID = @NguoiDungID OR kn.NhanVienPhuTrachID = @NguoiDungID)
      AND (@KhieuNaiID IS NULL OR yc.KhieuNaiID = @KhieuNaiID)
      AND (@TrangThai IS NULL OR yc.TrangThai = @TrangThai)
    ORDER BY
        CASE yc.TrangThai
            WHEN N'Chờ tiếp nhận' THEN 1
            WHEN N'Đang xử lý' THEN 2
            ELSE 3
        END ASC,
        yc.ThoiGianGui DESC;
END;

GO
