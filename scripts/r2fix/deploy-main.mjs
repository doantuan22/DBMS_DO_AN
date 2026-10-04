// Offline deployment only; never imported by the backend.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sql from '../../backend/node_modules/mssql/index.js';
import { credentials, dbRoot, root, read, write, expandSql, normalizeModule } from '../db/lib.mjs';
import { batches } from './migration-lib.mjs';

const database = 'CinemaBookingDB';
if (!process.argv.includes('--apply') || !process.argv.includes('--cleanup-tests'))
  throw Error('Explicit --apply --cleanup-tests required. Deletes CinemaBooking trial databases and upgrades the main DB in place.');
const env = credentials();
assert.equal(env.DB_DATABASE, database, 'Application must target CinemaBookingDB.');
const config = { server: env.DB_SERVER || 'localhost', port: Number(env.DB_PORT || 1433), user: env.DB_USER,
  password: env.DB_PASSWORD, requestTimeout: 180000,
  options: { encrypt: env.DB_ENCRYPT === 'true', trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE !== 'false', useUTC: true } };
const files = [
  '05_functions/fn_TinhBoiThuongVe.sql',
  '08_procedures/customer/sp_Order_ExpirePending.sql',
  '08_procedures/payment/sp_Payment_CreateAttempt.sql',
  '08_procedures/payment/sp_Payment_UpdateResult.sql',
  '08_procedures/customer/sp_Order_GetDetailByCustomer.sql',
  '08_procedures/system/sp_Showtime_CancelCascade.sql',
];
const manifest = JSON.parse(read(path.join(dbRoot, 'baseline-manifest.json')));
const quote = name => '[' + name.replaceAll(']', ']]') + ']';
const evidenceFile = path.join(root, 'audit/remediation/r2fix/evidence/main-deployment.json');
const prior = fs.existsSync(evidenceFile) ? JSON.parse(read(evidenceFile)) : null;
const priorAttempt = prior ? { ...prior } : null;
if (priorAttempt) delete priorAttempt.previousAttempts;
const evidence = { database, startedAt: new Date().toISOString(), status: 'RUNNING',
  deletedTestDatabases: prior?.deletedTestDatabases || [], deployedFiles: files,
  previousAttempts: prior ? [...(prior.previousAttempts || []), priorAttempt] : [] };
const save = () => write(evidenceFile, evidence);
const request = (provider, statement) => new sql.Request(provider).query(statement);
const expectedDefinition = file => {
  const body = read(path.join(dbRoot, file));
  const match = /\bCREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(body);
  return normalizeModule(body.slice(match.index).replace(/\s+GO\s*$/i, ''));
};
async function sourceParity(provider, allowPending) {
  const modules = (await request(provider, 'SELECT o.name,m.definition,m.uses_ansi_nulls,m.uses_quoted_identifier FROM sys.objects o JOIN sys.sql_modules m ON m.object_id=o.object_id WHERE o.is_ms_shipped=0')).recordset;
  const drift = [];
  for (const [name, file] of Object.entries(manifest.modules)) {
    if (allowPending && files.includes(file)) continue;
    const actual = modules.find(m => m.name === name);
    const options = manifest.expected.objects.find(m => m.name === name);
    if (!actual || normalizeModule(actual.definition) !== expectedDefinition(file)
      || actual.uses_ansi_nulls !== Boolean(options.uses_ansi_nulls)
      || actual.uses_quoted_identifier !== Boolean(options.uses_quoted_identifier)) drift.push(name);
  }
  assert.deepEqual(drift, [], 'Unexpected source definition/SET option drift.');
  return Object.keys(manifest.modules).length - (allowPending ? files.length : 0);
}
async function fingerprint(provider, tables, lock) {
  const result = [];
  for (const t of tables) {
    const table = quote(t.schemaName) + '.' + quote(t.name);
    const count = (await request(provider, `SELECT COUNT_BIG(*) AS n FROM ${table}${lock ? ' WITH(TABLOCKX,HOLDLOCK)' : ''}`)).recordset[0].n;
    const keys = (await request(provider, `SELECT c.name FROM sys.indexes i JOIN sys.index_columns k ON k.object_id=i.object_id AND k.index_id=i.index_id JOIN sys.columns c ON c.object_id=k.object_id AND c.column_id=k.column_id WHERE i.is_primary_key=1 AND i.object_id=${Number(t.object_id)} ORDER BY k.key_ordinal`)).recordset;
    assert.ok(keys.length, 'Data fingerprint requires a primary key: ' + table);
    const data = (await request(provider, `SELECT (SELECT * FROM ${table} ORDER BY ${keys.map(k => quote(k.name)).join(',')} FOR JSON PATH,INCLUDE_NULL_VALUES) AS payload`)).recordset[0].payload;
    assert.ok(data !== null || Number(count) === 0, 'Nonempty table must have a JSON payload: ' + table);
    result.push({ table, rows: Number(count), sha256: crypto.createHash('sha256').update(data ?? '[]').digest('hex') });
  }
  return result;
}

let master, pool, transaction, open = false;
try {
  master = await new sql.ConnectionPool({ ...config, database: 'master' }).connect();
  pool = await new sql.ConnectionPool({ ...config, database }).connect();
  evidence.preflightSourceModules = await sourceParity(pool, true);
  const names = (await master.request().query('SELECT name FROM sys.databases WHERE database_id>4')).recordset.map(d => d.name);
  const trials = names.filter(n => /^CinemaBookingDB_R0_[A-Za-z0-9_]+$/.test(n) || ['CinemaBookingDB_AuditScratch', 'CinemaBookingDB_RepoCheck'].includes(n)).sort();
  assert.ok(!trials.includes(database));
  evidence.testDatabasesIdentified = [...new Set([...(prior?.testDatabasesIdentified || []), ...trials])].sort();
  const dir = (await master.request().query("SELECT CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultBackupPath')) AS Directory")).recordset[0].Directory;
  assert.ok(dir, 'SQL Server backup directory unavailable.');
  const backupPath = dir.replace(/[\\/]?$/, '\\') + `CinemaBookingDB_pre_R2_R2FIX_${Date.now()}.bak`;
  await master.request().input('BackupPath', sql.NVarChar(4000), backupPath)
    .query('BACKUP DATABASE [CinemaBookingDB] TO DISK=@BackupPath WITH COPY_ONLY,CHECKSUM; RESTORE VERIFYONLY FROM DISK=@BackupPath WITH CHECKSUM;');
  write(path.join(dbRoot, '_audit/R2FIX-recovery-location.local.json'), { database, path: backupPath, checksum: true, restoreVerified: true, at: new Date().toISOString() });
  evidence.backup = { copyOnly: true, checksum: true, restoreVerified: true, recoveryLocation: 'database/_audit/R2FIX-recovery-location.local.json' };
  save();
  console.log('PASS main database backup and RESTORE VERIFYONLY');
  for (const name of trials) {
    assert.ok(/^CinemaBookingDB_R0_[A-Za-z0-9_]+$/.test(name) || ['CinemaBookingDB_AuditScratch', 'CinemaBookingDB_RepoCheck'].includes(name));
    await master.request().query(`ALTER DATABASE ${quote(name)} SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE ${quote(name)};`);
    evidence.deletedTestDatabases.push(name); save();
    console.log('Deleted trial database: ' + name);
  }
  const remaining = (await master.request().query('SELECT name FROM sys.databases WHERE database_id>4')).recordset.map(d => d.name).sort();
  assert.deepEqual(remaining, names.filter(n => !trials.includes(n)).sort(), 'Cleanup must preserve all other databases.');
  evidence.cleanupVerified = true;
  console.log(`PASS cleanup: ${trials.length} trial databases deleted; all other databases preserved`);

  transaction = new sql.Transaction(pool);
  transaction.on('rollback', () => { open = false; });
  await transaction.begin(); open = true;
  await request(transaction, 'SET XACT_ABORT ON; SET LOCK_TIMEOUT 30000;');
  const tables = (await request(transaction, "SELECT object_id,SCHEMA_NAME(schema_id) AS schemaName,name FROM sys.tables WHERE is_ms_shipped=0 AND name<>N'BOITHUONG_HUYSUAT' ORDER BY SCHEMA_NAME(schema_id),name")).recordset;
  evidence.dataBefore = await fingerprint(transaction, tables, true);
  const hasLedger = (await request(transaction, "SELECT OBJECT_ID(N'dbo.BOITHUONG_HUYSUAT',N'U') AS id")).recordset[0].id;
  evidence.compensationSchemaBefore = hasLedger ? 'Existing ledger: guarded in-place migration' : 'Absent: main database is the 26-table baseline';
  if (hasLedger) await batches(transaction, read(path.join(dbRoot, '13_migrations/r2fix_compensation_3nf.sql')));
  else await batches(transaction, read(path.join(dbRoot, '02_tables/boithuong_huysuat.sql')));
  for (const file of files) await batches(transaction, read(path.join(dbRoot, file)));
  await batches(transaction, read(path.join(dbRoot, '11_tests/payment/compensation_schema.sql')));
  await batches(transaction, expandSql('12_verify/verify_database.sql'));
  evidence.modulesVerified = await sourceParity(transaction, false);
  evidence.dataAfter = await fingerprint(transaction, tables, false);
  assert.deepEqual(evidence.dataAfter, evidence.dataBefore, 'All existing table data must be preserved exactly.');
  evidence.schemaAfter = (await request(transaction, "SELECT c.name,TYPE_NAME(c.system_type_id) AS typeName,c.max_length,c.is_nullable,c.is_identity FROM sys.columns c WHERE c.object_id=OBJECT_ID(N'dbo.BOITHUONG_HUYSUAT') ORDER BY c.column_id")).recordset;
  evidence.tableCountAfter = (await request(transaction, 'SELECT COUNT(*) AS n FROM sys.tables WHERE is_ms_shipped=0')).recordset[0].n;
  await transaction.commit(); open = false;
  evidence.dataPreserved = true; evidence.status = 'PASS'; evidence.finishedAt = new Date().toISOString(); save();
  console.log(`PASS atomic R2 + R2-FIX deployment: ${evidence.tableCountAfter} tables, ${evidence.modulesVerified} modules; all ${tables.length} existing tables have identical data fingerprints`);
} catch (error) {
  if (open) { await transaction.rollback(); open = false; }
  evidence.status = 'FAIL'; evidence.error = error.message; evidence.finishedAt = new Date().toISOString(); save();
  throw error;
} finally {
  if (pool) await pool.close();
  if (master) await master.close();
}
