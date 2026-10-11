// Run on the Windows host. Credentials/DB target are environment-only.
import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { strict as assert } from 'node:assert';
import path from 'node:path';
import { credentials } from '../../../../scripts/db/lib.mjs';
import { validateTestName } from '../../../../scripts/db/test-target.mjs';

const root = process.cwd();
const logs = 'docs/UXR-V3/UXR-1D/browser-startup-logs';
const database = validateTestName(process.env.UXR1D_TEST_DATABASE);
const config = { ...credentials(), ...process.env };
for (const field of ['UXR1D_MANAGER_EMAIL', 'UXR1D_MANAGER_PASSWORD', 'UXR1D_ADMIN_EMAIL', 'UXR1D_ADMIN_PASSWORD'])
  if (!config[field]) throw new Error(`Missing ${field}.`);
const apiPort = Number(config.UXR1D_API_PORT ?? 4310);
const appPort = Number(config.UXR1D_APP_PORT ?? 5174);
const browserPort = Number(config.UXR1D_CDP_PORT ?? 9351);
const apiUrl = `http://localhost:${apiPort}/api`;
const appUrl = `http://localhost:${appPort}`;
const runEnv = { ...config, UXR1D_CDP_PORT: String(browserPort), UXR1D_API_URL: apiUrl, UXR1D_APP_URL: appUrl };
mkdirSync('.audit-output', { recursive: true });
const profile = path.resolve('.audit-output', `uxr1d-exit-gate-profile-${Date.now()}`);
const owned = [];
const streams = [];
let adminToken;
let managerToken;
let fixture;
let originalAssignmentIds = [];
const evidence = { startedAt: new Date().toISOString(), isolatedTargetVerified: false, fixtureCreatedThroughExistingApi: false, results: [] };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const freePort = (port) => new Promise((resolve, reject) => {
  const server = createServer(); server.once('error', reject);
  server.listen(port, '127.0.0.1', () => server.close(resolve));
});
const start = (name, executable, args, cwd, env) => {
  const stdout = createWriteStream(`${logs}/exit-gate-${name}.stdout.log`);
  const stderr = createWriteStream(`${logs}/exit-gate-${name}.stderr.log`);
  streams.push(stdout, stderr);
  const child = spawn(executable, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  owned.push(child); child.stdout.pipe(stdout); child.stderr.pipe(stderr);
  return child;
};
const runScript = (file, env) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [file], { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = ''; let errors = '';
  child.stdout.on('data', (buffer) => { output += buffer.toString(); });
  child.stderr.on('data', (buffer) => { errors += buffer.toString(); });
  child.on('error', reject);
  child.on('exit', (code) => code === 0 ? resolve(output) : reject(new Error(`Test script failed: ${path.basename(file)} (exit ${code}). ${errors.slice(0, 400)}`)));
});
const request = async (endpoint, { token, method = 'GET', body } = {}) => {
  const response = await fetch(apiUrl + endpoint, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
  return { status: response.status, body: await response.json() };
};
const waitUrl = async (url) => {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1500) })).ok) return; } catch { /* service startup */ }
    await sleep(200);
  }
  throw new Error('Test service did not become ready.');
};
try {
  await runScript(`${logs}/verify-manager-assignment.mjs`, runEnv);
  evidence.isolatedTargetVerified = true;
  for (const port of [apiPort, appPort, browserPort]) await freePort(port);
  start('backend', process.execPath, ['src/server.js'], path.join(root, 'backend'), { ...runEnv, PORT: String(apiPort), DB_DATABASE: database, FRONTEND_URL: appUrl });
  start('vite', process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(appPort), '--strictPort'], path.join(root, 'frontend'), { ...runEnv, VITE_API_BASE_URL: apiUrl });
  start('chrome', config.UXR1D_CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', `--remote-debugging-port=${browserPort}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', 'about:blank'], root, runEnv);
  await waitUrl(`http://127.0.0.1:${browserPort}/json/version`);
  // Stop immediately on this runner if the renderer preflight does not pass.
  const preflightOutput = await runScript(`${logs}/host-preflight.mjs`, { ...runEnv, UXR1D_PREFLIGHT_SCREENSHOT: 'docs/UXR-V3/UXR-1D/screenshots/exit-gate-preflight-1280.png' });
  const preflight = JSON.parse(preflightOutput.trim());
  assert.equal(preflight.preflight, 'PASS');
  writeFileSync('docs/UXR-V3/UXR-1D/exit-gate-browser-preflight.json', JSON.stringify(preflight, null, 2) + '\n');
  evidence.results.push({ scenario: 'Host renderer preflight', status: 'PASS' });
  await waitUrl(apiUrl + '/health/db'); await waitUrl(appUrl);
  const admin = await request('/auth/login', { method: 'POST', body: { Email: config.UXR1D_ADMIN_EMAIL, MatKhau: config.UXR1D_ADMIN_PASSWORD } });
  const manager = await request('/auth/login', { method: 'POST', body: { Email: config.UXR1D_MANAGER_EMAIL, MatKhau: config.UXR1D_MANAGER_PASSWORD } });
  assert.equal(admin.status, 200); assert.equal(manager.status, 200);
  adminToken = admin.body.token; managerToken = manager.body.token;
  assert.ok(adminToken && managerToken);
  const before = await request('/manager/cinemas', { token: managerToken });
  assert.equal(before.status, 200); assert.equal(before.body.cinemas.length, 1);
  const originalCinema = before.body.cinemas[0];
  originalAssignmentIds = before.body.cinemas.map((cinema) => cinema.assignmentId);
  const all = await request('/admin/cinemas', { token: adminToken });
  assert.equal(all.status, 200);
  let secondCinema;
  for (const cinema of all.body.cinemas.filter((row) => String(row.RapID) !== String(originalCinema.id))) {
    const rooms = await request(`/admin/rooms?cinemaId=${cinema.RapID}`, { token: adminToken });
    if (rooms.status === 200 && rooms.body.rooms.length) { secondCinema = cinema; break; }
  }
  assert.ok(secondCinema, 'A second existing cinema with rooms is needed for a valid fixture.');
  const outside = all.body.cinemas.find((row) => String(row.RapID) !== String(originalCinema.id) && row.RapID !== secondCinema.RapID);
  assert.ok(outside, 'An existing unassigned cinema is needed for the negative scope case.');
  assert.equal((await request(`/manager/cinemas/${secondCinema.RapID}/rooms`, { token: managerToken })).status, 403);
  const assignments = await request(`/admin/assignments?userId=${manager.body.user.userId}`, { token: adminToken });
  assert.equal(assignments.status, 200);
  const contract = JSON.parse(readFileSync('docs/UXR-V3/UXR-1D/assignment-contract-evidence.json', 'utf8'));
  let startsOn = contract.businessDate;
  // Keep cancelled attempts traceable without creating an identical-status update conflict.
  for (let offset = 0; offset < 100; offset += 1) {
    const date = new Date(contract.businessDate + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() - offset);
    startsOn = date.toISOString().slice(0, 10);
    if (!assignments.body.assignments.some((row) => row.RapID === secondCinema.RapID && row.NgayBatDau.slice(0, 10) === startsOn && row.NgayKetThuc === null)) break;
  }
  const input = { userId: manager.body.user.userId, cinemaId: secondCinema.RapID, startsOn, endsOn: null };
  const created = await request('/admin/assignments', { token: adminToken, method: 'POST', body: input });
  assert.equal(created.status, 200);
  fixture = { id: created.body.assignment.PhanCongID, input };
  assert.ok(fixture.id);
  evidence.fixtureCreatedThroughExistingApi = true;
  const added = await request('/manager/cinemas', { token: managerToken });
  assert.equal(added.status, 200); assert.equal(added.body.cinemas.length, 2);
  assert.ok(added.body.cinemas.some((cinema) => cinema.assignmentId === originalCinema.assignmentId));
  evidence.results.push({ scenario: 'Existing POST assignment adds a concurrent second cinema', status: 'PASS', originalAssignmentStillEffective: true, effectiveCinemaCount: 2 });
  console.log('Contract and API fixture verified; running only the remaining scope browser scenarios.');
  await runScript(`${logs}/manager-scope-acceptance-cdp.mjs`, { ...runEnv, UXR1D_SCOPE_A: String(originalCinema.id), UXR1D_SCOPE_B: String(secondCinema.RapID), UXR1D_SCOPE_OTHER: String(outside.RapID) });
  evidence.results.push({ scenario: 'Focused scope browser suite', status: 'PASS' });
} catch (error) {
  evidence.results.push({ scenario: 'Exit-gate orchestration', status: 'FAIL', reason: error.message });
  process.exitCode = 1;
} finally {
  if (fixture && adminToken) {
    try {
      const cancelled = await request(`/admin/assignments/${fixture.id}`, { token: adminToken, method: 'PUT', body: { ...fixture.input, status: 'Đã hủy' } });
      assert.equal(cancelled.status, 200);
      const restored = await request('/manager/cinemas', { token: managerToken });
      assert.deepEqual(restored.body.cinemas.map((cinema) => cinema.assignmentId).sort(), originalAssignmentIds.sort());
      const denied = await request(`/manager/cinemas/${fixture.input.cinemaId}/rooms`, { token: managerToken });
      assert.equal(denied.status, 403);
      evidence.results.push({ scenario: 'Fixture cancelled through API and original scope restored', status: 'PASS', historyPreserved: true, addedCinemaAfterCleanup: 403 });
    } catch (error) {
      evidence.results.push({ scenario: 'Fixture cleanup', status: 'FAIL', reason: error.message }); process.exitCode = 1;
    }
  }
  try {
    const version = await (await fetch(`http://127.0.0.1:${browserPort}/json/version`)).json();
    const socket = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    socket.send(JSON.stringify({ id: 1, method: 'Browser.close' })); await sleep(250); socket.close();
  } catch { /* close only this runner's private test browser */ }
  owned.forEach((child) => { if (child.exitCode === null) child.kill(); });
  streams.forEach((stream) => stream.end());
  evidence.completedAt = new Date().toISOString();
  writeFileSync('docs/UXR-V3/UXR-1D/assignment-fixture-api-results.json', JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify(evidence.results));
}
