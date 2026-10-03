SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Promotion_Update
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
