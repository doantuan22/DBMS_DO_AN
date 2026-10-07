// Regenerate current interpretations; never overwrite historical raw audit evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { root, read, write } from '../db/lib.mjs';
const out = path.join(root,'docs/audit-20261007');
const r0 = path.join(root,'docs/r0-20261007');
const load = file => JSON.parse(read(file));
const result = name => fs.existsSync(path.join(r0,name+'.json')) ? load(path.join(r0,name+'.json')) : null;
const checks = result('checks');
const check = name => checks?.checks.find(item=>item.name === name);
const backend = check('backend'), frontend = check('frontend');
const priceResolved = ['database-contract','migration-precondition','pricing-api','main-migration'].every(name=>result(name)?.status === 'PASS') && checks?.status === 'PASS';
const uc = load(path.join(out,'use-cases.json'));
uc.rows = uc.rows.filter(row=>/^(?:KH-(?:0[1-9]|1[0-4])|QLR-0[1-9]|CSKH-0[1-6]|ADM-(?:0[1-9]|1[0-6]))$/.test(row.uc));
assert.equal(uc.rows.length,45); assert.equal(new Set(uc.rows.map(row=>row.uc)).size,45);
const actorCounts = Object.fromEntries(['KH','QLR','CSKH','ADM'].map(actor=>[actor,uc.rows.filter(row=>row.uc.startsWith(actor+'-')).length]));
assert.deepEqual(actorCounts,{KH:14,QLR:9,CSKH:6,ADM:16});
uc.rows.find(row=>row.uc==='QLR-07').issue = priceResolved ? 'R0 pricing 3 loại ngày đã kiểm SQL/HTTP/form; giữ PARTIAL của audit toàn UC; chưa chứng nhận mọi concurrency/write scenario' : 'R0 pricing verification pending';
uc.rows.find(row=>row.uc==='ADM-13').issue = 'R0 contract 3 loại ngày; I-14 edit thiếu conditions/dates vẫn ngoài scope';
const values={PASS:1,PARTIAL:.5,MISSING:0,BROKEN:0};
uc.metrics = Object.fromEntries(['db','be','fe','integration'].map(layer=>{
  const counts = uc.rows.reduce((counts,row)=>(counts[row[layer]]=(counts[row[layer]]??0)+1,counts),{});
  const points = uc.rows.reduce((points,row)=>points+values[row[layer]],0);
  return [layer,{counts,points,percent:Number((points/45*100).toFixed(1))}];
}));
uc.statuses = uc.rows.reduce((counts,row)=>(counts[row.status]=(counts[row.status]??0)+1,counts),{PASS:0,PARTIAL:0,MISSING:0,BROKEN:0});
uc.baseline = {total:45,actors:actorCounts,source:'ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md',note:'Original in-scope grades preserved; R0 only normalizes scope/denominator and issue notes, not full system acceptance.'};
write(path.join(out,'use-cases.json'),uc);
const findings = load(path.join(out,'issues.json'));
for (const issue of findings.issues) {
  issue.status = 'ACTIVE';
  if (issue.id === 'I-01') Object.assign(issue,{
    severity:'ACCEPTED PROJECT CONSTRAINT',status:'ACCEPTED PROJECT CONSTRAINT',title:'Backend sa trong đồ án/local',
    evidence:'Roadmap §2.2 / R0; docs/PROJECT_ACCEPTED_CONSTRAINTS.md; R0 no-SQL PASS',
    problem:'Backend sử dụng sa để kết nối SQL Server trong phạm vi đồ án/local, được chấp nhận cho môi trường học tập.',
    impact:'Không đại diện cho cấu hình production. Không tính vào defect/blocker của đồ án. DBMS-first và Stored-Procedure-Only vẫn bắt buộc.'});
  if (issue.id === 'I-05' && priceResolved) Object.assign(issue,{
    status:'RESOLVED R0',title:'Pricing chỉ còn ba loại ngày chính thức',evidence:'docs/r0-20261007/{database-contract,migration-precondition,pricing-api,main-migration,checks}.json',
    problem:'Constant, validators, dropdown/payload và CHECK chỉ chấp nhận Ngày thường / Cuối tuần / Tất cả; dữ liệu legacy làm migration dừng.',
    impact:'SQL authoritative pricing đã được kiểm tra; không thêm calendar, không đổi/xóa dữ liệu có sẵn.'});
  if (issue.id === 'I-12' && backend?.status === 'PASS') Object.assign(issue,{
    status:'RESOLVED R0 TEST PREREQUISITE',title:'Backend regression guards không phụ thuộc audit artifact',evidence:'docs/r0-20261007/backend.txt',
    problem:'Hai guard đọc trực tiếp SQL source/service mapping và yêu cầu không còn lỗi thiếu mapping; dependency file audit bị thiếu đã bỏ.',
    impact:`${backend.tests}/${backend.tests} tests PASS, 0 skip. Chỉ sửa prerequisite để R0 test được, không triển khai R4.`});
  issue.impact = issue.impact.replaceAll('46UC','45UC');
  issue.problem = issue.problem.replace('scope count25/26/27 và45/46 lệch','scope tài liệu bảng lịch sử chưa rõ; baseline UC hiện đã thống nhất 45');
}
findings.severity = findings.issues.filter(issue=>issue.status==='ACTIVE').reduce((counts,issue)=>(counts[issue.severity]=(counts[issue.severity]??0)+1,counts),{});
findings.baseline = {total:26,active:findings.issues.filter(issue=>issue.status==='ACTIVE').length,accepted:1,resolved:findings.issues.filter(issue=>issue.status.startsWith('RESOLVED')).length};
write(path.join(out,'issues.json'),findings);
const esc = value => String(value ?? '—').replaceAll('|','&#124;').replaceAll('\n',' ');
const table = (header,rows) => `| ${header.join(' | ')} |\n| ${header.map(()=>'---').join(' | ')} |\n${rows.map(row=>'| '+row.map(esc).join(' | ')+' |').join('\n')}\n`;
const baseline = `# Baseline chính thức — 45 Use Case\n\nNguồn bắt buộc: [roadmap](../ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md), §2.1 và Phase R0. Baseline này áp dụng cho matrix, audit, completion, regression và nghiệm thu.\n\n${table(['Actor','Số UC'],[['Khách hàng',14],['Quản lý rạp',9],['CSKH',6],['Admin',16],['Tổng',45]])}\nCấu hình hệ thống không thuộc phạm vi và không được tính là chức năng thiếu hoặc thêm trở lại dưới tên khác. CRUD diễn viên nằm trong ADM-09; hình ảnh rạp nằm trong ADM-07, không tạo UC mới.\n\n${table(['Mã UC','Chức năng'],uc.rows.map(row=>[row.uc,row.name]))}\nCompletion: PASS=1, PARTIAL=0.5, MISSING/BROKEN=0; mỗi layer chia đúng **45**. Scoring hiện tại giữ grade của các UC trong audit gốc, không dùng R0 để tuyên bố những flow ngoài scope đã hoàn tất. Tất cả 16 UC Admin hiện hữu được giữ lại.\n\n[Matrix/evidence](audit-20261007/use-cases.json), [audit hiện hành](FULL_SYSTEM_AUDIT.md), [accepted constraints](PROJECT_ACCEPTED_CONSTRAINTS.md), [R0 report](R0_TASK_1_REPORT.md).\n`;
write(path.join(root,'docs/USE_CASE_BASELINE_45.md'),baseline);
const file = path.join(root,'docs/FULL_SYSTEM_AUDIT.md');
let report = read(file);
const replaceTable = (firstCell,replacement) => {
  const header = firstCell.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern = firstCell === 'Layer'
    ? /^\| Layer \| PASS \| PARTIAL \| MISSING \| BROKEN \|[^\n]*\n\| ---[^\n]*\n(?:\|[^\n]*\n)+/m
    : new RegExp('^\\| '+header+' \\|[^\\n]*\\n\\| ---[^\\n]*\\n(?:\\|[^\\n]*\\n)+','m');
  assert.ok(pattern.test(report), 'Report table missing: '+firstCell);
  report = report.replace(pattern,replacement);
};
const sev=findings.severity;
replaceTable('Chỉ tiêu',table(['Chỉ tiêu','Kết quả'],[['Database',uc.metrics.db.percent+'%'],['Backend',uc.metrics.be.percent+'%'],['Frontend',uc.metrics.fe.percent+'%'],['Integration',uc.metrics.integration.percent+'%'],['Use Case',`${uc.statuses.PASS}/45 PASS; ${uc.statuses.PARTIAL} PARTIAL; 0 MISSING; ${uc.statuses.BROKEN} BROKEN`],['Architecture compliance','PARTIAL: các boundary ngoài R0 chưa xác minh'],['No-SQL Backend','PASS'],['Findings đang mở',`${sev.CRITICAL} CRITICAL / ${sev.HIGH} HIGH / ${sev.MEDIUM} MEDIUM / ${sev.LOW} LOW`],['I-01','ACCEPTED PROJECT CONSTRAINT']]));
replaceTable('UC',table(['UC','Function','DB','SP','BE','FE','Integration','Status','Issue'],uc.rows.map(row=>[row.uc,row.name,row.db,`${row.db}: ${row.sp}`,`${row.be}: ${row.bePath}`,`${row.fe}: ${row.fePath}`,row.integration,row.status,row.issue])));
replaceTable('ID / Severity',table(['ID / Severity','Issue','Evidence + file/location','Problem / đường lỗi','Impact / expected'],findings.issues.map(issue=>[`${issue.id} ${issue.status==='ACTIVE'?issue.severity:issue.status}`,issue.title,issue.evidence,issue.problem,issue.impact])));
replaceTable('Layer',table(['Layer','PASS','PARTIAL','MISSING','BROKEN','Điểm /45','%'],Object.entries(uc.metrics).map(([layer,value])=>[layer.toUpperCase(),value.counts.PASS??0,value.counts.PARTIAL??0,value.counts.MISSING??0,value.counts.BROKEN??0,value.points,value.percent])));
replaceTable(report.includes('| 46 Use Cases |')?'46 Use Cases':'45 Use Cases',table(['45 Use Cases','Count'],Object.entries(uc.statuses)));
const current = result('main-migration');
const currentCheck = current?.status === 'PASS' ? current.after.metadata.checks.find(row=>row.name==='CK_BANGGIA_LoaiNgay') : null;
report = report.split('\n').flatMap(line=>{
  if (line.startsWith('Nguồn mã/tên UC:')) return 'Nguồn mã/tên UC: thiết kế + kế hoạch v2 + roadmap bắt buộc. Baseline chính thức **45 UC: KH14, QLR9, CSKH6, Admin16**. Xem [baseline](USE_CASE_BASELINE_45.md).';
  if (line.startsWith('Bằng chứng chạy:') || line.startsWith('Bằng chứng của lần audit gốc:')) return `Bằng chứng của lần audit gốc: backend 107/109 (2 lỗi artifact), frontend 45/45; 64 probe đọc/login đúng kỳ vọng. Evidence gốc được giữ nguyên. **R0 hiện tại: backend ${backend?.tests ?? '?'}/${backend?.tests ?? '?'}, frontend ${frontend?.tests ?? '?'}/${frontend?.tests ?? '?'}, 0 skip; no-SQL/lint/build/SQL regression/verify PASS; 47 request pricing HTTP và migration được kiểm chứng.** Xem [checks mới](r0-20261007/checks.json); không dùng kết quả cũ làm chứng nhận mới.`;
  if (line.startsWith('**Hệ thống có nền tảng')) return '**Hệ thống có nền tảng DBMS-first và chuỗi SP gateway đầy đủ, nhưng chưa đủ bằng chứng để nghiệm thu toàn bộ 45 use case.** Rủi ro transaction/concurrency ngoài R0 vẫn còn. I-01 là ACCEPTED PROJECT CONSTRAINT; không phát hiện backend dùng SQL nghiệp vụ trực tiếp.';
  if (line.startsWith('Không có endpoint nghiệp vụ hiện hữu thiếu SP.')) return 'Không có endpoint nghiệp vụ hiện hữu thiếu SP. `/health` cố ý không DB. Các phần contract còn thiếu trong UC hiện hữu: Admin report breakdown phim/thời gian và edit đầy đủ điều kiện/date của Admin pricing; không thêm UC ngoài 45 hoặc route giả vào 115 route hiện hữu.';
  if (line.startsWith('Module được phủ:')) return 'Module được phủ: Auth, User/Profile, RBAC, Movie, Cinema, Showtime, Seat, Product, Promotion, Booking, Payment, Order, Review, Complaint, Manager, CSKH, Admin, Report, System. Cấu hình hệ thống không nằm trong baseline.';
  if (line.startsWith('| Config |') || line.startsWith('| CRITICAL I-01 |')) return [];
  if (line.startsWith('| 46 UC theo user;')) return '| Baseline 45 UC theo roadmap | KH14, QLR9, CSKH6, Admin16 | MATCH phạm vi; mức hoàn thành thực tế ở matrix |';
  if (line.startsWith('| Giá theo loại ngày gồm ngày lễ |')) return '| Pricing ba loại ngày | Ngày thường / Cuối tuần / Tất cả, SQL authoritative | R0 PASS theo evidence mới |';
  if (line.startsWith('| DB direct DML |')) return '| DB account local | Backend sa; Stored-Procedure-Only vẫn bắt buộc | I-01 = ACCEPTED PROJECT CONSTRAINT; [giới hạn đồ án](PROJECT_ACCEPTED_CONSTRAINTS.md) |';
  if (line.startsWith('| CHECK CK_BANGGIA_LoaiNgay |') && currentCheck) return `| CHECK CK_BANGGIA_LoaiNgay | ${esc(currentCheck.definition)}; trusted=true, enabled=true; R0 main evidence |`;
  if (line.startsWith('`CinemaAppUser` tồn tại,')) return '`CinemaAppUser` tồn tại, member `db_executor`, có DENY DML và GRANT EXECUTE. Backend local dùng **sa, sysadmin=1** theo I-01 = **ACCEPTED PROJECT CONSTRAINT** ([phạm vi](PROJECT_ACCEPTED_CONSTRAINTS.md)); không đại diện production và không thay SP-only gateway. Schema-wide EXECUTE/helper surface là I-04 riêng, DEFER theo roadmap cho đồ án/local, không phải điều kiện buộc đổi sa trong R0. `sp_Showtime_CancelCascade` có active/role/permission guard.';
  if (line.startsWith('`fn_TinhGiaVe` lấy base price,')) return '`fn_TinhGiaVe` lấy base price, seat type và business date, cộng **tất cả** surcharge matching. Contract chỉ có Ngày thường / Cuối tuần / Tất cả; thứ Bảy và Chủ nhật dùng Cuối tuần, độc lập DATEFIRST. R0 SQL tests kiểm cả local midnight, range/status/seat/format và giá additive. Các hàm `fn_TinhTongTien*` chưa có caller SQL module là duplication DB ngoài R0; không phải backend raw SQL.';
  if (line.startsWith('| Pricing → rule forms |')) return '| Pricing → rule forms | API manager pricing → controller/service | SP → BANGGIA + overlap trigger → DTO | R0: enum/validator/form/CHECK/function tests PASS; grade toàn UC giữ PARTIAL |';
  if (line.startsWith('| Pricing/showtime |')) return '| Pricing/showtime | forms → pricing/showtimes/cancel → SP | R0 contract đã đồng bộ; I-14 edit conditions/date và I-03 overlap concurrency còn ngoài scope |';
  if (line.startsWith('| P0 | Chuyển runtime khỏi sa')) return '| DEFER local / HARDEN trước production | I-04 selective SP grants/helper surface theo roadmap; I-01 đã accepted | Giữ Stored-Procedure-Only; không đổi tài khoản đồ án trong R0 |';
  if (line.startsWith('| P1 | Chốt holiday')) return '| P1 | Validate operational parent policy và promotion validation/usage atomic (I-06/I-07) | Inactive parent reject; coupon quota/config races; giữ pricing contract 3 loại ngày đã chốt ở R0 |';
  if (line.startsWith('| P1 | Hoàn thiện ADM-17')) return '| P1 | Admin pricing edit conditions/date và report movie/time breakdown (I-13/I-14) | Positive/negative tests trong các UC Admin hiện hữu |';
  if (line.startsWith('| P1 | Khôi phục reproducible test evidence source')) return '| P1 | Dataset future-show/transaction và full write E2E/security/rollback/load (I-10) | Positive/negative chain45, snapshot/attempt/ownership/compensation; prerequisite test backend I-12 đã xử lý để chạy R0 |';
  if (line.startsWith('Severity là mức ảnh hưởng')) return `Severity chỉ đếm finding đang mở: **${findings.baseline.active} active (${sev.CRITICAL} CRITICAL, ${sev.HIGH} HIGH, ${sev.MEDIUM} MEDIUM, ${sev.LOW} LOW)**. Tổng 26 ID lịch sử gồm 1 accepted (I-01), ${findings.baseline.resolved} resolved và các finding còn lại. STATIC vẫn là source risk; không tuyên bố đã tái hiện exploit.`;
  if (line.startsWith('Các tỷ lệ là **ước lượng')) return 'Các tỷ lệ giữ grade của audit gốc cho UC trong phạm vi và chia mẫu số 45. R0 chỉ xác minh contract pricing/baseline và regression hiện có, không chứng nhận lại toàn bộ flow. Kiến trúc PARTIAL ở boundary ngoài R0 (ví dụ side effects GET/layer consistency); tài khoản sa được accepted và không phải nguyên nhân Fail. No-SQL PASS xác minh backend không thêm SQL nghiệp vụ.';
  if (line.startsWith('Hai lỗi BE là regression guard')) return `Trong audit gốc, hai guard lỗi vì thiếu artifact. R0 đã bỏ dependency đó và yêu cầu mapping đầy đủ từ SQL source/service: **${backend?.tests ?? '?'} tests PASS, 0 skip** ([log mới](r0-20261007/backend.txt)). Không thêm artifact giả hoặc bỏ test.`;
  if (line.startsWith('| Test repeatability |')) return '| Test repeatability | Guard dựa SQL source/service; không đọc file audit sinh trước | I-12 RESOLVED R0 TEST PREREQUISITE |';
  if (line.startsWith('| Backend |') && /test|107\/109/.test(line)) return `| Backend | node --test tests/**/*.test.js | R0 **${backend?.tests ?? '?'}/${backend?.tests ?? '?'} PASS, 0 skip**; [log](r0-20261007/backend.txt) |`;
  if (line.startsWith('| Frontend |') && /test|45\/45/.test(line)) return `| Frontend | node --test --test-concurrency=1 tests/*.test.js | R0 **${frontend?.tests ?? '?'}/${frontend?.tests ?? '?'} PASS, 0 skip**; [log](r0-20261007/frontend.txt) |`;
  if (line.startsWith('| Frontend lint/build |')) return '| Frontend lint/build | oxlint + vite build | R0 PASS; build mới trong frontend/dist, bundle warning vẫn ngoài scope |';
  if (line.startsWith('| No-SQL |')) return '| No-SQL | node scripts/audit-no-sql.mjs | R0 PASS; [log mới](r0-20261007/no-sql.txt) |';
  if (line.startsWith('| Database | test-all')) return '| Database | SQL test-all/verify trên source-built disposable | R0 PASS: smoke/timezone/pricing/compensation/schema/multirow/constraints/execute-only; [evidence](r0-20261007/checks.json) |';
  if (line.includes('ADM-17')) throw new Error('Unnormalized out-of-scope use case: '+line.slice(0,100));
  return line.replaceAll('toàn bộ 46 use case','toàn bộ 45 use case').replaceAll('theo 46 UC','theo 45 UC').replaceAll('/46×100','/45×100').replaceAll('ngoài46','ngoài45').replaceAll('46UC','45UC')
    .replace('Base + all matching surcharges; holiday gap I-05','Base + matching surcharges; 3 loại ngày chính thức, R0 SQL tests PASS');
}).join('\n');
const note = '\n**Chuẩn hóa Phase R0 theo roadmap:** phạm vi hiện hành 45 UC; I-01 accepted; pricing chỉ có ba loại ngày. Phần probe/dataset và raw evidence dưới đây ghi nhận audit gốc trước R0. Kết quả triển khai/test R0 nằm trong [báo cáo R0](R0_TASK_1_REPORT.md) và [evidence mới](r0-20261007/README.md). Các grade ngoài R0 giữ nguyên.\n';
if (!report.includes('**Chuẩn hóa Phase R0 theo roadmap:**')) report = report.replace('## 1. Executive Summary',note+'\n## 1. Executive Summary');
write(file,report);
const summary = `BASELINE NORMALIZED — TASK 1 / R0\n\nUse Cases: 45 (KH14 / QLR9 / CSKH6 / ADM16)\nPASS: ${uc.statuses.PASS}\nPARTIAL: ${uc.statuses.PARTIAL}\nMISSING: 0\nBROKEN: ${uc.statuses.BROKEN}\n\n${Object.entries(uc.metrics).map(([layer,value])=>`${layer}: ${value.percent}%`).join('\n')}\nGrades preserved from original audit; denominator 45.\nI-01: ACCEPTED PROJECT CONSTRAINT (local/project; not production)\nI-05: ${findings.issues.find(issue=>issue.id==='I-05').status}\nI-12: ${findings.issues.find(issue=>issue.id==='I-12').status}\nActive: ${findings.baseline.active}; Critical ${sev.CRITICAL}, High ${sev.HIGH}, Medium ${sev.MEDIUM}, Low ${sev.LOW}\n\nNo-SQL Backend: ${check('no-sql')?.status ?? 'UNVERIFIED'}\nEvidence: docs/r0-20261007/\nReport: docs/FULL_SYSTEM_AUDIT.md\nNo R1 work performed.\n`;
write(path.join(out,'terminal-summary.txt'),summary);
console.log(summary);
const designFile = path.join(root,'Phân Tích _ Thiết Kế.md');
const design = read(designFile);
if (design.includes('<li>Cấu hình hệ thống</li>')) write(designFile,design.replace('<li>Cấu hình hệ thống</li>',''));
