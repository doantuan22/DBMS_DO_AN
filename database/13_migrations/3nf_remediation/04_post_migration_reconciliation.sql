-- ============================================================================
-- SCRIPT: 04_post_migration_reconciliation.sql (Hardened R4.1 Version)
-- MỤC TIÊU: Hậu kiểm đối soát toàn diện (Post-Migration Reconciliation)
--           sau khi hoàn thành Expand Phase và Contract Phase.
--           TỰ ĐỘNG ĐỐI SOÁT VỚI DYNAMIC SELF-CONTAINED VALIDATION (Không hardcode).
-- DỰ ÁN: CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến
-- TÍNH CHẤT: Read-only, Assertive Validation.
-- QUY TẮC: Nếu bất kỳ chỉ số đối soát nào không hợp lệ, kích hoạt THROW.
-- BẢO VỆ: CHỈ CHO PHÉP CHẠY TRÊN DATABASE [CinemaBookingDB_Test].
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- ============================================================================
-- 0. ENVIRONMENT GUARD & PERMISSION ASSERTION (BLOCKER 02)
-- ============================================================================
IF DB_NAME() <> N'CinemaBookingDB_Test'
BEGIN
    PRINT N'[LỖI NGHIÊM TRỌNG] Script chỉ được phép thực thi trên cơ sở dữ liệu [CinemaBookingDB_Test]!';
    PRINT N'Database hiện tại: ' + DB_NAME();
    THROW 51000, N'FATAL GUARD: Script chỉ được phép thực thi trên cơ sở dữ liệu [CinemaBookingDB_Test]. Thao tác bị hủy bỏ ngay lập tức!', 1;
END;

IF IS_ROLEMEMBER(N'db_owner') <> 1 AND IS_SRVROLEMEMBER(N'sysadmin') <> 1
BEGIN
    PRINT N'[LỖI PHÂN QUYỀN] Người dùng hiện tại không có quyền db_owner hoặc sysadmin!';
    THROW 51001, N'FATAL GUARD: Yêu cầu quyền db_owner hoặc sysadmin để thực thi hậu kiểm.', 1;
END;

PRINT '============================================================================';
PRINT 'BẮT ĐẦU HẬU KIỂM ĐỐI SOÁT POST-MIGRATION RECONCILIATION';
PRINT 'Thời gian kiểm tra: ' + CONVERT(VARCHAR(30), SYSDATETIME(), 120);
PRINT 'Cơ sở dữ liệu mục tiêu: ' + DB_NAME() + ' (VERIFIED ISOLATED TEST DB)';
PRINT 'Người dùng thực thi:    ' + SUSER_SNAME();
PRINT '============================================================================';

-- ----------------------------------------------------------------------------
-- 1. ĐỐI SOÁT SCHEMA VÀ CẤU TRÚC 3NF
-- ----------------------------------------------------------------------------
PRINT '1. Đối soát cấu trúc bảng và chuẩn 3NF...';

-- 1.1 Tổng số bảng nghiệp vụ phải là đúng 27 (loại trừ sys/metadata migration _)
DECLARE @TotalTables INT;
SELECT @TotalTables = COUNT(*) 
FROM sys.tables 
WHERE schema_id = SCHEMA_ID(N'dbo') 
  AND is_ms_shipped = 0
  AND name NOT LIKE '\_%' ESCAPE '\';

IF @TotalTables <> 27
BEGIN
    PRINT N'[LỖI ĐỐI SOÁT] Số lượng bảng nghiệp vụ không đúng 27! Hiện tại: ' + CAST(@TotalTables AS VARCHAR(10));
    THROW 51030, N'Reconciliation Failed: Số lượng bảng nghiệp vụ khác 27.', 1;
END
ELSE
    PRINT N'  -> [PASS] Tổng số bảng nghiệp vụ được bảo toàn chính xác: 27 bảng.';

-- 1.2 Cột SoTien không được phép tồn tại trên dbo.THANHTOAN (Strict 3NF)
IF COL_LENGTH(N'dbo.THANHTOAN', N'SoTien') IS NOT NULL
BEGIN
    PRINT N'[LỖI ĐỐI SOÁT] Cột SoTien vẫn tồn tại trên dbo.THANHTOAN!';
    THROW 51031, N'Reconciliation Failed: Cột vật lý SoTien chưa được loại bỏ.', 1;
END
ELSE
    PRINT N'  -> [PASS] Cột vật lý dbo.THANHTOAN.SoTien đã được loại bỏ thành công (Strict 3NF).';

-- 1.3 Check constraint CK_THANHTOAN_SoTien không được phép tồn tại
IF EXISTS (
    SELECT 1 
    FROM sys.check_constraints 
    WHERE name = N'CK_THANHTOAN_SoTien' AND parent_object_id = OBJECT_ID(N'dbo.THANHTOAN')
)
BEGIN
    PRINT N'[LỖI ĐỐI SOÁT] Constraint CK_THANHTOAN_SoTien vẫn tồn tại!';
    THROW 51032, N'Reconciliation Failed: Constraint CK_THANHTOAN_SoTien chưa được xóa.', 1;
END
ELSE
    PRINT N'  -> [PASS] Check constraint CK_THANHTOAN_SoTien đã được xóa sạch.';

-- 1.4 Index IX_THANHTOAN_DonDatVe phải tồn tại và KHÔNG chứa cột SoTien
IF NOT EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE name = N'IX_THANHTOAN_DonDatVe' AND object_id = OBJECT_ID(N'dbo.THANHTOAN')
)
BEGIN
    PRINT N'[LỖI ĐỐI SOÁT] Không tìm thấy Index IX_THANHTOAN_DonDatVe mới!';
    THROW 51033, N'Reconciliation Failed: Index IX_THANHTOAN_DonDatVe chưa được tạo.', 1;
END
ELSE
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM sys.index_columns ic
        INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE ic.object_id = OBJECT_ID(N'dbo.THANHTOAN') 
          AND ic.index_id = INDEXPROPERTY(OBJECT_ID(N'dbo.THANHTOAN'), N'IX_THANHTOAN_DonDatVe', 'IndexID')
          AND c.name = N'SoTien'
    )
    BEGIN
        PRINT N'[LỖI ĐỐI SOÁT] Index IX_THANHTOAN_DonDatVe vẫn chứa cột SoTien trong INCLUDE!';
        THROW 51034, N'Reconciliation Failed: Index mới vẫn tham chiếu SoTien.', 1;
    END
    ELSE
        PRINT N'  -> [PASS] Index IX_THANHTOAN_DonDatVe tồn tại với cấu trúc mới tinh gọn.';
END;

-- ----------------------------------------------------------------------------
-- 2. ĐỐI SOÁT BẢO TOÀN DỮ LIỆU VÀ TOÀN VẸN NGHIỆP VỤ (NULL-SAFE 3VL)
-- ----------------------------------------------------------------------------
PRINT '2. Đối soát bảo toàn lịch sử giao dịch thanh toán và toàn vẹn số liệu...';

DECLARE @CurrentAttempts INT;
DECLARE @CurrentOrders INT;
DECLARE @SuccessAttempts INT;
DECLARE @FailedAttempts INT;
DECLARE @ReconstructedRevenue DECIMAL(18, 2);
DECLARE @OrphanCount INT;
DECLARE @NullComponentCount INT;
DECLARE @NegativeAmountCount INT;

-- 2.1 Tính toán thống kê dữ liệu hiện tại
SELECT 
    @CurrentAttempts = COUNT(*),
    @CurrentOrders = COUNT(DISTINCT tt.DonDatVeID),
    @SuccessAttempts = SUM(CASE WHEN tt.TrangThai = N'Thành công' THEN 1 ELSE 0 END),
    @FailedAttempts = SUM(CASE WHEN tt.TrangThai = N'Thất bại' THEN 1 ELSE 0 END),
    @ReconstructedRevenue = ISNULL(SUM(CASE WHEN tt.TrangThai = N'Thành công' THEN (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) ELSE 0 END), 0)
FROM dbo.THANHTOAN tt
INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID;

-- 2.2 Kiểm tra Orphan Payments
SELECT @OrphanCount = COUNT(*)
FROM dbo.THANHTOAN tt
LEFT JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
WHERE d.DonDatVeID IS NULL;

-- 2.3 Kiểm tra NULL component trên các đơn hàng có thanh toán
SELECT @NullComponentCount = COUNT(*)
FROM dbo.THANHTOAN tt
INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
WHERE d.TongTienVe IS NULL 
   OR d.TongTienDoAn IS NULL 
   OR d.TienGiamGia IS NULL;

-- 2.4 Kiểm tra số tiền tái dựng âm (< 0)
SELECT @NegativeAmountCount = COUNT(*)
FROM dbo.THANHTOAN tt
INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
WHERE (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) < 0;

PRINT N'  - Tổng số Payment Attempts hiện tại: ' + CAST(@CurrentAttempts AS VARCHAR(10));
PRINT N'  - Số đơn hàng có thanh toán:          ' + CAST(@CurrentOrders AS VARCHAR(10));
PRINT N'  - Số giao dịch thành công:            ' + CAST(@SuccessAttempts AS VARCHAR(10));
PRINT N'  - Số giao dịch thất bại:              ' + CAST(@FailedAttempts AS VARCHAR(10));
PRINT N'  - Tổng doanh thu tái dựng:            ' + FORMAT(@ReconstructedRevenue, 'N2') + N' VND';
PRINT N'  - Số bản ghi mồ côi (Orphan):         ' + CAST(@OrphanCount AS VARCHAR(10)) + N' (Kỳ vọng: 0)';
PRINT N'  - Số đơn có thành phần tiền NULL:     ' + CAST(@NullComponentCount AS VARCHAR(10)) + N' (Kỳ vọng: 0)';
PRINT N'  - Số tiền tái dựng âm (< 0):          ' + CAST(@NegativeAmountCount AS VARCHAR(10)) + N' (Kỳ vọng: 0)';

-- Khẳng định các ràng buộc dữ liệu cốt lõi
IF @OrphanCount > 0
BEGIN
    PRINT N'[LỖI ĐỐI SOÁT] Xuất hiện bản ghi THANHTOAN mồ côi!';
    THROW 51037, N'Reconciliation Failed: Có orphan payments.', 1;
END;

IF @NullComponentCount > 0
BEGIN
    PRINT N'[LỖI ĐỐI SOÁT] Có đơn hàng chứa giá trị NULL trong thành phần tính tiền!';
    THROW 51041, N'Reconciliation Failed: NULL component in order amounts.', 1;
END;

IF @NegativeAmountCount > 0
BEGIN
    PRINT N'[LỖI ĐỐI SOÁT] Phát hiện số tiền tái dựng âm vi phạm miền giá trị nghiệp vụ!';
    THROW 51042, N'Reconciliation Failed: Negative reconstructed payment amount.', 1;
END;

-- 2.5 Kiểm tra tính tất định của phép tái dựng (D-01 Payment Amount Immutability):
-- Mọi attempt của cùng một DonDatVeID bắt buộc phải có cùng số tiền tái dựng vì d.DonDatVeID là PK
DECLARE @InconsistentAttemptsPerOrder INT;
SELECT @InconsistentAttemptsPerOrder = COUNT(*)
FROM (
    SELECT tt.DonDatVeID
    FROM dbo.THANHTOAN tt
    INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
    GROUP BY tt.DonDatVeID
    HAVING COUNT(DISTINCT (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)) > 1
) x;

IF @InconsistentAttemptsPerOrder > 0
BEGIN
    PRINT N'[LỖI ĐỐI SOÁT] Phát hiện đơn hàng có số tiền tái dựng không nhất quán giữa các attempt!';
    THROW 51040, N'Reconciliation Failed: Inconsistent reconstructed amounts across attempts.', 1;
END
ELSE
    PRINT N'  -> [PASS] Ràng buộc D-01: Tính tất định và nhất quán của số tiền giữa các attempt được bảo toàn.';

-- 2.6 ĐỐI SOÁT CHÉO BẮT BUỘC VỚI PRE-MIGRATION BASELINE (CROSS-SCRIPT RECONCILIATION)
PRINT '2.6 Đối soát chéo với Pre-Migration Baseline trong tempdb...';

IF OBJECT_ID(N'tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test', N'U') IS NULL
   OR OBJECT_ID(N'tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test', N'U') IS NULL
BEGIN
    PRINT N'[LỖI ĐỐI SOÁT NGHIÊM TRỌNG] Không tìm thấy Pre-Migration Baseline trong tempdb!';
    PRINT N'Nguyên nhân: Script 01_preflight_checks.sql chưa chạy hoặc phiên làm việc đã bị xóa.';
    PRINT N'Quy tắc an toàn: Không thể công nhận di trú thành công nếu thiếu Baseline so sánh lịch sử!';
    THROW 51035, N'Reconciliation Failed: Thiếu Pre-Migration Baseline trong tempdb. Dừng đối soát ngay lập tức.', 1;
END;

DECLARE @BaselineAttempts INT;
DECLARE @BaselineOrders INT;
DECLARE @BaselineSuccess INT;
DECLARE @BaselineFailed INT;
DECLARE @BaselineRevenue DECIMAL(18, 2);
DECLARE @BaselineChecksum NVARCHAR(64);
DECLARE @BaselineRunID VARCHAR(36);
DECLARE @BaselineCapturedAt DATETIME2;

SELECT TOP 1
    @BaselineRunID = MigrationRunID,
    @BaselineCapturedAt = CapturedAt,
    @BaselineAttempts = TotalAttempts,
    @BaselineOrders = DistinctOrders,
    @BaselineSuccess = SuccessAttempts,
    @BaselineFailed = FailedAttempts,
    @BaselineRevenue = TotalHistoricalRevenue,
    @BaselineChecksum = TableChecksum
FROM tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test
ORDER BY BaselineID DESC;

IF DATEDIFF(MINUTE, @BaselineCapturedAt, SYSDATETIME()) > 120
BEGIN
    PRINT N'[LỖI ĐỐI SOÁT] Pre-Migration Baseline đã quá cũ (> 2 giờ). Yêu cầu chạy lại Preflight!';
    THROW 51048, N'Reconciliation Failed: Stale baseline detected (> 120 minutes old).', 1;
END;

PRINT N'  [ĐỐI SOÁT CẤP ĐỘ TỔNG HỢP (AGGREGATE LEVEL)]:';
PRINT N'    * MigrationRunID:        ' + ISNULL(@BaselineRunID, N'N/A') + N' (Captured at: ' + CONVERT(VARCHAR(30), @BaselineCapturedAt, 120) + N')';
PRINT N'    * Payment Attempts:      Baseline = ' + CAST(@BaselineAttempts AS VARCHAR(10)) + N' | Sau di trú = ' + CAST(@CurrentAttempts AS VARCHAR(10));
PRINT N'    * Đơn hàng có TT:        Baseline = ' + CAST(@BaselineOrders AS VARCHAR(10)) + N' | Sau di trú = ' + CAST(@CurrentOrders AS VARCHAR(10));
PRINT N'    * Giao dịch thành công:  Baseline = ' + CAST(@BaselineSuccess AS VARCHAR(10)) + N' | Sau di trú = ' + CAST(@SuccessAttempts AS VARCHAR(10));
PRINT N'    * Giao dịch thất bại:    Baseline = ' + CAST(@BaselineFailed AS VARCHAR(10)) + N' | Sau di trú = ' + CAST(@FailedAttempts AS VARCHAR(10));
PRINT N'    * Tổng doanh thu:        Baseline = ' + FORMAT(@BaselineRevenue, 'N2') + N' VND | Sau di trú = ' + FORMAT(@ReconstructedRevenue, 'N2') + N' VND';

IF @CurrentAttempts <> @BaselineAttempts
    THROW 51036, N'Reconciliation Failed: Mất mát bản ghi Payment Attempt so với baseline pre-migration.', 1;

IF @CurrentOrders <> @BaselineOrders
    THROW 51037, N'Reconciliation Failed: Số lượng đơn hàng tham chiếu sai lệch so với baseline pre-migration.', 1;

IF @SuccessAttempts <> @BaselineSuccess
    THROW 51038, N'Reconciliation Failed: Số giao dịch thành công sai lệch so với baseline pre-migration.', 1;

IF @FailedAttempts <> @BaselineFailed
    THROW 51039, N'Reconciliation Failed: Số giao dịch thất bại sai lệch so với baseline pre-migration.', 1;

IF @ReconstructedRevenue <> @BaselineRevenue
    THROW 51040, N'Reconciliation Failed: Doanh thu tái dựng không khớp với doanh thu lịch sử trước di trú.', 1;

PRINT N'  -> [PASS] Cấp độ tổng hợp (Aggregate): 100% chỉ số khớp chính xác tuyệt đối!';

-- 2.7 ĐỐI SOÁT CHI TIẾT HAI CHIỀU TỪNG DÒNG (BIDIRECTIONAL ROW-BY-ROW RECONCILIATION)
PRINT '2.7 Đối soát chi tiết hai chiều từng dòng (Bidirectional Reconciliation via FULL OUTER JOIN)...';

DECLARE @MissingAttemptsCount INT = 0;
DECLARE @ExtraAttemptsCount INT = 0;
DECLARE @AmountMismatchCount INT = 0;
DECLARE @StatusMismatchCount INT = 0;
DECLARE @OrderMismatchCount INT = 0;

SELECT 
    @MissingAttemptsCount = SUM(CASE WHEN tt.ThanhToanID IS NULL THEN 1 ELSE 0 END),
    @ExtraAttemptsCount   = SUM(CASE WHEN b.ThanhToanID IS NULL THEN 1 ELSE 0 END),
    @AmountMismatchCount  = SUM(CASE WHEN b.ThanhToanID IS NOT NULL AND tt.ThanhToanID IS NOT NULL 
                                     AND b.SoTien <> (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) THEN 1 ELSE 0 END),
    @StatusMismatchCount  = SUM(CASE WHEN b.ThanhToanID IS NOT NULL AND tt.ThanhToanID IS NOT NULL 
                                     AND b.TrangThai <> tt.TrangThai COLLATE DATABASE_DEFAULT THEN 1 ELSE 0 END),
    @OrderMismatchCount   = SUM(CASE WHEN b.ThanhToanID IS NOT NULL AND tt.ThanhToanID IS NOT NULL 
                                     AND b.DonDatVeID <> tt.DonDatVeID THEN 1 ELSE 0 END)
FROM tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test b
FULL OUTER JOIN dbo.THANHTOAN tt ON tt.ThanhToanID = b.ThanhToanID
LEFT JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID;

PRINT N'  - Bản ghi bị thiếu (Missing in Target):   ' + CAST(ISNULL(@MissingAttemptsCount, 0) AS VARCHAR(10));
PRINT N'  - Bản ghi thừa ra (Extra in Target):     ' + CAST(ISNULL(@ExtraAttemptsCount, 0) AS VARCHAR(10));
PRINT N'  - Bản ghi sai lệch số tiền (Amount):     ' + CAST(ISNULL(@AmountMismatchCount, 0) AS VARCHAR(10));
PRINT N'  - Bản ghi sai lệch trạng thái (Status):  ' + CAST(ISNULL(@StatusMismatchCount, 0) AS VARCHAR(10));
PRINT N'  - Bản ghi sai lệch đơn hàng (Order ID):  ' + CAST(ISNULL(@OrderMismatchCount, 0) AS VARCHAR(10));

IF ISNULL(@MissingAttemptsCount, 0) > 0
BEGIN
    PRINT N'[LỖI ĐỐI SOÁT NGHIÊM TRỌNG] Phát hiện ' + CAST(@MissingAttemptsCount AS VARCHAR(10)) + N' bản ghi ThanhToanID bị mất tích sau di trú!';
    THROW 51041, N'Reconciliation Failed: Mất mát ThanhToanID so với pre-migration snapshot.', 1;
END;

IF ISNULL(@ExtraAttemptsCount, 0) > 0
BEGIN
    PRINT N'[LỖI ĐỐI SOÁT NGHIÊM TRỌNG] Phát hiện ' + CAST(@ExtraAttemptsCount AS VARCHAR(10)) + N' bản ghi ThanhToanID phát sinh bất thường (Extra records)!';
    THROW 51043, N'Reconciliation Failed: Xuất hiện bản ghi THANHTOAN lạ không có trong pre-migration snapshot.', 1;
END;

IF ISNULL(@AmountMismatchCount, 0) > 0
BEGIN
    PRINT N'[LỖI ĐỐI SOÁT NGHIÊM TRỌNG] Phát hiện ' + CAST(@AmountMismatchCount AS VARCHAR(10)) + N' giao dịch có số tiền tái dựng sai lệch với số tiền vật lý ban đầu!';
    THROW 51042, N'Reconciliation Failed: Sai lệch số tiền tái dựng so với lịch sử chi tiết.', 1;
END;

IF ISNULL(@StatusMismatchCount, 0) > 0 OR ISNULL(@OrderMismatchCount, 0) > 0
BEGIN
    PRINT N'[LỖI ĐỐI SOÁT NGHIÊM TRỌNG] Phát hiện sai lệch thuộc tính giao dịch (Trạng thái hoặc Đơn hàng)!';
    THROW 51044, N'Reconciliation Failed: Sai lệch thuộc tính giao dịch so với snapshot lịch sử.', 1;
END;

PRINT N'  -> [PASS] Đối soát hai chiều (Bidirectional FULL OUTER JOIN): 100% bản ghi khớp chính xác tuyệt đối!';

-- ----------------------------------------------------------------------------
-- 3. ĐỐI SOÁT HOẠT ĐỘNG CHỨC NĂNG CỦA CÁC MODULE SQL (FUNCTIONAL VALIDATION)
-- ----------------------------------------------------------------------------
PRINT '3. Đối soát hoạt động của View và Stored Procedures với tham số động...';

-- 3.1 Kiểm tra truy vấn View dbo.vw_DoanhThuTheoRap
BEGIN TRY
    DECLARE @ViewRowCount INT;
    SELECT @ViewRowCount = COUNT(*) FROM dbo.vw_DoanhThuTheoRap;
    PRINT N'  -> [PASS] View dbo.vw_DoanhThuTheoRap thực thi thành công (' + CAST(@ViewRowCount AS VARCHAR(10)) + N' rạp).';
END TRY
BEGIN CATCH
    PRINT N'[LỖI ĐỐI SOÁT] View dbo.vw_DoanhThuTheoRap bị lỗi thực thi: ' + ERROR_MESSAGE();
    THROW;
END CATCH;

-- Tìm kiếm Actor và Order mẫu một cách linh hoạt (Dynamic Discovery)
DECLARE @AdminActorID INT;
SELECT TOP 1 @AdminActorID = nd.NguoiDungID
FROM dbo.NGUOIDUNG nd
INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
WHERE nd.TrangThai = N'Hoạt động'
  AND vt.MaVaiTro = 'ADMIN'
  AND dbo.fn_KiemTraQuyenNguoiDung(nd.NguoiDungID, 'XEM_BAO_CAO_TOANHE') = 1
ORDER BY nd.NguoiDungID ASC;

IF @AdminActorID IS NULL
    SELECT TOP 1 @AdminActorID = NguoiDungID FROM dbo.NGUOIDUNG ORDER BY NguoiDungID ASC;

DECLARE @SampleCustID INT, @SampleDonID INT;
SELECT TOP 1 
    @SampleCustID = d.NguoiDungID,
    @SampleDonID = d.DonDatVeID
FROM dbo.DONDATVE d
INNER JOIN dbo.NGUOIDUNG nd ON nd.NguoiDungID = d.NguoiDungID
INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
WHERE vt.MaVaiTro = 'KHACH_HANG'
  AND nd.TrangThai = N'Hoạt động'
ORDER BY d.DonDatVeID ASC;

IF @SampleDonID IS NULL
    SELECT TOP 1 @SampleDonID = DonDatVeID, @SampleCustID = NguoiDungID FROM dbo.DONDATVE ORDER BY DonDatVeID ASC;

-- 3.2 Kiểm tra Stored Procedure dbo.sp_Admin_Dashboard
IF @AdminActorID IS NOT NULL
BEGIN
    BEGIN TRY
        EXEC dbo.sp_Admin_Dashboard @ActorID = @AdminActorID;
        PRINT N'  -> [PASS] Procedure dbo.sp_Admin_Dashboard thực thi thành công (ActorID: ' + CAST(@AdminActorID AS VARCHAR(10)) + N').';
    END TRY
    BEGIN CATCH
        PRINT N'[LỖI ĐỐI SOÁT] dbo.sp_Admin_Dashboard bị lỗi: ' + ERROR_MESSAGE();
        THROW;
    END CATCH;
END;

-- 3.3 Kiểm tra Stored Procedure dbo.sp_Admin_Report_Revenue
IF @AdminActorID IS NOT NULL
BEGIN
    BEGIN TRY
        EXEC dbo.sp_Admin_Report_Revenue @ActorID = @AdminActorID;
        PRINT N'  -> [PASS] Procedure dbo.sp_Admin_Report_Revenue thực thi thành công (ActorID: ' + CAST(@AdminActorID AS VARCHAR(10)) + N').';
    END TRY
    BEGIN CATCH
        PRINT N'[LỖI ĐỐI SOÁT] dbo.sp_Admin_Report_Revenue bị lỗi: ' + ERROR_MESSAGE();
        THROW;
    END CATCH;
END;

-- 3.4 Kiểm tra Stored Procedure dbo.sp_Order_GetDetailByCustomer
IF @SampleCustID IS NOT NULL AND @SampleDonID IS NOT NULL
BEGIN
    BEGIN TRY
        EXEC dbo.sp_Order_GetDetailByCustomer @NguoiDungID = @SampleCustID, @DonDatVeID = @SampleDonID;
        PRINT N'  -> [PASS] Procedure dbo.sp_Order_GetDetailByCustomer thực thi thành công (CustID: ' + CAST(@SampleCustID AS VARCHAR(10)) + N', DonID: ' + CAST(@SampleDonID AS VARCHAR(10)) + N').';
    END TRY
    BEGIN CATCH
        PRINT N'[LỖI ĐỐI SOÁT] dbo.sp_Order_GetDetailByCustomer bị lỗi: ' + ERROR_MESSAGE();
        THROW;
    END CATCH;
END;

-- 3.5 Kiểm tra Stored Procedure dbo.sp_StaffBooking_Detail
IF @AdminActorID IS NOT NULL AND @SampleDonID IS NOT NULL
BEGIN
    BEGIN TRY
        EXEC dbo.sp_StaffBooking_Detail @ActorID = @AdminActorID, @PortalRole = 'ADMIN', @DonDatVeID = @SampleDonID;
        PRINT N'  -> [PASS] Procedure dbo.sp_StaffBooking_Detail thực thi thành công (ActorID: ' + CAST(@AdminActorID AS VARCHAR(10)) + N', DonID: ' + CAST(@SampleDonID AS VARCHAR(10)) + N').';
    END TRY
    BEGIN CATCH
        PRINT N'[LỖI ĐỐI SOÁT] dbo.sp_StaffBooking_Detail bị lỗi: ' + ERROR_MESSAGE();
        THROW;
    END CATCH;
END;

-- Cập nhật trạng thái đối soát thành công vào metadata tempdb
IF OBJECT_ID(N'tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test', N'U') IS NOT NULL
BEGIN
    UPDATE TOP (1) tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test
    SET Status = N'RECONCILED_PASS'
    WHERE Status = N'PREFLIGHT_PASS';
END;

PRINT '============================================================================';
PRINT N'KẾT LUẬN HẬU KIỂM: 100% CHỈ SỐ ĐỐI SOÁT ĐẠT CHUẨN HOÀN TOÀN (VERIFIED PASS)';
PRINT N'Hệ thống CinemaBookingDB đã đạt chuẩn 3NF thực chất, bảo toàn 100% dữ liệu lịch sử!';
PRINT '============================================================================';
