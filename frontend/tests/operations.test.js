import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

let vite, createController, model, View, managerBody, createStore;
before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ createOperationsController: createController } = await vite.ssrLoadModule(
    '/src/features/operations/operationsController.js',
  ));
  model = await vite.ssrLoadModule('/src/features/operations/operationsModel.js');
  ({ OperationsView: View } = await vite.ssrLoadModule(
    '/src/features/operations/OperationsScreen.jsx',
  ));
  ({ managerBody } = await vite.ssrLoadModule('/src/utils/managerForms.js'));
  ({ createManagerCinemaStore: createStore } = await vite.ssrLoadModule(
    '/src/features/manager/managerCinemaStore.js',
  ));
});
after(async () => {
  await vite?.close();
});
const cinemas = [
  { id: 1, name: 'Rạp A' },
  { id: 2, name: 'Rạp B' },
];
const shows = [
  {
    id: 201,
    cinemaId: 1,
    cinemaName: 'Rạp A',
    roomId: 11,
    roomName: 'Phòng A',
    movieId: 301,
    movieTitle: 'Phim A',
    startsAt: '2026-10-12T03:00:00.000Z',
    endsAt: '2026-10-12T05:00:00.000Z',
    format: '2D',
    basePrice: 80000,
    status: 'Mở bán',
  },
  {
    id: 202,
    cinemaId: 1,
    cinemaName: 'Rạp A',
    roomId: 12,
    roomName: 'Phòng B',
    movieId: 302,
    movieTitle: 'Phim B',
    startsAt: '2026-10-12T06:00:00.000Z',
    endsAt: '2026-10-12T08:00:00.000Z',
    format: '3D',
    basePrice: 90000,
    status: 'Đóng bán',
  },
];
const pricing = [
  {
    id: 401,
    cinemaId: 1,
    seatType: 'VIP',
    dayType: 'Ngày thường',
    format: '2D',
    surcharge: 12000,
    startsOn: '2026-10-01',
    endsOn: null,
    status: 'Áp dụng',
  },
  {
    id: 402,
    cinemaId: 1,
    seatType: 'Thường',
    dayType: 'Cuối tuần',
    format: '3D',
    surcharge: 20000,
    startsOn: '2026-11-01',
    endsOn: '2026-12-01',
    status: 'Tạm dừng',
  },
];
const adapter = (overrides = {}) => ({
  kind: 'showtimes',
  allowed: true,
  canRooms: true,
  cinemaId: '1',
  cinemas,
  rooms: async () => shows.map((row) => ({ id: row.roomId, cinemaId: 1, name: row.roomName })),
  movies: async () => shows.map((row) => ({ id: row.movieId, title: row.movieTitle })),
  list: async () => shows,
  save: async () => ({}),
  cancel: async () => ({}),
  ...overrides,
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const tick = () => new Promise((resolve) => setImmediate(resolve));
test('schedule reads inclusive bounded dates and filters the complete response before paging', async () => {
  const calls = [],
    controller = createController({
      adapter: adapter({
        list: async (id, filters) => {
          calls.push([id, filters]);
          return shows;
        },
      }),
      initialQuery: 'fromDate=2026-10-12&toDate=2026-10-12',
    });
  await controller.start();
  assert.equal(calls[0][0], '1');
  assert.equal(calls[0][1].toDate, '2026-10-12');
  controller.setFilters({ movieId: '302', status: 'Đóng bán' });
  controller.applyFilters();
  assert.equal(calls.length, 1);
  assert.deepEqual(
    model.operationsView(controller.getSnapshot(), 'showtimes').rows.map((r) => r.id),
    [202],
  );
  controller.setFilters({ fromDate: '2026-10-30', toDate: '2026-10-01' });
  controller.applyFilters();
  assert.match(controller.getSnapshot().filterError, /không sau/);
  assert.equal(calls.length, 1);
  assert.match(model.validateRange({ fromDate: '2026-10-01', toDate: '2026-12-01' }), /31 ngày/);
  assert.ok(model.validateRange({ fromDate: '2026-02-30', toDate: '2026-03-01' }));
  controller.dispose();
});
test('A to B clears dependent room and ignores old response including A to B to A', async () => {
  const old = deferred(),
    a = adapter({ cinemaId: undefined, cinemasLookup: async () => cinemas });
  const controller = createController({ adapter: a, initialQuery: 'cinemaId=1&roomId=11' });
  await controller.start();
  a.list = async (id) => (id === '2' ? [{ ...shows[0], cinemaId: 2 }] : shows);
  const read = controller.reload();
  await read;
  a.list = () => old.promise;
  const late = controller.reload();
  a.list = async (id) => (id === '2' ? [{ ...shows[0], cinemaId: 2 }] : shows);
  controller.chooseCinema('2');
  await tick();
  assert.equal(controller.getSnapshot().applied.roomId, '');
  controller.chooseCinema('1');
  await tick();
  old.resolve([{ ...shows[0], movieTitle: 'STALE' }]);
  await late;
  assert.equal(controller.getSnapshot().resource.rows[0].movieTitle, 'Phim A');
  controller.dispose();
});
test('wrong-scope data and 403/404 errors stay errors', async () => {
  for (const status of [403, 404, 409]) {
    const controller = createController({
      adapter: adapter({
        list: async () => {
          throw Object.assign(new Error('Denied'), { status });
        },
      }),
    });
    await controller.start();
    assert.equal(controller.getSnapshot().resource.status, 'error');
    assert.equal(controller.getSnapshot().resource.error.status, status);
    controller.dispose();
  }
  const controller = createController({
    adapter: adapter({ list: async () => [{ ...shows[0], cinemaId: 2 }] }),
  });
  await controller.start();
  assert.equal(controller.getSnapshot().resource.status, 'error');
  controller.dispose();
});
test('dirty editor survives filters, Cancel, internal Manager navigation; confirmed scope switch resets it', async () => {
  const store = createStore();
  store.reconcile(cinemas);
  const controller = createController({ adapter: adapter({ manager: true }), managerStore: store });
  await controller.start();
  controller.openEditor(shows[0]);
  controller.setDraft({
    values: { basePrice: 90000 },
    initialValues: { basePrice: 80000 },
    dirty: true,
  });
  controller.setFilters({ status: 'Đóng bán' });
  controller.applyFilters();
  assert.equal(controller.getSnapshot().dirty, true);
  controller.closeEditor();
  assert.ok(controller.getSnapshot().confirmation);
  controller.cancelDiscard();
  assert.ok(controller.getSnapshot().editor);
  controller.dispose();
  const next = createController({ adapter: adapter({ manager: true }), managerStore: store });
  await next.start();
  assert.equal(next.getSnapshot().editor.draft.values.basePrice, 90000);
  assert.equal(store.switchCinema('2'), 'dirty');
  assert.equal(store.switchCinema('2', true), 'changed');
  assert.equal(store.getDraft('operations:showtimes'), undefined);
  next.dispose();
});
test('write lock prevents duplicate writes and cinema changes; conflict keeps draft', async () => {
  const write = deferred(),
    store = createStore();
  store.reconcile(cinemas);
  let calls = 0;
  const controller = createController({
    adapter: adapter({
      manager: true,
      save: () => {
        calls++;
        return write.promise;
      },
    }),
    managerStore: store,
  });
  await controller.start();
  controller.openEditor(shows[0]);
  controller.setDraft({ dirty: true });
  const body = { movieId: 301 },
    first = controller.save(body);
  await controller.save(body);
  assert.equal(calls, 1);
  assert.equal(store.switchCinema('2', true), 'busy');
  write.reject(Object.assign(new Error('Overlap'), { status: 409, code: 'SHOWTIME_OVERLAP' }));
  await assert.rejects(first, /trùng thời gian/);
  assert.equal(controller.getSnapshot().dirty, true);
  assert.equal(store.getSnapshot().pending, false);
  controller.dispose();
});
test('revocation during a write suppresses success and preserves new scope ownership', async () => {
  const write = deferred(),
    store = createStore();
  store.reconcile(cinemas);
  const controller = createController({
    adapter: adapter({ manager: true, save: () => write.promise }),
    managerStore: store,
  });
  await controller.start();
  controller.openEditor(shows[0]);
  controller.setDraft({ dirty: true });
  const pending = controller.save({ movieId: 301 });
  store.reconcile([cinemas[1]]);
  write.resolve({});
  await pending;
  assert.equal(store.getSnapshot().cinemaId, '2');
  assert.equal(store.getSnapshot().pending, false);
  assert.equal(store.getDraft('operations:showtimes'), undefined);
  assert.equal(controller.getSnapshot().notice, null);
  controller.dispose();
});
test('named create sends scoped room, edit omits room and validates timestamps/money', () => {
  const fields = {
    movieId: '301',
    roomId: '11',
    startsAt: '2026-10-12T10:00',
    endsAt: '2026-10-12T12:00',
    format: '2D',
    basePrice: '80000',
    status: 'Mở bán',
  };
  assert.equal(managerBody('showtime', fields).roomId, 11);
  assert.equal(managerBody('showtime', fields).startsAt, '2026-10-12T03:00:00.000Z');
  assert.equal('roomId' in managerBody('showtime', fields, true), false);
  for (const basePrice of ['', -1, 'NaN', Infinity])
    assert.throws(() => managerBody('showtime', { ...fields, basePrice }));
  assert.throws(() => managerBody('showtime', { ...fields, endsAt: fields.startsAt }), /kết thúc/);
});
test('curated showtime table shows names and timezone, hides internal IDs; no fake held count', async () => {
  const a = adapter(),
    controller = createController({ adapter: a });
  await controller.start();
  const html = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(View, { state: controller.getSnapshot(), controller, adapter: a }),
    ),
  );
  assert.match(html, /STT/);
  assert.match(html, /Phim A/);
  assert.match(html, /UTC\+7/);
  assert.match(html, /Phòng A/);
  assert.doesNotMatch(html, />201<|>301<|>11<|Mã phòng|Mã phim/);
  controller.dispose();
});
test('pricing filters complete rules, including open ends and exact wildcard dimensions', async () => {
  let calls = 0;
  const controller = createController({
    adapter: adapter({
      kind: 'pricing',
      list: async () => {
        calls++;
        return pricing;
      },
    }),
  });
  await controller.start();
  controller.setFilters({ seatType: 'VIP', dayType: 'Ngày thường', effectiveOn: '2026-11-01' });
  controller.applyFilters();
  assert.deepEqual(
    model.operationsView(controller.getSnapshot(), 'pricing').rows.map((r) => r.id),
    [401],
  );
  assert.equal(calls, 1);
  controller.setFilters({ effectiveOn: '2026-09-30' });
  controller.applyFilters();
  assert.equal(model.operationsView(controller.getSnapshot(), 'pricing').total, 0);
  controller.resetFilters();
  assert.equal(model.operationsView(controller.getSnapshot(), 'pricing').total, 2);
  controller.dispose();
});
test('pricing form keeps exactly three day types, finite nonnegative surcharge and valid date order', async () => {
  const fields = {
    seatType: 'VIP',
    dayType: 'Cuối tuần',
    format: 'Tất cả',
    surcharge: '12000',
    startsOn: '2026-10-01',
    endsOn: '',
  };
  assert.deepEqual(managerBody('pricing', fields), { ...fields, surcharge: 12000, endsOn: null });
  assert.throws(() => managerBody('pricing', { ...fields, dayType: 'Ngày lễ' }));
  assert.throws(() => managerBody('pricing', { ...fields, endsOn: '2026-09-30' }));
  assert.throws(() => managerBody('pricing', { ...fields, surcharge: NaN }));
  const a = adapter({ kind: 'pricing', list: async () => pricing }),
    controller = createController({ adapter: a });
  await controller.start();
  controller.openEditor(pricing[0]);
  const html = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(View, { state: controller.getSnapshot(), controller, adapter: a }),
    ),
  );
  assert.match(html, /Phụ thu \(VND\)/);
  assert.match(html, /Không có ngày kết thúc/);
  assert.doesNotMatch(html, /Ngày lễ|>401<|Mã rạp/);
  controller.dispose();
});
test('pricing mutations bind immutable cinema; overlap leaves editor intact', async () => {
  const calls = [];
  const a = adapter({
    kind: 'pricing',
    manager: true,
    list: async () => pricing,
    save: async (...args) => {
      calls.push(args);
      throw Object.assign(new Error('Overlap'), { status: 409, code: 'PRICING_OVERLAP' });
    },
  });
  const controller = createController({ adapter: a });
  await controller.start();
  controller.openEditor(pricing[0]);
  controller.setDraft({ dirty: true });
  await assert.rejects(controller.save({ surcharge: 15000, status: 'Áp dụng' }), /cùng điều kiện/);
  assert.equal(calls[0][0], '1');
  assert.equal(controller.getSnapshot().dirty, true);
  controller.dispose();
});
test('explicit deep-link date range overrides cached Manager range', () => {
  const store = createStore();
  store.reconcile(cinemas);
  store.setScreen('operations:showtimes', {
    applied: { fromDate: '2026-10-01', toDate: '2026-10-02', status: 'Đóng bán' },
    page: 2,
  });
  const controller = createController({
    adapter: adapter({ manager: true }),
    managerStore: store,
    initialQuery: 'fromDate=2026-10-12&toDate=2026-10-12&page=1',
  });
  assert.equal(controller.getSnapshot().applied.fromDate, '2026-10-12');
  assert.equal(controller.getSnapshot().page, 1);
  assert.equal(controller.getSnapshot().filters.status, 'Đóng bán');
  controller.dispose();
});
