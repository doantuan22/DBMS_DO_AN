USE master;
GO
IF DB_ID(N'CinemaBookingDB') IS NOT NULL THROW 51000, 'Database exists: use db:reset for a destructive rebuild.', 1;
GO
CREATE DATABASE [CinemaBookingDB] COLLATE Vietnamese_CI_AS;
GO
