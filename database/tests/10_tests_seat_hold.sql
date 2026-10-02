-- ============================================================================
-- SCRIPT 10: KIỂM THỬ GIỮ GHẾ / CHỜ THANH TOÁN / HỦY SUẤT CHIẾU
-- Chạy trong một transaction và ROLLBACK cuối cùng nên không để lại dữ liệu.
-- ============================================================================
USE CinemaBookingDB
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
GO

DECLARE @Fail INT = 0, @Total INT = 0, @Err INT, @Don1 INT, @Don2 INT, @Don3 INT;
DECLARE @Suat INT, @Ghe1 INT, @Ghe2 INT, @Tt INT, @Ma VARCHAR(100), @Trang NVARCHAR(50), @Han DATETIME2, @Muc NVARCHAR(50);

BEGIN TRANSACTION;

-- Đơn giữ chỗ còn sót từ lần chạy trước (ví dụ test 08 commit một đơn) làm đủ giới hạn 3 đơn/khách (migration 012): nhả chúng trong transaction này (được rollback cùng test)
UPDATE dbo.DONDATVE SET HanGiuCho = DATEADD(MINUTE, -1, SYSDATETIME()) WHERE NguoiDungID IN (5, 6, 7, 8) AND TrangThai = N'Chờ thanh toán';

-- Chọn suất chiếu mở bán trong tương lai có ít nhất 2 ghế trống
SELECT TOP 1 @Suat = sc.SuatChieuID
FROM dbo.SUATCHIEU sc
WHERE sc.TrangThai = N'Mở bán' AND sc.ThoiGianBatDau > DATEADD(HOUR, 1, SYSDATETIME())
  AND (SELECT COUNT(*) FROM dbo.fn_DanhSachGheSuatChieu(sc.SuatChieuID) WHERE TrangThaiGhe = N'Trống') >= 3
ORDER BY sc.SuatChieuID;

SELECT TOP 1 @Ghe1 = GheID FROM dbo.fn_DanhSachGheSuatChieu(@Suat) WHERE TrangThaiGhe = N'Trống' ORDER BY GheID;
SELECT TOP 1 @Ghe2 = GheID FROM dbo.fn_DanhSachGheSuatChieu(@Suat) WHERE TrangThaiGhe = N'Trống' AND GheID > @Ghe1 ORDER BY GheID;
DECLARE @GheStr VARCHAR(50) = CAST(@Ghe1 AS VARCHAR(10));

-- T1: đặt vé tạo đơn Chờ thanh toán có HanGiuCho ~ +5 phút (migration 012); ghế hiện 'Đang giữ'
SET @Total += 1;
EXEC dbo.sp_DatVe @NguoiDungID = 5, @SuatChieuID = @Suat, @DanhSachGheId = @GheStr, @NewDonDatVeID = @Don1 OUTPUT;
SELECT @Han = HanGiuCho FROM dbo.DONDATVE WHERE DonDatVeID = @Don1;
SELECT @Muc = TrangThaiGhe FROM dbo.fn_DanhSachGheSuatChieu(@Suat) WHERE GheID = @Ghe1;
IF DATEDIFF(SECOND, SYSDATETIME(), @Han) BETWEEN 290 AND 300 AND @Muc = N'Đang giữ'
    PRINT N'PASS - T1: đơn chờ thanh toán giữ ghế 5 phút, sơ đồ ghế hiện Đang giữ';
ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T1: ' + ISNULL(@Muc, N'?'); END

-- T2: người khác không đặt được ghế đang được giữ
SET @Total += 1;
SET @Err = 0;
BEGIN TRY EXEC dbo.sp_DatVe @NguoiDungID = 6, @SuatChieuID = @Suat, @DanhSachGheId = @GheStr, @NewDonDatVeID = @Don2 OUTPUT; END TRY
BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH
IF @Err = 50025 PRINT N'PASS - T2: ghế đang giữ không đặt được'; ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T2: err=' + CAST(@Err AS VARCHAR(10)); END

-- T3: hủy suất chiếu bị chặn khi đã có người giữ chỗ / đặt vé
SET @Total += 1;
SET @Err = 0;
BEGIN TRY EXEC dbo.sp_Manager_Showtime_Cancel @NguoiDungID = 1, @SuatChieuID = @Suat; END TRY
BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH
IF @Err = 50118 PRINT N'PASS - T3: không hủy suất chiếu đã có người đặt'; ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T3: err=' + CAST(@Err AS VARCHAR(10)); END

-- T4: thanh toán trong hạn -> Đã thanh toán, HanGiuCho = NULL, ghế 'Đã đặt'
SET @Total += 1;
EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID = @Don1, @PhuongThuc = N'MOMO', @ThanhToanID = @Tt OUTPUT, @MaGiaoDich = @Ma OUTPUT;
EXEC dbo.sp_Payment_UpdateResult @ThanhToanID = @Tt, @TrangThaiThanhToan = N'Thành công';
SELECT @Trang = TrangThai, @Han = HanGiuCho FROM dbo.DONDATVE WHERE DonDatVeID = @Don1;
SELECT @Muc = TrangThaiGhe FROM dbo.fn_DanhSachGheSuatChieu(@Suat) WHERE GheID = @Ghe1;
IF @Trang = N'Đã thanh toán' AND @Han IS NULL AND @Muc = N'Đã đặt'
    PRINT N'PASS - T4: thanh toán trong hạn -> Đã thanh toán, ghế Đã đặt';
ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T4: ' + @Trang; END

-- T5: gọi lại cùng kết quả thanh toán (callback trùng) không xử lý lại
SET @Total += 1;
DECLARE @Diem1 INT = (SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = 5);
EXEC dbo.sp_Payment_UpdateResult @ThanhToanID = @Tt, @TrangThaiThanhToan = N'Thành công';
IF (SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = 5) = @Diem1
    PRINT N'PASS - T5: callback trùng không cộng điểm lần hai';
ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T5'; END

-- T6: đơn quá hạn nhả ghế NGAY (chưa cần job), ghế đặt lại được
SET @Total += 1;
DECLARE @GheStr2 VARCHAR(50) = CAST(@Ghe2 AS VARCHAR(10));
EXEC dbo.sp_DatVe @NguoiDungID = 6, @SuatChieuID = @Suat, @DanhSachGheId = @GheStr2, @NewDonDatVeID = @Don2 OUTPUT;
UPDATE dbo.DONDATVE SET HanGiuCho = DATEADD(MINUTE, -1, SYSDATETIME()) WHERE DonDatVeID = @Don2;   -- giả lập hết hạn
SELECT @Muc = TrangThaiGhe FROM dbo.fn_DanhSachGheSuatChieu(@Suat) WHERE GheID = @Ghe2;
EXEC dbo.sp_DatVe @NguoiDungID = 7, @SuatChieuID = @Suat, @DanhSachGheId = @GheStr2, @NewDonDatVeID = @Don3 OUTPUT;
IF @Muc = N'Trống' AND @Don3 IS NOT NULL PRINT N'PASS - T6: ghế của đơn quá hạn được nhả và đặt lại được';
ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T6: ' + ISNULL(@Muc, N'?'); END

-- T7: sp_Booking_Create đã dọn đơn quá hạn của suất chiếu -> Hết hạn, vé Đã hủy
SET @Total += 1;
SELECT @Trang = TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @Don2;
IF @Trang = N'Hết hạn' AND NOT EXISTS (SELECT 1 FROM dbo.CHITIETVE WHERE DonDatVeID = @Don2 AND TrangThai <> N'Đã hủy')
    PRINT N'PASS - T7: đơn quá hạn chuyển Hết hạn, vé được hủy';
ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T7: ' + ISNULL(@Trang, N'?'); END

-- T8: không tạo được lần thanh toán cho đơn đã hết hạn
SET @Total += 1;
SET @Err = 0;
BEGIN TRY EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID = @Don2, @PhuongThuc = N'MOMO', @ThanhToanID = @Tt OUTPUT, @MaGiaoDich = @Ma OUTPUT; END TRY
BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH
IF @Err IN (50111, 50031) PRINT N'PASS - T8: không thanh toán được đơn hết hạn'; ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T8: err=' + CAST(@Err AS VARCHAR(10)); END

-- T9: bắt đầu thanh toán KHÔNG gia hạn giữ ghế (migration 012: hạn giữ chỉ đặt một lần lúc tạo đơn)
SET @Total += 1;
UPDATE dbo.DONDATVE SET HanGiuCho = DATEADD(MINUTE, 1, SYSDATETIME()) WHERE DonDatVeID = @Don3;
EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID = @Don3, @PhuongThuc = N'MOMO', @ThanhToanID = @Tt OUTPUT, @MaGiaoDich = @Ma OUTPUT;
SELECT @Han = HanGiuCho FROM dbo.DONDATVE WHERE DonDatVeID = @Don3;
IF DATEDIFF(SECOND, SYSDATETIME(), @Han) <= 61 PRINT N'PASS - T9: bắt đầu thanh toán không gia hạn giữ ghế';
ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T9'; END

-- T10: kết quả thanh toán về muộn khi ghế đã bị đơn khác giữ -> giao dịch thất bại, không đè đơn khác
SET @Total += 1;
UPDATE dbo.DONDATVE SET HanGiuCho = DATEADD(MINUTE, -1, SYSDATETIME()) WHERE DonDatVeID = @Don3;
DECLARE @Don4 INT;
EXEC dbo.sp_DatVe @NguoiDungID = 8, @SuatChieuID = @Suat, @DanhSachGheId = @GheStr2, @NewDonDatVeID = @Don4 OUTPUT;
EXEC dbo.sp_Payment_UpdateResult @ThanhToanID = @Tt, @TrangThaiThanhToan = N'Thành công';
IF (SELECT TrangThai FROM dbo.THANHTOAN WHERE ThanhToanID = @Tt) = N'Thất bại'
   AND (SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @Don3) <> N'Đã thanh toán'
    PRINT N'PASS - T10: thanh toán muộn khi ghế đã bị người khác giữ bị từ chối';
ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T10'; END

-- T11: suất chiếu chưa ai đặt thì hủy được
SET @Total += 1;
DECLARE @SuatTrong INT;
SELECT TOP 1 @SuatTrong = sc.SuatChieuID
FROM dbo.SUATCHIEU sc
WHERE sc.TrangThai = N'Mở bán' AND sc.SuatChieuID <> @Suat
  AND NOT EXISTS (SELECT 1 FROM dbo.DONDATVE d WHERE d.SuatChieuID = sc.SuatChieuID)
ORDER BY sc.SuatChieuID;
IF @SuatTrong IS NULL
    PRINT N'SKIP - T11: không có suất chiếu trống để thử';
ELSE
BEGIN
    EXEC dbo.sp_Manager_Showtime_Cancel @NguoiDungID = 1, @SuatChieuID = @SuatTrong;
    IF (SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID = @SuatTrong) = N'Đã hủy'
        PRINT N'PASS - T11: hủy được suất chiếu chưa có người đặt';
    ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T11'; END
END

-- T12: chỉ còn đơn hết hạn -> vẫn hủy được suất chiếu
SET @Total += 1;
UPDATE dbo.DONDATVE SET TrangThai = N'Đã hủy', HanGiuCho = NULL WHERE SuatChieuID = @Suat AND TrangThai = N'Chờ thanh toán';
UPDATE dbo.DONDATVE SET TrangThai = N'Hết hạn' WHERE SuatChieuID = @Suat AND TrangThai = N'Đã thanh toán';
SET @Err = 0;
BEGIN TRY EXEC dbo.sp_Manager_Showtime_Cancel @NguoiDungID = 1, @SuatChieuID = @Suat; END TRY
BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH
IF @Err = 0 AND (SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID = @Suat) = N'Đã hủy'
    PRINT N'PASS - T12: đơn đã hủy/hết hạn không cản việc hủy suất chiếu';
ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T12: err=' + CAST(@Err AS VARCHAR(10)); END

ROLLBACK TRANSACTION;

PRINT N'============================================================================';
PRINT N'KẾT QUẢ GIỮ GHẾ: ' + CAST(@Total - @Fail AS VARCHAR(10)) + N'/' + CAST(@Total AS VARCHAR(10)) + N' (T11 có thể SKIP)';
GO
