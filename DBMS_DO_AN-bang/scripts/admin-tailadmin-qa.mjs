// Read-only browser QA against the project's isolated demo database.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { open } from './db/seed-browser-support.mjs';

const browser = await open({
  database: 'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012',
  production: true,
  buildDir: path.resolve('frontend/dist'),
});
const output = path.join(browser.root, '.audit-output/admin-tailadmin');
fs.mkdirSync(output, { recursive: true });
const results = [];
const routes = [
  ['overview', '/admin/overview'],
  ['users', '/admin/access/users'],
  ['assignments', '/admin/access/assignments'],
  ['cinemas', '/admin/cinemas'],
  ['images', '/admin/cinemas/images'],
  ['rooms', '/admin/facilities/rooms'],
  ['seats', '/admin/facilities/seats'],
  ['movies', '/admin/catalog/movies'],
  ['genres', '/admin/catalog/genres'],
  ['actors', '/admin/catalog/actors'],
  ['products', '/admin/commerce/products'],
  ['promotions', '/admin/commerce/promotions'],
  ['pricing', '/admin/operations/pricing'],
  ['showtimes', '/admin/operations/showtimes'],
  ['bookings', '/admin/bookings'],
  ['complaints', '/admin/service/complaints'],
  ['revenue', '/admin/reports/revenue'],
];
try {
  const token = await browser.login('admin1@example.test');
  for (const width of [1440, 390, 768, 1920]) {
    await browser.size(width, width === 390 ? 844 : 1000);
    for (const [name, route] of routes) {
      try {
        await browser.navigate(route, token);
      } catch {
        await browser.navigate(route, token);
      }
      await browser.evaluate('window.scrollTo(0, 0)');
      const readPage = () =>
        browser.evaluate(`({
        heading: document.querySelector('main h1')?.textContent,
        headingVisible: !!document.querySelector('main h1')?.getClientRects().length,
        scroll: document.documentElement.scrollWidth,
        width: innerWidth,
        active: document.querySelector('.admin-desktop-sidebar a[aria-current="page"]')?.getAttribute('href'),
        navCount: document.querySelectorAll('.admin-desktop-sidebar nav a').length,
        headerTop: document.querySelector('.staff-shell__header').getBoundingClientRect().top,
        errors: [...document.querySelectorAll('main [role="alert"]')].map(e => e.textContent)
      })`);
      let result = await readPage();
      if (result.errors.some((message) => message.includes('Failed to fetch'))) {
        await browser.navigate(route, token);
        await browser.evaluate('window.scrollTo(0, 0)');
        result = { ...(await readPage()), transportRetry: true };
      }
      assert.ok(result.heading && result.headingVisible, `Missing heading: ${name}`);
      assert.ok(result.scroll <= width, `Overflow: ${name} ${width}`);
      assert.equal(result.active, route, `Active route: ${name}`);
      assert.equal(result.navCount, 17, 'All permitted destinations present');
      assert.equal(result.headerTop, 0, 'Header remains visible');
      assert.equal(result.errors.length, 0, `API errors: ${name}: ${result.errors}`);
      if (['overview', 'movies', 'rooms', 'revenue'].includes(name))
        await browser.screenshot(path.join(output, `${name}-${width}.png`));
      results.push({ name, route, width, ...result });
    }
    console.log(`PASS: 17 admin pages at ${width}px`);
  }
  await browser.size(1440, 1000);
  await browser.navigate('/admin/overview', token);
  await browser.evaluate(`document.querySelector('.admin-desktop-toggle').click()`);
  assert.equal(
    await browser.evaluate(
      `Math.round(document.querySelector('.admin-desktop-sidebar').getBoundingClientRect().width)`,
    ),
    88,
  );
  await browser.evaluate(`document.querySelector('.admin-search-trigger').click()`);
  await browser.poll(
    () => browser.evaluate(`!!document.querySelector('dialog[open] input')`),
    'Search dialog',
  );
  await browser.evaluate(
    `(() => { const input = document.querySelector('dialog[open] input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'dien vien'); input.dispatchEvent(new Event('input', {bubbles:true})); })()`,
  );
  await browser.poll(
    () =>
      browser.evaluate(
        `document.querySelectorAll('dialog[open] .admin-command-results a').length === 1`,
      ),
    'Accent-insensitive search',
  );
  await browser.evaluate(`document.querySelector('dialog[open] .admin-command-results a').click()`);
  await browser.poll(
    () =>
      browser.evaluate(
        `location.pathname === '/admin/catalog/actors' && !document.querySelector('dialog[open]')`,
      ),
    'Search navigation',
  );
  await browser.navigate('/admin/overview', token);
  await browser.evaluate(
    `document.querySelector('button[aria-label="Chuyển giao diện tối"]').click()`,
  );
  await browser.poll(
    () =>
      browser.evaluate(`document.querySelector('.staff-shell--admin').dataset.theme === 'dark'`),
    'Dark theme',
  );
  await browser.screenshot(path.join(output, 'overview-dark-1440.png'));
  await browser.evaluate(
    `document.querySelector('button[aria-label="Chuyển giao diện sáng"]').click(); document.querySelector('.admin-desktop-toggle').click()`,
  );
  await browser.size(390, 844);
  await browser.evaluate(
    `document.querySelector('.admin-mobile-toggle').focus(); document.querySelector('.admin-mobile-toggle').click()`,
  );
  await browser.poll(
    () => browser.evaluate(`!!document.querySelector('.ui-dialog--admin-navigation[open]')`),
    'Mobile drawer',
  );
  assert.equal(
    await browser.evaluate(
      `document.querySelector('dialog[open]').contains(document.activeElement)`,
    ),
    true,
    'Drawer captures focus',
  );
  await browser.screenshot(path.join(output, 'navigation-390.png'));
  await browser.cdp('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });
  await browser.cdp('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });
  await browser.poll(
    () => browser.evaluate(`!document.querySelector('dialog[open]')`),
    'Escape closes drawer',
  );
  assert.equal(
    await browser.evaluate(`document.activeElement.classList.contains('admin-mobile-toggle')`),
    true,
    'Drawer restores focus',
  );
  assert.deepEqual(browser.errors, [], 'No JavaScript runtime exceptions');
  fs.writeFileSync(
    path.join(output, 'results.json'),
    JSON.stringify(
      {
        status: 'PASS',
        results,
        interactions: [
          'collapse',
          'search',
          'search navigation',
          'theme',
          'mobile drawer',
          'Escape',
          'focus restoration',
        ],
        errors: browser.errors,
      },
      null,
      2,
    ),
  );
  console.log('PASS: navigation, search, theme and accessible mobile drawer');
} catch (error) {
  await browser.screenshot(path.join(output, 'failed.png')).catch(() => {});
  fs.writeFileSync(
    path.join(output, 'results.json'),
    JSON.stringify(
      { status: 'FAIL', message: error.message, results, errors: browser.errors },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser.close();
}
