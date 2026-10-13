// Acceptance on the dedicated test DB. Real Edge, Vite, Express and SQL Server.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { open, database, wait } from './seed-browser-support.mjs';
import { root, write } from './lib.mjs';
const b = await open({ cacheDir: path.join(root, '.audit-output/vcr/existing-e2e-cache') });
const checks = [],
  imageResponses = [],
  failures = [];
const check = (name, condition, detail) => {
  assert.ok(condition, name + ': ' + JSON.stringify(detail));
  checks.push({ name, status: 'PASS', detail });
};
const selectedEvidence = process.argv.find((arg) => arg.startsWith('--evidence='))?.slice(11);
const evidence = selectedEvidence
  ? path.resolve(root, selectedEvidence)
  : path.join(root, '.audit-output/seed-v2/browser');
if (
  selectedEvidence &&
  !evidence.startsWith(path.join(root, 'docs/uiux/evidence/visual-composition') + path.sep)
) {
  await b.close();
  throw new Error('Visual E2E evidence must stay under docs/uiux/evidence/visual-composition');
}
const off = b.onEvent((m) => {
  if (m.method === 'Network.responseReceived' && m.params.type === 'Image')
    imageResponses.push({
      url: m.params.response.url,
      status: m.params.response.status,
      mime: m.params.response.mimeType,
    });
  if (m.method === 'Network.loadingFailed')
    failures.push({
      error: m.params.errorText,
      blockedReason: m.params.blockedReason,
      type: m.params.type,
    });
});
try {
  const films = (await b.request('/movies')).data.movies,
    cinemas = (await b.request('/cinemas')).data.cinemas,
    products = (await b.request('/products')).data.products;
  check('18 movies via unchanged DTO', films.length === 18);
  check(
    '9 verified posters + 9 honest NULL fallbacks',
    films.filter((f) => f.posterUrl).length === 9 && films.filter((f) => !f.posterUrl).length === 9,
  );
  check(
    '4 explicitly fictional cinemas',
    cinemas.length === 4 &&
      cinemas.every(
        (c) => c.name.startsWith('CinemaStar Demo') && c.description.includes('Ảnh minh họa'),
      ),
  );
  check(
    '8 products, 5 matching image URLs',
    products.length === 8 && products.filter((p) => p.imageUrl).length === 5,
  );
  let shows = [];
  for (const film of films) {
    const d = await b.request('/movies/' + film.id);
    check(
      'Movie detail match ' + film.title,
      d.status === 200 &&
        d.data.movie.posterUrl === film.posterUrl &&
        d.data.movie.durationMinutes === film.durationMinutes,
    );
    const s = (await b.request('/movies/' + film.id + '/showtimes')).data.showtimes;
    check(
      'Showtime FK ' + film.title,
      s.every((s) => s.movieId === film.id),
    );
    shows.push(...s);
  }
  check(
    'Many real bookable shows across 12 days',
    shows.length >= 95 && new Set(shows.map((s) => s.date)).size >= 12,
  );
  for (const c of cinemas) {
    const s = (await b.request('/movies/' + shows[0].movieId + '/showtimes?cinemaId=' + c.id)).data
      .showtimes;
    check(
      'Cinema show ownership ' + c.id,
      s.every((s) => s.cinemaId === c.id),
    );
    const imgs = (await b.request('/cinemas/' + c.id + '/images')).data.images;
    check(
      'Cinema cover/gallery FK ' + c.id,
      imgs.length >= 1 &&
        imgs.every((i) => i.cinemaId === c.id && i.description.includes('Ảnh minh họa')),
    );
  }
  const tokens = {};
  for (const user of [
    'customer1',
    'customer2',
    'customer4',
    'customer5',
    'manager1',
    'manager2',
    'support1',
    'admin1',
  ]) {
    tokens[user] = await b.login(user + '@example.test');
    check('Login ' + user, !!tokens[user]);
  }
  const locked = await b.request('/auth/login', 'POST', {
    Email: 'customer6@example.test',
    MatKhau: 'CinemaStarDemo!2026',
  });
  check('Locked account cannot log in', locked.status === 401);
  const manager = (await b.request('/manager/cinemas', 'GET', undefined, tokens.manager1)).data
    .cinemas;
  check(
    'Manager has assigned cinemas only',
    manager.length === 2 && manager.every((c) => c.city === 'Hà Nội'),
  );
  const foreign = cinemas.find((c) => c.city !== 'Hà Nội');
  const denied = await b.request(
    '/manager/cinemas/' + foreign.id + '/rooms',
    'GET',
    undefined,
    tokens.manager1,
  );
  check('Manager foreign scope rejected', [403, 404].includes(denied.status));
  check(
    'Customer cannot call admin API',
    (await b.request('/admin/dashboard', 'GET', undefined, tokens.customer1)).status === 403,
  );
  const show = shows.find((s) => s.startsAt > new Date(Date.now() + 86400000).toISOString());
  assert.ok(show);
  const seats = (await b.request('/showtimes/' + show.id + '/seats')).data.seats;
  check(
    'Real room geometry and all four seat types',
    seats.length === 40 &&
      seats.every((s) => s.roomId === show.roomId) &&
      new Set(seats.map((s) => s.type)).size === 4,
  );
  check(
    'Maintenance seat unavailable',
    seats.find((s) => s.row === 'D' && s.number === 10)?.status !== 'Trống',
  );
  const seat = seats.find((s) => s.status === 'Trống');
  assert.ok(seat);
  for (const code of ['DEMOEXPIRED', 'DEMOEMPTY', 'DEMOMIN', 'DOESNOTEXIST']) {
    const body = { showtimeId: show.id, seatIds: [seat.id], products: [], promotionCode: code };
    const r = await b.request('/promotions/validate', 'POST', body, tokens.customer4);
    check(
      'Promotion preview rejects ' + code,
      r.status === 200 && r.data.promotion.isValid === false && !!r.data.promotion.message,
    );
    const deniedBooking = await b.request('/bookings', 'POST', body, tokens.customer4);
    check(
      'Invalid coupon cannot silently create full-price order ' + code,
      deniedBooking.status >= 400 && deniedBooking.status < 500,
    );
  }
  const raceBody = { showtimeId: show.id, seatIds: [seat.id], products: [] };
  const raced = await Promise.all([
    b.request('/bookings', 'POST', raceBody, tokens.customer4),
    b.request('/bookings', 'POST', raceBody, tokens.customer5),
  ]);
  check(
    'Two concurrent seat claims: exactly one commit',
    raced.filter((r) => r.status === 201).length === 1 &&
      raced.filter((r) => r.status === 409).length === 1,
    raced.map((r) => r.status),
  );
  const winner = raced[0].status === 201 ? 'customer4' : 'customer5',
    loser = winner === 'customer4' ? 'customer5' : 'customer4';
  const orderId = raced.find((r) => r.status === 201).data.booking.id;
  check(
    'Foreign order invisible',
    (await b.request('/orders/' + orderId, 'GET', undefined, tokens[loser])).status === 404,
  );
  const pay1 = await b.request(
    '/orders/' + orderId + '/payments',
    'POST',
    { paymentMethod: 'VNPAY' },
    tokens[winner],
  );
  check('Payment attempt created', pay1.status === 201);
  const fail = await b.request(
    '/orders/' + orderId + '/payments/' + pay1.data.payment.id + '/result',
    'POST',
    { status: 'Thất bại' },
    tokens[winner],
  );
  check('Payment failure accepted', fail.status === 200);
  const pay2 = await b.request(
    '/orders/' + orderId + '/payments',
    'POST',
    { paymentMethod: 'VNPAY' },
    tokens[winner],
  );
  check(
    'Retry uses a new attempt',
    pay2.status === 201 && pay2.data.payment.id !== pay1.data.payment.id,
  );
  check(
    'Payment success accepted',
    (
      await b.request(
        '/orders/' + orderId + '/payments/' + pay2.data.payment.id + '/result',
        'POST',
        { status: 'Thành công' },
        tokens[winner],
      )
    ).status === 200,
  );
  const paid = (await b.request('/orders/' + orderId, 'GET', undefined, tokens[winner])).data.order;
  check(
    'Paid order preserves both attempts and SQL total',
    paid.status === 'Đã thanh toán' &&
      paid.payments.length === 2 &&
      paid.payments.every((p) => p.amount === paid.total) &&
      paid.ticketTotal === paid.tickets.reduce((sum, t) => sum + t.price, 0),
  );
  const reviewed = films.find((f) => f.reviewCount > 0);
  assert.ok(reviewed);
  const reject = await b.request(
    '/movies/' + reviewed.id + '/reviews',
    'POST',
    { rating: 4, content: 'V2 ineligible probe' },
    tokens[loser],
  );
  check('Review eligibility enforced by SQL', [400, 403, 409].includes(reject.status));
  const ownOrders = (await b.request('/orders', 'GET', undefined, tokens.customer1)).data.orders;
  const ownPaid = ownOrders.find((o) => o.status === 'Đã thanh toán');
  assert.ok(ownPaid);
  const complaints = (await b.request('/complaints', 'GET', undefined, tokens.customer1)).data
    .complaints;
  check(
    'Own complaints contain linked and unlinked scenarios',
    complaints.some((c) => c.orderId) && complaints.some((c) => !c.orderId),
  );
  const feature = films.find((f) => f.status === 'Đang chiếu');
  check('Existing featured rule chooses licensed media', !!feature.posterUrl, feature.title);
  const routes = [
    ['home', '/'],
    ['movies', '/movies'],
    ['movie', '/movies/' + feature.id],
    ['cinemas', '/cinemas'],
    ['cinema', '/cinemas/' + cinemas[0].id],
    ['booking', '/booking/' + show.id, tokens[winner]],
    ['orders', '/orders', tokens.customer1],
    ['order', '/orders/' + ownPaid.id, tokens.customer1],
    ['payment', '/orders/' + orderId + '/payment', tokens[winner]],
    ['complaints', '/complaints', tokens.customer1],
  ];
  for (const [name, route, token] of routes) {
    for (const width of [1440, 390]) {
      await b.size(width, width === 390 ? 844 : 900);
      await b.navigate(route, token);
      await b.evaluate('[...document.images].forEach(i=>i.loading="eager")');
      await b.poll(
        () => b.evaluate('[...document.images].every(i=>i.complete)'),
        'image transport including offscreen lazy media',
        20000,
      );
      const imgs = await b.evaluate(
        '[...document.images].map(i=>({url:i.currentSrc,alt:i.alt,width:i.naturalWidth,height:i.naturalHeight,complete:i.complete}))',
      );
      check(
        'No document overflow ' + name + ' ' + width,
        await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),
      );
      check(
        'Real images loaded ' + name + ' ' + width,
        imgs.every((i) => i.width > 0),
        imgs,
      );
      await b.screenshot(path.join(evidence, name + '-' + width + '.png'));
    }
  }
  for (const [portal, user, route] of [
    ['admin', 'admin1', '/admin/overview'],
    ['manager', 'manager1', '/manager'],
    ['support', 'support1', '/support'],
  ]) {
    await b.size(1440, 900);
    await b.navigate(route, tokens[user]);
    check(
      'Staff data rendered ' + portal,
      !(await b.evaluate('document.body.textContent.includes("Không có quyền")')),
    );
    await b.screenshot(path.join(evidence, portal + '-1440.png'));
  }
  check('No uncaught runtime exceptions', b.errors.length === 0, b.errors);
  check(
    'Image responses have real image MIME',
    imageResponses.length > 0 &&
      imageResponses.every((r) => r.status === 200 && r.mime.startsWith('image/')),
    imageResponses,
  );
  write(path.join(evidence, 'results.json'), {
    status: 'PASS',
    database,
    checks,
    imageResponses,
    failures,
    screenshots: 23,
  });
  console.log('PASS ' + checks.length + ' real API/browser checks; 23 screenshots.');
} catch (e) {
  write(path.join(evidence, 'results.json'), {
    status: 'FAIL',
    database,
    error: e.message,
    checks,
    imageResponses,
    failures,
  });
  console.error(e.message);
  process.exitCode = 1;
} finally {
  off();
  await b.close();
}
