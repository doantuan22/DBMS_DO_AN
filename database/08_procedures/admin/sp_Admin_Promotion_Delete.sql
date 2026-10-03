SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Promotion_Delete
(
    @KhuyenMaiID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @KhuyenMaiID)
    BEGIN
        ;THROW 50107, N'Khuyến mãi không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE KhuyenMaiID = @KhuyenMaiID)
    BEGIN
        ;THROW 50108, N'Khuyến mãi đã được dùng trong đơn hàng. Hãy chuyển trạng thái sang Tạm dừng thay vì xóa.', 1;
    END

    DELETE FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @KhuyenMaiID;
    SELECT N'Đã xóa khuyến mãi.' AS [Message];
END;
GO
