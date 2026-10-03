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

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
        THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền truy cập rạp này.', 1;

    SELECT sc.SuatChieuID, sc.PhimID, p.TenPhim, sc.PhongID, pc.TenPhong, pc.RapID, r.TenRap,
           sc.ThoiGianBatDau, sc.ThoiGianKetThuc, sc.DinhDang, sc.GiaVeCoBan, sc.TrangThai
    FROM dbo.SUATCHIEU sc
    INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
    INNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID
    INNER JOIN dbo.PHIM p ON sc.PhimID = p.PhimID
    WHERE pc.RapID = @RapID
      AND (@TuNgay IS NULL OR CAST(sc.ThoiGianBatDau AS DATE) >= @TuNgay)
      AND (@DenNgay IS NULL OR CAST(sc.ThoiGianBatDau AS DATE) <= @DenNgay)
    ORDER BY sc.ThoiGianBatDau DESC;
END;
GO
