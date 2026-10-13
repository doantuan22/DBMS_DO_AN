SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER FUNCTION dbo.fn_DonDangGiuGhe
(
    @TrangThai NVARCHAR(50),
    @HanGiuCho DATETIME2,
    @Now DATETIME2
)
RETURNS BIT
AS
BEGIN
    RETURN CASE
        WHEN @TrangThai IN (N'Đã thanh toán', N'Hoàn thành') THEN 1
        WHEN @TrangThai = N'Chờ thanh toán' AND @HanGiuCho > @Now THEN 1
        ELSE 0
    END;
END;
GO
