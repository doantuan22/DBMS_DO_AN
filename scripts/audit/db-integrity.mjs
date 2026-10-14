// Database Integrity Checker — read-only. Run:  node scripts/audit/db-integrity.mjs
// Exported `runIntegrityChecks(pool)` is also used by the API and Browser runners after their
// business flows, so the same invariants are re-verified after every mutation batch.
import { fileURLToPath } from 'node:url';
import { Reporter, connectTestDb, rows, scalar } from './lib.mjs';

// Object inventory of the official baseline (FULL_SYSTEM_AUDIT.md §2).
export const EXPECTED_INVENTORY = { tables: 27, procedures: 134, views: 6, functions: 21, triggers: 8 };

const ACTIVE_ORDER = `dbo.fn_DonDangGiuGhe(d.TrangThai, d.HanGiuCho, dbo.fn_BayGio()) = 1`;

/** Each check returns { value, expected, pass } where value is the offending-row count unless noted. */
const CHECKS = [
  {
    id: 'DB-INV-01',
    title: 'Object inventory matches the official baseline',
    run: async (pool) => {
      const [row] = await rows(
        pool,
        `SELECT
           (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped = 0) AS tables_,
           (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0) AS procedures_,
           (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped = 0) AS views_,
           (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped = 0) AS functions_,
           (SELECT COUNT(*) FROM sys.triggers WHERE parent_class = 1) AS triggers_`,
      );
      const actual = {
        tables: row.tables_,
        procedures: row.procedures_,
        views: row.views_,
        functions: row.functions_,
        triggers: row.triggers_,
      };
      return {
        value: actual,
        expected: EXPECTED_INVENTORY,
        pass: JSON.stringify(actual) === JSON.stringify(EXPECTED_INVENTORY),
      };
    },
  },
  {
    id: 'DB-HEALTH-01',
    title: 'dbo.sp_System_HealthCheck reports Healthy',
    run: async (pool) => {
      const result = await pool.request().execute('dbo.sp_System_HealthCheck');
      const status = result.recordset?.[0]?.Status;
      return { value: status, expected: 'Healthy', pass: status === 'Healthy' };
    },
  },
  {
    id: 'DB-CONSTRAINT-01',
    title: 'No disabled or untrusted foreign keys',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          'SELECT COUNT(*) FROM sys.foreign_keys WHERE is_disabled = 1 OR is_not_trusted = 1',
        ),
      ),
  },
  {
    id: 'DB-CONSTRAINT-02',
    title: 'No disabled or untrusted CHECK constraints',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          'SELECT COUNT(*) FROM sys.check_constraints WHERE is_disabled = 1 OR is_not_trusted = 1',
        ),
      ),
  },
  {
    id: 'DB-CONSTRAINT-03',
    title: 'DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS finds no violation',
    run: async (pool) => {
      const result = await pool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS, NO_INFOMSGS');
      return zero(result.recordset?.length ?? 0);
    },
  },
  {
    id: 'DB-ORPHAN-01',
    title: 'No payment (THANHTOAN) without an order',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.THANHTOAN t
           WHERE NOT EXISTS (SELECT 1 FROM dbo.DONDATVE d WHERE d.DonDatVeID = t.DonDatVeID)`,
        ),
      ),
  },
  {
    id: 'DB-SEAT-01',
    title: 'No seat is held twice for the same showtime',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM (
             SELECT d.SuatChieuID, v.GheID
             FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID
             WHERE v.TrangThai <> N'Đã hủy' AND ${ACTIVE_ORDER}
             GROUP BY d.SuatChieuID, v.GheID HAVING COUNT(*) > 1) x`,
        ),
      ),
  },
  {
    id: 'DB-SEAT-02',
    title: 'Every ticket seat belongs to the room of its showtime',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.CHITIETVE v
           JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID
           JOIN dbo.SUATCHIEU s ON s.SuatChieuID = d.SuatChieuID
           JOIN dbo.GHE g ON g.GheID = v.GheID
           WHERE g.PhongID <> s.PhongID`,
        ),
      ),
  },
  {
    id: 'DB-SHOWTIME-01',
    title: 'No overlapping non-cancelled showtimes in the same room',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b
             ON a.PhongID = b.PhongID AND a.SuatChieuID < b.SuatChieuID
            AND a.ThoiGianBatDau < b.ThoiGianKetThuc AND b.ThoiGianBatDau < a.ThoiGianKetThuc
           WHERE a.TrangThai <> N'Đã hủy' AND b.TrangThai <> N'Đã hủy'`,
        ),
      ),
  },
  {
    id: 'DB-PRICING-01',
    title: 'No overlapping active pricing rules (same cinema/seat type/day type/format)',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.BANGGIA a JOIN dbo.BANGGIA b
             ON a.RapID = b.RapID AND a.GiaID < b.GiaID
            AND a.LoaiGhe = b.LoaiGhe AND a.LoaiNgay = b.LoaiNgay AND a.DinhDang = b.DinhDang
            AND a.NgayBatDau <= ISNULL(b.NgayKetThuc, '9999-12-31')
            AND b.NgayBatDau <= ISNULL(a.NgayKetThuc, '9999-12-31')
           WHERE a.TrangThai = N'Áp dụng' AND b.TrangThai = N'Áp dụng'`,
        ),
      ),
  },
  {
    id: 'DB-MONEY-01',
    title: 'Order ticket total equals the sum of its non-cancelled tickets (live orders)',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.DONDATVE d
           WHERE d.TrangThai IN (N'Chờ thanh toán', N'Đã thanh toán', N'Hoàn thành')
             AND d.TongTienVe <> ISNULL((SELECT SUM(v.GiaVe) FROM dbo.CHITIETVE v
                                          WHERE v.DonDatVeID = d.DonDatVeID AND v.TrangThai <> N'Đã hủy'), 0)`,
        ),
      ),
  },
  {
    id: 'DB-MONEY-02',
    title: 'Order food total equals the sum of its food lines (live orders)',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.DONDATVE d
           WHERE d.TrangThai IN (N'Chờ thanh toán', N'Đã thanh toán', N'Hoàn thành')
             AND d.TongTienDoAn <> ISNULL((SELECT SUM(c.SoLuong * c.DonGia) FROM dbo.CHITIETDOAN c
                                            WHERE c.DonDatVeID = d.DonDatVeID), 0)`,
        ),
      ),
  },
  {
    id: 'DB-MONEY-03',
    title: 'Discount never exceeds the order subtotal',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.DONDATVE WHERE TienGiamGia > TongTienVe + TongTienDoAn OR TienGiamGia < 0`,
        ),
      ),
  },
  {
    id: 'DB-PAYMENT-01',
    title: 'Paid/completed orders have a successful payment; pending orders have none',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.DONDATVE d
           WHERE (d.TrangThai IN (N'Đã thanh toán', N'Hoàn thành')
                  AND NOT EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công'))
              OR (d.TrangThai = N'Chờ thanh toán'
                  AND EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công'))`,
        ),
      ),
  },
  {
    id: 'DB-PAYMENT-02',
    title: 'At most one successful payment per order',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM (SELECT DonDatVeID FROM dbo.THANHTOAN WHERE TrangThai = N'Thành công'
                                  GROUP BY DonDatVeID HAVING COUNT(*) > 1) x`,
        ),
      ),
  },
  {
    id: 'DB-COMPENSATION-01',
    title: 'Compensation rows: at most one per order and only for orders of a cancelled showtime',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT (SELECT COUNT(*) FROM (SELECT DonDatVeID FROM dbo.BOITHUONG_HUYSUAT GROUP BY DonDatVeID HAVING COUNT(*) > 1) a)
                + (SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID = b.DonDatVeID
                    JOIN dbo.SUATCHIEU s ON s.SuatChieuID = d.SuatChieuID WHERE s.TrangThai <> N'Đã hủy')`,
        ),
      ),
  },
  {
    id: 'DB-EXPIRY-01',
    title: 'No expired order keeps a live ticket',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.DONDATVE d JOIN dbo.CHITIETVE v ON v.DonDatVeID = d.DonDatVeID
            WHERE d.TrangThai = N'Hết hạn' AND v.TrangThai <> N'Đã hủy'`,
        ),
      ),
  },
  {
    id: 'DB-POINTS-01',
    title: 'No customer has a negative points balance',
    run: async (pool) =>
      zero(await scalar(pool, 'SELECT COUNT(*) FROM dbo.HOSOKHACHHANG WHERE DiemTichLuy < 0')),
  },
  {
    id: 'DB-POINTS-02',
    title: 'Discount and points snapshots are coherent (total discount never exceeds gross; points never negative)',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.DONDATVE
            WHERE DiemSuDung < 0
               OR TienGiamGia > TongTienVe + TongTienDoAn`,
        ),
      ),
  },
  {
    id: 'DB-POINTS-03',
    title: 'A DIEM payment exists only for an order with zero cash due',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID = t.DonDatVeID
            WHERE t.PhuongThuc = N'DIEM'
              AND d.TongTienVe + d.TongTienDoAn - d.TienGiamGia <> 0`,
        ),
      ),
  },
  {
    id: 'DB-REFUND-01',
    title: 'No refund state is ever written (business rule: the system has no refunds)',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT (SELECT COUNT(*) FROM dbo.THANHTOAN WHERE TrangThai = N'Đã hoàn tiền')
                + (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai = N'Hoàn tiền')`,
        ),
      ),
  },
  {
    id: 'DB-POINTS-04',
    title: 'Cancelled-showtime orders keep their successful payment (revenue is never reversed)',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT b
            WHERE NOT EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = b.DonDatVeID AND t.TrangThai = N'Thành công')`,
        ),
      ),
  },
  {
    id: 'DB-PROMO-01',
    title: 'Promotion usage never exceeds its quantity',
    run: async (pool) =>
      zero(await scalar(pool, 'SELECT COUNT(*) FROM dbo.KHUYENMAI WHERE SoLuongDaDung > SoLuong OR SoLuongDaDung < 0')),
  },
  {
    id: 'DB-REVIEW-01',
    title: 'At most one review per customer and movie',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM (SELECT PhimID, NguoiDungID FROM dbo.DANHGIAPHIM
                                  GROUP BY PhimID, NguoiDungID HAVING COUNT(*) > 1) x`,
        ),
      ),
  },
  {
    id: 'DB-COMPLAINT-01',
    title: 'Complaint status equals the status after its latest processing entry',
    run: async (pool) =>
      zero(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.KHIEUNAI k
           CROSS APPLY (SELECT TOP 1 x.TrangThaiSauXuLy FROM dbo.XULY_KHIEUNAI x
                         WHERE x.KhieuNaiID = k.KhieuNaiID ORDER BY x.NgayXuLy DESC, x.XuLyID DESC) last
           WHERE k.TrangThai <> last.TrangThaiSauXuLy`,
        ),
      ),
  },
  {
    id: 'DB-RBAC-01',
    title: 'Every user has exactly one of the four fixed roles',
    run: async (pool) => {
      const [row] = await rows(
        pool,
        `SELECT (SELECT COUNT(*) FROM dbo.VAITRO) AS roles_,
                (SELECT COUNT(*) FROM dbo.NGUOIDUNG n WHERE n.VaiTroID IS NULL
                   OR NOT EXISTS (SELECT 1 FROM dbo.VAITRO v WHERE v.VaiTroID = n.VaiTroID)) AS bad_`,
      );
      return { value: row, expected: { roles_: 4, bad_: 0 }, pass: row.roles_ === 4 && row.bad_ === 0 };
    },
  },
];

const zero = (count) => ({ value: count, expected: 0, pass: count === 0 });

export async function runIntegrityChecks(pool, reporter, { prefix = '' } = {}) {
  const outcomes = [];
  for (const check of CHECKS) {
    let outcome;
    try {
      outcome = await check.run(pool);
    } catch (error) {
      outcome = { value: `ERROR: ${error.message}`, expected: 'no error', pass: false };
    }
    outcomes.push({ ...check, ...outcome });
    reporter?.record(
      `${prefix}${check.id}`,
      check.title,
      outcome.pass ? 'PASS' : 'FAIL',
      `measured=${JSON.stringify(outcome.value)} expected=${JSON.stringify(outcome.expected)}`,
    );
  }
  return outcomes;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const reporter = new Reporter('db-integrity');
  const { pool, identity } = await connectTestDb();
  console.log(`Target: ${identity.db} as ${identity.login}`);
  try {
    await runIntegrityChecks(pool, reporter);
  } finally {
    await pool.close();
  }
  const summary = reporter.finish({ target: identity });
  process.exit(summary.failed === 0 ? 0 : 1);
}
