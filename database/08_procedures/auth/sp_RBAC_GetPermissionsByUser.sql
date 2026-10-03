SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_RBAC_GetPermissionsByUser
(
    @NguoiDungID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT q.QuyenID, q.MaQuyen, q.TenQuyen, q.MoTa
    FROM dbo.NGUOIDUNG nd
    INNER JOIN dbo.VAITRO_QUYEN vq ON nd.VaiTroID = vq.VaiTroID
    INNER JOIN dbo.QUYEN q ON vq.QuyenID = q.QuyenID
    WHERE nd.NguoiDungID = @NguoiDungID AND nd.TrangThai = N'Hoạt động';
END;
GO
