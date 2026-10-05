// Reuse meaningful R1–R5 suites; preserve their existing evidence files.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, read, write } from '../db/lib.mjs';
const database = process.argv.find(arg => arg.startsWith('--database='))?.slice(11);
assert.match(database ?? '', /^CinemaBookingDB_R0_R1_R2_R5R7[A-Za-z0-9_]+$/);
const out = path.join(root, 'audit/remediation/r7/evidence');
const tasks = [
  ['r1-r2-core', ['scripts/r2/checks.mjs', `--database=${database}`], { R2_EVIDENCE_DIR: 'audit/remediation/r7/evidence/r2' }],
  ['r3-authorization', ['scripts/r3b/probes.mjs', `--database=${database}`], { R3B_EVIDENCE_DIR: 'audit/remediation/r7/evidence/r3' }],
  ['r3-browser', ['scripts/r3b/browser.mjs'], { R3B_EVIDENCE_DIR: 'audit/remediation/r7/evidence/r3' }],
  ['r4-functional', ['scripts/r4/integration.mjs', `--database=${database}`], { R4_EVIDENCE_DIR: 'audit/remediation/r7/evidence/r4' }],
  ['r4-browser', ['scripts/r3b/browser.mjs'], { R4_BROWSER: '1', R3B_EVIDENCE_DIR: 'audit/remediation/r7/evidence/r4' }],
  ['r5-validation', ['scripts/r5/integration.mjs', `--database=${database}`], {}, 'r5-integration.json'],
  ['r5-integrity-concurrency', ['scripts/r5/supplemental.mjs', `--database=${database}`], {}, 'supplemental.json'],
];
const report = { status: 'RUNNING', database, checks: [] };
for (const [name, args, env, legacyName] of tasks) {
  const legacy = legacyName && path.join(root, 'audit/remediation/r5/evidence', legacyName);
  const previous = legacy && fs.existsSync(legacy) ? fs.readFileSync(legacy) : null;
  let result;
  try {
    result = spawnSync(process.execPath, args, { cwd: root, env: { ...process.env, ...env }, encoding: 'utf8', maxBuffer: 24 * 1024 * 1024, timeout: 600000 });
    write(path.join(out, `${name}.txt`), (result.stdout ?? '') + (result.stderr ?? ''));
    if (legacy && fs.existsSync(legacy)) write(path.join(out, 'r5', legacyName), read(legacy));
  } finally { if (legacy) { if (previous) fs.writeFileSync(legacy, previous); else if (fs.existsSync(legacy)) fs.unlinkSync(legacy); } }
  report.checks.push({ name, status: result.status === 0 ? 'PASS' : 'FAIL', exitCode: result.status, error: result.error?.message });
  report.status = report.checks.every(check => check.status === 'PASS') ? 'PASS' : 'FAIL';
  write(path.join(out, 'regressions.json'), report);
  console.log(`${result.status === 0 ? 'PASS' : 'FAIL'} ${name}`);
  if (result.status !== 0) { console.error(((result.stdout ?? '') + (result.stderr ?? '')).slice(-4500)); process.exitCode = 1; break; }
}
if (report.status === 'PASS' && report.checks.length === tasks.length) {
  write(path.join(out, 'checks.json'), read(path.join(out, 'r2/checks.json')));
  for (const name of ['reset', 'verify']) write(path.join(out, `fixture-${name}.txt`), read(path.join(root, 'database/_audit', `${name}-${database}.log`)));
  for (const name of ['verify', 'backend-smoke', 'concurrency']) write(path.join(out, `${name}.json`), read(path.join(root, 'database/_audit', `${name}-${database}.json`)));
}
