-- Hồi quy SQL cho thanh toán bằng điểm. Toàn bộ chạy trong một transaction và ROLLBACK; không để lại dữ liệu.
-- Chạy trên CSDL test đã áp dụng migration 20261014_points_payment.sql.
SET NOCOUNT ON;
BEGIN TRANSACTION;

DECLARE @User INT = (
    SELECT TOP 1 n.NguoiDungID FROM dbo.NGUOIDUNG n
    JOIN dbo.VAITRO v ON v.VaiTroID = n.VaiTroID
    WHERE v.MaVaiTro = 'KHACH_HANG' AND n.TrangThai = N'Hoạt động'
      AND NOT EXISTS (SELECT 1 FROM dbo.DONDATVE d WHERE d.NguoiDungID = n.NguoiDungID AND d.TrangThai = N'Chờ thanh toán')
    ORDER BY n.NguoiDungID
);
IF @User IS NULL THROW 51001, 'No customer without a pending order is available for the test.', 1;

DECLARE @Show INT = (
    SELECT TOP 1 s.SuatChieuID FROM dbo.SUATCHIEU s
    JOIN dbo.vw_LichChieuChiTiet v ON v.SuatChieuID = s.SuatChieuID
    WHERE s.TrangThai = N'Mở bán' AND v.IsBookable = 1 AND s.ThoiGianBatDau > DATEADD(HOUR, 3, dbo.fn_BayGio())
      AND v.TongSoGhe - v.SoGheDaDat >= 2
    ORDER BY s.SuatChieuID
);
IF @Show IS NULL THROW 51002, 'No bookable showtime available for the test.', 1;
DECLARE @Seats VARCHAR(100) = (
    SELECT TOP 1 STRING_AGG(CAST(x.GheID AS VARCHAR(10)), ',') FROM (
        SELECT TOP 2 GheID FROM dbo.fn_DanhSachGheSuatChieu(@Show) WHERE TrangThaiGhe = N'Trống' ORDER BY GheID) x
);
IF @Seats IS NULL THROW 51003, 'No free seats.', 1;

-- fixed starting balance
IF NOT EXISTS (SELECT 1 FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @User)
    INSERT dbo.HOSOKHACHHANG(NguoiDungID, DiemTichLuy) VALUES (@User, 0);
UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy = 500 WHERE NguoiDungID = @User;

-- 1. preview writes nothing and spends nothing
DECLARE @Orders0 INT = (SELECT COUNT(*) FROM dbo.DONDATVE);
DECLARE @New INT;
-- (ROLLBACK TO savepoint cannot run inside INSERT-EXEC, so the preview result set goes straight to the client;
-- its amounts are asserted by the API runner PT-02/PT-05. Here only the side effects are checked.)
EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @Show, @DanhSachGheId = @Seats,
    @DiemSuDung = 40, @ChiXemTruoc = 1, @NewDonDatVeID = @New OUTPUT;
IF (SELECT COUNT(*) FROM dbo.DONDATVE) <> @Orders0 THROW 51013, 'Preview must not create an order.', 1;
IF (SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @User) <> 500
    THROW 51014, 'Preview must not spend points.', 1;

-- 2. real booking spends and snapshots
SET @New = NULL;
CREATE TABLE #Created (DonDatVeID INT, NguoiDungID INT, SuatChieuID INT, NgayDat DATETIME2, TongTienVe DECIMAL(18,2),
    TongTienDoAn DECIMAL(18,2), TienGiamGia DECIMAL(18,2), DiemSuDung INT,
    TongThanhToan DECIMAL(18,2), TrangThai NVARCHAR(50), HanGiuCho DATETIME2, SoLuongVe INT);
INSERT #Created
EXEC dbo.sp_Booking_Create @NguoiDungID = @User, @SuatChieuID = @Show, @DanhSachGheId = @Seats,
    @DiemSuDung = 40, @NewDonDatVeID = @New OUTPUT;
IF @New IS NULL THROW 51020, 'Booking did not return an order id.', 1;
IF (SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @User) <> 460
    THROW 51021, 'Booking must deduct exactly 40 points.', 1;
IF NOT EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID = @New AND DiemSuDung = 40 AND TienGiamGia = 40000)
    THROW 51022, 'Total discount must include the 40-point value exactly once.', 1;

-- 3. total-discount constraint rejects an amount above the gross order value
BEGIN TRY
    UPDATE dbo.DONDATVE
    SET TienGiamGia = TongTienVe + TongTienDoAn + 1
    WHERE DonDatVeID = @New;
    THROW 51030, 'CK_DONDATVE_TongGiam should reject a discount above the gross total.', 1;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 51030 THROW;
END CATCH;
BEGIN TRY
    UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy = -1 WHERE NguoiDungID = @User;
    THROW 51031, 'CK_HOSOKHACHHANG_DiemTichLuy should reject a negative balance.', 1;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 51031 THROW;
END CATCH;

-- 4. DIEM only for a zero cash due
BEGIN TRY
    DECLARE @Pay INT, @Txn VARCHAR(100);
    EXEC dbo.sp_Payment_CreateAttempt @NguoiDungID = @User, @DonDatVeID = @New, @PhuongThuc = N'DIEM',
        @ThanhToanID = @Pay OUTPUT, @MaGiaoDich = @Txn OUTPUT;
    THROW 51040, 'DIEM must be refused while money is still due.', 1;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 51040 THROW;
    IF ERROR_NUMBER() <> 50430 BEGIN
        DECLARE @Msg NVARCHAR(400) = CONCAT(N'Expected error 50430 for DIEM with money due, got ', ERROR_NUMBER(), N': ', ERROR_MESSAGE());
        THROW 51041, @Msg, 1;
    END;
END CATCH;

-- 5. expiry returns exactly the reserved points, once
UPDATE dbo.DONDATVE SET HanGiuCho = DATEADD(MINUTE, -5, dbo.fn_BayGio()) WHERE DonDatVeID = @New;
EXEC dbo.sp_Order_ExpirePending @SuatChieuID = @Show, @TraVeKetQua = 0;
IF (SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @User) <> 500
    THROW 51050, 'Expiry must release the 40 reserved points.', 1;
EXEC dbo.sp_Order_ExpirePending @SuatChieuID = @Show, @TraVeKetQua = 0;
IF (SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @User) <> 500
    THROW 51051, 'A second expiry sweep must not release points again.', 1;
IF NOT EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID = @New AND TrangThai = N'Hết hạn' AND DiemSuDung = 40)
    THROW 51052, 'Expired order must keep its points snapshot.', 1;

ROLLBACK TRANSACTION;
SELECT N'PASS points_payment' AS Result;
