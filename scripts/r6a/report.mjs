// Offline report generation from read-only R6A evidence. Does not connect to a DB.
import assert from 'node:assert/strict';
import path from 'node:path';
import { root, read, write } from '../r3a/common.mjs';

const directory = path.join(root, 'audit/remediation/r6a');
const load = file => JSON.parse(read(path.join(directory, 'evidence', file)));
const before = load('main-before.json');
const after = load('main-after.json');
const parity = load('source-parity.json');
const health = load('health-and-cleanup.json');
assert.ok(after.beforeAfterIdentical && after.sourceUnchanged && after.supplementalSourceUnchanged);
assert.equal(parity.status, 'PASS');
const data = Object.fromEntries(Array.from({ length: 9 }, (_, i) => {
  const id = `DATA-${String(i + 1).padStart(3, '0')}`;
  return [id, load(`${id}.json`).results];
}));
assert.equal(data['DATA-001'].orders.length, 0);
assert.equal(data['DATA-002'].cancelledPaidOrders.length, 0);
assert.equal(data['DATA-003'].shortShowtimes.length, 0);
assert.equal(data['DATA-004'].outsideReleaseWindow.length, 0);
assert.equal(data['DATA-005'].futureProfiles.length, 0);
assert.ok(data['DATA-006'].allCustomers.every(row => row.hasProfile));
assert.equal(data['DATA-007'].exactDuplicateGroups.length, 0);
assert.ok(data['DATA-008'].promotionLifecycleCounters.every(row => row.SoLuongDaDung === 0));
assert.deepEqual(data['DATA-009'].endedOpenShowtimes.map(row => row.SuatChieuID), [2, 3, 4, 5]);
const findings = [
  {
    id: 'DATA-001', currentEvidence: '0 đơn âm; #20 vắng; payment attempts/ticket/food/promo liên quan đều 0.',
    productionRecords: [], originalRecords: { DonDatVeID: [20] },
    classification: ['ALREADY_RESOLVED', 'INSUFFICIENT_EVIDENCE'],
    classificationScope: { ALREADY_RESOLVED: 'DB hiện tại không còn finding.', INSUFFICIENT_EVIDENCE: 'Nguồn và giá trị đúng của đơn cũ; không chứng minh payment âm hoặc discount đúng.' },
    proposedR6BAction: 'NO CHANGE; không clamp, tái tạo đơn, sửa discount/total/payment.',
    risk: 'LOW khi giữ nguyên; HIGH nếu sửa/tái tạo tài chính thiếu chứng từ.', confidence: 'HIGH cho hiện trạng; LOW cho nguồn/giá trị lịch sử.',
  },
  {
    id: 'DATA-002', currentEvidence: '26/27/28 và show34 vắng; 0 paid/cancelled pairs, 0 payments, 0 compensation.',
    productionRecords: [], originalRecords: { DonDatVeID: [26, 27, 28], SuatChieuID: [34] },
    classification: ['ALREADY_RESOLVED', 'INSUFFICIENT_EVIDENCE'],
    classificationScope: { ALREADY_RESOLVED: 'Không có đơn hiện tại cần đối chiếu/backfill.', INSUFFICIENT_EVIDENCE: 'Không có snapshot/receipt/posting để chứng nhận compensation cũ.' },
    perOrder: [26, 27, 28].map(DonDatVeID => ({ DonDatVeID, currentRecord: 'ABSENT',
      compensationConclusion: 'INSUFFICIENT_EVIDENCE', snapshotsAvailable: false, eligibleForR6BBackfill: false })),
    proposedR6BAction: 'NO CHANGE; không backfill điểm hay tạo ledger giả cho đơn vắng.',
    risk: 'LOW khi giữ nguyên; HIGH nếu tự cộng điểm, double-credit hoặc viết lại payment.', confidence: 'HIGH cho hiện trạng; LOW cho compensation cũ.',
  },
  {
    id: 'DATA-003', currentEvidence: 'Quét đủ 5 suất: 0 ngắn; duration 166/166/166/131/110 phút; tất cả PAST.',
    productionRecords: [], originalRecords: { SuatChieuID: [6, 7, 8, 28, 33, 34, 35, 36, 39, 40, 41, 43, 44, 45, 48] },
    classification: ['ALREADY_RESOLVED', 'INSUFFICIENT_EVIDENCE'],
    classificationScope: { ALREADY_RESOLVED: '0 vi phạm hiện tại; 15 ID cũ đều vắng.', INSUFFICIENT_EVIDENCE: 'Nguồn/phiên bản duration và lịch sử booking của 15 suất cũ chưa xác định.' },
    proposedR6BAction: 'NO CHANGE; không kéo dài end time của seed/lịch sử.',
    risk: 'LOW khi giữ nguyên; MEDIUM/HIGH nếu đổi lịch gây overlap hoặc bóp méo lịch sử.', confidence: 'HIGH cho hiện trạng; LOW cho nguồn 15 suất cũ.',
  },
  {
    id: 'DATA-004', currentEvidence: '0 suất ngoài cửa sổ phim theo ngày kinh doanh UTC+7; ID6/7/8/43 vắng.',
    productionRecords: [], originalRecords: { SuatChieuID: [6, 7, 8, 43] },
    classification: ['ALREADY_RESOLVED', 'INSUFFICIENT_EVIDENCE'],
    classificationScope: { ALREADY_RESOLVED: 'Không còn finding trên 5 suất hiện tại.', INSUFFICIENT_EVIDENCE: 'Không có revision/event log xác định release/end date tại thời điểm tạo các suất cũ.' },
    proposedR6BAction: 'NO CHANGE; không đổi ngày phim để hợp thức hóa suất.',
    risk: 'LOW khi giữ nguyên; HIGH nếu sửa cửa sổ phim/lịch sử theo giá trị suy đoán.', confidence: 'HIGH cho hiện trạng; LOW cho lịch sử thay đổi ngày phim.',
  },
  {
    id: 'DATA-005', currentEvidence: '0 DOB tương lai trong 4 profile; user17/26 vắng; NgaySinh nullable.',
    productionRecords: [], originalRecords: { NguoiDungID: [17, 26] },
    classification: ['ALREADY_RESOLVED', 'FIXTURE_ONLY', 'INSUFFICIENT_EVIDENCE'],
    classificationScope: { ALREADY_RESOLVED: 'Không còn DOB tương lai.', FIXTURE_ONLY: 'Chỉ phần user26 có manifest fixture và evidence API cũ.', INSUFFICIENT_EVIDENCE: 'Nguồn user17 và DOB thật không xác định.' },
    proposedR6BAction: 'NO CHANGE; không có record hiện tại đủ điều kiện NULL hóa.',
    risk: 'LOW khi giữ nguyên; MEDIUM nếu bịa DOB hoặc sửa nhầm account.', confidence: 'HIGH cho scan/fixture26; LOW cho nguồn user17.',
  },
  {
    id: 'DATA-006', currentEvidence: 'Customer5/6/7/8 đủ profile và khớp seed; 0 ngoài lineage; user21/34 vắng; dependencies tài chính/review/complaint đều 0.',
    productionRecords: [], checkedRecords: { NguoiDungID: [5, 6, 7, 8] }, originalRecords: { NguoiDungID: [21, 34] },
    classification: ['ALREADY_RESOLVED', 'FIXTURE_ONLY', 'INSUFFICIENT_EVIDENCE'],
    classificationScope: { ALREADY_RESOLVED: '0 Customer orphan/outside seed lineage hiện tại.', FIXTURE_ONLY: 'Chỉ phần user34 được manifest xác nhận fixture Admin-create.', INSUFFICIENT_EVIDENCE: 'User21 có trước run cũ; prefix/email không chứng minh nguồn.' },
    proposedR6BAction: 'NO CHANGE; không backfill default NULL/NULL/0 cho account vắng.',
    risk: 'LOW khi giữ nguyên; MEDIUM nếu tạo profile hoặc mất loyalty balance không có chứng cứ.', confidence: 'HIGH cho current/fixture34; LOW cho nguồn user21.',
  },
  {
    id: 'DATA-007', currentEvidence: '0 exact duplicate trên toàn PHANCONG_RAP kể cả Đã hủy; 0 overlap; assignment1/2 là seed khác user/rạp.',
    productionRecords: [], checkedRecords: { PhanCongID: [1, 2] }, originalRecords: { PhanCongID: [13, 14], cancelledGroup: { NguoiDungID: 3, RapID: 3 } },
    classification: ['ALREADY_RESOLVED', 'FIXTURE_ONLY', 'INSUFFICIENT_EVIDENCE'],
    classificationScope: { ALREADY_RESOLVED: '0 duplicate theo exact identity R5 (NULL= NULL).', FIXTURE_ONLY: 'Chỉ nhóm active13/14 được manifest xác nhận test concurrent.', INSUFFICIENT_EVIDENCE: 'Nguồn nhóm cancelled user3/rạp3 cũ chưa xác định; nhóm hiện vắng.' },
    proposedR6BAction: 'NO CHANGE; không merge/xóa assignment hoặc coi mọi overlap khác key là bug.',
    risk: 'LOW khi giữ nguyên; HIGH nếu xóa lịch sử/sai phạm vi quản lý.', confidence: 'HIGH cho scan/fixture13-14; LOW cho nguồn nhóm cancelled cũ.',
  },
  {
    id: 'DATA-008', currentEvidence: 'Promo1/2/3 counter0/0/0; mọi tập đơn/payment/compensation đều 0; phù hợp seed hiện tại.',
    productionRecords: [], checkedRecords: { KhuyenMaiID: [1, 2, 3] }, originalRecords: { KhuyenMaiID: [1, 2, 3], counters: [16, 20, 5] },
    classification: ['ALREADY_RESOLVED', 'NOT_CORRUPTION', 'INSUFFICIENT_EVIDENCE'],
    classificationScope: { ALREADY_RESOLVED: 'Mismatch cũ không còn trên current main.', NOT_CORRUPTION: 'Counter hiện phù hợp seed/lifecycle; COUNT đơn còn lại không đủ chứng minh corruption.', INSUFFICIENT_EVIDENCE: 'Không có event ledger đầy đủ để reconstruct counter cũ; seed cũ có offset 5/20 theo audit.' },
    proposedR6BAction: 'NO CHANGE; không reset counter hoặc gán COUNT(current orders).',
    risk: 'LOW khi giữ nguyên; HIGH nếu reset làm thay đổi quota/history.', confidence: 'HIGH cho source semantics/current seed; LOW cho historical event reconstruction.',
  },
  {
    id: 'DATA-009', currentEvidence: '4 suất PAST Mở bán:2/3/4/5; booking/payment0; public SP loại cả4; booking time guard authoritative.',
    productionRecords: [{ table: 'SUATCHIEU', ids: [2, 3, 4, 5] }], originalRecords: { SuatChieuID: [2, 3, 4, 5, 43, 44] },
    classification: ['NOT_CORRUPTION', 'PRESERVE_HISTORY', 'ALREADY_RESOLVED'],
    classificationScope: { NOT_CORRUPTION: 'Status được truyền từ Admin/Manager; khả năng bán được suy ra từ status + giờ bắt đầu. Không có contract/job tự hoàn tất.', PRESERVE_HISTORY: 'Giữ 4 suất seed đã qua giờ; không normalize lịch sử.', ALREADY_RESOLVED: 'Chỉ phần ID43/44 cũ đã vắng.' },
    proposedR6BAction: 'NO CHANGE cho2/3/4/5; không auto-update status.',
    risk: 'LOW khi giữ nguyên; MEDIUM nếu đổi status làm lệch báo cáo lịch sử.', confidence: 'HIGH (DB scan, seed/phase lineage, source parity, public SP read smoke).',
  },
].map(finding => ({ ...finding, currentEvidenceFile: `evidence/${finding.id}.json`,
  historicalEvidenceFile: 'evidence/historical-evidence-sanitized.json', provenanceFile: 'evidence/provenance.json', dependenciesFile: 'evidence/dependencies.json' }));
write(path.join(directory, 'CLASSIFICATION.json'), {
  status: 'PASS', database: 'CinemaBookingDB', auditNow: before.clock.utcNow, businessDate: before.clock.businessDate,
  classificationScopeNote: 'Labels distinguish current-main findings from historical/fixture subrecords. ALREADY_RESOLVED means absent now, not evidence that a remediation repaired it.',
  findings,
});

const plan = {
  status: 'PASS', database: 'CinemaBookingDB', candidates: [], executableProductionMigrationCreated: false,
  reason: 'Không có record hiện tại vừa sai vừa có đủ bằng chứng cho sửa an toàn. 8 finding không còn; DATA-009 phù hợp state/time-guard contract.',
  noChangeDecisions: findings.map(({ id, productionRecords, proposedR6BAction, risk }) => ({ id, productionRecords, action: proposedR6BAction, risk })),
  preservedRecords: [{ table: 'SUATCHIEU', ids: [2, 3, 4, 5], fields: ['TrangThai', 'ThoiGianBatDau', 'ThoiGianKetThuc'], currentValue: 'Mở bán; times unchanged', proposedValue: 'SAME; NO CHANGE' }],
  historicalEvidenceGates: [
    { findings: ['DATA-001'], missing: 'Chứng từ/payment-attempt history + snapshot gốc + nguồn discount của đơn20; không clamp hoặc dựng lại đơn vắng.' },
    { findings: ['DATA-002'], missing: 'Snapshot gốc từng đơn26/27/28, success receipt, show-cancel event, compensation/loyalty posting history; balance hiện tại không đủ chứng minh.' },
    { findings: ['DATA-003', 'DATA-004'], missing: 'Nguồn và phiên bản duration/release/end date tại lúc tạo suất; booking/payment history; overlap/schedule intent; không đổi lịch sử theo phim hiện tại.' },
    { findings: ['DATA-005', 'DATA-006', 'DATA-007'], missing: 'Record hiện tại và chứng cứ account/assignment hợp lệ; manifest fixture tách riêng. Không khôi phục record vắng hoặc invent DOB.' },
    { findings: ['DATA-008'], missing: 'Counter initialization và đầy đủ booking/cancel/expiry/cancel-show events; không dùng COUNT current orders để reconstruct.' },
  ],
  candidateContractForFutureApprovedR6B: {
    currentRecordIds: 'REQUIRED; currently no authorized candidate', tableAndFields: 'REQUIRED per proven anomaly',
    expectedBefore: 'Exact observed snapshot and record/version preconditions', expectedAfter: 'Evidence-backed value; never guessed',
    supportingEvidence: 'Original documents/events + main reread + dependency inventory',
    rollbackStrategy: 'Pre-change backup/audit snapshot; compensate safely without losing payment or ledger history; no blind reversal of loyalty already spent',
    dependencies: ['payment history', 'order snapshot/status', 'showtime and overlap', 'promotion quota/history', 'compensation UNIQUE/order FK', 'customer balance/profile', 'manager scope/assignment identity'],
    transactionBoundary: 'A separately authorized R6B transaction locks/rechecks every affected record and commits record/audit/dependent changes atomically; R6A opens none for writes',
    postFixInvariant: 'R1 UTC/business-date preserved; R2 no refund/success history unchanged/unique compensation; R5 valid profile/exact assignment key; unrelated fingerprints unchanged',
  },
};
write(path.join(directory, 'R6B_ACTION_PLAN.json'), plan);
write(path.join(directory, 'R6B_ACTION_PLAN.md'), `# R6B action plan — từ R6A

**0 FIXABLE candidate. Không có data migration hoặc executable DML được tạo/chạy.**

DB hiện tại không có đơn20/26/27/28, user17/21/26/34 hay assignment13/14. Không tái tạo các record này. Không reset counter1/2/3. Giữ nguyên SUATCHIEU2/3/4/5 với trạng thái Mở bán và timestamp hiện tại: availability do giờ bắt đầu + status quyết định.

| Record hiện tại được phép sửa | Table/field | Expected before → after | Evidence | Rollback / transaction | Post-fix invariant | Risk |
|---|---|---|---|---|---|---|
| Không có | Không áp dụng | Không áp dụng | [Classification](CLASSIFICATION.json) | Không có transaction ghi; không cần rollback | Fingerprint main nguyên vẹn | Không có candidate remediation |

**Hồ sơ chưa đủ chứng cứ:** financial snapshot/receipt/discount gốc của20; snapshot + success/cancel/compensation/loyalty event của26/27/28; revision history phim/lịch; nguồn account17/21 và assignment đã hủy; counter initialization + mutation history. Đã vắng record không đồng nghĩa biết giá trị sửa đúng. Không backfill hoặc restore main chỉ để kiểm thử giả thuyết.

Nếu một audit sau tìm được record hiện tại đủ chứng cứ, R6B phải có ID, table/field, before/after chính xác, supporting evidence, precondition kiểm tra lại dưới lock, rollback không mất payment/ledger history, dependency checks, transaction boundary và post-fix invariants. Danh sách chi tiết nằm trong [plan JSON](R6B_ACTION_PLAN.json); đây là điều kiện mở lại đánh giá, không phải danh sách sửa đã được phép.

Rủi ro nếu bỏ qua chứng cứ: HIGH cho tài chính/loyalty/counter; HIGH cho xóa assignment và sai scope; MEDIUM/HIGH cho kéo dài hoặc đổi lịch sử suất; MEDIUM cho bịa DOB/backfill nhầm account. Quyết định hiện tại cho cả9 finding: NO CHANGE.
`);

const rows = findings.map(finding => `| ${finding.id} | ${finding.currentEvidence} | ${finding.productionRecords.length ? 'SUATCHIEU2/3/4/5' : '0 record vi phạm'} | ${finding.classification.join(' / ')} | ${finding.proposedR6BAction} | ${finding.risk} | ${finding.confidence} |`).join('\n');
const counts = before.snapshot.data.map(row => `| ${row.table} | ${row.rows} |`).join('\n');
const details = findings.map(finding => `### ${finding.id}

${finding.currentEvidence} [Query/result](${finding.currentEvidenceFile}).

${Object.entries(finding.classificationScope).map(([label, scope]) => `**${label}:** ${scope}`).join(' ')}

${finding.id === 'DATA-002' ? 'Đối chiếu riêng mỗi đơn26/27/28: ABSENT; thiếu snapshot/payment/cancel/ledger event gốc → INSUFFICIENT_EVIDENCE, không eligible backfill. Không xác nhận các đơn này đã được bồi thường đúng. Profile5/6/7/8 còn150/80/45/0 điểm và khớp seed; số dư không chứng minh compensation cũ. R2 giữ success payment, không refund, tỷ lệ vé/đồ ăn, FLOOR(net ticket/1000), transaction và UNIQUE(DonDatVeID); source hiện tại khớp DB.\n\n' : ''}${finding.id === 'DATA-001' ? 'Evidence cũ tốt nhất: #20 Hết hạn; vé80000, đồ ăn0, giảm120000, tổng−40000; detail sums vé80000/food0. Không có promoID, receipt, nguyên lịch sử payment attempts hoặc giá trị discount đúng. Old payment mismatch scan rỗng chỉ chứng minh không có mismatch trong tập đã quét; không chứng minh chưa từng thu tiền âm. Current main không có bất kỳ payment nào.\n\n' : ''}${finding.id === 'DATA-003' ? 'Predicate chính xác dùng end < DATEADD(MINUTE,current movie duration,start), không làm tròn DATEDIFF(MINUTE). Query thu past/current/future, booking/payment và overlap nếu kéo dài cho từng anomaly; tập anomaly rỗng. [Toàn bộ5 suất](evidence/all-showtimes.json) đều PAST, duration đủ, không có booking. Không có current/future candidate.\n\n' : ''}${finding.id === 'DATA-004' ? 'Ngày chiếu lấy fn_NgayKinhDoanh(start) UTC+7, không CAST UTC timestamp thành DATE. Suất1 ngày kinh doanh2026-10-01;2–5 ngày2026-10-04; tất cả nằm trong release2026-09-03..end2027-10-03 của phim tương ứng. Available evidence không có revision log cho cửa sổ phim cũ. Validator hiện tại kiểm tra duration/time; không tuyên bố nó đã có rule release/end-date hay mở GAP mới.\n\n' : ''}${finding.id === 'DATA-005' ? 'Quét toàn bộ4 profile theo business date2026-10-05. NgaySinh nullable; không có invalid current production record để đề xuất NULL hóa. Không export DOB thường; provenance chỉ lưu boolean khớp seed.\n\n' : ''}${finding.id === 'DATA-006' ? 'Quét mọi role KHACH_HANG, không chỉ danh sách orphan cũ. Customer5–8 role/profile khớp seed và R1→R5 lineage; dependency booking/payment/compensation/review/complaint đều0. User34 có manifest fixture; user21 không suy nguồn từ email/prefix. Contract NULL/NULL/0 chỉ là default R5 khi có customer hợp lệ cần backfill; hiện không áp dụng.\n\n' : ''}${finding.id === 'DATA-007' ? 'Identity: user+cinema+start+end(NULL= NULL)+status; GROUP BY quét cảactive vàcancelled. Hai assignment seed: ID1 user2/rạp1 vàID2 user3/rạp2; không exact duplicate, không overlap same user/cinema. Nhóm cancelled cũ user3/rạp3 hiện vắng.\n\n' : ''}${finding.id === 'DATA-008' ? 'Semantics nguồn: booking hợp lệ trong transaction tăng1, rollback không tiêu lượt; hủy đơn Chờ thanh toán giảm1; expire pending giảm theo số đơn vừa chuyển; hủy suất R2 giảm theo paid orders liên quan sau xử lý expired holds. Payment thành công không là điểm tăng riêng. Counter là lượt đã reserve/commit chưa release theo lifecycle, với initial seed offset, không là COUNT tất cả đơn còn lưu hoặc lifetime payment count. Hold hết giờ nhưng job chưa chuyển có thể vẫn còn trong counter. Seed hiện tại đặt0/0/0. Audit cũ ghi16/20/5 và seed offset5/20; không có event ledger đủ để tái dựng. Không gán COUNT hay reset.\n\n' : ''}${finding.id === 'DATA-009' ? 'Seed show2–5 được tạo tương lai theo seed day; đã qua giờ ở audit ngày2026-10-05. Admin/Manager truyền status rõ ràng khi create/update; shared R5 enum chỉ whitelist, không yêu cầu auto lifecycle. Job hiện chỉ expire pending orders. Booking_Create chặn start<=fn_BayGio trước expirePending và phần tạo đơn; kiểm bằng source đã parity, không gọi SP ghi. FE MovieDetail→API public list→ShowtimeBrowser dùng kết quả đã lọc Mở bán ANDstart>now; gọi read-only sp_Showtime_ListByMovie cho phim1/2/4 đều trả0. API/detail hoặc trang quản trị có thể vẫn đọc lịch sử; không suy diễn availability chỉ từ nhãn. ID43/44 cũ vắng.\n\n' : ''}Quyết định R6B: ${finding.proposedR6BAction}
`).join('\n');
const fence = String.fromCharCode(96).repeat(3);
write(path.join(directory, 'R6A_REPORT.md'), `# R6A — Historical Data Audit & Classification

**R6A PASS — audit và phân loại hoàn tất; không sửa production.**

1. **Main inventory.** CinemaBookingDB; mốc phân loại ${before.clock.utcNow}, business date ${before.clock.businessDate}, Asia/Saigon UTC+7 qua fn_HomNay/fn_NgayKinhDoanh. 27 bảng,159 module(125 SP,6 view,21 function,7 trigger);63 index;161 constraint(56 CHECK,36 DEFAULT,31 FK,27 PK,11 UNIQUE). DONDATVE/THANHTOAN/BOITHUONG_HUYSUAT vàticket/food detail đều0. [Trước](evidence/main-before.json), [metadata trước](evidence/inventory-before.json), [sau](evidence/main-after.json).
2. **9 finding đã re-scan**, query/result riêng và bảng phân loại bên dưới. Không dùng kết luận cũ thay cho kết quả current main.
3. **Record hiện còn có biểu hiện finding:** SUATCHIEU2/3/4/5 củaDATA-009. Những record khác được kiểm nhưng hợp lệ: Customer5–8/profile5–8; assignment1/2; promo1–3; toàn bộshow1–5.
4. **Provenance.** [Seed/phase/source evidence](evidence/provenance.json): main đã khớp immutable R0 seed trước R1; financial tables đã0 tại đó. R1 chỉ chuyển timestamp của seed proven, không sửa ambiguous history. Tất cả27 data fingerprints +module/schema/grants hiện khớp R5 kết thúc. Seed schedule hiện khớp seed day2026-10-03 (suy ra từ timestamps, không phải execution log). Sự kiện loại bỏ các record pre-R0 và nguồn của các record cũ ngoài fixture chưa được chứng minh; không gọi việc vắng record là đã sửa đúng.
5. **Classification.** Scope rõ theo current/old/fixture; label INSUFFICIENT_EVIDENCE áp cho reconstruction lịch sử, không phủ nhận scan hiện tại đã thành công. Xem [classification JSON](CLASSIFICATION.json).
6. **Already resolved/fixture.** DATA-001..008 không còn finding hiện tại. Chỉ phần user26(DATA-005), user34(DATA-006), active assignment13/14(DATA-007) có manifest fixture. Chúng từng nằm trong DB chính của old audit và hiện vắng; không gắn FIXTURE_ONLY cho toàn bộ9 finding. [Historical evidence đã lọc](evidence/historical-evidence-sanitized.json).
7. **Cần R6B:** 0 candidate có đủ chứng cứ và record hiện tại cần sửa. Không backfill cho đơn/account vắng. Chỉ mở lại đánh giá lịch sử nếu có chứng từ/event/lineage mới.
8. **Preserve/no-change.** Giữ SUATCHIEU2/3/4/5 và status/timestamps; giữ balance profiles, counter1–3 và mọi payment/history. Không tái tạo old records, không clamp discount, không inventDOB, không merge assignment.
9. **Action plan.** [R6B plan](R6B_ACTION_PLAN.md), [JSON](R6B_ACTION_PLAN.json) có candidate list rỗng và gates về before/after/evidence/rollback/dependency/transaction/invariant cho audit sau; không tạo/chạy data migration.
10. **Risk.** Không có remediation candidate. Risk nếu sửa thiếu evidence được nêu theo từng dòng: HIGH cho finance/loyalty/counter/scope,MEDIUM–HIGH cho lịch sử vàprofile. Confidence current HIGH; origin/reconstruction thiếu chứng cứ LOW.
11. **Safety/health.** Fingerprint27/27 bảng, schema, module, DB grants và toàn inventory metadata trước/sau giống nhau. R1–R5 production source +shared/tests/tooling hash không đổi. Health Healthy;source/baseline parity159/159 PASS;27table inventory parity PASS. ChỉCinemaBookingDB ONLINE còn trên server theo filterCinemaBookingDB%; không tạo fixture, không cần xóa fixture. Không thêm table/index/constraint/SP/function/view/trigger. Chỉ SELECT và2SP đã inspect chỉ-read(HealthCheck/ListByMovie). Full R1–R5/backend/frontend suite không rerun vì không sửa source, theo scopeR6A; không reset main. [Health/cleanup](evidence/health-and-cleanup.json), [parity](evidence/source-parity.json), [fingerprint](evidence/main-after.json).
12. **Kết luận R6A PASS.** 9/9 đã được xác minh và phân loại; quyết định R6B=NO CHANGE có căn cứ. PASS không có nghĩa9 finding đã được sửa. Không mở GAP, sửa BUG hay đổi policyR1–R5.

Sau khi tạo báo cáo, [final-check](evidence/main-final.json) kiểm tra lại toàn bộ fingerprint/metadata/source parity, query digest và đường dẫn evidence.

## Bảng tổng hợp

Risk là rủi ro của quyết định hoặc giả thuyết sửa, không phải bằng chứng record hiện hỏng. Production Records chỉ là record hiện vi phạm/biểu hiện finding; checked valid IDs nằm ở phần chi tiết/JSON.

| DATA | Current Evidence | Production Records | Classification | Proposed R6B Action | Risk | Confidence |
|---|---|---|---|---|---|---|
${rows}

## Chi tiết kiểm chứng

${details}
## Liên kết dependency

${fence}mermaid
flowchart LR
  Film[PHIM] --> Show[SUATCHIEU 1..5]
  Cinema[RAPCHIEUPHIM] --> Room[PHONGCHIEU] --> Show
  User[NGUOIDUNG] --> Profile[HOSOKHACHHANG 5..8]
  User --> Assign[PHANCONG_RAP 1..2] --> Cinema
  User --> Order[DONDATVE: 0]
  Show --> Order
  Promo[KHUYENMAI 1..3] --> Order
  Order --> Ticket[CHITIETVE: 0]
  Order --> Food[CHITIETDOAN: 0]
  Order --> Payment[THANHTOAN: 0]
  Order --> Credit[BOITHUONG_HUYSUAT: 0]
  Credit -.event updates balance via order customer.-> Profile
  User --> Review[DANHGIAPHIM: 0]
  User --> Complaint[KHIEUNAI: 0]
${fence}

Mũi tên đi từ record cha đến record phụ thuộc; cạnh nét đứt là nghiệp vụ, không FK trực tiếp. [FK/record dependency evidence](evidence/dependencies.json) lưu trusted/enabled và delete/update action. Ledger chỉ FK DonDatVeID→DONDATVE, UNIQUE(DonDatVeID), không duplicate user/show/financial snapshots; không suy balance hiện tại thành compensation history.

## Row inventory

| Table | Rows |
|---|---:|
${counts}

## Giới hạn và tái lập

Historical JSON là evidence quan sát cũ, không receipt hay event ledger và không được tự diễn dịch sang UTC sauR1. Không đủ chứng cứ biết ai xóa/archived pre-R0 records hoặc giá trị đúng cần sửa. Không export password/password hash/token/credential/email/phone/ordinary DOB; fingerprintSHA256 là digest cả bảng/source để kiểm integrity, không account authentication hash.

Read-only scripts: [capture before](../../../scripts/r6a/before.mjs), [audit](../../../scripts/r6a/audit.mjs), [provenance](../../../scripts/r6a/provenance.mjs), [report offline](../../../scripts/r6a/report.mjs). Queryfiles có guard chỉSELECT; mốc phân loại bind từmain-before. Muốn audit lần mới phải capturebefore mới rồi chạy audit→provenance→report→final-check; không gọi reset/migrate/booking/cancel/payment/job. Các file R6A chỉ tooling/report/evidence, không import vào Backend.
`);
write(path.join(directory, 'STATUS.json'), { status: 'PASS', database: 'CinemaBookingDB', findingsRescanned: 9,
  fixableCandidates: 0, staleOpenShowtimeIDs: [2, 3, 4, 5], productionMutated: false,
  fixtureDatabasesCreated: 0, fixtureDatabasesRemaining: health.databases.filter(row => row.name !== 'CinemaBookingDB').length,
  sourceParity: parity.status, moduleCount: parity.modulesChecked, tableCount: 27,
  fullRegressionRerun: false, fullRegressionReason: 'R6A is read-only; R1–R5 source unchanged; required health/parity/fingerprint/cleanup verified.',
});
console.log('PASS: 9 findings classified, 0 FIXABLE candidates; R6A report and non-executable R6B plan generated');
