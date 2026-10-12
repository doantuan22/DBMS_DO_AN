IF SESSION_CONTEXT(N'SeedV2Profile')=N'demo-dynamic' AND NOT EXISTS(SELECT 1 FROM dbo.DONDATVE)
BEGIN
DECLARE @SelectedTarget nvarchar(128)=DB_NAME();
EXEC sys.sp_set_session_context @key=N'V2DisposableTarget',@value=@SelectedTarget;
EXEC sys.sp_set_session_context @key=N'V2PersistFixtures',@value=1;
:r ./10_seed/test_fixture/lifecycle-v2.sql
EXEC sys.sp_set_session_context @key=N'V2PersistFixtures',@value=NULL;
EXEC sys.sp_set_session_context @key=N'V2DisposableTarget',@value=NULL;
END;
GO
