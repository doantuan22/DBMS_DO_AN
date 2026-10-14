// Test-database maintenance for `CinemaBookingDB_Test` (F-14).
//
//   node scripts/audit/test-db.mjs inventory
//   node scripts/audit/test-db.mjs purge                      # dry run (default): executes inside a
//                                                             # transaction and ROLLS BACK, exact counts
//   node scripts/audit/test-db.mjs purge --execute --confirm=CinemaBookingDB_Test [--no-backup]
//
// What it removes: only rows that can be ATTRIBUTED to the audit runners —
//   * users whose e-mail matches  e2e.%@example.test
//   * cinemas / rooms / movies / genres / actors / products named  E2E%   and promotions  E2E% / LC%
//   * everything that hangs off those rows (orders, tickets, payments, compensation, complaints, …)
//   * showtimes in tagged rooms or of tagged movies (a seeded room's showtime is never removed, only the
//     tagged users' orders on it)
// What it never touches: seed data, historical audit data created before the tagging convention
// (`Audit`, `audit.profile.*`, …) and any row it cannot attribute. Residue is reported, not guessed.
//
// Safety: DB_NAME() gate (lib.mjs), explicit --confirm, COPY_ONLY compressed BACKUP first (aborts if it
// fails), one transaction, integrity checks before and after, rollback on any error.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { OUTPUT_DIR, Reporter, TEST_DB, connectTestDb, rows, scalar, sql } from './lib.mjs';
import { runIntegrityChecks } from './db-integrity.mjs';

const BACKUP_DIR = process.env.AUDIT_BACKUP_DIR ?? 'C:/Program Files/Microsoft SQL Server/MSSQL17.MSSQLSERVER/MSSQL/Backup';

// Attribution predicates, kept in one place so inventory and purge can never disagree.
const TAGGED = `
  SELECT NguoiDungID INTO #U FROM dbo.NGUOIDUNG WHERE Email LIKE 'e2e.%@example.test';
  SELECT RapID INTO #C FROM dbo.RAPCHIEUPHIM WHERE TenRap LIKE N'E2E%';
  SELECT PhongID INTO #R FROM dbo.PHONGCHIEU WHERE TenPhong LIKE N'E2E%' OR RapID IN (SELECT RapID FROM #C);
  SELECT PhimID INTO #M FROM dbo.PHIM WHERE TenPhim LIKE N'E2E%';
  -- Only showtimes in tagged rooms or of tagged movies are attributable. A showtime of a seeded room is
  -- never removed, even when only test users booked it (the runners also book seeded showtimes).
  SELECT s.SuatChieuID INTO #S FROM dbo.SUATCHIEU s
   WHERE s.PhongID IN (SELECT PhongID FROM #R) OR s.PhimID IN (SELECT PhimID FROM #M);
  SELECT d.DonDatVeID, d.KhuyenMaiID, d.TrangThai, d.HanGiuCho INTO #O FROM dbo.DONDATVE d
   WHERE d.NguoiDungID IN (SELECT NguoiDungID FROM #U) OR d.SuatChieuID IN (SELECT SuatChieuID FROM #S);
  SELECT KhieuNaiID INTO #K FROM dbo.KHIEUNAI
   WHERE NguoiDungID IN (SELECT NguoiDungID FROM #U) OR DonDatVeID IN (SELECT DonDatVeID FROM #O);
`;

const PURGE_STEPS = [
  ['BOITHUONG_HUYSUAT', 'DELETE FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID IN (SELECT DonDatVeID FROM #O)'],
  ['THANHTOAN', 'DELETE FROM dbo.THANHTOAN WHERE DonDatVeID IN (SELECT DonDatVeID FROM #O)'],
  ['CHITIETDOAN', 'DELETE FROM dbo.CHITIETDOAN WHERE DonDatVeID IN (SELECT DonDatVeID FROM #O)'],
  ['CHITIETVE', 'DELETE FROM dbo.CHITIETVE WHERE DonDatVeID IN (SELECT DonDatVeID FROM #O)'],
  [
    'KHUYENMAI.SoLuongDaDung (release counted uses)',
    `UPDATE km SET SoLuongDaDung = CASE WHEN km.SoLuongDaDung >= x.n THEN km.SoLuongDaDung - x.n ELSE 0 END
       FROM dbo.KHUYENMAI km
       JOIN (SELECT KhuyenMaiID, COUNT(*) n FROM #O
              WHERE KhuyenMaiID IS NOT NULL
                AND (TrangThai = N'Đã thanh toán' OR TrangThai = N'Hoàn thành'
                     OR (TrangThai = N'Chờ thanh toán' AND HanGiuCho > dbo.fn_BayGio()))
              GROUP BY KhuyenMaiID) x ON x.KhuyenMaiID = km.KhuyenMaiID`,
  ],
  ['TINNHAN_KHIEUNAI', 'DELETE FROM dbo.TINNHAN_KHIEUNAI WHERE KhieuNaiID IN (SELECT KhieuNaiID FROM #K)'],
  ['YEUCAU_CHUYENCAP', 'DELETE FROM dbo.YEUCAU_CHUYENCAP WHERE KhieuNaiID IN (SELECT KhieuNaiID FROM #K)'],
  ['XULY_KHIEUNAI', 'DELETE FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID IN (SELECT KhieuNaiID FROM #K)'],
  ['KHIEUNAI', 'DELETE FROM dbo.KHIEUNAI WHERE KhieuNaiID IN (SELECT KhieuNaiID FROM #K)'],
  ['DONDATVE', 'DELETE FROM dbo.DONDATVE WHERE DonDatVeID IN (SELECT DonDatVeID FROM #O)'],
  [
    'DANHGIAPHIM',
    `DELETE FROM dbo.DANHGIAPHIM WHERE NguoiDungID IN (SELECT NguoiDungID FROM #U) OR PhimID IN (SELECT PhimID FROM #M)`,
  ],
  [
    'PHANCONG_RAP',
    `DELETE FROM dbo.PHANCONG_RAP WHERE NguoiDungID IN (SELECT NguoiDungID FROM #U) OR RapID IN (SELECT RapID FROM #C)`,
  ],
  [
    'HOSOKHACHHANG',
    `DELETE FROM dbo.HOSOKHACHHANG WHERE NguoiDungID IN (SELECT NguoiDungID FROM #U)
        AND NOT EXISTS (SELECT 1 FROM dbo.XULY_KHIEUNAI x WHERE x.NguoiXuLyID = HOSOKHACHHANG.NguoiDungID)`,
  ],
  [
    'NGUOIDUNG (skips accounts still referenced)',
    `DELETE FROM dbo.NGUOIDUNG WHERE NguoiDungID IN (SELECT NguoiDungID FROM #U)
        AND NOT EXISTS (SELECT 1 FROM dbo.XULY_KHIEUNAI x WHERE x.NguoiXuLyID = NGUOIDUNG.NguoiDungID)
        AND NOT EXISTS (SELECT 1 FROM dbo.TINNHAN_KHIEUNAI tn WHERE tn.NguoiGuiID = NGUOIDUNG.NguoiDungID)
        AND NOT EXISTS (SELECT 1 FROM dbo.YEUCAU_CHUYENCAP yc WHERE yc.NguoiYeuCauID = NGUOIDUNG.NguoiDungID OR yc.AdminPhuTrachID = NGUOIDUNG.NguoiDungID)
        AND NOT EXISTS (SELECT 1 FROM dbo.DONDATVE d WHERE d.NguoiDungID = NGUOIDUNG.NguoiDungID)
        AND NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI k WHERE k.NguoiDungID = NGUOIDUNG.NguoiDungID OR k.NhanVienPhuTrachID = NGUOIDUNG.NguoiDungID)
        AND NOT EXISTS (SELECT 1 FROM dbo.DANHGIAPHIM r WHERE r.NguoiDungID = NGUOIDUNG.NguoiDungID)`,
  ],
  ['SUATCHIEU', 'DELETE FROM dbo.SUATCHIEU WHERE SuatChieuID IN (SELECT SuatChieuID FROM #S)'],
  ['GHE', 'DELETE FROM dbo.GHE WHERE PhongID IN (SELECT PhongID FROM #R)'],
  ['PHONGCHIEU', 'DELETE FROM dbo.PHONGCHIEU WHERE PhongID IN (SELECT PhongID FROM #R)'],
  ['BANGGIA (tagged cinemas)', 'DELETE FROM dbo.BANGGIA WHERE RapID IN (SELECT RapID FROM #C)'],
  ['HINHANH_RAPCHIEUPHIM', 'DELETE FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID IN (SELECT RapID FROM #C)'],
  ['RAPCHIEUPHIM', 'DELETE FROM dbo.RAPCHIEUPHIM WHERE RapID IN (SELECT RapID FROM #C)'],
  ['PHIM_DIENVIEN', 'DELETE FROM dbo.PHIM_DIENVIEN WHERE PhimID IN (SELECT PhimID FROM #M)'],
  ['PHIM_THELOAI', 'DELETE FROM dbo.PHIM_THELOAI WHERE PhimID IN (SELECT PhimID FROM #M)'],
  ['PHIM', 'DELETE FROM dbo.PHIM WHERE PhimID IN (SELECT PhimID FROM #M)'],
  [
    'DIENVIEN (unreferenced)',
    `DELETE FROM dbo.DIENVIEN WHERE HoTen LIKE N'E2E%' AND NOT EXISTS (SELECT 1 FROM dbo.PHIM_DIENVIEN p WHERE p.DienVienID = DIENVIEN.DienVienID)`,
  ],
  [
    'THELOAI (unreferenced)',
    `DELETE FROM dbo.THELOAI WHERE TenTheLoai LIKE N'E2E%' AND NOT EXISTS (SELECT 1 FROM dbo.PHIM_THELOAI p WHERE p.TheLoaiID = THELOAI.TheLoaiID)`,
  ],
  [
    'SANPHAM (unreferenced)',
    `DELETE FROM dbo.SANPHAM WHERE TenSanPham LIKE N'E2E%' AND NOT EXISTS (SELECT 1 FROM dbo.CHITIETDOAN c WHERE c.SanPhamID = SANPHAM.SanPhamID)`,
  ],
  [
    'KHUYENMAI (unreferenced)',
    `DELETE FROM dbo.KHUYENMAI WHERE (MaCode LIKE 'E2E%' OR MaCode LIKE 'LC%')
        AND NOT EXISTS (SELECT 1 FROM dbo.DONDATVE d WHERE d.KhuyenMaiID = KHUYENMAI.KhuyenMaiID)`,
  ],
];

async function counts(pool) {
  const [row] = await rows(
    pool,
    `${TAGGED}
     SELECT (SELECT COUNT(*) FROM #U) AS users, (SELECT COUNT(*) FROM #C) AS cinemas, (SELECT COUNT(*) FROM #R) AS rooms,
            (SELECT COUNT(*) FROM #M) AS movies, (SELECT COUNT(*) FROM #S) AS showtimes, (SELECT COUNT(*) FROM #O) AS orders,
            (SELECT COUNT(*) FROM #K) AS complaints,
            (SELECT COUNT(*) FROM dbo.DIENVIEN WHERE HoTen LIKE N'E2E%') AS actors,
            (SELECT COUNT(*) FROM dbo.THELOAI WHERE TenTheLoai LIKE N'E2E%') AS genres,
            (SELECT COUNT(*) FROM dbo.SANPHAM WHERE TenSanPham LIKE N'E2E%') AS products,
            (SELECT COUNT(*) FROM dbo.KHUYENMAI WHERE MaCode LIKE 'E2E%' OR MaCode LIKE 'LC%') AS promotions`,
  );
  const [total] = await rows(
    pool,
    `SELECT (SELECT COUNT(*) FROM dbo.NGUOIDUNG) AS users, (SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM) AS cinemas,
            (SELECT COUNT(*) FROM dbo.PHONGCHIEU) AS rooms, (SELECT COUNT(*) FROM dbo.PHIM) AS movies,
            (SELECT COUNT(*) FROM dbo.SUATCHIEU) AS showtimes, (SELECT COUNT(*) FROM dbo.DONDATVE) AS orders,
            (SELECT COUNT(*) FROM dbo.KHIEUNAI) AS complaints, (SELECT COUNT(*) FROM dbo.DIENVIEN) AS actors,
            (SELECT COUNT(*) FROM dbo.THELOAI) AS genres, (SELECT COUNT(*) FROM dbo.SANPHAM) AS products,
            (SELECT COUNT(*) FROM dbo.KHUYENMAI) AS promotions`,
  );
  return { attributable: row, total };
}

async function runPurge(pool, { commit }) {
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  const steps = [];
  try {
    await new sql.Request(transaction).batch(TAGGED);
    for (const [name, statement] of PURGE_STEPS) {
      const result = await new sql.Request(transaction).batch(statement);
      steps.push({ step: name, rows: result.rowsAffected.reduce((a, b) => a + b, 0) });
    }
    const violations = await new sql.Request(transaction).batch('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS, NO_INFOMSGS');
    if ((violations.recordset?.length ?? 0) > 0) throw new Error(`constraint violations after purge: ${violations.recordset.length}`);
    if (commit) await transaction.commit();
    else await transaction.rollback();
    return { steps, committed: commit };
  } catch (error) {
    await transaction.rollback().catch(() => {});
    throw error;
  }
}

async function backup(pool) {
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const file = `${BACKUP_DIR}/${TEST_DB}_pre_purge_${stamp}.bak`;
  await pool
    .request()
    .batch(`BACKUP DATABASE [${TEST_DB}] TO DISK = N'${file.replace(/'/g, "''")}' WITH COPY_ONLY, INIT, COMPRESSION, CHECKSUM`);
  return file;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command = 'inventory', ...flags] = process.argv.slice(2);
  const execute = flags.includes('--execute');
  const confirmed = flags.includes(`--confirm=${TEST_DB}`);
  const { pool, identity } = await connectTestDb();
  console.log(`Target: ${identity.db} as ${identity.login}`);
  const reporter = new Reporter(`test-db-${command}`);
  let exitCode = 0;
  try {
    const before = await counts(pool);
    console.log('Attributable to audit runners / total:');
    for (const key of Object.keys(before.total)) console.log(`  ${key.padEnd(12)} ${String(before.attributable[key]).padStart(5)} / ${before.total[key]}`);
    const archive = { command, execute, before };
    if (command === 'purge') {
      if (execute && !confirmed) throw new Error(`--execute requires --confirm=${TEST_DB}`);
      const pre = await runIntegrityChecks(pool, reporter, { prefix: 'PRE-' });
      if (pre.some((check) => !check.pass)) throw new Error('integrity checks fail BEFORE the purge; refusing to continue');
      if (execute && !flags.includes('--no-backup')) {
        archive.backup = await backup(pool);
        console.log(`Backup written: ${archive.backup}`);
      }
      const result = await runPurge(pool, { commit: execute });
      archive.steps = result.steps;
      archive.committed = result.committed;
      console.log(result.committed ? 'PURGE COMMITTED' : 'DRY RUN (rolled back) — no data changed');
      for (const step of result.steps.filter((s) => s.rows)) console.log(`  ${String(step.rows).padStart(6)}  ${step.step}`);
      const after = await counts(pool);
      archive.after = after;
      if (execute) {
        const post = await runIntegrityChecks(pool, reporter, { prefix: 'POST-' });
        if (post.some((check) => !check.pass)) {
          reporter.record('TESTDB-POST', 'integrity after purge', 'FAIL', 'restore from the backup above');
          exitCode = 1;
        }
        console.log('Remaining (unattributable) rows are kept on purpose:', JSON.stringify(after.attributable));
      }
    }
    fs.mkdirSync(path.join(OUTPUT_DIR, 'test-db'), { recursive: true });
    const file = path.join(OUTPUT_DIR, 'test-db', `${command}-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(archive, null, 2));
    console.log(`Evidence: ${path.relative(process.cwd(), file)}`);
  } catch (error) {
    console.error(`FAILED: ${error.message}`);
    exitCode = 1;
  } finally {
    await pool.close();
  }
  process.exit(exitCode);
}
