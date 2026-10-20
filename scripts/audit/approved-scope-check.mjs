// Read-only last-moment check before the approved cleanup and Test restore drill.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT } from './lib.mjs';

const MAIN_DB = 'CinemaBookingDB';
const TEST_DB = 'CinemaBookingDB_Test';
const expected = new Map([
  ['BOITHUONG_HUYSUAT', 0], ['THANHTOAN', 600], ['CHITIETDOAN', 80], ['CHITIETVE', 501],
  ['TINNHAN_KHIEUNAI', 0], ['YEUCAU_CHUYENCAP', 0], ['XULY_KHIEUNAI', 47], ['KHIEUNAI', 60],
  ['DANHGIAPHIM', 100], ['DONDATVE', 501], ['PHANCONG_RAP', 4], ['HOSOKHACHHANG', 206],
  ['NGUOIDUNG', 212], ['SUATCHIEU', 512], ['GHE', 320], ['PHONGCHIEU', 8], ['BANGGIA', 20],
  ['HINHANH_RAPCHIEUPHIM', 4], ['RAPCHIEUPHIM', 4], ['PHIM_DIENVIEN', 22], ['PHIM_THELOAI', 36],
  ['PHIM', 18], ['DIENVIEN', 22], ['THELOAI', 12], ['SANPHAM', 8], ['KHUYENMAI', 5],
]);

const envFile = path.join(ROOT, 'backend', '.env');
if (!fs.existsSync(envFile)) throw new Error('Missing backend/.env');
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(envFile));
if (env.DB_DATABASE !== MAIN_DB) throw new Error(`Refusing: backend/.env must target ${MAIN_DB}.`);
const sql = require('mssql');

const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: 'master',
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: {
    encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true',
    trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true',
    useUTC: true,
  },
  requestTimeout: 60000,
}).connect();

try {
  const dbs = await pool.request().query(`
    SELECT name, state_desc FROM sys.databases
    WHERE name IN (N'${MAIN_DB}', N'${TEST_DB}');
  `);
  const dbMap = new Map(dbs.recordset.map(({ name, state_desc }) => [name, state_desc]));
  if (dbMap.get(MAIN_DB) !== 'ONLINE' || dbMap.get(TEST_DB) !== 'ONLINE') {
    throw new Error(`Expected both exact targets ONLINE; got ${JSON.stringify(Object.fromEntries(dbMap))}.`);
  }
  const rows = await pool.request().query(`
    USE [${MAIN_DB}];
    SELECT t.name AS table_name, SUM(p.rows) AS row_count
    FROM sys.tables t JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1)
    WHERE t.is_ms_shipped=0 GROUP BY t.name;
  `);
  const actual = new Map(rows.recordset.map(({ table_name, row_count }) => [table_name, Number(row_count)]));
  const mismatches = [...expected].filter(([name, count]) => actual.get(name) !== count)
    .map(([name, count]) => `${name}: expected ${count}, found ${actual.get(name) ?? 'missing'}`);
  const protectedRows = await pool.request().query(`
    USE [${MAIN_DB}];
    SELECT N'VAITRO' AS table_name, COUNT_BIG(*) AS row_count FROM dbo.VAITRO
    UNION ALL SELECT N'QUYEN', COUNT_BIG(*) FROM dbo.QUYEN
    UNION ALL SELECT N'VAITRO_QUYEN', COUNT_BIG(*) FROM dbo.VAITRO_QUYEN;
  `);
  const protect = new Map(protectedRows.recordset.map(({ table_name, row_count }) => [table_name, Number(row_count)]));
  for (const [name, count] of [['VAITRO', 4], ['QUYEN', 33], ['VAITRO_QUYEN', 59]]) {
    if (protect.get(name) !== count) mismatches.push(`${name}: expected protected count ${count}, found ${protect.get(name)}`);
  }
  const total = [...expected.values()].reduce((a, b) => a + b, 0);
  if (mismatches.length) throw new Error(`Approved snapshot drift; no writes performed. ${mismatches.join('; ')}`);
  console.log(`Approved scope recheck passed: ${total} operational rows in 26 tables; RBAC 4/33/59 preserved.`);
  console.log(`${MAIN_DB} and ${TEST_DB} are ONLINE. No writes performed.`);
} finally {
  await pool.close();
}
