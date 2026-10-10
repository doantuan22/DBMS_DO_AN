:on error exit
-- Historical R3.2 deployment used a phase runner that has since been retired.
USE CinemaBookingDB;
GO
:r ./08_procedures/manager/sp_Manager_Showtime_Update.sql
:r ./08_procedures/admin/usp_Admin_Showtime_Update.sql
:r ./08_procedures/manager/sp_Manager_Seat_Update.sql
:r ./08_procedures/admin/usp_Admin_Seat_Update.sql
