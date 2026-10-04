SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_XuLyThanhToan
(
    @NguoiDungID INT,
    @ThanhToanID INT,
    @TrangThaiThanhToan NVARCHAR(50),
    @MaGiaoDichNgoai VARCHAR(100) = NULL,
    @GhiChu NVARCHAR(255) = NULL
)
AS
BEGIN
        SET NOCOUNT ON;
EXEC dbo.sp_Payment_UpdateResult
        @NguoiDungID = @NguoiDungID,
        @ThanhToanID = @ThanhToanID,
        @TrangThaiThanhToan = @TrangThaiThanhToan,
        @MaGiaoDichNgoai = @MaGiaoDichNgoai,
        @GhiChu = @GhiChu;
END;
GO
