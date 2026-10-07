import { formatDateTime } from '../utils/dateTime';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getComplaint } from '../api/feedbackApi';
import { ErrorState, LoadingState } from '../components/CatalogStates';

export default function ComplaintDetail() {
  const { complaintId } = useParams();
  const [resource, setResource] = useState({ status: 'loading' });

  const load = useCallback(async () => {
    setResource({ status: 'loading' });
    try {
      setResource({ status: 'success', data: (await getComplaint(complaintId)).complaint });
    } catch (error) {
      setResource({ status: 'error', error });
    }
  }, [complaintId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (resource.status === 'loading') return <LoadingState>Đang tải khiếu nại…</LoadingState>;
  if (resource.status === 'error') return <ErrorState error={resource.error} onRetry={load} />;

  const complaint = resource.data;

  return (
    <section className="catalog-page">
      <p className="catalog-eyebrow">KHIẾU NẠI #{complaint.id}</p>
      <h1>{complaint.title}</h1>

      <div className="catalog-card" style={{ margin: '1.5rem 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <span className="catalog-chip">{complaint.type}</span>
          <span className="catalog-chip" style={{ background: complaint.status === 'Đã giải quyết' ? '#ecfdf5' : '#eff6ff', color: complaint.status === 'Đã giải quyết' ? '#047857' : '#1d4ed8' }}>
            {complaint.status}
          </span>
          <span className="catalog-muted">Gửi lúc: {formatDateTime(complaint.createdAt)}</span>
        </div>

        <p style={{ fontSize: '1.05rem', color: 'var(--color-text)', lineHeight: 1.6, marginTop: '0.5rem' }}>
          {complaint.content}
        </p>

        {complaint.orderId && (
          <p style={{ marginTop: '0.5rem' }}>
            <strong>Đơn liên quan:</strong>{' '}
            <Link to={`/orders/${complaint.orderId}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Đơn #{complaint.orderId}
            </Link>
          </p>
        )}
      </div>

      <section className="catalog-section">
        <h2>Lịch sử xử lý</h2>
        {complaint.processingHistory.length ? (
          <ul className="catalog-list">
            {complaint.processingHistory.map((item) => (
              <li key={item.id} className="catalog-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{item.status}</strong>
                  <span className="catalog-muted">{formatDateTime(item.processedAt)}</span>
                </div>
                <p>{item.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="catalog-muted">Chưa có lịch sử xử lý.</p>
        )}
      </section>

      <div style={{ marginTop: '2rem' }}>
        <Link className="catalog-button catalog-button--secondary" to="/complaints">
          Quay lại danh sách khiếu nại
        </Link>
      </div>
    </section>
  );
}
