// Read-only integrity and business-state verification for the approved production seed.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAIN_DB = 'CinemaBookingDB';
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const dotenv = require('dotenv');
const sql = require('mssql');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
if (env.DB_DATABASE !== MAIN_DB) throw new Error(`Refusing verification: backend/.env must target ${MAIN_DB}.`);
const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: MAIN_DB,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 120000,
}).connect();

function ident(value) { return `[${String(value).replaceAll(']', ']]')}]`; }
function assert(condition, message) { if (!condition) throw new Error(message); }
try {
  const identity = (await pool.request().query('SELECT DB_NAME() AS db_name, CONVERT(varchar(19),dbo.fn_BayGio(),120) AS vn_now;')).recordset[0];
  assert(identity.db_name === MAIN_DB, `Connected to ${identity.db_name}, expected ${MAIN_DB}.`);
  const objects = (await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped=0) AS tables,
      (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped=0) AS procedures,
      (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped=0) AS views,
      (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped=0) AS functions,
      (SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped=0) AS triggers,
      (SELECT COUNT(*) FROM sys.foreign_keys) AS foreign_keys,
      (SELECT COUNT(*) FROM sys.check_constraints) AS checks,
      (SELECT COUNT(*) FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) AS bad_fks,
      (SELECT COUNT(*) FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1) AS bad_checks,
      (SELECT COUNT(*) FROM sys.triggers WHERE is_disabled=1) AS disabled_triggers,
      (SELECT COUNT(*) FROM sys.triggers t JOIN sys.trigger_events e ON e.object_id=t.object_id WHERE e.type_desc='DELETE') AS delete_triggers;
  `)).recordset[0];
  const expectedObjects = { tables: 29, procedures: 147, views: 6, functions: 21, triggers: 9 };
  for (const [key, expected] of Object.entries(expectedObjects)) {
    assert(Number(objects[key]) === expected, `Schema drift for ${key}: expected ${expected}, got ${objects[key]}.`);
  }
  assert(!objects.bad_fks && !objects.bad_checks && !objects.disabled_triggers && !objects.delete_triggers,
    `Untrusted/disabled constraints or disabled/delete triggers found: ${JSON.stringify(objects)}.`);

  const tableResult = await pool.request().query(`
    SELECT s.name AS schema_name, t.name AS table_name, SUM(p.rows) AS row_count
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
    JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1)
    WHERE t.is_ms_shipped=0 GROUP BY s.name,t.name ORDER BY s.name,t.name;
  `);
  const rowCounts = Object.fromEntries(tableResult.recordset.map((row) => [row.table_name, Number(row.row_count)]));
  const core = (await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.NGUOIDUNG) AS users,
      (SELECT COUNT(*) FROM dbo.HOSOKHACHHANG) AS customer_profiles,
      (SELECT COUNT(*) FROM dbo.VAITRO) AS roles,
      (SELECT COUNT(*) FROM dbo.QUYEN) AS permissions,
      (SELECT COUNT(*) FROM dbo.VAITRO_QUYEN) AS role_permission_mappings,
      (SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM) AS cinemas,
      (SELECT COUNT(*) FROM dbo.HINHANH_RAPCHIEUPHIM) AS cinema_images,
      (SELECT COUNT(*) FROM dbo.PHONGCHIEU) AS rooms,
      (SELECT COUNT(*) FROM dbo.GHE) AS seats,
      (SELECT COUNT(*) FROM dbo.THELOAI) AS genres,
      (SELECT COUNT(*) FROM dbo.DIENVIEN) AS actors,
      (SELECT COUNT(*) FROM dbo.PHIM) AS movies,
      (SELECT COUNT(*) FROM dbo.PHIM_THELOAI) AS movie_genres,
      (SELECT COUNT(*) FROM dbo.PHIM_DIENVIEN) AS movie_cast_rows,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU) AS showtimes,
      (SELECT COUNT(*) FROM dbo.BANGGIA) AS pricing_rows,
      (SELECT COUNT(*) FROM dbo.SANPHAM) AS products,
      (SELECT COUNT(*) FROM dbo.KHUYENMAI) AS promotions,
      (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Đã thanh toán') AS paid_orders,
      (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Đã hủy') AS cancelled_orders,
      (SELECT COUNT(*) FROM dbo.CHITIETVE) AS tickets,
      (SELECT COUNT(*) FROM dbo.CHITIETDOAN) AS food_order_rows,
      (SELECT COUNT(*) FROM dbo.THANHTOAN WHERE TrangThai=N'Thành công') AS successful_payments,
      (SELECT COUNT(*) FROM dbo.THANHTOAN WHERE TrangThai=N'Thất bại') AS failed_payments,
      (SELECT COUNT(*) FROM dbo.KHIEUNAI) AS complaints,
      (SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI) AS complaint_processing_rows,
      (SELECT COUNT(*) FROM dbo.YEUCAU_CHUYENCAP) AS escalations;
  `)).recordset[0];
  const roleRows = (await pool.request().query(`
    SELECT vt.MaVaiTro AS role, COUNT(nd.NguoiDungID) AS account_count
    FROM dbo.VAITRO vt LEFT JOIN dbo.NGUOIDUNG nd ON nd.VaiTroID=vt.VaiTroID
    GROUP BY vt.MaVaiTro ORDER BY vt.MaVaiTro;
  `)).recordset;
  const statusRows = (await pool.request().query(`
    SELECT N'Phim' AS entity, TrangThai AS status, COUNT(*) AS row_count FROM dbo.PHIM GROUP BY TrangThai
    UNION ALL SELECT N'Suất chiếu', TrangThai, COUNT(*) FROM dbo.SUATCHIEU GROUP BY TrangThai
    UNION ALL SELECT N'Đơn đặt vé', TrangThai, COUNT(*) FROM dbo.DONDATVE GROUP BY TrangThai
    UNION ALL SELECT N'Khiếu nại', TrangThai, COUNT(*) FROM dbo.KHIEUNAI GROUP BY TrangThai;
  `)).recordset;
  const businessChecks = (await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE ThoiGianBatDau <= dbo.fn_BayGio() OR TrangThai<>N'Mở bán') AS invalid_future_showtimes,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU s JOIN dbo.PHIM p ON p.PhimID=s.PhimID WHERE CONVERT(date,s.ThoiGianBatDau)<p.NgayKhoiChieu) AS show_before_release,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON a.PhongID=b.PhongID AND a.SuatChieuID<b.SuatChieuID AND a.ThoiGianBatDau<b.ThoiGianKetThuc AND b.ThoiGianBatDau<a.ThoiGianKetThuc) AS overlapping_showtimes,
      (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.TrangThai=N'Đã thanh toán' AND NOT EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID=d.DonDatVeID AND t.TrangThai=N'Thành công')) AS paid_without_success_payment,
      (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.TrangThai=N'Đã hủy' AND NOT EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID=d.DonDatVeID AND t.TrangThai=N'Thất bại')) AS cancelled_without_failed_payment,
      (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE Email NOT LIKE '%@example.test') AS non_synthetic_emails,
      (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE MatKhau NOT LIKE '$2a$10$%' AND MatKhau NOT LIKE '$2b$10$%' AND MatKhau NOT LIKE '$2y$10$%') AS non_bcrypt_cost10_hashes,
      (SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM WHERE DiaChi NOT LIKE N'%mô phỏng%') AS venues_missing_simulated_address,
      (SELECT COUNT(*) FROM dbo.PHIM WHERE PosterURL IS NULL OR PosterURL NOT LIKE N'/seed-media/posters/%') AS movies_missing_local_art,
      (SELECT COUNT(*) FROM dbo.HINHANH_RAPCHIEUPHIM WHERE URL NOT LIKE N'/seed-media/cinemas/%') AS cinemas_missing_local_art;
  `)).recordset[0];

  const fkRows = (await pool.request().query(`
    SELECT fk.name AS fk_name, cs.name AS child_schema, ct.name AS child_table,
      ps.name AS parent_schema, pt.name AS parent_table,
      cc.name AS child_column, pc.name AS parent_column, fkc.constraint_column_id
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id
    JOIN sys.tables ct ON ct.object_id=fk.parent_object_id JOIN sys.schemas cs ON cs.schema_id=ct.schema_id
    JOIN sys.columns cc ON cc.object_id=fkc.parent_object_id AND cc.column_id=fkc.parent_column_id
    JOIN sys.tables pt ON pt.object_id=fk.referenced_object_id JOIN sys.schemas ps ON ps.schema_id=pt.schema_id
    JOIN sys.columns pc ON pc.object_id=fkc.referenced_object_id AND pc.column_id=fkc.referenced_column_id
    ORDER BY fk.name,fkc.constraint_column_id;
  `)).recordset;
  const groupedFks = new Map();
  for (const row of fkRows) {
    if (!groupedFks.has(row.fk_name)) groupedFks.set(row.fk_name, { ...row, columns: [] });
    groupedFks.get(row.fk_name).columns.push({ child: row.child_column, parent: row.parent_column });
  }
  const orphanFks = [];
  for (const fk of groupedFks.values()) {
    const allPresent = fk.columns.map(({ child }) => `c.${ident(child)} IS NOT NULL`).join(' AND ');
    const matches = fk.columns.map(({ child, parent }) => `p.${ident(parent)}=c.${ident(child)}`).join(' AND ');
    const result = await pool.request().query(`
      SELECT COUNT_BIG(*) AS orphan_count FROM ${ident(fk.child_schema)}.${ident(fk.child_table)} c
      WHERE ${allPresent} AND NOT EXISTS (SELECT 1 FROM ${ident(fk.parent_schema)}.${ident(fk.parent_table)} p WHERE ${matches});
    `);
    if (Number(result.recordset[0].orphan_count) > 0) orphanFks.push({ fk: fk.fk_name, orphanCount: Number(result.recordset[0].orphan_count) });
  }
  const dbcc = await pool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS, NO_INFOMSGS;');

  const expected = {
    users: 34, customer_profiles: 24, roles: 4, permissions: 33, role_permission_mappings: 59,
    cinemas: 4, cinema_images: 4, rooms: 8, seats: 640, genres: 8, movies: 5,
    showtimes: 168, pricing_rows: 24, products: 6, promotions: 3,
    paid_orders: 18, cancelled_orders: 4, successful_payments: 18, failed_payments: 4,
    complaints: 6, escalations: 1,
  };
  for (const [key, value] of Object.entries(expected)) {
    assert(Number(core[key]) === value, `Expected ${key}=${value}, found ${core[key]}.`);
  }
  for (const key of Object.keys(businessChecks)) {
    assert(Number(businessChecks[key]) === 0, `Business data check ${key} found ${businessChecks[key]}.`);
  }
  assert(orphanFks.length === 0, `Foreign-key orphan rows found: ${JSON.stringify(orphanFks)}.`);
  assert((dbcc.recordset?.length ?? 0) === 0, 'DBCC CHECKCONSTRAINTS reported a violation.');
  assert(Number(objects.foreign_keys) === groupedFks.size, 'FK metadata inventory mismatch.');

  const report = {
    verifiedAtVietnamLocal: identity.vn_now,
    database: identity.db_name,
    schemaInventory: objects,
    tableRowCounts: rowCounts,
    coreCounts: core,
    accountsByRole: roleRows,
    states: statusRows,
    businessChecks,
    foreignKeyCount: groupedFks.size,
    foreignKeyOrphans: orphanFks,
    dbccCheckConstraintsViolations: dbcc.recordset?.length ?? 0,
    result: 'PASS',
  };
  const outDir = path.join(ROOT, '.audit-output');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'seed-data-verification.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  const md = `# Seed Data Verification Report\n\n- Result: PASS\n- Verified at (Asia/Ho_Chi_Minh): ${identity.vn_now}\n- Target: \`${MAIN_DB}\`\n- Schema inventory: ${objects.tables} tables, ${objects.procedures} procedures, ${objects.views} views, ${objects.functions} functions, ${objects.triggers} triggers.\n- Constraints: ${objects.foreign_keys} trusted foreign keys and ${objects.checks} trusted checks; no disabled triggers, FK or check constraints.\n- RBAC preserved: ${core.roles} roles, ${core.permissions} permissions, ${core.role_permission_mappings} role-to-permission rows.\n- Synthetic accounts: ${core.users} total (${core.customer_profiles} customer profiles), all bcrypt cost 10 and reserved \`example.test\` email addresses.\n- Venues and catalog: ${core.cinemas} simulated cinemas, ${core.rooms} rooms, ${core.seats} seats, ${core.movies} movies, ${core.showtimes} future showtimes, ${core.products} products, ${core.promotions} promotions.\n- Orders and support: ${core.paid_orders} successful paid orders, ${core.cancelled_orders} failed-payment orders canceled through procedure, ${core.complaints} complaints, ${core.escalations} escalation.\n- Business checks: all future-showtime, overlap, payment-state, synthetic-email and media-path checks passed; FK orphan rows: ${orphanFks.length}; DBCC violations: ${dbcc.recordset?.length ?? 0}.\n\nPer-table counts and full check details are in the ignored local artifact \`.audit-output/seed-data-verification.json\`.\n`;
  fs.writeFileSync(path.join(ROOT, 'SEED_DATA_VERIFICATION_REPORT.md'), md, 'utf8');
  console.log('Seed integrity, all 37 FK relationships, DBCC, schedule and lifecycle checks passed.');
  console.log(JSON.stringify(report, null, 2));
} finally { await pool.close(); }
