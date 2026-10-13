-- Chuẩn bị hoặc kiểm tra dữ liệu seed theo target đã xác nhận.
-- Mutation probes only on isolated test target; every accepted mutation rolls back.
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() <> N'CinemaBookingDB_R0_REAL_MEDIA_TEST_20261012'
    OR SESSION_CONTEXT(N'SeedV2Target') IS NULL
    THROW 51103, 'Exact test target required.', 1;
DECLARE @Snapshots nvarchar(max) = (
    SELECT
        *
    FROM
        dbo.DONDATVE
    ORDER BY
        DonDatVeID
    FOR JSON
        PATH
);
DECLARE @Tickets nvarchar(max) = (
    SELECT
        *
    FROM
        dbo.CHITIETVE
    ORDER BY
        VeID
    FOR JSON
        PATH
);
DECLARE @Foods nvarchar(max) = (
    SELECT
        *
    FROM
        dbo.CHITIETDOAN
    ORDER BY
        ChiTietDoAnID
    FOR JSON
        PATH
);
DECLARE @Payments nvarchar(max) = (
    SELECT
        *
    FROM
        dbo.THANHTOAN
    ORDER BY
        ThanhToanID
    FOR JSON
        PATH
);
-- Mở transaction để các bước ghi được xử lý cùng nhau.
BEGIN TRANSACTION;
-- Cập nhật dữ liệu theo điều kiện nghiệp vụ.
UPDATE dbo.SANPHAM
SET
    Gia = Gia + 15000
WHERE
    TenSanPham = N'Bắp rang nhỏ';
-- Cập nhật dữ liệu theo điều kiện nghiệp vụ.
UPDATE dbo.BANGGIA
SET
    PhuThu = PhuThu + 5000
WHERE
    LoaiGhe = N'VIP';
IF @Snapshots <> (
    SELECT
        *
    FROM
        dbo.DONDATVE
    ORDER BY
        DonDatVeID
    FOR JSON
        PATH
)
    OR @Tickets <> (
    SELECT
        *
    FROM
        dbo.CHITIETVE
    ORDER BY
        VeID
    FOR JSON
        PATH
)
    OR @Foods <> (
    SELECT
        *
    FROM
        dbo.CHITIETDOAN
    ORDER BY
        ChiTietDoAnID
    FOR JSON
        PATH
)
    OR @Payments <> (
    SELECT
        *
    FROM
        dbo.THANHTOAN
    ORDER BY
        ThanhToanID
    FOR JSON
        PATH
)
    THROW 51103, 'Changing catalog changed historical money.', 1;
ROLLBACK;
PRINT 'PASS price/product configuration preserves order/ticket/food/payment snapshots';
IF NOT EXISTS (
    SELECT
        1
    FROM
        dbo.DONDATVE d
    WHERE
        EXISTS (
            SELECT
                1
            FROM
                dbo.THANHTOAN t
            WHERE
                t.DonDatVeID = d.DonDatVeID
                AND t.TrangThai = N'Thất bại'
        )
        AND EXISTS (
            SELECT
                1
            FROM
                dbo.THANHTOAN t
            WHERE
                t.DonDatVeID = d.DonDatVeID
                AND t.TrangThai = N'Thành công'
        )
)
    THROW 51103, 'Missing retry history.', 1;
IF EXISTS (
    SELECT
        1
    FROM
        dbo.CHITIETVE v
        JOIN dbo.GHE g ON g.GheID = v.GheID
    WHERE
        v.TrangThai <> N'Đã hủy'
        AND g.TrangThai <> N'Hoạt động'
)
    THROW 51103, 'Maintenance seat sold.', 1;
IF EXISTS (
    SELECT
        1
    FROM
        dbo.KHUYENMAI
    WHERE
        SoLuongDaDung > SoLuong
        OR SoLuongDaDung < 0
)
    THROW 51103, 'Promo quota violation.', 1;
IF(
    SELECT
        COUNT(DISTINCT TrangThai)
    FROM
        dbo.KHIEUNAI
) <> 5
    THROW 51103, 'Missing complaint lifecycle.', 1;
IF(
    SELECT
        COUNT(*)
    FROM
        dbo.BOITHUONG_HUYSUAT
) <> 1
    THROW 51103, 'Missing compensation event.', 1;
PRINT 'PASS retry, maintenance, promo, complaint and compensation invariants';
IF @@TRANCOUNT <> 0
    THROW 51103, 'Probe leaked transaction.', 1;

GO
