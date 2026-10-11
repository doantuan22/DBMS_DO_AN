:on error exit
-- Select the deployment database explicitly. No DROP/reset/reseed or RBAC changes.
SET XACT_ABORT ON;
:r ./12_verify/verify_fixed_rbac.sql
BEGIN TRANSACTION;
GO
:r ./08_procedures/staff_booking/sp_StaffBooking_Authorize.sql
:r ./08_procedures/staff_booking/sp_StaffBooking_LockShow.sql
:r ./08_procedures/staff_booking/sp_StaffBooking_Customers.sql
:r ./08_procedures/staff_booking/sp_StaffBooking_Options.sql
:r ./08_procedures/staff_booking/sp_StaffBooking_List.sql
:r ./08_procedures/staff_booking/sp_StaffBooking_Detail.sql
:r ./08_procedures/staff_booking/sp_StaffBooking_Create.sql
:r ./08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql
:r ./08_procedures/staff_booking/sp_StaffBooking_Cancel.sql
COMMIT TRANSACTION;
GO
PRINT 'Staff booking modules applied; Customer booking and fixed RBAC unchanged.';
GO
