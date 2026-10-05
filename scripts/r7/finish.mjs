// Verify main read-only, retain earlier rounds' evidence, then remove exact R7 fixtures.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { connect, ask, mainSnapshot, normalizeModule, root, dbRoot, read, write } from '../r3a/common.mjs';
const out = path.join(root, 'audit/remediation/r7/evidence');
const json = name => JSON.parse(read(path.join(out, name)));
assert.equal(json('main-deployment.json').status, 'PASS');
for (const [name, args] of [
  ['verify', ['scripts/db/run.mjs', 'verify', '--database=CinemaBookingDB']],
  ['backend-smoke', ['scripts/db/backend-smoke.mjs', '--database=CinemaBookingDB', '--allow-no-future-shows']],
]) {
  const files = ['json', 'log'].map(ext => path.join(dbRoot, '_audit', `${name}-CinemaBookingDB.${ext}`));
  const previous = files.map(file => fs.existsSync(file) ? fs.readFileSync(file) : null);
  try {
    const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024 });
    write(path.join(out, `main-${name}.txt`), (result.stdout ?? '') + (result.stderr ?? ''));
    assert.equal(result.status, 0, `${name}: ${result.stdout ?? ''}${result.stderr ?? ''}`);
    write(path.join(out, `main-${name}.json`), read(files[0]));
    assert.equal(json(`main-${name}.json`).status, 'PASS');
  } finally {
    files.forEach((file, index) => {
      if (previous[index]) fs.writeFileSync(file, previous[index]);
      else if (fs.existsSync(file)) fs.unlinkSync(file);
    });
  }
}
const before = json('main-before.json').snapshot;
const oldModules = json('baseline-modules.json').modules;
const changed = ['sp_Manager_Pricing_Update', 'sp_Support_Complaint_GetOrderReference'];
const pool = await connect('CinemaBookingDB');
try {
  const snapshot = await mainSnapshot(pool);
  assert.deepEqual(snapshot.data, before.data, 'All historical rows must remain unchanged after HTTP smoke.');
  assert.equal(snapshot.schemaSha256, before.schemaSha256);
  assert.equal(snapshot.dbPermissionsSha256, before.dbPermissionsSha256);
  const modules = (await ask(pool, 'SELECT o.name,m.definition FROM sys.objects o JOIN sys.sql_modules m ON m.object_id=o.object_id WHERE o.is_ms_shipped=0')).recordset;
  const actualChanges = oldModules.filter(old => normalizeModule(old.definition) !== normalizeModule(modules.find(m => m.name === old.name)?.definition ?? '')).map(m => m.name).sort();
  assert.deepEqual(actualChanges, [...changed].sort());
  assert.equal(modules.length, oldModules.length);
  const inventory = (await ask(pool, `SELECT
    (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped=0) AS tables,
    (SELECT COUNT(*) FROM sys.objects WHERE type='P' AND is_ms_shipped=0) AS procedures,
    (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped=0) AS views,
    (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped=0) AS functions,
    (SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped=0) AS triggers,
    (SELECT COUNT(*) FROM sys.indexes i JOIN sys.tables t ON t.object_id=i.object_id WHERE t.is_ms_shipped=0 AND i.index_id>0) AS indexes,
    (SELECT COUNT(*) FROM sys.objects WHERE type IN ('PK','UQ','F','C','D') AND is_ms_shipped=0) AS constraints;`)).recordset[0];
  assert.equal(inventory.tables, 27);
  assert.equal(inventory.procedures + inventory.views + inventory.functions + inventory.triggers, 159);
  const baseline = json('baseline-manifest-before.json').expected;
  for (const [field, types] of Object.entries({ tables: ['U'], procedures: ['P'], views: ['V'], functions: ['FN','IF','TF'], triggers: ['TR'], constraints: ['PK','UQ','F','C','D'] })) {
    assert.equal(inventory[field], baseline.objects.filter(o => types.includes(o.type.trim())).length, `${field} count unchanged`);
  }
  assert.equal(inventory.indexes, new Set(baseline.indexes.map(index => `${index.tableName}:${index.name}`)).size);
  const r6 = JSON.parse(read(path.join(root, 'audit/remediation/r6a/evidence/main-final.json')));
  assert.deepEqual(snapshot.data, r6.snapshot.data);
  write(path.join(out, 'main-final.json'), { status: 'PASS', database: 'CinemaBookingDB', snapshot, inventory, changedModules: actualChanges, dataPreserved: true, r6HistoricalDataPreserved: true, noNewTables: true, grantsPreserved: true, at: new Date().toISOString() });
  console.log('PASS main verify / HTTP smoke / exact 27-table historical fingerprint; only 2 intended SQL modules changed.');
} finally { await pool.close(); }
const fixtureNames = ['CinemaBookingDB_R0_R1_R2_R5R7Manifest', 'CinemaBookingDB_R0_R1_R2_R5R7Fix', 'CinemaBookingDB_R0_R1_R2_R5R7Evidence'];
const master = await connect('master');
try {
  const inventory = () => ask(master, "SELECT name FROM sys.databases WHERE name LIKE 'CinemaBookingDB%' ORDER BY name");
  const namesBefore = (await inventory()).recordset.map(row => row.name);
  const removed = [];
  for (const name of fixtureNames) {
    assert.match(name, /^CinemaBookingDB_R0_R1_R2_R5R7(?:Manifest|Fix|Evidence)$/);
    assert.notEqual(name, 'CinemaBookingDB');
    if (namesBefore.includes(name)) {
      await ask(master, `ALTER DATABASE [${name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${name}];`);
      removed.push(name);
    }
  }
  const namesAfter = (await inventory()).recordset.map(row => row.name);
  assert.ok(namesAfter.includes('CinemaBookingDB'));
  assert.ok(fixtureNames.every(name => !namesAfter.includes(name)));
  assert.deepEqual(namesAfter, namesBefore.filter(name => !removed.includes(name)));
  write(path.join(out, 'cleanup.json'), { status: 'PASS', namesBefore, removed, namesAfter, r7FixturesRemaining: 0, mainPreserved: true, at: new Date().toISOString() });
  // Only remove generated local evidence files owned by this round; copies already retained above.
  for (const name of fixtureNames) for (const ext of ['backend-smoke', 'concurrency', 'verify']) {
    const file = path.resolve(dbRoot, '_audit', `${ext}-${name}.json`);
    assert.equal(path.dirname(file), path.resolve(dbRoot, '_audit'));
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  console.log(`PASS cleanup: ${removed.length} R7 fixtures removed; main database retained.`);
} finally { await master.close(); }
