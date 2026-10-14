import { userCanAct } from '../../utils/authorization.js';
import {
  emptyRoomFilters,
  parseRoomsQuery,
  roomsQuery,
  roomsView,
  roomValues,
  validateRoom,
  roomPayload,
  roomsError,
} from './roomsModel.js';

export function createRoomsController({ api, user, initialQuery = '', onQueryChange = () => {} }) {
  const initial = parseRoomsQuery(initialQuery);
  let state = {
    ...initial,
    filters: { ...initial.applied },
    lookup: { status: 'loading', rows: [] },
    resource: { status: 'idle', rows: [] },
    editor: null,
    confirmation: null,
    deleteTarget: null,
    notice: null,
    pending: false,
    dirty: false,
  };
  const listeners = new Set();
  let active = true,
    readGeneration = 0,
    lookupGeneration = 0,
    writing = false;
  const can = (permission) => userCanAct(user, 'ADMIN', permission);
  const publish = (patch) => {
    state = { ...state, ...patch };
    state.dirty = Boolean(
      state.editor && JSON.stringify(state.editor.values) !== JSON.stringify(state.editor.baseline),
    );
    listeners.forEach((listener) => listener());
  };
  const knownCinema = (id = state.cinemaId) =>
    state.lookup.status === 'success' &&
    state.lookup.rows.some((row) => String(row.RapID) === String(id));
  const updateUrl = () => onQueryChange(roomsQuery(state));
  const scopedRow = (row) =>
    state.resource.status === 'success' &&
    state.resource.cinemaId === state.cinemaId &&
    String(row?.RapID) === state.cinemaId &&
    state.resource.rows.some((current) => current.PhongID === row.PhongID);
  const errorState = (message, status = 404) => ({
    status: 'error',
    cinemaId: state.cinemaId,
    rows: [],
    error: Object.assign(new Error(message), { status }),
  });
  const load = async () => {
    const cinemaId = state.cinemaId,
      generation = ++readGeneration;
    if (!can('QL_PHONG')) {
      publish({ resource: errorState('Bạn không có quyền quản lý phòng chiếu.', 403) });
      return;
    }
    if (!cinemaId) {
      publish({ resource: { status: 'idle', rows: [] } });
      return;
    }
    if (!knownCinema()) {
      publish({ resource: errorState('Không tìm thấy rạp trong danh sách được phép chọn.') });
      return;
    }
    publish({ resource: { status: 'loading', cinemaId, rows: [] } });
    try {
      const result = await api.rooms({ cinemaId });
      if (!active || generation !== readGeneration || state.cinemaId !== cinemaId) return;
      if (
        !Array.isArray(result.rooms) ||
        result.rooms.some((row) => String(row.RapID) !== cinemaId)
      )
        throw new Error('Danh sách phòng không khớp rạp đang chọn. Vui lòng tải lại.');
      publish({ resource: { status: 'success', cinemaId, rows: result.rooms } });
      const page = roomsView(state).page;
      if (page !== state.page) {
        publish({ page });
        updateUrl();
      }
    } catch (error) {
      if (active && generation === readGeneration && state.cinemaId === cinemaId)
        publish({ resource: { status: 'error', cinemaId, rows: [], error: roomsError(error) } });
    }
  };
  const applyCinema = (cinemaId, location) => {
    readGeneration++;
    publish({
      cinemaId,
      editor: null,
      deleteTarget: null,
      confirmation: null,
      notice: null,
      filters: { ...(location?.applied ?? emptyRoomFilters) },
      applied: { ...(location?.applied ?? emptyRoomFilters) },
      page: location?.page ?? 1,
      pageSize: location?.pageSize ?? state.pageSize,
      resource: { status: 'idle', rows: [] },
    });
    if (!location) updateUrl();
    return load();
  };
  const closeEditor = () => {
    if (writing) return;
    if (state.dirty) publish({ confirmation: { kind: 'close' } });
    else publish({ editor: null });
  };
  const open = (mode, row) => {
    if (writing || !can('QL_PHONG') || !knownCinema() || state.resource.status !== 'success')
      return;
    if (row && !scopedRow(row)) return;
    if (state.dirty) {
      publish({ confirmation: { kind: 'open', mode, row } });
      return;
    }
    const values = roomValues(row);
    publish({
      editor: {
        mode,
        row,
        cinemaId: state.cinemaId,
        values,
        baseline: { ...values },
        errors: {},
        error: null,
      },
      deleteTarget: null,
    });
  };
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
    can,
    async start() {
      active = true;
      if (!can('QL_PHONG')) {
        publish({
          lookup: {
            status: 'error',
            rows: [],
            error: roomsError({ status: 403, message: 'Bạn không có quyền quản lý phòng chiếu.' }),
          },
        });
        return;
      }
      const generation = ++lookupGeneration;
      publish({ lookup: { status: 'loading', rows: [] } });
      try {
        const full = can('QL_RAP');
        const result = full ? await api.cinemas() : await api.rooms();
        if (!active || generation !== lookupGeneration) return;
        const rows = full
          ? result.cinemas
          : [
              ...new Map(
                result.rooms.map((row) => [row.RapID, { RapID: row.RapID, TenRap: row.TenRap }]),
              ).values(),
            ];
        if (!Array.isArray(rows)) throw new Error('Không tải được danh sách rạp.');
        publish({ lookup: { status: 'success', rows, limited: !full } });
        await load();
      } catch (error) {
        if (active && generation === lookupGeneration)
          publish({
            lookup: { status: 'error', rows: [], error: roomsError(error) },
            resource: { status: 'idle', rows: [] },
          });
      }
    },
    dispose() {
      active = false;
      readGeneration++;
      lookupGeneration++;
    },
    reload: load,
    selectCinema(id) {
      if (writing || String(id) === state.cinemaId || (id && !knownCinema(id))) return;
      if (state.dirty) {
        publish({ confirmation: { kind: 'cinema', id: String(id) } });
        return;
      }
      return applyCinema(String(id));
    },
    syncQuery(query) {
      const next = parseRoomsQuery(query);
      if (roomsQuery(next) === roomsQuery(state)) return;
      if (next.cinemaId !== state.cinemaId) {
        // Browser departure is checked by the route dirty guard before a POP.
        if (writing) {
          updateUrl();
          return;
        }
        return applyCinema(next.cinemaId, next);
      }
      publish({ ...next, filters: { ...next.applied } });
    },
    setFilters(patch) {
      publish({ filters: { ...state.filters, ...patch } });
    },
    applyFilters() {
      if (writing) return;
      publish({ applied: { ...state.filters, search: state.filters.search.trim() }, page: 1 });
      updateUrl();
    },
    resetFilters() {
      if (!writing) {
        publish({ applied: { ...emptyRoomFilters }, filters: { ...emptyRoomFilters }, page: 1 });
        updateUrl();
      }
    },
    setPage(page) {
      if (!writing) {
        publish({ page });
        publish({ page: roomsView(state).page });
        updateUrl();
      }
    },
    setPageSize(pageSize) {
      if ([10, 20, 50].includes(Number(pageSize)) && !writing) {
        publish({ pageSize: Number(pageSize), page: 1 });
        updateUrl();
      }
    },
    openCreate: () => open('create'),
    openEdit: (row) => open('edit', row),
    closeEditor,
    changeField(name, value) {
      if (!state.editor || writing || !['name', 'type', 'status'].includes(name)) return;
      publish({
        editor: {
          ...state.editor,
          values: { ...state.editor.values, [name]: value },
          errors: { ...state.editor.errors, [name]: null },
          error: null,
        },
      });
    },
    cancelDiscard() {
      if (!writing) publish({ confirmation: null });
    },
    confirmDiscard() {
      if (writing || !state.confirmation) return;
      const target = state.confirmation;
      publish({ editor: null, confirmation: null });
      if (target.kind === 'cinema') return applyCinema(target.id);
      if (target.kind === 'open') return open(target.mode, target.row);
    },
    async save() {
      const editor = state.editor;
      if (
        writing ||
        !active ||
        !editor ||
        !can('QL_PHONG') ||
        !knownCinema() ||
        editor.cinemaId !== state.cinemaId
      )
        return;
      if (editor.mode === 'edit' && !scopedRow(editor.row)) return;
      const errors = validateRoom(editor.values, editor.mode === 'edit');
      if (Object.keys(errors).length) {
        publish({ editor: { ...editor, errors } });
        return;
      }
      writing = true;
      publish({ pending: true, editor: { ...editor, error: null }, notice: null });
      const cinemaId = state.cinemaId;
      try {
        const body = roomPayload(editor, cinemaId);
        if (editor.mode === 'edit') await api.update(`rooms/${editor.row.PhongID}`, body);
        else await api.create('rooms', body);
        if (!active || state.cinemaId !== cinemaId) return;
        publish({
          editor: null,
          notice: {
            ok: true,
            text: editor.mode === 'create' ? 'Đã thêm phòng chiếu.' : 'Đã cập nhật phòng chiếu.',
          },
        });
        await load();
      } catch (error) {
        if (active && state.cinemaId === cinemaId)
          publish({ editor: { ...state.editor, error: roomsError(error) } });
      } finally {
        writing = false;
        if (active) publish({ pending: false });
      }
    },
    requestDelete(row) {
      if (!writing && can('QL_PHONG') && scopedRow(row)) publish({ deleteTarget: row });
    },
    cancelDelete() {
      if (!writing) publish({ deleteTarget: null });
    },
    async confirmDelete() {
      const row = state.deleteTarget;
      if (writing || !active || !can('QL_PHONG') || !scopedRow(row)) return;
      writing = true;
      publish({ pending: true, notice: null });
      const cinemaId = state.cinemaId;
      try {
        const response = await api.remove(`rooms/${row.PhongID}`);
        if (!active || state.cinemaId !== cinemaId) return;
        publish({
          deleteTarget: null,
          notice: { ok: true, text: response.result?.Message ?? 'Đã xử lý phòng chiếu.' },
        });
        await load();
      } catch (error) {
        if (active && state.cinemaId === cinemaId) throw roomsError(error);
      } finally {
        writing = false;
        if (active) publish({ pending: false });
      }
    },
  };
}
