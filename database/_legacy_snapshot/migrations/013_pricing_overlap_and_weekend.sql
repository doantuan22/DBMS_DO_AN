-- Round 5: (1) two active pricing rules with the same conditions and overlapping validity can no longer coexist
-- (surcharges are summed since migration 012, so such a pair would be charged twice); (2) the weekend rule of
-- fn_TinhGiaVe no longer depends on SET DATEFIRST / the login language.
-- Migrations 001-012 are already deployed and are left untouched. Idempotent: CREATE OR ALTER only.
-- Apply with `sqlcmd -d <db> -f 65001` (UTF-8).

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ---------------------------------------------------------------------------------------------
-- (2) Weekend independent of configuration.
-- Rule kept exactly as before: Saturday and Sunday are "Cuối tuần" (DATEPART(dw) IN (1, 7) under the default
-- DATEFIRST 7 / us_english). 1900-01-01 was a Monday, so DATEDIFF(DAY, '19000101', date) % 7 is 0 = Monday ...
-- 5 = Saturday, 6 = Sunday, whatever DATEFIRST or the language is (style 112 is language independent too).
-- Everything else in the function is unchanged from migration 012.
-- ---------------------------------------------------------------------------------------------
CREATE OR ALTER FUNCTION dbo.fn_TinhGiaVe
(
    @SuatChieuID INT,
    @GheID INT
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @GiaVeCoBan DECIMAL(18,2) = 0;
    DECLARE @RapID INT;
    DECLARE @DinhDang NVARCHAR(50);
    DECLARE @ThoiGianBatDau DATETIME2;
    DECLARE @LoaiGhe NVARCHAR(50);
    DECLARE @LoaiNgay NVARCHAR(50);
    DECLARE @NgayChieu DATE;
    DECLARE @PhuThu DECIMAL(18,2) = 0;

    SELECT
        @GiaVeCoBan = sc.GiaVeCoBan,
        @DinhDang = sc.DinhDang,
        @ThoiGianBatDau = sc.ThoiGianBatDau,
        @RapID = pc.RapID,
        @NgayChieu = CAST(sc.ThoiGianBatDau AS DATE)
    FROM dbo.SUATCHIEU sc
    INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
    WHERE sc.SuatChieuID = @SuatChieuID;

    IF @GiaVeCoBan IS NULL RETURN 0;

    SELECT @LoaiGhe = LoaiGhe
    FROM dbo.GHE
    WHERE GheID = @GheID;

    IF @LoaiGhe IS NULL SET @LoaiGhe = N'Thường';

    -- 5 = Saturday, 6 = Sunday counted from a Monday (independent of DATEFIRST and language)
    IF DATEDIFF(DAY, CONVERT(DATE, '19000101', 112), @NgayChieu) % 7 IN (5, 6)
        SET @LoaiNgay = N'Cuối tuần';
    ELSE
        SET @LoaiNgay = N'Ngày thường';

    -- All matching surcharges are added (migration 012)
    SELECT @PhuThu = ISNULL(SUM(PhuThu), 0)
    FROM dbo.BANGGIA bg
    WHERE bg.RapID = @RapID
      AND bg.TrangThai = N'Áp dụng'
      AND @NgayChieu >= bg.NgayBatDau
      AND (@NgayChieu <= bg.NgayKetThuc OR bg.NgayKetThuc IS NULL)
      AND (bg.LoaiGhe = @LoaiGhe OR bg.LoaiGhe = N'Tất cả')
      AND (bg.LoaiNgay = @LoaiNgay OR bg.LoaiNgay = N'Tất cả')
      AND (bg.DinhDang = @DinhDang OR bg.DinhDang = N'Tất cả');

    RETURN (@GiaVeCoBan + ISNULL(@PhuThu, 0));
END;
GO

-- ---------------------------------------------------------------------------------------------
-- (1) Overlapping pricing rules.
-- "Overlap" = same RapID, same (LoaiGhe, LoaiNgay, DinhDang) values (N'Tất cả' counts as a value of its own),
-- both TrangThai = N'Áp dụng', and validity ranges that intersect (NgayKetThuc NULL = open ended; the end day is
-- inclusive, as in fn_TinhGiaVe). A N'Tất cả' rule and a specific rule that differ in a column are two different
-- conditions and may coexist: they are deliberate layers (e.g. VIP +15,000 together with weekend +10,000).
--
-- A trigger is used (like TRG_SuatChieu_KiemTraTrungLich) so that every write path is covered: the admin and
-- manager procedures and direct DML. The trigger takes an UPDLOCK/HOLDLOCK on the cinema row first (assigned to a
-- variable, no result set, rows locked in RapID order), so two concurrent writers for one cinema are queued and
-- the second one sees the first one's committed row (the database runs READ_COMMITTED_SNAPSHOT, so its read does
-- not block on the other transaction's uncommitted row: no lock cycle). Existing overlapping rows are never
-- modified; only rows being inserted/updated to "Áp dụng" are checked.
-- ---------------------------------------------------------------------------------------------
CREATE OR ALTER TRIGGER dbo.TRG_BangGia_KiemTraChongLan
ON dbo.BANGGIA
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM inserted WHERE TrangThai = N'Áp dụng') RETURN;

    DECLARE @KhoaRap INT;
    SELECT @KhoaRap = r.RapID
    FROM dbo.RAPCHIEUPHIM r WITH (UPDLOCK, HOLDLOCK)
    WHERE r.RapID IN (SELECT RapID FROM inserted WHERE TrangThai = N'Áp dụng');

    -- against the rows already in the table
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.BANGGIA b
            ON b.RapID = i.RapID AND b.GiaID <> i.GiaID
           AND b.LoaiGhe = i.LoaiGhe AND b.LoaiNgay = i.LoaiNgay AND b.DinhDang = i.DinhDang
        WHERE i.TrangThai = N'Áp dụng' AND b.TrangThai = N'Áp dụng'
          AND i.NgayBatDau <= ISNULL(b.NgayKetThuc, '9999-12-31')
          AND b.NgayBatDau <= ISNULL(i.NgayKetThuc, '9999-12-31')
    )
    BEGIN
        ;THROW 50215, N'Lỗi ràng buộc: Bảng giá đang áp dụng đã có cùng điều kiện trong khoảng thời gian này.', 1;
    END

    -- within the statement itself (multi-row insert/update)
    IF EXISTS (
        SELECT 1
        FROM inserted i1
        INNER JOIN inserted i2
            ON i1.GiaID < i2.GiaID AND i1.RapID = i2.RapID
           AND i1.LoaiGhe = i2.LoaiGhe AND i1.LoaiNgay = i2.LoaiNgay AND i1.DinhDang = i2.DinhDang
        WHERE i1.TrangThai = N'Áp dụng' AND i2.TrangThai = N'Áp dụng'
          AND i1.NgayBatDau <= ISNULL(i2.NgayKetThuc, '9999-12-31')
          AND i2.NgayBatDau <= ISNULL(i1.NgayKetThuc, '9999-12-31')
    )
    BEGIN
        ;THROW 50215, N'Lỗi ràng buộc: Bảng giá đang áp dụng đã có cùng điều kiện trong khoảng thời gian này.', 1;
    END
END;
GO

-- Report (never changes data): overlapping active pairs that already exist in this database.
DECLARE @ExistingOverlaps INT =
(
    SELECT COUNT(*)
    FROM dbo.BANGGIA a
    INNER JOIN dbo.BANGGIA b
        ON a.GiaID < b.GiaID AND a.RapID = b.RapID
       AND a.LoaiGhe = b.LoaiGhe AND a.LoaiNgay = b.LoaiNgay AND a.DinhDang = b.DinhDang
    WHERE a.TrangThai = N'Áp dụng' AND b.TrangThai = N'Áp dụng'
      AND a.NgayBatDau <= ISNULL(b.NgayKetThuc, '9999-12-31')
      AND b.NgayBatDau <= ISNULL(a.NgayKetThuc, '9999-12-31')
);
PRINT CONCAT(N'BANGGIA active overlapping pairs already present (left untouched): ', @ExistingOverlaps);
IF @ExistingOverlaps > 0
    SELECT a.GiaID AS GiaID_A, b.GiaID AS GiaID_B, a.RapID, a.LoaiGhe, a.LoaiNgay, a.DinhDang
    FROM dbo.BANGGIA a
    INNER JOIN dbo.BANGGIA b
        ON a.GiaID < b.GiaID AND a.RapID = b.RapID
       AND a.LoaiGhe = b.LoaiGhe AND a.LoaiNgay = b.LoaiNgay AND a.DinhDang = b.DinhDang
    WHERE a.TrangThai = N'Áp dụng' AND b.TrangThai = N'Áp dụng'
      AND a.NgayBatDau <= ISNULL(b.NgayKetThuc, '9999-12-31')
      AND b.NgayBatDau <= ISNULL(a.NgayKetThuc, '9999-12-31');
GO
