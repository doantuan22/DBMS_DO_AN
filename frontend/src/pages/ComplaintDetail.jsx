import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getComplaint } from '../api/feedbackApi';
import { ErrorState, LoadingState } from '../components/CatalogStates';

export default function ComplaintDetail() {
  const { complaintId } = useParams(); const [resource, setResource] = useState({ status: 'loading' });
  const load = useCallback(async () => { setResource({ status: 'loading' }); try { setResource({ status: 'success', data: (await getComplaint(complaintId)).complaint }); } catch (error) { setResource({ status: 'error', error }); } }, [complaintId]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  if (resource.status === 'loading') return <LoadingState>Đang tải khiếu nại…</LoadingState>;
  if (resource.status === 'error') return <ErrorState error={resource.error} onRetry={load} />;
  const complaint = resource.data;
  return <section className="catalog-page"><p className="catalog-eyebrow">KHIẾU NẠI #{complaint.id}</p><h1>{complaint.title}</h1><p>{complaint.type} · {complaint.status}</p><p>{complaint.content}</p><p>Đơn liên quan: {complaint.orderId ?? 'Không có'}</p><p>Gửi lúc: {complaint.createdAt}</p><h2>Lịch sử xử lý</h2>{complaint.processingHistory.length ? <ul>{complaint.processingHistory.map((item) => <li key={item.id}>{item.status} · {item.content} · {item.processedAt}</li>)}</ul> : <p>Chưa có lịch sử xử lý.</p>}<Link className="catalog-button catalog-button--secondary" to="/complaints">Quay lại</Link></section>;
}
