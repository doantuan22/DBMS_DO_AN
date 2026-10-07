:on error exit
-- R1.1: module-only migration; no schema/data/FK changes.
:r ./08_procedures/manager/sp_Manager_Room_Delete.sql
:r ./08_procedures/admin/usp_Admin_Room_Delete.sql
