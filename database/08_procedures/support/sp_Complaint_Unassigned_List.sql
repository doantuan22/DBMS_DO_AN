-- Lấy danh sách khiếu nại chưa phân công: sp_Complaint_Unassigned_List
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Complaint_Unassigned_List
    (
    @NguoiDungID INT,
    @LoaiKhieuNai NVARCHAR(100) = NULL,
    @SearchTerm NVARCHAR(100) = NULL,
    @MucDoUuTien NVARCHAR(50) = NULL
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

    -- Kiểm tra quyền QL_KHIEUNAI
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_KHIEUNAI') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    IF @MucDoUuTien IS NOT NULL
        AND @MucDoUuTien NOT IN (N'Thấp', N'Trung bình', N'Cao', N'Khẩn cấp')
        THROW 50405, N'Mức ưu tiên không hợp lệ.', 1;

    SELECT
        kn.KhieuNaiID,
        kn.NguoiGuiID,
        kn.HoTenNguoiGui,
        kn.EmailNguoiGui,
        kn.SoDienThoaiNguoiGui,
        kn.DonDatVeID,
        kn.LoaiKhieuNai,
        kn.TieuDe,
        kn.NoiDung,
        kn.MucDoUuTien,
        kn.NgayTao,
        kn.TrangThaiKhieuNai,
        kn.NhanVienPhuTrachID,
        kn.TenNhanVienPhuTrach,
        kn.SoLanXuLy,
        kn.NgayXuLyCuoi,
        kn.NguoiXuLyCuoi,
        kn.NoiDungXuLyCuoi
    FROM dbo.vw_DanhSachKhieuNai kn
    WHERE kn.NhanVienPhuTrachID IS NULL
      AND kn.TrangThaiKhieuNai NOT IN (N'Đã đóng', N'Từ chối', N'Đã giải quyết')
      AND (@LoaiKhieuNai IS NULL OR kn.LoaiKhieuNai = @LoaiKhieuNai)
      AND (@MucDoUuTien IS NULL OR kn.MucDoUuTien = @MucDoUuTien)
      AND (
          @SearchTerm IS NULL
          OR kn.TieuDe LIKE '%' + @SearchTerm + '%'
          OR kn.HoTenNguoiGui LIKE '%' + @SearchTerm + '%'
          OR kn.EmailNguoiGui LIKE '%' + @SearchTerm + '%'
      )
    ORDER BY
        CASE kn.MucDoUuTien
            WHEN N'Khẩn cấp' THEN 1
            WHEN N'Cao' THEN 2
            WHEN N'Trung bình' THEN 3
            ELSE 4
        END ASC,
        kn.NgayTao DESC;
END;

GO
