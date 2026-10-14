-- Quản trị viên tra cứu danh sách yêu cầu chuyển cấp: sp_Escalation_List_Admin
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Escalation_List_Admin
    (
    @AdminID INT,
    @TrangThai NVARCHAR(50) = NULL,
    @MucDoUuTien NVARCHAR(50) = NULL,
    @SearchTerm NVARCHAR(100) = NULL
    )
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra tài khoản Admin
    IF NOT EXISTS (
        SELECT 1 FROM dbo.NGUOIDUNG
        WHERE NguoiDungID = @AdminID AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;

    -- Kiểm tra vai trò ADMIN
    IF NOT EXISTS (
        SELECT 1 FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE nd.NguoiDungID = @AdminID AND vt.MaVaiTro = 'ADMIN'
    )
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;

    -- Kiểm tra quyền CHUYENCAP_XEM
    IF dbo.fn_KiemTraQuyenNguoiDung(@AdminID, 'CHUYENCAP_XEM') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    IF @MucDoUuTien IS NOT NULL
        AND @MucDoUuTien NOT IN (N'Thấp', N'Trung bình', N'Cao', N'Khẩn cấp')
        THROW 50405, N'Mức ưu tiên không hợp lệ.', 1;

    SELECT
        yc.YeuCauID,
        yc.KhieuNaiID,
        kn.TieuDe AS TieuDeKhieuNai,
        kn.LoaiKhieuNai,
        kn.MucDoUuTien AS MucDoUuTienKhieuNai,
        nd_kh.HoTen AS HoTenKhachHang,
        nd_kh.Email AS EmailKhachHang,
        yc.NguoiYeuCauID,
        nd_yc.HoTen AS TenNguoiYeuCau,
        nd_yc.Email AS EmailNguoiYeuCau,
        yc.LyDo,
        yc.MucDoUuTien,
        yc.AdminPhuTrachID,
        nd_adm.HoTen AS TenAdminPhuTrach,
        yc.TrangThai,
        yc.ThoiGianGui,
        yc.ThoiGianTiepNhan,
        yc.KetQuaXuLy,
        yc.ThoiGianHoanTat
    FROM dbo.YEUCAU_CHUYENCAP yc
    INNER JOIN dbo.KHIEUNAI kn ON kn.KhieuNaiID = yc.KhieuNaiID
    INNER JOIN dbo.NGUOIDUNG nd_kh ON nd_kh.NguoiDungID = kn.NguoiDungID
    INNER JOIN dbo.NGUOIDUNG nd_yc ON nd_yc.NguoiDungID = yc.NguoiYeuCauID
    LEFT JOIN dbo.NGUOIDUNG nd_adm ON nd_adm.NguoiDungID = yc.AdminPhuTrachID
    WHERE (@TrangThai IS NULL OR yc.TrangThai = @TrangThai)
      AND (@MucDoUuTien IS NULL OR yc.MucDoUuTien = @MucDoUuTien)
      AND (
          @SearchTerm IS NULL
          OR kn.TieuDe LIKE '%' + @SearchTerm + '%'
          OR yc.LyDo LIKE '%' + @SearchTerm + '%'
          OR nd_kh.HoTen LIKE '%' + @SearchTerm + '%'
          OR nd_yc.HoTen LIKE '%' + @SearchTerm + '%'
      )
    ORDER BY
        CASE yc.TrangThai
            WHEN N'Chờ tiếp nhận' THEN 1
            WHEN N'Đang xử lý' THEN 2
            ELSE 3
        END ASC,
        CASE yc.MucDoUuTien
            WHEN N'Khẩn cấp' THEN 1
            WHEN N'Cao' THEN 2
            WHEN N'Trung bình' THEN 3
            ELSE 4
        END ASC,
        yc.ThoiGianGui DESC;
END;

GO
