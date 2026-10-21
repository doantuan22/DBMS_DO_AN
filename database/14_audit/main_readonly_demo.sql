-- Read-only SSMS audit for the configured primary database.
-- It does not insert, update, delete, alter, or execute write-capable procedures.
USE [CinemaBookingDB];
GO
SET NOCOUNT ON;

IF DB_NAME() <> N'CinemaBookingDB'
    THROW 52000, N'Wrong database. Connect to CinemaBookingDB before running this audit.', 1;

DECLARE @Server sysname = @@SERVERNAME;
DECLARE @Now datetime2(7) = dbo.fn_BayGio();
DECLARE @Results TABLE (
    TestName nvarchar(160) NOT NULL,
    InputValue nvarchar(500) NULL,
    ExpectedValue nvarchar(500) NOT NULL,
    ActualValue nvarchar(500) NULL,
    Verdict varchar(10) NOT NULL
);
SELECT @Server AS SqlServer, DB_NAME() AS DatabaseName, @Now AS UtcNow,
    dbo.fn_HomNay() AS BusinessDate, N'No persistent writes' AS AuditMode;
INSERT @Results VALUES
    (N'fn_BayGio current UTC clock',NULL,N'within the last 2 seconds',CONVERT(nvarchar(30),@Now,126),
     IIF(@Now<=SYSUTCDATETIME() AND @Now>=DATEADD(second,-2,SYSUTCDATETIME()),'PASS','FAIL'));

-- Application inventory excludes the 11 SQL Server database-diagram support objects.
DECLARE @AppTables int = (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped = 0 AND name <> N'sysdiagrams');
DECLARE @AppProcedures int = (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0 AND name NOT IN
    (N'sp_alterdiagram',N'sp_creatediagram',N'sp_dropdiagram',N'sp_helpdiagramdefinition',N'sp_helpdiagrams',N'sp_renamediagram',N'sp_upgraddiagrams'));
DECLARE @AppViews int = (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped = 0);
DECLARE @AppFunctions int = (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped = 0 AND name <> N'fn_diagramobjects');
DECLARE @AppTriggers int = (SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped = 0);
DECLARE @ForeignKeys int = (SELECT COUNT(*) FROM sys.foreign_keys);
DECLARE @CheckConstraints int = (SELECT COUNT(*) FROM sys.check_constraints);
DECLARE @UntrustedConstraints int = (
    SELECT COUNT(*) FROM sys.foreign_keys WHERE is_disabled = 1 OR is_not_trusted = 1
) + (
    SELECT COUNT(*) FROM sys.check_constraints WHERE is_disabled = 1 OR is_not_trusted = 1
);
DECLARE @DisabledTriggers int = (SELECT COUNT(*) FROM sys.triggers WHERE is_disabled = 1);
DECLARE @DisabledIndexes int = (
    SELECT COUNT(*) FROM sys.indexes i JOIN sys.tables t ON t.object_id = i.object_id
    WHERE i.index_id > 0 AND i.is_disabled = 1 AND t.name <> N'sysdiagrams'
);
INSERT @Results VALUES
    (N'Application object inventory', N'Expected tables/procedures/views/functions/triggers = 29/147/6/21/9', N'29/147/6/21/9',
     CONCAT(@AppTables,N'/',@AppProcedures,N'/',@AppViews,N'/',@AppFunctions,N'/',@AppTriggers),
     IIF(@AppTables=29 AND @AppProcedures=147 AND @AppViews=6 AND @AppFunctions=21 AND @AppTriggers=9,'PASS','FAIL')),
    (N'Constraint and index state', NULL, N'FK 37; CHECK 65; all trusted/enabled; no disabled indexes',
     CONCAT(N'FK ',@ForeignKeys,N'; CHECK ',@CheckConstraints,N'; untrusted ',@UntrustedConstraints,N'; disabled indexes ',@DisabledIndexes),
     IIF(@ForeignKeys=37 AND @CheckConstraints=65 AND @UntrustedConstraints=0 AND @DisabledIndexes=0,'PASS','FAIL')),
    (N'Trigger state', NULL, N'9 enabled application triggers', CONCAT(@AppTriggers,N' total; ',@DisabledTriggers,N' disabled'),
     IIF(@AppTriggers=9 AND @DisabledTriggers=0,'PASS','FAIL'));

-- Time and rule functions: fixed values, boundary inputs, NULLs, and relational cases.
DECLARE @EdgeUtc datetime2(7) = CONVERT(datetime2(7), '2026-10-20T17:00:00');
DECLARE @LocalEdge datetimeoffset(7) = dbo.fn_GioRap(@EdgeUtc);
DECLARE @UtcRoundTrip datetime2(7) = dbo.fn_UtcTuGioRap(CONVERT(datetime2(7), '2026-10-21T00:00:00'));
INSERT @Results VALUES
    (N'fn_GioRap UTC-to-cinema boundary', CONVERT(nvarchar(30),@EdgeUtc,126), N'2026-10-21 00:00 +07:00',
     CONVERT(nvarchar(40),@LocalEdge,126), IIF(DATEPART(TZOFFSET,@LocalEdge)=420 AND CONVERT(date,@LocalEdge)=CONVERT(date,'2026-10-21')
        AND CONVERT(time(0),@LocalEdge)=CONVERT(time(0),'00:00:00'),'PASS','FAIL')),
    (N'fn_UtcTuGioRap cinema-to-UTC boundary', N'2026-10-21 00:00 local', N'2026-10-20 17:00 UTC',
     CONVERT(nvarchar(30),@UtcRoundTrip,126), IIF(@UtcRoundTrip=@EdgeUtc,'PASS','FAIL')),
    (N'fn_NgayKinhDoanh date boundary', CONVERT(nvarchar(30),@EdgeUtc,126), N'2026-10-21',
     CONVERT(nvarchar(10),dbo.fn_NgayKinhDoanh(@EdgeUtc),23), IIF(dbo.fn_NgayKinhDoanh(@EdgeUtc)=CONVERT(date,'2026-10-21'),'PASS','FAIL')),
    (N'fn_GioRap NULL', N'NULL', N'NULL', IIF(dbo.fn_GioRap(NULL) IS NULL,N'NULL',N'NOT NULL'), IIF(dbo.fn_GioRap(NULL) IS NULL,'PASS','FAIL')),
    (N'fn_UtcTuGioRap NULL', N'NULL', N'NULL', IIF(dbo.fn_UtcTuGioRap(NULL) IS NULL,N'NULL',N'NOT NULL'), IIF(dbo.fn_UtcTuGioRap(NULL) IS NULL,'PASS','FAIL')),
    (N'fn_NgayKinhDoanh NULL', N'NULL', N'NULL', IIF(dbo.fn_NgayKinhDoanh(NULL) IS NULL,N'NULL',N'NOT NULL'), IIF(dbo.fn_NgayKinhDoanh(NULL) IS NULL,'PASS','FAIL')),
    (N'fn_HomNay business date', NULL, CONVERT(nvarchar(10),dbo.fn_NgayKinhDoanh(@Now),23),
     CONVERT(nvarchar(10),dbo.fn_HomNay(),23), IIF(dbo.fn_HomNay()=dbo.fn_NgayKinhDoanh(@Now),'PASS','FAIL')),
    (N'fn_GioiHanDonDangGiu', NULL, N'3', CONVERT(nvarchar(20),dbo.fn_GioiHanDonDangGiu()), IIF(dbo.fn_GioiHanDonDangGiu()=3,'PASS','FAIL')),
    (N'fn_GioiHanGheMoiDon', NULL, N'10', CONVERT(nvarchar(20),dbo.fn_GioiHanGheMoiDon()), IIF(dbo.fn_GioiHanGheMoiDon()=10,'PASS','FAIL')),
    (N'fn_GioiHanGiamGiaPhanTram', NULL, N'99', CONVERT(nvarchar(20),dbo.fn_GioiHanGiamGiaPhanTram()), IIF(dbo.fn_GioiHanGiamGiaPhanTram()=99,'PASS','FAIL')),
    (N'fn_GioiHanSoLuongSanPham', NULL, N'10', CONVERT(nvarchar(20),dbo.fn_GioiHanSoLuongSanPham()), IIF(dbo.fn_GioiHanSoLuongSanPham()=10,'PASS','FAIL')),
    (N'fn_ThoiGianGiaHanThanhToanPhut', NULL, N'5', CONVERT(nvarchar(20),dbo.fn_ThoiGianGiaHanThanhToanPhut()), IIF(dbo.fn_ThoiGianGiaHanThanhToanPhut()=5,'PASS','FAIL')),
    (N'fn_ThoiGianGiuChoPhut', NULL, N'5', CONVERT(nvarchar(20),dbo.fn_ThoiGianGiuChoPhut()), IIF(dbo.fn_ThoiGianGiuChoPhut()=5,'PASS','FAIL'));

DECLARE @PendingBeforeExpiry bit = dbo.fn_DonDangGiuGhe(N'Chờ thanh toán',DATEADD(minute,1,@Now),@Now);
DECLARE @PendingAtExpiry bit = dbo.fn_DonDangGiuGhe(N'Chờ thanh toán',@Now,@Now);
DECLARE @PaidHold bit = dbo.fn_DonDangGiuGhe(N'Hoàn thành',DATEADD(day,-1,@Now),@Now);
DECLARE @CanceledHold bit = dbo.fn_DonDangGiuGhe(N'Đã hủy',DATEADD(day,1,@Now),@Now);
DECLARE @NullHold bit = dbo.fn_DonDangGiuGhe(NULL,NULL,@Now);
INSERT @Results VALUES
    (N'fn_DonDangGiuGhe pending before expiry', N'pending; deadline = now + 1 minute', N'1', CONVERT(nvarchar(5),@PendingBeforeExpiry), IIF(@PendingBeforeExpiry=1,'PASS','FAIL')),
    (N'fn_DonDangGiuGhe exact expiry boundary', N'pending; deadline = now', N'0', CONVERT(nvarchar(5),@PendingAtExpiry), IIF(@PendingAtExpiry=0,'PASS','FAIL')),
    (N'fn_DonDangGiuGhe paid order', N'completed; old deadline', N'1', CONVERT(nvarchar(5),@PaidHold), IIF(@PaidHold=1,'PASS','FAIL')),
    (N'fn_DonDangGiuGhe canceled order', N'canceled; future deadline', N'0', CONVERT(nvarchar(5),@CanceledHold), IIF(@CanceledHold=0,'PASS','FAIL')),
    (N'fn_DonDangGiuGhe NULL status', N'NULL status/deadline', N'0', CONVERT(nvarchar(5),@NullHold), IIF(@NullHold=0,'PASS','FAIL'));

DECLARE @AdminID int;
SELECT TOP (1) @AdminID = u.NguoiDungID
FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID
WHERE r.MaVaiTro='ADMIN' AND u.TrangThai=N'Hoạt động'
ORDER BY u.NguoiDungID;
DECLARE @AdminPermission bit = dbo.fn_KiemTraQuyenNguoiDung(@AdminID,'XEM_BAO_CAO_TOANHE');
DECLARE @InvalidPermission bit = dbo.fn_KiemTraQuyenNguoiDung(-2147483648,'NO_SUCH_PERMISSION');
INSERT @Results VALUES
    (N'fn_KiemTraQuyenNguoiDung admin permission', CONCAT(N'active ADMIN user ',@AdminID,N'; XEM_BAO_CAO_TOANHE'), N'1', CONVERT(nvarchar(5),@AdminPermission), IIF(@AdminID IS NOT NULL AND @AdminPermission=1,'PASS','FAIL')),
    (N'fn_KiemTraQuyenNguoiDung unknown user/permission', N'user=-2147483648; permission=NO_SUCH_PERMISSION', N'0', CONVERT(nvarchar(5),@InvalidPermission), IIF(@InvalidPermission=0,'PASS','FAIL'));

DECLARE @ManagerID int, @ManagerCinemaID int;
SELECT TOP (1) @ManagerID=p.NguoiDungID,@ManagerCinemaID=p.RapID
FROM dbo.PHANCONG_RAP p JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=p.NguoiDungID
JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID
WHERE r.MaVaiTro='QUAN_LY_RAP' AND u.TrangThai=N'Hoạt động'
ORDER BY p.NgayBatDau DESC,p.PhanCongID DESC;
IF @ManagerID IS NULL SELECT @ManagerID=-2147483648,@ManagerCinemaID=-2147483648;
DECLARE @ScopeExpected bit = CASE WHEN EXISTS (
    SELECT 1 FROM dbo.PHANCONG_RAP p JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=p.NguoiDungID
    JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID
    WHERE p.NguoiDungID=@ManagerID AND p.RapID=@ManagerCinemaID AND p.TrangThai=N'Hiệu lực'
      AND dbo.fn_HomNay()>=p.NgayBatDau AND (p.NgayKetThuc IS NULL OR dbo.fn_HomNay()<=p.NgayKetThuc)
      AND u.TrangThai=N'Hoạt động' AND r.MaVaiTro='QUAN_LY_RAP'
) THEN 1 ELSE 0 END;
DECLARE @ScopeActual bit = dbo.fn_KiemTraQuanLyRapScope(@ManagerID,@ManagerCinemaID);
INSERT @Results VALUES (N'fn_KiemTraQuanLyRapScope',CONCAT(N'user=',@ManagerID,N'; cinema=',@ManagerCinemaID),
    CONVERT(nvarchar(5),@ScopeExpected),CONVERT(nvarchar(5),@ScopeActual),IIF(@ScopeActual=@ScopeExpected,'PASS','FAIL'));

DECLARE @SampleShowtimeID int, @SampleRoomID int, @SampleSeatID int, @SampleSeatType nvarchar(50), @SampleFormat nvarchar(50), @SampleBase decimal(18,2), @SampleShowDate date;
SELECT TOP (1) @SampleShowtimeID=v.SuatChieuID,@SampleRoomID=v.PhongID,@SampleFormat=v.DinhDang,@SampleBase=v.GiaVeCoBan,
    @SampleSeatID=g.GheID,@SampleSeatType=g.LoaiGhe,@SampleShowDate=dbo.fn_NgayKinhDoanh(v.ThoiGianBatDau)
FROM dbo.vw_LichChieuChiTiet v JOIN dbo.GHE g ON g.PhongID=v.PhongID
WHERE v.IsBookable=1 AND g.TrangThai=N'Hoạt động'
ORDER BY v.ThoiGianBatDau,g.GheID;
DECLARE @DayType nvarchar(50) = CASE WHEN DATEDIFF(day,CONVERT(date,'19000101',112),@SampleShowDate)%7 IN (5,6) THEN N'Cuối tuần' ELSE N'Ngày thường' END;
DECLARE @ExpectedPrice decimal(18,2), @ActualPrice decimal(18,2);
SELECT @ExpectedPrice=@SampleBase+ISNULL(SUM(bg.PhuThu),0)
FROM dbo.SUATCHIEU sc JOIN dbo.PHONGCHIEU pc ON pc.PhongID=sc.PhongID JOIN dbo.GHE g ON g.GheID=@SampleSeatID
LEFT JOIN dbo.BANGGIA bg ON bg.RapID=pc.RapID AND bg.TrangThai=N'Áp dụng'
    AND @SampleShowDate>=bg.NgayBatDau AND (bg.NgayKetThuc IS NULL OR @SampleShowDate<=bg.NgayKetThuc)
    AND (bg.LoaiGhe=@SampleSeatType OR bg.LoaiGhe=N'Tất cả')
    AND (bg.LoaiNgay=@DayType OR bg.LoaiNgay=N'Tất cả')
    AND (bg.DinhDang=@SampleFormat OR bg.DinhDang=N'Tất cả')
WHERE sc.SuatChieuID=@SampleShowtimeID GROUP BY sc.GiaVeCoBan;
SET @ActualPrice=dbo.fn_TinhGiaVe(@SampleShowtimeID,@SampleSeatID);
INSERT @Results VALUES
    (N'fn_TinhGiaVe current bookable fixture',CONCAT(N'showtime=',@SampleShowtimeID,N'; seat=',@SampleSeatID),CONVERT(nvarchar(40),@ExpectedPrice),CONVERT(nvarchar(40),@ActualPrice),IIF(@ActualPrice=@ExpectedPrice AND @SampleShowtimeID IS NOT NULL,'PASS','FAIL')),
    (N'fn_TinhGiaVe unknown IDs',N'showtime=-2147483648; seat=-2147483648',N'0',CONVERT(nvarchar(40),dbo.fn_TinhGiaVe(-2147483648,-2147483648)),IIF(dbo.fn_TinhGiaVe(-2147483648,-2147483648)=0,'PASS','FAIL'));

DECLARE @SeatRows int, @PhysicalSeatRows int, @InvalidSeatRows int;
SELECT @SeatRows=COUNT(*) FROM dbo.fn_DanhSachGheSuatChieu(@SampleShowtimeID);
SELECT @PhysicalSeatRows=COUNT(*) FROM dbo.GHE WHERE PhongID=@SampleRoomID;
SELECT @InvalidSeatRows=COUNT(*) FROM dbo.fn_DanhSachGheSuatChieu(-2147483648);
INSERT @Results VALUES
    (N'fn_DanhSachGheSuatChieu multi-row',CONCAT(N'showtime=',@SampleShowtimeID),CONVERT(nvarchar(20),@PhysicalSeatRows),CONVERT(nvarchar(20),@SeatRows),IIF(@SampleShowtimeID IS NOT NULL AND @SeatRows=@PhysicalSeatRows,'PASS','FAIL')),
    (N'fn_DanhSachGheSuatChieu unknown showtime',N'showtime=-2147483648',N'0 rows',CONCAT(@InvalidSeatRows,N' rows'),IIF(@InvalidSeatRows=0,'PASS','FAIL'));

DECLARE @BookedSeatID int;
SELECT TOP (1) @BookedSeatID=cv.GheID
FROM dbo.CHITIETVE cv JOIN dbo.DONDATVE d ON d.DonDatVeID=cv.DonDatVeID JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
WHERE cv.TrangThai=N'Đã đặt' AND s.ThoiGianBatDau>@Now
  AND (d.TrangThai IN (N'Đã thanh toán',N'Hoàn thành') OR (d.TrangThai=N'Chờ thanh toán' AND d.HanGiuCho>@Now))
ORDER BY d.DonDatVeID;
DECLARE @FutureTicketExpected bit = CASE WHEN @BookedSeatID IS NULL THEN 0 ELSE 1 END;
DECLARE @FutureTicketActual bit = dbo.fn_GheCoVeHieuLucSuatTuongLai(COALESCE(@BookedSeatID,-2147483648));
INSERT @Results VALUES
    (N'fn_GheCoVeHieuLucSuatTuongLai existing seat',CONCAT(N'seat=',COALESCE(CONVERT(nvarchar(20),@BookedSeatID),N'no fixture')),CONVERT(nvarchar(5),@FutureTicketExpected),CONVERT(nvarchar(5),@FutureTicketActual),IIF(@FutureTicketActual=@FutureTicketExpected,'PASS','FAIL')),
    (N'fn_GheCoVeHieuLucSuatTuongLai unknown seat',N'seat=-2147483648',N'0',CONVERT(nvarchar(5),dbo.fn_GheCoVeHieuLucSuatTuongLai(-2147483648)),IIF(dbo.fn_GheCoVeHieuLucSuatTuongLai(-2147483648)=0,'PASS','FAIL'));

DECLARE @CompensationAmount decimal(38,6), @CompensationPoints bigint, @NullCompensationAmount decimal(38,6), @NullCompensationPoints bigint;
SELECT @CompensationAmount=TienVeThucTra,@CompensationPoints=DiemCong FROM dbo.fn_TinhBoiThuongVe(100000,50000,30000);
SELECT @NullCompensationAmount=TienVeThucTra,@NullCompensationPoints=DiemCong FROM dbo.fn_TinhBoiThuongVe(NULL,NULL,NULL);
INSERT @Results VALUES
    (N'fn_TinhBoiThuongVe proportional amount/points',N've=100000; food=50000; discount=30000',N'amount=80000; points=80',CONCAT(N'amount=',@CompensationAmount,N'; points=',@CompensationPoints),IIF(@CompensationAmount=80000 AND @CompensationPoints=80,'PASS','FAIL')),
    (N'fn_TinhBoiThuongVe NULL boundary',N've=NULL; food=NULL; discount=NULL',N'amount=0; points=0',CONCAT(N'amount=',@NullCompensationAmount,N'; points=',@NullCompensationPoints),IIF(@NullCompensationAmount=0 AND @NullCompensationPoints=0,'PASS','FAIL'));

DECLARE @SampleOrderID int;
SELECT TOP (1) @SampleOrderID=d.DonDatVeID FROM dbo.DONDATVE d ORDER BY d.DonDatVeID DESC;
DECLARE @ExpectedTicketTotal decimal(18,2)=(SELECT ISNULL(SUM(GiaVe),0) FROM dbo.CHITIETVE WHERE DonDatVeID=@SampleOrderID AND TrangThai<>N'Đã hủy');
DECLARE @ExpectedFoodTotal decimal(18,2)=(SELECT ISNULL(SUM(SoLuong*DonGia),0) FROM dbo.CHITIETDOAN WHERE DonDatVeID=@SampleOrderID);
DECLARE @ExpectedOrderTotal decimal(18,2)=(SELECT CASE WHEN TongTienVe+TongTienDoAn-TienGiamGia<0 THEN 0 ELSE TongTienVe+TongTienDoAn-TienGiamGia END FROM dbo.DONDATVE WHERE DonDatVeID=@SampleOrderID);
DECLARE @ActualTicketTotal decimal(18,2)=dbo.fn_TinhTongTienVe(@SampleOrderID);
DECLARE @ActualFoodTotal decimal(18,2)=dbo.fn_TinhTongTienDoAn(@SampleOrderID);
DECLARE @ActualOrderTotal decimal(18,2)=dbo.fn_TinhTongTienDon(@SampleOrderID);
INSERT @Results VALUES
    (N'fn_TinhTongTienVe order snapshot',CONCAT(N'order=',@SampleOrderID),CONVERT(nvarchar(40),@ExpectedTicketTotal),CONVERT(nvarchar(40),@ActualTicketTotal),IIF(@ActualTicketTotal=@ExpectedTicketTotal,'PASS','FAIL')),
    (N'fn_TinhTongTienDoAn order snapshot',CONCAT(N'order=',@SampleOrderID),CONVERT(nvarchar(40),@ExpectedFoodTotal),CONVERT(nvarchar(40),@ActualFoodTotal),IIF(@ActualFoodTotal=@ExpectedFoodTotal,'PASS','FAIL')),
    (N'fn_TinhTongTienDon order snapshot',CONCAT(N'order=',@SampleOrderID),CONVERT(nvarchar(40),@ExpectedOrderTotal),CONVERT(nvarchar(40),@ActualOrderTotal),IIF(@ActualOrderTotal=@ExpectedOrderTotal,'PASS','FAIL')),
    (N'fn_TinhTongTienVe unknown order',N'order=-2147483648',N'0',CONVERT(nvarchar(40),dbo.fn_TinhTongTienVe(-2147483648)),IIF(dbo.fn_TinhTongTienVe(-2147483648)=0,'PASS','FAIL')),
    (N'fn_TinhTongTienDoAn unknown order',N'order=-2147483648',N'0',CONVERT(nvarchar(40),dbo.fn_TinhTongTienDoAn(-2147483648)),IIF(dbo.fn_TinhTongTienDoAn(-2147483648)=0,'PASS','FAIL')),
    (N'fn_TinhTongTienDon unknown order',N'order=-2147483648',N'0',CONVERT(nvarchar(40),dbo.fn_TinhTongTienDon(-2147483648)),IIF(dbo.fn_TinhTongTienDon(-2147483648)=0,'PASS','FAIL'));

-- Every view is queried and compared with an independent base-table count/oracle.
DECLARE @Rows bigint, @ExpectedRows bigint;
SELECT @Rows=COUNT_BIG(*) FROM dbo.vw_ChiTietDonDatVe; SELECT @ExpectedRows=COUNT_BIG(*) FROM dbo.DONDATVE;
INSERT @Results VALUES (N'vw_ChiTietDonDatVe row coverage',NULL,CONVERT(nvarchar(30),@ExpectedRows),CONVERT(nvarchar(30),@Rows),IIF(@Rows=@ExpectedRows,'PASS','FAIL'));
SELECT @Rows=COUNT_BIG(*) FROM dbo.vw_LichSuDatVe; SELECT @ExpectedRows=COUNT_BIG(*) FROM dbo.DONDATVE;
INSERT @Results VALUES (N'vw_LichSuDatVe row coverage',NULL,CONVERT(nvarchar(30),@ExpectedRows),CONVERT(nvarchar(30),@Rows),IIF(@Rows=@ExpectedRows,'PASS','FAIL'));
SELECT @Rows=COUNT_BIG(*) FROM dbo.vw_DanhSachKhieuNai; SELECT @ExpectedRows=COUNT_BIG(*) FROM dbo.KHIEUNAI;
INSERT @Results VALUES (N'vw_DanhSachKhieuNai row coverage',NULL,CONVERT(nvarchar(30),@ExpectedRows),CONVERT(nvarchar(30),@Rows),IIF(@Rows=@ExpectedRows,'PASS','FAIL'));
SELECT @Rows=COUNT_BIG(*) FROM dbo.vw_ThongKePhim; SELECT @ExpectedRows=COUNT_BIG(*) FROM dbo.PHIM;
INSERT @Results VALUES (N'vw_ThongKePhim row coverage',NULL,CONVERT(nvarchar(30),@ExpectedRows),CONVERT(nvarchar(30),@Rows),IIF(@Rows=@ExpectedRows,'PASS','FAIL'));
SELECT @Rows=COUNT_BIG(*) FROM dbo.vw_LichChieuChiTiet; SELECT @ExpectedRows=COUNT_BIG(*) FROM dbo.SUATCHIEU;
INSERT @Results VALUES (N'vw_LichChieuChiTiet row coverage',NULL,CONVERT(nvarchar(30),@ExpectedRows),CONVERT(nvarchar(30),@Rows),IIF(@Rows=@ExpectedRows,'PASS','FAIL'));
DECLARE @ActualRevenue decimal(38,2), @ExpectedRevenue decimal(38,2);
SELECT @ActualRevenue=ISNULL(SUM(DoanhThuThucTe),0) FROM dbo.vw_DoanhThuTheoRap;
WITH PaidOrders AS (
    SELECT d.DonDatVeID,pc.RapID,d.TongTienVe,d.TongTienDoAn,d.TienGiamGia
    FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
    JOIN dbo.PHONGCHIEU pc ON pc.PhongID=s.PhongID
    WHERE EXISTS (SELECT 1 FROM dbo.THANHTOAN p WHERE p.DonDatVeID=d.DonDatVeID AND p.TrangThai=N'Thành công')
)
SELECT @ExpectedRevenue=ISNULL(SUM(CASE WHEN TongTienVe+TongTienDoAn-TienGiamGia<0 THEN 0 ELSE TongTienVe+TongTienDoAn-TienGiamGia END),0)
FROM PaidOrders;
INSERT @Results VALUES (N'vw_DoanhThuTheoRap paid-payment revenue',N'successful payment orders grouped once per order',CONVERT(nvarchar(50),@ExpectedRevenue),CONVERT(nvarchar(50),@ActualRevenue),IIF(ABS(@ActualRevenue-@ExpectedRevenue)<0.01,'PASS','FAIL'));

SELECT TestName,InputValue,ExpectedValue,ActualValue,Verdict FROM @Results ORDER BY TestName;

SELECT t.name AS TableName,i.name AS IndexName,i.type_desc AS IndexType,i.is_unique,i.is_primary_key,i.is_disabled,i.filter_definition,
    STUFF((SELECT N', '+c.name FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
        WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.is_included_column=0 AND ic.key_ordinal>0
        ORDER BY ic.key_ordinal FOR XML PATH(''),TYPE).value('.','nvarchar(max)'),1,2,N'') AS KeyColumns,
    STUFF((SELECT N', '+c.name FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
        WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.is_included_column=1
        ORDER BY ic.index_column_id FOR XML PATH(''),TYPE).value('.','nvarchar(max)'),1,2,N'') AS IncludedColumns
FROM sys.indexes i JOIN sys.tables t ON t.object_id=i.object_id
WHERE i.index_id>0 AND t.is_ms_shipped=0 AND t.name<>N'sysdiagrams'
ORDER BY t.name,i.index_id;

-- Exact duplicate definitions (same table, uniqueness, filter, key order/direction and included columns).
WITH IndexSignatures AS (
    SELECT i.object_id,i.index_id,i.name,i.is_unique,i.filter_definition,
        STUFF((SELECT N','+CONVERT(nvarchar(12),ic.column_id)+CASE WHEN ic.is_descending_key=1 THEN N'D' ELSE N'A' END
            FROM sys.index_columns ic WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0
            ORDER BY ic.key_ordinal FOR XML PATH(''),TYPE).value('.','nvarchar(max)'),1,1,N'') AS KeySignature,
        STUFF((SELECT N','+CONVERT(nvarchar(12),ic.column_id)
            FROM sys.index_columns ic WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.is_included_column=1
            ORDER BY ic.index_column_id FOR XML PATH(''),TYPE).value('.','nvarchar(max)'),1,1,N'') AS IncludeSignature
    FROM sys.indexes i JOIN sys.tables t ON t.object_id=i.object_id
    WHERE i.index_id>0 AND i.type IN (1,2) AND t.is_ms_shipped=0 AND t.name<>N'sysdiagrams'
)
SELECT OBJECT_NAME(a.object_id) AS TableName,a.name AS FirstIndex,b.name AS DuplicateIndex,a.is_unique,a.filter_definition,a.KeySignature,a.IncludeSignature
FROM IndexSignatures a JOIN IndexSignatures b ON b.object_id=a.object_id AND b.index_id>a.index_id
    AND b.is_unique=a.is_unique AND ISNULL(b.filter_definition,N'')=ISNULL(a.filter_definition,N'')
    AND ISNULL(b.KeySignature,N'')=ISNULL(a.KeySignature,N'') AND ISNULL(b.IncludeSignature,N'')=ISNULL(a.IncludeSignature,N'')
ORDER BY TableName,FirstIndex,DuplicateIndex;

-- Usage since the last SQL Server restart. Zero use alone is not a drop recommendation.
SELECT t.name AS TableName,i.name AS IndexName,COALESCE(u.user_seeks,0) AS UserSeeks,
    COALESCE(u.user_scans,0) AS UserScans,COALESCE(u.user_lookups,0) AS UserLookups,
    COALESCE(u.user_updates,0) AS UserUpdates
FROM sys.indexes i JOIN sys.tables t ON t.object_id=i.object_id
LEFT JOIN sys.dm_db_index_usage_stats u ON u.database_id=DB_ID() AND u.object_id=i.object_id AND u.index_id=i.index_id
WHERE i.index_id>0 AND t.is_ms_shipped=0 AND t.name<>N'sysdiagrams'
ORDER BY COALESCE(u.user_seeks,0)+COALESCE(u.user_scans,0)+COALESCE(u.user_lookups,0),t.name,i.name;

-- Workload-dependent missing-index suggestions from SQL Server. Review before any DDL.
SELECT TOP (20) OBJECT_NAME(d.object_id,d.database_id) AS TableName,d.equality_columns,d.inequality_columns,d.included_columns,
    g.user_seeks,g.user_scans,g.avg_user_impact,
    CONVERT(decimal(18,2),g.avg_total_user_cost*g.avg_user_impact*(g.user_seeks+g.user_scans)/100.0) AS EstimatedImpact
FROM sys.dm_db_missing_index_group_stats g
JOIN sys.dm_db_missing_index_groups ig ON ig.index_group_handle=g.group_handle
JOIN sys.dm_db_missing_index_details d ON d.index_handle=ig.index_handle
WHERE d.database_id=DB_ID()
ORDER BY EstimatedImpact DESC;

SELECT t.name AS TriggerName,OBJECT_NAME(t.parent_id) AS ParentTable,e.type_desc AS DmlEvent,t.is_disabled,
    CASE WHEN t.is_disabled=0 THEN N'PASS metadata; runtime DML BLOCKED' ELSE N'FAIL disabled trigger' END AS Result
FROM sys.triggers t JOIN sys.trigger_events e ON e.object_id=t.object_id
WHERE t.is_ms_shipped=0 ORDER BY t.name,e.type_desc;

SELECT N'FOREIGN KEY' AS ConstraintType,name,OBJECT_NAME(parent_object_id) AS ParentTable,is_disabled,is_not_trusted,
    CASE WHEN is_disabled=0 AND is_not_trusted=0 THEN N'PASS metadata; negative DML BLOCKED' ELSE N'FAIL' END AS Result
FROM sys.foreign_keys
UNION ALL
SELECT N'CHECK',name,OBJECT_NAME(parent_object_id),is_disabled,is_not_trusted,
    CASE WHEN is_disabled=0 AND is_not_trusted=0 THEN N'PASS metadata; negative DML BLOCKED' ELSE N'FAIL' END
FROM sys.check_constraints
UNION ALL
SELECT CASE WHEN k.type='PK' THEN N'PRIMARY KEY' ELSE N'UNIQUE' END,k.name,OBJECT_NAME(k.parent_object_id),i.is_disabled,CONVERT(bit,0),
    CASE WHEN i.is_disabled=0 THEN N'PASS metadata; duplicate DML BLOCKED' ELSE N'FAIL disabled' END
FROM sys.key_constraints k JOIN sys.indexes i ON i.object_id=k.parent_object_id AND i.index_id=k.unique_index_id
JOIN sys.tables t ON t.object_id=k.parent_object_id WHERE t.name<>N'sysdiagrams'
ORDER BY ConstraintType,ParentTable,name;

SET STATISTICS IO ON;
SET STATISTICS TIME ON;
SELECT COUNT_BIG(*) AS RowsRead FROM dbo.vw_LichChieuChiTiet WHERE IsBookable=1;
SELECT COUNT_BIG(*) AS RowsRead FROM dbo.vw_LichSuDatVe;
SELECT COUNT_BIG(*) AS RowsRead FROM dbo.vw_DoanhThuTheoRap;
SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;

-- Actual plans for the same representative read workload appear as XML resultsets in SSMS.
SET STATISTICS XML ON;
SELECT COUNT_BIG(*) AS RowsRead FROM dbo.vw_LichChieuChiTiet WHERE IsBookable=1;
SELECT COUNT_BIG(*) AS RowsRead FROM dbo.vw_LichSuDatVe;
SELECT COUNT_BIG(*) AS RowsRead FROM dbo.vw_DoanhThuTheoRap;
SET STATISTICS XML OFF;

IF EXISTS (SELECT 1 FROM @Results WHERE Verdict <> 'PASS')
    THROW 52001, N'One or more read-only checks failed. Review the preceding result set.', 1;

SELECT
    (SELECT COUNT(*) FROM @Results) AS ReadOnlyCases,
    (SELECT COUNT(*) FROM @Results WHERE Verdict='PASS') AS PassedReadOnlyCases,
    CONCAT(N'READ-ONLY SUITE ONLY: ',(SELECT COUNT(*) FROM @Results WHERE Verdict='PASS'),
        N' assertions passed; consult MAIN_DATABASE_AUDIT_REPORT.md for current overall readiness.') AS OverallStatus;
GO
