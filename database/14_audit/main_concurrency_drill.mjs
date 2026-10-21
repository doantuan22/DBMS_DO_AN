// Main-database concurrency drill. Uses two independent SQL Server pools/sessions,
// isolated negative-ID fixtures, exact cleanup, and identity reseeding to baseline.
// The Backend is never started. If a race permits a second commit, it is rolled back.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(root, 'backend', 'package.json'));
const sql = require('mssql');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(root, 'backend', '.env')));
if (env.DB_DATABASE !== 'CinemaBookingDB') throw new Error('Refusing: backend configuration does not target Main.');

const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const token = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
const emailPrefix = `audit-${token}`;
const code = `AUDIT${token}`;
const negativeBase = -200000000 - (Number.parseInt(token.slice(0, 6), 16) % 500000000);
const userA = negativeBase;
const userB = negativeBase - 1;
const promoId = negativeBase - 2;
const showA = negativeBase - 3;
const showB = negativeBase - 4;
const backupDir = path.join(root, '.audit-output', 'database-backups');
const backupPath = path.join(backupDir, `CinemaBookingDB_pre_concurrency_${stamp}_${token}.bak`);
const sqlBackupPath = backupPath.replaceAll("'", "''");
const appConfig = {
  server: env.DB_SERVER,
  port: Number(env.DB_PORT ?? 1433),
  database: env.DB_DATABASE,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  options: {
    encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true',
    trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true',
    useUTC: true,
  },
  requestTimeout: 120000,
  pool: { max: 2, min: 1, idleTimeoutMillis: 30000 },
};

const control = await new sql.ConnectionPool(appConfig).connect();
const sessionA = await new sql.ConnectionPool(appConfig).connect();
const sessionB = await new sql.ConnectionPool(appConfig).connect();
const monitor = await new sql.ConnectionPool(appConfig).connect();
const result = {
  startedUtc: new Date().toISOString(),
  target: null,
  backup: { path: path.relative(root, backupPath), copyOnly: true, checksum: true, verifyOnly: false },
  fixtureTag: emailPrefix,
  tests: [],
  verdict: 'BLOCKED',
};
let fixture = null;
let promoInstalled = false;
let customersInstalled = false;
let scheduleRaceStarted = false;
const committedOrderIds = new Set();
const identityBaseline = new Map();
let txA = null;
let txB = null;

function check(condition, message) { if (!condition) throw new Error(message); }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function targetOf(pool) {
  const row = (await pool.request().query(`
    SELECT @@SERVERNAME AS serverName,DB_NAME() AS databaseName,
           CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) AS state,@@SPID AS spid
  `)).recordset[0];
  check(row.serverName === 'DoanTuanIT' && row.databaseName === 'CinemaBookingDB' && row.state === 'ONLINE', `Wrong target identity: ${JSON.stringify(row)}`);
  return row;
}

async function assertNoForeignTransactions(allowed = []) {
  const allowedIds = [...allowed];
  const req = control.request();
  allowedIds.forEach((id, i) => req.input(`sid${i}`, sql.Int, id));
  const exclude = allowedIds.length ? `AND s.session_id NOT IN (${allowedIds.map((_, i) => `@sid${i}`).join(',')})` : '';
  const rows = (await req.query(`
    SELECT DISTINCT s.session_id,s.program_name,st.is_user_transaction
    FROM sys.dm_tran_session_transactions st
    JOIN sys.dm_tran_database_transactions dt ON dt.transaction_id=st.transaction_id
    JOIN sys.dm_exec_sessions s ON s.session_id=st.session_id
    WHERE dt.database_id=DB_ID() AND s.is_user_process=1 ${exclude}
  `)).recordset;
  check(rows.length === 0, `Found another open user transaction in Main: ${JSON.stringify(rows)}`);
}

async function snapshot() {
  const target = await targetOf(control);
  const counts = (await control.request().query(`
    SELECT s.name AS schemaName,t.name AS tableName,SUM(ps.row_count) AS row_count
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
    JOIN sys.dm_db_partition_stats ps ON ps.object_id=t.object_id AND ps.index_id IN (0,1)
    WHERE t.is_ms_shipped=0 GROUP BY s.name,t.name ORDER BY s.name,t.name
  `)).recordset;
  const identities = (await control.request().query(`
    SELECT OBJECT_SCHEMA_NAME(object_id) AS schemaName,OBJECT_NAME(object_id) AS tableName,
           name AS columnName,IDENT_CURRENT(QUOTENAME(OBJECT_SCHEMA_NAME(object_id))+'.'+QUOTENAME(OBJECT_NAME(object_id))) AS identityValue
    FROM sys.identity_columns ORDER BY object_id,column_id
  `)).recordset;
  return { target, counts, identities };
}

function sameSnapshot(a, b) {
  return JSON.stringify(a.counts) === JSON.stringify(b.counts)
    && JSON.stringify(a.identities) === JSON.stringify(b.identities);
}

async function checkConstraintState() {
  const r = await control.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS');
  const rows = (r.recordsets ?? []).flat();
  return { violations: rows.length, clean: rows.length === 0 };
}

async function backupAndVerify() {
  fs.mkdirSync(backupDir, { recursive: true });
  check(!fs.existsSync(backupPath), `Refusing to overwrite existing backup file ${backupPath}`);
  await targetOf(control);
  await control.request().query(`
    BACKUP DATABASE [CinemaBookingDB]
    TO DISK = N'${sqlBackupPath}'
    WITH COPY_ONLY, CHECKSUM, STATS=10;
    RESTORE VERIFYONLY FROM DISK = N'${sqlBackupPath}' WITH CHECKSUM;
  `);
  const stat = fs.statSync(backupPath);
  check(stat.size > 0, 'SQL Server reported backup success but backup file is empty.');
  result.backup.verifyOnly = true;
  result.backup.bytes = stat.size;
  result.backup.modifiedUtc = stat.mtime.toISOString();
}

async function readCandidate() {
  const candidates = (await control.request().query(`
    SELECT TOP(1) v.SuatChieuID,v.PhimID,v.PhongID,v.RapID,v.ThoiLuong,v.GiaVeCoBan,v.DinhDang,
           seats.Seat1,seats.Seat2,seats.Seat3,seats.FreeSeatCount
    FROM dbo.vw_LichChieuChiTiet v
    CROSS APPLY (
      SELECT COUNT(*) AS FreeSeatCount,
             MIN(CASE WHEN rn=1 THEN GheID END) AS Seat1,
             MIN(CASE WHEN rn=2 THEN GheID END) AS Seat2,
             MIN(CASE WHEN rn=3 THEN GheID END) AS Seat3
      FROM (
        SELECT f.GheID,ROW_NUMBER() OVER(ORDER BY f.GheID) AS rn
        FROM dbo.fn_DanhSachGheSuatChieu(v.SuatChieuID) f
        WHERE f.TrangThaiGhe=N'Trống'
      ) q
    ) seats
    WHERE v.IsBookable=1 AND v.ThoiGianBatDau>=DATEADD(minute,30,dbo.fn_BayGio()) AND seats.FreeSeatCount>=3
      AND NOT EXISTS(SELECT 1 FROM dbo.DONDATVE d WHERE d.SuatChieuID=v.SuatChieuID)
    ORDER BY v.ThoiGianBatDau,v.SuatChieuID
  `)).recordset;
  check(candidates.length === 1, 'No bookable showtime with at least three free seats and zero existing orders; booking race blocked.');
  return candidates[0];
}

async function findRoleAndStatus() {
  const rows = (await control.request().query(`
    SELECT TOP(1) r.VaiTroID,u.TrangThai
    FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID
    WHERE r.MaVaiTro='KHACH_HANG' AND u.TrangThai=N'Hoạt động'
    ORDER BY u.NguoiDungID
  `)).recordset;
  check(rows.length === 1, 'No active customer role/status reference for fixture creation.');
  return rows[0];
}

async function installCustomers() {
  const role = await findRoleAndStatus();
  const conflict = (await control.request()
    .input('userA', sql.Int, userA).input('userB', sql.Int, userB)
    .input('emailA', sql.VarChar(150), `${emailPrefix}-a@example.invalid`)
    .input('emailB', sql.VarChar(150), `${emailPrefix}-b@example.invalid`)
    .query(`
      SELECT (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE NguoiDungID IN (@userA,@userB)) AS idHits,
             (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE Email IN (@emailA,@emailB)) AS emailHits
    `)).recordset[0];
  check(conflict.idHits === 0 && conflict.emailHits === 0, 'Generated user fixture ID/email collides with existing data.');
  await control.request()
    .input('userA', sql.Int, userA).input('userB', sql.Int, userB)
    .input('roleId', sql.Int, role.VaiTroID)
    .input('status', sql.NVarChar(50), role.TrangThai)
    .input('emailA', sql.VarChar(150), `${emailPrefix}-a@example.invalid`)
    .input('emailB', sql.VarChar(150), `${emailPrefix}-b@example.invalid`)
    .query(`
      SET XACT_ABORT ON;
      BEGIN TRANSACTION;
      BEGIN TRY
        SET IDENTITY_INSERT dbo.NGUOIDUNG ON;
        INSERT dbo.NGUOIDUNG(NguoiDungID,VaiTroID,HoTen,Email,MatKhau,SoDienThoai,NgayTao,TrangThai)
        VALUES(@userA,@roleId,N'Audit concurrency fixture A',@emailA,'AUDIT-ONLY-NOT-A-CREDENTIAL',NULL,dbo.fn_BayGio(),@status),
              (@userB,@roleId,N'Audit concurrency fixture B',@emailB,'AUDIT-ONLY-NOT-A-CREDENTIAL',NULL,dbo.fn_BayGio(),@status);
        SET IDENTITY_INSERT dbo.NGUOIDUNG OFF;
        INSERT dbo.HOSOKHACHHANG(NguoiDungID,NgaySinh,GioiTinh,DiemTichLuy)
        VALUES(@userA,NULL,NULL,0),(@userB,NULL,NULL,0);
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        BEGIN TRY SET IDENTITY_INSERT dbo.NGUOIDUNG OFF; END TRY BEGIN CATCH END CATCH;
        IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH;
    `);
  customersInstalled = true;
  fixture = { ...fixture, userA, userB, roleId: role.VaiTroID, emails: [`${emailPrefix}-a@example.invalid`, `${emailPrefix}-b@example.invalid`] };
}

async function installPromotion() {
  const conflict = (await control.request().input('promoId', sql.Int, promoId).input('code', sql.VarChar(50), code)
    .query(`SELECT (SELECT COUNT(*) FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@promoId) AS idHits,
                   (SELECT COUNT(*) FROM dbo.KHUYENMAI WHERE MaCode=@code) AS codeHits`)).recordset[0];
  check(conflict.idHits === 0 && conflict.codeHits === 0, 'Generated promotion fixture ID/code collides with existing data.');
  await control.request().input('promoId', sql.Int, promoId).input('code', sql.VarChar(50), code)
    .query(`
      SET XACT_ABORT ON;
      BEGIN TRANSACTION;
      BEGIN TRY
        SET IDENTITY_INSERT dbo.KHUYENMAI ON;
        INSERT dbo.KHUYENMAI(KhuyenMaiID,MaCode,MoTa,LoaiGiamGia,GiaTriGiam,DonHangToiThieu,GiamToiDa,
                             NgayBatDau,NgayKetThuc,SoLuong,SoLuongDaDung,TrangThai)
        VALUES(@promoId,@code,N'Concurrency audit fixture','PERCENT',10,0,NULL,
               CONVERT(datetime2,'2000-01-01T00:00:00',126),CONVERT(datetime2,'2099-12-31T23:59:59',126),1,0,N'Hoạt động');
        SET IDENTITY_INSERT dbo.KHUYENMAI OFF;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        BEGIN TRY SET IDENTITY_INSERT dbo.KHUYENMAI OFF; END TRY BEGIN CATCH END CATCH;
        IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH;
    `);
  promoInstalled = true;
}

async function createBooking(tx, customerId, showtimeId, seatId, promotionCode = null) {
  const request = tx.request()
    .input('NguoiDungID', sql.Int, customerId)
    .input('SuatChieuID', sql.Int, showtimeId)
    .input('MaKhuyenMai', sql.VarChar(50), promotionCode)
    .input('DanhSachGheId', sql.VarChar(sql.MAX), String(seatId))
    .input('DanhSachDoAnJson', sql.NVarChar(sql.MAX), null)
    .input('DiemSuDung', sql.Int, 0)
    .input('ChiXemTruoc', sql.Bit, false)
    .output('NewDonDatVeID', sql.Int);
  const response = await request.execute('dbo.sp_Booking_Create');
  const orderId = response.output.NewDonDatVeID ?? response.recordset?.[0]?.DonDatVeID ?? null;
  check(Number.isInteger(orderId) && orderId > 0, 'sp_Booking_Create did not return a committed-row candidate ID.');
  const summary = (await tx.request().input('orderId', sql.Int, orderId).query(`
    SELECT d.DonDatVeID,d.NguoiDungID,d.SuatChieuID,d.KhuyenMaiID,d.TrangThai,d.TongTienVe,d.TongTienDoAn,d.TienGiamGia,
           (SELECT COUNT(*) FROM dbo.CHITIETVE cv WHERE cv.DonDatVeID=d.DonDatVeID) AS TicketCount,
           (SELECT COUNT(*) FROM dbo.CHITIETDOAN cda WHERE cda.DonDatVeID=d.DonDatVeID) AS FoodCount
    FROM dbo.DONDATVE d WHERE d.DonDatVeID=@orderId
  `)).recordset[0];
  check(summary?.NguoiDungID === customerId && summary.SuatChieuID === showtimeId && summary.TicketCount === 1 && summary.FoodCount === 0,
    'Booking success did not match the one-customer/one-seat/no-food fixture oracle.');
  check(summary.TongTienVe > 0 && summary.TongTienDoAn === 0 && summary.TienGiamGia >= 0,
    'Booking totals violated basic nonnegative subtotal/discount oracle.');
  if (promotionCode) check(summary.KhuyenMaiID === promoId && summary.TienGiamGia > 0,
    'Booking did not consume the isolated 10% promotion as expected.');
  else check(summary.KhuyenMaiID === null && summary.TienGiamGia === 0,
    'No-promotion booking unexpectedly has a promotion/discount.');
  return { orderId, summary };
}

async function waitForLock(sessionId, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  let latest = null;
  while (Date.now() < deadline) {
    const row = (await monitor.request().input('sid', sql.Int, sessionId).query(`
      SELECT TOP(1) wait_type,blocking_session_id,wait_time
      FROM sys.dm_exec_requests WHERE session_id=@sid AND database_id=DB_ID()
    `)).recordset[0];
    if (row?.wait_type?.startsWith('LCK_M_') && Number(row.blocking_session_id) > 0) return { seen: true, ...row };
    latest = row ?? latest;
    await sleep(150);
  }
  return { seen: false, latest };
}

async function rollbackSessionTransaction(tx, sessionId) {
  let rollbackError=null;
  try { await tx.rollback(); } catch (error) { rollbackError=error.message; }
  let remaining=(await control.request().input('sid',sql.Int,sessionId).query(`
    SELECT COUNT(*) AS activeTransactions
    FROM sys.dm_tran_session_transactions st
    JOIN sys.dm_tran_database_transactions dt ON dt.transaction_id=st.transaction_id
    WHERE st.session_id=@sid AND dt.database_id=DB_ID()
  `)).recordset[0].activeTransactions;
  let killed=false;
  if(Number(remaining)>0){
    const session=(await control.request().input('sid',sql.Int,sessionId).query(`
      SELECT s.program_name,s.login_name,s.host_name,s.status AS sessionStatus,s.open_transaction_count,r.session_id AS activeRequest
      FROM sys.dm_exec_sessions s LEFT JOIN sys.dm_exec_requests r ON r.session_id=s.session_id WHERE s.session_id=@sid
    `)).recordset[0];
    check(session?.program_name==='node-mssql'&&session?.login_name===env.DB_USER&&session?.host_name==='DoanTuanIT'
      &&session?.sessionStatus==='sleeping'&&Number(session?.open_transaction_count)>0&&session.activeRequest===null,
      `Refusing to kill a transaction session whose identity is not this test's idle SQL connection: ${JSON.stringify(session)}`);
    await control.request().query(`KILL ${sessionId}`);
    killed=true;
    const deadline=Date.now()+10000;
    do{
      const alive=(await control.request().input('sid',sql.Int,sessionId).query('SELECT session_id FROM sys.dm_exec_sessions WHERE session_id=@sid')).recordset;
      if(!alive.length)break;
      await sleep(200);
    }while(Date.now()<deadline);
    remaining=(await control.request().input('sid',sql.Int,sessionId).query(`
      SELECT COUNT(*) AS activeTransactions FROM sys.dm_tran_session_transactions st
      JOIN sys.dm_tran_database_transactions dt ON dt.transaction_id=st.transaction_id
      WHERE st.session_id=@sid AND dt.database_id=DB_ID()
    `)).recordset[0].activeTransactions;
  }
  check(Number(remaining)===0,`SQL session ${sessionId} still owns an open Main transaction after rollback.`);
  return {sessionId,transactionClosed:true,killed,rollbackError};
}

async function runBookingRace({ name, seatA, seatB, promotionCode = null, expectedError }) {
  const start = await snapshot();
  await assertNoForeignTransactions();
  txA = new sql.Transaction(sessionA);
  txB = new sql.Transaction(sessionB);
  await txA.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
  const aIdentity=(await txA.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,@@SPID spid`)).recordset[0];
  const sidA=aIdentity.spid;
  const winner = await createBooking(txA, userA, fixture.showtimeId, seatA, promotionCode);
  await txB.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
  const bIdentity=(await txB.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,@@SPID spid`)).recordset[0];
  const sidB=bIdentity.spid;
  check(aIdentity.serverName==='DoanTuanIT'&&aIdentity.databaseName==='CinemaBookingDB'&&bIdentity.serverName==='DoanTuanIT'&&bIdentity.databaseName==='CinemaBookingDB','Transaction session identity changed or wrong database.');
  check(sidA !== sidB, 'Concurrency sessions are not independent.');
  await assertNoForeignTransactions([sidA,sidB]);
  await txB.request().query('SET LOCK_TIMEOUT 30000');
  const bOutcomePromise = txB.request()
    .input('NguoiDungID', sql.Int, userB)
    .input('SuatChieuID', sql.Int, fixture.showtimeId)
    .input('MaKhuyenMai', sql.VarChar(50), promotionCode)
    .input('DanhSachGheId', sql.VarChar(sql.MAX), String(seatB))
    .input('DanhSachDoAnJson', sql.NVarChar(sql.MAX), null)
    .input('DiemSuDung', sql.Int, 0)
    .input('ChiXemTruoc', sql.Bit, false)
    .output('NewDonDatVeID', sql.Int)
    .execute('dbo.sp_Booking_Create')
    .then((response) => ({ ok: true, response }), (error) => ({ ok: false, error }));
  const blocked = await waitForLock(sidB);
  let early = null;
  const outcomeBeforeCommit = await Promise.race([bOutcomePromise, sleep(10).then(() => null)]);
  if (outcomeBeforeCommit) early = outcomeBeforeCommit;
  let verdict = 'FAIL';
  let actual = null;
  let rollbackState=[];
  if (early?.ok) {
    actual = 'second booking returned success before first transaction committed; second transaction rolled back';
    rollbackState.push(await rollbackSessionTransaction(txB,sidB));
    rollbackState.push(await rollbackSessionTransaction(txA,sidA));
  } else if (early && !early.ok) {
    const number = Number(early.error.number ?? early.error.originalError?.info?.number ?? 0);
    actual = `error ${number}; before winner commit; ${early.error.message}`;
    rollbackState.push(await rollbackSessionTransaction(txB,sidB));
    rollbackState.push(await rollbackSessionTransaction(txA,sidA));
    verdict = blocked.seen && number === expectedError ? 'PASS' : 'FAIL';
  } else if (blocked.seen) {
    await txA.commit();
    committedOrderIds.add(winner.orderId);
    const outcome = await bOutcomePromise;
    if (outcome.ok) {
      actual = 'second booking returned success after winner commit; second transaction rolled back';
      const secondId = outcome.response.output.NewDonDatVeID ?? outcome.response.recordset?.[0]?.DonDatVeID;
      if (Number.isInteger(secondId)) committedOrderIds.add(secondId);
      rollbackState.push(await rollbackSessionTransaction(txB,sidB));
    } else {
      const number = Number(outcome.error.number ?? outcome.error.originalError?.info?.number ?? 0);
      actual = `winner committed; blocked second call returned error ${number}`;
      verdict = number === expectedError ? 'PASS' : 'FAIL';
      rollbackState.push(await rollbackSessionTransaction(txB,sidB));
    }
  } else {
    actual = `no SQL lock wait observed; B state=${JSON.stringify(blocked.latest)}`;
    rollbackState.push(await rollbackSessionTransaction(txB,sidB));
    rollbackState.push(await rollbackSessionTransaction(txA,sidA));
  }
  txA = null;
  txB = null;

  const committedCheck = await control.request().input('winnerId', sql.Int, winner.orderId).input('userA', sql.Int, userA)
    .query(`SELECT COUNT(*) AS orderRows,(SELECT COUNT(*) FROM dbo.CHITIETVE WHERE DonDatVeID=@winnerId) AS ticketRows,
                   (SELECT COUNT(*) FROM dbo.DONDATVE WHERE NguoiDungID=@userA AND SuatChieuID=${fixture.showtimeId}) AS fixtureOrderRows`);
  const persisted = committedCheck.recordset[0];
  if (verdict === 'PASS') check(persisted.orderRows === 1 && persisted.ticketRows === 1 && persisted.fixtureOrderRows === 1,
    'After winner commit, exact committed booking was not found before cleanup.');

  const test = {
    name,
    sessions: { sessionA: sidA, sessionB: sidB, independent: sidA !== sidB },
    inputs: { showtimeId: fixture.showtimeId, seatA, seatB, distinctSeats: seatA !== seatB, promotion: promotionCode ? 'isolated quota-1 fixture' : null },
    expected: `one winner commits; blocked second request returns ${expectedError}; cleanup restores baseline`,
    winner: { orderId: winner.orderId, ticketCount: winner.summary.TicketCount, promotionId: winner.summary.KhuyenMaiID, discount: winner.summary.TienGiamGia },
    lockWait: { seen: blocked.seen, waitType: blocked.wait_type ?? null, blockingSessionId: blocked.blocking_session_id ?? null },
    actual,
    transactionCleanup:rollbackState,
    committedStateBeforeCleanup: { orderRows: persisted.orderRows, ticketRows: persisted.ticketRows, fixtureOrderRows: persisted.fixtureOrderRows },
    verdict,
  };
  result.tests.push(test);
  await cleanupBookingOrders();
  const after = await snapshot();
  const dbcc = await checkConstraintState();
  test.cleanup = { stateRestored: sameSnapshot(start, after), constraintViolations: dbcc.violations };
  if (!test.cleanup.stateRestored || !dbcc.clean) test.verdict = 'FAIL';
  result.tests[result.tests.length - 1] = test;
  check(test.cleanup.stateRestored && dbcc.clean, `State did not return to baseline after ${name}.`);
  await assertNoForeignTransactions();
}

async function runShowtimeRace() {
  const startSnapshot = await snapshot();
  await assertNoForeignTransactions();
  const startsAt = new Date('2045-11-15T12:00:00.000Z');
  const endsAt = new Date(startsAt.getTime() + Number(fixture.runtimeMinutes) * 60000);
  const conflict = (await control.request().input('room',sql.Int,fixture.roomId).input('start',sql.DateTime2(7),startsAt).input('end',sql.DateTime2(7),endsAt).query(`
    SELECT COUNT(*) AS conflicts FROM dbo.SUATCHIEU
    WHERE PhongID=@room AND TrangThai<>N'Đã hủy' AND ThoiGianBatDau<@end AND ThoiGianKetThuc>@start
  `)).recordset[0].conflicts;
  check(conflict === 0, 'Synthetic 2045 schedule interval unexpectedly overlaps a pre-existing Main schedule.');
  scheduleRaceStarted=true;
  txA = new sql.Transaction(sessionA); txB = new sql.Transaction(sessionB);
  await txA.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
  const aIdentity=(await txA.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,@@SPID spid`)).recordset[0];
  await txB.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
  const bIdentity=(await txB.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,@@SPID spid`)).recordset[0];
  const sidA=aIdentity.spid,sidB=bIdentity.spid;
  check(aIdentity.serverName==='DoanTuanIT'&&aIdentity.databaseName==='CinemaBookingDB'&&bIdentity.serverName==='DoanTuanIT'&&bIdentity.databaseName==='CinemaBookingDB','Schedule race transaction session is not on exact Main.');
  check(sidA!==sidB,'Schedule race does not use two distinct SQL sessions.');
  await assertNoForeignTransactions([sidA,sidB]);
  const insertSQL = `
    SET XACT_ABORT ON;
    SET IDENTITY_INSERT dbo.SUATCHIEU ON;
    BEGIN TRY
      INSERT dbo.SUATCHIEU(SuatChieuID,PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
      VALUES(@showId,@movie,@room,@startsAt,@endsAt,@format,@price,N'Mở bán');
      SET IDENTITY_INSERT dbo.SUATCHIEU OFF;
    END TRY
    BEGIN CATCH
      BEGIN TRY SET IDENTITY_INSERT dbo.SUATCHIEU OFF; END TRY BEGIN CATCH END CATCH;
      THROW;
    END CATCH;
  `;
  const bindSchedule = (request,id) => request.input('showId',sql.Int,id).input('movie',sql.Int,fixture.movieId)
    .input('room',sql.Int,fixture.roomId).input('startsAt',sql.DateTime2(7),startsAt).input('endsAt',sql.DateTime2(7),endsAt)
    .input('format',sql.NVarChar(50),fixture.format).input('price',sql.Decimal(18,2),fixture.basePrice);
  await bindSchedule(txA.request(),showA).query(insertSQL);
  const bOutcomePromise = bindSchedule(txB.request(),showB).query(insertSQL)
    .then((response) => ({ok:true,response}),(error)=>({ok:false,error}));
  const blocked = await waitForLock(sidB);
  const early = await Promise.race([bOutcomePromise,sleep(10).then(()=>null)]);
  let actual,verdict='FAIL';
  const rollbackState=[];
  if (early?.ok) {
    actual='second overlapping schedule insert returned success before the first committed; second transaction rolled back';
    rollbackState.push(await rollbackSessionTransaction(txB,sidB));
    rollbackState.push(await rollbackSessionTransaction(txA,sidA));
  } else if (early && !early.ok) {
    const number=Number(early.error.number??early.error.originalError?.info?.number??0);
    actual=`error ${number} before first commit`;
    rollbackState.push(await rollbackSessionTransaction(txB,sidB));
    rollbackState.push(await rollbackSessionTransaction(txA,sidA));
    verdict=blocked.seen&&number===50001?'PASS':'FAIL';
  } else if (blocked.seen) {
    await txA.commit();
    const outcome=await bOutcomePromise;
    if (outcome.ok) {
      actual='second overlapping schedule insert succeeded after first commit; second transaction rolled back';
      rollbackState.push(await rollbackSessionTransaction(txB,sidB));
    } else {
      const number=Number(outcome.error.number??outcome.error.originalError?.info?.number??0);
      actual=`winner committed; overlapping second insert returned error ${number}`;
      verdict=number===50001?'PASS':'FAIL';
      rollbackState.push(await rollbackSessionTransaction(txB,sidB));
    }
  } else {
    actual=`no SQL lock wait observed; B state=${JSON.stringify(blocked.latest)}`;
    rollbackState.push(await rollbackSessionTransaction(txB,sidB));
    rollbackState.push(await rollbackSessionTransaction(txA,sidA));
  }
  txA=null;txB=null;
  const rows=(await control.request().input('a',sql.Int,showA).input('b',sql.Int,showB).query(`
    SELECT COUNT(*) AS fixtureRows,SUM(CASE WHEN PhongID=${fixture.roomId} THEN 1 ELSE 0 END) AS roomRows
    FROM dbo.SUATCHIEU WHERE SuatChieuID IN (@a,@b)
  `)).recordset[0];
  const test={name:'concurrent_showtime_overlap',sessions:{sessionA:sidA,sessionB:sidB,independent:sidA!==sidB},inputs:{roomId:fixture.roomId,showtimeIds:[showA,showB],interval:'2045-11-15; movie runtime exact'},expected:'one interval commits; second concurrent insert rejected by TRG_SuatChieu_KiemTraTrungLich error 50001; cleanup restores baseline',lockWait:{seen:blocked.seen,waitType:blocked.wait_type??null,blockingSessionId:blocked.blocking_session_id??null},actual,transactionCleanup:rollbackState,rowsBeforeCleanup:rows,verdict};
  result.tests.push(test);
  await cleanupScheduleRows();
  const after=await snapshot();const dbcc=await checkConstraintState();
  test.cleanup={stateRestored:sameSnapshot(startSnapshot,after),constraintViolations:dbcc.violations};
  if(!test.cleanup.stateRestored||!dbcc.clean)test.verdict='FAIL';
  result.tests[result.tests.length-1]=test;
  check(test.cleanup.stateRestored&&dbcc.clean, 'Main did not return to baseline after schedule race.');
  await assertNoForeignTransactions();
}

async function cleanupBookingOrders() {
  for (const tx of [txA,txB]) { if (tx) { try { await tx.rollback(); } catch {} } }
  txA=null;txB=null;
  if(!customersInstalled) return;
  await control.request().input('userA',sql.Int,userA).input('userB',sql.Int,userB).query(`
    SET XACT_ABORT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
      DELETE cv FROM dbo.CHITIETVE cv JOIN dbo.DONDATVE d ON d.DonDatVeID=cv.DonDatVeID WHERE d.NguoiDungID IN (@userA,@userB);
      DELETE cda FROM dbo.CHITIETDOAN cda JOIN dbo.DONDATVE d ON d.DonDatVeID=cda.DonDatVeID WHERE d.NguoiDungID IN (@userA,@userB);
      DELETE tt FROM dbo.THANHTOAN tt JOIN dbo.DONDATVE d ON d.DonDatVeID=tt.DonDatVeID WHERE d.DonDatVeID IN(SELECT DonDatVeID FROM dbo.DONDATVE WHERE NguoiDungID IN (@userA,@userB));
      DELETE d FROM dbo.DONDATVE d WHERE d.NguoiDungID IN (@userA,@userB);
      COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
      IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
      THROW;
    END CATCH;
  `);
  if(identityBaseline.has('DONDATVE')) await restoreIdentity('DONDATVE',identityBaseline.get('DONDATVE'));
  if(identityBaseline.has('CHITIETVE')) await restoreIdentity('CHITIETVE',identityBaseline.get('CHITIETVE'));
}

async function cleanupScheduleRows() {
  if(!scheduleRaceStarted) return;
  await control.request().input('showA',sql.Int,showA).input('showB',sql.Int,showB)
    .query('DELETE FROM dbo.SUATCHIEU WHERE SuatChieuID IN (@showA,@showB)');
  scheduleRaceStarted=false;
}

async function cleanupFixtures() {
  for (const tx of [txA,txB]) { if (tx) { try { await tx.rollback(); } catch {} } }
  txA=null;txB=null;
  await cleanupBookingOrders();
  await cleanupScheduleRows();
  if(customersInstalled||promoInstalled){
    await control.request()
      .input('userA',sql.Int,userA).input('userB',sql.Int,userB)
      .input('promoId',sql.Int,promoId).input('promoCode',sql.VarChar(50),code)
      .input('emailPrefix',sql.VarChar(150),emailPrefix)
      .query(`
      SET XACT_ABORT ON;
      BEGIN TRANSACTION;
      BEGIN TRY
        IF NOT EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE KhuyenMaiID=@promoId)
          DELETE FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@promoId AND MaCode=@promoCode;
        DELETE FROM dbo.HOSOKHACHHANG WHERE NguoiDungID IN (@userA,@userB);
        DELETE FROM dbo.NGUOIDUNG WHERE NguoiDungID IN (@userA,@userB) AND Email LIKE @emailPrefix+'%';
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH;
      `);
  }
  customersInstalled=false;promoInstalled=false;committedOrderIds.clear();
}

async function restoreIdentity(tableName, baselineValue) {
  const current = (await control.request().query(`SELECT IDENT_CURRENT(N'dbo.${tableName}') AS value`)).recordset[0].value;
  const max = (await control.request().query(`SELECT MAX(${tableName === 'DONDATVE' ? 'DonDatVeID' : 'VeID'}) AS value FROM dbo.${tableName}`)).recordset[0].value;
  check(current !== null && baselineValue !== null, `Cannot safely restore ${tableName} identity metadata.`);
  check(max === null || Number(max) <= Number(baselineValue), `${tableName} contains an ID above the pretest identity seed; will not reseed over another writer.`);
  check(Number(current) <= Number(baselineValue) + 2, `${tableName} identity advanced beyond this drill's two expected bookings; will not reseed.`);
  const seed = String(baselineValue);
  await control.request().query(`DBCC CHECKIDENT ('dbo.${tableName}', RESEED, ${seed}) WITH NO_INFOMSGS`);
}

try {
  const initial = await snapshot();
  result.target = initial.target;
  const targets = await control.request().query(`
    SELECT name,CONVERT(nvarchar(30),state_desc) AS state_desc,create_date
    FROM sys.databases WHERE name IN(N'CinemaBookingDB',N'CinemaBookingDB_Test') ORDER BY name
  `);
  check(targets.recordset.length===2 && targets.recordset.every((row)=>row.state_desc==='ONLINE'), 'Main/Test database identity/status preflight failed.');
  result.mainAndTestBefore=targets.recordset;
  await assertNoForeignTransactions([initial.target.spid]);
  const fixtureShow = await readCandidate();
  fixture = { showtimeId:fixtureShow.SuatChieuID,movieId:fixtureShow.PhimID,roomId:fixtureShow.PhongID,cinemaId:fixtureShow.RapID,runtimeMinutes:fixtureShow.ThoiLuong,basePrice:fixtureShow.GiaVeCoBan,format:fixtureShow.DinhDang,seat1:fixtureShow.Seat1,seat2:fixtureShow.Seat2,seat3:fixtureShow.Seat3 };
  result.fixture = { showtimeId:fixture.showtimeId,movieId:fixture.movieId,roomId:fixture.roomId,seatIds:[fixture.seat1,fixture.seat2,fixture.seat3],freeSeatCount:fixtureShow.FreeSeatCount,existingOrders:0 };
  const iso = await control.request().query(`SELECT is_read_committed_snapshot_on,snapshot_isolation_state_desc FROM sys.databases WHERE database_id=DB_ID()`);
  result.isolation = iso.recordset[0];
  const baseIdentities=initial.identities;
  for (const t of ['DONDATVE','CHITIETVE']) {
    const found=baseIdentities.find((row)=>row.tableName===t);
    check(found && found.identityValue!==null,`Missing identity baseline for ${t}.`);
    identityBaseline.set(t,found.identityValue);
  }
  await backupAndVerify();
  result.before=initial;
  result.tests.push({name:'preflight_backup_restoreverify',expected:'COPY_ONLY CHECKSUM backup and RESTORE VERIFYONLY succeed; Main/Test unchanged',actual:`backup bytes=${result.backup.bytes}; Main and Test online`,verdict:'PASS'});

  const idCheck=(await control.request().input('ids',sql.Int,negativeBase).query(`
    SELECT (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE NguoiDungID IN (@ids,@ids-1)) AS customerIds,
           (SELECT COUNT(*) FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@ids-2) AS promoId,
           (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE SuatChieuID IN (@ids-3,@ids-4)) AS showtimeIds
  `)).recordset[0];
  check(idCheck.customerIds===0&&idCheck.promoId===0&&idCheck.showtimeIds===0,'Generated negative fixture IDs collide with current Main data.');
  await installCustomers();
  const afterCustomerFixture=await snapshot();
  result.customerFixtureBaseline=afterCustomerFixture;
  check(Number(afterCustomerFixture.counts.find((r)=>r.tableName==='NGUOIDUNG').row_count)===Number(initial.counts.find((r)=>r.tableName==='NGUOIDUNG').row_count)+2,'Customer fixture insert count mismatch.');

  const rowBefore=(await control.request().input('showId',sql.Int,fixture.showtimeId).input('seat1',sql.Int,fixture.seat1).input('seat2',sql.Int,fixture.seat2).input('seat3',sql.Int,fixture.seat3).query(`
    SELECT @showId AS showtimeId,@seat1 AS seat1,
           (SELECT COUNT(*) FROM dbo.DONDATVE WHERE SuatChieuID=@showId) AS orders,
           (SELECT COUNT(*) FROM dbo.fn_DanhSachGheSuatChieu(@showId)) AS returnedSeats,
           (SELECT COUNT(*) FROM dbo.fn_DanhSachGheSuatChieu(@showId) WHERE GheID IN(@seat1,@seat2,@seat3) AND TrangThaiGhe=N'Trống') AS freeSeats
  `)).recordset[0];
  result.bookingPreflight=rowBefore;
  check(Number(rowBefore.orders)===0&&Number(rowBefore.freeSeats)===3,`Chosen booking fixture is no longer clean/available: ${JSON.stringify(rowBefore)}`);
  await runBookingRace({name:'concurrent_same_seat_double_booking',seatA:fixture.seat1,seatB:fixture.seat1,expectedError:50025});

  const afterSeat = await snapshot();
  check(sameSnapshot(afterCustomerFixture,afterSeat),'Same-seat race cleanup did not restore its customer-fixture baseline.');
  await installPromotion();
  const afterPromoFixture=await snapshot();
  result.promotionFixtureBaseline=afterPromoFixture;
  const promoCheck=(await control.request().input('id',sql.Int,promoId).input('code',sql.VarChar(50),code).query(`SELECT SoLuong,SoLuongDaDung,TrangThai FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@id AND MaCode=@code`)).recordset[0];
  check(promoCheck?.SoLuong===1&&promoCheck.SoLuongDaDung===0,'Promo quota-1 fixture did not initialize at zero use.');
  const freeForPromo=(await control.request().input('showId',sql.Int,fixture.showtimeId).input('seat2',sql.Int,fixture.seat2).input('seat3',sql.Int,fixture.seat3).query(`
    SELECT COUNT(*) AS freeSeats FROM dbo.fn_DanhSachGheSuatChieu(@showId) WHERE GheID IN(@seat2,@seat3) AND TrangThaiGhe=N'Trống'
  `)).recordset[0].freeSeats;
  check(freeForPromo===2,'Promotion race seats are not free after the first race cleanup.');
  await runBookingRace({name:'concurrent_promotion_quota_one_use',seatA:fixture.seat2,seatB:fixture.seat3,promotionCode:code,expectedError:50029});
  const afterPromo = await snapshot();
  check(sameSnapshot(afterPromoFixture,afterPromo),'Promotion race cleanup did not restore its customer/promotion-fixture baseline.');

  await cleanupFixtures();
  const afterFixtureRemoval=await snapshot();
  check(sameSnapshot(initial,afterFixtureRemoval),'Customer/promotion fixture cleanup did not restore original Main baseline.');

  await runShowtimeRace();
  await cleanupFixtures();
  const final = await snapshot();
  result.after=final;
  result.stateUnchanged=sameSnapshot(initial,final);
  result.constraintState=await checkConstraintState();
  const mainTestAfter=(await control.request().query(`
    SELECT name,CONVERT(nvarchar(30),state_desc) AS state_desc,create_date
    FROM sys.databases WHERE name IN(N'CinemaBookingDB',N'CinemaBookingDB_Test') ORDER BY name
  `)).recordset;
  result.mainAndTestAfter=mainTestAfter;
  check(result.stateUnchanged,'Main table row counts or identity values differ from pretest baseline.');
  check(result.constraintState.clean,'DBCC CHECKCONSTRAINTS reported violations after concurrency cleanup.');
  check(JSON.stringify(result.mainAndTestBefore)===JSON.stringify(result.mainAndTestAfter),'Main/Test database identity or status changed.');
  result.verdict=result.tests.every((test)=>test.verdict==='PASS'&&test.cleanup?.stateRestored!==false)&&result.stateUnchanged?'PASS':'FAIL';
} catch (error) {
  result.error=error.message;
  result.verdict='FAIL';
  try { await cleanupFixtures(); } catch (cleanupError) { result.cleanupError=cleanupError.message; result.verdict='BLOCKED'; }
  try {
    const final=await snapshot();result.after=final;result.stateUnchanged=result.before?sameSnapshot(result.before,final):false;
    result.constraintState=await checkConstraintState();
  } catch (verifyError) { result.postFailureVerificationError=verifyError.message; }
} finally {
  for (const tx of [txA,txB]) { if (tx) { try { await tx.rollback(); } catch {} } }
  result.finishedUtc=new Date().toISOString();
  result.sessionsClosed=true;
  const out=path.join(root,'.audit-output','main-concurrency-drill.json');
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2));
  await Promise.allSettled([control.close(),sessionA.close(),sessionB.close(),monitor.close()]);
  console.log(JSON.stringify({verdict:result.verdict,target:result.target,backup:result.backup,fixture:result.fixture,tests:result.tests.map((t)=>({name:t.name,verdict:t.verdict,actual:t.actual,cleanup:t.cleanup})),stateUnchanged:result.stateUnchanged,constraintState:result.constraintState,error:result.error,cleanupError:result.cleanupError,evidence:path.relative(root,out)},null,2));
  if(result.verdict!=='PASS')process.exitCode=1;
}
