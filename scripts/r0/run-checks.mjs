// Run supported regression commands; capture actual exits/output without skipping failures.
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, audit, read, write } from '../db/lib.mjs';
const database = process.argv.find(arg => arg.startsWith('--database='))?.slice(11);
if (!/^CinemaBookingDB_R0_[A-Za-z0-9_]+$/.test(database ?? '')) throw new Error('An explicitly disposable target is required.');
const out = path.join(root, 'docs/r0-20261007');
const commands = [
  ['backend', ['--test','tests/**/*.test.js'], path.join(root,'backend')],
  ['frontend', ['--test','--test-concurrency=1','tests/*.test.js'], path.join(root,'frontend')],
  ['no-sql', ['scripts/audit-no-sql.mjs'], root],
  ['frontend-lint', ['node_modules/oxlint/bin/oxlint'], path.join(root,'frontend')],
  ['frontend-build', ['node_modules/vite/bin/vite.js','build'], path.join(root,'frontend')],
  ['procedure-contract', ['scripts/db/contract-check.mjs'], root],
  ['sql-regression', ['scripts/db/run.mjs','test',`--database=${database}`], root],
  ['sql-verification', ['scripts/db/run.mjs','verify',`--database=${database}`], root],
];
const report = { database, startedAt: new Date().toISOString(), status: 'RUNNING', checks: [] };
for (const [name,args,cwd] of commands) {
  const result = spawnSync(process.execPath,args,{cwd,env:process.env,encoding:'utf8',maxBuffer:32*1024*1024,timeout:300000});
  const output = (result.stdout ?? '') + (result.stderr ?? '');
  write(path.join(out,`${name}.txt`), output);
  const tests = output.match(/(?:ℹ|#) tests (\d+)/)?.[1];
  const skipped = output.match(/(?:ℹ|#) skipped (\d+)/)?.[1];
  const entry = {name,status:result.status === 0 ? 'PASS':'FAIL',exitCode:result.status,command:['node',...args].join(' '),
    ...(tests ? {tests:Number(tests),skipped:Number(skipped)}:{}),...(result.error ? {error:result.error.message}:{})};
  report.checks.push(entry); console.log(`${entry.status} ${name}${tests ? `: ${tests} tests, ${skipped} skipped`:''}`);
  if (name === 'procedure-contract' && result.status === 0) write(path.join(out,'procedure-contract.json'),read(path.join(audit,'backend-contract-check.json')));
  if (name === 'sql-regression' && result.status === 0) write(path.join(out,'sql-regression-detail.txt'), read(path.join(audit,`test-${database}.log`)).replace(/\$2[aby]\$\d\d\$[A-Za-z0-9./]{53}/g,'[demo password hash redacted]'));
  if (name === 'sql-verification' && result.status === 0) {
    write(path.join(out,'sql-verification-detail.txt'),read(path.join(audit,`verify-${database}.log`)));
    write(path.join(out,'source-parity.json'),read(path.join(audit,`verify-${database}.json`)));
  }
}
report.status = report.checks.every(check=>check.status === 'PASS' && (check.skipped ?? 0) === 0) ? 'PASS':'FAIL';
report.completedAt = new Date().toISOString(); write(path.join(out,'checks.json'),report);
if (report.status !== 'PASS') process.exitCode = 1;
