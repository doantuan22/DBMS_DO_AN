import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createPaymentAttempt, getOrder, submitPaymentResult } from '../api/ordersApi';
import { ErrorState, LoadingState } from '../components/CatalogStates';
import { bookingErrorMessage } from '../utils/bookingLimits';
import { lifecycleErrorMessage } from '../utils/lifecycleErrorMessage';

const METHODS = ['VNPAY', 'MOMO', 'ZALOPAY', 'THE_NOI_DIA', 'THE_QUOC_TE', 'TIEN_MAT'];
const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);

export default function PaymentPage() {
  const { orderId } = useParams();
  const [resource, setResource] = useState({ status: 'loading' });
  const [method, setMethod] = useState(METHODS[0]);
  const [attempt, setAttempt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const load = useCallback(async () => {
    setResource({ status: 'loading' });
    try { setResource({ status: 'success', data: (await getOrder(orderId)).order }); } catch (error) { setResource({ status: 'error', error }); }
  }, [orderId]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function createAttempt() {
    setBusy(true); setMessage(null);
    try {
      const result = await createPaymentAttempt(orderId, method);
      setAttempt(result.payment); setMessage('Đã tạo giao dịch. Chọn kết quả mô phỏng để Database xử lý.');
      await load();
    } catch (error) { setMessage(bookingErrorMessage(error) ?? lifecycleErrorMessage(error)); } finally { setBusy(false); }
  }
  async function finish(status) {
    if (!attempt) return;
    setBusy(true); setMessage(null);
    try {
      const result = await submitPaymentResult(orderId, attempt.id, status);
      setResource({ status: 'success', data: result.order }); setAttempt(null);
      setMessage(`Database đã ghi nhận giao dịch ${result.payment?.status ?? status}.`);
    } catch (error) { setMessage(bookingErrorMessage(error) ?? lifecycleErrorMessage(error)); } finally { setBusy(false); }
  }
  if (resource.status === 'loading') return <LoadingState>Đang tải thông tin thanh toán…</LoadingState>;
  if (resource.status === 'error') return <ErrorState error={resource.error} onRetry={load} />;
  const order = resource.data;
  const payable = order.status === 'Chờ thanh toán';
  return <section className="catalog-page"><p className="catalog-eyebrow">THANH TOÁN MÔ PHỎNG</p><h1>Đơn #{order.id}</h1>
    <p>{order.movieTitle} · {order.cinemaName}</p><p>Database chốt tổng thanh toán: <strong>{money(order.total)}</strong></p><p>Trạng thái đơn: {order.status}</p>
    <p className="catalog-muted">Số tiền không nhận từ trình duyệt. Database lấy tổng tiền của đơn khi tạo giao dịch.</p>
    {payable && !attempt && <><label>Phương thức <select value={method} onChange={(event) => setMethod(event.target.value)}>{METHODS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><button type="button" onClick={createAttempt} disabled={busy}>{busy ? 'Đang tạo giao dịch…' : 'Tạo giao dịch thanh toán'}</button></>}
    {attempt && <section className="booking-section"><h2>Giao dịch #{attempt.id}</h2><p>{attempt.method} · {money(attempt.amount)} · {attempt.status}</p><p>Mã giao dịch: {attempt.transactionCode}</p><button type="button" onClick={() => finish('Thành công')} disabled={busy}>Mô phỏng thành công</button><button type="button" onClick={() => finish('Thất bại')} disabled={busy}>Mô phỏng thất bại</button></section>}
    {message && <p role="status" className={message.includes('Đã') ? 'form-success' : 'form-error'}>{message}</p>}
    <h2>Lịch sử giao dịch</h2><ul>{order.payments.map((payment) => <li key={payment.id}>#{payment.id} · {payment.method} · {money(payment.amount)} · {payment.status}</li>)}</ul>
    <Link className="catalog-button catalog-button--secondary" to={`/orders/${order.id}`}>Xem chi tiết đơn</Link>
  </section>;
}
