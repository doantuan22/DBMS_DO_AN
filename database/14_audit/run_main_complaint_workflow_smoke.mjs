// Executes the support/complaint/escalation success flow on exact Main inside
// one caller transaction, verifies trigger side effects, then rolls back.
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
if (env.DB_DATABASE !== 'CinemaBookingDB') throw new Error('Refusing: backend config does not target exact Main.');
const OUT = path.join(ROOT, '.audit-output', 'main-complaint-workflow-smoke.json');
const restoreEvidence = JSON.parse(fs.readFileSync(path.join(ROOT, '.audit-output', 'main-migration-restore-clone-drill.json'), 'utf8'));
const BACKUP = path.join(ROOT, restoreEvidence.backup);
if (!fs.existsSync(BACKUP)) throw new Error(`Verified Main backup missing: ${BACKUP}`);
const token = randomUUID().replaceAll('-', '').toUpperCase();
const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: env.DB_DATABASE,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 180000, pool: { max: 1, min: 1, idleTimeoutMillis: 30000 },
}).connect();
const ev = { startedUtc: new Date().toISOString(), target: null, backup: path.relative(ROOT, BACKUP), tests: [], verdict: 'BLOCKED' };

async function identity() {
  const x = (await pool.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state`)).recordset[0];
  if (x.serverName !== 'DoanTuanIT' || x.databaseName !== 'CinemaBookingDB' || x.state !== 'ONLINE') throw new Error(`Wrong target: ${JSON.stringify(x)}`);
  return x;
}
async function fingerprint() {
  await identity();
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
  return { id: await identity(), rows, identities };
}
function add(name, expected, actual, pass) { ev.tests.push({ name, input: `unique complaint fixture ${token.slice(0, 12)}`, expected, actual, verdict: pass ? 'PASS' : 'FAIL' }); if (!pass) throw new Error(`${name}: ${JSON.stringify(actual)}`); }
async function invoke(tx, name, params) {
  const r = tx.request();
  for (const [k, type, value] of params) r.input(k, type, value);
  return r.execute(`dbo.${name}`);
}

try {
  const before = await fingerprint(); ev.target = before.id; ev.before = before;
  await pool.request().query(`RESTORE VERIFYONLY FROM DISK=N'${BACKUP.replaceAll("'","''")}' WITH CHECKSUM;`);
  const active = (await pool.request().query(`
    SELECT DISTINCT s.session_id FROM sys.dm_tran_session_transactions st
    JOIN sys.dm_tran_database_transactions dt ON dt.transaction_id=st.transaction_id
    JOIN sys.dm_exec_sessions s ON s.session_id=st.session_id
    WHERE dt.database_id=DB_ID() AND s.is_user_process=1 AND s.session_id<>@@SPID;
  `)).recordset;
  if (active.length) throw new Error(`Open Main transactions detected: ${JSON.stringify(active)}`);
  const actors = (await pool.request().query(`
    SELECT vt.MaVaiTro,MIN(nd.NguoiDungID) AS NguoiDungID
    FROM dbo.NGUOIDUNG nd JOIN dbo.VAITRO vt ON vt.VaiTroID=nd.VaiTroID
    WHERE nd.TrangThai=N'Hoạt động' AND vt.MaVaiTro IN ('ADMIN','CSKH','KHACH_HANG')
    GROUP BY vt.MaVaiTro;
  `)).recordset;
  const role = new Map(actors.map((x) => [x.MaVaiTro, Number(x.NguoiDungID)]));
  for (const key of ['ADMIN','CSKH','KHACH_HANG']) if (!role.has(key)) throw new Error(`No active actor for ${key}.`);
  ev.fixtureActors = [...role.keys()];
  const admin = role.get('ADMIN'), support = role.get('CSKH'), customer = role.get('KHACH_HANG');
  const tx = new sql.Transaction(pool); await tx.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
  try {
    const title1 = `Audit complaint ${token.slice(0, 20)} A`;
    const title2 = `Audit complaint ${token.slice(0, 20)} B`;
    const create1 = await invoke(tx, 'sp_Complaint_Create', [
      ['NguoiDungID', sql.Int, customer], ['DonDatVeID', sql.Int, null], ['LoaiKhieuNai', sql.NVarChar(100), 'Hỗ trợ'],
      ['TieuDe', sql.NVarChar(200), title1], ['NoiDung', sql.NVarChar(sql.MAX), `audit fixture ${token}`], ['MucDoUuTien', sql.NVarChar(50), 'Trung bình'],
    ]);
    const c1 = Number(create1.recordset?.[0]?.KhieuNaiID);
    add('sp_Complaint_Create_success', 'returns a unique complaint id and New status', create1.recordset?.[0], Number.isFinite(c1) && c1 > 0 && create1.recordset[0].TrangThai === 'Mới');

    const assignSelf = await invoke(tx, 'sp_Complaint_Assign_Self', [['NguoiDungID', sql.Int, support], ['KhieuNaiID', sql.Int, c1]]);
    add('sp_Complaint_Assign_Self_success', 'assigns once to active CSKH and moves complaint to processing', assignSelf.recordset?.[0], Number(assignSelf.recordset?.[0]?.NhanVienPhuTrachID) === support && assignSelf.recordset[0].TrangThai === 'Đang xử lý');

    const publicMsg = await invoke(tx, 'sp_Complaint_Chat_Send', [
      ['NguoiDungID', sql.Int, support], ['KhieuNaiID', sql.Int, c1], ['NoiDung', sql.NVarChar(sql.MAX), `public ${token}`], ['LoaiTinNhan', sql.NVarChar(50), 'Công khai'],
    ]);
    add('sp_Complaint_Chat_Send_public_success', 'returns the newly inserted public message for assigned support', publicMsg.recordset?.[0], publicMsg.recordset?.[0]?.LoaiTinNhan === 'Công khai' && Number(publicMsg.recordset[0].KhieuNaiID) === c1);

    const note = await invoke(tx, 'sp_Complaint_Chat_AddInternalNote', [
      ['NguoiDungID', sql.Int, support], ['KhieuNaiID', sql.Int, c1], ['NoiDung', sql.NVarChar(sql.MAX), `internal ${token}`],
    ]);
    add('sp_Complaint_Chat_AddInternalNote_success', 'uses the internal-message path and labels message Nội bộ', note.recordset?.[0], note.recordset?.[0]?.LoaiTinNhan === 'Nội bộ' && Number(note.recordset[0].KhieuNaiID) === c1);

    const proc = await invoke(tx, 'sp_Support_Complaint_AddProcessing', [
      ['NguoiDungID', sql.Int, support], ['KhieuNaiID', sql.Int, c1], ['NoiDungXuLy', sql.NVarChar(sql.MAX), `support processing ${token}`], ['TrangThaiSauXuLy', sql.NVarChar(50), 'Đang xử lý'],
    ]);
    add('sp_Support_Complaint_AddProcessing_success', 'writes processing history; trigger keeps parent status synchronized', proc.recordset?.[0], Number(proc.recordset?.[0]?.KhieuNaiID) === c1 && proc.recordset[0].TrangThaiSauXuLy === 'Đang xử lý');

    const esc = await invoke(tx, 'sp_Escalation_Create', [
      ['NguoiDungID', sql.Int, support], ['KhieuNaiID', sql.Int, c1], ['LyDo', sql.NVarChar(500), `escalate ${token}`], ['MucDoUuTien', sql.NVarChar(50), 'Cao'],
    ]);
    const escalationId = Number(esc.recordset?.[0]?.YeuCauID);
    add('sp_Escalation_Create_success', 'creates an unclaimed escalation for the assigned CSKH', esc.recordset?.[0], Number.isFinite(escalationId) && escalationId > 0 && esc.recordset[0].TrangThai === 'Chờ tiếp nhận');
    const claim = await invoke(tx, 'sp_Escalation_Claim', [['AdminID', sql.Int, admin], ['YeuCauID', sql.Int, escalationId]]);
    add('sp_Escalation_Claim_success', 'assigns the escalation to the active admin and moves it to processing', claim.recordset?.[0], Number(claim.recordset?.[0]?.AdminPhuTrachID) === admin && claim.recordset[0].TrangThai === 'Đang xử lý');
    const process = await invoke(tx, 'sp_Escalation_Process', [
      ['AdminID', sql.Int, admin], ['YeuCauID', sql.Int, escalationId], ['KetQuaXuLy', sql.NVarChar(sql.MAX), `resolved ${token}`], ['TrangThaiMoi', sql.NVarChar(50), 'Đã giải quyết'],
    ]);
    add('sp_Escalation_Process_success', 'stores admin resolution and terminal escalation state', process.recordset?.[0], process.recordset?.[0]?.TrangThai === 'Đã giải quyết' && process.recordset[0].KetQuaXuLy === `resolved ${token}`);
    const aliasProcess = await invoke(tx, 'sp_XuLyKhieuNai', [
      ['NguoiDungID', sql.Int, support], ['KhieuNaiID', sql.Int, c1], ['NoiDungXuLy', sql.NVarChar(sql.MAX), `close complaint ${token}`], ['TrangThaiSauXuLy', sql.NVarChar(50), 'Đã giải quyết'],
    ]);
    const parent1 = (await tx.request().input('id', sql.Int, c1).query('SELECT TrangThai,NhanVienPhuTrachID FROM dbo.KHIEUNAI WHERE KhieuNaiID=@id;')).recordset[0];
    add('sp_XuLyKhieuNai_alias_and_history_trigger', 'alias inserts history; trigger updates complaint status to resolved', { history: aliasProcess.recordset?.[0], parent: parent1 }, parent1?.TrangThai === 'Đã giải quyết' && Number(parent1.NhanVienPhuTrachID) === support);

    const create2 = await invoke(tx, 'sp_Complaint_Create', [
      ['NguoiDungID', sql.Int, customer], ['DonDatVeID', sql.Int, null], ['LoaiKhieuNai', sql.NVarChar(100), 'Hỗ trợ'],
      ['TieuDe', sql.NVarChar(200), title2], ['NoiDung', sql.NVarChar(sql.MAX), `admin assignment fixture ${token}`], ['MucDoUuTien', sql.NVarChar(50), 'Trung bình'],
    ]);
    const c2 = Number(create2.recordset?.[0]?.KhieuNaiID);
    add('sp_Complaint_Create_second_fixture', 'creates an unassigned second complaint', create2.recordset?.[0], Number.isFinite(c2) && c2 > 0 && create2.recordset[0].TrangThai === 'Mới');
    const assignAdmin = await invoke(tx, 'sp_Complaint_Assign_Admin', [
      ['AdminID', sql.Int, admin], ['KhieuNaiID', sql.Int, c2], ['NhanVienMoiID', sql.Int, support], ['LyDo', sql.NVarChar(500), `assign ${token}`],
    ]);
    add('sp_Complaint_Assign_Admin_success', 'admin assigns an unassigned complaint to active support staff', assignAdmin.recordset?.[0], Number(assignAdmin.recordset?.[0]?.NhanVienPhuTrachID) === support && assignAdmin.recordset[0].TrangThai === 'Đang xử lý');
    const status = await invoke(tx, 'sp_Support_Complaint_UpdateStatus', [['NguoiDungID', sql.Int, support], ['KhieuNaiID', sql.Int, c2], ['TrangThaiMoi', sql.NVarChar(50), 'Đã đóng']]);
    const parent2 = (await tx.request().input('id', sql.Int, c2).query('SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID=@id;')).recordset[0];
    add('sp_Support_Complaint_UpdateStatus_success', 'writes a status history row and trigger synchronizes parent', { history: status.recordset?.[0], parent: parent2 }, parent2?.TrangThai === 'Đã đóng');

    await tx.rollback();
    ev.transaction = { rolledBack: true, outerTransactionCountReturnedToZero: true };
  } catch (e) {
    try { await tx.rollback(); } catch {}
    throw e;
  }

  const after = await fingerprint(); ev.after = after;
  const dataSame = JSON.stringify(before.rows) === JSON.stringify(after.rows);
  const cc = await pool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS;');
  const violations = (cc.recordsets ?? []).flat();
  const dbcc = await pool.request().query(`DBCC CHECKDB (N'CinemaBookingDB') WITH NO_INFOMSGS,ALL_ERRORMSGS;`);
  const identityGaps = after.identities.filter((x) => {
    const prior = before.identities.find((p) => p.schemaName === x.schemaName && p.tableName === x.tableName && p.columnName === x.columnName);
    return prior?.identityValue !== x.identityValue;
  }).map((x) => {
    const prior = before.identities.find((p) => p.schemaName === x.schemaName && p.tableName === x.tableName && p.columnName === x.columnName);
    return { table: `${x.schemaName}.${x.tableName}`, column: x.columnName, before: prior?.identityValue, after: x.identityValue };
  });
  const integrity = dataSame && violations.length === 0 && (dbcc.recordsets ?? []).flat().length === 0;
  ev.tests.push({ name: 'post_rollback_full_row_fingerprint_and_dbcc', input: 'all persistent tables plus DBCC CHECKCONSTRAINTS/CHECKDB', expected: 'same persistent row content; identity sequence gaps recorded without reseeding; integrity clean', actual: { dataSame, identityGaps, violations: violations.length, dbccClean: (dbcc.recordsets ?? []).flat().length === 0 }, verdict: integrity ? 'PASS' : 'FAIL' });
  ev.verdict = integrity && ev.tests.every((x) => x.verdict === 'PASS') ? 'PASS' : 'FAIL';
} catch (e) {
  ev.error = e.message; ev.stack = e.stack; ev.verdict = 'FAIL';
  try { ev.after = await fingerprint(); } catch (x) { ev.postCheckError = x.message; }
} finally {
  ev.finishedUtc = new Date().toISOString(); fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(ev, null, 2));
  await pool.close();
  console.log(JSON.stringify({ verdict: ev.verdict, target: ev.target, tests: ev.tests.map(x=>({name:x.name,verdict:x.verdict})), identityGaps: ev.tests.at(-1)?.actual?.identityGaps, error: ev.error, evidence: path.relative(ROOT,OUT) }, null, 2));
  if (ev.verdict !== 'PASS') process.exitCode = 1;
}
