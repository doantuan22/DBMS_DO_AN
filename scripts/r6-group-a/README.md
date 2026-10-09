# R6 Group A — real Backend/SQL verification

Only R6.1, R6.2 and R6.3. The older `scripts/r6a` historical audit is unrelated.

Run from repository root with existing backend/.env DB/JWT settings. Credentials
are never command arguments or evidence; login tokens/contact fields are redacted.
SQL assertions and test DB support live under `database/11_tests/r6-group-a` and
are never imported into Backend production.

The target must be a reviewed disposable `CinemaBookingDB_Test` or
`CinemaBookingDB_R0_*` with canonical R5 schema/base/dynamic seed, enough bookable
future shows in distinct rooms and **all transaction tables empty**. The runner
refuses main, nonempty fixtures, production environment and stale confirmation.
Use an exclusive target; do not run another writer or test suite against it.

Existing committed R5.4 fixtures are intentionally refused. Use a new absent
target through the R5.5 pipeline instead of deleting or resetting existing data:

```powershell
node scripts/db/run.mjs preflight-test --database=CinemaBookingDB_R0_R6A_NEW
# Review actual instance, GUID/existence and physical files. For an absent target
# created for this task, use the returned token in the existing pipeline:
node scripts/db/run.mjs build-test --database=CinemaBookingDB_R0_R6A_NEW --confirm-target=<reviewed-token>
```

Revalidate after creation, because the token now binds the new DB identity:

```powershell
node scripts/db/run.mjs preflight-test --database=CinemaBookingDB_R0_R6A_NEW
node scripts/r6-group-a/run.mjs --database=CinemaBookingDB_R0_R6A_NEW --confirm-target=<current-token>
node scripts/r6-group-a/regression.mjs --database=CinemaBookingDB_R0_R6A_NEW --confirm-target=<current-token>
node scripts/r6-group-a/report.mjs
```

The report's final safety check reads the original build main-preservation evidence
from this task. Retain that immutable build directory when replaying. It compares
current main to the original before-target-creation hashes as well as latest test
and regression snapshots. A new run is never permission to reset an unknown target;
R5.5's separate reset authorization/confirmation still applies.

For checkpoints add `--phase=R6.1`, `--phase=R6.2` or `--phase=R6.3`. The final
acceptance report always consumes a full run, never combines incomplete checkpoint
results. Concurrency defaults to three rounds; `--repetitions=3..10` may increase
confidence. Every contender must be observed in real SQL lock waits before barrier
release. Failure to access DMV or observe overlap fails verification. Existing
local project DB credentials have the required DMV access; no permissions changed.

HTTP uses real createApp/auth/middleware/validators/services/default procedure
client. The app listens on an ephemeral loopback port. Four R5 demo customers
authenticate by the seeded login contract. No mock SP/DB, fake booking or JS mutex.
The background expiry scheduler is not started; existing command-driven expiry
is exercised explicitly. No hold timeout is extended or production clock frozen
by new mandatory tests. Historical R22 SQL regression retains its original
transactional boundary-clock fixtures and rolls all metadata changes back.

Each scenario asserts committed SQL state before cleanup. Negative operations
compare all27 table and metadata hashes; expiry commands also assert the lifecycle
changes they are allowed to commit. Cleanup deletes only IDs registered from the
run, refuses unknown orders, restores captured fixture resource/quota/point values,
and requires exact seeded data/metadata equality. Identity counters are excluded
because rollback/cleanup can leave identity gaps. A temporary booking fault trigger
proves post-write rollback, is removed in finally, and final checks require it absent.
Payment rollback uses a controlled loyalty INT overflow after payment/order updates.

Each execution writes a new timestamp/UUID directory under
`docs/evidence/r6-group-a/runs` or `regression`; failures are preserved. `latest-*`
files are pointers, not replacements of previous results. Raw JSON records exact
requests, expected/actual, errors, SQL mutations, DMV overlaps, final states,
assertions, hashes and cleanup. Main is read-only fingerprinted before/after.
No R1–R5 historical evidence is overwritten. A failed run is not DONE.

The task target retained on completion is
`CinemaBookingDB_R0_R6A_20261009_01` (seed only, zero transaction rows).
