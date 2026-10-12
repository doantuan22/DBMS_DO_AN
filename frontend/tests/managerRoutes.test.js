import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createMemoryRouter, createRoutesFromElements, matchRoutes, MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import { createManagerCinemaStore } from '../src/features/manager/managerCinemaStore.js';
import { createManagerRequestOwner, loadManagerScreen } from '../src/features/manager/managerScreenRequests.js';
import { MANAGER_SECTION_ROUTES, managerEntryPath } from '../src/routes/managerSectionRoutes.js';
import { draftNavigationAllowed } from '../src/features/staff-bookings/useBookingDraftGuard.js';

let vite, AppRoutes, SectionRoute, AuthContext, CinemaContext, StaffShell, Form, ManagerPortal;
const actor = (codes = [...new Set(Object.values(MANAGER_SECTION_ROUTES).map((route) => route.permission))]) =>
  ({ userId: 9, role: 'QUAN_LY_RAP', permissions: codes.map((code) => ({ code })) });
const cinemas = [{ id: 1, name: 'Rạp A', city: 'A' }, { id: 2, name: 'Rạp B', city: 'B' }];
before(async () => {
  vite = await createServer({ configFile: 'vite.config.js', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  ({ default: AppRoutes } = await vite.ssrLoadModule('/src/routes/index.jsx'));
  ({ default: SectionRoute } = await vite.ssrLoadModule('/src/routes/ManagerSectionRoute.jsx'));
  ({ AuthContext } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'));
  ({ ManagerCinemaContext: CinemaContext } = await vite.ssrLoadModule('/src/features/manager/ManagerCinemaContext.js'));
  ({ default: StaffShell } = await vite.ssrLoadModule('/src/layouts/StaffShell.jsx'));
  ({ default: Form } = await vite.ssrLoadModule('/src/components/ManagerResourceForm.jsx'));
  ({ default: ManagerPortal } = await vite.ssrLoadModule('/src/pages/ManagerPortal.jsx'));
});
after(async () => { await vite?.close(); });
const render = (path, user, element) => renderToStaticMarkup(React.createElement(MemoryRouter,
  { initialEntries: [path] }, React.createElement(AuthContext.Provider, { value: { user, logout() {} } }, element)));
const tree = () => createRoutesFromElements(AppRoutes().props.children);

test('actual AppRoutes owns six Manager screens, bookings, legacy index and local 404', () => {
  for (const [section, route] of Object.entries(MANAGER_SECTION_ROUTES)) {
    const matched = matchRoutes(tree(), route.path);
    const leaf = matched.at(-1).route.element;
    if (section === 'bookings') assert.equal(leaf.props.portal, 'manager');
    else assert.equal(leaf.props.section, section);
    assert.equal(matched.at(-2).route.element.type.name, 'ManagerLayout');
  }
  assert.equal(matchRoutes(tree(), '/manager').at(-1).route.element.type.name, 'ManagerEntryRoute');
  assert.equal(matchRoutes(tree(), '/manager/unknown').at(-1).route.element.type.name, 'NotFound');
  assert.equal(managerEntryPath(''), '/manager/overview');
  for (const section of Object.keys(MANAGER_SECTION_ROUTES)) assert.equal(managerEntryPath(`#manager-${section}`), `/manager/${section}`);
  assert.equal(managerEntryPath('#unknown'), '/manager/overview');
});

test('every deep link and fresh router reload selects its own route; Memory history supports back/forward', async () => {
  const router = createMemoryRouter(tree(), { initialEntries: ['/manager/overview'] });
  try {
    for (const route of Object.values(MANAGER_SECTION_ROUTES)) {
      await router.navigate(route.path);
      assert.equal(router.state.location.pathname, route.path);
      assert.equal(router.state.matches.at(-1).route.path, route.path.split('/').at(-1));
      const reloaded = createMemoryRouter(tree(), { initialEntries: [route.path] });
      assert.equal(reloaded.state.matches.at(-1).route.path, router.state.matches.at(-1).route.path);
      reloaded.dispose();
    }
    await router.navigate(-1);
    assert.equal(router.state.location.pathname, '/manager/revenue');
    await router.navigate(1);
    assert.equal(router.state.location.pathname, '/manager/bookings');
  } finally { router.dispose(); }
});

test('each screen renders the route breadcrumb/title and rejects missing permission or foreign role', () => {
  const store = createManagerCinemaStore(); store.reconcile(cinemas);
  for (const [section, route] of Object.entries(MANAGER_SECTION_ROUTES).filter(([section]) => section !== 'bookings')) {
    const element = React.createElement(SectionRoute, { section });
    const html = render(route.path, actor(), React.createElement(CinemaContext.Provider,
      { value: { state: store.getSnapshot(), store, changeCinema() {} } }, element));
    assert.ok(html.includes(`<h1 class="ui-page-header__title">${route.label}</h1>`));
    assert.match(html, /aria-label="Breadcrumb"/);
    assert.match(html, /aria-label="Rạp hiện tại"/);
    assert.match(render(route.path, actor([]), element), /Không có quyền truy cập/);
    assert.match(render(route.path, { ...actor(), role: 'ADMIN' }, element), /Không có quyền truy cập/);
  }
  assert.match(render('/manager/nope', actor(), React.createElement(SectionRoute, { section: 'nope' })), /404 - Không tìm thấy trang/);
});

test('sidebar marks exactly the matching Manager route active for all seven destinations', () => {
  for (const route of Object.values(MANAGER_SECTION_ROUTES)) {
    const html = render(route.path, actor(), React.createElement(StaffShell, { portal: 'manager' }, 'Screen'));
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
    assert.ok(html.includes(`aria-current="page" href="${route.path}"`));
    for (const destination of Object.values(MANAGER_SECTION_ROUTES)) assert.ok(html.includes(`href="${destination.path}"`));
    assert.doesNotMatch(html, /href="\/manager#manager-/);
  }
});

test('booking query changes keep the same route element and have no cinema key on the persistent layout', async () => {
  const router = createMemoryRouter(tree(), { initialEntries: ['/manager/bookings?orderId=10'] });
  try {
    const original = router.state.matches.map((match) => ({ id: match.route.id, element: match.route.element }));
    await router.navigate('/manager/bookings?orderId=20');
    assert.deepEqual(router.state.matches.map((match) => ({ id: match.route.id, element: match.route.element })), original);
    for (const match of router.state.matches) assert.equal(match.route.element?.key, null);
    assert.equal(router.state.matches.at(-1).route.element.props.portal, 'manager');
  } finally { router.dispose(); }
});

test('screen API ownership preserves scope, dependency permission and 403/404 errors', async () => {
  for (const [section, expected] of Object.entries({ overview: ['dashboard'], rooms: ['rooms'], seats: ['rooms'], showtimes: ['rooms', 'showtimes'], pricing: ['pricing'], revenue: [] })) {
    const calls = [];
    const api = Object.fromEntries(Object.entries({ getDashboard: 'dashboard', getRooms: 'rooms', getManagerShowtimes: 'showtimes', getPricing: 'pricing' })
      .map(([method, name]) => [method, async (cinemaId) => { calls.push([name, cinemaId]); return {}; }]));
    await loadManagerScreen(actor(), section, '2', api);
    assert.deepEqual(calls, expected.map((name) => [name, '2']));
  }
  for (const status of [403, 404]) {
    const error = Object.assign(new Error('Denied or missing'), { status });
    const result = await loadManagerScreen(actor(['QL_PHONG']), 'rooms', '3', { getRooms: async () => { throw error; } });
    assert.equal(result.rooms.status, 'error'); assert.equal(result.rooms.error, error);
  }
  const missing = await loadManagerScreen(actor(['QL_GHE']), 'seats', '1', { getRooms: () => assert.fail('No QL_PHONG') });
  assert.deepEqual(missing, {});
});

test('multi-cinema Cancel preserves all drafts/selection; Confirm resets dependent state and A -> B -> A stays clean', () => {
  const store = createManagerCinemaStore(); store.reconcile(cinemas);
  const draft = { values: { name: 'Unsaved room' }, initialValues: { name: '' }, dirty: true };
  store.setDraft('rooms:room:create', draft);
  store.setScreen('seats', { roomId: '11', seats: { status: 'success', rows: [{ id: 111 }] } });
  const before = store.getSnapshot();
  assert.equal(store.switchCinema('2'), 'dirty'); // Dialog Cancel makes no mutation.
  assert.equal(store.getSnapshot(), before); assert.equal(store.getDraft('rooms:room:create'), draft);
  assert.equal(store.getScreen('seats').roomId, '11');
  assert.equal(store.switchCinema('999', true), 'invalid');
  assert.equal(store.switchCinema('2', true), 'changed');
  assert.equal(store.getDraft('rooms:room:create'), undefined); assert.equal(store.getScreen('seats'), undefined);
  assert.equal(store.getSnapshot().dirty, false);
  assert.equal(store.switchCinema('1'), 'changed'); assert.equal(store.getScreen('seats'), undefined);
});

test('repeated assignment loads preserve valid cinema and drafts; revocation removes their ownership', () => {
  const store = createManagerCinemaStore(); store.reconcile(cinemas); store.switchCinema('2');
  store.setDraft('pricing:pricing:create', { dirty: true, values: { surcharge: 100 } });
  const owns = store.capture(); store.reconcile([...cinemas].reverse());
  assert.equal(store.getSnapshot().cinemaId, '2'); assert.equal(owns(), true); assert.equal(store.getSnapshot().dirty, true);
  store.reconcile([cinemas[0]]);
  assert.equal(store.getSnapshot().cinemaId, '1'); assert.equal(owns(), false); assert.equal(store.getSnapshot().dirty, false);
  store.reconcile([]); assert.equal(store.getSnapshot().cinemaId, '');
  store.fail(Object.assign(new Error('Forbidden'), { status: 403 })); assert.equal(store.getSnapshot().status, 'error');
});

test('reload preference is accepted only when the assigned cinema response still includes it', () => {
  const valid = createManagerCinemaStore('2'); valid.reconcile(cinemas);
  assert.equal(valid.getSnapshot().cinemaId, '2');
  const revoked = createManagerCinemaStore('999'); revoked.reconcile(cinemas);
  assert.equal(revoked.getSnapshot().cinemaId, '1');
  assert.equal(revoked.getSnapshot().dirty, false);
});

test('request owner rejects late responses across route disposal, repeated loads and A -> B -> A', async () => {
  const store = createManagerCinemaStore(); store.reconcile(cinemas);
  const owner = createManagerRequestOwner(store);
  const firstSeats = owner.begin('seats'); const secondSeats = owner.begin('seats');
  assert.equal(firstSeats(), false); assert.equal(secondSeats(), true);
  const accepts = owner.begin('screen');
  let finish;
  const request = new Promise((resolve) => { finish = resolve; }).then((data) => accepts() ? data : null);
  store.switchCinema('2'); store.switchCinema('1'); finish({ cinemaName: 'A late' });
  assert.equal(await request, null);
  const nextScreen = createManagerRequestOwner(store); const routeRequest = nextScreen.begin('movies');
  nextScreen.dispose(); assert.equal(routeRequest(), false);
  nextScreen.activate(); assert.equal(routeRequest(), false); // StrictMode setup cannot revive old requests.
});

test('cinema switches are locked while mutations run and released by the matching completion', () => {
  const store = createManagerCinemaStore(); store.reconcile(cinemas);
  const first = store.beginWrite(); const second = store.beginWrite();
  assert.equal(store.switchCinema('2', true), 'busy');
  store.endWrite(first); assert.equal(store.getSnapshot().pending, true);
  store.endWrite(second); assert.equal(store.getSnapshot().pending, false);
  assert.equal(store.switchCinema('2'), 'changed');
});

test('cached Manager form hydrates actual draft values without replacing its baseline', () => {
  const html = renderToStaticMarkup(React.createElement(Form, { kind: 'room', busy: false,
    draft: { values: { name: 'Draft room B', type: '2D', status: 'Hoạt động' }, initialValues: { name: '', type: '2D', status: 'Hoạt động' }, dirty: true }, onSave() {} }));
  assert.match(html, /value="Draft room B"/);
});

test('historical standalone ManagerPortal fixtures can render without supplying a Router', () => {
  const html = renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user: actor() } }, React.createElement(ManagerPortal)));
  assert.match(html, /Manager Portal/);
  assert.match(html, /Đang tải rạp được phân công/);
});

test('Manager internal navigation keeps drafts, leaving its scope confirms, and booking retains its default guard', () => {
  let confirmations = 0;
  const cancel = () => { confirmations++; return false; };
  const managerOptions = { isSafeDestination: (path) => path.startsWith('/manager/'), confirm: cancel };
  assert.equal(draftNavigationAllowed({ dirty: true, pending: false }, '/manager/seats', managerOptions), true);
  assert.equal(confirmations, 0);
  assert.equal(draftNavigationAllowed({ dirty: true, pending: false }, '/', managerOptions), false);
  assert.equal(confirmations, 1);
  assert.equal(draftNavigationAllowed({ dirty: true, pending: false }, '/', { ...managerOptions, confirm: () => true }), true);
  assert.equal(draftNavigationAllowed({ dirty: true, pending: true }, '/manager/seats', managerOptions), false);
  assert.equal(draftNavigationAllowed({ dirty: true, pending: false }, '/manager/seats', { confirm: cancel }), false);
  assert.equal(draftNavigationAllowed({ dirty: false, pending: false }, '/', { confirm: cancel }), true);
});
