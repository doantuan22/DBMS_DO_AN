import { useEffect, useState } from 'react';
import { getComplaintOrderReference } from '../api/supportApi';
import { formatDateTime } from '../utils/dateTime';
import { EmptyState, ErrorState, LoadingState } from './CatalogStates';

const money = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
export function OrderReferenceDetails({ order }) {
  return (
    <div aria-label="Chi tiết đơn tham chiếu">
      <p>
        Mã đơn #{order.id ?? order.DonDatVeID} · {order.status ?? order.TrangThai}
      </p>
      {order.user && (
        <p>
          Khách hàng: {order.user.name} · {order.user.email} · {order.user.phone}
        </p>
      )}
      <p>
        {order.movieTitle} · {order.cinemaName} · {order.roomName} · {order.format}
      </p>
      <p>
        Suất chiếu: {formatDateTime(order.startsAt)} — {formatDateTime(order.endsAt)}
      </p>
      <p>
        Đặt lúc: {formatDateTime(order.bookedAt)}
        {order.holdExpiresAt && <> · Giữ chỗ đến: {formatDateTime(order.holdExpiresAt)}</>}
      </p>
      {order.cancellationReason && <p>Lý do hủy: {order.cancellationReason}</p>}
      <h4>Vé và ghế</h4>
      {order.tickets?.length ? (
        <ul>
          {order.tickets.map((ticket) => (
            <li key={ticket.id}>
              {ticket.label} · {ticket.type} · {money(ticket.price)} · {ticket.status} ·{' '}
              {ticket.code}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>Không có chi tiết vé.</EmptyState>
      )}
      <h4>Đồ ăn</h4>
      {order.products?.length ? (
        <ul>
          {order.products.map((product) => (
            <li key={product.id}>
              {product.name} × {product.quantity} · {money(product.unitPrice)} ·{' '}
              {money(product.total)}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>Không có đồ ăn.</EmptyState>
      )}
      <dl className="order-summary">
        <dt>Tiền vé</dt>
        <dd>{money(order.ticketTotal)}</dd>
        <dt>Tiền đồ ăn</dt>
        <dd>{money(order.productTotal)}</dd>
        <dt>Giảm giá{order.promotionCode && ` (${order.promotionCode})`}</dt>
        <dd>{money(order.discountTotal)}</dd>
        <dt>Tổng thanh toán</dt>
        <dd>{money(order.total)}</dd>
      </dl>
      <h4>Lịch sử thanh toán</h4>
      {order.payments?.length ? (
        <ul>
          {order.payments.map((payment) => (
            <li key={payment.id}>
              #{payment.id} · {payment.method} · {money(payment.amount)} · {payment.status}
              <br />
              Tạo: {formatDateTime(payment.createdAt)} · Thanh toán:{' '}
              {formatDateTime(payment.paidAt)}
              {payment.transactionCode && <> · Mã giao dịch: {payment.transactionCode}</>}
              {payment.note && <p>{payment.note}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>Chưa có lần thanh toán.</EmptyState>
      )}
      <h4>Bồi thường</h4>
      {order.compensation ? (
        <p>
          {order.compensation.points} điểm · {formatDateTime(order.compensation.creditedAt)}
        </p>
      ) : (
        <p>Không có bản ghi bồi thường.</p>
      )}
    </div>
  );
}
export default function ComplaintOrderReference({
  complaintId,
  allowed,
  loadReference = getComplaintOrderReference,
}) {
  const [attempt, setAttempt] = useState(0);
  const [resource, setResource] = useState({ status: 'loading' });
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) setResource({ status: 'loading' });
    });
    loadReference(complaintId)
      .then((result) => {
        if (active) setResource({ status: 'success', ...result });
      })
      .catch((error) => {
        if (active) setResource({ status: 'error', error });
      });
    return () => {
      active = false;
    };
  }, [complaintId, allowed, attempt, loadReference]);
  return (
    <section aria-label="Đơn hàng liên kết">
      <h3>Đơn hàng liên kết</h3>
      {!allowed ? (
        <p>Bạn chưa được cấp quyền tra cứu đơn.</p>
      ) : (
        <>
          {resource.status === 'loading' && <LoadingState>Đang tải tham chiếu đơn…</LoadingState>}
          {resource.status === 'error' && (
            <ErrorState error={resource.error} onRetry={() => setAttempt((value) => value + 1)} />
          )}
          {resource.status === 'success' &&
            (resource.order ? (
              <OrderReferenceDetails order={resource.order} />
            ) : (
              <EmptyState>{resource.message ?? 'Không có đơn hàng liên kết.'}</EmptyState>
            ))}
        </>
      )}
    </section>
  );
}
