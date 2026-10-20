// Captures every UI page for every role against the TEST database (read-only navigation).
//   node scripts/screenshots/capture-all.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ACCOUNTS, ROOT, connectTestDb, freePort, startBackend, startFrontend } from '../audit/lib.mjs';
import { uiLogin, uiLogout } from '../audit/browser-helpers.mjs';
import { ADMIN_SECTION_ROUTES } from '../../frontend/src/routes/adminSectionRoutes.js';
import { MANAGER_SECTION_ROUTES } from '../../frontend/src/routes/managerSectionRoutes.js';

const OUT = path.join(ROOT, 'screenshots');
fs.rmSync(OUT, { recursive: true, force: true });
const { pool, env } = await connectTestDb();
const apiPort = await freePort();
const webPort = await freePort();
const api = await startBackend({ env, port: apiPort, frontendOrigin: `http://127.0.0.1:${webPort}` });
const web = await startFrontend({ apiBase: api.base, port: webPort });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const log = [];
let counter = {};

async function shot(page, role, name, url) {
  const dir = path.join(OUT, role);
  fs.mkdirSync(dir, { recursive: true });
  counter[role] = (counter[role] ?? 0) + 1;
  const file = `${String(counter[role]).padStart(2, '0')}_${name}.png`;
  try {
    if (url) await page.goto(web.origin + url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(dir, file), fullPage: true });
    log.push(`OK   ${role}/${file}  (${page.url().replace(web.origin, '')})`);
  } catch (e) {
    log.push(`FAIL ${role}/${file}: ${e.message}`);
  }
}

async function firstHref(page, url, pattern) {
  await page.goto(web.origin + url, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(800);
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
  return hrefs.find((h) => pattern.test(h)) ?? null;
}

async function newPage() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' });
  context.setDefaultTimeout(20000);
  return context.newPage();
}

async function tabs(page, role, prefix) {
  const names = await page.getByRole('tab').allInnerTexts().catch(() => []);
  for (const [i, n] of names.entries()) {
    const label = n.trim().replace(/\s+/g, ' ');
    try {
      await page.getByRole('tab').nth(i).click();
      await shot(page, role, `${prefix}_tab-${label.slice(0, 30).replace(/[^\p{L}\p{N}]+/gu, '-')}`);
    } catch {}
  }
}

// ---- Public (guest)
{
  const page = await newPage();
  for (const [n, u] of [['home', '/'], ['movies', '/movies'], ['cinemas', '/cinemas'], ['login', '/login'], ['register', '/register'], ['forbidden', '/forbidden'], ['not-found', '/khong-ton-tai']])
    await shot(page, '00_guest', n, u);
  const movie = await firstHref(page, '/movies', /^\/movies\/\d+/);
  if (movie) await shot(page, '00_guest', 'movie-detail', movie);
  const cinema = await firstHref(page, '/cinemas', /^\/cinemas\/\d+/);
  if (cinema) {
    await shot(page, '00_guest', 'cinema-detail', cinema);
  }
  const booking = await firstHref(page, movie ?? '/movies', /^\/booking\/\d+/);
  if (booking) await shot(page, '00_guest', 'booking-preparation', booking);
  await page.context().close();
}

// ---- Customer
{
  const page = await newPage();
  await uiLogin(page, web.origin, ACCOUNTS.customer);
  const role = '01_customer';
  for (const [n, u] of [['home', '/'], ['movies', '/movies'], ['cinemas', '/cinemas'], ['profile', '/profile'], ['orders', '/orders'], ['complaints', '/complaints']])
    await shot(page, role, n, u);
  const movie = await firstHref(page, '/movies', /^\/movies\/\d+/);
  if (movie) await shot(page, role, 'movie-detail', movie);
  const cinema = await firstHref(page, '/cinemas', /^\/cinemas\/\d+/);
  if (cinema) await shot(page, role, 'cinema-detail', cinema);
  const booking = await firstHref(page, movie ?? '/movies', /^\/booking\/\d+/);
  if (booking) await shot(page, role, 'booking-seat-selection', booking);
  const order = await firstHref(page, '/orders', /^\/orders\/\d+/);
  if (order) { await shot(page, role, 'order-detail', order); await shot(page, role, 'order-payment', order + '/payment'); }
  const comp = await firstHref(page, '/complaints', /^\/complaints\/\d+/);
  if (comp) await shot(page, role, 'complaint-detail', comp);
  await page.context().close();
}

// ---- Customer 2 (has orders)
{
  const page = await newPage();
  await uiLogin(page, web.origin, ACCOUNTS.customer2);
  const role = '01_customer_with_orders';
  await shot(page, role, 'orders', '/orders');
  const order = await firstHref(page, '/orders', /^\/orders\/\d+/);
  if (order) { await shot(page, role, 'order-detail', order); await shot(page, role, 'order-payment', order + '/payment'); }
  await shot(page, role, 'complaints', '/complaints');
  const comp = await firstHref(page, '/complaints', /^\/complaints\/\d+/);
  if (comp) await shot(page, role, 'complaint-detail', comp);
  await page.context().close();
}

// ---- Manager
{
  const page = await newPage();
  await uiLogin(page, web.origin, ACCOUNTS.manager);
  const role = '02_manager';
  await shot(page, role, 'overview', '/manager/overview');
  for (const [s, r] of Object.entries(MANAGER_SECTION_ROUTES)) { await shot(page, role, s, r.path); await tabs(page, role, s); }
  await shot(page, role, 'profile', '/profile');
  await page.context().close();
}

// ---- Support
{
  const page = await newPage();
  await uiLogin(page, web.origin, ACCOUNTS.support);
  const role = '03_support';
  await page.goto(web.origin + '/support', { waitUntil: 'networkidle' }).catch(() => {});
  await page.getByText('CSKH Portal').waitFor().catch(() => {});
  await shot(page, role, 'queue');
  const first = page.getByRole('button').filter({ hasText: /#\d+/ }).first();
  if (await first.count()) { await first.click(); await page.waitForTimeout(1500); await shot(page, role, 'complaint-opened'); }
  await shot(page, role, 'profile', '/profile');
  await page.context().close();
}

// ---- Admin
{
  const page = await newPage();
  await uiLogin(page, web.origin, ACCOUNTS.admin);
  const role = '04_admin';
  await shot(page, role, 'overview', '/admin/overview');
  for (const [s, r] of Object.entries(ADMIN_SECTION_ROUTES)) { await shot(page, role, s, r.path); await tabs(page, role, s); }
  await shot(page, role, 'profile', '/profile');
  await page.context().close();
}

await browser.close();
api.stop(); web.stop?.(); await pool.close();
fs.writeFileSync(path.join(OUT, 'INDEX.txt'), log.join('\n'));
console.log(log.join('\n'));
process.exit(0);
