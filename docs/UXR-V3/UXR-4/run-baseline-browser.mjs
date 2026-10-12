// Read-only before captures from an isolated copy of committed pre-UXR-4 source.
// Does not reset/checkout the user's working tree or write database data.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { credentials } from '../../../scripts/db/lib.mjs';
import { createServer } from '../../../frontend/node_modules/vite/dist/node/index.js';
const database = 'CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2';
Object.assign(process.env, credentials(), { DB_DATABASE: database, JWT_SECRET: crypto.randomBytes(48).toString('hex'), NODE_ENV: 'test' });
const { createApp } = await import('../../../backend/src/app.js');
const { getPool, closePool } = await import('../../../backend/src/db/pool.js');
const { issueToken } = await import('../../../backend/src/utils/jwt.js');
const directory = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const screenshots = path.join(directory, 'screenshots', 'before'); fs.mkdirSync(screenshots, { recursive: true });
const baselineRoot = path.resolve('.audit-output', `uxr4-baseline-${Date.now()}`);
const sourceFiles = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', '--', 'frontend', 'shared']).toString().trim().split(/\r?\n/).filter((file) => file.startsWith('frontend/src/') || file.startsWith('frontend/public/') || file.startsWith('shared/') || ['frontend/index.html', 'frontend/package.json', 'frontend/vite.config.js'].includes(file));
for (const file of sourceFiles) { const target = path.resolve(baselineRoot, file); assert.ok(target.startsWith(baselineRoot + path.sep)); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, execFileSync('git', ['show', `HEAD:${file}`])); }
fs.symlinkSync(path.resolve('frontend/node_modules'), path.join(baselineRoot, 'frontend/node_modules'), 'junction');
const evidence = { timestamp: new Date().toISOString(), status: 'RUNNING', source: execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(), sourceFiles: sourceFiles.length, databaseWrites: false, observations: [], runtimeErrors: [] };
let apiServer, vite, browser, socket, sequence = 0;
const pending = new Map(), delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function cdp(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error(`${method} timeout`)), 8000); pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params })); }); }
async function evaluate(expression) { const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; }
async function wait(expression) { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(100); } throw new Error(`Timeout: ${expression}`); }
try {
  const pool = await getPool(); evidence.identity = (await pool.request().query('SELECT DB_NAME() AS DatabaseName, DB_ID() AS DatabaseID')).recordset[0]; assert.equal(evidence.identity.DatabaseName, database); assert.equal(evidence.identity.DatabaseID, 9);
  apiServer = createApp().listen(0, '127.0.0.1'); await new Promise((resolve) => apiServer.once('listening', resolve));
  vite = await createServer({ root: path.join(baselineRoot, 'frontend'), configFile: path.join(baselineRoot, 'frontend/vite.config.js'), server: { host: '127.0.0.1', port: 0, proxy: { '/api': `http://127.0.0.1:${apiServer.address().port}` } } }); await vite.listen();
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`, profile = path.join(baselineRoot, 'chrome-profile');
  browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  for (let i = 0; i < 40 && !fs.existsSync(path.join(profile, 'DevToolsActivePort')); i++) await delay(100);
  const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0], targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
  socket = new WebSocket(targets.find((r) => r.type === 'page').webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data), callback = pending.get(message.id); if (callback) { clearTimeout(callback.timer); pending.delete(message.id); message.error ? callback.reject(new Error(message.error.message)) : callback.resolve(message.result); } else if (message.method === 'Runtime.exceptionThrown') evidence.runtimeErrors.push(message.params.exceptionDetails.text); });
  await cdp('Page.enable'); await cdp('Runtime.enable');
  for (const [portal, who] of [['admin', 1], ['manager', 2]]) for (const module of ['showtimes', 'pricing', 'bookings']) {
    const pathname = portal === 'admin' && module !== 'bookings' ? `/admin/operations/${module}` : `/${portal}/${module}`;
    await evaluate('window.__baselineNavigation=true');
    const hook = await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `sessionStorage.setItem('cinema_access_token',${JSON.stringify(issueToken(who).token)});` });
    await cdp('Page.navigate', { url: `${origin}${pathname}` });
    await wait(`!window.__baselineNavigation&&location.pathname===${JSON.stringify(pathname)}&&Boolean(document.querySelector('h1'))&&!document.body.textContent.includes('Đang tải')`);
    await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: hook.identifier }); await delay(200);
    for (const width of [390, 768, 1280, 1440, 1920]) {
      await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false }); await delay(100); await evaluate('scrollTo(0,0)');
      const size = await evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth})'), capture = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      fs.writeFileSync(path.join(screenshots, `${portal}-${module}-${width}.png`), Buffer.from(capture.data, 'base64')); evidence.observations.push({ portal, module, ...size, overflow: size.scrollWidth > size.width, status: 'OBSERVED' });
    }
  }
  evidence.status = 'CAPTURED';
} catch (error) { evidence.status = 'FAIL'; evidence.error = error.message; process.exitCode = 1; }
finally { if (socket) { try { await cdp('Browser.close'); } catch {} socket.close(); } browser?.kill(); await vite?.close(); if (apiServer) await new Promise((resolve) => apiServer.close(resolve)); await closePool(); fs.writeFileSync(path.join(directory, 'browser-baseline.json'), JSON.stringify(evidence, null, 2)); console.log(JSON.stringify({ status: evidence.status, observations: evidence.observations.length, runtimeErrors: evidence.runtimeErrors.length, error: evidence.error })); }
