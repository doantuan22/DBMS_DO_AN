import { useAuth } from '../context/AuthContext';
import { userCanAct } from '../utils/authorization';
import HoldDeadline from '../components/HoldDeadline';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createPaymentAttempt, getOrder, submitPaymentResult } from '../api/ordersApi';
import { LoadingState } from '../components/CatalogStates';
import StatusBadge from '../components/primitives/StatusBadge';
import { bookingErrorMessage } from '../utils/bookingLimits';
import { getSeats } from '../api/catalogApi';
import { PageHeader, FormField, Select, Button, ConfirmDialog, AsyncState } from '../components/ui';
import AccountNavigation from '../features/customer/AccountNavigation';
import { OrderAmounts, OrderItems, PaymentHistory } from '../features/customer/OrderReceipt';
import '../features/customer/customer-account.css';
import useBookingDraftGuard from '../features/staff-bookings/useBookingDraftGuard';

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
  const [confirmation, setConfirmation] = useState(false);
  const readGuard = useCallback(() => ({ dirty: false, pending: pending.current }), []);
  useBookingDraftGuard(false, busy, { readState: readGuard });
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

  // Orders already covered by points have nothing left to pay in cash: the only valid method is DIEM.
  const pointsOnly = resource.status === 'success' && Number(resource.data.total) === 0;
  const chosenMethod = pointsOnly ? 'DIEM' : method;
  async function confirmPayment() {
    if (pending.current || !canConfirm) return;
    pending.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const { payment } = await createPaymentAttempt(orderId, chosenMethod);
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
      if (mounted.current) {
        setBusy(false);
        setConfirmation(false);
      }
    }
  }
  if (resource.status === 'loading')
    return <LoadingState>Đang tải thông tin thanh toán…</LoadingState>;
  if (resource.status === 'error')
    return (
      <section className="catalog-page">
        <PageHeader title="Thanh toán" breadcrumbs={[{ label: 'Đơn của tôi', to: '/orders' }]} />
        <AsyncState status="error" error={resource.error} onRetry={load} />
      </section>
    );
  const order = resource.data;
  const payable = order.status === 'Chờ thanh toán';
  const canConfirm =
    canPay &&
    payable &&
    Boolean(order.holdExpiresAt) &&
    elapsedDeadline !== order.holdExpiresAt &&
    Date.parse(order.holdExpiresAt) > now;
  return (
    <section className="catalog-page customer-journey">
      <AccountNavigation />
      <PageHeader
        title={`Thanh toán đơn #${order.id}`}
        description={order.movieTitle}
        breadcrumbs={[
          { label: 'Đơn của tôi', to: '/orders' },
          { label: `Đơn #${order.id}`, to: `/orders/${order.id}` },
          { label: 'Thanh toán' },
        ]}
      />
      <section className="customer-panel customer-status-panel">
        <h2>
          Trạng thái đơn · <StatusBadge status={order.status} />
        </h2>
        <p>
          {order.cinemaName} · {order.roomName}
        </p>
        {payable && <HoldDeadline deadline={order.holdExpiresAt} onElapsed={onElapsed} />}
        {order.status === 'Đã thanh toán' && (
          <p role="status">
            Đơn đã thanh toán thành công. Bạn có thể xem thông tin vé trong chi tiết đơn.
          </p>
        )}
        {order.status === 'Hết hạn' && (
          <p role="alert">
            Đơn đã hết thời gian giữ ghế. Ghế đã được giải phóng; vui lòng đặt vé lại.
          </p>
        )}
        {order.cancellationNotice && <p role="status">{order.cancellationNotice}</p>}
        {order.compensation && <p>Điểm bồi thường đã cộng: {order.compensation.points}.</p>}
      </section>
      <div className="customer-journey__layout">
        <div className="customer-journey__main">
          <section className="customer-panel">
            {order.status === 'Đã hủy' ? (
              <>
                <h2>Đơn hàng đã hủy</h2>
                <p className="form-error" role="status">
                  Đơn hàng này đã bị hủy. Không phát sinh thanh toán cho đơn này.
                </p>
                <p>
                  Giá trị đơn ban đầu: {money(order.total)}
                </p>
                <div className="payment-actions">
                  <Link className="catalog-button" to={`/movies/${order.movieId}`}>
                    Chọn lịch chiếu để đặt lại
                  </Link>
                  <Link className="catalog-button catalog-button--secondary" to={`/orders/${order.id}`}>
                    Xem chi tiết đơn
                  </Link>
                </div>
              </>
            ) : order.status === 'Hết hạn' ? (
              <>
                <h2>Đơn hàng đã hết hạn</h2>
                <p className="form-error" role="status">
                  Đã hết thời gian giữ ghế. Ghế đã được giải phóng; vui lòng đặt vé lại.
                </p>
                <p>
                  Giá trị đơn ban đầu: {money(order.total)}
                </p>
                <div className="payment-actions">
                  <Link className="catalog-button" to={`/movies/${order.movieId}`}>
                    Chọn lịch chiếu để đặt lại
                  </Link>
                  <Link className="catalog-button catalog-button--secondary" to={`/orders/${order.id}`}>
                    Xem chi tiết đơn
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2>Thanh toán mô phỏng</h2>
                <p className="catalog-muted">
                  Đây là luồng thanh toán mô phỏng hiện có. Xác nhận sẽ ghi nhận kết quả thành công cho
                  phương thức đã chọn.
                </p>
                {order.pointsUsed > 0 && (
                  <p>
                    Đã dùng {order.pointsUsed} điểm, giảm {money(order.pointsDiscount)}.
                  </p>
                )}
                <p>
                  Số tiền cần thanh toán: <strong>{money(order.total)}</strong>
                </p>
                {payable && pointsOnly && (
                  <p role="status">Đơn đã được trả đủ bằng điểm. Hãy xác nhận để hoàn tất đơn.</p>
                )}
                {payable && !canPay && <p role="status">Bạn chưa được cấp quyền thanh toán.</p>}
                {payable && (
                  <div className="payment-actions">
                    {!pointsOnly && (
                      <FormField label="Phương thức">
                        <Select
                          value={method}
                          disabled={busy || confirmation || !canConfirm}
                          onChange={(e) => setMethod(e.target.value)}
                        >
                          {METHODS.map((item) => (
                            <option key={item} value={item}>
                              {{
                                THE_NOI_DIA: 'Thẻ nội địa',
                                THE_QUOC_TE: 'Thẻ quốc tế',
                                TIEN_MAT: 'Tiền mặt',
                              }[item] ?? item}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    )}
                    <Button onClick={() => setConfirmation(true)} loading={busy} disabled={!canConfirm}>
                      {busy
                        ? 'Đang xác nhận…'
                        : pointsOnly
                          ? 'Xác nhận thanh toán bằng điểm'
                          : 'Xác nhận thanh toán'}
                    </Button>
                  </div>
                )}
                {payable && canPay && !canConfirm && (
                  <p role="status">Đang xác minh thời gian giữ ghế…</p>
                )}
                {message && (
                  <p role="status" className={message.includes('Đã') ? 'form-success' : 'form-error'}>
                    {message}
                  </p>
                )}
              </>
            )}
          </section>
          <PaymentHistory payments={order.payments} title="Lịch sử giao dịch" />
          <OrderItems order={order} />
        </div>
        <section className="customer-journey__summary" aria-label="Giá trị thanh toán">
          <OrderAmounts order={order} />
          <p>
            <Link className="catalog-button catalog-button--secondary" to={`/orders/${order.id}`}>
              Xem chi tiết đơn
            </Link>
          </p>
        </section>
      </div>
      <ConfirmDialog
        open={confirmation}
        onOpenChange={setConfirmation}
        title="Xác nhận thanh toán mô phỏng"
        description={`Đơn #${order.id} · ${order.movieTitle}. ${pointsOnly ? 'Thanh toán bằng điểm' : `Phương thức ${method}`}. Số tiền ${money(order.total)}. Kết quả cuối cùng sẽ được hệ thống xác nhận.`}
        busy={busy}
        variant="primary"
        onConfirm={async () => {
          if (!canConfirm) {
            setConfirmation(false);
            return;
          }
          await confirmPayment();
        }}
      />
    </section>
  );
}
