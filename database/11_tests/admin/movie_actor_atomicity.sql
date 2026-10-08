-- Disposable-only injected write-phase failure. Installed/dropped by scripts/r31/sql-tests.mjs.
-- The session target ensures other movies cannot trigger this test failure.
CREATE TRIGGER dbo.R31_InjectFailure ON dbo.PHIM_DIENVIEN AFTER INSERT AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Target INT = TRY_CONVERT(INT, SESSION_CONTEXT(N'R31_Target'));
    IF EXISTS (SELECT 1 FROM inserted WHERE PhimID = @Target)
    BEGIN
        DECLARE @OldRemaining INT = (SELECT COUNT(*) FROM dbo.PHIM_DIENVIEN
            WHERE PhimID = @Target AND DienVienID IN (
                TRY_CONVERT(INT, SESSION_CONTEXT(N'R31_Old1')),
                TRY_CONVERT(INT, SESSION_CONTEXT(N'R31_Old2')),
                TRY_CONVERT(INT, SESSION_CONTEXT(N'R31_Old3'))));
        DECLARE @NewInserted INT = (SELECT COUNT(*) FROM inserted WHERE PhimID = @Target);
        EXEC sys.sp_set_session_context @key=N'R31_OldRemaining', @value=@OldRemaining;
        EXEC sys.sp_set_session_context @key=N'R31_NewInserted', @value=@NewInserted;
        THROW 51031, 'Disposable failure after old cast DELETE and new cast INSERT.', 1;
    END;
END;
