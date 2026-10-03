SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/005_support_status_history_atomicity.sql:3 (dbo.sp_Support_Complaint_UpdateStatus)
CREATE OR ALTER PROCEDURE dbo.sp_Support_Complaint_UpdateStatus
(
    @NguoiDungID INT,
    @KhieuNaiID INT,
    @TrangThaiMoi NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'XULY_KHIEUNAI') = 0
            THROW 50060, N'Lỗi bảo mật: Bạn không có quyền xử lý khiếu nại.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)
            THROW 50061, N'Khiếu nại không tồn tại.', 1;
        INSERT INTO dbo.XULY_KHIEUNAI (KhieuNaiID, NguoiXuLyID, NoiDungXuLy, NgayXuLy, TrangThaiSauXuLy)
        VALUES (@KhieuNaiID, @NguoiDungID, N'Cập nhật trạng thái khiếu nại.', dbo.fn_BayGio(), @TrangThaiMoi);
        COMMIT TRANSACTION;
        SELECT KhieuNaiID, TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
