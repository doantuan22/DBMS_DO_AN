import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let PageHeader;
let FilterBar;
let ResourceTable;
let ResourceSelect;
let ConfirmDialog;
let AsyncState;

before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ default: PageHeader } = await vite.ssrLoadModule('/src/components/ui/PageHeader.jsx'));
  ({ default: FilterBar } = await vite.ssrLoadModule('/src/components/ui/FilterBar.jsx'));
  ({ default: ResourceTable } = await vite.ssrLoadModule('/src/components/ui/ResourceTable.jsx'));
  ({ default: ResourceSelect } = await vite.ssrLoadModule('/src/components/ui/ResourceSelect.jsx'));
  ({ default: ConfirmDialog } = await vite.ssrLoadModule('/src/components/ui/ConfirmDialog.jsx'));
  ({ default: AsyncState } = await vite.ssrLoadModule('/src/components/ui/AsyncState.jsx'));
});

after(async () => {
  await vite?.close();
});

const render = (Component, props = {}) =>
  renderToStaticMarkup(React.createElement(Component, props));

test('PageHeader accepts the blueprint primaryAction API and keeps the legacy actions alias', () => {
  const primary = render(PageHeader, {
    title: 'Movies',
    primaryAction: React.createElement('button', { disabled: true }, 'Create'),
  });
  assert.match(primary, /<h1[^>]*>Movies<\/h1>/);
  assert.match(primary, /disabled=""[^>]*>Create/);

  const legacy = render(PageHeader, { title: 'Orders', actions: React.createElement('a', { href: '/orders/new' }, 'New') });
  assert.match(legacy, /href="\/orders\/new"/);
});

test('FilterBar keeps draft and applied filter state external and renders only schema-backed chips', () => {
  const html = render(FilterBar, {
    schema: [
      { key: 'status', label: 'Status' },
      { key: 'query', label: 'Search' },
    ],
    draft: { status: 'active', query: 'draft value' },
    applied: { status: 'active', query: '' },
    onApply() {},
    onReset() {},
    children: React.createElement('input', { name: 'query', value: 'draft value', readOnly: true }),
  });
  assert.match(html, /aria-label="Bộ lọc"/);
  assert.match(html, /<span>Status:<\/span> active/);
  assert.doesNotMatch(html, /<span>Search:<\/span>/);
  assert.match(html, /Có thay đổi chưa được áp dụng/);
  assert.match(html, /type="reset"/);
  assert.match(html, /type="submit"/);
});

test('ResourceTable renders STT instead of implicit row IDs and server-backed pagination', () => {
  const html = render(ResourceTable, {
    caption: 'Resources',
    columns: [{ key: 'name', label: 'Name' }],
    rows: [{ id: 7001, name: 'Alpha' }, { id: 7002, name: 'Beta' }],
    pagination: { page: 2, pageSize: 2, total: 5, onPageChange() {} },
  });
  assert.match(html, /<th scope="col"[^>]*>STT<\/th>/);
  assert.match(html, /<td class="ui-data-table__row-number">3<\/td>/);
  assert.match(html, /<td class="ui-data-table__row-number">4<\/td>/);
  assert.doesNotMatch(html, /7001|7002/);
  assert.match(html, /Trang 2 \/ 3 · 5 kết quả/);
  assert.match(html, /aria-label="Phân trang Resources"/);

  const firstPage = render(ResourceTable, {
    columns: [{ key: 'name', label: 'Name' }],
    rows: [{ id: 1, name: 'First' }],
    pagination: { page: 1, pageSize: 1, total: 2, onPageChange() {} },
  });
  assert.match(firstPage, /disabled=""[^>]*>Trang trước/);
});

test('ResourceTable maps loading, empty, forbidden, not-found and conflict responses to explicit states', () => {
  const statuses = [
    ['loading', /Đang tải dữ liệu/],
    ['empty', /Chưa có dữ liệu phù hợp/],
    ['forbidden', /Bạn không có quyền/],
    ['notFound', /Không tìm thấy nội dung/],
    ['conflict', /Dữ liệu đã thay đổi/],
  ];
  for (const [status, expected] of statuses) {
    assert.match(render(ResourceTable, { columns: [{ key: 'name', label: 'Name' }], rows: [], status }), expected);
  }
  assert.match(render(ResourceTable, {
    columns: [{ key: 'name', label: 'Name' }], rows: [], status: 'error', error: { status: 403 },
  }), /Bạn không có quyền/);
  assert.match(render(ResourceTable, {
    columns: [{ key: 'name', label: 'Name' }], rows: [], status: 'error', error: { status: 409 },
  }), /Dữ liệu đã thay đổi/);
});

test('ResourceSelect exposes named options and links lookup error state to the control', () => {
  const ready = render(ResourceSelect, {
    label: 'Cinema',
    value: '19',
    options: [{ id: 19, label: 'Central Cinema', meta: 'Downtown' }],
    lookupStatus: 'success',
    scopeKey: 'cinema-scope-1',
    onChange() {},
  });
  assert.match(ready, /Central Cinema/);
  assert.match(ready, /<option value="19"/);
  assert.doesNotMatch(ready, /Downtown/);

  const failed = render(ResourceSelect, {
    label: 'Room', value: '', options: [], lookupStatus: 'error', lookupError: { message: 'Lookup failed' }, onRetry() {},
  });
  assert.match(failed, /aria-invalid="true"/);
  assert.match(failed, /aria-describedby="[^"]+ [^"]+-error"/);
  assert.match(failed, /role="alert"/);
  assert.match(failed, /Tải lại/);
});

test('ConfirmDialog has modal semantics, safe initial focus target and a contextual entity label', () => {
  const html = render(ConfirmDialog, {
    open: true,
    title: 'Cancel booking?',
    body: 'This action preserves history.',
    entityLabel: 'Order for customer · film title',
    dangerLevel: 'dangerous',
    onOpenChange() {},
    onConfirm() {},
  });
  assert.match(html, /<dialog[^>]*aria-modal="true"/);
  assert.match(html, /Order for customer · film title/);
  assert.match(html, /This action preserves history\./);
  const describedBy = html.match(/aria-describedby="([^"]+)"/)?.[1];
  assert.ok(describedBy);
  assert.ok(html.includes(`id="${describedBy}"`));
  assert.match(html, /autofocus|Đóng hộp thoại/);
  assert.match(html, /Xác nhận/);
  assert.match(html, /Hủy/);
});

test('AsyncState presents separate forbidden, not-found and conflict states', () => {
  assert.match(render(AsyncState, { status: 'forbidden' }), /ui-async-state--forbidden/);
  assert.match(render(AsyncState, { status: 'notFound' }), /ui-async-state--notFound/);
  assert.match(render(AsyncState, { status: 'conflict' }), /ui-async-state--conflict/);
  assert.match(render(AsyncState, { status: 'error', error: { status: 404 } }), /Không tìm thấy nội dung/);
  assert.match(render(AsyncState, { status: 'error', error: { status: 409 } }), /Dữ liệu đã thay đổi/);
  assert.match(render(AsyncState, { status: 'success', children: 'Loaded' }), /Loaded/);
});
