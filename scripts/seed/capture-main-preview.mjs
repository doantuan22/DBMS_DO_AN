// Read-only screenshots of the real public frontend against CinemaBookingDB.
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
const { chromium } = createRequire(path.join(ROOT, 'package.json'))('playwright');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
if (env.DB_DATABASE !== MAIN_DB) throw new Error(`Refusing preview: backend/.env must target ${MAIN_DB}.`);
if (String(env.DB_USER).toLowerCase() === 'sa') {
  console.log('Preview uses the configured Main API in read-only GET mode; DB writes are not part of this capture.');
}
const probe = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: MAIN_DB,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
}).connect();
try {
  const result = await probe.request().query('SELECT DB_NAME() AS db;');
  if (result.recordset[0].db !== MAIN_DB) throw new Error('Connected to the wrong database.');
} finally { await probe.close(); }

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address(); server.close(() => resolve(port));
    });
  });
}
function waitForChild(child, label) {
  return new Promise((resolve, reject) => {
    if (child.exitCode !== null) return reject(new Error(`${label} exited early with ${child.exitCode}.`));
    child.once('error', reject);
    child.once('exit', (code) => reject(new Error(`${label} exited early with ${code}.`)));
    resolve();
  });
}
async function waitHttp(url, child, label) {
  const until = Date.now() + 30000;
  let reason = 'no response';
  while (Date.now() < until) {
    if (child.exitCode !== null) throw new Error(`${label} exited early with ${child.exitCode}.`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
      reason = `HTTP ${response.status}`;
    } catch (error) { reason = error.message; }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${label}: ${reason}.`);
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

const apiPort = await freePort();
const webPort = await freePort();
const apiBase = `http://127.0.0.1:${apiPort}/api`;
const webOrigin = `http://127.0.0.1:${webPort}`;
const backendEnv = {
  PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP,
  NODE_ENV: 'test', PORT: String(apiPort), FRONTEND_URL: webOrigin,
  DB_SERVER: env.DB_SERVER, DB_PORT: String(env.DB_PORT ?? 1433), DB_DATABASE: MAIN_DB,
  DB_USER: env.DB_USER, DB_PASSWORD: env.DB_PASSWORD, DB_ENCRYPT: String(env.DB_ENCRYPT ?? 'false'),
  DB_TRUST_SERVER_CERTIFICATE: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true'),
  JWT_SECRET: env.JWT_SECRET, JWT_EXPIRES_IN: env.JWT_EXPIRES_IN ?? '1h',
  AUTH_RATE_LIMIT_LOGIN_MAX: '50',
};
const backend = spawn(process.execPath, ['src/server.js'], {
  cwd: path.join(ROOT, 'backend'), env: backendEnv,
  stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true,
});
const frontend = spawn(process.execPath, [path.join(ROOT, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js'), '--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], {
  cwd: path.join(ROOT, 'frontend'),
  env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, VITE_API_BASE_URL: apiBase },
  stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true,
});
let backendStderr = '';
let frontendStderr = '';
backend.stderr.on('data', (chunk) => { backendStderr = (backendStderr + chunk.toString()).slice(-3000); });
frontend.stderr.on('data', (chunk) => { frontendStderr = (frontendStderr + chunk.toString()).slice(-3000); });
let browser;
try {
  await Promise.all([waitHttp(`${apiBase}/health`, backend, 'Main API'), waitHttp(webOrigin, frontend, 'Vite frontend')]);
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' });
  const page = await context.newPage();
  const apiErrors = [];
  const runtimeErrors = [];
  page.on('response', (response) => {
    if (response.url().startsWith(apiBase) && response.status() >= 500) apiErrors.push(`${response.status()} ${response.url()}`);
  });
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  const outputDir = path.join(ROOT, '.audit-output', 'seed-preview');
  fs.mkdirSync(outputDir, { recursive: true });

  await page.goto(`${webOrigin}/movies`, { waitUntil: 'networkidle' });
  await page.getByText('Án Mạng Xém Hoàn Hảo', { exact: false }).first().waitFor({ state: 'visible', timeout: 15000 });
  await page.screenshot({ path: path.join(outputDir, 'cinemastar-main-movies.png'), fullPage: true });

  await page.goto(`${webOrigin}/cinemas`, { waitUntil: 'networkidle' });
  await page.getByText('CinemaStar Sài Gòn', { exact: false }).first().waitFor({ state: 'visible', timeout: 15000 });
  await page.screenshot({ path: path.join(outputDir, 'cinemastar-main-cinemas.png'), fullPage: true });

  await page.goto(`${webOrigin}/movies`, { waitUntil: 'networkidle' });
  await page.getByText('Án Mạng Xém Hoàn Hảo', { exact: false }).first().click();
  await page.getByText('124', { exact: false }).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(750);
  await page.screenshot({ path: path.join(outputDir, 'cinemastar-main-movie-detail.png'), fullPage: true });
  await context.close();
  if (apiErrors.length || runtimeErrors.length) throw new Error(`UI errors: API=${JSON.stringify(apiErrors)} runtime=${JSON.stringify(runtimeErrors)}.`);
} catch (error) {
  throw new Error(`${error.message}${backendStderr ? ` Backend: ${backendStderr}` : ''}${frontendStderr ? ` Frontend: ${frontendStderr}` : ''}`);
} finally {
  if (browser) await browser.close();
  await Promise.all([stop(frontend), stop(backend)]);
}
console.log('Captured three public frontend screenshots against CinemaBookingDB; only read-only GET requests were used.');
