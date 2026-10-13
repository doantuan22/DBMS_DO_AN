-- Chuẩn bị hoặc kiểm tra dữ liệu seed theo target đã xác nhận.
-- Nạp hoặc kiểm tra dữ liệu seed.
:r ./10_seed/verify/expected-catalog.sql

:r ./10_seed/verify/catalog.sql

-- Chạy các bước kiểm tra database.
:r ./12_verify/verify_fixed_rbac.sql

:r ./12_verify/verify_orphans.sql

SET NOCOUNT ON;
IF EXISTS (
    SELECT
        1
    FROM
        dbo.SUATCHIEU a
        JOIN dbo.SUATCHIEU b ON a.PhongID = b.PhongID
        AND a.SuatChieuID < b.SuatChieuID
        AND a.TrangThai <> N'Đã hủy'
        AND b.TrangThai <> N'Đã hủy'
        AND a.ThoiGianBatDau < b.ThoiGianKetThuc
        AND b.ThoiGianBatDau < a.ThoiGianKetThuc
)
    THROW 51102, 'Persisted showtime overlap.', 1;
IF EXISTS (
    SELECT
        1
    FROM
        dbo.DONDATVE d
    WHERE
        d.TongTienVe <> (
            SELECT
                SUM(v.GiaVe)
            FROM
                dbo.CHITIETVE v
            WHERE
                v.DonDatVeID = d.DonDatVeID
        )
        OR d.TongTienDoAn <> COALESCE(
            (
                SELECT
                    SUM(f.SoLuong * f.DonGia)
                FROM
                    dbo.CHITIETDOAN f
                WHERE
                    f.DonDatVeID = d.DonDatVeID
            ),
            0
        )
)
    THROW 51102, 'Order snapshot mismatch.', 1;
IF EXISTS (
    SELECT
        1
    FROM
        dbo.THANHTOAN t
        JOIN dbo.DONDATVE d ON d.DonDatVeID = t.DonDatVeID
    WHERE
        t.SoTien <> d.TongTienVe + d.TongTienDoAn - d.TienGiamGia
)
    THROW 51102, 'Payment amount mismatch.', 1;
IF EXISTS (
    SELECT
        d.SuatChieuID,
        v.GheID
    FROM
        dbo.CHITIETVE v
        JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID
    WHERE
        v.TrangThai <> N'Đã hủy'
        AND dbo.fn_DonDangGiuGhe(d.TrangThai, d.HanGiuCho, dbo.fn_BayGio()) = 1
    GROUP BY
        d.SuatChieuID,
        v.GheID
    HAVING
        COUNT(*) > 1
)
    THROW 51102, 'Double booked seat.', 1;
SELECT
    DB_NAME() Target,
    (
        SELECT
            COUNT(*)
        FROM
            dbo.PHIM
    ) Movies,
    (
        SELECT
            COUNT(*)
        FROM
            dbo.PHIM
        WHERE
            PosterURL IS NOT NULL
    ) Posters,
    (
        SELECT
            COUNT(*)
        FROM
            dbo.RAPCHIEUPHIM
    ) Cinemas,
    (
        SELECT
            COUNT(*)
        FROM
            dbo.PHONGCHIEU
    ) Rooms,
    (
        SELECT
            COUNT(*)
        FROM
            dbo.GHE
    ) Seats,
    (
        SELECT
            COUNT(*)
        FROM
            dbo.NGUOIDUNG
    ) Users,
    (
        SELECT
            COUNT(*)
        FROM
            dbo.SUATCHIEU
    ) Shows,
    (
        SELECT
            COUNT(*)
        FROM
            dbo.vw_LichChieuChiTiet
        WHERE
            IsBookable = 1
    ) Bookable,
    (
        SELECT
            COUNT(*)
        FROM
            dbo.DONDATVE
    ) Orders,
    (
        SELECT
            COUNT(*)
        FROM
            dbo.THANHTOAN
    ) Payments,
    (
        SELECT
            COUNT(*)
        FROM
            dbo.DANHGIAPHIM
    ) Reviews,
    (
        SELECT
            COUNT(*)
        FROM
            dbo.KHIEUNAI
    ) Complaints;
PRINT 'PASS seed v2 integrity and snapshots';

GO
