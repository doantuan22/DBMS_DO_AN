SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Room_Create
(
    @NguoiDungID INT,
    @RapID INT,
    @TenPhong NVARCHAR(100),
    @LoaiPhong NVARCHAR(50) = N'2D'
)
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp này.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID = @RapID AND TenPhong = @TenPhong)
    BEGIN
        ;THROW 50051, N'Tên phòng chiếu đã tồn tại trong rạp này.', 1;
    END

    INSERT INTO dbo.PHONGCHIEU (RapID, TenPhong, LoaiPhong, TrangThai)
    VALUES (@RapID, @TenPhong, @LoaiPhong, N'Hoạt động');

    SELECT
        PhongID,
        RapID,
        TenPhong,
        LoaiPhong,
        TrangThai
    FROM dbo.PHONGCHIEU
    WHERE PhongID = SCOPE_IDENTITY();
END;
GO
