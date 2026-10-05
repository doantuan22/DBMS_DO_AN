-- R7: update two existing SPs only; no table DDL or historical-data remediation.
-- Apply atomically with scripts/r7/deploy.mjs after fixture validation and backup.
:on error exit
:r ./08_procedures/manager/sp_Manager_Pricing_Update.sql
:r ./08_procedures/support/sp_Support_Complaint_GetOrderReference.sql
