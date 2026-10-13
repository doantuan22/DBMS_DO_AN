SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Movie_GetDetail
(
    @PhimID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Recordset 1: Thông tin cơ bản phim
    SELECT
        p.PhimID,
        p.TenPhim,
        p.ThoiLuong,
        p.NgayKhoiChieu,
        p.NgayKetThuc,
        p.NgonNgu,
        p.PhuDe,
        p.DoTuoi,
        p.DaoDien,
        p.MoTa,
        p.PosterURL,
        p.TrailerURL,
        p.TrangThai,
        tp.DiemDanhGiaTrungBinh,
        tp.SoLuotDanhGia
    FROM dbo.PHIM p
    LEFT JOIN dbo.vw_ThongKePhim tp ON p.PhimID = tp.PhimID
    WHERE p.PhimID = @PhimID;

    -- Recordset 2: Thể loại
    SELECT t.TheLoaiID, t.TenTheLoai
    FROM dbo.PHIM_THELOAI pt
    INNER JOIN dbo.THELOAI t ON pt.TheLoaiID = t.TheLoaiID
    WHERE pt.PhimID = @PhimID;

    -- Recordset 3: Diễn viên
    SELECT dv.DienVienID, dv.HoTen, dv.QuocTich, pd.VaiDien
    FROM dbo.PHIM_DIENVIEN pd
    INNER JOIN dbo.DIENVIEN dv ON pd.DienVienID = dv.DienVienID
    WHERE pd.PhimID = @PhimID;

    -- Recordset 4: Đánh giá gần đây
    SELECT TOP 10
        dg.DanhGiaID,
        nd.HoTen AS NguoiDanhGia,
        dg.SoSao,
        dg.NoiDung,
        dg.NgayDanhGia
    FROM dbo.DANHGIAPHIM dg
    INNER JOIN dbo.NGUOIDUNG nd ON dg.NguoiDungID = nd.NguoiDungID
    WHERE dg.PhimID = @PhimID
    ORDER BY dg.NgayDanhGia DESC;
END;
GO
