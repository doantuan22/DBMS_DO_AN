// Replays the source-reviewed staff-booking transaction regression on exact
// Main. Its built-in Test-only guard and sqlcmd include are removed in memory;
// this runner adds an exact Main identity gate, checks the SQL source contains
// no DDL/transaction commit/external calls, and the SQL suite ends in ROLLBACK.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const sql = require('mssql');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
if (env.DB_DATABASE !== 'CinemaBookingDB') throw new Error('Refusing: backend config does not target exact Main.');
const OUT = path.join(ROOT, '.audit-output', 'main-staff-booking-regression.json');
const priorRestore = JSON.parse(fs.readFileSync(path.join(ROOT, '.audit-output', 'schedule-fix-restore-clone-drill.json'), 'utf8'));
const BACKUP = path.join(ROOT, priorRestore.backup);
if (!fs.existsSync(BACKUP)) throw new Error(`No verified recent Main backup found at ${BACKUP}`);
const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: env.DB_DATABASE,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 180000, pool: { max: 1, min: 1, idleTimeoutMillis: 30000 },
}).connect();
const evidence = { startedUtc: new Date().toISOString(), target: null, backup: path.relative(ROOT, BACKUP), tests: [], verdict: 'BLOCKED' };

async function identity() {
  const id = (await pool.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state`)).recordset[0];
  if (id.serverName !== 'DoanTuanIT' || id.databaseName !== 'CinemaBookingDB' || id.state !== 'ONLINE') throw new Error(`Wrong target: ${JSON.stringify(id)}`);
  return id;
}
async function fingerprint() {
  await identity();
  const tables = (await pool.request().query(`
    SELECT t.object_id,QUOTENAME(s.name)+'.'+QUOTENAME(t.name) AS qualifiedName,
      COALESCE(
        (SELECT STRING_AGG(QUOTENAME(kc.name),',') WITHIN GROUP(ORDER BY ki.key_ordinal)
         FROM sys.indexes ix JOIN sys.index_columns ki ON ki.object_id=ix.object_id AND ki.index_id=ix.index_id
         JOIN sys.columns kc ON kc.object_id=ki.object_id AND kc.column_id=ki.column_id
         WHERE ix.object_id=t.object_id AND ix.is_primary_key=1),
        (SELECT STRING_AGG(QUOTENAME(fc.name),',') WITHIN GROUP(ORDER BY fc.column_id)
         FROM sys.columns fc WHERE fc.object_id=t.object_id)) AS sortColumns
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
    WHERE t.is_ms_shipped=0
    ORDER BY t.object_id;
  `)).recordset;
  const rows = [];
  for (const t of tables) {
    const result = await pool.request().query(`SELECT * FROM ${t.qualifiedName} ORDER BY ${t.sortColumns};`);
    const canonical = JSON.stringify(result.recordset, (key, value) => Buffer.isBuffer(value) ? value.toString('base64') : value);
    rows.push({ table: t.qualifiedName, count: result.recordset.length, sha256: createHash('sha256').update(canonical).digest('hex') });
  }
  const identities = (await pool.request().query(`
    SELECT OBJECT_SCHEMA_NAME(object_id) schemaName,OBJECT_NAME(object_id) tableName,name columnName,
      CONVERT(varchar(80),IDENT_CURRENT(QUOTENAME(OBJECT_SCHEMA_NAME(object_id))+'.'+QUOTENAME(OBJECT_NAME(object_id)))) identityValue
    FROM sys.identity_columns ORDER BY object_id,column_id;
  `)).recordset;
  return { id: await identity(), rows, identities };
}
function identityChanges(before, after) {
  const m = new Map(before.map((x) => [`${x.schemaName}.${x.tableName}.${x.columnName}`, x.identityValue]));
  return after.filter((x) => m.get(`${x.schemaName}.${x.tableName}.${x.columnName}`) !== x.identityValue)
    .map((x) => ({ table: `${x.schemaName}.${x.tableName}`, column: x.columnName, before: m.get(`${x.schemaName}.${x.tableName}.${x.columnName}`), after: x.identityValue }));
}

try {
  const before = await fingerprint(); evidence.target = before.id; evidence.before = before;
  await pool.request().query(`RESTORE VERIFYONLY FROM DISK=N'${BACKUP.replaceAll("'","''")}' WITH CHECKSUM;`);
  const open = (await pool.request().query(`
    SELECT DISTINCT s.session_id,s.program_name
    FROM sys.dm_tran_session_transactions st
    JOIN sys.dm_tran_database_transactions dt ON dt.transaction_id=st.transaction_id
    JOIN sys.dm_exec_sessions s ON s.session_id=st.session_id
    WHERE dt.database_id=DB_ID() AND s.is_user_process=1 AND s.session_id<>@@SPID;
  `)).recordset;
  if (open.length) throw new Error(`Open user transactions detected; refusing test: ${JSON.stringify(open)}`);
  const actorRows = (await pool.request().query(`
    SELECT vt.MaVaiTro,nd.Email,nd.NguoiDungID
    FROM dbo.VAITRO vt CROSS APPLY (
      SELECT TOP(1) u.Email,u.NguoiDungID FROM dbo.NGUOIDUNG u
      WHERE u.VaiTroID=vt.VaiTroID AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID
    ) nd WHERE vt.MaVaiTro IN ('ADMIN','QUAN_LY_RAP','KHACH_HANG','CSKH');
  `)).recordset;
  const roles = new Map(actorRows.map((x) => [x.MaVaiTro, x]));
  for (const role of ['ADMIN','QUAN_LY_RAP','KHACH_HANG','CSKH']) if (!roles.has(role)) throw new Error(`No active Main test actor with role ${role}.`);
  evidence.fixtureRoles = [...roles.keys()];

  let source = fs.readFileSync(path.join(ROOT, 'database', '11_tests', 'staff_booking', 'regression.sql'), 'utf8');
  const guard = /IF DB_NAME\(\) NOT LIKE\('CinemaBooking'\s*\+\s*'DB_R0\[_\]%?'\)\s+AND\s+DB_NAME\(\)\s*<>\s*\('CinemaBooking'\s*\+\s*'DB_Test'\)\s+THROW\s+51059,[\s\S]*?;\s*/i;
  if (!guard.test(source)) throw new Error('Expected isolated-test guard was not found exactly; refusing to transform source.');
  source = source.replace(guard, '');
  source = source.replace(/^\s*:r\s+\.\/12_verify\/verify_fixed_rbac\.sql\s*$/gim, '');
  if (/^\s*:/m.test(source)) throw new Error('Unexpanded SQLCMD directive remains; refusing execution.');
  if (/\b(?:CREATE|ALTER|DROP|TRUNCATE)\s+(?:TRIGGER|TABLE|DATABASE|PROCEDURE|FUNCTION|VIEW|INDEX|SCHEMA|CONSTRAINT)\b/i.test(source)) throw new Error('DDL detected in source test; refusing Main execution.');
  if (/\b(?:COMMIT\s+TRANSACTION|COMMIT\s+TRAN)\b/i.test(source)) throw new Error('Commit detected in source test; refusing Main execution.');
  if (/\b(?:xp_cmdshell|sp_send_dbmail|OPENROWSET|OPENDATASOURCE|sp_OA)\b/i.test(source)) throw new Error('Potential external side effect detected; refusing Main execution.');
  const emails = [['admin1@example.test','ADMIN'],['manager1@example.test','QUAN_LY_RAP'],['customer5@example.test','KHACH_HANG'],['support1@example.test','CSKH']];
  for (const [oldEmail, role] of emails) source = source.replaceAll(`'${oldEmail}'`, `'${String(roles.get(role).Email).replaceAll("'","''")}'`);
  const batches = source.split(/^\s*GO\s*$/gim).map((s) => s.trim()).filter(Boolean);
  if (batches.length !== 1) throw new Error(`Expected one transaction batch after removing GO; found ${batches.length}.`);
  const result = await pool.request().batch(`${batches[0]}\nSELECT CAST(1 AS bit) AS AuditStaffBookingPassed;`);
  const marker = (result.recordsets ?? []).flat().find((x) => x.AuditStaffBookingPassed === true || x.AuditStaffBookingPassed === 1);
  if (!marker) throw new Error('Staff regression completed without its PASS marker.');
  evidence.tests.push({ name: 'staff_booking_success_failure_cancel_and_history_regression', input: 'Active admin, manager, customer and manager-scope bookable show with three available VIP seats; source SQL fixture values; one outer transaction', expected: 'StaffBooking_Create and UpdateSeats succeed; cancellation preserves payment history; stale/invalid/spoof/scope/expired/closed/payment refusal paths match; all writes rolled back', actual: { marker, resultRecordsets: (result.recordsets ?? []).length }, verdict: 'PASS' });

  const after = await fingerprint(); evidence.after = after;
  const dataUnchanged = JSON.stringify(before.rows) === JSON.stringify(after.rows);
  const changedIdentity = identityChanges(before.identities, after.identities);
  evidence.identityGaps = changedIdentity;
  const cc = await pool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS;');
  const violations = (cc.recordsets ?? []).flat();
  const passed = dataUnchanged && violations.length === 0;
  evidence.tests.push({ name: 'post_rollback_full_row_fingerprint_and_constraint_integrity', input: `${before.rows.length} application/support tables; SHA-256 of ordered full rowsets`, expected: 'all persistent table rows byte-for-byte equivalent; no CHECK/FK violations; only SQL identity gaps may advance', actual: { dataUnchanged, identityGaps: changedIdentity, checkConstraintViolationCount: violations.length }, verdict: passed ? 'PASS' : 'FAIL' });
  evidence.verdict = passed ? 'PASS' : 'FAIL';
} catch (error) {
  evidence.error = error.message;
  evidence.verdict = 'FAIL';
  try { evidence.after = await fingerprint(); } catch (e) { evidence.postCheckError = e.message; }
} finally {
  evidence.finishedUtc = new Date().toISOString();
  fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(evidence, null, 2));
  await pool.close();
  console.log(JSON.stringify({ verdict: evidence.verdict, target: evidence.target, tests: evidence.tests, fixtureRoles: evidence.fixtureRoles, identityGaps: evidence.identityGaps, error: evidence.error, evidence: path.relative(ROOT, OUT) }, null, 2));
  if (evidence.verdict !== 'PASS') process.exitCode = 1;
}
