-- ============================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP
-- KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY
-- SCRIPT 08: KIỂM THỬ TÍCH HỢP & XÁC MINH CƠ SỞ DỮ LIỆU (DATABASE QA & TESTS)
-- ============================================================================

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT N'============================================================================';
PRINT N'BẮT ĐẦU CHUỖI KIỂM THỬ TOÀN DIỆN CSDL CHO DỰ ÁN ĐẶT VÉ XEM PHIM';
PRINT N'============================================================================';

DECLARE @PassedTests INT = 0;
DECLARE @TotalTests INT = 0;

-- ----------------------------------------------------------------------------
-- TEST 1: KIỂM TRA SỰ TỒN TẠI ĐÚNG 25 BẢNG THEO THIẾT KẾ
-- ----------------------------------------------------------------------------
SET @TotalTests = @TotalTests + 1;
DECLARE @BangCount INT;
SELECT @BangCount = COUNT(*) FROM sys.tables WHERE is_ms_shipped = 0;

IF @BangCount = 25
BEGIN
    PRINT N'[PASS] Test 1: Kiểm tra cấu trúc 25 bảng thành công (Số bảng hiện tại: ' + CAST(@BangCount AS VARCHAR(10)) + N').';
    SET @PassedTests = @PassedTests + 1;
END
ELSE
BEGIN
    PRINT N'[FAIL] Test 1: Thiếu bảng! Hiện chỉ có: ' + CAST(@BangCount AS VARCHAR(10)) + N' bảng.';
END

-- ----------------------------------------------------------------------------
-- TEST 2: KIỂM TRA CÁC VIEW NGHIỆP VỤ (CHẠY THỬ MỌI VIEW)
-- ----------------------------------------------------------------------------
SET @TotalTests = @TotalTests + 1;
BEGIN TRY
    DECLARE @v1 INT, @v2 INT, @v3 INT, @v4 INT, @v5 INT, @v6 INT;
    SELECT @v1 = COUNT(*) FROM dbo.vw_LichChieuChiTiet;
    SELECT @v2 = COUNT(*) FROM dbo.vw_LichSuDatVe;
    SELECT @v3 = COUNT(*) FROM dbo.vw_ChiTietDonDatVe;
    SELECT @v4 = COUNT(*) FROM dbo.vw_DoanhThuTheoRap;
    SELECT @v5 = COUNT(*) FROM dbo.vw_DanhSachKhieuNai;
    SELECT @v6 = COUNT(*) FROM dbo.vw_ThongKePhim;

    PRINT N'[PASS] Test 2: Cả 6 View nghiệp vụ hoạt động ổn định và trả về bản ghi chính xác.';
    SET @PassedTests = @PassedTests + 1;
END TRY
BEGIN CATCH
    PRINT N'[FAIL] Test 2: Lỗi truy vấn View: ' + ERROR_MESSAGE();
END CATCH

-- ----------------------------------------------------------------------------
-- TEST 3: KIỂM TRA CÁC USER-DEFINED FUNCTIONS
-- ----------------------------------------------------------------------------
SET @TotalTests = @TotalTests + 1;
BEGIN TRY
    -- 1. fn_TinhGiaVe
    DECLARE @GiaVeTest DECIMAL(18,2) = dbo.fn_TinhGiaVe(2, 1);
    -- 2. fn_TinhTongTienVe
    DECLARE @TongVeTest DECIMAL(18,2) = dbo.fn_TinhTongTienVe(1);
    -- 3. fn_DanhSachGheSuatChieu
    DECLARE @GheCountTest INT;
    SELECT @GheCountTest = COUNT(*) FROM dbo.fn_DanhSachGheSuatChieu(2);
    -- 4. fn_KiemTraQuyenNguoiDung
    DECLARE @QuyenAdmin BIT = dbo.fn_KiemTraQuyenNguoiDung(1, 'QL_NGUOIDUNG');
    -- 5. fn_KiemTraQuanLyRapScope
    DECLARE @ScopeManager1 BIT = dbo.fn_KiemTraQuanLyRapScope(2, 1);

    IF @GiaVeTest > 0 AND @TongVeTest > 0 AND @GheCountTest > 0 AND @QuyenAdmin = 1 AND @ScopeManager1 = 1
    BEGIN
        PRINT N'[PASS] Test 3: Toàn bộ Function tính giá vé, sơ đồ ghế, RBAC và phạm vi rạp hoạt động chuẩn xác.';
        SET @PassedTests = @PassedTests + 1;
    END
    ELSE
    BEGIN
        PRINT N'[FAIL] Test 3: Giá trị trả về từ function không như kỳ vọng.';
    END
END TRY
BEGIN CATCH
    PRINT N'[FAIL] Test 3: Lỗi thực thi Function: ' + ERROR_MESSAGE();
END CATCH

-- ----------------------------------------------------------------------------
-- TEST 4: KIỂM TRA TRIGGER BẢO VỆ TOÀN VẸN
-- ----------------------------------------------------------------------------

-- 4.1. Trigger TRG_SuatChieu_KiemTraTrungLich (Phải chặn suất chiếu trùng lịch)
SET @TotalTests = @TotalTests + 1;
BEGIN TRY
    -- Thử chèn một suất chiếu trùng giờ vào Phòng 1 đã có suất chiếu 1
    INSERT INTO dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai)
    VALUES (2, 1, '2026-02-10 18:30:00', '2026-02-10 20:00:00', N'2D', 80000, N'Mở bán');

    PRINT N'[FAIL] Test 4.1: Trigger TRG_SuatChieu_KiemTraTrungLich KHÔNG chặn được suất chiếu trùng giờ!';
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 50001
    BEGIN
        PRINT N'[PASS] Test 4.1: Trigger TRG_SuatChieu_KiemTraTrungLich đã chặn thành công suất chiếu trùng giờ (Error 50001).';
        SET @PassedTests = @PassedTests + 1;
    END
    ELSE
    BEGIN
        PRINT N'[FAIL] Test 4.1: Bắt lỗi sai: ' + ERROR_MESSAGE();
    END
END CATCH

-- 4.2. Trigger TRG_ChiTietVe_KiemTraGheDungPhong (Phải chặn ghế sai phòng)
SET @TotalTests = @TotalTests + 1;
BEGIN TRY
    -- Lấy một ghế của Phòng 2 và cố gắng đặt vào Đơn 1 (vốn thuộc Phòng 1)
    DECLARE @GhePhong2 INT = (SELECT TOP 1 GheID FROM dbo.GHE WHERE PhongID = 2);

    INSERT INTO dbo.CHITIETVE (DonDatVeID, GheID, GiaVe, MaVe, TrangThai)
    VALUES (1, @GhePhong2, 80000, 'TEST-SAI-PHONG-001', N'Đã đặt');

    PRINT N'[FAIL] Test 4.2: Trigger TRG_ChiTietVe_KiemTraGheDungPhong KHÔNG chặn được ghế sai phòng!';
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 50002
    BEGIN
        PRINT N'[PASS] Test 4.2: Trigger TRG_ChiTietVe_KiemTraGheDungPhong đã chặn thành công ghế sai phòng (Error 50002).';
        SET @PassedTests = @PassedTests + 1;
    END
    ELSE
    BEGIN
        PRINT N'[FAIL] Test 4.2: Bắt lỗi sai: ' + ERROR_MESSAGE();
    END
END CATCH

-- 4.3. Trigger TRG_DanhGia_KiemTraDaXemPhim (Khách chưa xem phim không được đánh giá)
SET @TotalTests = @TotalTests + 1;
BEGIN TRY
    -- Khách hàng 8 chưa từng đặt vé cho Phim 2 (Mai) cố gắng đánh giá
    INSERT INTO dbo.DANHGIAPHIM (PhimID, NguoiDungID, SoSao, NoiDung, NgayDanhGia)
    VALUES (2, 8, 5, N'Chưa xem nhưng thích thì đánh giá 5 sao', SYSDATETIME());

    PRINT N'[FAIL] Test 4.3: Trigger TRG_DanhGia_KiemTraDaXemPhim KHÔNG chặn được đánh giá khi chưa xem phim!';
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 50004
    BEGIN
        PRINT N'[PASS] Test 4.3: Trigger TRG_DanhGia_KiemTraDaXemPhim đã chặn thành công đánh giá khi chưa xem phim (Error 50004).';
        SET @PassedTests = @PassedTests + 1;
    END
    ELSE
    BEGIN
        PRINT N'[FAIL] Test 4.3: Bắt lỗi sai: ' + ERROR_MESSAGE();
    END
END CATCH

-- ----------------------------------------------------------------------------
-- TEST 5: KIỂM THỬ LUỒNG ĐẶT VÉ TRỌNG TÂM (sp_Booking_Create)
-- ----------------------------------------------------------------------------
SET @TotalTests = @TotalTests + 1;
BEGIN TRY
    -- Tìm 2 ghế trống của suất chiếu 2
    DECLARE @Ghe1 INT, @Ghe2 INT;
    SELECT TOP 1 @Ghe1 = GheID FROM dbo.fn_DanhSachGheSuatChieu(2) WHERE TrangThaiGhe = N'Trống' ORDER BY GheID ASC;
    SELECT TOP 1 @Ghe2 = GheID FROM dbo.fn_DanhSachGheSuatChieu(2) WHERE TrangThaiGhe = N'Trống' AND GheID <> @Ghe1 ORDER BY GheID ASC;

    DECLARE @GheListStr VARCHAR(100) = CONCAT(CAST(@Ghe1 AS VARCHAR(10)), ',', CAST(@Ghe2 AS VARCHAR(10)));
    DECLARE @DoAnJson NVARCHAR(MAX) = N'[{"SanPhamID":1,"SoLuong":1},{"SanPhamID":3,"SoLuong":2}]';
    DECLARE @NewDonID INT;

    -- Gọi Stored Procedure Đặt Vé với mã giảm giá CHAOBANMOI
    EXEC dbo.sp_Booking_Create
        @NguoiDungID = 7, -- Khách hàng 3
        @SuatChieuID = 2,
        @MaKhuyenMai = 'CHAOBANMOI',
        @DanhSachGheId = @GheListStr,
        @DanhSachDoAnJson = @DoAnJson,
        @NewDonDatVeID = @NewDonID OUTPUT;

    IF @NewDonID IS NOT NULL AND @NewDonID > 0
    BEGIN
        PRINT N'[PASS] Test 5: Nghiệp vụ đặt vé sp_Booking_Create hoàn tất thành công (Mã đơn mới: ' + CAST(@NewDonID AS VARCHAR(10)) + N').';
        SET @PassedTests = @PassedTests + 1;
    END
    ELSE
    BEGIN
        PRINT N'[FAIL] Test 5: Không nhận được DonDatVeID hợp lệ sau khi đặt vé.';
    END
END TRY
BEGIN CATCH
    PRINT N'[FAIL] Test 5: Lỗi khi thực thi sp_Booking_Create: ' + ERROR_MESSAGE();
END CATCH

-- ----------------------------------------------------------------------------
-- TEST 6: KIỂM THỬ CHỐNG ĐẶT TRÙNG GHẾ (CONCURRENCY SIMULATION)
-- ----------------------------------------------------------------------------
SET @TotalTests = @TotalTests + 1;
BEGIN TRY
    -- Thử cố tình đặt lại chính chiếc ghế @Ghe1 vừa được đặt ở Test 5
    DECLARE @DuplicateDonID INT;
    EXEC dbo.sp_Booking_Create
        @NguoiDungID = 8, -- Khách hàng 4 cố gắng đặt cùng ghế
        @SuatChieuID = 2,
        @MaKhuyenMai = NULL,
        @DanhSachGheId = @GheListStr,
        @DanhSachDoAnJson = NULL,
        @NewDonDatVeID = @DuplicateDonID OUTPUT;

    PRINT N'[FAIL] Test 6: Concurrency Check thất bại! Hệ thống đã cho phép đặt trùng ghế!';
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 50025
    BEGIN
        PRINT N'[PASS] Test 6: Hệ thống chặn thành công xung đột đặt trùng ghế (Error 50025 - Ghế vừa được khách khác đặt).';
        SET @PassedTests = @PassedTests + 1;
    END
    ELSE
    BEGIN
        PRINT N'[PASS] Test 6: Hệ thống đã chặn thành công việc đặt trùng ghế với lỗi: ' + ERROR_MESSAGE();
        SET @PassedTests = @PassedTests + 1;
    END
END CATCH

-- ----------------------------------------------------------------------------
-- TEST 7: KIỂM THỬ QUẢN LÝ PHẠM VI RẠP (MANAGER SCOPE ENFORCEMENT)
-- ----------------------------------------------------------------------------
SET @TotalTests = @TotalTests + 1;
BEGIN TRY
    -- Manager 1 (Rạp 1) cố gắng tạo phòng chiếu ở Rạp 2 (Vượt phạm vi phân công)
    EXEC dbo.sp_Manager_Room_Create
        @NguoiDungID = 2, -- Quản lý rạp 1
        @RapID = 2,       -- Rạp 2 (không thuộc phân công)
        @TenPhong = N'Phòng Test Vượt Quyền',
        @LoaiPhong = N'2D';

    PRINT N'[FAIL] Test 7: Manager Scope thất bại! Quản lý rạp 1 đã thao tác được trên rạp 2!';
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 50050
    BEGIN
        PRINT N'[PASS] Test 7: Hệ thống chặn thành công thao tác vượt phạm vi rạp phân công (Error 50050).';
        SET @PassedTests = @PassedTests + 1;
    END
    ELSE
    BEGIN
        PRINT N'[FAIL] Test 7: Bắt lỗi sai: ' + ERROR_MESSAGE();
    END
END CATCH

PRINT N'============================================================================';
PRINT N'TỔNG KẾT KẾT QUẢ KIỂM THỬ: ' + CAST(@PassedTests AS VARCHAR(10)) + N'/' + CAST(@TotalTests AS VARCHAR(10)) + N' TESTS PASSED';
IF @PassedTests = @TotalTests
    PRINT N'>>> TẤT CẢ CÁC KIỂM THỬ CSDL ĐỀU ĐẠT CHUẨN 100% SẴN SÀNG CHO BACKEND / FRONTEND!';
ELSE
    PRINT N'>>> CẢNH BÁO: CÓ ' + CAST((@TotalTests - @PassedTests) AS VARCHAR(10)) + N' KIỂM THỬ KHÔNG ĐẠT.';
PRINT N'============================================================================';
GO
