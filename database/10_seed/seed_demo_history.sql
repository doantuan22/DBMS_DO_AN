-- Historical order chain for the local synthetic demo seed only.
-- The runner owns the transaction and binds @HistoryJson; never execute this file standalone.
SET NOCOUNT ON;

SELECT j.ordinal, j.customerId, j.showtimeId, j.orderStatus,
  DATEADD(second, -(900 + j.ordinal), s.ThoiGianBatDau) AS orderTime,
  j.ticketJson, j.foodJson
INTO #SeedOrders
FROM OPENJSON(@HistoryJson) WITH (
  ordinal int '$.ordinal', customerId int '$.customerId', showtimeId int '$.showtimeId',
  orderStatus nvarchar(50) '$.status', ticketJson nvarchar(max) '$.ticketSeats' AS JSON,
  foodJson nvarchar(max) '$.foodItems' AS JSON
) j JOIN dbo.SUATCHIEU s ON s.SuatChieuID=j.showtimeId;

SELECT o.ordinal, g.GheID, dbo.fn_TinhGiaVe(o.showtimeId, g.GheID) AS GiaVe,
  CASE WHEN o.orderStatus=N'Hoàn thành' THEN N'Đã sử dụng' ELSE N'Đã hủy' END AS TrangThai
INTO #SeedTickets
FROM #SeedOrders o CROSS APPLY OPENJSON(o.ticketJson) WITH (GheID int '$') g;

SELECT o.ordinal, p.SanPhamID, f.Quantity AS SoLuong, p.Gia AS DonGia
INTO #SeedFoods
FROM #SeedOrders o CROSS APPLY OPENJSON(o.foodJson) WITH (ProductID int '$.ProductID', Quantity int '$.Quantity') f
JOIN dbo.SANPHAM p ON p.SanPhamID=f.ProductID;

SELECT o.ordinal, ISNULL(t.TongTienVe,0) AS TongTienVe, ISNULL(f.TongTienDoAn,0) AS TongTienDoAn
INTO #SeedTotals
FROM #SeedOrders o
OUTER APPLY (SELECT SUM(GiaVe) AS TongTienVe FROM #SeedTickets WHERE ordinal=o.ordinal) t
OUTER APPLY (SELECT SUM(SoLuong*DonGia) AS TongTienDoAn FROM #SeedFoods WHERE ordinal=o.ordinal) f;

INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,KhuyenMaiID,NgayDat,TongTienVe,TongTienDoAn,TienGiamGia,TrangThai,HanGiuCho,LyDoHuy,ThongBaoHuy,DiemSuDung)
SELECT o.customerId,o.showtimeId,NULL,o.orderTime,t.TongTienVe,t.TongTienDoAn,0,o.orderStatus,NULL,
  CASE WHEN o.orderStatus=N'Đã hủy' THEN N'Khách hủy trong dữ liệu lịch sử mô phỏng.' ELSE NULL END,
  NULL,0
FROM #SeedOrders o JOIN #SeedTotals t ON t.ordinal=o.ordinal;

SELECT o.ordinal,d.DonDatVeID,o.customerId,o.showtimeId,o.orderTime,o.orderStatus
INTO #SeedOrderMap
FROM #SeedOrders o JOIN dbo.DONDATVE d
  ON d.NguoiDungID=o.customerId AND d.SuatChieuID=o.showtimeId AND d.NgayDat=o.orderTime;
IF (SELECT COUNT(*) FROM #SeedOrderMap)<>250 THROW 50911,N'Không ánh xạ đủ đơn lịch sử seed.',1;

INSERT dbo.CHITIETVE(DonDatVeID,GheID,GiaVe,MaVe,TrangThai)
SELECT m.DonDatVeID,t.GheID,t.GiaVe,
  CONCAT('DEMO-HIST-',RIGHT(CONCAT('0000',m.ordinal),4),'-',ROW_NUMBER() OVER(PARTITION BY m.ordinal ORDER BY t.GheID)),t.TrangThai
FROM #SeedOrderMap m JOIN #SeedTickets t ON t.ordinal=m.ordinal;
INSERT dbo.CHITIETDOAN(DonDatVeID,SanPhamID,SoLuong,DonGia)
SELECT m.DonDatVeID,f.SanPhamID,f.SoLuong,f.DonGia FROM #SeedOrderMap m JOIN #SeedFoods f ON f.ordinal=m.ordinal;

INSERT dbo.THANHTOAN(DonDatVeID,PhuongThuc,NgayTao,NgayThanhToan,MaGiaoDich,TrangThai,GhiChu)
SELECT m.DonDatVeID,CASE m.ordinal%3 WHEN 0 THEN N'VNPAY' WHEN 1 THEN N'MOMO' ELSE N'ZALOPAY' END,
  DATEADD(minute,1,m.orderTime),NULL,CONCAT('DEMO-HFAIL-',RIGHT(CONCAT('0000',m.ordinal),4)),N'Thất bại',
  N'Lần thử thanh toán mô phỏng thất bại; không phát sinh giao dịch thật.'
FROM #SeedOrderMap m WHERE m.orderStatus=N'Hoàn thành' AND m.ordinal%5=0;
INSERT dbo.THANHTOAN(DonDatVeID,PhuongThuc,NgayTao,NgayThanhToan,MaGiaoDich,TrangThai,GhiChu)
SELECT m.DonDatVeID,CASE m.ordinal%3 WHEN 0 THEN N'VNPAY' WHEN 1 THEN N'MOMO' ELSE N'ZALOPAY' END,
  DATEADD(minute,2,m.orderTime),DATEADD(minute,4,m.orderTime),CONCAT('DEMO-HOK-',RIGHT(CONCAT('0000',m.ordinal),4)),N'Thành công',
  N'Thanh toán mô phỏng thành công; không phát sinh giao dịch tiền thật.'
FROM #SeedOrderMap m WHERE m.orderStatus=N'Hoàn thành';

UPDATE h SET DiemTichLuy=ISNULL(p.Points,0)
FROM dbo.HOSOKHACHHANG h OUTER APPLY (
  SELECT SUM(CONVERT(int,(d.TongTienVe+d.TongTienDoAn-d.TienGiamGia)/1000)) AS Points
  FROM dbo.DONDATVE d JOIN dbo.THANHTOAN t ON t.DonDatVeID=d.DonDatVeID AND t.TrangThai=N'Thành công'
  WHERE d.NguoiDungID=h.NguoiDungID
) p;
