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

export async function pickSearchableOption(container, label, text) {
  const page = container.page ? container.page() : container;
  const box = container.getByRole('combobox', { name: label });
  await box.click();
  await box.fill(text);
  const opt = page.getByRole('option', { name: text });
  if (await opt.count()) {
    await opt.first().click();
  } else {
    await box.press('Enter');
  }
}

export async function selectCustomOption(container, label, valueOrText) {
  const page = container.page ? container.page() : container;
  const text = typeof valueOrText === 'object' ? valueOrText.label : valueOrText;

  // 1. Target the specific FormField by its label text
  const field = container.locator('.ui-form-field').filter({ hasText: label });
  if (await field.count()) {
    const nativeInField = field.locator('select.ui-custom-select__native, select');
    if (await nativeInField.count()) {
      await nativeInField.first().selectOption(valueOrText, { force: true });
      return;
    }
  }

  const native = container.locator(`select[aria-label="${label}"]`).or(
    container.locator(`select.ui-custom-select__native`)
  ).filter({ has: page.locator(`option:has-text("${text}")`) });
  if (await native.count()) {
    await native.first().selectOption(valueOrText, { force: true });
    return;
  }
  const trigger = container.getByRole('button', { name: label });
  if (await trigger.count()) {
    await trigger.click();
    const opt = page.getByRole('option', { name: text });
    if (await opt.count()) await opt.first().click();
  }
}

