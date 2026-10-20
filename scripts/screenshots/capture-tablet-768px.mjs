import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ACCOUNTS, ROOT, connectTestDb, freePort, startBackend, startFrontend } from '../audit/lib.mjs';
import { uiLogin } from '../audit/browser-helpers.mjs';

const OUT = path.join(ROOT, 'screenshots', '06_tablet_768px');
fs.mkdirSync(OUT, { recursive: true });

const { pool, env } = await connectTestDb();
const apiPort = await freePort();
const webPort = await freePort();
const api = await startBackend({ env, port: apiPort, frontendOrigin: `http://127.0.0.1:${webPort}` });
const web = await startFrontend({ apiBase: api.base, port: webPort });
const browser = await chromium.launch({ channel: 'msedge', headless: true });

async function newTabletPage() {
  const context = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
    isMobile: false,
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
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    const hasHorizontalOverflow = scrollWidth > clientWidth;
    await page.screenshot({ path: path.join(OUT, file), fullPage: true });
    console.log(`OK   06_tablet_768px/${file} (${page.url().replace(web.origin, '')}) - Overflow: ${hasHorizontalOverflow ? `YES (${scrollWidth}px > ${clientWidth}px)` : 'NO (clean)'}`);
  } catch (e) {
    console.log(`FAIL 06_tablet_768px/${file}: ${e.message}`);
  }
}

// 1. Guest tablet views (768px)
{
  const page = await newTabletPage();
  await shot(page, '01_guest_home_768px', '/');
  await shot(page, '02_guest_movies_768px', '/movies');
  await shot(page, '03_guest_cinemas_768px', '/cinemas');
  await shot(page, '04_guest_login_768px', '/login');
  await shot(page, '05_guest_register_768px', '/register');
  await page.context().close();
}

// 2. Customer tablet views (768px)
{
  const page = await newTabletPage();
  await uiLogin(page, web.origin, ACCOUNTS.customer);
  await shot(page, '06_customer_orders_768px', '/orders');
  await shot(page, '07_customer_order_detail_768px', '/orders/690');
  await shot(page, '08_customer_order_payment_768px', '/orders/690/payment');
  await shot(page, '09_customer_profile_768px', '/profile');
  await shot(page, '10_customer_complaints_768px', '/complaints');
  await shot(page, '11_customer_complaint_chat_768px', '/complaints/94');
  await page.context().close();
}

// 3. Manager tablet views (768px)
{
  const page = await newTabletPage();
  await uiLogin(page, web.origin, ACCOUNTS.manager);
  await shot(page, '12_manager_rooms_768px', '/manager/rooms');
  await shot(page, '13_manager_seats_quickselect_768px', '/manager/seats');
  await shot(page, '14_manager_showtimes_768px', '/manager/showtimes');
  await shot(page, '15_manager_revenue_768px', '/manager/revenue');
  await page.context().close();
}

// 4. CSKH tablet views (768px)
{
  const page = await newTabletPage();
  await uiLogin(page, web.origin, ACCOUNTS.support);
  await shot(page, '16_support_queue_768px', '/support');
  await page.context().close();
}

// 5. Admin tablet views (768px)
{
  const page = await newTabletPage();
  await uiLogin(page, web.origin, ACCOUNTS.admin);
  await shot(page, '17_admin_users_768px', '/admin/access/users');
  await shot(page, '18_admin_rooms_768px', '/admin/cinemas/rooms');
  await shot(page, '19_admin_promotions_768px', '/admin/commerce/promotions');
  await shot(page, '20_admin_escalations_768px', '/admin/service/escalations');
  await shot(page, '21_admin_revenue_sorted_768px', '/admin/reports/revenue');
  await page.context().close();
}

await browser.close();
await web.stop();
await api.stop();
await pool.close();
console.log('Tablet 768px screenshots captured successfully.');
