import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { root, read, normalizeModule } from '../db/lib.mjs';
const uc = JSON.parse(read(path.join(root,'docs/audit-20261007/use-cases.json')));
const issues = JSON.parse(read(path.join(root,'docs/audit-20261007/issues.json')));
const report = read(path.join(root,'docs/FULL_SYSTEM_AUDIT.md'));
const baseline = read(path.join(root,'docs/USE_CASE_BASELINE_45.md'));
const canonical = Object.entries({KH:14,QLR:9,CSKH:6,ADM:16}).flatMap(([actor,count])=>Array.from({length:count},(_,index)=>`${actor}-${String(index+1).padStart(2,'0')}`));
test('R0 matrix and baseline contain exactly the 45 official unique use cases', () => {
  assert.equal(uc.rows.length,45);
  assert.deepEqual(uc.rows.map(row=>row.uc),canonical);
  for (const document of [report,baseline]) {
    const rows = [...document.matchAll(/^\| ((?:KH|QLR|CSKH|ADM)-\d{2}) \|/gm)].map(match=>match[1]);
    assert.deepEqual(rows,canonical);
    assert.doesNotMatch(document,/ADM-17|46\s+(?:UC|Use Cases)|Điểm \/46/);
  }
});
test('R0 completion uses denominator 45 and retains original in-scope audit grades', () => {
  const original = JSON.parse(execFileSync('git',['show','HEAD:docs/audit-20261007/use-cases.json'],{cwd:root,encoding:'utf8'}));
  const values={PASS:1,PARTIAL:.5,MISSING:0,BROKEN:0};
  for (const layer of ['db','be','fe','integration']) {
    for (const row of uc.rows) assert.equal(row[layer],original.rows.find(before=>before.uc===row.uc)[layer]);
    const points = uc.rows.reduce((points,row)=>points+values[row[layer]],0);
    assert.equal(uc.metrics[layer].points,points);
    assert.equal(uc.metrics[layer].percent,Number((points/45*100).toFixed(1)));
  }
  assert.equal(uc.statuses.MISSING,0);
});
test('R0 sa accepted constraint is outside defect counts and architecture violations', () => {
  const accepted = issues.issues.find(issue=>issue.id==='I-01');
  assert.equal(accepted.severity,'ACCEPTED PROJECT CONSTRAINT');
  assert.equal(accepted.status,'ACCEPTED PROJECT CONSTRAINT');
  assert.doesNotMatch(report,/I-01\s+(?:CRITICAL|FAIL|BLOCKER)|CRITICAL\s+I-01|FAIL current runtime; I-01/);
  assert.equal(issues.severity.CRITICAL,issues.issues.filter(issue=>issue.status==='ACTIVE' && issue.severity==='CRITICAL').length);
  assert.match(read(path.join(root,'docs/PROJECT_ACCEPTED_CONSTRAINTS.md')),/Stored-Procedure-Only/);
});
test('R0 raw audit evidence is preserved as history, not rewritten to PASS', () => {
  const protectedNames = ['metadata.json','metadata-after.json','source-snapshot.json','data-fingerprint-before.json','data-fingerprint-after.json','backend-tests.txt','frontend-tests.txt','no-sql.txt','frontend-build.txt','frontend-lint.txt','api-probes.json','connection.json','preservation-check.json','schema-parity.json','module-parity.json'];
  for (const name of protectedNames) {
    const file = 'docs/audit-20261007/'+name;
    const original = execFileSync('git',['show','HEAD:'+file],{cwd:root,maxBuffer:8*1024*1024});
    // Git stores normalized LF while Windows may retain CRLF in untouched text files.
    // Hash full contents after only the Git line-ending normalization; avoid huge Buffer diffs.
    const hash = bytes => createHash('sha256').update(bytes.toString('utf8').replace(/\r\n/g,'\n')).digest('hex');
    assert.equal(hash(fs.readFileSync(path.join(root,file))),hash(original),name);
  }
});
test('R0 main migration preserves data, grants and source parity with trusted CHECK', () => {
  const migration = JSON.parse(read(path.join(root,'docs/r0-20261007/main-migration.json')));
  assert.equal(migration.status,'PASS'); assert.equal(migration.preconditionRows,0);
  assert.equal(migration.backup.restoreVerified,true);
  assert.equal(migration.before.data.length,27); assert.deepEqual(migration.before.data,migration.after.data);
  const beforeObjects = migration.before.metadata.objects,afterObjects=migration.after.metadata.objects;
  for (const key of ['columns','keys','foreignKeys','indexes','triggers','permissions','memberships','principals','parameters']) assert.deepEqual(migration.before.metadata[key],migration.after.metadata[key],key);
  for (const row of afterObjects.filter(row=>row.definition)) {
    const old = beforeObjects.find(before=>before.name===row.name);
    assert.equal(normalizeModule(row.definition),normalizeModule(old.definition),row.name+' business definition changed');
  }
  const constraint = migration.constraint;
  assert.equal(constraint.is_disabled,false); assert.equal(constraint.is_not_trusted,false);
  assert.doesNotMatch(constraint.definition,/Ngày lễ|holiday/i);
});
test('R0 migration rejection preserves existing legacy data and DDL', () => {
  const rejection = JSON.parse(read(path.join(root,'docs/r0-20261007/migration-precondition.json')));
  assert.equal(rejection.status,'PASS');
  assert.equal(rejection.checks[0].legacyRowsRetained,1);
  assert.deepEqual(rejection.beforeRejectedMigration.data,rejection.afterRejectedMigration.data);
  assert.deepEqual(rejection.beforeRejectedMigration.metadata.checks,rejection.afterRejectedMigration.metadata.checks);
});
