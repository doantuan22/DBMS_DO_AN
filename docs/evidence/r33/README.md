# R3.3 evidence index

Final [report29 sections](../R3_COMPLAINT_TRIGGER_DETERMINISM.md). Current disposable: `CinemaBookingDB_R0_R33_20261008_01`. Pre-fix probe disposable: `CinemaBookingDB_R0_R33_Before_20261008_01`. No main fixtures or mass status correction.

| Evidence | Purpose |
|---|---|
| [trace-before.md](trace-before.md), [preserved-before.json](preserved-before.json), `before-source/` | Full20-question trace;1.147 protected pre-task files;exact mutable source copies |
| [before-probe.json](before-probe.json), [before-concurrency.json](before-concurrency.json) | Ordinary old-plan observations and two actual canonical smaller-identity status defects |
| [concurrency-design.md](concurrency-design.md) | Parent barrier/full history rationale, isolation and limits |
| [sql-tests.json](sql-tests.json), [complaint-sql.txt](complaint-sql.txt) |22 positives/7 negatives;single/multi/mixed/ordering/history;6 rollback cases;actual parent/history states and27-table cleanup |
| [api-tests.json](api-tests.json), [complaint-http.txt](complaint-http.txt) |158 real HTTP requests/45 cases;CSKH/Admin/customer reads/writes/ownership/live permission and sanitized trigger failures |
| [complaint-concurrency.json](complaint-concurrency.json) |10 canonical/mixed +2 delayed identity races;DMV locks/resources and final states/sessions |
| `r1-*`, `r11-*`, `r12-*`, `r21-*`, `r22-*`, `r31-*`, `r32-*` |Full accepted prior SQL/API/concurrency/rollback/browser replay;outputs redirected here |
| [checks.json](checks.json), [no-sql.txt](no-sql.txt), [procedure-contract.json](procedure-contract.json), [source-parity.json](source-parity.json) |16 PASS groups,backend131/frontend49,no skip;lint/build/SQL/contracts/parity |
| [migration-replay.json](migration-replay.json), [migration-replay.txt](migration-replay.txt) |Old→current trigger scoped replay;data/schema preserved |
| [main-before-tests.json](main-before-tests.json), [main-test-isolation.json](main-test-isolation.json), [main-complaints-before.json](main-complaints-before.json) |Main fingerprints and anomaly observation before deployment |
| [main-migration.json](main-migration.json), [main-readonly.json](main-readonly.json) |COPY_ONLY/CHECKSUM/VERIFYONLY;one trigger changed;data27/modules159;no mass correction |
| [changed-files.json](changed-files.json), [source-changes.patch](source-changes.patch) |R3.3-only source changes against pre-task working tree |
| [current-audit-status.json](current-audit-status.json), [final-checks.json](final-checks.json), [exit-criteria.md](exit-criteria.md) |I-16 resolved;prior issues and45 UC grades preserved;33 final criteria |

`before-probe-trial-01.json` intentionally retains the initial failed harness assumption that a particular ordinary batch plan must expose nondeterminism. Final observation correctly states no mismatch for those batches; independent actual canonical races demonstrate the defect. No trial is passed off as acceptance evidence.

Reproduce offline suite from repo root:

```powershell
node scripts/r33/checks.mjs --database=CinemaBookingDB_R0_R33_20261008_01
```

This runner does not deploy main. `deploy.mjs --database=CinemaBookingDB --apply` separately requires disposable PASS,main isolation and verified backup;only the existing status trigger is permitted. Never reset/seed main. Dedicated browser replays use OS temp profiles. Backend/frontend remain unchanged;application runtime never imports these SQL helpers.
