// Save R2 evidence separately; preserve historical R1 artifacts when re-running its regression scripts.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, write } from '../db/lib.mjs';
const database = process.argv.find(a => a.startsWith('--database='))?.slice(11);
if (!/^CinemaBookingDB_R0_R1_R2_[A-Za-z0-9_]+$/.test(database || '')) throw Error('Disposable R1/R2 database required.');
const out = path.join(root, process.env.R2_EVIDENCE_DIR || 'audit/remediation/r2/evidence');
const npm = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const tasks = [
  ['backend', ['--test', 'tests/**/*.test.js'], 'backend'],
  ['frontend', ['--test', '--test-concurrency=1', 'tests/*.test.js'], 'frontend'],
  ['frontend-build', [path.join(root, 'frontend/node_modules/vite/bin/vite.js'), 'build'], 'frontend'],
  ['frontend-lint', [npm, 'run', 'lint'], 'frontend'],
  ['no-raw-sql', ['scripts/audit-no-sql.mjs'], ''],
  ['procedure-contracts', ['scripts/db/contract-check.mjs'], ''],
  ['r2-sql', ['scripts/db/run.mjs', 'test', `--database=${database}`], ''],
  ['r2-integration', ['scripts/r2/integration.mjs', `--database=${database}`], ''],
  ['r2-browser', ['scripts/r2/browser.mjs'], ''],
  ['r1-fixed-clock', ['scripts/r1/sql-fixtures.mjs', `--database=${database}`], '', {}, 'sql-fixed-clock-report-expiry.json'],
  ...['UTC', 'Asia/Ho_Chi_Minh', 'America/Los_Angeles'].map(TZ => [`r1-integration-${TZ.replaceAll('/', '_')}`, ['scripts/r1/integration.mjs', `--database=${database}`], '', { TZ }, `integration-${TZ.replaceAll('/', '_')}.json`]),
  ['r1-browser', ['scripts/r1/browser.mjs'], '', {}, 'browser-timezone.json'],
  ['booking-concurrency', ['scripts/db/backend-smoke.mjs', `--database=${database}`, '--stress'], ''],
  ['db-verify', ['scripts/db/run.mjs', 'verify', `--database=${database}`], ''],
];
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7)?.split(',');
const report = path.join(out, 'checks.json');
const previousReport = only && fs.existsSync(report) ? JSON.parse(fs.readFileSync(report, 'utf8')) : null;
if (previousReport && previousReport.database !== database) throw Error('Cannot merge checks from a different database.');
if (only?.some(name => !tasks.some(task => task[0] === name))) throw Error('Unknown check name.');
const checks = previousReport?.checks ?? [];
for (const [name, args, cwd, extraEnv = {}, legacyArtifact] of tasks.filter(task => !only || only.includes(task[0]))) {
  const legacy = legacyArtifact ? path.join(root, 'audit/remediation/evidence', legacyArtifact) : null;
  const previous = legacy && fs.existsSync(legacy) ? fs.readFileSync(legacy) : null;
  const result = spawnSync(process.execPath, args, { cwd: path.join(root, cwd), env: { ...process.env, ...extraEnv }, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 180000 });
  const output = (result.stdout || '') + (result.stderr || '');
  write(path.join(out, `${name}.txt`), output);
  if (legacy && fs.existsSync(legacy)) {
    write(path.join(out, `${name}.json`), fs.readFileSync(legacy, 'utf8'));
    if (previous) fs.writeFileSync(legacy, previous); else fs.unlinkSync(legacy);
  }
  const check = { name, status: result.status === 0 ? 'PASS' : 'FAIL', exitCode: result.status, error: result.error?.message };
  const index = checks.findIndex(check => check.name === name);
  if (index >= 0) checks[index] = check; else checks.push(check);
  console.log(`${result.status === 0 ? 'PASS' : 'FAIL'} ${name}`);
  if (result.status !== 0) console.error(output.slice(-4000));
  write(path.join(out, 'checks.json'), { status: checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL', database, checks });
}
if (checks.some(c => c.status !== 'PASS')) process.exitCode = 1;
