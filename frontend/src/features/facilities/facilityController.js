import {
  freshFilters,
  parseFacilityQuery,
  facilityQuery,
  editorValues,
  validateFacility,
  facilityPayload,
  resourceView,
  facilityError,
  positiveId,
} from './facilityModel.js';

// UI owner only. The adapter binds existing REST services; SP remains authoritative.
export function createFacilityController({
  adapter,
  initialQuery = '',
  managerStore,
  cacheKey = `facility:${adapter.kind}`,
  onQueryChange = () => {},
}) {
  const parsed = parseFacilityQuery(initialQuery),
    cached = managerStore?.getScreen(cacheKey),
    draft = managerStore?.getDraft(cacheKey);
  if (adapter.kind !== 'seats') {
    parsed.mode = 'configuration';
    parsed.showtimeId = '';
    parsed.scope.roomId = '';
  }
  const scope = draft?.dirty ? draft.scope : { ...(cached?.scope ?? {}), ...parsed.scope };
  if (adapter.managerCinemaId) scope.cinemaId = adapter.managerCinemaId;
  if (
    managerStore &&
    !new URLSearchParams(initialQuery).has('roomId') &&
    cached?.scope.cinemaId === scope.cinemaId
  )
    scope.roomId = cached.scope.roomId;
  let state = {
    ...parsed,
    ...(cached ?? {}),
    scope,
    filters: { ...parsed.applied },
    editor: draft?.editor ?? null,
    lookup: { status: adapter.cinemas ? 'success' : 'loading', rows: adapter.cinemas ?? [] },
    rooms: { status: 'idle', rows: [] },
    resource: { status: 'idle', rows: [] },
    counts: { status: 'idle' },
    selection: null,
    confirmation: null,
    deleteTarget: null,
    pending: false,
    dirty: Boolean(draft?.dirty),
    notice: null,
    pageSize: 10,
    view: cached?.view ?? 'map',
    mode: cached?.mode ?? parsed.mode,
  };
  let active = true,
    generation = 0,
    lookupGeneration = 0,
    roomGeneration = 0,
    writing = false;
  const ownsContext = managerStore?.capture() ?? (() => true);
  const listeners = new Set();
  const current = () => active && ownsContext();
  const emit = (patch) => {
    state = { ...state, ...patch };
    state.dirty = Boolean(
      state.editor && JSON.stringify(state.editor.values) !== JSON.stringify(state.editor.baseline),
    );
    if (current() && managerStore) {
      managerStore.setDraft(
        cacheKey,
        state.editor ? { editor: state.editor, scope: state.scope, dirty: state.dirty } : null,
      );
      managerStore.setScreen(cacheKey, {
        scope: state.scope,
        applied: state.applied,
        page: state.page,
        view: state.view,
        mode: state.mode,
        showtimeId: state.showtimeId,
        selectedId: state.selectedId,
      });
    }
    listeners.forEach((listener) => listener());
  };
  const url = () => onQueryChange(facilityQuery(state));
  const busy = () => writing || managerStore?.getSnapshot().pending;
  const failure = (message, status = 404) => facilityError({ message, status });
  const knownCinema = (id) =>
    state.lookup.status === 'success' &&
    state.lookup.rows.some((row) => String(row.id) === String(id));
  const knownRoom = (id) =>
    state.rooms.status === 'success' &&
    state.rooms.rows.some(
      (row) => String(row.id) === String(id) && String(row.cinemaId) === state.scope.cinemaId,
    );
  const ownedRow = (row) =>
    state.resource.status === 'success' &&
    state.resource.rows.some((item) => String(item.id) === String(row?.id));
  const load = async () => {
    const owner = ++generation,
      scope = { ...state.scope };
    if (
      (scope.cinemaId && !positiveId(scope.cinemaId)) ||
      (scope.roomId && (!positiveId(scope.roomId) || !scope.cinemaId))
    ) {
      emit({
        resource: { status: 'error', rows: [], error: failure('Context rạp/phòng không hợp lệ.') },
      });
      return;
    }
    if (
      (adapter.kind !== 'cinemas' && !scope.cinemaId) ||
      (adapter.kind === 'seats' && !scope.roomId)
    ) {
      emit({ resource: { status: 'idle', rows: [] } });
      return;
    }
    if (
      (adapter.kind !== 'cinemas' && !knownCinema(scope.cinemaId)) ||
      (adapter.kind === 'seats' && !knownRoom(scope.roomId))
    ) {
      emit({
        resource: {
          status: 'error',
          rows: [],
          error: failure('Không tìm thấy rạp/phòng trong context được phép.'),
        },
      });
      return;
    }
    emit({ resource: { status: 'loading', rows: [] } });
    try {
      const rows = await adapter.list(scope);
      if (!current() || owner !== generation) return;
      if (
        !Array.isArray(rows) ||
        rows.some((row) =>
          adapter.kind === 'seats'
            ? String(row.roomId) !== scope.roomId ||
              (row.cinemaId != null && String(row.cinemaId) !== scope.cinemaId)
            : ['rooms', 'images'].includes(adapter.kind) && String(row.cinemaId) !== scope.cinemaId,
        )
      )
        throw failure('Response không khớp context đang chọn.', 409);
      if (
        adapter.kind === 'cinemas' &&
        scope.cinemaId &&
        !rows.some((row) => String(row.id) === scope.cinemaId)
      )
        throw failure('Không tìm thấy rạp yêu cầu.');
      emit({
        resource: { status: 'success', rows },
        selection:
          rows.find(
            (row) =>
              String(row.id) ===
              String(
                state.selection?.id ??
                  state.selectedId ??
                  (adapter.kind === 'cinemas' ? scope.cinemaId : ''),
              ),
          ) ?? null,
      });
      const page = resourceView(state).page;
      if (page !== state.page) {
        emit({ page });
        url();
      }
    } catch (error) {
      if (current() && owner === generation)
        emit({ resource: { status: 'error', rows: [], error: facilityError(error) } });
    }
  };
  const loadRooms = async () => {
    if (adapter.kind !== 'seats') return load();
    const owner = ++roomGeneration,
      cinemaId = state.scope.cinemaId;
    if (
      (state.scope.roomId && (!positiveId(state.scope.roomId) || !cinemaId)) ||
      (cinemaId && !positiveId(cinemaId))
    ) {
      emit({
        rooms: { status: 'error', rows: [], error: failure('Context rạp/phòng không hợp lệ.') },
      });
      return;
    }
    if (!cinemaId) {
      emit({ rooms: { status: 'idle', rows: [] } });
      return;
    }
    if (!knownCinema(cinemaId)) {
      emit({
        rooms: { status: 'error', rows: [], error: failure('Không tìm thấy rạp được phép chọn.') },
      });
      return;
    }
    emit({ rooms: { status: 'loading', rows: [] } });
    try {
      const rows = await adapter.rooms(cinemaId);
      if (!current() || owner !== roomGeneration) return;
      if (rows.some((row) => String(row.cinemaId) !== cinemaId))
        throw failure('Danh sách phòng không đúng rạp.', 409);
      emit({ rooms: { status: 'success', rows } });
      await load();
    } catch (error) {
      if (current() && owner === roomGeneration)
        emit({ rooms: { status: 'error', rows: [], error: facilityError(error) } });
    }
  };
  const applyScope = (scope, queryState) => {
    const reuseRooms = scope.cinemaId === state.scope.cinemaId && state.rooms.status === 'success';
    generation++;
    roomGeneration++;
    emit({
      scope,
      editor: null,
      selection: null,
      selectedId: null,
      deleteTarget: null,
      confirmation: null,
      notice: null,
      filters: { ...(queryState?.applied ?? freshFilters()) },
      applied: { ...(queryState?.applied ?? freshFilters()) },
      page: queryState?.page ?? 1,
      showtimeId: queryState?.showtimeId ?? '',
      mode: queryState?.mode ?? 'configuration',
      resource: { status: 'idle', rows: [] },
    });
    url();
    return adapter.kind === 'seats' && reuseRooms ? load() : loadRooms();
  };
  const guarded = (action) => {
    if (busy()) return;
    if (state.dirty) emit({ confirmation: action });
    else return executeAction(action);
  };
  const executeAction = (action) => {
    if (action.kind === 'scope') return applyScope(action.scope, action.queryState);
    if (action.kind === 'close') {
      emit({ editor: null });
      return;
    }
    if (action.kind === 'mode') {
      emit({ editor: null, mode: action.mode, showtimeId: '', selection: null, selectedId: null });
      url();
      return;
    }
    if (action.kind === 'query') {
      emit({
        ...action.next,
        filters: { ...action.next.applied },
        editor: null,
        selection: null,
        selectedId: null,
      });
      url();
      return;
    }
    const values = editorValues(adapter.kind, action.row);
    emit({
      editor: { row: action.row, values, baseline: { ...values }, errors: {}, error: null },
      deleteTarget: null,
    });
  };
  const write = async (action, success, clearEditor = false) => {
    if (busy() || !current()) return;
    writing = true;
    const token = managerStore?.beginWrite();
    const context = managerStore?.capture() ?? (() => true);
    emit({ pending: true, notice: null });
    try {
      const result = await action();
      if (context() && clearEditor && managerStore) managerStore.setDraft(cacheKey, null);
      if (!current()) return;
      emit({
        ...(clearEditor ? { editor: null } : {}),
        deleteTarget: null,
        notice: { text: result?.result?.Message ?? result?.message ?? success },
      });
      await load();
    } finally {
      writing = false;
      if (token) managerStore.endWrite(token);
      if (current()) emit({ pending: false });
    }
  };
  const controller = {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
    async start() {
      active = true;
      const owner = ++lookupGeneration;
      try {
        if (!adapter.allowed) throw failure('Bạn không có quyền sử dụng chức năng này.', 403);
        if (adapter.kind === 'seats' && !adapter.canRooms)
          throw failure(
            'Cần quyền QL_PHONG để chọn phòng bằng tên. Không thể tải danh sách phòng.',
            403,
          );
        if (state.mode === 'occupancy' && !adapter.canShowtimes)
          throw failure('Bạn không có quyền tra cứu suất chiếu trong workspace này.', 403);
        if (!adapter.cinemas) {
          emit({ lookup: { status: 'loading', rows: [] } });
          const result = await adapter.listCinemas();
          if (!current() || owner !== lookupGeneration) return;
          emit({ lookup: { status: 'success', rows: result.rows, limited: result.limited } });
        }
        if (adapter.kind === 'cinemas') {
          await load();
          if (adapter.counts) {
            emit({ counts: { status: 'loading' } });
            try {
              const rooms = await adapter.counts();
              if (current() && owner === lookupGeneration)
                emit({ counts: { status: 'success', rooms } });
            } catch (error) {
              if (current() && owner === lookupGeneration)
                emit({ counts: { status: 'error', error } });
            }
          }
        } else await loadRooms();
        if (
          draft?.dirty &&
          parsed.scope.roomId &&
          parsed.scope.roomId !== state.scope.roomId &&
          knownRoom(parsed.scope.roomId)
        )
          guarded({ kind: 'scope', scope: { ...parsed.scope, cinemaId: state.scope.cinemaId } });
        else if (managerStore && state.scope.roomId) url();
      } catch (error) {
        if (current() && owner === lookupGeneration)
          emit({ lookup: { status: 'error', rows: [], error: facilityError(error) } });
      }
    },
    dispose() {
      active = false;
      generation++;
      roomGeneration++;
      lookupGeneration++;
    },
    reload: () => (adapter.kind === 'cinemas' ? controller.start() : load()),
    reloadRooms: loadRooms,
    chooseCinema(id) {
      if (id && !knownCinema(id)) return;
      return guarded({ kind: 'scope', scope: { cinemaId: String(id), roomId: '' } });
    },
    chooseRoom(id) {
      if (id && !knownRoom(id)) return;
      return guarded({ kind: 'scope', scope: { ...state.scope, roomId: String(id) } });
    },
    syncQuery(query) {
      const next = parseFacilityQuery(query);
      if (adapter.kind !== 'seats') {
        next.mode = 'configuration';
        next.showtimeId = '';
        next.scope.roomId = '';
      }
      if (next.mode === 'occupancy' && !adapter.canShowtimes) {
        emit({ notice: { error: failure('Bạn không có quyền tra cứu suất chiếu.', 403) } });
        url();
        return;
      }
      if (adapter.managerCinemaId) next.scope.cinemaId = adapter.managerCinemaId;
      if (facilityQuery(next) === facilityQuery(state)) return;
      if (JSON.stringify(next.scope) !== JSON.stringify(state.scope)) {
        if (busy()) {
          url();
          return;
        }
        return guarded({ kind: 'scope', scope: next.scope, queryState: next });
      }
      if (next.mode !== state.mode || next.showtimeId !== state.showtimeId)
        return guarded({ kind: 'query', next });
      emit({
        applied: next.applied,
        filters: { ...next.applied },
        page: next.page,
        mode: next.mode,
        showtimeId: next.showtimeId,
      });
    },
    select(row) {
      if (!busy() && ownedRow(row)) {
        emit({
          selection: row,
          selectedId: row.id,
          ...(adapter.kind === 'cinemas'
            ? { scope: { cinemaId: String(row.id), roomId: '' } }
            : {}),
        });
        if (adapter.kind === 'cinemas') url();
      }
    },
    closeDetail() {
      if (!busy()) emit({ selection: null, selectedId: null });
    },
    setFilters(patch) {
      emit({ filters: { ...state.filters, ...patch } });
    },
    removeFilter(key) {
      if (busy() || !Object.hasOwn(freshFilters(), key)) return;
      const value = '';
      emit({
        filters: { ...state.filters, [key]: value },
        applied: { ...state.applied, [key]: value },
        page: 1,
      });
      url();
    },
    applyFilters() {
      if (!busy()) {
        emit({ applied: { ...state.filters }, page: 1 });
        url();
      }
    },
    resetFilters() {
      if (!busy()) {
        emit({ filters: freshFilters(), applied: freshFilters(), page: 1 });
        url();
      }
    },
    setPage(page) {
      if (!busy()) {
        emit({ page });
        emit({ page: resourceView(state).page });
        url();
      }
    },
    setView(view) {
      if (['map', 'list'].includes(view)) emit({ view });
    },
    setMode(mode) {
      if (
        ['configuration', 'occupancy'].includes(mode) &&
        (mode !== 'occupancy' || adapter.canShowtimes)
      )
        return guarded({ kind: 'mode', mode });
    },
    chooseShowtime(id) {
      if (!busy() && adapter.canShowtimes) {
        emit({ showtimeId: String(id), selection: null, selectedId: null });
        url();
      }
    },
    openEditor(row) {
      if (
        !adapter.allowed ||
        state.resource.status !== 'success' ||
        state.mode === 'occupancy' ||
        (row && !ownedRow(row))
      )
        return;
      return guarded({ kind: 'editor', row });
    },
    closeEditor: () => guarded({ kind: 'close' }),
    changeField(key, value) {
      if (state.editor && key in state.editor.values && !busy())
        emit({
          editor: {
            ...state.editor,
            values: { ...state.editor.values, [key]: value },
            errors: { ...state.editor.errors, [key]: null },
            error: null,
          },
        });
    },
    cancelDiscard() {
      if (!busy()) {
        emit({ confirmation: null });
        url();
      }
    },
    confirmDiscard() {
      if (!busy() && state.confirmation) {
        const action = state.confirmation;
        emit({ editor: null, confirmation: null });
        return executeAction(action);
      }
    },
    async save() {
      if (!current() || busy() || !adapter.allowed || !state.editor || state.mode === 'occupancy')
        return;
      const editor = state.editor,
        scope = { ...state.scope };
      if (editor.row && !ownedRow(editor.row)) return;
      const errors = validateFacility(adapter.kind, editor.values, Boolean(editor.row));
      if (Object.keys(errors).length) {
        emit({ editor: { ...editor, errors } });
        return;
      }
      emit({ editor: { ...editor, error: null } });
      try {
        await write(
          () => adapter.save(scope, editor.row, facilityPayload(adapter.kind, editor.values)),
          'Đã lưu thông tin.',
          true,
        );
      } catch (error) {
        if (current()) emit({ editor: { ...state.editor, error: facilityError(error) } });
      }
    },
    requestDelete(row) {
      if (!busy() && adapter.allowed && state.mode === 'configuration' && ownedRow(row))
        emit({ deleteTarget: row });
    },
    cancelDelete() {
      if (!busy()) emit({ deleteTarget: null });
    },
    async confirmDelete() {
      const row = state.deleteTarget;
      if (!adapter.allowed || !ownedRow(row) || state.mode !== 'configuration') return;
      try {
        await write(() => adapter.remove({ ...state.scope }, row), 'Đã xử lý dữ liệu.');
      } catch (error) {
        if (current()) throw facilityError(error);
      }
    },
    async setCover(row) {
      if (!adapter.cover || !adapter.allowed || !ownedRow(row)) return;
      try {
        await write(() => adapter.cover({ ...state.scope }, row), 'Đã chọn ảnh chính.');
      } catch (error) {
        if (current()) emit({ notice: { error: facilityError(error) } });
      }
    },
  };
  return controller;
}
