import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
let vite, createController, createStore, model, View;
before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ createResourceController: createController } = await vite.ssrLoadModule(
    '/src/features/admin-resources/resourceController.js',
  ));
  ({ createAdminWorkspaceStore: createStore } = await vite.ssrLoadModule(
    '/src/features/admin-workspace/adminWorkspaceStore.js',
  ));
  model = await vite.ssrLoadModule('/src/features/admin-resources/resourceModel.js');
  ({ ResourceView: View } = await vite.ssrLoadModule(
    '/src/features/admin-resources/AdminResourceScreen.jsx',
  ));
});
after(async () => {
  await vite?.close();
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const users = [
  {
    NguoiDungID: 51,
    HoTen: 'Manager A',
    Email: 'manager@example.test',
    SoDienThoai: '123',
    VaiTroID: 2,
    MaVaiTro: 'QUAN_LY_RAP',
    TenVaiTro: 'Quản lý rạp',
    TrangThai: 'Hoạt động',
  },
  {
    NguoiDungID: 52,
    HoTen: 'Customer B',
    Email: 'customer@example.test',
    VaiTroID: 1,
    MaVaiTro: 'KHACH_HANG',
    TenVaiTro: 'Khách hàng',
    TrangThai: 'Bị khóa',
  },
];
const assignments = [
  {
    PhanCongID: 61,
    NguoiDungID: 51,
    TenQuanLy: 'Manager A',
    Email: 'manager@example.test',
    RapID: 71,
    TenRap: 'Rạp A',
    NgayBatDau: '2026-10-01',
    NgayKetThuc: null,
    TrangThai: 'Hiệu lực',
  },
  {
    PhanCongID: 62,
    NguoiDungID: 51,
    TenQuanLy: 'Manager A',
    RapID: 72,
    TenRap: 'Rạp B',
    NgayBatDau: '2026-11-01',
    NgayKetThuc: '2026-12-01',
    TrangThai: 'Hiệu lực',
  },
];
const roles = [
  { id: 1, label: 'Khách hàng', code: 'KHACH_HANG' },
  { id: 2, label: 'Quản lý rạp', code: 'QUAN_LY_RAP' },
  { id: 3, label: 'CSKH', code: 'CSKH' },
  { id: 4, label: 'Admin', code: 'ADMIN' },
];
const adapter = (kind = 'users', overrides = {}) => ({
  kind,
  allowed: true,
  list: async () => (kind === 'users' ? users : assignments),
  lookups:
    kind === 'users'
      ? { roles: async () => roles }
      : {
          managers: async () => [{ id: 51, label: 'Manager A' }],
          cinemas: async () => [
            { id: 71, label: 'Rạp A' },
            { id: 72, label: 'Rạp B' },
          ],
        },
  save: async () => ({}),
  ...overrides,
});
test('users/assignments filter complete data before paging, without putting PII in URL', async () => {
  const queries = [],
    controller = createController({
      adapter: adapter(),
      onQueryChange: (query) => queries.push(query),
    });
  await controller.start();
  controller.setFilters({ search: 'manager@example.test', roleId: '2', status: 'Hoạt động' });
  controller.applyFilters();
  assert.deepEqual(model.resourceView(controller.getSnapshot(), 'users').rows, [users[0]]);
  assert.ok(queries.every((query) => !query.includes('example') && !query.includes('search')));
  controller.resetFilters();
  assert.equal(model.resourceView(controller.getSnapshot(), 'users').total, 2);
  controller.dispose();
  const second = createController({ adapter: adapter('assignments') });
  await second.start();
  second.setFilters({ effectiveOn: '2026-10-12', userId: '51' });
  second.applyFilters();
  assert.equal(model.resourceView(second.getSnapshot(), 'assignments').total, 1);
  second.dispose();
});
test('removing an Admin resource chip synchronizes only its applied field and preserves other drafts', async () => {
  const controller = createController({ adapter: adapter() });
  await controller.start();
  controller.setFilters({ roleId: '2', status: 'Hoạt động' });
  controller.applyFilters();
  controller.setFilters({ search: 'draft@example.test' });
  controller.removeFilter('status');
  const state = controller.getSnapshot();
  assert.equal(state.applied.status, '');
  assert.equal(state.applied.roleId, '2');
  assert.equal(state.filters.search, 'draft@example.test');
  assert.equal(state.page, 1);
  assert.equal(model.resourceView(state, 'users').total, 1);
  controller.dispose();
});
test('product price drafts share the toolbar Apply action and applied prices are visible as removable chips', async () => {
  const productRows = [
    {
      SanPhamID: 81,
      TenSanPham: 'Combo A',
      MoTa: 'Bắp và nước',
      Gia: 25000,
      LoaiSanPham: 'Combo',
      TrangThai: 'Đang bán',
    },
  ];
  const controller = createController({
    adapter: adapter('products', { list: async () => productRows }),
  });
  await controller.start();
  controller.setFilters({ minPrice: '20000', maxPrice: '30000', type: 'Combo' });
  controller.applyFilters();
  const html = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(View, { kind: 'products', state: controller.getSnapshot(), controller }),
    ),
  );
  assert.match(html, /Chỉnh khoảng giá tại đây, sau đó chọn “Lọc”/);
  assert.match(html, /Xong/);
  assert.doesNotMatch(html, /Áp dụng khoảng giá/);
  assert.match(html, /Xóa bộ lọc Giá từ/);
  assert.match(html, /Xóa bộ lọc Giá đến/);
  assert.match(html, /20\.000 đ/);
  controller.dispose();
});
test('internal account form rejects Customer role and editing cannot send identity or role changes', async () => {
  const controller = createController({ adapter: adapter() });
  await controller.start();
  controller.openEditor();
  for (const [name, value] of Object.entries({
    name: 'New Manager',
    email: 'new@example.test',
    password: 'SafePass123',
    roleId: '1',
  }))
    controller.changeField(name, value);
  await controller.requestSave();
  assert.match(controller.getSnapshot().editor.errors.roleId, /nội bộ/);
  assert.deepEqual(
    model.resourceBody('users', { status: 'Bị khóa', roleId: '4', name: 'Spoof' }, users[0]),
    { status: 'Bị khóa' },
  );
  controller.dispose();
});
test('assignment transfer fixes Manager, validates dates and confirms destination before writing', async () => {
  const calls = [],
    controller = createController({
      adapter: adapter('assignments', { save: async (...args) => calls.push(args) }),
    });
  await controller.start();
  controller.openEditor(assignments[0]);
  controller.changeField('userId', '52');
  assert.equal(controller.getSnapshot().editor.values.userId, '51');
  controller.changeField('cinemaId', '72');
  await controller.requestSave();
  assert.equal(calls.length, 0);
  assert.equal(controller.getSnapshot().confirmation.body.cinemaId, 72);
  await controller.confirm();
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].userId, 51);
  assert.equal(calls[0][0].PhanCongID, 61);
  controller.openEditor(assignments[0]);
  controller.changeField('endsOn', '2026-09-01');
  controller.requestSave();
  assert.match(controller.getSnapshot().editor.errors.endsOn, /trước/);
  controller.dispose();
});
test('lookup permission failures stay errors and cannot create fabricated references', async () => {
  const controller = createController({
    adapter: adapter('assignments', {
      lookups: {
        managers: null,
        cinemas: async () => {
          throw Object.assign(new Error('Denied'), { status: 403 });
        },
      },
    }),
  });
  await controller.start();
  assert.equal(controller.getSnapshot().resource.status, 'success');
  assert.equal(controller.getSnapshot().lookups.managers.error.status, 403);
  controller.openEditor();
  controller.changeField('userId', '51');
  controller.changeField('cinemaId', '71');
  controller.requestSave();
  assert.ok(controller.getSnapshot().editor.errors.userId);
  assert.ok(controller.getSnapshot().editor.errors.cinemaId);
  controller.dispose();
});
test('dirty draft survives filter/reset/page and Admin navigation; Cancel retains, Confirm discards', async () => {
  const store = createStore(),
    controller = createController({ adapter: adapter(), store });
  await controller.start();
  controller.openEditor();
  controller.changeField('name', 'Unsaved');
  controller.applyFilters();
  controller.resetFilters();
  controller.setPage(2);
  assert.equal(controller.getSnapshot().dirty, true);
  controller.closeEditor();
  controller.cancelConfirmation();
  assert.equal(controller.getSnapshot().editor.values.name, 'Unsaved');
  controller.dispose();
  const restored = createController({ adapter: adapter(), store });
  await restored.start();
  assert.equal(restored.getSnapshot().editor.values.name, 'Unsaved');
  restored.closeEditor();
  await restored.confirm();
  assert.equal(store.getDraft('resource:users'), undefined);
  assert.equal(store.getSnapshot().dirty, false);
  restored.dispose();
});
test('single shared write lock suppresses duplicates and retains failed draft', async () => {
  const write = deferred(),
    store = createStore();
  let calls = 0;
  const controller = createController({
    adapter: adapter('assignments', {
      save: () => {
        calls++;
        return write.promise;
      },
    }),
    store,
  });
  await controller.start();
  controller.openEditor(assignments[0]);
  controller.changeField('cinemaId', '72');
  controller.requestSave();
  const pending = controller.confirm();
  await controller.confirm();
  assert.equal(calls, 1);
  assert.equal(store.getSnapshot().pending, true);
  write.reject(Object.assign(new Error('Conflict'), { status: 409 }));
  await pending;
  assert.equal(controller.getSnapshot().dirty, true);
  assert.equal(controller.getSnapshot().notice.error.status, 409);
  assert.equal(store.getSnapshot().pending, false);
  controller.dispose();
});
test('stale reads, unmount writes and 403/404 preserve correct request ownership', async () => {
  const old = deferred();
  let first = true;
  const controller = createController({
    adapter: adapter('users', {
      list: () => {
        if (first) {
          first = false;
          return old.promise;
        }
        return Promise.resolve(users);
      },
    }),
  });
  const pending = controller.start();
  await controller.reload();
  old.resolve([]);
  await pending;
  assert.equal(controller.getSnapshot().resource.rows.length, 2);
  controller.dispose();
  for (const status of [403, 404]) {
    const failing = createController({
      adapter: adapter('users', {
        list: async () => {
          throw Object.assign(new Error('Failure'), { status });
        },
      }),
    });
    await failing.start();
    assert.equal(failing.getSnapshot().resource.status, 'error');
    assert.equal(failing.getSnapshot().resource.error.status, status);
    failing.dispose();
  }
});
test('curated table uses names/STT and role read-only edit, no raw keys or Role CRUD', async () => {
  const controller = createController({ adapter: adapter() });
  await controller.start();
  controller.openEditor(users[0]);
  const html = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(View, { kind: 'users', state: controller.getSnapshot(), controller }),
    ),
  );
  assert.match(html, /STT/);
  assert.match(html, /Quản lý rạp/);
  assert.match(html, /không thay đổi/);
  assert.doesNotMatch(html, /NguoiDungID|VaiTroID|MaVaiTro|>51<|name="roleId"/);
  controller.dispose();
});
test('selected Admin resource details are rendered inside the inspector drawer', async () => {
  const controller = createController({ adapter: adapter() });
  await controller.start();
  controller.select(users[0]);
  const html = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(View, { kind: 'users', state: controller.getSnapshot(), controller }),
    ),
  );
  const dialogStart = html.indexOf('class="ui-dialog ui-dialog--inspector"');
  const detailStart = html.indexOf('class="admin-resource__panel"');
  assert.ok(dialogStart >= 0 && detailStart > dialogStart);
  assert.match(html, /manager@example\.test/);
  assert.doesNotMatch(html, /Đóng chi tiết/);
  controller.dispose();
});
test('immutable assignment Manager selector explains its own context without changing shared room behavior', async () => {
  const c = createController({ adapter: adapter('assignments') });
  await c.start();
  c.openEditor(assignments[0]);
  const html = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(View, { kind: 'assignments', state: c.getSnapshot(), controller: c }),
    ),
  );
  assert.match(html, /Manager được giữ cố định/);
  assert.doesNotMatch(html, /không thể đổi phòng/);
  c.dispose();
});
const movie = {
  PhimID: 81,
  TenPhim: 'Phim A',
  ThoiLuong: 120,
  NgayKhoiChieu: '2026-10-01',
  DoTuoi: 'P',
  TrangThai: 'Đang chiếu',
  TheLoaiIdList: '91',
  DanhSachDienVienJson: '[{"actorId":101,"role":"Vai chính"}]',
};
const movieAdapter = (overrides = {}) => ({
  kind: 'movies',
  allowed: true,
  list: async () => [movie],
  lookups: {
    genres: async () => [{ id: 91, label: 'Hành động' }],
    actors: async () => [{ id: 101, label: 'Diễn viên A' }],
  },
  ...overrides,
});
test('movie metadata payload preserves named genres and excludes all cast fields', async () => {
  const calls = [],
    c = createController({
      adapter: movieAdapter({ save: async (row, body) => calls.push(body) }),
    });
  await c.start();
  c.openEditor(movie);
  c.changeField('director', 'Đạo diễn B');
  await c.requestSave();
  assert.deepEqual(calls[0].genreIds, [91]);
  assert.ok(!Object.hasOwn(calls[0], 'cast'));
  assert.ok(!Object.hasOwn(calls[0], 'DanhSachDienVienJson'));
  c.dispose();
});
test('missing/corrupt relation hydration blocks editing rather than sending empty replacement', async () => {
  for (const broken of [
    { ...movie, TheLoaiIdList: 'invalid' },
    { ...movie, DanhSachDienVienJson: '{' },
  ]) {
    const c = createController({ adapter: movieAdapter({ list: async () => [broken] }) });
    await c.start();
    if (broken.TheLoaiIdList === 'invalid') c.openEditor(broken);
    else c.openCast(broken);
    assert.equal(c.getSnapshot().editor, null);
    assert.ok(c.getSnapshot().notice.error);
    assert.ok(model.movieRelations(broken).error);
    c.dispose();
  }
  assert.equal(
    model.linkedMovies('genres', { TheLoaiID: 91 }, { status: 'error', rows: [] }),
    null,
  );
});
test('cast edits have separate confirm/write and reject unknown references; metadata is untouched', async () => {
  const calls = [],
    c = createController({
      adapter: movieAdapter({ cast: async (row, body) => calls.push(body) }),
    });
  await c.start();
  c.openCast(movie);
  c.addCastActor(999);
  assert.equal(c.getSnapshot().editor.values.cast.length, 1);
  c.changeCastRole(101, 'Vai mới');
  c.requestSave();
  assert.equal(calls.length, 0);
  c.cancelConfirmation();
  assert.equal(c.getSnapshot().editor.values.cast[0].role, 'Vai mới');
  c.requestSave();
  await c.confirm();
  assert.deepEqual(calls[0], { cast: [{ actorId: 101, role: 'Vai mới' }] });
  c.dispose();
});
test('deletion respects dirty draft guard and rejected deletion retains source catalogue', async () => {
  const c = createController({
    adapter: movieAdapter({
      remove: async () => {
        throw Object.assign(new Error('In use'), { status: 409 });
      },
    }),
  });
  await c.start();
  c.openEditor(movie);
  c.changeField('director', 'Unsaved');
  c.requestDelete(movie);
  assert.equal(c.getSnapshot().confirmation.kind, 'discard');
  c.cancelConfirmation();
  assert.equal(c.getSnapshot().dirty, true);
  c.closeEditor();
  await c.confirm();
  c.requestDelete(movie);
  await c.confirm();
  assert.equal(c.getSnapshot().notice.error.status, 409);
  assert.deepEqual(c.getSnapshot().resource.rows, [movie]);
  c.dispose();
});
test('movie/actor/genre views render curated names and unknown counts without technical JSON/IDs', async () => {
  const c = createController({ adapter: movieAdapter() });
  await c.start();
  const html = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(View, { kind: 'movies', state: c.getSnapshot(), controller: c }),
    ),
  );
  assert.match(html, /Hành động/);
  assert.doesNotMatch(html, /DanhSachDienVienJson|TheLoaiIdList|PhimID|>81</);
  c.dispose();
});
const promo = {
  KhuyenMaiID: 111,
  MaCode: 'IMMUTABLE',
  MoTa: 'Discount',
  LoaiGiamGia: 'PERCENT',
  GiaTriGiam: 10,
  DonHangToiThieu: 0,
  GiamToiDa: null,
  NgayBatDau: '2026-10-01T17:15:00.000Z',
  NgayKetThuc: '2026-11-01T17:15:00.000Z',
  SoLuong: 50,
  SoLuongDaDung: 20,
  TrangThai: 'Hoạt động',
};
test('promotion form preserves business-zone instants, immutable code and consumed quota', () => {
  const values = model.resourceValues('promotions', promo);
  assert.equal(values.startsAt, '2026-10-02T00:15:00.000');
  const body = model.resourceBody('promotions', values, promo);
  assert.equal(body.startsAt, promo.NgayBatDau);
  assert.equal(body.endsAt, promo.NgayKetThuc);
  assert.ok(!Object.hasOwn(body, 'code'));
  assert.ok(!Object.hasOwn(body, 'SoLuongDaDung'));
  assert.equal(body.maximumDiscount, undefined);
  const errors = model.validateResource(
    'promotions',
    { ...values, discountValue: '100', quantity: '19', endsAt: '2020-01-01T00:00' },
    promo,
    {},
  );
  assert.ok(errors.discountValue);
  assert.ok(errors.quantity);
  assert.ok(errors.endsAt);
});
test('commerce validates SQL decimal boundaries, optional zero and inclusive interval filters', () => {
  const values = { name: 'Popcorn', type: 'Bắp rang', price: '10.001', description: '', image: '' };
  assert.ok(model.validateResource('products', values, null, {}).price);
  assert.ok(
    model.validateResource('products', { ...values, price: '10000000000000000' }, null, {}).price,
  );
  assert.deepEqual(model.resourceBody('products', { ...values, price: '0' }, null), {
    name: 'Popcorn',
    type: 'Bắp rang',
    price: 0,
  });
  for (const price of ['1234567890123456.12', '1.00000000000000001', '0.010000000000000001'])
    assert.ok(
      model.validateResource('products', { ...values, price }, null, {}).price,
      `Must not silently round ${price}`,
    );
  for (const price of ['12345.67', '.50', '1e2', '0.0100'])
    assert.equal(
      model.validateResource('products', { ...values, price }, null, {}).price,
      undefined,
    );
  const state = {
    applied: { search: '', fromDate: '2026-10-02', toDate: '2026-10-02' },
    resource: { rows: [promo] },
    page: 1,
    pageSize: 20,
  };
  assert.equal(model.resourceView(state, 'promotions').total, 1);
  assert.equal(
    model.resourceView(
      { ...state, applied: { ...state.applied, toDate: '2026-10-01' } },
      'promotions',
    ).total,
    0,
  );
});
