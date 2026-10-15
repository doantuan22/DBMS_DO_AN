import {
  actionDraft,
  complaintQuery,
  parseComplaintQuery,
  EMPTY_SUPPORT_FILTERS,
  PROCESSING_STATUSES,
} from './complaintModel.js';
export function createComplaintController({
  adapter,
  store,
  initialQuery = '',
  onQueryChange = () => {},
}) {
  const cached = store?.getScreen('complaints'),
    parsed = parseComplaintQuery(initialQuery),
    params = new URLSearchParams(initialQuery);
  let state = {
    applied: {
      ...EMPTY_SUPPORT_FILTERS,
      ...cached?.applied,
      ...Object.fromEntries(Object.entries(parsed.applied).filter(([key]) => params.has(key))),
    },
    page: params.has('page') ? parsed.page : (cached?.page ?? 1),
    selectedId: params.has('selectedId') ? parsed.selectedId : (cached?.selectedId ?? null),
    pageSize: 20,
    queue: { status: 'loading', rows: [] },
    detail: { status: 'idle' },
    draft: null,
    baseline: null,
    pending: false,
    confirmation: null,
    notice: null,
  };
  state.filters = { ...state.applied };
  let active = true,
    queueGeneration = 0,
    detailGeneration = 0,
    writing = false;
  const listeners = new Set(),
    busy = () => writing || store?.getSnapshot().pending,
    draftKey = (id) => `complaint:${id}`;
  const publish = (patch) => {
    state = { ...state, ...patch };
    if (active)
      store?.setScreen('complaints', {
        applied: state.applied,
        selectedId: state.selectedId,
        page: state.page,
      });
    listeners.forEach((l) => l());
  };
  const dirty = () =>
    Boolean(state.draft && JSON.stringify(state.draft) !== JSON.stringify(state.baseline));
  const persist = () => {
    if (state.selectedId && state.draft)
      store?.setDraft(
        draftKey(state.selectedId),
        dirty()
          ? {
              dirty: true,
              draft: structuredClone(state.draft),
              baseline: structuredClone(state.baseline),
            }
          : null,
      );
  };
  const url = (replace = false) => {
    if (active) onQueryChange(complaintQuery(state), { replace });
  };
  async function loadQueue() {
    const generation = ++queueGeneration,
      filters = { ...state.applied };
    publish({ queue: { status: 'loading', rows: [] } });
    try {
      const rows = await adapter.list(filters);
      if (!active || generation !== queueGeneration) return;
      publish({
        queue: { status: 'success', rows },
        page: Math.min(state.page, Math.max(1, Math.ceil(rows.length / state.pageSize))),
      });
    } catch (error) {
      if (active && generation === queueGeneration)
        publish({ queue: { status: 'error', rows: [], error } });
    }
  }
  async function loadDetail(id) {
    const generation = ++detailGeneration;
    publish({
      selectedId: id,
      detail: { status: id ? 'loading' : 'idle' },
      draft: null,
      baseline: null,
      confirmation: null,
    });
    if (!id) return;
    try {
      const complaint = await adapter.detail(id);
      if (!active || generation !== detailGeneration || state.selectedId !== id) return;
      if (complaint?.id !== id) throw new Error('Dữ liệu khiếu nại không khớp hồ sơ đã chọn.');
      const saved = store?.getDraft(draftKey(id)),
        baseline = saved?.baseline ?? actionDraft(complaint),
        draft = saved?.draft ?? structuredClone(baseline);
      publish({ detail: { status: 'success', complaint }, baseline, draft });
      persist();
    } catch (error) {
      if (active && generation === detailGeneration)
        publish({ detail: { status: 'error', error }, draft: null, baseline: null });
    }
  }
  const controller = {
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getSnapshot: () => state,
    async start() {
      active = true;
      if (!adapter.allowed) {
        publish({
          queue: {
            status: 'error',
            rows: [],
            error: Object.assign(new Error('Không đủ quyền Admin tra cứu khiếu nại.'), {
              status: 403,
            }),
          },
        });
        return;
      }
      await Promise.all([loadQueue(), loadDetail(state.selectedId)]);
      url(true);
    },
    dispose() {
      active = false;
      queueGeneration++;
      detailGeneration++;
    },
    reload: loadQueue,
    reloadDetail: () => loadDetail(state.selectedId),
    setFilters(patch) {
      if (!busy()) publish({ filters: { ...state.filters, ...patch } });
    },
    removeFilter(key) {
      if (busy() || !Object.hasOwn(EMPTY_SUPPORT_FILTERS, key)) return;
      const value = EMPTY_SUPPORT_FILTERS[key];
      publish({
        filters: { ...state.filters, [key]: value },
        applied: { ...state.applied, [key]: value },
        page: 1,
      });
      url();
      void loadQueue();
    },
    async applyFilters() {
      if (!busy()) {
        const unchanged = Object.keys(EMPTY_SUPPORT_FILTERS).every(
          (key) => state.filters[key] === state.applied[key],
        );
        if (unchanged && state.page === 1) return;
        publish({ applied: { ...state.filters }, page: 1 });
        url();
        await loadQueue();
      }
    },
    resetFilters() {
      if (!busy()) {
        publish({ filters: { ...EMPTY_SUPPORT_FILTERS } });
        return controller.applyFilters();
      }
    },
    setPage(page) {
      if (!busy() && Number.isSafeInteger(page) && page > 0) {
        publish({ page });
        url();
      }
    },
    async select(id) {
      if (busy() || !adapter.allowed) return;
      persist();
      await loadDetail(id);
      url();
    },
    async syncQuery(query) {
      if (busy()) {
        url(true);
        return;
      }
      const next = parseComplaintQuery(query);
      next.applied.search = state.applied.search;
      next.applied.type = state.applied.type;
      if (complaintQuery(next) === complaintQuery(state)) return;
      persist();
      publish({ applied: next.applied, filters: { ...next.applied }, page: next.page });
      await Promise.all([loadQueue(), loadDetail(next.selectedId)]);
    },
    changeProcessing(patch) {
      if (!busy() && adapter.writable && state.draft) {
        publish({
          draft: { ...state.draft, processing: { ...state.draft.processing, ...patch } },
          notice: null,
        });
        persist();
      }
    },
    changeStatus(status) {
      if (!busy() && adapter.writable && state.draft) {
        publish({ draft: { ...state.draft, status }, notice: null });
        persist();
      }
    },
    request(action) {
      if (
        busy() ||
        !['processing', 'status', 'discard'].includes(action) ||
        !adapter.writable ||
        state.detail.status !== 'success' ||
        !state.draft
      )
        return;
      if (action === 'discard') {
        publish({
          confirmation: { action, id: state.selectedId, title: state.detail.complaint.title },
        });
        return;
      }
      const body =
        action === 'processing'
          ? { ...state.draft.processing, content: state.draft.processing.content.trim() }
          : { status: state.draft.status };
      if (
        (action === 'processing' && !body.content) ||
        !PROCESSING_STATUSES.includes(action === 'processing' ? body.nextStatus : body.status)
      ) {
        publish({ notice: { error: new Error('Nhập nội dung xử lý và chọn trạng thái hợp lệ.') } });
        return;
      }
      publish({
        confirmation: { action, id: state.selectedId, title: state.detail.complaint.title, body },
      });
    },
    cancelConfirmation() {
      if (!busy()) publish({ confirmation: null });
    },
    async confirm() {
      const action = state.confirmation;
      if (!action || busy() || !adapter.writable || action.id !== state.selectedId) return;
      if (action.action === 'discard') {
        publish({ draft: structuredClone(state.baseline), confirmation: null });
        persist();
        return;
      }
      writing = true;
      const token = store?.beginWrite();
      publish({ pending: true, notice: null });
      try {
        await (action.action === 'processing'
          ? adapter.process(action.id, action.body)
          : adapter.status(action.id, action.body));
        const key = draftKey(action.id),
          saved = store?.getDraft(key);
        // Clear only the action just saved; keep the independent note/status draft.
        const draft = structuredClone(saved?.draft ?? state.draft),
          baseline = structuredClone(saved?.baseline ?? state.baseline);
        if (action.action === 'processing') {
          draft.processing = { content: '', nextStatus: action.body.nextStatus };
          baseline.processing = { ...draft.processing };
        } else {
          draft.status = action.body.status;
          baseline.status = action.body.status;
        }
        store?.setDraft(
          key,
          JSON.stringify(draft) !== JSON.stringify(baseline)
            ? { dirty: true, draft, baseline }
            : null,
        );
        if (!active) return;
        publish({
          draft,
          baseline,
          confirmation: null,
          notice: {
            text:
              action.action === 'processing'
                ? 'Đã ghi nhận xử lý; lịch sử được giữ nguyên.'
                : 'Đã cập nhật trạng thái.',
          },
        });
        await Promise.all([loadQueue(), loadDetail(action.id)]);
      } catch (error) {
        if (active) publish({ confirmation: null, notice: { error } });
      } finally {
        writing = false;
        if (token) store.endWrite(token);
        if (active) publish({ pending: false });
      }
    },
  };
  return controller;
}
