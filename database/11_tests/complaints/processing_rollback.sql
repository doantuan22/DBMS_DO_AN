-- Test-only fault, installed/dropped by guarded disposable runners.
CREATE TRIGGER dbo.R33_ParentFailure ON dbo.KHIEUNAI AFTER UPDATE AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM inserted WHERE KhieuNaiID=TRY_CONVERT(INT,SESSION_CONTEXT(N'R33_Target')))
 BEGIN
  DECLARE @Observed NVARCHAR(4000)=(SELECT KhieuNaiID,TrangThai FROM inserted ORDER BY KhieuNaiID FOR JSON PATH);
  EXEC sys.sp_set_session_context @key=N'R33_Observed',@value=@Observed;
  THROW 51034,'Disposable complaint failure after parent update.',1;
 END;
END;
GO
