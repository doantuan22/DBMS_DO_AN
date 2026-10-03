SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/003_complaint_order_ownership.sql:3 (dbo.sp_Complaint_Create)
CREATE OR ALTER PROCEDURE dbo.sp_Complaint_Create
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
    VALUES (@NguoiDungID, @DonDatVeID, @LoaiKhieuNai, @TieuDe, @NoiDung, @MucDoUuTien, dbo.fn_BayGio(), N'Mới');

    SELECT KhieuNaiID, NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai
    FROM dbo.KHIEUNAI
    WHERE KhieuNaiID = SCOPE_IDENTITY();
END;
GO
