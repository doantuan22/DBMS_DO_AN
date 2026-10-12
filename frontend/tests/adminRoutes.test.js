import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { matchRoutes, MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

let vite;
let AdminSectionRoute;
let StaffShell;
let AuthContext;
let routes;
let screenRoutes;
let resolveAdminSection;
let permissions;

before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ default: AdminSectionRoute } = await vite.ssrLoadModule('/src/routes/AdminSectionRoute.jsx'));
  ({ default: StaffShell } = await vite.ssrLoadModule('/src/layouts/StaffShell.jsx'));
  ({ AuthContext } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'));
  ({ ADMIN_SECTION_ROUTES: routes, ADMIN_SCREEN_ROUTES: screenRoutes, resolveAdminSection } = await vite.ssrLoadModule(
    '/src/routes/adminSectionRoutes.js',
  ));
  ({ ADMIN_SECTION_PERMISSIONS: permissions } = await vite.ssrLoadModule(
    '/src/utils/authorization.js',
  ));
});

after(async () => {
  await vite?.close();
});

const renderWithRoute = (path, user, element) =>
  renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(
        AuthContext.Provider,
        { value: { user, logout() {} } },
        element,
      ),
    ),
  );

test('every Admin destination has a unique canonical path and resolves back to its section', () => {
  const entries = Object.entries(routes);
  const paths = entries.map(([, route]) => route.path);
  assert.equal(entries.length, 17);
  assert.equal(new Set(paths).size, paths.length);
  for (const [section, route] of entries) assert.equal(resolveAdminSection(route.path), section);
  assert.equal(resolveAdminSection('/admin'), null);
  assert.equal(resolveAdminSection('/admin/legacy-section'), null);

  const routeTree = [{
    path: '/admin',
    children: [
      { index: true },
      { path: 'bookings' },
      ...screenRoutes.map(({ section, path }) => ({ path, section })),
      { path: '*' },
    ],
  }];
  assert.equal(screenRoutes.length, 16);
  for (const { path, section } of screenRoutes) {
    assert.equal(matchRoutes(routeTree, `/admin/${path}`)?.at(-1)?.route.section, section);
  }
  assert.equal(matchRoutes(routeTree, '/admin/bookings')?.at(-1)?.route.path, 'bookings');
  assert.equal(matchRoutes(routeTree, '/admin/no-such-page')?.at(-1)?.route.path, '*');
});

test('direct Admin URL selects its own section and denies a section without permission', () => {
  const user = { userId: 7, role: 'ADMIN', permissions: [{ code: permissions.movies }] };
  const allowed = renderWithRoute(
    routes.movies.path,
    user,
    React.createElement(AdminSectionRoute, { section: 'movies' }),
  );
  assert.match(allowed, /aria-label="Breadcrumb"/);
  assert.match(allowed, />Phim</);
  assert.doesNotMatch(allowed, />Tổng quan</);

  const forbidden = renderWithRoute(
    routes.users.path,
    user,
    React.createElement(AdminSectionRoute, { section: 'users' }),
  );
  assert.match(forbidden, /Không có quyền truy cập/);
});

test('Admin sidebar links use route ownership and mark the deep link active', () => {
  const user = {
    userId: 7,
    role: 'ADMIN',
    permissions: [...new Set(Object.values(permissions))].map((code) => ({ code })),
  };
  const html = renderWithRoute(
    routes.movies.path,
    user,
    React.createElement(StaffShell, { portal: 'admin' }, React.createElement('p', null, 'Screen')),
  );
  for (const [, route] of Object.entries(routes)) {
    assert.ok(html.includes(`href="${route.path}"`), `missing Admin link ${route.path}: ${html}`);
  }
  assert.match(html, /class="staff-shell__nav-item is-active" aria-current="page" href="\/admin\/catalog\/movies"/);
  assert.doesNotMatch(html, /href="\/admin"[^>]*aria-current/);
});

test('unknown Admin path is a 404 instead of silently opening another section', () => {
  const user = { userId: 7, role: 'ADMIN', permissions: [{ code: permissions.dashboard }] };
  const html = renderWithRoute(
    '/admin/not-a-screen',
    user,
    React.createElement(AdminSectionRoute, { section: 'not-a-screen' }),
  );
  assert.match(html, /404 - Không tìm thấy trang/);
});
