SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_XuLyKhieuNai
(
    @NguoiDungID INT,
    @KhieuNaiID INT,
    @NoiDungXuLy NVARCHAR(MAX),
    @TrangThaiSauXuLy NVARCHAR(50)
)
AS
BEGIN
        SET NOCOUNT ON;
EXEC dbo.sp_Support_Complaint_AddProcessing
        @NguoiDungID = @NguoiDungID,
        @KhieuNaiID = @KhieuNaiID,
        @NoiDungXuLy = @NoiDungXuLy,
        @TrangThaiSauXuLy = @TrangThaiSauXuLy;
END;
GO
