SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Support_Complaint_GetOrderReference
(
    @NguoiDungID INT,
    @KhieuNaiID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('CSKH', 'ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_KHIEUNAI') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'TRA_CUU_DON') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)
        THROW 50061, N'Khiếu nại không tồn tại.', 1;
    DECLARE @DonDatVeID INT;
    SELECT @DonDatVeID = DonDatVeID FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID;
    IF @DonDatVeID IS NULL
    BEGIN
        SELECT N'Khiếu nại này không gắn với đơn đặt vé tham chiếu cụ thể nào.' AS [Message];
        RETURN;
    END;
    -- Resolve the order only from this complaint; there is no caller-supplied order ID.
    IF NOT EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID = @DonDatVeID)
        THROW 50030, N'Đơn tham chiếu không tồn tại.', 1;
    SELECT v.*, d.LyDoHuy, d.ThongBaoHuy, b.DiemBoiThuong, b.NgayBoiThuong
    FROM dbo.vw_ChiTietDonDatVe v
    INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID
    LEFT JOIN dbo.BOITHUONG_HUYSUAT b ON b.DonDatVeID = v.DonDatVeID
    WHERE v.DonDatVeID = @DonDatVeID;
    -- Preserve cancelled tickets and every payment attempt in the read contract.
    SELECT cv.VeID, cv.MaVe, g.GheID, g.HangGhe, g.SoGhe,
           g.HangGhe + CAST(g.SoGhe AS VARCHAR(10)) AS TenGhe, g.LoaiGhe,
           cv.GiaVe, cv.TrangThai AS TrangThaiVe
    FROM dbo.CHITIETVE cv INNER JOIN dbo.GHE g ON g.GheID = cv.GheID
    WHERE cv.DonDatVeID = @DonDatVeID ORDER BY cv.VeID;
    SELECT cda.ChiTietDoAnID, sp.SanPhamID, sp.TenSanPham, sp.LoaiSanPham,
           cda.SoLuong, cda.DonGia, cda.SoLuong * cda.DonGia AS ThanhTien
    FROM dbo.CHITIETDOAN cda INNER JOIN dbo.SANPHAM sp ON sp.SanPhamID = cda.SanPhamID
    WHERE cda.DonDatVeID = @DonDatVeID ORDER BY cda.ChiTietDoAnID;
    SELECT ThanhToanID, PhuongThuc, SoTien, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai, GhiChu
    FROM dbo.THANHTOAN WHERE DonDatVeID = @DonDatVeID ORDER BY ThanhToanID;
END;
GO
