-- Xem chi tiết yêu cầu chuyển cấp: sp_Escalation_GetDetail
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Escalation_GetDetail
    (
    @NguoiDungID INT,
    @YeuCauID INT
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

    -- Kiểm tra quyền CHUYENCAP_XEM
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'CHUYENCAP_XEM') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    DECLARE @KhieuNaiID INT;
    SELECT @KhieuNaiID = KhieuNaiID FROM dbo.YEUCAU_CHUYENCAP WHERE YeuCauID = @YeuCauID;

    IF @KhieuNaiID IS NULL
        THROW 50700, N'Yêu cầu chuyển cấp không tồn tại.', 1;

    -- Recordset 1: Yêu cầu chuyển cấp
    SELECT
        yc.YeuCauID,
        yc.KhieuNaiID,
        kn.TieuDe AS TieuDeKhieuNai,
        kn.LoaiKhieuNai,
        yc.NguoiYeuCauID,
        nd_yc.HoTen AS NguoiYeuCau,
        nd_yc.Email AS EmailNguoiYeuCau,
        yc.LyDo,
        yc.MucDoUuTien,
        yc.AdminPhuTrachID,
        nd_adm.HoTen AS AdminPhuTrach,
        nd_adm.Email AS EmailAdminPhuTrach,
        yc.TrangThai,
        yc.ThoiGianGui,
        yc.ThoiGianTiepNhan,
        yc.KetQuaXuLy,
        yc.ThoiGianHoanTat
    FROM dbo.YEUCAU_CHUYENCAP yc
    INNER JOIN dbo.KHIEUNAI kn ON kn.KhieuNaiID = yc.KhieuNaiID
    INNER JOIN dbo.NGUOIDUNG nd_yc ON nd_yc.NguoiDungID = yc.NguoiYeuCauID
    LEFT JOIN dbo.NGUOIDUNG nd_adm ON nd_adm.NguoiDungID = yc.AdminPhuTrachID
    WHERE yc.YeuCauID = @YeuCauID;

    -- Recordset 2: Chi tiết khiếu nại liên quan
    SELECT
        kn.KhieuNaiID,
        kn.NguoiDungID AS NguoiGuiID,
        nd_kh.HoTen AS HoTenNguoiGui,
        kn.DonDatVeID,
        kn.LoaiKhieuNai,
        kn.TieuDe,
        kn.NoiDung,
        kn.MucDoUuTien,
        kn.NgayTao,
        kn.TrangThai AS TrangThaiKhieuNai,
        kn.NhanVienPhuTrachID,
        nd_nv.HoTen AS TenNhanVienPhuTrach,
        nd_nv.Email AS EmailNhanVienPhuTrach
    FROM dbo.KHIEUNAI kn
    INNER JOIN dbo.NGUOIDUNG nd_kh ON nd_kh.NguoiDungID = kn.NguoiDungID
    LEFT JOIN dbo.NGUOIDUNG nd_nv ON nd_nv.NguoiDungID = kn.NhanVienPhuTrachID
    WHERE kn.KhieuNaiID = @KhieuNaiID;

    -- Recordset 3: Toàn bộ tin nhắn trao đổi trong khiếu nại
    SELECT
        tn.TinNhanID,
        tn.KhieuNaiID,
        tn.NguoiGuiID,
        nd.HoTen AS HoTenNguoiGui,
        vt.MaVaiTro AS MaVaiTroNguoiGui,
        vt.TenVaiTro AS TenVaiTroNguoiGui,
        tn.NoiDung,
        tn.LoaiTinNhan,
        tn.ThoiGianGui
    FROM dbo.TINNHAN_KHIEUNAI tn
    INNER JOIN dbo.NGUOIDUNG nd ON nd.NguoiDungID = tn.NguoiGuiID
    INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
    WHERE tn.KhieuNaiID = @KhieuNaiID
    ORDER BY tn.ThoiGianGui ASC, tn.TinNhanID ASC;
END;

GO
