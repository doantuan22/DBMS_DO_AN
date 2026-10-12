import { useAuth } from '../context/AuthContext';
import { userCanAct } from '../utils/authorization';
import HoldDeadline from '../components/HoldDeadline';
import { formatDateTime } from '../utils/dateTime';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../api/ordersApi';
import { LoadingState } from '../components/CatalogStates';
import { PageHeader, StatusBadge, AsyncState } from '../components/ui';
import AccountNavigation from '../features/customer/AccountNavigation';
import { OrderAmounts, OrderItems, PaymentHistory } from '../features/customer/OrderReceipt';
import '../features/customer/customer-account.css';

export default function OrderDetail() {
  const { user } = useAuth();
  const { orderId } = useParams();
  const scope = `${orderId}:${user?.userId}:${user?.permissions
    ?.map((item) => item.code)
    .sort()
    .join(',')}`;
  return <OrderContext key={scope} orderId={orderId} user={user} />;
}

function OrderContext({ orderId, user }) {
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
  const [elapsedDeadline, setElapsedDeadline] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const load = useCallback(async () => {
    const generation = ++request.current;
    setResource({ status: 'loading' });
    try {
      const result = await getOrder(orderId);
      if (mounted.current && generation === request.current)
        setResource({ status: 'success', data: result.order });
    } catch (error) {
      if (mounted.current && generation === request.current)
        setResource({ status: 'error', error });
    }
  }, [orderId]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  const onElapsed = useCallback(() => {
    if (elapsedDeadline === resource.data?.holdExpiresAt) return;
    setElapsedDeadline(resource.data?.holdExpiresAt);
    void load();
  }, [load, resource.data, elapsedDeadline]);
  if (resource.status === 'loading') return <LoadingState>Đang tải chi tiết đơn…</LoadingState>;
  if (resource.status === 'error') return <section className="catalog-page"><PageHeader title="Chi tiết đơn" breadcrumbs={[{label:'Đơn của tôi',to:'/orders'}]} /><AsyncState status="error" error={resource.error} onRetry={load} /></section>;
  const order = resource.data;
  return <section className="catalog-page customer-journey"><AccountNavigation /><PageHeader title={`Đơn #${order.id}`} description={order.movieTitle} breadcrumbs={[{label:'Đơn của tôi',to:'/orders'},{label:`Đơn #${order.id}`}]} />
    <section className="customer-panel customer-status-panel"><h2>Trạng thái đơn · <StatusBadge status={order.status} /></h2><p>{order.cinemaName} · {order.roomName} · {order.format}</p><p>{formatDateTime(order.startsAt)}</p><p>Đặt lúc: {formatDateTime(order.bookedAt)}</p>{order.status==='Chờ thanh toán' && <><HoldDeadline deadline={order.holdExpiresAt} onElapsed={onElapsed} /><p>Hoàn tất thanh toán trong thời gian giữ ghế.</p></>}{order.status==='Đã thanh toán' && <p>Đơn đã thanh toán. Thông tin vé và giao dịch được lưu bên dưới.</p>}{order.status==='Hết hạn' && <p role="status">Đơn đã hết thời gian giữ ghế. Chọn suất chiếu để đặt lại.</p>}{order.cancellationNotice && <p role="status">{order.cancellationNotice}</p>}{order.compensation && <p>Điểm bồi thường đã cộng: {order.compensation.points}.</p>}</section>
    <div className="customer-journey__layout"><div className="customer-journey__main"><OrderItems order={order} /><PaymentHistory payments={order.payments} /></div><aside className="customer-journey__summary"><OrderAmounts order={order} /><div className="catalog-actions">{userCanAct(user,'KHACH_HANG','THANH_TOAN') && order.status==='Chờ thanh toán' && elapsedDeadline!==order.holdExpiresAt && Date.parse(order.holdExpiresAt)>now && <Link className="catalog-button" to={`/orders/${order.id}/payment`}>Thanh toán đơn này</Link>}{userCanAct(user,'KHACH_HANG','GUI_KHIEU_NAI') && <Link className="catalog-button catalog-button--secondary" to={`/complaints?orderId=${order.id}`}>Gửi khiếu nại về đơn này</Link>}{['Hết hạn','Đã hủy'].includes(order.status) && <Link className="catalog-button" to={`/movies/${order.movieId}`}>Chọn lịch chiếu khác</Link>}</div></aside></div><Link className="catalog-back" to="/orders">← Quay lại đơn của tôi</Link>
  </section>;
}
