import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getOrders } from '../api/ordersApi';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader,
  FilterBar,
  FormField,
  Input,
  Select,
  Button,
  AsyncState,
  StatusBadge,
} from '../components/ui';
import { formatDateTime } from '../utils/dateTime';
import AccountNavigation from '../features/customer/AccountNavigation';
import useCustomerResource from '../features/customer/useCustomerResource';
import { customerMoney as money } from '../features/customer/customerFormatting';
import { textMatch } from '../features/customer/discoveryModel';
import MediaFrame from '../features/customer/MediaFrame';
import '../features/customer/customer-account.css';
const loadOrders = async () => (await getOrders()).orders;
export default function Orders() {
  const { user } = useAuth();
  return (
    <OwnOrders
      key={`${user?.userId}:${user?.permissions
        ?.map((p) => p.code)
        .sort()
        .join(',')}`}
    />
  );
}
function OwnOrders() {
  const { resource, load } = useCustomerResource(loadOrders);
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(''),
    [draftStatus, setDraftStatus] = useState(params.get('status') ?? ''),
    [appliedSearch, setAppliedSearch] = useState('');
  const status = params.get('status') ?? '',
    all = resource.status === 'success' ? resource.data : [];
  const statuses = [...new Set(all.map((o) => o.status))];
  const rows = all.filter(
    (o) =>
      (!status || o.status === status) &&
      (!appliedSearch || textMatch([String(o.id), o.movieTitle, o.cinemaName], appliedSearch)),
  );
  return (
    <section className="catalog-page customer-journey">
      <AccountNavigation />
      <PageHeader
        title="Đơn đặt vé của tôi"
        description="Theo dõi vé, thời gian giữ ghế và lịch sử thanh toán của bạn."
        breadcrumbs={[{ label: 'Trang chủ', to: '/' }, { label: 'Đơn của tôi' }]}
        primaryAction={
          <div className="catalog-actions">
            <Button variant="secondary" disabled={resource.status === 'loading'} onClick={load}>
              Làm mới
            </Button>
            <Link className="catalog-button" to="/movies">
              Khám phá phim
            </Link>
          </div>
        }
      />
      <FilterBar
        schema={[
          { key: 'search', label: 'Tìm kiếm' },
          { key: 'status', label: 'Trạng thái' },
        ]}
        draft={{ search, status: draftStatus }}
        applied={{ search: appliedSearch, status }}
        onApply={() => {
          setAppliedSearch(search);
          setParams(draftStatus ? { status: draftStatus } : {});
        }}
        onReset={() => {
          setSearch('');
          setAppliedSearch('');
          setDraftStatus('');
          setParams({});
        }}
      >
        <FormField label="Mã đơn, phim hoặc rạp">
          <Input
            type="search"
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </FormField>
        <FormField label="Lọc trạng thái đơn">
          <Select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </FormField>
      </FilterBar>
      <AsyncState
        status={resource.status === 'success' && !rows.length ? 'empty' : resource.status}
        error={resource.error}
        onRetry={load}
        loadingMessage="Đang tải lịch sử đơn…"
        emptyMessage={
          all.length
            ? 'Không tìm thấy đơn phù hợp với bộ lọc.'
            : 'Chưa có đơn đặt vé. Chọn phim để bắt đầu.'
        }
      />
      {resource.status === 'success' && rows.length > 0 && (
        <>
          <p role="status">{rows.length} đơn theo bộ lọc · toàn bộ lịch sử của bạn</p>
          <div className="catalog-list">
            {rows.map((order) => (
              <article className="customer-panel customer-order-card" key={order.id}>
                <div className="customer-order-card__film">
                  {order.posterUrl && (
                    <MediaFrame
                      src={order.posterUrl}
                      title={order.movieTitle}
                      alt={`Poster ${order.movieTitle}`}
                    />
                  )}
                  <div>
                    <p className="catalog-eyebrow">Đơn #{order.id}</p>
                    <h2>{order.movieTitle}</h2>
                    <p>
                      {order.cinemaName} · {order.roomName}
                    </p>
                    <p>
                      {formatDateTime(order.startsAt)} · {order.format}
                    </p>
                    <StatusBadge status={order.status} />
                    <p className="catalog-muted">Đặt lúc: {formatDateTime(order.bookedAt)}</p>
                  </div>
                </div>
                <div className="customer-order-card__amount">
                  <p>
                    <strong>{money(order.total)}</strong>
                  </p>
                  <p>Thanh toán gần nhất: {order.latestPaymentStatus ?? 'Chưa tạo'}</p>
                  <Link className="catalog-button" to={`/orders/${order.id}`}>
                    Xem chi tiết
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
