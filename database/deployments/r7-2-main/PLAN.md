# Scoped R7.2 main deployment plan

Authorization: user explicitly requests direct execution on CinemaBookingDB without another confirmation. This is separate from R7.3 verification and does not start R8.

Reviewed target: DESKTOP-E67DPCV, SQL Server17.0.1000.7, database GUID96F850EA-987F-41A1-9086-38F6597968C8, ONLINE/writable, metadata visibility and ALTER permissions verified. Initial inventory27tables/125procedures/21functions/6views/7triggers; exactly157 definitions match and two approved definitions remain pending. No other active main request/user transaction at preflight. Configured credentials remain in the existing environment; never write them into artifacts.

Only changes:

1. dbo.sp_Admin_User_Create from database/08_procedures/admin/sp_Admin_User_Create.sql.
2. dbo.sp_Support_Complaint_List from database/08_procedures/support/sp_Support_Complaint_List.sql.

Before ALTER:

- Validate the R7.3 artifact seal and all262 source/test hashes; run fresh192 backend tests, No-SQL and typed-contract checks.
- Recheck actual identity, all-object inventory, effective source definitions, metadata and active transactions.
- Capture raw original definitions, raw/normalized SHA256, SET options, signatures, dependencies and object metadata; save two SQL rollback files and private metadata outside Git under the OS temp directory. Parse rollback SQL with PARSEONLY on a separate connection. Original backup files are immutable.
- Create a unique full COPY_ONLY/CHECKSUM backup in SQL Server's configured backup directory, refuse an existing destination, RESTORE VERIFYONLY WITH CHECKSUM and check backup header database/flags. No full database restore is authorized by this plan.

Execution:

- One pinned mssql Transaction, SERIALIZABLE isolation; XACT_ABORT ON, LOCK_TIMEOUT5000ms, ordinary request timeout30s. Backup timeout180s applies only to backup/VERIFYONLY.
- Recheck identity/activity. Brief shared TABLOCK/HOLDLOCK reads of the27 tables prevent concurrent writers from contaminating the preservation snapshot; no session termination. If a lock cannot be obtained within5s, roll back and stop before further writes.
- Capture a consistent baseline. Apply the two unmodified canonical SQL files in separate valid GO batches in the same transaction. Each CREATE OR ALTER PROCEDURE is the first statement of its DDL batch.
- Before COMMIT: assert all159 normalized definitions, SET options, inventory/signatures/structural metadata, unchanged27-table data and identity counters, unchanged157 other modules. Only the two procedure definition/date/parameter/dependency metadata may change. Commit both together or neither.

After COMMIT:

- New bounded read-only verification transaction: actual backend support/admin services and procedure gateway against the deployed main DB, default/four-priority list operations for existing CSKH/Admin, invalid priority, wrong role, forbidden Customer creation and invalid actor. These creation probes must be rejected before INSERT; no successful user creation or fixture rows. XACT_ABORT OFF for denied savepoint probes; explicit caller transaction must remain committable. Compare all data/identity/metadata before/after and roll back the read-only verification transaction.
- Check159/159 parity and preservation again after transaction release; assert no explicit transaction or remaining main user transaction/blocked request.
- Positive mutations/custom-role/FK/duplicate scenarios retain actual R7.2 Test DB evidence. Do not call this a main HTTP/browser E2E run.

Failure:

- Before COMMIT, roll back the DDL transaction and compare original hashes/data.
- After COMMIT, if a required post-check fails, atomically restore only the two saved definitions with their original SET options. Compare normalized whole-definition hashes (CREATE versus ALTER header spelling is not business drift), all data and unrelated metadata. Never restore the entire backup over potentially valid concurrent transactions; never repair business rows to force fingerprints.
- If targeted restoration fails, stop all further writes and report actual state. Preserve every failure artifact.

Repeated application is idempotent: if all159 definitions already match, no ALTER or backup is performed; re-verification still runs. Any partial or third-module drift stops preflight. Historical manifest embedded snapshots remain unchanged; definition authority is manifest.modules pointing to canonical SQL files.

Deliverables: immutable deployment evidence under docs/evidence/main-db-deployment/runs, MAIN_DATABASE_SYNC_REPORT.md and this scoped deployment/verification tooling. Original R6/R7 artifacts and production sources remain unchanged.
