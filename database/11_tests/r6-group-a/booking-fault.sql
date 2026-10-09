-- Temporary fault probe, installed only in the guarded disposable target.
CREATE TRIGGER dbo.R6A_BookingFault ON dbo.CHITIETDOAN AFTER INSERT AS
BEGIN
 SET NOCOUNT ON;
 IF NOT EXISTS(SELECT 1 FROM inserted i JOIN dbo.DONDATVE d ON d.DonDatVeID=i.DonDatVeID
 JOIN dbo.KHUYENMAI p ON p.KhuyenMaiID=d.KhuyenMaiID
 WHERE p.SoLuongDaDung=1 AND (SELECT COUNT(*) FROM dbo.CHITIETVE v WHERE v.DonDatVeID=d.DonDatVeID)=2)
  THROW 51062,'R6 fault precondition: expected order/tickets/promotion consumption.',1;
 THROW 51061,'R6 injected failure AFTER order, tickets, food and promotion consumption.',1;
END;
