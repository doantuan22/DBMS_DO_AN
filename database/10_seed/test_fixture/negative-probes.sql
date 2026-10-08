-- R5.4 manual negative probes; require the positive fixture intentionally committed.
-- Each probe owns a separate rollback transaction: review trigger errors can doom it.
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() <> N'CinemaBookingDB_Test' AND DB_NAME() NOT LIKE N'CinemaBookingDB[_]R0[_]%'
    THROW 51054, 'R5.4 requires a separate disposable test database.', 1;
IF SESSION_CONTEXT(N'R54DisposableTarget') IS NULL
   OR CONVERT(nvarchar(128), SESSION_CONTEXT(N'R54DisposableTarget')) <> DB_NAME()
    THROW 51054, 'Confirm the exact disposable database in R54DisposableTarget before running.', 1;
IF @@TRANCOUNT <> 0 THROW 51054, 'Negative probes must own their rollback transactions.', 1;

DECLARE @Customer1 int, @Customer4 int, @Movie int, @ForeignOrder int;
SELECT @Customer1 = NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = 'khachhang1@gmail.com';
SELECT @Customer4 = NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = 'khachhang4@gmail.com';
SELECT @Movie = PhimID FROM dbo.DANHGIAPHIM
WHERE NguoiDungID = @Customer1 AND NoiDung = N'R54 eligible historical review';
SELECT @ForeignOrder = d.DonDatVeID FROM dbo.DONDATVE d JOIN dbo.THANHTOAN t ON t.DonDatVeID = d.DonDatVeID
WHERE d.NguoiDungID = @Customer1 AND t.GhiChu = N'R54 paid after retry' AND t.TrangThai = N'Thành công';
IF @Customer1 IS NULL OR @Customer4 IS NULL OR @Movie IS NULL OR @ForeignOrder IS NULL
    THROW 51054, 'Negative probes require the committed R5.4 positive fixture.', 1;
IF EXISTS (SELECT 1 FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID = d.SuatChieuID
    WHERE d.NguoiDungID = @Customer4 AND s.PhimID = @Movie
      AND d.TrangThai IN (N'Đã thanh toán', N'Hoàn thành') AND s.ThoiGianBatDau <= dbo.fn_BayGio())
    THROW 51054, 'Customer 4 must have no eligible review history for the fixture movie.', 1;

DECLARE @Cases TABLE (CaseNumber int PRIMARY KEY, FixtureID varchar(40), ExpectedError int);
INSERT @Cases VALUES (1, 'R54-REVIEW-INELIGIBLE', 50004), (2, 'R54-REVIEW-DUPLICATE', 50040), (3, 'R54-C-FOREIGN-ORDER', 50041);
DECLARE @CaseNumber int = 1, @ActualError int, @ExpectedError int, @FixtureID varchar(40);
DECLARE @ReviewsBefore nvarchar(max), @ComplaintsBefore nvarchar(max);
WHILE @CaseNumber <= 3
BEGIN
    SELECT @ExpectedError = ExpectedError, @FixtureID = FixtureID FROM @Cases WHERE CaseNumber = @CaseNumber;
    SET @ActualError = NULL;
    SET @ReviewsBefore = (SELECT * FROM dbo.DANHGIAPHIM ORDER BY DanhGiaID FOR JSON PATH, INCLUDE_NULL_VALUES);
    SET @ComplaintsBefore = (SELECT * FROM dbo.KHIEUNAI ORDER BY KhieuNaiID FOR JSON PATH, INCLUDE_NULL_VALUES);
    BEGIN TRY
        BEGIN TRANSACTION;
        IF @CaseNumber = 1
            EXEC dbo.sp_Review_Create @NguoiDungID = @Customer4, @PhimID = @Movie, @SoSao = 4, @NoiDung = N'R54 rejected input: no paid history';
        ELSE IF @CaseNumber = 2
            EXEC dbo.sp_Review_Create @NguoiDungID = @Customer1, @PhimID = @Movie, @SoSao = 4, @NoiDung = N'R54 rejected input: duplicate review';
        ELSE
            EXEC dbo.sp_Complaint_Create @NguoiDungID = @Customer4, @DonDatVeID = @ForeignOrder,
                @LoaiKhieuNai = N'Hỗ trợ', @TieuDe = N'R54 rejected foreign order', @NoiDung = N'R54 rejected input: ownership';
        -- Unexpected acceptance is rolled back, then fails the assertion below.
        ROLLBACK TRANSACTION;
    END TRY
    BEGIN CATCH
        SET @ActualError = ERROR_NUMBER();
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    END CATCH;
    -- ASSERT R54-NEGATIVE: expected business error and zero persisted negative data.
    IF @ActualError IS NULL OR @ActualError <> @ExpectedError
        THROW 51054, 'Negative probe did not reject with the expected contract error.', 1;
    -- Keep transaction state separate from the JSON reads: those can have an internal read transaction.
    IF @@TRANCOUNT <> 0 OR XACT_STATE() <> 0
        THROW 51054, 'Negative probe leaked a transaction.', 1;
    IF @ReviewsBefore <> (SELECT * FROM dbo.DANHGIAPHIM ORDER BY DanhGiaID FOR JSON PATH, INCLUDE_NULL_VALUES)
       OR @ComplaintsBefore <> (SELECT * FROM dbo.KHIEUNAI ORDER BY KhieuNaiID FOR JSON PATH, INCLUDE_NULL_VALUES)
        THROW 51054, 'Negative probe changed persisted review/complaint history or leaked a transaction.', 1;
    SELECT @FixtureID AS FixtureID, @ExpectedError AS ExpectedError, @ActualError AS ActualError, N'PASS; rolled back' AS ProbeResult;
    SET @CaseNumber = @CaseNumber + 1;
END;
GO
