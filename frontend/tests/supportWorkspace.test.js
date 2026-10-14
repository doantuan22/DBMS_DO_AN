import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import {
  supportRoute,
  supportQuery,
  supportCasePath,
} from '../src/features/support/supportNavigation.js';
import { createSupportDraftStore } from '../src/features/support/supportDraftStore.js';
let vite, View;
before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ default: View } = await vite.ssrLoadModule('/src/features/support/SupportWorkspaceView.jsx'));
});
after(async () => {
  await vite?.close();
});
test('support canonical deep link keeps only safe query fields and rejects unknown/overflow IDs', () => {
  assert.deepEqual(supportRoute('/support'), { kind: 'queue' });
  assert.deepEqual(supportRoute('/support/complaints/21'), { kind: 'case', id: 21 });
  for (const p of [
    '/support/other',
    '/support/complaints/0',
    '/support/complaints/2147483648',
    '/support/complaints/not-an-id',
  ])
    assert.equal(supportRoute(p).kind, 'notFound');
  const query = supportQuery({
    status: 'Mới',
    priority: 'Cao',
    search: 'private@example.test',
    type: 'Sensitive',
    content: 'Secret',
  });
  assert.ok(
    !query.includes('private') && !query.includes('Sensitive') && !query.includes('Secret'),
  );
  assert.match(supportCasePath(21, { status: 'Mới' }), /^\/support\/complaints\/21\?/);
});
test('navigation guard observes drafts in inactive cases and clears only the correct action', () => {
  const store = createSupportDraftStore('uxr6-hidden-cases', null);
  assert.equal(store.hasDrafts(), false);
  store.writeComplaintDraft(1, {
    processing: { content: 'Note A', nextStatus: 'Đang xử lý' },
    statusValue: 'Đã đóng',
  });
  store.writeWorkspace({ selectedId: 2 });
  assert.equal(store.hasDrafts(), true);
  store.clearProcessingDraft(1);
  assert.equal(store.hasDrafts(), true);
  assert.equal(store.readComplaintDraft(1).statusValue, 'Đã đóng');
  store.clearStatusDraft(1);
  assert.equal(store.hasDrafts(), false);
});
const props = (more = {}) => ({
  queue: {
    status: 'success',
    rows: [
      {
        id: 21,
        title: 'Chất lượng dịch vụ',
        senderName: 'Khách A',
        type: 'Dịch vụ',
        priority: 'Cao',
        status: 'Mới',
        createdAt: '2026-10-12T00:00:00.000Z',
      },
    ],
  },
  detail: {
    status: 'success',
    complaint: {
      id: 21,
      title: 'Chất lượng dịch vụ',
      senderName: 'Khách A',
      type: 'Dịch vụ',
      priority: 'Cao',
      status: 'Mới',
      createdAt: '2026-10-12T00:00:00.000Z',
      content: 'Nội dung gốc',
      processings: [
        {
          id: 31,
          processorName: 'CSKH A',
          processedAt: '2026-10-12T01:00:00.000Z',
          status: 'Đang xử lý',
          content: 'Diễn biến duy nhất',
        },
      ],
    },
  },
  selectedId: 21,
  draftFilters: { search: '', type: '', status: '', priority: '' },
  appliedFilters: {},
  processing: { content: 'Nháp riêng', nextStatus: 'Đang xử lý' },
  statusValue: 'Đang xử lý',
  busy: false,
  canProcess: true,
  canReference: false,
  routeCase: true,
  ...more,
});
const render = (p) =>
  renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(View, p)));
test('support presentation has three named panes, one timeline and business names rather than raw IDs', () => {
  const html = render(props());
  assert.match(html, /Hàng chờ khiếu nại/);
  assert.match(html, /Tham chiếu và hành động/);
  assert.match(html, /Về hàng chờ/);
  assert.equal(html.match(/Diễn biến duy nhất/g)?.length, 1);
  assert.doesNotMatch(html, />21<|processorId|senderId/);
});
test('support permission/errors/pending states never expose unauthorized PII or enabled write actions', () => {
  const read = render(props({ canProcess: false }));
  assert.doesNotMatch(read, /Ghi diễn biến xử lý/);
  assert.match(read, /cần quyền xử lý/);
  const denied = render(
    props({
      detail: { status: 'error', error: Object.assign(new Error('Denied'), { status: 403 }) },
      queue: {
        status: 'error',
        rows: [],
        error: Object.assign(new Error('Denied'), { status: 403 }),
      },
    }),
  );
  assert.doesNotMatch(denied, /Nháp riêng|Nội dung gốc|Khách A/);
  assert.match(denied, /không có quyền/);
  const pending = render(props({ busy: true }));
  assert.match(pending, /disabled/);
  assert.match(pending, /aria-busy="true"/);
});
