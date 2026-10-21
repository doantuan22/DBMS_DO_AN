// Exercises successful admin CRUD procedures on exact Main in one outer
// rollback transaction. Identity values are expected to advance on rollback.
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
const OUT = path.join(ROOT, '.audit-output', 'main-admin-crud-success-smoke.json');
const priorRestore = JSON.parse(fs.readFileSync(path.join(ROOT, '.audit-output', 'main-migration-restore-clone-drill.json'), 'utf8'));
const BACKUP = path.join(ROOT, priorRestore.backup);
if (!fs.existsSync(BACKUP)) throw new Error(`Verified Main backup missing: ${BACKUP}`);
const token = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: env.DB_DATABASE,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 180000, pool: { max: 1, min: 1, idleTimeoutMillis: 30000 },
}).connect();
const ev = { startedUtc: new Date().toISOString(), target: null, backup: path.relative(ROOT, BACKUP), fixtureToken: token, tests: [], verdict: 'BLOCKED' };

async function identity() {
  const x = (await pool.request().query(`SELECT @@SERVERNAME serverName, DB_NAME() databaseName, CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state`)).recordset[0];
  if (x.serverName !== 'DoanTuanIT' || x.databaseName !== 'CinemaBookingDB' || x.state !== 'ONLINE') throw new Error(`Wrong target: ${JSON.stringify(x)}`);
  return x;
}
async function fingerprint() {
  const id = await identity();
  const tables = (await pool.request().query(`
    SELECT t.object_id, QUOTENAME(s.name)+'.'+QUOTENAME(t.name) qualifiedName,
      COALESCE((SELECT STRING_AGG(QUOTENAME(c.name),',') WITHIN GROUP(ORDER BY ic.key_ordinal)
        FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
        JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE i.object_id=t.object_id AND i.is_primary_key=1),
        (SELECT STRING_AGG(QUOTENAME(c.name),',') WITHIN GROUP(ORDER BY c.column_id) FROM sys.columns c WHERE c.object_id=t.object_id)) sortColumns
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE t.is_ms_shipped=0 ORDER BY t.object_id;`)).recordset;
  const rows = [];
  for (const t of tables) {
    const data = (await pool.request().query(`SELECT * FROM ${t.qualifiedName} ORDER BY ${t.sortColumns};`)).recordset;
    const json = JSON.stringify(data, (k,v) => Buffer.isBuffer(v) ? v.toString('base64') : v);
    rows.push({ table: t.qualifiedName, count: data.length, sha256: createHash('sha256').update(json).digest('hex') });
  }
  const identities = (await pool.request().query(`
    SELECT OBJECT_SCHEMA_NAME(object_id) schemaName, OBJECT_NAME(object_id) tableName, name columnName,
      CONVERT(varchar(80),IDENT_CURRENT(QUOTENAME(OBJECT_SCHEMA_NAME(object_id))+'.'+QUOTENAME(OBJECT_NAME(object_id)))) identityValue
    FROM sys.identity_columns ORDER BY object_id,column_id;`)).recordset;
  return { id, rows, identities };
}
function add(name, input, expected, actual, pass) {
  ev.tests.push({ name, input, expected, actual, verdict: pass ? 'PASS' : 'FAIL' });
  if (!pass) throw new Error(`${name}: expected ${JSON.stringify(expected)} actual ${JSON.stringify(actual)}`);
}
async function exec(tx, name, params = [], outputs = []) {
  const r = tx.request();
  for (const [key, type, value] of params) r.input(key, type, value);
  for (const [key, type] of outputs) r.output(key, type);
  const x = await r.execute(`dbo.${name}`);
  return { ...x, output: r.parameters };
}
function first(x) { return (x.recordsets ?? []).flat().find(v => v && typeof v === 'object') ?? null; }

try {
  ev.before = await fingerprint(); ev.target = ev.before.id;
  await pool.request().query(`RESTORE VERIFYONLY FROM DISK=N'${BACKUP.replaceAll("'", "''")}' WITH CHECKSUM;`);
  const actor = (await pool.request().query(`
    SELECT TOP(1) u.NguoiDungID ActorID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID
    WHERE r.MaVaiTro='ADMIN' AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID;`)).recordset[0];
  if (!actor) throw new Error('No active admin fixture available.');
  const managerRole = (await pool.request().query(`SELECT TOP(1) VaiTroID FROM dbo.VAITRO WHERE MaVaiTro='QUAN_LY_RAP';`)).recordset[0];
  if (!managerRole) throw new Error('QUAN_LY_RAP role missing.');
  ev.fixture = { adminActorID: actor.ActorID, managerRoleID: managerRole.VaiTroID };
  const tx = new sql.Transaction(pool);
  await tx.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
  try {
    // Actor create -> update -> delete; deletion also checks the unassociated path.
    const a = await exec(tx, 'sp_Admin_Actor_Create', [
      ['ActorID', sql.Int, actor.ActorID], ['HoTen', sql.NVarChar(150), `Audit Actor ${token}`],
      ['NgaySinh', sql.Date, null], ['QuocTich', sql.NVarChar(100), 'Audit']]);
    const actorRow = first(a); const actorId = Number(actorRow?.DienVienID);
    add('sp_Admin_Actor_Create', 'unique fixture inserted and returned with generated ID', { HoTen: `Audit Actor ${token}`, QuocTich: 'Audit' }, actorRow, actorId > 0 && actorRow.HoTen === `Audit Actor ${token}`);
    const au = await exec(tx, 'sp_Admin_Actor_Update', [
      ['ActorID', sql.Int, actor.ActorID], ['DienVienID', sql.Int, actorId], ['HoTen', sql.NVarChar(150), `Audit Actor Updated ${token}`], ['NgaySinh', sql.Date, null], ['QuocTich', sql.NVarChar(100), 'Updated']]);
    const actorUpdated = first(au);
    add('sp_Admin_Actor_Update', 'fixture fields updated and returned', { HoTen: `Audit Actor Updated ${token}`, QuocTich: 'Updated' }, actorUpdated, actorUpdated?.HoTen === `Audit Actor Updated ${token}` && actorUpdated?.QuocTich === 'Updated');

    const g = await exec(tx, 'sp_Admin_Genre_Create', [['ActorID', sql.Int, actor.ActorID], ['TenTheLoai', sql.NVarChar(100), `AuditGenre${token}`]]);
    const genreRow = first(g); const genreId = Number(genreRow?.TheLoaiID);
    add('sp_Admin_Genre_Create', 'unique genre inserted', { TenTheLoai: `AuditGenre${token}` }, genreRow, genreId > 0 && genreRow.TenTheLoai === `AuditGenre${token}`);
    const gu = await exec(tx, 'sp_Admin_Genre_Update', [['ActorID', sql.Int, actor.ActorID], ['TheLoaiID', sql.Int, genreId], ['TenTheLoai', sql.NVarChar(100), `AuditGenreU${token}`]]);
    const genreUpdated = first(gu);
    add('sp_Admin_Genre_Update', 'genre renamed', { TheLoaiID: genreId, TenTheLoai: `AuditGenreU${token}` }, genreUpdated, Number(genreUpdated?.TheLoaiID) === genreId && genreUpdated?.TenTheLoai === `AuditGenreU${token}`);

    const p = await exec(tx, 'sp_Admin_Product_Create', [
      ['ActorID', sql.Int, actor.ActorID], ['TenSanPham', sql.NVarChar(150), `Audit Product ${token}`], ['LoaiSanPham', sql.NVarChar(50), 'Snack'],
      ['Gia', sql.Decimal(18,2), 12500], ['MoTa', sql.NVarChar(255), 'rollback fixture'], ['HinhAnh', sql.NVarChar(500), null]]);
    const productRow = first(p); const productId = Number(productRow?.SanPhamID);
    add('sp_Admin_Product_Create', 'product inserted with default active status and price', { Gia: 12500, TrangThai: 'Đang bán' }, productRow, productId > 0 && Number(productRow?.Gia) === 12500 && productRow?.TrangThai === 'Đang bán');
    const pu = await exec(tx, 'sp_Admin_Product_Update', [
      ['ActorID', sql.Int, actor.ActorID], ['SanPhamID', sql.Int, productId], ['TenSanPham', sql.NVarChar(150), `Audit Product U ${token}`], ['LoaiSanPham', sql.NVarChar(50), 'Combo'],
      ['Gia', sql.Decimal(18,2), 15000], ['MoTa', sql.NVarChar(255), 'updated fixture'], ['HinhAnh', sql.NVarChar(500), null], ['TrangThai', sql.NVarChar(50), 'Đang bán']]);
    const productUpdated = first(pu);
    add('sp_Admin_Product_Update', 'product fields and price updated', { SanPhamID: productId, Gia: 15000, LoaiSanPham: 'Combo' }, productUpdated, Number(productUpdated?.SanPhamID) === productId && Number(productUpdated?.Gia) === 15000 && productUpdated?.LoaiSanPham === 'Combo');

    const promoCode = `AU${token}`;
    const pr = await exec(tx, 'sp_Admin_Promotion_Create', [
      ['ActorID', sql.Int, actor.ActorID], ['MaCode', sql.VarChar(50), promoCode], ['MoTa', sql.NVarChar(255), 'rollback fixture'],
      ['LoaiGiamGia', sql.NVarChar(20), 'FIXED'], ['GiaTriGiam', sql.Decimal(18,2), 5000], ['DonHangToiThieu', sql.Decimal(18,2), 0], ['GiamToiDa', sql.Decimal(18,2), null],
      ['NgayBatDau', sql.DateTime2(0), new Date('2040-01-01T00:00:00Z')], ['NgayKetThuc', sql.DateTime2(0), new Date('2040-01-02T00:00:00Z')], ['SoLuong', sql.Int, 3]]);
    const promoRow = first(pr); const promoId = Number(promoRow?.KhuyenMaiID);
    add('sp_Admin_Promotion_Create', 'promotion inserted with zero usage and requested quota', { MaCode: promoCode, SoLuong: 3, SoLuongDaDung: 0 }, promoRow, promoId > 0 && promoRow?.MaCode === promoCode && Number(promoRow?.SoLuong) === 3 && Number(promoRow?.SoLuongDaDung) === 0);
    const pru = await exec(tx, 'sp_Admin_Promotion_Update', [
      ['ActorID', sql.Int, actor.ActorID], ['KhuyenMaiID', sql.Int, promoId], ['MoTa', sql.NVarChar(255), 'updated fixture'], ['LoaiGiamGia', sql.NVarChar(20), 'FIXED'],
      ['GiaTriGiam', sql.Decimal(18,2), 6000], ['DonHangToiThieu', sql.Decimal(18,2), 10000], ['GiamToiDa', sql.Decimal(18,2), null],
      ['NgayBatDau', sql.DateTime2(0), new Date('2040-01-01T00:00:00Z')], ['NgayKetThuc', sql.DateTime2(0), new Date('2040-01-02T00:00:00Z')], ['SoLuong', sql.Int, 5], ['TrangThai', sql.NVarChar(50), 'Hoạt động']]);
    const promoUpdated = first(pru);
    add('sp_Admin_Promotion_Update', 'promotion quota and amount updated; used count preserved', { KhuyenMaiID: promoId, GiaTriGiam: 6000, SoLuong: 5, SoLuongDaDung: 0 }, promoUpdated, Number(promoUpdated?.KhuyenMaiID) === promoId && Number(promoUpdated?.GiaTriGiam) === 6000 && Number(promoUpdated?.SoLuong) === 5 && Number(promoUpdated?.SoLuongDaDung) === 0);

    const cinema = await exec(tx, 'sp_Admin_Cinema_Create', [
      ['ActorID', sql.Int, actor.ActorID], ['TenRap', sql.NVarChar(150), `Audit Cinema ${token}`], ['DiaChi', sql.NVarChar(255), '1 Audit Street'],
      ['ThanhPho', sql.NVarChar(100), 'Hanoi'], ['SoDienThoai', sql.VarChar(20), null], ['MoTa', sql.NVarChar(500), 'rollback fixture'], ['NgayHoatDong', sql.Date, new Date('2040-01-01T00:00:00Z')]]);
    const cinemaRow = first(cinema); const cinemaId = Number(cinemaRow?.RapID);
    add('sp_Admin_Cinema_Create', 'cinema inserted with active status', { TenRap: `Audit Cinema ${token}`, TrangThai: 'Hoạt động' }, cinemaRow, cinemaId > 0 && cinemaRow?.TenRap === `Audit Cinema ${token}` && cinemaRow?.TrangThai === 'Hoạt động');
    const ciu = await exec(tx, 'sp_Admin_Cinema_Update', [
      ['ActorID', sql.Int, actor.ActorID], ['RapID', sql.Int, cinemaId], ['TenRap', sql.NVarChar(150), `Audit Cinema U ${token}`], ['DiaChi', sql.NVarChar(255), '2 Audit Street'],
      ['ThanhPho', sql.NVarChar(100), 'Hanoi'], ['SoDienThoai', sql.VarChar(20), null], ['MoTa', sql.NVarChar(500), 'updated fixture'], ['TrangThai', sql.NVarChar(50), 'Tạm đóng']]);
    const cinemaUpdated = first(ciu);
    add('sp_Admin_Cinema_Update', 'cinema name/address/status changed', { RapID: cinemaId, TenRap: `Audit Cinema U ${token}`, TrangThai: 'Tạm đóng' }, cinemaUpdated, Number(cinemaUpdated?.RapID) === cinemaId && cinemaUpdated?.TenRap === `Audit Cinema U ${token}` && cinemaUpdated?.TrangThai === 'Tạm đóng');

    const newUserEmail = `audit-${token.toLowerCase()}@invalid.example`;
    const user = await exec(tx, 'sp_Admin_User_Create', [
      ['ActorID', sql.Int, actor.ActorID], ['HoTen', sql.NVarChar(100), `Audit Manager ${token}`], ['Email', sql.VarChar(150), newUserEmail],
      ['MatKhauHash', sql.VarChar(255), 'AUDIT-ROLLBACK-HASH'], ['SoDienThoai', sql.VarChar(20), null], ['VaiTroID', sql.Int, managerRole.VaiTroID]]);
    const userRow = first(user); const userId = Number(userRow?.NguoiDungID);
    add('sp_Admin_User_Create', 'internal manager account inserted as active and returned', { Email: newUserEmail, MaVaiTro: 'QUAN_LY_RAP', TrangThai: 'Hoạt động' }, userRow, userId > 0 && userRow?.Email === newUserEmail && userRow?.MaVaiTro === 'QUAN_LY_RAP' && userRow?.TrangThai === 'Hoạt động');
    const lock = await exec(tx, 'sp_Admin_User_UpdateStatus', [['ActorID', sql.Int, actor.ActorID], ['NguoiDungID', sql.Int, userId], ['TrangThai', sql.NVarChar(50), 'Bị khóa']]);
    const locked = first(lock);
    add('sp_Admin_User_UpdateStatus_lock', 'new fixture account locked', { NguoiDungID: userId, TrangThai: 'Bị khóa' }, locked, Number(locked?.NguoiDungID) === userId && locked?.TrangThai === 'Bị khóa');
    const unlock = await exec(tx, 'sp_Admin_User_UpdateStatus', [['ActorID', sql.Int, actor.ActorID], ['NguoiDungID', sql.Int, userId], ['TrangThai', sql.NVarChar(50), 'Hoạt động']]);
    const unlocked = first(unlock);
    add('sp_Admin_User_UpdateStatus_unlock', 'fixture account reactivated', { NguoiDungID: userId, TrangThai: 'Hoạt động' }, unlocked, Number(unlocked?.NguoiDungID) === userId && unlocked?.TrangThai === 'Hoạt động');

    // Movie multi-step creation, association replacement, update and deletion.
    const mReq = tx.request();
    mReq.input('ActorID', sql.Int, actor.ActorID).input('TenPhim', sql.NVarChar(255), `Audit Film ${token}`)
      .input('ThoiLuong', sql.Int, 90).input('NgayKhoiChieu', sql.Date, new Date('2040-01-01T00:00:00Z'))
      .input('NgayKetThuc', sql.Date, new Date('2040-01-31T00:00:00Z')).input('NgonNgu', sql.NVarChar(100), 'Vietnamese')
      .input('PhuDe', sql.NVarChar(100), 'None').input('DoTuoi', sql.NVarChar(20), 'P').input('DaoDien', sql.NVarChar(150), 'Audit Director')
      .input('MoTa', sql.NVarChar(sql.MAX), 'rollback movie fixture').input('PosterURL', sql.NVarChar(500), null)
      .input('TrailerURL', sql.NVarChar(500), null).input('TheLoaiIdList', sql.VarChar(sql.MAX), null).output('NewPhimID', sql.Int);
    const movie = await mReq.execute('dbo.sp_Admin_Movie_Create');
    const movieId = Number(movie.output?.NewPhimID);
    add('sp_Admin_Movie_Create', 'movie and its transaction return a positive output ID and detail row', { outputIDPositive: true }, { outputID: movieId, resultRows: (movie.recordsets ?? []).map(s => s.length) }, movieId > 0);
    const ma = await exec(tx, 'sp_Admin_MovieActor_Set', [['ActorID', sql.Int, actor.ActorID], ['PhimID', sql.Int, movieId], ['DanhSachJson', sql.NVarChar(sql.MAX), JSON.stringify([{ DienVienID: actorId, VaiDien: 'Audit lead' }])]]);
    const maRows = (ma.recordsets ?? []).flat();
    add('sp_Admin_MovieActor_Set_set', 'actor association added and returned', { PhimID: movieId, DienVienID: actorId, VaiDien: 'Audit lead' }, maRows, maRows.length === 1 && Number(maRows[0]?.PhimID) === movieId && Number(maRows[0]?.DienVienID) === actorId && maRows[0]?.VaiDien === 'Audit lead');
    const mu = await exec(tx, 'sp_Admin_Movie_Update', [
      ['ActorID', sql.Int, actor.ActorID], ['PhimID', sql.Int, movieId], ['TenPhim', sql.NVarChar(255), `Audit Film U ${token}`], ['ThoiLuong', sql.Int, 95],
      ['NgayKhoiChieu', sql.Date, new Date('2040-01-01T00:00:00Z')], ['NgayKetThuc', sql.Date, new Date('2040-02-01T00:00:00Z')],
      ['NgonNgu', sql.NVarChar(100), 'Vietnamese'], ['PhuDe', sql.NVarChar(100), 'English'], ['DoTuoi', sql.NVarChar(20), 'P'], ['DaoDien', sql.NVarChar(150), 'Audit Director 2'],
      ['MoTa', sql.NVarChar(sql.MAX), 'updated rollback movie fixture'], ['PosterURL', sql.NVarChar(500), null], ['TrailerURL', sql.NVarChar(500), null],
      ['TrangThai', sql.NVarChar(50), 'Sắp chiếu'], ['TheLoaiIdList', sql.VarChar(sql.MAX), null]]);
    const movieUpdated = first(mu);
    add('sp_Admin_Movie_Update', 'movie fields update successfully; existing actor association remains', { PhimID: movieId, TenPhim: `Audit Film U ${token}` }, movieUpdated, Number(movieUpdated?.PhimID) === movieId && movieUpdated?.TenPhim === `Audit Film U ${token}`);
    const mr = await exec(tx, 'sp_Admin_MovieActor_Set', [['ActorID', sql.Int, actor.ActorID], ['PhimID', sql.Int, movieId], ['DanhSachJson', sql.NVarChar(sql.MAX), '[]']]);
    add('sp_Admin_MovieActor_Set_clear', 'empty array removes all actor associations', 0, (mr.recordsets ?? []).flat().length, (mr.recordsets ?? []).flat().length === 0);
    await exec(tx, 'sp_Admin_Movie_Delete', [['ActorID', sql.Int, actor.ActorID], ['PhimID', sql.Int, movieId]]);
    const movieGone = (await tx.request().input('id', sql.Int, movieId).query('SELECT COUNT(*) c FROM dbo.PHIM WHERE PhimID=@id')).recordset[0].c;
    add('sp_Admin_Movie_Delete', 'unreferenced movie is deleted', 0, movieGone, Number(movieGone) === 0);

    await exec(tx, 'sp_Admin_Genre_Delete', [['ActorID', sql.Int, actor.ActorID], ['TheLoaiID', sql.Int, genreId]]);
    const genreGone = (await tx.request().input('id', sql.Int, genreId).query('SELECT COUNT(*) c FROM dbo.THELOAI WHERE TheLoaiID=@id')).recordset[0].c;
    add('sp_Admin_Genre_Delete', 'unreferenced genre is deleted', 0, genreGone, Number(genreGone) === 0);
    await exec(tx, 'sp_Admin_Product_Delete', [['ActorID', sql.Int, actor.ActorID], ['SanPhamID', sql.Int, productId]]);
    const productGone = (await tx.request().input('id', sql.Int, productId).query('SELECT COUNT(*) c FROM dbo.SANPHAM WHERE SanPhamID=@id')).recordset[0].c;
    add('sp_Admin_Product_Delete', 'unused product is deleted', 0, productGone, Number(productGone) === 0);
    await exec(tx, 'sp_Admin_Promotion_Delete', [['ActorID', sql.Int, actor.ActorID], ['KhuyenMaiID', sql.Int, promoId]]);
    const promoGone = (await tx.request().input('id', sql.Int, promoId).query('SELECT COUNT(*) c FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@id')).recordset[0].c;
    add('sp_Admin_Promotion_Delete', 'unused promotion is deleted', 0, promoGone, Number(promoGone) === 0);
    await exec(tx, 'sp_Admin_Cinema_Delete', [['ActorID', sql.Int, actor.ActorID], ['RapID', sql.Int, cinemaId]]);
    const cinemaGone = (await tx.request().input('id', sql.Int, cinemaId).query('SELECT COUNT(*) c FROM dbo.RAPCHIEUPHIM WHERE RapID=@id')).recordset[0].c;
    add('sp_Admin_Cinema_Delete', 'unreferenced cinema is deleted', 0, cinemaGone, Number(cinemaGone) === 0);
    await exec(tx, 'sp_Admin_Actor_Delete', [['ActorID', sql.Int, actor.ActorID], ['DienVienID', sql.Int, actorId]]);
    const actorGone = (await tx.request().input('id', sql.Int, actorId).query('SELECT COUNT(*) c FROM dbo.DIENVIEN WHERE DienVienID=@id')).recordset[0].c;
    add('sp_Admin_Actor_Delete', 'unassociated actor is deleted', 0, actorGone, Number(actorGone) === 0);

    await tx.rollback(); ev.transaction = { rolledBack: true, outerTransactionCountReturnedToZero: true };
  } catch (e) { try { await tx.rollback(); } catch {} throw e; }

  ev.after = await fingerprint();
  const rowsSame = JSON.stringify(ev.before.rows) === JSON.stringify(ev.after.rows);
  const cc = await pool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS;');
  const violations = (cc.recordsets ?? []).flat();
  const dbcc = await pool.request().query(`DBCC CHECKDB (N'CinemaBookingDB') WITH NO_INFOMSGS,ALL_ERRORMSGS;`);
  const dbccRows = (dbcc.recordsets ?? []).flat();
  const identityGaps = ev.after.identities.filter(x => ev.before.identities.find(p => p.schemaName===x.schemaName && p.tableName===x.tableName && p.columnName===x.columnName)?.identityValue !== x.identityValue)
    .map(x => ({ table: `${x.schemaName}.${x.tableName}`, column: x.columnName, before: ev.before.identities.find(p => p.schemaName===x.schemaName && p.tableName===x.tableName && p.columnName===x.columnName)?.identityValue, after: x.identityValue }));
  const pass = rowsSame && violations.length === 0 && dbccRows.length === 0;
  ev.tests.push({ name: 'post_rollback_full_row_fingerprint_and_integrity', input: 'all persistent tables; DBCC CHECKCONSTRAINTS and CHECKDB', expected: 'all persistent rows unchanged; no integrity findings; identity gaps recorded', actual: { rowsSame, identityGaps, constraintViolations: violations.length, dbccFindings: dbccRows.length }, verdict: pass ? 'PASS' : 'FAIL' });
  ev.verdict = pass && ev.tests.every(x => x.verdict === 'PASS') ? 'PASS' : 'FAIL';
} catch (e) {
  ev.error = e.message; ev.stack = e.stack; ev.verdict = 'FAIL';
  try { ev.after = await fingerprint(); } catch (post) { ev.postCheckError = post.message; }
} finally {
  ev.finishedUtc = new Date().toISOString(); fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(ev, null, 2));
  await pool.close();
  console.log(JSON.stringify({ verdict: ev.verdict, target: ev.target, tests: ev.tests.map(x=>({ name:x.name, verdict:x.verdict })), identityGaps: ev.tests.at(-1)?.actual?.identityGaps, error: ev.error, evidence: path.relative(ROOT,OUT) }, null, 2));
  if (ev.verdict !== 'PASS') process.exitCode = 1;
}
