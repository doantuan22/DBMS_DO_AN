-- Historical R5 deployment used a phase runner that has since been retired.
-- No table/index/constraint changes; existing data and historical anomalies are preserved.
:r ../06_views/vw_ThongKePhim.sql
:r ../08_procedures/admin/sp_Admin_Cinema_Update.sql
:r ../08_procedures/admin/sp_Admin_Actor_Create.sql
:r ../08_procedures/admin/sp_Admin_Actor_Update.sql
:r ../08_procedures/auth/sp_Auth_RegisterCustomer.sql
:r ../08_procedures/auth/sp_User_UpdateProfile.sql
:r ../08_procedures/admin/sp_Admin_User_Create.sql
:r ../08_procedures/admin/sp_Admin_Assignment_Create.sql
:r ../08_procedures/admin/usp_Admin_Assignment_Update.sql
:r ../08_procedures/booking/sp_Booking_Create.sql
:r ../08_procedures/admin/sp_Admin_Product_Update.sql
:r ../08_procedures/admin/sp_Admin_Movie_Update.sql
:r ../08_procedures/admin/sp_Admin_User_UpdateStatus.sql
