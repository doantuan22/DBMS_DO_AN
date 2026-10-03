import { formatDateTime } from '../utils/dateTime';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../api/ordersApi';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);

export default function Orders() {
  const [resource, setResource] = useState({ status: 'loading' });
  const load = useCallback(async () => {
    setResource({ status: 'loading' });
    try { setResource({ status: 'success', data: (await getOrders()).orders }); } catch (error) { setResource({ status: 'error', error }); }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  return (
    <section className="catalog-page">
      <p className="catalog-eyebrow">TÀI KHOẢN</p><h1>Đơn đặt vé của tôi</h1>
      {resource.status === 'loading' && <LoadingState>Đang tải lịch sử đơn…</LoadingState>}
      {resource.status === 'error' && <ErrorState error={resource.error} onRetry={load} />}
      {resource.status === 'success' && resource.data.length === 0 && <EmptyState>Chưa có đơn đặt vé.</EmptyState>}
      {resource.status === 'success' && resource.data.length > 0 && <div className="catalog-list">
        {resource.data.map((order) => <article className="catalog-card" key={order.id}>
          <h2>{order.movieTitle}</h2>
          <p>{order.cinemaName} · {order.roomName} · {formatDateTime(order.startsAt)}</p>
          <p>Đơn #{order.id} · {order.status}</p>
          <p>Tổng thanh toán: {money(order.total)} · Thanh toán gần nhất: {order.latestPaymentStatus ?? 'Chưa tạo'}</p>
          <Link className="catalog-button" to={`/orders/${order.id}`}>Xem chi tiết</Link>
        </article>)}
      </div>}
    </section>
  );
}
