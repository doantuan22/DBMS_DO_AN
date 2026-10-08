-- R5.4 manual test fixture. No USE, build/reset, seed include or external payment gateway.
-- Require an explicitly confirmed existing disposable target in this SQL session.
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() <> N'CinemaBookingDB_Test' AND DB_NAME() NOT LIKE N'CinemaBookingDB[_]R0[_]%'
    THROW 51054, 'R5.4 requires a separate disposable test database.', 1;
IF SESSION_CONTEXT(N'R54DisposableTarget') IS NULL
   OR CONVERT(nvarchar(128), SESSION_CONTEXT(N'R54DisposableTarget')) <> DB_NAME()
    THROW 51054, 'Confirm the exact disposable database in R54DisposableTarget before running.', 1;
IF @@TRANCOUNT <> 0 THROW 51054, 'R5.4 fixture must own its outer transaction.', 1;
DECLARE @Persist int = COALESCE(TRY_CONVERT(int, SESSION_CONTEXT(N'R54PersistFixtures')), 0);
IF @Persist NOT IN (0, 1) THROW 51054, 'R54PersistFixtures must be 0 (rollback) or 1 (commit).', 1;

DECLARE @Now datetime2(7) = dbo.fn_BayGio();
DECLARE @Customer1 int, @Customer2 int, @Customer3 int, @Customer4 int, @Admin int, @Support int;
DECLARE @FutureShow int, @FutureRoom int, @CompShow int, @CompRoom int;
DECLARE @PastShow int, @PastRoom int, @PastMovie int, @PastStarts datetime2(7), @PastEnds datetime2(7);
DECLARE @Seat1 int, @Seat2 int, @Seat3 int, @CompSeat1 int, @CompSeat2 int, @PastSeat int;
DECLARE @Product1 int, @Product2 int, @Promo int, @PromoCode varchar(50) = 'CHAOBANMOI';
DECLARE @OneFood nvarchar(max), @ManyFood nvarchar(max), @SeatList varchar(max);
DECLARE @Expired int, @Canceled int, @Paid int, @CompOrder int, @History int, @Pending int;
DECLARE @FailedPayment int, @PaidPayment int, @CompPayment int, @HistoryPayment int, @Reference varchar(100);
DECLARE @NewComplaint int, @ProcessingComplaint int, @ResolvedComplaint int, @ClosedComplaint int, @RejectedComplaint int;
DECLARE @Review int, @HistoricalBooked datetime2(7), @HistoricalAttempt datetime2(7), @HistoricalPaid datetime2(7);
DECLARE @HistoricalPrice decimal(18,2), @HistoricalPoints int, @CompPointsBefore int, @CompPointsAfter int;
DECLARE @CompPaymentBefore nvarchar(max), @CompLedgerAfter nvarchar(max), @PromoAfterCancel int;

DECLARE @Orders TABLE (
    FixtureID varchar(40) PRIMARY KEY, DonDatVeID int UNIQUE NOT NULL,
    ExpectedStatus nvarchar(50) NOT NULL, Tickets int NOT NULL, FoodLines int NOT NULL,
    Payments int NOT NULL, Successes int NOT NULL
);
DECLARE @Money TABLE (DonDatVeID int PRIMARY KEY, TongTienVe decimal(18,2), TongTienDoAn decimal(18,2), TienGiamGia decimal(18,2));
DECLARE @ProfilesBefore TABLE (NguoiDungID int PRIMARY KEY, DiemTichLuy int);
DECLARE @QuotasBefore TABLE (KhuyenMaiID int PRIMARY KEY, SoLuongDaDung int);
DECLARE @Complaints TABLE (FixtureID varchar(40) PRIMARY KEY, KhieuNaiID int UNIQUE NOT NULL, ExpectedStatus nvarchar(50) NOT NULL, Events int NOT NULL);

BEGIN TRY
    BEGIN TRANSACTION;
    -- ASSERT R54-PREREQUISITES: fresh transaction data, trusted constraints and enabled triggers.
    IF EXISTS (SELECT 1 FROM dbo.DONDATVE) OR EXISTS (SELECT 1 FROM dbo.CHITIETVE)
       OR EXISTS (SELECT 1 FROM dbo.CHITIETDOAN) OR EXISTS (SELECT 1 FROM dbo.THANHTOAN)
       OR EXISTS (SELECT 1 FROM dbo.DANHGIAPHIM) OR EXISTS (SELECT 1 FROM dbo.KHIEUNAI)
       OR EXISTS (SELECT 1 FROM dbo.XULY_KHIEUNAI) OR EXISTS (SELECT 1 FROM dbo.BOITHUONG_HUYSUAT)
        THROW 51054, 'Transaction fixture requires empty transaction tables; never repair or overwrite existing history.', 1;
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE is_disabled = 1 OR is_not_trusted = 1)
       OR EXISTS (SELECT 1 FROM sys.check_constraints WHERE is_disabled = 1 OR is_not_trusted = 1)
       OR EXISTS (SELECT 1 FROM sys.triggers WHERE parent_class = 1 AND is_disabled = 1)
        THROW 51054, 'Fixture requires trusted FK/CHECK constraints and enabled business triggers.', 1;
    IF (SELECT COUNT(*) FROM dbo.SUATCHIEU) <> 32
       OR (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE TrangThai = N'Hoàn thành' AND ThoiGianKetThuc < @Now) <> 8
       OR (SELECT COUNT(*) FROM dbo.vw_LichChieuChiTiet WHERE IsBookable = 1) <> 24
        THROW 51054, 'Apply current Base/Dynamic Seed on a clean target first; 8 past and 24 bookable future shows required.', 1;

    SELECT @Customer1 = NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = 'khachhang1@gmail.com';
    SELECT @Customer2 = NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = 'khachhang2@gmail.com';
    SELECT @Customer3 = NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = 'khachhang3@gmail.com';
    SELECT @Customer4 = NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = 'khachhang4@gmail.com';
    SELECT @Admin = NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = 'admin@cinemadb.vn';
    SELECT @Support = NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = 'cskh@cinemadb.vn';
    IF @Customer1 IS NULL OR @Customer2 IS NULL OR @Customer3 IS NULL OR @Customer4 IS NULL OR @Admin IS NULL OR @Support IS NULL
        THROW 51054, 'Required seed accounts are absent.', 1;
    IF (SELECT COUNT(*) FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID = n.VaiTroID
        WHERE n.NguoiDungID IN (@Customer1, @Customer2, @Customer3, @Customer4) AND v.MaVaiTro = 'KHACH_HANG' AND n.TrangThai = N'Hoạt động') <> 4
       OR NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID = n.VaiTroID WHERE n.NguoiDungID = @Admin AND v.MaVaiTro = 'ADMIN' AND n.TrangThai = N'Hoạt động')
       OR NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID = n.VaiTroID WHERE n.NguoiDungID = @Support AND v.MaVaiTro = 'CSKH' AND n.TrangThai = N'Hoạt động')
        THROW 51054, 'Fixture actors must retain their active baseline roles.', 1;
    INSERT @ProfilesBefore SELECT NguoiDungID, DiemTichLuy FROM dbo.HOSOKHACHHANG;
    IF (SELECT COUNT(*) FROM @ProfilesBefore WHERE NguoiDungID IN (@Customer1, @Customer2, @Customer3, @Customer4)) <> 4
        THROW 51054, 'All four customers require existing profiles.', 1;
    INSERT @QuotasBefore SELECT KhuyenMaiID, SoLuongDaDung FROM dbo.KHUYENMAI;
    IF EXISTS (SELECT 1 FROM @QuotasBefore WHERE SoLuongDaDung <> 0)
        THROW 51054, 'Clean seeded promotion counters must be zero before fixture setup.', 1;

    SELECT TOP (1) @FutureShow = SuatChieuID, @FutureRoom = PhongID
    FROM dbo.vw_LichChieuChiTiet WHERE IsBookable = 1 ORDER BY SuatChieuID;
    SELECT TOP (1) @CompShow = SuatChieuID, @CompRoom = PhongID
    FROM dbo.vw_LichChieuChiTiet WHERE IsBookable = 1 AND SuatChieuID <> @FutureShow ORDER BY SuatChieuID DESC;
    SELECT TOP (1) @PastShow = SuatChieuID, @PastRoom = PhongID, @PastMovie = PhimID,
        @PastStarts = ThoiGianBatDau, @PastEnds = ThoiGianKetThuc
    FROM dbo.SUATCHIEU WHERE TrangThai = N'Hoàn thành' AND ThoiGianKetThuc < @Now
    ORDER BY ThoiGianKetThuc DESC, SuatChieuID;
    SELECT @Seat1 = GheID FROM dbo.GHE WHERE PhongID = @FutureRoom AND HangGhe = 'A' AND SoGhe = 1 AND TrangThai = N'Hoạt động';
    SELECT @Seat2 = GheID FROM dbo.GHE WHERE PhongID = @FutureRoom AND HangGhe = 'A' AND SoGhe = 2 AND TrangThai = N'Hoạt động';
    SELECT @Seat3 = GheID FROM dbo.GHE WHERE PhongID = @FutureRoom AND HangGhe = 'A' AND SoGhe = 3 AND TrangThai = N'Hoạt động';
    SELECT @CompSeat1 = GheID FROM dbo.GHE WHERE PhongID = @CompRoom AND HangGhe = 'A' AND SoGhe = 1 AND TrangThai = N'Hoạt động';
    SELECT @CompSeat2 = GheID FROM dbo.GHE WHERE PhongID = @CompRoom AND HangGhe = 'A' AND SoGhe = 2 AND TrangThai = N'Hoạt động';
    SELECT @PastSeat = GheID FROM dbo.GHE WHERE PhongID = @PastRoom AND HangGhe = 'A' AND SoGhe = 1 AND TrangThai = N'Hoạt động';
    SELECT @Product1 = SanPhamID FROM dbo.SANPHAM WHERE SanPhamID = 1 AND TrangThai = N'Đang bán';
    SELECT @Product2 = SanPhamID FROM dbo.SANPHAM WHERE SanPhamID = 2 AND TrangThai = N'Đang bán';
    SELECT @Promo = KhuyenMaiID FROM dbo.KHUYENMAI WHERE MaCode = @PromoCode AND TrangThai = N'Hoạt động'
        AND NgayBatDau <= @Now AND NgayKetThuc >= @Now AND SoLuongDaDung < SoLuong;
    IF @FutureShow IS NULL OR @CompShow IS NULL OR @PastShow IS NULL OR @Seat1 IS NULL OR @Seat2 IS NULL OR @Seat3 IS NULL
       OR @CompSeat1 IS NULL OR @CompSeat2 IS NULL OR @PastSeat IS NULL OR @Product1 IS NULL OR @Product2 IS NULL OR @Promo IS NULL
        THROW 51054, 'Required shows, active seats/products or current CHAOBANMOI promotion are missing.', 1;
    SET @OneFood = (SELECT @Product1 AS SanPhamID, 1 AS SoLuong FOR JSON PATH);
    SET @ManyFood = (SELECT SanPhamID, 1 AS SoLuong FROM dbo.SANPHAM WHERE SanPhamID IN (@Product1, @Product2) ORDER BY SanPhamID FOR JSON PATH);

    -- R54-O-EXPIRED: age only fixture timestamps, then use the real expiry transition.
    SET @SeatList = CONVERT(varchar(20), @Seat1);
    EXEC dbo.sp_Booking_Create @NguoiDungID = @Customer1, @SuatChieuID = @FutureShow,
        @MaKhuyenMai = @PromoCode, @DanhSachGheId = @SeatList, @DanhSachDoAnJson = @OneFood, @NewDonDatVeID = @Expired OUTPUT;
    INSERT @Money SELECT DonDatVeID, TongTienVe, TongTienDoAn, TienGiamGia FROM dbo.DONDATVE WHERE DonDatVeID = @Expired;
    IF (SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @Promo) <> 1 THROW 51054, 'Expired setup must reserve one promo use.', 1;
    UPDATE dbo.DONDATVE SET NgayDat = DATEADD(MINUTE, -6, @Now), HanGiuCho = DATEADD(MINUTE, -1, @Now) WHERE DonDatVeID = @Expired;
    EXEC dbo.sp_Order_ExpirePending @SuatChieuID = @FutureShow, @TraVeKetQua = 0;
    INSERT @Orders VALUES ('R54-O-EXPIRED', @Expired, N'Hết hạn', 1, 1, 0, 0);
    IF (SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @Promo) <> 0 THROW 51054, 'Expiry must release its promo use.', 1;

    -- R54-O-CANCELED: no successful payment exists; preserve the canceled ticket row.
    SET @SeatList = CONVERT(varchar(20), @Seat2);
    EXEC dbo.sp_Booking_Create @NguoiDungID = @Customer1, @SuatChieuID = @FutureShow,
        @MaKhuyenMai = @PromoCode, @DanhSachGheId = @SeatList, @DanhSachDoAnJson = @OneFood, @NewDonDatVeID = @Canceled OUTPUT;
    INSERT @Money SELECT DonDatVeID, TongTienVe, TongTienDoAn, TienGiamGia FROM dbo.DONDATVE WHERE DonDatVeID = @Canceled;
    IF (SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @Promo) <> 1 THROW 51054, 'Cancel setup must reserve one promo use.', 1;
    EXEC dbo.sp_Order_Cancel @NguoiDungID = @Customer1, @DonDatVeID = @Canceled;
    INSERT @Orders VALUES ('R54-O-CANCELED', @Canceled, N'Đã hủy', 1, 1, 0, 0);
    IF (SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @Promo) <> 0 THROW 51054, 'Order cancellation must release its promo use.', 1;

    -- R54-O-PAID: failed attempt is immutable history; success uses a new payment ID.
    SET @SeatList = CONVERT(varchar(20), @Seat3);
    EXEC dbo.sp_Booking_Create @NguoiDungID = @Customer1, @SuatChieuID = @FutureShow,
        @MaKhuyenMai = @PromoCode, @DanhSachGheId = @SeatList, @DanhSachDoAnJson = @OneFood, @NewDonDatVeID = @Paid OUTPUT;
    INSERT @Money SELECT DonDatVeID, TongTienVe, TongTienDoAn, TienGiamGia FROM dbo.DONDATVE WHERE DonDatVeID = @Paid;
    EXEC dbo.sp_Payment_CreateAttempt @NguoiDungID = @Customer1, @DonDatVeID = @Paid, @PhuongThuc = N'VNPAY', @ThanhToanID = @FailedPayment OUTPUT, @MaGiaoDich = @Reference OUTPUT;
    EXEC dbo.sp_Payment_UpdateResult @NguoiDungID = @Customer1, @ThanhToanID = @FailedPayment, @TrangThaiThanhToan = N'Thất bại', @GhiChu = N'R54 failed attempt';
    IF NOT EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID = @Paid AND TrangThai = N'Chờ thanh toán') THROW 51054, 'Failure must leave the order pending for retry.', 1;
    EXEC dbo.sp_Payment_CreateAttempt @NguoiDungID = @Customer1, @DonDatVeID = @Paid, @PhuongThuc = N'VNPAY', @ThanhToanID = @PaidPayment OUTPUT, @MaGiaoDich = @Reference OUTPUT;
    EXEC dbo.sp_Payment_UpdateResult @NguoiDungID = @Customer1, @ThanhToanID = @PaidPayment, @TrangThaiThanhToan = N'Thành công', @GhiChu = N'R54 paid after retry';
    INSERT @Orders VALUES ('R54-O-PAID', @Paid, N'Đã thanh toán', 1, 1, 2, 1);

    -- R54-O-COMPENSATED: separate future show, no pending hold, real cancellation/points ledger.
    SET @SeatList = CONCAT(@CompSeat1, ',', @CompSeat2);
    EXEC dbo.sp_Booking_Create @NguoiDungID = @Customer3, @SuatChieuID = @CompShow,
        @MaKhuyenMai = @PromoCode, @DanhSachGheId = @SeatList, @DanhSachDoAnJson = @ManyFood, @NewDonDatVeID = @CompOrder OUTPUT;
    INSERT @Money SELECT DonDatVeID, TongTienVe, TongTienDoAn, TienGiamGia FROM dbo.DONDATVE WHERE DonDatVeID = @CompOrder;
    EXEC dbo.sp_Payment_CreateAttempt @NguoiDungID = @Customer3, @DonDatVeID = @CompOrder, @PhuongThuc = N'MOMO', @ThanhToanID = @CompPayment OUTPUT, @MaGiaoDich = @Reference OUTPUT;
    EXEC dbo.sp_Payment_UpdateResult @NguoiDungID = @Customer3, @ThanhToanID = @CompPayment, @TrangThaiThanhToan = N'Thành công', @GhiChu = N'R54 paid before show cancellation';
    SET @CompPaymentBefore = (SELECT * FROM dbo.THANHTOAN WHERE ThanhToanID = @CompPayment FOR JSON PATH);
    SELECT @CompPointsBefore = DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @Customer3;
    IF EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE SuatChieuID = @CompShow AND TrangThai = N'Chờ thanh toán' AND HanGiuCho > dbo.fn_BayGio())
        THROW 51054, 'Compensation setup must not bypass active-hold cancellation protection.', 1;
    EXEC dbo.sp_Showtime_CancelCascade @SuatChieuID = @CompShow, @NguoiDungID = @Admin, @LyDo = N'R54 disposable fixture cancellation';
    INSERT @Orders VALUES ('R54-O-COMPENSATED', @CompOrder, N'Đã hủy', 2, 2, 1, 1);
    -- ASSERT R54-COMPENSATION: delegate exact proportional/FLOOR calculation to the DB helper.
    IF NOT EXISTS (SELECT 1 FROM dbo.BOITHUONG_HUYSUAT b JOIN @Money m ON m.DonDatVeID = b.DonDatVeID
        CROSS APPLY dbo.fn_TinhBoiThuongVe(m.TongTienVe, m.TongTienDoAn, m.TienGiamGia) expected
        WHERE b.DonDatVeID = @CompOrder AND b.DiemBoiThuong = expected.DiemCong)
       OR (SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID = @CompOrder) <> 1
       OR NOT EXISTS (SELECT 1 FROM dbo.SUATCHIEU WHERE SuatChieuID = @CompShow AND TrangThai = N'Đã hủy')
        THROW 51054, 'Canceled paid order must have one correct compensation event and a canceled show.', 1;
    SELECT @CompPointsAfter = DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @Customer3;
    IF @CompPointsAfter <> @CompPointsBefore + (SELECT DiemBoiThuong FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID = @CompOrder)
        THROW 51054, 'Cancellation must add only its compensation points.', 1;
    SET @CompLedgerAfter = (SELECT * FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID = @CompOrder FOR JSON PATH);
    SELECT @PromoAfterCancel = SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @Promo;
    EXEC dbo.sp_Showtime_CancelCascade @SuatChieuID = @CompShow, @NguoiDungID = @Admin, @LyDo = N'R54 repeat cancellation';
    IF @CompPaymentBefore <> (SELECT * FROM dbo.THANHTOAN WHERE ThanhToanID = @CompPayment FOR JSON PATH)
       OR @CompLedgerAfter <> (SELECT * FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID = @CompOrder FOR JSON PATH)
       OR @CompPointsAfter <> (SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @Customer3)
       OR @PromoAfterCancel <> (SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @Promo)
        THROW 51054, 'Repeated cancellation must preserve payment, ledger, points and quota.', 1;

    -- R54-O-HISTORY: controlled historical SQL, because booking/payment SPs reject past shows.
    -- Paid and Đã đặt are supported historical states; no new Completed/check-in workflow.
    SET @HistoricalBooked = DATEADD(HOUR, -1, @PastStarts);
    SET @HistoricalAttempt = DATEADD(MINUTE, 1, @HistoricalBooked);
    SET @HistoricalPaid = DATEADD(MINUTE, 2, @HistoricalBooked);
    IF @HistoricalBooked < (SELECT NgayTao FROM dbo.NGUOIDUNG WHERE NguoiDungID = @Customer1)
       OR @HistoricalPaid >= @PastStarts OR @PastEnds >= @Now
        THROW 51054, 'Historical order/payment must follow account creation and precede the completed show.', 1;
    SET @HistoricalPrice = dbo.fn_TinhGiaVe(@PastShow, @PastSeat);
    IF @HistoricalPrice IS NULL OR @HistoricalPrice <= 0 THROW 51054, 'Historical ticket requires a valid DB-priced snapshot.', 1;
    INSERT INTO dbo.DONDATVE (NguoiDungID, SuatChieuID, KhuyenMaiID, NgayDat, TongTienVe, TongTienDoAn, TienGiamGia, TrangThai, HanGiuCho)
    VALUES (@Customer1, @PastShow, NULL, @HistoricalBooked, @HistoricalPrice, 0, 0, N'Đã thanh toán', NULL);
    SET @History = SCOPE_IDENTITY();
    INSERT INTO dbo.CHITIETVE (DonDatVeID, GheID, GiaVe, MaVe, TrangThai)
    VALUES (@History, @PastSeat, @HistoricalPrice, CONCAT('R54-HISTORY-', CONVERT(varchar(36), NEWID())), N'Đã đặt');
    INSERT INTO dbo.THANHTOAN (DonDatVeID, PhuongThuc, SoTien, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai, GhiChu)
    SELECT DonDatVeID, N'VNPAY', TongTienVe + TongTienDoAn - TienGiamGia, @HistoricalAttempt, @HistoricalPaid,
        CONCAT('R54-HISTORY-', CONVERT(varchar(36), NEWID())), N'Thành công', N'R54 controlled historical payment snapshot'
    FROM dbo.DONDATVE WHERE DonDatVeID = @History;
    SET @HistoryPayment = SCOPE_IDENTITY();
    SELECT @HistoricalPoints = CONVERT(int, SoTien / 1000) FROM dbo.THANHTOAN WHERE ThanhToanID = @HistoryPayment;
    UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy = DiemTichLuy + @HistoricalPoints WHERE NguoiDungID = @Customer1;
    INSERT @Money SELECT DonDatVeID, TongTienVe, TongTienDoAn, TienGiamGia FROM dbo.DONDATVE WHERE DonDatVeID = @History;
    INSERT @Orders VALUES ('R54-O-HISTORY', @History, N'Đã thanh toán', 1, 0, 1, 1);

    -- R54-REVIEW-ELIGIBLE: normal SP/trigger; no invalid review is inserted for negative inputs.
    EXEC dbo.sp_Review_Create @NguoiDungID = @Customer1, @PhimID = @PastMovie, @SoSao = 5, @NoiDung = N'R54 eligible historical review';
    SELECT @Review = DanhGiaID FROM dbo.DANHGIAPHIM WHERE NguoiDungID = @Customer1 AND PhimID = @PastMovie;
    IF @Review IS NULL OR EXISTS (SELECT 1 FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID = d.SuatChieuID
        WHERE d.NguoiDungID = @Customer4 AND s.PhimID = @PastMovie AND d.TrangThai IN (N'Đã thanh toán', N'Hoàn thành') AND s.ThoiGianBatDau <= dbo.fn_BayGio())
        THROW 51054, 'Review inputs require eligible Customer 1 and non-eligible Customer 4.', 1;

    -- Complaints: create via ownership-aware SP, then only processing SPs drive parent status.
    EXEC dbo.sp_Complaint_Create @NguoiDungID = @Customer1, @DonDatVeID = NULL, @LoaiKhieuNai = N'Hỗ trợ', @TieuDe = N'R54-C-NEW', @NoiDung = N'R54 new complaint without order';
    SELECT @NewComplaint = KhieuNaiID FROM dbo.KHIEUNAI WHERE NguoiDungID = @Customer1 AND TieuDe = N'R54-C-NEW';
    INSERT @Complaints VALUES ('R54-C-NEW', @NewComplaint, N'Mới', 0);
    EXEC dbo.sp_Complaint_Create @NguoiDungID = @Customer1, @DonDatVeID = @Paid, @LoaiKhieuNai = N'Hỗ trợ', @TieuDe = N'R54-C-PROCESSING', @NoiDung = N'R54 linked paid order';
    SELECT @ProcessingComplaint = KhieuNaiID FROM dbo.KHIEUNAI WHERE NguoiDungID = @Customer1 AND TieuDe = N'R54-C-PROCESSING';
    EXEC dbo.sp_Support_Complaint_AddProcessing @NguoiDungID = @Support, @KhieuNaiID = @ProcessingComplaint, @NoiDungXuLy = N'R54 investigating', @TrangThaiSauXuLy = N'Đang xử lý';
    INSERT @Complaints VALUES ('R54-C-PROCESSING', @ProcessingComplaint, N'Đang xử lý', 1);
    EXEC dbo.sp_Complaint_Create @NguoiDungID = @Customer1, @DonDatVeID = @History, @LoaiKhieuNai = N'Hỗ trợ', @TieuDe = N'R54-C-RESOLVED', @NoiDung = N'R54 linked historical order';
    SELECT @ResolvedComplaint = KhieuNaiID FROM dbo.KHIEUNAI WHERE NguoiDungID = @Customer1 AND TieuDe = N'R54-C-RESOLVED';
    EXEC dbo.sp_Support_Complaint_AddProcessing @NguoiDungID = @Support, @KhieuNaiID = @ResolvedComplaint, @NoiDungXuLy = N'R54 investigating', @TrangThaiSauXuLy = N'Đang xử lý';
    EXEC dbo.sp_Support_Complaint_AddProcessing @NguoiDungID = @Support, @KhieuNaiID = @ResolvedComplaint, @NoiDungXuLy = N'R54 resolved', @TrangThaiSauXuLy = N'Đã giải quyết';
    INSERT @Complaints VALUES ('R54-C-RESOLVED', @ResolvedComplaint, N'Đã giải quyết', 2);
    EXEC dbo.sp_Complaint_Create @NguoiDungID = @Customer3, @DonDatVeID = @CompOrder, @LoaiKhieuNai = N'Hỗ trợ', @TieuDe = N'R54-C-CLOSED', @NoiDung = N'R54 linked compensated order';
    SELECT @ClosedComplaint = KhieuNaiID FROM dbo.KHIEUNAI WHERE NguoiDungID = @Customer3 AND TieuDe = N'R54-C-CLOSED';
    EXEC dbo.sp_Support_Complaint_AddProcessing @NguoiDungID = @Support, @KhieuNaiID = @ClosedComplaint, @NoiDungXuLy = N'R54 investigating', @TrangThaiSauXuLy = N'Đang xử lý';
    EXEC dbo.sp_Support_Complaint_AddProcessing @NguoiDungID = @Support, @KhieuNaiID = @ClosedComplaint, @NoiDungXuLy = N'R54 resolved', @TrangThaiSauXuLy = N'Đã giải quyết';
    EXEC dbo.sp_Support_Complaint_UpdateStatus @NguoiDungID = @Admin, @KhieuNaiID = @ClosedComplaint, @TrangThaiMoi = N'Đã đóng';
    INSERT @Complaints VALUES ('R54-C-CLOSED', @ClosedComplaint, N'Đã đóng', 3);
    EXEC dbo.sp_Complaint_Create @NguoiDungID = @Customer2, @DonDatVeID = NULL, @LoaiKhieuNai = N'Hỗ trợ', @TieuDe = N'R54-C-REJECTED', @NoiDung = N'R54 rejected complaint without order';
    SELECT @RejectedComplaint = KhieuNaiID FROM dbo.KHIEUNAI WHERE NguoiDungID = @Customer2 AND TieuDe = N'R54-C-REJECTED';
    EXEC dbo.sp_Support_Complaint_AddProcessing @NguoiDungID = @Support, @KhieuNaiID = @RejectedComplaint, @NoiDungXuLy = N'R54 rejection reason', @TrangThaiSauXuLy = N'Từ chối';
    INSERT @Complaints VALUES ('R54-C-REJECTED', @RejectedComplaint, N'Từ chối', 1);

    -- R54-O-PENDING: create last; reuse expired A1 without deleting its historical ticket.
    SET @SeatList = CONVERT(varchar(20), @Seat1);
    EXEC dbo.sp_Booking_Create @NguoiDungID = @Customer2, @SuatChieuID = @FutureShow,
        @MaKhuyenMai = NULL, @DanhSachGheId = @SeatList, @DanhSachDoAnJson = NULL, @NewDonDatVeID = @Pending OUTPUT;
    INSERT @Money SELECT DonDatVeID, TongTienVe, TongTienDoAn, TienGiamGia FROM dbo.DONDATVE WHERE DonDatVeID = @Pending;
    INSERT @Orders VALUES ('R54-O-PENDING', @Pending, N'Chờ thanh toán', 1, 0, 0, 0);

    -- ASSERT R54-ORDER-TICKET-FOOD: exact intended coverage, no half-constructed order.
    IF (SELECT COUNT(*) FROM @Orders) <> 6 OR (SELECT COUNT(*) FROM dbo.DONDATVE) <> 6
       OR (SELECT COUNT(*) FROM dbo.CHITIETVE) <> 7 OR (SELECT COUNT(*) FROM dbo.CHITIETDOAN) <> 5
       OR (SELECT COUNT(*) FROM dbo.THANHTOAN) <> 4 OR (SELECT COUNT(*) FROM dbo.DANHGIAPHIM) <> 1
       OR (SELECT COUNT(*) FROM dbo.KHIEUNAI) <> 5 OR (SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI) <> 7
       OR (SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT) <> 1
        THROW 51054, 'Fixture row counts differ from the minimal scenario matrix.', 1;
    IF EXISTS (SELECT 1 FROM @Orders o LEFT JOIN dbo.DONDATVE d ON d.DonDatVeID = o.DonDatVeID
        WHERE d.DonDatVeID IS NULL OR d.TrangThai <> o.ExpectedStatus
           OR (SELECT COUNT(*) FROM dbo.CHITIETVE v WHERE v.DonDatVeID = o.DonDatVeID) <> o.Tickets
           OR (SELECT COUNT(*) FROM dbo.CHITIETDOAN f WHERE f.DonDatVeID = o.DonDatVeID) <> o.FoodLines
           OR (SELECT COUNT(*) FROM dbo.THANHTOAN t WHERE t.DonDatVeID = o.DonDatVeID) <> o.Payments
           OR (SELECT COUNT(*) FROM dbo.THANHTOAN t WHERE t.DonDatVeID = o.DonDatVeID AND t.TrangThai = N'Thành công') <> o.Successes)
        THROW 51054, 'Order state, ticket/food or payment-attempt coverage mismatch.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID = @Pending AND HanGiuCho > dbo.fn_BayGio()
        AND HanGiuCho >= DATEADD(MINUTE, dbo.fn_ThoiGianGiuChoPhut(), NgayDat))
       OR NOT EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID = @Expired AND NgayDat < HanGiuCho AND HanGiuCho <= @Now)
       OR EXISTS (SELECT 1 FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID
           WHERE (d.TrangThai IN (N'Hết hạn', N'Đã hủy') AND v.TrangThai <> N'Đã hủy')
              OR (d.TrangThai IN (N'Chờ thanh toán', N'Đã thanh toán') AND v.TrangThai <> N'Đã đặt'))
        THROW 51054, 'Hold/expiry/ticket lifecycle failed; no artificial hold extension is allowed.', 1;

    -- ASSERT R54-MONEY: amounts remain stored snapshots, not recalculated from mutable catalog.
    IF EXISTS (SELECT 1 FROM @Money m JOIN dbo.DONDATVE d ON d.DonDatVeID = m.DonDatVeID
        WHERE d.TongTienVe <> m.TongTienVe OR d.TongTienDoAn <> m.TongTienDoAn OR d.TienGiamGia <> m.TienGiamGia)
       OR EXISTS (SELECT 1 FROM dbo.DONDATVE d
        WHERE d.TongTienVe <> (SELECT SUM(v.GiaVe) FROM dbo.CHITIETVE v WHERE v.DonDatVeID = d.DonDatVeID)
           OR d.TongTienDoAn <> COALESCE((SELECT SUM(CONVERT(decimal(18,2), f.SoLuong) * f.DonGia) FROM dbo.CHITIETDOAN f WHERE f.DonDatVeID = d.DonDatVeID), 0)
           OR d.TongTienVe + d.TongTienDoAn - d.TienGiamGia <= 0
           OR d.TienGiamGia > ROUND((d.TongTienVe + d.TongTienDoAn) * dbo.fn_GioiHanGiamGiaPhanTram() / 100.0, 2, 1))
       OR EXISTS (SELECT DonDatVeID, SanPhamID FROM dbo.CHITIETDOAN GROUP BY DonDatVeID, SanPhamID HAVING COUNT(*) > 1)
       OR EXISTS (SELECT 1 FROM dbo.CHITIETDOAN f JOIN dbo.SANPHAM p ON p.SanPhamID = f.SanPhamID
           WHERE f.DonGia <> p.Gia OR f.SoLuong <> 1)
        THROW 51054, 'Stored monetary snapshots, food quantity or discount cap are inconsistent.', 1;

    -- ASSERT R54-PAYMENTS-TIME: retain retry failure; exactly one successful payment per paid history.
    IF @FailedPayment = @PaidPayment
       OR NOT EXISTS (SELECT 1 FROM dbo.THANHTOAN WHERE ThanhToanID = @FailedPayment AND TrangThai = N'Thất bại' AND NgayThanhToan IS NULL)
       OR NOT EXISTS (SELECT 1 FROM dbo.THANHTOAN WHERE ThanhToanID = @PaidPayment AND TrangThai = N'Thành công' AND NgayThanhToan IS NOT NULL)
       OR EXISTS (SELECT 1 FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID = t.DonDatVeID JOIN dbo.SUATCHIEU s ON s.SuatChieuID = d.SuatChieuID
           WHERE t.SoTien <> d.TongTienVe + d.TongTienDoAn - d.TienGiamGia
              OR t.NgayTao < d.NgayDat OR t.NgayTao >= s.ThoiGianBatDau
              OR (t.TrangThai = N'Thành công' AND (t.NgayThanhToan IS NULL OR t.NgayThanhToan < t.NgayTao OR t.NgayThanhToan >= s.ThoiGianBatDau)))
       OR EXISTS (SELECT DonDatVeID FROM dbo.THANHTOAN WHERE TrangThai = N'Thành công' GROUP BY DonDatVeID HAVING COUNT(*) > 1)
       OR EXISTS (SELECT 1 FROM dbo.DONDATVE d JOIN dbo.NGUOIDUNG n ON n.NguoiDungID = d.NguoiDungID JOIN dbo.SUATCHIEU s ON s.SuatChieuID = d.SuatChieuID
           WHERE d.NgayDat < n.NgayTao OR d.NgayDat >= s.ThoiGianBatDau)
        THROW 51054, 'Payment history, amounts or chronological snapshots are inconsistent.', 1;

    -- ASSERT R54-SEAT-CONFLICT: expired ticket stays present while a valid new booking reuses A1.
    IF NOT EXISTS (SELECT 1 FROM dbo.CHITIETVE WHERE DonDatVeID = @Expired AND GheID = @Seat1 AND TrangThai = N'Đã hủy')
       OR NOT EXISTS (SELECT 1 FROM dbo.CHITIETVE WHERE DonDatVeID = @Pending AND GheID = @Seat1 AND TrangThai = N'Đã đặt')
       OR EXISTS (SELECT 1 FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID
           JOIN dbo.SUATCHIEU s ON s.SuatChieuID = d.SuatChieuID JOIN dbo.GHE g ON g.GheID = v.GheID WHERE s.PhongID <> g.PhongID)
       OR EXISTS (SELECT d.SuatChieuID, v.GheID FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID
           WHERE v.TrangThai <> N'Đã hủy' AND dbo.fn_DonDangGiuGhe(d.TrangThai, d.HanGiuCho, dbo.fn_BayGio()) = 1
           GROUP BY d.SuatChieuID, v.GheID HAVING COUNT(*) > 1)
        THROW 51054, 'Seat ownership/conflict or historical ticket retention failed.', 1;

    -- ASSERT R54-POINTS-QUOTA: preserve seed offsets and apply only fixture lifecycle deltas.
    IF EXISTS (SELECT 1 FROM @ProfilesBefore initial JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID = initial.NguoiDungID
        WHERE h.DiemTichLuy <> initial.DiemTichLuy
            + COALESCE((SELECT SUM(CONVERT(bigint, CONVERT(int, t.SoTien / 1000))) FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID = t.DonDatVeID WHERE d.NguoiDungID = h.NguoiDungID AND t.TrangThai = N'Thành công'), 0)
            + COALESCE((SELECT SUM(CONVERT(bigint, b.DiemBoiThuong)) FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID = b.DonDatVeID WHERE d.NguoiDungID = h.NguoiDungID), 0))
       OR EXISTS (SELECT 1 FROM @QuotasBefore initial JOIN dbo.KHUYENMAI km ON km.KhuyenMaiID = initial.KhuyenMaiID
        WHERE km.SoLuongDaDung <> initial.SoLuongDaDung + (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.KhuyenMaiID = km.KhuyenMaiID
            AND (d.TrangThai = N'Đã thanh toán' OR (d.TrangThai = N'Chờ thanh toán' AND d.HanGiuCho > dbo.fn_BayGio()))))
       OR (SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @Promo) <> 1
        THROW 51054, 'Points or promotion reservation/release deltas differ from the lifecycle.', 1;

    -- ASSERT R54-COMPLAINT-HISTORY: ownership, 0/1/many events, authoritative highest XuLyID.
    IF EXISTS (SELECT 1 FROM @Complaints c LEFT JOIN dbo.KHIEUNAI k ON k.KhieuNaiID = c.KhieuNaiID
        WHERE k.KhieuNaiID IS NULL OR k.TrangThai <> c.ExpectedStatus
           OR (SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI x WHERE x.KhieuNaiID = c.KhieuNaiID) <> c.Events)
       OR EXISTS (SELECT 1 FROM dbo.KHIEUNAI k JOIN dbo.DONDATVE d ON d.DonDatVeID = k.DonDatVeID WHERE k.NguoiDungID <> d.NguoiDungID)
       OR EXISTS (SELECT 1 FROM dbo.KHIEUNAI k OUTER APPLY (SELECT TOP (1) x.TrangThaiSauXuLy FROM dbo.XULY_KHIEUNAI x WHERE x.KhieuNaiID = k.KhieuNaiID ORDER BY x.XuLyID DESC) latest
           WHERE k.TrangThai <> COALESCE(latest.TrangThaiSauXuLy, N'Mới'))
       OR EXISTS (SELECT 1 FROM dbo.XULY_KHIEUNAI x JOIN dbo.KHIEUNAI k ON k.KhieuNaiID = x.KhieuNaiID
           JOIN dbo.NGUOIDUNG n ON n.NguoiDungID = x.NguoiXuLyID JOIN dbo.VAITRO v ON v.VaiTroID = n.VaiTroID
           WHERE x.NgayXuLy < k.NgayTao OR n.TrangThai <> N'Hoạt động' OR v.MaVaiTro NOT IN ('CSKH', 'ADMIN')
              OR dbo.fn_KiemTraQuyenNguoiDung(n.NguoiDungID, 'QL_KHIEUNAI') <> 1 OR dbo.fn_KiemTraQuyenNguoiDung(n.NguoiDungID, 'XULY_KHIEUNAI') <> 1)
       OR EXISTS (SELECT 1 FROM (SELECT NgayXuLy, LAG(NgayXuLy) OVER (PARTITION BY KhieuNaiID ORDER BY XuLyID) AS PreviousTime FROM dbo.XULY_KHIEUNAI) timeline
           WHERE timeline.NgayXuLy < timeline.PreviousTime)
        THROW 51054, 'Complaint ownership, history counts/latest status or processor eligibility failed.', 1;

    -- ASSERT R54-REVIEW: complete valid paid history, not just a permissive trigger predicate.
    IF NOT EXISTS (SELECT 1 FROM dbo.DANHGIAPHIM r JOIN dbo.DONDATVE d ON d.NguoiDungID = r.NguoiDungID
        JOIN dbo.SUATCHIEU s ON s.SuatChieuID = d.SuatChieuID
        WHERE r.DanhGiaID = @Review AND r.PhimID = s.PhimID AND d.DonDatVeID = @History
          AND d.TrangThai = N'Đã thanh toán' AND s.ThoiGianKetThuc < r.NgayDanhGia AND r.SoSao = 5
          AND EXISTS (SELECT 1 FROM dbo.CHITIETVE v WHERE v.DonDatVeID = d.DonDatVeID AND v.TrangThai = N'Đã đặt')
          AND EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công'))
        THROW 51054, 'Eligible review lacks coherent historical ticket/payment evidence.', 1;
    IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 THROW 51054, 'Fixture must still own one committable transaction.', 1;

    SELECT FixtureID, DonDatVeID, ExpectedStatus, Tickets, FoodLines, Payments, Successes FROM @Orders ORDER BY FixtureID;
    SELECT FixtureID, KhieuNaiID, ExpectedStatus, Events FROM @Complaints ORDER BY FixtureID;
    SELECT @Customer1 AS EligibleCustomerID, @Customer4 AS NonEligibleCustomerID, @PastMovie AS ReviewMovieID,
        @Review AS ReviewID, @CompShow AS CanceledShowID, @CompOrder AS CompensatedOrderID;
    IF @Persist = 1
    BEGIN
        COMMIT TRANSACTION;
        PRINT 'PASS R5.4 fixture assertions; COMMITTED on the explicitly confirmed disposable target. Pending expires naturally.';
    END
    ELSE
    BEGIN
        ROLLBACK TRANSACTION;
        -- ASSERT R54-ROLLBACK: no fixture rows, credit, quota or canceled-show mutation remains.
        IF EXISTS (SELECT 1 FROM dbo.DONDATVE) OR EXISTS (SELECT 1 FROM dbo.CHITIETVE)
           OR EXISTS (SELECT 1 FROM dbo.CHITIETDOAN) OR EXISTS (SELECT 1 FROM dbo.THANHTOAN)
           OR EXISTS (SELECT 1 FROM dbo.DANHGIAPHIM) OR EXISTS (SELECT 1 FROM dbo.KHIEUNAI)
           OR EXISTS (SELECT 1 FROM dbo.XULY_KHIEUNAI) OR EXISTS (SELECT 1 FROM dbo.BOITHUONG_HUYSUAT)
           OR EXISTS (SELECT 1 FROM @ProfilesBefore p JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID = p.NguoiDungID WHERE h.DiemTichLuy <> p.DiemTichLuy)
           OR EXISTS (SELECT 1 FROM @QuotasBefore q JOIN dbo.KHUYENMAI k ON k.KhuyenMaiID = q.KhuyenMaiID WHERE k.SoLuongDaDung <> q.SoLuongDaDung)
           OR NOT EXISTS (SELECT 1 FROM dbo.SUATCHIEU WHERE SuatChieuID = @CompShow AND TrangThai = N'Mở bán')
            THROW 51054, 'Rollback failed to preserve baseline fixture state.', 1;
        PRINT 'PASS R5.4 fixture assertions; ROLLED BACK, no transaction data retained. Identity values may have been consumed.';
    END;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
