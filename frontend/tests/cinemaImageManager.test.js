import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let CinemaImageManager;
let AuthContext;
before(async () => {
  vite = await createServer({ configFile: 'vite.config.js', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  ({ default: CinemaImageManager } = await vite.ssrLoadModule('/src/components/CinemaImageManager.jsx'));
  ({ AuthContext } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'));
});
after(async () => { await vite?.close(); });
const render = user => renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user } }, React.createElement(CinemaImageManager)));

test('image management requires Admin and QL_RAP together', () => {
  for (const user of [null, { role: 'ADMIN', permissions: [] }, { role: 'CSKH', permissions: [{ code: 'QL_RAP' }] }]) {
    const html = render(user);
    assert.match(html, /Bạn chưa được cấp quyền quản lý ảnh rạp/);
    assert.doesNotMatch(html, /<form|<select|<button/);
  }
});

test('authorized initial render has a disabled cinema selector until its list loads', () => {
  const html = render({ role: 'ADMIN', permissions: [{ code: 'QL_RAP' }] });
  assert.match(html, /<select[^>]*aria-label="Chọn rạp"[^>]*disabled/);
  assert.match(html, /role="status"[^>]*>Đang tải danh sách rạp/);
});

test('no image editor, mutation or legitimate empty-image message exists without a selected cinema', () => {
  const html = render({ role: 'ADMIN', permissions: [{ code: 'QL_RAP' }] });
  assert.doesNotMatch(html, /<form|<table|Rạp này chưa có ảnh|Đang tải ảnh rạp/);
  assert.doesNotMatch(html, />Lưu<|>Xóa<|>Sửa<|>Chọn đại diện</);
});
