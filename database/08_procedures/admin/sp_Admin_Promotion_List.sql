SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Promotion_List
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
