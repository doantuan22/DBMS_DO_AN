import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdminWorkspace } from '../admin-workspace/AdminWorkspaceContext.js';
import {
  PageHeader,
  FilterBar,
  FormField,
  Input,
  Select,
  Button,
  AsyncState,
  ResourceTable,
} from '../../components/ui';
import Forbidden from '../../pages/Forbidden';
import { formatDate } from '../../utils/dateTime';
import { money } from '../admin-resources/resourceModel';
import { REPORT_METRICS, DASHBOARD_METRICS } from './analyticsModel';
import { analyticsAdapter } from './analyticsAdapter';
import { createAnalyticsController } from './analyticsController';
import '../admin-resources/admin-resources.css';
import './admin-analytics.css';
import AdminIcon from '../../components/ui/AdminIcon';
import { RevenueTrend, RevenueMix } from './RevenueCharts';
export default function AdminAnalytics({ kind }) {
  const { user } = useAuth(),
    store = useAdminWorkspace(),
    adapter = analyticsAdapter(user);
  if (!adapter.allowed) return <Forbidden />;
  return (
    <Workspace
      key={`${kind}:${user.userId}:${user.permissions
        .map((p) => p.code)
        .sort()
        .join(',')}`}
      kind={kind}
      store={store}
      adapter={adapter}
    />
  );
}
function Workspace({ kind, store, adapter }) {
  const [params, setParams] = useSearchParams(),
    query = params.toString(),
    ref = useRef(query);
  useLayoutEffect(() => {
    ref.current = query;
  }, [query]);
  const onQueryChange = useCallback(
    (next, options) => {
      if (ref.current !== next) {
        ref.current = next;
        setParams(next, options);
      }
    },
    [setParams],
  );
  // Initialization stores the callback without reading the ref.
  // oxlint-disable-next-line react/refs
  const [controller] = useState(() =>
    createAnalyticsController({ adapter, kind, store, initialQuery: query, onQueryChange }),
  );
  const state = useSyncExternalStore(
      controller.subscribe,
      controller.getSnapshot,
      controller.getSnapshot,
    ),
    previous = useRef(query);
  useEffect(() => {
    void controller.start();
    return () => controller.dispose();
  }, [controller]);
  useEffect(() => {
    if (previous.current !== query) {
      previous.current = query;
      void controller.syncQuery(query);
    }
  }, [query, controller]);
  return <AnalyticsView kind={kind} state={state} controller={controller} />;
}
const metricIcons = {
  TongDoanhThuToanThoiGian: 'dollar-line',
  TongDonThanhCong: 'box-line',
  SuatChieuHomNay: 'calendar',
  KhieuNaiChuaXuLy: 'chat',
  TongNguoiDung: 'group',
  TongRap: 'map-icon',
  TongPhongChieu: 'layout',
  PhimDangChieu: 'videos',
  TongDoanhThuThucTe: 'dollar-line',
  TongSoDonToanHeThong: 'box-line',
  TongSoVeBan: 'videos',
  TongDoanhThuVe: 'dollar-line',
  TongDoanhThuDoAn: 'box-cube',
  TongTienGiam: 'star-line',
};
export function MetricCards({ data, definitions, compact = false }) {
  return (
    <dl
      className={`admin-analytics__metrics${compact ? ' admin-analytics__metrics--compact' : ''}`}
    >
      {definitions.map(([key, label, format, scope]) => (
        <div key={key} data-metric={key}>
          <span className="admin-analytics__metric-icon" aria-hidden="true">
            <AdminIcon name={metricIcons[key]} />
          </span>
          <dt>{label}</dt>
          <dd>{format(data?.[key])}</dd>
          <dd className="admin-analytics__metric-scope">{scope}</dd>
        </div>
      ))}
    </dl>
  );
}
export function AnalyticsView({ kind, state, controller }) {
  const overview = kind === 'overview',
    title = overview ? 'Tổng quan hệ thống' : 'Báo cáo doanh thu',
    applied = state.applied;
  return (
    <section className="admin-resource admin-analytics">
      {!overview && (
        <PageHeader
          title={title}
          description="Theo dõi tiền thực thu, cơ cấu doanh thu và hiệu quả từng rạp, từng phim."
          breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Doanh thu' }]}
        />
      )}
      {overview && (
        <section className="admin-analytics__overview" aria-label="Chỉ số toàn hệ thống">
          <h2 className="ui-visually-hidden">Hiện tại và toàn thời gian</h2>
          <AsyncState
            status={state.dashboard.status}
            error={state.dashboard.error}
            onRetry={controller.reloadDashboard}
          />
          {state.dashboard.status === 'success' && (
            <>
              <MetricCards
                data={state.dashboard.data}
                definitions={DASHBOARD_METRICS.slice(0, 4)}
              />
              <MetricCards
                data={state.dashboard.data}
                definitions={DASHBOARD_METRICS.slice(4)}
                compact
              />
            </>
          )}
        </section>
      )}
      <section className="admin-analytics__report" aria-label="Báo cáo theo kỳ">
        <div className="admin-analytics__section-heading">
          <div>
            <h2>{overview ? 'Doanh thu theo kỳ' : 'Phạm vi báo cáo'}</h2>
            <p>Chọn khoảng thời gian và rạp để xem báo cáo chi tiết.</p>
          </div>
        </div>
        <FilterBar
          resetLabel="Về tháng hiện tại"
          showChips={false}
          schema={[
            { key: 'fromDate', label: 'Từ ngày', format: formatDate },
            { key: 'toDate', label: 'Đến ngày', format: formatDate },
            {
              key: 'cinemaId',
              label: 'Rạp',
              format: (id) =>
                state.cinemas.rows.find((r) => String(r.id) === id)?.label ?? 'Rạp đã chọn',
            },
          ]}
          draft={state.filters}
          applied={applied}
          onApply={() => void controller.applyFilters()}
          onReset={() => void controller.resetFilters()}
        >
          <FormField label="Từ ngày" required>
            <Input
              type="date"
              value={state.filters.fromDate}
              required
              onChange={(e) => controller.setFilters({ fromDate: e.target.value })}
            />
          </FormField>
          <FormField label="Đến ngày" required>
            <Input
              type="date"
              value={state.filters.toDate}
              required
              onChange={(e) => controller.setFilters({ toDate: e.target.value })}
            />
          </FormField>
          <FormField label="Rạp báo cáo">
            <Select
              value={state.filters.cinemaId}
              disabled={state.cinemas.status !== 'success'}
              onChange={(e) => controller.setFilters({ cinemaId: e.target.value })}
            >
              <option value="">Tất cả rạp</option>
              {state.cinemas.rows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>
          </FormField>
        </FilterBar>
        <AsyncState
          status={state.cinemas.status === 'error' ? 'error' : 'idle'}
          error={state.cinemas.error}
          onRetry={controller.reloadCinemas}
        />
        {state.error && <p role="alert">{state.error.message}</p>}
        <p className="admin-analytics__scope" role="status">
          {safeDate(applied.fromDate)} — {safeDate(applied.toDate)} ·{' '}
          {applied.cinemaId
            ? (state.cinemas.rows.find((r) => String(r.id) === applied.cinemaId)?.label ??
              'Rạp đã chọn')
            : 'Tất cả rạp'}
          . Bao gồm hai ngày biên, theo ngày thu tiền Việt Nam.
        </p>
        <p className="admin-analytics__report-note">
          Tiền thực thu theo thanh toán thành công, độc lập với trạng thái đơn hiện tại. Giá vé, đồ
          ăn và giảm giá theo snapshot của đơn. Điểm bồi thường không được tính thành hoàn tiền.
        </p>
        <AsyncState
          status={state.report.status}
          error={state.report.error}
          onRetry={controller.reloadReport}
        />
        {state.report.status === 'success' && (
          <>
            <MetricCards data={state.report.data.summary} definitions={REPORT_METRICS} />
            <RevenueDetails key={JSON.stringify(applied)} report={state.report.data} />
          </>
        )}
      </section>
    </section>
  );
}
function safeDate(value) {
  try {
    return formatDate(value);
  } catch {
    return 'Ngày chưa hợp lệ';
  }
}
export function RevenueDetails({ report }) {
  const [group, setGroup] = useState('byCinema'),
    [page, setPage] = useState(1),
    [chartGroup, setChartGroup] = useState('byDate');
  const groups = {
      byCinema: ['Theo rạp', 'RapID', 'TenRap'],
      byMovie: ['Theo phim', 'PhimID', 'TenPhim'],
      byDate: ['Theo ngày', 'Ngay', 'Ngay'],
    },
    rawRows = report[group] ?? [],
    rows = useMemo(() => {
      if (group === 'byCinema') {
        return [...rawRows].sort((a, b) => (Number(b.DoanhThuThucTe) || 0) - (Number(a.DoanhThuThucTe) || 0));
      }
      return rawRows;
    }, [rawRows, group]),
    [label, key, name] = groups[group],
    pageSize = 20;
  const columns = [
    {
      key: name,
      label: group === 'byDate' ? 'Ngày thu tiền' : group === 'byMovie' ? 'Phim' : 'Rạp',
      ...(group === 'byDate' ? { render: (r) => formatDate(r.Ngay) } : {}),
    },
    { key: 'SoDon', label: 'Số đơn' },
    { key: 'SoVeBan', label: 'Số vé' },
    ...[
      ['DoanhThuVe', 'Tiền vé (VND)'],
      ['DoanhThuDoAn', 'Đồ ăn (VND)'],
      ['TongTienGiam', 'Giảm giá (VND)'],
      ['DoanhThuThucTe', 'Thực thu (VND)'],
    ].map(([key, label]) => ({ key, label, render: (r) => money(r[key]) })),
  ];
  return (
    <>
      <div className="admin-analytics__charts">
        <section className="admin-resource__panel" aria-label="Biểu đồ tiền thực thu">
          <div className="admin-analytics__chart-heading">
            <div>
              <h3>Tiền thực thu</h3>
              <p>Đơn vị VND · Thanh toán thành công</p>
            </div>
            <div className="admin-analytics__chart-tabs">
              <Button
                size="sm"
                variant="secondary"
                aria-label="Biểu đồ theo ngày"
                aria-pressed={chartGroup === 'byDate'}
                onClick={() => setChartGroup('byDate')}
              >
                Theo ngày
              </Button>
              <Button
                size="sm"
                variant="secondary"
                aria-label="Biểu đồ theo rạp"
                aria-pressed={chartGroup === 'byCinema'}
                onClick={() => setChartGroup('byCinema')}
              >
                Theo rạp
              </Button>
            </div>
          </div>
          {chartGroup === 'byDate' ? (
            <RevenueTrend rows={report.byDate} />
          ) : (
            <RevenueBars rows={report.byCinema} name="TenRap" />
          )}
        </section>
        <section className="admin-resource__panel" aria-label="Cơ cấu giá trị đơn">
          <div className="admin-analytics__chart-heading">
            <div>
              <h3>Cơ cấu giá trị đơn</h3>
              <p>Tiền vé và đồ ăn trước giảm giá</p>
            </div>
          </div>
          <RevenueMix summary={report.summary} />
        </section>
      </div>
      <div className="admin-analytics__section-heading">
        <h2>Chi tiết doanh thu</h2>
        <div className="admin-analytics__chart-tabs" aria-label="Nhóm báo cáo">
          {Object.entries(groups).map(([key, [label]]) => (
            <Button
              key={key}
              size="sm"
              variant="secondary"
              aria-pressed={group === key}
              onClick={() => {
                setGroup(key);
                setPage(1);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      <ResourceTable
        caption={`${label} · Tiền thực thu từ hệ thống`}
        columns={columns}
        rowKey={key}
        rows={rows.slice((page - 1) * pageSize, page * pageSize)}
        status="success"
        pagination={{ page, pageSize, total: rows.length, onPageChange: setPage }}
      />
    </>
  );
}
function RevenueBars({ rows, name }) {
  const max = Math.max(0, ...rows.map((r) => Number(r.DoanhThuThucTe)));
  return rows.length ? (
    <ul className="admin-analytics__bars">
      {rows.map((r) => (
        <li key={r[name]}>
          <span>{name === 'Ngay' ? formatDate(r[name]) : r[name]}</span>
          <span className="admin-analytics__track" aria-hidden="true">
            <span style={{ width: `${max ? (Number(r.DoanhThuThucTe) / max) * 100 : 0}%` }} />
          </span>
          <strong>{money(r.DoanhThuThucTe)}</strong>
        </li>
      ))}
    </ul>
  ) : (
    <p>Không có khoản thu trong kỳ đã chọn.</p>
  );
}
