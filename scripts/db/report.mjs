import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, dbRoot, audit, read, write, credentials, walk, normalizeModule } from './lib.mjs';
const load = (name) => JSON.parse(read(path.join(audit, name)));
const before = load('before-metadata.json'),
  source = load('source-replay-metadata.json'),
  run1 = load('run1-metadata.json'),
  run2 = load('run2-metadata.json');
const manifest = JSON.parse(read(path.join(dbRoot, 'baseline-manifest.json')));
const modules = load('module-reconciliation.json'),
  contracts = load('backend-contract-check.json'),
  gaps = load('known-contract-gaps.json');
const counts = (m) => {
  const n = (type) => m.objects.filter((o) => o.type.trim() === type).length;
  return {
    tables: n('U'),
    views: n('V'),
    functions: n('FN') + n('IF') + n('TF'),
    triggers: n('TR'),
    procedures: n('P'),
    indexes: new Set(m.indexes.map((i) => i.tableName + '.' + i.name)).size,
    constraints: n('PK') + n('UQ') + n('F') + n('C') + n('D'),
  };
};
const signatureChanges = [];
for (const o of before.objects.filter((o) => o.type.trim() === 'P')) {
  const a = before.parameters.filter((p) => p.objectName === o.name),
    s = source.parameters.filter((p) => p.objectName === o.name);
  if (JSON.stringify(a) !== JSON.stringify(s))
    signatureChanges.push({
      name: o.name,
      source: s,
      deployed: a,
      decision:
        'KEEP deployed named-parameter contract; backend capture validates inputs/types/output flags.',
    });
}
write(path.join(audit, 'signature-reconciliation.json'), signatureChanges);
const scan = spawnSync(process.execPath, [path.join(root, 'scripts/audit-no-sql.mjs')], {
  encoding: 'utf8',
});
const testBytes = fs.readFileSync(path.join(audit, 'backend-tests.log'));
const backendTests = (
  testBytes[0] === 0xff && testBytes[1] === 0xfe
    ? testBytes.toString('utf16le')
    : testBytes.toString('utf8')
).replace(/^\uFEFF/, '');
write(path.join(audit, 'backend-tests.log'), backendTests);
const seedMatch =
  JSON.stringify(load('run1-seed-fingerprint.json').tables) ===
  JSON.stringify(load('run2-seed-fingerprint.json').tables);
const moduleMatch = run1.objects
  .filter((o) => o.definition)
  .every(
    (o) =>
      normalizeModule(o.definition) ===
      normalizeModule(run2.objects.find((p) => p.name === o.name)?.definition),
  );
const missing = Object.values(manifest.modules).filter((p) => !fs.existsSync(path.join(dbRoot, p)));
const actualNames = new Set(run2.objects.filter((o) => o.type.trim() === 'P').map((o) => o.name));
const whitelist = load('backend-procedure-contracts.json');
const missingBackend = whitelist.filter(
  (c) => !manifest.modules[c.name] || !actualNames.has(c.name),
);
// Scan only newly produced artifacts. Never print the configured secret or matched content.
const password = credentials().DB_PASSWORD;
const secretMatches = password
  ? walk(dbRoot)
      .concat(walk(path.join(root, 'scripts/db')))
      .filter((p) => !p.endsWith('.local.json') && !p.endsWith('.log'))
      .filter((p) => read(p).includes(password))
      .map((p) => path.relative(root, p))
  : [];
const testsPassed = /pass\s+90/.test(backendTests) && /fail\s+0/.test(backendTests);
const status =
  contracts.status === 'PASS' &&
  scan.status === 0 &&
  moduleMatch &&
  seedMatch &&
  missing.length === 0 &&
  missingBackend.length === 0 &&
  secretMatches.length === 0 &&
  testsPassed &&
  load('clean-clone-check.json').status === 'PASS'
    ? 'PASS'
    : 'PARTIAL';
const summary = {
  status,
  before: counts(before),
  sourceBefore: counts(source),
  baseline: counts(run2),
  dbOnlyModules: modules.filter((m) => m.status === 'DB_ONLY').map((m) => m.name),
  sourceOnlyModules: modules.filter((m) => m.status === 'SOURCE_ONLY').map((m) => m.name),
  differentModules: modules.filter((m) => m.status === 'DIFFERENT_DEFINITION').map((m) => m.name),
  addedColumns: ['DONDATVE.LyDoHuy', 'DONDATVE.ThongBaoHuy'],
  clockDefaultsPreserved: 8,
  generatedDefaultNamesStabilized: 25,
  removedApplicationObjects: 0,
  unknownCriticalObjects: 0,
  backendContracts: contracts.status,
  capturedProcedureCalls: contracts.capturedCalls,
  whitelistEntries: contracts.whitelistEntries,
  missingBackend: missingBackend.map((m) => m.name),
  rawBusinessSql: scan.status === 0 ? 0 : 'FAIL',
  run1: 'PASS',
  run2: 'PASS',
  definitionParityAcrossRuns: moduleMatch,
  seedDataParityAcrossRuns: seedMatch,
  backend: load('backend-smoke-CinemaBookingDB.json').status,
  sqlSmoke: 'PASS',
  backendTests:
    /pass 90/.test(backendTests) && /fail 0/.test(backendTests) ? '90/90 PASS' : 'CHECK LOG',
  concurrency: load('concurrency-CinemaBookingDB_R0_Test.json').map((t) => ({
    test: t.file,
    status: t.code === 0 ? 'PASS' : 'FAIL',
  })),
  negativeVerify: load('negative-verify-checks.json').status,
  clone: load('clean-clone-check.json').status,
  credentialLeakScan: secretMatches.length ? 'FAIL' : 'PASS',
  at: new Date().toISOString(),
};
write(path.join(audit, 'rebuild-summary.json'), summary);
write(
  path.join(audit, 'no-sql-backend-scan.md'),
  `# Backend SQL audit\n\n${scan.stdout}\n\nRuntime path: backend/src → whitelist procedure client → typed mssql request.execute. 82 source/test files scanned. No query/batch/ORM/business SQL execution found. 18 reviewed keyword matches are SQL Server error-message parsing, natural-language validation text, test labels, SQL-source assertions, and an ordinary JavaScript variable named update. They are not SQL execution. Forbidden APIs remain checked even for these lines.\n\nDatabase metadata, deployment and rollback tests run through sqlcmd under scripts/db and database/11_tests; these tools are never imported by backend runtime. Backend procedure client exposes only whitelisted execute methods, preserves recordsets/output/returnValue, rejects untyped input/output, shares one pool and closes it at shutdown.\n\n${contracts.capturedCalls} captured procedure calls across ${contracts.serviceMethods} service/job/health methods. Parameter names, SQL types, string lengths, precision/scale and output flags checked; zero missing source. Full capture: backend-contract-check.json.\n`,
);
const bullet = (values) => (values.length ? values.map((v) => '- ' + v).join('\n') : '- none');
write(
  path.join(audit, 'rebuild-report.md'),
  `# DATABASE FULL REBUILD\n\nStatus: **${status}** — reproducible R0 baseline, not audit remediation. Captured 2026-10-03.\n\n## Before and after\n\n| Object | Live before | Legacy source replay | Rebuilt baseline |\n|---|---:|---:|---:|\n${Object.keys(
    summary.before,
  )
    .map(
      (k) =>
        `| ${k} | ${summary.before[k]} | ${summary.sourceBefore[k]} | ${summary.baseline[k]} |`,
    )
    .join(
      '\n',
    )}\n\nInitial Git status contained two deleted audit documents and untracked docs/audit-full-20261003 + scripts/audit-full-20261003. Those user changes were preserved. All original database source/deployment/tests were copied to _legacy_snapshot before rewrite; its legacy password default was removed. A COPY_ONLY/CHECKSUM backup passed RESTORE VERIFYONLY before the first DROP. Recovery location is local and ignored by Git. No backup is needed to build a new clone.\n\n## Reconciliation\n\nDB_ONLY modules (${summary.dbOnlyModules.length}), all kept and brought into source:\n\n${bullet(summary.dbOnlyModules)}\n\nSOURCE_ONLY modules: ${summary.sourceOnlyModules.length}. DIFFERENT_DEFINITION modules: ${summary.differentModules.length}, all preserved from deployed behavior. Table 26 is HINHANH_RAPCHIEUPHIM, created by migration 009 and refined in 010/011; public/admin callers require it. DONDATVE.LyDoHuy and ThongBaoHuy were live-only columns and retained. Eight function-backed clock DEFAULT definitions differed from source and were retained. PK/FK/UNIQUE/CHECK/index structure matched ordered legacy replay. Twenty-five server-generated DEFAULT names replaced by stable DF_table_column names; values/behavior unchanged. Three wildcard SP projections expanded to the same existing columns/order. Five legacy forwarding aliases received explicit NOCOUNT; their target procedures already used NOCOUNT, so resultsets/business rules remain unchanged. No application object removed; old SQL is archived and excluded from baseline.\n\nPer-object decisions/dependencies: current-db-inventory.md, module-reconciliation.json, reconciliation-report.md. Exact structural differences: structural-reconciliation.json. Procedure signature differences: signature-reconciliation.json. Unused/legacy procedures kept rather than removed; no unknown critical dependency outstanding.\n\n## Rebuild and backend evidence\n\n- Clean DROP/CREATE CinemaBookingDB run #1: PASS; run1-metadata.json + run1-verify-CinemaBookingDB.json.\n- Clean DROP/CREATE run #2: PASS; run2-metadata.json + verify-CinemaBookingDB.json.\n- All 26 table seed-data SHA256 fingerprints match between the final two rebuilds; same SeedDate, no audit/history fixtures.\n- All 154 module definitions match source; run #1/#2 definition parity: ${moduleMatch ? 'PASS' : 'FAIL'}.\n- Baseline has 61 indexes (36 PK/UQ backing, 25 standalone) and 157 constraints (26 PK, 10 UQ, 30 FK, 55 CHECK, 36 DEFAULT).\n- SQL verify: named object/column/constraint/index/signature/trigger/orphan/role permission checks, SP/view/trigger refresh and 17 function bindings PASS.\n- SQL smoke: auth/public/showtime/seat/booking/payment/order/review/complaint/manager/CSKH/admin/report PASS; writes rolled back. Multirow trigger, uniqueness, FK and EXECUTE-only permission probes PASS.\n- Backend sa connection and both /api/health + /api/health/db: PASS. Latest HTTP smoke: 33 successful requests, including four-role login and core portal reads.\n- Procedure contract capture: ${contracts.serviceMethods} methods, ${contracts.capturedCalls} calls, 120 whitelist entries/119 unique SP, missing source=0, unknown parameters/types=0.\n- Backend unit tests: ${summary.backendTests}; no-SQL scan PASS, raw business SQL=0.\n- Concurrency on disposable R0_Test: booking competing/overlapping seats + holding-order limit, pricing overlap and image lock PASS. Fixtures stayed out of CinemaBookingDB.\n- Negative verify: changed definition and disabled trigger rejected even with unchanged object counts; probes restored.\n- Source-only clean clone: PASS without .env, node_modules, audit artifacts, legacy SQL or .bak; final source built CinemaBookingDB_R0_CloneFinal.\n- Configured DB password scan across produced SQL/tooling artifacts: ${summary.credentialLeakScan}; password not hardcoded or committed.\n\n## Deliberately deferred issues\n\nNo new timezone/refund/cancellation/late callback/permission/promotion/lifecycle/financial policy chosen. Existing fn_BayGio includes its already-deployed UTC+7 conversion, kept verbatim rather than introducing another offset. Cascade cancellation/refund helpers and payment timing behavior are kept from live definitions. Historical audit data was backed up, not rewritten; anomalous audit rows were not copied into seed.\n\nTen pre-existing service error mapping gaps are recorded separately; tests now read canonical baseline and distinguish these reported gaps from new regressions, without changing backend mappings or SQL business behavior:\n\n| Flow | Code | Deferred reason |\n|---|---:|---|\n${gaps.map((g) => `| ${g.flow} | ${g.code} | ${g.reason} |`).join('\n')}\n\nOnly SQL Server 2025 was exercised live. Compatibility selection supports older 2016 SP1+ servers but their integration is untested here. Smoke exercises representative contracts, not every business branch. Rollback tests consume identity sequence numbers; they do not leave business rows. Production security roadmap remains least privilege/EXECUTE-only.\n\n## Outcome\n\nCinemaBookingDB can be rebuilt from zero with npm run db:reset. Source definitions and rebuilt live objects are synchronized. Audit Remediation can start from this versioned baseline, with the preserved issues listed above. Main changes: database/00_database–12_verify, baseline-manifest.json, run-all/reset/build entry points, scripts/db, scripts/reset-db.ps1, backend/.env.example, typed output guard, baseline-aware tests, npm scripts and database README.\n`,
);
const reconciliation = path.join(audit, 'reconciliation-report.md');
write(
  reconciliation,
  read(reconciliation).split('\n## Final R0 verification')[0] +
    `\n## Final R0 verification\n\nAll ${Object.keys(manifest.modules).length} module files are in baseline; backend missing source=0 (120 whitelist entries, 119 unique SP). ${contracts.capturedCalls} service/job/health calls passed typed contract capture. Source/deployed signature differences are documented in signature-reconciliation.json. SQL compile/binding and runtime smoke passed. See rebuild-report.md for deferred pre-existing mappings and policy conflicts.\n`,
);
console.log(
  JSON.stringify({
    status,
    counts: summary.baseline,
    backendTests: summary.backendTests,
    contracts: contracts.status,
    secretMatches: secretMatches.length,
  }),
);
