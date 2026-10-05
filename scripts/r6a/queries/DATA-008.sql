-- Counters are not equated to total surviving orders; compare multiple lifecycle subsets.
SELECT k.KhuyenMaiID,k.LoaiGiamGia,k.GiaTriGiam,k.SoLuong,k.SoLuongDaDung,k.TrangThai,
       k.NgayBatDau,k.NgayKetThuc,
       (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.KhuyenMaiID=k.KhuyenMaiID) AS allSurvivingOrders,
       (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.KhuyenMaiID=k.KhuyenMaiID AND d.TrangThai=N'Chờ thanh toán') AS pendingOrdersIncludingExpiredHolds,
       (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.KhuyenMaiID=k.KhuyenMaiID AND d.TrangThai=N'Chờ thanh toán' AND d.HanGiuCho>@AuditNow) AS liveHolds,
       (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.KhuyenMaiID=k.KhuyenMaiID AND d.TrangThai IN(N'Đã thanh toán',N'Hoàn thành')) AS paidOrCompletedOrders,
       (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.KhuyenMaiID=k.KhuyenMaiID AND d.TrangThai IN(N'Đã hủy',N'Hết hạn',N'Hoàn tiền')) AS releasedOrRefundedOrders,
       (SELECT COUNT(*) FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.KhuyenMaiID=k.KhuyenMaiID AND t.TrangThai=N'Thành công') AS successfulPayments,
       (SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID WHERE d.KhuyenMaiID=k.KhuyenMaiID) AS compensatedOrders
FROM dbo.KHUYENMAI k ORDER BY k.KhuyenMaiID;

SELECT d.KhuyenMaiID,d.DonDatVeID,d.TrangThai,d.TienGiamGia,d.NgayDat,d.HanGiuCho,
       (SELECT COUNT(*) FROM dbo.THANHTOAN t WHERE t.DonDatVeID=d.DonDatVeID AND t.TrangThai=N'Thành công') AS successfulPayments,
       (SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT b WHERE b.DonDatVeID=d.DonDatVeID) AS compensationEvents
FROM dbo.DONDATVE d WHERE d.KhuyenMaiID IS NOT NULL ORDER BY d.KhuyenMaiID,d.DonDatVeID;
