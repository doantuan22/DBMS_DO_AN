SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Seat_Delete
(
    @NguoiDungID INT,
    @GheID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RapID INT;
    SELECT @RapID = pc.RapID
    FROM dbo.GHE g
    INNER JOIN dbo.PHONGCHIEU pc ON g.PhongID = pc.PhongID
    WHERE g.GheID = @GheID;

    IF @RapID IS NULL
    BEGIN
        ;THROW 50109, N'Ghế không tồn tại.', 1;
    END

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.CHITIETVE WHERE GheID = @GheID)
    BEGIN
        ;THROW 50110, N'Ghế đã có vé bán ra. Hãy chuyển trạng thái sang Hỏng/Bảo trì thay vì xóa.', 1;
    END

    DELETE FROM dbo.GHE WHERE GheID = @GheID;
    SELECT N'Đã xóa ghế.' AS [Message];
END;
GO
