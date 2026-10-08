import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Verification only: use the existing npm/Node test runner in two fresh local clones.
const root = fileURLToPath(new URL('../../', import.meta.url));
const output = path.join(root, 'docs/evidence/r41');
const inputPaths = ['backend', 'shared', 'database/03_constraints', 'database/05_functions', 'database/07_triggers', 'database/08_procedures'];
const npmCli = process.env.npm_execpath ?? path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
assert.ok(fs.existsSync(npmCli), 'Cannot locate npm-cli.js; run with an official Node/npm installation.');
fs.mkdirSync(output, { recursive: true });

const env = { ...process.env, FORCE_COLOR: '0' };
const removedEnvironmentKeys = [];
for (const key of Object.keys(env)) {
  if (/^(DB_|JWT_|DOTENV_|NODE_OPTIONS$|NODE_PATH$|NODE_ENV$|TZ$|PORT$|FRONTEND_URL$)/i.test(key)) {
    removedEnvironmentKeys.push(key);
    delete env[key];
  }
}

async function command(label, executable, args, cwd) {
  const started = Date.now();
  const result = await new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (exitCode, signal) => resolve({ exitCode, signal, stdout, stderr }));
  });
  const log = `${label}.txt`;
  fs.writeFileSync(path.join(output, log), [
    JSON.stringify({ executable, args, cwd, exitCode: result.exitCode, signal: result.signal }),
    result.stdout, result.stderr,
  ].join('\n'));
  console.log(`${label}: exit=${result.exitCode} (${Date.now() - started}ms)`);
  assert.equal(result.exitCode, 0, `${label} failed; see ${log}`);
  return { ...result, log };
}

function manifest(checkout, files, normalizeLineEndings = false) {
  return Object.fromEntries(files.map(file => [file,
    createHash('sha256').update(normalizeLineEndings
      ? fs.readFileSync(path.join(checkout, file), 'utf8').replace(/\r\n/g, '\n')
      : fs.readFileSync(path.join(checkout, file))).digest('hex'),
  ]));
}

function cleanState(checkout) {
  const state = Object.fromEntries(['backend/.env', 'database/_audit', 'docs/evidence'].map(file => [file, fs.existsSync(path.join(checkout, file))]));
  assert.ok(Object.values(state).every(exists => !exists), 'Unexpected local environment or audit/evidence input');
  return state;
}

let expectedTests;
async function testRun(label, checkout, files) {
  const args = files ? ['--test', '--test-reporter=spec', '--test-concurrency=1', ...files] : [npmCli, 'test'];
  const result = await command(label, process.execPath, args, path.join(checkout, 'backend'));
  const text = result.stdout.replace(/\u001b\[[0-9;]*m/g, '');
  const counts = Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map(key => {
    const match = new RegExp(`^(?:# |ℹ )${key} (\\d+)$`, 'm').exec(text);
    assert.ok(match, `${label}: missing ${key} summary`);
    return [key, Number(match[1])];
  }));
  assert.ok(counts.tests > 0);
  assert.equal(counts.pass, counts.tests);
  for (const key of ['fail', 'cancelled', 'skipped', 'todo']) assert.equal(counts[key], 0);
  const names = [...text.matchAll(/^[ \t]*✔ (.+) \([^\n]+\)$/gm)].map(match => match[1]).sort();
  assert.equal(names.length, counts.tests, 'Each passing test must be recorded by the spec reporter (validated with Node 24).');
  const observed = { counts, names };
  if (expectedTests) assert.deepEqual(observed, expectedTests, `${label}: test identities or results changed`);
  else expectedTests = observed;
  cleanState(checkout);
  return { log: result.log, ...observed };
}

const summary = { phase: 'R4.1', status: 'RUNNING', at: new Date().toISOString(), node: process.version, removedEnvironmentKeys, clones: [] };
try {
  summary.head = (await command('git-head', 'git', ['rev-parse', 'HEAD'], root)).stdout.trim();
  const diff = await command('source-diff', 'git', ['diff', 'HEAD', '--', ...inputPaths], root);
  assert.equal(diff.stdout, '', 'Commit test inputs before checking a clean clone; local changes would not be cloned.');
  const tracked = (await command('tracked-inputs', 'git', ['ls-files', '--', ...inputPaths], root)).stdout.trim().split(/\r?\n/).filter(Boolean);
  // .env.example is documentation, not a secret or required test configuration.
  assert.ok(!tracked.some(file => /(?:^|\/)node_modules\//.test(file) || file === 'backend/.env' || file.startsWith('database/_audit/')));
  const originalInputs = manifest(root, tracked);
  // Git may check out LF source as CRLF on Windows. Compare logical text across
  // clones, then compare raw bytes within each checkout before/after testing.
  summary.inputHashNormalization = 'CRLF to LF for cross-checkout comparison; raw SHA-256 for before/after';
  summary.inputs = manifest(root, tracked, true);
  const testFiles = tracked.filter(file => /^backend\/tests\/.*\.test\.js$/.test(file)).map(file => file.slice('backend/'.length)).sort();
  assert.ok(testFiles.length > 0);
  summary.testFiles = testFiles;
  summary.npm = (await command('npm-version', process.execPath, [npmCli, '--version'], root)).stdout.trim();

  for (let index = 1; index <= 2; index++) {
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'dbms-r41-'));
    const checkout = path.join(scratch, 'checkout');
    await command(`clone-${index}`, 'git', ['clone', '--quiet', '--no-hardlinks', '--', root, checkout], root);
    assert.equal((await command(`clone-${index}-head`, 'git', ['rev-parse', 'HEAD'], checkout)).stdout.trim(), summary.head);
    // Remove only evidence in the disposable clone; original artifacts stay untouched.
    for (const relative of ['database/_audit', 'docs/evidence']) {
      const target = path.resolve(checkout, relative);
      assert.ok(target.startsWith(path.resolve(checkout) + path.sep), 'Refusing deletion outside the disposable clone');
      fs.rmSync(target, { recursive: true, force: true });
    }
    const before = cleanState(checkout);
    assert.equal(fs.existsSync(path.join(checkout, 'backend/node_modules')), false);
    assert.deepEqual(manifest(checkout, tracked, true), summary.inputs);
    const beforeInputs = manifest(checkout, tracked);
    const install = await command(`clone-${index}-npm-ci`, process.execPath, [npmCli, 'ci', '--no-audit', '--no-fund'], path.join(checkout, 'backend'));
    const clone = { checkout, before, nodeModulesBeforeInstall: false, installLog: install.log, runs: [] };
    summary.clones.push(clone);
    clone.runs.push(await testRun(`clone-${index}-test-first`, checkout));
    clone.runs.push(await testRun(`clone-${index}-test-repeat`, checkout));
    clone.runs.push(await testRun(`clone-${index}-test-reverse`, checkout, [...testFiles].reverse()));
    clone.after = cleanState(checkout);
    assert.deepEqual(manifest(checkout, tracked), beforeInputs, 'Install/tests changed versioned input bytes');
    clone.inputsUnchanged = true;
  }
  assert.deepEqual(manifest(root, tracked), originalInputs, 'Original test input bytes changed during verification');
  summary.status = 'PASS';
} catch (error) {
  summary.status = 'FAIL';
  summary.error = error.message;
  process.exitCode = 1;
  console.error(error.message);
} finally {
  summary.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(output, 'clean-check.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(`R4.1 ${summary.status}: ${path.join(output, 'clean-check.json')}`);
}
