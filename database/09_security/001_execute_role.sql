-- DEV connects as sa from environment. Keep the EXECUTE-only production role.
CREATE ROLE [db_executor];
GRANT EXECUTE ON SCHEMA::dbo TO [db_executor];
DENY SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO [db_executor];
GO
-- Map an existing application login, without creating/resetting any server password.
IF SUSER_ID(N'CinemaAppUser') IS NOT NULL
BEGIN
 CREATE USER [CinemaAppUser] FOR LOGIN [CinemaAppUser];
 ALTER ROLE [db_executor] ADD MEMBER [CinemaAppUser];
END;
GO
