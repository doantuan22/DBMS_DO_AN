import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
let vite,
  createComplaints,
  createAnalytics,
  createStore,
  complaintAdapter,
  ComplaintView,
  AnalyticsView,
  analyticsModel;
before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ createComplaintController: createComplaints } = await vite.ssrLoadModule(
    '/src/features/admin-service/complaintController.js',
  ));
  ({ createAnalyticsController: createAnalytics } = await vite.ssrLoadModule(
    '/src/features/admin-analytics/analyticsController.js',
  ));
  ({ createAdminWorkspaceStore: createStore } = await vite.ssrLoadModule(
    '/src/features/admin-workspace/adminWorkspaceStore.js',
  ));
  ({ complaintAdapter } = await vite.ssrLoadModule(
    '/src/features/admin-service/complaintAdapter.js',
  ));
  ({ ComplaintView } = await vite.ssrLoadModule('/src/features/admin-service/AdminComplaints.jsx'));
  ({ AnalyticsView } = await vite.ssrLoadModule(
    '/src/features/admin-analytics/AdminAnalytics.jsx',
  ));
  analyticsModel = await vite.ssrLoadModule('/src/features/admin-analytics/analyticsModel.js');
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
const cases = [
  {
    id: 1,
    title: 'Hồ sơ A',
    senderName: 'Khách A',
    type: 'Dịch vụ',
    status: 'Mới',
    priority: 'Cao',
    createdAt: '2026-10-01T12:00:00.000Z',
    content: 'Nội dung A',
    processings: [],
  },
  {
    id: 2,
    title: 'Hồ sơ B',
    senderName: 'Khách B',
    type: 'Vé',
    status: 'Đang xử lý',
    priority: 'Trung bình',
    createdAt: '2026-10-02T12:00:00.000Z',
    content: 'Nội dung B',
    processings: [],
  },
];
const adapter = (overrides = {}) => ({
  allowed: true,
  writable: true,
  referenceAllowed: false,
  list: async () => cases,
  detail: async (id) => cases.find((c) => c.id === id),
  process: async () => ({}),
  status: async () => ({}),
  ...overrides,
});
test('Admin complaint role/permissions differ from CSKH and gate processing/reference independently', () => {
  const user = (role, codes) => ({ role, permissions: codes.map((code) => ({ code })) });
  assert.equal(
    complaintAdapter(user('CSKH', ['QL_KHIEUNAI', 'XULY_KHIEUNAI', 'TRA_CUU_DON'])).allowed,
    false,
  );
  const read = complaintAdapter(user('ADMIN', ['QL_KHIEUNAI']));
  assert.equal(read.allowed, true);
  assert.equal(read.writable, false);
  assert.equal(read.referenceAllowed, false);
  assert.equal(complaintAdapter(user('ADMIN', ['QL_KHIEUNAI', 'XULY_KHIEUNAI'])).writable, true);
});
test('complaint filters are sent to server before local paging and never leak search/type into URL', async () => {
  const calls = [],
    queries = [],
    c = createComplaints({
      adapter: adapter({
        list: async (filters) => {
          calls.push(filters);
          return cases;
        },
      }),
      onQueryChange: (q) => queries.push(q),
    });
  await c.start();
  await c.select(1);
  c.changeProcessing({ content: 'Unsaved' });
  c.setFilters({ search: 'email@example.test', type: 'Sensitive type', priority: 'Cao' });
  await c.applyFilters();
  assert.equal(calls.at(-1).search, 'email@example.test');
  assert.equal(c.getSnapshot().selectedId, 1);
  assert.equal(c.getSnapshot().draft.processing.content, 'Unsaved');
  assert.ok(queries.every((q) => !q.includes('example') && !q.includes('Sensitive')));
  c.setFilters({ type: 'draft type' });
  c.removeFilter('priority');
  assert.equal(c.getSnapshot().applied.priority, '');
  assert.equal(c.getSnapshot().applied.search, 'email@example.test');
  assert.equal(c.getSnapshot().filters.type, 'draft type');
  assert.equal(c.getSnapshot().selectedId, 1);
  assert.equal(c.getSnapshot().draft.processing.content, 'Unsaved');
  assert.equal(calls.at(-1).priority, '');
  c.dispose();
});
test('keyed complaint notes survive case switches, close, Admin route recreation and discard Cancel', async () => {
  const store = createStore(),
    c = createComplaints({ adapter: adapter(), store });
  await c.start();
  await c.select(1);
  c.changeProcessing({ content: 'Note A' });
  await c.select(2);
  c.changeProcessing({ content: 'Note B' });
  await c.select(1);
  assert.equal(c.getSnapshot().draft.processing.content, 'Note A');
  c.request('discard');
  c.cancelConfirmation();
  assert.equal(c.getSnapshot().draft.processing.content, 'Note A');
  c.dispose();
  const restored = createComplaints({ adapter: adapter(), store });
  await restored.start();
  assert.equal(restored.getSnapshot().draft.processing.content, 'Note A');
  restored.request('discard');
  await restored.confirm();
  assert.equal(store.getDraft('complaint:1'), undefined);
  assert.equal(store.getSnapshot().dirty, true);
  assert.equal(store.getDraft('complaint:2').draft.processing.content, 'Note B');
  restored.dispose();
});
test('saving status preserves unsaved processing text and saving note preserves independent status draft', async () => {
  const store = createStore(),
    calls = [],
    c = createComplaints({
      adapter: adapter({
        process: async (...args) => calls.push(args),
        status: async (...args) => calls.push(args),
      }),
      store,
    });
  await c.start();
  await c.select(1);
  c.changeProcessing({ content: 'Keep note' });
  c.changeStatus('Đã giải quyết');
  c.request('status');
  await c.confirm();
  assert.equal(c.getSnapshot().draft.processing.content, 'Keep note');
  assert.equal(store.getDraft('complaint:1').dirty, true);
  c.changeStatus('Đã đóng');
  c.request('processing');
  await c.confirm();
  assert.equal(c.getSnapshot().draft.processing.content, '');
  assert.equal(c.getSnapshot().draft.status, 'Đã đóng');
  assert.equal(calls.length, 2);
  c.dispose();
});
test('complaint write lock prevents duplicate submit/context switches; conflict keeps draft', async () => {
  const write = deferred(),
    store = createStore();
  let calls = 0;
  const c = createComplaints({
    adapter: adapter({
      process: () => {
        calls++;
        return write.promise;
      },
    }),
    store,
  });
  await c.start();
  await c.select(1);
  c.changeProcessing({ content: 'Keep on conflict' });
  c.request('processing');
  const pending = c.confirm();
  await c.confirm();
  await c.select(2);
  assert.equal(calls, 1);
  assert.equal(c.getSnapshot().selectedId, 1);
  write.reject(Object.assign(new Error('Conflict'), { status: 409 }));
  await pending;
  assert.equal(c.getSnapshot().draft.processing.content, 'Keep on conflict');
  assert.equal(c.getSnapshot().notice.error.status, 409);
  assert.equal(store.getSnapshot().pending, false);
  c.dispose();
});
test('late complaint A -> B -> A and foreign detail cannot overwrite current case', async () => {
  const requests = [],
    c = createComplaints({
      adapter: adapter({
        detail: () => {
          const d = deferred();
          requests.push(d);
          return d.promise;
        },
      }),
    });
  await c.start();
  const a = c.select(1),
    b = c.select(2),
    a2 = c.select(1);
  requests[2].resolve(cases[0]);
  await a2;
  requests[1].resolve(cases[1]);
  requests[0].resolve(cases[0]);
  await Promise.all([a, b]);
  assert.equal(c.getSnapshot().detail.complaint.title, 'Hồ sơ A');
  c.dispose();
  const wrong = createComplaints({ adapter: adapter({ detail: async () => cases[1] }) });
  await wrong.start();
  await wrong.select(1);
  assert.equal(wrong.getSnapshot().detail.status, 'error');
  assert.equal(wrong.getSnapshot().draft, null);
  wrong.dispose();
});
test('disposed complaint selection cannot navigate a new Admin screen; queue reload does not own selection URL', async () => {
  const late = deferred(),
    queries = [],
    c = createComplaints({
      adapter: adapter({ detail: () => late.promise }),
      onQueryChange: (query) => queries.push(query),
    });
  await c.start();
  const before = queries.length;
  const pending = c.select(1);
  c.dispose();
  late.resolve(cases[0]);
  await pending;
  assert.equal(queries.length, before);
  const current = createComplaints({
    adapter: adapter(),
    onQueryChange: (query) => queries.push(query),
  });
  await current.start();
  await current.select(1);
  const selected = queries.length;
  await current.reload();
  assert.equal(queries.length, selected);
  assert.equal(current.getSnapshot().selectedId, 1);
  current.dispose();
});
test('read-only/403/404 complaint states cannot expose write actions or fake empty success', async () => {
  for (const status of [403, 404]) {
    const c = createComplaints({
      adapter: adapter({
        detail: async () => {
          throw Object.assign(new Error('Denied'), { status });
        },
      }),
    });
    await c.start();
    await c.select(1);
    assert.equal(c.getSnapshot().detail.error.status, status);
    c.dispose();
  }
  let writes = 0;
  const read = adapter({ writable: false, process: async () => writes++ }),
    c = createComplaints({ adapter: read });
  await c.start();
  await c.select(1);
  c.changeProcessing({ content: 'Illegal' });
  c.request('processing');
  await c.confirm();
  assert.equal(writes, 0);
  const html = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(ComplaintView, { adapter: read, state: c.getSnapshot(), controller: c }),
    ),
  );
  assert.doesNotMatch(html, /Ghi nhận xử lý Admin|senderId|NguoiGuiID/);
  assert.match(html, /cần quyền xử lý/);
  c.dispose();
});
const report = {
  summary: {
    TongDoanhThuThucTe: 120000,
    TongSoDonToanHeThong: 1,
    TongSoVeBan: 2,
    TongDoanhThuVe: 130000,
    TongDoanhThuDoAn: 0,
    TongTienGiam: 10000,
  },
  byCinema: [
    {
      RapID: 91,
      TenRap: 'Rạp A',
      SoDon: 1,
      SoVeBan: 2,
      DoanhThuThucTe: 120000,
      DoanhThuVe: 130000,
      DoanhThuDoAn: 0,
      TongTienGiam: 10000,
    },
  ],
  byMovie: [],
  byDate: [
    {
      Ngay: '2026-10-01',
      SoDon: 1,
      SoVeBan: 2,
      DoanhThuThucTe: 120000,
      DoanhThuVe: 130000,
      DoanhThuDoAn: 0,
      TongTienGiam: 10000,
    },
  ],
};
const analyticsAdapter = (overrides = {}) => ({
  allowed: true,
  report: async () => report,
  dashboard: async () => ({ TongDoanhThuToanThoiGian: 200000, TongNguoiDung: 8 }),
  cinemas: async () => [{ id: 91, label: 'Rạp A' }],
  ...overrides,
});
test('report validates inclusive date range and named cinema; passes API summary without JS recalculation', async () => {
  const calls = [],
    c = createAnalytics({
      kind: 'revenue',
      adapter: analyticsAdapter({
        report: async (f) => {
          calls.push(f);
          return report;
        },
      }),
    });
  await c.start();
  c.setFilters({ fromDate: '2026-10-02', toDate: '2026-10-01' });
  await c.applyFilters();
  assert.equal(calls.length, 1);
  assert.match(c.getSnapshot().error.message, /sau/);
  c.setFilters({ fromDate: '2026-10-01', toDate: '2026-10-01', cinemaId: '91' });
  await c.applyFilters();
  assert.deepEqual(calls.at(-1), { fromDate: '2026-10-01', toDate: '2026-10-01', cinemaId: '91' });
  assert.equal(c.getSnapshot().report.data, report);
  c.setFilters({ cinemaId: '999' });
  await c.applyFilters();
  assert.equal(calls.length, 2);
  c.dispose();
});
test('scoped revenue reload never filters/relables current/global dashboard metrics', async () => {
  let dashboards = 0;
  const c = createAnalytics({
    kind: 'overview',
    adapter: analyticsAdapter({
      dashboard: async () => {
        dashboards++;
        return { TongDoanhThuToanThoiGian: 200000 };
      },
    }),
  });
  await c.start();
  c.setFilters({ cinemaId: '91' });
  await c.applyFilters();
  assert.equal(dashboards, 1);
  assert.equal(c.getSnapshot().dashboard.data.TongDoanhThuToanThoiGian, 200000);
  const html = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(AnalyticsView, {
        kind: 'overview',
        state: c.getSnapshot(),
        controller: c,
      }),
    ),
  );
  assert.match(html, /Hiện tại và toàn thời gian/);
  assert.match(html, /Bao gồm hai ngày biên/);
  assert.match(html, /200\.000/);
  assert.doesNotMatch(html, />RapID<|>TongDoanhThuThucTe<|>91</);
  c.dispose();
});
test('stale report generation clears earlier scope and independent dashboard errors do not suppress report', async () => {
  const old = deferred();
  let first = true;
  const c = createAnalytics({
    kind: 'overview',
    adapter: analyticsAdapter({
      report: () => {
        if (first) {
          first = false;
          return old.promise;
        }
        return Promise.resolve(report);
      },
      dashboard: async () => {
        throw Object.assign(new Error('Denied'), { status: 403 });
      },
    }),
  });
  const pending = c.start();
  c.setFilters({ fromDate: '2026-10-01', toDate: '2026-10-01' });
  await c.applyFilters();
  old.resolve({ ...report, summary: { TongDoanhThuThucTe: 1 } });
  await pending;
  assert.equal(c.getSnapshot().report.data, report);
  assert.equal(c.getSnapshot().dashboard.error.status, 403);
  c.dispose();
});
test('missing report metrics stay unknown rather than invented zero; official metric allowlist only', () => {
  assert.equal(analyticsModel.count(undefined), 'Chưa có dữ liệu');
  // Cash/points separation (business rule 2026-10-14): money received, orders and points-paid value are distinct.
  assert.deepEqual(
    analyticsModel.REPORT_METRICS.map(([key]) => key),
    [
      'TongDoanhThuThucTe',
      'TongSoDonToanHeThong',
      'SoDonHopLe',
      'SoDonCoTienThucThu',
      'TienThuocDonHuy',
      'TongGiaTriThanhToanBangDiem',
      'TongSoVeBan',
      'TongDoanhThuVe',
      'TongDoanhThuDoAn',
      'TongTienGiam',
    ],
  );
  assert.equal(analyticsModel.DASHBOARD_METRICS.length, 11);
});
