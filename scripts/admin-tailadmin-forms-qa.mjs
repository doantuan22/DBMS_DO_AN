// Open real editors and detail views without saving, deleting, or creating bookings.
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
const checks = [];
const click = (selector) =>
  browser.evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const dialogReady = () =>
  browser.poll(() => browser.evaluate('!!document.querySelector("dialog[open]")'), 'Editor opens');
const closeDialog = async () => {
  await click('dialog[open] .ui-dialog__header button');
  await browser.poll(
    () => browser.evaluate('!document.querySelector("dialog[open]")'),
    'Editor closes',
  );
};
try {
  const token = await browser.login('admin1@example.test');
  const cinemas = (await browser.request('/admin/cinemas', 'GET', undefined, token)).data.cinemas;
  const cinemaId = cinemas[0].RapID;
  for (const width of [1440, 390]) {
    await browser.size(width, width === 390 ? 844 : 1000);
    await browser.navigate('/admin/catalog/movies', token);
    await click('main .ui-page-header__actions button');
    await dialogReady();
    assert.ok(
      await browser.evaluate(
        'document.querySelectorAll("dialog[open] input, dialog[open] select, dialog[open] textarea").length >= 6',
      ),
      'Movie metadata fields retained',
    );
    await browser.screenshot(path.join(output, `movie-editor-${width}.png`));
    await closeDialog();
    checks.push(`Movie editor opens and closes at ${width}px`);

    await click('main .ui-data-table tbody button[aria-label^="Sửa "]');
    await dialogReady();
    assert.ok(
      await browser.evaluate(
        '!![...document.querySelectorAll("dialog[open] input")].find(input => input.value)',
      ),
      'Existing movie data hydrated',
    );
    await closeDialog();
    checks.push(`Existing movie edit retains data at ${width}px`);

    await click('main .ui-data-table tbody button[aria-label^="Xóa "]');
    await dialogReady();
    assert.equal(
      await browser.evaluate('document.activeElement.textContent'),
      'Hủy',
      'Destructive confirmation focuses Cancel',
    );
    await click('dialog[open] .ui-dialog__footer button');
    await browser.poll(
      () => browser.evaluate('!document.querySelector("dialog[open]")'),
      'Delete cancelled',
    );
    checks.push(`Delete confirmation cancels without a write at ${width}px`);

    await browser.navigate(`/admin/facilities/rooms?cinemaId=${cinemaId}`, token);
    await browser.poll(
      () => browser.evaluate('!!document.querySelector("main .ui-data-table tbody tr")'),
      'Scoped rooms load',
    );
    await browser.screenshot(path.join(output, `rooms-scoped-${width}.png`));
    await click('main .ui-page-header__actions button');
    await dialogReady();
    await browser.screenshot(path.join(output, `room-editor-${width}.png`));
    await closeDialog();
    checks.push(`Cinema-scoped rooms and room drawer at ${width}px`);

    const rooms = (
      await browser.request(`/admin/rooms?cinemaId=${cinemaId}`, 'GET', undefined, token)
    ).data.rooms;
    await browser.navigate(
      `/admin/facilities/seats?cinemaId=${cinemaId}&roomId=${rooms[0].PhongID}`,
      token,
    );
    await browser.poll(
      () => browser.evaluate('!!document.querySelector(".facility-seat")'),
      'Real seat map loads',
    );
    await click('.facility-seat');
    await browser.screenshot(path.join(output, `seats-scoped-${width}.png`));
    checks.push(`Real seat map selection at ${width}px`);

    await browser.navigate('/admin/service/complaints', token);
    await click('main .ui-data-table tbody button');
    await browser.poll(
      () => browser.evaluate(`!!document.querySelector('section[aria-label="Hồ sơ khiếu nại"]')`),
      'Complaint detail loads',
    );
    await browser.evaluate(
      `document.querySelector('section[aria-label="Hồ sơ khiếu nại"]').scrollIntoView({block:"start"})`,
    );
    await browser.screenshot(path.join(output, `complaint-detail-${width}.png`));
    checks.push(`Complaint details and processing forms at ${width}px`);

    await browser.navigate('/admin/reports/revenue', token);
    await browser.evaluate(
      'document.querySelector(".admin-analytics__charts").scrollIntoView({block:"start"})',
    );
    await browser.screenshot(path.join(output, `revenue-charts-${width}.png`));
    await click('button[aria-label="Biểu đồ theo rạp"]');
    assert.ok(
      await browser.evaluate('!!document.querySelector(".admin-analytics__bars")'),
      'Cinema chart switches',
    );
    await browser.evaluate(
      `[...document.querySelectorAll('[aria-label="Nhóm báo cáo"] button')].find(button => button.textContent === 'Theo ngày').click()`,
    );
    await browser.poll(
      () =>
        browser.evaluate(
          'document.querySelector("main table caption")?.textContent.includes("Theo ngày")',
        ),
      'Date report table switches',
    );
    checks.push(`Revenue chart and report grouping at ${width}px`);
    console.log(`PASS: editors, scoped rooms/seats, complaints and charts at ${width}px`);
  }
  assert.deepEqual(browser.errors, [], 'No runtime exceptions');
  fs.writeFileSync(
    path.join(output, 'forms-results.json'),
    JSON.stringify({ status: 'PASS', checks, errors: browser.errors }, null, 2),
  );
} finally {
  await browser.close();
}
