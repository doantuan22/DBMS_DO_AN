import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const directory = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const checks = [
  ['frontend-tests', 'npm.cmd test'],
  ['lint', 'npm.cmd run lint'],
  ['build', 'npm.cmd run build -- --outDir ../.audit-output/uxr4-production-delivery'],
];
const evidence = { timestamp: new Date().toISOString(), checks: [] };
for (const [name, command] of checks) {
  // Fixed package commands only; no shell interpolation or filesystem operations.
  const result = spawnSync('cmd.exe', ['/d', '/s', '/c', command], { cwd: path.resolve('frontend'), windowsHide: true, encoding: 'utf8', timeout: 120000 });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  fs.writeFileSync(path.join(directory, `${name}.log`), output);
  evidence.checks.push({ name, command, exitCode: result.status, ...(result.error ? { error: result.error.message } : {}), status: result.status === 0 ? 'PASS' : 'FAIL' });
}
evidence.status = evidence.checks.every((check) => check.status === 'PASS') ? 'PASS' : 'FAIL';
fs.writeFileSync(path.join(directory, 'final-checks.json'), JSON.stringify(evidence, null, 2)); console.log(JSON.stringify(evidence));
if (evidence.status !== 'PASS') process.exitCode = 1;
