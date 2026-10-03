SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Room_List
(
    @NguoiDungID INT,
    @RapID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra scope phân công
    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp này.', 1;
    END

    SELECT
        pc.PhongID,
        pc.RapID,
        r.TenRap,
        pc.TenPhong,
        pc.LoaiPhong,
        pc.TrangThai,
        (SELECT COUNT(*) FROM dbo.GHE g WHERE g.PhongID = pc.PhongID) AS TongSoGhe
    FROM dbo.PHONGCHIEU pc
    INNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID
    WHERE pc.RapID = @RapID
    ORDER BY pc.TenPhong;
END;
GO
