SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Showtime_List

    @ActorID INT,
    @RapID INT = NULL, @TuNgay DATE = NULL, @DenNgay DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_SUAT_CHIEU') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    SELECT sc.SuatChieuID, sc.PhimID, p.TenPhim, sc.PhongID, pc.TenPhong, pc.RapID, r.TenRap,
           sc.ThoiGianBatDau, sc.ThoiGianKetThuc, sc.DinhDang, sc.GiaVeCoBan, sc.TrangThai
    FROM dbo.SUATCHIEU sc
    INNER JOIN dbo.PHONGCHIEU pc ON pc.PhongID = sc.PhongID
    INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = pc.RapID
    INNER JOIN dbo.PHIM p ON p.PhimID = sc.PhimID
    WHERE (@RapID IS NULL OR pc.RapID = @RapID)
      AND (@TuNgay IS NULL OR dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) >= @TuNgay)
      AND (@DenNgay IS NULL OR dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) <= @DenNgay)
    ORDER BY sc.ThoiGianBatDau DESC;
END;
GO
