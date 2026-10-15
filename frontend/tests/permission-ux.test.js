import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

let vite, AuthContext, RequireRole, Login, NoWorkspaceAccess;
before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ AuthContext } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'));
  ({ default: RequireRole } = await vite.ssrLoadModule('/src/routes/RequireRole.jsx'));
  ({ default: Login } = await vite.ssrLoadModule('/src/pages/auth/Login.jsx'));
  ({ default: NoWorkspaceAccess } = await vite.ssrLoadModule(
    '/src/components/NoWorkspaceAccess.jsx',
  ));
});
after(async () => {
  await vite?.close();
});

test('permission lookup failures hold protected routes and offer an accessible retry', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      AuthContext.Provider,
      {
        value: {
          user: null,
          initializing: false,
          authIssue: { kind: 'unavailable' },
          refreshCurrentUser: async () => {},
        },
      },
      React.createElement(MemoryRouter, null, React.createElement(RequireRole, { role: 'ADMIN' })),
    ),
  );
  assert.match(html, /Không thể xác minh tài khoản/);
  assert.match(html, /Thử lại/);
  assert.doesNotMatch(html, /disabled=""/);
});

test('expired sessions explain why login is required and permissionless workspaces are explicit', () => {
  const expiredLogin = renderToStaticMarkup(
    React.createElement(
      AuthContext.Provider,
      { value: { login: async () => {} } },
      React.createElement(
        MemoryRouter,
        { initialEntries: [{ pathname: '/login', state: { sessionExpired: true } }] },
        React.createElement(Login),
      ),
    ),
  );
  assert.match(expiredLogin, /Phiên đăng nhập đã hết hạn/);

  const noAccess = renderToStaticMarkup(
    React.createElement(MemoryRouter, null, React.createElement(NoWorkspaceAccess)),
  );
  assert.match(noAccess, /Chưa có chức năng được cấp quyền/);
  assert.match(noAccess, /href="\/profile"/);
});
