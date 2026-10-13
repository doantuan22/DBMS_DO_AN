SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Movie_Delete
(
    @ActorID INT,
    @PhimID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_DANHMUC_PHIM') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.PHIM WHERE PhimID = @PhimID)
    BEGIN
        ;THROW 50102, N'Phim không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.SUATCHIEU WHERE PhimID = @PhimID)
       OR EXISTS (SELECT 1 FROM dbo.DANHGIAPHIM WHERE PhimID = @PhimID)
    BEGIN
        ;THROW 50104, N'Phim đã có suất chiếu hoặc đánh giá. Hãy chuyển trạng thái sang Ngừng chiếu thay vì xóa.', 1;
    END

    DELETE FROM dbo.PHIM WHERE PhimID = @PhimID;
    SELECT N'Đã xóa phim.' AS [Message];
END;
GO
