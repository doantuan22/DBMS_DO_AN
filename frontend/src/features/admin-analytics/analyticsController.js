import {
  parseReportQuery,
  reportQuery,
  defaultReportFilters,
  validateReportFilters,
} from './analyticsModel.js';
export function createAnalyticsController({
  adapter,
  kind,
  store,
  initialQuery = '',
  onQueryChange = () => {},
}) {
  const key = `analytics:${kind}`,
    applied = parseReportQuery(initialQuery, store?.getScreen(key)?.applied);
  let state = {
    applied,
    filters: { ...applied },
    report: { status: 'loading' },
    dashboard: { status: kind === 'overview' ? 'loading' : 'idle' },
    cinemas: { status: 'loading', rows: [] },
    error: null,
  };
  let active = true,
    reportGeneration = 0,
    dashboardGeneration = 0,
    cinemaGeneration = 0;
  const listeners = new Set(),
    emit = (patch) => {
      state = { ...state, ...patch };
      if (active) store?.setScreen(key, { applied: state.applied });
      listeners.forEach((l) => l());
    };
  const url = (replace = false) => {
    if (active) onQueryChange(reportQuery(state.applied), { replace });
  };
  async function loadReport() {
    const generation = ++reportGeneration,
      filters = { ...state.applied };
    emit({ report: { status: 'loading' } });
    try {
      const report = await adapter.report(filters);
      if (!active || generation !== reportGeneration) return;
      if (
        !report.summary ||
        !Array.isArray(report.byCinema) ||
        !Array.isArray(report.byDate) ||
        !Array.isArray(report.byMovie)
      )
        throw new Error('Báo cáo chưa trả đủ dữ liệu; tải lại trước khi đối chiếu.');
      emit({ report: { status: 'success', data: report } });
    } catch (error) {
      if (active && generation === reportGeneration) emit({ report: { status: 'error', error } });
    }
  }
  async function loadDashboard() {
    if (kind !== 'overview') return;
    const generation = ++dashboardGeneration;
    emit({ dashboard: { status: 'loading' } });
    try {
      const data = await adapter.dashboard();
      if (active && generation === dashboardGeneration)
        emit({ dashboard: { status: 'success', data } });
    } catch (error) {
      if (active && generation === dashboardGeneration)
        emit({ dashboard: { status: 'error', error } });
    }
  }
  async function loadCinemas() {
    const generation = ++cinemaGeneration;
    emit({ cinemas: { status: 'loading', rows: [] } });
    try {
      const rows = await adapter.cinemas();
      if (active && generation === cinemaGeneration) emit({ cinemas: { status: 'success', rows } });
    } catch (error) {
      if (active && generation === cinemaGeneration)
        emit({ cinemas: { status: 'error', rows: [], error } });
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
        const error = Object.assign(new Error('Không đủ quyền báo cáo toàn hệ thống.'), {
          status: 403,
        });
        emit({ report: { status: 'error', error }, dashboard: { status: 'error', error } });
        return;
      }
      await Promise.all([loadReport(), loadDashboard(), loadCinemas()]);
    },
    dispose() {
      active = false;
      reportGeneration++;
      dashboardGeneration++;
      cinemaGeneration++;
    },
    reloadReport: loadReport,
    reloadDashboard: loadDashboard,
    reloadCinemas: loadCinemas,
    setFilters(patch) {
      emit({ filters: { ...state.filters, ...patch }, error: null });
    },
    async applyFilters() {
      const message = validateReportFilters(state.filters, state.cinemas);
      if (message) {
        emit({ error: new Error(message) });
        return;
      }
      if (Object.keys(state.applied).every((key) => state.filters[key] === state.applied[key]))
        return;
      emit({ applied: { ...state.filters }, error: null });
      url();
      await loadReport();
    },
    async resetFilters() {
      emit({ filters: defaultReportFilters() });
      await controller.applyFilters();
    },
    async syncQuery(query) {
      const next = parseReportQuery(query);
      if (reportQuery(next) === reportQuery(state.applied)) return;
      const message = validateReportFilters(next, state.cinemas);
      if (message) {
        emit({ error: new Error(message) });
        return;
      }
      emit({ applied: next, filters: { ...next }, error: null });
      await loadReport();
    },
  };
  return controller;
}
