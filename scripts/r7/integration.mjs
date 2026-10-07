// Writes only to an explicitly named disposable R7 fixture, never to main.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { connect, ask, sql, root, write } from '../r3a/common.mjs';
import { credentials } from '../db/lib.mjs';
const database = process.argv.find(arg => arg.startsWith('--database='))?.slice(11);
assert.match(database ?? '', /^CinemaBookingDB_R0_R1_R2_R5R7[A-Za-z0-9_]+$/);
Object.assign(process.env, credentials(), { DB_DATABASE: database });
process.chdir(path.join(root, 'backend'));
const { createApp } = await import('../../backend/src/app.js');
const { closePool } = await import('../../backend/src/db/pool.js');
const pool = await connect(database), server = createApp().listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`, requests = [], checks = [], tokens = {}, ids = {};
const report = { status: 'RUNNING', database, requests, checks };
const save = () => write(path.join(root, 'audit/remediation/r7/evidence/integration.json'), report);
const check = (gap, name, value) => { assert.ok(value, name); checks.push({ gap, name, status: 'PASS' }); };
async function api(gap, route, { actor = 'manager', method = 'GET', body, status = 200 } = {}) {
  const response = await fetch(base + route, { method,
    headers: { ...(tokens[actor] ? { Authorization: 'Bearer ' + tokens[actor] } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
  const data = await response.json();
  requests.push({ gap, route, method, status: response.status, error: data.error?.code });
  assert.equal(response.status, status, `${gap} ${route}: ${JSON.stringify(data)}`);
  return data.data ?? data;
}
async function query(source, values = {}) {
  const request = pool.request();
  for (const [name, value] of Object.entries(values)) request.input(name, typeof value === 'number' ? sql.Int : sql.NVarChar(sql.MAX), value);
  return (await request.query(source)).recordset;
}
const prefix = 'R7-' + crypto.randomUUID().slice(0, 8);
async function grants(role, permissions, operation) {
  const roleID = (await query('SELECT VaiTroID FROM dbo.VAITRO WHERE MaVaiTro=@Role', { Role: role }))[0].VaiTroID;
  const old = await query('SELECT QuyenID,NgayGan FROM dbo.VAITRO_QUYEN WHERE VaiTroID=@ID', { ID: roleID });
  await query('DELETE FROM dbo.VAITRO_QUYEN WHERE VaiTroID=@ID', { ID: roleID });
  for (const permission of permissions) await query('INSERT dbo.VAITRO_QUYEN(VaiTroID,QuyenID) SELECT @ID,QuyenID FROM dbo.QUYEN WHERE MaQuyen=@Permission', { ID: roleID, Permission: permission });
  try { await operation(); }
  finally {
    await query('DELETE FROM dbo.VAITRO_QUYEN WHERE VaiTroID=@ID', { ID: roleID });
    for (const row of old) await pool.request().input('Role', sql.Int, roleID).input('Permission', sql.Int, row.QuyenID).input('Date', sql.DateTime2, row.NgayGan)
      .query('INSERT dbo.VAITRO_QUYEN(VaiTroID,QuyenID,NgayGan) VALUES(@Role,@Permission,@Date)');
  }
}
try {
  for (const [actor, email] of Object.entries({ manager: 'manager.q1@cinemadb.vn', admin: 'admin@cinemadb.vn', support: 'cskh@cinemadb.vn', customer: 'khachhang1@gmail.com', customer2: 'khachhang2@gmail.com' })) {
    const login = await api(null, '/auth/login', { actor: 'public', method: 'POST', body: { Email: email, MatKhau: '123456' } });
    tokens[actor] = login.token; ids[actor] = login.user.userId;
  }
  const room = (await api('GAP-002', '/manager/cinemas/1/rooms', { method: 'POST', status: 201, body: { name: prefix, type: '2D' } })).room;
  await api('GAP-002', `/manager/rooms/${room.id}`, { method: 'PUT', body: { name: prefix + '-edited', type: 'IMAX', status: 'Bảo trì' } });
  await api('GAP-002', `/manager/rooms/${room.id}`, { method: 'PUT', body: { name: prefix + '-edited', type: 'IMAX', status: 'Hoạt động' } });
  check('GAP-002', 'Room name/type/status persist on API and DB reload', (await api('GAP-002', '/manager/cinemas/1/rooms')).rooms.some(row => row.id === room.id && row.type === 'IMAX' && row.name.endsWith('-edited')));
  const seats = [];
  for (let number = 1; number <= 3; number++) seats.push((await api('GAP-002', `/manager/rooms/${room.id}/seats`, { method: 'POST', status: 201, body: { row: 'R7', number, type: 'Thường' } })).seat);
  await api('GAP-002', `/manager/seats/${seats[0].id}`, { method: 'PUT', body: { type: 'VIP', status: 'Bảo trì' } });
  await api('GAP-002', `/manager/seats/${seats[0].id}`, { method: 'PUT', body: { type: 'VIP', status: 'Hoạt động' } });
  check('GAP-002', 'Seat type/status persist without moving seat', (await api('GAP-002', `/manager/rooms/${room.id}/seats`)).seats.some(row => row.id === seats[0].id && row.type === 'VIP' && row.roomId === room.id));
  await api('GAP-002', '/manager/rooms/4', { method: 'PUT', body: { name: 'Forbidden', type: '2D', status: 'Hoạt động' }, status: 403 });
  await api('GAP-002', '/manager/seats/121', { method: 'PUT', body: { type: 'VIP', status: 'Hoạt động' }, status: 403 });
  await grants('QUAN_LY_RAP', ['QL_GHE'], async () => {
    await api('GAP-002', `/manager/rooms/${room.id}/seats`);
    await api('GAP-002', `/manager/seats/${seats[1].id}`, { method: 'PUT', body: { type: 'Thường', status: 'Hoạt động' } });
    await api('GAP-002', `/manager/rooms/${room.id}`, { method: 'PUT', body: { name: prefix, type: '2D', status: 'Hoạt động' }, status: 403 });
  });
  await grants('QUAN_LY_RAP', ['QL_PHONG'], async () => {
    await api('GAP-002', `/manager/rooms/${room.id}`, { method: 'PUT', body: { name: prefix + '-edited', type: 'IMAX', status: 'Hoạt động' } });
    await api('GAP-002', `/manager/seats/${seats[1].id}`, { method: 'PUT', body: { type: 'Thường', status: 'Hoạt động' }, status: 403 });
  });
  const start = new Date(Date.now() + 40 * 86400000);
  const input = { movieId: 1, roomId: room.id, startsAt: start.toISOString(), endsAt: new Date(+start + 166 * 60000).toISOString(), format: 'IMAX', basePrice: 80000 };
  const show = (await api('GAP-001', '/manager/showtimes', { method: 'POST', status: 201, body: input })).showtime;
  const { roomId, ...update } = input;
  const edited = { ...update, startsAt: new Date(+start + 3600000).toISOString(), endsAt: new Date(+start + 3600000 + 166 * 60000).toISOString(), basePrice: 90000, status: 'Đóng bán' };
  await api('GAP-001', `/manager/showtimes/${show.id}`, { method: 'PUT', body: edited });
  const reload = (await api('GAP-001', '/manager/cinemas/1/showtimes')).showtimes.find(row => row.id === show.id);
  check('GAP-001', 'Full allowed showtime edit persists exact UTC instant and immutable room', reload.startsAt === edited.startsAt && reload.basePrice === 90000 && reload.roomId === room.id && reload.status === 'Đóng bán');
  await api('GAP-001', `/manager/showtimes/${show.id}`, { method: 'PUT', body: { ...edited, roomId: room.id }, status: 400 });
  await api('GAP-001', '/manager/showtimes/4', { method: 'PUT', body: edited, status: 403 });
  for (const body of [{ ...edited, status: 'bad' }, { ...edited, endsAt: edited.startsAt }, { ...edited, startsAt: edited.startsAt.slice(0, -1) }, { ...edited, endsAt: new Date(Date.parse(edited.startsAt) + 60000).toISOString() }]) {
    await api('GAP-001', `/manager/showtimes/${show.id}`, { method: 'PUT', body, status: 400 });
  }
  await api('GAP-001', '/manager/showtimes', { method: 'POST', body: { ...input, startsAt: new Date(+start + 4 * 3600000).toISOString(), endsAt: new Date(+start + 4 * 3600000 + 166 * 60000).toISOString() }, status: 201 });
  await api('GAP-001', `/manager/showtimes/${show.id}`, { method: 'PUT', body: { ...edited, startsAt: new Date(+start + 4 * 3600000).toISOString(), endsAt: new Date(+start + 4 * 3600000 + 166 * 60000).toISOString() }, status: 409 });
  await api('GAP-001', `/manager/showtimes/${show.id}`, { method: 'PUT', body: { ...edited, status: 'Mở bán' } });
  const showDay = (await query('SELECT CONVERT(varchar(10),dbo.fn_NgayKinhDoanh(ThoiGianBatDau),23) AS day FROM dbo.SUATCHIEU WHERE SuatChieuID=@ID', { ID: show.id }))[0].day;
  const conditions = { seatType: 'VIP', dayType: 'Tất cả', format: 'IMAX', surcharge: 5000, startsOn: showDay, endsOn: null };
  const pricing = (await api('GAP-003', '/manager/cinemas/1/pricing', { method: 'POST', body: conditions, status: 201 })).pricing;
  await api('GAP-003', `/manager/pricing/${pricing.id}`, { method: 'PUT', body: { surcharge: 6000, status: 'Áp dụng' } });
  await api('GAP-003', '/manager/cinemas/2/pricing', { method: 'POST', body: conditions, status: 403 });
  await api('GAP-003', `/manager/pricing/${pricing.id}`, { method: 'PUT', body: { ...conditions, endsOn: '2000-01-01', status: 'Áp dụng' }, status: 400 });
  const firstOrder = (await api('GAP-003', '/bookings', { actor: 'customer', method: 'POST', body: { showtimeId: show.id, seatIds: [seats[0].id], products: [{ productId: 1, quantity: 2 }] }, status: 201 })).booking.id;
  const firstSnapshot = await query('SELECT TongTienVe,TongTienDoAn,TienGiamGia FROM dbo.DONDATVE WHERE DonDatVeID=@ID', { ID: firstOrder });
  const firstTickets = await query('SELECT VeID,GiaVe FROM dbo.CHITIETVE WHERE DonDatVeID=@ID', { ID: firstOrder });
  await api('GAP-001', `/manager/showtimes/${show.id}`, { method: 'PUT', body: { ...edited, status: 'Mở bán', startsAt: new Date(+start + 7200000).toISOString(), endsAt: new Date(+start + 7200000 + 166 * 60000).toISOString() }, status: 409 });
  await api('GAP-002', `/manager/seats/${seats[0].id}`, { method: 'PUT', body: { type: 'Thường', status: 'Hỏng' }, status: 409 });
  const fullPricing = { ...conditions, seatType: 'Thường', surcharge: 12345, endsOn: showDay, status: 'Áp dụng' };
  const changedDimensions = { ...conditions, seatType: 'Đôi', dayType: 'Tất cả', format: '3D', surcharge: 54321,
    startsOn: '2034-03-01', endsOn: '2034-12-31', status: 'Tạm dừng' };
  await api('GAP-003', `/manager/pricing/${pricing.id}`, { method: 'PUT', body: changedDimensions });
  const dimensionsReload = (await api('GAP-003', '/manager/cinemas/1/pricing')).pricing.find(row => row.id === pricing.id);
  check('GAP-003', 'Every pricing dimension/date actually changes and reloads', Object.entries(changedDimensions).every(([key, value]) => dimensionsReload[key] === value));
  await api('GAP-003', `/manager/pricing/${pricing.id}`, { method: 'PUT', body: fullPricing });
  const loadedPricing = (await api('GAP-003', '/manager/cinemas/1/pricing')).pricing.find(row => row.id === pricing.id);
  check('GAP-003', 'Dimensions, surcharge, effective DATE_ONLY and status persist', Object.entries(fullPricing).every(([key, value]) => loadedPricing[key] === value));
  assert.deepEqual(await query('SELECT TongTienVe,TongTienDoAn,TienGiamGia FROM dbo.DONDATVE WHERE DonDatVeID=@ID', { ID: firstOrder }), firstSnapshot);
  assert.deepEqual(await query('SELECT VeID,GiaVe FROM dbo.CHITIETVE WHERE DonDatVeID=@ID', { ID: firstOrder }), firstTickets);
  check('GAP-003', 'Old order and ticket snapshots unchanged after full pricing edit', true);
  const secondOrder = (await api('GAP-003', '/bookings', { actor: 'customer2', method: 'POST', body: { showtimeId: show.id, seatIds: [seats[1].id], products: [] }, status: 201 })).booking.id;
  const computed = (await query('SELECT dbo.fn_TinhGiaVe(@Show,@Seat) AS price', { Show: show.id, Seat: seats[1].id }))[0].price;
  check('GAP-003', 'New booking uses current pricing function result', (await query('SELECT TongTienVe FROM dbo.DONDATVE WHERE DonDatVeID=@ID', { ID: secondOrder }))[0].TongTienVe === computed);
  await api('GAP-003', '/manager/cinemas/1/pricing', { method: 'POST', body: { ...fullPricing, status: undefined }, status: 409 });
  const foreignPrice = (await query('SELECT TOP(1) GiaID FROM dbo.BANGGIA WHERE RapID=2'))[0].GiaID;
  await api('GAP-003', `/manager/pricing/${foreignPrice}`, { method: 'PUT', body: fullPricing, status: 403 });
  await api('GAP-003', '/manager/pricing/2147483647', { method: 'PUT', body: fullPricing, status: 404 });
  await api('GAP-003', `/manager/pricing/${pricing.id}`, { method: 'PUT', body: { ...fullPricing, endsOn: null, status: 'Tạm dừng' } });
  check('GAP-003', 'Explicit null reopens end range and status remains hydrated', (await api('GAP-003', '/manager/cinemas/1/pricing')).pricing.find(row => row.id === pricing.id).endsOn === null);
  const paymentIDs = [];
  for (const status of ['Thất bại', 'Thành công']) {
    const payment = (await api('GAP-005', `/orders/${firstOrder}/payments`, { actor: 'customer', method: 'POST', body: { paymentMethod: 'MOMO' }, status: 201 })).payment;
    paymentIDs.push(payment.id);
    await api('GAP-005', `/orders/${firstOrder}/payments/${payment.id}/result`, { actor: 'customer', method: 'POST', body: { status } });
  }
  await pool.request().input('NguoiDungID', sql.Int, ids.customer2).input('DonDatVeID', sql.Int, secondOrder).execute('dbo.sp_Order_Cancel');
  const paymentHistory = await query('SELECT * FROM dbo.THANHTOAN WHERE DonDatVeID=@ID ORDER BY ThanhToanID', { ID: firstOrder });
  const complaintBody = { type: 'Hỗ trợ', title: prefix, content: 'R7 reference fixture' };
  const complaint = (await api('GAP-005', '/complaints', { actor: 'customer', method: 'POST', body: { ...complaintBody, orderId: firstOrder }, status: 201 })).complaint;
  const noOrder = (await api('GAP-005', '/complaints', { actor: 'customer', method: 'POST', body: complaintBody, status: 201 })).complaint;
  await api('GAP-005', '/complaints', { actor: 'customer2', method: 'POST', body: { ...complaintBody, orderId: firstOrder }, status: 404 });
  const referencePath = `/support/complaints/${complaint.id}/order-reference`;
  const reference = (await api('GAP-005', referencePath, { actor: 'support' })).order;
  check('GAP-005', 'Complaint-only reference includes full summary/tickets/food/payment attempts', reference.id === firstOrder && reference.tickets.length === 1 && reference.products.length === 1
    && reference.payments.length === 2 && reference.payments.map(row => row.id).join(',') === paymentIDs.join(',') && reference.user.id === ids.customer
    && reference.roomId === room.id && reference.movieId === 1 && reference.compensation === null);
  check('GAP-005', 'No password/hash or authority data exported', !/MatKhau|password|token/i.test(JSON.stringify(reference)));
  check('GAP-005', 'Unlinked complaint returns null order', (await api('GAP-005', `/support/complaints/${noOrder.id}/order-reference`, { actor: 'support' })).order === null);
  await api('GAP-005', '/support/complaints/2147483647/order-reference', { actor: 'support', status: 404 });
  await api('GAP-005', `/support/orders/${firstOrder}`, { actor: 'support', status: 404 });
  for (const permissions of [['QL_KHIEUNAI'], ['TRA_CUU_DON']]) await grants('CSKH', permissions, async () => {
    await api('GAP-005', referencePath, { actor: 'support', status: 403 });
    await assert.rejects(pool.request().input('NguoiDungID', sql.Int, ids.support).input('KhieuNaiID', sql.Int, complaint.id).execute('dbo.sp_Support_Complaint_GetOrderReference'), error => error.number === 50302);
  });
  await api('GAP-005', `/admin/complaints/${complaint.id}/order-reference`, { actor: 'admin' });
  await api('GAP-005', referencePath, { actor: 'customer', status: 403 });
  assert.deepEqual(await query('SELECT * FROM dbo.THANHTOAN WHERE DonDatVeID=@ID ORDER BY ThanhToanID', { ID: firstOrder }), paymentHistory);
  check('GAP-005', 'Reference reads preserve every payment history row', true);
  const paidDate = (await query('SELECT CONVERT(varchar(10),dbo.fn_NgayKinhDoanh(NgayThanhToan),23) AS day FROM dbo.THANHTOAN WHERE ThanhToanID=@ID', { ID: paymentIDs[1] }))[0].day;
  await api('GAP-004', '/manager/cinemas/1/revenue');
  const revenue = (await api('GAP-004', `/manager/cinemas/1/revenue?fromDate=${paidDate}&toDate=${paidDate}`)).revenue;
  const sqlRevenue = (await pool.request().input('NguoiDungID', sql.Int, ids.manager).input('RapID', sql.Int, 1).input('TuNgay', sql.Date, paidDate).input('DenNgay', sql.Date, paidDate).execute('dbo.sp_Manager_Revenue')).recordset;
  check('GAP-004', 'One-day API revenue equals scoped SP business-date aggregate', revenue.length === sqlRevenue.length && revenue[0]?.totalRevenue === Number(sqlRevenue[0]?.DoanhThuThucTe) && revenue[0]?.date === paidDate);
  await api('GAP-004', `/manager/cinemas/1/revenue?fromDate=2000-01-01&toDate=${paidDate}`);
  await api('GAP-004', '/manager/cinemas/1/revenue?fromDate=2027-01-02&toDate=2027-01-01', { status: 400 });
  await api('GAP-004', '/manager/cinemas/2/revenue', { status: 403 });
  await api('GAP-005', `/manager/showtimes/${show.id}/cancel`, { method: 'POST', body: {} });
  const cancelled = (await api('GAP-005', referencePath, { actor: 'support' })).order;
  check('GAP-005', 'Cancelled ticket history and event compensation are visible with paid attempts intact', cancelled.status === 'Đã hủy' && cancelled.tickets[0].status === 'Đã hủy'
    && cancelled.compensation?.points > 0 && cancelled.payments.length === 2 && cancelled.payments[1].status === 'Thành công');
  assert.deepEqual(await query('SELECT * FROM dbo.THANHTOAN WHERE DonDatVeID=@ID ORDER BY ThanhToanID', { ID: firstOrder }), paymentHistory);
  check('GAP-005', 'R2 cancellation/reference do not alter payment history', true);
  const galleryCinema = (await api('GAP-006', '/admin/cinemas', { actor: 'admin', method: 'POST', body: { name: prefix, address: 'Fixture', city: 'Fixture', phone: null, description: 'R7 gallery' } })).cinema;
  const cinemaID = galleryCinema.RapID;
  check('GAP-006', 'Zero image gallery API', (await api('GAP-006', `/cinemas/${cinemaID}/images`, { actor: 'public' })).images.length === 0);
  const imageBody = { url: '/favicon.svg', description: 'R7 image', displayOrder: 9, status: 'Hoạt động' };
  await api('GAP-006', `/admin/cinemas/${cinemaID}/images`, { actor: 'admin', method: 'POST', status: 201, body: { ...imageBody, cover: true } });
  check('GAP-006', 'Single public active cover', (await api('GAP-006', `/cinemas/${cinemaID}/images`, { actor: 'public' })).images[0].cover === true);
  await api('GAP-006', `/admin/cinemas/${cinemaID}/images`, { actor: 'admin', method: 'POST', status: 201, body: { ...imageBody, displayOrder: 1, cover: false } });
  await api('GAP-006', `/admin/cinemas/${cinemaID}/images`, { actor: 'admin', method: 'POST', status: 201, body: { ...imageBody, url: '/private', displayOrder: 0, cover: false, status: 'Tạm ẩn' } });
  const images = (await api('GAP-006', `/cinemas/${cinemaID}/images`, { actor: 'public' })).images;
  check('GAP-006', 'Public API returns only active images in display order and one cover', images.length === 2 && images[0].displayOrder === 1 && images.filter(image => image.cover).length === 1 && !images.some(image => image.url === '/private'));
  report.status = 'PASS'; report.fixtureIDs = { room: room.id, showtime: show.id, pricing: pricing.id, orders: [firstOrder, secondOrder], complaints: [complaint.id, noOrder.id], galleryCinema: cinemaID };
  save(); console.log(`PASS R7: ${requests.length} HTTP requests, ${checks.length} DB/contract checks, GAP-001..006`);
} catch (error) { report.status = 'FAIL'; report.error = error.message; save(); throw error; }
finally { await new Promise(resolve => server.close(resolve)); await closePool(); await pool.close(); }
