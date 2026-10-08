// R5.4 offline source verification only: no SQL execution, connection or monetary emulator.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, dbRoot, read, write, walk, expandSql } from '../db/lib.mjs';

const evidence = path.join(root, 'docs/evidence/r54');
const source = file => read(path.join(root, file));
const before = JSON.parse(source('docs/evidence/r54/audit-before.json'));
const fixtureFile = 'database/10_seed/test_fixture/transaction-fixture.sql';
const negativeFile = 'database/10_seed/test_fixture/negative-probes.sql';
const fixture = source(fixtureFile), negative = source(negativeFile);
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const stripComments = value => value.replace(/N?'(?:''|[^'])*'|--[^\r\n]*|\/\*[\s\S]*?\*\//g,
  token => /^(--|\/\*)/.test(token) ? ' ' : token);
const body = stripComments(fixture), probes = stripComments(negative);
const literal = value => /^N?'/.test(value) ? value.replace(/^N?'/, '').slice(0, -1).replaceAll("''", "'") : Number(value);
function splitTop(value) {
  let depth = 0, quoted = false, start = 0;
  const result = [];
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "'") {
      if (quoted && value[i + 1] === "'") { i++; continue; }
      quoted = !quoted;
    }
    if (quoted) continue;
    if (value[i] === '(') depth++;
    if (value[i] === ')') depth--;
    assert.ok(depth >= 0, 'Unbalanced parentheses');
    if (value[i] === ',' && depth === 0) { result.push(value.slice(start, i).trim()); start = i + 1; }
  }
  assert.ok(!quoted && depth === 0, 'Unbalanced SQL literal or parentheses');
  result.push(value.slice(start).trim());
  return result;
}
const modules = new Map();
for (const file of walk(dbRoot).filter(file => /\/(?:02_tables|05_functions|06_views|07_triggers|08_procedures)\//.test(file.replaceAll('\\', '/')) && file.endsWith('.sql'))) {
  const sql = stripComments(read(file));
  const name = /CREATE\s+(?:OR\s+ALTER\s+)?(?:TABLE|FUNCTION|VIEW|TRIGGER|PROCEDURE)\s+dbo\.\[?(\w+)\]?/i.exec(sql)?.[1];
  if (name) modules.set(name.toLowerCase(), { file: path.relative(root, file).replaceAll('\\', '/'), sql });
}
const scalarTypes = text => new Map([...text.matchAll(/(@\w+)\s+(int|bigint|bit|varchar|nvarchar|decimal|datetime2)(\s*\([^)]*\))?/gi)]
  .map(match => [match[1].toLowerCase(), (match[2] + (match[3] || '')).replaceAll(/\s/g, '').toLowerCase()]));
const calls = text => [...text.matchAll(/EXEC\s+dbo\.(\w+)\s+([\s\S]*?);/gi)].map(match => ({
  name: match[1], args: splitTop(match[2]).map(arg => {
    const parsed = /^(@\w+)\s*=\s*([\s\S]+?)(\s+OUTPUT)?$/i.exec(arg);
    assert.ok(parsed, 'Only named, non-dynamic fixture SP arguments: ' + arg);
    return { name: parsed[1].toLowerCase(), value: parsed[2], output: !!parsed[3] };
  }),
}));
const mainCalls = calls(body), negativeCalls = calls(probes), bindings = [];
const checks = [];
function check(name, work) {
  try { checks.push({ name, status: 'PASS', details: work() }); }
  catch (error) { checks.push({ name, status: 'FAIL', error: error.message }); }
}
function required(text, terms) { for (const term of terms) assert.ok(text.includes(term), 'Missing source safeguard/reference: ' + term); }

check('R0–R5.3 source and evidence preserved', () => {
  for (const [file, hash] of Object.entries(before.protectedFiles)) assert.equal(sha(fs.readFileSync(path.join(root, file))), hash, file);
  for (const [entry, hash] of Object.entries(before.expandedEntries)) assert.equal(sha(expandSql(entry)), hash, entry);
  return { protectedFiles: Object.keys(before.protectedFiles).length, unchangedExpandedEntries: Object.keys(before.expandedEntries) };
});
check('Manual isolation, disposable guard and rollback ownership', () => {
  for (const text of [body, probes]) {
    required(text, ["DB_NAME() <> N'CinemaBookingDB_Test'", "DB_NAME() NOT LIKE N'CinemaBookingDB[_]R0[_]%'",
      "SESSION_CONTEXT(N'R54DisposableTarget')", '@@TRANCOUNT <> 0', 'SET XACT_ABORT ON;', 'ROLLBACK TRANSACTION;', 'IF XACT_STATE() <> 0']);
    const tokens = text.replace(/N?'(?:''|[^'])*'/g, ' ');
    assert.ok(!/\b(?:USE|DROP|TRUNCATE|ALTER|CREATE|DISABLE|ENABLE|DBCC|MERGE|DELETE)\b|IDENTITY_INSERT|NOCHECK|\bEXEC\s*\(/i.test(tokens), 'No DDL, cleanup, tamper or dynamic SQL');
    assert.ok(!/^\s*:r\s/gm.test(tokens), 'No fixture entry-point includes');
  }
  required(body, ["SESSION_CONTEXT(N'R54PersistFixtures')", 'IF @Persist = 1', 'COMMIT TRANSACTION;', 'sys.foreign_keys', 'is_not_trusted', 'sys.check_constraints', 'sys.triggers']);
  assert.ok(!/\bCOMMIT\b/i.test(probes));
  for (const table of ['DONDATVE', 'CHITIETVE', 'CHITIETDOAN', 'THANHTOAN', 'DANHGIAPHIM', 'KHIEUNAI', 'XULY_KHIEUNAI', 'BOITHUONG_HUYSUAT'])
    assert.ok(body.includes(`EXISTS (SELECT 1 FROM dbo.${table})`), 'Empty transaction-table prerequisite: ' + table);
  for (const entry of Object.keys(before.expandedEntries)) assert.ok(!expandSql(entry).includes('R54DisposableTarget'), 'Fixture must not auto-run: ' + entry);
  return { default: 'ROLLBACK', persistence: 'Explicit session opt-in; current named disposable target required', helperTables: 'Table variables only' };
});
check('Actual SQL object references and SP argument contracts', () => {
  for (const [file, text] of [[fixtureFile, body], [negativeFile, probes]]) {
    for (const match of text.matchAll(/\bdbo\.(\w+)/gi)) assert.ok(modules.has(match[1].toLowerCase()), 'Unknown source object: ' + match[1]);
    const variables = scalarTypes(text);
    for (const call of calls(text)) {
      const module = modules.get(call.name.toLowerCase());
      const signature = /PROCEDURE\s+dbo\.\w+\s+([\s\S]*?)\bAS\s+BEGIN/i.exec(module.sql)?.[1]?.trim();
      assert.ok(signature, 'Missing procedure signature: ' + call.name);
      const parameters = splitTop(signature.startsWith('(') ? signature.slice(1, -1) : signature).map(param => {
        const parsed = /^(@\w+)\s+(\w+(?:\s*\([^)]*\))?)([\s\S]*)$/i.exec(param);
        assert.ok(parsed, 'Unrecognized source parameter: ' + param);
        return { name: parsed[1].toLowerCase(), type: parsed[2].replaceAll(/\s/g, '').toLowerCase(), optional: parsed[3].includes('='), output: /\bOUTPUT\b/i.test(parsed[3]) };
      });
      assert.equal(new Set(call.args.map(arg => arg.name)).size, call.args.length, 'Duplicate call parameter');
      for (const param of parameters) assert.ok(param.optional || call.args.some(arg => arg.name === param.name), 'Missing required parameter: ' + call.name + param.name);
      for (const arg of call.args) {
        const param = parameters.find(param => param.name === arg.name);
        assert.ok(param, 'Unknown parameter: ' + call.name + arg.name);
        assert.equal(arg.output, param.output, 'Fixture must capture every OUTPUT: ' + call.name + arg.name);
        if (/^@\w+$/.test(arg.value)) {
          assert.equal(variables.get(arg.value.toLowerCase()), param.type, 'Declared variable type differs: ' + call.name + arg.name);
        } else if (/^N?'/.test(arg.value)) {
          assert.ok(/^(?:n?varchar)/.test(param.type), 'String passed to non-string parameter');
          const bound = /\((\d+)\)/.exec(param.type)?.[1];
          if (bound) assert.ok(literal(arg.value).length <= Number(bound), 'Literal exceeds parameter length');
        } else assert.ok(arg.value === 'NULL' || /^\d+$/.test(arg.value), 'Unreviewed argument expression: ' + arg.value);
      }
      bindings.push({ caller: file, procedure: call.name, source: module.file, parameters: parameters.map(param => ({ ...param })) });
    }
  }
  // Controlled history INSERTs use real schema columns and generated identities.
  const inserts = [...body.matchAll(/INSERT\s+(?:INTO\s+)?dbo\.(\w+)\s*\(([^)]+)\)/gi)];
  assert.deepEqual(inserts.map(match => match[1]), ['DONDATVE', 'CHITIETVE', 'THANHTOAN']);
  for (const match of inserts) {
    const table = modules.get(match[1].toLowerCase()).sql;
    const columns = splitTop(match[2]);
    for (const column of columns) assert.ok(table.includes(`[${column}]`), 'Unknown INSERT column: ' + column);
    for (const identity of table.matchAll(/\[(\w+)\]\s+int\s+IDENTITY/gi)) assert.ok(!columns.includes(identity[1]), 'Do not pin transaction identities');
  }
  return { mainCalls: mainCalls.length, negativeCalls: negativeCalls.length, directHistoryTables: inserts.map(match => match[1]), bindingsEvidence: 'contracts.json' };
});
check('Matrix order/ticket/food/payment coverage and schema enums', () => {
  const rows = [...body.matchAll(/INSERT @Orders VALUES\s*\(([^;]+)\);/g)].map(match => splitTop(match[1]));
  assert.equal(rows.length, 6);
  const states = [...new Set(rows.map(row => literal(row[2])))].sort();
  assert.deepEqual(states, ['Chờ thanh toán', 'Hết hạn', 'Đã hủy', 'Đã thanh toán'].sort());
  const totals = rows.reduce((out, row) => out.map((total, i) => total + Number(row[i + 3])), [0, 0, 0, 0]);
  assert.deepEqual(totals, [7, 5, 4, 3]);
  const constraints = source('database/03_constraints/003_check_constraints.sql');
  for (const state of states) assert.ok(constraints.includes(`[TrangThai]=N'${state}'`));
  const counts = Object.fromEntries(mainCalls.map(call => [call.name, mainCalls.filter(other => other.name === call.name).length]));
  assert.equal(counts.sp_Booking_Create, 5);
  assert.equal(counts.sp_Payment_CreateAttempt, 3);
  assert.equal(counts.sp_Payment_UpdateResult, 3);
  assert.equal(counts.sp_Order_ExpirePending, 1);
  assert.equal(counts.sp_Order_Cancel, 1);
  assert.equal(counts.sp_Showtime_CancelCascade, 2);
  assert.equal(counts.sp_Review_Create, 1);
  assert.ok(body.indexOf('@NewDonDatVeID = @Pending OUTPUT') > body.lastIndexOf('EXEC dbo.sp_Complaint_Create'), 'Pending must be created last');
  required(source('database/10_seed/test_fixture/fixture-matrix.md'), ['N/A', 'Completed/Used', 'R54-REVIEW-INELIGIBLE', 'R54-C-FOREIGN-ORDER']);
  required(source('docs/contracts/ORDER_DETAIL_READ_ONLY.md'), ['không triển khai workflow mới']);
  return { plannedOrders: 6, plannedTickets: totals[0], plannedFoodLines: totals[1], plannedPayments: totals[2], successful: totals[3], statuses: states, calls: counts, completedUsed: 'N/A: no lifecycle workflow' };
});
check('Baseline dependencies and DB-clock historical chronology', () => {
  const accounts = source('database/10_seed/seed_base/004_reference.sql');
  for (const email of ['khachhang1@gmail.com', 'khachhang2@gmail.com', 'khachhang3@gmail.com', 'khachhang4@gmail.com', 'admin@cinemadb.vn', 'cskh@cinemadb.vn']) assert.ok(accounts.includes(email));
  required(source('database/10_seed/seed_base/016_reference.sql'), ['CHAOBANMOI']);
  required(source('database/10_seed/seed_base/001_reference.sql'), ["'KHACH_HANG'", "'ADMIN'", "'CSKH'"]);
  required(body, ['dbo.fn_BayGio()', 'dbo.vw_LichChieuChiTiet WHERE IsBookable = 1', 'SuatChieuID <> @FutureShow',
    "TrangThai = N'Hoàn thành' AND ThoiGianKetThuc < @Now", 'PhongID = @PastRoom', 'DATEADD(HOUR, -1, @PastStarts)',
    '@HistoricalPaid >= @PastStarts', '@HistoricalBooked < (SELECT NgayTao', 't.NgayTao < d.NgayDat', 't.NgayThanhToan < t.NgayTao',
    'd.NgayDat < n.NgayTao', 's.ThoiGianKetThuc < r.NgayDanhGia']);
  assert.ok(!/N?'\d{4}-\d{2}-\d{2}/.test(body + probes), 'No hardcoded fixture dates');
  const mutations = [...body.matchAll(/UPDATE\s+dbo\.(\w+)\s+SET\s+([\s\S]*?)\s+WHERE/gi)];
  assert.deepEqual(mutations.map(match => match[1]), ['DONDATVE', 'HOSOKHACHHANG']);
  assert.ok(mutations[0][2].startsWith('NgayDat = DATEADD(MINUTE, -6, @Now), HanGiuCho = DATEADD(MINUTE, -1, @Now)'));
  assert.ok(mutations[1][2].startsWith('DiemTichLuy = DiemTichLuy + @HistoricalPoints'));
  return { dateAuthority: 'Existing SQL UTC/business clock', history: 'Controlled paid order/ticket/payment; no catalog/show clock or state rewrite', allowedDirectUpdates: mutations.map(match => match[1]) };
});
check('SQL monetary authority, lifecycle assertions and compensation idempotence', () => {
  required(body, ['dbo.fn_TinhGiaVe(@PastShow, @PastSeat)', 'SUM(v.GiaVe)', 'f.SoLuong) * f.DonGia', 'dbo.fn_GioiHanGiamGiaPhanTram()',
    't.SoTien <> d.TongTienVe + d.TongTienDoAn - d.TienGiamGia', '@FailedPayment = @PaidPayment', '@CompPaymentBefore <>', '@CompLedgerAfter <>',
    'CROSS APPLY dbo.fn_TinhBoiThuongVe(', 'b.DiemBoiThuong = expected.DiemCong', '@CompPointsAfter <> @CompPointsBefore +',
    'initial.DiemTichLuy', 'initial.SoLuongDaDung', 'dbo.fn_DonDangGiuGhe(', 'GROUP BY d.SuatChieuID, v.GheID HAVING COUNT(*) > 1']);
  required(modules.get('sp_payment_updateresult').sql, ['CAST(@Amount/1000 AS INT)', "TrangThai=N'Thất bại'", 'NgayThanhToan=NULL']);
  required(modules.get('sp_showtime_cancelcascade').sql, ['dbo.fn_TinhBoiThuongVe', 'BOITHUONG_HUYSUAT']);
  assert.ok(!/INSERT\s+(?:INTO\s+)?dbo\.BOITHUONG_HUYSUAT/i.test(body));
  return { pricing: 'Booking SP / SQL pricing function', paymentAmounts: 'Stored order snapshot', compensation: 'Existing SP + helper + unique ledger; second cancellation assertion', runtimeResult: 'NOT RUN' };
});
check('Complaint ownership, five statuses and append-only processing history', () => {
  const rows = [...body.matchAll(/INSERT @Complaints VALUES\s*\(([^;]+)\);/g)].map(match => splitTop(match[1]));
  assert.equal(rows.length, 5);
  assert.deepEqual(rows.map(row => Number(row[3])), [0, 1, 2, 3, 1]);
  const constraints = source('database/03_constraints/003_check_constraints.sql');
  for (const row of rows) assert.ok(constraints.includes(`[TrangThai]=N'${literal(row[2])}'`));
  assert.equal(mainCalls.filter(call => call.name === 'sp_Complaint_Create').length, 5);
  assert.equal(mainCalls.filter(call => call.name === 'sp_Support_Complaint_AddProcessing').length, 6);
  assert.equal(mainCalls.filter(call => call.name === 'sp_Support_Complaint_UpdateStatus').length, 1);
  required(body, ['k.NguoiDungID <> d.NguoiDungID', 'ORDER BY x.XuLyID DESC', 'LAG(NgayXuLy)', 'x.NgayXuLy < k.NgayTao', "'QL_KHIEUNAI'", "'XULY_KHIEUNAI'"]);
  required(modules.get('trg_xulykhieunai_capnhattrangthaikhieunai').sql, ['XuLyID DESC']);
  return { plannedComplaints: 5, plannedProcessingEvents: 7, linkedAndUnlinked: true, latestAuthority: 'Highest XuLyID, existing trigger' };
});
check('Negative inputs reject via existing contracts and isolated rollback', () => {
  required(probes, ["N'R54 eligible historical review'", "N'R54 paid after retry'", 'WHILE @CaseNumber <= 3', 'BEGIN TRANSACTION;',
    '@ActualError = ERROR_NUMBER()', '@ActualError IS NULL OR @ActualError <> @ExpectedError', '@ReviewsBefore <>', '@ComplaintsBefore <>', 'INCLUDE_NULL_VALUES']);
  required(negative, ['R54-REVIEW-INELIGIBLE', 'R54-REVIEW-DUPLICATE', 'R54-C-FOREIGN-ORDER']);
  assert.equal(negativeCalls.length, 3);
  for (const [number, name] of [[50004, 'trg_danhgia_kiemtradaxemphim'], [50040, 'sp_review_create'], [50041, 'sp_complaint_create']]) {
    assert.ok(modules.get(name)?.sql.includes('THROW ' + number), 'Expected error must exist in source contract: ' + number);
    assert.ok(probes.includes(String(number)));
  }
  assert.ok(!/INSERT\s+(?:INTO\s+)?dbo\.(?:DANHGIAPHIM|KHIEUNAI)/i.test(body + probes), 'Review/complaints always via SP');
  return { cases: 3, expectedErrors: [50004, 50040, 50041], invalidPersistedRows: 'Never intentionally retained; snapshot equality asserted after rollback', runtimeResult: 'NOT RUN' };
});
check('SQL source lexical boundaries', () => {
  for (const [file, text] of [[fixtureFile, body], [negativeFile, probes]]) {
    splitTop(text);
    assert.ok(!source(file).includes('\uFFFD'), 'No UTF-8 replacement character');
    assert.equal((text.match(/BEGIN TRY/g) || []).length, (text.match(/END TRY/g) || []).length);
    assert.equal((text.match(/BEGIN CATCH/g) || []).length, (text.match(/END CATCH/g) || []).length);
    assert.ok(/\bGO\s*$/.test(text));
  }
  return { checkedFiles: [fixtureFile, negativeFile], scope: 'Literals/parentheses/TRY-CATCH boundaries only; not SQL compilation' };
});

const passed = checks.filter(check => check.status === 'PASS').length;
write(path.join(evidence, 'contracts.json'), { status: 'SOURCE REFERENCE AUDIT', sqlExecuted: false, bindings });
write(path.join(evidence, 'checks.json'), {
  capturedAt: new Date().toISOString(), status: passed === checks.length ? 'STATIC PASS' : 'STATIC FAIL',
  passed, total: checks.length, sqlExecuted: false, databaseConnection: false, sqlCompilation: 'NOT RUN', checks,
  sources: Object.fromEntries([fixtureFile, negativeFile, 'database/10_seed/test_fixture/fixture-matrix.md'].map(file => [file, sha(fs.readFileSync(path.join(root, file)))])),
});
for (const check of checks) console.log(`${check.status}: ${check.name}${check.error ? ' — ' + check.error : ''}`);
console.log(`${passed}/${checks.length} STATIC PASS; LIVE SQL VERIFICATION NOT RUN.`);
if (passed !== checks.length) process.exitCode = 1;
