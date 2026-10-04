import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let AdminPortal;
let AuthContext;

before(async () => {
  vite = await createServer({ configFile: 'vite.config.js', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  ({ default: AdminPortal } = await vite.ssrLoadModule('/src/pages/AdminPortal.jsx'));
  ({ AuthContext } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'));
});

after(async () => { await vite?.close(); });

test('Admin portal exposes the ADM resource work areas, including global cinema resources', async () => {
  const { ADMIN_SECTION_PERMISSIONS } = await vite.ssrLoadModule('/src/utils/authorization.js');
  const user = { role: 'ADMIN', permissions: Object.values(ADMIN_SECTION_PERMISSIONS).map(code => ({ code })) };
  const html = renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user } }, React.createElement(AdminPortal)));
  for (const label of ['Tài khoản', 'Vai trò', 'Quyền', 'Phân công', 'Rạp', 'Ảnh rạp', 'Phòng', 'Ghế', 'Phim', 'Sản phẩm', 'Khuyến mãi', 'Bảng giá', 'Suất chiếu', 'Khiếu nại', 'Doanh thu']) {
    assert.ok(html.includes(label), `missing Admin area: ${label}`);
  }
  assert.match(html, /aria-label="Cổng quản trị hệ thống"/);
});

test('cinema image status is chosen from the whitelist, not typed freely', async () => {
  const { CINEMA_IMAGE_STATUSES } = await vite.ssrLoadModule('/src/constants/cinemaImageStatuses.js');
  assert.deepEqual(CINEMA_IMAGE_STATUSES, ['Hoạt động', 'Tạm ẩn']);
  const source = (await import('node:fs')).readFileSync(new URL('../src/components/CinemaImageManager.jsx', import.meta.url), 'utf8');
  assert.match(source, /<label>Trạng thái<select /);
  assert.doesNotMatch(source, /<label>Trạng thái<input /);
});
