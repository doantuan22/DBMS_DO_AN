SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Pricing_List
(
    @NguoiDungID INT,
    @RapID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
    END

    SELECT
        GiaID,
        RapID,
        LoaiGhe,
        LoaiNgay,
        DinhDang,
        PhuThu,
        NgayBatDau,
        NgayKetThuc,
        TrangThai
    FROM dbo.BANGGIA
    WHERE RapID = @RapID
    ORDER BY NgayBatDau DESC, LoaiGhe, LoaiNgay;
END;
GO
