// Offline adversarial target/confirmation tests and current-source regression gates.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { root, dbRoot, read, write, expandSql } from '../db/lib.mjs';
import { validateTestName, authorize, targetGuard, hash } from '../db/test-target.mjs';
import { prepare, publicReadSql } from '../db/test-pipeline.mjs';
const evidence = path.join(root, 'docs/evidence/r55');
const before = JSON.parse(read(path.join(evidence, 'audit-before.json')));
const dynamicFile = 'database/10_seed/seed_demo_dynamic/014_reference.sql';
const negativeFile = 'database/10_seed/test_fixture/negative-probes.sql';
const allowed = new Set(['scripts/db/run.mjs', 'package.json', 'database/README.md', 'database/10_seed/test_fixture/README.md', dynamicFile, negativeFile]);
const checks = [];
function check(id, scenario, work) {
  try { work(); checks.push({ testID: id, scenario, expected: 'Assertion accepted', actual: 'Accepted', status: 'PASS' }); }
  catch (error) { checks.push({ testID: id, scenario, expected: 'Assertion accepted', actual: error.message, status: 'FAIL' }); }
}
check('R55-SAFE-NAMES', 'Reject main, SQL injection, ambiguous aliases and unsafe identifiers', () => {
  for (const name of ['CinemaBookingDB', 'master', 'CinemaBookingDB_Test2', 'CinemaBookingDB_R0_', 'CinemaBookingDB_Test;DROP DATABASE master', '../CinemaBookingDB_Test', 'CinemaBookingDB_Test]', 'CinemaBookingDB_R0_' + 'x'.repeat(128)])
    assert.throws(() => validateTestName(name));
  for (const name of ['CinemaBookingDB_Test', 'CinemaBookingDB_R0_R55_Test']) assert.equal(validateTestName(name), name);
  assert.throws(() => prepare('build-objects.sql', 'CinemaBookingDB'));
});
check('R55-SAFE-OPT-IN', 'Wrong instance/GUID/path token and missing reset confirmation cannot authorize destruction', () => {
  const newGate = { confirmation: 'reviewed-new', target: null, server: { CanCreateDatabase: 1 } };
  assert.throws(() => authorize(newGate));
  assert.throws(() => authorize(newGate, 'stale'));
  authorize(newGate, 'reviewed-new');
  assert.throws(() => authorize({ ...newGate, server: { CanCreateDatabase: 0 } }, 'reviewed-new'));
  const existing = { ...newGate, confirmation: 'reviewed-existing', target: { database_guid: 'test-guid' } };
  assert.throws(() => authorize(existing, 'reviewed-existing', undefined, false));
  assert.throws(() => authorize(existing, 'reviewed-existing', undefined, true));
  assert.throws(() => authorize(existing, 'reviewed-existing', 'old-reset', true));
  authorize(existing, 'reviewed-existing', 'reviewed-existing', true);
  const identity = { server: 'InstanceA', database: 'CinemaBookingDB_Test', target: { database_guid: 'GUID-A', files: [{ name: 'Test', physical_name: 'D:\\SQL\\Test.mdf' }] } };
  for (const changed of [{ ...identity, server: 'InstanceB' }, { ...identity, target: { ...identity.target, database_guid: 'GUID-B' } }, { ...identity, target: { ...identity.target, files: [{ name: 'Test', physical_name: 'E:\\SQL\\Test.mdf' }] } }]) assert.notEqual(hash(identity), hash(changed));
  assert.throws(() => targetGuard({ server: 'InstanceA', database: 'CinemaBookingDB_Test', target: {} }, true));
  const guard = targetGuard(identity);
  for (const term of ['SERVERPROPERTY', 'database_guid', 'physical_name', 'state_desc', 'is_read_only']) assert.ok(guard.includes(term));
  assert.throws(() => targetGuard({ ...identity, target: null }, false));
  assert.ok(targetGuard({ ...identity, target: null, expectedNewFiles: [{ type: 'ROWS', path: 'D:\\SQL\\Test.mdf' }, { type: 'LOG', path: 'D:\\SQL\\Test_log.ldf' }] }, false).includes('IS NOT NULL THROW'));
});
check('R55-SOURCE-PRESERVED', 'Preserve all prior modules/seed/fixtures and historical evidence except explicit runner/docs/package delta', () => {
  for (const [file, digest] of Object.entries(before.files)) if (!allowed.has(file)) assert.equal(hash(fs.readFileSync(path.join(root, file))), digest, file);
  assert.equal(hash(fs.readFileSync(path.join(root, dynamicFile), 'utf8').replaceAll('showPlan', 'plan')), before.files[dynamicFile], 'Only the reserved alias rename is allowed in R5.3 seed');
  const negative = read(path.join(root, negativeFile));
  const newline = negative.includes('\r\n') ? '\r\n' : '\n';
  const previous = negative.replace(/    -- Keep transaction state separate from the JSON reads: those can have an internal read transaction\.\r?\n/, '')
    .replace(/IF @@TRANCOUNT <> 0 OR XACT_STATE\(\) <> 0\s+THROW 51054, 'Negative probe leaked a transaction\.', 1;\s+IF @ReviewsBefore/, 'IF @@TRANCOUNT <> 0 OR XACT_STATE() <> 0' + newline + '       OR @ReviewsBefore');
  assert.equal(hash(previous), before.files[negativeFile], 'Only separate state assertion from JSON reads in R5.4');
  for (const [entry, digest] of Object.entries(before.expandedEntries)) assert.equal(hash(expandSql(entry).replaceAll('showPlan', 'plan')), digest, entry);
});
check('R55-CANONICAL-ENTRY', 'Fresh build/seed uses existing includes with a single database and intact fixture guards', () => {
  const seed = prepare('10_seed/seed-all.sql', 'CinemaBookingDB_Test', '2026-10-09');
  assert.ok(seed.includes('USE CinemaBookingDB_Test;'));
  assert.ok(!seed.includes('$(SeedDate)'));
  assert.ok(!seed.includes('R54DisposableTarget'));
  for (const file of ['transaction-fixture.sql', 'negative-probes.sql']) {
    const fixture = expandSql('10_seed/test_fixture/' + file);
    assert.ok(fixture.includes("SESSION_CONTEXT(N'R54DisposableTarget')"));
    assert.ok(fixture.includes('@@TRANCOUNT <> 0'));
  }
  const run = read(path.join(root, 'scripts/db/run.mjs'));
  assert.ok(run.indexOf('const gate=preflight(database,integrated)') < run.indexOf('const sql=resetGate+'));
  const pipeline = read(path.join(root, 'scripts/db/test-pipeline.mjs'));
  assert.ok(pipeline.includes("option('seed-date')"));
  assert.ok(pipeline.includes("status = 'FAIL'"));
  assert.ok(pipeline.includes("R55-MAIN-AFTER"));
  assert.ok(pipeline.indexOf("step('R55-COMMIT'") < pipeline.indexOf('const beforeNegative'));
  assert.ok(pipeline.includes('assert.deepEqual(after, beforeRollback'));
  assert.ok(pipeline.includes('assert.deepEqual(after, beforeNegative'));
});
check('R55-READ-CONTRACT', 'Public verification projection comes from current SP source, not a second schema', () => {
  const sql = publicReadSql();
  for (const name of ['sp_Showtime_ListByMovie', 'sp_Showtime_GetDetail', 'sp_Seat_ListByShowtime', 'fn_TinhGiaVe']) assert.ok(sql.includes('dbo.' + name));
  for (const name of ['sp_Showtime_ListByMovie', 'sp_Showtime_GetDetail', 'sp_Seat_ListByShowtime']) assert.ok(fs.existsSync(path.join(dbRoot, '08_procedures/public', name + '.sql')));
  assert.ok(sql.includes('THROW 51055'));
});
check('R55-HISTORICAL-EVIDENCE', 'R5.1–R5.4 evidence retains its original static-only meaning', () => {
  for (const phase of ['r51', 'r52', 'r53', 'r54']) {
    const file = 'docs/evidence/' + phase + '/checks.json';
    assert.equal(hash(fs.readFileSync(path.join(root, file))), before.files[file], file);
  }
  const manifest = JSON.parse(read(path.join(dbRoot, 'baseline-manifest.json')));
  assert.equal(manifest.expected.objects.filter(object => object.type.trim() === 'U').length, 27);
  assert.equal(Object.keys(manifest.modules).length, 159);
});
const result = { capturedAt: new Date().toISOString(), status: checks.every(check => check.status === 'PASS') ? 'STATIC PASS' : 'STATIC FAIL', sqlExecuted: false, checks };
write(path.join(evidence, 'checks.json'), result);
for (const check of checks) console.log(`${check.status} ${check.testID}: ${check.scenario}${check.status === 'FAIL' ? ' — ' + check.actual : ''}`);
console.log(`${checks.filter(check => check.status === 'PASS').length}/${checks.length} STATIC PASS; SQL results are recorded separately.`);
if (result.status !== 'STATIC PASS') process.exitCode = 1;
