SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Product_Delete
(
    @SanPhamID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.SANPHAM WHERE SanPhamID = @SanPhamID)
    BEGIN
        ;THROW 50105, N'Sản phẩm không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.CHITIETDOAN WHERE SanPhamID = @SanPhamID)
    BEGIN
        ;THROW 50106, N'Sản phẩm đã có trong đơn hàng. Hãy chuyển trạng thái sang Ngừng bán thay vì xóa.', 1;
    END

    DELETE FROM dbo.SANPHAM WHERE SanPhamID = @SanPhamID;
    SELECT N'Đã xóa sản phẩm.' AS [Message];
END;
GO
