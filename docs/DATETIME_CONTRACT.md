# Datetime contract — R1

Contract version: R1. Applicable to R1 databases and source; business policies
are unchanged. R0 and its audit remain historical evidence.

## Business timezone and categories

The shared JavaScript constant in `shared/dateTimeContract.mjs` is
`Asia/Ho_Chi_Minh`. Backend and frontend re-export it from their time modules.
SQL Server uses its corresponding Windows zone, `SE Asia Standard Time`, only
inside the two conversion helpers. This correspondence is tested for the
system's contemporary booking/report dates.

| Category | Meaning | Database | REST | Conversion |
|---|---|---|---|---|
| INSTANT | One point on the timeline | UTC components in datetime2(7) | ISO UTC ending Z | Convert only at an explicit local input/display boundary |
| DATE_ONLY | Business calendar date | DATE | YYYY-MM-DD | None |
| TIME_ONLY | Local clock time, without a date/instant | Compatibility HH:mm fields | HH:mm | Never parse as an instant |
| DURATION | Elapsed amount | Integer minutes or milliseconds | Number | None |

`NgayBatDau`/`NgayKetThuc` are DATE for pricing/assignments but datetime2 for
promotions. Classify by SQL type and meaning; field names do not determine
semantics. There are 23 temporal table columns: 14 INSTANT and 9 DATE_ONLY.
There is no temporal column with unknown semantics. Movie duration is an
additional integer column; hold/legacy extension functions return durations.

## SQL storage and authoritative now

All 14 instant columns store UTC components. datetime2 does not carry an
offset itself; the contract supplies the UTC meaning.

- `fn_BayGio()` returns `SYSUTCDATETIME()`.
- All default clocks, booking/seat/payment comparisons and deadline calculations
  use that instant timeline. Existing callers and lifecycle comparisons stay intact.
- `fn_GioRap(utcInstant)` returns a business-local datetimeoffset.
- `fn_UtcTuGioRap(localDateTime)` interprets an explicitly local SQL value and
  returns UTC datetime2.
- `fn_NgayKinhDoanh(utcInstant)` derives the business DATE.
- `fn_HomNay()` returns the business date of authoritative UTC now.

The eight existing constraint names ending `ClockVN` are kept for structural
compatibility. They now call a UTC function; their names are historical.
Do not infer semantics from a constraint name.

## Driver, Procedure Client and backend

Tested versions: node-mssql 12.7.2 and tedious 20.0.0. Central database config
explicitly sets `options.useUTC = true`. The same choice is used for inputs
and results; changing it to false would depend on the host timezone.

`backend/src/utils/dateTime.js` validates offset-bearing API instants and
calendar dates. `parseApiInstant` produces a Date for typed instant parameters;
`serializeInstant` produces UTC ISO. A Date is a carrier for an instant, not
a business-local wall-clock value. Native Date/JSON precision is milliseconds;
SQL retains datetime2(7), so sub-millisecond values are not promised by REST.

Procedure Client uses recordset SQL metadata to distinguish a SQL DATE carrier
from a timestamp. It reads UTC calendar components of a DATE carrier and emits
YYYY-MM-DD; it never timezone-converts that calendar date. Instant Date values
emit ISO UTC. NULL stays NULL. Date output parameters receive the same handling.
No query API, raw SQL or ORM was introduced in backend code.

## API request and response rules

Instant requests must include seconds and Z or an explicit numeric offset:

```json
{ "startsAt": "2026-10-03T12:30:00.000Z" }
```

`2026-10-03T19:30:00+07:00` is equivalent and accepted. Ambiguous inputs such
as `2026-10-03T19:30` or `2026-10-03 19:30:00` are rejected with HTTP 400 for
instant endpoints. Invalid calendar dates are rejected instead of rolled over.

All real instant response fields are ISO UTC. Existing field names remain.
`holdExpiresAt` is also exposed on order DTOs from the existing SQL field, so
booking/detail/payment screens use the same server deadline.

DATE requests/responses remain YYYY-MM-DD, including birthday, actor birthday,
movie release/end, cinema opening, assignment and pricing dates. Never attach
midnight Z or cut an ISO string to derive a date-only value.

Legacy catalog `date`, `startTime`, `endTime` retain their existing names.
`date` is a derived business DATE; HH:mm fields are explicitly TIME_ONLY
compatibility output from SQL, not timestamps. React renders showtime time from
`startsAt`/`endsAt`. Backend does not format user-facing display strings.

## Frontend input and display

`frontend/src/utils/dateTime.js` owns display, business date, local input and
countdown conversion. `Intl.DateTimeFormat` always receives the explicit
business timezone for instant display. DATE display uses Temporal.PlainDate.

The project previously had no timezone-aware input library and the tested Node
runtime has no native Temporal. `@js-temporal/polyfill` **0.5.1** is pinned in
frontend package/lockfile to implement IANA-aware local input without a custom
offset engine. Backend only accepts instants and therefore needs no polyfill.

HTML datetime-local has no timezone. Admin/Manager fields mean Vietnam cinema
time. Submit with `businessLocalToInstant`; edit with `instantToBusinessLocal`.
The Admin input permits millisecond precision so an untouched edit preserves
the API instant. Date-only controls bind the original DATE string directly.

```text
Manager input:       2026-10-03T19:30
Explicit input zone: Asia/Ho_Chi_Minh
SQL UTC components: 2026-10-03 12:30:00
REST:               2026-10-03T12:30:00.000Z
Display:            03/10/2026 19:30
Edit local:         2026-10-03T19:30:00.000

Near midnight:      2026-10-03T00:30 (cinema)
REST:               2026-10-02T17:30:00.000Z
Business date:      2026-10-03

Birthday SQL/API:    2000-01-01
Birthday display:   01/01/2000
Timezone conversion: none
```

## Reports, filters and pricing boundaries

Showtime date filters, dashboard today, report payment dates and weekend pricing
derive the business date with `fn_NgayKinhDoanh`. Existing inclusive date range
and aggregation/payment-status policies remain unchanged.

For the Vietnam date 2026-10-03, the instant range is
`[2026-10-02T17:00:00Z, 2026-10-03T17:00:00Z)`.
The start belongs to that date; next local midnight does not. Do not cast a UTC
timestamp directly to DATE for a business-day filter. UDF date conversion keeps
existing SQL filter shapes; query-plan tuning is outside this phase.

## Hold and expiration

The original hold duration remains five minutes. Expiry is creation UTC plus
that duration. A pending order holds a seat strictly while `deadline > now`;
the existing expiry procedure uses `deadline <= now`. At the exact boundary
the hold is expired. SQL/server is authoritative for seat availability and
payment eligibility. Frontend countdown estimates remaining time from the
server deadline and current client clock; it cannot change an order's status.

Fixed-clock tests alter the clock only inside a rollback-only transaction on a
guarded disposable database. No production clock injection was added.

## Existing data and rollout

The inspected CinemaBookingDB exactly matched all 26 R0 seed hashes. It had no
booking/payment/review/complaint history. The five populated instant-bearing
tables were proven unchanged seed, not rows from the broken API path. A guarded
migration converted only these **59 seed rows / 67 timestamp values**, after
verified COPY_ONLY/CHECKSUM backup and tested forward/rollback. All 26 tables
then matched an independently rebuilt R1 seed, including unchanged DATE values.

`scripts/r1/migrate-seed.mjs` is deliberately limited to this pinned seed and
R0 source commit. It rechecks full data hashes under exclusive transaction locks,
rejects SQL definition drift, and rolls back if target fingerprints differ.
Any modified/unknown dataset is refused: **DATA REMEDIATION DEFERRED** until
per-row origin, deterministic conversion, backup and rollback are proven.
It is not a migration utility for arbitrary production data. Rebuild new test
databases from `database/` source; do not run old R0 extraction tooling.

## Forbidden patterns and verification

No manual addition/subtraction of seven hours, millisecond offsets, host-local
parse of datetime-local, `useUTC=false` guesses, date-only ISO slicing, or
timezone helpers scattered through services/components. Do not mass-update
unknown timestamps. Do not change cancellation, refund, late callback or
payment/booking/promotion/RBAC policy in this phase.

Regression covers UTC SQL now, real driver/SP/DTO/JSON roundtrip, local forms,
midnight, DATE carriers, fixed expiry boundaries, report boundaries, weekend
pricing and timezone independence in Node and actual Chrome. See
[R1 report](../audit/remediation/R1_TIMEZONE_REPORT.md) for commands and evidence.

Primary reference semantics: [SQL datetime2](https://learn.microsoft.com/en-us/sql/t-sql/data-types/datetime2-transact-sql),
[AT TIME ZONE](https://learn.microsoft.com/en-us/sql/t-sql/queries/at-time-zone-transact-sql),
[SYSUTCDATETIME](https://learn.microsoft.com/en-us/sql/t-sql/functions/sysutcdatetime-transact-sql),
and the [Temporal polyfill](https://github.com/js-temporal/temporal-polyfill).
