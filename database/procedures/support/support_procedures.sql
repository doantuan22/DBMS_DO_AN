-- ============================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP
-- KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY
-- STORED PROCEDURES - NHÓM CHĂM SÓC KHÁCH HÀNG (SUPPORT/CSKH)
-- ============================================================================

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO


-- CSKH-02: Xem danh sách khiếu nại (Hỗ trợ lọc theo trạng thái, loại khiếu nại)
IF OBJECT_ID(N'dbo.sp_Support_Complaint_List', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Support_Complaint_List;
GO

CREATE PROCEDURE dbo.sp_Support_Complaint_List
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

-- CSKH-03: Tra cứu chi tiết khiếu nại
IF OBJECT_ID(N'dbo.sp_Support_Complaint_GetDetail', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Support_Complaint_GetDetail;
GO

CREATE PROCEDURE dbo.sp_Support_Complaint_GetDetail
(
    @NguoiDungID INT,
    @KhieuNaiID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_KHIEUNAI') = 0
       AND dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'XULY_KHIEUNAI') = 0
        THROW 50060, N'Lỗi bảo mật: Bạn không có quyền truy cập khiếu nại.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)
        THROW 50061, N'Khiếu nại không tồn tại.', 1;

    -- Recordset 1: Chi tiết khiếu nại
    SELECT
        kn.KhieuNaiID,
        kn.NguoiDungID AS NguoiGuiID,
        nd.HoTen AS HoTenNguoiGui,
        nd.Email AS EmailNguoiGui,
        nd.SoDienThoai AS SoDienThoaiNguoiGui,
        kn.DonDatVeID,
        kn.LoaiKhieuNai,
        kn.TieuDe,
        kn.NoiDung,
        kn.MucDoUuTien,
        kn.NgayTao,
        kn.TrangThai AS TrangThaiKhieuNai
    FROM dbo.KHIEUNAI kn
    INNER JOIN dbo.NGUOIDUNG nd ON kn.NguoiDungID = nd.NguoiDungID
    WHERE kn.KhieuNaiID = @KhieuNaiID;

    -- Recordset 2: Lịch sử các lần xử lý
    SELECT
        xl.XuLyID,
        xl.NguoiXuLyID,
        nd_xl.HoTen AS NguoiXuLy,
        xl.NoiDungXuLy,
        xl.NgayXuLy,
        xl.TrangThaiSauXuLy
    FROM dbo.XULY_KHIEUNAI xl
    INNER JOIN dbo.NGUOIDUNG nd_xl ON xl.NguoiXuLyID = nd_xl.NguoiDungID
    WHERE xl.KhieuNaiID = @KhieuNaiID
    ORDER BY xl.NgayXuLy ASC;
END;
GO

-- CSKH-04: Xem đơn đặt vé tham chiếu của khiếu nại
IF OBJECT_ID(N'dbo.sp_Support_Complaint_GetOrderReference', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Support_Complaint_GetOrderReference;
GO

CREATE PROCEDURE dbo.sp_Support_Complaint_GetOrderReference
(
    @NguoiDungID INT,
    @KhieuNaiID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_KHIEUNAI') = 0
       AND dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'XULY_KHIEUNAI') = 0
        THROW 50060, N'Lỗi bảo mật: Bạn không có quyền xem đơn tham chiếu.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)
        THROW 50061, N'Khiếu nại không tồn tại.', 1;

    DECLARE @DonDatVeID INT;
    SELECT @DonDatVeID = DonDatVeID FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID;

    IF @DonDatVeID IS NULL
    BEGIN
        SELECT N'Khiếu nại này không gắn với đơn đặt vé tham chiếu cụ thể nào.' AS [Message];
        RETURN;
    END

    -- Trả về chi tiết đơn đặt vé
    SELECT
        DonDatVeID,
        NguoiDungID,
        HoTenKhachHang,
        Email,
        SoDienThoai,
        TenPhim,
        TenRap,
        TenPhong,
        ThoiGianBatDau,
        ThoiGianKetThuc,
        DinhDang,
        NgayDat,
        TongTienVe,
        TongTienDoAn,
        TienGiamGia,
        TongTienThanhToan,
        TrangThaiDon,
        DanhSachGhe,
        DanhSachMaVe
    FROM dbo.vw_ChiTietDonDatVe
    WHERE DonDatVeID = @DonDatVeID;
END;
GO

-- CSKH-05: Ghi nhận lần xử lý khiếu nại (sp_XuLyKhieuNai)
IF OBJECT_ID(N'dbo.sp_Support_Complaint_AddProcessing', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Support_Complaint_AddProcessing;
IF OBJECT_ID(N'dbo.sp_XuLyKhieuNai', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_XuLyKhieuNai;
GO

CREATE PROCEDURE dbo.sp_Support_Complaint_AddProcessing
(
    @NguoiDungID INT,
    @KhieuNaiID INT,
    @NoiDungXuLy NVARCHAR(MAX),
    @TrangThaiSauXuLy NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'XULY_KHIEUNAI') = 0
        BEGIN
            ;THROW 50060, N'Lỗi bảo mật: Bạn không có quyền xử lý khiếu nại.', 1;
        END

        IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)
        BEGIN
            ;THROW 50061, N'Khiếu nại không tồn tại.', 1;
        END

        -- Chèn lịch sử xử lý (Trigger TRG_XuLyKhieuNai_KiemTraVaiTro sẽ kiểm tra vai trò CSKH/Admin)
        -- Trigger TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai sẽ tự động đồng bộ sang KHIEUNAI.TrangThai
        INSERT INTO dbo.XULY_KHIEUNAI (KhieuNaiID, NguoiXuLyID, NoiDungXuLy, NgayXuLy, TrangThaiSauXuLy)
        VALUES (@KhieuNaiID, @NguoiDungID, @NoiDungXuLy, SYSDATETIME(), @TrangThaiSauXuLy);

        COMMIT TRANSACTION;

        SELECT
            XuLyID,
            KhieuNaiID,
            NguoiXuLyID,
            NoiDungXuLy,
            NgayXuLy,
            TrangThaiSauXuLy
        FROM dbo.XULY_KHIEUNAI
        WHERE XuLyID = SCOPE_IDENTITY();

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

CREATE PROCEDURE dbo.sp_XuLyKhieuNai
(
    @NguoiDungID INT,
    @KhieuNaiID INT,
    @NoiDungXuLy NVARCHAR(MAX),
    @TrangThaiSauXuLy NVARCHAR(50)
)
AS
BEGIN
    EXEC dbo.sp_Support_Complaint_AddProcessing
        @NguoiDungID = @NguoiDungID,
        @KhieuNaiID = @KhieuNaiID,
        @NoiDungXuLy = @NoiDungXuLy,
        @TrangThaiSauXuLy = @TrangThaiSauXuLy;
END;
GO

-- CSKH-06: Cập nhật nhanh trạng thái khiếu nại
IF OBJECT_ID(N'dbo.sp_Support_Complaint_UpdateStatus', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Support_Complaint_UpdateStatus;
GO

CREATE PROCEDURE dbo.sp_Support_Complaint_UpdateStatus
(
    @NguoiDungID INT,
    @KhieuNaiID INT,
    @TrangThaiMoi NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'XULY_KHIEUNAI') = 0
            THROW 50060, N'Lỗi bảo mật: Bạn không có quyền xử lý khiếu nại.', 1;

        IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)
            THROW 50061, N'Khiếu nại không tồn tại.', 1;

        -- Status-only actions remain append-only: the trigger synchronizes
        -- KHIEUNAI.TrangThai with this new history item atomically.
        INSERT INTO dbo.XULY_KHIEUNAI (KhieuNaiID, NguoiXuLyID, NoiDungXuLy, NgayXuLy, TrangThaiSauXuLy)
        VALUES (@KhieuNaiID, @NguoiDungID, N'Cập nhật trạng thái khiếu nại.', SYSDATETIME(), @TrangThaiMoi);

        COMMIT TRANSACTION;
        SELECT KhieuNaiID, TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

PRINT N'>>> [procedures/support] Đã tạo 6 Stored Procedures.';
GO
