import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {
  sqlId,
  sqlInteger,
  sqlDecimal,
  birthDate,
  currentBusinessDate,
} from '../src/utils/inputContract.js';
import * as admin from '../src/validators/adminValidator.js';
import * as manager from '../src/validators/managerValidator.js';
import { validateMovieListQuery } from '../src/validators/catalogValidator.js';
import { createProcedureClient, DbTypes } from '../src/db/procedureClient.js';
import { nativeSqlError } from '../src/utils/sqlErrors.js';
import { RESOURCE_STATUSES } from '../../shared/resourceContract.mjs';
const invalid = (fn) => assert.throws(fn, (e) => e.status === 400);
const movie = { title: 'R5', durationMinutes: 120, releaseDate: '2030-01-01', genreIds: [] };
const show = {
  movieId: 1,
  startsAt: '2030-01-01T00:00:00Z',
  endsAt: '2030-01-01T03:00:00Z',
  format: '2D',
  basePrice: 100000,
};
test('R5 BUG009/010: route, query, body, FK, array and count reject SQL INT overflow and implicit truncation', () => {
  for (const v of [0, -1, 1.5, NaN, Infinity, 2147483648, '1', null, []]) {
    invalid(() => sqlInteger(v, 'id'));
    invalid(() => admin.movieWrite({ ...movie, durationMinutes: v }, true));
    invalid(() => admin.rolePermissionSet({ permissionIds: [v] }));
    invalid(() => admin.movieCast({ cast: [{ actorId: v, role: 'R5' }] }));
    invalid(() => manager.showtimeCreate({ ...show, roomId: v }));
    invalid(() => manager.seatCreate({ row: 'A', number: v }));
  }
  for (const v of ['2147483648', '1.5', 'NaN', '-1', '0', [], {}, true]) {
    invalid(() => sqlId(v));
    invalid(() => admin.assignmentFilters({ cinemaId: v }));
  }
  assert.equal(sqlId('2147483647'), 2147483647);
  assert.equal(sqlInteger(1, 'count'), 1);
  assert.deepEqual(admin.rolePermissionSet({ permissionIds: [] }), { permissionIds: [] });
  assert.equal(admin.cinemaImageWrite({ url: '/r5.svg', displayOrder: 0 }, true).displayOrder, 0);
  for (const v of [1.5, '1', NaN, -1, 2147483648])
    invalid(() => admin.cinemaImageWrite({ url: '/r5.svg', displayOrder: v }, true));
});
test('R5 BUG002: every shared status equals the existing SQL CHECK enum; manager and filters use the same contract', () => {
  const tables = {
    users: 'nguoidung',
    assignments: 'phancong_rap',
    cinemas: 'rapchieuphim',
    rooms: 'phongchieu',
    seats: 'ghe',
    movies: 'phim',
    products: 'sanpham',
    promotions: 'khuyenmai',
    pricing: 'banggia',
    showtimes: 'suatchieu',
    cinemaImages: 'hinhanh_rapchieuphim',
  };
  for (const [resource, table] of Object.entries(tables)) {
    const text = fs.readFileSync(
      new URL('../../database/03_constraints/003_check_constraints.sql', import.meta.url),
      'utf8',
    );
    const marker = `CK_${table.toUpperCase()}_TrangThai`;
    const constraintOffset = text.indexOf(marker);
    assert.notEqual(constraintOffset, -1, table);
    const statementStart = text.lastIndexOf('ALTER TABLE', constraintOffset);
    const statementEnd = text.indexOf(';', constraintOffset);
    assert.ok(statementStart !== -1 && statementEnd !== -1, table);
    const statement = text.slice(statementStart, statementEnd);
    const check = statement.match(/\bCHECK\s*\(([\s\S]*)\)\s*$/i);
    assert.ok(check, table);
    const statuses = [...check[1].matchAll(/N?'((?:''|[^'])*)'/g)].map((m) => m[1]);
    assert.deepEqual([...statuses].sort(), [...RESOURCE_STATUSES[resource]].sort(), resource);
  }
  for (const status of RESOURCE_STATUSES.showtimes) {
    assert.equal(manager.showtimeUpdate({ ...show, status }).status, status);
    assert.equal(admin.showtimeWrite({ ...show, status }).status, status);
  }
  for (const status of RESOURCE_STATUSES.rooms)
    assert.equal(manager.roomUpdate({ name: 'R5', type: '2D', status }).status, status);
  for (const status of RESOURCE_STATUSES.movies) {
    assert.equal(admin.movieFilters({ status }).status, status);
    assert.equal(validateMovieListQuery({ status }).status, status);
  }
  const writes = {
    users: (status) => admin.userStatus({ status }),
    assignments: (status) =>
      admin.assignmentWrite({
        userId: 1,
        cinemaId: 1,
        startsOn: '2030-01-01',
        endsOn: null,
        status,
      }),
    cinemas: (status) => admin.cinemaWrite({ name: 'R5', address: 'R5', city: 'R5', status }),
    seats: (status) => admin.seatWrite({ type: 'Thường', status }),
    movies: (status) => admin.movieWrite({ ...movie, status }),
    products: (status) => admin.productWrite({ name: 'R5', type: 'Snack', price: 1, status }),
    promotions: (status) =>
      admin.promotionWrite({
        discountType: 'Số tiền',
        discountValue: 1,
        startsAt: show.startsAt,
        endsAt: show.endsAt,
        quantity: 1,
        status,
      }),
    pricing: (status) => admin.pricingWrite({ surcharge: 0, status }),
    cinemaImages: (status) => admin.cinemaImageWrite({ url: '/r5.svg', displayOrder: 0, status }),
  };
  for (const [resource, write] of Object.entries(writes)) {
    for (const status of RESOURCE_STATUSES[resource])
      assert.equal(write(status).status, status, resource);
    invalid(() => write('unsupported'));
  }
  invalid(() => manager.showtimeUpdate({ ...show, status: 'Tạm ngừng' }));
  invalid(() => validateMovieListQuery({ status: 'bogus' }));
});
test('R5 BUG011: resource-specific string limits accept the boundary and reject boundary+1, MAX stays MAX', () => {
  const cases = [
    [
      'user',
      100,
      (v) => admin.userCreate({ name: v, email: 'r5@test.com', password: 'password8', roleId: 1 }),
    ],
    ['role', 100, (v) => admin.roleWrite({ code: 'R5', name: v }, true)],
    ['permission', 100, (v) => admin.permissionWrite({ code: 'R5', name: v }, true)],
    ['cinema', 150, (v) => admin.cinemaWrite({ name: v, address: 'R5', city: 'R5' }, true)],
    ['room', 100, (v) => admin.roomWrite({ cinemaId: 1, name: v, type: '2D' }, true)],
    [
      'seat-row',
      10,
      (v) => admin.seatWrite({ roomId: 1, row: v, number: 1, type: 'Thường' }, true),
    ],
    ['genre', 100, (v) => admin.genreWrite({ name: v })],
    ['actor', 150, (v) => admin.actorWrite({ name: v })],
    ['movie-title', 255, (v) => admin.movieWrite({ ...movie, title: v }, true)],
    ['product', 150, (v) => admin.productWrite({ name: v, type: 'Snack', price: 1 }, true)],
    [
      'product-description',
      255,
      (v) => admin.productWrite({ name: 'R5', type: 'Snack', price: 1, description: v }, true),
    ],
    ['cast-role', 150, (v) => admin.movieCast({ cast: [{ actorId: 1, role: v }] })],
    [
      'image-description',
      255,
      (v) => admin.cinemaImageWrite({ url: '/r5.svg', displayOrder: 0, description: v }, true),
    ],
  ];
  for (const [name, max, fn] of cases) {
    assert.doesNotThrow(() => fn('x'.repeat(max)), name);
    invalid(() => fn('x'.repeat(max + 1)));
  }
  assert.equal(
    admin.movieWrite({ ...movie, description: 'x'.repeat(8000) }, true).description.length,
    8000,
  );
  for (const v of [1.234, 1e16, '1', NaN]) invalid(() => sqlDecimal(v, 'money'));
  assert.equal(sqlDecimal(0.01, 'money'), 0.01);
});
test('R5 BUG009/010/011: typed binding rejects invalid inputs before input/execute; BIGINT is exempt', async () => {
  let bound = 0,
    executed = 0;
  const request = {
    input() {
      bound++;
      return this;
    },
    async execute() {
      executed++;
      return { recordset: [] };
    },
  };
  const client = createProcedureClient(async () => ({ request: () => request }));
  for (const [type, value] of [
    [DbTypes.Int, 2147483648],
    [DbTypes.Int, 1.5],
    [DbTypes.Int, '1'],
    [DbTypes.NVarChar(10), 'x'.repeat(11)],
    [DbTypes.Decimal(18, 2), 1.234],
  ])
    await assert.rejects(
      client.executeProcedure('BOOK_TICKET', { X: { type, value } }),
      (e) => e.status === 400,
    );
  assert.equal(bound, 0);
  assert.equal(executed, 0);
  await client.executeProcedure('BOOK_TICKET', { X: { type: DbTypes.BigInt, value: 2147483648 } });
  assert.equal(bound, 1);
  assert.equal(executed, 1);
});
test('R5 BUG013: DOB uses the current business date across UTC midnight without conversion', () => {
  const before = new Date('2026-10-04T16:59:59Z'),
    after = new Date('2026-10-04T17:00:00Z');
  assert.equal(currentBusinessDate(before), '2026-10-04');
  assert.equal(currentBusinessDate(after), '2026-10-05');
  invalid(() => birthDate('2026-10-05', 'DOB', before));
  assert.equal(birthDate('2026-10-05', 'DOB', after), '2026-10-05');
  invalid(() => birthDate('2999-01-01'));
  invalid(() => birthDate('2026-10-04T00:00:00Z'));
  assert.equal(birthDate(null), null);
});
test('R5 BUG003: native SQL conflicts/invalid input are safe 4xx; unexpected errors remain unchanged', () => {
  for (const [number, message, status] of [
    [2627, 'secret SQL table', 409],
    [2601, 'secret', 409],
    [547, 'The DELETE statement conflicted', 409],
    [547, 'CHECK invalid', 400],
    [515, 'null column', 400],
    [2628, 'truncate', 400],
    [8152, 'truncate', 400],
  ]) {
    const mapped = nativeSqlError(Object.assign(new Error(message), { number }));
    assert.equal(mapped.status, status);
    assert.ok(!mapped.message.includes('secret'));
  }
  const unexpected = new Error('unanticipated');
  assert.equal(nativeSqlError(unexpected), unexpected);
});
