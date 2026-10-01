import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let AdminPortal;

before(async () => {
  vite = await createServer({ configFile: 'vite.config.js', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  ({ default: AdminPortal } = await vite.ssrLoadModule('/src/pages/AdminPortal.jsx'));
});

after(async () => { await vite?.close(); });

test('Admin portal exposes the ADM resource work areas, including global cinema resources', () => {
  const html = renderToStaticMarkup(React.createElement(AdminPortal));
  for (const label of ['Tài khoản', 'Vai trò', 'Quyền', 'Phân công', 'Rạp', 'Phòng', 'Ghế', 'Phim', 'Sản phẩm', 'Khuyến mãi', 'Bảng giá', 'Suất chiếu', 'Khiếu nại', 'Doanh thu']) {
    assert.ok(html.includes(label), `missing Admin area: ${label}`);
  }
  assert.match(html, /aria-label="Cổng quản trị hệ thống"/);
});
