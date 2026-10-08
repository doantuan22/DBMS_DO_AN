// Offline R5.1 handoff verification. Never connects to SQL Server or executes SQL.
// Snapshot hashes describe this task's audited state, not a policy blocking future tasks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { root, dbRoot, read, expandSql, walk, write } from '../db/lib.mjs';

const evidence = path.join(root, 'docs/evidence/r51');
const before = JSON.parse(read(path.join(evidence, 'audit-before.json')));
const mapping = JSON.parse(read(path.join(evidence, 'path-mapping.json')));
const manifest = JSON.parse(read(path.join(dbRoot, 'baseline-manifest.json')));
const checks = [];
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const relative = file => path.relative(root, file).replaceAll('\\', '/');
const source = file => read(path.join(root, file));
function check(name, run) {
  try { checks.push({ name, status: 'PASS', detail: run() }); }
  catch (error) { checks.push({ name, status: 'FAIL', detail: error.message }); }
}

check('17 seed files moved once with identical bytes', () => {
  assert.equal(Object.keys(mapping).length, 17);
  assert.equal(new Set(Object.values(mapping)).size, 17);
  for (const [old, next] of Object.entries(mapping)) {
    assert.equal(fs.existsSync(path.join(root, old)), false, old);
    assert.equal(sha(fs.readFileSync(path.join(root, next))), before.seedFiles[old], next);
  }
  const sqlFiles = walk(path.join(dbRoot, '10_seed')).filter(f => f.endsWith('.sql')).map(relative);
  assert.deepEqual(sqlFiles.sort(), [...Object.values(mapping), 'database/10_seed/seed-all.sql'].sort());
  return { moved: 17, base: 16, demo: 1, newSqlFiles: 0 };
});

check('Expanded seed/build/reset SQL exactly preserved', () => {
  for (const [entry, expected] of Object.entries(before.expandedSqlSha256)) {
    assert.equal(sha(expandSql(entry)), expected, entry);
  }
  return { entries: Object.keys(before.expandedSqlSha256), comparison: 'Exact UTF-8 text, including batch boundaries/options/transaction/verification' };
});

check('Canonical build/seed/test/verify SQLCMD includes resolve without cycles', () => {
  let includes = 0;
  const sqlFiles = walk(dbRoot).filter(f => f.endsWith('.sql') && /^database\/(?:(?:0\d|1[012])_[^/]+\/|(?:build-objects|run-all|reset-database)\.sql$)/.test(relative(f)));
  for (const file of sqlFiles) {
    includes += [...read(file).matchAll(/^:r\s+(.+)$/gm)].length;
    expandSql(path.relative(dbRoot, file));
  }
  return { files: sqlFiles.length, includes };
});

check('Seed order and exactly-once inclusion preserved', () => {
  const includes = [...source('database/10_seed/seed-all.sql').matchAll(/^:r\s+\.\/(.+)$/gm)].map(m => 'database/' + m[1].trim());
  const ordered = Object.keys(before.seedFiles).sort().map(old => mapping[old]);
  assert.deepEqual(includes, [...ordered, 'database/12_verify/verify_seed.sql']);
  assert.equal(new Set(includes).size, includes.length);
  return includes;
});

check('FK parents inserted before children, including mixed files', () => {
  const inserted = new Set();
  const dependencies = [];
  for (const old of Object.keys(before.seedFiles).sort()) {
    const file = mapping[old];
    for (const match of source(file).matchAll(/\bINSERT\s+(?:INTO\s+)?dbo\.\[?(\w+)\]?/gi)) {
      const table = match[1];
      const parents = [...new Set(manifest.expected.foreignKeys.filter(f => f.childTable === table).map(f => f.parentTable))];
      for (const parent of parents) assert.ok(inserted.has(parent), `${file}: ${table} needs ${parent}`);
      dependencies.push({ file, table, parents });
      inserted.add(table);
    }
  }
  return { seededTables: [...inserted], dependencies };
});

check('Build objects and seed function prerequisites precede data', () => {
  const run = source('database/run-all.sql');
  assert.ok(run.indexOf(':r ./build-objects.sql') < run.indexOf(':r ./10_seed/seed-all.sql'));
  const build = expandSql('build-objects.sql');
  const functions = [...new Set(Object.values(mapping).flatMap(file => [...source(file).matchAll(/dbo\.(fn_\w+)\s*\(/g)].map(m => m[1])))];
  for (const name of functions) {
    assert.ok(manifest.modules[name], name);
    assert.ok(build.includes(`FUNCTION dbo.${name}`), name);
  }
  return { functions, objectsBeforeSeed: true };
});

check('Schema, business modules, API, UI, existing tests and entry points unchanged', () => {
  for (const [file, expected] of Object.entries(before.protectedFiles)) {
    assert.equal(sha(fs.readFileSync(path.join(root, file))), expected, file);
  }
  return { identicalFiles: Object.keys(before.protectedFiles).length };
});

check('Only scoped tracked files changed', () => {
  const allowed = new Set([...Object.keys(mapping), 'database/10_seed/seed-all.sql', 'scripts/db/generate-seed.mjs', 'scripts/r3a/inventory.mjs', 'scripts/r6a/provenance.mjs', 'database/README.md', 'README.md']);
  const changed = execFileSync('git', ['diff', 'HEAD', '--name-only', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const file of changed) assert.ok(allowed.has(file), `Unexpected tracked change: ${file}`);
  return { changed };
});

check('No old active seed paths; historical evidence preserved', () => {
  const files = walk(path.join(root, 'scripts')).filter(f => /\.(mjs|js|ps1)$/.test(f) && !relative(f).startsWith('scripts/r51/'));
  files.push(...walk(path.join(dbRoot, '10_seed')).filter(f => f.endsWith('.sql')));
  const stale = [];
  for (const file of files) {
    const body = read(file);
    for (const old of Object.keys(mapping)) {
      if (body.includes(old) || body.includes(old.slice('database/'.length))) stale.push({ file: relative(file), old });
    }
  }
  assert.deepEqual(stale, []);
  return { scanned: files.length, historicalSnapshotPathsRewritten: false };
});

check('Existing readers parse moved data and generator outputs grouped paths', () => {
  const users = source(mapping['database/10_seed/004_reference.sql']);
  assert.equal([...users.matchAll(/^\((\d+),\s*(\d+),/gm)].length, 8);
  assert.equal([...users.matchAll(/^\((\d+),\s*'([^']+)',\s*N?'[^']+',\s*(\d+)\)/gm)].length, 4);
  const permissions = source(mapping['database/10_seed/002_reference.sql']);
  assert.equal([...permissions.matchAll(/^\(\d+,\s*'[^']+',/gm)].length, 23);
  const generator = source('scripts/db/generate-seed.mjs');
  assert.ok(generator.includes("number===14?'seed_demo_dynamic':'seed_base'"));
  assert.ok(generator.includes('10_seed/${group}/'));
  assert.ok(generator.includes('10_seed/seed_base/017_cinema_images.sql'));
  for (const file of ['scripts/db/run.mjs', 'scripts/r2fix/migration-tests.mjs']) assert.ok(source(file).includes('10_seed/seed-all.sql'));
  return { users: 8, profiles: 4, permissions: 23, generatorExecuted: false, seedEntryPointUnchanged: true };
});

check('Fixture sources retained; groups documented without SQL placeholders', () => {
  const inventory = JSON.parse(read(path.join(evidence, 'seed-inventory.json')));
  for (const record of inventory.records) assert.ok(fs.existsSync(path.join(root, mapping[record.file] ?? record.file)), record.file);
  for (const group of ['seed_base', 'seed_demo_dynamic', 'test_fixture']) assert.ok(source(`database/10_seed/${group}/README.md`).trim().length > 200);
  assert.deepEqual(walk(path.join(dbRoot, '10_seed/test_fixture')).map(relative), ['database/10_seed/test_fixture/README.md']);
  return { auditedFilesRetained: inventory.records.length, newTransactionFixtures: 0 };
});

const result = { status: checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL', capturedAt: new Date().toISOString(), databaseConnection: false, sqlExecuted: false, checks };
write(path.join(evidence, 'checks.json'), result);
for (const item of checks) console.log(`${item.status} ${item.name}${item.status === 'FAIL' ? ': ' + item.detail : ''}`);
console.log(`${checks.filter(c => c.status === 'PASS').length}/${checks.length} checks PASS; no database connection or SQL execution.`);
if (result.status !== 'PASS') process.exitCode = 1;
