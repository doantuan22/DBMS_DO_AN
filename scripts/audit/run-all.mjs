// One-command acceptance run:  node scripts/audit/run-all.mjs [--skip-build] [--skip-browser]
// Order: safety gate → backend unit → frontend unit → frontend build → DB integrity → API integration
// → Browser E2E. Writes .audit-output/acceptance/summary.json and exits non-zero on any failure.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { OUTPUT_DIR, ROOT, TEST_DB, connectTestDb } from './lib.mjs';

const args = new Set(process.argv.slice(2));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const stages = [];

function run(name, command, commandArgs, { cwd = ROOT, parse } = {}) {
  console.log(`\n=== ${name} ===`);
  const started = Date.now();
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32' && command.endsWith('.cmd'),
    maxBuffer: 64 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const parsed = parse ? parse(output) : {};
  const ok = result.status === 0 && (parsed.fail ?? 0) === 0;
  stages.push({ name, ok, seconds: Math.round((Date.now() - started) / 1000), ...parsed });
  console.log(ok ? `PASS  ${JSON.stringify(parsed)}` : `FAIL  exit=${result.status}\n${output.slice(-3000)}`);
  return ok;
}

const nodeTestCounts = (output) => ({
  tests: Number(/ℹ tests (\d+)/.exec(output)?.[1] ?? 0),
  pass: Number(/ℹ pass (\d+)/.exec(output)?.[1] ?? 0),
  fail: Number(/ℹ fail (\d+)/.exec(output)?.[1] ?? 0),
});
const runnerCounts = (output) => {
  const m = /: (\d+) PASS \/ (\d+) FAIL \/ (\d+) SKIP/.exec(output);
  return { pass: Number(m?.[1] ?? 0), fail: m ? Number(m[2]) : 1, skip: Number(m?.[3] ?? 0) };
};

// Gate: refuse to start unless the pinned test database answers to its exact name.
const { pool, identity } = await connectTestDb();
await pool.close();
console.log(`Safety gate OK: DB_NAME() = ${identity.db} (login ${identity.login}); expected ${TEST_DB}`);

run('backend unit/contract tests', npm, ['--prefix', 'backend', 'test'], { parse: nodeTestCounts });
run('frontend unit/component tests', npm, ['--prefix', 'frontend', 'test'], { parse: nodeTestCounts });
if (!args.has('--skip-build')) {
  run('frontend production build', npm, ['--prefix', 'frontend', 'run', 'build'], {
    parse: (output) => ({ modules: Number(/(\d+) modules transformed/.exec(output)?.[1] ?? 0), fail: /error/i.test(output) && !/0 errors/i.test(output) ? 1 : 0 }),
  });
}
run('database integrity', process.execPath, ['scripts/audit/db-integrity.mjs'], { parse: runnerCounts });
run('API integration', process.execPath, ['scripts/audit/api-integration.mjs'], { parse: runnerCounts });
run('revenue reconciliation (F-11, read-only)', process.execPath, ['scripts/audit/revenue-analysis.mjs'], {
  parse: (output) => ({
    pass: /"bucketsSumToCash": true/.test(output) ? 1 : 0,
    fail: /EqualsCashReceived": false|"bucketsSumToCash": false/.test(output) || !/"bucketsSumToCash"/.test(output) ? 1 : 0,
  }),
});
run('points payment, compensation and revenue', process.execPath, ['scripts/audit/points-revenue.mjs'], { parse: runnerCounts });
run('lifecycle: concurrency, hold expiry, compensated cancel', process.execPath, ['scripts/audit/lifecycle.mjs'], { parse: runnerCounts });
run('CSKH lifecycle: chat, assignment, escalation', process.execPath, ['scripts/audit/cskh-lifecycle.mjs'], { parse: runnerCounts });
if (!args.has('--skip-browser')) {
  run('browser E2E (Edge, interactive)', process.execPath, ['scripts/audit/browser-e2e.mjs'], { parse: runnerCounts });
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const summary = {
  finishedAt: new Date().toISOString(),
  database: TEST_DB,
  allPassed: stages.every((s) => s.ok),
  stages,
};
fs.writeFileSync(path.join(OUTPUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
console.log('\n=== SUMMARY ===');
for (const stage of stages) {
  console.log(`${stage.ok ? 'PASS' : 'FAIL'}  ${stage.name}  pass=${stage.pass ?? '-'} fail=${stage.fail ?? '-'} (${stage.seconds}s)`);
}
process.exit(summary.allPassed ? 0 : 1);
