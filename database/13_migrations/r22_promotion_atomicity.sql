:on error exit
-- Existing modules only; SQL-owned transaction supplied by scripts/r22/deploy.mjs.
USE CinemaBookingDB;
GO
:r ./08_procedures/public/sp_Promotion_Validate.sql
:r ./08_procedures/booking/sp_Booking_Create.sql
:r ./08_procedures/admin/sp_Admin_Promotion_Delete.sql
