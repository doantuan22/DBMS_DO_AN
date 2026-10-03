SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Pricing_Create
(
    @NguoiDungID INT,
    @RapID INT,
    @LoaiGhe NVARCHAR(50),
    @LoaiNgay NVARCHAR(50),
    @DinhDang NVARCHAR(50),
    @PhuThu DECIMAL(18,2),
    @NgayBatDau DATE,
    @NgayKetThuc DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
    END

    INSERT INTO dbo.BANGGIA (RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai)
    VALUES (@RapID, @LoaiGhe, @LoaiNgay, @DinhDang, @PhuThu, @NgayBatDau, @NgayKetThuc, N'Áp dụng');

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
    WHERE GiaID = SCOPE_IDENTITY();
END;
GO
