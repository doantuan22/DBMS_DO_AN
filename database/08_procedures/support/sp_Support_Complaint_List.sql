SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Support_Complaint_List
(
    @NguoiDungID INT,
    @TrangThai NVARCHAR(50) = NULL,
    @LoaiKhieuNai NVARCHAR(100) = NULL,
    @SearchTerm NVARCHAR(100) = NULL,
    @MucDoUuTien NVARCHAR(50) = NULL
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

    IF @MucDoUuTien IS NOT NULL AND @MucDoUuTien NOT IN (N'Thấp', N'Trung bình', N'Cao', N'Khẩn cấp')
        THROW 50405, N'Mức ưu tiên không hợp lệ.', 1;


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
      AND (@MucDoUuTien IS NULL OR MucDoUuTien = @MucDoUuTien)
      AND (@SearchTerm IS NULL OR TieuDe LIKE '%' + @SearchTerm + '%' OR HoTenNguoiGui LIKE '%' + @SearchTerm + '%' OR EmailNguoiGui LIKE '%' + @SearchTerm + '%')
    ORDER BY
        CASE MucDoUuTien WHEN N'Khẩn cấp' THEN 1 WHEN N'Cao' THEN 2 WHEN N'Trung bình' THEN 3 ELSE 4 END ASC,
        NgayTao DESC;
END;
GO
