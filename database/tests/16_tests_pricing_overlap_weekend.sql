-- Run after migration 013 against a non-production database. Every test row rolls back.
-- Part 1: overlapping active pricing rules (trigger TRG_BangGia_KiemTraChongLan). A THROW inside a trigger dooms the
--         transaction, so every case runs in its own transaction against its own private cinema.
-- Part 2: fn_TinhGiaVe weekend rule independent of DATEFIRST / LANGUAGE, and the 11 price combinations of round 4.
USE CinemaBookingDB
GO

SET NOCOUNT ON;
SET XACT_ABORT OFF;

-- ------------------------------------------------------------------------------------------------ part 1
DECLARE @Rule NVARCHAR(MAX) = N'INSERT dbo.BANGGIA (RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai) VALUES ';
DECLARE @Cases TABLE (id INT IDENTITY(1,1), name NVARCHAR(120), setup NVARCHAR(MAX), stmt NVARCHAR(MAX), expectErr INT NULL);
-- {R} = private cinema of the case, {R2} = a second private cinema
INSERT @Cases (name, setup, stmt, expectErr) VALUES
 (N'same conditions, validity overlaps (open-ended new row)',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', ''2040-01-31'', N''Áp dụng'')',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-15'', NULL, N''Áp dụng'')', 50215),
 (N'same conditions, the end day is inclusive (touching ranges overlap)',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', ''2040-01-31'', N''Áp dụng'')',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-31'', ''2040-02-05'', N''Áp dụng'')', 50215),
 (N'same conditions, new row fully inside an open-ended row',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng'')',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2050-06-01'', ''2050-06-30'', N''Áp dụng'')', 50215),
 (N'same conditions, next day after the end is allowed',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', ''2040-01-31'', N''Áp dụng'')',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-02-01'', NULL, N''Áp dụng'')', NULL),
 (N'same conditions, range entirely before is allowed',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-03-01'', ''2040-03-31'', N''Áp dụng'')',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', ''2040-02-28'', N''Áp dụng'')', NULL),
 (N'overlapping rows that are Hết hạn or Tạm dừng are allowed',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng'')',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Hết hạn''), ({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Tạm dừng'')', NULL),
 (N're-activating an overlapping expired row is blocked',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng''), ({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Hết hạn'')',
  N'UPDATE dbo.BANGGIA SET TrangThai = N''Áp dụng'' WHERE RapID = {R} AND TrangThai = N''Hết hạn''', 50215),
 (N'extending the end date into another active row is blocked',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', ''2040-01-31'', N''Áp dụng''), ({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-02-01'', ''2040-02-28'', N''Áp dụng'')',
  N'UPDATE dbo.BANGGIA SET NgayKetThuc = ''2040-02-10'' WHERE RapID = {R} AND NgayBatDau = ''2040-01-01''', 50215),
 (N'changing only the surcharge is allowed',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng'')',
  N'UPDATE dbo.BANGGIA SET PhuThu = 2000 WHERE RapID = {R}', NULL),
 (N'different condition values coexist (day differs / wildcard vs specific)',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng'')',
  @Rule + N'({R}, N''Đôi'', N''Cuối tuần'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng''), ({R}, N''Tất cả'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng''), ({R}, N''Đôi'', N''Tất cả'', N''IMAX'', 1000, ''2040-01-01'', NULL, N''Áp dụng'')', NULL),
 (N'the same conditions in another cinema are allowed',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng'')',
  @Rule + N'({R2}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng'')', NULL),
 (N'one multi-row statement containing an overlapping pair is blocked',
  N'SELECT 1',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', ''2040-01-31'', N''Áp dụng''), ({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-20'', ''2040-02-10'', N''Áp dụng'')', 50215),
 (N'usp_Admin_Pricing_Create reports the overlap (same error number)',
  N'EXEC dbo.usp_Admin_Pricing_Create @RapID = {R}, @LoaiGhe = N''Đôi'', @LoaiNgay = N''Tất cả'', @DinhDang = N''Tất cả'', @PhuThu = 1000, @NgayBatDau = ''2040-01-01'', @NgayKetThuc = ''2040-01-31''',
  N'EXEC dbo.usp_Admin_Pricing_Create @RapID = {R}, @LoaiGhe = N''Đôi'', @LoaiNgay = N''Tất cả'', @DinhDang = N''Tất cả'', @PhuThu = 1000, @NgayBatDau = ''2040-01-10'', @NgayKetThuc = ''2040-01-20''', 50215),
 (N'usp_Admin_Pricing_Update cannot re-activate into an overlap',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng''), ({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Tạm dừng'')',
  N'DECLARE @G INT = (SELECT GiaID FROM dbo.BANGGIA WHERE RapID = {R} AND TrangThai = N''Tạm dừng''); EXEC dbo.usp_Admin_Pricing_Update @GiaID = @G, @PhuThu = 1000, @TrangThai = N''Áp dụng''', 50215),
 (N'expiring one row frees the conditions for a new overlapping row',
  @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng'')',
  N'UPDATE dbo.BANGGIA SET TrangThai = N''Hết hạn'' WHERE RapID = {R}; ' + @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 2000, ''2040-01-01'', NULL, N''Áp dụng'')', NULL),
 (N'legacy overlapping pair (created with the trigger disabled): expiring one of them is allowed',
  N'ALTER TABLE dbo.BANGGIA DISABLE TRIGGER TRG_BangGia_KiemTraChongLan; ' + @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng''), ({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng''); ALTER TABLE dbo.BANGGIA ENABLE TRIGGER TRG_BangGia_KiemTraChongLan',
  N'UPDATE dbo.BANGGIA SET TrangThai = N''Hết hạn'' WHERE GiaID = (SELECT MIN(GiaID) FROM dbo.BANGGIA WHERE RapID = {R})', NULL),
 (N'legacy overlapping pair: touching either row while both are active is blocked until one is expired',
  N'ALTER TABLE dbo.BANGGIA DISABLE TRIGGER TRG_BangGia_KiemTraChongLan; ' + @Rule + N'({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng''), ({R}, N''Đôi'', N''Tất cả'', N''Tất cả'', 1000, ''2040-01-01'', NULL, N''Áp dụng''); ALTER TABLE dbo.BANGGIA ENABLE TRIGGER TRG_BangGia_KiemTraChongLan',
  N'UPDATE dbo.BANGGIA SET PhuThu = 5 WHERE GiaID = (SELECT MIN(GiaID) FROM dbo.BANGGIA WHERE RapID = {R})', 50215);

DECLARE @id INT = 1, @maxId INT = (SELECT MAX(id) FROM @Cases);
DECLARE @name NVARCHAR(120), @setup NVARCHAR(MAX), @stmt NVARCHAR(MAX), @expect INT, @R INT, @R2 INT, @Err INT, @Sql NVARCHAR(MAX);
WHILE @id <= @maxId
BEGIN
    SELECT @name = name, @setup = setup, @stmt = stmt, @expect = expectErr FROM @Cases WHERE id = @id;
    SET @Err = NULL;
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT dbo.RAPCHIEUPHIM (TenRap, DiaChi, ThanhPho, TrangThai) VALUES (N'TEST Pricing overlap', N'Test address', N'Test city', N'Hoạt động');
        SET @R = SCOPE_IDENTITY();
        INSERT dbo.RAPCHIEUPHIM (TenRap, DiaChi, ThanhPho, TrangThai) VALUES (N'TEST Pricing overlap 2', N'Test address', N'Test city', N'Hoạt động');
        SET @R2 = SCOPE_IDENTITY();
        SET @Sql = REPLACE(REPLACE(@setup, N'{R2}', CAST(@R2 AS NVARCHAR(12))), N'{R}', CAST(@R AS NVARCHAR(12)));
        EXEC sys.sp_executesql @Sql;
        SET @Sql = REPLACE(REPLACE(@stmt, N'{R2}', CAST(@R2 AS NVARCHAR(12))), N'{R}', CAST(@R AS NVARCHAR(12)));
        EXEC sys.sp_executesql @Sql;
    END TRY
    BEGIN CATCH
        SET @Err = ERROR_NUMBER();
    END CATCH;
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    -- the trigger must be enabled again whatever happened (DDL rolled back with the transaction)
    IF EXISTS (SELECT 1 FROM sys.triggers WHERE name = N'TRG_BangGia_KiemTraChongLan' AND is_disabled = 1)
        THROW 52100, N'The overlap trigger was left disabled.', 1;
    IF ISNULL(@Err, 0) <> ISNULL(@expect, 0)
    BEGIN
        DECLARE @Msg NVARCHAR(400) = CONCAT(N'Pricing overlap case ', @id, N' (', @name, N'): expected error ', ISNULL(CAST(@expect AS NVARCHAR(10)), N'none'), N', got ', ISNULL(CAST(@Err AS NVARCHAR(10)), N'none'));
        THROW 52101, @Msg, 1;
    END
    SET @id += 1;
END;
PRINT CONCAT(N'PASS - pricing overlap: ', @maxId, N' cases (blocked: overlap incl. touching end day, extend/re-activate, multi-row, admin procedures; allowed: adjacent, expired/paused, other cinema, different conditions, surcharge-only update)');
GO

-- ------------------------------------------------------------------------------------------------ part 2
SET NOCOUNT ON;
BEGIN TRANSACTION;
BEGIN TRY
    IF (SELECT is_read_committed_snapshot_on FROM sys.databases WHERE name = DB_NAME()) <> 1
        THROW 52110, N'READ_COMMITTED_SNAPSHOT must be ON (the overlap trigger relies on it to avoid a lock cycle).', 1;

    DECLARE @Phim INT = (SELECT TOP 1 PhimID FROM dbo.PHIM ORDER BY PhimID);
    DECLARE @Rap1 INT, @Rap2 INT, @Rap3 INT, @P2d INT, @PImax INT, @P2 INT, @P3 INT, @PWeek INT;
    INSERT dbo.RAPCHIEUPHIM (TenRap, DiaChi, ThanhPho, TrangThai) VALUES (N'TEST Price cinema 1', N'a', N'b', N'Hoạt động'); SET @Rap1 = SCOPE_IDENTITY();
    INSERT dbo.RAPCHIEUPHIM (TenRap, DiaChi, ThanhPho, TrangThai) VALUES (N'TEST Price cinema 2', N'a', N'b', N'Hoạt động'); SET @Rap2 = SCOPE_IDENTITY();
    INSERT dbo.RAPCHIEUPHIM (TenRap, DiaChi, ThanhPho, TrangThai) VALUES (N'TEST Price cinema 3', N'a', N'b', N'Hoạt động'); SET @Rap3 = SCOPE_IDENTITY();
    INSERT dbo.PHONGCHIEU (RapID, TenPhong, LoaiPhong, TrangThai) VALUES (@Rap1, N'T 2D', N'2D', N'Hoạt động'); SET @P2d = SCOPE_IDENTITY();
    INSERT dbo.PHONGCHIEU (RapID, TenPhong, LoaiPhong, TrangThai) VALUES (@Rap1, N'T IMAX', N'IMAX', N'Hoạt động'); SET @PImax = SCOPE_IDENTITY();
    INSERT dbo.PHONGCHIEU (RapID, TenPhong, LoaiPhong, TrangThai) VALUES (@Rap1, N'T WEEK', N'2D', N'Hoạt động'); SET @PWeek = SCOPE_IDENTITY();
    INSERT dbo.PHONGCHIEU (RapID, TenPhong, LoaiPhong, TrangThai) VALUES (@Rap2, N'T 2D', N'2D', N'Hoạt động'); SET @P2 = SCOPE_IDENTITY();
    INSERT dbo.PHONGCHIEU (RapID, TenPhong, LoaiPhong, TrangThai) VALUES (@Rap3, N'T 2D', N'2D', N'Hoạt động'); SET @P3 = SCOPE_IDENTITY();
    INSERT dbo.GHE (PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai)
    SELECT p.PhongID, 'A', t.n, t.LoaiGhe, N'Hoạt động'
    FROM (SELECT @P2d AS PhongID UNION ALL SELECT @PImax UNION ALL SELECT @PWeek UNION ALL SELECT @P2 UNION ALL SELECT @P3) p
    CROSS JOIN (VALUES (1, N'Thường'), (2, N'VIP'), (3, N'Sweetbox')) t(n, LoaiGhe);
    -- the seed rules of the three cinemas, one condition set each (no overlap)
    INSERT dbo.BANGGIA (RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, TrangThai) VALUES
        (@Rap1, N'VIP', N'Tất cả', N'Tất cả', 15000, '2020-01-01', N'Áp dụng'),
        (@Rap1, N'Sweetbox', N'Tất cả', N'Tất cả', 30000, '2020-01-01', N'Áp dụng'),
        (@Rap1, N'Tất cả', N'Cuối tuần', N'Tất cả', 10000, '2020-01-01', N'Áp dụng'),
        (@Rap1, N'Tất cả', N'Tất cả', N'IMAX', 50000, '2020-01-01', N'Áp dụng'),
        (@Rap2, N'Sweetbox', N'Tất cả', N'Tất cả', 25000, '2020-01-01', N'Áp dụng'),
        (@Rap3, N'VIP', N'Tất cả', N'Tất cả', 10000, '2020-01-01', N'Áp dụng');
    DECLARE @S TABLE (k VARCHAR(20) PRIMARY KEY, id INT);
    INSERT dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai) VALUES (@Phim, @P2d, '2040-01-02 10:00', '2040-01-02 12:00', N'2D', 80000, N'Mở bán');       -- Monday
    INSERT @S VALUES ('mon2d', SCOPE_IDENTITY());
    INSERT dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai) VALUES (@Phim, @P2d, '2040-01-01 10:00', '2040-01-01 12:00', N'2D', 80000, N'Mở bán');       -- Sunday
    INSERT @S VALUES ('sun2d', SCOPE_IDENTITY());
    INSERT dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai) VALUES (@Phim, @PImax, '2040-01-02 10:00', '2040-01-02 12:00', N'IMAX', 120000, N'Mở bán');
    INSERT @S VALUES ('monimax', SCOPE_IDENTITY());
    INSERT dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai) VALUES (@Phim, @PImax, '2040-01-01 10:00', '2040-01-01 12:00', N'IMAX', 120000, N'Mở bán');
    INSERT @S VALUES ('sunimax', SCOPE_IDENTITY());
    INSERT dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai) VALUES (@Phim, @P2, '2040-01-03 10:00', '2040-01-03 12:00', N'2D', 80000, N'Mở bán');
    INSERT @S VALUES ('c2', SCOPE_IDENTITY());
    INSERT dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai) VALUES (@Phim, @P3, '2040-01-04 10:00', '2040-01-04 12:00', N'2D', 70000, N'Mở bán');
    INSERT @S VALUES ('c3', SCOPE_IDENTITY());
    -- seven consecutive days (Sun 2040-01-01 .. Sat 2040-01-07) in one room for the weekend rule
    INSERT dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai)
    SELECT @Phim, @PWeek, DATEADD(DAY, d, '2040-01-01 10:00'), DATEADD(DAY, d, '2040-01-01 12:00'), N'2D', 80000, N'Mở bán' FROM (VALUES (0), (1), (2), (3), (4), (5), (6)) v(d);

    DECLARE @Seat TABLE (room INT, type NVARCHAR(50), id INT, PRIMARY KEY (room, type));
    INSERT @Seat SELECT PhongID, LoaiGhe, GheID FROM dbo.GHE WHERE PhongID IN (@P2d, @PImax, @PWeek, @P2, @P3);
    DECLARE @Combos TABLE (name NVARCHAR(60), show INT, seat INT, want DECIMAL(18,2));
    INSERT @Combos
    SELECT n, (SELECT id FROM @S WHERE k = sk), (SELECT id FROM @Seat WHERE room = r AND type = t), w FROM (VALUES
        (N'weekday 2D Thường', 'mon2d', @P2d, N'Thường', 80000), (N'weekday 2D VIP', 'mon2d', @P2d, N'VIP', 95000),
        (N'Sunday 2D Thường', 'sun2d', @P2d, N'Thường', 90000), (N'weekday IMAX Thường', 'monimax', @PImax, N'Thường', 170000),
        (N'Sunday 2D VIP', 'sun2d', @P2d, N'VIP', 105000), (N'Sunday 2D Sweetbox', 'sun2d', @P2d, N'Sweetbox', 120000),
        (N'weekday IMAX VIP', 'monimax', @PImax, N'VIP', 185000), (N'Sunday IMAX Thường', 'sunimax', @PImax, N'Thường', 180000),
        (N'Sunday IMAX Sweetbox', 'sunimax', @PImax, N'Sweetbox', 210000), (N'cinema 2 Sweetbox', 'c2', @P2, N'Sweetbox', 105000),
        (N'cinema 3 VIP', 'c3', @P3, N'VIP', 80000)) x(n, sk, r, t, w);
    IF (SELECT COUNT(*) FROM @Combos) <> 11 THROW 52111, N'Fixture error: expected 11 price combinations.', 1;

    -- week rows: price of a Thường seat per day; Sunday and Saturday carry the +10,000 weekend surcharge
    DECLARE @WeekSeat INT = (SELECT id FROM @Seat WHERE room = @PWeek AND type = N'Thường');
    DECLARE @Week TABLE (d DATE, show INT, want DECIMAL(18,2));
    INSERT @Week SELECT CAST(ThoiGianBatDau AS DATE), SuatChieuID, CASE WHEN CAST(ThoiGianBatDau AS DATE) IN ('2040-01-01', '2040-01-07') THEN 90000 ELSE 80000 END
                 FROM dbo.SUATCHIEU WHERE PhongID = @PWeek;

    -- ---------------------------------------------------------------- every DATEFIRST x language combination
    DECLARE @bad INT = 0, @runs INT = 0;
    -- the checks below use literal SET statements (SET LANGUAGE / DATEFIRST must apply to this batch, not to dynamic SQL)
    SET LANGUAGE us_english; SET DATEFIRST 7;
    SELECT @bad += COUNT(*) FROM @Combos WHERE dbo.fn_TinhGiaVe(show, seat) <> want; SELECT @bad += COUNT(*) FROM @Week WHERE dbo.fn_TinhGiaVe(show, @WeekSeat) <> want; SET @runs += 1;
    SET LANGUAGE us_english; SET DATEFIRST 1;
    SELECT @bad += COUNT(*) FROM @Combos WHERE dbo.fn_TinhGiaVe(show, seat) <> want; SELECT @bad += COUNT(*) FROM @Week WHERE dbo.fn_TinhGiaVe(show, @WeekSeat) <> want; SET @runs += 1;
    SET LANGUAGE us_english; SET DATEFIRST 2;
    SELECT @bad += COUNT(*) FROM @Combos WHERE dbo.fn_TinhGiaVe(show, seat) <> want; SELECT @bad += COUNT(*) FROM @Week WHERE dbo.fn_TinhGiaVe(show, @WeekSeat) <> want; SET @runs += 1;
    SET LANGUAGE us_english; SET DATEFIRST 3;
    SELECT @bad += COUNT(*) FROM @Combos WHERE dbo.fn_TinhGiaVe(show, seat) <> want; SELECT @bad += COUNT(*) FROM @Week WHERE dbo.fn_TinhGiaVe(show, @WeekSeat) <> want; SET @runs += 1;
    SET LANGUAGE us_english; SET DATEFIRST 4;
    SELECT @bad += COUNT(*) FROM @Combos WHERE dbo.fn_TinhGiaVe(show, seat) <> want; SELECT @bad += COUNT(*) FROM @Week WHERE dbo.fn_TinhGiaVe(show, @WeekSeat) <> want; SET @runs += 1;
    SET LANGUAGE us_english; SET DATEFIRST 5;
    SELECT @bad += COUNT(*) FROM @Combos WHERE dbo.fn_TinhGiaVe(show, seat) <> want; SELECT @bad += COUNT(*) FROM @Week WHERE dbo.fn_TinhGiaVe(show, @WeekSeat) <> want; SET @runs += 1;
    SET LANGUAGE us_english; SET DATEFIRST 6;
    SELECT @bad += COUNT(*) FROM @Combos WHERE dbo.fn_TinhGiaVe(show, seat) <> want; SELECT @bad += COUNT(*) FROM @Week WHERE dbo.fn_TinhGiaVe(show, @WeekSeat) <> want; SET @runs += 1;
    SET LANGUAGE British;
    SELECT @bad += COUNT(*) FROM @Combos WHERE dbo.fn_TinhGiaVe(show, seat) <> want; SELECT @bad += COUNT(*) FROM @Week WHERE dbo.fn_TinhGiaVe(show, @WeekSeat) <> want; SET @runs += 1;
    SET LANGUAGE German;
    SELECT @bad += COUNT(*) FROM @Combos WHERE dbo.fn_TinhGiaVe(show, seat) <> want; SELECT @bad += COUNT(*) FROM @Week WHERE dbo.fn_TinhGiaVe(show, @WeekSeat) <> want; SET @runs += 1;
    SET LANGUAGE French;
    SELECT @bad += COUNT(*) FROM @Combos WHERE dbo.fn_TinhGiaVe(show, seat) <> want; SELECT @bad += COUNT(*) FROM @Week WHERE dbo.fn_TinhGiaVe(show, @WeekSeat) <> want; SET @runs += 1;
    SET LANGUAGE Italian;
    SELECT @bad += COUNT(*) FROM @Combos WHERE dbo.fn_TinhGiaVe(show, seat) <> want; SELECT @bad += COUNT(*) FROM @Week WHERE dbo.fn_TinhGiaVe(show, @WeekSeat) <> want; SET @runs += 1;
    SET LANGUAGE us_english; SET DATEFIRST 7;
    IF @bad <> 0 THROW 52112, N'fn_TinhGiaVe changed with DATEFIRST/LANGUAGE or does not match the expected prices.', 1;

    ROLLBACK TRANSACTION;
    PRINT CONCAT(N'PASS - weekend (Saturday + Sunday) and the 11 price combinations are identical under ', @runs, N' DATEFIRST/LANGUAGE settings');
    PRINT N'Pricing overlap / weekend tests passed.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
