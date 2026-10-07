import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

let vite;
let AppRoutes;
let AuthProvider;
let SeatMap;
let StatusBadge;

before(async () => {
  vite = await createServer({ configFile: 'vite.config.js', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  ({ default: AppRoutes } = await vite.ssrLoadModule('/src/routes/index.jsx'));
  ({ AuthProvider } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'));
  ({ default: SeatMap } = await vite.ssrLoadModule('/src/components/SeatMap.jsx'));
  ({ default: StatusBadge } = await vite.ssrLoadModule('/src/components/primitives/StatusBadge.jsx'));
});

after(async () => { await vite?.close(); });

const renderRoute = (path) => renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] },
  React.createElement(AuthProvider, null, React.createElement(AppRoutes))));

test('unknown paths show the 404 page inside the public layout', () => {
  const html = renderRoute('/khong-ton-tai');
  assert.match(html, /404 - Không tìm thấy trang/);
  assert.match(html, /class="area__header"/);
  assert.match(html, /href="#main-content"/);
  assert.match(html, /id="main-content"/);
});

test('guests see login and register actions in the shared header and the site footer', () => {
  const html = renderRoute('/movies');
  assert.match(html, /href="\/login"/);
  assert.match(html, /href="\/register"/);
  assert.match(html, /class="area__footer"/);
  assert.doesNotMatch(html, /Đăng xuất/);
});

test('seat map groups seats by row, orders them numerically and names every seat for assistive tech', () => {
  const html = renderToStaticMarkup(React.createElement(SeatMap, {
    seats: [
      { id: 2, row: 'A', number: 10, label: 'A10', type: 'Thường', status: 'Đã đặt' },
      { id: 1, row: 'A', number: 2, label: 'A2', type: 'Thường', status: 'Trống' },
      { id: 3, row: 'B', number: 1, label: 'B1', type: 'VIP', status: 'Trống' },
    ],
    selectedSeatIds: [],
    onToggle() {},
  }));
  assert.equal((html.match(/class="seat-row"/g) ?? []).length, 2);
  assert.ok(html.indexOf('aria-label="A2 — Trống"') < html.indexOf('aria-label="A10 — Đã đặt"'));
  assert.ok(html.indexOf('aria-label="A10 — Đã đặt"') < html.indexOf('aria-label="B1 — Trống"'));
  assert.match(html, /data-type="VIP"/);
  assert.match(html, /Màn hình/);
  assert.match(html, /seat-map__legend/);
});

test('seat map still renders rows for seats without row or number fields', () => {
  const html = renderToStaticMarkup(React.createElement(SeatMap, {
    seats: [{ id: 2, label: 'C12', status: 'Trống' }, { id: 1, label: 'C3', status: 'Trống' }],
    selectedSeatIds: [], onToggle() {},
  }));
  assert.equal((html.match(/class="seat-row"/g) ?? []).length, 1);
  assert.ok(html.indexOf('aria-label="C3 — Trống"') < html.indexOf('aria-label="C12 — Trống"'));
});

test('status badge maps database statuses to a tone and falls back to neutral', () => {
  const badge = (status) => renderToStaticMarkup(React.createElement(StatusBadge, { status }));
  assert.match(badge('Chờ thanh toán'), /badge--warning/);
  assert.match(badge('Đã thanh toán'), /badge--success/);
  assert.match(badge('Đã hủy'), /badge--danger/);
  assert.match(badge('Đã giải quyết'), /badge--success/);
  assert.match(badge('Trạng thái lạ'), /badge--muted/);
  assert.equal(badge(null), '');
});
