SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Cinema_Delete

    @ActorID INT,
    @RapID INT
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_RAP') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)
        THROW 50095, N'Rạp không tồn tại.', 1;
    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID = @RapID)
       OR EXISTS (SELECT 1 FROM dbo.PHANCONG_RAP WHERE RapID = @RapID)
       OR EXISTS (SELECT 1 FROM dbo.BANGGIA WHERE RapID = @RapID)
       OR EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @RapID)
        THROW 50096, N'Rạp đã có dữ liệu phụ thuộc; hãy chuyển trạng thái sang Tạm đóng thay vì xóa.', 1;
    DELETE dbo.RAPCHIEUPHIM WHERE RapID = @RapID;
    SELECT N'Đã xóa rạp.' AS [Message];
END;
GO
