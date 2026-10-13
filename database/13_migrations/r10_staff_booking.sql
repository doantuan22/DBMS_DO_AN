-- Áp dụng thay đổi schema hoặc module theo migration.
:on error exit

-- Select the deployment database explicitly. No DROP/reset/reseed or RBAC changes.
SET XACT_ABORT ON;

-- Chạy các bước kiểm tra database.
:r ./12_verify/verify_fixed_rbac.sql

-- Mở transaction để các bước ghi được xử lý cùng nhau.
BEGIN TRANSACTION;

GO

-- Tạo stored procedure theo từng nhóm chức năng.
:r ./08_procedures/staff_booking/sp_StaffBooking_Authorize.sql

:r ./08_procedures/staff_booking/sp_StaffBooking_LockShow.sql

:r ./08_procedures/staff_booking/sp_StaffBooking_Customers.sql

:r ./08_procedures/staff_booking/sp_StaffBooking_Options.sql

:r ./08_procedures/staff_booking/sp_StaffBooking_List.sql

:r ./08_procedures/staff_booking/sp_StaffBooking_Detail.sql

:r ./08_procedures/staff_booking/sp_StaffBooking_Create.sql

:r ./08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql

:r ./08_procedures/staff_booking/sp_StaffBooking_Cancel.sql

-- Chốt các thay đổi của transaction.
COMMIT TRANSACTION;

GO

PRINT 'Staff booking modules applied; Customer booking and fixed RBAC unchanged.';

GO
