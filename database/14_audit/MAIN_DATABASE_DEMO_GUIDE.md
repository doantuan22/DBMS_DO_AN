# SSMS Main Database Demo Guide

## Readiness and target

**DATABASE READY FOR SSMS DEMO** is based on runtime execution against `DoanTuanIT / CinemaBookingDB`. The SQL scripts below were run on that database and produced the expected results. `FULL SYSTEM E2E VERIFIED` is not claimed: the core customer booking and simulated-payment HTTP path passed, but every Backend route family was not exercised through HTTP.

Connect in SSMS to the same SQL Server used by `backend/.env`, select `CinemaBookingDB`, and run this read-only preflight before each demo group:

```sql
USE [CinemaBookingDB];
SELECT @@SERVERNAME AS ServerName, DB_NAME() AS DatabaseName,
       DATABASEPROPERTYEX(DB_NAME(), 'Status') AS DatabaseState,
       (SELECT is_read_committed_snapshot_on
        FROM sys.databases WHERE database_id = DB_ID()) AS RCSI,
       @@TRANCOUNT AS OpenTransactions;
```

Expected: `DoanTuanIT`, `CinemaBookingDB`, `ONLINE`, RCSI `1`, and `OpenTransactions = 0`. Stop if the identity differs or your SSMS window already has an open transaction.

## SSMS execution order

Run each complete `.sql` file in a fresh SSMS query window connected to Main. The scripts include `USE` and target guards. Most return `Expected`, `Actual`, and `Verdict`; continue only when each required verdict is `PASS`.

| Order | Script | Expected runtime result |
|---:|---|---|
| 1 | `main_readonly_demo.sql` | 45/45 read-only assertions PASS; metadata for all 71 indexes and 142 constraints; `STATISTICS IO/TIME`; three actual execution-plan XML resultsets. |
| 2 | `main_readonly_procedure_demo.sql` | 14/14 Stored Procedure assertions PASS, including health, catalog, RBAC, promotion preview, showtime validation, and invalid-ID handling. |
| 3 | `main_trigger_demo.sql` | 21/21 assertions PASS; all nine triggers activated with valid, rejected, and multi-row DML fixtures. Each DML case rolls back. |
| 4 | `main_constraint_demo.sql` | 65/65 invalid CHECK cases rejected by the expected constraint. The DML is rolled back. |
| 5 | `main_key_fk_demo.sql` | 79/79 duplicate-key and missing-parent cases rejected by the expected PK/UQ/FK object. The DML is rolled back. |
| 6 | `main_booking_atomicity_demo.sql` | One PASS row: injected error `50410`; promotion use/order/ticket/food remain zero; fixture transaction rolls back. |
| 7 | `main_admin_crud_success_demo.sql` | 16/16 PASS: successful Actor/Genre/Product/Promotion/Cinema create/update/delete paths, then outer transaction rollback. Identity counters may advance. |
| 8 | Independent-session schedule race below | A holds the room lock; B waits on `LCK_M_X`; after A commits, B gets `50001` and returns PASS; exact fixture cleanup returns zero rows. |

The read-only procedure and object demos do not change persistent rows. Constraint, trigger, booking, and admin scripts use rollback fixtures. Positive DML across valid database constraints is exercised by the successful writer procedures and CRUD/booking demonstrations; a redundant positive case for every individual constraint is not needed for this defense suite.

## Independent-session showtime race

Use three SSMS query windows, all connected to `DoanTuanIT / CinemaBookingDB`:

1. In window **A**, run `main_schedule_concurrency_session_a_hold.sql`. It inserts the exact negative-ID fixture `-1900000123` and intentionally leaves one transaction open. Keep A open.
2. In window **B**, run `main_schedule_concurrency_session_b.sql`. It attempts an overlapping fixture `-1900000124` and should wait on A's application lock.
3. While B is waiting, run `main_schedule_concurrency_monitor.sql` in window **C**. Expected: `wait_type = LCK_M_X`, `BlockingSessionA` equals A's session ID, and `Verdict = PASS`.
4. In the same **A** window, run `main_schedule_concurrency_session_a_commit.sql`. Expected: A commits its one fixture row and releases the lock.
5. B should finish with SQL error `50001`, `SessionARows = 1`, `SessionBRows = 0`, and `Verdict = PASS`.
6. After B returns, run `main_schedule_concurrency_cleanup.sql`. It verifies the exact fixture intervals before deleting the two negative IDs, runs `DBCC CHECKCONSTRAINTS`, and returns `remaining fixture rows = 0`, `Verdict = PASS`.

The B script deliberately does not test whether it can read A's uncommitted row: RCSI hides that row by design. The Trigger's blocking and post-commit overlap check are the test oracle. If the test stops before A commits, run `ROLLBACK TRANSACTION` in A's original window. If A already committed, let B finish before running cleanup. Do not close A or run cleanup while B is still waiting.

For an automated replay of these same SQL files across independent SQL Server sessions, run from the repository root:

```powershell
node database/14_audit/run_main_ssms_schedule_concurrency_demo.mjs
```

Latest evidence: `.audit-output/main-ssms-schedule-concurrency-demo.json` (six checks PASS, exact fixture absent, table fingerprints unchanged, DBCC clean, no open transaction). Earlier harness attempts are retained separately with their RCSI visibility/monitor-filter cause.

## Backend and simulated payment check

To exercise the core HTTP-to-SP path without starting the normal expiry worker:

```powershell
node database/14_audit/main_backend_api_payment_drill.mjs
```

This audit runner imports `createApp()` directly on an ephemeral localhost port; it does not import `server.js` or start `startExpirePendingOrdersJob`. It checks customer login/RBAC, seat listing, booking preview/create, order detail, payment attempt, invalid callback refusal, simulated success callback, points award, and duplicate-callback idempotency. The successful flow runs inside a Main transaction and rolls back. Expected: 15/15 PASS, unchanged business-row fingerprints and point balance, zero DBCC findings, and no open transaction. SQL Server identity values can still advance on rollback. Evidence: `.audit-output/main-backend-api-payment-drill.json`.

The callback is a simulated provider response. No real payment account or external provider transaction is needed for this DBMS demo.

## Final integrity check and recovery

After the demo groups, run:

```sql
USE [CinemaBookingDB];
SELECT @@SERVERNAME AS ServerName, DB_NAME() AS DatabaseName,
       DATABASEPROPERTYEX(DB_NAME(), 'Status') AS DatabaseState,
       @@TRANCOUNT AS OpenTransactions;
DBCC CHECKDB (N'CinemaBookingDB') WITH NO_INFOMSGS, ALL_ERRORMSGS;
DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS, NO_INFOMSGS;
SELECT SuatChieuID, PhongID, ThoiGianBatDau, ThoiGianKetThuc
FROM dbo.SUATCHIEU
WHERE SuatChieuID IN (-1900000123, -1900000124);
```

Expected: Main is online, `OpenTransactions = 0`, DBCC returns no findings, and the final query returns no rows. The audit's full row-fingerprint and server-state verification is recorded in `.audit-output/main-final-state.json`.

Every write demo is designed to roll back or remove its exact audit fixture. A verified COPY_ONLY/CHECKSUM backup and `RESTORE VERIFYONLY` evidence are kept in `.audit-output/database-backups/`; the actual restore drill restored to a unique temporary database and did not overwrite Main or `CinemaBookingDB_Test`. Do not restore over Main as a normal demo step. If a transaction is interrupted, use `ROLLBACK` in the same SQL session; if the committed concurrency fixture remains, run its exact cleanup script only after both sessions return.

Rolled-back inserts can leave identity gaps (`DIENVIEN`, `THELOAI`, `SANPHAM`, `KHUYENMAI`, `RAPCHIEUPHIM`, `DONDATVE`, `CHITIETVE`, `THANHTOAN`). These are SQL Server identity allocation behavior, not leftover rows. Do not reseed identity values.

## Evidence files

- `.audit-output/main-ssms-readonly-demos.json`
- `.audit-output/main-trigger-demo.json`
- `.audit-output/main-constraint-demo.json`
- `.audit-output/main-key-fk-demo.json`
- `.audit-output/main-booking-atomicity-ssms-demo.json`
- `.audit-output/main-admin-crud-ssms-demo.json`
- `.audit-output/main-concurrency-drill.json` (seat, promotion quota, and schedule races)
- `.audit-output/main-ssms-schedule-concurrency-demo.json` (the exact SSMS schedule scripts on independent sessions)
- `.audit-output/main-backend-api-payment-drill.json`
- `.audit-output/main-final-state.json`
