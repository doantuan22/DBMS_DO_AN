// Raw SQL below is offline fixture/assertion code, never used by the application.
// Mutations and concurrent sessions are restricted to an explicitly named disposable R2 DB.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import sql from '../../backend/node_modules/mssql/index.js';
import { credentials, root, write } from '../db/lib.mjs';

const database = process.argv.find(a => a.startsWith('--database='))?.slice(11);
if (!/^CinemaBookingDB_R0_(?:R1_)?R2_[A-Za-z0-9_]+$/.test(database || '')) throw Error('Use a disposable --database=CinemaBookingDB_R0_R1_R2_<name>.');
const env = credentials();
Object.assign(process.env, env, { DB_DATABASE: database, JWT_SECRET: env.JWT_SECRET || crypto.randomBytes(48).toString('base64url') });
process.chdir(path.join(root, 'backend'));
const { createApp } = await import('../../backend/src/app.js');
const { closePool } = await import('../../backend/src/db/pool.js');
const { databaseConfig } = await import('../../backend/src/config/database.js');
const pool = await new sql.ConnectionPool({ ...databaseConfig }).connect();
const server = createApp().listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
const checks = [], requests = [];
const evidence = path.join(root, process.env.R2_EVIDENCE_DIR || 'audit/remediation/r2/evidence');
const check = (name, action) => { action(); checks.push({ name, status: 'PASS' }); console.log(`PASS ${name}`); };
async function api(route, { method = 'GET', token, body, status = 200 } = {}) {
  const response = await fetch(base + route, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
  const data = await response.json();
  requests.push({ route, method, status: response.status });
  assert.equal(response.status, status, `${route}: ${JSON.stringify(data)}`);
  return data.data ?? data;
}
const query = (text, id) => pool.request().input('ID', sql.Int, id ?? null).query(text);
const points = async user => (await query('SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=@ID', user.user.userId)).recordset[0].DiemTichLuy;
const history = async id => (await query('SELECT * FROM dbo.THANHTOAN WHERE DonDatVeID=@ID ORDER BY ThanhToanID', id)).recordset;
const procedure = (name, params) => { const request = pool.request(); for (const [key, value] of Object.entries(params)) request.input(key, sql.Int, value); return request.execute(name); };

try {
  const admin = await api('/auth/login', { method: 'POST', body: { Email: 'admin@cinemadb.vn', MatKhau: '123456' } });
  const manager = await api('/auth/login', { method: 'POST', body: { Email: 'manager.q1@cinemadb.vn', MatKhau: '123456' } });
  const customers = [];
  for (let i = 0; i < 5; i++) {
    const email = `r2-${crypto.randomUUID()}@example.invalid`;
    await api('/auth/register', { method: 'POST', body: { HoTen: 'R2 fixture', Email: email, MatKhau: 'R2Policy123!' }, status: 201 });
    customers.push(await api('/auth/login', { method: 'POST', body: { Email: email, MatKhau: 'R2Policy123!' } }));
  }
  const { room } = await api('/manager/cinemas/1/rooms', { method: 'POST', token: manager.token, body: { name: `R2-${crypto.randomUUID().slice(0,8)}`, type: '2D' }, status: 201 });
  const seats = [];
  for (let i = 1; i <= 12; i++) seats.push((await api(`/manager/rooms/${room.id}/seats`, { method: 'POST', token: manager.token, body: { row: 'A', number: i, type: 'Thường' }, status: 201 })).seat.id);
  let showIndex = 0;
  async function show() {
    const starts = new Date(Date.now() + (40 + showIndex++) * 86400000);
    const result = await api('/manager/showtimes', { method: 'POST', token: manager.token, body: { movieId: 1, roomId: room.id, startsAt: starts.toISOString(), endsAt: new Date(starts.getTime() + 166 * 60000).toISOString(), format: '2D', basePrice: 120000 }, status: 201 });
    return result.showtime.id;
  }
  const book = async (showtimeId, user, seat = 0) => (await api('/bookings', { method: 'POST', token: user.token, body: { showtimeId, seatIds: [seats[seat]], products: [] }, status: 201 })).booking.id;
  const attempt = async (id, user) => (await api(`/orders/${id}/payments`, { method: 'POST', token: user.token, body: { paymentMethod: 'MOMO' }, status: 201 })).payment.id;
  const pay = async (id, paymentId, user, status = 200) => api(`/orders/${id}/payments/${paymentId}/result`, { method: 'POST', token: user.token, body: { status: 'Thành công' }, status });
  const cancel = (id, status = 200, asManager = false) => api(`/${asManager ? 'manager' : 'admin'}/showtimes/${id}/cancel`, { method: 'POST', token: asManager ? manager.token : admin.token, body: { reason: 'R2 fixture' }, status });
  const expire = id => query("UPDATE dbo.DONDATVE SET HanGiuCho=DATEADD(SECOND,-1,dbo.fn_BayGio()) WHERE DonDatVeID=@ID", id);

  const heldShow = await show();
  const held1 = await book(heldShow, customers[0]);
  let conflict = await cancel(heldShow, 409);
  check('one live hold blocks admin cancellation with HTTP 409', () => assert.equal(conflict.error.code, 'SHOWTIME_HAS_HELD_ORDERS'));
  const held2 = await book(heldShow, customers[1], 1);
  conflict = await cancel(heldShow, 409, true);
  check('multiple live holds block manager cancellation with HTTP 409', () => assert.equal(conflict.error.code, 'SHOWTIME_HAS_HELD_ORDERS'));
  await expire(held1);
  await cancel(heldShow, 409);
  check('blocked cancellation rolls back expiry and keeps the showtime open', () => {});
  assert.equal((await query('SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID=@ID', held1)).recordset[0].TrangThai, 'Chờ thanh toán');
  await expire(held2);
  await procedure('dbo.sp_Order_ExpirePending', { SuatChieuID: heldShow, TraVeKetQua: 0 });
  await cancel(heldShow);
  const heldRows = (await query('SELECT TrangThai FROM dbo.DONDATVE WHERE SuatChieuID=@ID', heldShow)).recordset;
  check('expired holds release seats and cancellation preserves expired order state', () => assert.ok(heldRows.every(r => r.TrangThai === 'Hết hạn')));

  const expiryShow = await show();
  const expiryOrder = await book(expiryShow, customers[0]);
  const expiryAttempt = await attempt(expiryOrder, customers[0]);
  const beforeExpiredPoints = await points(customers[0]);
  await expire(expiryOrder);
  const expiredResult = await pay(expiryOrder, expiryAttempt, customers[0], 409);
  assert.equal(expiredResult.error.code, 'ORDER_HOLD_EXPIRED');
  assert.equal(await points(customers[0]), beforeExpiredPoints);
  assert.ok((await history(expiryOrder)).every(p => p.TrangThai !== 'Thành công'));
  const retryExpired = await api(`/orders/${expiryOrder}/payments`, { method: 'POST', token: customers[0].token, body: { paymentMethod: 'MOMO' }, status: 409 });
  assert.equal(retryExpired.error.code, 'ORDER_HOLD_EXPIRED');
  const map = await api(`/showtimes/${expiryShow}/seats`);
  check('payment after expiry rejected, retry rejected, no points, seat released', () => assert.equal(map.seats.find(s => s.id === seats[0]).status, 'Trống'));
  await cancel(expiryShow);

  // Direct payment SP calls must also clean expired holds without a preceding HTTP detail call.
  for (const mode of ['create', 'confirm']) {
    const s = await show(), id = await book(s, customers[0]);
    const paymentId = mode === 'confirm' ? await attempt(id, customers[0]) : null;
    await expire(id);
    const req = pool.request().input('NguoiDungID', sql.Int, customers[0].user.userId);
    if (mode === 'create') req.input('DonDatVeID', sql.Int, id).input('PhuongThuc', sql.NVarChar(50), 'MOMO').output('ThanhToanID', sql.Int).output('MaGiaoDich', sql.VarChar(100));
    else req.input('ThanhToanID', sql.Int, paymentId).input('TrangThaiThanhToan', sql.NVarChar(50), 'Thành công');
    await assert.rejects(req.execute(`dbo.sp_Payment_${mode === 'create' ? 'CreateAttempt' : 'UpdateResult'}`), e => e.number === 50111);
    assert.equal((await query('SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID=@ID', id)).recordset[0].TrangThai, 'Hết hạn');
    assert.equal((await query('SELECT TrangThai FROM dbo.CHITIETVE WHERE DonDatVeID=@ID', id)).recordset[0].TrangThai, 'Đã hủy');
    await cancel(s);
  }
  check('both payment SP entry points persist expiry and ticket release before domain rejection', () => {});

  const paidShow = await show();
  const cases = [[120000,0,0,120], [120000,80000,0,120], [120000,80000,50000,90], [120000,0,20000,100], [0,80000,0,0]];
  const paid = [];
  for (let i = 0; i < cases.length; i++) {
    const [tickets, food, discount, expected] = cases[i], user = customers[i];
    const id = await book(paidShow, user, i);
    // Isolated snapshots let us test the four exact policy examples without changing pricing/promotion logic.
    await pool.request().input('ID', sql.Int, id).input('Ve', sql.Decimal(18,2), tickets).input('Food', sql.Decimal(18,2), food).input('Discount', sql.Decimal(18,2), discount).query('UPDATE dbo.DONDATVE SET TongTienVe=@Ve,TongTienDoAn=@Food,TienGiamGia=@Discount WHERE DonDatVeID=@ID');
    const paymentId = await attempt(id, user);
    const result = await pay(id, paymentId, user);
    assert.equal(result.order.status, 'Đã thanh toán');
    await pay(id, paymentId, user); // Idempotent payment success.
    paid.push({ id, user, paymentId, expected, before: await points(user), history: await history(id) });
  }
  check('payment before expiry succeeds and repeats safely', () => {});
  await Promise.all(Array.from({ length: 12 }, (_, i) => cancel(paidShow, 200, i % 2 === 0)));
  await cancel(paidShow);
  for (const p of paid) {
    assert.equal(await points(p.user), p.before + p.expected);
    assert.deepEqual(await history(p.id), p.history);
    const detail = await api(`/orders/${p.id}`, { token: p.user.token });
    assert.equal(detail.order.status, 'Đã hủy');
    assert.equal(detail.order.compensation.points, p.expected);
    assert.ok(detail.order.payments.some(payment => payment.status === 'Thành công'));
  }
  const audit = (await query('SELECT b.* FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID WHERE d.SuatChieuID=@ID', paidShow)).recordset;
  check('paid-only cancellation: 120/120/90/100/0 points per customer, food excluded', () => assert.equal(audit.length, 5));
  check('12 concurrent cancels plus retry: one audit entry/order and no double-credit', () => assert.equal(new Set(audit.map(a => a.DonDatVeID)).size, 5));
  check('all successful payment columns/history unchanged; no refund', () => assert.ok(paid.every(p => p.history.every(h => h.TrangThai === 'Thành công'))));

  const rollbackShow = await show(), rollbackUser = customers[0];
  const rollbackOrders = [await book(rollbackShow, rollbackUser, 0), await book(rollbackShow, rollbackUser, 1)];
  for (const id of rollbackOrders) await pay(id, await attempt(id, rollbackUser), rollbackUser);
  const beforeRollback = await points(rollbackUser);
  const rollbackTx = new sql.Transaction(pool);
  await rollbackTx.begin();
  try {
    await new sql.Request(rollbackTx).input('SuatChieuID', sql.Int, rollbackShow).input('NguoiDungID', sql.Int, admin.user.userId).execute('dbo.sp_Showtime_CancelCascade');
    const inside = await new sql.Request(rollbackTx).input('ID', sql.Int, rollbackShow).query('SELECT COUNT(*) AS C FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID WHERE d.SuatChieuID=@ID');
    assert.equal(inside.recordset[0].C, 2);
    await rollbackTx.rollback();
  } catch (error) { await rollbackTx.rollback().catch(() => {}); throw error; }
  assert.equal(await points(rollbackUser), beforeRollback);
  assert.equal((await query('SELECT COUNT(*) AS C FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID WHERE d.SuatChieuID=@ID', rollbackShow)).recordset[0].C, 0);
  assert.equal((await query('SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID=@ID', rollbackShow)).recordset[0].TrangThai, 'Mở bán');
  await cancel(rollbackShow);
  const groupedPoints = (await query('SELECT SUM(b.DiemBoiThuong) AS Points FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID WHERE d.SuatChieuID=@ID', rollbackShow)).recordset[0].Points;
  assert.equal(await points(rollbackUser), beforeRollback + Number(groupedPoints));
  check('caller rollback restores show, orders, audit and points; multiple paid orders/customer sum once', () => {});

  // A points overflow must roll back EVERY cancellation write, including audit/promotion/order state.
  const overflowShow = await show(), overflowOrder = await book(overflowShow, customers[0]);
  await pay(overflowOrder, await attempt(overflowOrder, customers[0]), customers[0]);
  const normalPoints = await points(customers[0]);
  await query('UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy=2147483647 WHERE NguoiDungID=@ID', customers[0].user.userId);
  try {
    await assert.rejects(procedure('dbo.sp_Showtime_CancelCascade', { SuatChieuID: overflowShow, NguoiDungID: admin.user.userId }), e => e.number === 8115);
    assert.equal((await query('SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID=@ID', overflowShow)).recordset[0].TrangThai, 'Mở bán');
    assert.equal((await query('SELECT COUNT(*) AS C FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID WHERE d.SuatChieuID=@ID', overflowShow)).recordset[0].C, 0);
    assert.equal((await query('SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID=@ID', overflowOrder)).recordset[0].TrangThai, 'Đã thanh toán');
  } finally {
    await pool.request().input('ID', sql.Int, customers[0].user.userId).input('Points', sql.Int, normalPoints).query('UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy=@Points WHERE NguoiDungID=@ID');
  }
  await cancel(overflowShow);
  check('compensation write failure rolls back cancellation atomically', () => {});

  // Hold a real row lock until the deadline has passed. The payment procedure starts BEFORE expiry.
  const waitShow = await show(), waitOrder = await book(waitShow, customers[0]);
  const waitAttempt = await attempt(waitOrder, customers[0]);
  const waitLock = new sql.Transaction(pool);
  await waitLock.begin();
  let waitResult;
  try {
    await new sql.Request(waitLock).input('ID', sql.Int, waitOrder).query("UPDATE dbo.DONDATVE SET HanGiuCho=DATEADD(SECOND,2,dbo.fn_BayGio()) WHERE DonDatVeID=@ID; SELECT u.NguoiDungID FROM dbo.NGUOIDUNG u WITH (UPDLOCK,HOLDLOCK) JOIN dbo.DONDATVE d ON d.NguoiDungID=u.NguoiDungID WHERE d.DonDatVeID=@ID;");
    const delayed = pool.request().input('NguoiDungID', sql.Int, customers[0].user.userId).input('ThanhToanID', sql.Int, waitAttempt).input('TrangThaiThanhToan', sql.NVarChar(50), 'Thành công').execute('dbo.sp_Payment_UpdateResult').catch(e => e);
    await new Promise(resolve => setTimeout(resolve, 3000));
    await waitLock.commit();
    waitResult = await delayed;
  } catch (error) { await waitLock.rollback().catch(() => {}); throw error; }
  check('payment starts before expiry but waits past deadline: DB rejects after locks', () => assert.equal(waitResult.number, 50111));
  await cancel(waitShow);

  // Booking and cancellation contend on the same lifecycle locks: either booking wins and cancel is 409,
  // or cancellation wins and booking is 409. Neither can leave an active order on a cancelled showtime.
  const raceShow = await show();
  const raceResults = await Promise.all([
    fetch(base + '/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customers[0].token}` }, body: JSON.stringify({ showtimeId: raceShow, seatIds: [seats[0]], products: [] }) }),
    fetch(base + `/admin/showtimes/${raceShow}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin.token}` }, body: '{}' })
  ]);
  const states = raceResults.map(r => r.status);
  assert.ok((states[0] === 201 && states[1] === 409) || (states[0] === 409 && states[1] === 200), states.join(','));
  check('booking/cancellation race has only valid serialized outcomes', () => {});

  write(path.join(evidence, 'integration.json'), { status: 'PASS', database, checks, requests, audit, at: new Date().toISOString() });
  console.log(`PASS R2 integration: ${checks.length} checks, ${requests.length} HTTP requests`);
} catch (error) {
  write(path.join(evidence, 'integration.json'), { status: 'FAIL', database, checks, requests, error: error.message });
  throw error;
} finally {
  await new Promise(resolve => server.close(resolve));
  await closePool(); await pool.close();
}
