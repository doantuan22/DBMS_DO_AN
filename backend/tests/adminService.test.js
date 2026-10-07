import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminService, mapAdminProcedureError } from '../src/services/adminService.js';
import { CINEMA_IMAGE_STATUSES, assignmentFilters, promotionWrite, cinemaImageWrite, movieFilters, revenueFilters, userFilters } from '../src/validators/adminValidator.js';
import { HttpError } from '../src/utils/httpError.js';
import { requireAdmin } from '../src/middleware/requireAdmin.js';
import { PROCEDURES } from '../src/db/procedures.js';
import { readFileSync, readdirSync } from 'node:fs';

test('migration-008 procedures avoid SQL Server system-procedure prefix resolution', () => {
  const keys = [
    'ADMIN_CINEMA_LIST', 'ADMIN_PRODUCT_LIST', 'ADMIN_MOVIE_LIST', 'ADMIN_ASSIGNMENT_UPDATE',
    'ADMIN_ROLE_PERMISSION_LIST', 'ADMIN_ROOM_LIST', 'ADMIN_ROOM_CREATE', 'ADMIN_ROOM_UPDATE',
    'ADMIN_ROOM_DELETE', 'ADMIN_SEAT_LIST', 'ADMIN_SEAT_CREATE', 'ADMIN_SEAT_UPDATE',
    'ADMIN_SEAT_DELETE', 'ADMIN_PRICING_LIST', 'ADMIN_PRICING_CREATE', 'ADMIN_PRICING_UPDATE',
    'ADMIN_SHOWTIME_LIST', 'ADMIN_SHOWTIME_CREATE', 'ADMIN_SHOWTIME_UPDATE', 'ADMIN_SHOWTIME_CANCEL',
  ];
  for (const key of keys) assert.match(PROCEDURES[key], /^dbo\.usp_Admin_/);
});

test('admin service uses fixed whitelisted procedures and typed parameters', async () => {
  const calls = [];
  const service = createAdminService({ execute: async (key, params) => {
    calls.push({ key, params });
    return { recordsets: [[{ id: 3 }], [{ total: 4 }]] };
  } });
  assert.deepEqual(await service.users(1, { roleId: 2, status: 'active', search: 'Mai' }), [{ id: 3 }]);
  assert.equal(calls[0].key, 'ADMIN_USER_LIST');
  assert.equal(calls[0].params.VaiTroID.value, 2);
  assert.equal(calls[0].params.SearchTerm.value, 'Mai');
  assert.deepEqual(await service.revenue(1, { fromDate: '2026-01-01', toDate: '2026-01-31' }), {
    cinemas: [{ id: 3 }], totals: { total: 4 },
  });
  assert.equal(calls[1].key, 'ADMIN_REPORT_REVENUE');
});

test('admin query validators reject unsupported, invalid and reversed inputs', () => {
  assert.deepEqual(userFilters({ roleId: '4', status: 'Hoạt động', search: 'An' }), { roleId: 4, status: 'Hoạt động', search: 'An' });
  assert.throws(() => assignmentFilters({ cinemaId: '0' }), HttpError);
  assert.throws(() => movieFilters({ dynamicProcedure: 'dbo.sp_Admin_User_List' }), HttpError);
  assert.throws(() => revenueFilters({ fromDate: '2026-02-01', toDate: '2026-01-01' }), HttpError);
});

test('Admin role guard denies customers, managers and support before entering the portal', () => {
  for (const role of ['KHACH_HANG', 'QUAN_LY_RAP', 'CSKH']) {
    let forwarded;
    requireAdmin({ user: { role } }, {}, (error) => { forwarded = error; });
    assert.equal(forwarded.status, 403);
    assert.equal(forwarded.code, 'ADMIN_REQUIRED');
  }
  let passed = false;
  requireAdmin({ user: { role: 'ADMIN' } }, {}, (error) => { assert.equal(error, undefined); passed = true; });
  assert.equal(passed, true);
});

test('admin writes bind only fixed procedures and hash staff passwords', async () => {
  const calls = [];
  const service = createAdminService({ execute: async (key, params) => {
    calls.push({ key, params }); return { recordset: [{ result: true }] };
  } });
  await service.createUser(1, { name: 'Portal Test', email: 'portal-test@example.invalid', password: 'StrongPass1!', phone: null, roleId: 2 });
  assert.equal(calls[0].key, 'ADMIN_USER_CREATE');
  assert.notEqual(calls[0].params.MatKhauHash.value, 'StrongPass1!');
  assert.match(calls[0].params.MatKhauHash.value, /^\$2[aby]\$/);
  await service.setRolePermissions(1, 2, [14, 15]);
  assert.equal(calls[1].key, 'ADMIN_ROLE_PERMISSION_SET');
  assert.equal(calls[1].params.QuyenIdList.value, '14,15');
  await service.rooms(1, { cinemaId: 99 });
  assert.equal(calls[2].key, 'ADMIN_ROOM_LIST');
  assert.equal(calls[2].params.RapID.value, 99);
});

test('admin maps seat history, held showtime, and assignment role SQL errors to business HTTP errors', async () => {
  const service = createAdminService({ execute: async () => { throw { number: 50207 }; } });
  await assert.rejects(service.deleteSeat(1, 1), (error) => error.status === 409 && error.code === 'SEAT_HAS_TICKET_HISTORY');

  const heldShowtimeService = createAdminService({ execute: async () => { throw { originalError: { info: { number: 50118 } } }; } });
  await assert.rejects(heldShowtimeService.cancelShowtime(1, 1), (error) => error.status === 409 && error.code === 'SHOWTIME_HAS_HELD_ORDERS');

  const assignmentService = createAdminService({ execute: async () => { throw { number: 50071 }; } });
  await assert.rejects(assignmentService.createAssignment(1, { userId: 5, cinemaId: 1 }), (error) => error.status === 400 && error.code === 'ASSIGNMENT_MANAGER_REQUIRED');
});

test('cinema image writes use route-scoped, typed stored-procedure parameters', async () => {
  const calls = [];
  const service = createAdminService({ execute: async (key, params) => { calls.push({ key, params }); return { recordset: [{ HinhAnhRapID: 6 }] }; } });
  const input = cinemaImageWrite({ url: '/uploads/cinema.jpg', description: '', cover: true, displayOrder: 0, status: 'Hoạt động' }, true);
  await service.createCinemaImage(1, 7, input);
  await service.setCinemaImageCover(1, 7, 6, true);
  assert.equal(calls[0].key, 'ADMIN_CINEMA_IMAGE_CREATE');
  assert.equal(calls[0].params.RapID.value, 7);
  assert.equal(calls[0].params.LaAnhDaiDien.value, true);
  assert.equal(calls[1].key, 'ADMIN_CINEMA_IMAGE_SET_COVER');
  assert.equal(calls[1].params.HinhAnhRapID.value, 6);
  assert.throws(() => cinemaImageWrite({ url: 'not-a-url', displayOrder: 0, status: 'Hoạt động' }), HttpError);
  assert.throws(() => cinemaImageWrite({ url: 'https://example.invalid/a.jpg', displayOrder: -1, status: 'Hoạt động' }), HttpError);
});

test('BUG-001/R3B: admin cinema list binds only the authenticated ActorID', async () => {
  const cinema = { RapID: 1, TenRap: 'Cinema', DiaChi: 'Address', ThanhPho: 'City', SoDienThoai: null, MoTa: null, NgayHoatDong: null, TrangThai: 'Hoạt động' };
  const service = createAdminService({ execute: async (key, params) => {
    if (key === 'ADMIN_CINEMA_LIST') {
      assert.deepEqual(Object.keys(params), ['ActorID']);
      assert.equal(params.ActorID.value, 1);
    }
    return { recordsets: [[cinema]] };
  } });
  assert.deepEqual(await service.cinemas(1), [cinema]);
});

test('BUG-003: image create and set-cover return the final image row of their procedure', async () => {
  const image = (id, cover) => ({ HinhAnhRapID: id, RapID: 7, URL: 'https://example.invalid/a.jpg', MoTa: null, LaAnhDaiDien: cover, ThuTuHienThi: 0, TrangThai: 'Hoạt động', NgayTao: 'now' });
  const service = createAdminService({ execute: async (key) => ({ recordsets: [[key === 'ADMIN_CINEMA_IMAGE_CREATE' ? image(21, true) : image(22, true)]] }) });
  const created = await service.createCinemaImage(1, 7, cinemaImageWrite({ url: 'https://example.invalid/a.jpg', cover: true, displayOrder: 0 }, true));
  assert.deepEqual(Object.keys(created), ['HinhAnhRapID', 'RapID', 'URL', 'MoTa', 'LaAnhDaiDien', 'ThuTuHienThi', 'TrangThai', 'NgayTao']);
  assert.equal(created.HinhAnhRapID, 21);
  assert.equal((await service.setCinemaImageCover(1, 7, 22, true)).HinhAnhRapID, 22);
});

test('BUG-003: write() reads the first result set, so image procedures must emit only the final DTO', () => {
  for (const name of ['usp_Admin_CinemaImage_Create', 'usp_Admin_CinemaImage_SetCover']) {
    const sql = readFileSync(new URL(`../../database/08_procedures/admin/${name}.sql`, import.meta.url), 'utf8');
    const start = sql.indexOf(`CREATE OR ALTER PROCEDURE dbo.${name}`);
    assert.notEqual(start, -1, `${name} missing from baseline`);
    const body = sql.slice(start, sql.indexOf('\nGO', start));
    // Result-set-producing statements: SELECT that does not assign to a variable.
    const resultSets = body.split('\n').map((line) => line.trim()).filter((line) => /^SELECT\s/i.test(line) && !/^SELECT\s+@/i.test(line));
    assert.equal(resultSets.length, 1, `${name} must emit exactly one result set`);
    assert.match(resultSets[0], /^SELECT HinhAnhRapID, RapID, URL, MoTa, LaAnhDaiDien/);
    assert.match(body, /SELECT @LockedImageID = HinhAnhRapID FROM dbo\.HINHANH_RAPCHIEUPHIM WITH \(UPDLOCK, HOLDLOCK\)/);
  }
});

test('BUG-002: cinema image status must be in the whitelist for create and update', () => {
  assert.deepEqual(CINEMA_IMAGE_STATUSES, ['Hoạt động', 'Tạm ẩn']);
  const base = { url: 'https://example.invalid/a.jpg', displayOrder: 0 };
  for (const create of [true, false]) {
    for (const status of CINEMA_IMAGE_STATUSES) assert.equal(cinemaImageWrite({ ...base, status }, create).status, status);
    for (const status of ['INVALID_AUDIT', 'hoạt động', '']) {
      assert.throws(() => cinemaImageWrite({ ...base, status }, create), (error) => error.status === 400 && error.code === 'INVALID_REQUEST');
    }
  }
  assert.equal(cinemaImageWrite(base, true).status, undefined); // create falls back to the service default
  assert.throws(() => cinemaImageWrite(base, false), HttpError);
  assert.throws(() => cinemaImageWrite({ ...base, status: 'INVALID_AUDIT' }, true), /status must be one of: Hoạt động, Tạm ẩn/);
});

// SQL error number -> [HTTP status, error code] for every business error an admin procedure can throw.
const ADMIN_ERROR_TABLE = {
  50120: [409, 'SHOWTIME_HAS_ORDERS'], 50123: [409, 'SHOWTIME_CANCEL_ROUTE_REQUIRED'], 50216: [400, 'SHOWTIME_TIME_INVALID'],
  50400: [400, 'INVALID_BIRTH_DATE'], 50401: [409, 'ASSIGNMENT_DUPLICATE'], 50403: [404, 'USER_NOT_FOUND'],
  50300: [401, 'ACCOUNT_UNAVAILABLE'], 50301: [403, 'FORBIDDEN'], 50302: [403, 'FORBIDDEN'],
  50001: [409, 'SHOWTIME_OVERLAP'], 50056: [404, 'ROOM_NOT_FOUND'], 50058: [404, 'SHOWTIME_NOT_FOUND'],
  50070: [409, 'EMAIL_ALREADY_EXISTS'], 50071: [400, 'ASSIGNMENT_MANAGER_REQUIRED'], 50072: [409, 'PROMOTION_CODE_EXISTS'],
  50090: [404, 'ROLE_NOT_FOUND'], 50091: [409, 'ROLE_IN_USE'], 50092: [409, 'PERMISSION_CODE_EXISTS'],
  50093: [404, 'PERMISSION_NOT_FOUND'], 50094: [409, 'PERMISSION_IN_USE'], 50095: [404, 'CINEMA_NOT_FOUND'],
  50096: [409, 'CINEMA_HAS_DEPENDENCIES'], 50097: [409, 'GENRE_ALREADY_EXISTS'], 50098: [404, 'GENRE_NOT_FOUND'],
  50099: [409, 'GENRE_IN_USE'], 50100: [404, 'ACTOR_NOT_FOUND'], 50101: [409, 'ACTOR_IN_USE'],
  50102: [404, 'MOVIE_NOT_FOUND'], 50103: [400, 'MOVIE_CAST_INVALID'], 50104: [409, 'MOVIE_HAS_DEPENDENCIES'],
  50105: [404, 'PRODUCT_NOT_FOUND'], 50106: [409, 'PRODUCT_IN_USE'], 50107: [404, 'PROMOTION_NOT_FOUND'],
  50108: [409, 'PROMOTION_IN_USE'], 50116: [404, 'SHOWTIME_NOT_FOUND'], 50117: [409, 'SHOWTIME_ALREADY_CANCELLED'],
  50118: [409, 'SHOWTIME_HAS_HELD_ORDERS'], 50200: [404, 'CINEMA_NOT_FOUND'], 50201: [409, 'ROOM_NAME_CONFLICT'],
  50202: [404, 'ROOM_NOT_FOUND'], 50203: [409, 'ROOM_HAS_SHOWTIMES'], 50204: [404, 'ROOM_NOT_FOUND'],
  50205: [409, 'SEAT_POSITION_CONFLICT'], 50206: [404, 'SEAT_NOT_FOUND'], 50207: [409, 'SEAT_HAS_TICKET_HISTORY'],
  50208: [404, 'CINEMA_NOT_FOUND'], 50209: [400, 'PRICING_INVALID'], 50210: [404, 'PRICING_NOT_FOUND'],
  50211: [400, 'SHOWTIME_TIME_INVALID'], 50212: [404, 'ASSIGNMENT_NOT_FOUND'], 50213: [400, 'ASSIGNMENT_PERIOD_INVALID'],
  50214: [404, 'ROLE_NOT_FOUND'], 50215: [409, 'PRICING_OVERLAP'], 50220: [400, 'CINEMA_IMAGE_URL_REQUIRED'], 50221: [400, 'CINEMA_IMAGE_ORDER_INVALID'],
  50230: [404, 'CINEMA_IMAGE_NOT_FOUND'], 50232: [409, 'CINEMA_IMAGE_INACTIVE'],
};

function mapped(error) {
  try { mapAdminProcedureError(error); } catch (thrown) { return thrown; }
  return undefined;
}

test('every admin business error number maps to its expected HTTP status and code', () => {
  for (const [number, [status, code]] of Object.entries(ADMIN_ERROR_TABLE)) {
    for (const error of [{ number: Number(number) }, { originalError: { info: { number: Number(number) } } }]) {
      const result = mapped(error);
      assert.ok(result instanceof HttpError, `error ${number} is not mapped`);
      assert.equal(result.status, status, `error ${number} status`);
      assert.equal(result.code, code, `error ${number} code`);
    }
  }
});

test('unknown SQL errors are not swallowed and HttpErrors pass through', () => {
  const unknown = { number: 8134 };
  assert.equal(mapped(unknown), unknown);
  const http = new HttpError(418, 'TEAPOT', 'x');
  assert.equal(mapped(http), http);
});

test('regression guard: every error number thrown by an admin SQL source is mapped', () => {
  const sources = readdirSync(new URL('../../database/08_procedures/admin/', import.meta.url))
    .filter(name=>name.endsWith('.sql')).map(name=>`08_procedures/admin/${name}`);
  const thrown = new Set();
  for (const file of sources) {
    const sql = readFileSync(new URL(`../../database/${file}`, import.meta.url), 'utf8');
    for (const match of sql.matchAll(/THROW\s+(5\d{4})\s*,/g)) thrown.add(Number(match[1]));
  }
  assert.ok(thrown.size >= 40, 'expected to find the admin error numbers in the SQL sources');
  const unmapped = [...thrown].filter((number) => !(number in ADMIN_ERROR_TABLE) || !(mapped({ number }) instanceof HttpError));
  assert.deepEqual(unmapped, [], `unmapped admin SQL errors: ${unmapped.join(', ')}`);
});

test('set movie cast maps procedure errors to business HTTP errors', async () => {
  const missing = createAdminService({ execute: async () => { throw { number: 50102 }; } });
  await assert.rejects(missing.setMovieActors(1, 9, []), (error) => error.status === 404 && error.code === 'MOVIE_NOT_FOUND');
  const invalid = createAdminService({ execute: async () => { throw { number: 50103 }; } });
  await assert.rejects(invalid.setMovieActors(1, 9, []), (error) => error.status === 400 && error.code === 'MOVIE_CAST_INVALID');
});

test('cinema deletion blockers are business errors, not 500s', async () => {
  for (const [number, status, code] of [[50095, 404, 'CINEMA_NOT_FOUND'], [50096, 409, 'CINEMA_HAS_DEPENDENCIES']]) {
    const service = createAdminService({ execute: async () => { throw { number }; } });
    await assert.rejects(service.deleteCinema(1, 1), (error) => error.status === status && error.code === code);
  }
});

test('showtime create and update map procedure errors and keep the success result untouched', async () => {
  const input = { movieId: 1, roomId: 2, startsAt: '2031-01-01T10:00:00Z', endsAt: '2031-01-01T12:00:00Z', format: '2D', basePrice: 50000, status: 'Mở bán' };
  const result = { recordsets: [[{ SuatChieuID: 5 }]] };
  const ok = createAdminService({ execute: async () => result });
  assert.equal(await ok.createShowtime(1, input), result);
  assert.equal(await ok.updateShowtime(1, 5, input), result);
  for (const [number, status, code] of [[50001, 409, 'SHOWTIME_OVERLAP'], [50056, 404, 'ROOM_NOT_FOUND'], [50058, 404, 'SHOWTIME_NOT_FOUND'], [50211, 400, 'SHOWTIME_TIME_INVALID']]) {
    const failing = createAdminService({ execute: async () => { throw { number }; } });
    await assert.rejects(failing.createShowtime(1, input), (error) => error.status === status && error.code === code);
    await assert.rejects(failing.updateShowtime(1, 5, input), (error) => error.status === status && error.code === code);
  }
});

// Native SQL Server constraint errors: fixed client messages, never table/constraint names.
const SQL_ERROR_CASES = [
  ['unique key (2627)', { number: 2627, message: 'Violation of UNIQUE KEY constraint \'UQ_NGUOIDUNG_SoDienThoai\'. Cannot insert duplicate key in object \'dbo.NGUOIDUNG\'.' }, 409, 'DUPLICATE_RECORD'],
  ['unique index (2601)', { number: 2601, message: 'Cannot insert duplicate key row in object \'dbo.HINHANH_RAPCHIEUPHIM\' with unique index \'UX_HINHANH_RAPCHIEUPHIM_Rap_Cover\'.' }, 409, 'DUPLICATE_RECORD'],
  ['2627 via originalError', { originalError: { info: { number: 2627 }, message: 'Violation of UNIQUE KEY constraint \'UQ_QUYEN_MaQuyen\'.' } }, 409, 'DUPLICATE_RECORD'],
  ['547 DELETE', { number: 547, message: 'The DELETE statement conflicted with the REFERENCE constraint "FK_VAITRO_QUYEN_QUYEN". The conflict occurred in database "CinemaBookingDB", table "dbo.VAITRO_QUYEN", column \'QuyenID\'.' }, 409, 'RECORD_IN_USE'],
  ['547 INSERT', { number: 547, message: 'The INSERT statement conflicted with the FOREIGN KEY constraint "FK_VAITRO_QUYEN_QUYEN". The conflict occurred in database "CinemaBookingDB", table "dbo.QUYEN", column \'QuyenID\'.' }, 400, 'INVALID_REFERENCE'],
  ['547 UPDATE CHECK', { number: 547, message: 'The UPDATE statement conflicted with the CHECK constraint "CK_RAPCHIEUPHIM_TrangThai". The conflict occurred in database "CinemaBookingDB", table "dbo.RAPCHIEUPHIM", column \'TrangThai\'.' }, 400, 'INVALID_REFERENCE'],
  ['547 unrecognised statement', { number: 547, message: 'Some localised text about constraint "CK_X" on table "dbo.Y".' }, 400, 'INVALID_REFERENCE'],
  ['547 without message', { number: 547 }, 400, 'INVALID_REFERENCE'],
];

test('native SQL constraint errors map to fixed 4xx responses without leaking schema names', () => {
  for (const [label, error, status, code] of SQL_ERROR_CASES) {
    const result = mapped(error);
    assert.ok(result instanceof HttpError, `${label} is not mapped`);
    assert.equal(result.status, status, `${label} status`);
    assert.equal(result.code, code, `${label} code`);
    assert.doesNotMatch(result.message, /dbo|FK_|UQ_|CK_|UX_|constraint|table|column|statement|NGUOIDUNG|QUYEN|VAITRO|RAPCHIEUPHIM/i, `${label} message leaks schema details`);
  }
});

test('business 50xxx errors keep their mapping even if the SQL message looks like a constraint error', () => {
  for (const [number, [status, code]] of Object.entries(ADMIN_ERROR_TABLE)) {
    const result = mapped({ number: Number(number), message: 'The DELETE statement conflicted with the REFERENCE constraint "FK_X".' });
    assert.equal(result.status, status);
    assert.equal(result.code, code);
  }
});

test('writes that bypass write() still get constraint errors mapped', async () => {
  const fk = { number: 547, message: 'The INSERT statement conflicted with the FOREIGN KEY constraint "FK_VAITRO_QUYEN_QUYEN".' };
  const service = createAdminService({ execute: async () => { throw fk; }, executeWithOutputs: async () => { throw fk; } });
  const movie = { title: 'T', durationMinutes: 90, releaseDate: '2031-01-01', genreIds: [999999] };
  await assert.rejects(service.setRolePermissions(1, 1, [999999]), (error) => error.status === 400 && error.code === 'INVALID_REFERENCE');
  await assert.rejects(service.createMovie(1, movie), (error) => error.status === 400 && error.code === 'INVALID_REFERENCE');
  await assert.rejects(service.updateMovie(1, 1, { ...movie, status: 'Đang chiếu' }), (error) => error.status === 400 && error.code === 'INVALID_REFERENCE');
  await assert.rejects(createAdminService({ execute: async () => { throw { number: 2627 }; } }).createUser(1, { name: 'N', email: 'a@b.invalid', password: 'StrongPass1!', roleId: 2 }), (error) => error.status === 409 && error.code === 'DUPLICATE_RECORD');
});

test('promotion validator: percent discounts are limited to (0, 99], fixed discounts only need to be positive', () => {
  const base = { code: 'AUDIT1', startsAt: '2030-01-01T00:00:00Z', endsAt: '2031-01-01T00:00:00Z', quantity: 5 };
  for (const [discountType, discountValue] of [['Phần trăm', 99], ['Phần trăm', 0.5], ['PERCENT', 10], ['Số tiền', 5000000], ['FIXED', 100000]]) {
    assert.equal(promotionWrite({ ...base, discountType, discountValue }, true).discountValue, discountValue);
  }
  for (const [discountType, discountValue] of [['Phần trăm', 100], ['Phần trăm', 150], ['PERCENT', 99.01], ['Phần trăm', 1e15]]) {
    assert.throws(() => promotionWrite({ ...base, discountType, discountValue }, true), (error) => error.status === 400 && /at most 99/.test(error.message));
  }
  for (const discountValue of [0, -5]) assert.throws(() => promotionWrite({ ...base, discountType: 'Phần trăm', discountValue }, true), { status: 400 });
  // update shape applies the same rule
  const update = { description: 'x', discountType: 'Phần trăm', discountValue: 100, startsAt: base.startsAt, endsAt: base.endsAt, quantity: 5, status: 'Hoạt động' };
  assert.throws(() => promotionWrite(update), { status: 400 });
  assert.equal(promotionWrite({ ...update, discountValue: 99 }).discountValue, 99);
});
