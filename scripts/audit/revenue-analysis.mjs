// F-11 evidence: read-only reconciliation of "tiền thực thu" (cash received) with the order lifecycle.
//   node scripts/audit/revenue-analysis.mjs
// Writes no data. Compares the four places that report revenue with independent SQL aggregates and
// splits the cash by what actually happened to the order / showtime.
import fs from 'node:fs';
import path from 'node:path';
import { OUTPUT_DIR, connectTestDb, rows, scalar } from './lib.mjs';

const { pool, identity } = await connectTestDb();
console.log(`Target: ${identity.db} (read-only analysis)`);

const PAID = `EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công')`;
// Cash actually received: TienGiamGia already includes promotion and points discounts.
const AMOUNT = 'CASE WHEN d.TongTienVe + d.TongTienDoAn - d.TienGiamGia < 0 THEN 0 ELSE d.TongTienVe + d.TongTienDoAn - d.TienGiamGia END';

const [cash] = await rows(pool, `SELECT COUNT(*) AS orders, ISNULL(SUM(${AMOUNT}), 0) AS amount FROM dbo.DONDATVE d WHERE ${PAID}`);
const breakdown = await rows(
  pool,
  `SELECT CASE
            WHEN d.TrangThai = N'Đã hủy' AND s.TrangThai = N'Đã hủy' THEN '3_cancelled_by_showtime_cancellation'
            WHEN d.TrangThai = N'Đã hủy'                              THEN '4_cancelled_other'
            WHEN s.TrangThai = N'Hoàn thành'                          THEN '1_showtime_completed'
            WHEN d.TrangThai IN (N'Đã thanh toán', N'Hoàn thành')      THEN '2_showtime_not_yet_played'
            ELSE '5_other' END AS bucket,
          COUNT(*) AS orders, SUM(${AMOUNT}) AS amount, SUM(d.TongTienVe) AS ticketMoney,
          SUM(d.TongTienDoAn) AS foodMoney, SUM(d.TienGiamGia) AS discount,
          SUM(ISNULL(b.DiemBoiThuong, 0)) AS compensationPoints
     FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID = d.SuatChieuID
     LEFT JOIN dbo.BOITHUONG_HUYSUAT b ON b.DonDatVeID = d.DonDatVeID
    WHERE ${PAID} GROUP BY CASE
            WHEN d.TrangThai = N'Đã hủy' AND s.TrangThai = N'Đã hủy' THEN '3_cancelled_by_showtime_cancellation'
            WHEN d.TrangThai = N'Đã hủy'                              THEN '4_cancelled_other'
            WHEN s.TrangThai = N'Hoàn thành'                          THEN '1_showtime_completed'
            WHEN d.TrangThai IN (N'Đã thanh toán', N'Hoàn thành')      THEN '2_showtime_not_yet_played'
            ELSE '5_other' END ORDER BY 1`,
);
const [activeOrders] = await rows(
  pool,
  `SELECT COUNT(*) AS orders, ISNULL(SUM(${AMOUNT}), 0) AS amount FROM dbo.DONDATVE d WHERE d.TrangThai IN (N'Đã thanh toán', N'Hoàn thành')`,
);
const [refundWriters] = await rows(
  pool,
  `SELECT (SELECT COUNT(*) FROM dbo.THANHTOAN WHERE TrangThai = N'Đã hoàn tiền') AS refundedPayments,
          (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai = N'Hoàn tiền') AS refundedOrders,
          (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.TrangThai = N'Đã hủy' AND ${PAID}) AS cancelledWithCash`,
);
const dashboard = (await pool.request().input('ActorID', 1).execute('dbo.sp_Admin_Dashboard')).recordset[0];
const report = (await pool.request().input('ActorID', 1).execute('dbo.sp_Admin_Report_Revenue')).recordsets[0][0];
const [view] = await rows(pool, 'SELECT ISNULL(SUM(DoanhThuThucTe), 0) AS amount, ISNULL(SUM(TongSoDon), 0) AS orders FROM dbo.vw_DoanhThuTheoRap');
const bookingsPoints = await scalar(pool, 'SELECT ISNULL(SUM(DiemBoiThuong), 0) FROM dbo.BOITHUONG_HUYSUAT');

const num = (v) => Number(v ?? 0);
const result = {
  generatedAt: new Date().toISOString(),
  database: identity.db,
  cashReceived: { orders: num(cash.orders), amount: num(cash.amount) },
  breakdown: breakdown.map((r) => ({ ...r, orders: num(r.orders), amount: num(r.amount), ticketMoney: num(r.ticketMoney), foodMoney: num(r.foodMoney), discount: num(r.discount), compensationPoints: num(r.compensationPoints) })),
  paidOrActiveOrders: { orders: num(activeOrders.orders), amount: num(activeOrders.amount) },
  lifecycleFacts: { ...refundWriters, compensationPointsIssued: num(bookingsPoints) },
  reportedBy: {
    dashboard_TongDoanhThuToanThoiGian: num(dashboard.TongDoanhThuToanThoiGian),
    dashboard_TongDonThanhCong_ordersCountedAsSuccessful: num(dashboard.TongDonThanhCong),
    adminReportRevenue_TongDoanhThuThucTe: num(report.TongDoanhThuThucTe),
    adminReportRevenue_orders: num(report.TongSoDonToanHeThong),
    vw_DoanhThuTheoRap_sum: num(view.amount),
    vw_DoanhThuTheoRap_orders: num(view.orders),
  },
};
result.reconciliation = {
  dashboardEqualsCashReceived: result.reportedBy.dashboard_TongDoanhThuToanThoiGian === result.cashReceived.amount,
  reportEqualsCashReceived: result.reportedBy.adminReportRevenue_TongDoanhThuThucTe === result.cashReceived.amount,
  viewEqualsCashReceived: result.reportedBy.vw_DoanhThuTheoRap_sum === result.cashReceived.amount,
  bucketsSumToCash: result.breakdown.reduce((a, r) => a + r.amount, 0) === result.cashReceived.amount,
  moneyOnCancelledOrders: result.breakdown.filter((r) => r.bucket.startsWith('3_') || r.bucket.startsWith('4_')).reduce((a, r) => a + r.amount, 0),
  dashboardOrderCountVsMoneyOrderCount: `${result.reportedBy.dashboard_TongDonThanhCong_ordersCountedAsSuccessful} orders in the count tile, ${result.cashReceived.orders} orders behind the money tile`,
};
console.log(JSON.stringify(result, null, 2));
fs.mkdirSync(path.join(OUTPUT_DIR, 'revenue'), { recursive: true });
fs.writeFileSync(path.join(OUTPUT_DIR, 'revenue', 'f11-reconciliation.json'), JSON.stringify(result, null, 2));
await pool.close();
const ok = Object.entries(result.reconciliation).filter(([k]) => k.endsWith('EqualsCashReceived') || k === 'bucketsSumToCash').every(([, v]) => v === true);
process.exit(ok ? 0 : 1);
