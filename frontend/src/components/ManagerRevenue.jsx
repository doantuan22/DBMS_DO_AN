import { useEffect, useState } from 'react';
import { getRevenue } from '../api/managerApi';
import { formatDate } from '../utils/dateTime';
import { EmptyState, ErrorState, LoadingState } from './CatalogStates';

export default function ManagerRevenue({ cinemaId, refresh }) {
  const [values, setValues] = useState({ fromDate: '', toDate: '' });
  const [range, setRange] = useState({ fromDate: '', toDate: '' });
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [resource, setResource] = useState({ status: 'loading' });
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
  return (
    <section className="catalog-section" aria-label="Doanh thu">
      <h2>Doanh thu</h2>
      <form
        className="catalog-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (values.fromDate && values.toDate && values.fromDate > values.toDate) {
            setError('Từ ngày không được sau đến ngày.');
            return;
          }
          setError('');
          setRange({ ...values });
        }}
      >
        <label>
          Từ ngày
          <input
            aria-label="Từ ngày doanh thu"
            type="date"
            value={values.fromDate}
            onChange={(event) => setValues({ ...values, fromDate: event.target.value })}
          />
        </label>
        <label>
          Đến ngày
          <input
            aria-label="Đến ngày doanh thu"
            type="date"
            value={values.toDate}
            onChange={(event) => setValues({ ...values, toDate: event.target.value })}
          />
        </label>
        <button className="catalog-button">Lọc doanh thu</button>
        <button
          type="button"
          onClick={() => {
            setValues({ fromDate: '', toDate: '' });
            setRange({ fromDate: '', toDate: '' });
            setError('');
          }}
        >
          Đặt lại
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
      {resource.status === 'loading' && <LoadingState>Đang tải doanh thu…</LoadingState>}
      {resource.status === 'error' && (
        <ErrorState error={resource.error} onRetry={() => setAttempt((value) => value + 1)} />
      )}
      {resource.status === 'success' &&
        (resource.rows?.length ? (
          <ul>
            {resource.rows.map((row) => (
              <li key={row.date}>
                {formatDate(row.date)}: {row.totalRevenue} ({row.orderCount} đơn)
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Không có doanh thu trong khoảng đã chọn.</EmptyState>
        ))}
    </section>
  );
}
