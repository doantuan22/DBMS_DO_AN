SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/012_booking_limits_and_pricing.sql:151 (dbo.sp_Promotion_Validate)
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

    IF dbo.fn_BayGio() < @NgayBatDau OR dbo.fn_BayGio() > @NgayKetThuc
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
