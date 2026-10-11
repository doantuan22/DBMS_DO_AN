SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_StaffBooking_Customers
    @ActorID int, @PortalRole varchar(50), @Search nvarchar(100)
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.sp_StaffBooking_Authorize @ActorID,@PortalRole;
    SET @Search=LTRIM(RTRIM(@Search));
    IF @Search IS NULL OR LEN(@Search)<2 THROW 50511, N'Nhập ít nhất hai ký tự để tìm khách hàng.',1;
    -- CHARINDEX treats %, _ and [ as literal search input.
    SELECT TOP (50) n.NguoiDungID,n.HoTen,n.Email,n.SoDienThoai,
        COUNT(*) OVER() AS TotalMatches
    FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO r ON r.VaiTroID=n.VaiTroID
    WHERE r.MaVaiTro='KHACH_HANG' AND n.TrangThai=N'Hoạt động'
      AND (CHARINDEX(@Search,n.HoTen)>0 OR CHARINDEX(@Search,n.Email)>0 OR CHARINDEX(@Search,ISNULL(n.SoDienThoai,''))>0)
    ORDER BY n.HoTen,n.NguoiDungID;
END;
GO
