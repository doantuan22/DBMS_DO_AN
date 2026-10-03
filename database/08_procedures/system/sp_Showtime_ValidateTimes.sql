SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Showtime_ValidateTimes
    @PhimID INT, @ThoiGianBatDau DATETIME2, @ThoiGianKetThuc DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ThoiLuong INT = (SELECT ThoiLuong FROM dbo.PHIM WHERE PhimID=@PhimID);
    DECLARE @Span DECIMAL(20,7)=DATEDIFF_BIG(SECOND,@ThoiGianBatDau,@ThoiGianKetThuc)
        +(CONVERT(DECIMAL(20,7),DATEPART(NANOSECOND,@ThoiGianKetThuc))-DATEPART(NANOSECOND,@ThoiGianBatDau))/1000000000;
    -- Unknown movie retains the existing FK/resource handling; no unrelated validation change.
    IF @ThoiGianBatDau IS NULL OR @ThoiGianKetThuc IS NULL
       OR @ThoiGianBatDau < dbo.fn_BayGio() OR @ThoiGianKetThuc <= @ThoiGianBatDau
       OR @Span>28800
       OR (@ThoiLuong IS NOT NULL AND
           (@Span < CONVERT(BIGINT,@ThoiLuong)*60 OR @Span > (CONVERT(BIGINT,@ThoiLuong)+120)*60))
        THROW 50216, N'Thời gian suất phải từ hiện tại, dài từ thời lượng phim đến thời lượng phim +120 phút và tối đa 8 giờ.', 1;
END;
GO
