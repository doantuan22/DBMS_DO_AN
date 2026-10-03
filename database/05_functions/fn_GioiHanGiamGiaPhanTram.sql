SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER FUNCTION dbo.fn_GioiHanGiamGiaPhanTram()
RETURNS INT
AS
BEGIN
    RETURN 99;  -- tối đa 99% (cũng là trần của khuyến mãi phần trăm, xem CK_KHUYENMAI_PhanTram99)
END;
GO
