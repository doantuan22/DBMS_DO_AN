SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Cinema_Delete
    @RapID INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)
        THROW 50095, N'Rạp không tồn tại.', 1;
    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID = @RapID)
       OR EXISTS (SELECT 1 FROM dbo.PHANCONG_RAP WHERE RapID = @RapID)
       OR EXISTS (SELECT 1 FROM dbo.BANGGIA WHERE RapID = @RapID)
       OR EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @RapID)
        THROW 50096, N'Rạp đã có dữ liệu phụ thuộc; hãy chuyển trạng thái sang Tạm đóng thay vì xóa.', 1;
    DELETE dbo.RAPCHIEUPHIM WHERE RapID = @RapID;
    SELECT N'Đã xóa rạp.' AS [Message];
END;
GO
