// Replays the installed migration twice on a fresh restore clone only. Main
// and CinemaBookingDB_Test are snapshotted and are never DDL targets.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const sql = require('mssql');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
const MAIN = 'CinemaBookingDB', TEST = 'CinemaBookingDB_Test';
const runId = `${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
const TARGET = `${MAIN}_MigrationAudit_${runId}`;
const OUT = path.join(ROOT, '.audit-output');
const BACKUPS = path.join(OUT, 'database-backups');
const BACKUP = path.join(BACKUPS, `${MAIN}_migration_${runId}.bak`);
const DATA = path.join(BACKUPS, `${TARGET}.mdf`), LOG = path.join(BACKUPS, `${TARGET}.ldf`);
const MIGRATION = path.join(ROOT, 'database', '13_migrations', '20261014_points_payment.sql');
const quote = (s) => String(s).replaceAll("'", "''");
const ident = (s) => `[${String(s).replaceAll(']', ']]')}]`;
const ev = { runId, startedUtc: new Date().toISOString(), target: TARGET, backup: path.relative(ROOT, BACKUP), tests: [], phases: [], verdict: 'BLOCKED' };
let master, clone, restoreIssued = false, restoreSucceeded = false, targetCreateFloor, baseline;

function config(database) {
  if (env.DB_DATABASE !== MAIN) throw new Error(`Refusing configured database ${env.DB_DATABASE}; expected ${MAIN}.`);
  return { server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database, user: env.DB_USER, password: env.DB_PASSWORD,
    options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
    requestTimeout: 300000, pool: { max: 1, min: 1, idleTimeoutMillis: 30000 } };
}
function check(ok, msg) { if (!ok) throw new Error(msg); }
async function identity(pool, database) {
  const x = (await pool.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state`)).recordset[0];
  check(x.serverName === 'DoanTuanIT' && x.databaseName === database && x.state === 'ONLINE', `Wrong target ${JSON.stringify(x)}`); return x;
}
async function fingerprint(database) {
  const pool = await new sql.ConnectionPool(config(database)).connect();
  try {
    const id = await identity(pool, database);
    const tables = (await pool.request().query(`
      SELECT t.object_id,QUOTENAME(s.name)+'.'+QUOTENAME(t.name) qualifiedName,
        COALESCE((SELECT STRING_AGG(QUOTENAME(kc.name),',') WITHIN GROUP(ORDER BY ki.key_ordinal)
          FROM sys.indexes ix JOIN sys.index_columns ki ON ki.object_id=ix.object_id AND ki.index_id=ix.index_id
          JOIN sys.columns kc ON kc.object_id=ki.object_id AND kc.column_id=ki.column_id WHERE ix.object_id=t.object_id AND ix.is_primary_key=1),
          (SELECT STRING_AGG(QUOTENAME(fc.name),',') WITHIN GROUP(ORDER BY fc.column_id) FROM sys.columns fc WHERE fc.object_id=t.object_id)) sortColumns
      FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE t.is_ms_shipped=0 ORDER BY t.object_id;
    `)).recordset;
    const rows = [];
    for (const t of tables) {
      const data = (await pool.request().query(`SELECT * FROM ${t.qualifiedName} ORDER BY ${t.sortColumns};`)).recordset;
      const json = JSON.stringify(data, (k, v) => Buffer.isBuffer(v) ? v.toString('base64') : v);
      rows.push({ table: t.qualifiedName, count: data.length, sha256: createHash('sha256').update(json).digest('hex') });
    }
    const identities = (await pool.request().query(`
      SELECT OBJECT_SCHEMA_NAME(object_id) schemaName,OBJECT_NAME(object_id) tableName,name columnName,
        CONVERT(varchar(80),IDENT_CURRENT(QUOTENAME(OBJECT_SCHEMA_NAME(object_id))+'.'+QUOTENAME(OBJECT_NAME(object_id)))) identityValue
      FROM sys.identity_columns ORDER BY object_id,column_id;
    `)).recordset;
    const schema = (await pool.request().query(`
      SELECT COLUMNPROPERTY(OBJECT_ID(N'dbo.DONDATVE'),N'DiemSuDung','ColumnId') AS diemSuDungColumnId,
        COLUMNPROPERTY(OBJECT_ID(N'dbo.DONDATVE'),N'TienGiamBangDiem','ColumnId') AS legacyColumnId,
        OBJECT_DEFINITION(OBJECT_ID(N'dbo.CK_DONDATVE_TongGiam')) AS totalDiscountCheck,
        OBJECT_DEFINITION(OBJECT_ID(N'dbo.CK_DONDATVE_DiemSuDung')) AS pointsCheck,
        OBJECT_DEFINITION(OBJECT_ID(N'dbo.CK_THANHTOAN_PhuongThuc')) AS paymentMethodCheck;
    `)).recordset[0];
    return { id, rows, identities, schema };
  } finally { await pool.close(); }
}
function identicalDatabase(a, b) {
  return !!a && !!b && a.id.serverName === b.id.serverName && a.id.databaseName === b.id.databaseName
    && JSON.stringify(a.rows) === JSON.stringify(b.rows)
    && JSON.stringify(a.identities) === JSON.stringify(b.identities)
    && JSON.stringify(a.schema) === JSON.stringify(b.schema);
}

async function main() {
  if (!env.DB_SERVER || !env.DB_USER || !env.DB_PASSWORD) throw new Error('backend/.env lacks SQL connection settings.');
  fs.mkdirSync(BACKUPS, { recursive: true });
  for (const f of [BACKUP, DATA, LOG]) check(!fs.existsSync(f), `Refusing to overwrite ${f}`);
  master = await new sql.ConnectionPool(config('master')).connect();
  const server = (await master.request().query(`SELECT @@SERVERNAME serverName,SERVERPROPERTY('ProductVersion') productVersion`)).recordset[0];
  check(server.serverName === 'DoanTuanIT', `Unexpected SQL Server ${server.serverName}`); ev.server = server;
  const mainBefore = await fingerprint(MAIN), testBefore = await fingerprint(TEST);
  const targetBefore = (await master.request().input('n', sql.NVarChar(128), TARGET).query('SELECT name FROM sys.databases WHERE name=@n')).recordset;
  check(targetBefore.length === 0, 'Unique clone name already exists; refusing overwrite.');
  const openMain = (await master.request().query(`
    SELECT DISTINCT s.session_id,s.program_name
    FROM sys.dm_tran_session_transactions st
    JOIN sys.dm_tran_database_transactions dt ON dt.transaction_id=st.transaction_id
    JOIN sys.dm_exec_sessions s ON s.session_id=st.session_id
    WHERE dt.database_id=DB_ID(N'${MAIN}') AND s.is_user_process=1;
  `)).recordset;
  check(openMain.length === 0, `Open Main user transaction found; refusing migration clone: ${JSON.stringify(openMain)}`);
  baseline = { mainBefore, testBefore };
  ev.phases.push({ name: 'exact_main_test_identity_and_full_fingerprints', verdict: 'PASS', mainDatabase: MAIN, protectedDatabase: TEST, mainRows: mainBefore.rows.length, testRows: testBefore.rows.length });

  await master.request().batch(`BACKUP DATABASE ${ident(MAIN)} TO DISK=N'${quote(BACKUP)}' WITH COPY_ONLY,CHECKSUM,STATS=10; RESTORE VERIFYONLY FROM DISK=N'${quote(BACKUP)}' WITH CHECKSUM;`);
  ev.backupBytes = fs.statSync(BACKUP).size;
  const files = (await master.request().query(`RESTORE FILELISTONLY FROM DISK=N'${quote(BACKUP)}';`)).recordset;
  const d = files.filter(x => x.Type === 'D'), l = files.filter(x => x.Type === 'L');
  check(d.length === 1 && l.length === 1, `Expected one data/log file, got ${d.length}/${l.length}`);
  targetCreateFloor = new Date(Date.now() - 10000); restoreIssued = true;
  await master.request().batch(`RESTORE DATABASE ${ident(TARGET)} FROM DISK=N'${quote(BACKUP)}' WITH MOVE N'${quote(d[0].LogicalName)}' TO N'${quote(DATA)}', MOVE N'${quote(l[0].LogicalName)}' TO N'${quote(LOG)}', RECOVERY,CHECKSUM,STATS=10;`);
  restoreSucceeded = true;
  clone = await new sql.ConnectionPool(config(TARGET)).connect();
  await identity(clone, TARGET);
  const cloneBefore = await fingerprint(TARGET);
  check(JSON.stringify(mainBefore.rows) === JSON.stringify(cloneBefore.rows), 'Fresh restored clone data differs from Main backup source.');
  ev.phases.push({ name: 'fresh_copy_only_backup_restore_verifyonly_and_clone_restore', verdict: 'PASS', backupBytes: ev.backupBytes, cloneRows: cloneBefore.rows.length, schema: cloneBefore.schema });

  let migration = fs.readFileSync(MIGRATION, 'utf8');
  check(!/^\s*:/m.test(migration) && !/\b(?:xp_cmdshell|sp_send_dbmail|OPENROWSET|OPENDATASOURCE|sp_OA)\b/i.test(migration), 'Unexpected directive or external side effect in migration.');
  for (let i = 1; i <= 2; i += 1) {
    await identity(clone, TARGET);
    await clone.request().batch(migration);
    const after = await fingerprint(TARGET);
    const dataSame = JSON.stringify(cloneBefore.rows) === JSON.stringify(after.rows);
    const schemaSame = JSON.stringify(cloneBefore.schema) === JSON.stringify(after.schema);
    ev.tests.push({ name: `migration_replay_${i}`, input: 'database/13_migrations/20261014_points_payment.sql', expected: 'completes idempotently; preserves every ordered persistent row, identities and target invariant schema', actual: { dataSame, schemaSame, rowTables: after.rows.length }, verdict: dataSame && schemaSame ? 'PASS' : 'FAIL' });
    check(dataSame && schemaSame, `Migration replay ${i} changed row content, identity or normalized constraint/column contract.`);
  }
  const cc = await clone.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS;');
  const violations = (cc.recordsets ?? []).flat();
  const dbcc = await clone.request().query(`DBCC CHECKDB (${ident(TARGET)}) WITH NO_INFOMSGS,ALL_ERRORMSGS;`);
  check(violations.length === 0 && (dbcc.recordsets ?? []).flat().length === 0, 'Clone DBCC found integrity errors.');
  ev.phases.push({ name: 'migration_clone_integrity_after_two_runs', verdict: 'PASS', checkConstraintViolations: violations.length, checkdbClean: true });
  ev.verdict = 'PASS';
}

async function cleanup() {
  if (clone) { try { await clone.close(); } catch {} clone = null; }
  if (!master) return;
  if (restoreIssued) {
    const row = (await master.request().input('n', sql.NVarChar(128), TARGET).query(`
      SELECT TOP(1) d.name,d.create_date,h.destination_database_name,h.restore_date
      FROM sys.databases d LEFT JOIN msdb.dbo.restorehistory h ON h.destination_database_name=d.name
      WHERE d.name=@n ORDER BY h.restore_date DESC;
    `)).recordset[0];
    if (row) {
      const owner = TARGET.startsWith(`${MAIN}_MigrationAudit_`) && TARGET !== MAIN && TARGET !== TEST
        && new Date(row.create_date).getTime() >= targetCreateFloor.getTime()
        && row.destination_database_name === TARGET && new Date(row.restore_date).getTime() >= targetCreateFloor.getTime();
      if (!owner) ev.phases.push({ name: 'clone_cleanup', verdict: 'BLOCKED', detail: 'Exact run ownership not proven; left target untouched.', row });
      else {
        await master.request().batch(`ALTER DATABASE ${ident(TARGET)} SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE ${ident(TARGET)};`);
        check(!(await master.request().input('n', sql.NVarChar(128), TARGET).query('SELECT name FROM sys.databases WHERE name=@n')).recordset.length, 'Restore target still exists after cleanup.');
        for (const f of [DATA, LOG]) if (fs.existsSync(f)) fs.unlinkSync(f);
        ev.phases.push({ name: 'clone_cleanup', verdict: 'PASS', droppedExactTarget: TARGET });
      }
    } else ev.phases.push({ name: 'clone_cleanup', verdict: restoreSucceeded ? 'FAIL' : 'PASS', detail: 'No target with generated name exists.' });
  }
  if (baseline) {
    const mainAfter = await fingerprint(MAIN), testAfter = await fingerprint(TEST);
    const mainSame = identicalDatabase(baseline.mainBefore, mainAfter), testSame = identicalDatabase(baseline.testBefore, testAfter);
    const absent = !(await master.request().input('n', sql.NVarChar(128), TARGET).query('SELECT name FROM sys.databases WHERE name=@n')).recordset.length;
    ev.phases.push({ name: 'main_test_full_fingerprints_unchanged_and_clone_absent', verdict: mainSame && testSame && absent ? 'PASS' : 'FAIL', mainSame, testSame, cloneAbsent: absent });
    if (!mainSame || !testSame || !absent) ev.verdict = 'FAIL';
  }
  await master.close(); master = null;
}

try { await main(); }
catch (e) { ev.verdict = 'FAIL'; ev.error = e.message; ev.stack = e.stack; }
finally {
  try { await cleanup(); } catch (e) { ev.verdict = 'FAIL'; ev.cleanupError = e.message; }
  ev.finishedUtc = new Date().toISOString(); fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, 'main-migration-restore-clone-drill.json'); fs.writeFileSync(file, JSON.stringify(ev, null, 2));
  console.log(JSON.stringify({ verdict: ev.verdict, server: ev.server, target: TARGET, tests: ev.tests.map(x => ({ name: x.name, verdict: x.verdict })), phases: ev.phases.map(x => ({ name: x.name, verdict: x.verdict })), error: ev.error, cleanupError: ev.cleanupError, evidence: path.relative(ROOT, file) }, null, 2));
  if (ev.verdict !== 'PASS') process.exitCode = 1;
}
