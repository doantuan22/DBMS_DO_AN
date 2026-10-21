// Read-only verification for the synthetic Main demo seed. Never repairs or changes rows.
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
if (env.DB_DATABASE !== MAIN_DB || env.NODE_ENV !== 'development') {
  throw new Error(`Refusing verification: backend/.env must target local development ${MAIN_DB}.`);
}
if (!['localhost', '127.0.0.1', '(local)', '.'].includes(String(env.DB_SERVER).toLowerCase())) {
  throw new Error(`Refusing verification: DB_SERVER is not local (${env.DB_SERVER}).`);
}
const sqlConfig = {
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: MAIN_DB,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 120000,
};
const pool = await new sql.ConnectionPool(sqlConfig).connect();
const manifestPath = path.join(ROOT, '.audit-output', 'seed-demo-manifest.json');
if (!fs.existsSync(manifestPath)) throw new Error('Seed manifest is missing; run the demo seed before verification.');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.database !== MAIN_DB) throw new Error(`Manifest target mismatch: ${manifest.database}.`);

const identifier = (value) => `[${String(value).replaceAll(']', ']]')}]`;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
try {
  const identity = (await pool.request().query(`
    SELECT DB_NAME() AS database_name, CONVERT(varchar(19),dbo.fn_BayGio(),120) AS utc_now,
      CONVERT(varchar(10),dbo.fn_NgayKinhDoanh(dbo.fn_BayGio()),23) AS local_today,
      CONVERT(sysname,SERVERPROPERTY('MachineName')) AS machine_name;
  `)).recordset[0];
  assert(identity.database_name === MAIN_DB, `Connected to ${identity.database_name}; expected ${MAIN_DB}.`);

  const objectState = (await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped=0 AND name<>'sysdiagrams') AS app_tables,
      (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped=0) AS procedures,
      (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped=0) AS views,
      (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped=0) AS functions,
      (SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped=0) AS triggers,
      (SELECT COUNT(*) FROM sys.foreign_keys) AS foreign_keys,
      (SELECT COUNT(*) FROM sys.check_constraints) AS checks,
      (SELECT COUNT(*) FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) AS bad_fks,
      (SELECT COUNT(*) FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1) AS bad_checks,
      (SELECT COUNT(*) FROM sys.triggers WHERE is_disabled=1) AS disabled_triggers;
  `)).recordset[0];
  assert(objectState.app_tables === 29 && objectState.procedures === 154 && objectState.views === 6
    && objectState.functions === 22 && objectState.triggers === 9 && objectState.foreign_keys === 37 && objectState.checks === 65,
  `Schema inventory changed: ${JSON.stringify(objectState)}.`);
  assert(!objectState.bad_fks && !objectState.bad_checks && !objectState.disabled_triggers,
    `A foreign key, check or trigger is disabled/untrusted: ${JSON.stringify(objectState)}.`);

  const tables = (await pool.request().query(`
    SELECT t.name AS table_name,SUM(p.rows) AS row_count
    FROM sys.tables t JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1)
    WHERE t.is_ms_shipped=0 AND t.name<>'sysdiagrams' GROUP BY t.name ORDER BY t.name;
  `)).recordset;
  const rowCounts = Object.fromEntries(tables.map((row) => [row.table_name, Number(row.row_count)]));
  assert(JSON.stringify(Object.keys(rowCounts).sort()) === JSON.stringify(Object.keys(manifest.tableRowCounts).sort()),
    'Manifest table inventory does not match the database.');
  const countDrift = Object.entries(manifest.tableRowCounts)
    .filter(([name, expected]) => rowCounts[name] !== Number(expected))
    .map(([name, expected]) => `${name}: expected ${expected}, found ${rowCounts[name]}`);
  assert(countDrift.length === 0, `Seed manifest row counts changed: ${countDrift.join('; ')}.`);

  const coverage = (await pool.request().query(`
    DECLARE @Now datetime2(7)=dbo.fn_BayGio();
    SELECT
      (SELECT COUNT(*) FROM dbo.VAITRO) AS roles,
      (SELECT COUNT(*) FROM dbo.QUYEN) AS permissions,
      (SELECT COUNT(*) FROM dbo.VAITRO_QUYEN) AS role_permissions,
      (SELECT COUNT(*) FROM dbo.NGUOIDUNG) AS users,
      (SELECT COUNT(*) FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO r ON r.VaiTroID=n.VaiTroID WHERE r.MaVaiTro='KHACH_HANG') AS customers,
      (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE Email NOT LIKE '%@example.test') AS non_demo_emails,
      (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE TrangThai=N'Bị khóa') AS locked_accounts,
      (SELECT COUNT(*) FROM dbo.HOSOKHACHHANG) AS customer_profiles,
      (SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM) AS cinemas,
      (SELECT COUNT(*) FROM dbo.PHONGCHIEU) AS rooms,
      (SELECT COUNT(*) FROM dbo.GHE) AS seats,
      (SELECT COUNT(*) FROM dbo.PHIM) AS movies,
      (SELECT COUNT(*) FROM dbo.THELOAI) AS genres,
      (SELECT COUNT(*) FROM dbo.DIENVIEN) AS actors,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE ThoiGianKetThuc<@Now) AS past_showtimes,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE ThoiGianBatDau<=@Now AND ThoiGianKetThuc>@Now) AS ongoing_showtimes,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE ThoiGianBatDau>@Now AND TrangThai=N'Mở bán') AS future_open_showtimes,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON b.PhongID=a.PhongID AND b.SuatChieuID>a.SuatChieuID
        AND a.ThoiGianBatDau<b.ThoiGianKetThuc AND b.ThoiGianBatDau<a.ThoiGianKetThuc
        AND a.TrangThai<>N'Đã hủy' AND b.TrangThai<>N'Đã hủy') AS overlapping_showtimes,
      (SELECT COUNT(*) FROM dbo.DONDATVE) AS orders,
      (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Hoàn thành') AS completed_orders,
      (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Chờ thanh toán') AS pending_orders,
      (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Hết hạn') AS expired_orders,
      (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Đã hủy') AS cancelled_orders,
      (SELECT COUNT(*) FROM dbo.THANHTOAN) AS payments,
      (SELECT COUNT(*) FROM dbo.THANHTOAN WHERE TrangThai=N'Thành công') AS successful_payments,
      (SELECT COUNT(*) FROM dbo.THANHTOAN WHERE TrangThai=N'Thất bại') AS failed_payments,
      (SELECT COUNT(*) FROM dbo.THANHTOAN WHERE TrangThai=N'Đang xử lý') AS processing_payments,
      (SELECT COUNT(*) FROM dbo.DANHGIAPHIM) AS reviews,
      (SELECT COUNT(*) FROM dbo.DANHGIAPHIM r WHERE NOT EXISTS (
        SELECT 1 FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
        WHERE d.NguoiDungID=r.NguoiDungID AND s.PhimID=r.PhimID AND d.TrangThai IN (N'Đã thanh toán',N'Hoàn thành')
          AND s.ThoiGianKetThuc<=@Now)) AS invalid_reviews,
      (SELECT COUNT(*) FROM dbo.KHIEUNAI) AS complaints,
      (SELECT COUNT(*) FROM dbo.KHIEUNAI WHERE DonDatVeID IS NOT NULL) AS linked_complaints,
      (SELECT COUNT(*) FROM dbo.KHIEUNAI WHERE DonDatVeID IS NULL) AS unlinked_complaints,
      (SELECT COUNT(*) FROM dbo.KHIEUNAI c JOIN dbo.DONDATVE d ON d.DonDatVeID=c.DonDatVeID WHERE c.NguoiDungID<>d.NguoiDungID) AS invalid_complaint_owners,
      (SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI) AS complaint_history,
      (SELECT COUNT(*) FROM dbo.TINNHAN_KHIEUNAI) AS complaint_messages,
      (SELECT COUNT(*) FROM dbo.YEUCAU_CHUYENCAP) AS escalations,
      (SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT) AS compensations,
      (SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID
        JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID WHERE d.TrangThai<>N'Đã hủy' OR s.TrangThai<>N'Đã hủy'
        OR NOT EXISTS(SELECT 1 FROM dbo.THANHTOAN p WHERE p.DonDatVeID=d.DonDatVeID AND p.TrangThai=N'Thành công')) AS invalid_compensations,
      (SELECT COUNT(*) FROM dbo.KHUYENMAI) AS promotions,
      (SELECT COUNT(*) FROM dbo.KHUYENMAI WHERE SoLuongDaDung<0 OR SoLuongDaDung>SoLuong) AS invalid_promotion_usage,
      (SELECT COUNT(*) FROM dbo.SANPHAM) AS products,
      (SELECT COUNT(*) FROM dbo.BANGGIA) AS pricing_rows,
      (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE ABS(d.TongTienVe-ISNULL((SELECT SUM(v.GiaVe) FROM dbo.CHITIETVE v WHERE v.DonDatVeID=d.DonDatVeID),0))>0.01
        OR ABS(d.TongTienDoAn-ISNULL((SELECT SUM(a.SoLuong*a.DonGia) FROM dbo.CHITIETDOAN a WHERE a.DonDatVeID=d.DonDatVeID),0))>0.01) AS snapshot_mismatches;
  `)).recordset[0];
  assert(coverage.roles === 4 && coverage.permissions === 33 && coverage.role_permissions === 59,
    `Preserved RBAC count changed: ${JSON.stringify(coverage)}.`);
  assert(coverage.customers === 120 && coverage.locked_accounts === 3 && coverage.customer_profiles === 120
    && coverage.cinemas === 4 && coverage.rooms === 12 && coverage.seats === 960
    && coverage.movies === 20 && coverage.genres >= 8 && coverage.actors >= 40,
  `Catalog/account coverage failed: ${JSON.stringify(coverage)}.`);
  assert(coverage.past_showtimes >= 100 && coverage.ongoing_showtimes >= 4 && coverage.future_open_showtimes >= 100
    && coverage.overlapping_showtimes === 0 && coverage.orders === 310 && coverage.completed_orders === 240
    && coverage.pending_orders >= 4 && coverage.expired_orders === 5 && coverage.cancelled_orders >= 10,
  `Schedule/order lifecycle coverage failed: ${JSON.stringify(coverage)}.`);
  assert(coverage.payments >= 350 && coverage.successful_payments >= 290 && coverage.failed_payments >= 50
    && coverage.processing_payments >= 4 && coverage.reviews >= 60 && coverage.invalid_reviews === 0,
  `Payment/review coverage failed: ${JSON.stringify(coverage)}.`);
  assert(coverage.complaints === 30 && coverage.linked_complaints === 20 && coverage.unlinked_complaints === 10
    && coverage.invalid_complaint_owners === 0 && coverage.complaint_history >= 25 && coverage.complaint_messages >= 4
    && coverage.escalations === 2 && coverage.compensations === 6 && coverage.invalid_compensations === 0,
  `Support/compensation coverage failed: ${JSON.stringify(coverage)}.`);
  assert(coverage.promotions === 8 && coverage.products === 13 && coverage.pricing_rows === 24
    && coverage.invalid_promotion_usage === 0 && coverage.snapshot_mismatches === 0 && coverage.non_demo_emails === 0,
  `Catalog/snapshot checks failed: ${JSON.stringify(coverage)}.`);

  const fkRows = (await pool.request().query(`
    SELECT fk.name AS fk_name,cs.name AS child_schema,ct.name AS child_table,ps.name AS parent_schema,pt.name AS parent_table,
      cc.name AS child_column,pc.name AS parent_column,fkc.constraint_column_id
    FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id
    JOIN sys.tables ct ON ct.object_id=fk.parent_object_id JOIN sys.schemas cs ON cs.schema_id=ct.schema_id
    JOIN sys.columns cc ON cc.object_id=fkc.parent_object_id AND cc.column_id=fkc.parent_column_id
    JOIN sys.tables pt ON pt.object_id=fk.referenced_object_id JOIN sys.schemas ps ON ps.schema_id=pt.schema_id
    JOIN sys.columns pc ON pc.object_id=fkc.referenced_object_id AND pc.column_id=fkc.referenced_column_id
    ORDER BY fk.name,fkc.constraint_column_id;
  `)).recordset;
  const grouped = new Map();
  for (const row of fkRows) {
    if (!grouped.has(row.fk_name)) grouped.set(row.fk_name,{ ...row, columns: [] });
    grouped.get(row.fk_name).columns.push({ child: row.child_column, parent: row.parent_column });
  }
  const orphanFks = [];
  for (const fk of grouped.values()) {
    const present = fk.columns.map(({ child }) => `c.${identifier(child)} IS NOT NULL`).join(' AND ');
    const join = fk.columns.map(({ child,parent }) => `p.${identifier(parent)}=c.${identifier(child)}`).join(' AND ');
    const result = await pool.request().query(`SELECT COUNT_BIG(*) AS n FROM ${identifier(fk.child_schema)}.${identifier(fk.child_table)} c
      WHERE ${present} AND NOT EXISTS(SELECT 1 FROM ${identifier(fk.parent_schema)}.${identifier(fk.parent_table)} p WHERE ${join});`);
    if (Number(result.recordset[0].n)) orphanFks.push({ foreignKey: fk.fk_name, rows: Number(result.recordset[0].n) });
  }
  assert(orphanFks.length === 0, `Foreign-key orphan rows found: ${JSON.stringify(orphanFks)}.`);
  const dbcc = await pool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS, NO_INFOMSGS;');
  assert((dbcc.recordset?.length ?? 0) === 0, `DBCC CHECKCONSTRAINTS reported ${dbcc.recordset?.length ?? 0} issue(s).`);

  const report = {
    result: 'PASS', database: identity.database_name, server: identity.machine_name,
    verifiedAtUtc: identity.utc_now, businessToday: identity.local_today, fixedDataSeed: manifest.fixedDataSeed,
    schema: objectState, tableRowCounts: rowCounts, coverage,
    foreignKeyOrphans: orphanFks, dbccViolations: dbcc.recordset?.length ?? 0,
    apiIntegration: 'NOT RUN',
  };
  const outDir = path.join(ROOT,'.audit-output');
  fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,'seed-data-verification.json'),`${JSON.stringify(report,null,2)}\n`,'utf8');
  const tableMarkdown = tables.map((row) => `| ${row.table_name} | ${row.row_count} | ${Number(row.row_count)>0 ? 'Covered' : 'No rows; confirm domain reason'} |`).join('\n');
  const md = `# Seed Data Verification Report\n\n- Result: **PASS** (SQL checks only; API result is appended by verify-demo-api.mjs)\n- Target: ${MAIN_DB} on ${identity.machine_name}\n- Verified at UTC: ${identity.utc_now}; Vietnam business date: ${identity.local_today}\n- Fixed data seed: ${manifest.fixedDataSeed}\n- Schema unchanged: ${objectState.app_tables} application tables, ${objectState.procedures} procedures, ${objectState.views} views, ${objectState.functions} functions, ${objectState.triggers} triggers\n- Integrity: ${objectState.foreign_keys} trusted FKs, ${objectState.checks} trusted CHECK constraints, zero disabled triggers, zero orphan rows, zero DBCC violations\n\n## Coverage\n\n| Area | Verified coverage | Result |\n|---|---|---|\n| Users/RBAC | ${coverage.customers} customers (${coverage.locked_accounts} locked), ${coverage.users} users; ${coverage.roles} roles / ${coverage.permissions} permissions / ${coverage.role_permissions} mappings | PASS |\n| Venues/catalog | ${coverage.cinemas} cinemas, ${coverage.rooms} rooms, ${coverage.seats} seats, ${coverage.movies} movies, ${coverage.genres} genres, ${coverage.actors} actors | PASS |\n| Showtime | ${coverage.past_showtimes} past, ${coverage.ongoing_showtimes} ongoing, ${coverage.future_open_showtimes} future open; ${coverage.overlapping_showtimes} overlaps | PASS |\n| Orders/payments | ${coverage.orders} orders (completed, pending, expired and canceled), ${coverage.payments} attempts including successful, failed and pending | PASS |\n| Reviews | ${coverage.reviews} eligible reviews; ${coverage.invalid_reviews} invalid | PASS |\n| Complaints | ${coverage.complaints} total (${coverage.linked_complaints} linked, ${coverage.unlinked_complaints} unlinked), ${coverage.complaint_history} timeline rows, ${coverage.complaint_messages} messages, ${coverage.escalations} escalations | PASS |\n| Compensation | ${coverage.compensations} procedure-generated cases; ${coverage.invalid_compensations} invalid | PASS |\n\n## Per-table row counts\n\n| Table | Rows | Coverage |\n|---|---:|---|\n${tableMarkdown}\n\nFull machine-readable evidence: .audit-output/seed-data-verification.json.\n`;
  fs.writeFileSync(path.join(ROOT,'SEED_DATA_VERIFICATION_REPORT.md'),md,'utf8');
  console.log('Read-only SQL coverage, FK-orphan, and DBCC checks passed.');
  console.log(JSON.stringify(report,null,2));
} finally {
  await pool.close();
}
