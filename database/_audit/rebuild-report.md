# DATABASE FULL REBUILD

Status: **PASS** — reproducible R0 baseline, not audit remediation. Captured 2026-10-03.

## Before and after

| Object | Live before | Legacy source replay | Rebuilt baseline |
|---|---:|---:|---:|
| tables | 26 | 26 | 26 |
| views | 6 | 6 | 6 |
| functions | 17 | 14 | 17 |
| triggers | 7 | 7 | 7 |
| procedures | 124 | 121 | 124 |
| indexes | 61 | 61 | 61 |
| constraints | 157 | 157 | 157 |

Initial Git status contained two deleted audit documents and untracked docs/audit-full-20261003 + scripts/audit-full-20261003. Those user changes were preserved. All original database source/deployment/tests were copied to _legacy_snapshot before rewrite; its legacy password default was removed. A COPY_ONLY/CHECKSUM backup passed RESTORE VERIFYONLY before the first DROP. Recovery location is local and ignored by Git. No backup is needed to build a new clone.

## Reconciliation

DB_ONLY modules (6), all kept and brought into source:

- fn_BayGio
- fn_GheCoVeHieuLucSuatTuongLai
- fn_HomNay
- sp_Clock_GetNow
- sp_Showtime_CancelCascade
- sp_Showtime_ValidateTimes

SOURCE_ONLY modules: 0. DIFFERENT_DEFINITION modules: 35, all preserved from deployed behavior. Table 26 is HINHANH_RAPCHIEUPHIM, created by migration 009 and refined in 010/011; public/admin callers require it. DONDATVE.LyDoHuy and ThongBaoHuy were live-only columns and retained. Eight function-backed clock DEFAULT definitions differed from source and were retained. PK/FK/UNIQUE/CHECK/index structure matched ordered legacy replay. Twenty-five server-generated DEFAULT names replaced by stable DF_table_column names; values/behavior unchanged. Three wildcard SP projections expanded to the same existing columns/order. Five legacy forwarding aliases received explicit NOCOUNT; their target procedures already used NOCOUNT, so resultsets/business rules remain unchanged. No application object removed; old SQL is archived and excluded from baseline.

Per-object decisions/dependencies: current-db-inventory.md, module-reconciliation.json, reconciliation-report.md. Exact structural differences: structural-reconciliation.json. Procedure signature differences: signature-reconciliation.json. Unused/legacy procedures kept rather than removed; no unknown critical dependency outstanding.

## Rebuild and backend evidence

- Clean DROP/CREATE CinemaBookingDB run #1: PASS; run1-metadata.json + run1-verify-CinemaBookingDB.json.
- Clean DROP/CREATE run #2: PASS; run2-metadata.json + verify-CinemaBookingDB.json.
- All 26 table seed-data SHA256 fingerprints match between the final two rebuilds; same SeedDate, no audit/history fixtures.
- All 154 module definitions match source; run #1/#2 definition parity: PASS.
- Baseline has 61 indexes (36 PK/UQ backing, 25 standalone) and 157 constraints (26 PK, 10 UQ, 30 FK, 55 CHECK, 36 DEFAULT).
- SQL verify: named object/column/constraint/index/signature/trigger/orphan/role permission checks, SP/view/trigger refresh and 17 function bindings PASS.
- SQL smoke: auth/public/showtime/seat/booking/payment/order/review/complaint/manager/CSKH/admin/report PASS; writes rolled back. Multirow trigger, uniqueness, FK and EXECUTE-only permission probes PASS.
- Backend sa connection and both /api/health + /api/health/db: PASS. Latest HTTP smoke: 33 successful requests, including four-role login and core portal reads.
- Procedure contract capture: 112 methods, 120 calls, 120 whitelist entries/119 unique SP, missing source=0, unknown parameters/types=0.
- Backend unit tests: 90/90 PASS; no-SQL scan PASS, raw business SQL=0.
- Concurrency on disposable R0_Test: booking competing/overlapping seats + holding-order limit, pricing overlap and image lock PASS. Fixtures stayed out of CinemaBookingDB.
- Negative verify: changed definition and disabled trigger rejected even with unchanged object counts; probes restored.
- Source-only clean clone: PASS without .env, node_modules, audit artifacts, legacy SQL or .bak; final source built CinemaBookingDB_R0_CloneFinal.
- Configured DB password scan across produced SQL/tooling artifacts: PASS; password not hardcoded or committed.

## Deliberately deferred issues

No new timezone/refund/cancellation/late callback/permission/promotion/lifecycle/financial policy chosen. Existing fn_BayGio includes its already-deployed UTC+7 conversion, kept verbatim rather than introducing another offset. Cascade cancellation/refund helpers and payment timing behavior are kept from live definitions. Historical audit data was backed up, not rewritten; anomalous audit rows were not copied into seed.

Ten pre-existing service error mapping gaps are recorded separately; tests now read canonical baseline and distinguish these reported gaps from new regressions, without changing backend mappings or SQL business behavior:

| Flow | Code | Deferred reason |
|---|---:|---|
| admin | 50123 | Existing deployed showtime update rule has no API error mapping. Preserve policy; defer mapping remediation. |
| admin | 50120 | Existing deployed showtime update rule has no API error mapping. Preserve policy; defer mapping remediation. |
| manager | 50207 | Existing future-ticket seat update rejection has no manager API mapping. |
| manager | 50123 | Existing deployed showtime update rule has no manager API mapping. |
| manager | 50120 | Existing deployed showtime update rule has no manager API mapping. |
| orders | 50121 | Existing payment/showtime eligibility rejection has no order API mapping. |
| manager | 50119 | Existing cascade cancellation rejection has no manager API mapping. |
| admin | 50119 | Existing cascade cancellation rejection has no admin API mapping. |
| manager | 50216 | Existing showtime time validation rejection has no manager API mapping. |
| admin | 50216 | Existing showtime time validation rejection has no admin API mapping. |

Only SQL Server 2025 was exercised live. Compatibility selection supports older 2016 SP1+ servers but their integration is untested here. Smoke exercises representative contracts, not every business branch. Rollback tests consume identity sequence numbers; they do not leave business rows. Production security roadmap remains least privilege/EXECUTE-only.

## Outcome

CinemaBookingDB can be rebuilt from zero with npm run db:reset. Source definitions and rebuilt live objects are synchronized. Audit Remediation can start from this versioned baseline, with the preserved issues listed above. Main changes: database/00_database–12_verify, baseline-manifest.json, run-all/reset/build entry points, scripts/db, scripts/reset-db.ps1, backend/.env.example, typed output guard, baseline-aware tests, npm scripts and database README.
