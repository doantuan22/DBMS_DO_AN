import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
let vite, createController, model, View, Detail, createStore;
before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ createBookingController: createController } = await vite.ssrLoadModule(
    '/src/features/staff-bookings/bookingController.js',
  ));
  model = await vite.ssrLoadModule('/src/features/staff-bookings/bookingModel.js');
  ({ BookingView: View } = await vite.ssrLoadModule(
    '/src/features/staff-bookings/StaffBookings.jsx',
  ));
  ({ default: Detail } = await vite.ssrLoadModule(
    '/src/features/staff-bookings/BookingDetail.jsx',
  ));
  ({ createManagerCinemaStore: createStore } = await vite.ssrLoadModule(
    '/src/features/manager/managerCinemaStore.js',
  ));
});
after(async () => {
  await vite?.close();
});
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const customer = { NguoiDungID: 71, HoTen: 'Khách A', Email: 'customer@example.test' };
const shows = [
  {
    SuatChieuID: 81,
    RapID: 1,
    TenRap: 'Rạp A',
    TenPhim: 'Phim A',
    TenPhong: 'Phòng A',
    ThoiGianBatDau: '2030-01-01T03:00:00.000Z',
    DinhDang: '2D',
  },
];
const cinemas = [
  { RapID: 1, TenRap: 'Rạp A' },
  { RapID: 2, TenRap: 'Rạp B' },
];
const seats = Array.from({ length: 12 }, (_, i) => ({
  id: 91 + i,
  roomId: 11,
  label: `A${i + 1}`,
  row: 'A',
  number: i + 1,
  price: 80000 + i * 1000,
  status: 'Trống',
  type: 'Thường',
}));
const order = {
  id: 61,
  cinemaId: 1,
  cinemaName: 'Rạp A',
  roomName: 'Phòng A',
  showtimeId: 81,
  movieTitle: 'Phim A',
  startsAt: shows[0].ThoiGianBatDau,
  bookedAt: '2026-10-12T02:00:00.000Z',
  holdExpiresAt: '2030-01-01T03:00:00.000Z',
  format: '2D',
  ticketTotal: 80000,
  productTotal: 0,
  discountTotal: 0,
  total: 80000,
  status: 'Chờ thanh toán',
  canEdit: true,
  canCancel: true,
  user: { id: 71, name: 'Khách A', email: 'customer@example.test' },
  seatLabels: 'A1',
  tickets: [
    {
      id: 101,
      code: 'TICKET_A',
      seatId: 91,
      label: 'A1',
      price: 80000,
      type: 'Thường',
      status: 'Đã đặt',
    },
  ],
  products: [],
  payments: [],
};
const summary = {
  DonDatVeID: 61,
  RapID: 1,
  HoTenKhachHang: 'Khách A',
  Email: 'customer@example.test',
  TenPhim: 'Phim A',
  TenRap: 'Rạp A',
  TenPhong: 'Phòng A',
  ThoiGianBatDau: shows[0].ThoiGianBatDau,
  SoLuongVe: 1,
  DanhSachGhe: 'A1',
  TongTienThanhToan: 80000,
  TrangThaiDon: 'Chờ thanh toán',
};
const api = (overrides = {}) => ({
  list: async (filters) => ({
    orders: [summary],
    page: filters.page,
    pageSize: filters.pageSize,
    total: 21,
  }),
  options: async () => ({ cinemas, showtimes: shows, showtimeTotal: 1, seats }),
  customers: async () => ({ customers: [customer], total: 1 }),
  detail: async () => ({ order }),
  create: async () => ({ orderId: 61 }),
  updateSeats: async () => ({ order }),
  cancel: async () => ({ order: { ...order, status: 'Đã hủy', canEdit: false, canCancel: false } }),
  ...overrides,
});
async function readyCreate(controller, manager = false) {
  controller.startCreate();
  controller.setCustomerSearch('Khách');
  await controller.searchCustomers();
  controller.chooseCustomer('71');
  controller.goToStep(1);
  if (!manager) controller.chooseCinema('1');
  await tick();
  controller.chooseShowtime('81');
  await tick();
  controller.goToStep(2);
  controller.toggleSeat(91);
  controller.goToStep(3);
}
test('server search/paging use full totals and safe query never exposes PII', async () => {
  const calls = [],
    queries = [],
    controller = createController({
      api: api({
        list: async (filters) => {
          calls.push(filters);
          return { orders: [summary], total: 40, page: filters.page, pageSize: 20 };
        },
      }),
      onQueryChange: (query) => queries.push(query),
    });
  await controller.start();
  controller.setFilters({
    search: 'customer@example.test',
    status: 'Chờ thanh toán',
    cinemaId: '1',
  });
  controller.applyFilters();
  await tick();
  controller.setPage(2);
  await tick();
  assert.equal(calls.at(-1).search, 'customer@example.test');
  assert.equal(calls.at(-1).page, 2);
  assert.ok(queries.every((query) => !query.includes('example') && !query.includes('search')));
  const html = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(View, { state: controller.getSnapshot(), controller, portal: 'admin' }),
    ),
  );
  assert.match(html, /Mã đơn/);
  assert.match(html, /#61/);
  assert.match(html, /<td class="ui-data-table__row-number">21<\/td>/);
  assert.match(html, /40 kết quả/);
  controller.dispose();
});
test('booking filter apply suppresses duplicate requests and chip removal resets the result page', async () => {
  const calls = [],
    controller = createController({
      api: api({
        list: async (filters) => {
          calls.push({ ...filters });
          return { orders: [summary], total: 40, page: filters.page, pageSize: 20 };
        },
      }),
    });
  await controller.start();
  controller.setFilters({ status: 'Chờ thanh toán' });
  controller.applyFilters();
  controller.applyFilters();
  await tick();
  assert.equal(calls.filter((filters) => filters.status === 'Chờ thanh toán').length, 1);
  controller.setPage(2);
  await tick();
  controller.setFilters({ search: 'draft search' });
  controller.removeFilter('status');
  await tick();
  const state = controller.getSnapshot();
  assert.equal(state.applied.status, '');
  assert.equal(state.filters.status, '');
  assert.equal(state.filters.search, 'draft search');
  assert.equal(state.applied.page, 1);
  assert.equal(calls.at(-1).status, '');
  assert.equal(calls.at(-1).page, 1);
  controller.dispose();
});
test('list/detail reject wrong current cinema and distinguish denial/not-found from empty', async () => {
  for (const status of [403, 404]) {
    const controller = createController({
      api: api({
        list: async () => {
          throw Object.assign(new Error('Denied'), { status });
        },
        detail: async () => {
          throw Object.assign(new Error('Missing'), { status });
        },
      }),
      initialQuery: 'orderId=61',
    });
    await controller.start();
    assert.equal(controller.getSnapshot().list.error.status, status);
    assert.equal(controller.getSnapshot().detail.error.status, status);
    controller.dispose();
  }
  const controller = createController({
    api: api({
      list: async () => ({ orders: [{ ...summary, RapID: 2 }], total: 1, page: 1, pageSize: 20 }),
      detail: async () => ({ order: { ...order, cinemaId: 2 } }),
    }),
    cinemaId: '1',
    initialQuery: 'orderId=61',
  });
  await controller.start();
  assert.equal(controller.getSnapshot().list.status, 'error');
  assert.equal(controller.getSnapshot().detail.status, 'error');
  controller.dispose();
});
test('rapid detail and search changes cannot replace the current owner', async () => {
  const old = deferred(),
    controller = createController({
      api: api({
        detail: (id) =>
          id === '61' ? old.promise : Promise.resolve({ order: { ...order, id: Number(id) } }),
      }),
    });
  await controller.start();
  controller.showOrder(61);
  controller.showOrder(62);
  await tick();
  old.resolve({ order });
  await tick();
  assert.equal(controller.getSnapshot().detail.order.id, 62);
  const search = deferred(),
    a = api({ customers: () => search.promise }),
    second = createController({ api: a });
  await second.start();
  second.startCreate();
  second.setCustomerSearch('old');
  const pending = second.searchCustomers();
  second.setCustomerSearch('new');
  search.resolve({ customers: [customer], total: 1 });
  await pending;
  assert.equal(second.getSnapshot().customers.status, 'idle');
  controller.dispose();
  second.dispose();
});
test('filter apply/reset/page retain selected detail and unsaved booking choices', async () => {
  const controller = createController({ api: api(), initialQuery: 'orderId=61' });
  await controller.start();
  controller.startEdit();
  await tick();
  controller.toggleSeat(92);
  controller.setFilters({ status: 'Đã thanh toán' });
  controller.applyFilters();
  await tick();
  controller.resetFilters();
  await tick();
  controller.setPage(2);
  await tick();
  assert.equal(controller.getSnapshot().selectedId, '61');
  assert.equal(controller.getSnapshot().dirty, true);
  assert.deepEqual(controller.getSnapshot().draft.seatIds, [91, 92]);
  controller.showOrder(62);
  assert.equal(controller.getSnapshot().confirmation.kind, 'discard');
  controller.cancelConfirmation();
  assert.equal(controller.getSnapshot().selectedId, '61');
  controller.dispose();
});
test('paid/used/canceled/expired detail stays read-only and exposes actual payment/history', () => {
  for (const status of ['Đã thanh toán', 'Hoàn thành', 'Đã hủy', 'Hết hạn']) {
    const data = {
      ...order,
      status,
      canEdit: false,
      canCancel: false,
      payments: [
        {
          id: 801,
          method: 'Ví',
          amount: 80000,
          transactionCode: 'PAY_ABC',
          status: 'Thành công',
          createdAt: '2026-10-12T02:00:00.000Z',
        },
      ],
      compensation: { points: 12, creditedAt: '2026-10-12T02:00:00.000Z' },
    };
    const html = renderToStaticMarkup(React.createElement(Detail, { order: data }));
    assert.match(html, /PAY_ABC/);
    assert.match(html, /12 điểm/);
    assert.doesNotMatch(html, />Sửa ghế<|>Hủy đơn</);
  }
  assert.equal(
    model.bookingCanEdit({ ...order, holdExpiresAt: '2020-01-01T00:00:00.000Z' }),
    false,
  );
});
test('Manager scopes metadata/list/create and persists draft across internal navigation', async () => {
  const store = createStore();
  store.reconcile([
    { id: 1, name: 'A' },
    { id: 2, name: 'B' },
  ]);
  const calls = [];
  const a = api({
    list: async (filters) => {
      calls.push(filters);
      return { orders: [summary], total: 1, page: 1, pageSize: 20 };
    },
  });
  const controller = createController({ api: a, managerStore: store, cinemaId: '1' });
  await controller.start();
  await readyCreate(controller, true);
  assert.equal(controller.getSnapshot().metadata.data.cinemas.length, 1);
  assert.ok(calls.every((filters) => filters.cinemaId === '1'));
  controller.chooseCinema('2');
  assert.equal(controller.getSnapshot().draft.cinemaId, '1');
  controller.dispose();
  const restored = createController({ api: a, managerStore: store, cinemaId: '1' });
  await restored.start();
  assert.deepEqual(restored.getSnapshot().draft.seatIds, [91]);
  assert.equal(restored.getSnapshot().step, 3);
  assert.equal(store.switchCinema('2'), 'dirty');
  assert.equal(store.switchCinema('2', true), 'changed');
  assert.equal(store.getDraft('staff-bookings'), undefined);
  restored.dispose();
});
test('guided create cannot skip Customer/show/seats/review and uses authoritative response', async () => {
  let body;
  const controller = createController({
    api: api({
      create: async (payload) => {
        body = payload;
        return { orderId: 61 };
      },
    }),
  });
  await controller.start();
  controller.startCreate();
  controller.goToStep(3);
  assert.equal(controller.getSnapshot().step, 0);
  controller.requestSave();
  assert.equal(controller.getSnapshot().confirmation, null);
  await readyCreate(controller);
  assert.equal(controller.getSnapshot().step, 3);
  assert.equal(model.bookingSelection(controller.getSnapshot()).preview, 80000);
  controller.requestSave();
  await controller.confirmMutation();
  assert.deepEqual(body, { customerId: 71, showtimeId: 81, seatIds: [91] });
  assert.equal(controller.getSnapshot().editor, null);
  assert.equal(controller.getSnapshot().detail.order.status, 'Chờ thanh toán');
  controller.dispose();
});
test('edit submits original expected ticket IDs and omits ownership/payment/price fields', async () => {
  let body;
  const controller = createController({
    api: api({
      updateSeats: async (_id, payload) => {
        body = payload;
        return { order };
      },
    }),
    initialQuery: 'orderId=61',
  });
  await controller.start();
  controller.startEdit();
  await tick();
  controller.toggleSeat(92);
  controller.goToStep(3);
  controller.requestSave();
  await controller.confirmMutation();
  assert.deepEqual(body, { seatIds: [91, 92], expectedTicketIds: [101] });
  controller.dispose();
});
test('seat limit, duplicate mutation lock and conflict retain draft while clearing confirmation', async () => {
  const write = deferred(),
    store = createStore();
  store.reconcile([
    { id: 1, name: 'A' },
    { id: 2, name: 'B' },
  ]);
  let calls = 0;
  const controller = createController({
    api: api({
      create: () => {
        calls++;
        return write.promise;
      },
    }),
    managerStore: store,
    cinemaId: '1',
  });
  await controller.start();
  await readyCreate(controller, true);
  controller.goToStep(2);
  for (let id = 92; id <= 102; id++) controller.toggleSeat(id);
  assert.equal(controller.getSnapshot().draft.seatIds.length, 10);
  assert.match(controller.getSnapshot().limitNotice, /10/);
  controller.goToStep(3);
  controller.requestSave();
  const pending = controller.confirmMutation();
  await controller.confirmMutation();
  assert.equal(calls, 1);
  assert.equal(store.switchCinema('2', true), 'busy');
  write.reject(Object.assign(new Error('Ghế vừa được giữ'), { status: 409 }));
  await assert.rejects(pending);
  assert.equal(controller.getSnapshot().confirmation, null);
  assert.equal(controller.getSnapshot().dirty, true);
  assert.equal(controller.getSnapshot().step, 2);
  assert.equal(store.getSnapshot().pending, false);
  controller.dispose();
});
test('seat options and pending writes cannot update revoked cinema, including A to B to A', async () => {
  const write = deferred(),
    store = createStore();
  store.reconcile([
    { id: 1, name: 'A' },
    { id: 2, name: 'B' },
  ]);
  const controller = createController({
    api: api({ create: () => write.promise }),
    managerStore: store,
    cinemaId: '1',
  });
  await controller.start();
  await readyCreate(controller, true);
  controller.requestSave();
  const pending = controller.confirmMutation();
  store.reconcile([{ id: 2, name: 'B' }]);
  store.reconcile([{ id: 1, name: 'A' }]);
  write.resolve({ orderId: 61 });
  await pending;
  assert.equal(controller.getSnapshot().notice, null);
  assert.equal(store.getSnapshot().dirty, false);
  assert.equal(store.getSnapshot().pending, false);
  controller.dispose();
});
test('cancel uses business endpoint and cannot be triggered on paid or edited orders', async () => {
  let count = 0;
  const controller = createController({
    api: api({
      cancel: async () => {
        count++;
        return { order: { ...order, status: 'Đã hủy', canEdit: false, canCancel: false } };
      },
    }),
    initialQuery: 'orderId=61',
  });
  await controller.start();
  controller.startEdit();
  controller.requestCancel();
  assert.equal(controller.getSnapshot().confirmation, null);
  controller.closeEditor();
  controller.requestCancel();
  await controller.confirmMutation();
  assert.equal(count, 1);
  controller.dispose();
});
test('reloading conflict seats lets staff remove a now-unavailable selection', async () => {
  let unavailable = false;
  const controller = createController({
    api: api({
      options: async () => ({
        cinemas,
        showtimes: shows,
        showtimeTotal: 1,
        seats: seats.map((seat) =>
          unavailable && seat.id === 91 ? { ...seat, status: 'Đang giữ' } : seat,
        ),
      }),
    }),
  });
  await controller.start();
  await readyCreate(controller);
  controller.goToStep(2);
  unavailable = true;
  await controller.reloadOptions();
  assert.equal(model.bookingSelection(controller.getSnapshot()).valid, false);
  controller.toggleSeat(91);
  controller.toggleSeat(92);
  assert.deepEqual(controller.getSnapshot().draft.seatIds, [92]);
  assert.equal(model.bookingSelection(controller.getSnapshot()).valid, true);
  controller.dispose();
});
test('expired deadline refresh is once per order/deadline and cannot loop on a remounted countdown', async () => {
  let reads = 0;
  const controller = createController({
    api: api({
      detail: async () => {
        reads++;
        return { order: { ...order, holdExpiresAt: '2020-01-01T00:00:00.000Z', canEdit: false } };
      },
    }),
    initialQuery: 'orderId=61',
  });
  await controller.start();
  controller.onHoldElapsed();
  await tick();
  controller.onHoldElapsed();
  await tick();
  assert.equal(reads, 2);
  controller.startEdit();
  assert.equal(controller.getSnapshot().editor, null);
  controller.dispose();
});
test('an empty last server page recovers to the last available page', async () => {
  const calls = [],
    controller = createController({
      api: api({
        list: async (filters) => {
          calls.push(filters.page);
          return {
            orders: filters.page > 1 ? [] : [summary],
            total: 1,
            page: filters.page,
            pageSize: 20,
          };
        },
      }),
      initialQuery: 'page=5',
    });
  await controller.start();
  await tick();
  assert.deepEqual(calls, [5, 1]);
  assert.equal(controller.getSnapshot().applied.page, 1);
  assert.equal(controller.getSnapshot().list.data.orders.length, 1);
  controller.dispose();
});
test('explicit safe deep-link filters override cached Manager list filters', async () => {
  const store = createStore();
  store.reconcile([{ id: 1, name: 'A' }]);
  store.setScreen('staff-bookings', {
    applied: {
      search: 'private@example.test',
      status: 'Đã thanh toán',
      cinemaId: '1',
      page: 2,
      pageSize: 20,
    },
  });
  const controller = createController({
    api: api(),
    managerStore: store,
    cinemaId: '1',
    initialQuery: `status=${encodeURIComponent('Chờ thanh toán')}&page=1`,
  });
  assert.equal(controller.getSnapshot().applied.status, 'Chờ thanh toán');
  assert.equal(controller.getSnapshot().applied.page, 1);
  assert.equal(controller.getSnapshot().applied.search, 'private@example.test');
  controller.dispose();
});
