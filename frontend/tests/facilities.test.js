import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import { createFacilityController } from '../src/features/facilities/facilityController.js';
import {
  seatRows,
  resourceView,
  validateFacility,
  facilityPayload,
  adminSeat,
  adminCinema,
  adminImage,
  freshFilters,
  facilityQuery,
  parseFacilityQuery,
  matchesResource,
} from '../src/features/facilities/facilityModel.js';
import { createManagerCinemaStore } from '../src/features/manager/managerCinemaStore.js';
import { loadOccupancy } from '../src/features/facilities/occupancyRead.js';

const cinemas = [
  { id: 1, name: 'Rạp A', city: 'A' },
  { id: 2, name: 'Rạp B', city: 'B' },
];
const room = (id, cinemaId = 1) => ({
  id,
  cinemaId,
  name: `Phòng ${id}`,
  type: '2D',
  status: 'Hoạt động',
  seatCount: 130,
});
const seat = (id, roomId = 11, patch = {}) => ({
  id,
  roomId,
  cinemaId: roomId === 22 ? 2 : 1,
  row: 'A',
  number: id,
  label: `A${id}`,
  type: 'Thường',
  status: 'Hoạt động',
  ...patch,
});
const image = (id, cinemaId = 1) => ({
  id,
  cinemaId,
  url: '/test-image.jpg',
  description: `Ảnh ${id}`,
  displayOrder: id,
  status: 'Hoạt động',
  cover: false,
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

test('cinema optional empty fields follow REST nullable contract and occupancy mode survives query reload', async () => {
  assert.deepEqual(
    facilityPayload('cinemas', { name: ' Test ', phone: '', description: ' ', operatingSince: '' }),
    { name: 'Test', phone: null, description: null },
  );
  const item = fixture();
  await item.controller.start();
  item.controller.setMode('occupancy');
  assert.equal(parseFacilityQuery(facilityQuery(item.controller.getSnapshot())).mode, 'occupancy');
  const denied = fixture({ overrides: { canShowtimes: false } });
  await denied.controller.start();
  denied.controller.syncQuery('cinemaId=1&roomId=11&mode=occupancy');
  assert.equal(denied.controller.getSnapshot().mode, 'configuration');
  assert.equal(denied.controller.getSnapshot().notice.error.status, 403);
});

test('cinema search matches the name, address, and city promised by its placeholder', () => {
  const row = adminCinema({
    RapID: 7,
    TenRap: 'Rạp Trung Tâm',
    DiaChi: '125 Nguyễn Huệ',
    ThanhPho: 'Hồ Chí Minh',
    TrangThai: 'Hoạt động',
  });
  for (const search of ['trung tam', 'nguyen hue', 'ho chi minh'])
    assert.equal(matchesResource(row, { search, city: '', status: '' }), true);
  assert.equal(matchesResource(row, { search: 'Đà Nẵng', city: '', status: '' }), false);
});

test('removing a facility chip updates only that applied condition and resets pagination', async () => {
  const item = fixture({ kind: 'rooms', query: 'cinemaId=1' });
  await item.controller.start();
  item.controller.setFilters({ type: '2D', status: 'Hoạt động' });
  item.controller.applyFilters();
  item.controller.setFilters({ search: 'draft room' });
  item.controller.setPage(1);
  item.controller.removeFilter('status');
  const state = item.controller.getSnapshot();
  assert.equal(state.applied.status, '');
  assert.equal(state.filters.status, '');
  assert.equal(state.filters.search, 'draft room');
  assert.equal(state.applied.type, '2D');
  assert.equal(state.page, 1);
});

test('occupancy validates paired showtime ownership before public read and rejects mismatched seats', async () => {
  const scope = { cinemaId: '1', roomId: '11' },
    showtimes = [{ id: 9, cinemaId: 1, roomId: 11 }];
  let reads = 0;
  const readSeats = async () => {
    reads++;
    return [seat(1)];
  };
  for (const other of [
    { cinemaId: '2', roomId: '11' },
    { cinemaId: '1', roomId: '22' },
  ]) {
    await assert.rejects(loadOccupancy({ scope: other, showtimeId: '9', showtimes, readSeats }), {
      status: 404,
    });
  }
  assert.equal(reads, 0);
  assert.equal((await loadOccupancy({ scope, showtimeId: '9', showtimes, readSeats })).length, 1);
  await assert.rejects(
    loadOccupancy({ scope, showtimeId: '9', showtimes, readSeats: async () => [seat(1, 22)] }),
    { status: 409 },
  );
  const request = deferred();
  let active = true;
  const pending = loadOccupancy({
    scope,
    showtimeId: '9',
    showtimes,
    readSeats: () => request.promise,
    accepts: () => active,
  });
  active = false;
  request.resolve([seat(1)]);
  assert.equal(await pending, undefined);
});

test('mode/showtime browser navigation guards dirty config and clears physical selection after confirm', async () => {
  const item = fixture();
  await item.controller.start();
  item.controller.select(seat(1));
  item.controller.openEditor(seat(1));
  item.controller.changeField('type', 'VIP');
  item.controller.syncQuery('cinemaId=1&roomId=11&mode=occupancy&showtimeId=9');
  assert.equal(item.controller.getSnapshot().mode, 'configuration');
  item.controller.cancelDiscard();
  assert.equal(item.controller.getSnapshot().dirty, true);
  item.controller.syncQuery('cinemaId=1&roomId=11&mode=occupancy&showtimeId=9');
  item.controller.confirmDiscard();
  assert.equal(item.controller.getSnapshot().mode, 'occupancy');
  assert.equal(item.controller.getSnapshot().showtimeId, '9');
  assert.equal(item.controller.getSnapshot().selection, null);
  assert.equal(item.controller.getSnapshot().editor, null);
});

test('late gallery mutation cannot refresh another route or publish success after disposal', async () => {
  const request = deferred();
  const item = fixture({
    kind: 'images',
    query: 'cinemaId=1',
    overrides: { save: () => request.promise },
  });
  await item.controller.start();
  item.controller.openEditor(image(1));
  item.controller.changeField('description', 'Updated');
  const pending = item.controller.save();
  item.controller.dispose();
  request.resolve({});
  await pending;
  assert.equal(item.calls.filter(([name]) => name === 'list').length, 1);
  assert.equal(item.controller.getSnapshot().notice, null);
});
function fixture({ kind = 'seats', query = 'cinemaId=1&roomId=11', overrides = {}, store } = {}) {
  const calls = [],
    urls = [];
  let rows =
    kind === 'seats'
      ? [seat(1), seat(2)]
      : kind === 'images'
        ? [image(1), image(2)]
        : kind === 'rooms'
          ? [room(11), room(12)]
          : cinemas;
  const adapter = {
    kind,
    allowed: true,
    canRooms: true,
    canShowtimes: true,
    can: () => true,
    cinemas: store ? store.getSnapshot().cinemas : undefined,
    managerCinemaId: store?.getSnapshot().cinemaId,
    listCinemas: async () => ({ rows: cinemas }),
    rooms: async (cinemaId) => {
      calls.push(['rooms', cinemaId]);
      return cinemaId === '1' ? [room(11), room(12)] : [room(22, 2)];
    },
    list: async (scope) => {
      calls.push(['list', { ...scope }]);
      return rows.filter((row) =>
        kind === 'seats'
          ? String(row.roomId) === scope.roomId
          : ['images', 'rooms'].includes(kind)
            ? String(row.cinemaId) === scope.cinemaId
            : true,
      );
    },
    save: async (scope, row, body) => {
      calls.push(['save', { ...scope }, row?.id, body]);
      return {};
    },
    remove: async (scope, row) => {
      calls.push(['remove', { ...scope }, row.id]);
      rows = rows.filter((item) => item.id !== row.id);
      return {};
    },
    cover: async (scope, row) => {
      calls.push(['cover', { ...scope }, row.id]);
      return {};
    },
    ...overrides,
  };
  return {
    adapter,
    controller: createFacilityController({
      adapter,
      initialQuery: query,
      managerStore: store,
      onQueryChange: (value) => urls.push(value),
    }),
    calls,
    urls,
  };
}

test('Admin seats load named hierarchy before exactly scoped seats; no global seat GET', async () => {
  const { controller, calls } = fixture();
  await controller.start();
  assert.deepEqual(calls, [
    ['rooms', '1'],
    ['list', { cinemaId: '1', roomId: '11' }],
  ]);
  assert.equal(resourceView(controller.getSnapshot()).total, 2);
  const initial = fixture({ query: '' });
  await initial.controller.start();
  assert.equal(initial.calls.length, 0);
});
test('lookup role/dependency denial and malformed/foreign pair never fetch seats', async () => {
  for (const overrides of [{ allowed: false }, { canRooms: false }]) {
    const item = fixture({ overrides });
    await item.controller.start();
    assert.equal(item.calls.length, 0);
    assert.equal(item.controller.getSnapshot().lookup.error.status, 403);
  }
  for (const query of [
    'cinemaId=1&roomId=22',
    'cinemaId=1&roomId=999',
    'roomId=11',
    'cinemaId=-2&roomId=11',
  ]) {
    const item = fixture({ query });
    await item.controller.start();
    assert.equal(
      item.calls.some(([name]) => name === 'list'),
      false,
    );
    assert.equal(
      (item.controller.getSnapshot().rooms.error ?? item.controller.getSnapshot().resource.error)
        .status,
      404,
    );
  }
});
test('room A1 -> A2 -> A1 responses use generations, clear old selection and reject late reads', async () => {
  const requests = [];
  const item = fixture({
    query: 'cinemaId=1',
    overrides: {
      list: (scope) => {
        const request = deferred();
        requests.push({ ...request, scope });
        return request.promise;
      },
    },
  });
  await item.controller.start();
  const first = item.controller.chooseRoom('11'),
    second = item.controller.chooseRoom('12'),
    third = item.controller.chooseRoom('11');
  assert.equal(item.controller.getSnapshot().resource.rows.length, 0);
  requests[2].resolve([seat(3)]);
  await third;
  requests[0].resolve([seat(1)]);
  await first;
  requests[1].resolve([seat(2, 12)]);
  await second;
  assert.equal(item.controller.getSnapshot().resource.rows[0].id, 3);
});
test('cinema A -> B -> A rejects old room and seat scope across parent switches', async () => {
  const item = fixture();
  await item.controller.start();
  item.controller.select(seat(1));
  await item.controller.chooseCinema('2');
  assert.equal(item.controller.getSnapshot().scope.roomId, '');
  assert.equal(item.controller.getSnapshot().selection, null);
  assert.deepEqual(resourceView(item.controller.getSnapshot()).all, []);
  item.controller.chooseRoom('11');
  assert.equal(item.controller.getSnapshot().scope.roomId, '');
  await item.controller.chooseCinema('1');
  await item.controller.chooseRoom('11');
  assert.equal(resourceView(item.controller.getSnapshot()).total, 2);
});
test('wrong-scope resource and disposed responses cannot publish into a new workspace', async () => {
  const bad = fixture({ overrides: { list: async () => [seat(9, 22)] } });
  await bad.controller.start();
  assert.equal(bad.controller.getSnapshot().resource.error.status, 409);
  const request = deferred(),
    item = fixture({ overrides: { list: () => request.promise } });
  const start = item.controller.start();
  await new Promise((resolve) => setImmediate(resolve));
  item.controller.dispose();
  const snapshot = item.controller.getSnapshot();
  request.resolve([seat(1)]);
  await start;
  assert.equal(item.controller.getSnapshot(), snapshot);
});
test('dirty Cancel/Confirm protects room switch and editor close, local filter keeps draft', async () => {
  const item = fixture();
  await item.controller.start();
  item.controller.openEditor(seat(1));
  item.controller.changeField('type', 'VIP');
  item.controller.setFilters({ search: 'missing' });
  item.controller.applyFilters();
  assert.equal(item.controller.getSnapshot().dirty, true);
  item.controller.chooseRoom('12');
  item.controller.cancelDiscard();
  assert.equal(item.controller.getSnapshot().scope.roomId, '11');
  assert.equal(item.controller.getSnapshot().editor.values.type, 'VIP');
  item.controller.closeEditor();
  item.controller.cancelDiscard();
  assert.ok(item.controller.getSnapshot().editor);
  item.controller.chooseRoom('12');
  await item.controller.confirmDiscard();
  assert.equal(item.controller.getSnapshot().editor, null);
  assert.equal(item.controller.getSnapshot().scope.roomId, '12');
});
test('seat payload keeps create room internally bound and update excludes row/number/room', async () => {
  const item = fixture();
  await item.controller.start();
  item.controller.openEditor();
  item.controller.changeField('row', ' B ');
  item.controller.changeField('number', '3');
  await item.controller.save();
  assert.deepEqual(item.calls.find(([name]) => name === 'save').slice(1), [
    { cinemaId: '1', roomId: '11' },
    undefined,
    { row: 'B', number: 3, type: 'Thường' },
  ]);
  item.controller.openEditor(seat(1));
  item.controller.changeField('roomId', '22');
  item.controller.changeField('row', 'Z');
  item.controller.changeField('type', 'VIP');
  await item.controller.save();
  assert.deepEqual(
    item.calls
      .filter(([name]) => name === 'save')
      .at(-1)
      .at(-1),
    { type: 'VIP', status: 'Hoạt động' },
  );
});
test('validation blocks invalid INT/type/status/url/order/name and does not issue writes', async () => {
  assert.ok(
    validateFacility('seats', { row: 'A', number: 2147483648, type: 'Fake' }, false).number,
  );
  assert.ok(
    validateFacility(
      'images',
      { url: 'javascript:x', displayOrder: -1, description: '', status: 'fake' },
      true,
    ).url,
  );
  assert.ok(
    validateFacility('rooms', { name: 'a'.repeat(101), type: 'fake', status: 'fake' }, true).name,
  );
  const item = fixture();
  await item.controller.start();
  item.controller.openEditor();
  await item.controller.save();
  assert.equal(
    item.calls.some(([name]) => name === 'save'),
    false,
  );
});
test('write lock prevents repeated submit, room/context change, and owns original payload', async () => {
  const request = deferred();
  let writes = 0;
  const item = fixture({
    overrides: {
      save: () => {
        writes++;
        return request.promise;
      },
    },
  });
  await item.controller.start();
  item.controller.openEditor(seat(1));
  const writing = item.controller.save();
  await item.controller.save();
  item.controller.chooseRoom('12');
  item.controller.chooseCinema('2');
  assert.equal(writes, 1);
  assert.equal(item.controller.getSnapshot().scope.roomId, '11');
  request.resolve({});
  await writing;
  assert.equal(item.controller.getSnapshot().pending, false);
});
test('history 409 and 403/404 preserve editor, selected seat and authoritative error', async () => {
  for (const [status, code] of [
    [409, 'SEAT_HAS_TICKET_HISTORY'],
    [403, 'FORBIDDEN'],
    [404, 'SEAT_NOT_FOUND'],
  ]) {
    const item = fixture({
      overrides: {
        save: async () => {
          throw Object.assign(new Error('DB denied'), { status, code });
        },
      },
    });
    await item.controller.start();
    item.controller.select(seat(1));
    item.controller.openEditor(seat(1));
    item.controller.changeField('type', 'VIP');
    await item.controller.save();
    assert.equal(item.controller.getSnapshot().editor.values.type, 'VIP');
    assert.equal(item.controller.getSnapshot().editor.error.status, status);
    assert.equal(item.controller.getSnapshot().selection.id, 1);
    if (status === 409) assert.match(item.controller.getSnapshot().editor.error.message, /lịch sử/);
  }
});
test('delete Cancel and DB history rejection never optimistically remove seats', async () => {
  const item = fixture({
    overrides: {
      remove: async () => {
        throw Object.assign(new Error('History'), { status: 409, code: 'SEAT_HAS_TICKETS' });
      },
    },
  });
  await item.controller.start();
  item.controller.requestDelete(seat(1));
  item.controller.cancelDelete();
  assert.equal(
    item.calls.some(([name]) => name === 'remove'),
    false,
  );
  item.controller.requestDelete(seat(1));
  await assert.rejects(
    item.controller.confirmDelete(),
    (error) => error.status === 409 && /lịch sử/.test(error.message),
  );
  assert.equal(resourceView(item.controller.getSnapshot()).total, 2);
  assert.equal(item.controller.getSnapshot().deleteTarget.id, 1);
});
test('Manager hidden drafts restore their baseline and safe room selection, epoch reset invalidates old owner', async () => {
  const store = createManagerCinemaStore();
  store.reconcile(cinemas);
  const first = fixture({ store });
  await first.controller.start();
  first.controller.openEditor(seat(1));
  first.controller.changeField('type', 'VIP');
  first.controller.dispose();
  assert.equal(store.getSnapshot().dirty, true);
  const second = fixture({ store, query: '' });
  await second.controller.start();
  assert.equal(second.controller.getSnapshot().scope.roomId, '11');
  assert.equal(second.controller.getSnapshot().editor.baseline.type, 'Thường');
  assert.equal(store.switchCinema('2'), 'dirty');
  assert.equal(store.switchCinema('2', true), 'changed');
  second.controller.changeField('type', 'Đôi');
  assert.equal(store.getSnapshot().dirty, false); // disposed context cannot populate cleared cache
  second.controller.openEditor(seat(1));
  await second.controller.save();
  assert.equal(
    second.calls.some(([name]) => name === 'save'),
    false,
  );
});
test('Manager selection without dirty draft survives route recreation; writes lock assignment switch', async () => {
  const store = createManagerCinemaStore();
  store.reconcile(cinemas);
  const first = fixture({ store });
  await first.controller.start();
  first.controller.dispose();
  const request = deferred(),
    second = fixture({ store, query: '', overrides: { save: () => request.promise } });
  await second.controller.start();
  assert.equal(second.controller.getSnapshot().scope.roomId, '11');
  second.controller.openEditor(seat(1));
  const writing = second.controller.save();
  assert.equal(store.switchCinema('2', true), 'busy');
  request.resolve({});
  await writing;
  assert.equal(store.getSnapshot().pending, false);
});
test('gallery A -> B -> A blocks late images and targets mutations to original cinema', async () => {
  const requests = [];
  const item = fixture({
    kind: 'images',
    query: '',
    overrides: {
      list: (scope) => {
        const request = deferred();
        requests.push({ ...request, scope });
        return request.promise;
      },
    },
  });
  await item.controller.start();
  const a = item.controller.chooseCinema('1'),
    b = item.controller.chooseCinema('2'),
    a2 = item.controller.chooseCinema('1');
  requests[2].resolve([image(3)]);
  await a2;
  requests[0].resolve([image(1)]);
  await a;
  requests[1].resolve([image(2, 2)]);
  await b;
  assert.equal(item.controller.getSnapshot().resource.rows[0].id, 3);
  item.controller.requestDelete(image(2, 2));
  assert.equal(item.controller.getSnapshot().deleteTarget, null);
  item.controller.openEditor(image(3));
  item.controller.changeField('description', 'Draft');
  item.controller.chooseCinema('2');
  item.controller.cancelDiscard();
  assert.equal(item.controller.getSnapshot().scope.cinemaId, '1');
});
test('gallery cover/delete/order stay scoped, cover errors stay errors and never change other cinema', async () => {
  const item = fixture({ kind: 'images', query: 'cinemaId=1' });
  await item.controller.start();
  await item.controller.setCover(image(1));
  assert.deepEqual(
    item.calls.find(([name]) => name === 'cover'),
    ['cover', { cinemaId: '1', roomId: '' }, 1],
  );
  item.controller.openEditor(image(1));
  item.controller.changeField('displayOrder', '9');
  await item.controller.save();
  assert.equal(item.calls.find(([name]) => name === 'save').at(-1).displayOrder, 9);
  item.controller.requestDelete(image(1));
  await item.controller.confirmDelete();
  assert.equal(resourceView(item.controller.getSnapshot()).total, 1);
  const failed = fixture({
    kind: 'images',
    query: 'cinemaId=1',
    overrides: {
      cover: async () => {
        throw Object.assign(new Error('Inactive'), { status: 409, code: 'CINEMA_IMAGE_INACTIVE' });
      },
    },
  });
  await failed.controller.start();
  await failed.controller.setCover(image(1));
  assert.equal(failed.controller.getSnapshot().notice.error.status, 409);
});
test('full dataset search and pagination support >120 seats, grid retains original order under filters', async () => {
  const rows = Array.from({ length: 130 }, (_, index) =>
    seat(index + 1, 11, {
      row: index < 65 ? 'A' : 'B',
      number: (index % 65) + 1,
      label: `${index < 65 ? 'A' : 'B'}${(index % 65) + 1}`,
    }),
  );
  const item = fixture({ overrides: { list: async () => rows } });
  await item.controller.start();
  item.controller.setFilters({ row: 'B' });
  item.controller.applyFilters();
  item.controller.setPage(7);
  assert.equal(resourceView(item.controller.getSnapshot()).total, 65);
  assert.equal(resourceView(item.controller.getSnapshot()).rows.length, 5);
  assert.equal(seatRows(rows)[0][1].length, 65);
  assert.equal(seatRows([seat(1), seat(2, 11, { number: 1 })]), null);
  assert.equal(seatRows([seat(1, 11, { row: null })]), null);
});
test('Cinema counts are independent optional full rooms and dependency rejection retains cinema', async () => {
  const item = fixture({
    kind: 'cinemas',
    query: '',
    overrides: {
      counts: async () => [room(11), room(22, 2)],
      remove: async () => {
        throw Object.assign(new Error('Dependent'), {
          status: 409,
          code: 'CINEMA_HAS_DEPENDENCIES',
        });
      },
    },
  });
  await item.controller.start();
  assert.equal(item.controller.getSnapshot().counts.rooms.length, 2);
  item.controller.select(cinemas[0]);
  item.controller.requestDelete(cinemas[0]);
  await assert.rejects(item.controller.confirmDelete(), /Tạm đóng/);
  assert.equal(item.controller.getSnapshot().resource.rows.length, 2);
  const failed = fixture({
    kind: 'cinemas',
    query: '',
    overrides: {
      counts: async () => {
        throw new Error('Count API failed');
      },
    },
  });
  await failed.controller.start();
  assert.equal(failed.controller.getSnapshot().resource.status, 'success');
  assert.equal(failed.controller.getSnapshot().counts.status, 'error');
});

test('closing the contextual detail inspector clears the selected record', async () => {
  const item = fixture({ kind: 'cinemas', query: '' });
  await item.controller.start();
  item.controller.select(cinemas[0]);
  assert.equal(item.controller.getSnapshot().selection.id, cinemas[0].id);
  item.controller.closeDetail();
  assert.equal(item.controller.getSnapshot().selection, null);
});

test('configuration never gets sold state from adapters; occupancy mode is read-only and requires permission', async () => {
  const item = fixture();
  await item.controller.start();
  item.controller.setMode('occupancy');
  item.controller.openEditor(seat(1));
  item.controller.requestDelete(seat(1));
  await item.controller.save();
  assert.equal(item.controller.getSnapshot().editor, null);
  assert.equal(item.controller.getSnapshot().deleteTarget, null);
  assert.equal(
    item.calls.some(([name]) => name === 'save'),
    false,
  );
  const denied = fixture({
    query: 'cinemaId=1&roomId=11&showtimeId=9',
    overrides: { canShowtimes: false },
  });
  await denied.controller.start();
  assert.equal(denied.controller.getSnapshot().lookup.error.status, 403);
  assert.equal(denied.calls.length, 0);
});
test('raw adapters keep real technical IDs internal and API payload whitelists unchanged', () => {
  assert.equal(
    adminSeat({
      GheID: 9,
      PhongID: 11,
      RapID: 1,
      HangGhe: 'A',
      SoGhe: 2,
      TenGhe: 'A2',
      TrangThai: 'Bảo trì',
    }).status,
    'Bảo trì',
  );
  assert.equal(adminImage({ HinhAnhRapID: 9, RapID: 1, LaAnhDaiDien: 1 }).cover, true);
  assert.deepEqual(facilityPayload('seats', { row: ' A ', number: '12', type: 'Thường' }), {
    row: 'A',
    number: 12,
    type: 'Thường',
  });
});

let vite,
  SeatLayout,
  SeatInspector,
  View,
  FacilityFilters,
  Editor,
  Route,
  AuthContext,
  ManagerRoute,
  CinemaContext;
before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ default: SeatLayout } = await vite.ssrLoadModule('/src/features/facilities/SeatLayout.jsx'));
  ({ default: SeatInspector } = await vite.ssrLoadModule(
    '/src/features/facilities/SeatInspector.jsx',
  ));
  ({ FacilityView: View } = await vite.ssrLoadModule(
    '/src/features/facilities/FacilityScreen.jsx',
  ));
  ({ FacilityFilters } = await vite.ssrLoadModule('/src/features/facilities/FacilityScreen.jsx'));
  ({ default: Editor } = await vite.ssrLoadModule('/src/features/facilities/FacilityEditor.jsx'));
  ({ default: Route } = await vite.ssrLoadModule('/src/routes/AdminSectionRoute.jsx'));
  ({ default: ManagerRoute } = await vite.ssrLoadModule('/src/routes/ManagerSectionRoute.jsx'));
  ({ AuthContext } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'));
  ({ ManagerCinemaContext: CinemaContext } = await vite.ssrLoadModule(
    '/src/features/manager/ManagerCinemaContext.js',
  ));
});
after(async () => {
  await vite?.close();
});
const actor = (role = 'ADMIN') => ({
  userId: 9,
  role,
  permissions: ['QL_RAP', 'QL_PHONG', 'QL_GHE'].map((code) => ({ code })),
});
const render = (element, user = actor(), path = '/admin/facilities/seats') =>
  renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(AuthContext.Provider, { value: { user } }, element),
    ),
  );
test('actual Admin seat/cinema/image routes own distinct workspaces and deny foreign actors', () => {
  for (const [section, label] of [
    ['seats', 'Sơ đồ'],
    ['cinemas', 'Danh sách rạp'],
    ['cinemaImages', 'Thư viện ảnh rạp'],
  ]) {
    const html = render(React.createElement(Route, { section }));
    assert.ok(html.includes(label));
    assert.doesNotMatch(html, /catalog-form|GheID|RapID|PhongID/);
    assert.match(
      render(React.createElement(Route, { section }), actor('QUAN_LY_RAP')),
      /Không có quyền truy cập/,
    );
  }
});
test('cinema details open in a contextual inspector drawer', async () => {
  const item = fixture({ kind: 'cinemas', query: 'cinemaId=1' });
  await item.controller.start();
  item.controller.select(item.controller.getSnapshot().resource.rows[0]);
  const html = render(
    React.createElement(View, {
      state: item.controller.getSnapshot(),
      controller: item.controller,
      adapter: item.adapter,
    }),
    actor(),
    '/admin/cinemas',
  );
  const dialogStart = html.indexOf('class="ui-dialog ui-dialog--inspector"');
  const detailStart = html.indexOf('class="facility-panel" aria-label="Chi tiết rạp"');
  assert.ok(dialogStart >= 0 && detailStart > dialogStart);
  assert.match(html, /Rạp A/);
  item.controller.dispose();
});
test('facility search uses one FilterBar submit action for button and Enter', () => {
  const html = render(
    React.createElement(FacilityFilters, {
      kind: 'cinemas',
      rows: [],
      state: {
        filters: { search: '', city: '' },
        applied: { search: '', city: '' },
        pending: false,
      },
      controller: { applyFilters() {}, resetFilters() {}, setFilters() {} },
    }),
  );
  assert.equal((html.match(/type="submit"/g) ?? []).length, 1);
  assert.match(html, /type="search"/);
  assert.match(html, /Tìm rạp/);
});
test('SeatLayout renders 130 actual buttons without invented gaps; filter marks rather than moves seats', () => {
  const seats = Array.from({ length: 130 }, (_, index) => seat(index + 1));
  const html = render(
    React.createElement(SeatLayout, {
      seats,
      selectedId: 1,
      filters: { ...freshFilters(), search: 'A130' },
      onSelect() {},
    }),
  );
  assert.equal((html.match(/class="facility-seat"/g) ?? []).length, 130);
  assert.equal((html.match(/data-match="false"/g) ?? []).length, 129);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /Sơ đồ ghế có thể cuộn/);
  assert.match(html, /Phóng to ghế/);
  assert.doesNotMatch(html, /Đã bán|Màn hình|GheID|aisle/);
});
test('Inspector configuration and occupancy stay separate, read-only occupancy has no mutation buttons', () => {
  const config = render(
    React.createElement(SeatInspector, {
      seat: seat(1),
      mode: 'configuration',
      onEdit() {},
      onDelete() {},
    }),
  );
  assert.match(config, /Sửa ghế/);
  assert.match(config, /lịch sử vé/);
  const readonly = render(
    React.createElement(SeatInspector, {
      seat: seat(1, 11, { status: 'Đã bán' }),
      mode: 'occupancy',
    }),
  );
  assert.match(readonly, /chỉ đọc/);
  assert.doesNotMatch(readonly, /Sửa ghế|Xóa ghế/);
});
test('gallery uses real thumbnails/preview, metadata and scoped actions without raw URL table', async () => {
  const item = fixture({ kind: 'images', query: 'cinemaId=1' });
  await item.controller.start();
  const html = render(
    React.createElement(View, {
      state: item.controller.getSnapshot(),
      controller: item.controller,
      adapter: item.adapter,
    }),
  );
  assert.match(html, /facility-gallery/);
  assert.match(html, /src="\/test-image.jpg"/);
  assert.match(html, /Xem ảnh/);
  assert.match(html, /Đặt ảnh chính/);
  assert.match(html, /Thứ tự/);
  assert.doesNotMatch(html, /<table|HinhAnhRapID|RapID/);
});
test('Manager Room list has real count and paired seat action; forged cinema URL is denied', async () => {
  const store = createManagerCinemaStore();
  store.reconcile(cinemas);
  const item = fixture({ kind: 'rooms', query: 'cinemaId=1', store });
  await item.controller.start();
  const html = render(
    React.createElement(View, {
      state: item.controller.getSnapshot(),
      controller: item.controller,
      adapter: item.adapter,
    }),
    actor('QUAN_LY_RAP'),
    '/manager/rooms',
  );
  assert.match(html, /130/);
  assert.match(html, /STT/);
  assert.match(html, /cinemaId=1&amp;roomId=11/);
  assert.doesNotMatch(html, /catalog-form|RoomID/);
  const denied = render(
    React.createElement(
      CinemaContext.Provider,
      { value: { store, state: store.getSnapshot(), changeCinema() {} } },
      React.createElement(ManagerRoute, { section: 'seats' }),
    ),
    actor('QUAN_LY_RAP'),
    '/manager/seats?cinemaId=999&roomId=11',
  );
  assert.match(denied, /Không có quyền truy cập/);
});
test('seat editor keeps named room immutable, accessible field errors, and exact shared choices', () => {
  const html = render(
    React.createElement(Editor, {
      kind: 'seats',
      editor: {
        row: seat(1),
        values: { type: 'Thường', status: 'Hoạt động' },
        errors: { type: 'Conflict' },
      },
      contextLabel: 'Phòng A · Rạp A',
      controller: { closeEditor() {}, changeField() {}, save() {} },
    }),
  );
  assert.match(html, /Phòng A · Rạp A/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-modal="true"/);
  assert.doesNotMatch(html, /type="number"|RoomID|PhongID/);
});
