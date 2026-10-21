// Applies and exercises the reviewed schedule-overlap trigger proposal only on
// a freshly restored, uniquely named disposable copy of CinemaBookingDB.
// It snapshots Main/Test before and after, then removes only this run's clone.
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
const runId = `${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
const TARGET = `${MAIN}_ScheduleFixAudit_${runId}`;
const OUT = path.join(ROOT, '.audit-output');
const BACKUP_DIR = path.join(OUT, 'database-backups');
const BACKUP = path.join(BACKUP_DIR, `${MAIN}_schedule_fix_${runId}.bak`);
const DATA_FILE = path.join(BACKUP_DIR, `${TARGET}.mdf`);
const LOG_FILE = path.join(BACKUP_DIR, `${TARGET}.ldf`);
const PROPOSAL = path.join(ROOT, 'database', '14_audit', 'proposed_schedule_overlap_concurrency_fix.sql');
const quote = (s) => String(s).replaceAll("'", "''");
const ident = (s) => `[${String(s).replaceAll(']', ']]')}]`;
const evidence = {
  runId, startedUtc: new Date().toISOString(), server: null, main: MAIN,
  protectedDatabase: TEST, restoreTarget: TARGET,
  backup: path.relative(ROOT, BACKUP), verdict: 'BLOCKED', phases: [], tests: [],
};
let master;
let clone;
let poolA;
let poolB;
let monitor;
let restoreIssued = false;
let restoreSucceeded = false;
let targetCreateFloor = null;
let baseline = null;
let fixture = null;
let txA;
let txB;
let committedRaceA = false;
let committedRaceB = false;

function check(condition, message) { if (!condition) throw new Error(message); }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function makeConfig(database) {
  for (const key of ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD']) if (!env[key]) throw new Error(`backend/.env missing ${key}`);
  if (env.DB_DATABASE !== MAIN) throw new Error(`Refusing: backend/.env targets ${env.DB_DATABASE}, expected ${MAIN}`);
  return {
    server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database,
    user: env.DB_USER, password: env.DB_PASSWORD,
    options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
    requestTimeout: 300000, pool: { max: 2, min: 1, idleTimeoutMillis: 30000 },
  };
}

async function masterDbMeta(name) {
  const row = (await master.request().input('name', sql.NVarChar(128), name).query(`
    SELECT d.name,d.database_id,d.state_desc,d.create_date,d.recovery_model_desc,d.is_read_committed_snapshot_on
    FROM sys.databases d WHERE d.name=@name;
  `)).recordset[0];
  return row ?? null;
}

async function dbSnapshot(name) {
  const meta = await masterDbMeta(name);
  if (!meta) return null;
  const cn = await new sql.ConnectionPool(makeConfig(name)).connect();
  try {
    const tables = (await cn.request().query(`
      SELECT s.name AS schemaName,t.name AS tableName,SUM(CONVERT(bigint,ps.row_count)) AS row_count
      FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
      JOIN sys.dm_db_partition_stats ps ON ps.object_id=t.object_id AND ps.index_id IN (0,1)
      WHERE t.is_ms_shipped=0 GROUP BY s.name,t.name ORDER BY s.name,t.name;
    `)).recordset;
    const identities = (await cn.request().query(`
      SELECT OBJECT_SCHEMA_NAME(object_id) AS schemaName,OBJECT_NAME(object_id) AS tableName,
             name AS columnName,CONVERT(varchar(80),IDENT_CURRENT(QUOTENAME(OBJECT_SCHEMA_NAME(object_id))+'.'+QUOTENAME(OBJECT_NAME(object_id)))) AS identityValue
      FROM sys.identity_columns ORDER BY object_id,column_id;
    `)).recordset;
    const schema = (await cn.request().query(`
      SELECT
        (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped=0) AS tables,
        (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped=0) AS procedures,
        (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped=0) AS views,
        (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped=0) AS functions,
        (SELECT COUNT(*) FROM sys.triggers WHERE parent_class=1 AND is_ms_shipped=0) AS triggers,
        (SELECT COUNT(*) FROM sys.indexes WHERE index_id>0 AND is_hypothetical=0) AS indexes;
    `)).recordset[0];
    return { ...meta, schema, tables, identities };
  } finally { await cn.close(); }
}

function sameSnapshot(a, b) {
  return !!a && !!b && a.database_id === b.database_id
    && new Date(a.create_date).getTime() === new Date(b.create_date).getTime()
    && a.state_desc === b.state_desc && a.is_read_committed_snapshot_on === b.is_read_committed_snapshot_on
    && JSON.stringify(a.schema) === JSON.stringify(b.schema)
    && JSON.stringify(a.tables) === JSON.stringify(b.tables)
    && JSON.stringify(a.identities) === JSON.stringify(b.identities);
}

async function requireIdentity(pool, expectedDb) {
  const row = (await pool.request().query(`
    SELECT @@SERVERNAME AS serverName,DB_NAME() AS databaseName,
           CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) AS state,
           is_read_committed_snapshot_on
    FROM sys.databases WHERE database_id=DB_ID();
  `)).recordset[0];
  check(row.serverName === 'DoanTuanIT' && row.databaseName === expectedDb && row.state === 'ONLINE', `Wrong SQL target: ${JSON.stringify(row)}`);
  return row;
}

async function backupAndRestore() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  for (const file of [BACKUP, DATA_FILE, LOG_FILE]) check(!fs.existsSync(file), `Refusing to overwrite pre-existing file: ${file}`);
  master = await new sql.ConnectionPool(makeConfig('master')).connect();
  const srv = (await master.request().query(`SELECT @@SERVERNAME AS serverName,SERVERPROPERTY('ProductVersion') AS productVersion`)).recordset[0];
  evidence.server = srv.serverName;
  check(srv.serverName === 'DoanTuanIT', `Unexpected SQL Server: ${srv.serverName}`);
  const before = {};
  for (const name of [MAIN, TEST, TARGET]) before[name] = await dbSnapshot(name);
  check(before[MAIN]?.state_desc === 'ONLINE', 'Main missing or not ONLINE.');
  check(before[TEST]?.state_desc === 'ONLINE', 'Protected CinemaBookingDB_Test missing or not ONLINE.');
  check(before[TARGET] === null, 'Unique restore name already exists; refusing to overwrite.');
  check(before[MAIN].is_read_committed_snapshot_on === true, 'Main is no longer RCSI ON; proposal assumptions need review.');
  const active = (await master.request().query(`
    SELECT DISTINCT s.session_id,s.program_name
    FROM sys.dm_tran_session_transactions st
    JOIN sys.dm_tran_database_transactions dt ON dt.transaction_id=st.transaction_id
    JOIN sys.dm_exec_sessions s ON s.session_id=st.session_id
    WHERE dt.database_id=DB_ID(N'${MAIN}') AND s.is_user_process=1 AND s.session_id<>@@SPID;
  `)).recordset;
  check(active.length === 0, `Active Main user transactions exist; refusing backup/restore drill: ${JSON.stringify(active)}`);
  baseline = { before, server: srv };
  evidence.phases.push({ name: 'preflight_target_snapshots_and_no_open_main_transactions', verdict: 'PASS', server: srv, snapshots: before });

  const backupSql = quote(BACKUP);
  await master.request().batch(`
    BACKUP DATABASE ${ident(MAIN)} TO DISK=N'${backupSql}' WITH COPY_ONLY,CHECKSUM,STATS=10;
    RESTORE VERIFYONLY FROM DISK=N'${backupSql}' WITH CHECKSUM;
  `);
  evidence.backupBytes = fs.statSync(BACKUP).size;
  evidence.phases.push({ name: 'fresh_main_copy_only_checksum_backup_and_verifyonly', verdict: 'PASS', bytes: evidence.backupBytes });
  const files = (await master.request().query(`RESTORE FILELISTONLY FROM DISK=N'${backupSql}';`)).recordset;
  const dataFiles = files.filter((f) => f.Type === 'D');
  const logFiles = files.filter((f) => f.Type === 'L');
  check(dataFiles.length === 1 && logFiles.length === 1, `Expected one data and one log file; found ${dataFiles.length}/${logFiles.length}.`);
  targetCreateFloor = new Date(Date.now() - 10000);
  restoreIssued = true;
  await master.request().batch(`
    RESTORE DATABASE ${ident(TARGET)} FROM DISK=N'${backupSql}'
    WITH MOVE N'${quote(dataFiles[0].LogicalName)}' TO N'${quote(DATA_FILE)}',
         MOVE N'${quote(logFiles[0].LogicalName)}' TO N'${quote(LOG_FILE)}',
         RECOVERY,CHECKSUM,STATS=10;
  `);
  restoreSucceeded = true;
  clone = await new sql.ConnectionPool(makeConfig(TARGET)).connect();
  const target = await requireIdentity(clone, TARGET);
  check(target.is_read_committed_snapshot_on === true, 'Restored clone RCSI is not ON; do not test this candidate against another isolation mode.');
  const cloneSnap = await dbSnapshot(TARGET);
  check(JSON.stringify(cloneSnap.schema) === JSON.stringify(before[MAIN].schema), 'Restored clone object inventory differs from Main.');
  check(JSON.stringify(cloneSnap.tables) === JSON.stringify(before[MAIN].tables), 'Restored clone table counts differ from Main backup source.');
  const checkdb = await clone.request().query(`DBCC CHECKDB (${ident(TARGET)}) WITH NO_INFOMSGS;`);
  evidence.phases.push({ name: 'restored_clone_identity_inventory_row_counts_and_dbcc', verdict: 'PASS', target, schema: cloneSnap.schema, tableCount: cloneSnap.tables.length, dbccRecordsets: (checkdb.recordsets ?? []).length });
}

async function applyProposalToClone() {
  let body = fs.readFileSync(PROPOSAL, 'utf8');
  body = body.replace('USE [CinemaBookingDB];', `USE ${ident(TARGET)};`);
  body = body.replace("DB_NAME() <> N'CinemaBookingDB'", `DB_NAME() <> N'${TARGET}'`);
  check(body.includes(`USE ${ident(TARGET)};`) && body.includes(`DB_NAME() <> N'${TARGET}'`), 'Could not retarget proposal guards to the exact restored clone.');
  const batches = body.split(/^\s*GO\s*$/gim).map((s) => s.trim()).filter((s) => s && !/^\/\*[\s\S]*?\*\/$/.test(s));
  check(batches.length >= 2, `Expected proposal to contain separate guard and trigger batches; got ${batches.length}.`);
  await requireIdentity(clone, TARGET);
  for (const batch of batches) {
    if (/CREATE\s+OR\s+ALTER\s+TRIGGER/i.test(batch)) await clone.request().batch(batch);
    else if (/\bUSE\s+\[/.test(batch) || /DB_NAME\(\)/i.test(batch)) await clone.request().batch(batch);
  }
  const module = (await clone.request().query(`
    SELECT OBJECT_DEFINITION(OBJECT_ID(N'dbo.TRG_SuatChieu_KiemTraTrungLich')) AS definition;
  `)).recordset[0]?.definition;
  check(module && module.includes('sp_getapplock') && module.includes('50002') && module.includes('50001'), 'Installed clone trigger does not match the guarded proposal.');
  evidence.phases.push({ name: 'reviewed_trigger_proposal_applied_to_restore_clone_only', verdict: 'PASS', target: TARGET, triggerDefinitionHasAppLock: true });
}

async function chooseFixture() {
  const row = (await clone.request().query(`
    DECLARE @Start datetime2(7)=CONVERT(datetime2(7),'2099-11-15T10:00:00');
    SELECT TOP(1) sc.PhimID,sc.PhongID,sc.DinhDang,sc.GiaVeCoBan,sc.TrangThai AS Status,
           @Start AS StartAt,DATEADD(hour,2,@Start) AS EndAt
    FROM dbo.SUATCHIEU sc
    JOIN dbo.PHONGCHIEU pc ON pc.PhongID=sc.PhongID
    WHERE sc.TrangThai<>N'Đã hủy'
      AND NOT EXISTS (
      SELECT 1 FROM dbo.SUATCHIEU x
      WHERE x.PhongID=sc.PhongID AND x.TrangThai<>N'Đã hủy'
        AND x.ThoiGianBatDau<DATEADD(hour,12,@Start)
        AND x.ThoiGianKetThuc>DATEADD(hour,-4,@Start)
    )
    ORDER BY sc.PhongID,sc.PhimID;
  `)).recordset[0];
  check(row, 'No room has an empty fixture window in 2099; refuse to overlap existing clone data.');
  fixture = {
    movieId: row.PhimID, roomId: row.PhongID, format: row.DinhDang,
    price: row.GiaVeCoBan, base: new Date(row.StartAt), durationMs: 2 * 60 * 60 * 1000,
    ids: { a: -2147000000 + Number.parseInt(runId.slice(-6), 16) % 1000000, b: -2146000000 + Number.parseInt(runId.slice(-5), 16) % 1000000, c: -2145000000 + Number.parseInt(runId.slice(-4), 16) % 1000000, d: -2144000000 + Number.parseInt(runId.slice(-3), 16) % 1000000 },
  };
  fixture.status = 'Mở bán';
  const rowExists = (await clone.request().query(`SELECT COUNT(*) AS n FROM dbo.SUATCHIEU WHERE SuatChieuID IN (${Object.values(fixture.ids).join(',')})`)).recordset[0].n;
  check(Number(rowExists) === 0, 'Negative audit fixture IDs unexpectedly exist in restored clone.');
  evidence.fixture = { movieId: fixture.movieId, roomId: fixture.roomId, ids: fixture.ids, baseStart: fixture.base.toISOString(), format: fixture.format, price: fixture.price, status: fixture.status };
}

function at(offsetHours = 0) { return new Date(fixture.base.getTime() + offsetHours * 3600000); }
function value(row) {
  return { id: row.id, movieId: fixture.movieId, roomId: fixture.roomId, startAt: row.startAt, endAt: row.endAt, format: fixture.format, price: fixture.price, status: fixture.status };
}
async function insertRows(pool, rows, transaction = null) {
  const owner = transaction ?? pool;
  const req = owner.request();
  const values = rows.map((raw, i) => {
    const r = value(raw);
    req.input(`id${i}`, sql.Int, r.id).input(`movie${i}`, sql.Int, r.movieId).input(`room${i}`, sql.Int, r.roomId)
      .input(`start${i}`, sql.DateTime2, r.startAt).input(`end${i}`, sql.DateTime2, r.endAt)
      .input(`format${i}`, sql.NVarChar(50), r.format).input(`price${i}`, sql.Decimal(18, 2), r.price).input(`status${i}`, sql.NVarChar(50), r.status);
    return `(@id${i},@movie${i},@room${i},@start${i},@end${i},@format${i},@price${i},@status${i})`;
  });
  await req.query(`
    SET IDENTITY_INSERT dbo.SUATCHIEU ON;
    INSERT dbo.SUATCHIEU(SuatChieuID,PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
    VALUES ${values.join(',')};
    SET IDENTITY_INSERT dbo.SUATCHIEU OFF;
  `);
}
async function putRows(pool, rows) {
  const tx = new sql.Transaction(pool); await tx.begin();
  try { await insertRows(pool, rows, tx); await tx.commit(); }
  catch (e) { try { await tx.rollback(); } catch {} try { await pool.request().query('SET IDENTITY_INSERT dbo.SUATCHIEU OFF;'); } catch {} throw e; }
}
async function deleteIds(pool, ids) {
  if (!ids.length) return;
  const req = pool.request();
  ids.forEach((id, i) => req.input(`i${i}`, sql.Int, id));
  await req.query(`DELETE dbo.SUATCHIEU WHERE SuatChieuID IN (${ids.map((_, i) => `@i${i}`).join(',')});`);
}
async function readIds(pool, ids) {
  if (!ids.length) return [];
  const req = pool.request(); ids.forEach((id, i) => req.input(`i${i}`, sql.Int, id));
  return (await req.query(`SELECT SuatChieuID,PhongID,ThoiGianBatDau,ThoiGianKetThuc FROM dbo.SUATCHIEU WHERE SuatChieuID IN (${ids.map((_, i) => `@i${i}`).join(',')}) ORDER BY SuatChieuID;`)).recordset;
}
function errNo(e) { return Number(e?.number ?? e?.originalError?.info?.number ?? 0); }
function addTest(name, input, expected, actual, passed, detail = null) {
  evidence.tests.push({ name, input, expected, actual, verdict: passed ? 'PASS' : 'FAIL', ...(detail ? { detail } : {}) });
  check(passed, `${name} failed: expected ${expected}; got ${JSON.stringify(actual)}`);
}

async function triggerTests() {
  const { a, b, c, d } = fixture.ids;
  const tableBefore = await clone.request().query(`SELECT COUNT_BIG(*) AS n,CONVERT(varchar(80),IDENT_CURRENT(N'dbo.SUATCHIEU')) AS identityValue FROM dbo.SUATCHIEU;`);
  evidence.fixtureTableBefore = tableBefore.recordset[0];

  // A valid one-row insert is committed briefly, verified, and deleted exactly.
  const valid = { id: a, startAt: at(0), endAt: at(2) };
  await putRows(clone, [valid]);
  const persisted = await readIds(clone, [a]);
  addTest('valid_single_insert', value(valid), 'one exact row persisted', persisted, persisted.length === 1 && persisted[0].PhongID === fixture.roomId);
  await deleteIds(clone, [a]);

  // Sequential conflicting insert: expected BR01 / 50001.
  await putRows(clone, [{ id: a, startAt: at(0), endAt: at(2) }]);
  let insertError = null;
  try { await putRows(clone, [{ id: b, startAt: at(1), endAt: at(3) }]); } catch (e) { insertError = errNo(e); }
  const afterConflict = await readIds(clone, [a, b]);
  addTest('sequential_overlap_insert_rejected', { existing: a, proposed: b, sameRoom: fixture.roomId, overlapHours: [1, 2] }, 'error 50001; only existing row remains', { error: insertError, rows: afterConflict }, insertError === 50001 && afterConflict.length === 1 && afterConflict[0].SuatChieuID === a);
  await deleteIds(clone, [a, b]);

  // Direct update path, valid update and rejected overlap update.
  await putRows(clone, [{ id: a, startAt: at(0), endAt: at(2) }]);
  await clone.request().input('id', sql.Int, a).input('s', sql.DateTime2, at(3)).input('e', sql.DateTime2, at(5))
    .query('UPDATE dbo.SUATCHIEU SET ThoiGianBatDau=@s,ThoiGianKetThuc=@e WHERE SuatChieuID=@id;');
  let updated = await readIds(clone, [a]);
  addTest('valid_direct_update', { id: a, newStart: at(3), newEnd: at(5) }, 'row updated to non-overlap interval', updated, updated.length === 1 && new Date(updated[0].ThoiGianBatDau).getTime() === at(3).getTime());
  await deleteIds(clone, [a]);
  await putRows(clone, [{ id: a, startAt: at(0), endAt: at(2) }, { id: b, startAt: at(3), endAt: at(5) }]);
  let updateError = null;
  try { await clone.request().input('id', sql.Int, b).input('s', sql.DateTime2, at(1)).input('e', sql.DateTime2, at(3)).query('UPDATE dbo.SUATCHIEU SET ThoiGianBatDau=@s,ThoiGianKetThuc=@e WHERE SuatChieuID=@id;'); } catch (e) { updateError = errNo(e); }
  updated = await readIds(clone, [a, b]);
  addTest('overlap_direct_update_rejected', { updateId: b, collidesWith: a, requestedStart: at(1), requestedEnd: at(3) }, 'error 50001; both original rows unchanged', { error: updateError, rows: updated }, updateError === 50001 && updated.length === 2 && new Date(updated.find((x) => x.SuatChieuID === b).ThoiGianBatDau).getTime() === at(3).getTime());
  await deleteIds(clone, [a, b]);

  // Multi-row disjoint set succeeds; a self-overlapping inserted set fails.
  let multiError = null;
  try { await putRows(clone, [{ id: a, startAt: at(0), endAt: at(2) }, { id: b, startAt: at(3), endAt: at(5) }]); } catch (e) { multiError = errNo(e); }
  const multiRows = await readIds(clone, [a, b]);
  addTest('multirow_disjoint_insert', { intervals: [[0, 2], [3, 5]] }, 'no error; two rows persisted', { error: multiError, rows: multiRows }, multiError === null && multiRows.length === 2);
  await deleteIds(clone, [a, b]);
  let selfError = null;
  try { await putRows(clone, [{ id: a, startAt: at(0), endAt: at(3) }, { id: b, startAt: at(2), endAt: at(4) }]); } catch (e) { selfError = errNo(e); }
  const selfRows = await readIds(clone, [a, b]);
  addTest('multirow_internal_overlap_rejected', { intervals: [[0, 3], [2, 4]] }, 'error 50001; statement rolled back; no rows persist', { error: selfError, rows: selfRows }, selfError === 50001 && selfRows.length === 0);

  // Two physical SQL connections race for the same room/interval.
  poolA = await new sql.ConnectionPool(makeConfig(TARGET)).connect();
  poolB = await new sql.ConnectionPool(makeConfig(TARGET)).connect();
  monitor = await new sql.ConnectionPool(makeConfig(TARGET)).connect();
  await requireIdentity(poolA, TARGET); await requireIdentity(poolB, TARGET); await requireIdentity(monitor, TARGET);
  const sidA = (await poolA.request().query('SELECT @@SPID AS sid')).recordset[0].sid;
  const sidB = (await poolB.request().query('SELECT @@SPID AS sid')).recordset[0].sid;
  check(sidA !== sidB, 'The concurrency test did not obtain independent SQL Server sessions.');
  txA = new sql.Transaction(poolA); txB = new sql.Transaction(poolB);
  await txA.begin();
  await insertRows(poolA, [{ id: c, startAt: at(6), endAt: at(8) }], txA);
  await txB.begin();
  let bSettled = false;
  let bResult = null;
  const bInsert = insertRows(poolB, [{ id: d, startAt: at(7), endAt: at(9) }], txB)
    .then(() => { bSettled = true; bResult = { ok: true }; })
    .catch((e) => { bSettled = true; bResult = { ok: false, number: errNo(e), message: e.message }; });
  let wait = null;
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline && !bSettled) {
    const active = (await monitor.request().input('sid', sql.Int, sidB).query(`
      SELECT TOP(1) r.session_id,r.status,r.wait_type,r.blocking_session_id,r.wait_resource
      FROM sys.dm_exec_requests r WHERE r.session_id=@sid;
    `)).recordset[0];
    if (active?.wait_type) { wait = active; break; }
    await sleep(100);
  }
  evidence.concurrentSessions = { sessionA: sidA, sessionB: sidB, independent: sidA !== sidB, observedWait: wait };
  let aCommitError = null;
  try { await txA.commit(); committedRaceA = true; } catch (e) { aCommitError = { number: errNo(e), message: e.message }; try { await txA.rollback(); } catch {} }
  txA = null;
  await bInsert;
  if (bResult?.ok) {
    try { await txB.commit(); committedRaceB = true; } catch (e) { bResult.commitError = { number: errNo(e), message: e.message }; try { await txB.rollback(); } catch {} }
  } else { try { await txB.rollback(); } catch {} }
  txB = null;
  const raceRows = await readIds(clone, [c, d]);
  const bRejected50001 = bResult && !bResult.ok && bResult.number === 50001;
  const passed = sidA !== sidB && !!wait && aCommitError === null && committedRaceA && bRejected50001 && raceRows.length === 1 && raceRows[0].SuatChieuID === c;
  evidence.tests.push({ name: 'two_session_overlapping_insert_serialized', input: { roomId: fixture.roomId, intervalA: [at(6), at(8)], intervalB: [at(7), at(9)] }, expected: 'A waits/holds room app lock and commits; B then receives error 50001; only A row exists', actual: { wait, aCommitError, committedRaceA, bResult, committedRaceB, rows: raceRows }, verdict: passed ? 'PASS' : 'FAIL' });
  check(passed, 'Two-session schedule overlap race did not produce the expected serialization and rejection.');
  await deleteIds(clone, [c, d]);
  evidence.phases.push({ name: 'candidate_functional_and_two_session_trigger_regression', verdict: 'PASS', tests: evidence.tests.map((t) => t.name) });
}

async function finalCloneIntegrity() {
  const ids = fixture ? Object.values(fixture.ids) : [];
  const remaining = await readIds(clone, ids);
  check(remaining.length === 0, `Test fixtures remain after exact cleanup: ${JSON.stringify(remaining)}`);
  const tableAfter = (await clone.request().query(`SELECT COUNT_BIG(*) AS n,CONVERT(varchar(80),IDENT_CURRENT(N'dbo.SUATCHIEU')) AS identityValue FROM dbo.SUATCHIEU;`)).recordset[0];
  check(JSON.stringify(tableAfter) === JSON.stringify(evidence.fixtureTableBefore), `Showtime row count/identity changed after clone tests: ${JSON.stringify({ before: evidence.fixtureTableBefore, after: tableAfter })}`);
  const cc = await clone.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS;');
  const ccRows = (cc.recordsets ?? []).flat();
  check(ccRows.length === 0, `Clone CHECKCONSTRAINTS found violations: ${JSON.stringify(ccRows)}`);
  const dbcc = await clone.request().query(`DBCC CHECKDB (${ident(TARGET)}) WITH NO_INFOMSGS;`);
  evidence.phases.push({ name: 'clone_fixture_cleanup_identity_count_and_integrity', verdict: 'PASS', fixtureRowsRemaining: 0, showtimeCountIdentityBefore: evidence.fixtureTableBefore, showtimeCountIdentityAfter: tableAfter, checkConstraintsViolations: ccRows.length, dbccRecordsets: (dbcc.recordsets ?? []).length });
}

async function cleanup() {
  for (const tx of [txB, txA]) if (tx) { try { await tx.rollback(); } catch {} }
  for (const pool of [monitor, poolB, poolA, clone]) if (pool) { try { await pool.close(); } catch {} }
  monitor = poolB = poolA = clone = null;
  if (!master) return;
  if (restoreIssued) {
    const row = (await master.request().input('name', sql.NVarChar(128), TARGET).query(`
      SELECT TOP(1) d.name,d.state_desc,d.create_date,h.destination_database_name,h.restore_date
      FROM sys.databases d LEFT JOIN msdb.dbo.restorehistory h ON h.destination_database_name=d.name
      WHERE d.name=@name ORDER BY h.restore_date DESC;
    `)).recordset[0];
    if (row) {
      const exact = TARGET.startsWith(`${MAIN}_ScheduleFixAudit_`) && TARGET !== MAIN && TARGET !== TEST;
      const recent = new Date(row.create_date).getTime() >= targetCreateFloor.getTime();
      const restoredByRun = row.destination_database_name === TARGET && new Date(row.restore_date).getTime() >= targetCreateFloor.getTime();
      if (!exact || !recent || !restoredByRun) {
        evidence.phases.push({ name: 'restore_clone_cleanup', verdict: 'BLOCKED', reason: 'Ownership proof did not match exact run-created RESTORE target; left it untouched.', row });
      } else {
        await master.request().batch(`ALTER DATABASE ${ident(TARGET)} SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE ${ident(TARGET)};`);
        const exists = await masterDbMeta(TARGET);
        check(!exists, 'Exact restore target still exists after DROP DATABASE.');
        for (const f of [DATA_FILE, LOG_FILE]) if (fs.existsSync(f)) fs.unlinkSync(f);
        evidence.phases.push({ name: 'restore_clone_cleanup', verdict: 'PASS', droppedExactTarget: TARGET, removedExactOwnedFiles: true });
      }
    } else {
      evidence.phases.push({ name: 'restore_clone_cleanup', verdict: restoreSucceeded ? 'FAIL' : 'PASS', detail: 'No database with the generated target name exists.' });
      for (const f of [DATA_FILE, LOG_FILE]) if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  }
  try {
    const post = {};
    for (const name of [MAIN, TEST, TARGET]) post[name] = await dbSnapshot(name);
    evidence.postSnapshots = post;
    const unchanged = sameSnapshot(baseline?.before?.[MAIN], post[MAIN]) && sameSnapshot(baseline?.before?.[TEST], post[TEST]) && post[TARGET] === null;
    evidence.phases.push({ name: 'main_test_unchanged_and_clone_absent', verdict: unchanged ? 'PASS' : 'FAIL', mainUnchanged: sameSnapshot(baseline?.before?.[MAIN], post[MAIN]), testUnchanged: sameSnapshot(baseline?.before?.[TEST], post[TEST]), cloneAbsent: post[TARGET] === null });
    if (!unchanged) evidence.verdict = 'FAIL';
  } catch (e) { evidence.verdict = 'FAIL'; evidence.postCheckError = e.message; }
  await master.close();
  master = null;
}

try {
  await backupAndRestore();
  await applyProposalToClone();
  await chooseFixture();
  await triggerTests();
  await finalCloneIntegrity();
  evidence.verdict = 'PASS';
} catch (e) {
  evidence.error = e.message;
  evidence.errorStack = e.stack;
  evidence.verdict = 'FAIL';
} finally {
  try { await cleanup(); } catch (e) { evidence.verdict = 'FAIL'; evidence.cleanupError = e.message; }
  evidence.finishedUtc = new Date().toISOString();
  fs.mkdirSync(OUT, { recursive: true });
  const report = path.join(OUT, 'schedule-fix-restore-clone-drill.json');
  fs.writeFileSync(report, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ verdict: evidence.verdict, server: evidence.server, main: MAIN, target: TARGET, phases: evidence.phases.map(({ name, verdict }) => ({ name, verdict })), tests: evidence.tests.map(({ name, verdict }) => ({ name, verdict })), error: evidence.error, cleanupError: evidence.cleanupError, evidence: path.relative(ROOT, report) }, null, 2));
  if (evidence.verdict !== 'PASS') process.exitCode = 1;
}
