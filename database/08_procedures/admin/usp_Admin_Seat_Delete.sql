SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Seat_Delete @GheID INT
AS
BEGIN
    SET NOCOUNT ON;
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
