import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminService } from '../src/services/adminService.js';
import { assignmentFilters, cinemaImageWrite, movieFilters, revenueFilters, userFilters } from '../src/validators/adminValidator.js';
import { HttpError } from '../src/utils/httpError.js';
import { requireAdmin } from '../src/middleware/requireAdmin.js';
import { PROCEDURES } from '../src/db/procedures.js';

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
  assert.deepEqual(await service.users({ roleId: 2, status: 'active', search: 'Mai' }), [{ id: 3 }]);
  assert.equal(calls[0].key, 'ADMIN_USER_LIST');
  assert.equal(calls[0].params.VaiTroID.value, 2);
  assert.equal(calls[0].params.SearchTerm.value, 'Mai');
  assert.deepEqual(await service.revenue({ fromDate: '2026-01-01', toDate: '2026-01-31' }), {
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
  await service.createUser({ name: 'Portal Test', email: 'portal-test@example.invalid', password: 'StrongPass1!', phone: null, roleId: 2 });
  assert.equal(calls[0].key, 'ADMIN_USER_CREATE');
  assert.notEqual(calls[0].params.MatKhauHash.value, 'StrongPass1!');
  assert.match(calls[0].params.MatKhauHash.value, /^\$2[aby]\$/);
  await service.setRolePermissions(2, [14, 15]);
  assert.equal(calls[1].key, 'ADMIN_ROLE_PERMISSION_SET');
  assert.equal(calls[1].params.QuyenIdList.value, '14,15');
  await service.rooms({ cinemaId: 99 });
  assert.equal(calls[2].key, 'ADMIN_ROOM_LIST');
  assert.equal(calls[2].params.RapID.value, 99);
});

test('admin maps seat history, held showtime, and assignment role SQL errors to business HTTP errors', async () => {
  const service = createAdminService({ execute: async () => { throw { number: 50207 }; } });
  await assert.rejects(service.deleteSeat(1), (error) => error.status === 409 && error.code === 'SEAT_HAS_TICKET_HISTORY');

  const heldShowtimeService = createAdminService({ execute: async () => { throw { originalError: { info: { number: 50118 } } }; } });
  await assert.rejects(heldShowtimeService.cancelShowtime(1), (error) => error.status === 409 && error.code === 'SHOWTIME_HAS_HELD_ORDERS');

  const assignmentService = createAdminService({ execute: async () => { throw { number: 50071 }; } });
  await assert.rejects(assignmentService.createAssignment({ userId: 5, cinemaId: 1 }), (error) => error.status === 400 && error.code === 'ASSIGNMENT_MANAGER_REQUIRED');
});

test('cinema image writes use route-scoped, typed stored-procedure parameters', async () => {
  const calls = [];
  const service = createAdminService({ execute: async (key, params) => { calls.push({ key, params }); return { recordset: [{ HinhAnhRapID: 6 }] }; } });
  const input = cinemaImageWrite({ url: '/uploads/cinema.jpg', description: '', cover: true, displayOrder: 0, status: 'Hoạt động' }, true);
  await service.createCinemaImage(7, input);
  await service.setCinemaImageCover(7, 6, true);
  assert.equal(calls[0].key, 'ADMIN_CINEMA_IMAGE_CREATE');
  assert.equal(calls[0].params.RapID.value, 7);
  assert.equal(calls[0].params.LaAnhDaiDien.value, true);
  assert.equal(calls[1].key, 'ADMIN_CINEMA_IMAGE_SET_COVER');
  assert.equal(calls[1].params.HinhAnhRapID.value, 6);
  assert.throws(() => cinemaImageWrite({ url: 'not-a-url', displayOrder: 0, status: 'Hoạt động' }), HttpError);
  assert.throws(() => cinemaImageWrite({ url: 'https://example.invalid/a.jpg', displayOrder: -1, status: 'Hoạt động' }), HttpError);
});
