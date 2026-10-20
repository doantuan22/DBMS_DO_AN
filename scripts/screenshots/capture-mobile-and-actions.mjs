import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ACCOUNTS, ROOT, connectTestDb, freePort, startBackend, startFrontend } from '../audit/lib.mjs';
import { uiLogin } from '../audit/browser-helpers.mjs';

const OUT = path.join(ROOT, 'screenshots', '05_mobile');
fs.mkdirSync(OUT, { recursive: true });

const { pool, env } = await connectTestDb();
const apiPort = await freePort();
const webPort = await freePort();
const api = await startBackend({ env, port: apiPort, frontendOrigin: `http://127.0.0.1:${webPort}` });
const web = await startFrontend({ apiBase: api.base, port: webPort });
const browser = await chromium.launch({ channel: 'msedge', headless: true });

async function newMobilePage() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  context.setDefaultTimeout(20000);
  return context.newPage();
}

async function shot(page, name, url) {
  const file = `${name}.png`;
  try {
    if (url) await page.goto(web.origin + url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT, file), fullPage: true });
    console.log(`OK   05_mobile/${file} (${page.url().replace(web.origin, '')})`);
  } catch (e) {
    console.log(`FAIL 05_mobile/${file}: ${e.message}`);
  }
}

// 1. Guest mobile views
{
  const page = await newMobilePage();
  await shot(page, '01_guest_home', '/');
  await shot(page, '02_guest_movies', '/movies');
  await shot(page, '03_guest_cinemas', '/cinemas');
  await shot(page, '04_guest_login', '/login');
  await shot(page, '05_guest_register', '/register');
  await page.context().close();
}

// 2. Customer mobile views
{
  const page = await newMobilePage();
  await uiLogin(page, web.origin, ACCOUNTS.customer);
  await shot(page, '06_customer_orders', '/orders');
  await shot(page, '07_customer_order_detail', '/orders/690');
  await shot(page, '08_customer_order_payment', '/orders/690/payment');
  await shot(page, '09_customer_profile', '/profile');
  await shot(page, '10_customer_complaints', '/complaints');
  await shot(page, '11_customer_complaint_chat', '/complaints/94');
  await page.context().close();
}

// 3. Manager & Admin mobile views
{
  const page = await newMobilePage();
  await uiLogin(page, web.origin, ACCOUNTS.manager);
  await shot(page, '12_manager_rooms', '/manager/rooms');
  await shot(page, '13_manager_seats_quickselect', '/manager/seats');
  await shot(page, '14_manager_revenue', '/manager/revenue');
  await page.context().close();
}

{
  const page = await newMobilePage();
  await uiLogin(page, web.origin, ACCOUNTS.support);
  await shot(page, '15_support_queue', '/support');
  await page.context().close();
}

{
  const page = await newMobilePage();
  await uiLogin(page, web.origin, ACCOUNTS.admin);
  await shot(page, '16_admin_users', '/admin/access/users');
  await shot(page, '17_admin_promotions', '/admin/commerce/promotions');
  await shot(page, '18_admin_escalations', '/admin/service/escalations');
  await shot(page, '19_admin_revenue_sorted', '/admin/reports/revenue');
  await page.context().close();
}

await browser.close();
await web.stop();
await api.stop();
await pool.close();
console.log('Mobile screenshots captured successfully.');
