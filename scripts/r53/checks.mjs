// R5.3 offline source/boundary checks. No DB connection and no SQL execution.
// The bounded schedule model is evidence about source, never SQL runtime evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, dbRoot, read, write, walk, expandSql, normalizeModule } from '../db/lib.mjs';

const evidence = path.join(root, 'docs/evidence/r53');
const before = JSON.parse(read(path.join(evidence, 'audit-before.json')));
const dynamicFile = 'database/10_seed/seed_demo_dynamic/014_reference.sql';
const source = file => read(path.join(root, file));
const sql = source(dynamicFile);
const stripComments = text => text.replace(/N?'(?:''|[^'])*'|--[^\r\n]*|\/\*[\s\S]*?\*\//g, token => /^(?:--|\/\*)/.test(token) ? ' ' : token);
const body = stripComments(sql);
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
const manifest = JSON.parse(source('database/baseline-manifest.json')).expected;
function splitTop(text) {
  const out = []; let start = 0, depth = 0, quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "'") { if (quoted && text[i + 1] === "'") { i++; continue; } quoted = !quoted; }
    if (quoted) continue;
    if (c === '(') depth++;
    if (c === ')') depth--;
    assert.ok(depth >= 0, 'Unbalanced SQL parentheses');
    if (c === ',' && !depth) { out.push(text.slice(start, i).trim()); start = i + 1; }
  }
  assert.ok(!quoted && !depth, 'Unbalanced SQL string/parentheses');
  out.push(text.slice(start).trim()); return out;
}
const literal = value => {
  if (/^N?'(?:''|[^'])*'$/.test(value)) return value.replace(/^N?'/, '').slice(0, -1).replaceAll("''", "'");
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  if (value === 'NULL') return null;
  return value; // Date expressions are explicitly handled below, not evaluated as code.
};
function values(text, target) {
  const escaped = target.replaceAll('.', '\\.');
  const match = new RegExp(`INSERT\\s+(?:INTO\\s+)?${escaped}\\s*\\(([^)]+)\\)\\s*VALUES\\s*([\\s\\S]*?);`, 'i').exec(stripComments(text));
  assert.ok(match, 'Missing VALUES insert: ' + target);
  const columns = splitTop(match[1]);
  return splitTop(match[2]).map(tuple => {
    assert.ok(tuple.startsWith('(') && tuple.endsWith(')'));
    const cells = splitTop(tuple.slice(1, -1)); assert.equal(cells.length, columns.length);
    return Object.fromEntries(columns.map((name, i) => [name, literal(cells[i])]));
  });
}
const plan = values(sql, '@ShowtimePlan');
const base = name => source(`database/10_seed/seed_base/${name}_reference.sql`);
const movies = values(base('011'), 'dbo.PHIM');
const rooms = values(base('007'), 'dbo.PHONGCHIEU');
const cinemas = values(base('005'), 'dbo.RAPCHIEUPHIM');
const day = instant => new Date(Date.parse(instant) + 7 * 3600000).toISOString().slice(0, 10);
function dateAdd(unit, amount, value) {
  const date = new Date(value + 'T00:00:00Z');
  if (unit === 'DAY') date.setUTCDate(date.getUTCDate() + amount);
  else {
    const month = date.getUTCMonth(), originalDay = date.getUTCDate();
    date.setUTCDate(1); date.setUTCFullYear(date.getUTCFullYear() + amount);
    date.setUTCDate(Math.min(originalDay, new Date(Date.UTC(date.getUTCFullYear(), month + 1, 0)).getUTCDate()));
  }
  return date.toISOString().slice(0, 10);
}
function release(expression, seedDate) {
  if (expression === null) return null;
  const match = /^DATEADD\((DAY|YEAR),(-?\d+),@SeedDay\)$/.exec(expression);
  assert.ok(match, 'Unmodeled base movie date: ' + expression);
  return dateAdd(match[1], Number(match[2]), seedDate);
}
function schedule(now, seedDate = day(now), rows = plan, parentMovies = movies) {
  const today = day(now);
  return rows.map(row => {
    const movie = parentMovies.find(p => p.PhimID === row.PhimID);
    const room = rooms.find(p => p.PhongID === row.PhongID);
    assert.ok(movie && room && cinemas.some(r => r.RapID === room.RapID), 'Missing parent');
    const localDate = dateAdd('DAY', row.DayOffset, today);
    const start = new Date(Date.parse(localDate + 'T00:00:00Z') + (row.LocalHour - 7) * 3600000).toISOString();
    const end = new Date(Date.parse(start) + movie.ThoiLuong * 60000).toISOString();
    const releaseStart = release(movie.NgayKhoiChieu, seedDate), releaseEnd = release(movie.NgayKetThuc, seedDate);
    const cinema = cinemas.find(r => r.RapID === room.RapID);
    assert.ok(movie.ThoiLuong > 0 && movie.ThoiLuong <= 480, 'Movie duration rejected');
    assert.ok(localDate >= releaseStart && (releaseEnd === null || localDate <= releaseEnd), 'Base release window rejected');
    assert.ok(start < end);
    if (row.DayOffset < 0) assert.ok(end < now && row.TrangThai === 'Hoàn thành', 'Past time/status rejected');
    else {
      assert.ok(start > now && row.TrangThai === 'Mở bán', 'Future time/status rejected');
      assert.ok(movie.TrangThai !== 'Ngừng chiếu' && room.TrangThai === 'Hoạt động' && cinema.TrangThai === 'Hoạt động', 'Future parent status rejected');
    }
    return { ...row, RapID: room.RapID, localDate, start, end };
  });
}
const overlaps = (a, b) => a.PhongID === b.PhongID && a.TrangThai !== 'Đã hủy' && b.TrangThai !== 'Đã hủy' && a.start < b.end && b.start < a.end;
const distribution = (rows, field) => Object.fromEntries([...new Set(rows.map(r => r[field]))].sort((a, b) => a - b).map(value => [value, rows.filter(r => r[field] === value).length]));
const cases = [
  ['current example', '2026-10-08T08:30:00.000Z'],
  ['before local midnight/month boundary', '2026-10-31T16:59:59.999Z'],
  ['after local midnight/month boundary', '2026-10-31T17:00:00.000Z'],
  ['before local midnight/year boundary', '2026-12-31T16:59:59.999Z'],
  ['after local midnight/year boundary', '2026-12-31T17:00:00.000Z'],
  ['leap day beginning', '2028-02-28T17:00:00.000Z'],
  ['leap month end', '2028-02-29T16:59:59.999Z'],
];
const checks = [];
async function check(name, run) {
  try { checks.push({ name, status: 'PASS', detail: await run() }); }
  catch (error) { checks.push({ name, status: 'FAIL', detail: error.message }); }
}
await check('SQL source structure, one DB clock, UTC/business date contract, showtime-only writes', () => {
  splitTop(body); // balanced delimiters across the audited T-SQL body
  assert.equal([...body.matchAll(/dbo\.fn_BayGio\(\)/g)].length, 1);
  assert.match(body, /DECLARE @NowUtc datetime2\(7\) = dbo\.fn_BayGio\(\);/);
  assert.match(body, /DECLARE @Today date = dbo\.fn_NgayKinhDoanh\(@NowUtc\);/);
  assert.match(body, /DATEADD\(HOUR, plan\.LocalHour, CONVERT\(datetime2\(7\), DATEADD\(DAY, plan\.DayOffset, @Today\)\)\)/);
  assert.match(body, /DATEADD\(MINUTE, p\.ThoiLuong, slot\.StartUtc\)/);
  assert.match(body, /CROSS APPLY \(SELECT dbo\.fn_UtcTuGioRap\(/);
  assert.doesNotMatch(body, /@SeedDay|CinemaSeedDay|\$\(SeedDate\)|'\d{4}-\d{2}-\d{2}|GETDATE|SYSDATETIME/);
  assert.deepEqual([...body.matchAll(/\bINSERT\s+(?:INTO\s+)?(dbo\.\w+|@\w+)/gi)].map(m => m[1]), ['@ShowtimePlan', '@ShowtimeRows', 'dbo.SUATCHIEU']);
  assert.doesNotMatch(body, /\b(?:UPDATE|DELETE|MERGE|TRUNCATE|DROP|ALTER|CREATE|EXEC|DISABLE)\b/i);
  assert.match(body, /IF CONVERT\(int,SESSION_CONTEXT\(N'CinemaSeedSkip'\)\) = 0/);
  assert.match(body, /IF EXISTS \(SELECT 1 FROM dbo\.SUATCHIEU\)\s+THROW 51004/);
  assert.match(body, /SET IDENTITY_INSERT dbo\.SUATCHIEU ON;\s*BEGIN TRY/);
  assert.match(body, /BEGIN CATCH\s+SET IDENTITY_INSERT dbo\.SUATCHIEU OFF;\s+THROW;/);
  for (const name of ['fn_BayGio', 'fn_NgayKinhDoanh', 'fn_UtcTuGioRap', 'fn_GioRap']) assert.ok(fs.existsSync(path.join(dbRoot, '05_functions', name + '.sql')));
  assert.match(source('database/05_functions/fn_BayGio.sql'), /RETURN SYSUTCDATETIME\(\)/);
  assert.match(source('database/05_functions/fn_UtcTuGioRap.sql'), /AT TIME ZONE 'SE Asia Standard Time' AT TIME ZONE 'UTC'/);
  assert.match(source('database/05_functions/fn_NgayKinhDoanh.sql'), /CONVERT\(DATE, dbo\.fn_GioRap\(@UtcInstant\)\)/);
  assert.match(source('database/05_functions/fn_GioRap.sql'), /AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time'/);
  const columns = /INSERT INTO dbo\.SUATCHIEU \(([^)]+)\)/.exec(body)[1].split(',').map(c => c.trim());
  assert.deepEqual(columns, manifest.columns.filter(c => c.tableName === 'SUATCHIEU').sort((a, b) => a.column_id - b.column_id).map(c => c.name));
  return { physicalInsertTargets: ['dbo.SUATCHIEU'], newTransactionRows: 0, sqlSyntax: 'Reviewed/balanced source; SQL Server compilation NOT RUN' };
});
await check('32 unique IDs: 8 historical and 24 future open; four movies, six rooms, three cinemas', () => {
  assert.equal(plan.length, 32); assert.equal(new Set(plan.map(r => r.SuatChieuID)).size, 32);
  assert.deepEqual(plan.map(r => r.SuatChieuID), Array.from({ length: 32 }, (_, i) => i + 1));
  const rows = schedule(cases[0][1]), past = rows.filter(r => r.DayOffset < 0), future = rows.filter(r => r.DayOffset > 0);
  assert.equal(past.length, 8); assert.equal(future.length, 24);
  for (const selected of [past, future]) for (const [field, count] of [['PhimID', 4], ['PhongID', 6], ['RapID', 3]]) assert.equal(new Set(selected.map(r => r[field])).size, count);
  return { past: 8, futureOpen: 24, pastByDay: distribution(past, 'DayOffset'), futureByDay: distribution(future, 'DayOffset'), futureByMovie: distribution(future, 'PhimID'), futureByRoom: distribution(future, 'PhongID'), futureByCinema: distribution(future, 'RapID') };
});
await check('IDs 1-5 retain parents, format, price, status, relative day/local hour and actual duration', () => {
  const oldRows = values(before.originalDynamicSql, 'dbo.SUATCHIEU');
  assert.equal(oldRows.length, 5);
  for (const old of oldRows) {
    const row = plan.find(r => r.SuatChieuID === old.SuatChieuID);
    for (const field of ['PhimID', 'PhongID', 'DinhDang', 'GiaVeCoBan', 'TrangThai']) assert.equal(row[field], old[field], field);
    const expression = old.ThoiGianBatDau.replace(/\s/g, '');
    const match = /DATEADD\(HOUR,(\d+),.*DATEADD\(DAY,(-?\d+),/.exec(expression);
    assert.ok(match); assert.equal(row.LocalHour, Number(match[1])); assert.equal(row.DayOffset, Number(match[2]));
    const oldEndMinutes = Number(/DATEADD\(MINUTE,(\d+),/.exec(old.ThoiGianKetThuc.replace(/\s/g, ''))[1]);
    assert.equal(oldEndMinutes - row.LocalHour * 60, movies.find(p => p.PhimID === row.PhimID).ThoiLuong);
  }
  return { preservedIds: [1, 2, 3, 4, 5], clockChange: 'SeedDate -> DB business day; instant changes deliberately', oldIdentityCeiling: 5, newIdentityCeiling: 32 };
});
await check('Actual schema enums/FKs and DB duration contract, with valid future parent seats', () => {
  const constraints = source('database/03_constraints/003_check_constraints.sql');
  for (const check of manifest.checks.filter(c => c.tableName === 'SUATCHIEU')) {
    const line = constraints.split(/\r?\n/).find(line => line.includes('CONSTRAINT [' + check.name + ']'));
    assert.ok(line); assert.equal(normalizeModule('(' + /CHECK \((.+)\);/.exec(line)[1] + ')'), normalizeModule(check.definition));
  }
  const allowed = name => [...manifest.checks.find(c => c.name === name).definition.matchAll(/N'([^']+)'/g)].map(m => m[1]);
  for (const row of plan) {
    assert.ok(allowed('CK_SUATCHIEU_DinhDang').includes(row.DinhDang));
    assert.ok(allowed('CK_SUATCHIEU_TrangThai').includes(row.TrangThai)); assert.ok(row.GiaVeCoBan > 0);
    for (const fk of manifest.foreignKeys.filter(c => c.childTable === 'SUATCHIEU')) assert.ok((fk.parentTable === 'PHIM' ? movies : rooms).some(p => p[fk.parentColumn] === row[fk.childColumn]));
  }
  const duration = source('database/08_procedures/system/sp_Showtime_ValidateTimes.sql');
  assert.match(duration, /@Span>28800/); assert.match(duration, /@ThoiLuong\)\*60/); assert.match(duration, /@ThoiLuong\)\+120\)\*60/);
  assert.match(base('008'), /WHILE @p <= 6/); assert.match(base('008'), /WHILE @h <= 5/); assert.match(base('008'), /WHILE @s <= 8/);
  assert.match(base('008'), /N'Hoạt động'/);
  assert.match(body, /p\.ThoiLuong <= 0 OR p\.ThoiLuong > 480/);
  assert.match(body, /NOT EXISTS \(SELECT 1 FROM dbo\.GHE g WHERE g\.PhongID = pc\.PhongID AND g\.TrangThai = N'Hoạt động'\)/);
  return { showtimeChecks: 4, showtimeFKs: 2, duration: 'Actual PHIM.ThoiLuong minutes; zero added buffer', activeSeatsPerSeedRoom: 40, pastLifecycle: 'Historical INSERT with Hoàn thành, no business status transition/transaction fabricated' };
});
await check('Month/year/leap-day/local-midnight boundaries: strict past/future, UTC and release dates', () => {
  return { kind: 'STATIC BOUNDARY ANALYSIS', cases: cases.map(([name, now]) => {
    const rows = schedule(now);
    for (const row of rows) {
      assert.equal(day(row.start), row.localDate);
      assert.equal(Date.parse(row.end) - Date.parse(row.start), movies.find(p => p.PhimID === row.PhimID).ThoiLuong * 60000);
    }
    return { name, artificialClock: now, businessDate: day(now), past: rows.filter(r => r.end < now).length, futureOpen: rows.filter(r => r.start > now && r.TrangThai === 'Mở bán').length, example: rows.find(r => r.SuatChieuID === 2) };
  }) };
});
await check('No same-room overlap; strict trigger boundaries accept end == start', () => {
  const trigger = source('database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql');
  assert.match(trigger, /i\.ThoiGianBatDau < sc\.ThoiGianKetThuc/); assert.match(trigger, /i\.ThoiGianKetThuc > sc\.ThoiGianBatDau/);
  assert.match(trigger, /i1\.ThoiGianBatDau < i2\.ThoiGianKetThuc/); assert.match(trigger, /i1\.ThoiGianKetThuc > i2\.ThoiGianBatDau/);
  for (const [, now] of cases) {
    const rows = schedule(now); for (let i = 0; i < rows.length; i++) for (const other of rows.slice(i + 1)) assert.ok(!overlaps(rows[i], other));
  }
  const a = schedule(cases[0][1])[0], touching = { ...a, start: a.end, end: new Date(Date.parse(a.end) + 60000).toISOString() };
  assert.equal(overlaps(a, touching), false);
  assert.equal(overlaps(a, { ...touching, start: new Date(Date.parse(a.end) - 1).toISOString() }), true);
  assert.equal(overlaps(a, { ...a, PhongID: 2 }), false);
  assert.equal(overlaps(a, { ...a, TrangThai: 'Đã hủy' }), false);
  return { overlapPairs: 0, touchingBoundary: 'accepted by strict inequalities', oneMillisecondOverlap: 'rejected in static predicate', differentRoomsSameTime: 'allowed' };
});
await check('Stale SeedDate: DB-relative schedule is unchanged; incompatible release window is rejected', () => {
  const now = cases[0][1];
  assert.deepEqual(schedule(now, '2026-01-01'), schedule(now));
  assert.throws(() => schedule(now, '2024-01-01'), /Base release window rejected/);
  assert.throws(() => schedule(now, '2027-01-01'), /Base release window rejected/);
  assert.match(body, /fn_NgayKinhDoanh\(s\.ThoiGianBatDau\) < p\.NgayKhoiChieu/);
  assert.match(body, /fn_NgayKinhDoanh\(s\.ThoiGianBatDau\) > p\.NgayKetThuc/);
  assert.ok(body.indexOf('Dynamic showtime dates must be past/future') < body.indexOf('SET IDENTITY_INSERT dbo.SUATCHIEU ON'));
  const badMovie = movies.map(p => ({ ...p, TrangThai: 'Ngừng chiếu' }));
  assert.throws(() => schedule(now, day(now), plan, badMovie), /Future parent status rejected/);
  assert.equal(schedule(now, day(now), plan, movies.map(p => ({ ...p, TrangThai: 'Sắp chiếu' }))).filter(r => r.DayOffset > 0).length, 24);
  const futureFinished = plan.map(r => ({ ...r, TrangThai: 'Hoàn thành' }));
  assert.throws(() => schedule(now, day(now), futureFinished), /Future time\/status rejected/);
  return { compatibleOldSeedDate: '2026-01-01', rejectedArtificialSeedDates: ['2024-01-01', '2027-01-01'], baseRowsChanged: 0, liveErrorRollback: 'NOT RUN' };
});
await check('Public list/detail/seat and booking retain authoritative full IsBookable contract', () => {
  const view = source('database/06_views/vw_LichChieuChiTiet.sql');
  for (const predicate of ["sc.TrangThai = N'Mở bán'", 'sc.ThoiGianBatDau > dbo.fn_BayGio()', "r.TrangThai = N'Hoạt động'", "pc.TrangThai = N'Hoạt động'", "p.TrangThai <> N'Ngừng chiếu'", 'dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) >= p.NgayKhoiChieu', 'dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) <= p.NgayKetThuc']) assert.ok(view.includes(predicate), predicate);
  for (const name of ['sp_Showtime_ListByMovie', 'sp_Showtime_GetDetail', 'sp_Seat_ListByShowtime']) assert.match(source(`database/08_procedures/public/${name}.sql`), /IsBookable = 1/);
  assert.match(source('database/08_procedures/booking/sp_Booking_Create.sql'), /IsBookable = 1/);
  assert.match(body, /LEFT JOIN dbo\.vw_LichChieuChiTiet v ON v\.SuatChieuID = s\.SuatChieuID/);
  assert.match(body, /s\.TrangThai = N'Mở bán' AND \(v\.SuatChieuID IS NULL OR v\.IsBookable <> 1\)/);
  assert.match(source('database/11_tests/procedures/smoke.sql'), /WHERE s\.TrangThai=N'Mở bán' AND s\.ThoiGianBatDau>dbo\.fn_BayGio\(\) ORDER BY s\.SuatChieuID/);
  assert.match(source('database/11_tests/procedures/smoke.sql'), /WHERE TrangThai=N'Hoàn thành' ORDER BY SuatChieuID/);
  return { futureStaticPrerequisites: 24, sqlReadAndBookingExecution: 'NOT RUN', legacyFirstFutureId: 2, legacyFirstHistoricalId: 1 };
});
await check('Base, schema, contracts, callers/fixtures, R5.1/R5.2 evidence and orchestration preserved', () => {
  for (const [file, expected] of Object.entries(before.protectedFiles)) assert.equal(sha(fs.readFileSync(path.join(root, file))), expected, file);
  for (const file of walk(dbRoot).filter(file => file.endsWith('.sql') && !file.includes(path.join('database', '_audit')))) {
    const relative = path.relative(root, file).replaceAll('\\', '/');
    assert.ok(Object.hasOwn(before.protectedFiles, relative) || relative === dynamicFile, 'Unexpected SQL file: ' + relative);
  }
  for (const [entry, expected] of Object.entries(before.expandedEntriesWithoutDynamic)) {
    const expanded = expandSql(entry); assert.ok(expanded.includes(sql));
    assert.equal(sha(expanded.replace(sql, '/* R5.3 dynamic body */')), expected, entry);
  }
  return { identicalFiles: Object.keys(before.protectedFiles).length, expandedEntriesIdenticalOutsideDynamic: 3, baseSqlEdits: 0, sentinelChanges: 0, previousEvidenceOverwritten: false, oldHashCheckers: 'Historical R5.1/R5.2 whole-source parity checks intentionally describe their captured phase, not current dynamic SQL' };
});
const result = { status: checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL', capturedAt: new Date().toISOString(), validationKind: 'STATIC SOURCE AND BOUNDARY ANALYSIS', databaseConnection: false, sqlExecuted: false, checks, liveVerification: { status: 'NOT RUN', reason: 'No existing disposable test database has been confirmed safe. No database was created/reset; SQL execution/compilation and public/booking runtime are deferred to R5.5.' } };
write(path.join(evidence, 'checks.json'), result);
for (const check of checks) console.log(`${check.status} ${check.name}${check.status === 'FAIL' ? ': ' + check.detail : ''}`);
console.log(`${checks.filter(c => c.status === 'PASS').length}/${checks.length} R5.3 checks PASS; LIVE SQL: NOT RUN.`);
if (result.status !== 'PASS') process.exitCode = 1;
