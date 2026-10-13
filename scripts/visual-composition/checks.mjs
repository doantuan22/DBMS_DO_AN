// Capture actual exit codes without PowerShell converting Vite warnings into command errors.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { root, write } from '../db/lib.mjs';
const phase = process.argv[2];
if (!/^(before|vcr[1-7](?:-[a-z]+)?)$/.test(phase ?? '')) throw new Error('Invalid phase');
const checks = [
  ['tests', ['--test', '--test-concurrency=1', 'tests/*.test.js']],
  ['build', ['node_modules/vite/bin/vite.js', 'build']],
  ['lint', ['node_modules/oxlint/bin/oxlint']],
];
const results = await Promise.all(
  checks.map(
    ([name, args]) =>
      new Promise((resolve) => {
        const child = spawn(process.execPath, args, {
          cwd: path.join(root, 'frontend'),
          windowsHide: true,
        });
        let output = '';
        child.stdout.on('data', (v) => (output += v));
        child.stderr.on('data', (v) => (output += v));
        child.on('error', (e) => resolve({ name, status: 'FAIL', error: e.message }));
        child.on('close', (exitCode) => {
          const file = path.join(root, '.audit-output/vcr', phase, name + '.log');
          write(file, output);
          resolve({
            name,
            status: exitCode === 0 ? 'PASS' : 'FAIL',
            exitCode,
            log: path.relative(root, file),
          });
        });
      }),
  ),
);
write(path.join(root, '.audit-output/vcr', phase, 'checks.json'), { phase, results });
console.log(JSON.stringify({ phase, results }));
if (results.some((r) => r.status !== 'PASS')) process.exitCode = 1;
