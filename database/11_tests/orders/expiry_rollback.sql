-- Disposable offline R4.7 fault only; runner always drops this trigger.
CREATE TRIGGER dbo.R47_ExpiryFailure ON dbo.KHUYENMAI AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ID INT=TRY_CONVERT(INT,SESSION_CONTEXT(N'R47FailPromo'));
    IF EXISTS (SELECT 1 FROM inserted WHERE KhuyenMaiID=@ID AND MaCode='R47-DETAIL')
    BEGIN
        DECLARE @Expired INT=(SELECT COUNT(*) FROM dbo.DONDATVE d
            WHERE d.KhuyenMaiID=@ID AND d.TrangThai=N'Hết hạn'
            AND EXISTS(SELECT 1 FROM dbo.CHITIETVE v WHERE v.DonDatVeID=d.DonDatVeID AND v.TrangThai=N'Đã hủy'));
        DECLARE @Usage INT=(SELECT SoLuongDaDung FROM inserted WHERE KhuyenMaiID=@ID);
        EXEC sys.sp_set_session_context @key=N'R47ObservedExpired',@value=@Expired;
        EXEC sys.sp_set_session_context @key=N'R47ObservedUsage',@value=@Usage;
        THROW 51047,N'R47 fixture failure after expiry writes.',1;
    END
END;
GO
