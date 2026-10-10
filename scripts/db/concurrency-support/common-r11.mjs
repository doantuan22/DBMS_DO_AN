// Offline R1.1 tooling only; never imported by backend/src.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import sql from '../../../backend/node_modules/mssql/index.js';
import { credentials, root, dbRoot, read, write, normalizeModule } from '../lib.mjs';
import { queries } from '../inventory.mjs';
export { sql, root, dbRoot, read, write, normalizeModule, queries };
export const evidenceRoot = path.join(root, '.audit-output/concurrency/r11');
export const database = process.argv.find((arg) => arg.startsWith('--database='))?.slice(11);
export const env = credentials();
assert.notEqual(env.NODE_ENV, 'production');
export function disposable() {
  assert.match(
    database ?? '',
    /^CinemaBookingDB_R0_[A-Za-z0-9_]+$/,
    'An explicit disposable database is required.',
  );
}
export async function connect() {
  return new sql.ConnectionPool({
    server: env.DB_SERVER || 'localhost',
    port: Number(env.DB_PORT || 1433),
    database,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    connectionTimeout: 10000,
    requestTimeout: 30000,
    pool: { max: 1, min: 1 },
    options: {
      encrypt: env.DB_ENCRYPT === 'true',
      trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
      useUTC: true,
    },
  }).connect();
}
export async function batches(pool, source) {
  let result;
  for (const batch of source.split(/^GO\s*$/gim).filter((value) => value.trim()))
    result = await pool.request().batch(batch);
  return result;
}
const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');
export async function snapshot(pool, lock = false) {
  const metadata = {};
  for (const [key, source] of Object.entries(queries))
    metadata[key] = (await pool.request().query(source)).recordset;
  const data = [];
  for (const { tableName } of metadata.rowcounts) {
    assert.match(tableName, /^\w+$/);
    const rows = (
      await pool
        .request()
        .query(`SELECT * FROM dbo.[${tableName}]${lock ? ' WITH(TABLOCKX,HOLDLOCK)' : ''}`)
    ).recordset;
    data.push({
      table: tableName,
      rows: rows.length,
      sha256: sha(
        rows
          .map((row) => JSON.stringify(row))
          .sort()
          .join('\n'),
      ),
    });
  }
  return { metadata, data };
}
export function summarize(snapshot) {
  return {
    data: snapshot.data,
    metadataHashes: Object.fromEntries(
      Object.entries(snapshot.metadata).map(([key, value]) => [key, sha(JSON.stringify(value))]),
    ),
  };
}
export async function roomState(pool, room) {
  const request = pool.request().input('Room', sql.Int, room);
  const result = await request.query(`SELECT * FROM dbo.PHONGCHIEU WHERE PhongID=@Room;
    SELECT * FROM dbo.GHE WHERE PhongID=@Room ORDER BY GheID;
    SELECT * FROM dbo.SUATCHIEU WHERE PhongID=@Room ORDER BY SuatChieuID;
    SELECT d.* FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID WHERE s.PhongID=@Room ORDER BY d.DonDatVeID;
    SELECT v.* FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID WHERE s.PhongID=@Room ORDER BY v.VeID;`);
  return Object.fromEntries(
    ['rooms', 'seats', 'shows', 'orders', 'tickets'].map((key, i) => [key, result.recordsets[i]]),
  );
}
export async function actors(pool) {
  const rows = (
    await pool.request()
      .query(`SELECT n.NguoiDungID,n.Email FROM dbo.NGUOIDUNG n WHERE n.Email IN ('manager.q1@cinemadb.vn','admin@cinemadb.vn');
    SELECT TOP(1) p.RapID FROM dbo.PHANCONG_RAP p JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=p.NguoiDungID WHERE n.Email='manager.q1@cinemadb.vn' AND dbo.fn_KiemTraQuanLyRapScope(n.NguoiDungID,p.RapID)=1 ORDER BY p.RapID;
    SELECT TOP(1) PhimID,ThoiLuong FROM dbo.PHIM ORDER BY PhimID;`)
  ).recordsets;
  return {
    manager: rows[0].find((row) => row.Email.startsWith('manager.')).NguoiDungID,
    admin: rows[0].find((row) => row.Email.startsWith('admin@')).NguoiDungID,
    cinema: rows[1][0].RapID,
    movie: rows[2][0].PhimID,
  };
}
export async function fixture(pool, cinema) {
  const result = await pool.request().input('Cinema', sql.Int, cinema).query(`
    INSERT dbo.PHONGCHIEU(RapID,TenPhong,LoaiPhong,TrangThai) VALUES(@Cinema,N'R11 '+CONVERT(NVARCHAR(36),NEWID()),N'2D',N'Hoạt động');
    DECLARE @Room INT=SCOPE_IDENTITY();
    INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) VALUES(@Room,'A',1,N'Thường',N'Hoạt động'),(@Room,'A',2,N'Thường',N'Hoạt động');
    SELECT @Room RoomID;`);
  return result.recordset[0].RoomID;
}
export async function cleanupRoom(pool, room) {
  await pool
    .request()
    .input('Room', sql.Int, room)
    .query(
      `DELETE dbo.SUATCHIEU WHERE PhongID=@Room; DELETE dbo.GHE WHERE PhongID=@Room; DELETE dbo.PHONGCHIEU WHERE PhongID=@Room;`,
    );
}
