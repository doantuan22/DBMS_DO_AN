SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Room_Delete
(
    @NguoiDungID INT,
    @PhongID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RapID INT;
    SELECT @RapID = RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp này.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.SUATCHIEU WHERE PhongID = @PhongID)
    BEGIN
        ;THROW 50053, N'Không thể xóa phòng chiếu đã có lịch sử suất chiếu. Vui lòng chuyển trạng thái Ngưng hoạt động.', 1;
    END

    DELETE FROM dbo.GHE WHERE PhongID = @PhongID;
    DELETE FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;

    SELECT N'Xóa phòng chiếu thành công.' AS [Message];
END;
GO
