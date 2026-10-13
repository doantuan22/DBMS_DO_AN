SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Showtime_ValidateTimes
    @PhimID INT, @ThoiGianBatDau DATETIME2, @ThoiGianKetThuc DATETIME2,
    @PhongID INT = NULL, @SuatChieuID INT = NULL, @TrangThai NVARCHAR(50) = N'Mở bán'
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
    -- Writers hold the room UPDLOCK/HOLDLOCK in their transaction before calling.
    -- Current committed read, including when the caller uses RCSI; no broad empty-range locks.
    IF @PhongID IS NOT NULL AND @TrangThai<>N'Đã hủy' AND EXISTS (
        SELECT 1 FROM dbo.SUATCHIEU WITH (READCOMMITTEDLOCK)
        WHERE PhongID=@PhongID AND (@SuatChieuID IS NULL OR SuatChieuID<>@SuatChieuID)
          AND TrangThai<>N'Đã hủy' AND ThoiGianBatDau<@ThoiGianKetThuc AND ThoiGianKetThuc>@ThoiGianBatDau
    ) THROW 50001,N'Lỗi ràng buộc [BR01]: Phòng chiếu đã có suất chiếu khác trong khoảng thời gian này.',1;
END;
GO
