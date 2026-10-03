SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Complaint_ListByCustomer
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
