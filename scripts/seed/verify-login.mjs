// Read-only HTTP smoke check for the seeded accounts against the approved Main database.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAIN_DB = 'CinemaBookingDB';
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const dotenv = require('dotenv');
const sql = require('mssql');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
if (env.DB_DATABASE !== MAIN_DB) throw new Error(`Refusing login check: backend/.env must target ${MAIN_DB}.`);
const credentials = JSON.parse(fs.readFileSync(path.join(ROOT, '.audit-output', 'seed-credentials.json'), 'utf8'));
const dbConfig = {
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: MAIN_DB,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
};
const pool = await new sql.ConnectionPool(dbConfig).connect();
try {
  const identity = await pool.request().query('SELECT DB_NAME() AS db;');
  if (identity.recordset[0].db !== MAIN_DB) throw new Error('Connected to the wrong database.');
} finally { await pool.close(); }

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}
async function waitFor(url, child) {
  const deadline = Date.now() + 30000;
  let failure = 'server did not become ready';
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Backend exited before readiness (exit ${child.exitCode}).`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
      failure = `HTTP ${response.status}`;
    } catch (error) { failure = error.message; }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for backend (${failure}).`);
}
async function stop(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
  if (child.exitCode === null && process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  }
}

const port = await freePort();
const backend = path.join(ROOT, 'backend');
const child = spawn(process.execPath, ['src/server.js'], {
  cwd: backend,
  env: {
    PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP,
    NODE_ENV: 'test', PORT: String(port), FRONTEND_URL: `http://127.0.0.1:${port}`,
    DB_SERVER: env.DB_SERVER, DB_PORT: String(env.DB_PORT ?? 1433), DB_DATABASE: MAIN_DB,
    DB_USER: env.DB_USER, DB_PASSWORD: env.DB_PASSWORD, DB_ENCRYPT: String(env.DB_ENCRYPT ?? 'false'),
    DB_TRUST_SERVER_CERTIFICATE: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true'),
    JWT_SECRET: env.JWT_SECRET, JWT_EXPIRES_IN: env.JWT_EXPIRES_IN ?? '1h',
    AUTH_RATE_LIMIT_LOGIN_MAX: '100',
  },
  stdio: ['ignore', 'ignore', 'pipe'],
  windowsHide: true,
});
let stderr = '';
child.stderr.on('data', (chunk) => { stderr = (stderr + chunk.toString()).slice(-4000); });
const rolesToCheck = [
  ['admin.bootstrap@example.test', 'ADMIN'],
  ['admin.operations@example.test', 'ADMIN'],
  ['manager.saigon@example.test', 'QUAN_LY_RAP'],
  ['support.01@example.test', 'CSKH'],
  ['khach.01@example.test', 'KHACH_HANG'],
];
const results = [];
try {
  await waitFor(`http://127.0.0.1:${port}/api/health`, child);
  for (const [email, expectedRole] of rolesToCheck) {
    const account = credentials.accounts.find((item) => item.email === email);
    if (!account?.password) throw new Error(`Credential artifact missing ${email}.`);
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ Email: email, MatKhau: account.password }),
    });
    const payload = await response.json();
    if (!response.ok || payload.user?.role !== expectedRole || !payload.token) {
      throw new Error(`Login failed for ${email} (HTTP ${response.status}, expected role ${expectedRole}). ${stderr}`);
    }
    if (!Array.isArray(payload.user.permissions) || payload.user.permissions.length === 0) {
      throw new Error(`Login for ${email} returned no effective RBAC permissions.`);
    }
    if (expectedRole === 'QUAN_LY_RAP' && payload.user.cinemaAssignments.length !== 1) {
      throw new Error('Manager login did not return its assigned cinema.');
    }
    const current = await fetch(`http://127.0.0.1:${port}/api/auth/me`, {
      headers: { authorization: `Bearer ${payload.token}` },
    });
    if (!current.ok) throw new Error(`/api/auth/me failed after login for role ${expectedRole} (HTTP ${current.status}).`);
    results.push({ email, role: expectedRole, effectivePermissions: payload.user.permissions.length, currentUser: current.status });
  }
} finally { await stop(child); }

const result = { database: MAIN_DB, endpoint: '/api/auth/login + /api/auth/me', checks: results };
const out = path.join(ROOT, '.audit-output', 'seed-login-verification.json');
fs.writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(`HTTP login and current-user checks passed for ${results.length} seeded roles on ${MAIN_DB}.`);
console.log(JSON.stringify(result, null, 2));
