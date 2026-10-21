/*
  Main-only SSMS demo: prove sp_Booking_Create rolls promotion consumption back
  when a later validation fails. Every fixture is inserted under one outer
  transaction and the outer transaction is always rolled back.

  Expected result: one PASS row with SQL error 50410, promo usage 0, no order,
  no ticket/food rows, no fixture rows after rollback, and unchanged identities.
*/
USE [CinemaBookingDB];
SET NOCOUNT ON;
SET XACT_ABORT OFF;

IF DB_NAME() <> N'CinemaBookingDB' OR @@SERVERNAME <> N'DoanTuanIT'
    THROW 52100, N'Wrong target. Connect to DoanTuanIT / CinemaBookingDB.', 1;
IF CONVERT(nvarchar(30), DATABASEPROPERTYEX(DB_NAME(), 'Status')) <> N'ONLINE'
    THROW 52101, N'CinemaBookingDB is not ONLINE.', 1;
IF @@TRANCOUNT <> 0
    THROW 52102, N'Run this demo in a session with no existing transaction.', 1;

DECLARE @Token varchar(36) = CONVERT(varchar(36), NEWID());
DECLARE @CustomerID int = -(100000000 + ABS(CHECKSUM(NEWID())) % 1000000000);
DECLARE @PromotionID int = @CustomerID - 1;
DECLARE @Email varchar(150) = CONCAT('ssms-atomicity-', @Token, '@example.invalid');
DECLARE @PromoCode varchar(50) = CONCAT('SSMS', REPLACE(@Token, '-', ''));
DECLARE @RoleID int, @ActiveStatus nvarchar(50), @ShowtimeID int, @SeatID int;
DECLARE @SeatCsv varchar(20);
DECLARE @ExpectedError int = 50410, @ActualError int = NULL, @ActualMessage nvarchar(2048) = NULL;
DECLARE @PromotionUsed int = NULL, @OrderRows int = NULL, @TicketRows int = NULL, @FoodRows int = NULL;
DECLARE @OrderIdentityBefore decimal(38,0), @TicketIdentityBefore decimal(38,0);
DECLARE @OrderIdentityAfter decimal(38,0), @TicketIdentityAfter decimal(38,0);
DECLARE @FixtureRowsAfterRollback int = NULL, @Failure nvarchar(2048) = NULL;
DECLARE @Verdict varchar(10) = 'FAIL';

BEGIN TRY
    SELECT TOP (1) @RoleID = r.VaiTroID, @ActiveStatus = u.TrangThai
    FROM dbo.VAITRO r
    JOIN dbo.NGUOIDUNG u ON u.VaiTroID = r.VaiTroID
    WHERE r.MaVaiTro = 'KHACH_HANG' AND u.TrangThai = N'Hoạt động'
    ORDER BY u.NguoiDungID;

    SELECT TOP (1) @ShowtimeID = v.SuatChieuID, @SeatID = freeSeat.GheID
    FROM dbo.vw_LichChieuChiTiet v
    CROSS APPLY (
        SELECT TOP (1) f.GheID
        FROM dbo.fn_DanhSachGheSuatChieu(v.SuatChieuID) f
        WHERE f.TrangThaiGhe = N'Trống'
        ORDER BY f.GheID
    ) freeSeat
    WHERE v.IsBookable = 1
      AND v.ThoiGianBatDau >= DATEADD(minute, 30, dbo.fn_BayGio())
      AND NOT EXISTS (SELECT 1 FROM dbo.DONDATVE d WHERE d.SuatChieuID = v.SuatChieuID)
    ORDER BY v.ThoiGianBatDau, v.SuatChieuID;

    IF @RoleID IS NULL OR @ShowtimeID IS NULL OR @SeatID IS NULL
        THROW 52103, N'No safe active customer role / future showtime / free seat fixture exists.', 1;
    SET @SeatCsv = CONVERT(varchar(20), @SeatID);
    IF EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @CustomerID OR Email = @Email)
       OR EXISTS (SELECT 1 FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @PromotionID OR MaCode = @PromoCode)
        THROW 52104, N'Generated fixture key collision; no data was changed.', 1;

    SELECT @OrderIdentityBefore = IDENT_CURRENT(N'dbo.DONDATVE'),
           @TicketIdentityBefore = IDENT_CURRENT(N'dbo.CHITIETVE');

    BEGIN TRANSACTION;
    BEGIN TRY
        SET IDENTITY_INSERT dbo.NGUOIDUNG ON;
        INSERT dbo.NGUOIDUNG (NguoiDungID, VaiTroID, HoTen, Email, MatKhau, SoDienThoai, NgayTao, TrangThai)
        VALUES (@CustomerID, @RoleID, N'SSMS atomicity fixture', @Email, 'AUDIT-ONLY-NOT-A-CREDENTIAL', NULL, dbo.fn_BayGio(), @ActiveStatus);
        SET IDENTITY_INSERT dbo.NGUOIDUNG OFF;

        INSERT dbo.HOSOKHACHHANG (NguoiDungID, NgaySinh, GioiTinh, DiemTichLuy)
        VALUES (@CustomerID, NULL, NULL, 0);

        SET IDENTITY_INSERT dbo.KHUYENMAI ON;
        INSERT dbo.KHUYENMAI (KhuyenMaiID, MaCode, MoTa, LoaiGiamGia, GiaTriGiam, DonHangToiThieu,
                              GiamToiDa, NgayBatDau, NgayKetThuc, SoLuong, SoLuongDaDung, TrangThai)
        VALUES (@PromotionID, @PromoCode, N'SSMS atomicity fixture', 'PERCENT', 10, 0,
                NULL, '20000101', '20991231', 1, 0, N'Hoạt động');
        SET IDENTITY_INSERT dbo.KHUYENMAI OFF;

        BEGIN TRY
            DECLARE @NewOrderID int;
            EXEC dbo.sp_Booking_Create
                @NguoiDungID = @CustomerID,
                @SuatChieuID = @ShowtimeID,
                @MaKhuyenMai = @PromoCode,
                @DanhSachGheId = @SeatCsv,
                @DanhSachDoAnJson = NULL,
                @DiemSuDung = -1,
                @ChiXemTruoc = 0,
                @NewDonDatVeID = @NewOrderID OUTPUT;
        END TRY
        BEGIN CATCH
            SELECT @ActualError = ERROR_NUMBER(), @ActualMessage = ERROR_MESSAGE();
        END CATCH;

        SELECT @PromotionUsed = SoLuongDaDung
        FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @PromotionID AND MaCode = @PromoCode;
        SELECT @OrderRows = COUNT(*)
        FROM dbo.DONDATVE WHERE NguoiDungID = @CustomerID AND SuatChieuID = @ShowtimeID;
        SELECT @TicketRows = COUNT(*)
        FROM dbo.DONDATVE d JOIN dbo.CHITIETVE t ON t.DonDatVeID = d.DonDatVeID
        WHERE d.NguoiDungID = @CustomerID AND d.SuatChieuID = @ShowtimeID;
        SELECT @FoodRows = COUNT(*)
        FROM dbo.DONDATVE d JOIN dbo.CHITIETDOAN f ON f.DonDatVeID = d.DonDatVeID
        WHERE d.NguoiDungID = @CustomerID AND d.SuatChieuID = @ShowtimeID;
        SELECT @OrderIdentityAfter = IDENT_CURRENT(N'dbo.DONDATVE'),
               @TicketIdentityAfter = IDENT_CURRENT(N'dbo.CHITIETVE');

        IF @ActualError <> @ExpectedError OR ISNULL(@PromotionUsed, -1) <> 0
           OR ISNULL(@OrderRows, -1) <> 0 OR ISNULL(@TicketRows, -1) <> 0 OR ISNULL(@FoodRows, -1) <> 0
           OR @OrderIdentityAfter <> @OrderIdentityBefore OR @TicketIdentityAfter <> @TicketIdentityBefore
            SET @Failure = N'Expected rollback oracle mismatch; inspect actual columns in the result row.';

        ROLLBACK TRANSACTION;
    END TRY
    BEGIN CATCH
        SET IDENTITY_INSERT dbo.NGUOIDUNG OFF;
        SET IDENTITY_INSERT dbo.KHUYENMAI OFF;
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    SELECT @FixtureRowsAfterRollback =
        (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE NguoiDungID = @CustomerID OR Email = @Email)
      + (SELECT COUNT(*) FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @CustomerID)
      + (SELECT COUNT(*) FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @PromotionID OR MaCode = @PromoCode);
    IF @FixtureRowsAfterRollback <> 0 SET @Failure = N'Fixture rows remain after outer rollback.';
    IF @Failure IS NULL SET @Verdict = 'PASS';

    SELECT N'sp_Booking_Create atomic rollback' AS TestName,
           CONCAT(N'showtime=', @ShowtimeID, N'; seat=', @SeatID, N'; one-use promotion; points=-1') AS InputValue,
           N'error 50410; promo usage=0; order/ticket/food=0; identities unchanged; fixture rows=0' AS ExpectedValue,
           CONCAT(N'error=', COALESCE(CONVERT(nvarchar(12), @ActualError), N'NULL'),
                  N'; promo=', COALESCE(CONVERT(nvarchar(12), @PromotionUsed), N'NULL'),
                  N'; order/ticket/food=', COALESCE(CONVERT(nvarchar(12), @OrderRows), N'NULL'), N'/',
                  COALESCE(CONVERT(nvarchar(12), @TicketRows), N'NULL'), N'/',
                  COALESCE(CONVERT(nvarchar(12), @FoodRows), N'NULL'),
                  N'; identities unchanged=', IIF(@OrderIdentityBefore = @OrderIdentityAfter AND @TicketIdentityBefore = @TicketIdentityAfter, N'yes', N'no'),
                  N'; fixture rows after rollback=', @FixtureRowsAfterRollback,
                  N'; SQL message=', COALESCE(@ActualMessage, N'(none)')) AS ActualValue,
           @Verdict AS Verdict;
    IF @Verdict <> 'PASS' THROW 52105, N'Atomicity demo failed its expected-result oracle.', 1;
END TRY
BEGIN CATCH
    SET IDENTITY_INSERT dbo.NGUOIDUNG OFF;
    SET IDENTITY_INSERT dbo.KHUYENMAI OFF;
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
