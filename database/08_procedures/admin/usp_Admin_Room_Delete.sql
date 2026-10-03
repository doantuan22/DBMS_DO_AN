SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Room_Delete @PhongID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WITH (UPDLOCK, HOLDLOCK) WHERE PhongID = @PhongID)
            THROW 50202, N'Phòng không tồn tại.', 1;
        IF EXISTS (SELECT 1 FROM dbo.SUATCHIEU WHERE PhongID = @PhongID)
            THROW 50203, N'Phòng đã có lịch sử suất chiếu; hãy đổi trạng thái thay vì xóa.', 1;
        DELETE dbo.GHE WHERE PhongID = @PhongID;
        DELETE dbo.PHONGCHIEU WHERE PhongID = @PhongID;
        COMMIT TRANSACTION;
        SELECT N'Đã xóa phòng.' AS [Message];
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO
