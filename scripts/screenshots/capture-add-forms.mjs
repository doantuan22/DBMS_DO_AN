// Captures the five "add" dialogs that need a cinema/room scope (opens and cancels; never saves).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ACCOUNTS, ROOT, connectTestDb, freePort, startBackend, startFrontend, one } from '../audit/lib.mjs';
import { uiLogin } from '../audit/browser-helpers.mjs';

const OUT = path.join(ROOT, 'screenshots');
const { pool, env } = await connectTestDb();
const room = await one(pool, `SELECT TOP 1 p.PhongID, p.RapID FROM dbo.PHONGCHIEU p WHERE p.RapID = 1 AND EXISTS (SELECT 1 FROM dbo.GHE g WHERE g.PhongID = p.PhongID) ORDER BY p.PhongID`);
const apiPort = await freePort();
const webPort = await freePort();
const api = await startBackend({ env, port: apiPort, frontendOrigin: `http://127.0.0.1:${webPort}` });
const web = await startFrontend({ apiBase: api.base, port: webPort });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const log = [];

async function capture(role, account, jobs) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' });
  context.setDefaultTimeout(20000);
  const page = await context.newPage();
  await uiLogin(page, web.origin, account);
  const dir = path.join(OUT, `${role}_actions`);
  for (const [file, url, button] of jobs) {
    try {
      await page.goto(web.origin + url, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(1500);
      if (role === '02_manager') {
        await page.getByPlaceholder('Chọn phòng').click();
        await page.getByRole('option').first().click();
        await page.waitForTimeout(1500);
      }
      await page.getByRole('button', { name: button }).first().click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(dir, file) });
      log.push(`OK   ${role}_actions/${file}`);
    } catch (e) {
      log.push(`FAIL ${role}_actions/${file}: ${e.message.split('\n')[0]}`);
      await page.screenshot({ path: path.join(dir, file.replace('.png', '.FAIL.png')) }).catch(() => {});
    }
  }
  await context.close();
}

const q = `cinemaId=${room.RapID}&roomId=${room.PhongID}`;
await capture('02_manager', ACCOUNTS.manager, [['12_seats_Thêm-ghế.png', `/manager/seats?${q}`, /Thêm ghế/]]);
if (!process.argv.includes('--manager-only')) await capture('04_admin', ACCOUNTS.admin, [
  ['41_rooms_Thêm-phòng.png', `/admin/facilities/rooms?cinemaId=${room.RapID}`, /Thêm phòng/],
  ['42_seats_Thêm-ghế.png', `/admin/facilities/seats?${q}`, /Thêm ghế/],
  ['43_pricing_Thêm-bảng-giá.png', `/admin/operations/pricing?cinemaId=${room.RapID}`, /Thêm bảng giá/],
  ['44_showtimes_Thêm-suất-chiếu.png', `/admin/operations/showtimes?cinemaId=${room.RapID}`, /Thêm suất chiếu/],
]);
await browser.close();
api.stop(); await pool.close();
fs.appendFileSync(path.join(OUT, 'INDEX.txt'), '\n\n# add forms\n' + log.join('\n'));
console.log(log.join('\n'));
process.exit(0);
