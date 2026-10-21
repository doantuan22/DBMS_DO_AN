# Main Database Audit Report

Generated UTC: 2026-10-21T13:29:19.044Z

Target verified from `backend/.env` and live query: **DoanTuanIT / CinemaBookingDB**, ONLINE. SQL Server 17.0.1145.4 (Standard Developer Edition (64-bit)); compatibility 170; recovery FULL.

## Conclusion

**DATABASE READY FOR SSMS DEMO.** The approved schedule trigger and exact independent-session SSMS race passed; all 78/78 persistent writers have successful Main paths; 21/21 trigger assertions, 142/142 constraint objects, the read-only function/view suite, restore, migration clone replay, and final Main integrity passed. No persistent business rows were left by the audit; rollback identity advances are recorded.

**FULL SYSTEM E2E VERIFIED: NOT CLAIMED.** The core HTTP-to-SP booking/payment drill is PASS (15/15 checks), but not every Backend route family was exercised over HTTP. No external payment provider or normal background worker was started; these limits do not block the Database SSMS demo status.

## Inventory and execution summary

- Files scanned under `database/`: **346** (298 SQL; 42 JS/MJS; extensions listed below).
- Application objects on Main: **29 tables, 147 procedures, 6 views, 21 functions, 9 triggers**. SQL Server diagram support artifacts are inventoried separately (11, including diagram keys).
- Main constraints: **29 primary keys, 11 unique constraints, 37 foreign keys + 65 CHECK constraints**; 0 disabled or untrusted.
- Main indexes: **71** (clustered/nonclustered, unique/composite/filtered details listed below); 0 disabled; 0 identical definitions; missing-index DMV suggestions at audit time: 0.
- Read-only function/view audit: **45/45 assertions PASS**, all 21 functions and all 6 views included.
- Stored procedures: **147/147 unique SPs runtime-invoked**; 78/78 persistent writers have successful transaction-backed paths; remaining procedures have read/report or validation/refusal runtime evidence.
- Trigger and constraint DML: 21/21 trigger assertions PASS across 9/9 triggers; 65/65 CHECK assertions and 79/79 PK/UQ/FK assertions PASS; distinct constraint objects covered 142/142.
- Transaction/concurrency: booking rollback PASS; same-seat, quota-one promotion, and independent schedule-overlap races PASS. The exact five SSMS schedule files ran across separate sessions: 6/6 assertions PASS.
- Restore drill: PASS; unique temporary restore target CinemaBookingDB_RestoreAudit_20261021111221_2c1ba6e6cf9e, inventory/count comparison and DBCC CHECKDB passed, exact temporary database dropped.
- Final integrity: PASS; Main/Test online, no open Main user transaction, DBCC CHECKDB and CHECKCONSTRAINTS clean, Main counts/identities match post-cleanup snapshot, restore target absent.
- SSMS demos: read-only functions/views/index and procedure files 45/45 and 14/14 PASS; trigger 21/21; CHECK 65/65; PK/UQ/FK 79/79; booking atomicity PASS; admin CRUD 16/16; schedule concurrency PASS.
- Seed/integrity verification: **PASS**; 29 tables matched the seed manifest, 0 orphan rows and 0 DBCC CHECKCONSTRAINTS violations.

## Database backup and recovery evidence

- Verified COPY_ONLY + CHECKSUM backup: `CinemaBookingDB_pre_ssms_schedule_20261021132218_A62F275D7259.bak` (4411392 bytes). `RESTORE VERIFYONLY WITH CHECKSUM` passed.
- Actual restore drill: **PASS** into unique temporary database CinemaBookingDB_RestoreAudit_20261021111221_2c1ba6e6cf9e; source object/table counts and DBCC CHECKDB passed. Only the exact generated temporary database was removed; Main and CinemaBookingDB_Test stayed online and unchanged.

## Findings and changes

- Fixed verifier expectations so SQL Server diagram helpers are treated as support objects rather than application objects.
- Added the missing current trigger event to the canonical trigger expectation; source and live metadata now match.
- Updated the seed verifier to locate time-sensitive showtime/hold fixtures relative to manifest generation, rather than requiring expired fixtures to remain live forever.
- Removed `sp_refreshsqlmodule` from the read-only procedure verifier because it can change module metadata; it now checks definition availability only.
- The only approved Main DDL change was the `TRG_SuatChieu_KiemTraTrungLich` concurrency fix. No other production schema or business rule was changed. DML fixtures were rolled back or removed; persistent row fingerprints and DBCC checks passed afterward.
- The SSMS schedule scripts were corrected for RCSI: Session B no longer expects to read A's uncommitted fixture, and the monitor now detects the waiting application lock through `sys.dm_tran_locks`. The final exact-script independent-session race passed; earlier harness failures remain preserved in separate evidence files.
- Backend API harness issues (health response oracle, login field casing, and serialized transaction requests) are documented in `.audit-output/main-backend-api-payment-drill_harness-attempts.json`. They were test-harness defects; no mutating API was called during those attempts, and the corrected 15/15 run passed.
- `main_readonly_demo.sql` no longer emits obsolete global NOT READY counts from its read-only-only execution scope.
- SQL Server parser-only check for the proposed trigger batch: PASS; PARSEONLY was used and no DDL statement executed.

## Runtime evidence

- `database/12_verify/verify_objects.sql`, `verify_schema.sql`, `verify_constraints.sql`, `verify_triggers.sql`, `verify_orphans.sql`, `verify_dependencies.sql`, `verify_security.sql`, `verify_seed.sql`, `verify_fixed_rbac.sql` and `verify_procedures.sql`: PASS on exact Main database.
- `database/10_seed/verify-seed.mjs`: PASS; report [SEED_DATA_VERIFICATION_REPORT.md](../../SEED_DATA_VERIFICATION_REPORT.md); machine evidence `.audit-output/seed-data-verification.json`.
- `database/14_audit/main_readonly_demo.sql`: PASS, 45/45 read-only assertions. It also emits all index definitions, 102 FK/CHECK rows, 14 trigger-event rows, missing-index candidates, duplicate-index signatures, usage since restart, IO/TIME and three actual-plan XML resultsets.
- `.audit-output/main-remaining-readonly-procedures.json`: PASS, 48/48 remaining read-only procedures. `.audit-output/main-procedure-success-coverage.json`: PASS, 78/78 persistent writer procedures with successful transaction-backed paths and per-procedure expected/actual evidence.
- `database/14_audit/main_trigger_demo.sql`: 21/21 assertions PASS, all nine triggers fired under valid, rejected, and multi-row sequential DML. Evidence `.audit-output/main-trigger-demo.json`.
- `main_constraint_demo.sql`: 65/65 CHECK violations rejected with exact constraint name. `main_key_fk_demo.sql`: 79/79 duplicate/missing-key cases rejected with exact object. Distinct 142/142 application constraints covered; DBCC and snapshots clean.
- `main_booking_atomicity_demo.sql`: PASS on Main; error 50410 after one-use promotion validation, promotion use/order/ticket/food all returned to zero, then outer fixture transaction rolled back. Evidence `.audit-output/main-booking-atomicity-ssms-demo.json`.
- `main_concurrency_drill.mjs`: same-seat, quota-one promotion, and schedule-overlap races PASS with separate SQL sessions and observed locks. Evidence `.audit-output/main-concurrency-drill.json`.
- Exact SSMS schedule scripts: A held its room application lock; B waited on `LCK_M_X`; after A committed, B received 50001 and its row was absent; exact cleanup and final fingerprints passed. Evidence `.audit-output/main-ssms-schedule-concurrency-demo.json`.
- Exact read-only SSMS files: `main_readonly_demo.sql` ran 45/45 assertions plus IO/TIME and three actual plans; `main_readonly_procedure_demo.sql` ran 14/14 result oracles. Evidence `.audit-output/main-ssms-readonly-demos.json`.
- `main_restore_drill.mjs`: actual restore PASS to a unique temporary target, then exact target dropped. Evidence `.audit-output/main-restore-drill.json`.
- Final Main integrity check: DBCC CHECKDB plus DBCC CHECKCONSTRAINTS returned no findings; Main and Test online, no open transactions, full table-count/identity snapshot matches post-cleanup baseline. Evidence `.audit-output/main-final-state.json`.
- Actual plans / representative view reads: 167 bookable-showtime rows, 310 order-history rows, 4 revenue rows. No physical reads in captured sample; logical reads were small (showtime plan used 6 SUATCHIEU, 8 PHONGCHIEU, 2 RAPCHIEUPHIM, 4 PHIM; history 5 DONDATVE; revenue 2 RAPCHIEUPHIM). Three actual execution plan XMLs were returned. No index change was warranted for this seeded workload.
- Backend/SP integration: 15/15 assertions PASS for health, seeded-customer login/RBAC, profile, seat listing, booking preview/create, order detail, simulated payment attempt/callback, invalid callback refusal, loyalty points, idempotency, rollback, and integrity. The runner imported createApp() directly on an ephemeral local port and did not import server.js or start the expiry worker. Evidence .audit-output/main-backend-api-payment-drill.json.
- HTTP-to-SP mapping was verified against Backend service code: `AUTH_LOGIN`; `USER_GET_CURRENT` and `RBAC_GET_PERMISSIONS_BY_USER`; `SEAT_LIST_BY_SHOWTIME`; `BOOKING_CREATE` with preview flag true/false; `ORDER_GET_DETAIL_BY_CUSTOMER`; `PAYMENT_CREATE_ATTEMPT`; `PAYMENT_UPDATE_RESULT`. Unsupported callback status returned HTTP 400 `INVALID_PAYMENT_RESULT` before a Stored Procedure call.
- Simulated successful payment: one 85,000-VND ticket; payment attempt amount matched; callback marked order/payment paid/success; 85 points were awarded once; repeated success callback did not award points again. Outer transaction rollback restored all persistent rows and the original loyalty balance.

## Scope and remaining limitations

- **Full System E2E:** not claimed. The core customer booking/payment flow was exercised through HTTP and SQL, but every Backend route family was not run end-to-end. No normal background worker was started.
- **External payment provider:** not exercised. The Backend callback/SP path was tested with a simulated successful provider response, as required for the DBMS demo scope.
- **Constraint positive matrix:** no isolated positive DML assertion was added for each of 142 constraints. All 142 objects have negative-DML coverage and positive paths are exercised across successful writer/CRUD/booking fixtures; no repeated family-wide matrix was needed for the demo scope.
- **Index/dependency scope:** all 71 indexes were catalogued; representative actual plans and STATISTICS IO/TIME found no change warranted, and the dependency verifier passed. Per-index synthetic benchmarks and execution of every possible dependency caller were not run because no workload evidence justified a change.
- **Restore and migration:** restore passed to a unique temporary target. Migration replay passed twice on a restored clone; migrations were not replayed on Main.

## Source file inventory

| Directory | Files |
|---|---:|
| `(root)` | 5 |
| `00_database` | 3 |
| `01_schema` | 1 |
| `02_tables` | 29 |
| `03_constraints` | 5 |
| `04_indexes` | 15 |
| `05_functions` | 21 |
| `06_views` | 6 |
| `07_triggers` | 9 |
| `08_procedures` | 147 |
| `09_security` | 1 |
| `10_seed` | 9 |
| `11_tests` | 33 |
| `12_verify` | 11 |
| `13_migrations` | 1 |
| `14_audit` | 50 |

| Extension | Files |
|---|---:|
| `.json` | 1 |
| `.md` | 5 |
| `.mjs` | 42 |
| `.sql` | 298 |

## Application tables

- `dbo.BANGGIA`
- `dbo.BOITHUONG_HUYSUAT`
- `dbo.CHITIETDOAN`
- `dbo.CHITIETVE`
- `dbo.DANHGIAPHIM`
- `dbo.DIENVIEN`
- `dbo.DONDATVE`
- `dbo.GHE`
- `dbo.HINHANH_RAPCHIEUPHIM`
- `dbo.HOSOKHACHHANG`
- `dbo.KHIEUNAI`
- `dbo.KHUYENMAI`
- `dbo.NGUOIDUNG`
- `dbo.PHANCONG_RAP`
- `dbo.PHIM`
- `dbo.PHIM_DIENVIEN`
- `dbo.PHIM_THELOAI`
- `dbo.PHONGCHIEU`
- `dbo.QUYEN`
- `dbo.RAPCHIEUPHIM`
- `dbo.SANPHAM`
- `dbo.SUATCHIEU`
- `dbo.THANHTOAN`
- `dbo.THELOAI`
- `dbo.TINNHAN_KHIEUNAI`
- `dbo.VAITRO`
- `dbo.VAITRO_QUYEN`
- `dbo.XULY_KHIEUNAI`
- `dbo.YEUCAU_CHUYENCAP`

## Stored procedures

- `dbo.sp_Admin_Actor_Create` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Actor_Create
- `dbo.sp_Admin_Actor_Delete` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Actor_Delete
- `dbo.sp_Admin_Actor_List` — runtime PASS (read-only call)
- `dbo.sp_Admin_Actor_Update` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Actor_Update
- `dbo.sp_Admin_Assignment_Create` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_PhanCongQuanLyRap; dbo.sp_PhanCongQuanLyRap delegates to dbo.sp_Admin_Assignment_Create
- `dbo.sp_Admin_Assignment_List` — runtime PASS (read-only call)
- `dbo.sp_Admin_Cinema_Create` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Cinema_Create
- `dbo.sp_Admin_Cinema_Delete` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Cinema_Delete
- `dbo.sp_Admin_Cinema_Update` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Cinema_Update
- `dbo.sp_Admin_Dashboard` — runtime PASS (initial read-only assertions)
- `dbo.sp_Admin_Genre_Create` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Genre_Create
- `dbo.sp_Admin_Genre_Delete` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Genre_Delete
- `dbo.sp_Admin_Genre_List` — runtime PASS (read-only call)
- `dbo.sp_Admin_Genre_Update` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Genre_Update
- `dbo.sp_Admin_MovieActor_Set` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_MovieActor_Set_set
- `dbo.sp_Admin_Movie_Create` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Movie_Create
- `dbo.sp_Admin_Movie_Delete` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Movie_Delete
- `dbo.sp_Admin_Movie_Update` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Movie_Update
- `dbo.sp_Admin_Permission_Create` — runtime PASS (read-only call)
- `dbo.sp_Admin_Permission_Delete` — runtime PASS (read-only call)
- `dbo.sp_Admin_Permission_List` — runtime PASS (read-only call)
- `dbo.sp_Admin_Permission_Update` — runtime PASS (read-only call)
- `dbo.sp_Admin_Product_Create` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Product_Create
- `dbo.sp_Admin_Product_Delete` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Product_Delete
- `dbo.sp_Admin_Product_Update` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Product_Update
- `dbo.sp_Admin_Promotion_Create` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Promotion_Create
- `dbo.sp_Admin_Promotion_Delete` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Promotion_Delete
- `dbo.sp_Admin_Promotion_List` — runtime PASS (read-only call)
- `dbo.sp_Admin_Promotion_Update` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_Promotion_Update
- `dbo.sp_Admin_Report_Revenue` — runtime PASS (initial read-only assertions)
- `dbo.sp_Admin_RolePermission_Set` — runtime PASS (read-only call)
- `dbo.sp_Admin_Role_Create` — runtime PASS (read-only call)
- `dbo.sp_Admin_Role_Delete` — runtime PASS (read-only call)
- `dbo.sp_Admin_Role_List` — runtime PASS (read-only call)
- `dbo.sp_Admin_Role_Update` — runtime PASS (read-only call)
- `dbo.sp_Admin_User_Create` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_User_Create
- `dbo.sp_Admin_User_List` — runtime PASS (read-only call)
- `dbo.sp_Admin_User_UpdateStatus` — successful mutation path PASS; .audit-output/main-admin-crud-success-smoke.json#sp_Admin_User_UpdateStatus_lock
- `dbo.sp_Auth_Login` — runtime PASS (read-only call)
- `dbo.sp_Auth_RegisterCustomer` — successful mutation path PASS; .audit-output/main-auth-success-smoke.json#sp_Auth_RegisterCustomer
- `dbo.sp_Booking_Create` — successful mutation path PASS; .audit-output/main-transactional-business-smoke.json#transactional_business_smoke_and_compatibility_aliases
- `dbo.sp_Cinema_GetImages` — runtime PASS (initial read-only assertions)
- `dbo.sp_Cinema_List` — runtime PASS (initial read-only assertions)
- `dbo.sp_Clock_GetNow` — runtime PASS (initial read-only assertions)
- `dbo.sp_Complaint_Assign_Admin` — successful mutation path PASS; .audit-output/main-complaint-workflow-smoke.json#sp_Complaint_Assign_Admin_success
- `dbo.sp_Complaint_Assign_Self` — successful mutation path PASS; .audit-output/main-complaint-workflow-smoke.json#sp_Complaint_Assign_Self_success
- `dbo.sp_Complaint_Chat_AddInternalNote` — successful mutation path PASS; .audit-output/main-complaint-workflow-smoke.json#sp_Complaint_Chat_AddInternalNote_success
- `dbo.sp_Complaint_Chat_List` — runtime PASS (read-only call)
- `dbo.sp_Complaint_Chat_Send` — successful mutation path PASS; .audit-output/main-complaint-workflow-smoke.json#sp_Complaint_Chat_Send_public_success
- `dbo.sp_Complaint_Create` — successful mutation path PASS; .audit-output/main-complaint-workflow-smoke.json#sp_Complaint_Create_success
- `dbo.sp_Complaint_GetByCustomer` — runtime PASS (read-only call)
- `dbo.sp_Complaint_ListByCustomer` — runtime PASS (read-only call)
- `dbo.sp_Complaint_Unassigned_List` — runtime PASS (read-only call)
- `dbo.sp_DatVe` — successful mutation path PASS; .audit-output/main-transactional-business-smoke.json#transactional_business_smoke_and_compatibility_aliases
- `dbo.sp_Escalation_Claim` — successful mutation path PASS; .audit-output/main-complaint-workflow-smoke.json#sp_Escalation_Claim_success
- `dbo.sp_Escalation_Create` — successful mutation path PASS; .audit-output/main-complaint-workflow-smoke.json#sp_Escalation_Create_success
- `dbo.sp_Escalation_GetDetail` — runtime PASS (read-only call)
- `dbo.sp_Escalation_List_Admin` — runtime PASS (read-only call)
- `dbo.sp_Escalation_List_CSKH` — runtime PASS (read-only call)
- `dbo.sp_Escalation_Process` — successful mutation path PASS; .audit-output/main-complaint-workflow-smoke.json#sp_Escalation_Process_success
- `dbo.sp_Genre_List` — runtime PASS (initial read-only assertions)
- `dbo.sp_Manager_Dashboard` — runtime PASS (initial read-only assertions)
- `dbo.sp_Manager_ListAssignedCinemas` — runtime PASS (initial read-only assertions)
- `dbo.sp_Manager_Pricing_Create` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_Manager_Pricing_Create
- `dbo.sp_Manager_Pricing_List` — runtime PASS (read-only call)
- `dbo.sp_Manager_Pricing_Update` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_Manager_Pricing_Update
- `dbo.sp_Manager_Revenue` — runtime PASS (read-only call)
- `dbo.sp_Manager_Room_Create` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_Manager_Room_Create
- `dbo.sp_Manager_Room_Delete` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_Manager_Room_Delete_with_showtime_history
- `dbo.sp_Manager_Room_List` — runtime PASS (read-only call)
- `dbo.sp_Manager_Room_Update` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_Manager_Room_Update
- `dbo.sp_Manager_Seat_BatchCreate` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_Manager_Seat_BatchCreate
- `dbo.sp_Manager_Seat_Create` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_Manager_Seat_Create
- `dbo.sp_Manager_Seat_Delete` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_Manager_Seat_Delete
- `dbo.sp_Manager_Seat_ListByRoom` — runtime PASS (read-only call)
- `dbo.sp_Manager_Seat_Update` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_Manager_Seat_Update
- `dbo.sp_Manager_Showtime_Cancel` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_Manager_Showtime_Cancel
- `dbo.sp_Manager_Showtime_Create` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_Manager_Showtime_Create
- `dbo.sp_Manager_Showtime_List` — runtime PASS (read-only call)
- `dbo.sp_Manager_Showtime_Update` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_Manager_Showtime_Update
- `dbo.sp_Movie_GetDetail` — runtime PASS (initial read-only assertions)
- `dbo.sp_Movie_List` — runtime PASS (initial read-only assertions)
- `dbo.sp_Order_Cancel` — successful mutation path PASS; .audit-output/main-transactional-business-smoke.json#transactional_business_smoke_and_compatibility_aliases
- `dbo.sp_Order_ExpirePending` — successful mutation path PASS; .audit-output/main-transactional-sql-regressions.json#points_booking_payment_expiry
- `dbo.sp_Order_GetDetailByCustomer` — runtime PASS (initial read-only assertions)
- `dbo.sp_Order_ListByCustomer` — runtime PASS (initial read-only assertions)
- `dbo.sp_Payment_CreateAttempt` — successful mutation path PASS; .audit-output/main-transactional-business-smoke.json#transactional_business_smoke_and_compatibility_aliases
- `dbo.sp_Payment_UpdateResult` — successful mutation path PASS; .audit-output/main-transactional-business-smoke.json#transactional_business_smoke_and_compatibility_aliases
- `dbo.sp_PhanCongQuanLyRap` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_PhanCongQuanLyRap
- `dbo.sp_Product_ListActive` — runtime PASS (initial read-only assertions)
- `dbo.sp_Promotion_Validate` — runtime PASS (initial read-only assertions)
- `dbo.sp_RBAC_GetPermissionsByUser` — runtime PASS (initial read-only assertions)
- `dbo.sp_Review_Create` — successful mutation path PASS; .audit-output/main-transactional-business-smoke.json#transactional_business_smoke_and_compatibility_aliases
- `dbo.sp_Review_ListByMovie` — runtime PASS (initial read-only assertions)
- `dbo.sp_Seat_ListByShowtime` — runtime PASS (initial read-only assertions)
- `dbo.sp_Showtime_CancelCascade` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_Showtime_CancelCascade_direct
- `dbo.sp_Showtime_GetDetail` — runtime PASS (initial read-only assertions)
- `dbo.sp_Showtime_ListByMovie` — runtime PASS (initial read-only assertions)
- `dbo.sp_Showtime_ValidateTimes` — runtime PASS (initial read-only assertions)
- `dbo.sp_StaffBooking_Authorize` — runtime PASS (read-only call)
- `dbo.sp_StaffBooking_Cancel` — successful mutation path PASS; .audit-output/main-staff-booking-regression.json#staff_booking_success_failure_cancel_and_history_regression
- `dbo.sp_StaffBooking_Create` — successful mutation path PASS; .audit-output/main-staff-booking-regression.json#staff_booking_success_failure_cancel_and_history_regression
- `dbo.sp_StaffBooking_Customers` — runtime PASS (read-only call)
- `dbo.sp_StaffBooking_Detail` — runtime PASS (read-only call)
- `dbo.sp_StaffBooking_List` — runtime PASS (read-only call)
- `dbo.sp_StaffBooking_LockShow` — runtime PASS (read-only call)
- `dbo.sp_StaffBooking_Options` — runtime PASS (read-only call)
- `dbo.sp_StaffBooking_UpdateSeats` — successful mutation path PASS; .audit-output/main-staff-booking-regression.json#staff_booking_success_failure_cancel_and_history_regression
- `dbo.sp_Support_Complaint_AddProcessing` — successful mutation path PASS; .audit-output/main-complaint-workflow-smoke.json#sp_Support_Complaint_AddProcessing_success
- `dbo.sp_Support_Complaint_GetDetail` — runtime PASS (read-only call)
- `dbo.sp_Support_Complaint_GetOrderReference` — runtime PASS (read-only call)
- `dbo.sp_Support_Complaint_List` — runtime PASS (read-only call)
- `dbo.sp_Support_Complaint_UpdateStatus` — successful mutation path PASS; .audit-output/main-complaint-workflow-smoke.json#sp_Support_Complaint_UpdateStatus_success
- `dbo.sp_Support_Customer_GetPoints` — runtime PASS (read-only call)
- `dbo.sp_System_HealthCheck` — runtime PASS (initial read-only assertions)
- `dbo.sp_ThemSuatChieu` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#sp_ThemSuatChieu
- `dbo.sp_User_ChangePassword` — successful mutation path PASS; .audit-output/main-auth-success-smoke.json#sp_User_ChangePassword
- `dbo.sp_User_GetCurrent` — runtime PASS (read-only call)
- `dbo.sp_User_GetPasswordHash` — runtime PASS (read-only call)
- `dbo.sp_User_UpdateProfile` — successful mutation path PASS; .audit-output/main-auth-success-smoke.json#sp_User_UpdateProfile
- `dbo.sp_XuLyKhieuNai` — successful mutation path PASS; .audit-output/main-complaint-workflow-smoke.json#sp_XuLyKhieuNai_alias_and_history_trigger
- `dbo.sp_XuLyThanhToan` — successful mutation path PASS; .audit-output/main-transactional-business-smoke.json#transactional_business_smoke_and_compatibility_aliases
- `dbo.usp_Admin_Assignment_Update` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_Assignment_Update
- `dbo.usp_Admin_CinemaImage_Create` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_CinemaImage_Create_first_cover
- `dbo.usp_Admin_CinemaImage_Delete` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_CinemaImage_Delete_first
- `dbo.usp_Admin_CinemaImage_List` — runtime PASS (read-only call)
- `dbo.usp_Admin_CinemaImage_SetCover` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_CinemaImage_SetCover
- `dbo.usp_Admin_CinemaImage_Update` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_CinemaImage_Update_disable_cover
- `dbo.usp_Admin_Cinema_List` — runtime PASS (read-only call)
- `dbo.usp_Admin_Movie_List` — runtime PASS (read-only call)
- `dbo.usp_Admin_Pricing_Create` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_Pricing_Create
- `dbo.usp_Admin_Pricing_List` — runtime PASS (read-only call)
- `dbo.usp_Admin_Pricing_Update` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_Pricing_Update
- `dbo.usp_Admin_Product_List` — runtime PASS (read-only call)
- `dbo.usp_Admin_RolePermission_List` — runtime PASS (read-only call)
- `dbo.usp_Admin_Room_Create` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_Room_Create
- `dbo.usp_Admin_Room_Delete` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_Room_Delete_with_showtime_history
- `dbo.usp_Admin_Room_List` — runtime PASS (read-only call)
- `dbo.usp_Admin_Room_Update` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_Room_Update
- `dbo.usp_Admin_Seat_Create` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_Seat_Create
- `dbo.usp_Admin_Seat_Delete` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_Seat_Delete
- `dbo.usp_Admin_Seat_List` — runtime PASS (read-only call)
- `dbo.usp_Admin_Seat_Update` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_Seat_Update
- `dbo.usp_Admin_Showtime_Cancel` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_Showtime_Cancel
- `dbo.usp_Admin_Showtime_Create` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_Showtime_Create
- `dbo.usp_Admin_Showtime_List` — runtime PASS (read-only call)
- `dbo.usp_Admin_Showtime_Update` — successful mutation path PASS; .audit-output/main-facility-schedule-success-smoke.json#usp_Admin_Showtime_Update

## Functions

- `dbo.fn_BayGio` — PASS in function assertions
- `dbo.fn_DanhSachGheSuatChieu` — PASS in function assertions
- `dbo.fn_DonDangGiuGhe` — PASS in function assertions
- `dbo.fn_GheCoVeHieuLucSuatTuongLai` — PASS in function assertions
- `dbo.fn_GioRap` — PASS in function assertions
- `dbo.fn_GioiHanDonDangGiu` — PASS in function assertions
- `dbo.fn_GioiHanGheMoiDon` — PASS in function assertions
- `dbo.fn_GioiHanGiamGiaPhanTram` — PASS in function assertions
- `dbo.fn_GioiHanSoLuongSanPham` — PASS in function assertions
- `dbo.fn_HomNay` — PASS in function assertions
- `dbo.fn_KiemTraQuanLyRapScope` — PASS in function assertions
- `dbo.fn_KiemTraQuyenNguoiDung` — PASS in function assertions
- `dbo.fn_NgayKinhDoanh` — PASS in function assertions
- `dbo.fn_ThoiGianGiaHanThanhToanPhut` — PASS in function assertions
- `dbo.fn_ThoiGianGiuChoPhut` — PASS in function assertions
- `dbo.fn_TinhBoiThuongVe` — PASS in function assertions
- `dbo.fn_TinhGiaVe` — PASS in function assertions
- `dbo.fn_TinhTongTienDoAn` — PASS in function assertions
- `dbo.fn_TinhTongTienDon` — PASS in function assertions
- `dbo.fn_TinhTongTienVe` — PASS in function assertions
- `dbo.fn_UtcTuGioRap` — PASS in function assertions

## Views

- `dbo.vw_ChiTietDonDatVe` — PASS against read-only row-count / revenue oracle
- `dbo.vw_DanhSachKhieuNai` — PASS against read-only row-count / revenue oracle
- `dbo.vw_DoanhThuTheoRap` — PASS against read-only row-count / revenue oracle
- `dbo.vw_LichChieuChiTiet` — PASS against read-only row-count / revenue oracle
- `dbo.vw_LichSuDatVe` — PASS against read-only row-count / revenue oracle
- `dbo.vw_ThongKePhim` — PASS against read-only row-count / revenue oracle

## Triggers and event metadata

- `TRG_BangGia_KiemTraChongLan` on `BANGGIA`: INSERT; enabled; sequential DML PASS
- `TRG_BangGia_KiemTraChongLan` on `BANGGIA`: UPDATE; enabled; sequential DML PASS
- `TRG_ChiTietVe_KiemTraGheDungPhong` on `CHITIETVE`: INSERT; enabled; sequential DML PASS
- `TRG_ChiTietVe_KiemTraGheDungPhong` on `CHITIETVE`: UPDATE; enabled; sequential DML PASS
- `TRG_ChiTietVe_KiemTraTrungGhe` on `CHITIETVE`: INSERT; enabled; sequential DML PASS
- `TRG_ChiTietVe_KiemTraTrungGhe` on `CHITIETVE`: UPDATE; enabled; sequential DML PASS
- `TRG_DanhGia_KiemTraDaXemPhim` on `DANHGIAPHIM`: INSERT; enabled; sequential DML PASS
- `TRG_KhieuNai_NhanVienPhuTrachBatBien` on `KHIEUNAI`: UPDATE; enabled; sequential DML PASS
- `TRG_NguoiDung_VaiTroBatBien` on `NGUOIDUNG`: UPDATE; enabled; sequential DML PASS
- `TRG_SuatChieu_KiemTraTrungLich` on `SUATCHIEU`: INSERT; enabled; sequential DML PASS ; independent-session overlap race PASS
- `TRG_SuatChieu_KiemTraTrungLich` on `SUATCHIEU`: UPDATE; enabled; sequential DML PASS ; independent-session overlap race PASS
- `TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai` on `XULY_KHIEUNAI`: INSERT; enabled; sequential DML PASS
- `TRG_XuLyKhieuNai_KiemTraVaiTro` on `XULY_KHIEUNAI`: INSERT; enabled; sequential DML PASS
- `TRG_XuLyKhieuNai_KiemTraVaiTro` on `XULY_KHIEUNAI`: UPDATE; enabled; sequential DML PASS

## Foreign keys

- `dbo.FK_BANGGIA_Rap` on `BANGGIA`: enabled; trusted
- `dbo.FK_BOITHUONG_HUYSUAT_Don` on `BOITHUONG_HUYSUAT`: enabled; trusted
- `dbo.FK_CHITIETDOAN_DonDatVe` on `CHITIETDOAN`: enabled; trusted
- `dbo.FK_CHITIETDOAN_SanPham` on `CHITIETDOAN`: enabled; trusted
- `dbo.FK_CHITIETVE_DonDatVe` on `CHITIETVE`: enabled; trusted
- `dbo.FK_CHITIETVE_Ghe` on `CHITIETVE`: enabled; trusted
- `dbo.FK_DANHGIAPHIM_NguoiDung` on `DANHGIAPHIM`: enabled; trusted
- `dbo.FK_DANHGIAPHIM_Phim` on `DANHGIAPHIM`: enabled; trusted
- `dbo.FK_DONDATVE_KhuyenMai` on `DONDATVE`: enabled; trusted
- `dbo.FK_DONDATVE_NguoiDung` on `DONDATVE`: enabled; trusted
- `dbo.FK_DONDATVE_SuatChieu` on `DONDATVE`: enabled; trusted
- `dbo.FK_GHE_Phong` on `GHE`: enabled; trusted
- `dbo.FK_HINHANH_RAPCHIEUPHIM_Rap` on `HINHANH_RAPCHIEUPHIM`: enabled; trusted
- `dbo.FK_HOSOKHACHHANG_NguoiDung` on `HOSOKHACHHANG`: enabled; trusted
- `dbo.FK_KHIEUNAI_DonDatVe` on `KHIEUNAI`: enabled; trusted
- `dbo.FK_KHIEUNAI_NguoiDung` on `KHIEUNAI`: enabled; trusted
- `dbo.FK_KHIEUNAI_NhanVienPhuTrach` on `KHIEUNAI`: enabled; trusted
- `dbo.FK_NGUOIDUNG_VaiTro` on `NGUOIDUNG`: enabled; trusted
- `dbo.FK_PHANCONG_RAP_NguoiDung` on `PHANCONG_RAP`: enabled; trusted
- `dbo.FK_PHANCONG_RAP_Rap` on `PHANCONG_RAP`: enabled; trusted
- `dbo.FK_PHIM_DIENVIEN_DienVien` on `PHIM_DIENVIEN`: enabled; trusted
- `dbo.FK_PHIM_DIENVIEN_Phim` on `PHIM_DIENVIEN`: enabled; trusted
- `dbo.FK_PHIM_THELOAI_Phim` on `PHIM_THELOAI`: enabled; trusted
- `dbo.FK_PHIM_THELOAI_TheLoai` on `PHIM_THELOAI`: enabled; trusted
- `dbo.FK_PHONGCHIEU_Rap` on `PHONGCHIEU`: enabled; trusted
- `dbo.FK_SUATCHIEU_Phim` on `SUATCHIEU`: enabled; trusted
- `dbo.FK_SUATCHIEU_Phong` on `SUATCHIEU`: enabled; trusted
- `dbo.FK_TINNHAN_KHIEUNAI_KhieuNai` on `TINNHAN_KHIEUNAI`: enabled; trusted
- `dbo.FK_TINNHAN_KHIEUNAI_NguoiGui` on `TINNHAN_KHIEUNAI`: enabled; trusted
- `dbo.FK_THANHTOAN_DonDatVe` on `THANHTOAN`: enabled; trusted
- `dbo.FK_VAITRO_QUYEN_Quyen` on `VAITRO_QUYEN`: enabled; trusted
- `dbo.FK_VAITRO_QUYEN_VaiTro` on `VAITRO_QUYEN`: enabled; trusted
- `dbo.FK_XULY_KHIEUNAI_KhieuNai` on `XULY_KHIEUNAI`: enabled; trusted
- `dbo.FK_XULY_KHIEUNAI_NguoiXuLy` on `XULY_KHIEUNAI`: enabled; trusted
- `dbo.FK_YEUCAU_CHUYENCAP_AdminPhuTrach` on `YEUCAU_CHUYENCAP`: enabled; trusted
- `dbo.FK_YEUCAU_CHUYENCAP_KhieuNai` on `YEUCAU_CHUYENCAP`: enabled; trusted
- `dbo.FK_YEUCAU_CHUYENCAP_NguoiYeuCau` on `YEUCAU_CHUYENCAP`: enabled; trusted

## CHECK constraints

- `dbo.CK_BANGGIA_DinhDang` on `BANGGIA`: enabled; trusted
- `dbo.CK_BANGGIA_LoaiGhe` on `BANGGIA`: enabled; trusted
- `dbo.CK_BANGGIA_LoaiNgay` on `BANGGIA`: enabled; trusted
- `dbo.CK_BANGGIA_PhuThu` on `BANGGIA`: enabled; trusted
- `dbo.CK_BANGGIA_ThoiGian` on `BANGGIA`: enabled; trusted
- `dbo.CK_BANGGIA_TrangThai` on `BANGGIA`: enabled; trusted
- `dbo.CK_BOITHUONG_HUYSUAT_Diem` on `BOITHUONG_HUYSUAT`: enabled; trusted
- `dbo.CK_CHITIETDOAN_DonGia` on `CHITIETDOAN`: enabled; trusted
- `dbo.CK_CHITIETDOAN_SoLuong` on `CHITIETDOAN`: enabled; trusted
- `dbo.CK_CHITIETVE_GiaVe` on `CHITIETVE`: enabled; trusted
- `dbo.CK_CHITIETVE_TrangThai` on `CHITIETVE`: enabled; trusted
- `dbo.CK_DANHGIAPHIM_SoSao` on `DANHGIAPHIM`: enabled; trusted
- `dbo.CK_DONDATVE_DiemSuDung` on `DONDATVE`: enabled; trusted
- `dbo.CK_DONDATVE_HanGiuCho` on `DONDATVE`: enabled; trusted
- `dbo.CK_DONDATVE_TienGiamGia` on `DONDATVE`: enabled; trusted
- `dbo.CK_DONDATVE_TongGiam` on `DONDATVE`: enabled; trusted
- `dbo.CK_DONDATVE_TongTienDoAn` on `DONDATVE`: enabled; trusted
- `dbo.CK_DONDATVE_TongTienVe` on `DONDATVE`: enabled; trusted
- `dbo.CK_DONDATVE_TrangThai` on `DONDATVE`: enabled; trusted
- `dbo.CK_GHE_LoaiGhe` on `GHE`: enabled; trusted
- `dbo.CK_GHE_SoGhe` on `GHE`: enabled; trusted
- `dbo.CK_GHE_TrangThai` on `GHE`: enabled; trusted
- `dbo.CK_HINHANH_RAPCHIEUPHIM_ThuTuHienThi` on `HINHANH_RAPCHIEUPHIM`: enabled; trusted
- `dbo.CK_HINHANH_RAPCHIEUPHIM_TrangThai` on `HINHANH_RAPCHIEUPHIM`: enabled; trusted
- `dbo.CK_HINHANH_RAPCHIEUPHIM_URL` on `HINHANH_RAPCHIEUPHIM`: enabled; trusted
- `dbo.CK_HOSOKHACHHANG_DiemTichLuy` on `HOSOKHACHHANG`: enabled; trusted
- `dbo.CK_HOSOKHACHHANG_GioiTinh` on `HOSOKHACHHANG`: enabled; trusted
- `dbo.CK_KHIEUNAI_MucDoUuTien` on `KHIEUNAI`: enabled; trusted
- `dbo.CK_KHIEUNAI_TrangThai` on `KHIEUNAI`: enabled; trusted
- `dbo.CK_KHUYENMAI_DonHangToiThieu` on `KHUYENMAI`: enabled; trusted
- `dbo.CK_KHUYENMAI_GiamToiDa` on `KHUYENMAI`: enabled; trusted
- `dbo.CK_KHUYENMAI_GiaTriGiam` on `KHUYENMAI`: enabled; trusted
- `dbo.CK_KHUYENMAI_LoaiGiamGia` on `KHUYENMAI`: enabled; trusted
- `dbo.CK_KHUYENMAI_PhanTram99` on `KHUYENMAI`: enabled; trusted
- `dbo.CK_KHUYENMAI_SoLuong` on `KHUYENMAI`: enabled; trusted
- `dbo.CK_KHUYENMAI_ThoiGian` on `KHUYENMAI`: enabled; trusted
- `dbo.CK_KHUYENMAI_TrangThai` on `KHUYENMAI`: enabled; trusted
- `dbo.CK_NGUOIDUNG_TrangThai` on `NGUOIDUNG`: enabled; trusted
- `dbo.CK_PHANCONG_RAP_ThoiGian` on `PHANCONG_RAP`: enabled; trusted
- `dbo.CK_PHANCONG_RAP_TrangThai` on `PHANCONG_RAP`: enabled; trusted
- `dbo.CK_PHIM_DoTuoi` on `PHIM`: enabled; trusted
- `dbo.CK_PHIM_ThoiGian` on `PHIM`: enabled; trusted
- `dbo.CK_PHIM_ThoiLuong` on `PHIM`: enabled; trusted
- `dbo.CK_PHIM_TrangThai` on `PHIM`: enabled; trusted
- `dbo.CK_PHONGCHIEU_LoaiPhong` on `PHONGCHIEU`: enabled; trusted
- `dbo.CK_PHONGCHIEU_TrangThai` on `PHONGCHIEU`: enabled; trusted
- `dbo.CK_RAPCHIEUPHIM_TrangThai` on `RAPCHIEUPHIM`: enabled; trusted
- `dbo.CK_SANPHAM_Gia` on `SANPHAM`: enabled; trusted
- `dbo.CK_SANPHAM_LoaiSanPham` on `SANPHAM`: enabled; trusted
- `dbo.CK_SANPHAM_TrangThai` on `SANPHAM`: enabled; trusted
- `dbo.CK_SUATCHIEU_DinhDang` on `SUATCHIEU`: enabled; trusted
- `dbo.CK_SUATCHIEU_GiaVeCoBan` on `SUATCHIEU`: enabled; trusted
- `dbo.CK_SUATCHIEU_ThoiGian` on `SUATCHIEU`: enabled; trusted
- `dbo.CK_SUATCHIEU_TrangThai` on `SUATCHIEU`: enabled; trusted
- `dbo.CK_TINNHAN_KHIEUNAI_LoaiTinNhan` on `TINNHAN_KHIEUNAI`: enabled; trusted
- `dbo.CK_TINNHAN_KHIEUNAI_NoiDung` on `TINNHAN_KHIEUNAI`: enabled; trusted
- `dbo.CK_THANHTOAN_PhuongThuc` on `THANHTOAN`: enabled; trusted
- `dbo.CK_THANHTOAN_TrangThai` on `THANHTOAN`: enabled; trusted
- `dbo.CK_XULY_KHIEUNAI_TrangThaiSauXuLy` on `XULY_KHIEUNAI`: enabled; trusted
- `dbo.CK_YEUCAU_CHUYENCAP_KetQua` on `YEUCAU_CHUYENCAP`: enabled; trusted
- `dbo.CK_YEUCAU_CHUYENCAP_LyDo` on `YEUCAU_CHUYENCAP`: enabled; trusted
- `dbo.CK_YEUCAU_CHUYENCAP_MucDoUuTien` on `YEUCAU_CHUYENCAP`: enabled; trusted
- `dbo.CK_YEUCAU_CHUYENCAP_ThoiGianHoanTat` on `YEUCAU_CHUYENCAP`: enabled; trusted
- `dbo.CK_YEUCAU_CHUYENCAP_ThoiGianTiepNhan` on `YEUCAU_CHUYENCAP`: enabled; trusted
- `dbo.CK_YEUCAU_CHUYENCAP_TrangThai` on `YEUCAU_CHUYENCAP`: enabled; trusted

## Primary key constraints

- `dbo.PK_BANGGIA` on `BANGGIA`: enabled
- `dbo.PK_BOITHUONG_HUYSUAT` on `BOITHUONG_HUYSUAT`: enabled
- `dbo.PK_CHITIETDOAN` on `CHITIETDOAN`: enabled
- `dbo.PK_CHITIETVE` on `CHITIETVE`: enabled
- `dbo.PK_DANHGIAPHIM` on `DANHGIAPHIM`: enabled
- `dbo.PK_DIENVIEN` on `DIENVIEN`: enabled
- `dbo.PK_DONDATVE` on `DONDATVE`: enabled
- `dbo.PK_GHE` on `GHE`: enabled
- `dbo.PK_HINHANH_RAPCHIEUPHIM` on `HINHANH_RAPCHIEUPHIM`: enabled
- `dbo.PK_HOSOKHACHHANG` on `HOSOKHACHHANG`: enabled
- `dbo.PK_KHIEUNAI` on `KHIEUNAI`: enabled
- `dbo.PK_KHUYENMAI` on `KHUYENMAI`: enabled
- `dbo.PK_NGUOIDUNG` on `NGUOIDUNG`: enabled
- `dbo.PK_PHANCONG_RAP` on `PHANCONG_RAP`: enabled
- `dbo.PK_PHIM` on `PHIM`: enabled
- `dbo.PK_PHIM_DIENVIEN` on `PHIM_DIENVIEN`: enabled
- `dbo.PK_PHIM_THELOAI` on `PHIM_THELOAI`: enabled
- `dbo.PK_PHONGCHIEU` on `PHONGCHIEU`: enabled
- `dbo.PK_QUYEN` on `QUYEN`: enabled
- `dbo.PK_RAPCHIEUPHIM` on `RAPCHIEUPHIM`: enabled
- `dbo.PK_SANPHAM` on `SANPHAM`: enabled
- `dbo.PK_SUATCHIEU` on `SUATCHIEU`: enabled
- `dbo.PK_TINNHAN_KHIEUNAI` on `TINNHAN_KHIEUNAI`: enabled
- `dbo.PK_THANHTOAN` on `THANHTOAN`: enabled
- `dbo.PK_THELOAI` on `THELOAI`: enabled
- `dbo.PK_VAITRO` on `VAITRO`: enabled
- `dbo.PK_VAITRO_QUYEN` on `VAITRO_QUYEN`: enabled
- `dbo.PK_XULY_KHIEUNAI` on `XULY_KHIEUNAI`: enabled
- `dbo.PK_YEUCAU_CHUYENCAP` on `YEUCAU_CHUYENCAP`: enabled

## Unique constraints

- `dbo.UQ_BOITHUONG_HUYSUAT_Don` on `BOITHUONG_HUYSUAT`: enabled
- `dbo.UQ_CHITIETDOAN_Don_SanPham` on `CHITIETDOAN`: enabled
- `dbo.UQ_CHITIETVE_MaVe` on `CHITIETVE`: enabled
- `dbo.UQ_DANHGIAPHIM_Phim_User` on `DANHGIAPHIM`: enabled
- `dbo.UQ_GHE_ViTri` on `GHE`: enabled
- `dbo.UQ_KHUYENMAI_MaCode` on `KHUYENMAI`: enabled
- `dbo.UQ_NGUOIDUNG_Email` on `NGUOIDUNG`: enabled
- `dbo.UQ_PHONGCHIEU_TenPhong` on `PHONGCHIEU`: enabled
- `dbo.UQ_QUYEN_MaQuyen` on `QUYEN`: enabled
- `dbo.UQ_THELOAI_TenTheLoai` on `THELOAI`: enabled
- `dbo.UQ_VAITRO_MaVaiTro` on `VAITRO`: enabled

## Indexes

- `BANGGIA.PK_BANGGIA`: CLUSTERED UNIQUE PRIMARY KEY; key: GiaID ASC; include: (none); filter: (none); enabled
- `BANGGIA.IX_BANGGIA_Lookup`: NONCLUSTERED; key: RapID ASC, LoaiGhe ASC, LoaiNgay ASC, DinhDang ASC, TrangThai ASC, NgayBatDau ASC, NgayKetThuc ASC; include: (none); filter: (none); enabled
- `BOITHUONG_HUYSUAT.PK_BOITHUONG_HUYSUAT`: CLUSTERED UNIQUE PRIMARY KEY; key: BoiThuongID ASC; include: (none); filter: (none); enabled
- `BOITHUONG_HUYSUAT.UQ_BOITHUONG_HUYSUAT_Don`: NONCLUSTERED UNIQUE; key: DonDatVeID ASC; include: (none); filter: (none); enabled
- `CHITIETDOAN.PK_CHITIETDOAN`: CLUSTERED UNIQUE PRIMARY KEY; key: ChiTietDoAnID ASC; include: (none); filter: (none); enabled
- `CHITIETDOAN.UQ_CHITIETDOAN_Don_SanPham`: NONCLUSTERED UNIQUE; key: DonDatVeID ASC, SanPhamID ASC; include: (none); filter: (none); enabled
- `CHITIETVE.PK_CHITIETVE`: CLUSTERED UNIQUE PRIMARY KEY; key: VeID ASC; include: (none); filter: (none); enabled
- `CHITIETVE.UQ_CHITIETVE_MaVe`: NONCLUSTERED UNIQUE; key: MaVe ASC; include: (none); filter: (none); enabled
- `CHITIETVE.IX_CHITIETVE_DonDatVe`: NONCLUSTERED; key: DonDatVeID ASC; include: GheID, TrangThai, GiaVe; filter: (none); enabled
- `CHITIETVE.IX_CHITIETVE_GheID`: NONCLUSTERED; key: GheID ASC, TrangThai ASC; include: (none); filter: (none); enabled
- `DANHGIAPHIM.PK_DANHGIAPHIM`: CLUSTERED UNIQUE PRIMARY KEY; key: DanhGiaID ASC; include: (none); filter: (none); enabled
- `DANHGIAPHIM.UQ_DANHGIAPHIM_Phim_User`: NONCLUSTERED UNIQUE; key: PhimID ASC, NguoiDungID ASC; include: (none); filter: (none); enabled
- `DIENVIEN.PK_DIENVIEN`: CLUSTERED UNIQUE PRIMARY KEY; key: DienVienID ASC; include: (none); filter: (none); enabled
- `DONDATVE.PK_DONDATVE`: CLUSTERED UNIQUE PRIMARY KEY; key: DonDatVeID ASC; include: (none); filter: (none); enabled
- `DONDATVE.IX_DONDATVE_HanGiuCho`: NONCLUSTERED; key: HanGiuCho ASC; include: SuatChieuID; filter: ([TrangThai]=N'Chờ thanh toán'); enabled
- `DONDATVE.IX_DONDATVE_KhuyenMai`: NONCLUSTERED; key: KhuyenMaiID ASC; include: (none); filter: ([KhuyenMaiID] IS NOT NULL); enabled
- `DONDATVE.IX_DONDATVE_NguoiDung`: NONCLUSTERED; key: NguoiDungID ASC, NgayDat DESC; include: (none); filter: (none); enabled
- `DONDATVE.IX_DONDATVE_SuatChieu`: NONCLUSTERED; key: SuatChieuID ASC, TrangThai ASC; include: (none); filter: (none); enabled
- `GHE.PK_GHE`: CLUSTERED UNIQUE PRIMARY KEY; key: GheID ASC; include: (none); filter: (none); enabled
- `GHE.UQ_GHE_ViTri`: NONCLUSTERED UNIQUE; key: PhongID ASC, HangGhe ASC, SoGhe ASC; include: (none); filter: (none); enabled
- `GHE.IX_GHE_PhongID_LoaiGhe`: NONCLUSTERED; key: PhongID ASC, LoaiGhe ASC, TrangThai ASC; include: (none); filter: (none); enabled
- `HINHANH_RAPCHIEUPHIM.PK_HINHANH_RAPCHIEUPHIM`: CLUSTERED UNIQUE PRIMARY KEY; key: HinhAnhRapID ASC; include: (none); filter: (none); enabled
- `HINHANH_RAPCHIEUPHIM.IX_HINHANH_RAPCHIEUPHIM_Rap_TrangThai_ThuTu`: NONCLUSTERED; key: RapID ASC, TrangThai ASC, ThuTuHienThi ASC, HinhAnhRapID ASC; include: (none); filter: (none); enabled
- `HINHANH_RAPCHIEUPHIM.UX_HINHANH_RAPCHIEUPHIM_Rap_Cover`: NONCLUSTERED UNIQUE; key: RapID ASC; include: (none); filter: ([LaAnhDaiDien]=(1)); enabled
- `HOSOKHACHHANG.PK_HOSOKHACHHANG`: CLUSTERED UNIQUE PRIMARY KEY; key: NguoiDungID ASC; include: (none); filter: (none); enabled
- `KHIEUNAI.PK_KHIEUNAI`: CLUSTERED UNIQUE PRIMARY KEY; key: KhieuNaiID ASC; include: (none); filter: (none); enabled
- `KHIEUNAI.IX_KHIEUNAI_DonDatVe`: NONCLUSTERED; key: DonDatVeID ASC; include: (none); filter: ([DonDatVeID] IS NOT NULL); enabled
- `KHIEUNAI.IX_KHIEUNAI_NguoiDung`: NONCLUSTERED; key: NguoiDungID ASC, TrangThai ASC; include: (none); filter: (none); enabled
- `KHIEUNAI.IX_KHIEUNAI_TrangThai`: NONCLUSTERED; key: TrangThai ASC, MucDoUuTien ASC, NgayTao DESC; include: (none); filter: (none); enabled
- `KHIEUNAI.IX_KHIEUNAI_NhanVienPhuTrach`: NONCLUSTERED; key: NhanVienPhuTrachID ASC, TrangThai ASC; include: (none); filter: (none); enabled
- `KHUYENMAI.PK_KHUYENMAI`: CLUSTERED UNIQUE PRIMARY KEY; key: KhuyenMaiID ASC; include: (none); filter: (none); enabled
- `KHUYENMAI.UQ_KHUYENMAI_MaCode`: NONCLUSTERED UNIQUE; key: MaCode ASC; include: (none); filter: (none); enabled
- `NGUOIDUNG.PK_NGUOIDUNG`: CLUSTERED UNIQUE PRIMARY KEY; key: NguoiDungID ASC; include: (none); filter: (none); enabled
- `NGUOIDUNG.UQ_NGUOIDUNG_Email`: NONCLUSTERED UNIQUE; key: Email ASC; include: (none); filter: (none); enabled
- `NGUOIDUNG.IX_NGUOIDUNG_TrangThai`: NONCLUSTERED; key: TrangThai ASC; include: HoTen, Email; filter: (none); enabled
- `NGUOIDUNG.IX_NGUOIDUNG_VaiTroID`: NONCLUSTERED; key: VaiTroID ASC; include: (none); filter: (none); enabled
- `NGUOIDUNG.UQ_NGUOIDUNG_SoDienThoai`: NONCLUSTERED UNIQUE; key: SoDienThoai ASC; include: (none); filter: ([SoDienThoai] IS NOT NULL); enabled
- `PHANCONG_RAP.PK_PHANCONG_RAP`: CLUSTERED UNIQUE PRIMARY KEY; key: PhanCongID ASC; include: (none); filter: (none); enabled
- `PHANCONG_RAP.IX_PHANCONG_RAP_NguoiDung`: NONCLUSTERED; key: NguoiDungID ASC, TrangThai ASC, NgayBatDau ASC, NgayKetThuc ASC; include: (none); filter: (none); enabled
- `PHANCONG_RAP.IX_PHANCONG_RAP_Rap`: NONCLUSTERED; key: RapID ASC, TrangThai ASC; include: (none); filter: (none); enabled
- `PHIM.PK_PHIM`: CLUSTERED UNIQUE PRIMARY KEY; key: PhimID ASC; include: (none); filter: (none); enabled
- `PHIM.IX_PHIM_TrangThai`: NONCLUSTERED; key: TrangThai ASC, NgayKhoiChieu ASC; include: (none); filter: (none); enabled
- `PHIM_DIENVIEN.PK_PHIM_DIENVIEN`: CLUSTERED UNIQUE PRIMARY KEY; key: PhimID ASC, DienVienID ASC; include: (none); filter: (none); enabled
- `PHIM_THELOAI.PK_PHIM_THELOAI`: CLUSTERED UNIQUE PRIMARY KEY; key: PhimID ASC, TheLoaiID ASC; include: (none); filter: (none); enabled
- `PHONGCHIEU.PK_PHONGCHIEU`: CLUSTERED UNIQUE PRIMARY KEY; key: PhongID ASC; include: (none); filter: (none); enabled
- `PHONGCHIEU.UQ_PHONGCHIEU_TenPhong`: NONCLUSTERED UNIQUE; key: RapID ASC, TenPhong ASC; include: (none); filter: (none); enabled
- `PHONGCHIEU.IX_PHONGCHIEU_RapID`: NONCLUSTERED; key: RapID ASC, TrangThai ASC; include: (none); filter: (none); enabled
- `QUYEN.PK_QUYEN`: CLUSTERED UNIQUE PRIMARY KEY; key: QuyenID ASC; include: (none); filter: (none); enabled
- `QUYEN.UQ_QUYEN_MaQuyen`: NONCLUSTERED UNIQUE; key: MaQuyen ASC; include: (none); filter: (none); enabled
- `RAPCHIEUPHIM.PK_RAPCHIEUPHIM`: CLUSTERED UNIQUE PRIMARY KEY; key: RapID ASC; include: (none); filter: (none); enabled
- `SANPHAM.PK_SANPHAM`: CLUSTERED UNIQUE PRIMARY KEY; key: SanPhamID ASC; include: (none); filter: (none); enabled
- `SUATCHIEU.PK_SUATCHIEU`: CLUSTERED UNIQUE PRIMARY KEY; key: SuatChieuID ASC; include: (none); filter: (none); enabled
- `SUATCHIEU.IX_SUATCHIEU_Phim_ThoiGian`: NONCLUSTERED; key: PhimID ASC, ThoiGianBatDau ASC, TrangThai ASC; include: (none); filter: (none); enabled
- `SUATCHIEU.IX_SUATCHIEU_Phong_ThoiGian`: NONCLUSTERED; key: PhongID ASC, ThoiGianBatDau ASC, ThoiGianKetThuc ASC; include: (none); filter: (none); enabled
- `TINNHAN_KHIEUNAI.PK_TINNHAN_KHIEUNAI`: CLUSTERED UNIQUE PRIMARY KEY; key: TinNhanID ASC; include: (none); filter: (none); enabled
- `TINNHAN_KHIEUNAI.IX_TINNHAN_KHIEUNAI_KhieuNai_ThoiGian`: NONCLUSTERED; key: KhieuNaiID ASC, ThoiGianGui ASC, TinNhanID ASC; include: NguoiGuiID, LoaiTinNhan; filter: (none); enabled
- `THANHTOAN.PK_THANHTOAN`: CLUSTERED UNIQUE PRIMARY KEY; key: ThanhToanID ASC; include: (none); filter: (none); enabled
- `THANHTOAN.IX_THANHTOAN_DonDatVe`: NONCLUSTERED; key: DonDatVeID ASC, TrangThai ASC; include: NgayThanhToan, NgayTao; filter: (none); enabled
- `THANHTOAN.UQ_THANHTOAN_MaGiaoDich`: NONCLUSTERED UNIQUE; key: MaGiaoDich ASC; include: (none); filter: ([MaGiaoDich] IS NOT NULL); enabled
- `THELOAI.PK_THELOAI`: CLUSTERED UNIQUE PRIMARY KEY; key: TheLoaiID ASC; include: (none); filter: (none); enabled
- `THELOAI.UQ_THELOAI_TenTheLoai`: NONCLUSTERED UNIQUE; key: TenTheLoai ASC; include: (none); filter: (none); enabled
- `VAITRO.PK_VAITRO`: CLUSTERED UNIQUE PRIMARY KEY; key: VaiTroID ASC; include: (none); filter: (none); enabled
- `VAITRO.UQ_VAITRO_MaVaiTro`: NONCLUSTERED UNIQUE; key: MaVaiTro ASC; include: (none); filter: (none); enabled
- `VAITRO_QUYEN.PK_VAITRO_QUYEN`: CLUSTERED UNIQUE PRIMARY KEY; key: VaiTroID ASC, QuyenID ASC; include: (none); filter: (none); enabled
- `XULY_KHIEUNAI.PK_XULY_KHIEUNAI`: CLUSTERED UNIQUE PRIMARY KEY; key: XuLyID ASC; include: (none); filter: (none); enabled
- `XULY_KHIEUNAI.IX_XULY_KHIEUNAI_KhieuNai`: NONCLUSTERED; key: KhieuNaiID ASC, NgayXuLy DESC; include: (none); filter: (none); enabled
- `YEUCAU_CHUYENCAP.PK_YEUCAU_CHUYENCAP`: CLUSTERED UNIQUE PRIMARY KEY; key: YeuCauID ASC; include: (none); filter: (none); enabled
- `YEUCAU_CHUYENCAP.IX_YEUCAU_CHUYENCAP_TrangThai_UuTien`: NONCLUSTERED; key: TrangThai ASC, MucDoUuTien ASC, ThoiGianGui DESC; include: (none); filter: (none); enabled
- `YEUCAU_CHUYENCAP.IX_YEUCAU_CHUYENCAP_KhieuNai`: NONCLUSTERED; key: KhieuNaiID ASC, ThoiGianGui DESC; include: (none); filter: (none); enabled
- `YEUCAU_CHUYENCAP.UQ_YEUCAU_CHUYENCAP_ChoTiepNhan`: NONCLUSTERED UNIQUE; key: KhieuNaiID ASC; include: (none); filter: ([TrangThai]=N'Chờ tiếp nhận'); enabled
- `YEUCAU_CHUYENCAP.UQ_YEUCAU_CHUYENCAP_DangXuLy`: NONCLUSTERED UNIQUE; key: KhieuNaiID ASC; include: (none); filter: ([TrangThai]=N'Đang xử lý'); enabled

## SQL Server diagram support artifacts

- `PRIMARY_KEY_CONSTRAINT dbo.PK__sysdiagr__C2B05B616F48F256`
- `SQL_SCALAR_FUNCTION dbo.fn_diagramobjects`
- `SQL_STORED_PROCEDURE dbo.sp_alterdiagram`
- `SQL_STORED_PROCEDURE dbo.sp_creatediagram`
- `SQL_STORED_PROCEDURE dbo.sp_dropdiagram`
- `SQL_STORED_PROCEDURE dbo.sp_helpdiagramdefinition`
- `SQL_STORED_PROCEDURE dbo.sp_helpdiagrams`
- `SQL_STORED_PROCEDURE dbo.sp_renamediagram`
- `SQL_STORED_PROCEDURE dbo.sp_upgraddiagrams`
- `UNIQUE_CONSTRAINT dbo.UK_principal_name`
- `USER_TABLE dbo.sysdiagrams`

