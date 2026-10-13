SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/012_booking_limits_and_pricing.sql:151 (dbo.sp_Promotion_Validate)
CREATE OR ALTER PROCEDURE dbo.sp_Promotion_Validate
(
    @NguoiDungID INT,
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
    -- PREVIEW ONLY for HTTP callers: no writes, quota reservation or retained locks.
    -- Booking calls this after taking its own promotion UPDLOCK/HOLDLOCK, so the
    -- same validation/formula becomes authoritative inside the booking transaction.
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('KHACH_HANG'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'DAT_VE') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    SET @IsValid = 0;
    SET @TienGiam = 0;
    SET @KhuyenMaiID = NULL;
    SET @LoaiGiamGia = NULL;
    SET @GiaTriGiam = NULL;
    SET @Message = NULL;

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

    -- Capture DB time AFTER the read (and any lock wait), at the stored precision.
    DECLARE @Now DATETIME2(7) = dbo.fn_BayGio();
    IF @Now < @NgayBatDau OR @Now > @NgayKetThuc
    BEGIN
        SET @Message = N'Mã khuyến mãi chưa tới ngày áp dụng hoặc đã hết hạn.';
        RETURN;
    END

    -- Re-check existing CHECK semantics too; no new type, scope or formula.
    IF @LoaiGiamGia NOT IN (N'Phần trăm', N'PERCENT', N'Số tiền', N'FIXED')
       OR @GiaTriGiam <= 0
       OR (@LoaiGiamGia IN (N'Phần trăm', N'PERCENT') AND @GiaTriGiam > 99)
       OR @DonHangToiThieu < 0 OR @GiamToiDa < 0
       OR @SoLuong < 0 OR @SoLuongDaDung < 0 OR @NgayKetThuc < @NgayBatDau
    BEGIN
        SET @Message = N'Điều kiện khuyến mãi không hợp lệ.';
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
