-- R7: update two existing SPs only; no table DDL or historical-data remediation.
-- Historical deployment used a phase runner that has since been retired; current deployment tooling is documented in database/README.md.
:on error exit
:r ./08_procedures/manager/sp_Manager_Pricing_Update.sql
:r ./08_procedures/support/sp_Support_Complaint_GetOrderReference.sql
