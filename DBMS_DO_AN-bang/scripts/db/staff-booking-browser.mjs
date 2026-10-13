// Real Edge + Vite + Express + SQL; disposable target only, no browser dependency.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { credentials, root, write } from './lib.mjs';
import { preflight, validateTestName } from './test-target.mjs';
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js';

const database = validateTestName(process.argv.find((arg) => arg.startsWith('--database='))?.slice(11));
assert.ok(preflight(database).target, 'Disposable built/seeded test DB required');
const httpEvidence = JSON.parse(fs.readFileSync(path.join(root, '.audit-output', 'staff-booking-http-results.json'), 'utf8'));
assert.equal(httpEvidence.database, database); assert.equal(httpEvidence.status, 'PASS', 'Run staff-booking-smoke first');
const paidOrderId = httpEvidence.createdOrders.at(-1), foreignOrderId = httpEvidence.createdOrders[2];
Object.assign(process.env, credentials(), { DB_DATABASE: database });
const { createApp } = await import('../../backend/src/app.js');
const { getPool } = await import('../../backend/src/db/pool.js');
const apiServer = createApp().listen(0, '127.0.0.1');
await new Promise((resolve) => apiServer.once('listening', resolve));
const apiBase = `http://127.0.0.1:${apiServer.address().port}`;
const vite = await createServer({ root: path.join(root, 'frontend'), server: { host: '127.0.0.1', port: 0, proxy: { '/api': apiBase } } });
await vite.listen();
const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
const profile = path.join(root, '.audit-output', `staff-booking-edge-${Date.now()}`);
const evidence = path.join(root, '.audit-output', 'staff-booking-browser');
fs.mkdirSync(profile, { recursive: true }); fs.mkdirSync(evidence, { recursive: true });
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const checks = [], errors = [], requests = [], created = [];
let ws, nextId = 0;
const pending = new Map();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function poll(fn, message, timeout = 15000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) { if (await fn()) return; await delay(100); }
  throw new Error(`Timeout: ${message}`);
}
function cdp(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
    pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ': ' + result.exceptionDetails.exception?.description);
  return result.result.value;
}
const buttonExpression = (name) => `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(name)})`;
async function click(name, double = false) {
  await poll(() => evaluate(`Boolean(${buttonExpression(name)} && !${buttonExpression(name)}.disabled)`), `enabled ${name}`);
  await evaluate(`{ const b = ${buttonExpression(name)}; b.click(); ${double ? 'b.click();' : ''} }`);
}
const fieldExpression = (label) => `document.getElementById([...document.querySelectorAll('label')].find(l => l.textContent.startsWith(${JSON.stringify(label)}))?.htmlFor)`;
async function field(label, value, type = 'input') {
  await poll(() => evaluate(`Boolean(${fieldExpression(label)} && !${fieldExpression(label)}.disabled)`), `field ${label}`);
  await evaluate(`{ const e = ${fieldExpression(label)}; Object.getOwnPropertyDescriptor(${type === 'select' ? 'HTMLSelectElement' : 'HTMLInputElement'}.prototype, 'value').set.call(e, ${JSON.stringify(String(value))}); e.dispatchEvent(new Event('${type === 'select' ? 'change' : 'input'}', { bubbles:true })); }`);
}
async function navigate(portal, token, query = '') {
  const hook = await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `sessionStorage.setItem('cinema_access_token', ${JSON.stringify(token)})` });
  await cdp('Page.navigate', { url: `${origin}/${portal}/bookings${query}` });
  await poll(() => evaluate("Boolean(document.querySelector('.staff-bookings'))"), `${portal} loaded`);
  await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: hook.identifier });
  await poll(() => evaluate("Boolean(document.querySelector('[aria-label=\"Phân trang đơn đặt vé\"]'))"), `${portal} list`);
}
function pass(scenario, details = {}) { checks.push({ scenario, status: 'PASS', ...details }); }
async function screenshot(name) {
  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(evidence, `${name}.png`), Buffer.from(shot.data, 'base64'));
}
async function escapeDialog() {
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await poll(() => evaluate("!document.querySelector('dialog[open]')"), 'Escape closes dialog');
}
try {
  await poll(() => fs.existsSync(path.join(profile, 'DevToolsActivePort')), 'Edge DevTools');
  const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0];
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws = new WebSocket(pages.find((p) => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) { const item = pending.get(message.id); if (item) { clearTimeout(item.timer); pending.delete(message.id); message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result); } }
    else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    else if (message.method === 'Network.requestWillBeSent') { const { method, url } = message.params.request; if (url.includes('/api/')) requests.push({ method, pathname: new URL(url).pathname }); }
  });
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  for (const [portal, email] of [['admin', 'admin@cinemadb.vn'], ['manager', 'manager.q1@cinemadb.vn']]) {
    const login = await (await fetch(apiBase + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ Email: email, MatKhau: '123456' }) })).json();
    assert.ok(login.token); await navigate(portal, login.token);
    assert.ok(await evaluate("Boolean(document.querySelector('.staff-shell__sidebar a[aria-current=\"page\"]'))"));
    pass(`${portal}: real login, route, active booking menu and list`);
    await field('Tìm đơn / vé', 'NO_MATCH_STAFF_BOOKING'); await click('Áp dụng lọc');
    await poll(() => evaluate("document.body.textContent.includes('Trang 1 · 0 đơn')"), 'empty filter result');
    pass(`${portal}: search empty state`);
    await field('Tìm đơn / vé', ''); await click('Áp dụng lọc');
    await click('Tạo đơn đặt vé'); await field('Tìm Customer', 'khachhang3'); await click('Tìm khách hàng');
    await field('Khách hàng có sẵn', 7, 'select');
    const cinema = await evaluate(`${fieldExpression('Rạp đặt vé')}.options[1].value`);
    await field('Rạp đặt vé', cinema, 'select');
    await poll(() => evaluate(`Boolean(${fieldExpression('Suất chiếu / phim / phòng')}?.options.length > 1 && !${fieldExpression('Suất chiếu / phim / phòng')}.disabled)`), 'show options');
    const show = await evaluate(`${fieldExpression('Suất chiếu / phim / phòng')}.options[1].value`);
    await field('Suất chiếu / phim / phòng', show, 'select');
    await poll(() => evaluate("document.querySelectorAll('.seat-button:not(:disabled)').length > 3"), 'real seat map');
    await evaluate("{const b=[...document.querySelectorAll('.seat-button:not(:disabled)')]; b[0].click();}");
    await poll(() => evaluate("document.querySelectorAll('.seat-button[aria-pressed=true]').length === 1"), 'first selected seat');
    await evaluate("document.querySelectorAll('.seat-button:not(:disabled)')[1].click()");
    await click('Đóng form'); await poll(() => evaluate("Boolean(document.querySelector('dialog[open]'))"), 'dirty confirmation');
    await click('Hủy'); assert.equal(await evaluate("document.querySelectorAll('.seat-button[aria-pressed=true]').length"), 2);
    pass(`${portal}: discard cancel retains draft`);
    for (const width of [390, 768, 1280, 1440, 1920]) {
      await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      await delay(150);
      const size = await evaluate('({width:innerWidth, scrollWidth:document.documentElement.scrollWidth})');
      assert.ok(size.scrollWidth <= size.width, `${portal} overflow at ${width}: ${size.scrollWidth}`);
      await evaluate("document.querySelector('.staff-bookings__editor').scrollIntoView({block:'start'})");
      await screenshot(`${portal}-${width}`); pass(`${portal}: responsive ${width}px, no document overflow`, size);
    }
    const countCreates = () => requests.filter((r) => r.method === 'POST' && r.pathname === `/api/${portal}/bookings`).length;
    const beforeCreate = countCreates(); await click('Tạo đơn Chờ thanh toán', true);
    await poll(() => evaluate("Boolean(document.querySelector('.staff-bookings__detail')) && !document.querySelector('.staff-bookings__editor')"), 'created detail');
    const orderId = await evaluate("new URLSearchParams(location.search).get('orderId')"); created.push(Number(orderId));
    assert.equal(countCreates() - beforeCreate, 1);
    assert.ok(await evaluate("document.querySelector('.staff-bookings__detail').textContent.includes('Chưa có lần thử thanh toán.')"));
    pass(`${portal}: Customer selector, pending create and double submit guard`, { orderId });
    await click('Sửa ghế'); await poll(() => evaluate("document.querySelectorAll('.seat-button[aria-pressed=true]').length === 2"), 'editable own seats');
    await evaluate("document.querySelector('.seat-button[aria-pressed=true]').click()");
    await delay(100);
    await evaluate("[...document.querySelectorAll('.seat-button:not(:disabled)[aria-pressed=false]')].at(-1).click()");
    await click('Lưu ghế'); await poll(() => evaluate("Boolean(document.querySelector('dialog[open]'))"), 'edit confirmation');
    assert.ok(await evaluate("document.querySelector('dialog[open]').contains(document.activeElement)"));
    for (let index = 0; index < 5; index++) {
      await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      // Native dialogs may allow Tab to browser chrome, but never background controls.
      assert.ok(await evaluate("document.activeElement === document.body || document.querySelector('dialog[open]').contains(document.activeElement)"));
    }
    await escapeDialog(); pass(`${portal}: native dialog focus, Tab excludes background controls, Escape preserves edit`);
    const beforeEdit = requests.filter((r) => r.method === 'PUT' && r.pathname.endsWith(`/${orderId}/seats`)).length;
    await click('Lưu ghế'); await click('Xác nhận', true);
    await poll(() => evaluate("!document.querySelector('.staff-bookings__editor') && document.querySelector('.staff-bookings__detail')?.textContent.includes('Đã hủy')"), 'edited ticket history');
    assert.equal(requests.filter((r) => r.method === 'PUT' && r.pathname.endsWith(`/${orderId}/seats`)).length - beforeEdit, 1);
    await screenshot(`${portal}-edited-history`); pass(`${portal}: real edit, canceled ticket retained, single PUT`);
    await click('Hủy đơn'); await click('Hủy');
    assert.ok(await evaluate("!document.querySelector('dialog[open]')"));
    await click('Hủy đơn'); await click('Xác nhận', true);
    await poll(() => evaluate("document.querySelector('.staff-bookings__detail h2')?.textContent.includes('Đã hủy')"), 'canceled order');
    pass(`${portal}: cancel confirmation/cancel/submit and retained history`);
    // Real conflict: another staff session reserves a selected seat before this form submits.
    await click('Tạo đơn đặt vé'); await field('Tìm Customer', 'khachhang3'); await click('Tìm khách hàng');
    await field('Khách hàng có sẵn', 7, 'select'); await field('Rạp đặt vé', cinema, 'select');
    await field('Suất chiếu / phim / phòng', show, 'select');
    await poll(() => evaluate("document.querySelectorAll('.seat-button:not(:disabled)').length > 0"), 'conflict seats');
    const available = await (await fetch(`${apiBase}/api/${portal}/bookings/options?showtimeId=${show}`, { headers: { authorization: `Bearer ${login.token}` } })).json();
    const conflictSeat = available.seats.find((seat) => seat.status === 'Trống'); assert.ok(conflictSeat);
    await evaluate(`{ const b = [...document.querySelectorAll('.seat-button')].find(b => b.textContent.trim() === ${JSON.stringify(conflictSeat.label)}); b.click(); }`);
    const competingResponse = await fetch(`${apiBase}/api/${portal}/bookings`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${login.token}` }, body: JSON.stringify({ customerId: 8, showtimeId: Number(show), seatIds: [conflictSeat.id] }) });
    assert.equal(competingResponse.status, 201); const competing = await competingResponse.json();
    await click('Tạo đơn Chờ thanh toán');
    await poll(() => evaluate("document.querySelector('.staff-bookings__error')?.textContent.includes('Xung đột')"), 'real conflict notice');
    assert.ok(await evaluate("Boolean(document.querySelector('.staff-bookings__editor')) && document.querySelectorAll('.seat-button[aria-pressed=true]').length === 1"));
    const cleanup = await fetch(`${apiBase}/api/${portal}/bookings/${competing.orderId}/cancel`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${login.token}` }, body: '{}' });
    assert.equal(cleanup.status, 200);
    await screenshot(`${portal}-seat-conflict`); pass(`${portal}: real 409 seat conflict displays error and retains draft`);
    await click('Đóng form'); await click('Bỏ thay đổi');
    await navigate(portal, login.token, `?orderId=${paidOrderId}`);
    await poll(() => evaluate("document.querySelector('.staff-bookings__detail h2')?.textContent.includes('Đã thanh toán')"), 'paid detail');
    assert.ok(await evaluate(`${buttonExpression('Sửa ghế')}.disabled && ${buttonExpression('Hủy đơn')}.disabled`));
    pass(`${portal}: paid order read-only deep link`);
    if (portal === 'manager') {
      await navigate(portal, login.token, `?orderId=${foreignOrderId}`);
      await poll(() => evaluate("Boolean(document.querySelector('.ui-async-state--error')) || document.body.textContent.includes('phạm vi')"), 'foreign scope error');
      assert.ok(!await evaluate("Boolean(document.querySelector('.staff-bookings__detail'))")); pass('manager: foreign cinema detail denied');
    }
    await evaluate(`{ const link = [...document.querySelectorAll('.staff-shell__sidebar a')].find(a => a.textContent.trim() === ${JSON.stringify(portal === 'admin' ? 'Tài khoản' : 'Phòng')}); if(!link) throw new Error('Legacy portal link missing'); link.click(); }`);
    await poll(() => evaluate(`location.pathname === '/${portal}' && !document.querySelector('.staff-bookings') && Boolean(document.querySelector('#main-content h1'))`), `${portal} legacy portal`);
    if (portal === 'manager') assert.equal(await evaluate('location.hash'), '#manager-rooms');
    else assert.ok(await evaluate("document.querySelector('.staff-shell__nav-item[aria-current=page]')?.textContent.includes('Tài khoản')"));
    pass(`${portal}: booking navigation returns to existing legacy module`);
  }
  assert.deepEqual(errors, []); pass('No browser Runtime exceptions');
  write('.audit-output/staff-booking-browser-results.json', { status: 'PASS', transport: 'REAL_BROWSER_HTTP_SQL', database, checks, createdOrders: created, screenshots: fs.readdirSync(evidence).filter((name) => name.endsWith('.png') && name !== 'failure.png'), errors });
  console.log(`PASS ${checks.length} real browser checks; screenshots: ${evidence}`);
} catch (error) {
  if (ws?.readyState === WebSocket.OPEN) { await screenshot('failure').catch(() => {}); console.error(await evaluate('document.body.innerText').catch(() => '')); }
  write('.audit-output/staff-booking-browser-results.json', { status: 'FAIL', database, checks, createdOrders: created, error: error.message, errors }); throw error;
} finally {
  ws?.close(); edge.kill(); await vite.close(); await new Promise((resolve) => apiServer.close(resolve)); await (await getPool()).close();
}
