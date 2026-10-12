import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdminWorkspace } from '../admin-workspace/AdminWorkspaceContext.js';
import { PageHeader, FilterBar, FormField, Input, Select, Button, AsyncState, ResourceTable } from '../../components/ui';
import Forbidden from '../../pages/Forbidden';
import { formatDate } from '../../utils/dateTime';
import { money } from '../admin-resources/resourceModel';
import { REPORT_METRICS, DASHBOARD_METRICS } from './analyticsModel';
import { analyticsAdapter } from './analyticsAdapter';
import { createAnalyticsController } from './analyticsController';
import '../admin-resources/admin-resources.css';
import './admin-analytics.css';
export default function AdminAnalytics({ kind }) {
  const { user } = useAuth(), store = useAdminWorkspace(), adapter = analyticsAdapter(user);
  if (!adapter.allowed) return <Forbidden />;
  return <Workspace key={`${kind}:${user.userId}:${user.permissions.map((p) => p.code).sort().join(',')}`} kind={kind} store={store} adapter={adapter} />;
}
function Workspace({ kind, store, adapter }) {
  const [params, setParams] = useSearchParams(), query = params.toString(), ref = useRef(query);
  useLayoutEffect(() => { ref.current = query; }, [query]);
  const onQueryChange = useCallback((next, options) => { if (ref.current !== next) { ref.current = next; setParams(next, options); } }, [setParams]);
  // Initialization stores the callback without reading the ref.
  // oxlint-disable-next-line react/refs
  const [controller] = useState(() => createAnalyticsController({ adapter, kind, store, initialQuery: query, onQueryChange }));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot), previous = useRef(query);
  useEffect(() => { void controller.start(); return () => controller.dispose(); }, [controller]);
  useEffect(() => { if (previous.current !== query) { previous.current = query; void controller.syncQuery(query); } }, [query, controller]);
  return <AnalyticsView kind={kind} state={state} controller={controller} can={adapter.can} />;
}
export function MetricCards({ data, definitions }) {
  return <dl className="admin-analytics__metrics">{definitions.map(([key, label, format, scope]) => <div key={key} data-metric={key}><dt>{label}</dt><dd>{format(data?.[key])}</dd><dd className="admin-analytics__metric-scope">{scope}</dd></div>)}</dl>;
}
export function AnalyticsView({ kind, state, controller, can = () => false }) {
  const overview = kind === 'overview', title = overview ? 'Tổng quan Admin' : 'Doanh thu', applied = state.applied;
  return <section className="admin-resource admin-analytics"><PageHeader title={title} description={overview ? 'Toàn hệ thống: chỉ số hiện tại, toàn thời gian và báo cáo riêng theo kỳ.' : 'Tiền thực thu theo thanh toán thành công; giá vé, đồ ăn và giảm giá theo snapshot của đơn.'} breadcrumbs={[{ label: 'Admin', to: '/admin/overview' }, { label: title }]} />
    {overview && <section className="admin-resource__panel" aria-label="Chỉ số toàn hệ thống"><h2>Hiện tại và toàn thời gian</h2><p>Các chỉ số này áp dụng toàn hệ thống. Suất hôm nay theo ngày Việt Nam; các số hiện tại theo thời điểm tải.</p><AsyncState status={state.dashboard.status} error={state.dashboard.error} onRetry={controller.reloadDashboard} />{state.dashboard.status === 'success' && <MetricCards data={state.dashboard.data} definitions={DASHBOARD_METRICS} />}<nav className="admin-resource__actions" aria-label="Tác vụ quản trị">{can('QL_KHIEUNAI') && <Link to="/admin/service/complaints?status=Mới">Khiếu nại mới</Link>}{can('QL_SUAT_CHIEU') && <Link to="/admin/operations/showtimes">Lịch chiếu</Link>}{can('DAT_VE') && <Link to="/admin/bookings">Quản lý đặt vé</Link>}<Button variant="secondary" onClick={() => void controller.reloadDashboard()}>Tải lại chỉ số</Button></nav></section>}
    <section className="admin-resource" aria-label="Báo cáo theo kỳ"><h2>{overview ? 'Doanh thu theo kỳ' : 'Phạm vi báo cáo'}</h2>
      <FilterBar resetLabel="Về tháng hiện tại" schema={[{ key: 'fromDate', label: 'Từ ngày', format: formatDate }, { key: 'toDate', label: 'Đến ngày', format: formatDate }, { key: 'cinemaId', label: 'Rạp', format: (id) => state.cinemas.rows.find((r) => String(r.id) === id)?.label ?? 'Rạp đã chọn' }]} draft={state.filters} applied={applied} onApply={() => void controller.applyFilters()} onReset={() => void controller.resetFilters()}>
        <FormField label="Từ ngày" required><Input type="date" value={state.filters.fromDate} required onChange={(e) => controller.setFilters({ fromDate: e.target.value })} /></FormField><FormField label="Đến ngày" required><Input type="date" value={state.filters.toDate} required onChange={(e) => controller.setFilters({ toDate: e.target.value })} /></FormField><FormField label="Rạp báo cáo"><Select value={state.filters.cinemaId} disabled={state.cinemas.status !== 'success'} onChange={(e) => controller.setFilters({ cinemaId: e.target.value })}><option value="">Tất cả rạp</option>{state.cinemas.rows.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</Select></FormField>
      </FilterBar><AsyncState status={state.cinemas.status === 'error' ? 'error' : 'idle'} error={state.cinemas.error} onRetry={controller.reloadCinemas} />{state.error && <p role="alert">{state.error.message}</p>}
      <p className="admin-analytics__scope" role="status">{safeDate(applied.fromDate)} — {safeDate(applied.toDate)} · {applied.cinemaId ? state.cinemas.rows.find((r) => String(r.id) === applied.cinemaId)?.label ?? 'Rạp đã chọn' : 'Tất cả rạp'}. Bao gồm hai ngày biên, theo ngày thu tiền Việt Nam.</p><p>Tiền thực thu độc lập với trạng thái đơn hiện tại. Điểm bồi thường không được tính thành hoàn tiền. Số liệu hiển thị theo báo cáo hệ thống.</p>
      <AsyncState status={state.report.status} error={state.report.error} onRetry={controller.reloadReport} />{state.report.status === 'success' && <><MetricCards data={state.report.data.summary} definitions={REPORT_METRICS} /><RevenueDetails key={JSON.stringify(applied)} report={state.report.data} /></>}
    </section>
  </section>;
}
function safeDate(value) { try { return formatDate(value); } catch { return 'Ngày chưa hợp lệ'; } }
export function RevenueDetails({ report }) {
  const [group, setGroup] = useState('byCinema'), [page, setPage] = useState(1), [chartGroup, setChartGroup] = useState('byDate');
  const groups = { byCinema: ['Theo rạp', 'RapID', 'TenRap'], byMovie: ['Theo phim', 'PhimID', 'TenPhim'], byDate: ['Theo ngày', 'Ngay', 'Ngay'] }, rows = report[group], [label, key, name] = groups[group], pageSize = 20;
  const columns = [{ key: name, label: group === 'byDate' ? 'Ngày thu tiền' : group === 'byMovie' ? 'Phim' : 'Rạp', ...(group === 'byDate' ? { render: (r) => formatDate(r.Ngay) } : {}) }, { key: 'SoDon', label: 'Số đơn' }, { key: 'SoVeBan', label: 'Số vé' }, ...[['DoanhThuVe', 'Tiền vé (VND)'], ['DoanhThuDoAn', 'Đồ ăn (VND)'], ['TongTienGiam', 'Giảm giá (VND)'], ['DoanhThuThucTe', 'Thực thu (VND)']].map(([key, label]) => ({ key, label, render: (r) => money(r[key]) }))];
  return <><section className="admin-resource__panel" aria-label="Biểu đồ tiền thực thu"><div className="admin-resource__actions"><h3>Tiền thực thu (VND)</h3><Button variant="secondary" aria-pressed={chartGroup === 'byDate'} onClick={() => setChartGroup('byDate')}>Biểu đồ theo ngày</Button><Button variant="secondary" aria-pressed={chartGroup === 'byCinema'} onClick={() => setChartGroup('byCinema')}>Biểu đồ theo rạp</Button></div><RevenueBars rows={report[chartGroup]} name={chartGroup === 'byDate' ? 'Ngay' : 'TenRap'} /></section><div className="admin-resource__actions" aria-label="Nhóm báo cáo">{Object.entries(groups).map(([key, [label]]) => <Button key={key} variant="secondary" aria-pressed={group === key} onClick={() => { setGroup(key); setPage(1); }}>{label}</Button>)}</div><ResourceTable caption={`${label} · Tiền thực thu từ hệ thống`} columns={columns} rowKey={key} rows={rows.slice((page - 1) * pageSize, page * pageSize)} status="success" pagination={{ page, pageSize, total: rows.length, onPageChange: setPage }} /></>;
}
function RevenueBars({ rows, name }) {
  const max = Math.max(0, ...rows.map((r) => Number(r.DoanhThuThucTe)));
  return rows.length ? <ul className="admin-analytics__bars">{rows.map((r) => <li key={r[name]}><span>{name === 'Ngay' ? formatDate(r[name]) : r[name]}</span><span className="admin-analytics__track" aria-hidden="true"><span style={{ width: `${max ? Number(r.DoanhThuThucTe) / max * 100 : 0}%` }} /></span><strong>{money(r.DoanhThuThucTe)}</strong></li>)}</ul> : <p>Không có khoản thu trong kỳ đã chọn.</p>;
}
