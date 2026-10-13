SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Phase 7: manager-scoped showtime listing. No raw backend query is permitted.
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Showtime_List
(
    @NguoiDungID INT,
    @RapID INT,
    @TuNgay DATE = NULL,
    @DenNgay DATE = NULL
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_SUAT_CHIEU') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
        THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền truy cập rạp này.', 1;

    SELECT sc.SuatChieuID, sc.PhimID, p.TenPhim, sc.PhongID, pc.TenPhong, pc.RapID, r.TenRap,
           sc.ThoiGianBatDau, sc.ThoiGianKetThuc, sc.DinhDang, sc.GiaVeCoBan, sc.TrangThai
    FROM dbo.SUATCHIEU sc
    INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
    INNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID
    INNER JOIN dbo.PHIM p ON sc.PhimID = p.PhimID
    WHERE pc.RapID = @RapID
      AND (@TuNgay IS NULL OR dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) >= @TuNgay)
      AND (@DenNgay IS NULL OR dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) <= @DenNgay)
    ORDER BY sc.ThoiGianBatDau DESC;
END;
GO
