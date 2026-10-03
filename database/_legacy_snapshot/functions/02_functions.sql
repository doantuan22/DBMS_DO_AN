-- ============================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP
-- KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY
-- SCRIPT 02: TẠO CÁC USER-DEFINED FUNCTIONS (FUNCTIONS)
-- ============================================================================

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 0a. Function: fn_ThoiGianGiuChoPhut (thời gian giữ ghế khi đơn chờ thanh toán, tính bằng phút)
-- LƯU Ý: migration 012 đặt lại giá trị này = 5 phút và hạn giữ không bao giờ được gia hạn (CREATE OR ALTER).
IF OBJECT_ID(N'dbo.fn_ThoiGianGiuChoPhut', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_ThoiGianGiuChoPhut;
GO
CREATE FUNCTION dbo.fn_ThoiGianGiuChoPhut()
RETURNS INT
AS
BEGIN
    RETURN 10;   -- Điểm duy nhất cấu hình thời gian giữ ghế (chuẩn rạp: 5-15 phút)
END;
GO

-- 0b. Function: fn_ThoiGianGiaHanThanhToanPhut (trước đây: gia hạn giữ ghế khi khách bắt đầu một lần thanh toán;
--     KHÔNG còn được dùng từ migration 012 vì hạn giữ không còn gia hạn)
IF OBJECT_ID(N'dbo.fn_ThoiGianGiaHanThanhToanPhut', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_ThoiGianGiaHanThanhToanPhut;
GO
CREATE FUNCTION dbo.fn_ThoiGianGiaHanThanhToanPhut()
RETURNS INT
AS
BEGIN
    RETURN 5;
END;
GO

-- 0c. Function: fn_DonDangGiuGhe (đơn có đang chiếm ghế hay không)
--  * Đã thanh toán / Hoàn thành: chiếm ghế vĩnh viễn
--  * Chờ thanh toán: chỉ chiếm ghế khi chưa quá HanGiuCho (đơn quá hạn nhả ghế ngay, không cần chờ job dọn)
--  * Còn lại (Đã hủy, Hết hạn...): không chiếm ghế
-- @Now được truyền vào (thay vì gọi SYSDATETIME bên trong) để function có thể inline trong truy vấn lớn.
IF OBJECT_ID(N'dbo.fn_DonDangGiuGhe', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_DonDangGiuGhe;
GO
CREATE FUNCTION dbo.fn_DonDangGiuGhe
(
    @TrangThai NVARCHAR(50),
    @HanGiuCho DATETIME2,
    @Now DATETIME2
)
RETURNS BIT
AS
BEGIN
    RETURN CASE
        WHEN @TrangThai IN (N'Đã thanh toán', N'Hoàn thành') THEN 1
        WHEN @TrangThai = N'Chờ thanh toán' AND @HanGiuCho > @Now THEN 1
        ELSE 0
    END;
END;
GO

-- 1. Function: fn_TinhGiaVe (Tính giá vé chốt cho từng ghế theo suất chiếu và phụ thu bảng giá)
IF OBJECT_ID(N'dbo.fn_TinhGiaVe', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_TinhGiaVe;
GO

CREATE FUNCTION dbo.fn_TinhGiaVe
(
    @SuatChieuID INT,
    @GheID INT
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @GiaVeCoBan DECIMAL(18,2) = 0;
    DECLARE @RapID INT;
    DECLARE @DinhDang NVARCHAR(50);
    DECLARE @ThoiGianBatDau DATETIME2;
    DECLARE @LoaiGhe NVARCHAR(50);
    DECLARE @LoaiNgay NVARCHAR(50);
    DECLARE @NgayChieu DATE;
    DECLARE @PhuThu DECIMAL(18,2) = 0;

    -- Lấy thông tin suất chiếu và rạp
    SELECT
        @GiaVeCoBan = sc.GiaVeCoBan,
        @DinhDang = sc.DinhDang,
        @ThoiGianBatDau = sc.ThoiGianBatDau,
        @RapID = pc.RapID,
        @NgayChieu = CAST(sc.ThoiGianBatDau AS DATE)
    FROM dbo.SUATCHIEU sc
    INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
    WHERE sc.SuatChieuID = @SuatChieuID;

    IF @GiaVeCoBan IS NULL RETURN 0;

    -- Lấy loại ghế
    SELECT @LoaiGhe = LoaiGhe
    FROM dbo.GHE
    WHERE GheID = @GheID;

    IF @LoaiGhe IS NULL SET @LoaiGhe = N'Thường';

    -- Xác định loại ngày: 1 = Chủ nhật, 7 = Thứ 7 trong SQL Server
    IF DATEPART(dw, @ThoiGianBatDau) IN (1, 7)
        SET @LoaiNgay = N'Cuối tuần';
    ELSE
        SET @LoaiNgay = N'Ngày thường';

    -- Tìm phụ thu lớn nhất từ bảng giá hợp lệ
    SELECT @PhuThu = ISNULL(MAX(PhuThu), 0)
    FROM dbo.BANGGIA bg
    WHERE bg.RapID = @RapID
      AND bg.TrangThai = N'Áp dụng'
      AND @NgayChieu >= bg.NgayBatDau
      AND (@NgayChieu <= bg.NgayKetThuc OR bg.NgayKetThuc IS NULL)
      AND (bg.LoaiGhe = @LoaiGhe OR bg.LoaiGhe = N'Tất cả')
      AND (bg.LoaiNgay = @LoaiNgay OR bg.LoaiNgay = N'Tất cả')
      AND (bg.DinhDang = @DinhDang OR bg.DinhDang = N'Tất cả');

    RETURN (@GiaVeCoBan + ISNULL(@PhuThu, 0));
END;
GO

-- 2. Function: fn_TinhTongTienVe (Tính tổng tiền vé của một đơn đặt vé)
IF OBJECT_ID(N'dbo.fn_TinhTongTienVe', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_TinhTongTienVe;
GO

CREATE FUNCTION dbo.fn_TinhTongTienVe
(
    @DonDatVeID INT
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @TongTienVe DECIMAL(18,2) = 0;

    SELECT @TongTienVe = ISNULL(SUM(GiaVe), 0)
    FROM dbo.CHITIETVE
    WHERE DonDatVeID = @DonDatVeID
      AND TrangThai <> N'Đã hủy';

    RETURN @TongTienVe;
END;
GO

-- 3. Function: fn_TinhTongTienDoAn (Tính tổng tiền đồ ăn của một đơn đặt vé)
IF OBJECT_ID(N'dbo.fn_TinhTongTienDoAn', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_TinhTongTienDoAn;
GO

CREATE FUNCTION dbo.fn_TinhTongTienDoAn
(
    @DonDatVeID INT
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @TongTienDoAn DECIMAL(18,2) = 0;

    SELECT @TongTienDoAn = ISNULL(SUM(SoLuong * DonGia), 0)
    FROM dbo.CHITIETDOAN
    WHERE DonDatVeID = @DonDatVeID;

    RETURN @TongTienDoAn;
END;
GO

-- 4. Function: fn_TinhTongTienDon (Tính tổng tiền thực tế cần thanh toán sau giảm giá)
IF OBJECT_ID(N'dbo.fn_TinhTongTienDon', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_TinhTongTienDon;
GO

CREATE FUNCTION dbo.fn_TinhTongTienDon
(
    @DonDatVeID INT
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @TongTienVe DECIMAL(18,2) = 0;
    DECLARE @TongTienDoAn DECIMAL(18,2) = 0;
    DECLARE @TienGiamGia DECIMAL(18,2) = 0;
    DECLARE @TongThanhToan DECIMAL(18,2) = 0;

    SELECT
        @TongTienVe = TongTienVe,
        @TongTienDoAn = TongTienDoAn,
        @TienGiamGia = TienGiamGia
    FROM dbo.DONDATVE
    WHERE DonDatVeID = @DonDatVeID;

    SET @TongThanhToan = @TongTienVe + @TongTienDoAn - @TienGiamGia;

    IF @TongThanhToan < 0 SET @TongThanhToan = 0;

    RETURN @TongThanhToan;
END;
GO

-- 5. Function: fn_DanhSachGheSuatChieu (Table-Valued Function trả về sơ đồ ghế và tình trạng từng ghế theo suất chiếu)
IF OBJECT_ID(N'dbo.fn_DanhSachGheSuatChieu', N'IF') IS NOT NULL DROP FUNCTION dbo.fn_DanhSachGheSuatChieu;
IF OBJECT_ID(N'dbo.fn_DanhSachGheSuatChieu', N'TF') IS NOT NULL DROP FUNCTION dbo.fn_DanhSachGheSuatChieu;
GO

CREATE FUNCTION dbo.fn_DanhSachGheSuatChieu
(
    @SuatChieuID INT
)
RETURNS TABLE
AS
RETURN
(
    WITH GhePhong AS (
        SELECT
            g.GheID,
            g.PhongID,
            g.HangGhe,
            g.SoGhe,
            (g.HangGhe + CAST(g.SoGhe AS VARCHAR(10))) AS TenGhe,
            g.LoaiGhe,
            g.TrangThai AS TrangThaiGheVatLy
        FROM dbo.SUATCHIEU sc
        INNER JOIN dbo.GHE g ON sc.PhongID = g.PhongID
        WHERE sc.SuatChieuID = @SuatChieuID
    ),
    GheChiemCho AS (
        -- Mức 2 = đã bán (đơn đã thanh toán), mức 1 = đang giữ chỗ chờ thanh toán
        SELECT
            cv.GheID,
            MAX(CASE WHEN ddv.TrangThai = N'Chờ thanh toán' THEN 1 ELSE 2 END) AS Muc
        FROM dbo.CHITIETVE cv
        INNER JOIN dbo.DONDATVE ddv ON cv.DonDatVeID = ddv.DonDatVeID
        WHERE ddv.SuatChieuID = @SuatChieuID
          AND cv.TrangThai <> N'Đã hủy'
          AND dbo.fn_DonDangGiuGhe(ddv.TrangThai, ddv.HanGiuCho, SYSDATETIME()) = 1
        GROUP BY cv.GheID
    )
    SELECT
        gp.GheID,
        gp.PhongID,
        gp.HangGhe,
        gp.SoGhe,
        gp.TenGhe,
        gp.LoaiGhe,
        dbo.fn_TinhGiaVe(@SuatChieuID, gp.GheID) AS GiaVe,
        CASE
            WHEN gp.TrangThaiGheVatLy <> N'Hoạt động' THEN N'Bảo trì'
            WHEN gdd.Muc = 2 THEN N'Đã đặt'
            WHEN gdd.Muc = 1 THEN N'Đang giữ'
            ELSE N'Trống'
        END AS TrangThaiGhe
    FROM GhePhong gp
    LEFT JOIN GheChiemCho gdd ON gp.GheID = gdd.GheID
);
GO

-- 6. Helper Function: fn_KiemTraQuyenNguoiDung (Kiểm tra quyền chức năng RBAC)
IF OBJECT_ID(N'dbo.fn_KiemTraQuyenNguoiDung', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_KiemTraQuyenNguoiDung;
GO

CREATE FUNCTION dbo.fn_KiemTraQuyenNguoiDung
(
    @NguoiDungID INT,
    @MaQuyen VARCHAR(50)
)
RETURNS BIT
AS
BEGIN
    DECLARE @HopLe BIT = 0;

    -- Kiểm tra nếu là ADMIN thì có toàn quyền
    IF EXISTS (
        SELECT 1
        FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
        WHERE nd.NguoiDungID = @NguoiDungID
          AND vt.MaVaiTro = 'ADMIN'
          AND nd.TrangThai = N'Hoạt động'
    )
    BEGIN
        RETURN 1;
    END

    -- Kiểm tra quyền cụ thể qua bảng nối VAITRO_QUYEN
    IF EXISTS (
        SELECT 1
        FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO_QUYEN vq ON nd.VaiTroID = vq.VaiTroID
        INNER JOIN dbo.QUYEN q ON vq.QuyenID = q.QuyenID
        WHERE nd.NguoiDungID = @NguoiDungID
          AND q.MaQuyen = @MaQuyen
          AND nd.TrangThai = N'Hoạt động'
    )
    BEGIN
        SET @HopLe = 1;
    END

    RETURN @HopLe;
END;
GO

-- 7. Helper Function: fn_KiemTraQuanLyRapScope (Kiểm tra phạm vi rạp được phân công còn hiệu lực)
IF OBJECT_ID(N'dbo.fn_KiemTraQuanLyRapScope', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_KiemTraQuanLyRapScope;
GO

CREATE FUNCTION dbo.fn_KiemTraQuanLyRapScope
(
    @NguoiDungID INT,
    @RapID INT
)
RETURNS BIT
AS
BEGIN
    -- Nếu là ADMIN thì có quyền trên mọi rạp
    IF EXISTS (
        SELECT 1
        FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
        WHERE nd.NguoiDungID = @NguoiDungID
          AND vt.MaVaiTro = 'ADMIN'
          AND nd.TrangThai = N'Hoạt động'
    )
    BEGIN
        RETURN 1;
    END

    -- Nếu là QUAN_LY_RAP, kiểm tra bảng PHANCONG_RAP còn hiệu lực
    IF EXISTS (
        SELECT 1
        FROM dbo.PHANCONG_RAP pcr
        INNER JOIN dbo.NGUOIDUNG nd ON pcr.NguoiDungID = nd.NguoiDungID
        WHERE pcr.NguoiDungID = @NguoiDungID
          AND pcr.RapID = @RapID
          AND pcr.TrangThai = N'Hiệu lực'
          AND CAST(SYSDATETIME() AS DATE) >= pcr.NgayBatDau
          AND (pcr.NgayKetThuc IS NULL OR CAST(SYSDATETIME() AS DATE) <= pcr.NgayKetThuc)
          AND nd.TrangThai = N'Hoạt động'
    )
    BEGIN
        RETURN 1;
    END

    RETURN 0;
END;
GO

PRINT N'>>> [02_functions.sql] Đã tạo 10 User-Defined Functions thành công.';
GO
