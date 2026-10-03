# R1 — TIMEZONE & DATETIME CONTRACT

Status: **PASS — DONE**. Completed 2026-10-03 on branch `tuan`.
Source, clean rebuild and actual development database `CinemaBookingDB`
implement the same contract. No commit/push was performed.

## 1. ROOT CAUSE

| Layer | Pre-fix finding | Final behavior |
|---|---|---|
| DB | fn_BayGio produced Vietnam wall-clock components in datetime2. Seeds were local; API-created shows encoded UTC. | UTC clock/storage; seed origin proven before conversion. |
| Driver | mssql 12.7.2 / tedious 20.0.0 defaulted to useUTC=true; datetime2 carries no offset. | Explicit useUTC=true matches storage and input. |
| Backend | Date(offset) preserved epoch; local SQL now decoded as UTC Date. DATE carriers could leak ISO timestamps. | Central parsing and metadata-aware Procedure Client serialization. |
| API | Local SQL values labeled Z; ambiguous instant inputs accepted. | Explicit offset required; UTC ISO responses and DATE strings. |
| Frontend | Naive datetime-local parse depended on host timezone; raw SQL HH:mm could present UTC as cinema time. | Named-zone input/display, authoritative server deadline. |

The seven-hour error originates at **SQL local clock → driver UTC decoding**,
not an epoch change in the offset-bearing input. Comparisons mixed that local
clock with API-created UTC shows. Raw SQL display and naive frontend input
were additional representation defects.

[Before probe](evidence/bug-001-before.json): intended 19:30 Vietnam became
12:30Z through input/driver with delta 0; SQL now became 21:51:45.301Z instead
of 14:51:45.301Z, and hold deadline had the same **25,200,000 ms** error.
The UTC-clock regression failed before correction. [After trace](evidence/integration-UTC.json)
records local input, HTTP, typed Date, create SP/stored components, read
SP/driver, DTO, JSON, React epoch and display: every epoch delta is 0.

## 2. DATETIME CONTRACT

Single maintained specification: [docs/DATETIME_CONTRACT.md](../../docs/DATETIME_CONTRACT.md).

| Concern | Rule |
|---|---|
| Instant | UTC components in SQL datetime2(7) |
| Business zone | Asia/Ho_Chi_Minh from shared/dateTimeContract.mjs; SQL's SE Asia Standard Time confined to conversion helpers |
| API | Explicit Z/offset inputs; UTC ISO responses, e.g. 2026-10-03T12:30:00.000Z |
| DATE_ONLY | SQL DATE ↔ YYYY-MM-DD; no timezone conversion/ISO slicing |
| SQL now | fn_BayGio=SYSUTCDATETIME; fn_HomNay derives business date |
| UI | datetime-local means cinema-local; Temporal conversion and explicit-zone Intl display |
| Duration | Elapsed numeric units; hold remains five minutes |
| Authority | DB controls expiry/seat/payment eligibility; countdown displays server deadline |

19:30 Vietnam ↔ 12:30Z is one instant. 00:30 Vietnam October 3 ↔ 17:30Z
October 2 retains business date October 3. Birthday 2000-01-01 stays unchanged.
Report October 3 covers [October 2 17:00Z, October 3 17:00Z), with the original
inclusive DATE filter policy retained.

## 3. TEMPORAL INVENTORY

| Scope | Total | INSTANT | DATE_ONLY | TIME_ONLY | DURATION | UNKNOWN |
|---|---:|---:|---:|---:|---:|---:|
| Temporal table columns | 23 | 14 | 9 | 0 | 0 | 0 |
| Additional movie integer column | 1 | 0 | 0 | 0 | 1 | 0 |
| Hold/legacy extension function outputs | 2 | 0 | 0 | 0 | 2 | 0 |
| Legacy showtime HH:mm projections | 2 | 0 | 0 | 2 | 0 | 0 |

Technical timeouts are numeric durations and unchanged. Repeated API projections
are not counted as additional stored columns. [Full field inventory](R1_TEMPORAL_INVENTORY.md)
contains type/meaning/category, writers/readers, API/UI consumers, before/target
semantics and risks. Live metadata confirms datetime2(7).
[Module inventory](evidence/sql-temporal-module-inventory-after.json) covers
54 temporal signatures, temporal view fields and all 124 procedures. SQL Server
describes 115; all nine temporary/conditional/forwarding cases have explicit
source-based resolutions. All seven triggers inspected. UNKNOWN=0 describes
classified field meanings, not permission to migrate unproven historical rows.

## 4. CODE CHANGES

Database: central UTC clock/named-zone helpers; cinema-date filters, dashboards,
report grouping and weekend pricing corrected. Proven local seed literals
converted through the helper. Build order, manifest and verify definitions
contain all objects. Booking/payment/expiry/cancellation/trigger definitions
remain intact and inherit the corrected clock.

Backend: explicit useUTC, utils/dateTime.js, metadata-aware Procedure Client
normalization for typed inputs/all resultsets/output parameters; auth/catalog/
admin/manager mapping and validators; order holdExpiresAt from existing HanGiuCho.
No raw business SQL, ORM, SP bypass or unrelated validation changes.

Frontend: central utils/dateTime.js/HoldDeadline; Admin/Manager local forms,
showtime/catalog, booking/order/payment, review/complaint/support display,
profile birthday and business date defaults. Manager movie ID edits preserve
local form state until submit. Actual React portal regression covers this plus
Admin showtime/promotion edit roundtrip. Pinned **@js-temporal/polyfill 0.5.1**
is required for IANA-aware input: no existing timezone library/native Temporal
was available. Backend accepts instants and needs no added dependency.

Exact paths: [changed-files.json](evidence/changed-files.json). Core modules:
backend/src/config/database.js, backend/src/db/procedureClient.js,
backend/src/utils/dateTime.js, frontend/src/utils/dateTime.js,
frontend/src/components/HoldDeadline.jsx, shared/dateTimeContract.mjs.

## 5. DATABASE OBJECTS CHANGED

| Kind | Objects |
|---|---|
| Procedures: 7 | sp_Admin_Dashboard, sp_Admin_Report_Revenue, usp_Admin_Showtime_List, sp_Manager_Dashboard, sp_Manager_Revenue, sp_Manager_Showtime_List, sp_System_HealthCheck |
| View: 1 | vw_LichChieuChiTiet |
| Existing functions: 3 | fn_BayGio, fn_HomNay, fn_TinhGiaVe |
| New functions: 3 | fn_GioRap, fn_UtcTuGioRap, fn_NgayKinhDoanh |
| Triggers | 0 changed; all 7 audited |
| Schema/indexes/constraints | 0 structural changes; datetime2(7)/DATE retained |

Eight defaults are temporarily dropped/re-added with identical definitions to
permit altering their referenced clock. ClockVN constraint names are retained
compatibility names. Five seed files and baseline/build/verify/test orchestration
are updated. No business lifecycle rule changed.

Final baseline: **26 tables, 6 views, 20 functions, 7 triggers, 124 procedures,
61 indexes, 157 constraints**. Only three added helper functions change counts.
[Main verify](../../database/_audit/verify-CinemaBookingDB.json): all **157**
source/live module definitions match; problems=0.

## 6. TEST RESULTS

| Check | Result |
|---|---|
| Backend | 96/96 PASS, including six temporal regressions |
| Frontend | 31/31 PASS, including five temporal regressions |
| Build/lint | PASS/PASS; [checks](evidence/checks-final.json), per-check final.txt logs |
| SQL/driver/SP/DTO/JSON | Create/read trace delta 0 |
| API | 10 checks/29 real HTTP requests PASS under UTC, Vietnam and default host; offset-equivalent accepted, ambiguous input 400 |
| Showtime | CREATE/READ/UPDATE/LIST/FILTER/DISPLAY PASS; edit 19:45 preserved; overlap still 409 |
| Actual Chrome | UTC/Vietnam/Los Angeles: HTML controls and actual Manager create/Admin showtime+promotion edit PASS; milliseconds preserved; [browser evidence](evidence/browser-timezone.json) |
| Hold | Five minutes unchanged; registration/booking/payment SQL now matches UTC |
| Expiry | Actual expiry SP at deadline−1s/equality/+1s PASS; equality expired; [fixed clock](evidence/sql-fixed-clock-report-expiry.json) |
| Report/pricing | Local midnight included/next midnight excluded, manager/admin two orders=160000; Friday UTC→Saturday local weekend pricing PASS |
| DATE_ONLY | Birthday update/read plus actor/movie/pricing API strings; all nine DATE columns audited; no migrated DATE changes |
| Near midnight | 00:30 local maps to previous UTC day and correct manager/admin/catalog business-date filters |
| HTTP smoke | Main 33 requests PASS; rebuilt disposable 33 PASS |
| Concurrency | 3 suites PASS: seat uniqueness/hold limits, pricing overlap, cinema image locks; [evidence](../../database/_audit/concurrency-CinemaBookingDB_R0_R1_Final20261003.json) |
| Reset/test/verify | Clean disposable reset from zero PASS; db:test PASS; main/disposable verify PASS |
| Migration | Forward/rollback reproduce all 26 fingerprints+definitions; modified dataset refused before conversion; [refusal](evidence/migration-refusal.json) |

Reproduce in PowerShell at repository root, with dependencies installed:

```powershell
npm run r1:checks
npm run db:reset -- --database=CinemaBookingDB_R0_R1_Review
npm run db:test -- --database=CinemaBookingDB_R0_R1_Review
npm run r1:integration -- --database=CinemaBookingDB_R0_R1_Review
npm run r1:sql-tests -- --database=CinemaBookingDB_R0_R1_Review
npm run r1:browser
node scripts/db/backend-smoke.mjs --database=CinemaBookingDB_R0_R1_Review --stress
npm run db:verify
node scripts/r1/repository-scan.mjs
```

Set process TZ to UTC/Asia/Ho_Chi_Minh to repeat Node host variants. Integration
mutates explicitly named disposable DBs only. SQL fixed-clock fixtures roll back
data/clock/defaults. Browser tests use an owned headless profile and mocked HTTP
for actual React forms; real HTTP/SP behavior has separate integration evidence.
Chrome is required, or configure R1_CHROME_PATH. Restart an already running
backend/frontend to load changed source; existing user processes were not restarted.

## 7. HISTORICAL DATA

Before conversion the main DB matched **all 26 immutable R0 seed fingerprints**,
with no bookings/payments/reviews/complaints. Populated instant rows therefore
had documented local seed origin; origin was not inferred from the error alone.
[R0 reference](evidence/R0-seed-reference.json), [independent R1 reference](evidence/R1-seed-reference.json),
[before](evidence/historical-data-before.json), [after](evidence/historical-data-after.json),
[main migration](evidence/migration-CinemaBookingDB.json).

| Table | Modified rows | Timestamp fields |
|---|---:|---|
| NGUOIDUNG | 8 | NgayTao |
| HINHANH_RAPCHIEUPHIM | 3 | NgayTao |
| VAITRO_QUYEN | 40 | NgayGan |
| KHUYENMAI | 3 | NgayBatDau, NgayKetThuc |
| SUATCHIEU | 5 | ThoiGianBatDau, ThoiGianKetThuc |

**59 proven seed rows / 67 timestamps** converted. DATE and non-temporal data
unchanged; ambiguous historical rows modified=0. All 26 final full-table hashes
match independently rebuilt R1 seed.

COPY_ONLY/CHECKSUM backup with RESTORE VERIFYONLY PASS; recovery location is in
ignored local database/_audit/R1-recovery-location.local.json. Disposable pinned
R0 forward/rollback and refusal tests preceded main rollout. The migration checks
all hashes again under exclusive transaction locks, rejects definition drift,
and commits atomically only if final hashes match. This utility is development-
only and limited to this exact seed, not arbitrary production data.

Rollback command for the still-unmodified exact seed:

```powershell
node scripts/r1/migrate-seed.mjs --database=CinemaBookingDB --rollback --apply
```

Rollback restores pinned R0 definitions/data semantics and the known R0 defect;
pair with the R0 application checkout. Pinned Git commit
9867d15ba93f73dd8afcd618f99ab1c226289e11 must be available. If data changed,
the script refuses conversion: use the verified backup under an explicit recovery
plan. No automatic restore discarding new data is performed. Forward uses the
same command without --rollback and refuses already migrated/modified datasets.

## 8. STATIC SCAN

Active production source: **0 manual offsets; 0 suspicious host-local input/
DATE conversions**. [Active scan](evidence/static-scan-after.json),
[whole repository scan](evidence/repository-static-scan.json).

Whole repository review includes immutable legacy/audit material. Old buggy
definitions/SQL plans and measured deltas remain evidence; offline probes/scan
rules name prohibited patterns. One concurrency fixture synthesizes a future date
via Date.UTC/ISO slicing instead of converting a stored DATE. All such occurrences
are classified in the JSON and are not runtime patches. Backend raw business
SQL=0; procedure contract missing source=0.

## 9. REMAINING RISKS / DEFERRED

SQL keeps seven fractional digits; JS/REST promises milliseconds, not sub-ms
identity. Countdown accuracy depends on client clock and remains informational.
Windows/IANA zone correspondence is verified for contemporary booking dates;
arbitrary historical regional timezone reconstruction is not claimed.
Business-date UDF filtering retains existing query shapes; query-plan tuning
and the approximately 510 KB frontend chunk warning are outside R1.

Modified/unknown datasets: **DATA REMEDIATION DEFERRED** until provenance,
deterministic conversion, backup and rollback are proven. Main's exact seed has
no unresolved rows. Cancellation/refund, late callback, payment/booking lifecycle,
promotion policy, RBAC and other audit gaps remain deferred. Missing UI filters
and Manager edit workflows were not added.

## 10. FINAL VERDICT

BUG-001 resolved: **YES**. DB→driver/SP→DTO/JSON→React contract consistent:
**YES**, same-epoch trace and actual form verification. Database reproducible:
**YES**, clean reset/verify/concurrency PASS. Ready for R2: **YES**.

Every definition-of-done item has evidence: reproduction, documented central
contract/timezone, DATE protection, UTC clock/driver/API, local input/display,
expiry/midnight/report regressions, zero active offsets, source baseline,
reset/verify/tests/smoke/concurrency, unchanged policies and required documents.
