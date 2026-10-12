import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
const directory = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const evidence = { timestamp: new Date().toISOString(), checks: [], logs: [] };
function run(label, command, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'] }); let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; }); child.stderr.on('data', (chunk) => { output += chunk; });
    child.once('error', (error) => { evidence.checks.push({ label, status: 'FAIL', error: error.message }); resolve(); });
    child.once('exit', (exitCode) => { const log = `${label.replaceAll(' ', '-')}.log`; fs.writeFileSync(path.join(directory, log), output); evidence.logs.push(log); evidence.checks.push({ label, exitCode, status: exitCode === 0 ? 'PASS' : 'FAIL', ...(label.includes('tests') ? { tests: Number(output.match(/ℹ tests (\d+)/)?.[1] ?? 0), passed: Number(output.match(/ℹ pass (\d+)/)?.[1] ?? 0), failed: Number(output.match(/ℹ fail (\d+)/)?.[1] ?? 0) } : {}) }); console.log(`${label}: ${exitCode === 0 ? 'PASS' : 'FAIL'}`); resolve(); });
  });
}
const frontend = path.resolve('frontend'), backend = path.resolve('backend');
await run('frontend lint', process.execPath, [path.join(frontend, 'node_modules/oxlint/bin/oxlint')], frontend);
await run('frontend tests', process.execPath, ['--test', '--test-concurrency=1', ...fs.readdirSync(path.join(frontend, 'tests')).filter((f) => f.endsWith('.test.js')).map((f) => `tests/${f}`)], frontend);
await run('production build', process.execPath, [path.join(frontend, 'node_modules/vite/bin/vite.js'), 'build'], frontend);
await run('backend tests', process.execPath, ['--test', ...fs.readdirSync(path.join(backend, 'tests'), { recursive: true }).filter((f) => f.endsWith('.test.js')).map((f) => path.join('tests', f))], backend);
const baseline = JSON.parse(fs.readFileSync(path.join(directory, 'source-baseline.json'), 'utf8'));
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const changed = baseline.files.filter(({ file, hash: prior }) => hash(file) !== prior).map(({ file }) => file);
const expected = ['frontend/src/routes/AdminSectionRoute.jsx', 'frontend/src/routes/index.jsx', 'frontend/src/components/NamedResourceSelect.jsx'];
evidence.sourceChanges = changed;
evidence.checks.push({ label: 'Preserve pre-UXR5 source including UXR4; only planned Admin routing and additive readonly hint', status: changed.length === expected.length && changed.every((file) => expected.includes(file)) ? 'PASS' : 'FAIL' });
const source = fs.readFileSync('frontend/src/features/admin-resources/admin-resources.css', 'utf8') + fs.readFileSync('frontend/src/features/admin-analytics/admin-analytics.css', 'utf8'), tokens = fs.readFileSync('frontend/src/styles/tokens.css', 'utf8');
const unknown = [...new Set([...source.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))].filter((token) => !tokens.includes(`${token}:`)); evidence.checks.push({ label: 'UXR5 CSS reuses existing tokens', status: unknown.length ? 'FAIL' : 'PASS', unknown });
evidence.status = evidence.checks.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL'; fs.writeFileSync(path.join(directory, 'final-checks.json'), JSON.stringify(evidence, null, 2)); console.log(JSON.stringify(evidence.checks)); if (evidence.status === 'FAIL') process.exitCode = 1;
