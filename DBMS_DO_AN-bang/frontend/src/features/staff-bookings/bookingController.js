import { activeTickets, emptyBookingDraft, emptyBookingFilters, parseBookingQuery, bookingQuery, bookingDirty, bookingSelection, bookingCanEdit } from './bookingModel.js';
import { toggleSeatSelection, SEAT_LIMIT_MESSAGE } from '../../utils/bookingLimits.js';

export function createBookingController({ api, managerStore, cinemaId, initialQuery = '', onQueryChange = () => {} }) {
  const key = 'staff-bookings', parsed = parseBookingQuery(initialQuery, cinemaId), cached = managerStore?.getScreen(key), saved = managerStore?.getDraft(key);
  const restore = saved?.dirty ? saved : null;
  const initialParams = new URLSearchParams(initialQuery);
  const applied = { ...parsed.applied, ...(cached?.applied ?? {}), ...Object.fromEntries(Object.entries(parsed.applied).filter(([key]) => initialParams.has(key))), ...(cinemaId ? { cinemaId } : {}) };
  let state = { ...parsed, selectedId: restore?.selectedId ?? parsed.selectedId, applied, filters: { search: applied.search, status: applied.status, cinemaId: applied.cinemaId },
    metadata: { status: 'loading' }, list: { status: 'loading' }, detail: { status: 'idle' }, options: { status: 'idle' }, customers: { status: 'idle' },
    editor: null, draft: emptyBookingDraft(cinemaId), customerSearch: '', step: 0, expectedSeatIds: [], expectedTicketIds: [],
    ...restore, dirty: Boolean(restore), pending: false, confirmation: null, notice: null, limitNotice: null };
  let active = true, writing = false;
  const generations = { metadata: 0, list: 0, detail: 0, options: 0, customers: 0 }, listeners = new Set();
  const elapsedHolds = new Set();
  const ownsScope = managerStore?.capture() ?? (() => true), current = () => active && ownsScope(), busy = () => writing || managerStore?.getSnapshot().pending;
  const failure = (message, status = 409) => Object.assign(new Error(message), { status });
  const order = () => state.detail.status === 'success' && String(state.detail.order.id) === state.selectedId ? state.detail.order : null;
  const emit = (patch) => {
    state = { ...state, ...patch }; state.dirty = bookingDirty(state);
    if (current() && managerStore) {
      managerStore.setDraft(key, state.editor ? { editor: state.editor, draft: state.draft, selectedId: state.selectedId, customerSearch: state.customerSearch, step: state.step, expectedSeatIds: state.expectedSeatIds, expectedTicketIds: state.expectedTicketIds, dirty: state.dirty } : null);
      managerStore.setScreen(key, { applied: state.applied });
    }
    listeners.forEach((listener) => listener());
  };
  const url = (replace = false) => onQueryChange(bookingQuery(state), { replace });
  const reset = () => { generations.options++; generations.customers++; emit({ editor: null, draft: emptyBookingDraft(cinemaId), step: 0, customers: { status: 'idle' }, customerSearch: '', options: { status: 'idle' }, expectedSeatIds: [], expectedTicketIds: [], limitNotice: null }); };
  async function read(channel, request, success) {
    const generation = ++generations[channel]; emit({ [channel]: { status: 'loading' } });
    try { const data = await request(); if (current() && generation === generations[channel]) success(data); }
    catch (error) { if (current() && generation === generations[channel]) emit({ [channel]: { status: 'error', error } }); }
  }
  const loadList = () => {
    const filters = { ...state.applied };
    return read('list', () => api.list(filters), (data) => {
      if (cinemaId && data.orders.some((row) => String(row.RapID) !== cinemaId)) throw failure('Danh sách đơn không thuộc rạp hiện tại.', 403);
      const lastPage = Math.max(1, Math.ceil(data.total / filters.pageSize));
      if (filters.page > lastPage) { emit({ applied: { ...state.applied, page: lastPage } }); url(); void loadList(); return; }
      emit({ list: { status: 'success', data } });
    });
  };
  const loadDetail = () => {
    const id = state.selectedId;
    if (!id) { generations.detail++; emit({ detail: { status: 'idle' } }); return Promise.resolve(); }
    if (!/^[1-9]\d*$/.test(id)) { emit({ detail: { status: 'error', error: failure('Mã đơn trong URL không hợp lệ.', 400) } }); return Promise.resolve(); }
    return read('detail', () => api.detail(id), ({ order: data }) => {
      if (String(data.id) !== id || cinemaId && String(data.cinemaId) !== cinemaId) throw failure('Đơn không thuộc rạp hiện tại.', 403);
      emit({ detail: { status: 'success', order: data } });
    });
  };
  const loadMetadata = () => read('metadata', () => api.options(cinemaId ? { cinemaId } : {}), (data) => {
    if (cinemaId && !data.cinemas.some((row) => String(row.RapID) === cinemaId)) throw failure('Phân công rạp không còn hiệu lực.', 403);
    emit({ metadata: { status: 'success', data: { ...data, cinemas: cinemaId ? data.cinemas.filter((row) => String(row.RapID) === cinemaId) : data.cinemas } } });
  });
  const loadOptions = () => {
    const draft = { ...state.draft }, orderId = state.editor === 'edit' ? state.selectedId : null;
    if (!state.editor || !draft.cinemaId) { generations.options++; emit({ options: { status: 'idle' } }); return Promise.resolve(); }
    return read('options', () => api.options({ cinemaId: draft.cinemaId, showtimeId: draft.showtimeId, orderId }), (data) => {
      if (data.showtimes.some((row) => String(row.RapID) !== draft.cinemaId)) throw failure('Suất chiếu không thuộc rạp đang chọn.', 403);
      emit({ options: { status: 'success', data, cinemaId: draft.cinemaId, showtimeId: draft.showtimeId, orderId } });
    });
  };
  const run = (action) => {
    if (action.kind === 'close') { reset(); return; }
    if (action.kind === 'select') { reset(); emit({ selectedId: String(action.id ?? ''), detail: { status: 'idle' }, notice: null }); url(); void loadDetail(); return; }
    if (action.kind === 'create') { reset(); emit({ selectedId: '', detail: { status: 'idle' }, editor: 'create', draft: emptyBookingDraft(cinemaId ?? state.applied.cinemaId), notice: null }); url(); void loadOptions(); return; }
    if (action.kind === 'cinema') { emit({ draft: { ...state.draft, cinemaId: action.id, showtimeId: '', seatIds: [] }, step: 1, limitNotice: null }); void loadOptions(); return; }
    if (action.kind === 'show') { emit({ draft: { ...state.draft, showtimeId: action.id, seatIds: [] }, step: 1, limitNotice: null }); void loadOptions(); return; }
    if (action.kind === 'query') { reset(); emit({ ...action.next, filters: { search: action.next.applied.search, status: action.next.applied.status, cinemaId: action.next.applied.cinemaId }, notice: null }); url(); void loadList(); void loadDetail(); }
  };
  const guarded = (action, replacingSeats = false) => {
    if (busy() || !current()) return;
    if (replacingSeats ? state.draft.seatIds.length > 0 : state.dirty) emit({ confirmation: { kind: 'discard', action } }); else run(action);
  };
  const controller = {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }, getSnapshot: () => state,
    async start() { active = true; if (restore) url(true); await Promise.all([loadMetadata(), loadList(), loadDetail(), state.editor ? loadOptions() : Promise.resolve()]); },
    dispose() { active = false; for (const channel of Object.keys(generations)) generations[channel]++; },
    refresh: () => Promise.all([loadMetadata(), loadList(), loadDetail()]), reloadList: loadList, reloadDetail: loadDetail, reloadOptions: loadOptions,
    onHoldElapsed() { const data = order(); if (!data) return; const key = `${data.id}:${data.holdExpiresAt}`; if (!elapsedHolds.has(key)) { elapsedHolds.add(key); void loadDetail(); } },
    setFilters(patch) { if (!busy()) emit({ filters: { ...state.filters, ...patch, ...(cinemaId ? { cinemaId } : {}) } }); },
    applyFilters() { if (!busy()) { emit({ applied: { ...state.filters, page: 1, pageSize: 20 } }); url(); void loadList(); } },
    resetFilters() { if (!busy()) { emit({ filters: { ...emptyBookingFilters(), cinemaId: cinemaId ?? '' } }); controller.applyFilters(); } },
    setPage(page) { if (!busy()) { emit({ applied: { ...state.applied, page } }); url(); void loadList(); } },
    syncQuery(query) {
      const next = parseBookingQuery(query, cinemaId);
      next.applied.search = state.applied.search;
      if (bookingQuery(next) !== bookingQuery(state)) guarded({ kind: 'query', next });
    },
    showOrder(id) { guarded({ kind: 'select', id }); }, closeDetail() { guarded({ kind: 'select', id: '' }); },
    startCreate() { if (state.metadata.status === 'success' && state.metadata.data.cinemas.length) guarded({ kind: 'create' }); },
    startEdit() {
      const data = order(); if (busy() || !bookingCanEdit(data)) return;
      reset(); const tickets = activeTickets(data);
      emit({ editor: 'edit', draft: { customer: data.user, cinemaId: String(data.cinemaId), showtimeId: String(data.showtimeId), seatIds: tickets.map((t) => t.seatId) }, expectedSeatIds: tickets.map((t) => t.seatId), expectedTicketIds: tickets.map((t) => t.id), step: 2, notice: null }); void loadOptions();
    },
    closeEditor() { guarded({ kind: 'close' }); },
    setCustomerSearch(value) { if (!busy()) { generations.customers++; emit({ customerSearch: value, customers: { status: 'idle' } }); } },
    searchCustomers() { if (busy() || state.customerSearch.trim().length < 2) return; const search = state.customerSearch.trim(); return read('customers', () => api.customers(search), (data) => emit({ customers: { status: 'success', data } })); },
    chooseCustomer(id) { if (busy() || state.editor !== 'create' || state.customers.status !== 'success') return; const customer = state.customers.data.customers.find((row) => String(row.NguoiDungID) === String(id)); emit({ draft: { ...state.draft, customer: customer ?? null } }); },
    chooseCinema(id) { if (cinemaId || state.editor !== 'create' || id && !state.metadata.data?.cinemas.some((row) => String(row.RapID) === id)) return; guarded({ kind: 'cinema', id }, true); },
    chooseShowtime(id) { if (state.editor !== 'create' || id && !bookingSelection(state).current || id && !state.options.data?.showtimes.some((row) => String(row.SuatChieuID) === id && String(row.RapID) === state.draft.cinemaId)) return; guarded({ kind: 'show', id }, true); },
    toggleSeat(id) {
      if (busy() || !state.draft.seatIds.includes(id) && !bookingSelection(state).seats.some((seat) => seat.id === id && seat.status === 'Trống')) return;
      const result = toggleSeatSelection(state.draft.seatIds, id); emit({ draft: { ...state.draft, seatIds: result.selectedIds }, limitNotice: result.limitReached ? SEAT_LIMIT_MESSAGE : null });
    },
    goToStep(step) {
      if (busy() || !state.editor || step < (state.editor === 'edit' ? 2 : 0) || step > 3) return;
      const selection = bookingSelection(state);
      if (step > 0 && !state.draft.customer || step > 1 && (!state.draft.showtimeId || !selection.current) || step > 2 && !selection.valid) return;
      emit({ step });
    },
    cancelConfirmation() { if (!busy()) { emit({ confirmation: null }); url(); } },
    confirmDiscard() { if (!busy() && state.confirmation?.kind === 'discard') { const action = state.confirmation.action; emit({ confirmation: null }); run(action); } },
    requestCancel() { const data = order(); if (!busy() && !state.editor && data?.canCancel) emit({ confirmation: { kind: 'cancel', order: data, snapshot: { orderId: data.id } } }); },
    requestSave() {
      const selection = bookingSelection(state), data = order();
      if (busy() || state.step !== 3 || !selection.valid || !state.draft.customer || state.editor === 'edit' && !bookingCanEdit(data)) return;
      const snapshot = state.editor === 'create' ? { customerId: state.draft.customer.NguoiDungID, showtimeId: Number(state.draft.showtimeId), seatIds: [...state.draft.seatIds] }
        : { orderId: data.id, seatIds: [...state.draft.seatIds], expectedTicketIds: [...state.expectedTicketIds] };
      emit({ confirmation: { kind: state.editor === 'create' ? 'create' : 'edit', snapshot, order: data } });
    },
    async confirmMutation() {
      const confirmation = state.confirmation; if (!confirmation || !['create', 'edit', 'cancel'].includes(confirmation.kind) || busy() || !current()) return;
      const { kind, snapshot } = confirmation;
      if (kind === 'edit' && !bookingCanEdit(order())) throw failure('Hạn giữ chỗ đã hết hoặc đơn không còn cho phép đổi ghế.');
      writing = true; const token = managerStore?.beginWrite(); emit({ pending: true, notice: null });
      try {
        const result = kind === 'create' ? await api.create(snapshot) : kind === 'edit' ? await api.updateSeats(snapshot.orderId, { seatIds: snapshot.seatIds, expectedTicketIds: snapshot.expectedTicketIds }) : await api.cancel(snapshot.orderId);
        if (ownsScope()) managerStore?.setDraft(key, null);
        if (!current()) return;
        reset(); emit({ confirmation: null, selectedId: String(result.orderId ?? result.order.id), detail: result.order ? { status: 'success', order: result.order } : { status: 'loading' }, notice: { ok: true, text: kind === 'create' ? 'Đã tạo đơn Chờ thanh toán. Khách hàng thanh toán qua luồng hiện có.' : kind === 'edit' ? 'Đã cập nhật ghế; giữ lịch sử vé và hạn giữ chỗ.' : 'Đã hủy đơn và giải phóng ghế; lịch sử được giữ.' } }); url(); await Promise.all([loadList(), loadDetail()]);
      } catch (error) {
        if (current()) emit({ confirmation: null, notice: { error, conflict: error.status === 409 }, ...(kind !== 'cancel' ? { step: 2 } : {}) }); throw error;
      } finally { writing = false; if (token) managerStore.endWrite(token); if (current()) emit({ pending: false }); }
    },
  };
  return controller;
}
