SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Showtime_Cancel @SuatChieuID INT
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.sp_Showtime_CancelCascade @SuatChieuID = @SuatChieuID, @NguoiDungID = NULL, @LyDo = NULL;
END;
GO
