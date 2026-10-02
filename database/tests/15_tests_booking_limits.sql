-- Run after migration 012 against a non-production database. Every test row rolls back.
-- Covers: promotion cap, seat/product caps (direct procedure calls), 5-minute non-extendable hold,
-- 3-holding-orders limit (sequential), additive surcharges.
USE CinemaBookingDB
GO

SET NOCOUNT ON;
SET DATEFIRST 7;   -- fn_TinhGiaVe treats DATEPART(dw) 1 and 7 as the weekend (US setting)
SET XACT_ABORT OFF;
BEGIN TRANSACTION;
BEGIN TRY
    DECLARE @Rap INT, @Phong INT, @PhongImax INT, @User INT = 8, @Phim INT = (SELECT TOP 1 PhimID FROM dbo.PHIM ORDER BY PhimID);
    DECLARE @Err INT, @n INT, @Don INT;
    DECLARE @Dto TABLE (DonDatVeID INT, NguoiDungID INT, SuatChieuID INT, NgayDat DATETIME2, TongTienVe DECIMAL(18,2), TongTienDoAn DECIMAL(18,2),
                        TienGiamGia DECIMAL(18,2), TongThanhToan DECIMAL(18,2), TrangThai NVARCHAR(50), HanGiuCho DATETIME2, SoLuongVe INT);

    -- ---------------------------------------------------------------- fixture: a private cinema, 2 rooms, seats, pricing rules
    INSERT dbo.RAPCHIEUPHIM (TenRap, DiaChi, ThanhPho, TrangThai) VALUES (N'TEST Booking Limits', N'Test address', N'Test city', N'Hoạt động');
    SET @Rap = SCOPE_IDENTITY();
    INSERT dbo.PHONGCHIEU (RapID, TenPhong, LoaiPhong, TrangThai) VALUES (@Rap, N'TEST room 2D', N'2D', N'Hoạt động');
    SET @Phong = SCOPE_IDENTITY();
    INSERT dbo.PHONGCHIEU (RapID, TenPhong, LoaiPhong, TrangThai) VALUES (@Rap, N'TEST room IMAX', N'IMAX', N'Hoạt động');
    SET @PhongImax = SCOPE_IDENTITY();
    ;WITH s AS (SELECT TOP (14) ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS i FROM sys.objects)
    INSERT dbo.GHE (PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai)
    SELECT p.PhongID, 'A', s.i, CASE WHEN s.i <= 12 THEN N'Thường' ELSE N'VIP' END, N'Hoạt động'
    FROM s CROSS JOIN (SELECT @Phong AS PhongID UNION ALL SELECT @PhongImax) p;
    -- rules: VIP +15,000 (seat), weekend +10,000 (day), IMAX +50,000 (format)
    INSERT dbo.BANGGIA (RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, TrangThai) VALUES
        (@Rap, N'VIP', N'Tất cả', N'Tất cả', 15000, '2020-01-01', N'Áp dụng'),
        (@Rap, N'Tất cả', N'Cuối tuần', N'Tất cả', 10000, '2020-01-01', N'Áp dụng'),
        (@Rap, N'Tất cả', N'Tất cả', N'IMAX', 50000, '2020-01-01', N'Áp dụng');
    -- showtimes far in the future: 2040-01-02 is a Monday, 2040-01-01 a Sunday
    DECLARE @ShowMon INT, @ShowSun INT, @ShowImaxMon INT, @ShowImaxSun INT;
    INSERT dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai) VALUES (@Phim, @Phong, '2040-01-02 10:00', '2040-01-02 12:00', N'2D', 80000, N'Mở bán');
    SET @ShowMon = SCOPE_IDENTITY();
    INSERT dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai) VALUES (@Phim, @Phong, '2040-01-01 10:00', '2040-01-01 12:00', N'2D', 80000, N'Mở bán');
    SET @ShowSun = SCOPE_IDENTITY();
    INSERT dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai) VALUES (@Phim, @PhongImax, '2040-01-02 10:00', '2040-01-02 12:00', N'IMAX', 120000, N'Mở bán');
    SET @ShowImaxMon = SCOPE_IDENTITY();
    INSERT dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai) VALUES (@Phim, @PhongImax, '2040-01-01 10:00', '2040-01-01 12:00', N'IMAX', 120000, N'Mở bán');
    SET @ShowImaxSun = SCOPE_IDENTITY();
    -- the test customer starts without live holds
    UPDATE dbo.DONDATVE SET HanGiuCho = DATEADD(MINUTE, -1, SYSDATETIME()) WHERE NguoiDungID = @User AND TrangThai = N'Chờ thanh toán';

    DECLARE @Seat1 INT, @Thuong1 INT, @Vip1 INT;
    DECLARE @Seats TABLE (n INT IDENTITY(1,1), GheID INT);
    INSERT @Seats (GheID) SELECT GheID FROM dbo.GHE WHERE PhongID = @Phong ORDER BY SoGhe;     -- 1..12 Thường, 13..14 VIP
    SELECT @Thuong1 = GheID FROM @Seats WHERE n = 1;
    SELECT @Vip1 = GheID FROM @Seats WHERE n = 13;

    -- ---------------------------------------------------------------- 1. promotion CHECK (percent in (0, 99])
    DECLARE @i INT = 0;
    DECLARE @bad TABLE (v DECIMAL(18,2));
    INSERT @bad VALUES (100), (150), (1000000000000000);
    DECLARE @v DECIMAL(18,2);
    DECLARE c CURSOR LOCAL FOR SELECT v FROM @bad;
    OPEN c; FETCH NEXT FROM c INTO @v;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        BEGIN TRY
            INSERT dbo.KHUYENMAI (MaCode, LoaiGiamGia, GiaTriGiam, DonHangToiThieu, NgayBatDau, NgayKetThuc, SoLuong, TrangThai)
            VALUES (CONCAT('TEST_PCT_', CAST(@i AS VARCHAR(5))), N'Phần trăm', @v, 0, '2020-01-01', '2040-01-01', 10, N'Hoạt động');
            THROW 52001, N'A percent promotion above 99 was accepted.', 1;
        END TRY
        BEGIN CATCH
            IF ERROR_NUMBER() = 52001 THROW;
            IF ERROR_NUMBER() <> 547 THROW;
        END CATCH;
        SET @i += 1; FETCH NEXT FROM c INTO @v;
    END;
    CLOSE c; DEALLOCATE c;
    INSERT dbo.KHUYENMAI (MaCode, LoaiGiamGia, GiaTriGiam, DonHangToiThieu, GiamToiDa, NgayBatDau, NgayKetThuc, SoLuong, TrangThai) VALUES
        ('TEST_PCT_99', N'Phần trăm', 99, 0, NULL, '2020-01-01', '2040-01-01', 100, N'Hoạt động'),
        ('TEST_PCT_PERCENT', N'PERCENT', 99, 0, NULL, '2020-01-01', '2040-01-01', 100, N'Hoạt động'),
        ('TEST_FIX_BIG', N'Số tiền', 5000000, 0, NULL, '2020-01-01', '2040-01-01', 100, N'Hoạt động');
    BEGIN TRY
        UPDATE dbo.KHUYENMAI SET GiaTriGiam = 150 WHERE MaCode = 'TEST_PCT_99';
        THROW 52002, N'Updating a promotion to 150 percent was accepted.', 1;
    END TRY
    BEGIN CATCH
        IF ERROR_NUMBER() = 52002 THROW;
        IF ERROR_NUMBER() <> 547 THROW;
    END CATCH;
    BEGIN TRY
        INSERT dbo.KHUYENMAI (MaCode, LoaiGiamGia, GiaTriGiam, DonHangToiThieu, NgayBatDau, NgayKetThuc, SoLuong, TrangThai) VALUES ('TEST_PCT_0', N'Phần trăm', 0, 0, '2020-01-01', '2040-01-01', 1, N'Hoạt động');
        THROW 52003, N'A zero discount was accepted.', 1;
    END TRY
    BEGIN CATCH
        IF ERROR_NUMBER() = 52003 THROW;
        IF ERROR_NUMBER() <> 547 THROW;
    END CATCH;
    PRINT N'PASS - promotion CHECK: 100/150/1e15 percent, update to 150 and 0 rejected; 99 (both type spellings) and a large fixed amount accepted';

    -- ---------------------------------------------------------------- 2. total is always > 0 (discount capped at 99% of the subtotal)
    EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @ShowMon, @MaKhuyenMai = 'TEST_FIX_BIG', @DanhSachGheId = @Thuong1, @NewDonDatVeID = @Don OUTPUT;
    IF NOT EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID = @Don AND TongTienVe = 80000 AND TienGiamGia = 79200 AND TongTienVe + TongTienDoAn - TienGiamGia = 800)
        THROW 52010, N'A fixed discount above the subtotal was not capped at 99%.', 1;
    PRINT N'PASS - fixed 5,000,000 discount on an 80,000 ticket capped at 79,200 (total 800)';
    UPDATE dbo.DONDATVE SET TrangThai = N'Đã hủy', HanGiuCho = NULL WHERE DonDatVeID = @Don; UPDATE dbo.CHITIETVE SET TrangThai = N'Đã hủy' WHERE DonDatVeID = @Don;

    -- ---------------------------------------------------------------- 3. seat cap (direct procedure call)
    DECLARE @Ids11 VARCHAR(MAX) = (SELECT STRING_AGG(CAST(GheID AS VARCHAR(10)), ',') FROM (SELECT TOP (11) GheID FROM @Seats ORDER BY n) x);
    DECLARE @Ids10 VARCHAR(MAX) = (SELECT STRING_AGG(CAST(GheID AS VARCHAR(10)), ',') FROM (SELECT TOP (10) GheID FROM @Seats ORDER BY n) x);
    SET @Err = NULL;
    BEGIN TRY EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @ShowMon, @DanhSachGheId = @Ids11, @NewDonDatVeID = @Don OUTPUT; END TRY
    BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH;
    IF ISNULL(@Err, 0) <> 50026 THROW 52020, N'11 seats in one order were not rejected with 50026.', 1;
    DELETE @Dto; SET @Don = NULL;
    INSERT @Dto EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @ShowMon, @DanhSachGheId = @Ids10, @NewDonDatVeID = @Don OUTPUT;
    IF (SELECT SoLuongVe FROM @Dto) <> 10 THROW 52021, N'10 seats in one order were not accepted.', 1;
    UPDATE dbo.DONDATVE SET TrangThai = N'Đã hủy', HanGiuCho = NULL WHERE DonDatVeID = @Don; UPDATE dbo.CHITIETVE SET TrangThai = N'Đã hủy' WHERE DonDatVeID = @Don;
    PRINT N'PASS - seat cap: 11 seats -> 50026, 10 seats accepted';

    -- ---------------------------------------------------------------- 4. product quantity cap, summed per product before the check
    DECLARE @Json NVARCHAR(MAX);
    DECLARE @Seat2 INT, @Seat3 INT, @Seat4 INT, @Seat5 INT;
    SELECT @Seat2 = GheID FROM @Seats WHERE n = 2; SELECT @Seat3 = GheID FROM @Seats WHERE n = 3; SELECT @Seat4 = GheID FROM @Seats WHERE n = 4; SELECT @Seat5 = GheID FROM @Seats WHERE n = 5;
    DECLARE @Prod INT = (SELECT TOP 1 SanPhamID FROM dbo.SANPHAM WHERE TrangThai = N'Đang bán' ORDER BY SanPhamID);
    DECLARE @Cases TABLE (id INT IDENTITY(1,1), body NVARCHAR(MAX), expectErr INT NULL);
    INSERT @Cases (body, expectErr) VALUES
        (CONCAT(N'[{"SanPhamID":', @Prod, N',"SoLuong":11}]'), 50027),
        (CONCAT(N'[{"SanPhamID":', @Prod, N',"SoLuong":6},{"SanPhamID":', @Prod, N',"SoLuong":6}]'), 50027),
        (CONCAT(N'[{"SanPhamID":', @Prod, N',"SoLuong":2147483647}]'), 50027),
        (CONCAT(N'[{"SanPhamID":', @Prod, N',"SoLuong":2147483648}]'), 50027),
        (CONCAT(N'[{"SanPhamID":', @Prod, N',"SoLuong":9223372036854775807}]'), 50027),
        (CONCAT(N'[{"SanPhamID":', @Prod, N',"SoLuong":10}]'), NULL),
        (CONCAT(N'[{"SanPhamID":', @Prod, N',"SoLuong":5},{"SanPhamID":', @Prod, N',"SoLuong":5}]'), NULL);
    DECLARE @id INT = 1, @maxId INT = (SELECT MAX(id) FROM @Cases), @expect INT;
    WHILE @id <= @maxId
    BEGIN
        SELECT @Json = body, @expect = expectErr FROM @Cases WHERE id = @id;
        SET @Err = NULL; SET @Don = NULL;
        BEGIN TRY
            -- a rejected call rolls back to its savepoint, which is not allowed inside INSERT ... EXEC: use plain EXEC for it
            IF @expect IS NOT NULL
                EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @ShowMon, @DanhSachGheId = @Seat2, @DanhSachDoAnJson = @Json, @NewDonDatVeID = @Don OUTPUT;
            ELSE
            BEGIN
                DELETE @Dto;
                INSERT @Dto EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @ShowMon, @DanhSachGheId = @Seat2, @DanhSachDoAnJson = @Json, @NewDonDatVeID = @Don OUTPUT;
            END
        END TRY
        BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH;
        IF @expect IS NOT NULL AND ISNULL(@Err, 0) <> @expect THROW 52030, N'A product quantity above the cap was not rejected with 50027.', 1;
        IF @expect IS NULL
        BEGIN
            IF @Err IS NOT NULL THROW 52031, N'A product quantity of exactly 10 (also 5+5 split) was rejected.', 1;
            IF NOT EXISTS (SELECT 1 FROM dbo.CHITIETDOAN WHERE DonDatVeID = @Don AND SoLuong = 10)
               OR (SELECT COUNT(*) FROM dbo.CHITIETDOAN WHERE DonDatVeID = @Don) <> 1
                THROW 52032, N'Split lines of one product were not summed into a single line of 10.', 1;
            UPDATE dbo.DONDATVE SET TrangThai = N'Đã hủy', HanGiuCho = NULL WHERE DonDatVeID = @Don; UPDATE dbo.CHITIETVE SET TrangThai = N'Đã hủy' WHERE DonDatVeID = @Don;
        END;
        SET @id += 1;
    END;
    PRINT N'PASS - product cap: 11, 6+6, 2^31-1, 2^31, 2^63-1 -> 50027; 10 and 5+5 accepted and summed to one line';

    -- ---------------------------------------------------------------- 5. hold = 5 minutes, never extended by payment attempts
    DELETE @Dto; SET @Don = NULL;
    INSERT @Dto EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @ShowMon, @DanhSachGheId = @Seat3, @NewDonDatVeID = @Don OUTPUT;
    DECLARE @Hold0 DATETIME2 = (SELECT HanGiuCho FROM dbo.DONDATVE WHERE DonDatVeID = @Don);
    IF DATEDIFF(SECOND, SYSDATETIME(), @Hold0) NOT BETWEEN 290 AND 300 THROW 52040, N'The hold is not 5 minutes.', 1;
    DECLARE @Pay INT, @Txn VARCHAR(100);
    EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID = @Don, @PhuongThuc = N'VNPAY', @ThanhToanID = @Pay OUTPUT, @MaGiaoDich = @Txn OUTPUT;
    EXEC dbo.sp_Payment_UpdateResult @ThanhToanID = @Pay, @TrangThaiThanhToan = N'Thất bại';
    EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID = @Don, @PhuongThuc = N'MOMO', @ThanhToanID = @Pay OUTPUT, @MaGiaoDich = @Txn OUTPUT;
    IF (SELECT HanGiuCho FROM dbo.DONDATVE WHERE DonDatVeID = @Don) <> @Hold0 THROW 52041, N'A payment attempt or failure moved HanGiuCho.', 1;
    -- clock fixture: 40 seconds left; attempts must not extend that either
    UPDATE dbo.DONDATVE SET HanGiuCho = DATEADD(SECOND, 40, SYSDATETIME()) WHERE DonDatVeID = @Don;
    SET @Hold0 = (SELECT HanGiuCho FROM dbo.DONDATVE WHERE DonDatVeID = @Don);
    EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID = @Don, @PhuongThuc = N'ZALOPAY', @ThanhToanID = @Pay OUTPUT, @MaGiaoDich = @Txn OUTPUT;
    EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID = @Don, @PhuongThuc = N'ZALOPAY', @ThanhToanID = @Pay OUTPUT, @MaGiaoDich = @Txn OUTPUT;
    IF (SELECT HanGiuCho FROM dbo.DONDATVE WHERE DonDatVeID = @Don) <> @Hold0 THROW 52042, N'A payment attempt extended the hold.', 1;
    -- after the hold: attempt refused (50111)
    UPDATE dbo.DONDATVE SET HanGiuCho = DATEADD(SECOND, -1, SYSDATETIME()) WHERE DonDatVeID = @Don;
    SET @Err = NULL;
    BEGIN TRY EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID = @Don, @PhuongThuc = N'VNPAY', @ThanhToanID = @Pay OUTPUT, @MaGiaoDich = @Txn OUTPUT; END TRY
    BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH;
    IF ISNULL(@Err, 0) <> 50111 THROW 52043, N'A payment attempt after the hold was not refused (50111).', 1;
    UPDATE dbo.DONDATVE SET TrangThai = N'Đã hủy', HanGiuCho = NULL WHERE DonDatVeID = @Don; UPDATE dbo.CHITIETVE SET TrangThai = N'Đã hủy' WHERE DonDatVeID = @Don;
    PRINT N'PASS - hold is 5 minutes and is not moved by attempts/failures; attempt after the hold is refused';

    -- ---------------------------------------------------------------- 6. at most 3 holding orders per customer (sequential)
    UPDATE dbo.DONDATVE SET HanGiuCho = DATEADD(MINUTE, -1, SYSDATETIME()) WHERE NguoiDungID = @User AND TrangThai = N'Chờ thanh toán';
    DECLARE @H1 INT, @H2 INT, @H3 INT, @Gh INT;
    SELECT @Gh = GheID FROM @Seats WHERE n = 6; DELETE @Dto; INSERT @Dto EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @ShowMon, @DanhSachGheId = @Gh, @NewDonDatVeID = @H1 OUTPUT;
    SELECT @Gh = GheID FROM @Seats WHERE n = 7; DELETE @Dto; INSERT @Dto EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @ShowMon, @DanhSachGheId = @Gh, @NewDonDatVeID = @H2 OUTPUT;
    SELECT @Gh = GheID FROM @Seats WHERE n = 8; DELETE @Dto; INSERT @Dto EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @ShowMon, @DanhSachGheId = @Gh, @NewDonDatVeID = @H3 OUTPUT;
    SELECT @Gh = GheID FROM @Seats WHERE n = 9; SET @Err = NULL;
    BEGIN TRY EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @ShowMon, @DanhSachGheId = @Gh, @NewDonDatVeID = @Don OUTPUT; END TRY
    BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH;
    IF ISNULL(@Err, 0) <> 50028 THROW 52050, N'The 4th holding order was not refused with 50028.', 1;
    -- another customer is not affected
    DECLARE @Other INT = (SELECT TOP 1 NguoiDungID FROM dbo.NGUOIDUNG WHERE NguoiDungID <> @User AND VaiTroID = (SELECT VaiTroID FROM dbo.NGUOIDUNG WHERE NguoiDungID = @User) AND TrangThai = N'Hoạt động' ORDER BY NguoiDungID);
    DELETE @Dto; INSERT @Dto EXEC dbo.sp_Booking_Create @NguoiDungID = @Other, @SuatChieuID = @ShowMon, @DanhSachGheId = @Gh, @NewDonDatVeID = @Don OUTPUT;
    -- paying one order frees a slot
    EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID = @H1, @PhuongThuc = N'VNPAY', @ThanhToanID = @Pay OUTPUT, @MaGiaoDich = @Txn OUTPUT;
    EXEC dbo.sp_Payment_UpdateResult @ThanhToanID = @Pay, @TrangThaiThanhToan = N'Thành công';
    SELECT @Gh = GheID FROM @Seats WHERE n = 10; DELETE @Dto; SET @Don = NULL;
    INSERT @Dto EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @ShowMon, @DanhSachGheId = @Gh, @NewDonDatVeID = @Don OUTPUT;
    IF @Don IS NULL THROW 52051, N'A slot was not freed after one order was paid.', 1;
    SELECT @Gh = GheID FROM @Seats WHERE n = 11; SET @Err = NULL;
    BEGIN TRY EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @ShowMon, @DanhSachGheId = @Gh, @NewDonDatVeID = @Don OUTPUT; END TRY
    BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH;
    IF ISNULL(@Err, 0) <> 50028 THROW 52052, N'The limit did not apply again after the freed slot was used.', 1;
    -- an expired hold frees a slot too
    UPDATE dbo.DONDATVE SET HanGiuCho = DATEADD(SECOND, -1, SYSDATETIME()) WHERE DonDatVeID = @H2;
    DELETE @Dto; SET @Don = NULL;
    INSERT @Dto EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @ShowMon, @DanhSachGheId = @Gh, @NewDonDatVeID = @Don OUTPUT;
    IF @Don IS NULL THROW 52053, N'A slot was not freed after a hold expired.', 1;
    PRINT N'PASS - at most 3 holding orders: 4th refused (50028), other customer unaffected, paying or expiring frees a slot';

    -- ---------------------------------------------------------------- 7. additive surcharges (rules: VIP +15,000, weekend +10,000, IMAX +50,000)
    DECLARE @ImaxThuong INT = (SELECT TOP 1 GheID FROM dbo.GHE WHERE PhongID = @PhongImax AND LoaiGhe = N'Thường' ORDER BY SoGhe);
    DECLARE @ImaxVip INT = (SELECT TOP 1 GheID FROM dbo.GHE WHERE PhongID = @PhongImax AND LoaiGhe = N'VIP' ORDER BY SoGhe);
    DECLARE @Expected TABLE (name NVARCHAR(60), show INT, seat INT, want DECIMAL(18,2));
    INSERT @Expected VALUES
        (N'weekday 2D Thường (no rule)', @ShowMon, @Thuong1, 80000),
        (N'weekday 2D VIP (seat rule only)', @ShowMon, @Vip1, 95000),
        (N'Sunday 2D Thường (day rule only)', @ShowSun, @Thuong1, 90000),
        (N'weekday IMAX Thường (format rule only)', @ShowImaxMon, @ImaxThuong, 170000),
        (N'Sunday 2D VIP (seat + day)', @ShowSun, @Vip1, 105000),
        (N'weekday IMAX VIP (seat + format)', @ShowImaxMon, @ImaxVip, 185000),
        (N'Sunday IMAX Thường (day + format)', @ShowImaxSun, @ImaxThuong, 180000),
        (N'Sunday IMAX VIP (seat + day + format)', @ShowImaxSun, @ImaxVip, 195000);
    IF EXISTS (SELECT 1 FROM @Expected WHERE dbo.fn_TinhGiaVe(show, seat) <> want)
    BEGIN
        SELECT name, want, dbo.fn_TinhGiaVe(show, seat) AS actual FROM @Expected WHERE dbo.fn_TinhGiaVe(show, seat) <> want;
        THROW 52060, N'fn_TinhGiaVe did not return the additive price for a combination.', 1;
    END;
    -- the seat map and a real order use the same price
    IF NOT EXISTS (SELECT 1 FROM dbo.fn_DanhSachGheSuatChieu(@ShowImaxSun) WHERE GheID = @ImaxVip AND GiaVe = 195000)
        THROW 52061, N'The seat map price differs from fn_TinhGiaVe.', 1;
    DECLARE @Free INT = (SELECT TOP 1 NguoiDungID FROM dbo.NGUOIDUNG WHERE NguoiDungID NOT IN (@User, @Other) AND VaiTroID = (SELECT VaiTroID FROM dbo.NGUOIDUNG WHERE NguoiDungID = @User) AND TrangThai = N'Hoạt động' ORDER BY NguoiDungID DESC);
    DELETE @Dto; SET @Don = NULL;
    INSERT @Dto EXEC dbo.sp_Booking_Create @NguoiDungID = @Free, @SuatChieuID = @ShowImaxSun, @DanhSachGheId = @ImaxVip, @NewDonDatVeID = @Don OUTPUT;
    IF NOT EXISTS (SELECT 1 FROM dbo.CHITIETVE WHERE DonDatVeID = @Don AND GiaVe = 195000) THROW 52062, N'The stored ticket price is not the additive price.', 1;
    PRINT N'PASS - surcharges are summed: 8 combinations (single rules unchanged, 2-3 rules added), seat map and order agree';

    ROLLBACK TRANSACTION;
    PRINT N'Booking limits tests passed.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
