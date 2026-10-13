import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

let vite;
let AuthProvider;
let Login;
let Register;

before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ AuthProvider } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'));
  ({ default: Login } = await vite.ssrLoadModule('/src/pages/auth/Login.jsx'));
  ({ default: Register } = await vite.ssrLoadModule('/src/pages/auth/Register.jsx'));
});

after(async () => {
  await vite?.close();
});

function render(Page) {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(AuthProvider, null, React.createElement(Page)),
    ),
  );
}

test('login page renders accessible email and password controls', () => {
  const html = render(Login);
  assert.match(html, /Đăng nhập/);
  assert.match(html, /type="email"/);
  assert.match(html, /type="password"/);
});

test('customer registration renders profile fields without a role selector', () => {
  const html = render(Register);
  assert.match(html, /Đăng ký khách hàng/);
  assert.match(html, /HoTen|Họ tên/);
  assert.match(html, /Ngày sinh/);
  assert.doesNotMatch(html, /ADMIN|CSKH|QUAN_LY_RAP/);
});
