// Points payment, compensation and revenue — API integration + lifecycle/concurrency.
//   node scripts/audit/points-revenue.mjs
// Business rules under test (final, 2026-10-14):
//   * no refund of any kind; cancelling a showtime credits points and never reduces money received;
//   * 1 point = 1.000 VND on the ticket value still payable after promotion (inverse of the compensation rate);
//   * the part paid with points is NOT cash revenue; a ticket paid 100 % with points contributes 0 VND;
//   * the database computes every amount; the client only chooses how many points to try.
// Every expectation is checked against an independent SQL oracle on CinemaBookingDB_Test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ACCOUNTS,
  Reporter,
  apiClient,
  assertTestDatabase,
  connectTestDb,
  createPrivateShowtime,
  loginStaff,
  one,
  ROOT,
  registerCustomer,
  rows,
  scalar,
  startBackend,
} from './lib.mjs';
import { runIntegrityChecks } from './db-integrity.mjs';

const RUN = Date.now().toString(36);
const reporter = new Reporter('points-revenue');
const { pool, identity } = await connectTestDb();
console.log(`Target: ${identity.db} as ${identity.login}  run=${RUN}`);
const backend = await startBackend();
const call = apiClient(backend.base);
const adminToken = await loginStaff(call, 'admin');
const managerToken = await loginStaff(call, 'manager');
const money = (v) => Number(v);
const histogram = (list) => list.reduce((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {});
const label = (r) => `${r.status}${r.body?.error?.code ? ` ${r.body.error.code}` : ''}`;

async function t(id, title, fn) {
  try {
    await assertTestDatabase(pool);
    reporter.record(id, title, 'PASS', '', await fn());
  } catch (error) {
    reporter.record(id, title, 'FAIL', String(error.message).split('\n')[0].slice(0, 500));
  }
}

// ----------------------------------------------------------------------------- oracles / helpers
const cashOf = async (orderId) =>
  money(
    await scalar(
      pool,
      'SELECT CASE WHEN TongTienVe + TongTienDoAn - TienGiamGia < 0 THEN 0 ELSE TongTienVe + TongTienDoAn - TienGiamGia END FROM dbo.DONDATVE WHERE DonDatVeID = @o',
      { o: orderId },
    ),
  );
const pointsOf = async (userId) =>
  (await scalar(pool, 'SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @u', { u: userId })) ?? 0;
const orderRow = (orderId) => one(pool, 'SELECT * FROM dbo.DONDATVE WHERE DonDatVeID = @o', { o: orderId });
const ordersCount = () => scalar(pool, 'SELECT COUNT(*) FROM dbo.DONDATVE');

async function showtime(basePrice = 100000) {
  return createPrivateShowtime(call, pool, adminToken, { basePrice });
}
async function freeSeats(showtimeId, count) {
  const response = await call('GET', `/showtimes/${showtimeId}/seats`);
  const free = response.body.seats.filter((s) => s.status === 'Trống');
  assert.ok(free.length >= count, 'not enough free seats');
  return free.slice(0, count).map((s) => s.id);
}
const book = (customer, showtimeId, seatIds, extra = {}) =>
  call('POST', '/bookings', { token: customer.token, body: { showtimeId, seatIds, products: [], ...extra } });
const preview = (customer, showtimeId, seatIds, extra = {}) =>
  call('POST', '/bookings/preview', { token: customer.token, body: { showtimeId, seatIds, products: [], ...extra } });
async function pay(customer, orderId, method = 'VNPAY') {
  const attempt = await call('POST', `/orders/${orderId}/payments`, { token: customer.token, body: { paymentMethod: method } });
  if (attempt.status !== 201) return { attempt };
  const result = await call('POST', `/orders/${orderId}/payments/${attempt.body.payment.id}/result`, {
    token: customer.token,
    body: { status: 'Thành công' },
  });
  return { attempt, result };
}
/** Gives a new customer a points balance the legitimate way: a cash purchase earns 1 point per 1.000 VND. */
async function customerWithPoints(tag, ticketCount = 2) {
  const customer = await registerCustomer(call, pool, tag);
  const show = await showtime(100000);
  const seats = await freeSeats(show.showtimeId, ticketCount);
  const booked = await book(customer, show.showtimeId, seats);
  assert.equal(booked.status, 201, booked.text);
  const paid = await pay(customer, booked.body.booking.id);
  assert.equal(paid.result.status, 200, paid.result?.text);
  customer.balance = await pointsOf(customer.id);
  assert.equal(customer.balance, ticketCount * 100, 'cash payment earns floor(cash / 1000) points');
  return customer;
}
async function moneyLedger() {
  // independent cash-received oracle: one row per order that has a successful payment
  const [row] = await rows(
    pool,
    `SELECT ISNULL(SUM(CASE WHEN d.TongTienVe + d.TongTienDoAn - d.TienGiamGia < 0 THEN 0 ELSE d.TongTienVe + d.TongTienDoAn - d.TienGiamGia END), 0) AS cash,
            ISNULL(SUM(CAST(d.DiemSuDung AS DECIMAL(18, 2)) * 1000), 0) AS pointsValue,
            ISNULL(SUM(CASE WHEN d.TrangThai = N'Đã hủy'
                            THEN CASE WHEN d.TongTienVe + d.TongTienDoAn - d.TienGiamGia < 0 THEN 0 ELSE d.TongTienVe + d.TongTienDoAn - d.TienGiamGia END ELSE 0 END), 0) AS cancelledCash,
            COUNT(*) AS orders
       FROM dbo.DONDATVE d
      WHERE EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công')`,
  );
  return { cash: money(row.cash), pointsValue: money(row.pointsValue), cancelledCash: money(row.cancelledCash), orders: money(row.orders) };
}
const dashboard = async () => (await call('GET', '/admin/dashboard', { token: adminToken })).body.dashboard;

// ============================================================================= PRICING WITH POINTS
await t('PT-01', 'No points: unchanged pricing; cash payment earns floor(cash/1000) points; revenue = cash', async () => {
  const customer = await registerCustomer(call, pool, 'pt1');
  const show = await showtime(100000);
  const seats = await freeSeats(show.showtimeId, 2);
  const before = await moneyLedger();
  const booked = await book(customer, show.showtimeId, seats);
  assert.equal(booked.status, 201, booked.text);
  const order = await orderRow(booked.body.booking.id);
  assert.deepEqual([order.DiemSuDung, money(order.TienGiamGia)], [0, 0]);
  assert.equal(money(booked.body.booking.total), 200000);
  assert.equal(booked.body.booking.pointsUsed, 0);
  const paid = await pay(customer, order.DonDatVeID);
  assert.equal(paid.result.status, 200);
  assert.equal(await pointsOf(customer.id), 200);
  const after = await moneyLedger();
  assert.equal(after.cash - before.cash, 200000);
  return { cash: 200000, earned: 200 };
});

await t('PT-01B', 'Promotion only: TienGiamGia stores the promotion and cash revenue is net of it once', async () => {
  const customer = await registerCustomer(call, pool, 'pt1b');
  const show = await showtime(100000);
  const [seat] = await freeSeats(show.showtimeId, 1);
  const ledger = await moneyLedger();
  const booked = await book(customer, show.showtimeId, [seat], { promotionCode: 'DEMO10' });
  assert.equal(booked.status, 201, booked.text);
  const order = await orderRow(booked.body.booking.id);
  assert.deepEqual([money(order.TienGiamGia), order.DiemSuDung, money(booked.body.booking.total)], [10000, 0, 90000]);
  const paid = await pay(customer, order.DonDatVeID);
  assert.equal(paid.result.status, 200, paid.result?.text);
  assert.equal((await moneyLedger()).cash - ledger.cash, 90000);
  return { promotion: 10000, cash: 90000 };
});

await t('PT-02', 'Spec example: 100.000 ticket, 30.000 paid with 30 points → cash revenue 70.000, points −30, earn 70', async () => {
  const customer = await customerWithPoints('pt2', 1); // balance 100
  const show = await showtime(100000);
  const [seat] = await freeSeats(show.showtimeId, 1);
  const ledger = await moneyLedger();
  const quote = await preview(customer, show.showtimeId, [seat], { points: 30 });
  assert.equal(quote.status, 200, quote.text);
  assert.deepEqual(
    [quote.body.preview.pointsUsed, quote.body.preview.pointsDiscount, quote.body.preview.total, quote.body.preview.maxPoints],
    [30, 30000, 70000, 100],
  );
  assert.equal(await pointsOf(customer.id), 100, 'preview must not touch the balance');
  const booked = await book(customer, show.showtimeId, [seat], { points: 30 });
  assert.equal(booked.status, 201, booked.text);
  assert.deepEqual(
    [booked.body.booking.pointsUsed, money(booked.body.booking.pointsDiscount), money(booked.body.booking.total)],
    [30, 30000, 70000],
    'preview and booking agree',
  );
  const orderId = booked.body.booking.id;
  assert.equal(money((await orderRow(orderId)).TienGiamGia), 30000, 'TienGiamGia includes the points value');
  assert.equal(await pointsOf(customer.id), 70, 'points are reserved when the order is created');
  const paid = await pay(customer, orderId);
  assert.equal(paid.result.status, 200, paid.result?.text);
  assert.equal(await pointsOf(customer.id), 70 + 70, 'earning is on cash only: floor(70.000 / 1.000)');
  const after = await moneyLedger();
  assert.equal(after.cash - ledger.cash, 70000, 'cash revenue is the cash actually paid');
  assert.equal(after.pointsValue - ledger.pointsValue, 30000, 'points value is reported separately');
  assert.equal(await cashOf(orderId), 70000);
  const detail = await call('GET', `/orders/${orderId}`, { token: customer.token });
  assert.deepEqual(
    [detail.body.order.ticketTotal, detail.body.order.pointsUsed, detail.body.order.pointsDiscount, detail.body.order.total],
    [100000, 30, 30000, 70000],
    'order snapshot keeps gross, points and cash',
  );
  return { cash: 70000, pointsValue: 30000 };
});

await t('PT-03', 'Spec example: 100 % paid with points → order paid, DIEM payment, cash revenue 0, no earning', async () => {
  const customer = await customerWithPoints('pt3', 1); // 100 points
  const show = await showtime(100000);
  const [seat] = await freeSeats(show.showtimeId, 1);
  const ledger = await moneyLedger();
  const booked = await book(customer, show.showtimeId, [seat], { points: 100 });
  assert.equal(booked.status, 201, booked.text);
  assert.equal(money(booked.body.booking.total), 0);
  const orderId = booked.body.booking.id;
  assert.deepEqual([money((await orderRow(orderId)).TienGiamGia), (await orderRow(orderId)).DiemSuDung], [100000, 100]);
  assert.equal(await pointsOf(customer.id), 0);
  // cash methods are refused for an order with nothing left to pay
  const cash = await call('POST', `/orders/${orderId}/payments`, { token: customer.token, body: { paymentMethod: 'VNPAY' } });
  assert.equal(cash.status, 409);
  assert.equal(cash.body.error.code, 'POINTS_PAYMENT_REQUIRED');
  const paid = await pay(customer, orderId, 'DIEM');
  assert.equal(paid.attempt.status, 201, paid.attempt.text);
  assert.equal(paid.result.status, 200, paid.result?.text);
  const order = await orderRow(orderId);
  assert.equal(order.TrangThai, 'Đã thanh toán');
  const payments = await rows(pool, 'SELECT PhuongThuc, TrangThai FROM dbo.THANHTOAN WHERE DonDatVeID = @o', { o: orderId });
  assert.deepEqual(payments.map((p) => `${p.PhuongThuc}:${p.TrangThai}`), ['DIEM:Thành công']);
  assert.equal(await pointsOf(customer.id), 0, 'no points are earned on points-paid value');
  const after = await moneyLedger();
  assert.equal(after.cash - ledger.cash, 0, 'a 100% points ticket adds 0 VND of cash revenue');
  assert.equal(after.pointsValue - ledger.pointsValue, 100000);
  return { cash: 0, pointsValue: 100000 };
});

await t('PT-04', 'DIEM is refused when money is still due', async () => {
  const customer = await customerWithPoints('pt4', 1);
  const show = await showtime(100000);
  const [seat] = await freeSeats(show.showtimeId, 1);
  const booked = await book(customer, show.showtimeId, [seat], { points: 10 });
  assert.equal(booked.status, 201);
  const attempt = await call('POST', `/orders/${booked.body.booking.id}/payments`, { token: customer.token, body: { paymentMethod: 'DIEM' } });
  assert.equal(attempt.status, 409);
  assert.equal(attempt.body.error.code, 'POINTS_PAYMENT_NOT_APPLICABLE');
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.THANHTOAN WHERE DonDatVeID = @o', { o: booked.body.booking.id }), 0);
});

await t('PT-05', 'Promotion + points never exceed the payable ticket value (server-side cap, no negative amount)', async () => {
  const customer = await customerWithPoints('pt5', 2); // 200 points
  const show = await showtime(100000);
  const [seat] = await freeSeats(show.showtimeId, 1);
  // DEMO10: 10 % off (max 50.000) → ticket value after promotion 90.000 → at most 90 points
  const over = await preview(customer, show.showtimeId, [seat], { promotionCode: 'DEMO10', points: 91 });
  assert.equal(over.status, 409);
  assert.equal(over.body.error.code, 'POINTS_EXCEED_TICKET_VALUE');
  const exact = await book(customer, show.showtimeId, [seat], { promotionCode: 'DEMO10', points: 90 });
  assert.equal(exact.status, 201, exact.text);
  const order = await orderRow(exact.body.booking.id);
  assert.deepEqual([money(order.TienGiamGia), order.DiemSuDung], [100000, 90]);
  assert.equal(await cashOf(order.DonDatVeID), 0);
  assert.ok(money(exact.body.booking.total) >= 0);
  return { promotion: 10000, points: 90, cash: 0 };
});

await t('PT-06', 'Food is never paid with points: points are capped by the ticket value only', async () => {
  const customer = await customerWithPoints('pt6', 2);
  const show = await showtime(100000);
  const [seat] = await freeSeats(show.showtimeId, 1);
  const product = (await call('GET', '/products')).body.products[0];
  const quote = await preview(customer, show.showtimeId, [seat], { products: [{ productId: product.id, quantity: 2 }], points: 100 });
  assert.equal(quote.status, 200, quote.text);
  assert.equal(quote.body.preview.maxPoints, 100);
  assert.equal(money(quote.body.preview.total), money(product.price) * 2, 'only the food remains payable');
});

await t('PT-07', 'Invalid / excessive point choices write nothing', async () => {
  const customer = await customerWithPoints('pt7', 1); // 100 points
  const show = await showtime(100000);
  const [seat] = await freeSeats(show.showtimeId, 1);
  const orders = await ordersCount();
  const balance = await pointsOf(customer.id);
  for (const points of [-5, 1.5, '10', true]) {
    const r = await book(customer, show.showtimeId, [seat], { points });
    assert.equal(r.status, 400, `${points}: ${r.text}`);
    assert.equal(r.body.error.code, 'INVALID_POINTS');
  }
  const tooMany = await book(customer, show.showtimeId, [seat], { points: balance + 1 });
  assert.equal(tooMany.status, 409);
  assert.equal(tooMany.body.error.code, 'POINTS_INSUFFICIENT');
  assert.equal(await ordersCount(), orders);
  assert.equal(await pointsOf(customer.id), balance);
  // a client cannot dictate amounts
  const forged = await book(customer, show.showtimeId, [seat], { pointsDiscount: 99999 });
  assert.equal(forged.status, 400);
  assert.equal(forged.body.error.code, 'UNKNOWN_REQUEST_FIELD');
});

// ============================================================================= LIFECYCLE
await t('PT-08', 'Failed payment keeps the order and its reserved points; a retry then succeeds', async () => {
  const customer = await customerWithPoints('pt8', 1);
  const show = await showtime(100000);
  const [seat] = await freeSeats(show.showtimeId, 1);
  const booked = await book(customer, show.showtimeId, [seat], { points: 40 });
  const orderId = booked.body.booking.id;
  const attempt = await call('POST', `/orders/${orderId}/payments`, { token: customer.token, body: { paymentMethod: 'MOMO' } });
  const failed = await call('POST', `/orders/${orderId}/payments/${attempt.body.payment.id}/result`, {
    token: customer.token,
    body: { status: 'Thất bại' },
  });
  assert.equal(failed.status, 200);
  assert.equal((await orderRow(orderId)).TrangThai, 'Chờ thanh toán');
  assert.equal(await pointsOf(customer.id), 60, 'points stay reserved after a failed attempt');
  const retry = await pay(customer, orderId, 'VNPAY');
  assert.equal(retry.result.status, 200);
  assert.equal((await orderRow(orderId)).TrangThai, 'Đã thanh toán');
  assert.equal(await cashOf(orderId), 60000);
});

await t('PT-09', 'Expired unpaid order releases exactly its reserved points once (not a refund of money)', async () => {
  const customer = await customerWithPoints('pt9', 1);
  const show = await showtime(100000);
  const [seat] = await freeSeats(show.showtimeId, 1);
  const booked = await book(customer, show.showtimeId, [seat], { points: 55 });
  const orderId = booked.body.booking.id;
  assert.equal(await pointsOf(customer.id), 45);
  await pool.request().input('o', orderId).query(
    `UPDATE dbo.DONDATVE SET HanGiuCho = DATEADD(MINUTE, -5, dbo.fn_BayGio()) WHERE DonDatVeID = @o AND TrangThai = N'Chờ thanh toán'`,
  );
  const late = await call('POST', `/orders/${orderId}/payments`, { token: customer.token, body: { paymentMethod: 'VNPAY' } });
  assert.equal(late.status, 409);
  assert.equal(late.body.error.code, 'ORDER_HOLD_EXPIRED');
  const order = await orderRow(orderId);
  assert.equal(order.TrangThai, 'Hết hạn');
  assert.equal(await pointsOf(customer.id), 100, 'reserved points returned');
  assert.equal(order.DiemSuDung, 55, 'the order keeps its snapshot for history');
  // second expiry attempt (another customer booking triggers the sweep) must not credit again
  const other = await registerCustomer(call, pool, 'pt9b');
  const [free] = await freeSeats(show.showtimeId, 1);
  assert.equal((await book(other, show.showtimeId, [free])).status, 201);
  assert.equal(await pointsOf(customer.id), 100);
  const ledger = await moneyLedger();
  assert.ok(ledger.cash >= 0);
});

await t('PT-10', 'Concurrency: two parallel orders cannot spend the same points; balance never negative', async () => {
  const customer = await customerWithPoints('pt10', 1); // 100 points
  const show = await showtime(100000);
  const seats = await freeSeats(show.showtimeId, 6);
  const results = await Promise.all(seats.map((seat) => book(customer, show.showtimeId, [seat], { points: 100 })));
  const outcome = histogram(results.map(label));
  assert.equal(results.filter((r) => r.status === 201).length, 1, JSON.stringify(outcome));
  assert.ok(results.filter((r) => r.status !== 201).every((r) => r.status === 409 && ['POINTS_INSUFFICIENT', 'ACTIVE_ORDER_LIMIT_REACHED'].includes(r.body.error.code)), JSON.stringify(outcome));
  assert.equal(await pointsOf(customer.id), 0);
  const spent = await scalar(pool, `SELECT ISNULL(SUM(DiemSuDung), 0) FROM dbo.DONDATVE WHERE NguoiDungID = @u AND TrangThai = N'Chờ thanh toán'`, { u: customer.id });
  assert.equal(spent, 100);
  return outcome;
});

await t('PT-11', 'Concurrency: duplicate payment submissions of a points order complete it once', async () => {
  const customer = await customerWithPoints('pt11', 1);
  const show = await showtime(100000);
  const [seat] = await freeSeats(show.showtimeId, 1);
  const booked = await book(customer, show.showtimeId, [seat], { points: 100 });
  const orderId = booked.body.booking.id;
  const attempt = await call('POST', `/orders/${orderId}/payments`, { token: customer.token, body: { paymentMethod: 'DIEM' } });
  assert.equal(attempt.status, 201);
  const results = await Promise.all(
    Array.from({ length: 5 }, () =>
      call('POST', `/orders/${orderId}/payments/${attempt.body.payment.id}/result`, { token: customer.token, body: { status: 'Thành công' } }),
    ),
  );
  assert.equal(results.filter((r) => r.status >= 500).length, 0);
  assert.equal(await scalar(pool, `SELECT COUNT(*) FROM dbo.THANHTOAN WHERE DonDatVeID = @o AND TrangThai = N'Thành công'`, { o: orderId }), 1);
  assert.equal(await pointsOf(customer.id), 0, 'points spent once, none earned');
});

await t('PT-12', 'Staff cancel of an unpaid points order returns the points; seat edit of such an order is refused', async () => {
  const customer = await customerWithPoints('pt12', 1);
  const show = await showtime(100000);
  const [seat, seat2] = await freeSeats(show.showtimeId, 2);
  const booked = await book(customer, show.showtimeId, [seat], { points: 25 });
  const orderId = booked.body.booking.id;
  assert.equal(await pointsOf(customer.id), 75);
  const tickets = await rows(pool, 'SELECT VeID FROM dbo.CHITIETVE WHERE DonDatVeID = @o', { o: orderId });
  const edit = await call('PUT', `/admin/bookings/${orderId}/seats`, {
    token: adminToken,
    body: { seatIds: [seat2], expectedTicketIds: tickets.map((x) => x.VeID) },
  });
  assert.equal(edit.status, 409, edit.text);
  assert.equal(edit.body.error.code, 'ORDER_READ_ONLY');
  const cancel = await call('POST', `/admin/bookings/${orderId}/cancel`, { token: adminToken, body: {} });
  assert.equal(cancel.status, 200, cancel.text);
  assert.equal((await orderRow(orderId)).TrangThai, 'Đã hủy');
  assert.equal(await pointsOf(customer.id), 100);
  // cancelling again must not credit again
  await call('POST', `/admin/bookings/${orderId}/cancel`, { token: adminToken, body: {} });
  assert.equal(await pointsOf(customer.id), 100);
});

// ============================================================================= CANCELLATION / COMPENSATION / REVENUE
const flow = {};
await t('PT-13', 'Showtime cancel: compensation points = ticket value paid (cash + points), money received NOT reduced', async () => {
  const customer = await customerWithPoints('pt13', 1); // 100 points
  const show = await showtime(100000);
  const seats = await freeSeats(show.showtimeId, 2);
  const booked = await book(customer, show.showtimeId, seats, { points: 30 }); // 200.000 − 30.000
  assert.equal(booked.status, 201, booked.text);
  const orderId = booked.body.booking.id;
  const paid = await pay(customer, orderId);
  assert.equal(paid.result.status, 200);
  const cashPaid = await cashOf(orderId);
  assert.equal(cashPaid, 170000);
  const earned = await pointsOf(customer.id); // 100 − 30 + 170
  assert.equal(earned, 240);
  const ledgerBefore = await moneyLedger();
  const dashBefore = await dashboard();

  const cancel = await call('POST', `/admin/showtimes/${show.showtimeId}/cancel`, { token: adminToken, body: {} });
  assert.equal(cancel.status, 200, cancel.text);
  const order = await orderRow(orderId);
  assert.equal(order.TrangThai, 'Đã hủy');
  const credits = await rows(pool, 'SELECT DiemBoiThuong FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID = @o', { o: orderId });
  // ticket 200.000 with no promotion → 200 points; includes the 30 points the customer paid in points
  assert.deepEqual(credits.map((c) => c.DiemBoiThuong), [200]);
  assert.equal(await pointsOf(customer.id), earned + 200);
  const ledgerAfter = await moneyLedger();
  assert.equal(ledgerAfter.cash, ledgerBefore.cash, 'money received is unchanged by the cancellation');
  assert.equal(ledgerAfter.cancelledCash - ledgerBefore.cancelledCash, cashPaid, 'cash now sits under cancelled orders');
  const dashAfter = await dashboard();
  assert.equal(money(dashAfter.TongDoanhThuToanThoiGian), money(dashBefore.TongDoanhThuToanThoiGian), 'dashboard revenue not reduced');
  assert.equal(money(dashAfter.TienThuocDonHuy) - money(dashBefore.TienThuocDonHuy), cashPaid);
  assert.deepEqual(
    (await rows(pool, 'SELECT TrangThai FROM dbo.THANHTOAN WHERE DonDatVeID = @o', { o: orderId })).map((p) => p.TrangThai),
    ['Thành công'],
    'no payment is touched: there is no refund transaction',
  );
  // repeating the cancellation changes nothing
  assert.equal((await call('POST', `/admin/showtimes/${show.showtimeId}/cancel`, { token: adminToken, body: {} })).status, 200);
  assert.equal(await pointsOf(customer.id), earned + 200);
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID = @o', { o: orderId }), 1);
  Object.assign(flow, { customer, compensated: 200, cashPaid });
  return { compensation: 200, cashKept: cashPaid };
});

await t('PT-14', 'Compensation points buy a new ticket: no new cash revenue for the points-paid part', async () => {
  const { customer } = flow;
  assert.ok(customer, 'PT-13 must run first');
  const show = await showtime(100000);
  const [seat] = await freeSeats(show.showtimeId, 1);
  const balance = await pointsOf(customer.id);
  assert.ok(balance >= 100);
  const ledger = await moneyLedger();
  const booked = await book(customer, show.showtimeId, [seat], { points: 100 });
  assert.equal(booked.status, 201, booked.text);
  assert.equal(money(booked.body.booking.total), 0);
  const paid = await pay(customer, booked.body.booking.id, 'DIEM');
  assert.equal(paid.result.status, 200, paid.result?.text);
  const after = await moneyLedger();
  assert.equal(after.cash, ledger.cash, 'revenue is not counted twice');
  assert.equal(await pointsOf(customer.id), balance - 100);
  return { cashDelta: after.cash - ledger.cash };
});

await t('PT-15', 'Admin dashboard, Admin report, Manager report and view all equal the cash oracle', async () => {
  const ledger = await moneyLedger();
  const dash = await dashboard();
  assert.equal(money(dash.TongDoanhThuToanThoiGian), ledger.cash);
  assert.equal(money(dash.TongGiaTriThanhToanBangDiem), ledger.pointsValue);
  assert.equal(money(dash.TienThuocDonHuy), ledger.cancelledCash);
  assert.equal(money(dash.TongDonThanhToanThanhCong), ledger.orders);
  const report = (await call('GET', '/admin/reports/revenue', { token: adminToken })).body;
  const summary = report.summary ?? report.totals ?? report;
  const totalCash = money(summary.TongDoanhThuThucTe ?? summary.totalRevenue ?? summary.summary?.TongDoanhThuThucTe);
  assert.equal(totalCash, ledger.cash);
  const view = await scalar(pool, 'SELECT ISNULL(SUM(DoanhThuThucTe), 0) FROM dbo.vw_DoanhThuTheoRap');
  assert.equal(money(view), ledger.cash);
  // Manager report for every assigned cinema equals the per-cinema oracle
  const cinemas = (await call('GET', '/manager/cinemas', { token: managerToken })).body.cinemas;
  let compared = 0;
  for (const cinema of cinemas) {
    const response = await call('GET', `/manager/cinemas/${cinema.id}/revenue?fromDate=2000-01-01&toDate=2100-12-31`, { token: managerToken });
    assert.equal(response.status, 200, response.text);
    const reported = response.body.revenue.reduce((sum, row) => sum + money(row.totalRevenue), 0);
    const oracle = await scalar(
      pool,
      `SELECT ISNULL(SUM(CASE WHEN d.TongTienVe + d.TongTienDoAn - d.TienGiamGia < 0 THEN 0 ELSE d.TongTienVe + d.TongTienDoAn - d.TienGiamGia END), 0)
         FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID = d.SuatChieuID JOIN dbo.PHONGCHIEU p ON p.PhongID = s.PhongID
        WHERE p.RapID = @r AND EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công')`,
      { r: cinema.id },
    );
    assert.equal(reported, money(oracle), `cinema ${cinema.id}`);
    compared += 1;
  }
  assert.ok(compared >= 1);
  return { cash: ledger.cash, pointsValue: ledger.pointsValue, cancelledCash: ledger.cancelledCash, cinemasCompared: compared };
});

await t('PT-16', 'Invariants: no negative balance, snapshots coherent, no refund state ever written', async () => {
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.HOSOKHACHHANG WHERE DiemTichLuy < 0'), 0);
  assert.equal(
    await scalar(pool, `SELECT COUNT(*) FROM dbo.DONDATVE WHERE DiemSuDung < 0
            OR TienGiamGia > TongTienVe + TongTienDoAn`),
    0,
  );
  assert.equal(await scalar(pool, `SELECT COUNT(*) FROM dbo.THANHTOAN WHERE TrangThai = N'Đã hoàn tiền'`), 0);
  assert.equal(await scalar(pool, `SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai = N'Hoàn tiền'`), 0);
  // a DIEM payment only ever exists for an order whose cash due is zero
  assert.equal(
    await scalar(
      pool,
      `SELECT COUNT(*) FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID = t.DonDatVeID
        WHERE t.PhuongThuc = N'DIEM' AND d.TongTienVe + d.TongTienDoAn - d.TienGiamGia <> 0`,
    ),
    0,
  );
});

await t('PT-17', 'SQL regression database/11_tests/booking/points_payment.sql (preview, spend, constraints, DIEM rule, expiry release; rolled back)', async () => {
  const sqlText = fs.readFileSync(path.join(ROOT, 'database', '11_tests', 'booking', 'points_payment.sql'), 'utf8');
  const result = await pool.request().batch(sqlText);
  const last = result.recordsets.at(-1)?.[0];
  assert.equal(last?.Result, 'PASS points_payment');
  assert.equal(await scalar(pool, `SELECT COUNT(*) FROM dbo.DONDATVE WHERE DiemSuDung = 40 AND TrangThai = N'Hết hạn' AND NgayDat > DATEADD(MINUTE, -2, dbo.fn_BayGio())`), 0, 'the SQL test must leave no data behind');
});

await runIntegrityChecks(pool, reporter, { prefix: 'POST-' });
backend.stop();
await pool.close();
const summary = reporter.finish({ run: RUN });
process.exit(summary.failed === 0 ? 0 : 1);
