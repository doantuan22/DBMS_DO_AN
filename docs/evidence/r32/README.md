# R3.2 evidence index

Final report: [R3_HISTORICAL_METADATA.md](../R3_HISTORICAL_METADATA.md). Final disposable: `CinemaBookingDB_R0_R32_20261008_02`; dates are dynamic. All fixture writers enforce the repository disposable-name guard. Main has no test fixtures.

| Evidence | Purpose |
|---|---|
| [trace-before.md](trace-before.md), [preserved-before.json](preserved-before.json), `before-source/` | Analysis before implementation; protected pre-task hashes; exact mutable source copies |
| [sql-tests.json](sql-tests.json), [historical-sql.txt](historical-sql.txt) | 108 cases, persisted before/final rows, NULL/required contract, canonical Cancel, 2 monetary cases, 4 after-write rollbacks, precision/caller success |
| [api-tests.json](api-tests.json), [historical-http.txt](historical-http.txt) | 240 requests/82 cases against real Express/SQL; GET/DB validation; 2 monetary cases; scope/RBAC/safe errors |
| [historical-concurrency.json](historical-concurrency.json) | 20 independent SQL session races; DMV lock waits/resources, commit/rollback timeline, final rows and session state |
| [transaction-tests.json](transaction-tests.json) | 8 caller success/savepoint/committable/doomed transaction cases; restored module definitions |
| [browser.json](browser.json) | 24 actual React page checks with controlled HTTP responses; supplementary UI evidence |
| [r1-regression.json](r1-regression.json), `r11-*`, `r12-*` | Full accepted R1 SQL/race/nested/stress replay; documented Update fault fixture adaptation only |
| [r21-regression.json](r21-regression.json), `r21-*` | Full accepted R2.1 SQL/API/parent and seat race replay |
| [r22-regression.json](r22-regression.json), `r22-*` | Full accepted R2.2 SQL/API/quota/Admin/browser replay |
| [r31-regression.json](r31-regression.json), `r31-*` | Full accepted R3.1 parse/reference/rollback/API/replacement/delete/browser replay |
| [checks.json](checks.json), [no-sql.txt](no-sql.txt), [procedure-contract.json](procedure-contract.json), [source-parity.json](source-parity.json) | 17 final checks; backend131/frontend49, no skip; lint/build/SQL/contract/source parity |
| [migration-replay.json](migration-replay.json), [migration-replay.txt](migration-replay.txt) | Pre-R3.2 definitions → scoped current migration on disposable; data/schema preserved |
| [main-before-tests.json](main-before-tests.json), [main-test-isolation.json](main-test-isolation.json) | Main before/after disposable tests: data/metadata identical |
| [main-migration.json](main-migration.json), [main-readonly.json](main-readonly.json) | Verified COPY_ONLY/CHECKSUM backup; only4 module changes;159-module parity;27-table hashes preserved; read-only overlap/quota/reference checks |
| [changed-files.json](changed-files.json), [source-changes.patch](source-changes.patch) | Task-only source changes relative to preserved pre-R3.2 working tree |
| [current-audit-status.json](current-audit-status.json), [final-checks.json](final-checks.json), [exit-criteria.md](exit-criteria.md) | I-09 resolved; all45 UC grades unchanged; final37 criteria and protected artifacts |

Trial files intentionally retained: `sql-trial-01.json`, `trial-01-*`, `transaction-trial-01.txt`, `transaction-trial-cleanup.json`, plus retry history in checks.json. Their FAIL outcomes describe harness setup issues, are superseded by final PASS evidence, and are not acceptance evidence. No accepted r11/r12/r21/r22/r31 evidence was overwritten.

Reproduce offline checks from repository root:

```powershell
node scripts/r32/checks.mjs --database=CinemaBookingDB_R0_R32_20261008_02
```

This command never migrates main. Main deployment is a separate `deploy.mjs --database=CinemaBookingDB --apply` action guarded by final disposable evidence, main isolation, backup verification and the four-module allowlist. Do not reset/seed main. Keep generated credentials out of logs/evidence.
