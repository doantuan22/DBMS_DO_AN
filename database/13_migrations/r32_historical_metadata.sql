:on error exit
-- Existing modules only; atomic DDL transaction supplied by scripts/r32/deploy.mjs.
USE CinemaBookingDB;
GO
:r ./08_procedures/manager/sp_Manager_Showtime_Update.sql
:r ./08_procedures/admin/usp_Admin_Showtime_Update.sql
:r ./08_procedures/manager/sp_Manager_Seat_Update.sql
:r ./08_procedures/admin/usp_Admin_Seat_Update.sql
