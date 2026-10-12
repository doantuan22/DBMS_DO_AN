import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import { createRoomsController } from '../src/features/admin-rooms/roomsController.js';
import { roomsView, parseRoomsQuery, roomSeatsPath, resolveSeatRoom, validateRoom, roomValues, sameRoomsScope } from '../src/features/admin-rooms/roomsModel.js';
import { draftNavigationAllowed } from '../src/features/staff-bookings/useBookingDraftGuard.js';
import { ROOM_TYPES, RESOURCE_STATUSES } from '../../shared/resourceContract.mjs';

const actor = (codes = ['QL_PHONG', 'QL_RAP', 'QL_GHE'], role = 'ADMIN') => ({ userId: 11, role, permissions: codes.map((code) => ({ code })) });
const cinemas = [{ RapID: 1, TenRap: 'Rạp A' }, { RapID: 2, TenRap: 'Rạp B' }, { RapID: 3, TenRap: 'Rạp chưa có phòng' }];
const room = (id = 101, cinemaId = 1, patch = {}) => ({ PhongID: id, RapID: cinemaId, TenRap: `Rạp ${cinemaId === 1 ? 'A' : 'B'}`, TenPhong: `Phòng ${id}`, LoaiPhong: '2D', TongSoGhe: 81, TrangThai: 'Hoạt động', ...patch });
function fixture({ user = actor(), rows = [room(), room(102), room(201, 2)], query = 'cinemaId=1', overrides = {} } = {}) {
  let data = rows.map((row) => ({ ...row }));
  const calls = [], urls = [];
  const api = {
    cinemas: async () => { calls.push(['cinemas']); return { cinemas }; },
    rooms: async (params) => { calls.push(['rooms', params]); return { rooms: data.filter((row) => !params?.cinemaId || String(row.RapID) === String(params.cinemaId)) }; },
    create: async (path, body) => { calls.push(['create', path, body]); data.push(room(900, body.cinemaId, { TenPhong: body.name, LoaiPhong: body.type, TongSoGhe: 0 })); return { room: data.at(-1) }; },
    update: async (path, body) => { calls.push(['update', path, body]); data = data.map((row) => path === `rooms/${row.PhongID}` ? { ...row, TenPhong: body.name, LoaiPhong: body.type, TrangThai: body.status } : row); return { room: data.find((row) => path === `rooms/${row.PhongID}`) }; },
    remove: async (path) => { calls.push(['remove', path]); data = data.filter((row) => path !== `rooms/${row.PhongID}`); return { result: { Deleted: true, Deactivated: false, Message: 'Đã xóa phòng.' } }; },
    ...overrides,
  };
  return { controller: createRoomsController({ api, user, initialQuery: query, onQueryChange: (query) => urls.push(query) }), calls, urls };
}
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

test('cinema-first workspace calls only scoped Rooms and reads real seat counts including zero', async () => {
  const { controller, calls } = fixture({ query: '' }); await controller.start();
  assert.deepEqual(calls, [['cinemas']]); assert.equal(controller.getSnapshot().resource.status, 'idle');
  await controller.selectCinema('1');
  assert.deepEqual(calls.at(-1), ['rooms', { cinemaId: '1' }]);
  assert.equal(roomsView(controller.getSnapshot()).total, 2);
  assert.equal(roomsView(controller.getSnapshot()).rows[0].TongSoGhe, 81);
  await controller.selectCinema('3'); assert.equal(roomsView(controller.getSnapshot()).total, 0);
});

test('missing QL_RAP uses authorized complete Rooms names; QL_PHONG/role remain mandatory', async () => {
  const limited = fixture({ user: actor(['QL_PHONG']) }); await limited.controller.start();
  assert.equal(limited.calls.some(([method]) => method === 'cinemas'), false);
  assert.equal(limited.controller.getSnapshot().lookup.limited, true);
  assert.deepEqual(limited.controller.getSnapshot().lookup.rows.map((row) => row.RapID), [1, 2]);
  for (const user of [actor([]), actor(['QL_PHONG'], 'QUAN_LY_RAP')]) {
    const denied = fixture({ user }); await denied.controller.start(); denied.controller.openCreate(); await denied.controller.save();
    assert.equal(denied.calls.length, 0); assert.equal(denied.controller.getSnapshot().lookup.error.status, 403);
    assert.equal(denied.controller.getSnapshot().editor, null);
  }
});

test('cinema A -> B -> A clears visible old rows synchronously and ignores both late earlier responses', async () => {
  const pending = [];
  const { controller } = fixture({ query: '', overrides: { rooms: ({ cinemaId }) => { const entry = deferred(); pending.push({ ...entry, cinemaId }); return entry.promise; } } });
  await controller.start();
  const a = controller.selectCinema('1'), b = controller.selectCinema('2'), a2 = controller.selectCinema('1');
  assert.equal(controller.getSnapshot().resource.status, 'loading'); assert.deepEqual(roomsView(controller.getSnapshot()).rows, []);
  pending[2].resolve({ rooms: [room(103, 1, { TenPhong: 'A mới' })] }); await a2;
  pending[0].resolve({ rooms: [room(101, 1, { TenPhong: 'A cũ' })] }); await a;
  pending[1].resolve({ rooms: [room(201, 2)] }); await b;
  assert.equal(roomsView(controller.getSnapshot()).rows[0].TenPhong, 'A mới');
});

test('route disposal ignores a late read and wrong-scope API payload becomes an error', async () => {
  const request = deferred(); const { controller } = fixture({ query: '', overrides: { rooms: () => request.promise } });
  await controller.start(); const read = controller.selectCinema('1'); controller.dispose();
  const snapshot = controller.getSnapshot(); request.resolve({ rooms: [room()] }); await read; assert.equal(controller.getSnapshot(), snapshot);
  const mismatched = fixture({ overrides: { rooms: async () => ({ rooms: [room(201, 2)] }) } }); await mismatched.controller.start();
  assert.equal(mismatched.controller.getSnapshot().resource.status, 'error'); assert.equal(roomsView(mismatched.controller.getSnapshot()).total, 0);
});

test('search/type/status filter complete scoped rows before pagination; STT and URL page use filtered dataset', async () => {
  const rows = Array.from({ length: 31 }, (_, index) => room(index + 1, 1, { TenPhong: `Phòng ${index + 1}`, LoaiPhong: index % 2 ? '3D' : '2D' }));
  const { controller, calls, urls } = fixture({ rows }); await controller.start();
  controller.setFilters({ type: '2D', status: 'Hoạt động' }); controller.applyFilters();
  controller.setPage(2); let view = roomsView(controller.getSnapshot());
  assert.equal(view.total, 16); assert.equal(view.rows[0].TenPhong, 'Phòng 21'); assert.equal(view.rows.length, 6); assert.equal(view.page, 2);
  assert.match(urls.at(-1), /page=2/); assert.equal(calls.filter(([name]) => name === 'rooms').length, 1);
  controller.setFilters({ search: 'phong 31' }); controller.applyFilters(); view = roomsView(controller.getSnapshot());
  assert.equal(view.total, 1); assert.equal(view.rows[0].TenPhong, 'Phòng 31'); assert.equal(view.page, 1);
  controller.resetFilters(); assert.equal(roomsView(controller.getSnapshot()).total, 31); assert.equal(controller.getSnapshot().cinemaId, '1');
  controller.setPageSize(20); assert.equal(roomsView(controller.getSnapshot()).rows.length, 20);
});

test('query reload/back restores filters/page, invalid cinema becomes 404 without fetching it', async () => {
  const { controller } = fixture({ query: 'cinemaId=1&q=Ph%C3%B2ng&type=2D&page=99' }); await controller.start();
  assert.equal(controller.getSnapshot().page, 1);
  await controller.syncQuery('cinemaId=2'); assert.equal(controller.getSnapshot().resource.rows[0].RapID, 2);
  await controller.syncQuery('cinemaId=1&q=101'); assert.equal(roomsView(controller.getSnapshot()).total, 1);
  const invalid = fixture({ query: 'cinemaId=999' }); await invalid.controller.start();
  assert.equal(invalid.controller.getSnapshot().resource.error.status, 404);
  assert.equal(invalid.calls.some(([method]) => method === 'rooms'), false);
  assert.equal(parseRoomsQuery('status=MadeUp&type=Fake&page=-2&pageSize=999').applied.status, '');
  assert.equal(parseRoomsQuery('status=MadeUp&type=Fake&page=-2&pageSize=999').pageSize, 10);
});

test('Vietnamese room search folds uppercase Đ and accents, without searching internal identifiers', async () => {
  const { controller } = fixture({ rows: [room(901, 1, { TenPhong: 'Phòng Đặc Biệt' })] }); await controller.start();
  controller.setFilters({ search: 'PHONG DAC BIET' }); controller.applyFilters();
  assert.equal(roomsView(controller.getSnapshot()).total, 1);
  controller.setFilters({ search: '901' }); controller.applyFilters();
  assert.equal(roomsView(controller.getSnapshot()).total, 0);
});

test('dirty editor Cancel retains fields/context, Confirm switches scope; same-cinema filters keep draft', async () => {
  const { controller } = fixture(); await controller.start(); controller.openEdit(room()); controller.changeField('name', 'Tên chưa lưu');
  controller.setFilters({ search: 'no match' }); controller.applyFilters(); assert.equal(controller.getSnapshot().editor.values.name, 'Tên chưa lưu');
  controller.selectCinema('2'); assert.equal(controller.getSnapshot().confirmation.kind, 'cinema');
  controller.cancelDiscard(); assert.equal(controller.getSnapshot().cinemaId, '1'); assert.equal(controller.getSnapshot().editor.values.name, 'Tên chưa lưu');
  controller.closeEditor(); assert.equal(controller.getSnapshot().confirmation.kind, 'close'); controller.cancelDiscard();
  controller.selectCinema('2'); await controller.confirmDiscard();
  assert.equal(controller.getSnapshot().editor, null); assert.equal(controller.getSnapshot().dirty, false);
  assert.equal(controller.getSnapshot().resource.rows[0].RapID, 2);
});

test('create uses numeric real cinema ID and supported fields; update keeps cinema immutable', async () => {
  const { controller, calls } = fixture(); await controller.start(); controller.openCreate();
  controller.changeField('name', '  Phòng mới  '); controller.changeField('type', 'IMAX'); await controller.save();
  assert.deepEqual(calls.find(([name]) => name === 'create'), ['create', 'rooms', { cinemaId: 1, name: 'Phòng mới', type: 'IMAX' }]);
  assert.equal(controller.getSnapshot().editor, null); assert.equal(roomsView(controller.getSnapshot()).total, 3);
  assert.equal(controller.getSnapshot().resource.rows.at(-1).TongSoGhe, 0);
  controller.openEdit(room()); controller.changeField('name', 'Phòng sửa'); controller.changeField('status', 'Bảo trì');
  controller.changeField('cinemaId', '2'); await controller.save();
  assert.deepEqual(calls.find(([name]) => name === 'update'), ['update', 'rooms/101', { name: 'Phòng sửa', type: '2D', status: 'Bảo trì' }]);
});

test('validation blocks empty/oversize names, unsupported types/status and foreign room mutations', async () => {
  assert.ok(validateRoom({ name: ' ', type: '2D', status: 'Hoạt động' }, false).name);
  assert.ok(validateRoom({ name: 'a'.repeat(101), type: 'Unknown', status: 'Unknown' }, true).status);
  const { controller, calls } = fixture(); await controller.start(); controller.openCreate(); await controller.save();
  assert.equal(calls.some(([name]) => name === 'create'), false); assert.ok(controller.getSnapshot().editor.errors.name);
  controller.closeEditor(); controller.openEdit(room(201, 2)); assert.equal(controller.getSnapshot().editor, null);
  controller.requestDelete(room(201, 2)); assert.equal(controller.getSnapshot().deleteTarget, null);
});

test('write lock prevents double-submit and cinema navigation while pending', async () => {
  const request = deferred(); let writes = 0;
  const { controller } = fixture({ overrides: { create: () => { writes++; return request.promise; } } });
  await controller.start(); controller.openCreate(); controller.changeField('name', 'Pending');
  const first = controller.save(); await controller.save(); controller.selectCinema('2'); controller.closeEditor();
  assert.equal(writes, 1); assert.equal(controller.getSnapshot().cinemaId, '1'); assert.equal(controller.getSnapshot().pending, true);
  request.resolve({ room: {} }); await first; assert.equal(controller.getSnapshot().pending, false);
});

test('save 403/404/409 errors preserve draft and expose the authoritative reason', async () => {
  for (const [status, code] of [[403, 'FORBIDDEN'], [404, 'ROOM_NOT_FOUND'], [409, 'ROOM_NAME_CONFLICT']]) {
    const { controller } = fixture({ overrides: { update: async () => { throw Object.assign(new Error('server denied'), { status, code }); } } });
    await controller.start(); controller.openEdit(room()); controller.changeField('name', 'Tên trùng'); await controller.save();
    assert.equal(controller.getSnapshot().editor.values.name, 'Tên trùng'); assert.equal(controller.getSnapshot().editor.error.status, status);
    assert.equal(controller.getSnapshot().dirty, true); assert.equal(controller.getSnapshot().pending, false);
    if (status === 409) assert.match(controller.getSnapshot().editor.error.message, /đã tồn tại/);
  }
});

test('delete Cancel makes no write; physical delete refreshes; historical deactivation retains row and server message', async () => {
  const normal = fixture(); await normal.controller.start(); normal.controller.requestDelete(room()); normal.controller.cancelDelete();
  assert.equal(normal.calls.some(([name]) => name === 'remove'), false);
  normal.controller.requestDelete(room()); await normal.controller.confirmDelete(); assert.equal(roomsView(normal.controller.getSnapshot()).total, 1);
  const historicalRow = room(101, 1, { TrangThai: 'Ngưng hoạt động' }); let removed = false;
  const historical = fixture({ overrides: {
    rooms: async () => ({ rooms: [removed ? historicalRow : room()] }),
    remove: async () => { removed = true; return { result: { Deleted: false, Deactivated: true, Message: 'Phòng có lịch sử suất chiếu đã chuyển sang Ngưng hoạt động.' } }; },
  } });
  await historical.controller.start(); historical.controller.requestDelete(room()); await historical.controller.confirmDelete();
  assert.equal(historical.controller.getSnapshot().resource.rows.length, 1); assert.equal(historical.controller.getSnapshot().resource.rows[0].TrangThai, 'Ngưng hoạt động');
  assert.match(historical.controller.getSnapshot().notice.text, /có lịch sử/);
});

test('delete 409 does not optimistically remove rows or close its confirmation', async () => {
  const { controller } = fixture({ overrides: { remove: async () => { throw Object.assign(new Error('Conflict'), { status: 409, code: 'ROOM_DELETE_CONFLICT' }); } } });
  await controller.start(); controller.requestDelete(room()); await assert.rejects(controller.confirmDelete(), (error) => error.status === 409 && /giữ nguyên/.test(error.message));
  assert.equal(controller.getSnapshot().resource.rows.length, 2); assert.equal(controller.getSnapshot().deleteTarget.PhongID, 101);
});

test('read and lookup 403/404/network errors never masquerade as empty rooms', async () => {
  for (const status of [403, 404, 500]) {
    const item = fixture({ overrides: { rooms: async () => { throw Object.assign(new Error('Read failed'), { status }); } } });
    await item.controller.start(); assert.equal(item.controller.getSnapshot().resource.status, 'error'); assert.equal(item.controller.getSnapshot().resource.error.status, status);
  }
  const lookup = fixture({ overrides: { cinemas: async () => { throw Object.assign(new Error('Denied'), { status: 403 }); } } });
  await lookup.controller.start(); assert.equal(lookup.controller.getSnapshot().lookup.status, 'error'); assert.equal(lookup.calls.some(([name]) => name === 'rooms'), false);
});

test('seat destination contains actual room/cinema IDs and rejects pairing a room to another cinema', () => {
  const row = room(); assert.equal(roomSeatsPath(row), '/admin/facilities/seats?cinemaId=1&roomId=101');
  assert.equal(resolveSeatRoom([row, room(201, 2)], '1', '101'), row);
  assert.equal(resolveSeatRoom([row, room(201, 2)], '2', '101'), undefined);
});

test('dirty navigation preserves same-cinema query history and asks before cinema/route departure; pending locks every destination', () => {
  let confirmations = 0;
  const options = { isSafeDestination: (destination) => sameRoomsScope(destination, '1'), confirm: () => { confirmations++; return false; } };
  assert.equal(draftNavigationAllowed({ dirty: true, pending: false }, '/admin/facilities/rooms?cinemaId=1&page=2', options), true);
  assert.equal(confirmations, 0);
  assert.equal(draftNavigationAllowed({ dirty: true, pending: false }, '/admin/facilities/rooms?cinemaId=2', options), false);
  assert.equal(draftNavigationAllowed({ dirty: true, pending: false }, roomSeatsPath(room()), options), false);
  assert.equal(confirmations, 2);
  assert.equal(draftNavigationAllowed({ dirty: false, pending: true }, '/admin/facilities/rooms?cinemaId=1', options), false);
});

let vite, RoomsView, RoomEditor, SectionRoute, AuthContext, AdminPortal;
before(async () => {
  vite = await createServer({ configFile: 'vite.config.js', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  ({ RoomsView, RoomEditor } = await vite.ssrLoadModule('/src/features/admin-rooms/AdminRooms.jsx'));
  ({ default: SectionRoute } = await vite.ssrLoadModule('/src/routes/AdminSectionRoute.jsx'));
  ({ AuthContext } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'));
  ({ default: AdminPortal } = await vite.ssrLoadModule('/src/pages/AdminPortal.jsx'));
});
after(async () => { await vite?.close(); });
const render = (element, user = actor(), path = '/admin/facilities/rooms') => renderToStaticMarkup(React.createElement(MemoryRouter,
  { initialEntries: [path] }, React.createElement(AuthContext.Provider, { value: { user } }, element)));

test('real Rooms route owns list-first UI and permission guard, replacing the generic create form', () => {
  const html = render(React.createElement(SectionRoute, { section: 'rooms' }));
  assert.match(html, /Phòng chiếu/); assert.match(html, /Tìm phòng chiếu/); assert.match(html, /Danh sách phòng/);
  assert.ok(html.indexOf('Tìm phòng chiếu') < html.indexOf('Danh sách phòng'));
  assert.doesNotMatch(html, /Mã rạp|PhongID|RapID|catalog-form/);
  for (const user of [actor([]), actor(['QL_PHONG'], 'QUAN_LY_RAP')]) assert.match(render(React.createElement(SectionRoute, { section: 'rooms' }), user), /Không có quyền truy cập/);
});

test('ResourceTable schema displays names, real seat count and all supported row actions without technical ID columns', async () => {
  const { controller } = fixture(); await controller.start();
  const html = render(React.createElement(RoomsView, { state: controller.getSnapshot(), controller }));
  for (const label of ['STT', 'Tên phòng', 'Rạp', 'Loại phòng', 'Số ghế', 'Trạng thái', 'Thao tác']) assert.ok(html.includes(`>${label}</th>`));
  assert.match(html, /81/); assert.match(html, /Phòng 101/); assert.match(html, /Xem sơ đồ ghế/);
  assert.match(html, /<details class="admin-rooms__danger-actions"><summary/);
  assert.match(html, /cinemaId=1&amp;roomId=101/); assert.doesNotMatch(html, /PhongID|RapID|TongSoGhe/);
  assert.doesNotMatch(html, /admin-room-editor/);
  const deniedSeats = fixture({ user: actor(['QL_PHONG', 'QL_RAP']) }); await deniedSeats.controller.start();
  assert.doesNotMatch(render(React.createElement(RoomsView, { state: deniedSeats.controller.getSnapshot(), controller: deniedSeats.controller })), /Xem sơ đồ ghế/);
});

test('drawer uses named read-only cinema, exact shared enum options, field errors and dialog semantics', () => {
  const values = roomValues(); const html = render(React.createElement(RoomEditor, {
    editor: { mode: 'edit', values, errors: { name: 'Nhập tên phòng.' }, row: room() }, cinemaName: 'Rạp A', pending: false,
    controller: { closeEditor() {}, save() {}, changeField() {} },
  }));
  assert.match(html, /ui-dialog--room-drawer/); assert.match(html, /aria-modal="true"/); assert.match(html, /readOnly=""[^>]*value="Rạp A"/);
  for (const option of [...ROOM_TYPES, ...RESOURCE_STATUSES.rooms]) assert.ok(html.includes(`>${option}</option>`));
  assert.match(html, /aria-invalid="true"/); assert.match(html, /Nhập tên phòng/);
  assert.doesNotMatch(html, /Mã rạp|type="number"|cinemaId/);
});

test('existing seats screen receives named bound room context without redesigning its legacy list', () => {
  const html = render(React.createElement(AdminPortal, { routeSection: 'seats', seatContext: { cinemaId: '1', roomId: '101', cinemaName: 'Rạp A', roomName: 'Phòng 101' } }), actor(), '/admin/facilities/seats?cinemaId=1&roomId=101');
  assert.match(html, /Rạp A · Phòng 101/); assert.match(html, /aria-label="Phòng" readOnly="" value="Phòng 101"/);
  assert.doesNotMatch(html, /aria-label="Mã phòng"/);
});
