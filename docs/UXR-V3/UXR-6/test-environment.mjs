import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer as createHttpServer } from 'node:http';
import { credentials } from '../../../scripts/db/lib.mjs';
import { createServer } from '../../../frontend/node_modules/vite/dist/node/index.js';

export const database = 'CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2';
export const directory = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export async function createEnvironment({ browser: useBrowser = false, baseline = false, phase = '6A' } = {}) {
  Object.assign(process.env, credentials(), { DB_DATABASE: database, JWT_SECRET: crypto.randomBytes(48).toString('hex'), JWT_EXPIRES_IN: '30m', NODE_ENV: 'test' });
  const { getPool, closePool } = await import('../../../backend/src/db/pool.js');
  const { DbTypes: sql } = await import('../../../backend/src/db/procedureClient.js');
  const { createApp } = await import('../../../backend/src/app.js');
  const { issueToken } = await import('../../../backend/src/utils/jwt.js');
  const pool = await getPool(), evidence = { timestamp: new Date().toISOString(), phase, source: baseline ? 'working-tree snapshot before UXR-6' : 'current UXR-6 source', status: 'RUNNING', checks: [], requests: [], runtimeErrors: [], consoleErrors: [], cleanup: [] };
  evidence.identity = (await pool.request().query('SELECT DB_NAME() AS DatabaseName,DB_ID() AS DatabaseID')).recordset[0];
  assert.deepEqual(evidence.identity, { DatabaseName: database, DatabaseID: 9 });
  evidence.counts = (await pool.request().query('SELECT (SELECT COUNT(*) FROM dbo.NGUOIDUNG) AS Users,(SELECT COUNT(*) FROM dbo.PHANCONG_RAP) AS Assignments,(SELECT COUNT(*) FROM dbo.PHIM) AS Movies,(SELECT COUNT(*) FROM dbo.DIENVIEN) AS Actors,(SELECT COUNT(*) FROM dbo.THELOAI) AS Genres,(SELECT COUNT(*) FROM dbo.SANPHAM) AS Products,(SELECT COUNT(*) FROM dbo.KHUYENMAI) AS Promotions,(SELECT COUNT(*) FROM dbo.KHIEUNAI) AS Complaints')).recordset[0];
  const readDelays = new Map(), app = createApp();
  const delayNextRead = (pathname, milliseconds) => { assert.ok(pathname.startsWith('/api/') && milliseconds > 0 && milliseconds <= 3000); readDelays.set(pathname, milliseconds); };
  const server = createHttpServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://test.local').pathname;
    if (req.method === 'GET' && readDelays.has(pathname)) { const milliseconds = readDelays.get(pathname); readDelays.delete(pathname); evidence.delayedReads ??= []; evidence.delayedReads.push({ pathname, milliseconds }); await delay(milliseconds); }
    app(req, res);
  }).listen(0, '127.0.0.1'); await new Promise((resolve) => server.once('listening', resolve));
  const apiOrigin = `http://127.0.0.1:${server.address().port}`, tokens = new Map(), owned = [];
  const token = (actor) => { if (!tokens.has(actor)) tokens.set(actor, issueToken(actor).token); return tokens.get(actor); };
  const pass = (scenario, data = {}) => evidence.checks.push({ scenario, ...data, status: 'PASS' });
  async function api(actor, method, endpoint, body, expected = 200) {
    // Actor 1 resource shorthand maps to Admin; explicit portal/public actor paths remain explicit.
    const resolved = actor === 1 && !/^\/(admin|manager|support|orders|auth)(\/|$)/.test(endpoint) ? `/admin${endpoint}` : endpoint;
    const response = await fetch(`${apiOrigin}/api${resolved}`, { method, headers: { Authorization: `Bearer ${token(actor)}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
    const data = await response.json(); evidence.requests.push({ actor, method, endpoint: new URL(resolved, apiOrigin).pathname, status: response.status, code: data.error?.code, expected });
    assert.equal(response.status, expected, `${method} ${endpoint}: ${data.error?.code ?? response.status}`); return data;
  }
  let vite, chrome, socket, sequence = 0, origin;
  const pending = new Map();
  const dialogEvents = [], dialogWaiters = []; evidence.dialogs = [];
  const nextDialog = () => dialogEvents.length ? Promise.resolve(dialogEvents.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Native dialog event timeout')), 8000);
    dialogWaiters.push((event) => { clearTimeout(timer); resolve(event); });
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence, timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timeout`)); }, 8000); pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params })); });
  async function evaluate(expression) { const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text); return result.result.value; }
  async function wait(expression, label = expression) { const until = Date.now() + 15000; while (Date.now() < until) { if (await evaluate(expression)) return; await delay(80); } throw new Error(`Timeout: ${label}`); }
  const button = (label) => `[...([...document.querySelectorAll('dialog[open]')].at(-1)??document).querySelectorAll('button')].filter(e=>e.getClientRects().length>0).find(e=>e.textContent.trim()===${JSON.stringify(label)})`;
  async function click(label, double = false) { await wait(`Boolean(${button(label)}&&!${button(label)}.disabled)`, `enabled ${label}`); await evaluate(`{const e=${button(label)};e.click();${double ? 'e.click();' : ''}}`); await delay(60); }
  const fieldElement = (label, root = 'document') => `(()=>{const l=[...((${root})?.querySelectorAll('label')??[])].filter(e=>e.getClientRects().length>0).find(e=>e.textContent.trim().startsWith(${JSON.stringify(label)}));return l?.htmlFor?document.getElementById(l.htmlFor):l?.querySelector('input,select,textarea');})()`;
  async function field(label, value, type = 'input', root = 'document') { const expression = fieldElement(label, root); await wait(`Boolean(${expression}&&!${expression}.disabled)`, `field ${label}`); const prototype = type === 'select' ? 'HTMLSelectElement' : type === 'textarea' ? 'HTMLTextAreaElement' : 'HTMLInputElement'; await evaluate(`{const e=${expression};Object.getOwnPropertyDescriptor(${prototype}.prototype,'value').set.call(e,${JSON.stringify(String(value))});e.dispatchEvent(new Event('${type === 'select' ? 'change' : 'input'}',{bubbles:true}));}`); await delay(50); }
  async function key(value, modifiers = 0) { const code = { Enter: 13, Escape: 27, Tab: 9 }[value] ?? 0; await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: value, code: value, modifiers, windowsVirtualKeyCode: code, ...(value === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}) }); await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: value, code: value, modifiers, windowsVirtualKeyCode: code }); }
  async function navigate(actor, pathname, query = '', ready = "Boolean(document.querySelector('table'))||document.body.textContent.includes('Chưa có dữ liệu phù hợp.')") {
    await evaluate('window.__uxr5Navigation=true'); const hook = await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `${actor ? `sessionStorage.setItem('cinema_access_token',${JSON.stringify(token(actor))});` : `sessionStorage.removeItem('cinema_access_token');`}` });
    await cdp('Page.navigate', { url: `${origin}${pathname}${query}` }); await wait(`!window.__uxr5Navigation&&location.pathname===${JSON.stringify(pathname)}&&Boolean(document.querySelector('h1'))`, 'fresh page'); await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: hook.identifier }); await wait(ready, 'screen data'); await delay(100);
  }
  async function reload(ready = "Boolean(document.querySelector('table'))") { await evaluate('window.__uxr5Navigation=true'); await cdp('Page.reload'); await wait(`!window.__uxr5Navigation&&${ready}`, 'fresh reload'); }
  async function resize(width, verify = true) { await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false }); await delay(100); const size = await evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth})'); if (verify) assert.ok(size.scrollWidth <= size.width, `document overflow ${JSON.stringify(size)}`); return size; }
  async function screenshot(name) { const target = path.join(directory, 'screenshots', baseline ? 'before' : 'after'); fs.mkdirSync(target, { recursive: true }); const capture = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); fs.writeFileSync(path.join(target, `${name}.png`), Buffer.from(capture.data, 'base64')); }
  async function modalKeyboard() { await wait("Boolean(document.querySelector('dialog[open]'))"); const count = await evaluate("document.querySelectorAll('dialog[open]').length"); assert.ok(await evaluate("[...document.querySelectorAll('dialog[open]')].at(-1).contains(document.activeElement)")); for (let i = 0; i < 5; i++) { await key('Tab'); assert.ok(await evaluate("document.activeElement===document.body||[...document.querySelectorAll('dialog[open]')].at(-1).contains(document.activeElement)")); } await key('Tab', 8); await key('Escape'); await wait(`document.querySelectorAll('dialog[open]').length===${count - 1}`); }
  if (useBrowser) {
    const root = baseline ? path.join(JSON.parse(fs.readFileSync(path.join(directory, 'source-baseline.json'), 'utf8')).target, 'frontend') : path.resolve('frontend');
    vite = await createServer({ root, configFile: path.join(root, 'vite.config.js'), server: { host: '127.0.0.1', port: 0, proxy: { '/api': apiOrigin } } }); await vite.listen(); origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
    const profile = path.resolve('.audit-output', `uxr6-browser-${phase}-${Date.now()}`); chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
    for (let i = 0; i < 50 && !fs.existsSync(path.join(profile, 'DevToolsActivePort')); i++) await delay(100);
    const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0], targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()); socket = new WebSocket(targets.find((r) => r.type === 'page').webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data), entry = pending.get(message.id); if (entry) { clearTimeout(entry.timer); pending.delete(message.id); message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result); } else if (message.method === 'Runtime.exceptionThrown') evidence.runtimeErrors.push(message.params.exceptionDetails.text); else if (message.method === 'Page.javascriptDialogOpening') { const event = { type: message.params.type }; evidence.dialogs.push(event); const waiter = dialogWaiters.shift(); if (waiter) waiter(event); else dialogEvents.push(event); } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') evidence.consoleErrors.push(message.params.args.map((arg) => String(arg.value ?? arg.description ?? '').slice(0, 240)).join(' ')); else if (message.method === 'Network.responseReceived') { const r = message.params.response; if (new URL(r.url).pathname.startsWith('/api/')) evidence.requests.push({ path: new URL(r.url).pathname, status: r.status }); } else if (message.method === 'Network.requestWillBeSent') { const r = message.params.request; if (r.method !== 'GET' && new URL(r.url).pathname.startsWith('/api/')) evidence.requests.push({ path: new URL(r.url).pathname, method: r.method }); } });
    await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  }
  async function close(filename, error) {
    if (!error && (evidence.runtimeErrors.length || evidence.consoleErrors.length)) error = new Error('Browser runtime/console error detected.');
    evidence.status = error ? 'FAIL' : baseline ? 'CAPTURED' : 'PASS'; if (error) { evidence.error = error.message; try { if (socket) await screenshot(`${phase}-failure`); } catch {} }
    if (socket) { try { await cdp('Browser.close'); } catch {} socket.close(); } chrome?.kill(); await vite?.close(); await new Promise((resolve) => server.close(resolve));
    // Fixed table/column allowlist, exact IDs and owner values. Offline disposable fixture cleanup only.
    const schemas = { assignment: ['PHANCONG_RAP', 'PhanCongID', 'NguoiDungID'], user: ['NGUOIDUNG', 'NguoiDungID', 'Email'], movie: ['PHIM', 'PhimID', 'TenPhim'], actor: ['DIENVIEN', 'DienVienID', 'HoTen'], genre: ['THELOAI', 'TheLoaiID', 'TenTheLoai'], product: ['SANPHAM', 'SanPhamID', 'TenSanPham'], promotion: ['KHUYENMAI', 'KhuyenMaiID', 'MaCode'] };
    for (const fixture of owned.slice().reverse()) {
      if (fixture.kind === 'complaint') {
        try { const remaining = (await pool.request().input('Id', sql.Int, fixture.id).input('Title', sql.NVarChar(200), fixture.owner).input('Sender', sql.Int, fixture.sender).query('IF EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID=@Id AND TieuDe=@Title AND NguoiDungID=@Sender) BEGIN DELETE dbo.XULY_KHIEUNAI WHERE KhieuNaiID=@Id; DELETE dbo.KHIEUNAI WHERE KhieuNaiID=@Id AND TieuDe=@Title AND NguoiDungID=@Sender; END; SELECT COUNT(*) AS Remaining FROM dbo.KHIEUNAI WHERE KhieuNaiID=@Id;')).recordset[0].Remaining; assert.equal(remaining, 0); evidence.cleanup.push({ kind: 'complaint', id: fixture.id, remaining, status: 'PASS' }); } catch (failure) { evidence.status = 'FAIL'; evidence.cleanup.push({ kind: 'complaint', id: fixture.id, error: failure.message, status: 'FAIL' }); } continue;
      }
      if (fixture.kind === 'order') {
        try { const remaining = (await pool.request().input('Id', sql.Int, fixture.id).input('Owner', sql.Int, fixture.owner).query('IF EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID=@Id AND NguoiDungID=@Owner) BEGIN DELETE dbo.THANHTOAN WHERE DonDatVeID=@Id; DELETE dbo.CHITIETVE WHERE DonDatVeID=@Id; DELETE dbo.CHITIETDOAN WHERE DonDatVeID=@Id; DELETE dbo.DONDATVE WHERE DonDatVeID=@Id AND NguoiDungID=@Owner; END; SELECT COUNT(*) AS Remaining FROM dbo.DONDATVE WHERE DonDatVeID=@Id;')).recordset[0].Remaining; assert.equal(remaining, 0); evidence.cleanup.push({ kind: 'order', id: fixture.id, remaining, status: 'PASS' }); } catch (failure) { evidence.status = 'FAIL'; evidence.cleanup.push({ kind: 'order', id: fixture.id, error: failure.message, status: 'FAIL' }); } continue;
      }
      try { const schema = schemas[fixture.kind]; if (!schema) throw new Error('Unknown cleanup type'); const [table, column, owner] = schema; const relations = fixture.kind === 'user' ? 'IF EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID=@Id AND Email=@Owner) BEGIN DELETE dbo.HOSOKHACHHANG WHERE NguoiDungID=@Id; END;' : fixture.kind === 'movie' ? 'IF EXISTS (SELECT 1 FROM dbo.PHIM WHERE PhimID=@Id AND TenPhim=@Owner) BEGIN DELETE dbo.PHIM_DIENVIEN WHERE PhimID=@Id; DELETE dbo.PHIM_THELOAI WHERE PhimID=@Id; END;' : ''; const remaining = (await pool.request().input('Id', sql.Int, fixture.id).input('Owner', fixture.kind === 'assignment' ? sql.Int : fixture.kind === 'user' ? sql.VarChar(150) : sql.NVarChar(255), fixture.owner).query(`${relations} DELETE dbo.${table} WHERE ${column}=@Id AND ${owner}=@Owner; SELECT COUNT(*) AS Remaining FROM dbo.${table} WHERE ${column}=@Id;`)).recordset[0].Remaining; assert.equal(remaining, 0); evidence.cleanup.push({ kind: fixture.kind, id: fixture.id, remaining, status: 'PASS' }); }
      catch (failure) { evidence.status = 'FAIL'; evidence.cleanup.push({ kind: fixture.kind, id: fixture.id, error: failure.message, status: 'FAIL' }); }
    }
    await closePool(); fs.writeFileSync(path.join(directory, filename), JSON.stringify(evidence, null, 2)); console.log(JSON.stringify({ status: evidence.status, checks: evidence.checks.length, records: evidence.requests.length, error: evidence.error, cleanup: evidence.cleanup })); if (evidence.status === 'FAIL') process.exitCode = 1;
  }
  return { api, pass, pool, sql, evidence, owned, navigate, reload, resize, screenshot, field, fieldElement, button, click, key, evaluate, wait, modalKeyboard, close, token, cdp, nextDialog, delayNextRead };
}
