import assert from 'node:assert/strict';
import { credentials, sqlcmd, expandSql, write } from './lib.mjs';
import { preflight, validateTestName } from './test-target.mjs';
const database = validateTestName(process.argv.find((v) => v.startsWith('--database='))?.slice(11));
const gate = preflight(database);
assert.ok(gate.target, 'Built, seeded disposable target required');
Object.assign(process.env, credentials(), { DB_DATABASE: database });
const { createApp } = await import('../../backend/src/app.js');
const { getPool } = await import('../../backend/src/db/pool.js');
const server = createApp().listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
const checks = [], created = [];
async function request(path, token, method = 'GET', body, expected = 200, code) {
  const response = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${data.error?.code}`);
  if (code) assert.equal(data.error?.code, code);
  checks.push({ path, method, status: 'PASS', expected, actual: response.status }); return data;
}
try {
  write('.audit-output/staff-booking-migration.log', sqlcmd(gate.sqlGuard + expandSql('13_migrations/r10_staff_booking.sql'), { database, file: true }));
  const login = async (Email) => request('/auth/login', null, 'POST', { Email, MatKhau: '123456' });
  const admin = await login('admin@cinemadb.vn'), manager = await login('manager.q1@cinemadb.vn'), customer = await login('khachhang1@gmail.com'), support = await login('cskh@cinemadb.vn');
  for (const portal of ['admin', 'manager']) {
    await request(`/${portal}/bookings`, null, 'GET', undefined, 401);
    for (const actor of [customer, support, portal === 'admin' ? manager : admin]) await request(`/${portal}/bookings`, actor.token, 'GET', undefined, 403);
  }
  const choices = await request('/admin/bookings/customers?search=gmail', admin.token);
  assert.ok(choices.customers.length >= 4); assert.ok(choices.customers.every((r) => r.NguoiDungID >= 5));
  await request('/manager/bookings/customers?search=0904', manager.token);
  await request('/admin/bookings/customers?search=a', admin.token, 'GET', undefined, 400);
  const adminOptions = await request('/admin/bookings/options', admin.token), managerOptions = await request('/manager/bookings/options', manager.token);
  const ownCinema = managerOptions.cinemas[0].RapID;
  const ownShow = managerOptions.showtimes.find((s) => s.RapID === ownCinema);
  const foreignShow = adminOptions.showtimes.find((s) => !managerOptions.cinemas.some((r) => r.RapID === s.RapID));
  assert.ok(ownShow && foreignShow);
  await request(`/manager/bookings/options?cinemaId=${foreignShow.RapID}`, manager.token, 'GET', undefined, 403, 'CINEMA_SCOPE_DENIED');
  await request(`/manager/bookings/options?showtimeId=${foreignShow.SuatChieuID}`, manager.token, 'GET', undefined, 403);
  const getSeats = async (show) => (await request(`/admin/bookings/options?showtimeId=${show.SuatChieuID}`, admin.token)).seats.filter((s) => s.status === 'Trống');
  const ownSeats = await getSeats(ownShow), foreignSeats = await getSeats(foreignShow);
  assert.ok(ownSeats.length > 12 && foreignSeats.length);
  const body = { customerId: 5, showtimeId: ownShow.SuatChieuID, seatIds: [ownSeats[0].id] };
  for (const customerId of [999999, 1, 2, 4]) await request('/admin/bookings', admin.token, 'POST', { ...body, customerId }, 400, 'CUSTOMER_UNAVAILABLE');
  await request('/admin/users/8/status', admin.token, 'PUT', { status: 'Bị khóa' });
  await request('/manager/bookings', manager.token, 'POST', { ...body, customerId: 8 }, 400, 'CUSTOMER_UNAVAILABLE');
  await request('/admin/users/8/status', admin.token, 'PUT', { status: 'Hoạt động' });
  await request('/admin/bookings', admin.token, 'POST', { ...body, showtimeId: 999999 }, 404);
  await request('/admin/bookings', admin.token, 'POST', { ...body, seatIds: [foreignSeats[0].id] }, 409, 'SEAT_UNAVAILABLE');
  await request('/admin/bookings', admin.token, 'POST', { ...body, seatIds: [ownSeats[0].id, ownSeats[0].id] }, 400);
  await request('/admin/bookings', admin.token, 'POST', { ...body, status: 'Đã thanh toán' }, 400);
  await request('/manager/bookings', manager.token, 'POST', { ...body, showtimeId: foreignShow.SuatChieuID, seatIds: [foreignSeats[0].id] }, 403);
  for (const [portal, actor, offset] of [['admin', admin, 0], ['manager', manager, 2]]) {
    const result = await request(`/${portal}/bookings`, actor.token, 'POST', { ...body, customerId: offset ? 6 : 5, seatIds: [ownSeats[offset].id, ownSeats[offset + 1].id] }, 201);
    created.push(result.orderId);
    const original = (await request(`/${portal}/bookings/${result.orderId}`, actor.token)).order;
    assert.equal(original.status, 'Chờ thanh toán'); assert.equal(original.payments.length, 0); assert.equal(original.canEdit, true);
    const retained = original.tickets[0], removed = original.tickets[1];
    const edited = (await request(`/${portal}/bookings/${original.id}/seats`, actor.token, 'PUT', { seatIds: [retained.seatId, ownSeats[offset + 6].id], expectedTicketIds: original.tickets.map((t) => t.id) })).order;
    assert.equal(edited.holdExpiresAt, original.holdExpiresAt);
    assert.deepEqual(edited.tickets.find((t) => t.id === retained.id), retained);
    assert.equal(edited.tickets.find((t) => t.id === removed.id).status, 'Đã hủy');
    await request(`/${portal}/bookings/${original.id}/seats`, actor.token, 'PUT', { seatIds: [retained.seatId], expectedTicketIds: original.tickets.map((t) => t.id) }, 409, 'ORDER_CHANGED');
    await request(`/${portal}/bookings?search=${original.id}&status=Chờ%20thanh%20toán&pageSize=1`, actor.token);
    await request(`/${portal}/bookings?search=${encodeURIComponent(retained.code)}`, actor.token);
    const canceled = (await request(`/${portal}/bookings/${original.id}/cancel`, actor.token, 'POST', {})).order;
    assert.equal(canceled.status, 'Đã hủy'); assert.ok(canceled.tickets.every((t) => t.status === 'Đã hủy'));
    await request(`/${portal}/bookings/${original.id}/cancel`, actor.token, 'POST', {}, 409);
    await request(`/${portal}/bookings/${original.id}`, actor.token, 'DELETE', undefined, 405);
  }
  const foreign = await request('/admin/bookings', admin.token, 'POST', { ...body, showtimeId: foreignShow.SuatChieuID, seatIds: [foreignSeats[0].id] }, 201); created.push(foreign.orderId);
  const hidden = await request(`/manager/bookings?search=${foreign.orderId}`, manager.token);
  assert.ok(hidden.orders.every((row) => row.DonDatVeID !== foreign.orderId && managerOptions.cinemas.some((cinema) => cinema.RapID === row.RapID)));
  await request(`/manager/bookings/${foreign.orderId}`, manager.token, 'GET', undefined, 403);
  await request(`/manager/bookings/${foreign.orderId}/seats`, manager.token, 'PUT', { seatIds: [foreignSeats[1].id], expectedTicketIds: [1] }, 403);
  await request(`/manager/bookings/${foreign.orderId}/cancel`, manager.token, 'POST', {}, 403);
  await request(`/admin/bookings/${foreign.orderId}/cancel`, admin.token, 'POST', {});
  // Two independent HTTP requests race on the same seat: exactly one successful order.
  const raceBody = { ...body, seatIds: [ownSeats[10].id] };
  const race = await Promise.all([admin, manager].map(async (actor, i) => {
    const response = await fetch(base + (i ? '/manager/bookings' : '/admin/bookings'), { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${actor.token}` }, body: JSON.stringify({ ...raceBody, customerId: i ? 6 : 5 }) });
    return { status: response.status, data: await response.json() };
  }));
  assert.deepEqual(race.map((r) => r.status).sort(), [201, 409]);
  const winner = race.find((r) => r.status === 201).data.orderId; created.push(winner);
  await request(`/admin/bookings/${winner}/cancel`, admin.token, 'POST', {});
  checks.push({ scenario: 'concurrent same seat', actual: 'one 201, one 409', status: 'PASS' });
  // Two edits from the same version cannot silently overwrite each other.
  const editRaceOrder = await request('/admin/bookings', admin.token, 'POST', { ...body, seatIds: [ownSeats[9].id] }, 201);
  const editOriginal = (await request(`/admin/bookings/${editRaceOrder.orderId}`, admin.token)).order;
  const editRace = await Promise.all([admin, manager].map(async (actor, i) => {
    const response = await fetch(`${base}/${i ? 'manager' : 'admin'}/bookings/${editRaceOrder.orderId}/seats`, {
      method: 'PUT', headers: { 'content-type': 'application/json', authorization: `Bearer ${actor.token}` },
      body: JSON.stringify({ seatIds: [ownSeats[i ? 5 : 4].id], expectedTicketIds: activeIds(editOriginal) }),
    });
    return { status: response.status, data: await response.json() };
  }));
  assert.deepEqual(editRace.map((r) => r.status).sort(), [200, 409]);
  assert.equal(editRace.find((r) => r.status === 409).data.error.code, 'ORDER_CHANGED');
  const afterRace = (await request(`/admin/bookings/${editRaceOrder.orderId}`, admin.token)).order;
  assert.equal(activeIds(afterRace).length, 1); assert.equal(afterRace.holdExpiresAt, editOriginal.holdExpiresAt);
  const editPayment = await request(`/orders/${editRaceOrder.orderId}/payments`, customer.token, 'POST', { paymentMethod: 'MOMO' }, 201);
  assert.equal(editPayment.payment.amount, afterRace.total);
  await request(`/orders/${editRaceOrder.orderId}/payments/${editPayment.payment.id}/result`, customer.token, 'POST', { status: 'Thất bại' });
  await request(`/admin/bookings/${editRaceOrder.orderId}/cancel`, admin.token, 'POST', {});
  checks.push({ scenario: 'concurrent edits: one 200, one ORDER_CHANGED; Customer pays edited snapshot amount', status: 'PASS' });
  // Real Customer payment of a staff-created order; staff never sets paid status.
  const paid = await request('/admin/bookings', admin.token, 'POST', { ...body, seatIds: [ownSeats[11].id] }, 201); created.push(paid.orderId);
  const attempt = await request(`/orders/${paid.orderId}/payments`, customer.token, 'POST', { paymentMethod: 'MOMO' }, 201);
  await request(`/admin/bookings/${paid.orderId}/cancel`, admin.token, 'POST', {}, 409, 'PAYMENT_HISTORY_PROTECTED');
  const pendingDetail = (await request(`/admin/bookings/${paid.orderId}`, admin.token)).order;
  await request(`/manager/bookings/${paid.orderId}/seats`, manager.token, 'PUT', { seatIds: [ownSeats[12].id], expectedTicketIds: activeIds(pendingDetail) }, 409, 'PAYMENT_HISTORY_PROTECTED');
  await request(`/orders/${paid.orderId}/payments/${attempt.payment.id}/result`, customer.token, 'POST', { status: 'Thành công' });
  const before = (await request(`/admin/bookings/${paid.orderId}`, admin.token)).order;
  for (const [portal, actor] of [['admin', admin], ['manager', manager]]) {
    await request(`/${portal}/bookings/${paid.orderId}/cancel`, actor.token, 'POST', {}, 409, 'ORDER_READ_ONLY');
    await request(`/${portal}/bookings/${paid.orderId}/seats`, actor.token, 'PUT', { seatIds: [ownSeats[12].id], expectedTicketIds: activeIds(before) }, 409, 'ORDER_READ_ONLY');
  }
  assert.deepEqual((await request(`/admin/bookings/${paid.orderId}`, admin.token)).order, before);
  checks.push({ scenario: 'paid order, tickets and payment history preserved', status: 'PASS' });
  write('.audit-output/staff-booking-http-results.json', { database, transport: 'REAL_HTTP_SQL', checks, createdOrders: created, status: 'PASS' });
  console.log(`PASS ${checks.length} real HTTP/SQL staff booking checks on ${database}`);
} catch (error) {
  write('.audit-output/staff-booking-http-results.json', { database, checks, createdOrders: created, status: 'FAIL', error: error.message }); throw error;
} finally {
  await new Promise((resolve) => server.close(resolve)); await (await getPool()).close();
}
function activeIds(order) { return order.tickets.filter((t) => t.status === 'Đã đặt').map((t) => t.id); }
