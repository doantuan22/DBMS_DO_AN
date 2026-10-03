SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/auth/auth_procedures.sql:132 (dbo.sp_Auth_Login)
CREATE OR ALTER PROCEDURE dbo.sp_Auth_Login
(
    @Email VARCHAR(150)
)
AS
BEGIN
    SET NOCOUNT ON;
    -- Mật khẩu được băm (bcrypt) và so sánh ở backend. Thủ tục này chỉ trả về hash để backend đối chiếu.
    -- Recordset 1: 0 dòng nếu email không tồn tại. Recordset 2, 3 chỉ có dữ liệu khi tài khoản đang hoạt động.

    DECLARE @NguoiDungID INT;
    DECLARE @VaiTroID INT;
    DECLARE @TrangThai NVARCHAR(50);

    SELECT @NguoiDungID = NguoiDungID, @VaiTroID = VaiTroID, @TrangThai = TrangThai
    FROM dbo.NGUOIDUNG
    WHERE Email = @Email;

    -- Recordset 1: Thông tin người dùng + hash mật khẩu
    SELECT
        nd.NguoiDungID,
        nd.HoTen,
        nd.Email,
        nd.SoDienThoai,
        nd.MatKhau AS MatKhauHash,
        nd.TrangThai,
        vt.VaiTroID,
        vt.MaVaiTro,
        vt.TenVaiTro,
        hk.DiemTichLuy
    FROM dbo.NGUOIDUNG nd
    INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
    LEFT JOIN dbo.HOSOKHACHHANG hk ON nd.NguoiDungID = hk.NguoiDungID
    WHERE nd.NguoiDungID = @NguoiDungID;

    -- Recordset 2: Danh sách quyền (Permissions)
    SELECT DISTINCT q.QuyenID, q.MaQuyen, q.TenQuyen
    FROM dbo.VAITRO_QUYEN vq
    INNER JOIN dbo.QUYEN q ON vq.QuyenID = q.QuyenID
    WHERE vq.VaiTroID = @VaiTroID
      AND @TrangThai = N'Hoạt động';

    -- Recordset 3: Danh sách rạp được phân công còn hiệu lực (Quản lý rạp)
    SELECT
        pcr.RapID,
        r.TenRap,
        r.ThanhPho,
        pcr.NgayBatDau,
        pcr.NgayKetThuc
    FROM dbo.PHANCONG_RAP pcr
    INNER JOIN dbo.RAPCHIEUPHIM r ON pcr.RapID = r.RapID
    WHERE pcr.NguoiDungID = @NguoiDungID
      AND @TrangThai = N'Hoạt động'
      AND pcr.TrangThai = N'Hiệu lực'
      AND dbo.fn_HomNay() >= pcr.NgayBatDau
      AND (pcr.NgayKetThuc IS NULL OR dbo.fn_HomNay() <= pcr.NgayKetThuc);
END;
GO
