import { useAuth } from '../context/AuthContext';
import { userCanAct } from '../utils/authorization';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createComplaint, getComplaints } from '../api/feedbackApi';
import { getOrders } from '../api/ordersApi';
import { PageHeader, FormField, Input, Select, Button, AsyncState } from '../components/ui';
import AccountNavigation from '../features/customer/AccountNavigation';
import useBookingDraftGuard from '../features/staff-bookings/useBookingDraftGuard';
import { formatDateTime } from '../utils/dateTime';
import '../features/customer/customer-account.css';
import StatusBadge from '../components/primitives/StatusBadge';

const initialForm = { type: '', title: '', content: '', orderId: '' };

export default function Complaints() {
  const { user } = useAuth();
  return (
    <OwnComplaints
      key={`${user?.userId}:${user?.permissions
        ?.map((p) => p.code)
        .sort()
        .join(',')}`}
    />
  );
}
function OwnComplaints() {
  const { user } = useAuth();
  // /orders/:id links here with ?orderId= so the complaint form opens already linked to that order.
  const [searchParams] = useSearchParams();
  const queryOrderId = searchParams.get('orderId') ?? '';
  const canCreate = userCanAct(user, 'KHACH_HANG', 'GUI_KHIEU_NAI');
  const [resource, setResource] = useState({ status: 'loading' });
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(() => ({ ...initialForm, orderId: queryOrderId }));
  const [submit, setSubmit] = useState({ status: 'idle' });
  const [orderLookup, setOrderLookup] = useState({ status: 'loading' });
  const orderRequest = useRef(0);
  const pending = useRef(false);
  const mounted = useRef(true),
    listRequest = useRef(0);
  const readGuard = useCallback(
    () => ({ dirty: Boolean(form.type || form.title || form.content), pending: pending.current }),
    [form],
  );
  useBookingDraftGuard(false, submit.status === 'loading', {
    readState: readGuard,
    message: 'Khiếu nại chưa được gửi. Rời màn hình và bỏ nội dung?',
  });
  const load = useCallback(async () => {
    const generation = ++listRequest.current;
    setResource({ status: 'loading' });
    try {
      const data = (await getComplaints()).complaints;
      if (mounted.current && generation === listRequest.current)
        setResource({ status: 'success', data });
    } catch (error) {
      if (mounted.current && generation === listRequest.current)
        setResource({ status: 'error', error });
    }
  }, []);
  // Drop a prefilled order id that is not one of this customer's orders.
  const applyOrders = useCallback((list) => {
    setOrders(list);
    setForm((current) =>
      list.some((order) => String(order.id) === current.orderId)
        ? current
        : { ...current, orderId: '' },
    );
  }, []);
  const loadOrders = useCallback(async () => {
    const request = ++orderRequest.current;
    setOrderLookup({ status: 'loading' });
    try {
      const result = await getOrders();
      if (!mounted.current || request !== orderRequest.current) return;
      applyOrders(result.orders);
      setOrderLookup({ status: 'success' });
    } catch (error) {
      if (mounted.current && request === orderRequest.current)
        setOrderLookup({ status: 'error', error });
    }
  }, [applyOrders]);
  useEffect(() => {
    mounted.current = true;
    const request = orderRequest,
      lists = listRequest;
    void Promise.resolve().then(load);
    void Promise.resolve().then(loadOrders);
    return () => {
      mounted.current = false;
      request.current++;
      lists.current++;
    };
  }, [load, loadOrders]);
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  async function onSubmit(event) {
    event.preventDefault();
    if (!canCreate || pending.current || (form.orderId && orderLookup.status !== 'success')) return;
    if (![form.type, form.title, form.content].every((value) => value.trim())) {
      setSubmit({ status: 'error', message: 'Hãy nhập loại, tiêu đề và nội dung khiếu nại.' });
      return;
    }
    if (form.orderId && !orders.some((o) => String(o.id) === form.orderId)) {
      setSubmit({ status: 'error', message: 'Hãy chọn một đơn trong lịch sử của bạn.' });
      return;
    }
    pending.current = true;
    setSubmit({ status: 'loading' });
    try {
      const { complaint } = await createComplaint({ ...form, orderId: form.orderId || null });
      if (!mounted.current) return;
      listRequest.current++;
      setForm(initialForm);
      setSubmit({ status: 'success', message: 'Đã gửi khiếu nại.', id: complaint.id });
      setResource((current) =>
        current.status === 'success'
          ? { status: 'success', data: [complaint, ...current.data] }
          : current,
      );
    } catch (error) {
      if (mounted.current) setSubmit({ status: 'error', message: error.message });
    } finally {
      pending.current = false;
    }
  }
  return (
    <section className="catalog-page customer-journey">
      <AccountNavigation />
      <PageHeader
        title="Khiếu nại của tôi"
        description="Gửi phản hồi và theo dõi tiến trình xử lý từ bộ phận chăm sóc khách hàng."
        breadcrumbs={[{ label: 'Trang chủ', to: '/' }, { label: 'Khiếu nại' }]}
      />
      <div className="customer-journey__layout">
        <section className="customer-journey__main" aria-labelledby="complaint-history-heading">
          <h2 id="complaint-history-heading">Lịch sử khiếu nại</h2>
          <AsyncState
            status={
              resource.status === 'success' && !resource.data.length ? 'empty' : resource.status
            }
            error={resource.error}
            onRetry={load}
            loadingMessage="Đang tải khiếu nại…"
            emptyMessage="Chưa có khiếu nại. Bạn có thể gửi phản hồi bằng biểu mẫu bên cạnh."
          />
          {resource.status === 'success' &&
            resource.data.map((complaint) => (
              <article className="customer-panel" key={complaint.id}>
                <div className="customer-timeline__heading">
                  <h3>{complaint.title}</h3>
                  <StatusBadge status={complaint.status} />
                </div>
                <p>
                  {complaint.type} · Gửi lúc {formatDateTime(complaint.createdAt)}
                </p>
                <p>
                  {complaint.orderId ? (
                    <Link to={`/orders/${complaint.orderId}`}>Đơn #{complaint.orderId}</Link>
                  ) : (
                    'Không liên kết đơn'
                  )}
                </p>
                <Link
                  className="catalog-button catalog-button--secondary"
                  to={`/complaints/${complaint.id}`}
                >
                  Xem chi tiết
                </Link>
              </article>
            ))}
        </section>
        {canCreate && (
          <form className="customer-panel customer-complaints-form" onSubmit={onSubmit}>
            <h2>Gửi khiếu nại</h2>
            <FormField label="Loại khiếu nại" required hint="Ví dụ: vé, thanh toán hoặc dịch vụ.">
              <Input
                value={form.type}
                maxLength={100}
                onChange={update('type')}
                disabled={submit.status === 'loading'}
              />
            </FormField>
            <FormField label="Tiêu đề" required>
              <Input
                value={form.title}
                maxLength={200}
                onChange={update('title')}
                disabled={submit.status === 'loading'}
              />
            </FormField>
            <FormField label="Nội dung" required hint="Mô tả vấn đề và thông tin cần hỗ trợ.">
              <textarea
                value={form.content}
                onChange={update('content')}
                disabled={submit.status === 'loading'}
              />
            </FormField>
            <FormField label="Đơn liên quan (không bắt buộc)">
              <Select
                value={form.orderId}
                onChange={update('orderId')}
                disabled={submit.status === 'loading' || orderLookup.status !== 'success'}
              >
                <option value="">Không liên kết đơn</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Đơn #{order.id} · {order.movieTitle} · {formatDateTime(order.startsAt)}
                  </option>
                ))}
              </Select>
            </FormField>
            <AsyncState
              status={orderLookup.status}
              error={orderLookup.error}
              loadingMessage="Đang tải đơn của bạn…"
              onRetry={loadOrders}
            />
            {orderLookup.status === 'success' && !orders.length && (
              <p>Chưa có đơn để liên kết. Bạn vẫn có thể gửi khiếu nại về dịch vụ.</p>
            )}
            {submit.status === 'error' && (
              <p className="form-error" role="alert">
                {submit.message}
              </p>
            )}
            {submit.status === 'success' && (
              <p className="form-success" role="status">
                {submit.message}{' '}
                <Link to={`/complaints/${submit.id}`}>Theo dõi khiếu nại vừa gửi</Link>
              </p>
            )}
            <Button type="submit" loading={submit.status === 'loading'}>
              {submit.status === 'loading' ? 'Đang gửi…' : 'Gửi khiếu nại'}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
