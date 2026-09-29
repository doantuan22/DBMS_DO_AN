-- ============================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP
-- KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY
-- SCRIPT 04: TẠO CÁC TRIGGER (TRIGGERS) - MULTI-ROW SAFE
-- ============================================================================

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Trigger: TRG_SuatChieu_KiemTraTrungLich
-- Chống việc hai suất chiếu trong cùng một phòng chiếu có khoảng thời gian giao nhau
IF OBJECT_ID(N'dbo.TRG_SuatChieu_KiemTraTrungLich', N'TR') IS NOT NULL DROP TRIGGER dbo.TRG_SuatChieu_KiemTraTrungLich;
GO

CREATE TRIGGER dbo.TRG_SuatChieu_KiemTraTrungLich
ON dbo.SUATCHIEU
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra giao nhau giữa bản ghi mới/sửa với các suất chiếu đã có trong bảng
    IF EXISTS (
        SELECT 1
        FROM INSERTED i
        INNER JOIN dbo.SUATCHIEU sc ON i.PhongID = sc.PhongID AND i.SuatChieuID <> sc.SuatChieuID
        WHERE i.TrangThai <> N'Đã hủy'
          AND sc.TrangThai <> N'Đã hủy'
          AND i.ThoiGianBatDau < sc.ThoiGianKetThuc
          AND i.ThoiGianKetThuc > sc.ThoiGianBatDau
    )
    BEGIN
        ;THROW 50001, N'Lỗi ràng buộc [BR01]: Phòng chiếu đã có suất chiếu khác trong khoảng thời gian này.', 1;
    END

    -- Kiểm tra giao nhau giữa các dòng trong chính tập INSERTED (phòng trường hợp insert/update theo lô)
    IF EXISTS (
        SELECT 1
        FROM INSERTED i1
        INNER JOIN INSERTED i2 ON i1.PhongID = i2.PhongID AND i1.SuatChieuID <> i2.SuatChieuID
        WHERE i1.TrangThai <> N'Đã hủy'
          AND i2.TrangThai <> N'Đã hủy'
          AND i1.ThoiGianBatDau < i2.ThoiGianKetThuc
          AND i1.ThoiGianKetThuc > i2.ThoiGianBatDau
    )
    BEGIN
        ;THROW 50001, N'Lỗi ràng buộc [BR01]: Tập suất chiếu mới có khoảng thời gian trùng nhau trong cùng phòng.', 1;
    END
END;
GO

-- 2. Trigger: TRG_ChiTietVe_KiemTraGheDungPhong
-- Kiểm tra ghế của vé phải thuộc đúng phòng của suất chiếu thông qua DONDATVE
IF OBJECT_ID(N'dbo.TRG_ChiTietVe_KiemTraGheDungPhong', N'TR') IS NOT NULL DROP TRIGGER dbo.TRG_ChiTietVe_KiemTraGheDungPhong;
GO

CREATE TRIGGER dbo.TRG_ChiTietVe_KiemTraGheDungPhong
ON dbo.CHITIETVE
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM INSERTED i
        INNER JOIN dbo.DONDATVE ddv ON i.DonDatVeID = ddv.DonDatVeID
        INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
        INNER JOIN dbo.GHE g ON i.GheID = g.GheID
        WHERE g.PhongID <> sc.PhongID
    )
    BEGIN
        ;THROW 50002, N'Lỗi ràng buộc [BR03]: Ghế được chọn không thuộc phòng chiếu của suất chiếu này.', 1;
    END
END;
GO

-- 3. Trigger: TRG_ChiTietVe_KiemTraTrungGhe
-- Chống bán trùng ghế cho cùng một suất chiếu trong các đơn hàng còn hiệu lực
IF OBJECT_ID(N'dbo.TRG_ChiTietVe_KiemTraTrungGhe', N'TR') IS NOT NULL DROP TRIGGER dbo.TRG_ChiTietVe_KiemTraTrungGhe;
GO

CREATE TRIGGER dbo.TRG_ChiTietVe_KiemTraTrungGhe
ON dbo.CHITIETVE
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra giữa dòng mới với vé hiện có trong cơ sở dữ liệu
    IF EXISTS (
        SELECT 1
        FROM INSERTED i
        INNER JOIN dbo.DONDATVE ddv_new ON i.DonDatVeID = ddv_new.DonDatVeID
        INNER JOIN dbo.CHITIETVE cv_exist ON i.GheID = cv_exist.GheID AND i.VeID <> cv_exist.VeID
        INNER JOIN dbo.DONDATVE ddv_exist ON cv_exist.DonDatVeID = ddv_exist.DonDatVeID
        WHERE ddv_new.SuatChieuID = ddv_exist.SuatChieuID
          AND i.TrangThai <> N'Đã hủy'
          AND cv_exist.TrangThai <> N'Đã hủy'
          AND ddv_new.TrangThai NOT IN (N'Đã hủy', N'Hết hạn')
          AND ddv_exist.TrangThai NOT IN (N'Đã hủy', N'Hết hạn')
    )
    BEGIN
        ;THROW 50003, N'Lỗi xung đột [BR02]: Ghế này đã được đặt hoặc đang được giữ bởi một đơn khác cho cùng suất chiếu.', 1;
    END

    -- Kiểm tra trùng lặp trong chính tập INSERTED
    IF EXISTS (
        SELECT 1
        FROM INSERTED i1
        INNER JOIN dbo.DONDATVE ddv1 ON i1.DonDatVeID = ddv1.DonDatVeID
        INNER JOIN INSERTED i2 ON i1.GheID = i2.GheID AND i1.VeID <> i2.VeID
        INNER JOIN dbo.DONDATVE ddv2 ON i2.DonDatVeID = ddv2.DonDatVeID
        WHERE ddv1.SuatChieuID = ddv2.SuatChieuID
          AND i1.TrangThai <> N'Đã hủy'
          AND i2.TrangThai <> N'Đã hủy'
    )
    BEGIN
        ;THROW 50003, N'Lỗi xung đột [BR02]: Phát hiện chọn trùng cùng một ghế nhiều lần trong cùng một đơn.', 1;
    END
END;
GO

-- 4. Trigger: TRG_DanhGia_KiemTraDaXemPhim
-- Chỉ cho phép khách hàng đánh giá phim khi đã có đơn đặt vé thành công và suất chiếu đã diễn ra
IF OBJECT_ID(N'dbo.TRG_DanhGia_KiemTraDaXemPhim', N'TR') IS NOT NULL DROP TRIGGER dbo.TRG_DanhGia_KiemTraDaXemPhim;
GO

CREATE TRIGGER dbo.TRG_DanhGia_KiemTraDaXemPhim
ON dbo.DANHGIAPHIM
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM INSERTED i
        WHERE NOT EXISTS (
            SELECT 1
            FROM dbo.DONDATVE ddv
            INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
            WHERE ddv.NguoiDungID = i.NguoiDungID
              AND sc.PhimID = i.PhimID
              AND ddv.TrangThai IN (N'Đã thanh toán', N'Hoàn thành')
              AND sc.ThoiGianBatDau <= SYSDATETIME()
        )
    )
    BEGIN
        ;THROW 50004, N'Lỗi nghiệp vụ [BR05]: Khách hàng chỉ có thể đánh giá sau khi đã mua vé xem phim và suất chiếu đã diễn ra.', 1;
    END
END;
GO

-- 5. Trigger: TRG_XuLyKhieuNai_KiemTraVaiTro
-- Chỉ tài khoản thuộc vai trò CSKH hoặc ADMIN mới được phép ghi nhận lịch sử xử lý khiếu nại
IF OBJECT_ID(N'dbo.TRG_XuLyKhieuNai_KiemTraVaiTro', N'TR') IS NOT NULL DROP TRIGGER dbo.TRG_XuLyKhieuNai_KiemTraVaiTro;
GO

CREATE TRIGGER dbo.TRG_XuLyKhieuNai_KiemTraVaiTro
ON dbo.XULY_KHIEUNAI
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM INSERTED i
        INNER JOIN dbo.NGUOIDUNG nd ON i.NguoiXuLyID = nd.NguoiDungID
        INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
        WHERE vt.MaVaiTro NOT IN ('CSKH', 'ADMIN')
           OR nd.TrangThai <> N'Hoạt động'
    )
    BEGIN
        ;THROW 50005, N'Lỗi bảo mật [BR07]: Chỉ nhân viên Chăm sóc khách hàng hoặc Quản trị viên mới được ghi nhận lịch sử xử lý khiếu nại.', 1;
    END
END;
GO

-- 6. Trigger bổ trợ: TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai
-- Khi có bản ghi xử lý mới, tự động đồng bộ trạng thái khiếu nại tương ứng
IF OBJECT_ID(N'dbo.TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai', N'TR') IS NOT NULL DROP TRIGGER dbo.TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai;
GO

CREATE TRIGGER dbo.TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai
ON dbo.XULY_KHIEUNAI
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE kn
    SET kn.TrangThai = i.TrangThaiSauXuLy
    FROM dbo.KHIEUNAI kn
    INNER JOIN INSERTED i ON kn.KhieuNaiID = i.KhieuNaiID;
END;
GO

PRINT N'>>> [04_triggers.sql] Đã tạo 6 Trigger bảo vệ toàn vẹn nghiệp vụ thành công.';
GO
