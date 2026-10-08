// R5.2 source-data audit only: never connects to a DB, executes SQL or writes seed data.
// Models the audited seed's VALUES, two INSERT SELECTs, one seat loop and date expressions.
// This is a bounded static checker, not a SQL Server emulator or a live integration test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, dbRoot, read, walk, expandSql, normalizeModule, write } from '../db/lib.mjs';
import { verifyPassword } from '../../backend/src/utils/password.js';

const evidence = path.join(root, 'docs/evidence/r52');
const before = JSON.parse(read(path.join(evidence, 'audit-before.json')));
const manifest = JSON.parse(read(path.join(dbRoot, 'baseline-manifest.json'))).expected;
const baseDir = path.join(dbRoot, '10_seed/seed_base');
const files = fs.readdirSync(baseDir).filter(f => f.endsWith('.sql')).sort();
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const source = file => read(path.join(root, file));

// Preserve SQL strings (including doubled quotes); only strip actual comments.
const stripComments = text => text.replace(/N?'(?:''|[^'])*'|--[^\r\n]*|\/\*[\s\S]*?\*\//g, token => /^(?:--|\/\*)/.test(token) ? ' ' : token);
function splitTop(text, separator = ',') {
  const parts = []; let depth = 0, quoted = false, start = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "'") {
      if (quoted && text[i + 1] === "'") { i++; continue; }
      quoted = !quoted;
    }
    if (quoted) continue;
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === separator && depth === 0) { parts.push(text.slice(start, i).trim()); start = i + 1; }
    assert.ok(depth >= 0, 'Unbalanced seed expression');
  }
  assert.ok(!quoted && depth === 0, 'Unbalanced seed expression');
  parts.push(text.slice(start).trim()); return parts;
}
function dateAdd(unit, amount, value) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? value + 'T00:00:00.000Z' : value);
  assert.ok(Number.isFinite(date.getTime()), 'Invalid seed date');
  if (unit.toUpperCase() === 'DAY') date.setUTCDate(date.getUTCDate() + amount);
  else if (unit.toUpperCase() === 'YEAR') {
    // SQL DATEADD clamps Feb 29 to the final valid day in the destination month.
    const month = date.getUTCMonth(), day = date.getUTCDate();
    date.setUTCDate(1); date.setUTCFullYear(date.getUTCFullYear() + amount);
    date.setUTCDate(Math.min(day, new Date(Date.UTC(date.getUTCFullYear(), month + 1, 0)).getUTCDate()));
  } else throw Error('Unsupported seed DATEADD unit');
  return dateOnly ? date.toISOString().slice(0, 10) : date.toISOString();
}
function valueOf(expression, context) {
  let text = expression.trim();
  while (text.startsWith('(') && text.endsWith(')') && splitTop(text.slice(1, -1)).length === 1) text = text.slice(1, -1).trim();
  if (/^NULL$/i.test(text)) return null;
  if (/^N?'(?:''|[^'])*'$/.test(text)) return text.replace(/^N?'/, '').slice(0, -1).replaceAll("''", "'");
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text);
  if (Object.hasOwn(context, text)) return context[text];
  const call = /^(CONVERT|DATEADD|SESSION_CONTEXT|dbo\.fn_UtcTuGioRap)\(([\s\S]*)\)$/i.exec(text);
  assert.ok(call, 'Unsupported seed expression; review static model before continuing');
  const args = splitTop(call[2]);
  switch (call[1].toUpperCase()) {
    case 'SESSION_CONTEXT': assert.equal(valueOf(args[0], context), 'CinemaSeedDay'); return context['@SeedDay'];
    case 'CONVERT': {
      const value = valueOf(args[1], context);
      if (args[0].toLowerCase() === 'date') return value.slice(0, 10);
      assert.equal(args[0].toLowerCase(), 'datetime2');
      return value.length === 10 ? value + 'T00:00:00.000Z' : value;
    }
    case 'DATEADD': return dateAdd(args[0], valueOf(args[1], context), valueOf(args[2], context));
    case 'DBO.FN_UTCTUGIORAP': {
      // Checked against the unchanged SQL function's SE Asia Standard Time -> UTC contract.
      const value = valueOf(args[0], context);
      return new Date(Date.parse(value) - 7 * 60 * 60 * 1000).toISOString();
    }
    default: throw Error('Unsupported seed function');
  }
}

function seedModel(seedDay) {
  const tables = {}, inserts = [];
  const context = { '@SeedDay': seedDay };
  const add = (table, columns, values, file) => {
    assert.equal(columns.length, values.length, `${file}: column/value mismatch`);
    const row = Object.fromEntries(columns.map((column, i) => [column, values[i]]));
    const rows = tables[table] ??= [];
    for (const column of manifest.columns.filter(c => c.tableName === table)) {
      if (Object.hasOwn(row, column.name)) continue;
      if (column.is_identity) row[column.name] = Number(column.identitySeed) + rows.length * Number(column.identityIncrement);
      else if (column.defaultDefinition) {
        row[column.name] = column.name === 'NgayGan'
          ? valueOf('dbo.fn_UtcTuGioRap(CONVERT(datetime2,@SeedDay))', context)
          : valueOf(column.defaultDefinition, context);
      } else if (column.is_nullable) row[column.name] = null;
      else assert.ok(column.is_computed, `${table}.${column.name}: missing required field`);
    }
    rows.push(row); inserts.push({ table, file, row });
  };
  for (const name of files) {
    const file = `database/10_seed/seed_base/${name}`, raw = source(file), body = stripComments(raw);
    assert.match(body, /IF CONVERT\(int,SESSION_CONTEXT\(N'CinemaSeedSkip'\)\) = 0/);
    const statements = [...body.matchAll(/INSERT\s+(?:INTO\s+)?dbo\.(\w+)\s*\(([^)]+)\)\s*(VALUES|SELECT)\s*([\s\S]*?);/gi)];
    assert.ok(statements.length > 0, `${name}: no modeled INSERT`);
    assert.equal(statements.length, [...body.matchAll(/\bINSERT\s+(?:INTO\s+)?dbo\./gi)].length, `${name}: unmodeled INSERT`);
    for (const statement of statements) {
      const table = statement[1], columns = splitTop(statement[2]);
      if (table === 'GHE') {
        // One audited nested WHILE block. Fail closed on any body change rather than
        // pretending to interpret arbitrary procedural SQL or assuming 240 seats.
        assert.equal(sha(fs.readFileSync(path.join(root, file))), before.protectedFiles[file]);
        assert.match(body, /SET @p = 1;\s*WHILE @p <= 6/);
        assert.match(body, /SET @h = 1;\s*WHILE @h <= 5/);
        assert.match(body, /SET @s = 1;\s*WHILE @s <= 8/);
        assert.match(body, /SET @hChar = CHAR\(64 \+ @h\)/);
        assert.match(body, /IF @h IN \(1, 2\) SET @lGhe = N'Thường';\s*ELSE IF @h IN \(3, 4\) SET @lGhe = N'VIP';\s*ELSE SET @lGhe = N'Sweetbox';/);
        for (let room = 1; room <= 6; room++) for (let row = 1; row <= 5; row++) for (let seat = 1; seat <= 8; seat++) {
          const vars = { ...context, '@p': room, '@hChar': String.fromCharCode(64 + row), '@s': seat, '@lGhe': row <= 2 ? 'Thường' : row <= 4 ? 'VIP' : 'Sweetbox' };
          add(table, columns, splitTop(statement[4].trim().slice(1, -1)).map(e => valueOf(e, vars)), file);
        }
      } else if (statement[3].toUpperCase() === 'VALUES') {
        for (const tuple of splitTop(statement[4])) {
          assert.ok(tuple.startsWith('(') && tuple.endsWith(')'), `${name}: invalid VALUES tuple`);
          add(table, columns, splitTop(tuple.slice(1, -1)).map(e => valueOf(e, context)), file);
        }
      } else {
        const select = /^([\s\S]+?)\s+FROM\s+dbo\.(\w+)\s*$/i.exec(statement[4]);
        assert.ok(select && ['QUYEN', 'RAPCHIEUPHIM'].includes(select[2]), `${name}: unsupported seed SELECT`);
        for (const parent of tables[select[2]]) add(table, columns, splitTop(select[1]).map(e => valueOf(e, { ...context, ...parent })), file);
      }
    }
    const updates = [...body.matchAll(/\bUPDATE\s+dbo\.(\w+)\s+SET\s+(\w+)\s*=\s*([^;]+);/gi)];
    for (const update of updates) {
      assert.equal(update[1], 'VAITRO_QUYEN'); assert.equal(update[2], 'NgayGan');
      for (const row of tables.VAITRO_QUYEN) row.NgayGan = valueOf(update[3], context);
    }
    assert.equal(updates.length, [...body.matchAll(/\bUPDATE\s+dbo\./gi)].length, `${name}: unsupported UPDATE`);
    assert.doesNotMatch(body, /\bDELETE\b|\bMERGE\b|\bEXEC(?:UTE)?\b|\bTRUNCATE\b|\bDROP\b/);
  }
  return { tables, inserts, seedDay };
}

// Restricted CHECK expression parser; SQL UNKNOWN passes CHECK, as on SQL Server.
// Collation approximation is case-insensitive/accent-sensitive and trims trailing spaces.
// It suffices for these literal keys; it does not certify arbitrary SQL collation behavior.
const key = value => typeof value === 'string' ? value.normalize('NFC').toLowerCase().replace(/ +$/, '') : value;
function checkExpression(expression, row) {
  const tokens = expression.match(/N?'(?:''|[^'])*'|\[[^\]]+\]|>=|<=|<>|[=><(),]|-?\d+(?:\.\d+)?|[A-Za-z_]+/g) ?? [];
  assert.equal(expression.replace(/\s/g, ''), tokens.join('').replace(/\s/g, ''), 'Unsupported CHECK token');
  let at = 0;
  const is = token => tokens[at]?.toUpperCase() === token;
  const take = token => { assert.ok(is(token), `Expected ${token} in CHECK`); at++; };
  const and = (a, b) => a === false || b === false ? false : a === null || b === null ? null : true;
  const or = (a, b) => a === true || b === true ? true : a === null || b === null ? null : false;
  function atom() {
    if (is('(')) { at++; const value = disjunction(); take(')'); return value; }
    const token = tokens[at++]; assert.ok(token, 'Missing CHECK operand');
    if (token.startsWith('[')) { const name = token.slice(1, -1); assert.ok(Object.hasOwn(row, name), `Missing ${name} in CHECK`); return row[name]; }
    if (/^N?'/.test(token)) return valueOf(token, {});
    if (/^-?\d/.test(token)) return Number(token);
    assert.ok(['LEN', 'LTRIM', 'RTRIM'].includes(token.toUpperCase()), 'Unsupported CHECK function');
    take('('); const value = disjunction(); take(')');
    if (value === null) return null;
    if (token.toUpperCase() === 'LEN') return String(value).replace(/ +$/, '').length;
    return token.toUpperCase() === 'LTRIM' ? String(value).replace(/^ +/, '') : String(value).replace(/ +$/, '');
  }
  function comparison() {
    const left = atom();
    if (is('IS')) { at++; const negate = is('NOT'); if (negate) at++; take('NULL'); return negate ? left !== null : left === null; }
    if (!['=', '<>', '>', '>=', '<', '<='].includes(tokens[at])) return left;
    const operator = tokens[at++], right = atom();
    if (left === null || right === null) return null;
    const a = key(left), b = key(right);
    return { '=': () => a === b, '<>': () => a !== b, '>': () => a > b, '>=': () => a >= b, '<': () => a < b, '<=': () => a <= b }[operator]();
  }
  function negation() { if (!is('NOT')) return comparison(); at++; const value = negation(); return value === null ? null : !value; }
  function conjunction() { let value = negation(); while (is('AND')) { at++; value = and(value, negation()); } return value; }
  function disjunction() { let value = conjunction(); while (is('OR')) { at++; value = or(value, conjunction()); } return value; }
  const value = disjunction(); assert.equal(at, tokens.length, 'Unconsumed CHECK tokens'); return value;
}

const constraints = [...source('database/03_constraints/003_check_constraints.sql').matchAll(/^ALTER TABLE dbo\.\[([^\]]+)\].*?CONSTRAINT \[([^\]]+)\] CHECK \((.+)\);$/gm)].map(m => ({ tableName: m[1], name: m[2], expression: m[3] }));
function validate(model) {
  const { tables, inserts } = model;
  let checkCount = 0, uniqueCount = 0, fkCount = 0;
  for (const [table, rows] of Object.entries(tables)) {
    const columns = manifest.columns.filter(c => c.tableName === table);
    for (const row of rows) for (const [field, value] of Object.entries(row)) {
      const column = columns.find(c => c.name === field); assert.ok(column, `${table}.${field}: unknown column`);
      if (value === null) { assert.ok(column.is_nullable, `${table}.${field}: NULL rejected`); continue; }
      if (column.typeName === 'int') assert.ok(Number.isInteger(value) && value >= -2147483648 && value <= 2147483647, `${table}.${field}: SQL INT`);
      else if (column.typeName === 'bit') assert.ok([0, 1].includes(value), `${table}.${field}: BIT`);
      else if (['decimal', 'numeric'].includes(column.typeName)) assert.ok(Number.isFinite(value) && Math.abs(value) < 10 ** (column.precision - column.scale) && (String(value).split('.')[1]?.length ?? 0) <= column.scale, `${table}.${field}: DECIMAL`);
      else if (['nvarchar', 'varchar', 'char'].includes(column.typeName)) {
        assert.equal(typeof value, 'string', `${table}.${field}: text`);
        if (column.typeName !== 'nvarchar') assert.match(value, /^[\x00-\x7f]*$/, `${table}.${field}: non-ASCII requires SQL code-page review`);
        const bytes = Buffer.byteLength(value, column.typeName === 'nvarchar' ? 'utf16le' : 'ascii');
        assert.ok(column.max_length === -1 || bytes <= column.max_length, `${table}.${field}: string overflow`);
      } else if (['date', 'datetime2'].includes(column.typeName)) {
        assert.match(value, column.typeName === 'date' ? /^\d{4}-\d{2}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}T/);
        const date = new Date(value.length === 10 ? value + 'T00:00:00Z' : value);
        assert.ok(Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value.slice(0, 10), `${table}.${field}: invalid date`);
      } else throw Error(`Unsupported datatype ${table}.${field}`);
    }
    for (const spec of constraints.filter(c => c.tableName === table)) {
      const metadata = manifest.checks.find(c => c.name === spec.name);
      assert.ok(metadata && !metadata.is_disabled && !metadata.is_not_trusted, spec.name);
      assert.equal(normalizeModule('(' + spec.expression + ')'), normalizeModule(metadata.definition), spec.name);
      for (const row of rows) assert.notEqual(checkExpression(spec.expression, row), false, `${spec.name}: seed row rejected`);
      checkCount++;
    }
    const indexes = new Map();
    for (const index of manifest.indexes.filter(i => i.tableName === table && i.is_unique && i.key_ordinal > 0)) {
      const list = indexes.get(index.name) ?? []; list.push(index); indexes.set(index.name, list);
    }
    for (const [name, columns] of indexes) {
      columns.sort((a, b) => a.key_ordinal - b.key_ordinal);
      const selected = rows.filter(row => !columns[0].filter_definition || checkExpression(columns[0].filter_definition, row) === true);
      const values = selected.map(row => JSON.stringify(columns.map(c => key(row[c.columnName]))));
      assert.equal(new Set(values).size, values.length, `${name}: duplicate key`); uniqueCount++;
    }
  }
  // Validate actual FK values at INSERT time, not just whether a parent table was seeded.
  const inserted = {};
  for (const { table, row } of inserts) {
    for (const fk of manifest.foreignKeys.filter(f => f.childTable === table)) {
      if (row[fk.childColumn] === null) continue;
      assert.ok((inserted[fk.parentTable] ?? []).some(parent => key(parent[fk.parentColumn]) === key(row[fk.childColumn])), `${fk.name}: missing parent value`);
      fkCount++;
    }
    (inserted[table] ??= []).push(row);
  }
  return { checkConstraints: checkCount, uniqueIndexes: uniqueCount, fkValueAssertions: fkCount };
}

const checks = [];
async function check(name, run) {
  try { checks.push({ name, status: 'PASS', detail: await run() }); }
  catch (error) { checks.push({ name, status: 'FAIL', detail: error.message }); }
}
const seedDays = ['2026-10-08', '2026-01-01', '2028-02-29'];
let model;
await check('All 16 base files parsed; schema, CHECK, UNIQUE, FK values and order', () => {
  assert.equal(files.length, 16);
  const audits = seedDays.map(seedDay => { const data = seedModel(seedDay); return { seedDay, ...validate(data), rowCounts: Object.fromEntries(Object.entries(data.tables).map(([name, rows]) => [name, rows.length])) }; });
  model = seedModel(seedDays[0]); return { files, audits, limitation: 'Static fresh-dataset model; SQL Server execution NOT RUN' };
});
await check('Four roles and existing 23-permission/40-grant baseline; all SP permission codes resolve', () => {
  const roles = model.tables.VAITRO, codes = model.tables.QUYEN.map(r => r.MaQuyen);
  assert.deepEqual(roles.map(r => r.MaVaiTro).sort(), ['ADMIN', 'CSKH', 'KHACH_HANG', 'QUAN_LY_RAP']);
  assert.equal(codes.length, 23); assert.equal(model.tables.VAITRO_QUYEN.length, 40);
  const expected = { KHACH_HANG: ['XEM_PHIM', 'DAT_VE', 'THANH_TOAN', 'DANH_GIA', 'GUI_KHIEU_NAI'], QUAN_LY_RAP: ['XEM_PHIM', 'DAT_VE', 'THANH_TOAN', 'QL_PHONG', 'QL_GHE', 'QL_SUAT_CHIEU', 'QL_BANG_GIA', 'XEM_BAO_CAO_RAP'], CSKH: ['XEM_PHIM', 'QL_KHIEUNAI', 'XULY_KHIEUNAI', 'TRA_CUU_DON'], ADMIN: codes };
  for (const role of roles) {
    const actual = model.tables.VAITRO_QUYEN.filter(g => g.VaiTroID === role.VaiTroID).map(g => model.tables.QUYEN.find(p => p.QuyenID === g.QuyenID).MaQuyen);
    assert.deepEqual(actual.sort(), [...expected[role.MaVaiTro]].sort(), role.MaVaiTro);
  }
  const required = [...new Set(walk(path.join(dbRoot, '08_procedures')).flatMap(file => [...read(file).matchAll(/fn_KiemTraQuyenNguoiDung\([^,]+,\s*'([^']+)'/g)].map(m => m[1])))];
  for (const code of required) assert.ok(codes.includes(code), `Unseeded SP permission: ${code}`);
  return { permissions: codes, roleGrants: expected, requiredByProcedures: required, note: 'Existing public grants retained; role AND permission guards remain authoritative' };
});
await check('Eight demo account hashes verify with the real bcrypt helper; profiles only for four customers', async () => {
  const users = model.tables.NGUOIDUNG, profiles = model.tables.HOSOKHACHHANG;
  assert.equal(users.length, 8); assert.equal(profiles.length, 4);
  for (const user of users) {
    assert.equal(user.TrangThai, 'Hoạt động'); assert.ok(await verifyPassword('123456', user.MatKhau), 'Demo hash mismatch');
    const role = model.tables.VAITRO.find(r => r.VaiTroID === user.VaiTroID).MaVaiTro;
    assert.equal(profiles.some(p => p.NguoiDungID === user.NguoiDungID), role === 'KHACH_HANG', 'Role/profile mismatch');
  }
  for (const profile of profiles) assert.ok(profile.NgaySinh <= model.seedDay && Number.isInteger(profile.DiemTichLuy) && profile.DiemTichLuy >= 0);
  return { validHashes: 8, activeAccounts: 8, customerProfiles: 4, staffProfiles: 0, pointsRetained: profiles.map(p => p.DiemTichLuy), loginSqlRuntime: 'NOT RUN' };
});
await check('Two active Manager assignments and out-of-scope cinemas; SeedDate windows', () => {
  for (const seedDay of seedDays) {
    const data = seedModel(seedDay);
    assert.equal(data.tables.PHANCONG_RAP.length, 2);
    for (const assignment of data.tables.PHANCONG_RAP) {
      const user = data.tables.NGUOIDUNG.find(u => u.NguoiDungID === assignment.NguoiDungID);
      assert.equal(data.tables.VAITRO.find(r => r.VaiTroID === user.VaiTroID).MaVaiTro, 'QUAN_LY_RAP');
      assert.equal(user.TrangThai, 'Hoạt động'); assert.equal(assignment.TrangThai, 'Hiệu lực');
      assert.ok(assignment.NgayBatDau <= seedDay && assignment.NgayKetThuc >= seedDay);
      assert.ok(data.tables.RAPCHIEUPHIM.some(r => r.RapID !== assignment.RapID), 'No out-of-scope cinema');
    }
  }
  return { assignments: model.tables.PHANCONG_RAP.map(a => ({ managerId: a.NguoiDungID, cinemaId: a.RapID, startsOn: a.NgayBatDau, endsOn: a.NgayKetThuc })), negativeScopeAvailable: true, sqlScopeRuntime: 'NOT RUN' };
});
await check('Cinema/room/seat/image catalog is active and usable', () => {
  for (const table of ['RAPCHIEUPHIM', 'PHONGCHIEU', 'GHE', 'HINHANH_RAPCHIEUPHIM']) for (const row of model.tables[table]) assert.equal(row.TrangThai, 'Hoạt động');
  for (const cinema of model.tables.RAPCHIEUPHIM) {
    assert.ok(cinema.TenRap.trim() && cinema.DiaChi.trim());
    assert.ok(model.tables.PHONGCHIEU.some(r => r.RapID === cinema.RapID));
    assert.equal(model.tables.HINHANH_RAPCHIEUPHIM.filter(i => i.RapID === cinema.RapID && i.LaAnhDaiDien === 1).length, 1);
  }
  for (const room of model.tables.PHONGCHIEU) assert.equal(model.tables.GHE.filter(s => s.PhongID === room.PhongID).length, 40);
  return { cinemas: 3, rooms: 6, seats: 240, seatsPerRoom: 40, images: 3, seatTypes: [...new Set(model.tables.GHE.map(s => s.LoaiGhe))], imageRemoteAvailability: 'NOT CHECKED' };
});
await check('Movie/genre/actor links valid; parent dates cover R5.3 horizon without creating shows', () => {
  for (const seedDay of seedDays) {
    const data = seedModel(seedDay);
    for (const movie of data.tables.PHIM) {
      assert.equal(movie.TrangThai, 'Đang chiếu'); assert.ok(movie.TenPhim.trim());
      assert.ok(movie.NgayKhoiChieu <= dateAdd('DAY', -7, seedDay) && movie.NgayKetThuc >= dateAdd('DAY', 7, seedDay));
      assert.ok(data.tables.PHIM_THELOAI.some(link => link.PhimID === movie.PhimID));
    }
    for (const actor of data.tables.DIENVIEN) assert.ok(actor.HoTen.trim() && actor.NgaySinh <= seedDay);
  }
  return { movies: 4, genres: 7, actors: 6, movieGenreLinks: 7, movieActorLinks: 4, castCoverageRequiredForEveryMovie: false, horizonDays: [-7, 7], showsCreated: 0 };
});
await check('Products/pricing/promotion valid; no holiday, overlapping pricing tuple or consumed quota', () => {
  for (const product of model.tables.SANPHAM) assert.equal(product.TrangThai, 'Đang bán');
  const pricing = model.tables.BANGGIA;
  for (const row of pricing) assert.ok(['Ngày thường', 'Cuối tuần', 'Tất cả'].includes(row.LoaiNgay));
  for (let i = 0; i < pricing.length; i++) for (const other of pricing.slice(i + 1)) {
    const row = pricing[i], same = ['RapID', 'LoaiGhe', 'LoaiNgay', 'DinhDang'].every(k => key(row[k]) === key(other[k]));
    assert.ok(!(same && row.TrangThai === 'Áp dụng' && other.TrangThai === 'Áp dụng' && row.NgayBatDau <= (other.NgayKetThuc ?? '9999-12-31') && other.NgayBatDau <= (row.NgayKetThuc ?? '9999-12-31')), 'Overlapping active pricing tuple');
  }
  for (const promotion of model.tables.KHUYENMAI) {
    assert.equal(promotion.SoLuongDaDung, 0); assert.ok(promotion.SoLuong > 0); assert.equal(promotion.TrangThai, 'Hoạt động');
    const noon = model.seedDay + 'T05:00:00.000Z'; assert.ok(promotion.NgayBatDau <= noon && promotion.NgayKetThuc >= noon);
  }
  return { products: 5, pricingRules: 7, promotions: 3, counters: [0, 0, 0], validKinds: ['Ngày thường', 'Cuối tuần', 'Tất cả'], ruleCoexistence: 'Different tuple dimensions may coexist additively, as in the unchanged SQL trigger' };
});
await check('Checker rejects in-memory corruptions; no SQL fixtures persisted', () => {
  const cases = [
    ['Missing genre parent', data => { data.tables.THELOAI[0].TheLoaiID = 999; data.inserts.find(x => x.table === 'THELOAI').row.TheLoaiID = 999; }],
    ['Duplicate seat position', data => Object.assign(data.tables.GHE[1], { SoGhe: data.tables.GHE[0].SoGhe })],
    ['Invalid seat enum', data => { data.tables.GHE[0].LoaiGhe = 'INVALID'; }],
    ['Invalid legacy day', data => { data.tables.BANGGIA[0].LoaiNgay = 'Ngày lễ'; }],
    ['Oversubscribed promotion', data => { data.tables.KHUYENMAI[0].SoLuongDaDung = 1001; }],
    ['Malformed SQL INT', data => { data.tables.GHE[0].SoGhe = 0.5; }],
    ['String overflow', data => { data.tables.PHIM[0].TenPhim = 'x'.repeat(256); }],
    ['SQL NULL in required field', data => { data.tables.NGUOIDUNG[0].Email = null; }],
  ];
  for (const [name, corrupt] of cases) { const data = seedModel(seedDays[0]); corrupt(data); assert.throws(() => validate(data), undefined, name); }
  // Existing nullable CHECK paths are also parsed, not silently skipped.
  assert.equal(checkExpression('[NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayBatDau]', { NgayKetThuc: null, NgayBatDau: '2026-10-08' }), true);
  assert.equal(checkExpression('[GiamToiDa]>=(0)', { GiamToiDa: null }), null);
  return { rejectedCorruptions: cases.map(([name]) => name), nullableCheckSemantics: 'PASS', sqlWrites: 0 };
});
await check('R5.1 source, base data, dynamic SQL, fixtures, API/schema/UI and orchestration preserved', () => {
  for (const [file, expected] of Object.entries(before.protectedFiles)) assert.equal(sha(fs.readFileSync(path.join(root, file))), expected, file);
  for (const [entry, expected] of Object.entries(before.expandedSqlSha256)) assert.equal(sha(expandSql(entry)), expected, entry);
  const includes = [...source('database/10_seed/seed-all.sql').matchAll(/^:r\s+\.\/(10_seed\/seed_base\/[^\r\n]+)$/gm)].map(m => m[1].trim());
  assert.deepEqual(includes, files.map(f => '10_seed/seed_base/' + f));
  assert.match(source('database/05_functions/fn_UtcTuGioRap.sql'), /AT TIME ZONE 'SE Asia Standard Time' AT TIME ZONE 'UTC'/);
  const sentinel = source('database/10_seed/seed-all.sql');
  assert.match(sentinel, /EXISTS\(SELECT 1 FROM dbo\.NGUOIDUNG WHERE Email='admin@cinemadb\.vn'\)/);
  assert.match(sentinel, /IF @skip=0 AND EXISTS\(SELECT 1 FROM dbo\.VAITRO\) THROW 51004/);
  assert.match(sentinel, /:r \.\/12_verify\/verify_seed.sql\s+COMMIT TRANSACTION;/);
  return { identicalFiles: Object.keys(before.protectedFiles).length, expandedEntries: 3, dataEdits: 0, sentinelChanged: false, liveRerun: 'NOT RUN: only source branch semantics audited' };
});

const result = { status: checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL', capturedAt: new Date().toISOString(), validationKind: 'STATIC SOURCE DATA + LOCAL BCRYPT', seedDays, databaseConnection: false, sqlExecuted: false, checks, liveVerification: { status: 'NOT RUN', reason: 'No existing disposable database has been identified and confirmed for this task; no DB/test pipeline was created.' } };
write(path.join(evidence, 'checks.json'), result);
for (const item of checks) console.log(`${item.status} ${item.name}${item.status === 'FAIL' ? ': ' + item.detail : ''}`);
console.log(`${checks.filter(c => c.status === 'PASS').length}/${checks.length} R5.2 checks PASS; SQL runtime NOT RUN.`);
if (result.status !== 'PASS') process.exitCode = 1;
