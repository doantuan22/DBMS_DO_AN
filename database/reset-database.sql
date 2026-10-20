-- Retired safety stub. CinemaBookingDB is the long-lived primary database.
-- This file intentionally cannot DROP, recreate, truncate, or reseed any database.
:on error exit
;THROW 51990, N'Database reset is disabled. Use the approved, reviewed cleanup plan for CinemaBookingDB.', 1;
GO
