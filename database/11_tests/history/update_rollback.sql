-- Test-only triggers, installed and dropped by guarded disposable runners.
CREATE TRIGGER dbo.R32_ShowFailure ON dbo.SUATCHIEU AFTER UPDATE AS
BEGIN
 SET NOCOUNT ON;
 DECLARE @Target INT=TRY_CONVERT(INT,SESSION_CONTEXT(N'R32_Show'));
 IF EXISTS(SELECT 1 FROM inserted WHERE SuatChieuID=@Target)
 BEGIN
  DECLARE @Price DECIMAL(18,2)=(SELECT GiaVeCoBan FROM inserted WHERE SuatChieuID=@Target);
  EXEC sys.sp_set_session_context @key=N'R32_ObservedPrice',@value=@Price;
  THROW 51032,'Disposable show failure after write.',1;
 END;
END;
GO
CREATE TRIGGER dbo.R32_SeatFailure ON dbo.GHE AFTER UPDATE AS
BEGIN
 SET NOCOUNT ON;
 DECLARE @Target INT=TRY_CONVERT(INT,SESSION_CONTEXT(N'R32_Seat'));
 IF EXISTS(SELECT 1 FROM inserted WHERE GheID=@Target)
 BEGIN
  DECLARE @Type NVARCHAR(50)=(SELECT LoaiGhe FROM inserted WHERE GheID=@Target);
  EXEC sys.sp_set_session_context @key=N'R32_ObservedType',@value=@Type;
  THROW 51033,'Disposable seat failure after write.',1;
 END;
END;
GO
