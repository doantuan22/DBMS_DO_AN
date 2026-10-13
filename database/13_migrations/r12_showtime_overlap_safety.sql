-- Áp dụng thay đổi schema hoặc module theo migration.
:on error exit

-- R1.2: ALTER existing modules only; room-delete R1.1, schema and trigger unchanged.

-- Tạo stored procedure theo từng nhóm chức năng.
:r ./08_procedures/system/sp_Showtime_ValidateTimes.sql

:r ./08_procedures/system/sp_Showtime_CancelCascade.sql

:r ./08_procedures/manager/sp_Manager_Showtime_Create.sql

:r ./08_procedures/manager/sp_Manager_Showtime_Update.sql

:r ./08_procedures/admin/usp_Admin_Showtime_Create.sql

:r ./08_procedures/admin/usp_Admin_Showtime_Update.sql
