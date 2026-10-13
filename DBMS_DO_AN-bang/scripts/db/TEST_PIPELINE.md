# Current test pipeline — seed v2

Use [database/10_seed/README.md](../../database/10_seed/README.md) for commands and exact disposable target guards. `test-pipeline.mjs` is now a compatibility adapter: preflight-test → preflight, build-test → create, fixture-test → test-fixtures, rebuild-test → reset. Reset also requires --reset-demo-data and receipt/backup. Old --seed-only semantics and wildcard/default targets are retired.

The canonical implementation is seed-demo.mjs; there is no second dataset. Ordinary seed never drops data. All SQL lives in database. Main is preserved by 27 full-data hashes before/after each operation. Current evidence: [verification report](../../docs/seed/SEED_VERIFICATION_REPORT.md). Schema/test framework/migrations/SP/UI were preserved; legacy data assumptions are documented in the fixture guide.
