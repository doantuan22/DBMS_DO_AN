import { useAuth } from '../context/AuthContext';
import { userCanAct } from '../utils/authorization';
import HoldDeadline from '../components/HoldDeadline';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createPaymentAttempt, getOrder, submitPaymentResult } from '../api/ordersApi';
import { ErrorState, LoadingState } from '../components/CatalogStates';
import StatusBadge from '../components/primitives/StatusBadge';
import { bookingErrorMessage } from '../utils/bookingLimits';
import { getSeats } from '../api/catalogApi';

const METHODS = ['VNPAY', 'MOMO', 'ZALOPAY', 'THE_NOI_DIA', 'THE_QUOC_TE', 'TIEN_MAT'];
const money = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value ?? 0);

export default function PaymentPage() {
  const { user } = useAuth();
  const { orderId } = useParams();
  const scope = `${orderId}:${user?.userId}:${user?.permissions
    ?.map((item) => item.code)
    .sort()
    .join(',')}`;
  return <PaymentContext key={scope} orderId={orderId} user={user} />;
}

function PaymentContext({ orderId, user }) {
  const canPay = userCanAct(user, 'KHACH_HANG', 'THANH_TOAN');
  const [resource, setResource] = useState({ status: 'loading' });
  const request = useRef(0);
  const mounted = useRef(true);
  const pending = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const generation = request;
    return () => {
      mounted.current = false;
      generation.current++;
    };
  }, []);
  const [method, setMethod] = useState(METHODS[0]);
  const [elapsedDeadline, setElapsedDeadline] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
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
    if (resource.data?.showtimeId) void getSeats(resource.data.showtimeId).catch(() => {});
  }, [load, resource.data, elapsedDeadline]);
  useEffect(() => {
    if (!elapsedDeadline || resource.data?.status !== 'Chờ thanh toán') return;
    const timer = setInterval(() => {
      void load();
    }, 3000);
    return () => clearInterval(timer);
  }, [elapsedDeadline, resource.data?.status, load]);

  async function confirmPayment() {
    if (pending.current || !canConfirm) return;
    pending.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const { payment } = await createPaymentAttempt(orderId, method);
      const result = await submitPaymentResult(orderId, payment.id, 'Thành công');
      if (!mounted.current) return;
      request.current++;
      setResource({ status: 'success', data: result.order });
      setMessage('Đã xác nhận thanh toán thành công.');
    } catch (error) {
      if (!mounted.current) return;
      setMessage(bookingErrorMessage(error) ?? error.message);
      await load();
      if (resource.data?.showtimeId) void getSeats(resource.data.showtimeId).catch(() => {});
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  if (resource.status === 'loading')
    return <LoadingState>Đang tải thông tin thanh toán…</LoadingState>;
  if (resource.status === 'error') return <ErrorState error={resource.error} onRetry={load} />;
  const order = resource.data;
  const payable = order.status === 'Chờ thanh toán';
  const canConfirm =
    canPay &&
    payable &&
    Boolean(order.holdExpiresAt) &&
    elapsedDeadline !== order.holdExpiresAt &&
    Date.parse(order.holdExpiresAt) > now;
  return (
    <section className="catalog-page">
      <p className="catalog-eyebrow">THANH TOÁN MÔ PHỎNG</p>
      <h1>Đơn #{order.id}</h1>
      <p>
        {order.movieTitle} · {order.cinemaName}
      </p>
      <p>
        Database chốt tổng thanh toán: <strong>{money(order.total)}</strong>
      </p>
      <p>
        Trạng thái đơn: <StatusBadge status={order.status} />
      </p>
      <p className="catalog-muted">
        Thanh toán mô phỏng. Bấm xác nhận trong thời gian giữ ghế để hoàn tất đơn.
      </p>
      {payable && <HoldDeadline deadline={order.holdExpiresAt} onElapsed={onElapsed} />}
      {payable && !canPay && <p role="status">Bạn chưa được cấp quyền thanh toán.</p>}
      {payable && (
        <div className="payment-actions">
          <label>
            Phương thức
            <select
              value={method}
              disabled={busy || !canConfirm}
              onChange={(event) => setMethod(event.target.value)}
            >
              {METHODS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="catalog-button"
            onClick={confirmPayment}
            disabled={busy || !canConfirm}
          >
            {busy ? 'Đang xác nhận…' : 'Xác nhận thanh toán'}
          </button>
        </div>
      )}
      {payable && canPay && !canConfirm && (
        <p role="status">Đang kiểm tra hạn giữ ghế với máy chủ…</p>
      )}
      {order.status === 'Hết hạn' && (
        <p role="alert">
          Đơn đã hết thời gian giữ ghế. Ghế đã được giải phóng; vui lòng đặt vé lại.
        </p>
      )}
      {order.cancellationNotice && <p role="status">{order.cancellationNotice}</p>}
      {order.compensation && <p>Điểm bồi thường đã cộng: {order.compensation.points}.</p>}
      {message && (
        <p role="status" className={message.includes('Đã') ? 'form-success' : 'form-error'}>
          {message}
        </p>
      )}
      <h2>Lịch sử giao dịch</h2>
      <ul>
        {order.payments.map((payment) => (
          <li key={payment.id}>
            #{payment.id} · {payment.method} · {money(payment.amount)} · {payment.status}
          </li>
        ))}
      </ul>
      <Link className="catalog-button catalog-button--secondary" to={`/orders/${order.id}`}>
        Xem chi tiết đơn
      </Link>
    </section>
  );
}
