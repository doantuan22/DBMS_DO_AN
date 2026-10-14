-- Thêm ghi chú nội bộ cho khiếu nại: sp_Complaint_Chat_AddInternalNote
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Complaint_Chat_AddInternalNote
    (
    @NguoiDungID INT,
    @KhieuNaiID INT,
    @NoiDung NVARCHAR(MAX)
    )
AS
BEGIN
    SET NOCOUNT ON;

    EXEC dbo.sp_Complaint_Chat_Send
        @NguoiDungID = @NguoiDungID,
        @KhieuNaiID = @KhieuNaiID,
        @NoiDung = @NoiDung,
        @LoaiTinNhan = N'Nội bộ';
END;

GO
