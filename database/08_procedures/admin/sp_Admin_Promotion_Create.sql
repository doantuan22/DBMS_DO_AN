SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Promotion_Create
(
    @ActorID INT,
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
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_KHUYENMAI') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    IF EXISTS (SELECT 1 FROM dbo.KHUYENMAI WHERE MaCode = @MaCode)
    BEGIN
        ;THROW 50072, N'Mã khuyến mãi đã tồn tại.', 1;
    END

    INSERT INTO dbo.KHUYENMAI
    (
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
    )
    VALUES
    (
        @MaCode,
        @MoTa,
        @LoaiGiamGia,
        @GiaTriGiam,
        @DonHangToiThieu,
        @GiamToiDa,
        @NgayBatDau,
        @NgayKetThuc,
        @SoLuong,
        0,
        N'Hoạt động'
    );

    SELECT
        [KhuyenMaiID],
        [MaCode],
        [MoTa],
        [LoaiGiamGia],
        [GiaTriGiam],
        [DonHangToiThieu],
        [GiamToiDa],
        [NgayBatDau],
        [NgayKetThuc],
        [SoLuong],
        [SoLuongDaDung],
        [TrangThai]
    FROM dbo.KHUYENMAI
    WHERE KhuyenMaiID = SCOPE_IDENTITY();
END;
GO
