import {
  parseResourceQuery,
  resourceQuery,
  resourceFields,
  resourceValues,
  validateResource,
  resourceBody,
  resourceDefinitions,
} from './resourceModel.js';

export function createResourceController({
  adapter,
  store,
  initialQuery = '',
  onQueryChange = () => {},
}) {
  const kind = adapter.kind,
    definition = resourceDefinitions[kind],
    key = `resource:${kind}`;
  const parsed = parseResourceQuery(kind, initialQuery),
    cached = store?.getScreen(key),
    restored = store?.getDraft(key);
  const params = new URLSearchParams(initialQuery),
    applied = {
      ...(cached?.applied ?? parsed.applied),
      ...Object.fromEntries(
        Object.entries(parsed.applied).filter(([key]) => params.has(key) && key !== 'search'),
      ),
    };
  let state = {
    applied,
    filters: { ...applied },
    page: params.has('page') ? parsed.page : (cached?.page ?? 1),
    pageSize: 20,
    selectedId: parsed.selectedId,
    resource: { status: 'loading', rows: [] },
    lookups: {},
    selection: null,
    selectionError: null,
    editor: restored?.editor ?? null,
    dirty: Boolean(restored?.dirty),
    pending: false,
    confirmation: null,
    notice: null,
  };
  let active = true,
    generation = 0,
    lookupGeneration = 0,
    writing = false;
  const listeners = new Set(),
    busy = () => writing || store?.getSnapshot().pending;
  const emit = (patch) => {
    state = { ...state, ...patch };
    state.dirty = Boolean(
      state.editor && JSON.stringify(state.editor.values) !== JSON.stringify(state.editor.baseline),
    );
    if (active && store) {
      store.setDraft(key, state.editor ? { editor: state.editor, dirty: state.dirty } : null);
      store.setScreen(key, { applied: state.applied, page: state.page });
    }
    listeners.forEach((listener) => listener());
  };
  const url = (replace = false) => {
    if (active) onQueryChange(resourceQuery(state, kind), { replace });
  };
  const id = (row) => row?.[definition.id];
  const owned = (row) =>
    state.resource.status === 'success' && state.resource.rows.some((item) => id(item) === id(row));
  async function load() {
    const request = ++generation;
    emit({ resource: { status: 'loading', rows: [] } });
    try {
      const rows = await adapter.list();
      if (!active || request !== generation) return;
      const selection = rows.find((row) => String(id(row)) === state.selectedId) ?? null;
      emit({
        resource: { status: 'success', rows },
        selection,
        selectionError:
          state.selectedId && !selection
            ? Object.assign(new Error('Không tìm thấy tài nguyên đã chọn.'), { status: 404 })
            : null,
      });
    } catch (error) {
      if (active && request === generation)
        emit({ resource: { status: 'error', rows: [], error }, selection: null });
    }
  }
  async function loadLookups() {
    const request = ++lookupGeneration;
    const entries = Object.entries(adapter.lookups ?? {});
    emit({
      lookups: Object.fromEntries(
        entries.map(([key, load]) => [
          key,
          load
            ? { status: 'loading', rows: [] }
            : {
                status: 'error',
                rows: [],
                error: Object.assign(new Error('Thiếu quyền tra cứu danh mục để chọn bằng tên.'), {
                  status: 403,
                }),
              },
        ]),
      ),
    });
    await Promise.all(
      entries
        .filter(([, load]) => load)
        .map(async ([name, load]) => {
          try {
            const rows = await load();
            if (active && request === lookupGeneration)
              emit({ lookups: { ...state.lookups, [name]: { status: 'success', rows } } });
          } catch (error) {
            if (active && request === lookupGeneration)
              emit({ lookups: { ...state.lookups, [name]: { status: 'error', rows: [], error } } });
          }
        }),
    );
  }
  const run = (action) => {
    if (action.kind === 'delete') {
      emit({ confirmation: action });
      return;
    }
    if (action.kind === 'close') {
      emit({ editor: null });
      return;
    }
    if (action.kind === 'editor') {
      try {
        const values = resourceValues(kind, action.row, action.mode);
        emit({
          editor: {
            mode: action.mode ?? 'metadata',
            row: action.row,
            values,
            baseline: structuredClone(values),
            errors: {},
            error: null,
          },
          notice: null,
        });
      } catch (error) {
        emit({ notice: { error } });
      }
      return;
    }
    if (action.kind === 'select') {
      emit({
        editor: null,
        selection: action.row ?? null,
        selectedId: action.row ? String(id(action.row)) : '',
        selectionError: null,
      });
      url();
      return;
    }
    if (action.kind === 'query') {
      const selection =
        state.resource.rows.find((row) => String(id(row)) === action.next.selectedId) ?? null;
      emit({
        ...action.next,
        filters: { ...action.next.applied },
        selection,
        editor: null,
        selectionError:
          action.next.selectedId && !selection
            ? Object.assign(new Error('Không tìm thấy tài nguyên.'), { status: 404 })
            : null,
      });
      url(true);
    }
  };
  const guarded = (action) => {
    if (!active || busy()) return;
    if (state.dirty) emit({ confirmation: { kind: 'discard', action } });
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
      if (!adapter.allowed) {
        emit({
          resource: {
            status: 'error',
            rows: [],
            error: Object.assign(new Error('Không đủ quyền.'), { status: 403 }),
          },
        });
        return;
      }
      await Promise.all([load(), loadLookups()]);
    },
    dispose() {
      active = false;
      generation++;
      lookupGeneration++;
    },
    reload: load,
    reloadLookups: loadLookups,
    setFilters(patch) {
      if (!busy()) emit({ filters: { ...state.filters, ...patch } });
    },
    removeFilter(key) {
      if (busy() || !Object.hasOwn(definition.filters, key)) return;
      const value = definition.filters[key];
      emit({
        filters: { ...state.filters, [key]: value },
        applied: { ...state.applied, [key]: value },
        page: 1,
        notice: null,
      });
      url();
    },
    applyFilters() {
      if (!busy()) {
        const f = state.filters;
        if (
          (f.fromDate && f.toDate && f.fromDate > f.toDate) ||
          (f.minDuration && f.maxDuration && Number(f.minDuration) > Number(f.maxDuration)) ||
          (f.minPrice && f.maxPrice && Number(f.minPrice) > Number(f.maxPrice))
        ) {
          emit({
            notice: {
              error: new Error('Giới hạn bắt đầu/tối thiểu không được lớn hơn kết thúc/tối đa.'),
            },
          });
          return;
        }
        emit({ applied: { ...f }, page: 1, notice: null });
        url();
      }
    },
    resetFilters() {
      if (!busy()) {
        emit({ filters: { ...definition.filters } });
        controller.applyFilters();
      }
    },
    setPage(page) {
      if (!busy() && Number.isSafeInteger(page) && page > 0) {
        emit({ page });
        url();
      }
    },
    syncQuery(query) {
      const next = parseResourceQuery(kind, query);
      next.applied.search = state.applied.search;
      if (resourceQuery(next, kind) !== resourceQuery(state, kind))
        guarded({ kind: 'query', next });
    },
    select(row) {
      if (owned(row)) guarded({ kind: 'select', row });
    },
    closeDetail: () => guarded({ kind: 'select' }),
    openEditor(row) {
      if (state.resource.status === 'success' && (!row || owned(row)))
        guarded({ kind: 'editor', row });
    },
    closeEditor: () => guarded({ kind: 'close' }),
    openCast(row) {
      if (kind === 'movies' && owned(row)) guarded({ kind: 'editor', row, mode: 'cast' });
    },
    addCastActor(actorId) {
      if (
        busy() ||
        state.editor?.mode !== 'cast' ||
        !state.lookups.actors?.rows.some((r) => r.id === Number(actorId)) ||
        state.editor.values.cast.some((r) => r.actorId === Number(actorId))
      )
        return;
      emit({
        editor: {
          ...state.editor,
          values: { cast: [...state.editor.values.cast, { actorId: Number(actorId), role: '' }] },
        },
      });
    },
    changeCastRole(actorId, role) {
      if (!busy() && state.editor?.mode === 'cast')
        emit({
          editor: {
            ...state.editor,
            values: {
              cast: state.editor.values.cast.map((r) =>
                r.actorId === actorId ? { ...r, role } : r,
              ),
            },
          },
        });
    },
    removeCastActor(actorId) {
      if (!busy() && state.editor?.mode === 'cast')
        emit({
          editor: {
            ...state.editor,
            values: { cast: state.editor.values.cast.filter((r) => r.actorId !== actorId) },
          },
        });
    },
    changeField(name, value) {
      if (
        !busy() &&
        state.editor &&
        resourceFields(kind, Boolean(state.editor.row)).some(
          (f) => f.name === name && !(state.editor.row && f.immutable),
        )
      )
        emit({
          editor: {
            ...state.editor,
            values: { ...state.editor.values, [name]: value },
            errors: { ...state.editor.errors, [name]: null },
            error: null,
          },
        });
    },
    requestSave() {
      if (busy() || !state.editor) return;
      if (state.editor.mode === 'cast') {
        const { cast } = state.editor.values;
        if (
          state.lookups.actors?.status !== 'success' ||
          cast.some(
            (r) =>
              !state.lookups.actors.rows.some((actor) => actor.id === r.actorId) ||
              typeof r.role !== 'string' ||
              r.role.length > 150,
          )
        ) {
          emit({
            editor: {
              ...state.editor,
              error: new Error('Chọn diễn viên hợp lệ; vai diễn tối đa 150 ký tự.'),
            },
          });
          return;
        }
        emit({
          confirmation: {
            kind: 'cast',
            row: state.editor.row,
            body: { cast: structuredClone(cast) },
          },
        });
        return;
      }
      const { row, values } = state.editor,
        errors = validateResource(kind, values, row, state.lookups);
      if (Object.keys(errors).length) {
        emit({ editor: { ...state.editor, errors } });
        return;
      }
      const body = resourceBody(kind, values, row);
      if (kind === 'assignments' || (['users', 'products', 'promotions'].includes(kind) && row))
        emit({ confirmation: { kind: 'save', row, body } });
      else return write(row, body);
    },
    requestStatus(row) {
      if (!owned(row) || busy() || !['Hoạt động', 'Bị khóa'].includes(row.TrangThai)) return;
      guarded({ kind: 'editor', row });
    },
    requestDelete(row) {
      if (!busy() && definition.removable && owned(row)) guarded({ kind: 'delete', row });
    },
    cancelConfirmation() {
      if (!busy()) {
        emit({ confirmation: null });
        url(true);
      }
    },
    async confirm() {
      const action = state.confirmation;
      if (!action || busy()) return;
      if (action.kind === 'discard') {
        emit({ confirmation: null, editor: null });
        run(action.action);
      } else await write(action.row, action.body, action.kind);
    },
  };
  async function write(row, body, mode) {
    if (!active || busy()) return;
    writing = true;
    const token = store?.beginWrite();
    emit({ pending: true, notice: null });
    try {
      const result = await (mode === 'cast'
        ? adapter.cast(row, body)
        : mode === 'delete'
          ? adapter.remove(row)
          : adapter.save(row, body));
      if (mode !== 'delete') store?.setDraft(key, null);
      if (!active) return;
      emit({
        ...(mode !== 'delete' || (state.editor?.row && id(state.editor.row) === id(row))
          ? { editor: null }
          : {}),
        confirmation: null,
        ...(mode === 'delete' ? { selectedId: '', selection: null } : {}),
        notice: {
          text:
            result?.result?.Message ??
            (mode === 'delete' ? 'Đã xóa tài nguyên.' : 'Đã lưu thay đổi.'),
        },
      });
      await load();
      if (mode === 'delete') url(true);
    } catch (error) {
      if (active)
        emit({
          confirmation: null,
          notice: { error },
          editor: state.editor ? { ...state.editor, error } : null,
        });
    } finally {
      writing = false;
      if (token) store.endWrite(token);
      if (active) emit({ pending: false });
    }
  }
  return controller;
}
