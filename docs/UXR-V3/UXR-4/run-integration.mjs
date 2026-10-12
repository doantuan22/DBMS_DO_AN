// Offline acceptance only: existing frontend clients/controllers -> real HTTP -> existing SP.
// Test-owned room/show/seat/order fixtures only, in the already isolated DB. No schema/RBAC changes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { credentials } from '../../../scripts/db/lib.mjs';
import { createServer } from '../../../frontend/node_modules/vite/dist/node/index.js';
const database = 'CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2';
Object.assign(process.env, credentials(), { DB_DATABASE: database, JWT_SECRET: crypto.randomBytes(48).toString('hex'), JWT_EXPIRES_IN: '15m', NODE_ENV: 'test' });
const { getPool, closePool } = await import('../../../backend/src/db/pool.js');
const { DbTypes: sql } = await import('../../../backend/src/db/procedureClient.js');
const { createApp } = await import('../../../backend/src/app.js');
const { issueToken } = await import('../../../backend/src/utils/jwt.js');
const evidence = { timestamp: new Date().toISOString(), status: 'RUNNING', transport: 'actual frontend API/controller -> loopback HTTP -> middleware/service/SP -> isolated SQL Server', cases: [], assertions: [], cleanup: [] };
const name = `UXR4_${crypto.randomUUID().slice(0, 12)}`;
let server, vite, pool, roomId, priceId, actor = 1;
const nativeFetch = globalThis.fetch;
const controllers = [];
const record = (scenario, details = {}) => evidence.assertions.push({ scenario, ...details, verdict: 'PASS' });
const tick = () => new Promise((resolve) => setImmediate(resolve));
async function settle(controller, predicate, message) {
  for (let i = 0; i < 100; i++) { if (predicate(controller.getSnapshot())) return; await new Promise((resolve) => setTimeout(resolve, 30)); }
  throw new Error(message);
}
try {
  pool = await getPool();
  evidence.identity = (await pool.request().query('SELECT DB_NAME() AS DatabaseName,DB_ID() AS DatabaseID')).recordset[0];
  assert.deepEqual(evidence.identity, { DatabaseName: database, DatabaseID: 9 });
  const actors = (await pool.request().query("SELECT n.NguoiDungID AS id,v.MaVaiTro AS role FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE n.NguoiDungID IN (1,2,3,4,5,6)")).recordset;
  assert.equal(actors.find((r) => r.id === 1)?.role, 'ADMIN'); assert.equal(actors.find((r) => r.id === 2)?.role, 'QUAN_LY_RAP'); assert.equal(actors.find((r) => r.id === 5)?.role, 'KHACH_HANG'); assert.equal(actors.find((r) => r.id === 6)?.role, 'KHACH_HANG');
  const tokens = new Map(actors.map((row) => [row.id, issueToken(row.id).token]));
  server = createApp().listen(0, '127.0.0.1'); await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  async function call(who, method, endpoint, body, expected = 200) {
    const response = await nativeFetch(`${origin}/api${endpoint}`, { method, headers: { authorization: `Bearer ${tokens.get(who)}`, 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
    const data = await response.json(); evidence.cases.push({ actor: who, method, endpoint, expected, status: response.status, code: data.error?.code, verdict: expected == null || response.status === expected ? 'PASS' : 'FAIL' });
    if (expected != null) assert.equal(response.status, expected, `${method} ${endpoint}: ${data.error?.code}`); return { status: response.status, data };
  }
  // The frontend clients themselves send payloads. In-memory storage only, never persist tokens in evidence.
  globalThis.sessionStorage = { getItem: () => tokens.get(actor), removeItem() {} };
  globalThis.fetch = async (url, options) => { const resolved = new URL(url, origin), response = await nativeFetch(resolved, options); evidence.cases.push({ kind:'frontend-client',actor,method:options?.method ?? 'GET',endpoint:resolved.pathname,status:response.status,verdict:response.ok?'PASS':'FAIL' }); return response; };
  vite = await createServer({ root: path.resolve('frontend'), configFile: path.resolve('frontend/vite.config.js'), server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const { createStaffBookingApi } = await vite.ssrLoadModule('/src/api/staffBookingApi.js');
  const { createBookingController } = await vite.ssrLoadModule('/src/features/staff-bookings/bookingController.js');
  const { createOperationsController } = await vite.ssrLoadModule('/src/features/operations/operationsController.js');
  const { operationsAdapter } = await vite.ssrLoadModule('/src/features/operations/operationsAdapters.js');
  const { operationsView } = await vite.ssrLoadModule('/src/features/operations/operationsModel.js');
  const { managerBody } = await vite.ssrLoadModule('/src/utils/managerForms.js');
  const { businessDate, instantToBusinessLocal } = await vite.ssrLoadModule('/src/utils/dateTime.js');
  const { createManagerCinemaStore } = await vite.ssrLoadModule('/src/features/manager/managerCinemaStore.js');
  const adminUser = { userId: 1, role: 'ADMIN', permissions: ['QL_RAP','QL_PHONG','QL_PHIM','QL_SUAT_CHIEU','QL_BANG_GIA','DAT_VE'].map((code) => ({ code })) };
  const managerUser = { userId: 2, role: 'QUAN_LY_RAP', permissions: ['QL_PHONG','QL_SUAT_CHIEU','QL_BANG_GIA','DAT_VE'].map((code) => ({ code })) };
  const managerCinemas = (await call(2, 'GET', '/manager/cinemas')).data.cinemas;
  const cinemaId = managerCinemas[0].id, managerStore = createManagerCinemaStore(); managerStore.reconcile(managerCinemas);
  const existingOptions = (await call(1, 'GET', `/admin/bookings/options?cinemaId=${cinemaId}`)).data;
  assert.ok(existingOptions.showtimes.length, 'Existing bookable movie/show fixture required');
  const source = existingOptions.showtimes[0];
  const sourceRange = { fromDate: businessDate(source.ThoiGianBatDau), toDate: businessDate(source.ThoiGianBatDau) };
  const sourceShow = (await call(1, 'GET', `/admin/showtimes?cinemaId=${cinemaId}&${new URLSearchParams(sourceRange)}`)).data.showtimes.find((r) => r.SuatChieuID === source.SuatChieuID); assert.ok(sourceShow);
  roomId = (await call(1, 'POST', '/admin/rooms', { cinemaId, name, type: sourceShow.DinhDang })).data.room.PhongID;
  const createdSeats = [];
  for (let number = 1; number <= 14; number++) createdSeats.push((await call(1, 'POST', '/admin/seats', { roomId, row: 'U4', number, type: 'Thường' })).data.seat.GheID);
  const showFields = { movieId: String(sourceShow.PhimID), roomId: String(roomId), startsAt: instantToBusinessLocal(sourceShow.ThoiGianBatDau), endsAt: instantToBusinessLocal(sourceShow.ThoiGianKetThuc), format: sourceShow.DinhDang, basePrice: '80000' };
  let operation = createOperationsController({ adapter: operationsAdapter('showtimes', adminUser), initialQuery: `cinemaId=${cinemaId}&${new URLSearchParams(sourceRange)}` }); controllers.push(operation); await operation.start();
  await settle(operation, (s) => s.movies.status === 'success' && s.cinemas.status === 'success', 'Showtime lookup did not load'); operation.openEditor(); await operation.save(managerBody('showtime', showFields));
  const show = operation.getSnapshot().resource.rows.find((r) => r.roomId === roomId); assert.ok(show); assert.equal(show.startsAt, sourceShow.ThoiGianBatDau); record('4A actual frontend named create and UTC+7 timestamp roundtrip');
  operation.setFilters({ roomId: String(roomId), movieId: String(show.movieId) }); operation.applyFilters(); assert.deepEqual(operationsView(operation.getSnapshot(),'showtimes').rows.map((row) => row.id),[show.id]); record('4A actual complete-range room/movie filters');
  await call(1, 'POST', '/admin/showtimes', managerBody('showtime', showFields), 409);
  operation.openEditor(show); await operation.save(managerBody('showtime', { ...showFields, basePrice: '81000', status: 'Mở bán' }, true)); record('4A actual Admin showtime edit omits immutable room');
  actor = 2;
  const managerOperation = createOperationsController({ adapter: operationsAdapter('showtimes', managerUser, managerStore.getSnapshot()), managerStore, initialQuery: `cinemaId=${cinemaId}&${new URLSearchParams(sourceRange)}` }); controllers.push(managerOperation); await managerOperation.start(); await settle(managerOperation, (s) => s.movies.status === 'success', 'Manager movie lookup failed');
  const managedShow = managerOperation.getSnapshot().resource.rows.find((r) => r.id === show.id); assert.ok(managedShow); managerOperation.openEditor(managedShow); await managerOperation.save(managerBody('showtime', { ...showFields, basePrice: '80000', status: 'Mở bán' }, true)); record('4A Manager scoped read/edit through actual frontend adapter');
  actor = 1;
  // Price rule fixture uses a dimension combination absent from all existing rules.
  const rules = (await call(1, 'GET', `/admin/pricing?cinemaId=${cinemaId}`)).data.pricing;
  let dimensions;
  for (const seatType of ['Sweetbox','Đôi','VIP','Thường']) for (const dayType of ['Cuối tuần','Ngày thường','Tất cả']) for (const format of ['ScreenX','4DX','IMAX','3D','2D']) if (!dimensions && !rules.some((r) => r.LoaiGhe === seatType && r.LoaiNgay === dayType && r.DinhDang === format)) dimensions = { seatType, dayType, format };
  assert.ok(dimensions); const priceFields = { ...dimensions, surcharge: '13000', startsOn: '2099-01-01', endsOn: '2099-01-02' };
  const priceOperation = createOperationsController({ adapter: operationsAdapter('pricing', adminUser), initialQuery: `cinemaId=${cinemaId}` }); controllers.push(priceOperation); await priceOperation.start(); await settle(priceOperation, (s) => s.cinemas.status === 'success', 'Cinema lookup failed'); priceOperation.openEditor(); await priceOperation.save(managerBody('pricing', priceFields));
  const price = priceOperation.getSnapshot().resource.rows.find((r) => r.startsOn === priceFields.startsOn && r.seatType === dimensions.seatType && r.dayType === dimensions.dayType && r.format === dimensions.format); assert.ok(price); priceId = price.id;
  await call(1, 'POST', '/admin/pricing', { cinemaId, ...managerBody('pricing', priceFields) }, 409);
  priceOperation.openEditor(price); await priceOperation.save(managerBody('pricing', { ...priceFields, surcharge: '15000', status: 'Tạm dừng' }, true)); record('4B actual frontend create/edit/open-ended capability and overlap rejection');
  actor = 2; const managerPrice = createOperationsController({ adapter: operationsAdapter('pricing', managerUser, managerStore.getSnapshot()), managerStore }); controllers.push(managerPrice); await managerPrice.start(); managerPrice.openEditor(managerPrice.getSnapshot().resource.rows.find((r) => r.id === priceId)); await managerPrice.save(managerBody('pricing', { ...priceFields, surcharge: '16000', status: 'Tạm dừng' }, true)); record('4B Manager immutable cinema edit');
  // Snapshot proof over actual existing ticket/order/payment data, SP mutation inside rollback.
  const snapshots = async (request) => (await request.query('SELECT (SELECT VeID,DonDatVeID,GiaVe FROM dbo.CHITIETVE ORDER BY VeID FOR JSON PATH) AS Tickets,(SELECT DonDatVeID,TongTienVe,TongTienDoAn,TienGiamGia,(TongTienVe+TongTienDoAn-TienGiamGia) AS TongTienThanhToan FROM dbo.DONDATVE ORDER BY DonDatVeID FOR JSON PATH) AS Orders,(SELECT ThanhToanID,DonDatVeID,SoTien FROM dbo.THANHTOAN ORDER BY ThanhToanID FOR JSON PATH) AS Payments')).recordset[0];
  const before = await snapshots(pool.request());
  const historicalRule = rules.find((rule) => rule.TrangThai === 'Áp dụng'); assert.ok(historicalRule, 'Existing active price rule required');
  const transaction = new sql.Transaction(pool); await transaction.begin();
  try { await new sql.Request(transaction).input('ActorID', sql.Int, 1).input('GiaID', sql.Int, historicalRule.GiaID).input('PhuThu', sql.Decimal(18,2), Number(historicalRule.PhuThu)+123).input('TrangThai', sql.NVarChar(50), historicalRule.TrangThai).execute('dbo.usp_Admin_Pricing_Update'); const after = await snapshots(new sql.Request(transaction)); assert.deepEqual(after, before); await transaction.rollback(); record('4B actual historical ticket/order/payment snapshot equality before/after existing active price SP update, rolled back', { priceRuleId:historicalRule.GiaID,hash: crypto.createHash('sha256').update(JSON.stringify(before)).digest('hex') }); } catch (error) { try { await transaction.rollback(); } catch {} throw error; }
  const outside = (await call(1, 'GET', '/admin/bookings/options')).data.showtimes.find((r) => !managerCinemas.some((c) => c.id === r.RapID)); assert.ok(outside);
  await call(2, 'GET', `/manager/cinemas/${outside.RapID}/showtimes`, null, 403); await call(2, 'GET', `/manager/cinemas/${outside.RapID}/pricing`, null, 403);
  await call(2, 'POST', '/manager/showtimes', { ...managerBody('showtime', showFields), roomId: outside.PhongID }, 403);
  for (const who of actors.filter((row) => row.role !== 'ADMIN').map((row) => row.id)) await call(who, 'GET', '/admin/bookings', null, 403);
  for (const who of actors.filter((row) => row.role !== 'QUAN_LY_RAP').map((row) => row.id)) await call(who, 'GET', '/manager/bookings', null, 403);
  // Real controller create/edit/cancel for both portals; scope/seat price data comes from real options.
  const ids = [];
  for (const [portal, who, customerId, offset] of [['admin',1,5,0], ['manager',2,6,3]]) {
    actor = who; const booking = createBookingController({ api: createStaffBookingApi(portal), ...(portal === 'manager' ? { managerStore, cinemaId: String(cinemaId) } : {}) }); controllers.push(booking); await booking.start();
    booking.startCreate(); booking.setCustomerSearch(customerId === 5 ? 'khachhang1' : 'khachhang2'); await booking.searchCustomers(); assert.ok(booking.getSnapshot().customers.data.customers.some((r) => r.NguoiDungID === customerId)); booking.chooseCustomer(String(customerId)); booking.goToStep(1); if (portal === 'admin') booking.chooseCinema(String(cinemaId));
    await settle(booking, (s) => s.options.status === 'success', 'Booking show lookup failed'); booking.chooseShowtime(String(show.id)); await settle(booking, (s) => s.options.status === 'success' && s.options.showtimeId === String(show.id), 'Booking seat lookup failed'); booking.goToStep(2); booking.toggleSeat(createdSeats[offset]); booking.toggleSeat(createdSeats[offset+1]); booking.goToStep(3); booking.requestSave(); await booking.confirmMutation();
    const original = booking.getSnapshot().detail.order; ids.push(original.id); assert.equal(original.user.id, customerId); assert.equal(original.status, 'Chờ thanh toán'); assert.equal(original.total, original.tickets.reduce((sum,t) => sum+t.price,0));
    await call(1, 'POST', `/admin/showtimes/${show.id}/cancel`, {}, 409); await call(2, 'POST', `/manager/showtimes/${show.id}/cancel`, {}, 409);
    booking.startEdit(); await settle(booking, (s) => s.options.status === 'success', 'Edit options failed'); booking.toggleSeat(createdSeats[offset+1]); booking.toggleSeat(createdSeats[offset+2]); booking.goToStep(3); booking.requestSave(); await booking.confirmMutation();
    const edited = booking.getSnapshot().detail.order; assert.equal(edited.holdExpiresAt, original.holdExpiresAt); assert.deepEqual(edited.tickets.find((t) => t.id === original.tickets[0].id), original.tickets[0]); assert.equal(edited.tickets.find((t) => t.id === original.tickets[1].id).status, 'Đã hủy');
    await call(who, 'PUT', `/${portal}/bookings/${edited.id}/seats`, { seatIds: [createdSeats[offset]], expectedTicketIds: original.tickets.map((t) => t.id) }, 409);
    booking.setFilters({ search: String(original.id), status: 'Chờ thanh toán' }); booking.applyFilters(); await settle(booking, (s) => s.list.status === 'success', 'Booking list filter failed'); assert.equal(booking.getSnapshot().list.data.total, 1);
    booking.requestCancel(); await booking.confirmMutation(); assert.equal(booking.getSnapshot().detail.order.status, 'Đã hủy'); assert.equal(booking.getSnapshot().detail.order.tickets.length, edited.tickets.length);
    await call(who, 'DELETE', `/${portal}/bookings/${original.id}`, null, 405); record(`4C/D ${portal}: actual guided create, server totals, versioned seat edit, held-show cancel blocked, filtered lookup, history-preserving cancel`);
  }
  actor = 1;
  for (const customerId of [1,2,4,2147483647]) await call(1, 'POST', '/admin/bookings', { customerId, showtimeId: show.id, seatIds: [createdSeats[6]] }, 400);
  await call(1, 'POST', '/admin/bookings', { customerId:5, showtimeId:show.id, seatIds:[createdSeats[6]], status:'Đã thanh toán' }, 400);
  await call(2, 'POST', '/manager/bookings', { customerId:5, showtimeId:outside.SuatChieuID, seatIds:[createdSeats[6]] }, 403);
  const raceBody = { showtimeId: show.id, seatIds: [createdSeats[6]] };
  const race = await Promise.all([call(1,'POST','/admin/bookings',{ ...raceBody, customerId:5 },null), call(2,'POST','/manager/bookings',{ ...raceBody, customerId:6 },null)]); assert.deepEqual(race.map((r) => r.status).sort(), [201,409]);
  const winner = race.find((r) => r.status === 201).data.orderId; record('4D actual simultaneous same-seat requests: one 201 and one 409');
  const winnerBefore = (await call(1,'GET',`/admin/bookings/${winner}`)).data.order;
  const editRace = await Promise.all([call(1,'PUT',`/admin/bookings/${winner}/seats`,{ seatIds:[createdSeats[7]], expectedTicketIds:winnerBefore.tickets.map((t) => t.id) },null), call(2,'PUT',`/manager/bookings/${winner}/seats`,{ seatIds:[createdSeats[8]], expectedTicketIds:winnerBefore.tickets.map((t) => t.id) },null)]); assert.deepEqual(editRace.map((r) => r.status).sort(), [200,409]); assert.equal(editRace.find((r) => r.status === 409).data.error.code,'ORDER_CHANGED'); record('4D actual simultaneous edits: one 200, one ORDER_CHANGED');
  const pendingPayment = (await call(winnerBefore.user.id,'POST',`/orders/${winner}/payments`,{ paymentMethod:'MOMO' },201)).data.payment;
  await call(1,'POST',`/admin/bookings/${winner}/cancel`,{},409); await call(2,'PUT',`/manager/bookings/${winner}/seats`,{ seatIds:[createdSeats[9]],expectedTicketIds:[1] },409);
  await call(winnerBefore.user.id,'POST',`/orders/${winner}/payments/${pendingPayment.id}/result`,{ status:'Thất bại' }); await call(1,'POST',`/admin/bookings/${winner}/cancel`,{}); record('4D pending payment protects seat editing and cancellation; failed attempt remains history');
  const paid = (await call(1,'GET',`/admin/bookings?cinemaId=${cinemaId}&status=${encodeURIComponent('Đã thanh toán')}`)).data.orders[0]; assert.ok(paid,'Existing paid order fixture required');
  const paidBefore = (await call(1,'GET',`/admin/bookings/${paid.DonDatVeID}`)).data.order;
  for (const who of [1,2]) { await call(who,'POST',`/${who===1?'admin':'manager'}/bookings/${paidBefore.id}/cancel`,{},409); await call(who,'PUT',`/${who===1?'admin':'manager'}/bookings/${paidBefore.id}/seats`,{ seatIds:[createdSeats[10]],expectedTicketIds:[1] },409); }
  assert.deepEqual((await call(1,'GET',`/admin/bookings/${paidBefore.id}`)).data.order,paidBefore); record('4D existing paid ticket/order/payment history unchanged after denied staff mutations');
  const foreignOrders = (await call(1,'GET',`/admin/bookings?cinemaId=${outside.RapID}`)).data.orders; assert.ok(foreignOrders.length);
  for (const method of ['GET','PUT','POST']) await call(2,method,`/manager/bookings/${foreignOrders[0].DonDatVeID}${method==='PUT'?'/seats':method==='POST'?'/cancel':''}`,method==='PUT'?{ seatIds:[createdSeats[10]],expectedTicketIds:[1] }:method==='POST'?{}:null,403);
  const hidden = (await call(2,'GET',`/manager/bookings?search=${foreignOrders[0].DonDatVeID}`)).data; assert.ok(hidden.orders.every((row) => row.DonDatVeID !== foreignOrders[0].DonDatVeID && managerCinemas.some((cinema) => cinema.id === row.RapID))); record('4C/D forged foreign order read/edit/cancel and create are denied by actual API/SP');
  // No held orders remain on the owned show. Cancel through Manager controller.
  actor = 2; await managerOperation.reload(); managerOperation.requestCancel(managerOperation.getSnapshot().resource.rows.find((r) => r.id === show.id)); await managerOperation.cancel(); assert.equal(managerOperation.getSnapshot().resource.rows.find((r) => r.id === show.id).status,'Đã hủy'); record('4A actual Manager cancellation succeeds after business holds cleared');
  evidence.status = 'PASS';
} catch (error) { evidence.status = 'FAIL'; evidence.error = error.message; process.exitCode = 1; }
finally {
  for (const controller of controllers) controller.dispose();
  globalThis.fetch = nativeFetch; delete globalThis.sessionStorage;
  if (pool && roomId) {
    try {
      const owner = (await pool.request().input('Room',sql.Int,roomId).query('SELECT TenPhong FROM dbo.PHONGCHIEU WHERE PhongID=@Room')).recordset[0]; assert.equal(owner?.TenPhong,name);
      // Offline cleanup is strictly scoped to this newly-created, unique room and its children.
      await pool.request().input('Room',sql.Int,roomId).input('Name',sql.NVarChar(100),name).query(`SET XACT_ABORT ON; BEGIN TRANSACTION;
        IF NOT EXISTS(SELECT 1 FROM dbo.PHONGCHIEU WHERE PhongID=@Room AND TenPhong=@Name) THROW 51980,N'Fixture owner mismatch',1;
        DECLARE @Orders TABLE(id int); INSERT @Orders SELECT d.DonDatVeID FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID WHERE s.PhongID=@Room;
        IF EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID IN(SELECT id FROM @Orders) AND NguoiDungID NOT IN(5,6)) THROW 51981,N'Unexpected fixture customer',1;
        DELETE dbo.THANHTOAN WHERE DonDatVeID IN(SELECT id FROM @Orders);
        DELETE dbo.CHITIETVE WHERE DonDatVeID IN(SELECT id FROM @Orders);
        DELETE dbo.DONDATVE WHERE DonDatVeID IN(SELECT id FROM @Orders);
        DELETE dbo.SUATCHIEU WHERE PhongID=@Room; DELETE dbo.GHE WHERE PhongID=@Room; DELETE dbo.PHONGCHIEU WHERE PhongID=@Room; COMMIT TRANSACTION;`);
      evidence.cleanup.push({ roomId, ownerName:name, remaining:(await pool.request().input('Room',sql.Int,roomId).query('SELECT COUNT(*) AS Remaining FROM dbo.PHONGCHIEU WHERE PhongID=@Room')).recordset[0].Remaining, verdict:'PASS' });
    } catch (error) { evidence.cleanup.push({ roomId,error:error.message,verdict:'FAIL' }); evidence.status='FAIL'; process.exitCode=1; }
  }
  if (pool && priceId) {
    try { await pool.request().input('Price',sql.Int,priceId).query("DELETE dbo.BANGGIA WHERE GiaID=@Price AND NgayBatDau='2099-01-01' AND NgayKetThuc='2099-01-02';"); const remaining = (await pool.request().input('Price',sql.Int,priceId).query('SELECT COUNT(*) AS Remaining FROM dbo.BANGGIA WHERE GiaID=@Price')).recordset[0].Remaining; assert.equal(remaining,0); evidence.cleanup.push({ priceId,remaining,verdict:'PASS' }); }
    catch (error) { evidence.cleanup.push({ priceId,error:error.message,verdict:'FAIL' }); evidence.status='FAIL'; process.exitCode=1; }
  }
  await vite?.close(); if (server) await new Promise((resolve) => server.close(resolve)); await closePool();
  fs.writeFileSync(new URL('./integration.json',import.meta.url),JSON.stringify(evidence,null,2)); console.log(JSON.stringify({ status:evidence.status,cases:evidence.cases.length,assertions:evidence.assertions.length,cleanup:evidence.cleanup,error:evidence.error }));
}
