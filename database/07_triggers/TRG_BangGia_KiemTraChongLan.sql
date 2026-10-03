SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
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
