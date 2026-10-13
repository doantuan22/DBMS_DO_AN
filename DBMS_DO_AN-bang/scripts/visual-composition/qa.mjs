// Real API/browser verification. Business writes are restricted to the existing TEST DB.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { open, wait } from '../db/seed-browser-support.mjs';
import { snapshot, targets } from '../db/seed-demo.mjs';
import { root, write } from '../db/lib.mjs';
import { MAX_PRODUCT_QUANTITY } from '../../frontend/src/constants/bookingLimits.js';

const evidence = path.join(root, 'docs/uiux/evidence/visual-composition/functional');
const mainBefore = snapshot('CinemaBookingDB'),
  demoBefore = snapshot(targets[0]);
const testBefore = snapshot(targets[1]);
const b = await open({
  database: targets[1],
  cacheDir: path.join(root, '.audit-output/vcr/qa-cache'),
});
const checks = [],
  traffic = [],
  axeResults = [];
const check = (name, value, detail) => {
  assert.ok(value, name + ': ' + JSON.stringify(detail));
  checks.push({ name, status: 'PASS', ...(detail === undefined ? {} : { detail }) });
  console.log('PASS ' + name);
};
const off = b.onEvent((m) => {
  if (
    m.method === 'Network.requestWillBeSent' &&
    new URL(m.params.request.url).pathname.startsWith('/api/')
  ) {
    const u = new URL(m.params.request.url);
    traffic.push({ path: u.pathname + u.search, method: m.params.request.method });
  }
  if (m.method === 'Page.javascriptDialogOpening')
    void b.cdp('Page.handleJavaScriptDialog', { accept: true });
});
const setValue = (selector, value) =>
  b.evaluate(
    `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('Control missing');const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(String(value))});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`,
  );
const click = (selector) =>
  b.evaluate(
    `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('Action missing: '+${JSON.stringify(selector)});e.click();return true})()`,
  );
const imageReady = async () => {
  await b.evaluate('[...document.images].forEach(i=>i.loading="eager")');
  await b.poll(
    () => b.evaluate('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'),
    'actual record images',
    30000,
  );
};
const shot = async (name) => {
  await imageReady();
  await b.screenshot(path.join(evidence, name + '.png'));
};
const axe = fs.readFileSync(
  path.join(root, '.audit-output/public-redesign-tools/axe/package/axe.min.js'),
  'utf8',
);
const audit = async (name) => {
  await b.evaluate(axe);
  const r = await b.evaluate(
    `axe.run(document.querySelector('.cinema-public'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}).then(r=>({violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,impact:v.impact})),passes:r.passes.length}))`,
  );
  axeResults.push({ name, ...r });
  check('Axe no WCAG A/AA violations ' + name, r.violations.length === 0, r.violations);
};
let conflictOrderId, orderId;
try {
  const films = (await b.request('/movies')).data.movies,
    cinemas = (await b.request('/cinemas')).data.cinemas;
  const featured = films.find((m) => m.status === 'Đang chiếu');
  const shows = (await b.request('/movies/' + featured.id + '/showtimes')).data.showtimes;
  const show = shows.find(
    (s) => s.startsAt > new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  );
  assert.ok(show, 'Real future bookable show');
  await b.size(1440, 900);
  await b.navigate('/');
  await imageReady();
  check(
    'Hero matches actual featured movie',
    await b.evaluate(
      `document.querySelector('#billboard-title').textContent===${JSON.stringify(featured.title)}`,
    ),
  );
  check(
    'Hero image matches API poster URL',
    await b.evaluate(
      `document.querySelector('.cp-billboard img').src===${JSON.stringify(featured.posterUrl)}`,
    ),
  );
  check(
    'Hero CTA visible without scrolling',
    await b.evaluate(
      "(()=>{const r=document.querySelector('.cp-billboard .catalog-button').getBoundingClientRect();return r.top>=72&&r.bottom<=innerHeight})()",
    ),
  );
  check(
    'Film rail hides visual scrollbar',
    await b.evaluate(
      "getComputedStyle(document.querySelector('.cp-film-rail')).scrollbarWidth==='none'",
    ),
  );
  const initial = await b.evaluate("document.querySelector('.cp-film-rail').scrollLeft");
  await click('.cp-rail-actions button:last-child');
  await wait(500);
  check(
    'Rail next arrow moves actual overflow',
    (await b.evaluate("document.querySelector('.cp-film-rail').scrollLeft")) > initial,
  );
  await b.evaluate("document.querySelector('.movie-card__poster').focus()");
  await b.poll(
    () =>
      b.evaluate(
        "getComputedStyle(document.activeElement.closest('.movie-card').querySelector('.movie-card__action')).opacity==='1'",
      ),
    'focus CTA transition',
  );
  check(
    'Focused film exposes CTA',
    await b.evaluate(
      "getComputedStyle(document.activeElement.closest('.movie-card').querySelector('.movie-card__action')).opacity==='1'",
    ),
  );
  await shot('home-desktop');
  await audit('home-desktop');
  await b.size(390, 844);
  await b.navigate('/');
  await imageReady();
  check(
    'Mobile Hero CTA remains in first viewport',
    await b.evaluate(
      "document.querySelector('.cp-billboard .catalog-button').getBoundingClientRect().bottom<=innerHeight",
    ),
  );
  check(
    'Touch-size film CTA visible at 390px',
    await b.evaluate(
      "getComputedStyle(document.querySelector('.movie-card__action')).opacity==='1'",
    ),
  );
  await click('.public-shell__menu-toggle');
  check(
    'Menu moves focus inside navigation',
    await b.evaluate(
      "document.querySelector('#public-navigation').contains(document.activeElement)",
    ),
  );
  await b.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await b.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
  check(
    'Escape closes menu and restores toggle focus',
    await b.evaluate(
      "document.activeElement===document.querySelector('.public-shell__menu-toggle')&&!document.querySelector('.public-shell__navigation').classList.contains('is-open')",
    ),
  );
  await shot('home-mobile');
  await audit('home-mobile');
  await b.size(1440, 900);
  await b.navigate('/movies');
  await setValue('input[type="search"]', 'Sintel');
  await click('form.ui-filter-bar button[type="submit"]');
  await b.poll(
    () =>
      b.evaluate(
        "location.search.includes('search=Sintel')&&document.querySelectorAll('.movie-card').length===1",
      ),
    'server film search',
  );
  check(
    'Film filter retains one correct API movie',
    await b.evaluate("document.querySelector('.movie-card h2').textContent==='Sintel'"),
  );
  await b.evaluate('history.back()');
  await b.poll(
    () =>
      b.evaluate(
        "!location.search&&document.querySelectorAll('.movie-card,.cp-film-announcement').length===18",
      ),
    'filter back',
  );
  check('Back restores the complete catalog', true);
  await b.evaluate('history.forward()');
  await b.poll(
    () =>
      b.evaluate(
        "location.search.includes('search=Sintel')&&document.querySelectorAll('.movie-card').length===1",
      ),
    'filter forward',
  );
  check('Forward restores applied filter', true);
  await click('form.ui-filter-bar button[type="reset"]');
  await b.poll(
    () => b.evaluate("document.querySelectorAll('.movie-card,.cp-film-announcement').length===18"),
    'catalog reset',
  );
  await shot('catalog-desktop');
  await audit('catalog-desktop');
  const nullArt = films.find((m) => !m.posterUrl && m.status === 'Sắp chiếu');
  await b.navigate('/movies/' + nullArt.id);
  check(
    'Long title and missing-artwork state use real movie',
    await b.evaluate(
      `document.querySelector('h1').textContent===${JSON.stringify(nullArt.title)}&&Boolean(document.querySelector('.customer-media__fallback'))`,
    ),
  );
  check(
    'Upcoming movie has a genuine no-showtime state',
    await b.evaluate("document.body.textContent.includes('Không có suất chiếu phù hợp')"),
  );
  await shot('movie-no-artwork');
  await b.navigate('/movies/' + featured.id);
  const day = shows[0].date;
  await click('.cp-date-strip button');
  await b.poll(
    () =>
      b.evaluate(
        `document.querySelector('input[type=date]').value===${JSON.stringify(day)}&&document.querySelectorAll('.cp-time-chip').length>0`,
      ),
    'date filter',
  );
  const expectedDay = (
    await b.request('/movies/' + featured.id + '/showtimes?date=' + day)
  ).data.showtimes.map((s) => String(s.id));
  check(
    'Date chips map exact REST showtime IDs',
    await b.evaluate(
      "[...document.querySelectorAll('.cp-time-chip')].every(a=>" +
        JSON.stringify(expectedDay) +
        ".includes(a.getAttribute('href').split('/').pop()))",
    ),
  );
  await setValue('.cp-show-filters select', cinemas[0].id);
  await b.poll(
    () => b.evaluate("document.querySelector('input[type=date]').value===''"),
    'dependent date reset',
  );
  check('Changing cinema resets date context', true);
  await shot('movie-schedule');
  await audit('movie-detail-desktop');
  await b.navigate('/cinemas/' + cinemas[0].id);
  check(
    'Fixed cinema has no redundant cinema selector',
    await b.evaluate(
      "document.querySelectorAll('select').length===1&&!document.body.textContent.includes('Chọn rạp và ngày')",
    ),
  );
  await b.poll(
    () => b.evaluate("document.querySelectorAll('.cp-time-chip').length>0"),
    'cinema owned schedule',
  );
  const cinemaShows = (
    await b.request('/movies/' + featured.id + '/showtimes?cinemaId=' + cinemas[0].id)
  ).data.showtimes;
  check(
    'Cinema chips belong to the actual selected cinema',
    await b.evaluate(
      "[...document.querySelectorAll('.cp-time-chip')].every(a=>" +
        JSON.stringify(cinemaShows.map((s) => String(s.id))) +
        ".includes(a.getAttribute('href').split('/').pop()))",
    ),
  );
  await shot('cinema-schedule');
  await audit('cinema-detail-desktop');
  await b.navigate('/booking/' + show.id);
  await click('.customer-journey__summary a[href="/login"]');
  await b.poll(() => b.evaluate("location.pathname==='/login'"), 'login route');
  await setValue('input[type="email"]', 'customer1@example.test');
  await setValue('input[type="password"]', 'CinemaStarDemo!2026');
  await click('.auth-card button[type="submit"]');
  await b.poll(
    () =>
      b.evaluate(
        `location.pathname==='/booking/${show.id}'&&document.querySelectorAll('.cp-seat').length===40`,
      ),
    'login returns to actual showtime',
  );
  check('Actual login preserves showtime and refreshes seat map', true);
  const customer = await b.login('customer1@example.test'),
    other = await b.login('customer2@example.test');
  const seats = (await b.request('/showtimes/' + show.id + '/seats')).data.seats;
  const seat = seats.find((s) => s.status === 'Trống');
  assert.ok(seat);
  await click(`.cp-seat[data-seat-id="${seat.id}"]`);
  check(
    'Seat selection reflects actual seat ID',
    await b.evaluate(
      `document.querySelector('.cp-seat[data-seat-id="${seat.id}"]').getAttribute('aria-pressed')==='true'`,
    ),
  );
  await b.evaluate(`document.querySelector('.cp-seat[data-seat-id="${seat.id}"]').focus()`);
  await b.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' });
  check(
    'Arrow keyboard focuses another real enabled seat',
    await b.evaluate(
      `document.activeElement.matches('.cp-seat:not(:disabled)')&&document.activeElement.dataset.seatId!=='${seat.id}'`,
    ),
  );
  await click('button[aria-label="Phóng to sơ đồ ghế"]');
  check(
    'Seat zoom increases hit area from 44 to 55px',
    Math.round(
      await b.evaluate("document.querySelector('.cp-seat').getBoundingClientRect().width"),
    ) === 55,
  );
  await click('button[aria-label="Thu nhỏ sơ đồ ghế"]');
  const product = (await b.request('/products')).data.products[0];
  await click(`button[aria-label="Tăng số lượng ${product.name}"]`);
  check(
    'Product plus calls quantity state',
    await b.evaluate(
      `document.querySelector('input[aria-label="Số lượng ${product.name}"]').value==='1'`,
    ),
  );
  await click(`button[aria-label="Giảm số lượng ${product.name}"]`);
  check(
    'Zero quantity disables decrement',
    await b.evaluate(
      `document.querySelector('button[aria-label="Giảm số lượng ${product.name}"]').disabled`,
    ),
  );
  await setValue(`input[aria-label="Số lượng ${product.name}"]`, MAX_PRODUCT_QUANTITY + 10);
  check(
    'Existing quantity limit clamps typed values',
    await b.evaluate(
      `document.querySelector('input[aria-label="Số lượng ${product.name}"]').value==='${MAX_PRODUCT_QUANTITY}'&&document.querySelector('button[aria-label="Tăng số lượng ${product.name}"]').disabled`,
    ),
  );
  await setValue(`input[aria-label="Số lượng ${product.name}"]`, 1);
  const reserved = await b.request(
    '/bookings',
    'POST',
    { showtimeId: show.id, seatIds: [seat.id], products: [] },
    other,
  );
  check('Conflict setup is real SQL booking on TEST', reserved.status === 201);
  conflictOrderId = reserved.data.booking.id;
  await click('.customer-journey__summary .ui-button');
  await b.poll(
    () =>
      b.evaluate(
        "document.body.textContent.includes('Sơ đồ ghế đã được làm mới')&&document.querySelectorAll('.cp-seat[aria-pressed=true]').length===0",
      ),
    'real 409 refresh',
  );
  check(
    'Server 409 refreshes map and clears stale selection',
    await b.evaluate(`document.querySelector('.cp-seat[data-seat-id="${seat.id}"]').disabled`),
  );
  await shot('booking-real-conflict');
  const next = await b.evaluate(
    "Number(document.querySelector('.cp-seat:not(:disabled)').dataset.seatId)",
  );
  await click(`.cp-seat[data-seat-id="${next}"]`);
  const count = traffic.filter((r) => r.method === 'POST' && r.path === '/api/bookings').length;
  await b.evaluate(
    "document.querySelector('.customer-journey__summary .ui-button').click();document.querySelector('.customer-journey__summary .ui-button').click()",
  );
  await b.poll(
    () => b.evaluate("document.body.textContent.includes('Đã tạo đơn, chờ thanh toán')"),
    'actual booking success',
  );
  check(
    'Double click creates exactly one HTTP booking',
    traffic.filter((r) => r.method === 'POST' && r.path === '/api/bookings').length === count + 1,
  );
  const paymentPath = await b.evaluate(
    "document.querySelector('a[href$=\"/payment\"]').getAttribute('href')",
  );
  orderId = Number(paymentPath.split('/')[2]);
  const pending = (await b.request('/orders/' + orderId, 'GET', undefined, customer)).data.order;
  check(
    'Created order has authoritative status, total and hold',
    pending.status === 'Chờ thanh toán' &&
      pending.total > 0 &&
      Date.parse(pending.holdExpiresAt) > Date.now(),
  );
  await shot('booking-created-order');
  const attempt = await b.request(
    '/orders/' + orderId + '/payments',
    'POST',
    { paymentMethod: 'VNPAY' },
    customer,
  );
  check('Initial payment attempt exists on SQL', attempt.status === 201);
  check(
    'Failed attempt retained',
    (
      await b.request(
        '/orders/' + orderId + '/payments/' + attempt.data.payment.id + '/result',
        'POST',
        { status: 'Thất bại' },
        customer,
      )
    ).status === 200,
  );
  await b.navigate(paymentPath, customer);
  await b.evaluate(
    "[...document.querySelectorAll('button')].find(e=>e.textContent==='Xác nhận thanh toán').click()",
  );
  await b.poll(
    () => b.evaluate("Boolean(document.querySelector('dialog[open]'))"),
    'payment confirmation',
  );
  await b.evaluate(
    "[...document.querySelector('dialog[open]').querySelectorAll('button')].find(e=>e.textContent==='Xác nhận').click()",
  );
  await b.poll(
    () => b.evaluate("document.body.textContent.includes('Đã xác nhận thanh toán thành công')"),
    'actual payment retry',
  );
  const paid = (await b.request('/orders/' + orderId, 'GET', undefined, customer)).data.order;
  check(
    'Payment UI retry uses a new attempt and preserves failure history',
    paid.status === 'Đã thanh toán' &&
      paid.payments.length === 2 &&
      paid.payments.some((p) => p.status === 'Thất bại') &&
      paid.payments.some((p) => p.status === 'Thành công'),
  );
  check(
    'All payment amounts equal the SQL order total',
    paid.payments.every((p) => p.amount === paid.total),
  );
  await shot('payment-retry-paid');
  await audit('payment-desktop');
  await b.size(390, 844);
  await b.navigate('/booking/' + show.id, customer);
  await imageReady();
  check(
    'Mobile seat canvas gives explicit horizontal navigation',
    await b.evaluate(
      "document.querySelector('.seat-map__rows').scrollWidth>document.querySelector('.seat-map__rows').clientWidth&&Boolean(document.querySelector('button[aria-label=\"Xem phía phải sơ đồ ghế\"]'))",
    ),
  );
  const left = await b.evaluate("document.querySelector('.seat-map__rows').scrollLeft");
  await click('button[aria-label="Xem phía phải sơ đồ ghế"]');
  await wait(400);
  check(
    'Mobile seat arrow scrolls the real canvas',
    (await b.evaluate("document.querySelector('.seat-map__rows').scrollLeft")) > left,
  );
  await shot('booking-mobile');
  await audit('booking-mobile');
  check(
    'No page body overflow on booking mobile',
    await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),
  );
  await b.navigate('/login');
  await audit('login-mobile');
  const manager = await b.login('manager1@example.test');
  const foreign = cinemas.find((c) => c.city !== 'Hà Nội');
  check(
    'Manager foreign cinema scope remains denied',
    [403, 404].includes(
      (await b.request('/manager/cinemas/' + foreign.id + '/rooms', 'GET', undefined, manager))
        .status,
    ),
  );
  check(
    'Customer admin API remains denied',
    (await b.request('/admin/dashboard', 'GET', undefined, customer)).status === 403,
  );
  await b.cdp('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await b.navigate('/');
  check(
    'Reduced motion makes CTA transition effectively instant (at most 1ms)',
    await b.evaluate(
      "getComputedStyle(document.querySelector('.movie-card__action')).transitionDuration.split(',').every(x=>parseFloat(x)<=0.001)",
    ),
  );
  await b.cdp('Emulation.setEmulatedMedia', { features: [] });
  await b.navigate('/movies');
  await b.evaluate("document.querySelector('.cinema-public').style.zoom='2'");
  check(
    '200% zoom preserves page width at 390px',
    await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),
  );
  await shot('catalog-mobile-zoom');
  check('No uncaught runtime errors', b.errors.length === 0, b.errors);
  write(path.join(evidence, 'results.json'), {
    status: 'PASS',
    database: targets[1],
    checks,
    traffic,
    axeResults,
    conflictOrderId,
    orderId,
    note: 'Only synthetic TEST booking/payment records created; no reset or delete.',
  });
} catch (error) {
  write(path.join(evidence, 'results.json'), {
    status: 'FAIL',
    error: error.message,
    checks,
    traffic,
    axeResults,
    errors: b.errors,
    conflictOrderId,
    orderId,
  });
  await b.screenshot(path.join(evidence, 'failure.png')).catch(() => {});
  throw error;
} finally {
  off();
  await b.close();
  assert.deepEqual(snapshot('CinemaBookingDB'), mainBefore, 'Main changed during QA');
  assert.deepEqual(snapshot(targets[0]), demoBefore, 'Demo changed during QA');
  write(path.join(evidence, 'data-preservation.json'), {
    status: 'PASS',
    mainUnchanged: true,
    demoUnchanged: true,
    testBefore,
    testAfter: snapshot(targets[1]),
    retainedSyntheticOrders: [conflictOrderId, orderId].filter(Boolean),
  });
}
