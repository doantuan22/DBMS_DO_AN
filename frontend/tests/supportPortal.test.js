import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

let vite;
let SupportPortal;

before(async () => {
  vite = await createServer({ configFile: 'vite.config.js', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  ({ default: SupportPortal } = await vite.ssrLoadModule('/src/pages/SupportPortal.jsx'));
});

after(async () => { await vite?.close(); });

test('CSKH portal renders queue filters and a protected loading state', () => {
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(SupportPortal)));
  assert.match(html, /CSKH Portal/);
  assert.match(html, /Lọc trạng thái/);
  assert.match(html, /Tìm khiếu nại/);
  assert.match(html, /Đang tải hàng chờ khiếu nại/);
});
