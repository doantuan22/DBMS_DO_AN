IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
-- 14. Dynamic showtimes: one SQL Server UTC clock snapshot, business-local days.
-- SeedDate still belongs to base data; it never supplies the showtime clock.
DECLARE @NowUtc datetime2(7) = dbo.fn_BayGio();
DECLARE @Today date = dbo.fn_NgayKinhDoanh(@NowUtc);
IF EXISTS (SELECT 1 FROM dbo.SUATCHIEU)
    THROW 51004, 'Dynamic showtime seed requires empty showtime data; no refresh or repair is performed.', 1;

DECLARE @ShowtimePlan TABLE (
    SuatChieuID int PRIMARY KEY, PhimID int NOT NULL, PhongID int NOT NULL,
    DayOffset int NOT NULL, LocalHour int NOT NULL,
    DinhDang nvarchar(50) NOT NULL, GiaVeCoBan decimal(18,2) NOT NULL,
    TrangThai nvarchar(50) NOT NULL
);
INSERT INTO @ShowtimePlan (SuatChieuID, PhimID, PhongID, DayOffset, LocalHour, DinhDang, GiaVeCoBan, TrangThai) VALUES
-- Preserve IDs 1-5, movie/room/format/price/status and local slots for existing callers.
(1, 1, 1, -2, 18, N'2D', 80000, N'Hoàn thành'),
(2, 1, 1,  1,  2, N'2D', 85000, N'Mở bán'),
(3, 1, 2,  1,  5, N'IMAX', 120000, N'Mở bán'),
(4, 2, 4,  1,  3, N'2D', 80000, N'Mở bán'),
(5, 4, 6,  1,  4, N'2D', 75000, N'Mở bán'),
-- Seven more historical schedules; no order/ticket/payment or review eligibility.
(6, 2, 3, -7, 12, N'3D', 80000, N'Hoàn thành'),
(7, 3, 5, -7, 16, N'2D', 90000, N'Hoàn thành'),
(8, 4, 6, -7, 18, N'2D', 75000, N'Hoàn thành'),
(9, 3, 2, -3, 14, N'IMAX', 120000, N'Hoàn thành'),
(10, 2, 4, -3, 18, N'ScreenX', 80000, N'Hoàn thành'),
(11, 4, 3, -1, 12, N'3D', 75000, N'Hoàn thành'),
(12, 2, 5, -1, 18, N'2D', 80000, N'Hoàn thành'),
-- Six future shows per day (+1/+2/+3/+7), one per room per day.
(13, 3, 3, 1, 12, N'3D', 90000, N'Mở bán'),
(14, 2, 5, 1, 18, N'2D', 80000, N'Mở bán'),
(15, 4, 1, 2, 18, N'2D', 75000, N'Mở bán'),
(16, 3, 2, 2, 18, N'IMAX', 120000, N'Mở bán'),
(17, 2, 3, 2, 18, N'3D', 80000, N'Mở bán'),
(18, 1, 4, 2, 18, N'ScreenX', 85000, N'Mở bán'),
(19, 4, 5, 2, 18, N'2D', 75000, N'Mở bán'),
(20, 3, 6, 2, 18, N'2D', 90000, N'Mở bán'),
(21, 2, 1, 3, 18, N'2D', 80000, N'Mở bán'),
(22, 4, 2, 3, 18, N'IMAX', 120000, N'Mở bán'),
(23, 1, 3, 3, 18, N'3D', 85000, N'Mở bán'),
(24, 3, 4, 3, 18, N'ScreenX', 90000, N'Mở bán'),
(25, 2, 5, 3, 18, N'2D', 80000, N'Mở bán'),
(26, 1, 6, 3, 18, N'2D', 85000, N'Mở bán'),
(27, 3, 1, 7, 18, N'2D', 90000, N'Mở bán'),
(28, 2, 2, 7, 18, N'IMAX', 120000, N'Mở bán'),
(29, 4, 3, 7, 18, N'3D', 75000, N'Mở bán'),
(30, 1, 4, 7, 18, N'ScreenX', 85000, N'Mở bán'),
(31, 3, 5, 7, 18, N'2D', 90000, N'Mở bán'),
(32, 4, 6, 7, 18, N'2D', 75000, N'Mở bán');

IF EXISTS (
    SELECT 1 FROM @ShowtimePlan showPlan
    LEFT JOIN dbo.PHIM p ON p.PhimID = showPlan.PhimID
    LEFT JOIN dbo.PHONGCHIEU pc ON pc.PhongID = showPlan.PhongID
    LEFT JOIN dbo.RAPCHIEUPHIM r ON r.RapID = pc.RapID
    WHERE p.PhimID IS NULL OR pc.PhongID IS NULL OR r.RapID IS NULL
       OR p.ThoiLuong <= 0 OR p.ThoiLuong > 480
       OR (showPlan.DayOffset > 0 AND (
           p.TrangThai = N'Ngừng chiếu' OR pc.TrangThai <> N'Hoạt động'
           OR r.TrangThai <> N'Hoạt động'
           OR NOT EXISTS (SELECT 1 FROM dbo.GHE g WHERE g.PhongID = pc.PhongID AND g.TrangThai = N'Hoạt động')
       ))
)
    THROW 51004, 'Dynamic showtime seed requires valid movies, active future rooms/cinemas and active seats.', 1;

DECLARE @ShowtimeRows TABLE (
    SuatChieuID int PRIMARY KEY, PhimID int NOT NULL, PhongID int NOT NULL,
    ThoiGianBatDau datetime2(7) NOT NULL, ThoiGianKetThuc datetime2(7) NOT NULL,
    DinhDang nvarchar(50) NOT NULL, GiaVeCoBan decimal(18,2) NOT NULL,
    TrangThai nvarchar(50) NOT NULL
);
INSERT INTO @ShowtimeRows (SuatChieuID, PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai)
SELECT showPlan.SuatChieuID, showPlan.PhimID, showPlan.PhongID, slot.StartUtc,
       DATEADD(MINUTE, p.ThoiLuong, slot.StartUtc), showPlan.DinhDang, showPlan.GiaVeCoBan, showPlan.TrangThai
FROM @ShowtimePlan showPlan
JOIN dbo.PHIM p ON p.PhimID = showPlan.PhimID
CROSS APPLY (SELECT dbo.fn_UtcTuGioRap(
    DATEADD(HOUR, showPlan.LocalHour, CONVERT(datetime2(7), DATEADD(DAY, showPlan.DayOffset, @Today)))
) AS StartUtc) slot;

-- Reject stale/custom SeedDate release windows rather than changing base movies.
IF EXISTS (
    SELECT 1 FROM @ShowtimeRows s JOIN dbo.PHIM p ON p.PhimID = s.PhimID
    WHERE dbo.fn_NgayKinhDoanh(s.ThoiGianBatDau) < p.NgayKhoiChieu
       OR (p.NgayKetThuc IS NOT NULL AND dbo.fn_NgayKinhDoanh(s.ThoiGianBatDau) > p.NgayKetThuc)
       OR s.ThoiGianKetThuc <= s.ThoiGianBatDau
       OR (s.TrangThai = N'Hoàn thành' AND s.ThoiGianKetThuc >= @NowUtc)
       OR (s.TrangThai = N'Mở bán' AND s.ThoiGianBatDau <= @NowUtc)
)
    THROW 51004, 'Dynamic showtime dates must be past/future as planned and inside base movie release windows; check SeedDate against the DB clock.', 1;

-- Keep the existing overlap trigger enabled for this single physical insert.
SET IDENTITY_INSERT dbo.SUATCHIEU ON;
BEGIN TRY
    INSERT INTO dbo.SUATCHIEU (SuatChieuID, PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai)
    SELECT SuatChieuID, PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai FROM @ShowtimeRows;
    SET IDENTITY_INSERT dbo.SUATCHIEU OFF;
END TRY
BEGIN CATCH
    SET IDENTITY_INSERT dbo.SUATCHIEU OFF;
    THROW;
END CATCH;

-- Validate the persisted future rows with the authoritative R2 view, before caller COMMIT.
IF EXISTS (
    SELECT 1 FROM @ShowtimeRows s
    LEFT JOIN dbo.vw_LichChieuChiTiet v ON v.SuatChieuID = s.SuatChieuID
    WHERE s.TrangThai = N'Mở bán' AND (v.SuatChieuID IS NULL OR v.IsBookable <> 1)
)
    THROW 51004, 'Dynamic future showtimes failed the current DB bookability contract.', 1;

END;
GO
