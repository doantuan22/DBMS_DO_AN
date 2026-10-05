// Final read-only verification after producing the R6A report.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { connect, ask, root, read, write, mainSnapshot, productionHashes, sha, normalizeModule } from '../r3a/common.mjs';
import { queries } from '../db/inventory.mjs';
import { walk } from '../db/lib.mjs';

const directory = path.join(root, 'audit/remediation/r6a');
const load = name => JSON.parse(read(path.join(directory, name)));
const before = load('evidence/main-before.json');
const after = load('evidence/main-after.json');
const supplement = load('evidence/supplemental-source-before.json');
assert.deepEqual(productionHashes(), before.sourceHashes);
for (const [file, hash] of Object.entries(supplement)) assert.equal(sha(fs.readFileSync(path.join(root, file))), hash, file);
const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);
const digest = rows => sha(JSON.stringify(rows.map(canonical).sort()));
const pool = await connect('CinemaBookingDB');
try {
  const snapshot = await mainSnapshot(pool);
  assert.deepEqual(snapshot, before.snapshot);
  const metadataHashes = {};
  for (const [name, source] of Object.entries(queries)) metadataHashes[name] = digest((await ask(pool, source)).recordset);
  assert.deepEqual(metadataHashes, after.metadataBeforeHashes);
  const manifest = JSON.parse(read(path.join(root, 'database/baseline-manifest.json')));
  const modules = (await ask(pool, 'SELECT OBJECT_NAME(object_id) AS name,definition FROM sys.sql_modules ORDER BY OBJECT_NAME(object_id)')).recordset;
  for (const [name, file] of Object.entries(manifest.modules)) {
    const body = read(path.join(root, 'database', file));
    const start = /\bCREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(body);
    assert.equal(normalizeModule(body.slice(start.index).replace(/\s+GO\s*$/i, '')), normalizeModule(modules.find(module => module.name === name)?.definition), name);
  }
  const databases = (await ask(pool, "SELECT name,state_desc FROM master.sys.databases WHERE name LIKE N'CinemaBookingDB%' ORDER BY name")).recordset;
  assert.deepEqual(databases, [{ name: 'CinemaBookingDB', state_desc: 'ONLINE' }]);
  const status = load('STATUS.json');
  const classification = load('CLASSIFICATION.json');
  const plan = load('R6B_ACTION_PLAN.json');
  assert.equal(status.status, 'PASS');
  assert.equal(classification.findings.length, 9);
  assert.deepEqual(plan.candidates, []);
  for (const finding of classification.findings) {
    const evidence = load(finding.currentEvidenceFile);
    assert.equal(evidence.querySha256, sha(read(path.join(root, evidence.query))));
    assert.equal(evidence.auditNow, before.clock.utcNow);
    assert.ok(finding.classification.length > 0);
  }
  const files = [...walk(directory), ...walk(path.join(root, 'scripts/r6a'))];
  for (const file of files) {
    const body = read(file);
    assert.doesNotMatch(body, /\$2[aby]\$\d\d\$[./A-Za-z0-9]{53}/, `Authentication hash leak: ${file}`);
    assert.doesNotMatch(body, /Bearer\s+[A-Za-z0-9._-]{30,}/i, `Bearer token leak: ${file}`);
    assert.doesNotMatch(body, /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, `JWT leak: ${file}`);
    if (file.endsWith('.md')) {
      for (const match of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        assert.ok(fs.existsSync(path.resolve(path.dirname(file), match[1])), `Missing report link ${match[1]}`);
      }
    }
  }
  write(path.join(directory, 'evidence/main-final.json'), {
    status: 'PASS', database: 'CinemaBookingDB', snapshot, metadataHashes,
    beforeAfterIdentical: true, productionSourceUnchanged: true, supplementalSourceUnchanged: true,
    sourceParityModules: modules.length, databases, findingsChecked: 9, fixableCandidates: 0,
    artifactQueryDigestsMatch: true, reportLinksExist: true, sensitiveTokenHashScan: 'PASS',
    note: 'Final check after report generation. No writes/reset/migration/fixture creation or deletion.',
  });
  console.log('R6A PASS: final fingerprint unchanged; 27 tables/159 modules; 9 findings; 0 R6B candidates; no fixture DB or authentication-secret export');
} finally { await pool.close(); }
