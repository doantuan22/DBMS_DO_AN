-- Additive, deterministic volume fixture.  It runs with every FK/CHECK/UNIQUE
-- constraint and business trigger enabled; it never deletes or updates pre-existing rows.
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE Email = 'volume.customer001@example.test')
BEGIN
    IF (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE Email LIKE 'volume.customer%@example.test') <> 200
        THROW 51120, 'Volume seed is partial; it refuses to append or repair data.', 1;
    PRINT 'PASS volume seed already present.';
    RETURN;
END;

DECLARE @Now datetime2(7) = dbo.fn_BayGio(),
        @Day date = dbo.fn_NgayKinhDoanh(dbo.fn_BayGio()),
        @AdminID int = (SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = 'admin1@example.test'),
        @SupportID int = (SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = 'support1@example.test'),
        @SintelID int = (SELECT PhimID FROM dbo.PHIM WHERE TenPhim = N'Sintel');

IF @AdminID IS NULL OR @SupportID IS NULL OR @SintelID IS NULL
    THROW 51120, 'Volume seed prerequisites are missing.', 1;

-- A failed validation rolls back this entire additive fixture; no partial
-- dataset is ever left in a developer database.
BEGIN TRANSACTION;

DECLARE @Customers table (N int primary key, NguoiDungID int not null unique);

;WITH Numbers AS (
    SELECT TOP (200) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS N
    FROM sys.all_objects a CROSS JOIN sys.all_objects b
)
INSERT dbo.NGUOIDUNG(VaiTroID, HoTen, Email, MatKhau, SoDienThoai, NgayTao, TrangThai)
SELECT role.VaiTroID,
       CONCAT(N'Khách hàng tải kiểm thử ', RIGHT(CONCAT('000', Numbers.N), 3)),
       CONCAT('volume.customer', RIGHT(CONCAT('000', Numbers.N), 3), '@example.test'),
       '$2b$10$abcdefghijklmnopqrstuuLoftNdzfm.MJSqSPICz4PpM2nhhaOgG',
       CONCAT('090', RIGHT(CONCAT('0000000', Numbers.N), 7)),
       DATEADD(DAY, -90 - (Numbers.N % 45), @Now),
       N'Hoạt động'
FROM Numbers
CROSS JOIN (SELECT VaiTroID FROM dbo.VAITRO WHERE MaVaiTro = 'KHACH_HANG') role;

INSERT @Customers(N, NguoiDungID)
SELECT CONVERT(int, SUBSTRING(Email, 16, 3)), NguoiDungID
FROM dbo.NGUOIDUNG
WHERE Email LIKE 'volume.customer%@example.test';

IF (SELECT COUNT(*) FROM @Customers) <> 200
    THROW 51120, 'Customer plan is not exactly 200 rows.', 1;

INSERT dbo.HOSOKHACHHANG(NguoiDungID, NgaySinh, GioiTinh, DiemTichLuy)
SELECT NguoiDungID,
       DATEADD(YEAR, -20 - (N % 35), CONVERT(date, @Day)),
       CASE N % 3 WHEN 0 THEN N'Khác' WHEN 1 THEN N'Nữ' ELSE N'Nam' END,
       0
FROM @Customers;

-- Four hundred future shows: 50 business days x 8 rooms, one non-overlapping
-- morning show per room. The existing showtime trigger validates every row.
;WITH Days AS (
    SELECT TOP (50) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) + 19 AS OffsetDay
    FROM sys.all_objects
), ShowtimePlan AS (
    SELECT room.PhongID,
           room.LoaiPhong,
           dbo.fn_UtcTuGioRap(DATEADD(HOUR, 10, CONVERT(datetime2, DATEADD(DAY, Days.OffsetDay, @Day)))) AS Starts
    FROM dbo.PHONGCHIEU room CROSS JOIN Days
)
INSERT dbo.SUATCHIEU(PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai)
SELECT @SintelID, PhongID, Starts, DATEADD(MINUTE, 15, Starts),
       CASE WHEN LoaiPhong = N'3D' THEN N'3D' ELSE N'2D' END,
       CASE WHEN LoaiPhong = N'3D' THEN 95000 ELSE 75000 END,
       N'Mở bán'
FROM ShowtimePlan;

DECLARE @FutureShows table (N int primary key, SuatChieuID int not null, PhongID int not null);
INSERT @FutureShows(N, SuatChieuID, PhongID)
SELECT ROW_NUMBER() OVER (ORDER BY s.SuatChieuID), s.SuatChieuID, s.PhongID
FROM dbo.SUATCHIEU s
WHERE s.PhimID = @SintelID
  AND dbo.fn_NgayKinhDoanh(s.ThoiGianBatDau) BETWEEN DATEADD(DAY, 20, @Day) AND DATEADD(DAY, 69, @Day)
  AND s.TrangThai = N'Mở bán';

IF (SELECT COUNT(*) FROM @FutureShows) <> 400
    THROW 51120, 'Volume showtime plan is not exactly 400 rows.', 1;

DECLARE @FutureOrders table (N int primary key, DonDatVeID int not null unique, NguoiDungID int not null, SuatChieuID int not null, GheID int not null);
;WITH Seats AS (
    SELECT g.PhongID, MIN(g.GheID) AS GheID
    FROM dbo.GHE g
    WHERE g.TrangThai = N'Hoạt động'
    GROUP BY g.PhongID
)
INSERT dbo.DONDATVE(NguoiDungID, SuatChieuID, KhuyenMaiID, NgayDat, TongTienVe, TongTienDoAn, TienGiamGia, TrangThai, HanGiuCho)
SELECT customer.NguoiDungID, fs.SuatChieuID, NULL,
       DATEADD(DAY, -1, s.ThoiGianBatDau),
       dbo.fn_TinhGiaVe(fs.SuatChieuID, Seats.GheID), 0, 0, N'Đã thanh toán', NULL
FROM @FutureShows fs
JOIN dbo.SUATCHIEU s ON s.SuatChieuID = fs.SuatChieuID
JOIN @Customers customer ON customer.N = ((fs.N - 1) % 200) + 1
JOIN Seats ON Seats.PhongID = fs.PhongID;

;WITH Seats AS (
    SELECT g.PhongID, MIN(g.GheID) AS GheID
    FROM dbo.GHE g
    WHERE g.TrangThai = N'Hoạt động'
    GROUP BY g.PhongID
)
INSERT @FutureOrders(N, DonDatVeID, NguoiDungID, SuatChieuID, GheID)
SELECT fs.N, d.DonDatVeID, d.NguoiDungID, d.SuatChieuID, Seats.GheID
FROM @FutureShows fs
JOIN @Customers customer ON customer.N = ((fs.N - 1) % 200) + 1
JOIN dbo.DONDATVE d ON d.NguoiDungID = customer.NguoiDungID AND d.SuatChieuID = fs.SuatChieuID
JOIN Seats ON Seats.PhongID = fs.PhongID;

IF (SELECT COUNT(*) FROM @FutureOrders) <> 400
    THROW 51120, 'Future order plan is not exactly 400 rows.', 1;

INSERT dbo.CHITIETVE(DonDatVeID, GheID, GiaVe, MaVe, TrangThai)
SELECT DonDatVeID, GheID, dbo.fn_TinhGiaVe(SuatChieuID, GheID), CONCAT('VOL-F-', DonDatVeID), N'Đã đặt'
FROM @FutureOrders;

-- Food snapshots are deliberately fixed before payment attempts so order totals
-- remain the sole financial source of truth.
INSERT dbo.CHITIETDOAN(DonDatVeID, SanPhamID, SoLuong, DonGia)
SELECT f.DonDatVeID, product.SanPhamID, 1, product.Gia
FROM @FutureOrders f
CROSS APPLY (SELECT TOP (1) SanPhamID, Gia FROM dbo.SANPHAM WHERE TrangThai = N'Đang bán' ORDER BY SanPhamID) product
WHERE f.N % 5 = 0;

UPDATE orderRow
SET TongTienDoAn = food.TotalFood
FROM dbo.DONDATVE orderRow
JOIN (SELECT DonDatVeID, SUM(SoLuong * DonGia) AS TotalFood FROM dbo.CHITIETDOAN GROUP BY DonDatVeID) food
  ON food.DonDatVeID = orderRow.DonDatVeID
JOIN @FutureOrders f ON f.DonDatVeID = orderRow.DonDatVeID;

INSERT dbo.THANHTOAN(DonDatVeID, PhuongThuc, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai, GhiChu)
SELECT f.DonDatVeID,
       CASE f.N % 3 WHEN 0 THEN N'VNPAY' WHEN 1 THEN N'MOMO' ELSE N'ZALOPAY' END,
       DATEADD(MINUTE, 1, d.NgayDat), DATEADD(MINUTE, 2, d.NgayDat), CONCAT('VOL-OK-', f.DonDatVeID), N'Thành công', N'Volume seed paid order'
FROM @FutureOrders f JOIN dbo.DONDATVE d ON d.DonDatVeID = f.DonDatVeID
WHERE f.N % 4 <> 0;

-- One failed attempt followed by the successful retry for every fourth order.
INSERT dbo.THANHTOAN(DonDatVeID, PhuongThuc, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai, GhiChu)
SELECT f.DonDatVeID, N'VNPAY', d.NgayDat, NULL, CONCAT('VOL-RETRY-', f.DonDatVeID), N'Thất bại', N'Gateway retry scenario'
FROM @FutureOrders f JOIN dbo.DONDATVE d ON d.DonDatVeID = f.DonDatVeID
WHERE f.N % 4 = 0;

INSERT dbo.THANHTOAN(DonDatVeID, PhuongThuc, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai, GhiChu)
SELECT f.DonDatVeID,
       CASE f.N % 3 WHEN 0 THEN N'VNPAY' WHEN 1 THEN N'MOMO' ELSE N'ZALOPAY' END,
       DATEADD(MINUTE, 1, d.NgayDat), DATEADD(MINUTE, 2, d.NgayDat), CONCAT('VOL-OK-', f.DonDatVeID), N'Thành công', N'Volume seed paid order retry succeeded'
FROM @FutureOrders f JOIN dbo.DONDATVE d ON d.DonDatVeID = f.DonDatVeID
WHERE f.N % 4 = 0;

-- Historical completed orders use the twelve canonical completed shows. They
-- are snapshots (not mutable checkout requests) and are inserted with all
-- integrity constraints and triggers active so review eligibility is real.
DECLARE @PastShows table (N int primary key, SuatChieuID int not null, PhongID int not null, PhimID int not null, Starts datetime2 not null);
INSERT @PastShows(N, SuatChieuID, PhongID, PhimID, Starts)
SELECT ROW_NUMBER() OVER (ORDER BY s.SuatChieuID), s.SuatChieuID, s.PhongID, s.PhimID, s.ThoiGianBatDau
FROM dbo.SUATCHIEU s
WHERE s.TrangThai = N'Hoàn thành' AND s.ThoiGianBatDau < @Now;

IF (SELECT COUNT(*) FROM @PastShows) < 12
    THROW 51120, 'Historical showtime prerequisites are missing.', 1;

DECLARE @PastOrders table (N int primary key, DonDatVeID int not null unique, NguoiDungID int not null, SuatChieuID int not null, PhimID int not null, GheID int not null);
DECLARE @PastPlan table (N int primary key, NguoiDungID int not null, SuatChieuID int not null, PhimID int not null, GheID int not null, Starts datetime2 not null);
;WITH HistoricalPlan AS (
    SELECT c.N, c.NguoiDungID, ((c.N - 1) % 12) + 1 AS ShowN, ((c.N - 1) / 12) + 1 AS SeatN
    FROM @Customers c WHERE c.N <= 100
), AvailableSeats AS (
    SELECT ps.N AS ShowN, g.GheID, ROW_NUMBER() OVER (PARTITION BY ps.N ORDER BY g.GheID) AS SeatN
    FROM @PastShows ps
    JOIN dbo.GHE g ON g.PhongID = ps.PhongID AND g.TrangThai = N'Hoạt động'
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID
        WHERE d.SuatChieuID = ps.SuatChieuID AND v.GheID = g.GheID AND v.TrangThai <> N'Đã hủy'
    )
)
INSERT @PastPlan(N, NguoiDungID, SuatChieuID, PhimID, GheID, Starts)
SELECT HistoricalPlan.N, HistoricalPlan.NguoiDungID, ps.SuatChieuID, ps.PhimID, AvailableSeats.GheID, ps.Starts
FROM HistoricalPlan
JOIN @PastShows ps ON ps.N = HistoricalPlan.ShowN
JOIN AvailableSeats ON AvailableSeats.ShowN = HistoricalPlan.ShowN AND AvailableSeats.SeatN = HistoricalPlan.SeatN;

INSERT dbo.DONDATVE(NguoiDungID, SuatChieuID, KhuyenMaiID, NgayDat, TongTienVe, TongTienDoAn, TienGiamGia, TrangThai, HanGiuCho)
SELECT NguoiDungID, SuatChieuID, NULL, DATEADD(DAY, -3, Starts),
       dbo.fn_TinhGiaVe(SuatChieuID, GheID), 0, 0, N'Hoàn thành', NULL
FROM @PastPlan;

INSERT @PastOrders(N, DonDatVeID, NguoiDungID, SuatChieuID, PhimID, GheID)
SELECT p.N, d.DonDatVeID, p.NguoiDungID, p.SuatChieuID, p.PhimID, p.GheID
FROM @PastPlan p
JOIN dbo.DONDATVE d ON d.NguoiDungID = p.NguoiDungID
                       AND d.SuatChieuID = p.SuatChieuID
                       AND d.NgayDat = DATEADD(DAY, -3, p.Starts);

IF (SELECT COUNT(*) FROM @PastOrders) <> 100
    THROW 51120, 'Historical order plan could not reserve 100 unique seats.', 1;

INSERT dbo.CHITIETVE(DonDatVeID, GheID, GiaVe, MaVe, TrangThai)
SELECT DonDatVeID, GheID, dbo.fn_TinhGiaVe(SuatChieuID, GheID), CONCAT('VOL-H-', DonDatVeID), N'Đã sử dụng'
FROM @PastOrders;

INSERT dbo.THANHTOAN(DonDatVeID, PhuongThuc, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai, GhiChu)
SELECT p.DonDatVeID, N'TIEN_MAT', DATEADD(MINUTE, 5, d.NgayDat), DATEADD(MINUTE, 8, d.NgayDat), CONCAT('VOL-HIST-', p.DonDatVeID), N'Thành công', N'Historical completed payment'
FROM @PastOrders p JOIN dbo.DONDATVE d ON d.DonDatVeID = p.DonDatVeID;

INSERT dbo.DANHGIAPHIM(PhimID, NguoiDungID, SoSao, NoiDung, NgayDanhGia)
SELECT PhimID, NguoiDungID, (N % 5) + 1, CONCAT(N'Đánh giá dữ liệu kiểm thử #', N), @Now
FROM @PastOrders;

DECLARE @Complaints table (N int primary key, KhieuNaiID int not null unique);
INSERT dbo.KHIEUNAI(NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai)
SELECT p.NguoiDungID, p.DonDatVeID, N'Dịch vụ', CONCAT(N'Phản hồi dữ liệu kiểm thử #', p.N),
       N'Khiếu nại được tạo để kiểm thử danh sách, lọc và lịch sử xử lý.',
       CASE p.N % 4 WHEN 0 THEN N'Cao' WHEN 1 THEN N'Trung bình' WHEN 2 THEN N'Thấp' ELSE N'Khẩn cấp' END,
       @Now, N'Mới'
FROM @PastOrders p WHERE p.N <= 60;

INSERT @Complaints(N, KhieuNaiID)
SELECT p.N, complaint.KhieuNaiID
FROM @PastOrders p
JOIN dbo.KHIEUNAI complaint ON complaint.NguoiDungID = p.NguoiDungID
                            AND complaint.DonDatVeID = p.DonDatVeID
                            AND complaint.TieuDe = CONCAT(N'Phản hồi dữ liệu kiểm thử #', p.N)
WHERE p.N <= 60;

INSERT dbo.XULY_KHIEUNAI(KhieuNaiID, NguoiXuLyID, NoiDungXuLy, NgayXuLy, TrangThaiSauXuLy)
SELECT KhieuNaiID, @SupportID, N'Đã ghi nhận và xử lý bởi seed kiểm thử.', DATEADD(MINUTE, N, @Now),
       CASE N % 3 WHEN 0 THEN N'Đã giải quyết' WHEN 1 THEN N'Đang xử lý' ELSE N'Đã đóng' END
FROM @Complaints WHERE N <= 45;

-- Payment amount is derived from the immutable order snapshot.  Keep loyalty
-- balances aligned with the successful completed/paid transactions.
UPDATE profileRow
SET DiemTichLuy = points.TotalPoints
FROM dbo.HOSOKHACHHANG profileRow
JOIN (
    SELECT d.NguoiDungID,
           CONVERT(int, SUM(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) / 1000) AS TotalPoints
    FROM dbo.DONDATVE d
    JOIN @Customers c ON c.NguoiDungID = d.NguoiDungID
    WHERE d.TrangThai IN (N'Đã thanh toán', N'Hoàn thành')
    GROUP BY d.NguoiDungID
) points ON points.NguoiDungID = profileRow.NguoiDungID;

IF (SELECT COUNT(*) FROM dbo.NGUOIDUNG) < 200 OR (SELECT COUNT(*) FROM dbo.DONDATVE) < 500
   OR (SELECT COUNT(*) FROM dbo.SUATCHIEU) < 500 OR (SELECT COUNT(*) FROM dbo.DANHGIAPHIM) < 100
   OR (SELECT COUNT(*) FROM dbo.KHIEUNAI) < 50
    THROW 51120, 'Volume seed target counts were not reached.', 1;

COMMIT TRANSACTION;
PRINT 'PASS realistic volume seed: customers, shows, transactions, reviews and complaints.';
