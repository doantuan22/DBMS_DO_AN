-- Áp dụng thay đổi schema hoặc module theo migration.
:on error exit

-- R1.1: module-only migration; no schema/data/FK changes.

-- Tạo stored procedure theo từng nhóm chức năng.
:r ./08_procedures/manager/sp_Manager_Room_Delete.sql

:r ./08_procedures/admin/usp_Admin_Room_Delete.sql
