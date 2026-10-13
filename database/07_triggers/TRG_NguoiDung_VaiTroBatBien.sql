-- Kiểm tra toàn vẹn hoặc cập nhật dữ liệu liên quan khi ghi.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE
OR ALTER
TRIGGER dbo.TRG_NguoiDung_VaiTroBatBien ON dbo.NGUOIDUNG AFTER
UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT
            1
        FROM
            inserted i
            INNER JOIN deleted d ON d.NguoiDungID = i.NguoiDungID
        WHERE
            i.VaiTroID <> d.VaiTroID
    )
        THROW 50406, N'Vai trò tài khoản không được thay đổi sau khi tạo.', 1;
END;

GO
