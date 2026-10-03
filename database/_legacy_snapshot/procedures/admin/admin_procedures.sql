-- ============================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP
-- KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY
-- STORED PROCEDURES - NHÓM QUẢN TRỊ VIÊN (ADMIN)
-- ============================================================================

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO


-- ADM-02: Quản lý tài khoản người dùng - Danh sách
IF OBJECT_ID(N'dbo.sp_Admin_User_List', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_User_List;
GO

CREATE PROCEDURE dbo.sp_Admin_User_List
(
    @VaiTroID INT = NULL,
    @TrangThai NVARCHAR(50) = NULL,
    @SearchTerm NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        nd.NguoiDungID,
        nd.HoTen,
        nd.Email,
        nd.SoDienThoai,
        nd.NgayTao,
        nd.TrangThai,
        vt.VaiTroID,
        vt.MaVaiTro,
        vt.TenVaiTro,
        hk.DiemTichLuy
    FROM dbo.NGUOIDUNG nd
    INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
    LEFT JOIN dbo.HOSOKHACHHANG hk ON nd.NguoiDungID = hk.NguoiDungID
    WHERE (@VaiTroID IS NULL OR nd.VaiTroID = @VaiTroID)
      AND (@TrangThai IS NULL OR nd.TrangThai = @TrangThai)
      AND (@SearchTerm IS NULL OR nd.HoTen LIKE '%' + @SearchTerm + '%' OR nd.Email LIKE '%' + @SearchTerm + '%' OR nd.SoDienThoai LIKE '%' + @SearchTerm + '%')
    ORDER BY nd.NgayTao DESC;
END;
GO

-- ADM-02: Khóa / Mở khóa tài khoản
IF OBJECT_ID(N'dbo.sp_Admin_User_UpdateStatus', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_User_UpdateStatus;
GO

CREATE PROCEDURE dbo.sp_Admin_User_UpdateStatus
(
    @NguoiDungID INT,
    @TrangThai NVARCHAR(50) -- 'Hoạt động', 'Bị khóa'
)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.NGUOIDUNG
    SET TrangThai = @TrangThai
    WHERE NguoiDungID = @NguoiDungID;

    SELECT NguoiDungID, HoTen, Email, TrangThai FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID;
END;
GO

-- ADM-02: Tạo tài khoản nhân viên (Admin, Quản lý rạp, CSKH)
IF OBJECT_ID(N'dbo.sp_Admin_User_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_User_Create;
GO

CREATE PROCEDURE dbo.sp_Admin_User_Create
(
    @HoTen NVARCHAR(100),
    @Email VARCHAR(150),
    @MatKhauHash VARCHAR(255),
    @SoDienThoai VARCHAR(20) = NULL,
    @VaiTroID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE Email = @Email)
    BEGIN
        ;THROW 50070, N'Email đã tồn tại.', 1;
    END

    INSERT INTO dbo.NGUOIDUNG (VaiTroID, HoTen, Email, MatKhau, SoDienThoai, NgayTao, TrangThai)
    VALUES (@VaiTroID, @HoTen, @Email, @MatKhauHash, @SoDienThoai, SYSDATETIME(), N'Hoạt động');

    SELECT
        nd.NguoiDungID,
        nd.HoTen,
        nd.Email,
        nd.SoDienThoai,
        vt.MaVaiTro,
        vt.TenVaiTro,
        nd.TrangThai
    FROM dbo.NGUOIDUNG nd
    INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
    WHERE nd.NguoiDungID = SCOPE_IDENTITY();
END;
GO

-- ADM-03: Quản lý vai trò
IF OBJECT_ID(N'dbo.sp_Admin_Role_List', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Role_List;
GO

CREATE PROCEDURE dbo.sp_Admin_Role_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT VaiTroID, MaVaiTro, TenVaiTro, MoTa FROM dbo.VAITRO ORDER BY VaiTroID;
END;
GO

IF OBJECT_ID(N'dbo.sp_Admin_Role_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Role_Create;
GO

CREATE PROCEDURE dbo.sp_Admin_Role_Create
(
    @MaVaiTro VARCHAR(50),
    @TenVaiTro NVARCHAR(100),
    @MoTa NVARCHAR(255) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.VAITRO (MaVaiTro, TenVaiTro, MoTa)
    VALUES (@MaVaiTro, @TenVaiTro, @MoTa);

    SELECT VaiTroID, MaVaiTro, TenVaiTro, MoTa FROM dbo.VAITRO WHERE VaiTroID = SCOPE_IDENTITY();
END;
GO

-- ADM-04: Quản lý danh mục quyền
IF OBJECT_ID(N'dbo.sp_Admin_Permission_List', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Permission_List;
GO

CREATE PROCEDURE dbo.sp_Admin_Permission_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT QuyenID, MaQuyen, TenQuyen, MoTa FROM dbo.QUYEN ORDER BY MaQuyen;
END;
GO

-- ADM-05: Gán danh sách quyền cho vai trò
IF OBJECT_ID(N'dbo.sp_Admin_RolePermission_Set', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_RolePermission_Set;
GO

CREATE PROCEDURE dbo.sp_Admin_RolePermission_Set
(
    @VaiTroID INT,
    @QuyenIdList VARCHAR(MAX) -- '1,2,3,4'
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM dbo.VAITRO_QUYEN WHERE VaiTroID = @VaiTroID;

        INSERT INTO dbo.VAITRO_QUYEN (VaiTroID, QuyenID, NgayGan)
        SELECT DISTINCT @VaiTroID, CAST(value AS INT), SYSDATETIME()
        FROM STRING_SPLIT(@QuyenIdList, ',')
        WHERE LTRIM(RTRIM(value)) <> '';

        COMMIT TRANSACTION;

        SELECT vq.VaiTroID, q.QuyenID, q.MaQuyen, q.TenQuyen
        FROM dbo.VAITRO_QUYEN vq
        INNER JOIN dbo.QUYEN q ON vq.QuyenID = q.QuyenID
        WHERE vq.VaiTroID = @VaiTroID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

-- ADM-06: Phân công quản lý rạp (sp_PhanCongQuanLyRap)
IF OBJECT_ID(N'dbo.sp_Admin_Assignment_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Assignment_Create;
IF OBJECT_ID(N'dbo.sp_PhanCongQuanLyRap', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_PhanCongQuanLyRap;
GO

CREATE PROCEDURE dbo.sp_Admin_Assignment_Create
(
    @NguoiDungID INT,
    @RapID INT,
    @NgayBatDau DATE,
    @NgayKetThuc DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra tài khoản phải là QUAN_LY_RAP
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
        WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro = 'QUAN_LY_RAP'
    )
    BEGIN
        ;THROW 50071, N'Tài khoản được phân công phải có vai trò QUAN_LY_RAP.', 1;
    END

    INSERT INTO dbo.PHANCONG_RAP (NguoiDungID, RapID, NgayBatDau, NgayKetThuc, TrangThai)
    VALUES (@NguoiDungID, @RapID, @NgayBatDau, @NgayKetThuc, N'Hiệu lực');

    SELECT
        pcr.PhanCongID,
        pcr.NguoiDungID,
        nd.HoTen,
        pcr.RapID,
        r.TenRap,
        pcr.NgayBatDau,
        pcr.NgayKetThuc,
        pcr.TrangThai
    FROM dbo.PHANCONG_RAP pcr
    INNER JOIN dbo.NGUOIDUNG nd ON pcr.NguoiDungID = nd.NguoiDungID
    INNER JOIN dbo.RAPCHIEUPHIM r ON pcr.RapID = r.RapID
    WHERE pcr.PhanCongID = SCOPE_IDENTITY();
END;
GO

CREATE PROCEDURE dbo.sp_PhanCongQuanLyRap
(
    @NguoiDungID INT,
    @RapID INT,
    @NgayBatDau DATE,
    @NgayKetThuc DATE = NULL
)
AS
BEGIN
    EXEC dbo.sp_Admin_Assignment_Create
        @NguoiDungID = @NguoiDungID,
        @RapID = @RapID,
        @NgayBatDau = @NgayBatDau,
        @NgayKetThuc = @NgayKetThuc;
END;
GO

-- ADM-06: Danh sách phân công
IF OBJECT_ID(N'dbo.sp_Admin_Assignment_List', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Assignment_List;
GO

CREATE PROCEDURE dbo.sp_Admin_Assignment_List
(
    @RapID INT = NULL,
    @NguoiDungID INT = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pcr.PhanCongID,
        pcr.NguoiDungID,
        nd.HoTen AS TenQuanLy,
        nd.Email,
        pcr.RapID,
        r.TenRap,
        r.ThanhPho,
        pcr.NgayBatDau,
        pcr.NgayKetThuc,
        pcr.TrangThai
    FROM dbo.PHANCONG_RAP pcr
    INNER JOIN dbo.NGUOIDUNG nd ON pcr.NguoiDungID = nd.NguoiDungID
    INNER JOIN dbo.RAPCHIEUPHIM r ON pcr.RapID = r.RapID
    WHERE (@RapID IS NULL OR pcr.RapID = @RapID)
      AND (@NguoiDungID IS NULL OR pcr.NguoiDungID = @NguoiDungID)
    ORDER BY pcr.NgayBatDau DESC;
END;
GO

-- ADM-07: Quản lý rạp chiếu phim toàn hệ thống
IF OBJECT_ID(N'dbo.sp_Admin_Cinema_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Cinema_Create;
GO

CREATE PROCEDURE dbo.sp_Admin_Cinema_Create
(
    @TenRap NVARCHAR(150),
    @DiaChi NVARCHAR(255),
    @ThanhPho NVARCHAR(100),
    @SoDienThoai VARCHAR(20) = NULL,
    @MoTa NVARCHAR(500) = NULL,
    @NgayHoatDong DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.RAPCHIEUPHIM (TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai)
    VALUES (@TenRap, @DiaChi, @ThanhPho, @SoDienThoai, @MoTa, @NgayHoatDong, N'Hoạt động');

    SELECT RapID, TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai
    FROM dbo.RAPCHIEUPHIM
    WHERE RapID = SCOPE_IDENTITY();
END;
GO

IF OBJECT_ID(N'dbo.sp_Admin_Cinema_Update', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Cinema_Update;
GO

CREATE PROCEDURE dbo.sp_Admin_Cinema_Update
(
    @RapID INT,
    @TenRap NVARCHAR(150),
    @DiaChi NVARCHAR(255),
    @ThanhPho NVARCHAR(100),
    @SoDienThoai VARCHAR(20),
    @MoTa NVARCHAR(500),
    @TrangThai NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.RAPCHIEUPHIM
    SET TenRap = @TenRap,
        DiaChi = @DiaChi,
        ThanhPho = @ThanhPho,
        SoDienThoai = @SoDienThoai,
        MoTa = @MoTa,
        TrangThai = @TrangThai
    WHERE RapID = @RapID;

    SELECT RapID, TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, TrangThai
    FROM dbo.RAPCHIEUPHIM
    WHERE RapID = @RapID;
END;
GO

-- ADM-09: Thêm phim mới (kèm thể loại)
IF OBJECT_ID(N'dbo.sp_Admin_Movie_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Movie_Create;
GO

CREATE PROCEDURE dbo.sp_Admin_Movie_Create
(
    @TenPhim NVARCHAR(255),
    @ThoiLuong INT,
    @NgayKhoiChieu DATE,
    @NgayKetThuc DATE = NULL,
    @NgonNgu NVARCHAR(100) = NULL,
    @PhuDe NVARCHAR(100) = NULL,
    @DoTuoi NVARCHAR(20) = NULL,
    @DaoDien NVARCHAR(150) = NULL,
    @MoTa NVARCHAR(MAX) = NULL,
    @PosterURL NVARCHAR(500) = NULL,
    @TrailerURL NVARCHAR(500) = NULL,
    @TheLoaiIdList VARCHAR(MAX) = NULL,
    @NewPhimID INT OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO dbo.PHIM (TenPhim, ThoiLuong, NgayKhoiChieu, NgayKetThuc, NgonNgu, PhuDe, DoTuoi, DaoDien, MoTa, PosterURL, TrailerURL, TrangThai)
        VALUES (@TenPhim, @ThoiLuong, @NgayKhoiChieu, @NgayKetThuc, @NgonNgu, @PhuDe, @DoTuoi, @DaoDien, @MoTa, @PosterURL, @TrailerURL, N'Đang chiếu');

        SET @NewPhimID = SCOPE_IDENTITY();

        IF @TheLoaiIdList IS NOT NULL
        BEGIN
            INSERT INTO dbo.PHIM_THELOAI (PhimID, TheLoaiID)
            SELECT DISTINCT @NewPhimID, CAST(value AS INT)
            FROM STRING_SPLIT(@TheLoaiIdList, ',')
            WHERE LTRIM(RTRIM(value)) <> '';
        END

        COMMIT TRANSACTION;

        EXEC dbo.sp_Movie_GetDetail @PhimID = @NewPhimID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

-- ADM-09: Cập nhật phim
IF OBJECT_ID(N'dbo.sp_Admin_Movie_Update', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Movie_Update;
GO

CREATE PROCEDURE dbo.sp_Admin_Movie_Update
(
    @PhimID INT,
    @TenPhim NVARCHAR(255),
    @ThoiLuong INT,
    @NgayKhoiChieu DATE,
    @NgayKetThuc DATE = NULL,
    @NgonNgu NVARCHAR(100) = NULL,
    @PhuDe NVARCHAR(100) = NULL,
    @DoTuoi NVARCHAR(20) = NULL,
    @DaoDien NVARCHAR(150) = NULL,
    @MoTa NVARCHAR(MAX) = NULL,
    @PosterURL NVARCHAR(500) = NULL,
    @TrailerURL NVARCHAR(500) = NULL,
    @TrangThai NVARCHAR(50),
    @TheLoaiIdList VARCHAR(MAX) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE dbo.PHIM
        SET TenPhim = @TenPhim,
            ThoiLuong = @ThoiLuong,
            NgayKhoiChieu = @NgayKhoiChieu,
            NgayKetThuc = @NgayKetThuc,
            NgonNgu = @NgonNgu,
            PhuDe = @PhuDe,
            DoTuoi = @DoTuoi,
            DaoDien = @DaoDien,
            MoTa = @MoTa,
            PosterURL = @PosterURL,
            TrailerURL = @TrailerURL,
            TrangThai = @TrangThai
        WHERE PhimID = @PhimID;

        IF @TheLoaiIdList IS NOT NULL
        BEGIN
            DELETE FROM dbo.PHIM_THELOAI WHERE PhimID = @PhimID;

            INSERT INTO dbo.PHIM_THELOAI (PhimID, TheLoaiID)
            SELECT DISTINCT @PhimID, CAST(value AS INT)
            FROM STRING_SPLIT(@TheLoaiIdList, ',')
            WHERE LTRIM(RTRIM(value)) <> '';
        END

        COMMIT TRANSACTION;

        EXEC dbo.sp_Movie_GetDetail @PhimID = @PhimID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

-- ADM-11: Quản lý sản phẩm ăn uống
IF OBJECT_ID(N'dbo.sp_Admin_Product_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Product_Create;
GO

CREATE PROCEDURE dbo.sp_Admin_Product_Create
(
    @TenSanPham NVARCHAR(150),
    @LoaiSanPham NVARCHAR(50),
    @Gia DECIMAL(18,2),
    @MoTa NVARCHAR(255) = NULL,
    @HinhAnh NVARCHAR(500) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.SANPHAM (TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai)
    VALUES (@TenSanPham, @LoaiSanPham, @Gia, @MoTa, @HinhAnh, N'Đang bán');

    SELECT SanPhamID, TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai
    FROM dbo.SANPHAM
    WHERE SanPhamID = SCOPE_IDENTITY();
END;
GO

IF OBJECT_ID(N'dbo.sp_Admin_Product_Update', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Product_Update;
GO

CREATE PROCEDURE dbo.sp_Admin_Product_Update
(
    @SanPhamID INT,
    @TenSanPham NVARCHAR(150),
    @LoaiSanPham NVARCHAR(50),
    @Gia DECIMAL(18,2),
    @MoTa NVARCHAR(255),
    @HinhAnh NVARCHAR(500),
    @TrangThai NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.SANPHAM
    SET TenSanPham = @TenSanPham,
        LoaiSanPham = @LoaiSanPham,
        Gia = @Gia,
        MoTa = @MoTa,
        HinhAnh = @HinhAnh,
        TrangThai = @TrangThai
    WHERE SanPhamID = @SanPhamID;

    SELECT SanPhamID, TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai
    FROM dbo.SANPHAM
    WHERE SanPhamID = @SanPhamID;
END;
GO

-- ADM-12: Quản lý chương trình khuyến mãi
IF OBJECT_ID(N'dbo.sp_Admin_Promotion_List', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Promotion_List;
GO

CREATE PROCEDURE dbo.sp_Admin_Promotion_List
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        KhuyenMaiID,
        MaCode,
        MoTa,
        LoaiGiamGia,
        GiaTriGiam,
        DonHangToiThieu,
        GiamToiDa,
        NgayBatDau,
        NgayKetThuc,
        SoLuong,
        SoLuongDaDung,
        TrangThai
    FROM dbo.KHUYENMAI
    ORDER BY NgayBatDau DESC;
END;
GO

IF OBJECT_ID(N'dbo.sp_Admin_Promotion_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Promotion_Create;
GO

CREATE PROCEDURE dbo.sp_Admin_Promotion_Create
(
    @MaCode VARCHAR(50),
    @MoTa NVARCHAR(255) = NULL,
    @LoaiGiamGia NVARCHAR(20),
    @GiaTriGiam DECIMAL(18,2),
    @DonHangToiThieu DECIMAL(18,2) = 0,
    @GiamToiDa DECIMAL(18,2) = NULL,
    @NgayBatDau DATETIME2,
    @NgayKetThuc DATETIME2,
    @SoLuong INT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.KHUYENMAI WHERE MaCode = @MaCode)
    BEGIN
        ;THROW 50072, N'Mã khuyến mãi đã tồn tại.', 1;
    END

    INSERT INTO dbo.KHUYENMAI (MaCode, MoTa, LoaiGiamGia, GiaTriGiam, DonHangToiThieu, GiamToiDa, NgayBatDau, NgayKetThuc, SoLuong, SoLuongDaDung, TrangThai)
    VALUES (@MaCode, @MoTa, @LoaiGiamGia, @GiaTriGiam, @DonHangToiThieu, @GiamToiDa, @NgayBatDau, @NgayKetThuc, @SoLuong, 0, N'Hoạt động');

    SELECT * FROM dbo.KHUYENMAI WHERE KhuyenMaiID = SCOPE_IDENTITY();
END;
GO

-- ADM-16: Xem báo cáo doanh thu toàn hệ thống
IF OBJECT_ID(N'dbo.sp_Admin_Report_Revenue', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Report_Revenue;
GO

CREATE PROCEDURE dbo.sp_Admin_Report_Revenue
(
    @TuNgay DATE = NULL,
    @DenNgay DATE = NULL,
    @RapID INT = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Doanh thu chỉ tính THANHTOAN có TrangThai = 'Thành công', theo ngày thanh toán
    CREATE TABLE #DonDaThu (
        DonDatVeID INT PRIMARY KEY,
        RapID INT NOT NULL,
        TongTienVe DECIMAL(18,2),
        TongTienDoAn DECIMAL(18,2),
        TienGiamGia DECIMAL(18,2),
        TienDaThu DECIMAL(18,2),
        SoVe INT
    );

    INSERT INTO #DonDaThu (DonDatVeID, RapID, TongTienVe, TongTienDoAn, TienGiamGia, TienDaThu, SoVe)
    SELECT
        ddv.DonDatVeID,
        pc.RapID,
        ddv.TongTienVe,
        ddv.TongTienDoAn,
        ddv.TienGiamGia,
        SUM(tt.SoTien),
        (SELECT COUNT(*) FROM dbo.CHITIETVE cv
         WHERE cv.DonDatVeID = ddv.DonDatVeID AND cv.TrangThai <> N'Đã hủy')
    FROM dbo.DONDATVE ddv
    INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
    INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
    INNER JOIN dbo.THANHTOAN tt ON tt.DonDatVeID = ddv.DonDatVeID AND tt.TrangThai = N'Thành công'
    WHERE (@RapID IS NULL OR pc.RapID = @RapID)
    GROUP BY ddv.DonDatVeID, pc.RapID, ddv.TongTienVe, ddv.TongTienDoAn, ddv.TienGiamGia
    HAVING (@TuNgay IS NULL OR CAST(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao)) AS DATE) >= @TuNgay)
       AND (@DenNgay IS NULL OR CAST(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao)) AS DATE) <= @DenNgay);

    -- Recordset 1: Doanh thu theo từng rạp
    SELECT
        r.RapID,
        r.TenRap,
        r.ThanhPho,
        COUNT(d.DonDatVeID) AS SoDon,
        ISNULL(SUM(d.SoVe), 0) AS SoVeBan,
        ISNULL(SUM(d.TongTienVe), 0) AS DoanhThuVe,
        ISNULL(SUM(d.TongTienDoAn), 0) AS DoanhThuDoAn,
        ISNULL(SUM(d.TienGiamGia), 0) AS TongTienGiam,
        ISNULL(SUM(d.TienDaThu), 0) AS DoanhThuThucTe
    FROM dbo.RAPCHIEUPHIM r
    LEFT JOIN #DonDaThu d ON d.RapID = r.RapID
    WHERE (@RapID IS NULL OR r.RapID = @RapID)
    GROUP BY r.RapID, r.TenRap, r.ThanhPho;

    -- Recordset 2: Tổng hợp toàn hệ thống
    SELECT
        COUNT(DonDatVeID) AS TongSoDonToanHeThong,
        ISNULL(SUM(SoVe), 0) AS TongSoVeBan,
        ISNULL(SUM(TongTienVe), 0) AS TongDoanhThuVe,
        ISNULL(SUM(TongTienDoAn), 0) AS TongDoanhThuDoAn,
        ISNULL(SUM(TienGiamGia), 0) AS TongTienGiam,
        ISNULL(SUM(TienDaThu), 0) AS TongDoanhThuThucTe
    FROM #DonDaThu;

    DROP TABLE #DonDaThu;
END;
GO

-- ADM-16: Admin Dashboard
IF OBJECT_ID(N'dbo.sp_Admin_Dashboard', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Dashboard;
GO

CREATE PROCEDURE dbo.sp_Admin_Dashboard
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE TrangThai = N'Hoạt động') AS TongNguoiDung,
        (SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM WHERE TrangThai = N'Hoạt động') AS TongRap,
        (SELECT COUNT(*) FROM dbo.PHONGCHIEU WHERE TrangThai = N'Hoạt động') AS TongPhongChieu,
        (SELECT COUNT(*) FROM dbo.PHIM WHERE TrangThai = N'Đang chiếu') AS PhimDangChieu,
        (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE CAST(ThoiGianBatDau AS DATE) = CAST(SYSDATETIME() AS DATE)) AS SuatChieuHomNay,
        (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai IN (N'Đã thanh toán', N'Hoàn thành')) AS TongDonThanhCong,
        (SELECT ISNULL(SUM(SoTien), 0) FROM dbo.THANHTOAN WHERE TrangThai = N'Thành công') AS TongDoanhThuToanThoiGian,
        (SELECT COUNT(*) FROM dbo.KHIEUNAI WHERE TrangThai = N'Mới') AS KhieuNaiChuaXuLy;
END;
GO

-- ============================================================================
-- PHẦN 10: BỔ SUNG CÁC THAO TÁC SỬA/XÓA CÒN THIẾU CỦA ADMIN / QUẢN LÝ RẠP
-- (ADM-03, ADM-04, ADM-07, ADM-09, ADM-10, ADM-11, ADM-12, QLR-03)
-- Nguyên tắc: không xóa cứng dữ liệu đã có tham chiếu; báo lỗi rõ ràng để dùng trạng thái thay thế.
-- ============================================================================

-- ADM-03: Sửa vai trò (MaVaiTro là khóa nghiệp vụ nên không đổi)
IF OBJECT_ID(N'dbo.sp_Admin_Role_Update', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Role_Update;
GO

CREATE PROCEDURE dbo.sp_Admin_Role_Update
(
    @VaiTroID INT,
    @TenVaiTro NVARCHAR(100),
    @MoTa NVARCHAR(255) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.VAITRO WHERE VaiTroID = @VaiTroID)
    BEGIN
        ;THROW 50090, N'Vai trò không tồn tại.', 1;
    END

    UPDATE dbo.VAITRO SET TenVaiTro = @TenVaiTro, MoTa = @MoTa WHERE VaiTroID = @VaiTroID;

    SELECT VaiTroID, MaVaiTro, TenVaiTro, MoTa FROM dbo.VAITRO WHERE VaiTroID = @VaiTroID;
END;
GO

-- ADM-03: Xóa vai trò (không xóa được khi đang gán cho người dùng hoặc quyền)
IF OBJECT_ID(N'dbo.sp_Admin_Role_Delete', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Role_Delete;
GO

CREATE PROCEDURE dbo.sp_Admin_Role_Delete
(
    @VaiTroID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.VAITRO WHERE VaiTroID = @VaiTroID)
    BEGIN
        ;THROW 50090, N'Vai trò không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE VaiTroID = @VaiTroID)
       OR EXISTS (SELECT 1 FROM dbo.VAITRO_QUYEN WHERE VaiTroID = @VaiTroID)
    BEGIN
        ;THROW 50091, N'Vai trò đang được gán cho người dùng hoặc quyền nên không thể xóa.', 1;
    END

    DELETE FROM dbo.VAITRO WHERE VaiTroID = @VaiTroID;
    SELECT N'Đã xóa vai trò.' AS [Message];
END;
GO

-- ADM-04: Thêm quyền
IF OBJECT_ID(N'dbo.sp_Admin_Permission_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Permission_Create;
GO

CREATE PROCEDURE dbo.sp_Admin_Permission_Create
(
    @MaQuyen VARCHAR(50),
    @TenQuyen NVARCHAR(100),
    @MoTa NVARCHAR(255) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.QUYEN WHERE MaQuyen = @MaQuyen)
    BEGIN
        ;THROW 50092, N'Mã quyền đã tồn tại.', 1;
    END

    INSERT INTO dbo.QUYEN (MaQuyen, TenQuyen, MoTa) VALUES (@MaQuyen, @TenQuyen, @MoTa);
    SELECT QuyenID, MaQuyen, TenQuyen, MoTa FROM dbo.QUYEN WHERE QuyenID = SCOPE_IDENTITY();
END;
GO

-- ADM-04: Sửa quyền
IF OBJECT_ID(N'dbo.sp_Admin_Permission_Update', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Permission_Update;
GO

CREATE PROCEDURE dbo.sp_Admin_Permission_Update
(
    @QuyenID INT,
    @TenQuyen NVARCHAR(100),
    @MoTa NVARCHAR(255) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.QUYEN WHERE QuyenID = @QuyenID)
    BEGIN
        ;THROW 50093, N'Quyền không tồn tại.', 1;
    END

    UPDATE dbo.QUYEN SET TenQuyen = @TenQuyen, MoTa = @MoTa WHERE QuyenID = @QuyenID;
    SELECT QuyenID, MaQuyen, TenQuyen, MoTa FROM dbo.QUYEN WHERE QuyenID = @QuyenID;
END;
GO

-- ADM-04: Xóa quyền (không xóa được khi đã gán cho vai trò)
IF OBJECT_ID(N'dbo.sp_Admin_Permission_Delete', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Permission_Delete;
GO

CREATE PROCEDURE dbo.sp_Admin_Permission_Delete
(
    @QuyenID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.QUYEN WHERE QuyenID = @QuyenID)
    BEGIN
        ;THROW 50093, N'Quyền không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.VAITRO_QUYEN WHERE QuyenID = @QuyenID)
    BEGIN
        ;THROW 50094, N'Quyền đang được gán cho vai trò nên không thể xóa.', 1;
    END

    DELETE FROM dbo.QUYEN WHERE QuyenID = @QuyenID;
    SELECT N'Đã xóa quyền.' AS [Message];
END;
GO

-- ADM-07: Xóa rạp (chỉ khi chưa có phòng chiếu, phân công hoặc bảng giá)
IF OBJECT_ID(N'dbo.sp_Admin_Cinema_Delete', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Cinema_Delete;
GO

CREATE PROCEDURE dbo.sp_Admin_Cinema_Delete
(
    @RapID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)
    BEGIN
        ;THROW 50095, N'Rạp không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID = @RapID)
       OR EXISTS (SELECT 1 FROM dbo.PHANCONG_RAP WHERE RapID = @RapID)
       OR EXISTS (SELECT 1 FROM dbo.BANGGIA WHERE RapID = @RapID)
    BEGIN
        ;THROW 50096, N'Rạp đã có phòng chiếu, phân công hoặc bảng giá. Hãy chuyển trạng thái sang Tạm đóng thay vì xóa.', 1;
    END

    DELETE FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID;
    SELECT N'Đã xóa rạp.' AS [Message];
END;
GO

-- ADM-10: Thể loại phim - thêm
IF OBJECT_ID(N'dbo.sp_Admin_Genre_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Genre_Create;
GO

CREATE PROCEDURE dbo.sp_Admin_Genre_Create
(
    @TenTheLoai NVARCHAR(100)
)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.THELOAI WHERE TenTheLoai = @TenTheLoai)
    BEGIN
        ;THROW 50097, N'Thể loại đã tồn tại.', 1;
    END

    INSERT INTO dbo.THELOAI (TenTheLoai) VALUES (@TenTheLoai);
    SELECT TheLoaiID, TenTheLoai FROM dbo.THELOAI WHERE TheLoaiID = SCOPE_IDENTITY();
END;
GO

-- ADM-10: Thể loại phim - sửa
IF OBJECT_ID(N'dbo.sp_Admin_Genre_Update', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Genre_Update;
GO

CREATE PROCEDURE dbo.sp_Admin_Genre_Update
(
    @TheLoaiID INT,
    @TenTheLoai NVARCHAR(100)
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.THELOAI WHERE TheLoaiID = @TheLoaiID)
    BEGIN
        ;THROW 50098, N'Thể loại không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.THELOAI WHERE TenTheLoai = @TenTheLoai AND TheLoaiID <> @TheLoaiID)
    BEGIN
        ;THROW 50097, N'Thể loại đã tồn tại.', 1;
    END

    UPDATE dbo.THELOAI SET TenTheLoai = @TenTheLoai WHERE TheLoaiID = @TheLoaiID;
    SELECT TheLoaiID, TenTheLoai FROM dbo.THELOAI WHERE TheLoaiID = @TheLoaiID;
END;
GO

-- ADM-10: Thể loại phim - xóa (không xóa khi đang gắn với phim)
IF OBJECT_ID(N'dbo.sp_Admin_Genre_Delete', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Genre_Delete;
GO

CREATE PROCEDURE dbo.sp_Admin_Genre_Delete
(
    @TheLoaiID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.THELOAI WHERE TheLoaiID = @TheLoaiID)
    BEGIN
        ;THROW 50098, N'Thể loại không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.PHIM_THELOAI WHERE TheLoaiID = @TheLoaiID)
    BEGIN
        ;THROW 50099, N'Thể loại đang được gán cho phim nên không thể xóa.', 1;
    END

    DELETE FROM dbo.THELOAI WHERE TheLoaiID = @TheLoaiID;
    SELECT N'Đã xóa thể loại.' AS [Message];
END;
GO

-- ADM-09: Diễn viên - danh sách
IF OBJECT_ID(N'dbo.sp_Admin_Actor_List', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Actor_List;
GO

CREATE PROCEDURE dbo.sp_Admin_Actor_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DienVienID, HoTen, NgaySinh, QuocTich FROM dbo.DIENVIEN ORDER BY HoTen;
END;
GO

-- ADM-09: Diễn viên - thêm
IF OBJECT_ID(N'dbo.sp_Admin_Actor_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Actor_Create;
GO

CREATE PROCEDURE dbo.sp_Admin_Actor_Create
(
    @HoTen NVARCHAR(150),
    @NgaySinh DATE = NULL,
    @QuocTich NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.DIENVIEN (HoTen, NgaySinh, QuocTich) VALUES (@HoTen, @NgaySinh, @QuocTich);
    SELECT DienVienID, HoTen, NgaySinh, QuocTich FROM dbo.DIENVIEN WHERE DienVienID = SCOPE_IDENTITY();
END;
GO

-- ADM-09: Diễn viên - sửa
IF OBJECT_ID(N'dbo.sp_Admin_Actor_Update', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Actor_Update;
GO

CREATE PROCEDURE dbo.sp_Admin_Actor_Update
(
    @DienVienID INT,
    @HoTen NVARCHAR(150),
    @NgaySinh DATE = NULL,
    @QuocTich NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.DIENVIEN WHERE DienVienID = @DienVienID)
    BEGIN
        ;THROW 50100, N'Diễn viên không tồn tại.', 1;
    END

    UPDATE dbo.DIENVIEN SET HoTen = @HoTen, NgaySinh = @NgaySinh, QuocTich = @QuocTich WHERE DienVienID = @DienVienID;
    SELECT DienVienID, HoTen, NgaySinh, QuocTich FROM dbo.DIENVIEN WHERE DienVienID = @DienVienID;
END;
GO

-- ADM-09: Diễn viên - xóa (không xóa khi đang tham gia phim)
IF OBJECT_ID(N'dbo.sp_Admin_Actor_Delete', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Actor_Delete;
GO

CREATE PROCEDURE dbo.sp_Admin_Actor_Delete
(
    @DienVienID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.DIENVIEN WHERE DienVienID = @DienVienID)
    BEGIN
        ;THROW 50100, N'Diễn viên không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.PHIM_DIENVIEN WHERE DienVienID = @DienVienID)
    BEGIN
        ;THROW 50101, N'Diễn viên đang tham gia phim nên không thể xóa.', 1;
    END

    DELETE FROM dbo.DIENVIEN WHERE DienVienID = @DienVienID;
    SELECT N'Đã xóa diễn viên.' AS [Message];
END;
GO

-- ADM-09: Gán diễn viên và vai diễn cho phim
-- @DanhSachJson: '[{"DienVienID":1,"VaiDien":"Nhân vật chính"}, ...]' (thay thế toàn bộ danh sách cũ)
IF OBJECT_ID(N'dbo.sp_Admin_MovieActor_Set', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_MovieActor_Set;
GO

CREATE PROCEDURE dbo.sp_Admin_MovieActor_Set
(
    @PhimID INT,
    @DanhSachJson NVARCHAR(MAX)
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.PHIM WHERE PhimID = @PhimID)
    BEGIN
        ;THROW 50102, N'Phim không tồn tại.', 1;
    END

    IF @DanhSachJson IS NULL OR ISJSON(@DanhSachJson) <> 1
    BEGIN
        ;THROW 50103, N'Danh sách diễn viên phải là JSON hợp lệ.', 1;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM dbo.PHIM_DIENVIEN WHERE PhimID = @PhimID;

        INSERT INTO dbo.PHIM_DIENVIEN (PhimID, DienVienID, VaiDien)
        SELECT @PhimID, j.DienVienID, MAX(j.VaiDien)
        FROM OPENJSON(@DanhSachJson)
             WITH (DienVienID INT '$.DienVienID', VaiDien NVARCHAR(150) '$.VaiDien') j
        INNER JOIN dbo.DIENVIEN dv ON dv.DienVienID = j.DienVienID
        GROUP BY j.DienVienID;

        COMMIT TRANSACTION;

        SELECT pd.PhimID, dv.DienVienID, dv.HoTen, pd.VaiDien
        FROM dbo.PHIM_DIENVIEN pd
        INNER JOIN dbo.DIENVIEN dv ON dv.DienVienID = pd.DienVienID
        WHERE pd.PhimID = @PhimID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

-- ADM-09: Xóa phim (chỉ khi chưa có suất chiếu hoặc đánh giá)
IF OBJECT_ID(N'dbo.sp_Admin_Movie_Delete', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Movie_Delete;
GO

CREATE PROCEDURE dbo.sp_Admin_Movie_Delete
(
    @PhimID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.PHIM WHERE PhimID = @PhimID)
    BEGIN
        ;THROW 50102, N'Phim không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.SUATCHIEU WHERE PhimID = @PhimID)
       OR EXISTS (SELECT 1 FROM dbo.DANHGIAPHIM WHERE PhimID = @PhimID)
    BEGIN
        ;THROW 50104, N'Phim đã có suất chiếu hoặc đánh giá. Hãy chuyển trạng thái sang Ngừng chiếu thay vì xóa.', 1;
    END

    DELETE FROM dbo.PHIM WHERE PhimID = @PhimID;
    SELECT N'Đã xóa phim.' AS [Message];
END;
GO

-- ADM-11: Xóa sản phẩm ăn uống (chỉ khi chưa từng được bán)
IF OBJECT_ID(N'dbo.sp_Admin_Product_Delete', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Product_Delete;
GO

CREATE PROCEDURE dbo.sp_Admin_Product_Delete
(
    @SanPhamID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.SANPHAM WHERE SanPhamID = @SanPhamID)
    BEGIN
        ;THROW 50105, N'Sản phẩm không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.CHITIETDOAN WHERE SanPhamID = @SanPhamID)
    BEGIN
        ;THROW 50106, N'Sản phẩm đã có trong đơn hàng. Hãy chuyển trạng thái sang Ngừng bán thay vì xóa.', 1;
    END

    DELETE FROM dbo.SANPHAM WHERE SanPhamID = @SanPhamID;
    SELECT N'Đã xóa sản phẩm.' AS [Message];
END;
GO

-- ADM-12: Sửa khuyến mãi (MaCode là khóa nghiệp vụ nên không đổi)
IF OBJECT_ID(N'dbo.sp_Admin_Promotion_Update', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Promotion_Update;
GO

CREATE PROCEDURE dbo.sp_Admin_Promotion_Update
(
    @KhuyenMaiID INT,
    @MoTa NVARCHAR(255) = NULL,
    @LoaiGiamGia NVARCHAR(20),
    @GiaTriGiam DECIMAL(18,2),
    @DonHangToiThieu DECIMAL(18,2) = 0,
    @GiamToiDa DECIMAL(18,2) = NULL,
    @NgayBatDau DATETIME2,
    @NgayKetThuc DATETIME2,
    @SoLuong INT,
    @TrangThai NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @KhuyenMaiID)
    BEGIN
        ;THROW 50107, N'Khuyến mãi không tồn tại.', 1;
    END

    UPDATE dbo.KHUYENMAI
    SET MoTa = @MoTa,
        LoaiGiamGia = @LoaiGiamGia,
        GiaTriGiam = @GiaTriGiam,
        DonHangToiThieu = @DonHangToiThieu,
        GiamToiDa = @GiamToiDa,
        NgayBatDau = @NgayBatDau,
        NgayKetThuc = @NgayKetThuc,
        SoLuong = @SoLuong,
        TrangThai = @TrangThai
    WHERE KhuyenMaiID = @KhuyenMaiID;

    SELECT KhuyenMaiID, MaCode, MoTa, LoaiGiamGia, GiaTriGiam, DonHangToiThieu, GiamToiDa,
           NgayBatDau, NgayKetThuc, SoLuong, SoLuongDaDung, TrangThai
    FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @KhuyenMaiID;
END;
GO

-- ADM-12: Xóa khuyến mãi (chỉ khi chưa gắn với đơn nào)
IF OBJECT_ID(N'dbo.sp_Admin_Promotion_Delete', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Admin_Promotion_Delete;
GO

CREATE PROCEDURE dbo.sp_Admin_Promotion_Delete
(
    @KhuyenMaiID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @KhuyenMaiID)
    BEGIN
        ;THROW 50107, N'Khuyến mãi không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE KhuyenMaiID = @KhuyenMaiID)
    BEGIN
        ;THROW 50108, N'Khuyến mãi đã được dùng trong đơn hàng. Hãy chuyển trạng thái sang Tạm dừng thay vì xóa.', 1;
    END

    DELETE FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @KhuyenMaiID;
    SELECT N'Đã xóa khuyến mãi.' AS [Message];
END;
GO

PRINT N'>>> [procedures/admin] Đã tạo 38 Stored Procedures.';
GO
