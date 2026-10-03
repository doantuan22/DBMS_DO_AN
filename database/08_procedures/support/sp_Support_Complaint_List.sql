SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Support_Complaint_List
(
    @NguoiDungID INT,
    @TrangThai NVARCHAR(50) = NULL,
    @LoaiKhieuNai NVARCHAR(100) = NULL,
    @SearchTerm NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra quyền CSKH hoặc Admin
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_KHIEUNAI') = 0
       AND dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'XULY_KHIEUNAI') = 0
    BEGIN
        ;THROW 50060, N'Lỗi bảo mật: Bạn không có quyền truy cập danh sách khiếu nại.', 1;
    END

    SELECT
        KhieuNaiID,
        NguoiGuiID,
        HoTenNguoiGui,
        EmailNguoiGui,
        SoDienThoaiNguoiGui,
        DonDatVeID,
        LoaiKhieuNai,
        TieuDe,
        NoiDung,
        MucDoUuTien,
        NgayTao,
        TrangThaiKhieuNai,
        SoLanXuLy,
        NgayXuLyCuoi,
        NguoiXuLyCuoi,
        NoiDungXuLyCuoi
    FROM dbo.vw_DanhSachKhieuNai
    WHERE (@TrangThai IS NULL OR TrangThaiKhieuNai = @TrangThai)
      AND (@LoaiKhieuNai IS NULL OR LoaiKhieuNai = @LoaiKhieuNai)
      AND (@SearchTerm IS NULL OR TieuDe LIKE '%' + @SearchTerm + '%' OR HoTenNguoiGui LIKE '%' + @SearchTerm + '%' OR EmailNguoiGui LIKE '%' + @SearchTerm + '%')
    ORDER BY
        CASE MucDoUuTien WHEN N'Khẩn cấp' THEN 1 WHEN N'Cao' THEN 2 WHEN N'Trung bình' THEN 3 ELSE 4 END ASC,
        NgayTao DESC;
END;
GO
