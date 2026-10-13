:on error exit
-- Historical R2.2 deployment used a phase runner that has since been retired.
USE CinemaBookingDB;
GO
:r ./08_procedures/public/sp_Promotion_Validate.sql
:r ./08_procedures/booking/sp_Booking_Create.sql
:r ./08_procedures/admin/sp_Admin_Promotion_Delete.sql
