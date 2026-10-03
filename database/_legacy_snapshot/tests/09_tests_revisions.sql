-- ============================================================================
-- SCRIPT 09: KIỂM THỬ CÁC HẠNG MỤC SỬA ĐỔI SO VỚI BẢN ĐẦU
-- (SoDienThoai NULL, MaGiaoDich UNIQUE, doanh thu theo THANHTOAN, hash mật khẩu, thủ tục bổ sung)
-- Toàn bộ chạy trong một transaction và ROLLBACK cuối cùng nên không để lại dữ liệu.
-- ============================================================================
USE CinemaBookingDB
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
GO

DECLARE @Fail INT = 0, @Total INT = 0, @Err INT, @a INT, @b INT;

BEGIN TRANSACTION;

-- T1: hai khách không khai báo số điện thoại vẫn đăng ký được
SET @Total += 1;
BEGIN TRY
    EXEC dbo.sp_Auth_RegisterCustomer N'Test A', 'rev_a@x.vn', 'hashA', NULL, NULL, NULL, @a OUTPUT;
    EXEC dbo.sp_Auth_RegisterCustomer N'Test B', 'rev_b@x.vn', 'hashB', NULL, NULL, NULL, @b OUTPUT;
    PRINT N'PASS - T1: nhiều tài khoản không có số điện thoại';
END TRY
BEGIN CATCH
    SET @Fail += 1; PRINT N'FAIL - T1: ' + ERROR_MESSAGE();
END CATCH

-- (sp_Auth_Login trả 3 recordset nên được kiểm tra riêng qua sqlcmd/backend, không dùng INSERT...EXEC)

-- T4: MaGiaoDich trùng bị chặn
SET @Total += 1;
SET @Err = 0;
DECLARE @Don INT = (SELECT TOP 1 DonDatVeID FROM dbo.DONDATVE ORDER BY DonDatVeID);
BEGIN TRY
    INSERT INTO dbo.THANHTOAN (DonDatVeID, PhuongThuc, SoTien, MaGiaoDich, TrangThai) VALUES (@Don, N'VNPAY', 1000, 'DUP-001', N'Thất bại');
    INSERT INTO dbo.THANHTOAN (DonDatVeID, PhuongThuc, SoTien, MaGiaoDich, TrangThai) VALUES (@Don, N'VNPAY', 1000, 'DUP-001', N'Thất bại');
END TRY
BEGIN CATCH
    SET @Err = ERROR_NUMBER();
END CATCH
IF @Err = 2601 PRINT N'PASS - T4: MaGiaoDich trùng bị chặn'; ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T4: err=' + CAST(@Err AS VARCHAR(10)); END

-- T5: doanh thu chỉ tính THANHTOAN 'Thành công' (đơn "Đã thanh toán" nhưng không có giao dịch thành công thì không tính)
SET @Total += 1;
DECLARE @Rap INT = (SELECT TOP 1 pc.RapID FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID = d.SuatChieuID JOIN dbo.PHONGCHIEU pc ON pc.PhongID = s.PhongID WHERE d.DonDatVeID = @Don);
DECLARE @Truoc DECIMAL(18,2) = (SELECT DoanhThuThucTe FROM dbo.vw_DoanhThuTheoRap WHERE RapID = @Rap);
INSERT INTO dbo.THANHTOAN (DonDatVeID, PhuongThuc, SoTien, NgayThanhToan, MaGiaoDich, TrangThai) VALUES (@Don, N'MOMO', 50000, SYSDATETIME(), 'REV-OK-1', N'Thành công');
INSERT INTO dbo.THANHTOAN (DonDatVeID, PhuongThuc, SoTien, MaGiaoDich, TrangThai) VALUES (@Don, N'MOMO', 70000, 'REV-FAIL-1', N'Thất bại');
INSERT INTO dbo.THANHTOAN (DonDatVeID, PhuongThuc, SoTien, NgayThanhToan, MaGiaoDich, TrangThai) VALUES (@Don, N'MOMO', 90000, SYSDATETIME(), 'REV-REF-1', N'Đã hoàn tiền');
DECLARE @Sau DECIMAL(18,2) = (SELECT DoanhThuThucTe FROM dbo.vw_DoanhThuTheoRap WHERE RapID = @Rap);
IF @Sau - @Truoc = 50000 PRINT N'PASS - T5: view chỉ cộng giao dịch Thành công (+50000)';
ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T5: chênh lệch = ' + CAST(@Sau - @Truoc AS VARCHAR(30)); END

-- T6: sp_Manager_Revenue (theo THANHTOAN) khớp view trong khoảng 30 ngày gần nhất
SET @Total += 1;
DECLARE @Mr TABLE (Ngay DATE, SoDon INT, SoVeBan INT, DoanhThuVe DECIMAL(18,2), DoanhThuDoAn DECIMAL(18,2), TienGiamGia DECIMAL(18,2), DoanhThuThucTe DECIMAL(18,2));
INSERT INTO @Mr EXEC dbo.sp_Manager_Revenue @NguoiDungID = 1, @RapID = @Rap;
IF ISNULL((SELECT SUM(DoanhThuThucTe) FROM @Mr), 0) >= 50000
   AND ISNULL((SELECT SUM(DoanhThuThucTe) FROM @Mr), 0) <= (SELECT DoanhThuThucTe FROM dbo.vw_DoanhThuTheoRap WHERE RapID = @Rap)
    PRINT N'PASS - T6: báo cáo doanh thu rạp tính theo THANHTOAN';
ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T6'; END

-- T7: xóa vai trò đang được gán bị chặn
SET @Total += 1;
SET @Err = 0;
BEGIN TRY EXEC dbo.sp_Admin_Role_Delete @VaiTroID = 1; END TRY
BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH
IF @Err = 50091 PRINT N'PASS - T7: không xóa vai trò đang dùng'; ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T7: err=' + CAST(@Err AS VARCHAR(10)); END

-- T8: thể loại: tạo -> trùng bị chặn -> xóa được khi chưa dùng
SET @Total += 1;
SET @Err = 0;
DECLARE @G TABLE (TheLoaiID INT, TenTheLoai NVARCHAR(100));
BEGIN TRY
    INSERT INTO @G EXEC dbo.sp_Admin_Genre_Create N'Thể loại kiểm thử';
    DECLARE @GID INT = (SELECT TheLoaiID FROM @G);
    BEGIN TRY EXEC dbo.sp_Admin_Genre_Create N'Thể loại kiểm thử'; END TRY
    BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH
    EXEC dbo.sp_Admin_Genre_Delete @TheLoaiID = @GID;
END TRY
BEGIN CATCH
    SET @Err = -1;
END CATCH
IF @Err = 50097 PRINT N'PASS - T8: thể loại tạo/chặn trùng/xóa'; ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T8: err=' + CAST(@Err AS VARCHAR(10)); END

-- T9: gán diễn viên cho phim bằng JSON
SET @Total += 1;
DECLARE @Phim INT = (SELECT TOP 1 PhimID FROM dbo.PHIM ORDER BY PhimID);
DECLARE @DV INT = (SELECT TOP 1 DienVienID FROM dbo.DIENVIEN ORDER BY DienVienID);
DECLARE @Js NVARCHAR(MAX) = N'[{"DienVienID":' + CAST(@DV AS NVARCHAR(10)) + N',"VaiDien":"Vai thử nghiệm"}]';
EXEC dbo.sp_Admin_MovieActor_Set @PhimID = @Phim, @DanhSachJson = @Js;
IF EXISTS (SELECT 1 FROM dbo.PHIM_DIENVIEN WHERE PhimID = @Phim AND DienVienID = @DV AND VaiDien = N'Vai thử nghiệm')
    PRINT N'PASS - T9: gán diễn viên cho phim'; ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T9'; END

-- T10: không xóa ghế đã có vé
SET @Total += 1;
SET @Err = 0;
DECLARE @Ghe INT = (SELECT TOP 1 GheID FROM dbo.CHITIETVE);
BEGIN TRY EXEC dbo.sp_Manager_Seat_Delete @NguoiDungID = 1, @GheID = @Ghe; END TRY
BEGIN CATCH SET @Err = ERROR_NUMBER(); END CATCH
IF @Err = 50110 PRINT N'PASS - T10: không xóa ghế đã có vé'; ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T10: err=' + CAST(@Err AS VARCHAR(10)); END

-- T2: số điện thoại trùng bị chặn và transaction ngoài KHÔNG bị hủy (sp_Auth_RegisterCustomer dùng SAVE TRANSACTION)
SET @Total += 1;
SET @Err = 0;
DECLARE @TranTruoc INT = @@TRANCOUNT;
BEGIN TRY
    EXEC dbo.sp_Auth_RegisterCustomer N'Test C', 'rev_c@x.vn', 'hashC', '0999000111', NULL, NULL, @a OUTPUT;
    EXEC dbo.sp_Auth_RegisterCustomer N'Test D', 'rev_d@x.vn', 'hashD', '0999000111', NULL, NULL, @b OUTPUT;
END TRY
BEGIN CATCH
    SET @Err = ERROR_NUMBER();
END CATCH
IF @Err = 50011 AND @@TRANCOUNT = @TranTruoc
   AND EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE Email = 'rev_a@x.vn')
   AND NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE Email = 'rev_d@x.vn')
    PRINT N'PASS - T2: số điện thoại trùng bị chặn, dữ liệu trước đó trong transaction ngoài vẫn còn';
ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T2: err=' + CAST(@Err AS VARCHAR(10)); END

-- T11: email trùng bị chặn
SET @Total += 1;
SET @Err = 0;
BEGIN TRY
    EXEC dbo.sp_Auth_RegisterCustomer N'Test E', 'rev_a@x.vn', 'hashE', NULL, NULL, NULL, @a OUTPUT;
END TRY
BEGIN CATCH
    SET @Err = ERROR_NUMBER();
END CATCH
IF @Err = 50010 AND @@TRANCOUNT = @TranTruoc PRINT N'PASS - T11: email trùng bị chặn'; ELSE BEGIN SET @Fail += 1; PRINT N'FAIL - T11: err=' + CAST(@Err AS VARCHAR(10)); END

ROLLBACK TRANSACTION;

PRINT N'============================================================================';
PRINT N'KẾT QUẢ: ' + CAST(@Total - @Fail AS VARCHAR(10)) + N'/' + CAST(@Total AS VARCHAR(10)) + N' TESTS PASSED';
GO
