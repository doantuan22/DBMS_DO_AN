SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Pricing_Update
(
    @NguoiDungID INT,
    @GiaID INT,
    @PhuThu DECIMAL(18,2),
    @TrangThai NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RapID INT;
    SELECT @RapID = RapID FROM dbo.BANGGIA WHERE GiaID = @GiaID;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
    END

    UPDATE dbo.BANGGIA
    SET PhuThu = @PhuThu,
        TrangThai = @TrangThai
    WHERE GiaID = @GiaID;

    SELECT GiaID, RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai
    FROM dbo.BANGGIA
    WHERE GiaID = @GiaID;
END;
GO
