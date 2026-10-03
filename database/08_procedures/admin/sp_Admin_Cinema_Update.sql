SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Cinema_Update
(
    @RapID INT,
    @TenRap NVARCHAR(150),
    @DiaChi NVARCHAR(255),
    @ThanhPho NVARCHAR(100),
    @SoDienThoai VARCHAR(20),
    @MoTa NVARCHAR(500),
    @TrangThai NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.RAPCHIEUPHIM
    SET TenRap = @TenRap,
        DiaChi = @DiaChi,
        ThanhPho = @ThanhPho,
        SoDienThoai = @SoDienThoai,
        MoTa = @MoTa,
        TrangThai = @TrangThai
    WHERE RapID = @RapID;

    SELECT RapID, TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, TrangThai
    FROM dbo.RAPCHIEUPHIM
    WHERE RapID = @RapID;
END;
GO
