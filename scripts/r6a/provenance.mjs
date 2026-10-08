// Sanitized provenance: IDs and necessary anomaly/finance facts only; no credentials or account PII.
import assert from 'node:assert/strict';
import path from 'node:path';
import { connect, ask, root, read, write, sha } from '../r3a/common.mjs';

const evidence = path.join(root, 'audit/remediation/r6a/evidence');
const load = file => JSON.parse(read(path.join(root, file)));
const pointer = file => ({ file, sha256: sha(read(path.join(root, file))) });
const oldDirectory = 'docs/audit-full-20261003/evidence/';
const specs = {
  'DATA-001': ['data-order-totals.json', ['DonDatVeID', 'TrangThai', 'TongTienVe', 'TongTienDoAn', 'TienGiamGia', 'actualTicketTotal', 'actualProductTotal']],
  'DATA-002': ['data-paid-cancelled-showtime.json', ['DonDatVeID', 'SuatChieuID', 'TrangThai', 'showtimeStatus']],
  'DATA-003': ['data-showtime-duration.json', ['SuatChieuID', 'PhimID', 'TrangThai', 'ThoiLuong', 'duration']],
  'DATA-004': ['data-showtime-movie-dates.json', ['SuatChieuID', 'PhimID', 'ThoiGianBatDau', 'NgayKhoiChieu', 'NgayKetThuc']],
  'DATA-005': ['data-invalid-born-dates.json', ['NguoiDungID', 'NgaySinh']],
  'DATA-006': ['customer-profile-missing-after.json', ['NguoiDungID']],
  'DATA-007': ['assignment-duplicates-after.json', ['NguoiDungID', 'RapID', 'NgayBatDau', 'NgayKetThuc', 'TrangThai', 'duplicateRows']],
  'DATA-008': ['data-promotion-counter.json', ['KhuyenMaiID', 'SoLuongDaDung', 'currentUse']],
  'DATA-009': ['data-stale-open-showtimes.json', ['SuatChieuID', 'ThoiGianBatDau', 'ThoiGianKetThuc', 'TrangThai']],
};
const historical = {};
for (const [finding, [name, fields]] of Object.entries(specs)) {
  const file = oldDirectory + name;
  historical[finding] = { ...pointer(file), rows: load(file).map(row => Object.fromEntries(fields.map(field => [field, row[field]]))) };
}
historical['DATA-001'].limitations = [
  'Original snapshot: 80000 + 0 - 120000 = -40000, status Hết hạn; ticket sum=80000, food sum=0.',
  'No original promotion ID, receipt, per-ticket IDs, or complete payment-attempt history is present in this aggregate evidence.',
  'Old data-payment-amounts.json is only a payment/order mismatch scan, not an inventory of negative payments or all attempts; an empty result does not prove no negative collection.',
  'Correct discount/total and pre-R0 origin cannot be reconstructed; never clamp, rewrite, or synthesize replacement records.',
];
historical['DATA-002'].limitations = [
  'Old evidence proves paid order states and cancelled show state only; it does not contain original financial snapshots, gateway receipts, or loyalty-event postings.',
  'Cannot certify old compensation or calculate exact event points for missing orders 26/27/28. Current profile balance alone is not proof of historical posting.',
];
const fixture = load(oldDirectory + 'fixture-manifest.json');
const fixtureProof = {
  ...pointer(oldDirectory + 'fixture-manifest.json'), runId: fixture.runId,
  users: fixture.users.filter(u => [26, 34].includes(u.id)).map(({ id, kind, role, purpose }) => ({ id, kind, role, purpose })),
  assignments: fixture.other.filter(row => row.table === 'PHANCONG_RAP' && [13, 14].includes(row.id)),
  note: 'These were test records created by the old audit on the then-main DB; none exist in current main. Do not label unrelated old records fixture-only.',
};
const r1 = load('audit/remediation/evidence/migration-CinemaBookingDB.json');
const preR1 = load('audit/remediation/evidence/historical-data-pre-migration-check.json');
const after = load('audit/remediation/r6a/evidence/main-after.json');
assert.ok(after.dataVersusR5.every(table => table.matchesR5));

const seedUsersFile = 'database/10_seed/seed_base/004_reference.sql';
const seedUsers = read(path.join(root, seedUsersFile));
const seedRoles = [...seedUsers.matchAll(/^\((\d+),\s*(\d+),/gm)].map(match => ({ NguoiDungID: Number(match[1]), VaiTroID: Number(match[2]) }));
const seedProfiles = [...seedUsers.matchAll(/^\((\d+),\s*'([^']+)',\s*N?'[^']+',\s*(\d+)\)/gm)]
  .map(match => ({ NguoiDungID: Number(match[1]), date: match[2], points: Number(match[3]) }));
assert.equal(seedRoles.length, 8);
assert.equal(seedProfiles.length, 4);
const userQuery = 'SELECT NguoiDungID,VaiTroID FROM dbo.NGUOIDUNG ORDER BY NguoiDungID';
// Ordinary DOB is used only for a boolean equality check, never saved/printed.
const profileQuery = 'SELECT NguoiDungID,CONVERT(varchar(10),NgaySinh,23) AS seedDate,DiemTichLuy FROM dbo.HOSOKHACHHANG ORDER BY NguoiDungID';
const pool = await connect('CinemaBookingDB');
let profileChecks;
try {
  assert.deepEqual((await ask(pool, userQuery)).recordset, seedRoles);
  profileChecks = (await ask(pool, profileQuery)).recordset.map(row => {
    const seed = seedProfiles.find(profile => profile.NguoiDungID === row.NguoiDungID);
    return { NguoiDungID: row.NguoiDungID, seedProfilePresent: !!seed,
      dateMatchesSeed: row.seedDate === seed?.date, pointsMatchSeed: row.DiemTichLuy === seed?.points };
  });
  assert.ok(profileChecks.every(row => row.seedProfilePresent && row.dateMatchesSeed && row.pointsMatchSeed));
} finally { await pool.close(); }
const showtimes = load('audit/remediation/r6a/evidence/all-showtimes.json').rows;
const seedDay = new Date(`${showtimes.find(row => row.SuatChieuID === 2).businessDate}T00:00:00.000Z`);
seedDay.setUTCDate(seedDay.getUTCDate() - 1);
const asUTC = (day, minute) => new Date(seedDay.getTime() + day * 86400000 + (minute - 420) * 60000).toISOString();
const specsShow = [[1, 1, 1, -2, 1080, 1246, 'Hoàn thành'], [2, 1, 1, 1, 120, 286, 'Mở bán'],
  [3, 1, 2, 1, 300, 466, 'Mở bán'], [4, 2, 4, 1, 180, 311, 'Mở bán'], [5, 4, 6, 1, 240, 350, 'Mở bán']];
const showChecks = specsShow.map(([SuatChieuID, PhimID, PhongID, day, start, end, TrangThai]) => {
  const actual = showtimes.find(row => row.SuatChieuID === SuatChieuID);
  return { SuatChieuID, matchesSeedSchedule: !!actual && actual.PhimID === PhimID && actual.PhongID === PhongID && actual.TrangThai === TrangThai
    && actual.ThoiGianBatDau === asUTC(day, start) && actual.ThoiGianKetThuc === asUTC(day, end) };
});
assert.ok(showChecks.every(row => row.matchesSeedSchedule));
const sourceReferences = [
  ['database/08_procedures/booking/sp_Booking_Create.sql', /ThoiGianBatDau <=|THROW 50022|SoLuongDaDung = SoLuongDaDung \+|COMMIT TRANSACTION/],
  ['database/08_procedures/customer/sp_Order_Cancel.sql', /Chờ thanh toán|SoLuongDaDung =|COMMIT TRANSACTION/],
  ['database/08_procedures/customer/sp_Order_ExpirePending.sql', /HanGiuCho|OUTPUT inserted|SoLuongDaDung =|COMMIT TRANSACTION/],
  ['database/08_procedures/system/sp_Showtime_CancelCascade.sql', /50118|50119|SoLuongDaDung =|NOT EXISTS.*BOITHUONG|INSERT dbo.BOITHUONG|UPDATE h SET DiemTichLuy|No payment writes|fn_TinhBoiThuongVe|COMMIT TRANSACTION/],
  ['database/05_functions/fn_TinhBoiThuongVe.sql', /Proportional|FLOOR|MauDiem/],
  ['database/08_procedures/public/sp_Promotion_Validate.sql', /SoLuongDaDung|SoLuong/],
  ['database/08_procedures/public/sp_Showtime_ListByMovie.sql', /TrangThaiSuatChieu =|ThoiGianBatDau >/],
  ['database/08_procedures/admin/usp_Admin_Showtime_Update.sql', /UPDATE dbo.SUATCHIEU|TrangThai=@TrangThai/],
  ['database/08_procedures/manager/sp_Manager_Showtime_Update.sql', /UPDATE dbo.SUATCHIEU|TrangThai=@TrangThai/],
  ['database/08_procedures/system/sp_Showtime_ValidateTimes.sql', /DECLARE @Span|ThoiGianBatDau <|ThoiLuong.*60/],
  ['database/05_functions/fn_HomNay.sql', /fn_NgayKinhDoanh|fn_BayGio/],
  ['database/05_functions/fn_NgayKinhDoanh.sql', /fn_GioRap|CONVERT/],
  ['backend/src/jobs/expirePendingOrders.js', /EXPIRE_PENDING_ORDERS|setInterval/],
  ['shared/resourceContract.mjs', /showtimes:/],
  ['frontend/src/pages/MovieDetail.jsx', /getShowtimes|ShowtimeBrowser/],
  ['frontend/src/components/ShowtimeBrowser.jsx', /state.data.map|\/booking\//],
].map(([file, match]) => ({ ...pointer(file), references: read(path.join(root, file)).split(/\r?\n/)
  .flatMap((line, i) => match.test(line) ? [{ line: i + 1, text: line.trim() }] : []) }));

write(path.join(evidence, 'historical-evidence-sanitized.json'), { status: 'PASS', historical, fixtureProof });
write(path.join(evidence, 'provenance.json'), {
  status: 'PASS', seed: { users: pointer(seedUsersFile), userRoleChecks: seedRoles, profileChecks,
    assignments: pointer('database/10_seed/seed_base/006_reference.sql'), showtimes: pointer('database/10_seed/seed_demo_dynamic/014_reference.sql'),
    inferredSeedDay: seedDay.toISOString().slice(0, 10), seedDayEvidence: 'All five showtimes match the seed schedule for this business day; this is an inference, not an execution log.',
    showChecks, promotions: pointer('database/10_seed/seed_base/016_reference.sql'), promotionSeedCounters: [{ KhuyenMaiID: 1, counter: 0 }, { KhuyenMaiID: 2, counter: 0 }, { KhuyenMaiID: 3, counter: 0 }] },
  r1: { evidence: pointer('audit/remediation/evidence/migration-CinemaBookingDB.json'), status: r1.status,
    provenance: r1.provenance, dateOnlyChanged: r1.dateOnlyChanged, ambiguousHistoricalRowsModified: r1.ambiguousHistoricalRowsModified,
    preMigrationInventory: { evidence: pointer('audit/remediation/evidence/historical-data-pre-migration-check.json'), tables: preR1.tables },
    meaning: 'Main was already the exact immutable R0 seed before R1; bookings/payments were absent then. R1 converted proven seed timestamps only. The event that removed pre-R0 records is not established by these files.' },
  r5: { evidence: pointer('audit/remediation/r5/evidence/main-after.json'), dataVersusR5: after.dataVersusR5,
    moduleMatch: after.r5ModuleHashMatches, schemaMatch: after.r5SchemaHashMatches, grantsMatch: after.r5GrantsHashMatches },
  historicalOriginUnproven: ['order20', 'orders26/27/28 and show34', 'old short/outside-window shows', 'user17', 'user21', 'old cancelled assignment group user3/cinema3', 'old promotion counter event history'],
  sourceReferences,
});

const inventory = load('audit/remediation/r6a/evidence/inventory-before.json');
const important = new Set(['DONDATVE', 'THANHTOAN', 'BOITHUONG_HUYSUAT', 'CHITIETVE', 'CHITIETDOAN', 'NGUOIDUNG', 'HOSOKHACHHANG', 'KHUYENMAI', 'SUATCHIEU', 'PHIM', 'PHONGCHIEU', 'PHANCONG_RAP', 'RAPCHIEUPHIM', 'DANHGIAPHIM', 'KHIEUNAI']);
write(path.join(evidence, 'dependencies.json'), {
  status: 'PASS', foreignKeys: inventory.foreignKeys.filter(key => important.has(key.childTable) && important.has(key.parentTable)),
  currentFinancialLinks: { orders: 0, payments: 0, ticketDetails: 0, foodDetails: 0, compensationEvents: 0, reviews: 0, complaints: 0 },
  currentProfiles: [5, 6, 7, 8], currentShows: [1, 2, 3, 4, 5],
  currentAssignments: load('audit/remediation/r6a/evidence/DATA-007.json').results.allAssignments,
  missingHistoricalOrderDependencies: [20, 26, 27, 28].map(DonDatVeID => ({ DonDatVeID, order: 'ABSENT', payment: 'ABSENT', compensation: 'ABSENT', reconstruction: 'INSUFFICIENT_EVIDENCE' })),
});
console.log('PASS sanitized history, fixture proof, seed checks, phase lineage, source semantics, dependency inventory');
