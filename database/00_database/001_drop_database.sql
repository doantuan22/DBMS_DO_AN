-- Retired safety stub. The official primary database must never be dropped by
-- a repository reset script. Do not replace this guard with a DROP DATABASE.
:on error exit
;THROW 51991, N'Physical database drops are disabled for the primary CinemaBookingDB.', 1;
GO
