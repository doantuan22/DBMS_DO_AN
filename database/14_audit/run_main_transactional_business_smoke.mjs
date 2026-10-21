// Runs the existing SQL business smoke under its own outer transaction on exact
// Main. The script itself rolls back booking, payment, complaint, and review
// fixtures; the runner checks table rows and integrity before/after.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const sql = require('mssql');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
if (env.DB_DATABASE !== 'CinemaBookingDB') throw new Error('Refusing: backend config does not target exact Main.');
const OUT = path.join(ROOT, '.audit-output', 'main-transactional-business-smoke.json');
const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: env.DB_DATABASE,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 180000, pool: { max: 1, min: 1, idleTimeoutMillis: 30000 },
}).connect();
const evidence = { startedUtc: new Date().toISOString(), target: null, tests: [], verdict: 'BLOCKED' };

async function snapshot() {
  const id = (await pool.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state`)).recordset[0];
  if (id.serverName !== 'DoanTuanIT' || id.databaseName !== 'CinemaBookingDB' || id.state !== 'ONLINE') throw new Error(`Wrong target identity: ${JSON.stringify(id)}`);
  const counts = (await pool.request().query(`
    SELECT s.name schemaName,t.name tableName,SUM(CONVERT(bigint,ps.row_count)) row_count
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
    JOIN sys.dm_db_partition_stats ps ON ps.object_id=t.object_id AND ps.index_id IN (0,1)
    WHERE t.is_ms_shipped=0 GROUP BY s.name,t.name ORDER BY s.name,t.name;
  `)).recordset;
  const identities = (await pool.request().query(`
    SELECT OBJECT_SCHEMA_NAME(object_id) schemaName,OBJECT_NAME(object_id) tableName,name columnName,
           CONVERT(varchar(80),IDENT_CURRENT(QUOTENAME(OBJECT_SCHEMA_NAME(object_id))+'.'+QUOTENAME(OBJECT_NAME(object_id)))) identityValue
    FROM sys.identity_columns ORDER BY object_id,column_id;
  `)).recordset;
  return { id, counts, identities };
}
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function listIdentityChanges(a, b) {
  const prior = new Map(a.map((x) => [`${x.schemaName}.${x.tableName}.${x.columnName}`, x.identityValue]));
  return b.filter((x) => prior.get(`${x.schemaName}.${x.tableName}.${x.columnName}`) !== x.identityValue)
    .map((x) => ({ schemaName: x.schemaName, tableName: x.tableName, columnName: x.columnName, before: prior.get(`${x.schemaName}.${x.tableName}.${x.columnName}`), after: x.identityValue }));
}

try {
  const before = await snapshot(); evidence.target = before.id; evidence.before = before;
  const active = (await pool.request().query(`
    SELECT DISTINCT s.session_id,s.program_name
    FROM sys.dm_tran_session_transactions st
    JOIN sys.dm_tran_database_transactions dt ON dt.transaction_id=st.transaction_id
    JOIN sys.dm_exec_sessions s ON s.session_id=st.session_id
    WHERE dt.database_id=DB_ID() AND s.is_user_process=1 AND s.session_id<>@@SPID;
  `)).recordset;
  if (active.length) throw new Error(`Other open user transactions detected; refusing smoke: ${JSON.stringify(active)}`);
  const actors = (await pool.request().query(`
    SELECT vt.MaVaiTro,nd.NguoiDungID,nd.Email
    FROM dbo.VAITRO vt
    CROSS APPLY (
      SELECT TOP(1) u.NguoiDungID,u.Email
      FROM dbo.NGUOIDUNG u
      WHERE u.VaiTroID=vt.VaiTroID AND u.TrangThai=N'Hoạt động'
      ORDER BY u.NguoiDungID
    ) nd
    WHERE vt.MaVaiTro IN ('KHACH_HANG','QUAN_LY_RAP','CSKH','ADMIN');
  `)).recordset;
  const byRole = new Map(actors.map((x) => [x.MaVaiTro, x]));
  for (const role of ['KHACH_HANG','QUAN_LY_RAP','CSKH','ADMIN']) if (!byRole.has(role)) throw new Error(`Missing active fixture actor for role ${role}.`);
  const preflight = (await pool.request().input('manager', sql.Int, byRole.get('QUAN_LY_RAP').NguoiDungID).input('customer', sql.Int, byRole.get('KHACH_HANG').NguoiDungID).query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.SUATCHIEU s JOIN dbo.PHONGCHIEU p ON p.PhongID=s.PhongID
        WHERE s.TrangThai=N'Mở bán' AND s.ThoiGianBatDau>dbo.fn_BayGio()
          AND dbo.fn_KiemTraQuanLyRapScope(@manager,p.RapID)=1) AS futureShowtimesInManagerScope,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE TrangThai=N'Hoàn thành') AS completedShowtimes,
      (SELECT COUNT(*) FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
        WHERE d.TrangThai=N'Hoàn thành' AND NOT EXISTS(SELECT 1 FROM dbo.DANHGIAPHIM r WHERE r.NguoiDungID=@customer AND r.PhimID=s.PhimID)) AS eligibleReviewPairs;
  `)).recordset[0];
  if (Number(preflight.futureShowtimesInManagerScope) === 0 || Number(preflight.completedShowtimes) === 0 || Number(preflight.eligibleReviewPairs) === 0) {
    throw new Error(`Smoke fixture preflight did not meet the source script's required fixture assumptions: ${JSON.stringify(preflight)}`);
  }
  evidence.preflight = { ...preflight, activeFixtureRoles: [...byRole.keys()] };
  const source = fs.readFileSync(path.join(ROOT, 'database', '11_tests', 'procedures', 'smoke.sql'), 'utf8');
  const batches = source.split(/^\s*GO\s*$/gim).map((s) => s.trim()).filter(Boolean);
  if (batches.length !== 2) throw new Error(`Expected 2 SQL batches after removing GO, found ${batches.length}.`);
  await pool.request().batch(batches[0]);
  let sqlBody = batches[1];
  for (const [emailKey, role] of [['customer1@example.test','KHACH_HANG'],['manager1@example.test','QUAN_LY_RAP'],['support1@example.test','CSKH']]) {
    const email = String(byRole.get(role).Email).replaceAll("'", "''");
    sqlBody = sqlBody.replaceAll(`'${emailKey}'`, `'${email}'`);
  }
  const followup = `
    -- Exercise deployed aliases plus pending-order cancellation in the same
    -- caller transaction; fixture rows are removed by the source ROLLBACK.
    DECLARE @AliasSeat int = (
      SELECT TOP(1) GheID FROM dbo.fn_DanhSachGheSuatChieu(@Show)
      WHERE TrangThaiGhe=N'Trống' ORDER BY GheID
    );
    IF @AliasSeat IS NULL THROW 51012, 'No second free seat for the payment alias check.', 1;
    DECLARE @AliasOrder int, @AliasPayment int, @AliasReference varchar(100),
      @AliasSeatList varchar(20)=CONVERT(varchar(20),@AliasSeat);
    EXEC dbo.sp_DatVe @NguoiDungID=@User,@SuatChieuID=@Show,
      @DanhSachGheId=@AliasSeatList,@NewDonDatVeID=@AliasOrder OUTPUT;
    EXEC dbo.sp_Payment_CreateAttempt @NguoiDungID=@User,@DonDatVeID=@AliasOrder,
      @PhuongThuc=N'VNPAY',@ThanhToanID=@AliasPayment OUTPUT,@MaGiaoDich=@AliasReference OUTPUT;
    EXEC dbo.sp_XuLyThanhToan @NguoiDungID=@User,@ThanhToanID=@AliasPayment,
      @TrangThaiThanhToan=N'Thành công';
    IF @AliasOrder IS NULL OR @AliasPayment IS NULL OR @AliasReference IS NULL
      OR NOT EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID=@AliasOrder AND TrangThai=N'Đã thanh toán')
      OR NOT EXISTS(SELECT 1 FROM dbo.THANHTOAN WHERE ThanhToanID=@AliasPayment AND TrangThai=N'Thành công')
      THROW 51012, 'Booking/payment compatibility aliases did not persist expected state.', 1;

    DECLARE @CancelSeat int = (
      SELECT TOP(1) GheID FROM dbo.fn_DanhSachGheSuatChieu(@Show)
      WHERE TrangThaiGhe=N'Trống' ORDER BY GheID
    );
    DECLARE @CancelOrder int, @CancelSeatList varchar(20)=CONVERT(varchar(20),@CancelSeat);
    IF @CancelSeat IS NULL THROW 51012, 'No third free seat for cancellation check.', 1;
    EXEC dbo.sp_DatVe @NguoiDungID=@User,@SuatChieuID=@Show,
      @DanhSachGheId=@CancelSeatList,@NewDonDatVeID=@CancelOrder OUTPUT;
    EXEC dbo.sp_Order_Cancel @NguoiDungID=@User,@DonDatVeID=@CancelOrder;
    IF NOT EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID=@CancelOrder AND TrangThai=N'Đã hủy')
      OR NOT EXISTS(SELECT 1 FROM dbo.CHITIETVE WHERE DonDatVeID=@CancelOrder AND TrangThai=N'Đã hủy')
      THROW 51012, 'Order cancellation failed to release its held ticket.', 1;
  `;
  if ((sqlBody.match(/ROLLBACK TRANSACTION;/gi) ?? []).length !== 2) throw new Error('Smoke source rollback structure changed; refusing dynamic insertion.');
  sqlBody = sqlBody.replace(/ROLLBACK TRANSACTION;/i, `${followup}\nROLLBACK TRANSACTION;`);
  const result = await pool.request().batch(`${sqlBody}\nSELECT CAST(1 AS bit) AS AuditSmokePassed;`);
  const marker = (result.recordsets ?? []).flat().find((row) => row.AuditSmokePassed === true || row.AuditSmokePassed === 1);
  if (!marker) throw new Error('Smoke batch completed without final AuditSmokePassed marker.');
  evidence.tests.push({ name: 'transactional_business_smoke_and_compatibility_aliases', input: 'Active customer/manager/support; available future show and seats; eligible completed order/movie review pair', expected: 'Booking and successful VNPAY callbacks through both Payment_UpdateResult and deployed XuLyThanhToan alias; order cancellation releases held ticket; complaint, review and read paths succeed; outer transaction rolls every row back', actual: { marker, resultRecordsets: (result.recordsets ?? []).length }, verdict: 'PASS' });
  const after = await snapshot(); evidence.after = after;
  const rowCountsUnchanged = same(before.counts, after.counts);
  const identityChanges = listIdentityChanges(before.identities, after.identities);
  evidence.identityGaps = identityChanges;
  const check = await pool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS;');
  const violations = (check.recordsets ?? []).flat();
  const passed = rowCountsUnchanged && violations.length === 0;
  evidence.tests.push({ name: 'post_rollback_rows_identity_and_constraint_integrity', input: 'Full application table count snapshot and DBCC CHECKCONSTRAINTS', expected: 'row counts unchanged; no constraint violations; identity increments, if any, recorded as rollback gaps', actual: { rowCountsUnchanged, identityChanges, checkConstraintViolationCount: violations.length }, verdict: passed ? 'PASS' : 'FAIL' });
  evidence.verdict = passed ? 'PASS' : 'FAIL';
} catch (error) {
  evidence.error = error.message;
  evidence.after = await snapshot().catch((e) => ({ error: e.message }));
  evidence.verdict = 'FAIL';
} finally {
  evidence.finishedUtc = new Date().toISOString();
  fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(evidence, null, 2));
  await pool.close();
  console.log(JSON.stringify({ verdict: evidence.verdict, target: evidence.target, tests: evidence.tests, preflight: evidence.preflight, identityGaps: evidence.identityGaps, error: evidence.error, evidence: path.relative(ROOT, OUT) }, null, 2));
  if (evidence.verdict !== 'PASS') process.exitCode = 1;
}
