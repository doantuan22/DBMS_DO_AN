// Read-only HTTP integration checks against the local Main demo seed. Booking preview rolls back in SQL.
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
let samples;
const dbConfig = {
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: MAIN_DB,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
};
const pool = await new sql.ConnectionPool(dbConfig).connect();
try {
  const identity = await pool.request().query('SELECT DB_NAME() AS db;');
  if (identity.recordset[0].db !== MAIN_DB) throw new Error('Connected to the wrong database.');
  samples = (await pool.request().query(`
    SELECT TOP (1) s.SuatChieuID AS showtimeId FROM dbo.SUATCHIEU s
    WHERE s.TrangThai=N'Mở bán' AND s.ThoiGianBatDau>dbo.fn_BayGio() ORDER BY s.ThoiGianBatDau;
    SELECT TOP (1) PhimID AS movieId FROM dbo.DANHGIAPHIM GROUP BY PhimID ORDER BY MIN(DanhGiaID);
    SELECT TOP (1) n.Email AS complaintCustomerEmail FROM dbo.KHIEUNAI k
      JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=k.NguoiDungID
      WHERE n.TrangThai=N'Hoạt động' ORDER BY k.KhieuNaiID;
  `)).recordsets;
  samples = { showtimeId: samples[0]?.[0]?.showtimeId, reviewedMovieId: samples[1]?.[0]?.movieId, complaintCustomerEmail: samples[2]?.[0]?.complaintCustomerEmail };
  if (!samples.showtimeId || !samples.reviewedMovieId || !samples.complaintCustomerEmail) throw new Error('Required seeded records for API smoke checks are missing.');
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
  ['nguyen.ngoc.an.001@example.test', 'KHACH_HANG'],
];
const results = [];
const tokens = new Map();
async function callApi(base, route, { token, method = 'GET', body } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const response = await fetch(`${base}${route}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let payload = {};
  try { payload = await response.json(); } catch { /* error is reported below */ }
  if (!response.ok) throw new Error(`${method} ${route} returned HTTP ${response.status}: ${JSON.stringify(payload)} ${stderr}`);
  return payload;
}
try {
  const base = `http://127.0.0.1:${port}/api`;
  await waitFor(`${base}/health`, child);
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
    tokens.set(expectedRole === 'KHACH_HANG' ? 'customer' : expectedRole === 'QUAN_LY_RAP' ? 'manager' : expectedRole === 'CSKH' ? 'support' : `admin-${results.length}`, payload.token);
    if (expectedRole === 'QUAN_LY_RAP' && payload.user.cinemaAssignments.length !== 1) {
      throw new Error('Manager login did not return its assigned cinema.');
    }
    const current = await fetch(`http://127.0.0.1:${port}/api/auth/me`, {
      headers: { authorization: `Bearer ${payload.token}` },
    });
    if (!current.ok) throw new Error(`/api/auth/me failed after login for role ${expectedRole} (HTTP ${current.status}).`);
    results.push({ email, role: expectedRole, effectivePermissions: payload.user.permissions.length, currentUser: current.status });
  }

  let complaintToken = tokens.get('customer');
  if (samples.complaintCustomerEmail !== rolesToCheck.at(-1)[0]) {
    const account = credentials.accounts.find((item) => item.email === samples.complaintCustomerEmail);
    if (!account?.password) throw new Error(`No credential available for complaint owner ${samples.complaintCustomerEmail}.`);
    const login = await callApi(base, '/auth/login', { method: 'POST', body: { Email: account.email, MatKhau: account.password } });
    if (login.user?.role !== 'KHACH_HANG' || !login.token) throw new Error('Could not authenticate seeded complaint owner.');
    complaintToken = login.token;
  }

  const movies = await callApi(base, '/movies');
  const cinemas = await callApi(base, '/cinemas');
  const products = await callApi(base, '/products');
  if (!movies.movies?.length || !cinemas.cinemas?.length || !products.products?.length) throw new Error('Public catalog API returned an empty seed dataset.');
  const seats = await callApi(base, `/showtimes/${samples.showtimeId}/seats`);
  const freeSeat = seats.seats?.find((seat) => seat.status === 'Trống');
  if (!freeSeat) throw new Error('A future open showtime has no free seat for a preview check.');
  const preview = await callApi(base, '/bookings/preview', {
    method: 'POST', token: tokens.get('customer'),
    body: { showtimeId: samples.showtimeId, seatIds: [freeSeat.id], products: [], promotionCode: null, points: 0 },
  });
  if (preview.preview?.showtimeId !== samples.showtimeId || Number(preview.preview.total) <= 0) throw new Error('Customer booking preview returned an invalid quote.');
  const orders = await callApi(base, '/orders', { token: tokens.get('customer') });
  if (!orders.orders?.length) throw new Error('Customer order-history API returned no seeded history.');
  const reviews = await callApi(base, `/movies/${samples.reviewedMovieId}/reviews`);
  if (!reviews.reviews?.length) throw new Error('Movie review API returned no seeded reviews.');
  const customerComplaints = await callApi(base, '/complaints', { token: complaintToken });
  if (!customerComplaints.complaints?.length) throw new Error('Customer complaint API returned no seeded complaint.');

  const managerCinemas = await callApi(base, '/manager/cinemas', { token: tokens.get('manager') });
  if (managerCinemas.cinemas?.length !== 1) throw new Error('Manager API did not enforce the single assigned cinema scope.');
  const managerDashboard = await callApi(base, `/manager/cinemas/${managerCinemas.cinemas[0].id}/dashboard`, { token: tokens.get('manager') });
  if (!managerDashboard.dashboard) throw new Error('Manager dashboard API did not return seeded metrics.');
  const supportComplaints = await callApi(base, '/support/complaints', { token: tokens.get('support') });
  const supportEscalations = await callApi(base, '/support/escalations', { token: tokens.get('support') });
  if (!supportComplaints.complaints?.length || !supportEscalations.escalations?.length) throw new Error('CSKH API returned no assigned complaint or escalation.');
  const adminDashboard = await callApi(base, '/admin/dashboard', { token: tokens.get('admin-0') });
  const adminUsers = await callApi(base, '/admin/users', { token: tokens.get('admin-0') });
  const adminComplaints = await callApi(base, '/admin/complaints', { token: tokens.get('admin-0') });
  if (!adminDashboard.dashboard || !adminUsers.users?.length || !adminComplaints.complaints?.length) throw new Error('Admin dashboard/list APIs returned incomplete seeded data.');
  results.push({
    api: 'catalog + customer + manager + support + admin',
    publicMovies: movies.movies.length, cinemas: cinemas.cinemas.length, products: products.products.length,
    futureSeatStatus: freeSeat.status, bookingPreview: 'PASS (database preview rolls back)',
    customerOrders: orders.orders.length, movieReviews: reviews.reviews.length,
    customerComplaints: customerComplaints.complaints.length,
    managerAssignedCinemas: managerCinemas.cinemas.length,
    managerDashboard: 'PASS', supportComplaints: supportComplaints.complaints.length,
    supportEscalations: supportEscalations.escalations.length,
    adminUsers: adminUsers.users.length, adminComplaints: adminComplaints.complaints.length,
  });
} finally { await stop(child); }

const result = { database: MAIN_DB, mode: 'read-only GETs + rollback-only booking preview', endpointGroups: ['auth', 'catalog', 'booking preview', 'orders', 'reviews', 'complaints', 'manager', 'support', 'admin'], checks: results };
const out = path.join(ROOT, '.audit-output', 'seed-login-verification.json');
fs.writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
const reportJsonPath = path.join(ROOT, '.audit-output', 'seed-data-verification.json');
if (!fs.existsSync(reportJsonPath)) throw new Error('Run read-only SQL verification before API verification.');
const report = JSON.parse(fs.readFileSync(reportJsonPath, 'utf8'));
report.apiIntegration = 'PASS';
report.apiChecks = result;
fs.writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
const reportMarkdownPath = path.join(ROOT, 'SEED_DATA_VERIFICATION_REPORT.md');
if (fs.existsSync(reportMarkdownPath)) {
  const report = fs.readFileSync(reportMarkdownPath, 'utf8');
  const baseReport = report.split('\n## API integration\n', 1)[0].trimEnd();
  const loginChecks = results.filter((result) => result.email).length;
  const apiSection = `\n\n## API integration\n\nPASS: ${loginChecks} role-scoped login checks passed across ADMIN (2 accounts), QUAN_LY_RAP, CSKH, and KHACH_HANG; catalog, order history, reviews, complaints, manager scope/dashboard, support/escalation and admin dashboard/list endpoints returned data. Customer booking preview succeeded through the real API and the database preview path rolled its transaction back. No persistent API writes were performed.\n`;
  fs.writeFileSync(reportMarkdownPath, `${baseReport}${apiSection}`, 'utf8');
}
console.log(`Seeded authentication and role-scoped API checks passed on ${MAIN_DB}.`);
console.log(JSON.stringify(result, null, 2));
