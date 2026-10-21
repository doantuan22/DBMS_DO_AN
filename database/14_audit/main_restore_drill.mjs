// Restores the verified Main backup into a unique throwaway database, checks
// recovery/inventory, then drops only the exact database created by this run.
// CinemaBookingDB and CinemaBookingDB_Test are never restore/drop targets.
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const sql = require('mssql');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
const MAIN = 'CinemaBookingDB';
const TEST = 'CinemaBookingDB_Test';
const BACKUP = path.join(ROOT, '.audit-output', 'database-backups', `${MAIN}_pre_cleanup_20261021101655.bak`);
const OUT = path.join(ROOT, '.audit-output');
const runId = `${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
const TARGET = `${MAIN}_RestoreAudit_${runId}`;
const DATA_FILE = path.join(path.dirname(BACKUP), `${TARGET}.mdf`);
const LOG_FILE = path.join(path.dirname(BACKUP), `${TARGET}.ldf`);
const quote = (s) => String(s).replaceAll("'", "''");
const ident = (s) => `[${String(s).replaceAll(']', ']]')}]`;
const evidence = {
  runId, startedUtc: new Date().toISOString(), server: null, main: MAIN,
  protectedDatabase: TEST, restoreTarget: TARGET, backup: path.relative(ROOT, BACKUP),
  backupBytes: fs.existsSync(BACKUP) ? fs.statSync(BACKUP).size : null,
  verdict: 'BLOCKED', phases: [],
};
let master;
let restoreIssued = false;
let restoreSucceeded = false;
let targetCreateFloor = null;

function makeConfig(database) {
  for (const key of ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD']) {
    if (!env[key]) throw new Error(`backend/.env missing ${key}`);
  }
  if (env.DB_DATABASE !== MAIN) throw new Error(`Refusing: backend/.env targets ${env.DB_DATABASE}, expected ${MAIN}`);
  return {
    server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database,
    user: env.DB_USER, password: env.DB_PASSWORD,
    options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
    requestTimeout: 300000,
  };
}

async function dbSnapshot(name) {
  const { recordset } = await master.request().input('name', sql.NVarChar(128), name).query(`
    SELECT d.name, d.database_id, d.state_desc, d.create_date, d.recovery_model_desc,
      (SELECT COUNT(*) FROM sys.master_files mf WHERE mf.database_id=d.database_id) AS files
    FROM sys.databases d WHERE d.name=@name;
  `);
  if (!recordset[0]) return null;
  const cn = await new sql.ConnectionPool(makeConfig(name)).connect();
  try {
    const { recordset: objects } = await cn.request().query(`
      SELECT
        (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped=0) AS tables,
        (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped=0) AS procedures,
        (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped=0) AS views,
        (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped=0) AS functions,
        (SELECT COUNT(*) FROM sys.triggers WHERE parent_class=1 AND is_ms_shipped=0) AS triggers,
        (SELECT COUNT(*) FROM sys.key_constraints) AS keyConstraints,
        (SELECT COUNT(*) FROM sys.foreign_keys) AS foreignKeys,
        (SELECT COUNT(*) FROM sys.check_constraints) AS checkConstraints,
        (SELECT COUNT(*) FROM sys.indexes WHERE index_id>0 AND is_hypothetical=0) AS indexes,
        (SELECT COUNT(*) FROM sys.dm_db_partition_stats WHERE index_id IN (0,1)) AS tableRowPartitions;
    `);
    const tableCounts = await cn.request().query(`
      SELECT s.name AS schemaName,t.name AS tableName, SUM(ps.row_count) AS row_count
      FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
      JOIN sys.dm_db_partition_stats ps ON ps.object_id=t.object_id AND ps.index_id IN (0,1)
      WHERE t.is_ms_shipped=0 GROUP BY s.name,t.name ORDER BY s.name,t.name;
    `);
    return { ...recordset[0], objects: objects[0], tableCounts: tableCounts.recordset };
  } finally { await cn.close(); }
}

async function requireIdentity(pool, expectedDb) {
  const row = (await pool.request().query(`SELECT @@SERVERNAME AS serverName, DB_NAME() AS databaseName, DATABASEPROPERTYEX(DB_NAME(),'Status') AS state`)).recordset[0];
  if (row.databaseName !== expectedDb || row.state !== 'ONLINE') throw new Error(`Target identity/state mismatch: ${row.serverName}/${row.databaseName}/${row.state}`);
  return row;
}

async function main() {
  if (!fs.existsSync(BACKUP)) throw new Error(`Verified backup missing: ${BACKUP}`);
  fs.mkdirSync(path.dirname(BACKUP), { recursive: true });
  if (fs.existsSync(DATA_FILE) || fs.existsSync(LOG_FILE)) throw new Error('Refusing: unique restore data/log path already exists.');
  master = await new sql.ConnectionPool(makeConfig('master')).connect();
  const server = (await master.request().query(`SELECT @@SERVERNAME AS serverName, SERVERPROPERTY('ProductVersion') AS productVersion`)).recordset[0];
  evidence.server = server.serverName;
  if (server.serverName !== 'DoanTuanIT') throw new Error(`Refusing unexpected SQL Server: ${server.serverName}`);

  const before = {};
  for (const name of [MAIN, TEST, TARGET]) before[name] = await dbSnapshot(name);
  if (!before[MAIN] || before[MAIN].state_desc !== 'ONLINE') throw new Error('Main database missing or not ONLINE.');
  if (!before[TEST] || before[TEST].state_desc !== 'ONLINE') throw new Error('Protected Test database missing or not ONLINE; refusing drill.');
  if (before[TARGET]) throw new Error('Unique restore target unexpectedly exists; refusing to overwrite.');
  evidence.phases.push({ name: 'preflight_identity_and_snapshots', verdict: 'PASS', server, before });

  await master.request().batch(`RESTORE VERIFYONLY FROM DISK=N'${quote(BACKUP)}' WITH CHECKSUM;`);
  evidence.phases.push({ name: 'restore_verifyonly_checksum', verdict: 'PASS' });
  const files = (await master.request().query(`RESTORE FILELISTONLY FROM DISK=N'${quote(BACKUP)}';`)).recordset;
  const dataFiles = files.filter((f) => f.Type === 'D');
  const logFiles = files.filter((f) => f.Type === 'L');
  if (dataFiles.length !== 1 || logFiles.length !== 1) throw new Error(`Expected exactly one data/log backup file; got ${dataFiles.length}/${logFiles.length}.`);

  targetCreateFloor = new Date(Date.now() - 5000);
  restoreIssued = true;
  await master.request().batch(`
    RESTORE DATABASE ${ident(TARGET)} FROM DISK=N'${quote(BACKUP)}'
    WITH MOVE N'${quote(dataFiles[0].LogicalName)}' TO N'${quote(DATA_FILE)}',
         MOVE N'${quote(logFiles[0].LogicalName)}' TO N'${quote(LOG_FILE)}',
         RECOVERY, CHECKSUM, STATS=10;
  `);
  restoreSucceeded = true;

  const restored = await new sql.ConnectionPool(makeConfig(TARGET)).connect();
  try {
    const identity = await requireIdentity(restored, TARGET);
    const inventory = (await restored.request().query(`
      SELECT
        (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped=0) AS tables,
        (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped=0) AS procedures,
        (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped=0) AS views,
        (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped=0) AS functions,
        (SELECT COUNT(*) FROM sys.triggers WHERE parent_class=1 AND is_ms_shipped=0) AS triggers,
        (SELECT COUNT(*) FROM sys.key_constraints) AS keyConstraints,
        (SELECT COUNT(*) FROM sys.foreign_keys) AS foreignKeys,
        (SELECT COUNT(*) FROM sys.check_constraints) AS checkConstraints,
        (SELECT COUNT(*) FROM sys.indexes WHERE index_id>0 AND is_hypothetical=0) AS indexes,
        (SELECT COUNT(*) FROM sys.dm_db_partition_stats WHERE index_id IN (0,1)) AS tableRowPartitions;
    `)).recordset[0];
    const expected = before[MAIN].objects;
    for (const [k,v] of Object.entries(expected)) if (Number(inventory[k]) !== v) throw new Error(`Restore inventory mismatch ${k}: expected ${v}, actual ${inventory[k]}`);
    const dbcc = await restored.request().query(`DBCC CHECKDB (${ident(TARGET)}) WITH NO_INFOMSGS;`);
    const dbccRows = (dbcc.recordset ?? []).map((r) => Object.values(r).map(String));
    evidence.phases.push({ name: 'restored_db_identity_inventory_dbcc', verdict: 'PASS', identity, expectedInventory: expected, inventory, dbccRows });
  } finally { await restored.close(); }

  const afterRestore = await dbSnapshot(TARGET);
  if (!afterRestore || afterRestore.state_desc !== 'ONLINE') throw new Error('Restored database is not ONLINE after verification.');
  if (JSON.stringify(afterRestore.tableCounts) !== JSON.stringify(before[MAIN].tableCounts)) throw new Error('Restored table row counts do not match the Main backup-source snapshot.');
  evidence.phases.push({ name: 'restored_row_count_snapshot_matches_main', verdict: 'PASS', sourceRows: before[MAIN].tableCounts.length, restoredRows: afterRestore.tableCounts.length });
} 

async function cleanup() {
  if (!master || !restoreIssued) return;
  const row = (await master.request().input('name', sql.NVarChar(128), TARGET).query(`
    SELECT d.name,d.state_desc,d.create_date,h.destination_database_name,h.restore_date
    FROM sys.databases d LEFT JOIN msdb.dbo.restorehistory h ON h.destination_database_name=d.name
    WHERE d.name=@name;
  `)).recordset[0];
  if (!row) {
    evidence.phases.push({ name: 'restore_target_cleanup', verdict: restoreSucceeded ? 'FAIL' : 'PASS', detail: 'No target database to clean up.' });
    return;
  }
  const exactAllowed = TARGET.startsWith(`${MAIN}_RestoreAudit_`) && TARGET !== MAIN && TARGET !== TEST;
  const createdDuringRun = row.create_date >= targetCreateFloor;
  const hasRestoreHistory = row.destination_database_name === TARGET && row.restore_date >= targetCreateFloor;
  if (!exactAllowed || !createdDuringRun || !hasRestoreHistory) {
    evidence.phases.push({ name: 'restore_target_cleanup', verdict: 'BLOCKED', detail: 'Target identity/creation/restore history did not prove ownership; left untouched.', row });
    return;
  }
  await master.request().batch(`ALTER DATABASE ${ident(TARGET)} SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE ${ident(TARGET)};`);
  const remains = (await master.request().input('name', sql.NVarChar(128), TARGET).query(`SELECT name FROM sys.databases WHERE name=@name;`)).recordset.length > 0;
  if (remains) throw new Error('Exact restore target remains after DROP DATABASE.');
  for (const file of [DATA_FILE, LOG_FILE]) if (fs.existsSync(file)) fs.unlinkSync(file);
  evidence.phases.push({ name: 'restore_target_cleanup', verdict: 'PASS', droppedExactTarget: TARGET, removedOwnedFiles: true });
}

try {
  await main();
  evidence.verdict = 'PASS';
} catch (error) {
  evidence.error = error.message;
  evidence.verdict = 'FAIL';
} finally {
  try { await cleanup(); } catch (error) { evidence.verdict = 'FAIL'; evidence.cleanupError = error.message; }
  if (master) {
    try {
      const post = {};
      for (const name of [MAIN, TEST, TARGET]) post[name] = await dbSnapshot(name);
      evidence.post = post;
      const protectedStable = ['main','test'].every((key) => {
        const dbName = key === 'main' ? MAIN : TEST;
        const before = evidence.phases[0]?.before?.[dbName];
        const after = post[dbName];
        return before && after && before.database_id === after.database_id && before.create_date.getTime() === after.create_date.getTime() && before.state_desc === after.state_desc && JSON.stringify(before.tableCounts) === JSON.stringify(after.tableCounts);
      });
      evidence.phases.push({ name: 'main_and_test_unchanged', verdict: protectedStable ? 'PASS' : 'FAIL' });
      if (!protectedStable) evidence.verdict = 'FAIL';
      if (post[TARGET]) evidence.verdict = 'FAIL';
    } catch (error) { evidence.verdict = 'FAIL'; evidence.postCheckError = error.message; }
    await master.close();
  }
  evidence.finishedUtc = new Date().toISOString();
  const report = path.join(OUT, 'main-restore-drill.json');
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(report, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ verdict: evidence.verdict, target: TARGET, server: evidence.server, phases: evidence.phases.map(({name,verdict}) => ({name,verdict})), error: evidence.error, cleanupError: evidence.cleanupError, evidence: path.relative(ROOT, report) }, null, 2));
  if (evidence.verdict !== 'PASS') process.exitCode = 1;
}
