SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_CinemaImage_Delete
    @RapID INT,
    @HinhAnhRapID INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @HinhAnhRapID AND RapID = @RapID;
    IF @@ROWCOUNT = 0 THROW 50230, N'Ảnh rạp không tồn tại trong phạm vi rạp.', 1;
    SELECT N'Đã xóa ảnh rạp.' AS [Message];
END;
GO
