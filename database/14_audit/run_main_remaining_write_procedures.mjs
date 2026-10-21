// Runs validation/refusal paths for write-capable procedures on exact Main.
// Every call has an independent outer transaction which is always rolled back.
// No valid actor is supplied; successful write paths are intentionally not invoked.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const sql = require('mssql');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
if (env.DB_DATABASE !== 'CinemaBookingDB') throw new Error('Refusing: backend config is not the Main database.');
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, '.audit-output', 'main-source-procedure-inventory.json'), 'utf8'));
const prior = JSON.parse(fs.readFileSync(path.join(ROOT, '.audit-output', 'main-readonly-procedures.json'), 'utf8'));
const done = new Set(prior.results.map((x) => x.name.split(' ')[0].toLowerCase()));
const candidates = inventory.objects.filter((x) => x.writeCapable && !done.has(x.name.toLowerCase()));
const pool = await new sql.ConnectionPool({
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
}).connect();

const evidence = {
  startedUtc: new Date().toISOString(),
  target: null,
  mode: 'invalid-actor/validation-only; one caller transaction per procedure; rollback always',
  planned: candidates.length,
  tests: [],
  verdict: 'BLOCKED',
};

async function identity() {
  const row = (await pool.request().query(`
    SELECT @@SERVERNAME AS serverName, DB_NAME() AS databaseName,
           CONVERT(nvarchar(30), DATABASEPROPERTYEX(DB_NAME(),'Status')) AS state
  `)).recordset[0];
  if (row.serverName !== 'DoanTuanIT' || row.databaseName !== 'CinemaBookingDB' || row.state !== 'ONLINE') {
    throw new Error(`Wrong target: ${JSON.stringify(row)}`);
  }
  return row;
}

async function snapshot() {
  const id = await identity();
  const counts = (await pool.request().query(`
    SELECT s.name AS schemaName,t.name AS tableName,SUM(ps.row_count) AS row_count
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
    JOIN sys.dm_db_partition_stats ps ON ps.object_id=t.object_id AND ps.index_id IN (0,1)
    WHERE t.is_ms_shipped=0 GROUP BY s.name,t.name ORDER BY s.name,t.name
  `)).recordset;
  const identities = (await pool.request().query(`
    SELECT OBJECT_SCHEMA_NAME(object_id) AS schemaName,OBJECT_NAME(object_id) AS tableName,
           name AS columnName,IDENT_CURRENT(QUOTENAME(OBJECT_SCHEMA_NAME(object_id))+'.'+QUOTENAME(OBJECT_NAME(object_id))) AS identityValue
    FROM sys.identity_columns ORDER BY object_id,column_id
  `)).recordset;
  return { id, counts, identities };
}

const paramRows = (await pool.request().query(`
  SELECT o.name AS procedureName,p.name AS parameterName,p.parameter_id,p.max_length,p.precision,p.scale,
         p.is_output,t.name AS typeName
  FROM sys.procedures o JOIN sys.parameters p ON p.object_id=o.object_id
  JOIN sys.types t ON t.user_type_id=p.user_type_id
  WHERE SCHEMA_NAME(o.schema_id)='dbo' AND o.is_ms_shipped=0
  ORDER BY o.name,p.parameter_id
`)).recordset;
const params = new Map();
for (const row of paramRows) {
  const key = row.procedureName.toLowerCase();
  if (!params.has(key)) params.set(key, []);
  params.get(key).push(row);
}

function typeFor(p) {
  const n = p.typeName.toLowerCase();
  if (n === 'int') return sql.Int;
  if (n === 'smallint') return sql.SmallInt;
  if (n === 'tinyint') return sql.TinyInt;
  if (n === 'bigint') return sql.BigInt;
  if (n === 'bit') return sql.Bit;
  if (n === 'date') return sql.Date;
  if (n === 'datetime') return sql.DateTime;
  if (n === 'datetime2') return sql.DateTime2(p.scale);
  if (n === 'uniqueidentifier') return sql.UniqueIdentifier;
  if (n === 'decimal' || n === 'numeric') return sql.Decimal(p.precision, p.scale);
  if (n === 'money') return sql.Money;
  if (n === 'float') return sql.Float;
  if (n === 'real') return sql.Real;
  if (n === 'varchar') return p.max_length < 0 ? sql.VarChar(sql.MAX) : sql.VarChar(Math.max(1, p.max_length));
  if (n === 'char') return sql.Char(Math.max(1, p.max_length));
  if (n === 'nvarchar') return p.max_length < 0 ? sql.NVarChar(sql.MAX) : sql.NVarChar(Math.max(1, p.max_length / 2));
  if (n === 'nchar') return sql.NChar(Math.max(1, p.max_length / 2));
  if (n === 'varbinary') return p.max_length < 0 ? sql.VarBinary(sql.MAX) : sql.VarBinary(p.max_length);
  if (n === 'binary') return sql.Binary(p.max_length);
  return sql.NVarChar(sql.MAX);
}

const AUDIT_ID = -2147483647;
const future = new Date('2045-01-01T12:00:00.000Z');
const futureEnd = new Date('2045-01-01T14:00:00.000Z');
function valueFor(proc, p, fixtures) {
  const name = proc.name.toLowerCase();
  const key = p.parameterName.replace(/^@/, '').toLowerCase();
  if (p.is_output) return null;
  if (['actorid', 'adminid', 'nguoidungid'].includes(key)) {
    if (name === 'sp_order_cancel') return fixtures.customerId;
    return AUDIT_ID;
  }
  if (key === 'portalrole') return 'ADMIN';
  if (key === 'ngaysinh') return new Date('9999-12-31T00:00:00.000Z');
  if (key === 'ngaybatdau') return new Date('2045-01-01T00:00:00.000Z');
  if (key === 'ngayketthuc') return new Date('2045-01-02T00:00:00.000Z');
  if (key === 'thoi gianbatdau' || key === 'thoigianbatdau') return future;
  if (key === 'thoi gianketthuc' || key === 'thoigianketthuc') return futureEnd;
  if (key === 'ngaykhoichieu') return new Date('2045-01-01T00:00:00.000Z');
  if (key === 'maquyenidlist' || key === 'danhsachjson') return '[]';
  if (['danhsachgheid', 'expectedveidlist'].includes(key)) return String(AUDIT_ID);
  if (key === 'ngaybatdau' || key === 'ngayketthuc') return null;
  if (key === 'so sao') return 5;
  if (key === 'sosao') return 5;
  if (key === 'diemsudung') return 0;
  if (key === 'chixemtruoc' || key === 'laanhdaidien' || key === 'capnhatdieukien') return false;
  if (key === 'numrows' || key === 'seatsperrow') return 1;
  if (key === 'viprows') return 0;
  if (key === 'soluong') return 1;
  if (key === 'traveketqua') return true;
  if (key === 'page') return 1;
  if (key === 'pagesize') return 20;
  if (key === 'gia' || key === 'phuthu' || key === 'giatrigiam' || key === 'donhangtoithieu' || key === 'giamtoida' || key === 'giavecoban') return 1000;
  if (key === 'maCode'.toLowerCase()) return `AUDIT-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  if (key === 'email') return `audit-${Date.now()}@invalid.example`;
  if (key === 'matkhauhash' || key === 'newpasswordhash') return 'AUDIT-NOT-COMMITTED';
  if (key === 'url' || key === 'posterurl' || key === 'trailerurl' || key === 'hinhanh') return 'https://audit.invalid/never-committed';
  if (key === 'search' || key === 'searchterm') return '__AUDIT_NO_MATCH__';
  if (key.includes('trangthai')) return 'Hoạt động';
  if (key === 'loaingay') return 'Ngày thường';
  if (key === 'loaighe') return 'Thường';
  if (key === 'dinh dang' || key === 'dinhdang') return '2D';
  if (key === 'loaigiamgia') return 'Phần trăm';
  if (key === 'phuongthuc') return 'Audit';
  if (key === 'trangthaithanhtoan') return 'Thất bại';
  if (key === 'noidung' || key === 'noidungxuly' || key === 'ketquaxuly') return 'Audit validation path; transaction rollback';
  if (key === 'loaitinnhan') return 'Nội bộ';
  if (key === 'mucdouutien') return 'Trung bình';
  if (key === 'ngaytao') return future;
  if (key === 'nguoimoiid') return AUDIT_ID;
  if (p.typeName.toLowerCase() === 'bit') return false;
  if (p.typeName.toLowerCase() === 'date' || p.typeName.toLowerCase().startsWith('datetime')) return future;
  if (['int','smallint','tinyint','bigint'].includes(p.typeName.toLowerCase())) return AUDIT_ID;
  if (['decimal','numeric','money','float','real'].includes(p.typeName.toLowerCase())) return 1;
  if (p.typeName.toLowerCase().includes('char') || p.typeName.toLowerCase() === 'text') return 'AUDIT';
  return null;
}
function fitString(p, value) {
  if (typeof value !== 'string' || p.max_length < 0) return value;
  const isUnicode = ['nchar', 'nvarchar'].includes(p.typeName.toLowerCase());
  return value.slice(0, Math.max(1, isUnicode ? p.max_length / 2 : p.max_length));
}

function expectedError(proc) {
  const n = proc.name.toLowerCase();
  if (n === 'sp_order_expirepending') return null;
  if (n === 'sp_auth_registercustomer' || n === 'sp_user_updateprofile') return 50400;
  if (n === 'sp_user_changepassword') return 50016;
  if (n === 'sp_order_cancel') return 50034;
  return 50300;
}

try {
  const before = await snapshot();
  evidence.target = before.id;
  evidence.before = before;
  const fx = (await pool.request().query(`
    SELECT TOP(1) u.NguoiDungID AS customerId
    FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID
    WHERE r.MaVaiTro='KHACH_HANG' AND u.TrangThai=N'Hoạt động'
    ORDER BY u.NguoiDungID
  `)).recordset[0];
  if (!fx?.customerId) throw new Error('No existing active customer ID for safe order-cancel not-found test.');
  const fixtures = { ...fx };

  for (let i = 0; i < candidates.length; i += 1) {
    const proc = candidates[i];
    const expected = expectedError(proc);
    const test = {
      procedure: proc.name,
      category: 'WRITE_CAPABLE_VALIDATION_PATH',
      input: proc.name.toLowerCase() === 'sp_order_expirepending'
        ? 'nonexistent SuatChieuID; expect zero expired orders; caller transaction rolled back'
        : proc.name.toLowerCase() === 'sp_order_cancel'
        ? 'existing customer; nonexistent order ID; caller transaction rolled back'
        : 'invalid actor ID; source-backed early validation; caller transaction rolled back',
      expected: expected === null ? 'one result row with SoDonHetHan=0; no persisted change after rollback' : `error ${expected}; no persisted change after rollback`,
      actual: null,
      recordsetRows: [],
      verdict: 'FAIL',
    };
    try {
      await identity();
      const tx = new sql.Transaction(pool);
      await tx.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
      try {
        const request = tx.request();
        for (const p of params.get(proc.name.toLowerCase()) ?? []) {
          const type = typeFor(p);
          const value = fitString(p, valueFor(proc, p, fixtures));
          if (p.is_output) request.output(p.parameterName.slice(1), type);
          else request.input(p.parameterName.slice(1), type, value);
        }
        const actual = await request.execute(`dbo.${proc.name}`);
        test.recordsetRows = (actual.recordsets ?? []).map((set) => set.length);
        if (proc.name.toLowerCase() === 'sp_order_expirepending') {
          const expired = actual.recordset?.[0]?.SoDonHetHan;
          test.actual = `success; SoDonHetHan=${expired ?? 'missing'}`;
          test.verdict = expired === 0 && test.recordsetRows.length === 1 && test.recordsetRows[0] === 1 ? 'PASS' : 'FAIL';
          try { await tx.rollback(); } catch (rollbackError) { test.rollbackError = rollbackError.message; }
          evidence.tests.push(test);
          if (test.verdict !== 'PASS') {
            evidence.stopReason = 'sp_Order_ExpirePending did not return the expected zero-row no-op result.';
            break;
          }
          continue;
        }
        test.actual = 'success (unexpected; rollback requested)';
        try { await tx.rollback(); } catch (rollbackError) { test.rollbackError = rollbackError.message; }
        test.verdict = 'FAIL';
        test.unexpectedSuccess = true;
        evidence.tests.push(test);
        evidence.stopReason = `Unexpected success in write-capable ${proc.name}; remaining writer calls were not attempted.`;
        break;
      } catch (error) {
        const number = Number(error.number ?? error.originalError?.info?.number ?? 0);
        test.actual = `error ${number || 'unknown'}`;
        test.errorMessage = error.message;
        try { await tx.rollback(); } catch (rollbackError) { test.rollbackError = rollbackError.message; }
        test.verdict = number === expected ? 'PASS' : 'FAIL';
      }
    } catch (error) {
      test.actual = `harness error: ${error.message}`;
      test.verdict = 'FAIL';
    }
    evidence.tests.push(test);

    if ((i + 1) % 10 === 0 || i === candidates.length - 1 || test.verdict !== 'PASS') {
      const checkpoint = await snapshot();
      const unchanged = JSON.stringify(evidence.before.counts) === JSON.stringify(checkpoint.counts)
        && JSON.stringify(evidence.before.identities) === JSON.stringify(checkpoint.identities);
      evidence.checkpoints ??= [];
      evidence.checkpoints.push({ after: i + 1, unchanged, target: checkpoint.id });
      if (!unchanged) {
        evidence.stopReason = `Row count or identity fingerprint changed after procedure ${proc.name}; stopped for safety.`;
        evidence.after = checkpoint;
        break;
      }
    }
    if (test.verdict !== 'PASS') {
      evidence.stopReason ??= `Observed error did not match the source-backed expected code for ${proc.name}; inspect before proceeding.`;
      break;
    }
  }

  evidence.after ??= await snapshot();
  evidence.stateUnchanged = JSON.stringify(evidence.before.counts) === JSON.stringify(evidence.after.counts)
    && JSON.stringify(evidence.before.identities) === JSON.stringify(evidence.after.identities);
  evidence.failures = evidence.tests.filter((x) => x.verdict === 'FAIL');
  evidence.verdict = evidence.tests.length === candidates.length
    && evidence.failures.length === 0 && evidence.stateUnchanged ? 'PASS' : 'FAIL';
} catch (error) {
  evidence.error = error.message;
  evidence.after = await snapshot().catch((snapshotError) => ({ error: snapshotError.message }));
  evidence.verdict = 'FAIL';
} finally {
  evidence.finishedUtc = new Date().toISOString();
  const out = path.join(ROOT, '.audit-output', 'main-remaining-write-procedures.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(evidence, null, 2));
  await pool.close();
  console.log(JSON.stringify({
    verdict: evidence.verdict,
    target: evidence.target,
    planned: evidence.planned,
    executed: evidence.tests.length,
    pass: evidence.tests.filter((x) => x.verdict === 'PASS').length,
    fail: evidence.tests.filter((x) => x.verdict === 'FAIL').length,
    stateUnchanged: evidence.stateUnchanged,
    stopReason: evidence.stopReason,
    error: evidence.error,
    evidence: path.relative(ROOT, out),
  }, null, 2));
  if (evidence.verdict !== 'PASS') process.exitCode = 1;
}
