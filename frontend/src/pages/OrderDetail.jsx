import { useAuth } from '../context/AuthContext';
import { userCanAct } from '../utils/authorization';
import HoldDeadline from '../components/HoldDeadline';
import { formatDateTime } from '../utils/dateTime';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../api/ordersApi';
import { ErrorState, LoadingState } from '../components/CatalogStates';
import StatusBadge from '../components/primitives/StatusBadge';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);

export default function OrderDetail() {
  const { user } = useAuth();
  const { orderId } = useParams();
  const scope = `${orderId}:${user?.userId}:${user?.permissions?.map(item => item.code).sort().join(',')}`;
  return <OrderContext key={scope} orderId={orderId} user={user} />;
}

function OrderContext({ orderId, user }) {
  const [resource, setResource] = useState({ status: 'loading' });
  const request = useRef(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; const generation = request; return () => { mounted.current = false; generation.current++; }; }, []);
  const [elapsedDeadline, setElapsedDeadline] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const load = useCallback(async () => {
    const generation = ++request.current;
    setResource({ status: 'loading' });
    try { const result = await getOrder(orderId); if (mounted.current && generation === request.current) setResource({ status: 'success', data: result.order }); } catch (error) { if (mounted.current && generation === request.current) setResource({ status: 'error', error }); }
  }, [orderId]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  const onElapsed = useCallback(() => {
    if (elapsedDeadline === resource.data?.holdExpiresAt) return;
    setElapsedDeadline(resource.data?.holdExpiresAt);
    void load();
  }, [load, resource.data, elapsedDeadline]);
  if (resource.status === 'loading') return <LoadingState>Đang tải chi tiết đơn…</LoadingState>;
  if (resource.status === 'error') return <ErrorState error={resource.error} onRetry={load} />;
  const order = resource.data;
  return <section className="catalog-page"><p className="catalog-eyebrow">ĐƠN #{order.id}</p><h1>{order.movieTitle}</h1>
    <p>{order.cinemaName} · {order.roomName} · {formatDateTime(order.startsAt)}</p><p>Trạng thái đơn: <StatusBadge status={order.status} /></p>
    {order.cancellationNotice && <p role="status">{order.cancellationNotice}</p>}
    {order.compensation && <p>Điểm bồi thường đã cộng: {order.compensation.points}.</p>}
    {order.status === 'Chờ thanh toán' && <HoldDeadline deadline={order.holdExpiresAt} onElapsed={onElapsed} />}
    <p>Ghế: {order.seatLabels || order.tickets.map((ticket) => ticket.label).join(', ')}</p>
    <p>Vé: {money(order.ticketTotal)} · Đồ ăn: {money(order.productTotal)} · Giảm giá: {money(order.discountTotal)} · <strong>Tổng: {money(order.total)}</strong></p>
    <h2>Vé</h2><ul>{order.tickets.map((ticket) => <li key={ticket.id}>{ticket.label} · {ticket.type} · {money(ticket.price)} · {ticket.status}</li>)}</ul>
    <h2>Đồ ăn</h2>{order.products.length ? <ul>{order.products.map((product) => <li key={product.id}>{product.quantity} × {product.name} · {money(product.total)}</li>)}</ul> : <p>Không có đồ ăn.</p>}
    <h2>Lịch sử thanh toán</h2>{order.payments.length ? <ul>{order.payments.map((payment) => <li key={payment.id}>#{payment.id} · {payment.method} · {money(payment.amount)} · {payment.status} · {payment.transactionCode}</li>)}</ul> : <p>Chưa có giao dịch thanh toán.</p>}
    <div className="catalog-actions">
      {userCanAct(user, 'KHACH_HANG', 'THANH_TOAN') && order.status === 'Chờ thanh toán' && elapsedDeadline !== order.holdExpiresAt && Date.parse(order.holdExpiresAt) > now && <Link className="catalog-button" to={`/orders/${order.id}/payment`}>Thanh toán đơn này</Link>}
      {userCanAct(user, 'KHACH_HANG', 'GUI_KHIEU_NAI') && <Link className="catalog-button catalog-button--secondary" to={`/complaints?orderId=${order.id}`}>Gửi khiếu nại về đơn này</Link>}
      <Link className="catalog-button catalog-button--secondary" to="/orders">Quay lại đơn của tôi</Link>
    </div>
  </section>;
}
