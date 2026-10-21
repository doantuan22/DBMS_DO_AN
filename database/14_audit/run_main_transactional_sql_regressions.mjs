// Runs reviewed, rollback-only SQL business regressions against exact Main.
// Permanent schema changes, transaction commits, external calls and SQLCMD
// directives are rejected before execution. Full ordered table fingerprints
// prove whether any persisted data row changed.
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
const OUT = path.join(ROOT, '.audit-output', 'main-transactional-sql-regressions.json');
const restoreEvidence = JSON.parse(fs.readFileSync(path.join(ROOT, '.audit-output', 'schedule-fix-restore-clone-drill.json'), 'utf8'));
const BACKUP = path.join(ROOT, restoreEvidence.backup);
if (!fs.existsSync(BACKUP)) throw new Error(`No verified current Main backup found at ${BACKUP}`);
const files = [
  { name: 'pricing_contract', file: 'database/11_tests/pricing/contract.sql', passText: 'PASS R0 SQL authoritative base/weekday' },
  { name: 'points_booking_payment_expiry', file: 'database/11_tests/booking/points_payment.sql', passText: 'PASS points_payment' },
];
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
    WHERE t.is_ms_shipped=0 ORDER BY t.object_id;
  `)).recordset;
  const rows = [];
  for (const t of tables) {
    const data = (await pool.request().query(`SELECT * FROM ${t.qualifiedName} ORDER BY ${t.sortColumns};`)).recordset;
    const canonical = JSON.stringify(data, (key, value) => Buffer.isBuffer(value) ? value.toString('base64') : value);
    rows.push({ table: t.qualifiedName, count: data.length, sha256: createHash('sha256').update(canonical).digest('hex') });
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
  if (open.length) throw new Error(`Other Main transaction exists; refusing suite: ${JSON.stringify(open)}`);

  for (const item of files) {
    // Each SQL regression is an independent test session contract. In
    // particular, pricing/contract.sql enables XACT_ABORT and leaves that
    // SET option on its connection, so reset it before the next script.
    await pool.request().batch('SET XACT_ABORT OFF; SET NOCOUNT OFF; SET DATEFIRST 7;');
    let source = fs.readFileSync(path.join(ROOT, item.file), 'utf8');
    if (/^\s*:/m.test(source)) throw new Error(`SQLCMD directive found in ${item.file}; refusing to skip it.`);
    if (/\b(?:CREATE|ALTER|DROP|TRUNCATE)\s+(?:TRIGGER|TABLE|DATABASE|PROCEDURE|FUNCTION|VIEW|INDEX|SCHEMA|CONSTRAINT)\b/i.test(source.replace(/CREATE\s+TABLE\s+#\w+/gi, 'LOCAL_TEMP_TABLE'))) throw new Error(`Permanent DDL found in ${item.file}.`);
    if (/\b(?:COMMIT\s+TRANSACTION|COMMIT\s+TRAN)\b/i.test(source)) throw new Error(`Commit found in ${item.file}.`);
    if (/\b(?:xp_cmdshell|sp_send_dbmail|OPENROWSET|OPENDATASOURCE|sp_OA)\b/i.test(source)) throw new Error(`External side effect found in ${item.file}.`);
    const batches = source.split(/^\s*GO\s*$/gim).map((s) => s.trim()).filter(Boolean);
    if (batches.length !== 1) throw new Error(`Expected one transaction batch in ${item.file}; found ${batches.length}.`);
    const batch = `${batches[0]}\nSELECT N'${item.passText}' AS AuditSqlRegressionPassed;`;
    const result = await pool.request().batch(batch);
    const marker = (result.recordsets ?? []).flat().find((x) => x.AuditSqlRegressionPassed === item.passText);
    if (!marker) throw new Error(`${item.name} completed without its SQL PASS marker.`);
    evidence.tests.push({ name: item.name, file: item.file, input: 'Existing rollback-only SQL regression with temporary business fixtures', expected: `${item.passText}; outer transaction rolls back; no persistent row changes`, actual: { marker, resultRecordsets: (result.recordsets ?? []).length }, verdict: 'PASS' });
  }

  const after = await fingerprint(); evidence.after = after;
  const dataUnchanged = JSON.stringify(evidence.before.rows) === JSON.stringify(after.rows);
  const gaps = identityChanges(evidence.before.identities, after.identities); evidence.identityGaps = gaps;
  const cc = await pool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS;');
  const violations = (cc.recordsets ?? []).flat();
  evidence.tests.push({ name: 'post_suite_full_row_fingerprint_and_integrity', input: `${before.rows.length} ordered full table fingerprints plus DBCC CHECKCONSTRAINTS`, expected: 'same persistent row content; zero violations; report SQL Server identity gaps without reseeding', actual: { dataUnchanged, identityGaps: gaps, violations: violations.length }, verdict: dataUnchanged && violations.length === 0 ? 'PASS' : 'FAIL' });
  evidence.verdict = evidence.tests.every((x) => x.verdict === 'PASS') ? 'PASS' : 'FAIL';
} catch (error) {
  evidence.error = error.message;
  evidence.verdict = 'FAIL';
  try { evidence.after = await fingerprint(); } catch (e) { evidence.postCheckError = e.message; }
} finally {
  evidence.finishedUtc = new Date().toISOString();
  fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(evidence, null, 2));
  await pool.close();
  console.log(JSON.stringify({ verdict: evidence.verdict, target: evidence.target, tests: evidence.tests, identityGaps: evidence.identityGaps, error: evidence.error, evidence: path.relative(ROOT, OUT) }, null, 2));
  if (evidence.verdict !== 'PASS') process.exitCode = 1;
}
