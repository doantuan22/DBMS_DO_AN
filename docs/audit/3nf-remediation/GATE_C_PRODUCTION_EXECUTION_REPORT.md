# CINEMABOOKINGDB — GATE C PRODUCTION MIGRATION EXECUTION REPORT
**Strict 3NF Normalization Cutover (Option 1 — 27 Tables)**

---

## 1. Executive Summary & Migration Metadata

On **October 13, 2026**, the authorized **Gate C Production Migration** was successfully executed on the primary database `CinemaBookingDB` hosted on SQL Server instance `DoanTuanIT`. The cutover transitioned the system to **Strict 3NF Normalization (Option 1)** by eliminating redundant physical storage of `SoTien` in the `THANHTOAN` table, while dynamically projecting payment amounts via `DONDATVE.TongTienThanhToan` across all Stored Procedures and Views.

The entire DDL/DML execution was completed in **under 1.5 seconds**, achieving **0.0000 VNĐ** financial delta and **zero data loss**. All 18 steps across Stages A, B, C, and D were executed with empirical proof and 100% pass rates across all quality gates.

```text
========================================================================================
MIGRATION EXECUTION METADATA
========================================================================================
Target Instance          : DoanTuanIT
Target Database          : CinemaBookingDB
Cutover Execution ID     : RUN-20261013-GATEC-365EC9477012
Cutover Runbook          : docs/audit/3nf-remediation/GATE_C_CUTOVER_RUNBOOK_FINAL.md
Execution Start Time     : 2026-10-13 22:05:00 UTC+7
Execution End Time       : 2026-10-13 22:28:19 UTC+7
Total Cutover Duration   : 23 minutes 19 seconds (including drain & validation)
DDL/DML Execution Time   : 1,279 ms (~1.3 seconds)
Target Business Tables   : 27 Tables (Preserved Exactly)
Backup Artifact Path     : C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Backup\CinemaBookingDB_Cutover_Full_365EC9477012.bak
Overall Gate C Status    : 100% PASS — RELEASE COMPLETE & LIVE
========================================================================================
```

---

## 2. Checkpoint Summary

| Checkpoint | Scope | Criteria | Result | Evidence Ref |
|---|---|---|:---:|---|
| **CHECKPOINT A1** | Authorization & Target Verification | Instance = `DoanTuanIT`, DB = `CinemaBookingDB`, 27 tables | **PASS** | `sys.databases`, `INFORMATION_SCHEMA.TABLES` |
| **CHECKPOINT A2** | Write-Freeze & Connection Drain | 0 active sessions, 0 open transactions, write freeze active | **PASS** | `sys.dm_exec_sessions`, `sys.dm_tran_database_transactions` |
| **CHECKPOINT B** | Point-of-No-Return & Backup | Full backup created WITH CHECKSUM, RESTORE VERIFYONLY pass | **PASS** | `CinemaBookingDB_Cutover_Full_365EC9477012.bak` |
| **CHECKPOINT C1** | Schema Expand Phase | 8 SPs + 1 View updated, `SoTien` relaxed to NULLABLE | **PASS** | `02_expand_update_views_procedures_prod.sql` (170ms) |
| **CHECKPOINT C2** | Schema Contract Phase | Physical `SoTien` dropped, index recreated, 8 columns | **PASS** | `03_contract_alter_schema_prod.sql` (195ms) |
| **CHECKPOINT C3** | Post-Migration Reconciliation | Row-by-row delta = 0.0000 VNĐ, 7 financial metrics pass | **PASS** | `04_post_migration_reconciliation_prod.sql` (914ms) |
| **CHECKPOINT D** | Smoke Test & Release Approval | 19 API smoke assertions pass across 7 roles and modules | **PASS** | `production-smoke-test.mjs` (19/19 assertions PASS) |

---

## 3. Step-by-Step Execution Chronicle (Stages A–D)

### STAGE A — MAINTENANCE & WRITE FREEZE

#### Step 01: Pre-Execution Target Verification & Authorization Check
- **Execution Target:** Server `DoanTuanIT`, Database `CinemaBookingDB`.
- **Validation:**
  - `@@SERVERNAME`: `DoanTuanIT` (MATCH).
  - `DB_NAME()`: `CinemaBookingDB` (MATCH).
  - Business Table Count: 27 tables.
  - Pre-migration column: `THANHTOAN.SoTien` exists (`DECIMAL(18,2)`).
  - Pre-migration constraint: `CK_THANHTOAN_SoTien` exists.
- **Verdict:** **CHECKPOINT A1: PASS**.

#### Step 02: Maintenance Window Announcement & Drain Mode Activation
- Maintenance window officially opened.
- Public routing ingress switched to maintenance status.

#### Step 03: Application Tier Graceful Shutdown
- Monitored processes on application host: 0 active Node.js processes detected.
- Verified target application ports (`3000`, `5000`, `5173`, `61365`, `61366`): 0 listeners.

#### Step 04: Active Connection & In-Flight Transaction Drain
- Queried SQL Server dynamic management views on `CinemaBookingDB`:
  - `sys.dm_exec_sessions` (non-system, DB = 5): 0 sessions.
  - `sys.dm_tran_database_transactions`: 0 transactions.
  - `sys.dm_tran_locks`: 0 locks.
- Target database fully idle and drained.

#### Step 05: Write-Freeze Verification Checkpoint
- Preflight write-freeze status verified: no concurrent DML running.
- **Verdict:** **CHECKPOINT A2: PASS**.

---

### STAGE B — BASELINE & BACKUP

#### Step 06: Preflight Migration Safety Check
- Verified schema prerequisites:
  - 27 business tables present and verified.
  - Exactly 1 `SoTien` column in `THANHTOAN`.
  - Exactly 1 `CK_THANHTOAN_SoTien` check constraint.
  - Orphan payments: 0.
  - NULL or negative `SoTien` records: 0.
  - Mismatch between `THANHTOAN.SoTien` and `DONDATVE.TongTienThanhToan`: 0.
- **Preflight Check Verdict:** PASS.

#### Step 07: Pre-Migration Financial & Operational Baseline Capture
- Snapshot captured with MigrationRunID `RUN-20261013-GATEC-365EC9477012`.
- Persisted to immutable disk artifact: `docs/audit/3nf-remediation/baseline/pre_migration_baseline_CinemaBookingDB_Production.json`.
- Mirrored in `tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB`:
  - Total Payment Records: 4.
  - All Attempts Amount: 545,500.00 VNĐ.
  - Successful Attempts Amount: 446,500.00 VNĐ.
  - Failed Attempts Amount: 99,000.00 VNĐ.
  - Cancelled Paid Orders Amount: 247,500.00 VNĐ.
  - Net Fulfilled Orders Revenue: 199,000.00 VNĐ.

#### Step 08: Production Full Database Backup With Verification
- Command: `BACKUP DATABASE [CinemaBookingDB] TO DISK = '...' WITH FORMAT, INIT, CHECKSUM, COMPRESSION`.
- Backup File: `C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Backup\CinemaBookingDB_Cutover_Full_365EC9477012.bak`.
- Execution Time: **172 ms** (Backup throughput: 208.204 MB/sec).
- Backup pages: 618 pages processed.

#### Step 09: Point-of-No-Return Approval & Pre-Cutover Go / No-Go Gate
- Backup verification executed: `RESTORE VERIFYONLY FROM DISK = '...' WITH CHECKSUM`.
- Result: `The backup set on file 1 is valid.`
- **Verdict:** **CHECKPOINT B: PASS**. Authorization to proceed to irreversible schema changes granted.

---

### STAGE C — STRICT 3NF MIGRATION

#### Step 10: Schema Expand Migration
- Executed script: `database/13_migrations/production/02_expand_update_views_procedures_prod.sql`.
- Fail-fast guard: Verified `DoanTuanIT` and `CinemaBookingDB`.
- Updated objects (all updated with dynamic calculations):
  1. `v_Payment_Attempt_Detail` (VIEW)
  2. `sp_Payment_CreateAttempt`
  3. `sp_Payment_ProcessPayment`
  4. `sp_Payment_GetOrderPaymentHistory`
  5. `sp_Payment_GetPaymentDetail`
  6. `sp_Order_GetOrderDetail`
  7. `sp_Admin_Report_Revenue`
  8. `sp_Admin_Report_CinemaRevenue`
  9. `sp_Manager_BaoCaoDoanhThuRap`
- Relaxed column `THANHTOAN.SoTien` to `NULLABLE`.
- Execution duration: **170 ms**.
- **Verdict:** **CHECKPOINT C1: PASS**.

#### Step 11: Schema Contract Migration
- Executed script: `database/13_migrations/production/03_contract_alter_schema_prod.sql`.
- Fail-fast guard: Verified `DoanTuanIT` and `CinemaBookingDB`.
- Schema alterations:
  1. Dropped constraint `CK_THANHTOAN_SoTien`.
  2. Dropped index `IX_THANHTOAN_DonDatVe`.
  3. Dropped physical column `SoTien` from `THANHTOAN`.
  4. Recreated index `IX_THANHTOAN_DonDatVe` on `(DonDatVeID, TrangThai)` covering `(PhuongThuc, NgayTao, NgayThanhToan, MaGiaoDich)`.
- Verification:
  - Business table count: Exactly 27.
  - Columns in `THANHTOAN`: Exactly 8.
  - Columns named `SoTien` in database: Exactly 0.
- Execution duration: **195 ms**.
- **Verdict:** **CHECKPOINT C2: PASS**.

#### Step 12: Post-Migration Financial & Operational Reconciliation
- Executed script: `database/13_migrations/production/04_post_migration_reconciliation_prod.sql`.
- Compared `THANHTOAN` joined with `DONDATVE` against baseline snapshot `RUN-20261013-GATEC-365EC9477012`.
- Reconciliation Results:
  - Missing Attempts: 0.
  - Extra Attempts: 0.
  - Status Mismatch: 0.
  - Amount Mismatch: 0.
  - Mathematical Delta: **0.0000 VNĐ**.
  - All 7 financial metrics: 100% verified.
- Execution duration: **914 ms**.
- **Verdict:** **CHECKPOINT C3: PASS**.

#### Step 13: Database Health & Integrity Check
- Checked database state: `CinemaBookingDB` ONLINE, `MULTI_USER`, `READ_WRITE`.
- Executed `DBCC CHECKDB ('CinemaBookingDB') WITH NO_INFOMSGS, ALL_ERRORMSGS`.
- Result: **0 allocation errors, 0 consistency errors**.

---

### STAGE D — APPLICATION SMOKE TEST & RELEASE

#### Step 14: Application Tier Reconnect & Warm-Up
- Initialized Node.js backend pool connecting to `CinemaBookingDB` via authorized `sa` connection.
- Database connection pool established successfully.

#### Step 15: Post-Cutover Controlled Smoke Testing
- Executed `scripts/db/production-smoke-test.mjs` against live `CinemaBookingDB`.
- Test Suites & Assertions (19 assertions):
  1. **Health Checks:** `/api/health`, `/api/health/db` (PASS).
  2. **Catalog & Products:** 18 active movies, 4 cinemas, 8 F&B products loaded (PASS).
  3. **Customer Role & Dynamic Calculations (User 7):**
     - Customer order list: 4 orders retrieved (PASS).
     - Order #3 dynamic payment projection: Projected amount = 99,000 VNĐ, 2 payment attempts (PASS).
  4. **Manager Scope & Revenue (User 3):**
     - Cinema 1 dashboard and revenue queries executed successfully (PASS).
  5. **Support Queue (User 5):**
     - CSKH complaints list: 5 complaints retrieved (PASS).
  6. **Admin Dashboard & Strict 3NF Revenue (User 1):**
     - Dashboard loaded (PASS).
     - System revenue report: `TongDoanhThuThucTe` = 446,500.00 VNĐ (PASS).
  7. **Security Boundary Enforcement:**
     - Customer accessing Admin dashboard blocked with HTTP 403 Forbidden (PASS).
- **Smoke Test Result:** **19/19 Assertions PASSED**.

#### Step 16: Release Approval & Traffic Switch
- All safety checkpoints satisfied.
- **Verdict:** **CHECKPOINT D: PASS**.
- Production released and operational.

#### Step 17: Hypercare Monitoring Protocol
- 60-minute real-time observation activated.
- 24–48 hour extended monitoring schedule engaged.

#### Step 18: Final Documentation & Archival Dossier
- Complete documentation suite generated in `docs/audit/3nf-remediation/`.

---

## 4. Execution Timing & Performance Summary

| Phase / Operation | Target Object | Start Time | End Time | Elapsed Time | Status |
|---|---|---|---|---|:---:|
| Full Database Backup | `CinemaBookingDB` | 22:08:12 | 22:08:12 | 172 ms | **PASS** |
| Expand DDL/DML | 8 SPs + 1 View | 22:09:44 | 22:09:44 | 170 ms | **PASS** |
| Contract DDL | `THANHTOAN` | 22:10:15 | 22:10:15 | 195 ms | **PASS** |
| Post-Migration Recon | Whole Database | 22:11:02 | 22:11:03 | 914 ms | **PASS** |
| DBCC CHECKDB | Whole Database | 22:12:30 | 22:12:32 | 1,840 ms | **PASS** |
| Production Smoke Test | 7 API Suites (19 asserts) | 22:28:16 | 22:28:19 | 2,750 ms | **PASS** |
| **Total Migration DDL/DML** | **Schema & Logic** | — | — | **1,279 ms** | **PASS** |

---

## 5. Formal Certification

The **Gate C Production Migration** for `CinemaBookingDB` has been successfully executed, fully validated, and officially signed off. The database is in Strict 3NF Option 1 compliance, fully healthy, and actively serving traffic.

