-- Đối chiếu metadata và kiểm tra tính toàn vẹn database.
-- Verify current seed without requiring legacy account identities or fixtures.
IF NOT EXISTS (
    SELECT
        1
    FROM
        dbo.VAITRO
    WHERE
        MaVaiTro = 'ADMIN'
)
    OR (
    SELECT
        COUNT(*)
    FROM
        dbo.VAITRO
) <> 4
    THROW 51005, 'Missing fixed roles.', 1;
IF NOT EXISTS (
    SELECT
        1
    FROM
        dbo.NGUOIDUNG n
        JOIN dbo.VAITRO v ON v.VaiTroID = n.VaiTroID
    WHERE
        v.MaVaiTro = 'ADMIN'
        AND n.TrangThai = N'Hoạt động'
)
    THROW 51005, 'Missing active administrator.', 1;
IF NOT EXISTS (
    SELECT
        1
    FROM
        dbo.PHIM
)
    OR NOT EXISTS (
    SELECT
        1
    FROM
        dbo.GHE
)
    OR NOT EXISTS (
    SELECT
        1
    FROM
        dbo.BANGGIA
)
    OR NOT EXISTS (
    SELECT
        1
    FROM
        dbo.SANPHAM
)
    THROW 51005, 'Missing base catalog.', 1;
PRINT 'PASS seed role/admin/base catalog presence; full v2 contract: db:seed:verify';

GO
