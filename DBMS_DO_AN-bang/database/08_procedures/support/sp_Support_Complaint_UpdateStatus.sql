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
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('CSKH', 'ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_KHIEUNAI') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'XULY_KHIEUNAI') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;
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
