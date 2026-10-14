import {
  defaultFilters,
  parseOperationsQuery,
  operationsQuery,
  validateRange,
  operationsError,
  positiveId,
} from './operationsModel.js';

export function createOperationsController({
  adapter,
  managerStore,
  initialQuery = '',
  onQueryChange = () => {},
}) {
  const key = `operations:${adapter.kind}`,
    parsed = parseOperationsQuery(adapter.kind, initialQuery),
    cached = managerStore?.getScreen(key),
    saved = managerStore?.getDraft(key);
  const restored = saved?.dirty ? saved : null;
  const initialParams = new URLSearchParams(initialQuery);
  const applied = {
    ...(cached?.applied ?? parsed.applied),
    ...Object.fromEntries(Object.entries(parsed.applied).filter(([key]) => initialParams.has(key))),
  };
  let state = {
    ...parsed,
    applied,
    page: initialParams.has('page') ? parsed.page : (cached?.page ?? parsed.page),
    cinemaId: adapter.cinemaId ?? parsed.cinemaId,
    filters: { ...applied },
    resource: { status: 'loading', rows: [] },
    cinemas: { status: adapter.cinemas ? 'success' : 'loading', rows: adapter.cinemas ?? [] },
    rooms: { status: 'idle', rows: [] },
    movies: { status: 'idle', rows: [] },
    editor: restored?.editor ?? null,
    selection: null,
    dirty: Boolean(restored),
    pending: false,
    confirmation: null,
    cancelTarget: null,
    notice: null,
    filterError: null,
    pageSize: 10,
  };
  let active = true,
    listGeneration = 0,
    lookupGeneration = 0,
    roomGeneration = 0,
    writing = false;
  const listeners = new Set(),
    ownsScope = managerStore?.capture() ?? (() => true);
  const current = () => active && ownsScope(),
    busy = () => writing || managerStore?.getSnapshot().pending;
  const emit = (patch) => {
    state = { ...state, ...patch };
    state.dirty = Boolean(state.editor?.draft?.dirty);
    if (current() && managerStore) {
      managerStore.setDraft(
        key,
        state.editor ? { editor: state.editor, dirty: state.dirty } : null,
      );
      managerStore.setScreen(key, { applied: state.applied, page: state.page });
    }
    listeners.forEach((listener) => listener());
  };
  const url = () => onQueryChange(operationsQuery(state));
  const failure = (message, status = 409) => Object.assign(new Error(message), { status });
  const owned = (row) =>
    state.resource.status === 'success' &&
    state.resource.rows.some((item) => item.id === row?.id && item.cinemaId === row?.cinemaId);
  async function load() {
    const generation = ++listGeneration,
      cinemaId = state.cinemaId,
      filters = { ...state.applied };
    const error = adapter.kind === 'showtimes' ? validateRange(filters) : null;
    if (error || (cinemaId && !positiveId(cinemaId))) {
      emit({
        resource: { status: 'error', rows: [], error: failure(error ?? 'Rạp không hợp lệ.', 400) },
      });
      return;
    }
    if (adapter.manager && !cinemaId) {
      emit({ resource: { status: 'idle', rows: [] } });
      return;
    }
    emit({ resource: { status: 'loading', rows: [] }, selection: null });
    try {
      const rows = await adapter.list(cinemaId, filters);
      if (!current() || generation !== listGeneration) return;
      if (
        !Array.isArray(rows) ||
        (cinemaId && rows.some((row) => String(row.cinemaId) !== cinemaId))
      )
        throw failure('Dữ liệu không thuộc rạp đang chọn.');
      const patch = { resource: { status: 'success', rows } };
      if (!adapter.cinemasLookup && !adapter.manager)
        patch.cinemas = {
          status: 'success',
          limited: true,
          rows: [
            ...new Map(
              rows.map((row) => [row.cinemaId, { id: row.cinemaId, name: row.cinemaName }]),
            ).values(),
          ],
        };
      emit(patch);
    } catch (error) {
      if (current() && generation === listGeneration)
        emit({ resource: { status: 'error', rows: [], error: operationsError(error) } });
    }
  }
  async function loadRooms() {
    const generation = ++roomGeneration,
      cinemaId = state.cinemaId;
    emit({ rooms: { status: 'idle', rows: [] } });
    if (adapter.kind !== 'showtimes' || !cinemaId || !adapter.rooms) return;
    emit({ rooms: { status: 'loading', rows: [] } });
    try {
      const rows = await adapter.rooms(cinemaId);
      if (!current() || generation !== roomGeneration) return;
      if (rows.some((row) => String(row.cinemaId) !== cinemaId))
        throw failure('Danh sách phòng không thuộc rạp đang chọn.');
      emit({ rooms: { status: 'success', rows } });
    } catch (error) {
      if (current() && generation === roomGeneration)
        emit({ rooms: { status: 'error', rows: [], error: operationsError(error) } });
    }
  }
  const run = (action) => {
    if (action.kind === 'close') {
      emit({ editor: null });
      return;
    }
    if (action.kind === 'editor') {
      emit({
        editor: {
          row: action.row,
          cinemaId: String(action.row?.cinemaId ?? state.cinemaId),
          draft: null,
        },
        notice: null,
      });
      return;
    }
    if (action.kind === 'query') {
      const changed = action.next.cinemaId !== state.cinemaId;
      emit({
        ...action.next,
        filters: { ...action.next.applied },
        editor: null,
        selection: null,
        cancelTarget: null,
        notice: null,
        filterError: null,
      });
      url();
      void load();
      if (changed) void loadRooms();
    }
  };
  const guarded = (action) => {
    if (busy() || !current()) return;
    if (state.dirty) emit({ confirmation: action });
    else run(action);
  };
  const controller = {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
    async start() {
      active = true;
      const generation = ++lookupGeneration;
      if (adapter.cinemasLookup) {
        emit({ cinemas: { status: 'loading', rows: [] } });
        adapter
          .cinemasLookup()
          .then((rows) => {
            if (current() && generation === lookupGeneration)
              emit({ cinemas: { status: 'success', rows } });
          })
          .catch((error) => {
            if (current() && generation === lookupGeneration)
              emit({ cinemas: { status: 'error', rows: [], error: operationsError(error) } });
          });
      }
      if (adapter.kind === 'showtimes') {
        emit({ movies: { status: 'loading', rows: [] } });
        adapter
          .movies()
          .then((rows) => {
            if (current() && generation === lookupGeneration)
              emit({ movies: { status: 'success', rows } });
          })
          .catch((error) => {
            if (current() && generation === lookupGeneration)
              emit({ movies: { status: 'error', rows: [], error: operationsError(error) } });
          });
      }
      await Promise.all([load(), loadRooms()]);
    },
    dispose() {
      active = false;
      listGeneration++;
      lookupGeneration++;
      roomGeneration++;
    },
    reload: load,
    reloadRooms: loadRooms,
    setFilters(patch) {
      if (!busy()) emit({ filters: { ...state.filters, ...patch }, filterError: null });
    },
    applyFilters() {
      if (busy()) return;
      const error = adapter.kind === 'showtimes' ? validateRange(state.filters) : null;
      if (error) {
        emit({ filterError: error });
        return;
      }
      // Filtering does not discard the independent editor draft.
      const changedRange =
        state.filters.fromDate !== state.applied.fromDate ||
        state.filters.toDate !== state.applied.toDate;
      emit({ applied: { ...state.filters }, page: 1 });
      url();
      if (changedRange) void load();
    },
    resetFilters() {
      if (!busy()) {
        emit({ filters: defaultFilters(adapter.kind) });
        controller.applyFilters();
      }
    },
    chooseCinema(cinemaId) {
      if (
        adapter.manager ||
        (cinemaId && !state.cinemas.rows.some((row) => String(row.id) === cinemaId))
      )
        return;
      guarded({
        kind: 'query',
        next: { cinemaId, applied: { ...state.applied, roomId: '' }, page: 1 },
      });
    },
    syncQuery(query) {
      const next = parseOperationsQuery(adapter.kind, query);
      if (adapter.manager && next.cinemaId && next.cinemaId !== adapter.cinemaId) {
        emit({ notice: { error: failure('Rạp trong URL khác context Manager.', 403) } });
        url();
        return;
      }
      if (adapter.manager) next.cinemaId = adapter.cinemaId;
      if (operationsQuery(next) !== operationsQuery(state)) guarded({ kind: 'query', next });
    },
    setPage(page) {
      if (!busy() && Number.isSafeInteger(page) && page > 0) {
        emit({ page });
        url();
      }
    },
    select(row) {
      if (!busy() && owned(row)) emit({ selection: row });
    },
    closeDetail() {
      emit({ selection: null });
    },
    openEditor(row) {
      if ((!row && !state.cinemaId) || state.resource.status !== 'success' || (row && !owned(row)))
        return;
      if (!row && !state.cinemas.rows.some((cinema) => String(cinema.id) === state.cinemaId))
        return;
      if (
        adapter.kind === 'showtimes' &&
        (state.movies.status !== 'success' || (!row && state.rooms.status !== 'success'))
      )
        return;
      guarded({ kind: 'editor', row });
    },
    closeEditor: () => guarded({ kind: 'close' }),
    setDraft(draft) {
      if (current() && state.editor) emit({ editor: { ...state.editor, draft } });
    },
    cancelDiscard() {
      emit({ confirmation: null });
      url();
    },
    confirmDiscard() {
      if (!busy() && state.confirmation) {
        const action = state.confirmation;
        emit({ editor: null, confirmation: null });
        run(action);
      }
    },
    requestCancel(row) {
      if (!busy() && owned(row) && row.status !== 'Đã hủy' && row.status !== 'Hoàn thành')
        emit({ cancelTarget: row });
    },
    closeCancel() {
      if (!busy()) emit({ cancelTarget: null });
    },
    async save(body) {
      const row = state.editor?.row;
      if (!state.editor || busy() || !current()) return;
      const cinemaId = state.editor.cinemaId;
      if (
        (row && String(row.cinemaId) !== cinemaId) ||
        (adapter.manager && cinemaId !== adapter.cinemaId)
      )
        throw failure('Tài nguyên không thuộc rạp hiện tại.', 403);
      if (adapter.kind === 'showtimes') {
        const selectedMovie =
          state.movies.rows.some((movie) => movie.id === body.movieId) ||
          row?.movieId === body.movieId;
        const selectedRoom =
          row ||
          (state.rooms.status === 'success' &&
            state.rooms.rows.some(
              (room) => room.id === body.roomId && String(room.cinemaId) === cinemaId,
            ));
        if (!selectedMovie || !selectedRoom) throw failure('Chọn phim/phòng từ danh mục của rạp.');
      }
      await write(
        () => adapter.save(cinemaId, row, body),
        'Đã lưu. Dữ liệu mới được xác nhận bởi server.',
        true,
      );
    },
    async cancel() {
      const row = state.cancelTarget;
      if (row && owned(row))
        await write(() => adapter.cancel(row), 'Đã hủy suất chiếu; lịch sử được giữ.', false);
    },
  };
  async function write(action, message, clearEditor) {
    if (busy() || !current()) return;
    writing = true;
    const token = managerStore?.beginWrite();
    emit({ pending: true, notice: null });
    try {
      await action();
      if (ownsScope() && clearEditor) managerStore?.setDraft(key, null);
      if (!current()) return;
      emit({
        ...(clearEditor ? { editor: null } : {}),
        cancelTarget: null,
        notice: { text: message },
      });
      await load();
    } catch (error) {
      if (current()) emit({ notice: { error: operationsError(error) } });
      throw operationsError(error);
    } finally {
      writing = false;
      if (token) managerStore.endWrite(token);
      if (current()) emit({ pending: false });
    }
  }
  return controller;
}
