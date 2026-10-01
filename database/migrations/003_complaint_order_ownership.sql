-- DBR-01: block a customer from attaching another customer's order to a complaint.
-- This patch changes only dbo.sp_Complaint_Create and preserves nullable DonDatVeID.
ALTER PROCEDURE dbo.sp_Complaint_Create
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

    IF @DonDatVeID IS NOT NULL AND NOT EXISTS
    (
        SELECT 1
        FROM dbo.DONDATVE
        WHERE DonDatVeID = @DonDatVeID
          AND NguoiDungID = @NguoiDungID
    )
    BEGIN
        -- Same non-disclosing error for a missing or foreign order reference.
        ;THROW 50041, N'Đơn đặt vé tham chiếu không hợp lệ.', 1;
    END

    INSERT INTO dbo.KHIEUNAI (NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai)
    VALUES (@NguoiDungID, @DonDatVeID, @LoaiKhieuNai, @TieuDe, @NoiDung, @MucDoUuTien, SYSDATETIME(), N'Mới');

    SELECT KhieuNaiID, NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai
    FROM dbo.KHIEUNAI
    WHERE KhieuNaiID = SCOPE_IDENTITY();
END;
GO
