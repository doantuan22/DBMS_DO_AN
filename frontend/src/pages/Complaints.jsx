import { useAuth } from '../context/AuthContext';
import { userCanAct } from '../utils/authorization';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createComplaint, getComplaints } from '../api/feedbackApi';
import { getOrders } from '../api/ordersApi';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import StatusBadge from '../components/primitives/StatusBadge';

const initialForm = { type: '', title: '', content: '', orderId: '' };

export default function Complaints() {
  const { user } = useAuth();
  // /orders/:id links here with ?orderId= so the complaint form opens already linked to that order.
  const [searchParams] = useSearchParams();
  const queryOrderId = searchParams.get('orderId') ?? '';
  const canCreate = userCanAct(user, 'KHACH_HANG', 'GUI_KHIEU_NAI');
  const [resource, setResource] = useState({ status: 'loading' }); const [orders, setOrders] = useState([]); const [form, setForm] = useState(() => ({ ...initialForm, orderId: queryOrderId })); const [submit, setSubmit] = useState({ status: 'idle' });
  const [orderLookup, setOrderLookup] = useState({ status: 'loading' });
  const orderRequest = useRef(0);
  const pending = useRef(false);
  const load = useCallback(async () => { setResource({ status: 'loading' }); try { setResource({ status: 'success', data: (await getComplaints()).complaints }); } catch (error) { setResource({ status: 'error', error }); } }, []);
  // Drop a prefilled order id that is not one of this customer's orders.
  const applyOrders = useCallback((list) => { setOrders(list); setForm((current) => (list.some((order) => String(order.id) === current.orderId) ? current : { ...current, orderId: '' })); }, []);
  const loadOrders = useCallback(async () => {
    const request = ++orderRequest.current;
    setOrderLookup({ status: 'loading' });
    try {
      const result = await getOrders();
      if (request !== orderRequest.current) return;
      applyOrders(result.orders); setOrderLookup({ status: 'success' });
    } catch (error) { if (request === orderRequest.current) setOrderLookup({ status: 'error', error }); }
  }, [applyOrders]);
  useEffect(() => { const request = orderRequest; void Promise.resolve().then(load); void Promise.resolve().then(loadOrders); return () => { request.current++; }; }, [load, loadOrders]);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  async function onSubmit(event) { event.preventDefault(); if (!canCreate || pending.current || (form.orderId && orderLookup.status !== 'success')) return; pending.current = true; setSubmit({ status: 'loading' }); try { const { complaint } = await createComplaint({ ...form, orderId: form.orderId || null }); setForm(initialForm); setSubmit({ status: 'success', message: 'Đã gửi khiếu nại.' }); setResource((current) => current.status === 'success' ? { status: 'success', data: [complaint, ...current.data] } : current); } catch (error) { setSubmit({ status: 'error', message: error.message }); } finally { pending.current = false; } }
  return <section className="catalog-page"><p className="catalog-eyebrow">TÀI KHOẢN</p><h1>Khiếu nại của tôi</h1>{canCreate && <form className="catalog-form" onSubmit={onSubmit}><h2>Gửi khiếu nại</h2><label>Loại khiếu nại<input value={form.type} maxLength="100" onChange={update('type')} required disabled={submit.status === 'loading'} /></label><label>Tiêu đề<input value={form.title} maxLength="200" onChange={update('title')} required disabled={submit.status === 'loading'} /></label><label>Nội dung<textarea value={form.content} onChange={update('content')} required disabled={submit.status === 'loading'} /></label><label>Đơn liên quan (không bắt buộc)<select value={form.orderId} onChange={update('orderId')} disabled={submit.status === 'loading' || orderLookup.status !== 'success'}><option value="">Không liên kết đơn</option>{orders.map((order) => <option key={order.id} value={order.id}>Đơn #{order.id} · {order.movieTitle}</option>)}</select></label>{orderLookup.status === 'loading' && <LoadingState />}{orderLookup.status === 'error' && <ErrorState error={orderLookup.error} onRetry={loadOrders} />}{orderLookup.status === 'success' && orders.length === 0 && <EmptyState />}{submit.status === 'error' && <p role="alert">{submit.message}</p>}{submit.status === 'success' && <p role="status">{submit.message}</p>}<button className="catalog-button" disabled={submit.status === 'loading'}>{submit.status === 'loading' ? 'Đang gửi…' : 'Gửi khiếu nại'}</button></form>}<h2>Lịch sử khiếu nại</h2>{resource.status === 'loading' && <LoadingState>Đang tải khiếu nại…</LoadingState>}{resource.status === 'error' && <ErrorState error={resource.error} onRetry={load} />}{resource.status === 'success' && resource.data.length === 0 && <EmptyState>Chưa có khiếu nại.</EmptyState>}{resource.status === 'success' && resource.data.length > 0 && <div className="catalog-list">{resource.data.map((complaint) => <article className="catalog-card" key={complaint.id}><h3>{complaint.title}</h3><p>#{complaint.id} · {complaint.type} · <StatusBadge status={complaint.status} /></p><p>Đơn liên quan: {complaint.orderId ?? 'Không có'}</p><Link className="catalog-button" to={`/complaints/${complaint.id}`}>Xem chi tiết</Link></article>)}</div>}</section>;
}
