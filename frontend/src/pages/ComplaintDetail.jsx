import { formatDateTime } from '../utils/dateTime';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getComplaint } from '../api/feedbackApi';
import { ErrorState, LoadingState } from '../components/CatalogStates';
import StatusBadge from '../components/primitives/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function ComplaintDetail() {
  const { complaintId } = useParams();
  const { user } = useAuth();
  const scope = `${complaintId}:${user?.userId}:${user?.permissions
    ?.map((item) => item.code)
    .sort()
    .join(',')}`;
  return <ComplaintContext key={scope} complaintId={complaintId} />;
}

function ComplaintContext({ complaintId }) {
  const [resource, setResource] = useState({ status: 'loading' });
  const request = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const generation = request;
    return () => {
      mounted.current = false;
      generation.current++;
    };
  }, []);
  const load = useCallback(async () => {
    const generation = ++request.current;
    setResource({ status: 'loading' });
    try {
      const result = await getComplaint(complaintId);
      if (mounted.current && generation === request.current)
        setResource({ status: 'success', data: result.complaint });
    } catch (error) {
      if (mounted.current && generation === request.current)
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
      <article className="catalog-card">
        <p className="complaint-meta">
          <span className="catalog-chip">{complaint.type}</span>
          <StatusBadge status={complaint.status} />
          <span className="catalog-muted">Gửi lúc: {formatDateTime(complaint.createdAt)}</span>
        </p>
        <p>{complaint.content}</p>
        <p>
          Đơn liên quan:{' '}
          {complaint.orderId ? (
            <Link to={`/orders/${complaint.orderId}`}>Đơn #{complaint.orderId}</Link>
          ) : (
            'Không có'
          )}
        </p>
      </article>
      <section className="catalog-section">
        <h2>Lịch sử xử lý</h2>
        {complaint.processingHistory.length ? (
          <div className="catalog-list">
            {complaint.processingHistory.map((item) => (
              <article className="catalog-card" key={item.id}>
                <p className="complaint-meta">
                  <StatusBadge status={item.status} />
                  <span className="catalog-muted">{formatDateTime(item.processedAt)}</span>
                </p>
                <p>{item.content}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="catalog-muted">Chưa có lịch sử xử lý.</p>
        )}
      </section>
      <Link className="catalog-button catalog-button--secondary" to="/complaints">
        Quay lại
      </Link>
    </section>
  );
}
