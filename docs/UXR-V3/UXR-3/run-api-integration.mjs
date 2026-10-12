// Offline acceptance only. Existing application, REST, authorization and SP are unchanged.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { credentials } from '../../../scripts/db/lib.mjs';
import { facilityPayload } from '../../../frontend/src/features/facilities/facilityModel.js';

const database = 'CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2';
Object.assign(process.env, credentials(), { DB_DATABASE: database, JWT_SECRET: crypto.randomBytes(48).toString('hex'), JWT_EXPIRES_IN: '10m', NODE_ENV: 'test' });
const { getPool, closePool } = await import('../../../backend/src/db/pool.js');
const { createApp } = await import('../../../backend/src/app.js');
const { issueToken } = await import('../../../backend/src/utils/jwt.js');
const evidence = { timestamp: new Date().toISOString(), level: 'real loopback HTTP -> existing middleware/services -> isolated SQL Server SP', cases: [], cleanup: [], status: 'RUNNING' };
const cleanup = []; let server, cleanupOne;
try {
  const pool = await getPool();
  evidence.database = (await pool.request().query('SELECT DB_NAME() AS DatabaseName,DB_ID() AS DatabaseID')).recordset[0];
  assert.equal(evidence.database.DatabaseName, database); assert.equal(evidence.database.DatabaseID, 9);
  const actors = (await pool.request().query('SELECT n.NguoiDungID AS id,v.MaVaiTro AS role FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE n.NguoiDungID IN (1,2,3)')).recordset;
  assert.equal(actors.find((row) => row.id === 1)?.role, 'ADMIN');
  assert.equal(actors.find((row) => row.id === 2)?.role, 'QUAN_LY_RAP');
  const history = (await pool.request().query('SELECT TOP(1) g.GheID AS id,g.PhongID AS roomId,g.LoaiGhe AS type,g.TrangThai AS status FROM dbo.GHE g JOIN dbo.PHONGCHIEU p ON p.PhongID=g.PhongID WHERE p.RapID=1 AND EXISTS(SELECT 1 FROM dbo.CHITIETVE ct WHERE ct.GheID=g.GheID) ORDER BY g.GheID')).recordset[0];
  const outside = (await pool.request().query('SELECT TOP(1) g.GheID AS id,g.PhongID AS roomId FROM dbo.GHE g JOIN dbo.PHONGCHIEU p ON p.PhongID=g.PhongID WHERE p.RapID=2 ORDER BY g.GheID')).recordset[0];
  assert.ok(history && outside, 'Historical and outside-assignment fixtures must exist');
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const tokens = new Map([1,2,3].map((id) => [id, issueToken(id).token]));
  async function call(actor, method, path, body, expected = 200, scenario = path) {
    const response = await fetch(`${origin}/api${path}`, { method, headers: { Authorization: `Bearer ${tokens.get(actor)}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    evidence.cases.push({ scenario, actorRole: actors.find((row) => row.id === actor)?.role, method, path, status: response.status, ...(data.error ? { code: data.error.code } : {}), verdict: response.status === expected ? 'PASS' : 'FAIL' });
    assert.equal(response.status, expected, `${scenario}: ${data.error?.code ?? 'unexpected status'}`); return data;
  }
  cleanupOne = async (item) => {
    if (item.table === 'RAPCHIEUPHIM') {
      const owner = (await pool.request().query(`SELECT TenRap AS name FROM dbo.RAPCHIEUPHIM WHERE RapID=${item.id}`)).recordset[0];
      assert.ok(owner?.name.startsWith('UXR3_HTTP_'));
      const images = (await call(1, 'GET', `/admin/cinemas/${item.id}/images`)).images;
      for (const image of images) {
        assert.ok(image.URL.startsWith('/uxr3-http-test-') && image.RapID === item.id);
        await call(1, 'DELETE', `/admin/cinemas/${item.id}/images/${image.HinhAnhRapID}`, null, 200, 'Recover image fixture owned by test cinema');
      }
    }
    await call(item.actor, 'DELETE', item.path, null, 200, 'Fixture cleanup delete');
    const remaining = (await pool.request().query(`SELECT COUNT(*) AS remaining FROM dbo.${item.table} WHERE ${item.column}=${item.id}`)).recordset[0].remaining;
    assert.equal(remaining, 0); evidence.cleanup.push({ path: item.path, remaining, verdict: 'PASS' });
  };
  const previousPath = new URL('./api-integration.json', import.meta.url);
  if (fs.existsSync(previousPath)) {
    const previous = JSON.parse(fs.readFileSync(previousPath, 'utf8'));
    if (previous.remainingOwnedFixtures?.length) {
      assert.equal(previous.database.DatabaseName, database); assert.equal(previous.database.DatabaseID, 9);
      for (const item of [...previous.remainingOwnedFixtures].reverse()) {
        assert.ok(Number.isInteger(item.id) && item.id > 0 && item.actor === 1);
        let recovered;
        if (item.path === `/admin/seats/${item.id}`) {
          const owner = (await pool.request().query(`SELECT p.TenPhong AS name FROM dbo.GHE g JOIN dbo.PHONGCHIEU p ON p.PhongID=g.PhongID WHERE g.GheID=${item.id}`)).recordset[0];
          assert.ok(owner?.name.startsWith('UXR3_HTTP_')); recovered = { ...item, table: 'GHE', column: 'GheID' };
        } else if (item.path === `/admin/rooms/${item.id}`) {
          const owner = (await pool.request().query(`SELECT TenPhong AS name FROM dbo.PHONGCHIEU WHERE PhongID=${item.id}`)).recordset[0];
          assert.ok(owner?.name.startsWith('UXR3_HTTP_')); recovered = { ...item, table: 'PHONGCHIEU', column: 'PhongID' };
        } else if (item.path === `/admin/cinemas/${item.id}`) {
          const owner = (await pool.request().query(`SELECT TenRap AS name FROM dbo.RAPCHIEUPHIM WHERE RapID=${item.id}`)).recordset[0];
          assert.ok(owner?.name.startsWith('UXR3_HTTP_')); recovered = { ...item, table: 'RAPCHIEUPHIM', column: 'RapID' };
        } else throw new Error('Previous fixture recovery requires review');
        await cleanupOne(recovered);
      }
    }
  }
  const own = await call(2, 'GET', '/manager/cinemas'); assert.ok(own.cinemas.some((row) => row.id === 1)); assert.ok(!own.cinemas.some((row) => row.id === 2));
  const rooms = await call(2, 'GET', '/manager/cinemas/1/rooms'); assert.ok(rooms.rooms.every((row) => row.cinemaId === 1));
  const seats = await call(2, 'GET', `/manager/rooms/${history.roomId}/seats`); assert.ok(seats.seats.every((row) => row.roomId === history.roomId));
  await call(2, 'GET', '/manager/cinemas/2/rooms', null, 403, 'Forged cinema scope denied');
  await call(2, 'GET', `/manager/rooms/${outside.roomId}/seats`, null, 403, 'Forged room scope denied');
  await call(2, 'PUT', `/manager/seats/${outside.id}`, { type: 'VIP', status: 'Hoạt động' }, 403, 'Forged seat mutation denied');
  await call(2, 'GET', '/admin/cinemas', null, 403, 'Manager cannot enter Admin API');
  await call(1, 'GET', '/manager/cinemas', null, 403, 'Admin cannot impersonate Manager role');
  const type = history.type === 'VIP' ? 'Thường' : 'VIP';
  await call(2, 'PUT', `/manager/seats/${history.id}`, { type, status: history.status }, 409, 'Manager history type change rejected');
  await call(2, 'DELETE', `/manager/seats/${history.id}`, null, 409, 'Manager history deletion rejected');
  await call(1, 'PUT', `/admin/seats/${history.id}`, { type, status: history.status }, 409, 'Admin history type change rejected');
  await call(1, 'DELETE', `/admin/seats/${history.id}`, null, 409, 'Admin history deletion rejected');
  const unchanged = (await pool.request().query(`SELECT LoaiGhe AS type,TrangThai AS status FROM dbo.GHE WHERE GheID=${history.id}`)).recordset[0]; assert.deepEqual(unchanged, { type: history.type, status: history.status });
  await call(1, 'PUT', '/admin/seats/2147483647', { type: 'VIP', status: 'Hoạt động' }, 404, 'Missing seat distinguishes 404');
  await call(1, 'DELETE', '/admin/cinemas/1', null, 409, 'Related cinema data blocks deletion');
  const name = `UXR3_HTTP_${crypto.randomUUID().slice(0, 12)}`;
  const cinema = (await call(1, 'POST', '/admin/cinemas', facilityPayload('cinemas', { name, address: 'Isolated test address', city: 'Test', phone: '', description: '', operatingSince: '' }))).cinema;
  assert.ok(Number.isInteger(cinema.RapID)); const cid = cinema.RapID;
  cleanup.push({ actor: 1, path: `/admin/cinemas/${cid}`, table: 'RAPCHIEUPHIM', column: 'RapID', id: cid });
  await call(1, 'PUT', `/admin/cinemas/${cid}`, { name, address: 'Updated isolated test address', city: 'Test', status: 'Bảo trì' });
  const createdRoom = (await call(1, 'POST', '/admin/rooms', { cinemaId: cid, name, type: '2D' })).room;
  const rid = createdRoom.PhongID; assert.ok(Number.isInteger(rid));
  cleanup.push({ actor: 1, path: `/admin/rooms/${rid}`, table: 'PHONGCHIEU', column: 'PhongID', id: rid });
  await call(1, 'PUT', `/admin/rooms/${rid}`, { name, type: '3D', status: 'Hoạt động' });
  const createdSeat = (await call(1, 'POST', '/admin/seats', { roomId: rid, row: 'TEST', number: 1, type: 'Thường' })).seat;
  const sid = createdSeat.GheID; assert.ok(Number.isInteger(sid));
  cleanup.push({ actor: 1, path: `/admin/seats/${sid}`, table: 'GHE', column: 'GheID', id: sid });
  await call(1, 'PUT', `/admin/seats/${sid}`, { type: 'VIP', status: 'Bảo trì' });
  const scoped = await call(1, 'GET', `/admin/rooms?cinemaId=${cid}`);
  assert.equal(scoped.rooms.length, 1); assert.equal(scoped.rooms[0].TongSoGhe, 1);
  const scopedSeats = await call(1, 'GET', `/admin/seats?roomId=${rid}`); assert.equal(scopedSeats.seats.length, 1); assert.equal(scopedSeats.seats[0].GheID, sid);
  const images = [];
  for (const order of [1,2]) {
    const result = (await call(1, 'POST', `/admin/cinemas/${cid}/images`, { url: `/uxr3-http-test-${order}.svg`, description: 'Test caption', cover: order === 1, displayOrder: order }, 201)).image;
    assert.ok(Number.isInteger(result.HinhAnhRapID)); images.push(result.HinhAnhRapID);
    cleanup.push({ actor: 1, path: `/admin/cinemas/${cid}/images/${result.HinhAnhRapID}`, table: 'HINHANH_RAPCHIEUPHIM', column: 'HinhAnhRapID', id: result.HinhAnhRapID });
  }
  await call(1, 'PATCH', `/admin/cinemas/${cid}/images/${images[1]}/cover`, { cover: true });
  const covered = await call(1, 'GET', `/admin/cinemas/${cid}/images`);
  assert.equal(covered.images.filter((row) => row.LaAnhDaiDien).length, 1); assert.ok(covered.images.find((row) => row.HinhAnhRapID === images[1]).LaAnhDaiDien);
  await call(1, 'PUT', `/admin/cinemas/${cid}/images/${images[1]}`, { url: '/uxr3-http-test-2.svg', description: 'Updated caption', displayOrder: 9, status: 'Tạm ẩn' });
  const updated = (await call(1, 'GET', `/admin/cinemas/${cid}/images`)).images.find((row) => row.HinhAnhRapID === images[1]); assert.equal(updated.ThuTuHienThi, 9); assert.equal(updated.TrangThai, 'Tạm ẩn'); assert.ok(!updated.LaAnhDaiDien);
  await call(1, 'PATCH', `/admin/cinemas/1/images/${images[0]}/cover`, { cover: true }, 404, 'Foreign gallery owner cannot cover image');
  const managerRoom = (await call(2, 'POST', '/manager/cinemas/1/rooms', { name, type: '2D' }, 201)).room;
  cleanup.push({ actor: 2, path: `/manager/rooms/${managerRoom.id}`, table: 'PHONGCHIEU', column: 'PhongID', id: managerRoom.id });
  await call(2, 'PUT', `/manager/rooms/${managerRoom.id}`, { name, type: '3D', status: 'Hoạt động' });
  const managerSeat = (await call(2, 'POST', `/manager/rooms/${managerRoom.id}/seats`, { row: 'TEST', number: 1, type: 'Thường' }, 201)).seat;
  cleanup.push({ actor: 2, path: `/manager/seats/${managerSeat.id}`, table: 'GHE', column: 'GheID', id: managerSeat.id });
  await call(2, 'PUT', `/manager/seats/${managerSeat.id}`, { type: 'VIP', status: 'Bảo trì' });
  const managerCounts = (await call(2, 'GET', '/manager/cinemas/1/rooms')).rooms.find((row) => row.id === managerRoom.id); assert.equal(managerCounts.seatCount, 1);
  evidence.status = 'PASS';
  // Clean only resources created in this run, in reverse dependency order, with existing REST.
  while (cleanup.length) {
    await cleanupOne(cleanup.at(-1)); cleanup.pop();
  }
  evidence.fixtureVerification = (await pool.request().query("SELECT (SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM WHERE TenRap LIKE 'UXR3[_]HTTP[_]%') AS cinemas,(SELECT COUNT(*) FROM dbo.PHONGCHIEU WHERE TenPhong LIKE 'UXR3[_]HTTP[_]%') AS rooms")).recordset[0];
  assert.deepEqual(evidence.fixtureVerification, { cinemas: 0, rooms: 0 });
} catch (error) {
  evidence.status = 'FAIL'; evidence.error = error.message;
  process.exitCode = 1;
} finally {
  if (cleanupOne) {
    while (cleanup.length) {
      try { await cleanupOne(cleanup.at(-1)); cleanup.pop(); }
      catch (error) { evidence.cleanupError = error.message; process.exitCode = 1; break; }
    }
  }
  // Cleanup failures preserve exact owned identifiers for controlled recovery, never broad deletion.
  evidence.remainingOwnedFixtures = cleanup.map(({ actor, path, id }) => ({ actor, path, id }));
  if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
  await closePool();
  fs.writeFileSync(new URL('./api-integration.json', import.meta.url), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ status: evidence.status, requests: evidence.cases.length, ownedFixturesRemaining: cleanup.length, evidence: 'api-integration.json' }));
}
