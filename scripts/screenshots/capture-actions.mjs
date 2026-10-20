// Captures detail / edit / create dialogs for admin & manager (opens and cancels; never saves or deletes).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ACCOUNTS, ROOT, connectTestDb, freePort, startBackend, startFrontend } from '../audit/lib.mjs';
import { uiLogin } from '../audit/browser-helpers.mjs';
import { ADMIN_SECTION_ROUTES } from '../../frontend/src/routes/adminSectionRoutes.js';
import { MANAGER_SECTION_ROUTES } from '../../frontend/src/routes/managerSectionRoutes.js';

const OUT = path.join(ROOT, 'screenshots');
const { pool, env } = await connectTestDb();
const apiPort = await freePort();
const webPort = await freePort();
const api = await startBackend({ env, port: apiPort, frontendOrigin: `http://127.0.0.1:${webPort}` });
const web = await startFrontend({ apiBase: api.base, port: webPort });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const log = [];
const SAFE = /^(Sửa|Xem|Chi tiết|Thêm|Tạo|＋|Diễn viên|Mở|Phân công|Gán|Cập nhật giá|Bảng giá|Ảnh)/;
const UNSAFE = /(Mở danh sách|Xóa|Hủy đơn|Hủy suất|Lưu|Xác nhận|Đăng xuất|Đóng|Tạo mới$|Tạo tài khoản$)/;
const slug = (s) => s.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40);

async function closeAll(page) {
  for (let i = 0; i < 3; i++) {
    if (!(await page.locator('dialog[open], [role="dialog"]').count())) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const b = page.locator('dialog[open], [role="dialog"]').getByRole('button', { name: /^(Đóng|Hủy|Bỏ|Huỷ)/ }).first();
    if (await b.count()) await b.click().catch(() => {});
    await page.waitForTimeout(300);
  }
}

async function run(role, account, routes) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' });
  context.setDefaultTimeout(15000);
  const page = await context.newPage();
  await uiLogin(page, web.origin, account);
  const dir = path.join(OUT, `${role}_actions`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const [section, route] of Object.entries(routes)) {
    await page.goto(web.origin + route.path, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(1000);
    const names = await page.getByRole('button').evaluateAll((els) =>
      els.filter((e) => e.offsetParent && !e.closest('dialog')).map((e) => (e.getAttribute('aria-label') || e.innerText).trim().replace(/\s+/g, ' ')));
    // one sample per distinct action verb (first word(s)), e.g. first "Sửa …" row
    const seen = new Set();
    const picks = names.filter((t) => t && SAFE.test(t) && !UNSAFE.test(t)).filter((t) => {
      const key = t.split(' ').slice(0, 2).join(' ').replace(/[#\d].*/, '');
      const k = /^(Sửa|Xem|Chi tiết|Diễn viên|Ảnh|Mở|Phân công|Gán)/.test(t) ? t.split(' ')[0] : t;
      if (seen.has(k)) return false;
      seen.add(k);
      return !!key;
    });
    for (const label of picks) {
      try {
        const btn = page.getByRole('button', { name: label, exact: true }).first();
        await btn.scrollIntoViewIfNeeded();
        await btn.click();
        await page.waitForTimeout(1500);
        n++;
        const file = `${String(n).padStart(2, '0')}_${section}_${slug(label)}.png`;
        const hasDialog = (await page.locator('dialog[open], [role="dialog"]').count()) > 0;
        await page.screenshot({ path: path.join(dir, file), fullPage: !hasDialog });
        log.push(`OK   ${role}_actions/${file}  [${label}]`);
      } catch (e) {
        log.push(`SKIP ${role} ${section} [${label}]: ${e.message.split('\n')[0]}`);
      }
      await closeAll(page);
      if (!page.url().includes(route.path)) await page.goto(web.origin + route.path, { waitUntil: 'networkidle' }).catch(() => {});
    }
  }
  await context.close();
}

await run('02_manager', ACCOUNTS.manager, MANAGER_SECTION_ROUTES);
await run('04_admin', ACCOUNTS.admin, ADMIN_SECTION_ROUTES);
await browser.close();
api.stop(); await pool.close();
fs.appendFileSync(path.join(OUT, 'INDEX.txt'), '\n\n# actions\n' + log.join('\n'));
console.log(log.join('\n'));
process.exit(0);
