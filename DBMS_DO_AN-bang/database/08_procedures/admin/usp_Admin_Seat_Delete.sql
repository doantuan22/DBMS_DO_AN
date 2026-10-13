SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Seat_Delete
    @ActorID INT,
    @GheID INT
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_GHE') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM dbo.GHE WITH (UPDLOCK, HOLDLOCK) WHERE GheID = @GheID)
            THROW 50206, N'Ghế không tồn tại.', 1;
        IF EXISTS (SELECT 1 FROM dbo.CHITIETVE WHERE GheID = @GheID)
            THROW 50207, N'Ghế có lịch sử vé; hãy vô hiệu hóa thay vì xóa.', 1;
        DELETE dbo.GHE WHERE GheID = @GheID;
        COMMIT TRANSACTION;
        SELECT N'Đã xóa ghế.' AS [Message];
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO
