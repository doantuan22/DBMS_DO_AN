-- Offline R4.6 fault injection, disposable database only; always dropped by runner.
-- Own fixture identity in SESSION_CONTEXT prevents affecting unrelated rows.
CREATE TRIGGER dbo.R46_ProfileFailure ON dbo.HOSOKHACHHANG AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted WHERE NguoiDungID = TRY_CONVERT(INT, SESSION_CONTEXT(N'R46FailureID')))
       OR EXISTS (SELECT 1 FROM inserted i JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=i.NguoiDungID
                  WHERE n.Email='r46-0@example.test' AND n.HoTen=N'R46 HTTP fault')
    BEGIN
        DECLARE @ObservedName NVARCHAR(100);
        SELECT @ObservedName = HoTen FROM dbo.NGUOIDUNG
        WHERE NguoiDungID = TRY_CONVERT(INT, SESSION_CONTEXT(N'R46FailureID'));
        EXEC sys.sp_set_session_context @key = N'R46ObservedName', @value = @ObservedName;
        THROW 51046, N'R46 fixture failure after common update.', 1;
    END
END;
GO
