// Shared Playwright helpers. Every function drives the real DOM like a user would.
import { DEMO_PASSWORD } from './lib.mjs';

export async function uiLogin(page, origin, email, password = DEMO_PASSWORD) {
  await page.goto(`${origin}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel(/^Mật khẩu/).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

export async function uiRegister(page, origin, { name, email, password, phone }) {
  await page.goto(`${origin}/register`);
  await page.getByLabel('Họ tên').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel(/^Mật khẩu/).fill(password);
  if (phone) await page.getByLabel('Số điện thoại').fill(phone);
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await page.waitForURL('**/login');
}

export async function uiLogout(page) {
  const out = page.getByRole('button', { name: /Đăng xuất/ });
  if (await out.count()) await out.first().click();
}


export const visible = (locator) => locator.locator('visible=true');
export const rowOf = (page, text) => page.getByRole('row').filter({ hasText: text });

export async function expectText(page, text, timeout = 15000) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout });
}

/**
 * Click the confirmation button of a confirmation dialog when one appears. Editor dialogs stay open
 * underneath, so the confirmation is identified by its own action button rather than by role alone.
 */
export async function confirmIfAsked(page, labels = /^(Xác nhận.*|Hủy đơn|Hủy suất chiếu|Bỏ thay đổi|Ghi nhận)$/) {
  const button = page.locator('dialog[open]').getByRole('button', { name: labels }).last();
  try {
    await button.waitFor({ state: 'visible', timeout: 2000 });
  } catch {
    return false;
  }
  await button.click();
  await button.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  return true;
}

export async function expectPoll(check, { timeout = 10000, message = 'condition not met' } = {}) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timeout: ${message}`);
}

/** Fill a text-like field inside the open dialog by its (partial) label. */
export const dialogField = (page, label, options) => page.getByRole('dialog').getByLabel(label, options);
