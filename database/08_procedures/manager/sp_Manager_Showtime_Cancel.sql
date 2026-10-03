SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Showtime_Cancel
    @NguoiDungID INT, @SuatChieuID INT, @LyDo NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.sp_Showtime_CancelCascade @SuatChieuID = @SuatChieuID, @NguoiDungID = @NguoiDungID, @LyDo = @LyDo;
END;
GO
