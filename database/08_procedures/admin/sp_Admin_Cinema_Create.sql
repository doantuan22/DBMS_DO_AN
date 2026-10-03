SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Cinema_Create
(
    @TenRap NVARCHAR(150),
    @DiaChi NVARCHAR(255),
    @ThanhPho NVARCHAR(100),
    @SoDienThoai VARCHAR(20) = NULL,
    @MoTa NVARCHAR(500) = NULL,
    @NgayHoatDong DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.RAPCHIEUPHIM (TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai)
    VALUES (@TenRap, @DiaChi, @ThanhPho, @SoDienThoai, @MoTa, @NgayHoatDong, N'Hoạt động');

    SELECT RapID, TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai
    FROM dbo.RAPCHIEUPHIM
    WHERE RapID = SCOPE_IDENTITY();
END;
GO
