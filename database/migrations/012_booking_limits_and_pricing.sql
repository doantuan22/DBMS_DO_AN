-- Booking limits, hold rules, discount cap and additive surcharges (audit follow-up, round 4).
-- Migrations 001-011 are already deployed and are left untouched. Idempotent: CREATE OR ALTER and guarded DDL.
-- Apply with `sqlcmd -f 65001` (UTF-8). Decisions (fixed by the product owner):
--   * max 10 seats per order, max 10 units per product line (lines of the same product are summed first)
--   * percent promotions in (0, 99]; every discount is capped at 99% of the subtotal, so an order total is always > 0
--   * seat hold is exactly 5 minutes from order creation and is never extended
--   * at most 3 orders per customer may hold seats (unpaid and not past HanGiuCho) at the same time
--   * every surcharge that applies to a seat/showtime is ADDED to the base price (no longer MAX)
-- Existing orders, tickets and payments keep their stored amounts; nothing is recalculated.

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ---------------------------------------------------------------------------------------------
-- Single places for the rules (same pattern as fn_ThoiGianGiuChoPhut)
-- ---------------------------------------------------------------------------------------------
CREATE OR ALTER FUNCTION dbo.fn_ThoiGianGiuChoPhut()
RETURNS INT
AS
BEGIN
    RETURN 5;   -- Điểm duy nhất cấu hình thời gian giữ ghế; không gia hạn
END;
GO

CREATE OR ALTER FUNCTION dbo.fn_GioiHanGheMoiDon()
RETURNS INT
AS
BEGIN
    RETURN 10;
END;
GO

CREATE OR ALTER FUNCTION dbo.fn_GioiHanSoLuongSanPham()
RETURNS INT
AS
BEGIN
    RETURN 10;
END;
GO

CREATE OR ALTER FUNCTION dbo.fn_GioiHanDonDangGiu()
RETURNS INT
AS
BEGIN
    RETURN 3;
END;
GO

CREATE OR ALTER FUNCTION dbo.fn_GioiHanGiamGiaPhanTram()
RETURNS INT
AS
BEGIN
    RETURN 99;  -- tối đa 99% (cũng là trần của khuyến mãi phần trăm, xem CK_KHUYENMAI_PhanTram99)
END;
GO

-- ---------------------------------------------------------------------------------------------
-- Additive surcharges. Before: the largest matching BANGGIA row was applied (MAX). Now: all matching rows
-- are summed. BANGGIA.PhuThu is a fixed amount (>= 0), so no percentage convention is involved. Only the
-- aggregate changed; every predicate is identical to the previous version.
-- ---------------------------------------------------------------------------------------------
CREATE OR ALTER FUNCTION dbo.fn_TinhGiaVe
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

    SELECT @LoaiGhe = LoaiGhe
    FROM dbo.GHE
    WHERE GheID = @GheID;

    IF @LoaiGhe IS NULL SET @LoaiGhe = N'Thường';

    -- 1 = Chủ nhật, 7 = Thứ 7 trong SQL Server
    IF DATEPART(dw, @ThoiGianBatDau) IN (1, 7)
        SET @LoaiNgay = N'Cuối tuần';
    ELSE
        SET @LoaiNgay = N'Ngày thường';

    -- CỘNG DỒN mọi phụ thu hợp lệ (trước đây là MAX)
    SELECT @PhuThu = ISNULL(SUM(PhuThu), 0)
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

-- ---------------------------------------------------------------------------------------------
-- Promotions: percent in (0, 99]. Step 1 reports and normalises existing violators (never deletes);
-- step 2 adds the named CHECK. GiaTriGiam > 0 is already enforced by CK_KHUYENMAI_GiaTriGiam.
-- ---------------------------------------------------------------------------------------------
DECLARE @PromoViolations INT =
(
    SELECT COUNT(*) FROM dbo.KHUYENMAI
    WHERE LoaiGiamGia IN (N'Phần trăm', N'PERCENT') AND GiaTriGiam > 99
);
PRINT CONCAT(N'KHUYENMAI percent promotions above 99 (will be set to 99): ', @PromoViolations);
IF @PromoViolations > 0
BEGIN
    SELECT KhuyenMaiID, MaCode, LoaiGiamGia, GiaTriGiam AS GiaTriTruoc, TrangThai
    FROM dbo.KHUYENMAI
    WHERE LoaiGiamGia IN (N'Phần trăm', N'PERCENT') AND GiaTriGiam > 99;

    -- Rule: cap at the new maximum (99). Rows are kept, status and every other column are untouched.
    UPDATE dbo.KHUYENMAI
    SET GiaTriGiam = 99
    WHERE LoaiGiamGia IN (N'Phần trăm', N'PERCENT') AND GiaTriGiam > 99;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_KHUYENMAI_PhanTram99' AND parent_object_id = OBJECT_ID(N'dbo.KHUYENMAI'))
    ALTER TABLE dbo.KHUYENMAI WITH CHECK
        ADD CONSTRAINT CK_KHUYENMAI_PhanTram99
        CHECK (LoaiGiamGia NOT IN (N'Phần trăm', N'PERCENT') OR GiaTriGiam <= 99);
GO

CREATE OR ALTER PROCEDURE dbo.sp_Promotion_Validate
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
    END

    -- Mọi loại khuyến mãi: mức giảm tối đa 99% tổng tạm tính (cắt bớt, không làm tròn lên) để tổng đơn luôn > 0
    DECLARE @TranGiam DECIMAL(18,2) = ROUND(@TongTienDon * dbo.fn_GioiHanGiamGiaPhanTram() / 100.0, 2, 1);
    IF @TienGiam > @TranGiam
        SET @TienGiam = @TranGiam;

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

CREATE OR ALTER PROCEDURE dbo.sp_Booking_Create
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

    -- Gọi được cả độc lập lẫn trong transaction của bên gọi: chỉ COMMIT/ROLLBACK khi tự mở transaction,
    -- ngược lại dùng SAVE TRANSACTION và chỉ rollback phần của mình.
    DECLARE @TuMoTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;

    BEGIN TRY
        -- Sử dụng mức cô lập cao nhất để ngăn race condition (đặt trùng cùng 1 ghế)
        IF @TuMoTran = 1
            BEGIN TRANSACTION;
        ELSE
            SAVE TRANSACTION sp_Booking_Create;

        -- 1. Kiểm tra tài khoản khách hàng hợp lệ. Khóa dòng khách (UPDLOCK, HOLDLOCK, gán vào biến, không phát
        -- result set) TRƯỚC khóa suất chiếu: các đơn song song của cùng một khách bị xếp hàng, nên giới hạn số đơn
        -- đang giữ chỗ bên dưới không thể bị vượt bằng race. Thứ tự khóa luôn là khách -> suất chiếu -> ghế.
        DECLARE @KhoaKhach INT;
        SELECT @KhoaKhach = NguoiDungID
        FROM dbo.NGUOIDUNG WITH (UPDLOCK, HOLDLOCK)
        WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động';

        IF @KhoaKhach IS NULL
        BEGIN
            ;THROW 50020, N'Tài khoản người dùng không tồn tại hoặc đã bị khóa.', 1;
        END

        -- 1b. Tối đa fn_GioiHanDonDangGiu() đơn đang giữ chỗ (chưa thanh toán và chưa quá HanGiuCho) mỗi khách
        IF (SELECT COUNT(*) FROM dbo.DONDATVE
            WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Chờ thanh toán' AND HanGiuCho > SYSDATETIME())
           >= dbo.fn_GioiHanDonDangGiu()
        BEGIN
            ;THROW 50028, N'Bạn đang giữ chỗ tối đa số đơn cho phép. Hãy thanh toán hoặc chờ đơn cũ hết hạn.', 1;
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

        -- 2b. Giải phóng các đơn đã quá hạn giữ ghế của suất chiếu này (đã khóa suất chiếu ở trên)
        EXEC dbo.sp_Order_ExpirePending @SuatChieuID = @SuatChieuID, @TraVeKetQua = 0;

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

        IF (SELECT COUNT(*) FROM @BangGheCanDat) > dbo.fn_GioiHanGheMoiDon()
        BEGIN
            ;THROW 50026, N'Mỗi đơn chỉ được đặt tối đa số ghế cho phép.', 1;
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
              AND dbo.fn_DonDangGiuGhe(ddv.TrangThai, ddv.HanGiuCho, SYSDATETIME()) = 1
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
            -- Cộng dồn các dòng trùng sản phẩm TRƯỚC khi kiểm trần (không lách được bằng cách tách dòng).
            -- SoLuong đọc BIGINT để giá trị ngoài miền INT bị chặn bởi trần thay vì gây lỗi tràn số.
            IF EXISTS (
                SELECT 1
                FROM OPENJSON(@DanhSachDoAnJson)
                WITH (SanPhamID INT '$.SanPhamID', SoLuong BIGINT '$.SoLuong') j
                WHERE j.SoLuong > 0
                GROUP BY j.SanPhamID
                HAVING SUM(j.SoLuong) > dbo.fn_GioiHanSoLuongSanPham()
            )
            BEGIN
                ;THROW 50027, N'Số lượng mỗi sản phẩm vượt quá mức cho phép.', 1;
            END

            INSERT INTO @BangChiTietDoAn (SanPhamID, SoLuong, DonGia)
            SELECT
                j.SanPhamID,
                CAST(SUM(j.SoLuong) AS INT),
                sp.Gia
            FROM OPENJSON(@DanhSachDoAnJson)
            WITH (
                SanPhamID INT '$.SanPhamID',
                SoLuong BIGINT '$.SoLuong'
            ) j
            INNER JOIN dbo.SANPHAM sp WITH (UPDLOCK, HOLDLOCK) ON j.SanPhamID = sp.SanPhamID
            WHERE j.SoLuong > 0 AND sp.TrangThai = N'Đang bán'
            GROUP BY j.SanPhamID, sp.Gia;
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
                -- Chặn cứng lần nữa: giảm tối đa 99% tổng tạm tính, tổng đơn luôn > 0
                DECLARE @TranGiam DECIMAL(18,2) = ROUND(@TongTruocGiam * dbo.fn_GioiHanGiamGiaPhanTram() / 100.0, 2, 1);
                IF @TienGiamGia > @TranGiam SET @TienGiamGia = @TranGiam;

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
            TrangThai,
            HanGiuCho
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
            N'Chờ thanh toán',
            DATEADD(MINUTE, dbo.fn_ThoiGianGiuChoPhut(), SYSDATETIME())
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

        IF @TuMoTran = 1
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
            ddv.HanGiuCho,
            (SELECT COUNT(*) FROM dbo.CHITIETVE WHERE DonDatVeID = ddv.DonDatVeID) AS SoLuongVe
        FROM dbo.DONDATVE ddv
        WHERE ddv.DonDatVeID = @NewDonDatVeID;

    END TRY
    BEGIN CATCH
        IF XACT_STATE() = -1
            ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE() = 1
        BEGIN
            IF @TuMoTran = 1
                ROLLBACK TRANSACTION;
            ELSE
                ROLLBACK TRANSACTION sp_Booking_Create;
        END
        ;THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Payment_CreateAttempt
(
    @DonDatVeID INT,
    @PhuongThuc NVARCHAR(50),
    @ThanhToanID INT OUTPUT,
    @MaGiaoDich VARCHAR(100) OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Gọi được cả độc lập lẫn trong transaction của bên gọi: chỉ COMMIT/ROLLBACK khi tự mở transaction,
    -- ngược lại dùng SAVE TRANSACTION và chỉ rollback phần của mình.
    DECLARE @TuMoTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @TuMoTran = 1
            BEGIN TRANSACTION;
        ELSE
            SAVE TRANSACTION sp_Payment_CreateAttempt;

        DECLARE @TrangThaiDon NVARCHAR(50);
        DECLARE @TongTien DECIMAL(18,2);
        DECLARE @HanGiuCho DATETIME2;
        DECLARE @Now DATETIME2 = SYSDATETIME();

        SELECT
            @TrangThaiDon = TrangThai,
            @HanGiuCho = HanGiuCho,
            @TongTien = (TongTienVe + TongTienDoAn - TienGiamGia)
        FROM dbo.DONDATVE WITH (UPDLOCK, HOLDLOCK)
        WHERE DonDatVeID = @DonDatVeID;

        IF @TrangThaiDon IS NULL
        BEGIN
            ;THROW 50030, N'Đơn đặt vé không tồn tại.', 1;
        END

        IF @TrangThaiDon = N'Hết hạn' OR (@TrangThaiDon = N'Chờ thanh toán' AND @HanGiuCho <= @Now)
        BEGIN
            ;THROW 50111, N'Đơn đã hết thời gian giữ ghế. Vui lòng đặt vé lại.', 1;
        END

        IF @TrangThaiDon NOT IN (N'Chờ thanh toán')
        BEGIN
            ;THROW 50031, N'Đơn hàng không ở trạng thái Chờ thanh toán.', 1;
        END

        SET @MaGiaoDich = CONCAT('TXN-', FORMAT(@Now, 'yyyyMMddHHmmss'), '-', CAST(@DonDatVeID AS VARCHAR(10)), '-', LEFT(REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', ''), 6));

        INSERT INTO dbo.THANHTOAN (DonDatVeID, PhuongThuc, SoTien, NgayTao, MaGiaoDich, TrangThai)
        VALUES (@DonDatVeID, @PhuongThuc, @TongTien, @Now, @MaGiaoDich, N'Đang xử lý');

        SET @ThanhToanID = SCOPE_IDENTITY();

        -- Hạn giữ ghế chỉ được đặt MỘT lần lúc tạo đơn (fn_ThoiGianGiuChoPhut); không thao tác thanh toán nào gia hạn nó.

        IF @TuMoTran = 1
            COMMIT TRANSACTION;

        SELECT
            tt.ThanhToanID,
            tt.DonDatVeID,
            tt.PhuongThuc,
            tt.SoTien,
            tt.NgayTao,
            tt.MaGiaoDich,
            tt.TrangThai,
            ddv.HanGiuCho
        FROM dbo.THANHTOAN tt
        INNER JOIN dbo.DONDATVE ddv ON ddv.DonDatVeID = tt.DonDatVeID
        WHERE tt.ThanhToanID = @ThanhToanID;

    END TRY
    BEGIN CATCH
        IF XACT_STATE() = -1
            ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE() = 1
        BEGIN
            IF @TuMoTran = 1
                ROLLBACK TRANSACTION;
            ELSE
                ROLLBACK TRANSACTION sp_Payment_CreateAttempt;
        END
        ;THROW;
    END CATCH
END;
GO
