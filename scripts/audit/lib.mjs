// Shared helpers for the audit runners (API integration, Browser E2E, DB integrity).
//
// SAFETY MODEL: every runner that can write goes through `connectTestDb()`, which refuses to
// continue unless SELECT DB_NAME() is exactly CinemaBookingDB_Test (and the login is not `sa`).
// The Backend/Frontend processes started here receive an explicit, fully pinned environment, so
// backend/.env (which points at the main database) can never leak in.
import { createRequire } from 'node:module';
import { randomInt } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TEST_DB = 'CinemaBookingDB_Test';
export const OUTPUT_DIR = path.join(ROOT, '.audit-output', 'acceptance');

const backendRequire = createRequire(path.join(ROOT, 'backend', 'package.json'));
export const sql = backendRequire('mssql');
const dotenv = backendRequire('dotenv');

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class SafetyGateError extends Error {}

/** Parse backend/.env.test and refuse anything that does not target the test database. */
export function loadTestEnv() {
  const file = path.join(ROOT, 'backend', '.env.test');
  if (!fs.existsSync(file)) throw new SafetyGateError(`Missing ${file}`);
  const values = dotenv.parse(fs.readFileSync(file));
  for (const key of ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET']) {
    if (!values[key]) throw new SafetyGateError(`backend/.env.test is missing ${key}`);
  }
  if (values.DB_DATABASE !== TEST_DB) {
    throw new SafetyGateError(
      `Refusing to run: backend/.env.test targets "${values.DB_DATABASE}", expected "${TEST_DB}".`,
    );
  }
  if (String(values.DB_USER).toLowerCase() === 'sa') {
    throw new SafetyGateError('Refusing to run with the sa login; use the dedicated test user.');
  }
  return values;
}

/** Re-check the connected database name. Call before each batch of writes. */
export async function assertTestDatabase(pool) {
  const { recordset } = await pool.request().query('SELECT DB_NAME() AS db, SUSER_SNAME() AS login');
  const { db, login } = recordset[0];
  if (db !== TEST_DB) {
    throw new SafetyGateError(`DB_NAME() is "${db}", expected "${TEST_DB}". Aborting before any write.`);
  }
  return { db, login };
}

export async function connectTestDb(env = loadTestEnv()) {
  const pool = await new sql.ConnectionPool({
    server: env.DB_SERVER,
    port: Number(env.DB_PORT ?? 1433),
    database: env.DB_DATABASE,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    options: {
      encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true',
      trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true',
      useUTC: true,
    },
    requestTimeout: 60000,
  }).connect();
  const identity = await assertTestDatabase(pool);
  return { pool, identity, env };
}

export async function rows(pool, text, params = {}) {
  const request = pool.request();
  for (const [name, value] of Object.entries(params)) request.input(name, value);
  return (await request.query(text)).recordset;
}
export async function one(pool, text, params = {}) {
  return (await rows(pool, text, params))[0];
}
export async function scalar(pool, text, params = {}) {
  const row = await one(pool, text, params);
  return row ? Object.values(row)[0] : undefined;
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForHttp(url, { timeout = 60000, accept = (status) => status < 500 } = {}) {
  const until = Date.now() + timeout;
  let last;
  while (Date.now() < until) {
    try {
      const response = await fetch(url);
      if (accept(response.status)) return response;
      last = `HTTP ${response.status}`;
    } catch (error) {
      last = error.message;
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url} (${last})`);
}

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    /* already gone */
  }
}

/**
 * Starts the real Express API as a child process against CinemaBookingDB_Test.
 * Auth rate-limit ceilings are raised through the existing env settings only for this process
 * (a browser run logs in dozens of times from one address); no application code is changed.
 */
export async function startBackend({ env = loadTestEnv(), frontendOrigin, port: fixedPort } = {}) {
  const port = fixedPort ?? (await freePort());
  const childEnv = {
    PATH: process.env.PATH,
    SystemRoot: process.env.SystemRoot,
    TEMP: process.env.TEMP,
    NODE_ENV: 'test',
    PORT: String(port),
    DB_SERVER: env.DB_SERVER,
    DB_PORT: String(env.DB_PORT ?? 1433),
    DB_DATABASE: TEST_DB,
    DB_USER: env.DB_USER,
    DB_PASSWORD: env.DB_PASSWORD,
    DB_ENCRYPT: String(env.DB_ENCRYPT ?? 'false'),
    DB_TRUST_SERVER_CERTIFICATE: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true'),
    JWT_SECRET: env.JWT_SECRET,
    JWT_EXPIRES_IN: env.JWT_EXPIRES_IN ?? '1h',
    FRONTEND_URL: frontendOrigin ?? 'http://127.0.0.1:5173',
    AUTH_RATE_LIMIT_LOGIN_MAX: '100000',
    AUTH_RATE_LIMIT_REGISTER_MAX: '100000',
  };
  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: path.join(ROOT, 'backend'),
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let log = '';
  child.stdout.on('data', (chunk) => (log += chunk));
  child.stderr.on('data', (chunk) => (log += chunk));
  const base = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${base}/api/health`, { accept: (status) => status === 200 });
    await waitForHttp(`${base}/api/health/db`, { accept: (status) => status === 200, timeout: 30000 });
  } catch (error) {
    killTree(child);
    throw new Error(`${error.message}\n--- backend log ---\n${log}`);
  }
  return { port, base, child, log: () => log, stop: () => killTree(child) };
}

/** Starts the Vite dev server for the real React frontend, wired to the given API origin. */
export async function startFrontend({ apiBase, port: fixedPort }) {
  const port = fixedPort ?? (await freePort());
  const vite = path.join(ROOT, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(
    process.execPath,
    [vite, '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: path.join(ROOT, 'frontend'),
      env: {
        PATH: process.env.PATH,
        SystemRoot: process.env.SystemRoot,
        TEMP: process.env.TEMP,
        VITE_API_BASE_URL: `${apiBase}/api`,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    },
  );
  let log = '';
  child.stdout.on('data', (chunk) => (log += chunk));
  child.stderr.on('data', (chunk) => (log += chunk));
  const origin = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${origin}/`, { accept: (status) => status === 200 });
  } catch (error) {
    killTree(child);
    throw new Error(`${error.message}\n--- vite log ---\n${log}`);
  }
  return { port, origin, child, log: () => log, stop: () => killTree(child) };
}

/** Collects PASS/FAIL results and writes a JSON evidence file. */
export class Reporter {
  constructor(name) {
    this.name = name;
    this.results = [];
    this.startedAt = new Date();
  }
  record(id, title, status, detail = '', evidence = undefined) {
    const entry = { id, title, status, detail, ...(evidence === undefined ? {} : { evidence }) };
    this.results.push(entry);
    const tag = status === 'PASS' ? 'PASS' : status === 'SKIP' ? 'SKIP' : 'FAIL';
    console.log(`[${tag}] ${id} ${title}${detail ? ` — ${detail}` : ''}`);
    return entry;
  }
  get passed() {
    return this.results.filter((r) => r.status === 'PASS').length;
  }
  get failed() {
    return this.results.filter((r) => r.status === 'FAIL').length;
  }
  get skipped() {
    return this.results.filter((r) => r.status === 'SKIP').length;
  }
  finish(extra = {}) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const file = path.join(OUTPUT_DIR, `${this.name}.json`);
    const summary = {
      runner: this.name,
      startedAt: this.startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      database: TEST_DB,
      total: this.results.length,
      passed: this.passed,
      failed: this.failed,
      skipped: this.skipped,
      ...extra,
      results: this.results,
    };
    fs.writeFileSync(file, JSON.stringify(summary, null, 2));
    console.log(
      `\n${this.name}: ${this.passed} PASS / ${this.failed} FAIL / ${this.skipped} SKIP  (evidence: ${path.relative(ROOT, file)})`,
    );
    return summary;
  }
}

/** Thin JSON HTTP client for the API runner. */
export function apiClient(base) {
  return async function call(method, route, { token, body, headers } = {}) {
    const response = await fetch(`${base}/api${route}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* non-JSON body */
    }
    return { status: response.status, body: json, text };
  };
}

export const DEMO_PASSWORD = process.env.AUDIT_DEMO_PASSWORD ?? '123456';
export const ACCOUNTS = {
  customer: 'customer1@example.test',
  customer2: 'customer2@example.test',
  manager: 'manager1@example.test',
  support: 'support1@example.test',
  admin: 'admin1@example.test',
};

/** Registers a brand-new customer through the public API and returns its identity and JWT. */
export async function registerCustomer(call, pool, tag) {
  const unique = `${Date.now().toString(36)}${randomInt(0, 1e6).toString(36)}`;
  const email = `e2e.${tag}.${unique}@example.test`;
  const password = 'Audit-Pass-123!';
  const phone = `09${String(randomInt(0, 1e8)).padStart(8, '0')}`;
  const registered = await call('POST', '/auth/register', {
    body: { HoTen: `E2E ${tag} ${unique}`, Email: email, MatKhau: password, SoDienThoai: phone },
  });
  if (registered.status !== 201) throw new Error(`register ${tag}: ${registered.status} ${registered.text}`);
  const login = await call('POST', '/auth/login', { body: { Email: email, MatKhau: password } });
  if (login.status !== 200) throw new Error(`login ${tag}: ${login.status} ${login.text}`);
  const user = await one(pool, 'SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = @e', { e: email });
  return { email, password, token: login.body.token, id: user.NguoiDungID };
}

let slotCounter = 0;
export const SANDBOX = Object.freeze({ cinema: 'E2E Sandbox', room: 'E2E Sandbox Hall', seats: 40 });

/**
 * The runners' private showtimes live in ONE dedicated cinema/room (names start with "E2E", so the
 * purge tool can attribute everything in it). Created on demand through the Admin API; idempotent.
 */
export async function ensureSandbox(call, pool, adminToken, spec = SANDBOX) {
  const existing = await one(
    pool,
    `SELECT TOP 1 p.PhongID, p.RapID FROM dbo.PHONGCHIEU p JOIN dbo.RAPCHIEUPHIM r ON r.RapID = p.RapID
      WHERE r.TenRap = @c AND p.TenPhong = @r AND p.TrangThai = N'Hoạt động'`,
    { c: spec.cinema, r: spec.room },
  );
  if (existing && (await scalar(pool, `SELECT COUNT(*) FROM dbo.GHE WHERE PhongID = @r AND TrangThai = N'Hoạt động'`, { r: existing.PhongID })) >= spec.seats) {
    return { cinemaId: existing.RapID, roomId: existing.PhongID };
  }
  let cinemaId = (await one(pool, 'SELECT TOP 1 RapID FROM dbo.RAPCHIEUPHIM WHERE TenRap = @c', { c: spec.cinema }))?.RapID;
  if (!cinemaId) {
    const created = await call('POST', '/admin/cinemas', {
      token: adminToken,
      body: { name: spec.cinema, address: '1 Sandbox Street', city: 'Hà Nội', description: 'Created by scripts/audit; safe to purge.' },
    });
    if (created.status !== 201) throw new Error(`sandbox cinema: ${created.status} ${created.text}`);
    cinemaId = created.body.cinema.RapID;
  }
  let roomId = (await one(pool, 'SELECT TOP 1 PhongID FROM dbo.PHONGCHIEU WHERE RapID = @c AND TenPhong = @r', { c: cinemaId, r: spec.room }))?.PhongID;
  if (!roomId) {
    const created = await call('POST', '/admin/rooms', { token: adminToken, body: { cinemaId, name: spec.room, type: '2D' } });
    if (created.status !== 201) throw new Error(`sandbox room: ${created.status} ${created.text}`);
    roomId = created.body.room.PhongID;
  }
  const have = new Set((await rows(pool, 'SELECT HangGhe + CAST(SoGhe AS VARCHAR(10)) AS k FROM dbo.GHE WHERE PhongID = @r', { r: roomId })).map((x) => x.k));
  for (const row of ['A', 'B', 'C', 'D']) {
    for (let number = 1; number <= spec.seats / 4; number += 1) {
      if (have.has(`${row}${number}`)) continue;
      const seat = await call('POST', '/admin/seats', { token: adminToken, body: { roomId, row, number, type: 'Thường' } });
      if (seat.status !== 201) throw new Error(`sandbox seat ${row}${number}: ${seat.status} ${seat.text}`);
    }
  }
  return { cinemaId, roomId };
}

/**
 * Setup helper: a brand-new far-future showtime created through the Admin API in the sandbox room.
 * Returns ids and the room's cinema. Never reuses an occupied slot.
 */
export async function createPrivateShowtime(
  call,
  pool,
  adminToken,
  { daysAhead = 30, basePrice = 90000, isolated = false } = {},
) {
  // `isolated` builds a fresh one-room cinema: screens that list "the nearest 200 showtimes of a cinema"
  // (Admin booking wizard) would otherwise never show a showtime appended after hundreds of sandbox ones.
  const spec = isolated
    ? { cinema: `E2E Isolated ${Date.now().toString(36)}`, room: 'E2E Isolated Hall', seats: 8 }
    : SANDBOX;
  const sandbox = await ensureSandbox(call, pool, adminToken, spec);
  const room = { PhongID: sandbox.roomId, LoaiPhong: '2D', RapID: sandbox.cinemaId };
  const movie = await one(
    pool,
    `SELECT TOP 1 PhimID FROM dbo.PHIM WHERE TrangThai = N'Đang chiếu'
        AND (NgayKetThuc IS NULL OR NgayKetThuc > DATEADD(DAY, @d, CAST(dbo.fn_BayGio() AS DATE))) ORDER BY PhimID`,
    { d: daysAhead + 60 },
  );
  if (!movie) throw new Error('no running movie with a long enough window');
  const lastEnd = await scalar(pool, 'SELECT MAX(ThoiGianKetThuc) FROM dbo.SUATCHIEU WHERE PhongID = @r', { r: room.PhongID });
  const baseline = Math.max(Date.now() + daysAhead * 86400000, lastEnd ? new Date(lastEnd).getTime() + 3600000 : 0);
  const start = new Date(baseline + slotCounter++ * 3 * 3600000);
  start.setUTCMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 2 * 3600000);
  const created = await call('POST', '/admin/showtimes', {
    token: adminToken,
    body: {
      movieId: movie.PhimID,
      roomId: room.PhongID,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      format: room.LoaiPhong,
      basePrice,
    },
  });
  if (created.status !== 201) throw new Error(`create showtime: ${created.status} ${created.text}`);
  return {
    showtimeId: created.body.showtime.SuatChieuID,
    roomId: room.PhongID,
    cinemaId: room.RapID,
    movieId: movie.PhimID,
    startsAt: start,
    endsAt: end,
  };
}

export async function loginStaff(call, role) {
  const response = await call('POST', '/auth/login', { body: { Email: ACCOUNTS[role], MatKhau: DEMO_PASSWORD } });
  if (response.status !== 200) throw new Error(`login ${role}: ${response.status}`);
  return response.body.token;
}
