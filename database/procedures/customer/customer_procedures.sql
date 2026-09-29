-- ============================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP
-- KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY
-- STORED PROCEDURES - NHÓM KHÁCH HÀNG & PUBLIC (CUSTOMER)
-- ============================================================================

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO


-- Danh mục thể loại
IF OBJECT_ID(N'dbo.sp_Genre_List', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Genre_List;
GO

CREATE PROCEDURE dbo.sp_Genre_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TheLoaiID, TenTheLoai FROM dbo.THELOAI ORDER BY TenTheLoai;
END;
GO

-- Danh mục rạp
IF OBJECT_ID(N'dbo.sp_Cinema_List', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Cinema_List;
GO

CREATE PROCEDURE dbo.sp_Cinema_List
(
    @ThanhPho NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        RapID,
        TenRap,
        DiaChi,
        ThanhPho,
        SoDienThoai,
        MoTa,
        NgayHoatDong,
        TrangThai
    FROM dbo.RAPCHIEUPHIM
    WHERE (@ThanhPho IS NULL OR ThanhPho = @ThanhPho)
      AND TrangThai = N'Hoạt động'
    ORDER BY ThanhPho, TenRap;
END;
GO

-- KH-04: Danh sách phim
IF OBJECT_ID(N'dbo.sp_Movie_List', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Movie_List;
GO

CREATE PROCEDURE dbo.sp_Movie_List
(
    @TrangThai NVARCHAR(50) = NULL,
    @TheLoaiID INT = NULL,
    @SearchTerm NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT
        p.PhimID,
        p.TenPhim,
        p.ThoiLuong,
        p.NgayKhoiChieu,
        p.NgayKetThuc,
        p.NgonNgu,
        p.PhuDe,
        p.DoTuoi,
        p.DaoDien,
        p.PosterURL,
        p.TrailerURL,
        p.TrangThai,
        tp.DiemDanhGiaTrungBinh,
        tp.SoLuotDanhGia,
        STUFF((
            SELECT ', ' + t.TenTheLoai
            FROM dbo.PHIM_THELOAI pt
            INNER JOIN dbo.THELOAI t ON pt.TheLoaiID = t.TheLoaiID
            WHERE pt.PhimID = p.PhimID
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS DanhSachTheLoai
    FROM dbo.PHIM p
    LEFT JOIN dbo.vw_ThongKePhim tp ON p.PhimID = tp.PhimID
    LEFT JOIN dbo.PHIM_THELOAI pt2 ON p.PhimID = pt2.PhimID
    WHERE (@TrangThai IS NULL OR p.TrangThai = @TrangThai)
      AND (@TheLoaiID IS NULL OR pt2.TheLoaiID = @TheLoaiID)
      AND (@SearchTerm IS NULL OR p.TenPhim LIKE '%' + @SearchTerm + '%' OR p.DaoDien LIKE '%' + @SearchTerm + '%')
    ORDER BY p.NgayKhoiChieu DESC;
END;
GO

-- KH-04: Chi tiết phim (kèm thể loại, diễn viên và đánh giá)
IF OBJECT_ID(N'dbo.sp_Movie_GetDetail', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Movie_GetDetail;
GO

CREATE PROCEDURE dbo.sp_Movie_GetDetail
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

-- KH-05: Lịch chiếu theo phim / rạp / ngày
IF OBJECT_ID(N'dbo.sp_Showtime_ListByMovie', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Showtime_ListByMovie;
GO

CREATE PROCEDURE dbo.sp_Showtime_ListByMovie
(
    @PhimID INT,
    @RapID INT = NULL,
    @NgayChieu DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        SuatChieuID,
        PhimID,
        TenPhim,
        PosterURL,
        ThoiLuong,
        DoTuoi,
        RapID,
        TenRap,
        DiaChiRap,
        ThanhPho,
        PhongID,
        TenPhong,
        LoaiPhong,
        ThoiGianBatDau,
        ThoiGianKetThuc,
        NgayChieu,
        GioBatDau,
        GioKetThuc,
        DinhDang,
        GiaVeCoBan,
        TrangThaiSuatChieu,
        TongSoGhe,
        SoGheDaDat,
        (TongSoGhe - SoGheDaDat) AS SoGheConLai
    FROM dbo.vw_LichChieuChiTiet
    WHERE PhimID = @PhimID
      AND (@RapID IS NULL OR RapID = @RapID)
      AND (@NgayChieu IS NULL OR NgayChieu = @NgayChieu)
      AND TrangThaiSuatChieu = N'Mở bán'
      AND ThoiGianBatDau > SYSDATETIME()
    ORDER BY ThoiGianBatDau ASC;
END;
GO

-- KH-05: Lấy thông tin chi tiết một suất chiếu
IF OBJECT_ID(N'dbo.sp_Showtime_GetDetail', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Showtime_GetDetail;
GO

CREATE PROCEDURE dbo.sp_Showtime_GetDetail
(
    @SuatChieuID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        SuatChieuID,
        PhimID,
        TenPhim,
        PosterURL,
        ThoiLuong,
        DoTuoi,
        RapID,
        TenRap,
        DiaChiRap,
        ThanhPho,
        PhongID,
        TenPhong,
        LoaiPhong,
        ThoiGianBatDau,
        ThoiGianKetThuc,
        NgayChieu,
        GioBatDau,
        GioKetThuc,
        DinhDang,
        GiaVeCoBan,
        TrangThaiSuatChieu,
        TongSoGhe,
        SoGheDaDat,
        (TongSoGhe - SoGheDaDat) AS SoGheConLai
    FROM dbo.vw_LichChieuChiTiet
    WHERE SuatChieuID = @SuatChieuID;
END;
GO

-- KH-06: Danh sách sơ đồ ghế theo suất chiếu (Gọi Table-Valued Function)
IF OBJECT_ID(N'dbo.sp_Seat_ListByShowtime', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Seat_ListByShowtime;
GO

CREATE PROCEDURE dbo.sp_Seat_ListByShowtime
(
    @SuatChieuID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        GheID,
        PhongID,
        HangGhe,
        SoGhe,
        TenGhe,
        LoaiGhe,
        GiaVe,
        TrangThaiGhe
    FROM dbo.fn_DanhSachGheSuatChieu(@SuatChieuID)
    ORDER BY HangGhe, SoGhe;
END;
GO


-- KH-08: Danh sách sản phẩm đồ ăn/thức uống đang bán
IF OBJECT_ID(N'dbo.sp_Product_ListActive', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Product_ListActive;
GO

CREATE PROCEDURE dbo.sp_Product_ListActive
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        SanPhamID,
        TenSanPham,
        LoaiSanPham,
        Gia,
        MoTa,
        HinhAnh,
        TrangThai
    FROM dbo.SANPHAM
    WHERE TrangThai = N'Đang bán'
    ORDER BY LoaiSanPham, Gia;
END;
GO

-- KH-09: Kiểm tra và tính giá trị giảm giá của khuyến mãi
IF OBJECT_ID(N'dbo.sp_Promotion_Validate', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Promotion_Validate;
GO

CREATE PROCEDURE dbo.sp_Promotion_Validate
(
    @MaCode VARCHAR(50),
    @TongTienDon DECIMAL(18,2),
    @KhuyenMaiID INT OUTPUT,
    @LoaiGiamGia NVARCHAR(20) OUTPUT,
    @GiaTriGiam DECIMAL(18,2) OUTPUT,
    @TienGiam DECIMAL(18,2) OUTPUT,
    @IsValid BIT OUTPUT,
    @Message NVARCHAR(255) OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;

    SET @IsValid = 0;
    SET @TienGiam = 0;
    SET @KhuyenMaiID = NULL;

    DECLARE @DonHangToiThieu DECIMAL(18,2);
    DECLARE @GiamToiDa DECIMAL(18,2);
    DECLARE @NgayBatDau DATETIME2;
    DECLARE @NgayKetThuc DATETIME2;
    DECLARE @SoLuong INT;
    DECLARE @SoLuongDaDung INT;
    DECLARE @TrangThai NVARCHAR(50);

    SELECT
        @KhuyenMaiID = KhuyenMaiID,
        @LoaiGiamGia = LoaiGiamGia,
        @GiaTriGiam = GiaTriGiam,
        @DonHangToiThieu = DonHangToiThieu,
        @GiamToiDa = GiamToiDa,
        @NgayBatDau = NgayBatDau,
        @NgayKetThuc = NgayKetThuc,
        @SoLuong = SoLuong,
        @SoLuongDaDung = SoLuongDaDung,
        @TrangThai = TrangThai
    FROM dbo.KHUYENMAI
    WHERE MaCode = @MaCode;

    IF @KhuyenMaiID IS NULL
    BEGIN
        SET @Message = N'Mã khuyến mãi không tồn tại.';
        RETURN;
    END

    IF @TrangThai <> N'Hoạt động'
    BEGIN
        SET @Message = N'Mã khuyến mãi không còn hoạt động.';
        RETURN;
    END

    IF SYSDATETIME() < @NgayBatDau OR SYSDATETIME() > @NgayKetThuc
    BEGIN
        SET @Message = N'Mã khuyến mãi chưa tới ngày áp dụng hoặc đã hết hạn.';
        RETURN;
    END

    IF @SoLuongDaDung >= @SoLuong
    BEGIN
        SET @Message = N'Mã khuyến mãi đã hết lượt sử dụng.';
        RETURN;
    END

    IF @TongTienDon < @DonHangToiThieu
    BEGIN
        SET @Message = N'Đơn hàng chưa đạt giá trị tối thiểu ' + FORMAT(@DonHangToiThieu, 'N0') + ' đ để áp dụng mã này.';
        RETURN;
    END

    -- Tính tiền giảm
    IF @LoaiGiamGia IN (N'Phần trăm', N'PERCENT')
    BEGIN
        SET @TienGiam = (@TongTienDon * @GiaTriGiam) / 100.0;
        IF @GiamToiDa IS NOT NULL AND @TienGiam > @GiamToiDa
            SET @TienGiam = @GiamToiDa;
    END
    ELSE
    BEGIN
        SET @TienGiam = @GiaTriGiam;
        IF @TienGiam > @TongTienDon
            SET @TienGiam = @TongTienDon;
    END

    SET @IsValid = 1;
    SET @Message = N'Áp dụng mã khuyến mãi thành công.';

    SELECT
        @IsValid AS IsValid,
        @KhuyenMaiID AS KhuyenMaiID,
        @MaCode AS MaCode,
        @LoaiGiamGia AS LoaiGiamGia,
        @GiaTriGiam AS GiaTriGiam,
        @TienGiam AS TienGiam,
        @Message AS [Message];
END;
GO


-- sp_Booking_Create (và alias sp_DatVe):
-- Khóa ghế với UPDLOCK, HOLDLOCK; chốt snapshot giá vé, đồ ăn, giảm giá trong cùng 1 Transaction
IF OBJECT_ID(N'dbo.sp_Booking_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Booking_Create;
IF OBJECT_ID(N'dbo.sp_DatVe', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_DatVe;
GO

CREATE PROCEDURE dbo.sp_Booking_Create
(
    @NguoiDungID INT,
    @SuatChieuID INT,
    @MaKhuyenMai VARCHAR(50) = NULL,
    -- Danh sách ID ghế ngăn cách bởi dấu phẩy, ví dụ '101,102'
    @DanhSachGheId VARCHAR(MAX),
    -- Chuỗi JSON danh sách đồ ăn: '[{"SanPhamID":1,"SoLuong":2},{"SanPhamID":2,"SoLuong":1}]'
    @DanhSachDoAnJson NVARCHAR(MAX) = NULL,
    @NewDonDatVeID INT OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        -- Sử dụng mức cô lập cao nhất để ngăn race condition (đặt trùng cùng 1 ghế)
        BEGIN TRANSACTION;

        -- 1. Kiểm tra tài khoản khách hàng hợp lệ
        IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
        BEGIN
            ;THROW 50020, N'Tài khoản người dùng không tồn tại hoặc đã bị khóa.', 1;
        END

        -- 2. Kiểm tra suất chiếu hợp lệ (còn mở bán và chưa bắt đầu)
        DECLARE @PhongID INT;
        DECLARE @TrangThaiSuatChieu NVARCHAR(50);
        DECLARE @ThoiGianBatDau DATETIME2;

        SELECT
            @PhongID = PhongID,
            @TrangThaiSuatChieu = TrangThai,
            @ThoiGianBatDau = ThoiGianBatDau
        FROM dbo.SUATCHIEU WITH (UPDLOCK, HOLDLOCK)
        WHERE SuatChieuID = @SuatChieuID;

        IF @PhongID IS NULL
        BEGIN
            ;THROW 50021, N'Suất chiếu không tồn tại.', 1;
        END

        IF @TrangThaiSuatChieu <> N'Mở bán' OR @ThoiGianBatDau <= SYSDATETIME()
        BEGIN
            ;THROW 50022, N'Suất chiếu đã kết thúc, đã đóng bán hoặc bị hủy.', 1;
        END

        -- 3. Tách danh sách ghế cần đặt vào bảng tạm
        DECLARE @BangGheCanDat TABLE (GheID INT PRIMARY KEY);
        INSERT INTO @BangGheCanDat (GheID)
        SELECT DISTINCT CAST(value AS INT)
        FROM STRING_SPLIT(@DanhSachGheId, ',')
        WHERE LTRIM(RTRIM(value)) <> '';

        IF NOT EXISTS (SELECT 1 FROM @BangGheCanDat)
        BEGIN
            ;THROW 50023, N'Vui lòng chọn ít nhất một ghế để đặt vé.', 1;
        END

        -- 4. KHÓA CÁC GHẾ VÀ KIỂM TRA TOÀN VẸN:
        -- Khóa hàng trong GHE để ngăn chặn xung đột giữa các giao dịch đồng thời
        DECLARE @GheCount INT;
        SELECT @GheCount = COUNT(*)
        FROM dbo.GHE g WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN @BangGheCanDat bg ON g.GheID = bg.GheID
        WHERE g.PhongID = @PhongID AND g.TrangThai = N'Hoạt động';

        IF @GheCount <> (SELECT COUNT(*) FROM @BangGheCanDat)
        BEGIN
            ;THROW 50024, N'Một số ghế được chọn không hợp lệ, không thuộc phòng chiếu này hoặc đang bảo trì.', 1;
        END

        -- 5. KIỂM TRA TRÙNG GHẾ: Đảm bảo không có ghế nào trong danh sách đã được đặt trong đơn hợp lệ
        IF EXISTS (
            SELECT 1
            FROM dbo.CHITIETVE cv WITH (UPDLOCK, HOLDLOCK)
            INNER JOIN dbo.DONDATVE ddv ON cv.DonDatVeID = ddv.DonDatVeID
            INNER JOIN @BangGheCanDat bg ON cv.GheID = bg.GheID
            WHERE ddv.SuatChieuID = @SuatChieuID
              AND cv.TrangThai <> N'Đã hủy'
              AND ddv.TrangThai NOT IN (N'Đã hủy', N'Hết hạn')
        )
        BEGIN
            ;THROW 50025, N'Một hoặc nhiều ghế bạn chọn vừa được khách hàng khác đặt. Vui lòng chọn ghế khác.', 1;
        END

        -- 6. TÍNH SNAPSHOT GIÁ VÉ CHO TỪNG GHẾ (dùng hàm fn_TinhGiaVe)
        DECLARE @BangChiTietVe TABLE (
            GheID INT,
            GiaVe DECIMAL(18,2),
            MaVe VARCHAR(100)
        );

        INSERT INTO @BangChiTietVe (GheID, GiaVe, MaVe)
        SELECT
            bg.GheID,
            dbo.fn_TinhGiaVe(@SuatChieuID, bg.GheID),
            CONCAT('TK-', FORMAT(SYSDATETIME(), 'yyyyMMddHHmmss'), '-', CAST(bg.GheID AS VARCHAR(10)), '-', LEFT(REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', ''), 6))
        FROM @BangGheCanDat bg;

        DECLARE @TongTienVe DECIMAL(18,2) = 0;
        SELECT @TongTienVe = ISNULL(SUM(GiaVe), 0) FROM @BangChiTietVe;

        -- 7. TÍNH SNAPSHOT ĐỒ ĂN (NẾU CÓ TRUYỀN JSON)
        DECLARE @BangChiTietDoAn TABLE (
            SanPhamID INT,
            SoLuong INT,
            DonGia DECIMAL(18,2)
        );

        IF @DanhSachDoAnJson IS NOT NULL AND ISJSON(@DanhSachDoAnJson) = 1
        BEGIN
            INSERT INTO @BangChiTietDoAn (SanPhamID, SoLuong, DonGia)
            SELECT
                j.SanPhamID,
                j.SoLuong,
                sp.Gia
            FROM OPENJSON(@DanhSachDoAnJson)
            WITH (
                SanPhamID INT '$.SanPhamID',
                SoLuong INT '$.SoLuong'
            ) j
            INNER JOIN dbo.SANPHAM sp WITH (UPDLOCK, HOLDLOCK) ON j.SanPhamID = sp.SanPhamID
            WHERE j.SoLuong > 0 AND sp.TrangThai = N'Đang bán';
        END

        DECLARE @TongTienDoAn DECIMAL(18,2) = 0;
        SELECT @TongTienDoAn = ISNULL(SUM(SoLuong * DonGia), 0) FROM @BangChiTietDoAn;

        -- 8. TÍNH KHUYẾN MÃI (NẾU CÓ)
        DECLARE @KhuyenMaiID INT = NULL;
        DECLARE @TienGiamGia DECIMAL(18,2) = 0;
        DECLARE @TongTruocGiam DECIMAL(18,2) = @TongTienVe + @TongTienDoAn;

        IF @MaKhuyenMai IS NOT NULL AND LTRIM(RTRIM(@MaKhuyenMai)) <> ''
        BEGIN
            DECLARE @LoaiGiamGia NVARCHAR(20);
            DECLARE @GiaTriGiam DECIMAL(18,2);
            DECLARE @IsValid BIT;
            DECLARE @Msg NVARCHAR(255);

            EXEC dbo.sp_Promotion_Validate
                @MaCode = @MaKhuyenMai,
                @TongTienDon = @TongTruocGiam,
                @KhuyenMaiID = @KhuyenMaiID OUTPUT,
                @LoaiGiamGia = @LoaiGiamGia OUTPUT,
                @GiaTriGiam = @GiaTriGiam OUTPUT,
                @TienGiam = @TienGiamGia OUTPUT,
                @IsValid = @IsValid OUTPUT,
                @Message = @Msg OUTPUT;

            IF @IsValid = 1 AND @KhuyenMaiID IS NOT NULL
            BEGIN
                -- Khóa và tăng số lượng đã dùng của khuyến mãi
                UPDATE dbo.KHUYENMAI WITH (UPDLOCK, HOLDLOCK)
                SET SoLuongDaDung = SoLuongDaDung + 1
                WHERE KhuyenMaiID = @KhuyenMaiID;
            END
            ELSE
            BEGIN
                SET @KhuyenMaiID = NULL;
                SET @TienGiamGia = 0;
            END
        END

        -- 9. TẠO BẢN GHI DONDATVE
        INSERT INTO dbo.DONDATVE
        (
            NguoiDungID,
            SuatChieuID,
            KhuyenMaiID,
            NgayDat,
            TongTienVe,
            TongTienDoAn,
            TienGiamGia,
            TrangThai
        )
        VALUES
        (
            @NguoiDungID,
            @SuatChieuID,
            @KhuyenMaiID,
            SYSDATETIME(),
            @TongTienVe,
            @TongTienDoAn,
            @TienGiamGia,
            N'Chờ thanh toán'
        );

        SET @NewDonDatVeID = SCOPE_IDENTITY();

        -- 10. TẠO CÁC BẢN GHI CHITIETVE
        INSERT INTO dbo.CHITIETVE (DonDatVeID, GheID, GiaVe, MaVe, TrangThai)
        SELECT
            @NewDonDatVeID,
            GheID,
            GiaVe,
            MaVe,
            N'Đã đặt'
        FROM @BangChiTietVe;

        -- 11. TẠO CÁC BẢN GHI CHITIETDOAN (NẾU CÓ)
        IF EXISTS (SELECT 1 FROM @BangChiTietDoAn)
        BEGIN
            INSERT INTO dbo.CHITIETDOAN (DonDatVeID, SanPhamID, SoLuong, DonGia)
            SELECT
                @NewDonDatVeID,
                SanPhamID,
                SoLuong,
                DonGia
            FROM @BangChiTietDoAn;
        END

        COMMIT TRANSACTION;

        -- Trả về kết quả chốt của đơn đặt vé
        SELECT
            ddv.DonDatVeID,
            ddv.NguoiDungID,
            ddv.SuatChieuID,
            ddv.NgayDat,
            ddv.TongTienVe,
            ddv.TongTienDoAn,
            ddv.TienGiamGia,
            (ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia) AS TongThanhToan,
            ddv.TrangThai,
            (SELECT COUNT(*) FROM dbo.CHITIETVE WHERE DonDatVeID = ddv.DonDatVeID) AS SoLuongVe
        FROM dbo.DONDATVE ddv
        WHERE ddv.DonDatVeID = @NewDonDatVeID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

-- Alias sp_DatVe cho sp_Booking_Create theo bảng hợp đồng Use Case
CREATE PROCEDURE dbo.sp_DatVe
(
    @NguoiDungID INT,
    @SuatChieuID INT,
    @MaKhuyenMai VARCHAR(50) = NULL,
    @DanhSachGheId VARCHAR(MAX),
    @DanhSachDoAnJson NVARCHAR(MAX) = NULL,
    @NewDonDatVeID INT OUTPUT
)
AS
BEGIN
    EXEC dbo.sp_Booking_Create
        @NguoiDungID = @NguoiDungID,
        @SuatChieuID = @SuatChieuID,
        @MaKhuyenMai = @MaKhuyenMai,
        @DanhSachGheId = @DanhSachGheId,
        @DanhSachDoAnJson = @DanhSachDoAnJson,
        @NewDonDatVeID = @NewDonDatVeID OUTPUT;
END;
GO


-- KH-10: Khởi tạo lần thử thanh toán mới
IF OBJECT_ID(N'dbo.sp_Payment_CreateAttempt', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Payment_CreateAttempt;
GO

CREATE PROCEDURE dbo.sp_Payment_CreateAttempt
(
    @DonDatVeID INT,
    @PhuongThuc NVARCHAR(50),
    @ThanhToanID INT OUTPUT,
    @MaGiaoDich VARCHAR(100) OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @TrangThaiDon NVARCHAR(50);
        DECLARE @TongTien DECIMAL(18,2);

        SELECT
            @TrangThaiDon = TrangThai,
            @TongTien = (TongTienVe + TongTienDoAn - TienGiamGia)
        FROM dbo.DONDATVE WITH (UPDLOCK, HOLDLOCK)
        WHERE DonDatVeID = @DonDatVeID;

        IF @TrangThaiDon IS NULL
        BEGIN
            ;THROW 50030, N'Đơn đặt vé không tồn tại.', 1;
        END

        IF @TrangThaiDon NOT IN (N'Chờ thanh toán')
        BEGIN
            ;THROW 50031, N'Đơn hàng không ở trạng thái Chờ thanh toán.', 1;
        END

        SET @MaGiaoDich = CONCAT('TXN-', FORMAT(SYSDATETIME(), 'yyyyMMddHHmmss'), '-', CAST(@DonDatVeID AS VARCHAR(10)));

        INSERT INTO dbo.THANHTOAN (DonDatVeID, PhuongThuc, SoTien, NgayTao, MaGiaoDich, TrangThai)
        VALUES (@DonDatVeID, @PhuongThuc, @TongTien, SYSDATETIME(), @MaGiaoDich, N'Đang xử lý');

        SET @ThanhToanID = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        SELECT
            ThanhToanID,
            DonDatVeID,
            PhuongThuc,
            SoTien,
            NgayTao,
            MaGiaoDich,
            TrangThai
        FROM dbo.THANHTOAN
        WHERE ThanhToanID = @ThanhToanID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

-- KH-10: Cập nhật kết quả thanh toán & đồng bộ trạng thái đơn (sp_XuLyThanhToan)
IF OBJECT_ID(N'dbo.sp_Payment_UpdateResult', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Payment_UpdateResult;
IF OBJECT_ID(N'dbo.sp_XuLyThanhToan', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_XuLyThanhToan;
GO

CREATE PROCEDURE dbo.sp_Payment_UpdateResult
(
    @ThanhToanID INT,
    @TrangThaiThanhToan NVARCHAR(50), -- 'Thành công' hoặc 'Thất bại'
    @MaGiaoDichNgoai VARCHAR(100) = NULL,
    @GhiChu NVARCHAR(255) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @DonDatVeID INT;
        DECLARE @SoTien DECIMAL(18,2);
        DECLARE @NguoiDungID INT;

        SELECT
            @DonDatVeID = tt.DonDatVeID,
            @SoTien = tt.SoTien,
            @NguoiDungID = ddv.NguoiDungID
        FROM dbo.THANHTOAN tt WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.DONDATVE ddv WITH (UPDLOCK, HOLDLOCK) ON tt.DonDatVeID = ddv.DonDatVeID
        WHERE tt.ThanhToanID = @ThanhToanID;

        IF @DonDatVeID IS NULL
        BEGIN
            ;THROW 50032, N'Giao dịch thanh toán không tồn tại.', 1;
        END

        -- Cập nhật bản ghi THANHTOAN
        UPDATE dbo.THANHTOAN
        SET TrangThai = @TrangThaiThanhToan,
            NgayThanhToan = CASE WHEN @TrangThaiThanhToan = N'Thành công' THEN SYSDATETIME() ELSE NULL END,
            MaGiaoDich = ISNULL(@MaGiaoDichNgoai, MaGiaoDich),
            GhiChu = @GhiChu
        WHERE ThanhToanID = @ThanhToanID;

        -- Đồng bộ trạng thái DONDATVE
        IF @TrangThaiThanhToan = N'Thành công'
        BEGIN
            UPDATE dbo.DONDATVE
            SET TrangThai = N'Đã thanh toán'
            WHERE DonDatVeID = @DonDatVeID;

            -- Cộng điểm tích lũy cho khách hàng (1% số tiền)
            DECLARE @DiemCong INT = CAST(@SoTien / 1000 AS INT);
            IF @DiemCong > 0
            BEGIN
                UPDATE dbo.HOSOKHACHHANG
                SET DiemTichLuy = DiemTichLuy + @DiemCong
                WHERE NguoiDungID = @NguoiDungID;
            END
        END
        ELSE IF @TrangThaiThanhToan = N'Thất bại'
        BEGIN
            -- Giữ đơn ở trạng thái Chờ thanh toán để khách hàng có thể thử lại
            UPDATE dbo.DONDATVE
            SET TrangThai = N'Chờ thanh toán'
            WHERE DonDatVeID = @DonDatVeID AND TrangThai = N'Chờ thanh toán';
        END

        COMMIT TRANSACTION;

        -- Trả về trạng thái chi tiết của đơn
        SELECT
            ddv.DonDatVeID,
            ddv.TrangThai AS TrangThaiDon,
            tt.ThanhToanID,
            tt.MaGiaoDich,
            tt.TrangThai AS TrangThaiThanhToan,
            tt.NgayThanhToan
        FROM dbo.DONDATVE ddv
        INNER JOIN dbo.THANHTOAN tt ON ddv.DonDatVeID = tt.DonDatVeID
        WHERE tt.ThanhToanID = @ThanhToanID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

CREATE PROCEDURE dbo.sp_XuLyThanhToan
(
    @ThanhToanID INT,
    @TrangThaiThanhToan NVARCHAR(50),
    @MaGiaoDichNgoai VARCHAR(100) = NULL,
    @GhiChu NVARCHAR(255) = NULL
)
AS
BEGIN
    EXEC dbo.sp_Payment_UpdateResult
        @ThanhToanID = @ThanhToanID,
        @TrangThaiThanhToan = @TrangThaiThanhToan,
        @MaGiaoDichNgoai = @MaGiaoDichNgoai,
        @GhiChu = @GhiChu;
END;
GO

-- KH-11: Xem lịch sử đặt vé của khách hàng
IF OBJECT_ID(N'dbo.sp_Order_ListByCustomer', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Order_ListByCustomer;
GO

CREATE PROCEDURE dbo.sp_Order_ListByCustomer
(
    @NguoiDungID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        DonDatVeID,
        NguoiDungID,
        SuatChieuID,
        PhimID,
        TenPhim,
        PosterURL,
        RapID,
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
        MaKhuyenMai,
        SoLuongVe,
        TrangThaiThanhToanMoiNhat
    FROM dbo.vw_LichSuDatVe
    WHERE NguoiDungID = @NguoiDungID
    ORDER BY NgayDat DESC;
END;
GO

-- KH-12: Xem chi tiết đơn đặt vé (Enforce Ownership BR04)
IF OBJECT_ID(N'dbo.sp_Order_GetDetailByCustomer', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Order_GetDetailByCustomer;
GO

CREATE PROCEDURE dbo.sp_Order_GetDetailByCustomer
(
    @NguoiDungID INT,
    @DonDatVeID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra quyền sở hữu đơn đặt vé
    IF NOT EXISTS (
        SELECT 1 FROM dbo.DONDATVE
        WHERE DonDatVeID = @DonDatVeID AND NguoiDungID = @NguoiDungID
    )
    BEGIN
        ;THROW 50033, N'Đơn đặt vé không tồn tại hoặc bạn không có quyền xem đơn này.', 1;
    END

    -- Recordset 1: Thông tin tổng quan đơn hàng
    SELECT
        DonDatVeID,
        NguoiDungID,
        HoTenKhachHang,
        Email,
        SoDienThoai,
        SuatChieuID,
        PhimID,
        TenPhim,
        PosterURL,
        DoTuoi,
        ThoiLuong,
        RapID,
        TenRap,
        DiaChiRap,
        PhongID,
        TenPhong,
        LoaiPhong,
        ThoiGianBatDau,
        ThoiGianKetThuc,
        DinhDang,
        NgayDat,
        TongTienVe,
        TongTienDoAn,
        TienGiamGia,
        TongTienThanhToan,
        TrangThaiDon,
        MaKhuyenMai,
        MoTaKhuyenMai,
        DanhSachGhe,
        DanhSachMaVe
    FROM dbo.vw_ChiTietDonDatVe
    WHERE DonDatVeID = @DonDatVeID;

    -- Recordset 2: Chi tiết từng vé
    SELECT
        cv.VeID,
        cv.MaVe,
        g.GheID,
        g.HangGhe,
        g.SoGhe,
        (g.HangGhe + CAST(g.SoGhe AS VARCHAR(10))) AS TenGhe,
        g.LoaiGhe,
        cv.GiaVe,
        cv.TrangThai AS TrangThaiVe
    FROM dbo.CHITIETVE cv
    INNER JOIN dbo.GHE g ON cv.GheID = g.GheID
    WHERE cv.DonDatVeID = @DonDatVeID;

    -- Recordset 3: Chi tiết đồ ăn
    SELECT
        cda.ChiTietDoAnID,
        sp.SanPhamID,
        sp.TenSanPham,
        sp.LoaiSanPham,
        cda.SoLuong,
        cda.DonGia,
        (cda.SoLuong * cda.DonGia) AS ThanhTien
    FROM dbo.CHITIETDOAN cda
    INNER JOIN dbo.SANPHAM sp ON cda.SanPhamID = sp.SanPhamID
    WHERE cda.DonDatVeID = @DonDatVeID;

    -- Recordset 4: Lịch sử thanh toán
    SELECT
        ThanhToanID,
        PhuongThuc,
        SoTien,
        NgayTao,
        NgayThanhToan,
        MaGiaoDich,
        TrangThai,
        GhiChu
    FROM dbo.THANHTOAN
    WHERE DonDatVeID = @DonDatVeID
    ORDER BY ThanhToanID ASC;
END;
GO

-- KH-12: Hủy đơn đặt vé khi còn ở trạng thái Chờ thanh toán
IF OBJECT_ID(N'dbo.sp_Order_Cancel', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Order_Cancel;
GO

CREATE PROCEDURE dbo.sp_Order_Cancel
(
    @NguoiDungID INT,
    @DonDatVeID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @TrangThai NVARCHAR(50);
        DECLARE @KhuyenMaiID INT;

        SELECT
            @TrangThai = TrangThai,
            @KhuyenMaiID = KhuyenMaiID
        FROM dbo.DONDATVE WITH (UPDLOCK, HOLDLOCK)
        WHERE DonDatVeID = @DonDatVeID AND NguoiDungID = @NguoiDungID;

        IF @TrangThai IS NULL
        BEGIN
            ;THROW 50034, N'Đơn đặt vé không tồn tại hoặc bạn không có quyền thao tác.', 1;
        END

        IF @TrangThai <> N'Chờ thanh toán'
        BEGIN
            ;THROW 50035, N'Chỉ có thể hủy đơn khi đang ở trạng thái Chờ thanh toán.', 1;
        END

        -- Cập nhật đơn thành Đã hủy
        UPDATE dbo.DONDATVE
        SET TrangThai = N'Đã hủy'
        WHERE DonDatVeID = @DonDatVeID;

        -- Cập nhật vé thành Đã hủy để giải phóng ghế
        UPDATE dbo.CHITIETVE
        SET TrangThai = N'Đã hủy'
        WHERE DonDatVeID = @DonDatVeID;

        -- Hoàn lại lượt dùng mã khuyến mãi nếu có
        IF @KhuyenMaiID IS NOT NULL
        BEGIN
            UPDATE dbo.KHUYENMAI
            SET SoLuongDaDung = CASE WHEN SoLuongDaDung > 0 THEN SoLuongDaDung - 1 ELSE 0 END
            WHERE KhuyenMaiID = @KhuyenMaiID;
        END

        COMMIT TRANSACTION;

        SELECT N'Hủy đơn đặt vé thành công.' AS [Message];

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO


-- KH-13: Đánh giá phim đã xem
IF OBJECT_ID(N'dbo.sp_Review_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Review_Create;
GO

CREATE PROCEDURE dbo.sp_Review_Create
(
    @NguoiDungID INT,
    @PhimID INT,
    @SoSao INT,
    @NoiDung NVARCHAR(1000) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra đã đánh giá chưa
    IF EXISTS (SELECT 1 FROM dbo.DANHGIAPHIM WHERE PhimID = @PhimID AND NguoiDungID = @NguoiDungID)
    BEGIN
        ;THROW 50040, N'Bạn đã đánh giá phim này rồi.', 1;
    END

    -- Chèn bản ghi đánh giá (Trigger TRG_DanhGia_KiemTraDaXemPhim sẽ tự kiểm tra đã xem phim chưa)
    INSERT INTO dbo.DANHGIAPHIM (PhimID, NguoiDungID, SoSao, NoiDung, NgayDanhGia)
    VALUES (@PhimID, @NguoiDungID, @SoSao, @NoiDung, SYSDATETIME());

    SELECT
        DanhGiaID,
        PhimID,
        NguoiDungID,
        SoSao,
        NoiDung,
        NgayDanhGia
    FROM dbo.DANHGIAPHIM
    WHERE DanhGiaID = SCOPE_IDENTITY();
END;
GO

-- KH-13: Lấy danh sách đánh giá của một phim
IF OBJECT_ID(N'dbo.sp_Review_ListByMovie', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Review_ListByMovie;
GO

CREATE PROCEDURE dbo.sp_Review_ListByMovie
(
    @PhimID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        dg.DanhGiaID,
        dg.PhimID,
        dg.NguoiDungID,
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

-- KH-14: Gửi khiếu nại mới
IF OBJECT_ID(N'dbo.sp_Complaint_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Complaint_Create;
GO

CREATE PROCEDURE dbo.sp_Complaint_Create
(
    @NguoiDungID INT,
    @DonDatVeID INT = NULL,
    @LoaiKhieuNai NVARCHAR(100),
    @TieuDe NVARCHAR(200),
    @NoiDung NVARCHAR(MAX),
    @MucDoUuTien NVARCHAR(50) = N'Trung bình'
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @DonDatVeID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID = @DonDatVeID)
    BEGIN
        ;THROW 50041, N'Đơn đặt vé tham chiếu không tồn tại.', 1;
    END

    INSERT INTO dbo.KHIEUNAI (NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai)
    VALUES (@NguoiDungID, @DonDatVeID, @LoaiKhieuNai, @TieuDe, @NoiDung, @MucDoUuTien, SYSDATETIME(), N'Mới');

    SELECT
        KhieuNaiID,
        NguoiDungID,
        DonDatVeID,
        LoaiKhieuNai,
        TieuDe,
        NoiDung,
        MucDoUuTien,
        NgayTao,
        TrangThai
    FROM dbo.KHIEUNAI
    WHERE KhieuNaiID = SCOPE_IDENTITY();
END;
GO

-- KH-14: Danh sách khiếu nại của khách hàng
IF OBJECT_ID(N'dbo.sp_Complaint_ListByCustomer', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Complaint_ListByCustomer;
GO

CREATE PROCEDURE dbo.sp_Complaint_ListByCustomer
(
    @NguoiDungID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        KhieuNaiID,
        NguoiDungID,
        DonDatVeID,
        LoaiKhieuNai,
        TieuDe,
        NoiDung,
        MucDoUuTien,
        NgayTao,
        TrangThai
    FROM dbo.KHIEUNAI
    WHERE NguoiDungID = @NguoiDungID
    ORDER BY NgayTao DESC;
END;
GO

-- KH-14: Chi tiết khiếu nại và các lần xử lý của khách hàng
IF OBJECT_ID(N'dbo.sp_Complaint_GetByCustomer', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Complaint_GetByCustomer;
GO

CREATE PROCEDURE dbo.sp_Complaint_GetByCustomer
(
    @NguoiDungID INT,
    @KhieuNaiID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID AND NguoiDungID = @NguoiDungID)
    BEGIN
        ;THROW 50042, N'Khiếu nại không tồn tại hoặc bạn không có quyền xem.', 1;
    END

    -- Recordset 1: Chi tiết khiếu nại
    SELECT
        kn.KhieuNaiID,
        kn.NguoiDungID,
        kn.DonDatVeID,
        kn.LoaiKhieuNai,
        kn.TieuDe,
        kn.NoiDung,
        kn.MucDoUuTien,
        kn.NgayTao,
        kn.TrangThai
    FROM dbo.KHIEUNAI kn
    WHERE kn.KhieuNaiID = @KhieuNaiID;

    -- Recordset 2: Các lần xử lý từ CSKH
    SELECT
        xl.XuLyID,
        xl.NoiDungXuLy,
        xl.NgayXuLy,
        xl.TrangThaiSauXuLy
    FROM dbo.XULY_KHIEUNAI xl
    WHERE xl.KhieuNaiID = @KhieuNaiID
    ORDER BY xl.NgayXuLy ASC;
END;
GO

PRINT N'>>> [procedures/customer] Đã tạo 22 Stored Procedures.';
GO
