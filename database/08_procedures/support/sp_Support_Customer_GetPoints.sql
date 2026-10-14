-- Tra cứu điểm tích lũy và bồi thường của khách hàng: sp_Support_Customer_GetPoints
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Support_Customer_GetPoints
    (
    @NguoiDungID INT,
    @KhachHangID INT
    )
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra tài khoản người gọi
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

    -- Kiểm tra quyền TRA_CUU_DON
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'TRA_CUU_DON') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    -- Kiểm tra khách hàng mục tiêu
    IF NOT EXISTS (
        SELECT 1 FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE nd.NguoiDungID = @KhachHangID AND vt.MaVaiTro = 'KHACH_HANG'
    )
        THROW 50030, N'Khách hàng không tồn tại.', 1;

    -- Recordset 1: Thông tin khách hàng & điểm hiện tại
    SELECT
        nd.NguoiDungID AS KhachHangID,
        nd.HoTen,
        nd.Email,
        nd.SoDienThoai,
        ISNULL(hs.DiemTichLuy, 0) AS DiemHienTai,
        ISNULL((
            SELECT SUM(d.DiemSuDung)
            FROM dbo.DONDATVE d
            WHERE d.NguoiDungID = @KhachHangID
              AND d.TrangThai IN (N'Đã thanh toán', N'Hoàn thành')
        ), 0) AS TongDiemDaSuDung,
        ISNULL((
            SELECT SUM(b.DiemBoiThuong)
            FROM dbo.BOITHUONG_HUYSUAT b
            INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = b.DonDatVeID
            WHERE d.NguoiDungID = @KhachHangID
        ), 0) AS TongDiemBoiThuong
    FROM dbo.NGUOIDUNG nd
    LEFT JOIN dbo.HOSOKHACHHANG hs ON hs.NguoiDungID = nd.NguoiDungID
    WHERE nd.NguoiDungID = @KhachHangID;

    -- Recordset 2: Lịch sử đơn có biến động điểm (sử dụng điểm hoặc nhận bồi thường)
    SELECT
        d.DonDatVeID,
        d.NgayDat,
        d.TrangThai,
        d.TongTienVe,
        d.TongTienDoAn,
        d.TienGiamGia,
        d.DiemSuDung,
        b.DiemBoiThuong,
        b.NgayBoiThuong,
        b.GhiChu AS GhiChuBoiThuong
    FROM dbo.DONDATVE d
    LEFT JOIN dbo.BOITHUONG_HUYSUAT b ON b.DonDatVeID = d.DonDatVeID
    WHERE d.NguoiDungID = @KhachHangID
      AND (d.DiemSuDung > 0 OR b.BoiThuongID IS NOT NULL)
    ORDER BY d.NgayDat DESC;
END;

GO
