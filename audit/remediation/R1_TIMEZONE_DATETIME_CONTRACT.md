# R1 — TIMEZONE & DATETIME CONTRACT

Status: PASS — DONE. Completed 2026-10-03.

Preflight: branch `tuan`, clean worktree. R0 reports and database README reviewed;
R0 counts: 26 tables, 6 views, 17 functions, 7 triggers, 124 procedures,
61 indexes, 157 constraints. Historical data was initially deferred pending provenance proof.

Target: UTC instants in SQL datetime2 and explicit UTC ISO in REST; business
timezone Asia/Ho_Chi_Minh; SQL DATE remains date-only. Existing expiry,
cancellation, refund, callback, promotion and RBAC rules must remain unchanged.

Initial evidence: fn_BayGio returns Vietnam wall-clock while tedious defaults
to useUTC=true. Showtime inputs use Date(offset), which encodes UTC components.
fn_HomNay currently casts fn_BayGio to DATE; this must keep business-day semantics
when fn_BayGio is changed to UTC. Existing audit BUG-001 includes independent
showtime and five-minute hold probes.

Inventory and [reproduction evidence](evidence/bug-001-before.json) were saved
before implementation. The probe measured 25,200,000 ms between UTC SQL now
and the local-clock value decoded as UTC. The offset-bearing input preserved
epoch through mssql. The UTC-clock regression failed before the fix.

Final live data provenance: all 26 tables matched immutable R0 seed hashes
exactly, with no booking/payment/review/complaint history. After verified backup,
disposable forward/rollback and refusal tests, only 59 proven seed rows / 67
timestamp values were converted on CinemaBookingDB. All 26 target hashes match
an independently rebuilt R1 seed. Ambiguous rows modified=0; DATE values changed=0.
The earlier no-write check remains pre-migration evidence, not final live state.

Final baseline: 26 tables, 6 views, 20 functions, 7 triggers, 124 procedures,
61 indexes, 157 constraints. Main verify and clean rebuild PASS; all 157
module definitions match source. Backend 96/96, frontend 31/31, SQL/API,
actual Chrome portals under three host zones, expiry/report boundaries,
33-request smoke and three concurrency suites PASS. Policies remain unchanged.

The maintained specification is [DATETIME_CONTRACT.md](../../docs/DATETIME_CONTRACT.md).
See [R1_TIMEZONE_REPORT.md](R1_TIMEZONE_REPORT.md) and
[inventory](R1_TEMPORAL_INVENTORY.md) for evidence, exact objects, commands,
historical rollout, limitations and deferred R2 work. Initial observations
above describe R0; the linked contract and report describe the final state.
