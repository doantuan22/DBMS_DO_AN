import { useEffect, useState } from 'react';
import { getRevenue } from '../api/managerApi';
import { formatDate } from '../utils/dateTime';
import { money } from '../features/operations/operationsModel';
import FilterBar from './ui/FilterBar';
import FormField from './ui/FormField';
import Input from './ui/Input';
import ResourceTable from './ui/ResourceTable';
import AdminIcon from './ui/AdminIcon';
// The Manager revenue screen reuses the Admin analytics surface so both portals match.
import '../features/admin-resources/admin-resources.css';
import '../features/admin-analytics/admin-analytics.css';

const EMPTY_RANGE = { fromDate: '', toDate: '' };
const sum = (rows, key) => rows.reduce((total, row) => total + (Number(row?.[key]) || 0), 0);
const metrics = [
  ['totalRevenue', 'Tổng doanh thu', 'dollar-line', 'VND · tiền thực thu theo ngày'],
  ['orderCount', 'Tổng số đơn', 'box-line', 'đơn · ghi nhận doanh thu'],
  ['pointsPaidValue', 'Trả bằng điểm', 'star-line', 'VND · không tính doanh thu'],
  ['cancelledOrderCash', 'Đơn bị hủy suất', 'close', 'VND · đã thu, không hoàn'],
];
const columns = [
  { key: 'date', label: 'Ngày', render: (row) => formatDate(row.date) },
  { key: 'totalRevenue', label: 'Doanh thu (VND)', align: 'right', render: (row) => money(row.totalRevenue) },
  { key: 'orderCount', label: 'Số đơn', align: 'right' },
  { key: 'pointsPaidValue', label: 'Trả bằng điểm (VND)', align: 'right', render: (row) => money(row.pointsPaidValue) },
  { key: 'cancelledOrderCash', label: 'Đơn bị hủy suất (VND)', align: 'right', render: (row) => money(row.cancelledOrderCash) },
];

export default function ManagerRevenue({ cinemaId, refresh, cachedState, onStateChange }) {
  const [values, setValues] = useState(() => cachedState?.values ?? { ...EMPTY_RANGE });
  const [range, setRange] = useState(() => cachedState?.range ?? { ...EMPTY_RANGE });
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [resource, setResource] = useState({ status: 'loading' });
  useEffect(() => {
    onStateChange?.({ values, range });
  }, [values, range, onStateChange]);
  useEffect(() => {
    let active = true;
    const search = new URLSearchParams(Object.entries(range).filter(([, value]) => value));
    Promise.resolve().then(() => {
      if (active) setResource({ status: 'loading' });
    });
    getRevenue(cinemaId, search.size ? `?${search}` : '')
      .then((result) => {
        if (active) setResource({ status: 'success', rows: result.revenue });
      })
      .catch((failure) => {
        if (active) setResource({ status: 'error', error: failure });
      });
    return () => {
      active = false;
    };
  }, [cinemaId, range, attempt, refresh]);
  const rows = resource.status === 'success' ? (resource.rows ?? []) : [];
  const summary = {
    totalRevenue: sum(rows, 'totalRevenue'),
    orderCount: sum(rows, 'orderCount'),
    pointsPaidValue: sum(rows, 'pointsPaidValue'),
    cancelledOrderCash: sum(rows, 'cancelledOrderCash'),
  };
  const scope =
    range.fromDate && range.toDate
      ? `${formatDate(range.fromDate)} — ${formatDate(range.toDate)}`
      : range.fromDate
        ? `Từ ${formatDate(range.fromDate)}`
        : range.toDate
          ? `Đến ${formatDate(range.toDate)}`
          : 'Toàn bộ kỳ';
  const applyFilters = () => {
    if (values.fromDate && values.toDate && values.fromDate > values.toDate) {
      setError('Từ ngày không được sau đến ngày.');
      return;
    }
    setError('');
    if (values.fromDate !== range.fromDate || values.toDate !== range.toDate)
      setRange({ ...values });
  };
  const resetFilters = () => {
    setValues({ ...EMPTY_RANGE });
    if (range.fromDate || range.toDate) setRange({ ...EMPTY_RANGE });
    setError('');
  };
  return (
    <section className="admin-analytics__report" aria-label="Báo cáo theo kỳ">
      <div className="admin-analytics__section-heading">
        <div>
          <h2>Phạm vi báo cáo</h2>
          <p>Chọn khoảng thời gian để xem doanh thu của rạp đang quản lý.</p>
        </div>
      </div>
      <FilterBar
        label="Bộ lọc doanh thu"
        schema={[
          { key: 'fromDate', label: 'Từ ngày', format: formatDate },
          { key: 'toDate', label: 'Đến ngày', format: formatDate },
        ]}
        draft={values}
        applied={range}
        showChips={false}
        applyLabel="Lọc doanh thu"
        resetLabel="Đặt lại"
        onApply={applyFilters}
        onReset={resetFilters}
      >
        <FormField label="Từ ngày">
          <Input
            aria-label="Từ ngày doanh thu"
            type="date"
            value={values.fromDate}
            onChange={(event) => setValues({ ...values, fromDate: event.target.value })}
          />
        </FormField>
        <FormField label="Đến ngày">
          <Input
            aria-label="Đến ngày doanh thu"
            type="date"
            value={values.toDate}
            onChange={(event) => setValues({ ...values, toDate: event.target.value })}
          />
        </FormField>
      </FilterBar>
      {error && <p role="alert">{error}</p>}
      <p className="admin-analytics__scope" role="status">
        {scope}. Bao gồm hai ngày biên, theo ngày thu tiền Việt Nam.
      </p>
      <p className="admin-analytics__report-note">
        Tiền thực thu theo thanh toán thành công. Khoản trả bằng điểm không tính vào doanh thu; tiền
        thuộc đơn bị hủy suất được tách riêng.
      </p>
      {resource.status === 'success' && (
        <dl className="admin-analytics__metrics">
          {metrics.map(([key, label, icon, note]) => (
            <div key={key} data-metric={key}>
              <span className="admin-analytics__metric-icon" aria-hidden="true">
                <AdminIcon name={icon} />
              </span>
              <dt>{label}</dt>
              <dd>{['totalRevenue', 'pointsPaidValue', 'cancelledOrderCash'].includes(key) ? money(summary[key]) : Number(summary[key] || 0).toLocaleString('vi-VN')}</dd>
              <dd className="admin-analytics__metric-scope">{note}</dd>
            </div>
          ))}
        </dl>
      )}
      <ResourceTable
        columns={columns}
        rows={rows}
        rowKey="date"
        caption="Doanh thu theo ngày"
        status={resource.status}
        error={resource.error}
        onRetry={() => setAttempt((value) => value + 1)}
        emptyMessage="Không có doanh thu trong khoảng đã chọn."
      />
    </section>
  );
}
