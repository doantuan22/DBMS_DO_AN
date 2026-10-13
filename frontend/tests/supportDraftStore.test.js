import assert from 'node:assert/strict';
import test from 'node:test';
import { createSupportDraftStore } from '../src/features/support/supportDraftStore.js';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test('complaint drafts are isolated by user scope and complaint ID', () => {
  const storage = createMemoryStorage();
  const firstAgent = createSupportDraftStore('agent-a', storage);
  const secondAgent = createSupportDraftStore('agent-b', storage);

  firstAgent.writeComplaintDraft(12, {
    processing: { content: 'Draft for case twelve', nextStatus: 'Đang xử lý' },
  });
  firstAgent.writeComplaintDraft(13, {
    processing: { content: 'Draft for case thirteen', nextStatus: 'Đang xử lý' },
  });

  assert.equal(firstAgent.readComplaintDraft(12).processing.content, 'Draft for case twelve');
  assert.equal(firstAgent.readComplaintDraft(13).processing.content, 'Draft for case thirteen');
  assert.deepEqual(secondAgent.readComplaintDraft(12), { processing: null, statusValue: null });
});

test('workspace state and case drafts survive store recreation in the same browser session', () => {
  const storage = createMemoryStorage();
  const beforeNavigation = createSupportDraftStore('agent-a', storage);
  beforeNavigation.writeWorkspace({
    draftFilters: { search: 'movie', ignored: 'value' },
    appliedFilters: { status: 'Mới' },
    selectedId: '42',
  });
  beforeNavigation.writeComplaintDraft(42, {
    processing: { content: 'Return to this case', nextStatus: 'Đã giải quyết' },
    statusValue: 'Đang xử lý',
  });

  const afterNavigation = createSupportDraftStore('agent-a', storage);
  assert.deepEqual(afterNavigation.readWorkspace(), {
    draftFilters: { status: '', type: '', search: 'movie', priority: '' },
    appliedFilters: { status: 'Mới', type: '', search: '', priority: '' },
    selectedId: 42,
  });
  assert.deepEqual(afterNavigation.readComplaintDraft(42), {
    processing: { content: 'Return to this case', nextStatus: 'Đã giải quyết' },
    statusValue: 'Đang xử lý',
  });
});

test('clearing a saved processing action preserves the separate status draft', () => {
  const store = createSupportDraftStore('agent-a', createMemoryStorage());
  store.writeComplaintDraft(19, {
    processing: { content: 'Save this timeline entry', nextStatus: 'Đang xử lý' },
    statusValue: 'Đã giải quyết',
  });

  store.clearProcessingDraft(19);
  assert.deepEqual(store.readComplaintDraft(19), {
    processing: null,
    statusValue: 'Đã giải quyết',
  });
});

test('clearing a status update preserves the separate processing draft', () => {
  const store = createSupportDraftStore('agent-a', createMemoryStorage());
  store.writeComplaintDraft(20, {
    processing: { content: 'Keep this unsaved note', nextStatus: 'Đang xử lý' },
    statusValue: 'Đã đóng',
  });

  store.clearStatusDraft(20);
  assert.deepEqual(store.readComplaintDraft(20), {
    processing: { content: 'Keep this unsaved note', nextStatus: 'Đang xử lý' },
    statusValue: null,
  });
});

test('discard removes the selected case draft without changing queue state', () => {
  const store = createSupportDraftStore('agent-a', createMemoryStorage());
  store.writeWorkspace({ selectedId: 22, appliedFilters: { priority: 'Cao' } });
  store.writeComplaintDraft(22, {
    processing: { content: 'Discard me', nextStatus: 'Đang xử lý' },
  });

  store.clearComplaintDraft(22);
  assert.deepEqual(store.readComplaintDraft(22), { processing: null, statusValue: null });
  assert.equal(store.readWorkspace().selectedId, 22);
  assert.equal(store.readWorkspace().appliedFilters.priority, 'Cao');
});
