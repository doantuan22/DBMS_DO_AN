SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER FUNCTION dbo.fn_KiemTraQuyenNguoiDung
(
    @NguoiDungID INT,
    @MaQuyen VARCHAR(50)
)
RETURNS BIT
AS
BEGIN
    DECLARE @HopLe BIT = 0;

    -- Kiểm tra nếu là ADMIN thì có toàn quyền
    IF EXISTS (
        SELECT 1
        FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
        WHERE nd.NguoiDungID = @NguoiDungID
          AND vt.MaVaiTro = 'ADMIN'
          AND nd.TrangThai = N'Hoạt động'
    )
    BEGIN
        RETURN 1;
    END

    -- Kiểm tra quyền cụ thể qua bảng nối VAITRO_QUYEN
    IF EXISTS (
        SELECT 1
        FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO_QUYEN vq ON nd.VaiTroID = vq.VaiTroID
        INNER JOIN dbo.QUYEN q ON vq.QuyenID = q.QuyenID
        WHERE nd.NguoiDungID = @NguoiDungID
          AND q.MaQuyen = @MaQuyen
          AND nd.TrangThai = N'Hoạt động'
    )
    BEGIN
        SET @HopLe = 1;
    END

    RETURN @HopLe;
END;
GO
