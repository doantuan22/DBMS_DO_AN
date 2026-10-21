// Read-only procedure verification against the configured primary database.
// This runner invokes only procedures whose checked source definitions are SELECT-only,
// preview-only, or validation-only. It stores counts and verdicts, never row payloads.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const backendRequire = createRequire(path.join(ROOT, 'backend', 'package.json'));
const sql = backendRequire('mssql');
const dotenv = backendRequire('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
const MAIN_DB = 'CinemaBookingDB';
if (env.DB_DATABASE !== MAIN_DB) throw new Error(`Refusing: backend config does not target ${MAIN_DB}.`);
for (const key of ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD']) {
  if (!env[key]) throw new Error(`backend/.env is missing ${key}.`);
}

const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER,
  port: Number(env.DB_PORT ?? 1433),
  database: env.DB_DATABASE,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  options: {
    encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true',
    trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true',
    useUTC: true,
  },
  requestTimeout: 60000,
}).connect();

const results = [];
async function identity() {
  const row = (await pool.request().query(`
    SELECT DB_NAME() AS databaseName, @@SERVERNAME AS serverName, DATABASEPROPERTYEX(DB_NAME(),'Status') AS state
  `)).recordset[0];
  if (row.databaseName !== MAIN_DB || row.state !== 'ONLINE') {
    throw new Error(`Wrong target or database not online: ${row.databaseName}/${row.state}.`);
  }
  return row;
}
async function query(text, inputs = {}) {
  await identity();
  const request = pool.request();
  for (const [name, value, type] of inputs.__typed ?? []) request.input(name, type, value);
  for (const [name, value] of Object.entries(inputs)) {
    if (name !== '__typed') request.input(name, value);
  }
  return request.query(text);
}
async function execute(proc, inputs = {}, outputDefs = {}) {
  await identity();
  const request = pool.request();
  for (const [name, value, type] of inputs.__typed ?? []) request.input(name, type, value);
  for (const [name, value] of Object.entries(inputs)) {
    if (name !== '__typed') request.input(name, value);
  }
  for (const [name, type] of Object.entries(outputDefs)) request.output(name, type);
  return request.execute(`dbo.${proc}`);
}
function add(name, input, expected, actual, passed, note = '') {
  results.push({ name, input, expected, actual, verdict: passed ? 'PASS' : 'FAIL', note });
}
async function count(text, inputs = {}) {
  const row = (await query(text, inputs)).recordset[0];
  return Number(row.n);
}
function resultRows(result) { return (result.recordsets ?? []).map((set) => set.length); }
function totalRows(result) { return resultRows(result).reduce((sum, n) => sum + n, 0); }

try {
  const target = await identity();
  const fixtures = (await query(`
    DECLARE @Now datetime2(7)=dbo.fn_BayGio();
    SELECT
      (SELECT TOP (1) u.NguoiDungID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID
       WHERE r.MaVaiTro='ADMIN' AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID) AS adminId,
      (SELECT TOP (1) p.NguoiDungID FROM dbo.PHANCONG_RAP p JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=p.NguoiDungID
       JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID WHERE r.MaVaiTro='QUAN_LY_RAP' AND u.TrangThai=N'Hoạt động'
       AND p.TrangThai=N'Hiệu lực' AND dbo.fn_HomNay()>=p.NgayBatDau AND (p.NgayKetThuc IS NULL OR dbo.fn_HomNay()<=p.NgayKetThuc)
       ORDER BY p.NgayBatDau DESC,p.PhanCongID DESC) AS managerId,
      (SELECT TOP (1) p.RapID FROM dbo.PHANCONG_RAP p JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=p.NguoiDungID
       JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID WHERE r.MaVaiTro='QUAN_LY_RAP' AND u.TrangThai=N'Hoạt động'
       AND p.TrangThai=N'Hiệu lực' AND dbo.fn_HomNay()>=p.NgayBatDau AND (p.NgayKetThuc IS NULL OR dbo.fn_HomNay()<=p.NgayKetThuc)
       ORDER BY p.NgayBatDau DESC,p.PhanCongID DESC) AS managerCinemaId,
      (SELECT TOP (1) u.NguoiDungID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID
       WHERE r.MaVaiTro='KHACH_HANG' AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID) AS customerId,
      (SELECT TOP (1) v.PhimID FROM dbo.vw_LichChieuChiTiet v WHERE v.IsBookable=1 ORDER BY v.ThoiGianBatDau,v.PhimID) AS movieId,
      (SELECT TOP (1) v.SuatChieuID FROM dbo.vw_LichChieuChiTiet v WHERE v.IsBookable=1 ORDER BY v.ThoiGianBatDau,v.SuatChieuID) AS showtimeId,
      (SELECT TOP (1) v.RapID FROM dbo.vw_LichChieuChiTiet v WHERE v.IsBookable=1 ORDER BY v.ThoiGianBatDau,v.SuatChieuID) AS cinemaId,
      (SELECT TOP (1) v.PhongID FROM dbo.vw_LichChieuChiTiet v WHERE v.IsBookable=1 ORDER BY v.ThoiGianBatDau,v.SuatChieuID) AS roomId,
      (SELECT TOP (1) d.DonDatVeID FROM dbo.DONDATVE d WHERE d.NguoiDungID=(
       SELECT TOP (1) u.NguoiDungID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID
       WHERE r.MaVaiTro='KHACH_HANG' AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID)
       ORDER BY d.DonDatVeID DESC) AS customerOrderId
  `)).recordset[0];
  if (!fixtures.adminId || !fixtures.managerId || !fixtures.managerCinemaId || !fixtures.customerId ||
      !fixtures.movieId || !fixtures.showtimeId || !fixtures.cinemaId || !fixtures.roomId) {
    throw new Error('Main lacks one or more source-backed read-only fixtures (admin/manager/customer/movie/showtime).');
  }
  const targetLabel = `${target.serverName}/${target.databaseName}`;

  let r = await execute('sp_System_HealthCheck');
  let row = r.recordset?.[0];
  add('sp_System_HealthCheck', 'no parameters', 'one Healthy row for CinemaBookingDB',
    `${r.recordset?.length ?? 0} rows; ${row?.Status ?? 'no status'}; ${row?.DatabaseName ?? 'no database'}`,
    r.recordset?.length === 1 && row.Status === 'Healthy' && row.DatabaseName === MAIN_DB);

  r = await execute('sp_Clock_GetNow', { PhimID: fixtures.movieId });
  row = r.recordset?.[0];
  const movieDuration = (await query('SELECT ThoiLuong FROM dbo.PHIM WHERE PhimID=@id', { id: fixtures.movieId })).recordset[0].ThoiLuong;
  add('sp_Clock_GetNow', 'existing movie ID', 'one row; runtime equals PHIM.ThoiLuong; DB clock current',
    `${r.recordset?.length ?? 0} rows; runtime=${row?.ThoiLuong}`,
    r.recordset?.length === 1 && row.ThoiLuong === movieDuration && row.BayGio instanceof Date && Math.abs(Date.now() - row.BayGio.getTime()) < 5000);

  const listCases = [
    ['sp_Genre_List', {}, 'SELECT COUNT(*) n FROM dbo.THELOAI'],
    ['sp_Cinema_List', {}, "SELECT COUNT(*) n FROM dbo.RAPCHIEUPHIM WHERE TrangThai=N'Hoạt động'"],
    ['sp_Movie_List', {}, 'SELECT COUNT(*) n FROM dbo.PHIM'],
    ['sp_Product_ListActive', {}, "SELECT COUNT(*) n FROM dbo.SANPHAM WHERE TrangThai=N'Đang bán'"],
    ['sp_Review_ListByMovie', { PhimID: fixtures.movieId }, 'SELECT COUNT(*) n FROM dbo.DANHGIAPHIM WHERE PhimID=@id'],
  ];
  for (const [proc, params, oracleSql] of listCases) {
    const expected = await count(oracleSql, params.PhimID === undefined ? {} : { id: params.PhimID });
    r = await execute(proc, params);
    const actual = r.recordset?.length ?? 0;
    add(proc, params.PhimID === undefined ? 'NULL/default filters' : 'existing movie ID', `${expected} rows from base-table oracle`,
      `${actual} rows`, actual === expected);
  }

  const cinemaExpected = await count("SELECT COUNT(*) n FROM dbo.HINHANH_RAPCHIEUPHIM i JOIN dbo.RAPCHIEUPHIM c ON c.RapID=i.RapID WHERE i.RapID=@id AND i.TrangThai=N'Hoạt động' AND c.TrangThai=N'Hoạt động'", { id: fixtures.cinemaId });
  r = await execute('sp_Cinema_GetImages', { RapID: fixtures.cinemaId });
  add('sp_Cinema_GetImages', 'existing active cinema ID', `${cinemaExpected} active image rows`, `${r.recordset?.length ?? 0} rows`, (r.recordset?.length ?? 0) === cinemaExpected);

  const invalidCinema = await execute('sp_Cinema_List', { ThanhPho: '__AUDIT_CITY_NOT_PRESENT__' });
  add('sp_Cinema_List city filter', 'city not in Main data', '0 rows', `${invalidCinema.recordset?.length ?? 0} rows`, (invalidCinema.recordset?.length ?? 0) === 0);
  const movieExpected = await count('SELECT COUNT(*) n FROM dbo.vw_LichChieuChiTiet WHERE PhimID=@id AND IsBookable=1', { id: fixtures.movieId });
  r = await execute('sp_Showtime_ListByMovie', { PhimID: fixtures.movieId });
  add('sp_Showtime_ListByMovie', 'existing bookable movie ID; cinema/date NULL', `${movieExpected} bookable showtimes`, `${r.recordset?.length ?? 0} rows`, (r.recordset?.length ?? 0) === movieExpected);
  r = await execute('sp_Showtime_GetDetail', { SuatChieuID: fixtures.showtimeId });
  add('sp_Showtime_GetDetail', 'existing bookable showtime ID', '1 row', `${r.recordset?.length ?? 0} rows`, (r.recordset?.length ?? 0) === 1);
  const seatExpected = await count('SELECT COUNT(*) n FROM dbo.GHE g JOIN dbo.SUATCHIEU s ON s.PhongID=g.PhongID WHERE s.SuatChieuID=@id', { id: fixtures.showtimeId });
  r = await execute('sp_Seat_ListByShowtime', { SuatChieuID: fixtures.showtimeId });
  add('sp_Seat_ListByShowtime', 'existing bookable showtime ID', `${seatExpected} physical seats`, `${r.recordset?.length ?? 0} rows`, (r.recordset?.length ?? 0) === seatExpected);
  let invalidSeatError = null;
  try { await execute('sp_Seat_ListByShowtime', { SuatChieuID: -2147483648 }); }
  catch (error) { invalidSeatError = Number(error.number ?? error.originalError?.info?.number); }
  add('sp_Seat_ListByShowtime invalid ID', 'showtime=-2147483648', 'THROW 50021', `error ${invalidSeatError ?? 'none'}`, invalidSeatError === 50021);

  r = await execute('sp_Movie_GetDetail', { PhimID: fixtures.movieId });
  const detailCounts = resultRows(r);
  const detailOracle = await query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.PHIM WHERE PhimID=@id) AS basics,
      (SELECT COUNT(*) FROM dbo.PHIM_THELOAI WHERE PhimID=@id) AS genres,
      (SELECT COUNT(*) FROM dbo.PHIM_DIENVIEN WHERE PhimID=@id) AS castRows,
      (SELECT COUNT(*) FROM (SELECT TOP (10) DanhGiaID FROM dbo.DANHGIAPHIM WHERE PhimID=@id ORDER BY NgayDanhGia DESC) x) AS reviews
  `, { id: fixtures.movieId });
  const d = detailOracle.recordset[0];
  const detailWant = [d.basics, d.genres, d.castRows, d.reviews].map(Number);
  add('sp_Movie_GetDetail recordsets', 'existing movie ID', JSON.stringify(detailWant), JSON.stringify(detailCounts),
    JSON.stringify(detailWant) === JSON.stringify(detailCounts));

  r = await execute('sp_RBAC_GetPermissionsByUser', { NguoiDungID: fixtures.adminId });
  const permissionWant = await count('SELECT COUNT(DISTINCT q.QuyenID) n FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO_QUYEN rp ON rp.VaiTroID=u.VaiTroID JOIN dbo.QUYEN q ON q.QuyenID=rp.QuyenID WHERE u.NguoiDungID=@id AND u.TrangThai=N\'Hoạt động\'', { id: fixtures.adminId });
  add('sp_RBAC_GetPermissionsByUser', 'active admin ID', `${permissionWant} distinct role permissions`, `${r.recordset?.length ?? 0} rows`, (r.recordset?.length ?? 0) === permissionWant);

  r = await execute('sp_Manager_ListAssignedCinemas', { NguoiDungID: fixtures.managerId });
  const assignedWant = await count("SELECT COUNT(*) n FROM dbo.PHANCONG_RAP WHERE NguoiDungID=@id AND TrangThai=N'Hiệu lực' AND dbo.fn_HomNay()>=NgayBatDau AND (NgayKetThuc IS NULL OR dbo.fn_HomNay()<=NgayKetThuc)", { id: fixtures.managerId });
  add('sp_Manager_ListAssignedCinemas', 'active assigned manager ID', `${assignedWant} current assignments`, `${r.recordset?.length ?? 0} rows`, (r.recordset?.length ?? 0) === assignedWant);

  r = await execute('sp_Manager_Dashboard', { NguoiDungID: fixtures.managerId, RapID: fixtures.managerCinemaId });
  add('sp_Manager_Dashboard', 'current manager and assigned cinema', 'one row for assigned cinema', `${r.recordset?.length ?? 0} rows`, r.recordset?.length === 1 && r.recordset[0].RapID === fixtures.managerCinemaId);

  r = await execute('sp_Admin_Dashboard', { ActorID: fixtures.adminId });
  add('sp_Admin_Dashboard', 'active admin ID with global-report permission', 'one dashboard row', `${r.recordset?.length ?? 0} rows`, r.recordset?.length === 1);

  r = await execute('sp_Admin_Report_Revenue', { ActorID: fixtures.adminId, TuNgay: null, DenNgay: null, RapID: null });
  const adminRevenueOracle = await query(`
    WITH Paid AS (
      SELECT d.DonDatVeID, d.TongTienVe, d.TongTienDoAn, d.TienGiamGia
      FROM dbo.DONDATVE d WHERE EXISTS(SELECT 1 FROM dbo.THANHTOAN p WHERE p.DonDatVeID=d.DonDatVeID AND p.TrangThai=N'Thành công')
    ) SELECT COUNT(*) AS orders, SUM(CASE WHEN TongTienVe+TongTienDoAn-TienGiamGia<0 THEN 0 ELSE TongTienVe+TongTienDoAn-TienGiamGia END) AS actualRevenue FROM Paid
  `);
  const ar = adminRevenueOracle.recordset[0];
  const adminSummary = r.recordsets?.[0]?.[0];
  add('sp_Admin_Report_Revenue', 'active admin; all dates; all cinemas', `4 recordsets; orders=${ar.orders}; revenue=${ar.actualRevenue ?? 0}`,
    `${r.recordsets?.length ?? 0} recordsets; orders=${adminSummary?.TongSoDonToanHeThong}; revenue=${adminSummary?.TongDoanhThuThucTe}`,
    r.recordsets?.length === 4 && Number(adminSummary?.TongSoDonToanHeThong) === Number(ar.orders) && Number(adminSummary?.TongDoanhThuThucTe ?? 0) === Number(ar.actualRevenue ?? 0));

  const promoInfo = (await query("SELECT KhuyenMaiID,LoaiGiamGia,GiaTriGiam,GiamToiDa,DonHangToiThieu,SoLuong,SoLuongDaDung FROM dbo.KHUYENMAI WHERE MaCode='STAR10' AND TrangThai=N'Hoạt động' AND dbo.fn_BayGio() BETWEEN NgayBatDau AND NgayKetThuc")).recordset[0];
  if (promoInfo) {
    const total = 100000;
    const cap99 = Math.trunc(total * 0.99 * 100) / 100;
    let want = promoInfo.LoaiGiamGia === 'Phần trăm' || promoInfo.LoaiGiamGia === 'PERCENT'
      ? total * Number(promoInfo.GiaTriGiam) / 100
      : Number(promoInfo.GiaTriGiam);
    if (promoInfo.GiamToiDa !== null && want > Number(promoInfo.GiamToiDa)) want = Number(promoInfo.GiamToiDa);
    want = Math.min(want, cap99);
    r = await execute('sp_Promotion_Validate', {
      NguoiDungID: fixtures.customerId,
      MaCode: 'STAR10',
      TongTienDon: 100000,
    }, {
      KhuyenMaiID: sql.Int,
      LoaiGiamGia: sql.NVarChar(20),
      GiaTriGiam: sql.Decimal(18, 2),
      TienGiam: sql.Decimal(18, 2),
      IsValid: sql.Bit,
      Message: sql.NVarChar(255),
    });
    add('sp_Promotion_Validate valid preview', 'active customer; STAR10; total=100000', `IsValid=1; discount=${want}`,
      `IsValid=${r.output.IsValid}; discount=${r.output.TienGiam}`, r.output.IsValid === true && Number(r.output.TienGiam) === want);

    r = await execute('sp_Promotion_Validate', {
      NguoiDungID: fixtures.customerId,
      MaCode: '__AUDIT_CODE_NOT_PRESENT__',
      TongTienDon: 100000,
    }, {
      KhuyenMaiID: sql.Int,
      LoaiGiamGia: sql.NVarChar(20),
      GiaTriGiam: sql.Decimal(18, 2),
      TienGiam: sql.Decimal(18, 2),
      IsValid: sql.Bit,
      Message: sql.NVarChar(255),
    });
    add('sp_Promotion_Validate unknown code', 'active customer; nonexistent code; total=100000', 'IsValid=0; discount=0',
      `IsValid=${r.output.IsValid}; discount=${r.output.TienGiam}`, r.output.IsValid === false && Number(r.output.TienGiam) === 0);
  } else {
    add('sp_Promotion_Validate valid preview', 'STAR10 active fixture lookup', 'active STAR10 promo fixture', 'fixture absent', false);
  }

  const overlapFixture = (await query(`
    SELECT TOP (1) s.SuatChieuID,s.PhimID,s.PhongID,s.ThoiGianBatDau,s.ThoiGianKetThuc,p.ThoiLuong
    FROM dbo.SUATCHIEU s JOIN dbo.PHIM p ON p.PhimID=s.PhimID
    WHERE s.ThoiGianBatDau>dbo.fn_BayGio() AND s.TrangThai<>N'Đã hủy'
    ORDER BY s.ThoiGianBatDau,s.SuatChieuID
  `)).recordset[0];
  if (overlapFixture) {
    const future = new Date(Date.now() + 45 * 86400000);
    const end = new Date(future.getTime() + Number(overlapFixture.ThoiLuong) * 60000);
    r = await execute('sp_Showtime_ValidateTimes', {
      PhimID: overlapFixture.PhimID,
      ThoiGianBatDau: future,
      ThoiGianKetThuc: end,
      PhongID: null,
      SuatChieuID: null,
      TrangThai: 'Mở bán',
    });
    add('sp_Showtime_ValidateTimes valid future input', 'existing movie runtime; future window; no room conflict check', 'no error', 'no error', true);

    let overlapError = null;
    try {
      await execute('sp_Showtime_ValidateTimes', {
        PhimID: overlapFixture.PhimID,
        ThoiGianBatDau: overlapFixture.ThoiGianBatDau,
        ThoiGianKetThuc: overlapFixture.ThoiGianKetThuc,
        PhongID: overlapFixture.PhongID,
        SuatChieuID: -2147483648,
        TrangThai: 'Mở bán',
      });
    } catch (error) { overlapError = Number(error.number ?? error.originalError?.info?.number); }
    add('sp_Showtime_ValidateTimes overlap rejection', 'existing future room/time slot; no writes', 'THROW 50001', `error ${overlapError ?? 'none'}`, overlapError === 50001);
  } else {
    add('sp_Showtime_ValidateTimes overlap rejection', 'future non-canceled showtime fixture lookup', 'fixture available', 'fixture absent', false);
  }

  if (fixtures.customerOrderId) {
    const listExpected = await count('SELECT COUNT(*) n FROM dbo.vw_LichSuDatVe WHERE NguoiDungID=@id', { id: fixtures.customerId });
    r = await execute('sp_Order_ListByCustomer', { NguoiDungID: fixtures.customerId });
    add('sp_Order_ListByCustomer', 'active customer with order history', `${listExpected} order rows`, `${r.recordset?.length ?? 0} rows`, (r.recordset?.length ?? 0) === listExpected);
    r = await execute('sp_Order_GetDetailByCustomer', { NguoiDungID: fixtures.customerId, DonDatVeID: fixtures.customerOrderId });
    const expectedSets = await query(`
      SELECT
        (SELECT COUNT(*) FROM dbo.vw_ChiTietDonDatVe WHERE DonDatVeID=@orderId) AS headerRows,
        (SELECT COUNT(*) FROM dbo.CHITIETVE WHERE DonDatVeID=@orderId) AS ticketRows,
        (SELECT COUNT(*) FROM dbo.CHITIETDOAN WHERE DonDatVeID=@orderId) AS foodRows,
        (SELECT COUNT(*) FROM dbo.THANHTOAN WHERE DonDatVeID=@orderId) AS paymentRows
    `, { orderId: fixtures.customerOrderId });
    const eo = expectedSets.recordset[0];
    const wants = [Number(eo.headerRows), Number(eo.ticketRows), Number(eo.foodRows), Number(eo.paymentRows)];
    const actuals = resultRows(r);
    add('sp_Order_GetDetailByCustomer recordsets', 'active customer; own latest order', JSON.stringify(wants), JSON.stringify(actuals), JSON.stringify(wants) === JSON.stringify(actuals));
  } else {
    add('sp_Order_GetDetailByCustomer recordsets', 'active customer order fixture lookup', 'own order exists', 'fixture absent', false);
  }

  const failures = results.filter((item) => item.verdict !== 'PASS');
  const report = {
    target: targetLabel,
    database: MAIN_DB,
    mode: 'read-only procedure execution; no persistent writes',
    startedAt: new Date().toISOString(),
    count: results.length,
    passed: results.length - failures.length,
    failed: failures.length,
    results,
  };
  const outputDir = path.join(ROOT, '.audit-output');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'main-readonly-procedures.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 1;
} finally {
  await pool.close();
}
