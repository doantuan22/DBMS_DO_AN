import { formatDateTime } from '../../utils/dateTime';
import { money } from '../operations/operationsModel';
import { bookingCanEdit } from './bookingModel';
import HoldDeadline from '../../components/HoldDeadline';
import { Button, ResourceTable, StatusBadge } from '../../components/ui';

export default function BookingDetail({
  order,
  busy,
  editing,
  onEdit,
  onCancel,
  onRefresh,
  onHoldElapsed,
}) {
  return (
    <section className="staff-bookings__detail" aria-label={`Chi tiết đơn ${order.id}`}>
      <p>
        <strong>Đơn #{order.id}</strong> · <StatusBadge status={order.status} />
      </p>
      <p>
        <strong>{order.user.name}</strong> · {order.user.email} ·{' '}
        {order.user.phone || 'Chưa có SĐT'}
      </p>
      <p>
        {order.movieTitle} · {formatDateTime(order.startsAt)} · {order.cinemaName} ·{' '}
        {order.roomName} · {order.format}
      </p>
      <p>Ngày đặt: {formatDateTime(order.bookedAt)}</p>
      <dl className="staff-bookings__totals">
        <div>
          <dt>Tiền vé</dt>
          <dd>{money(order.ticketTotal)}</dd>
        </div>
        <div>
          <dt>Sản phẩm</dt>
          <dd>{money(order.productTotal)}</dd>
        </div>
        <div>
          <dt>Giảm giá</dt>
          <dd>{money(order.discountTotal)}</dd>
        </div>
        <div>
          <dt>Tổng snapshot</dt>
          <dd>
            <strong>{money(order.total)}</strong>
          </dd>
        </div>
      </dl>
      {order.holdExpiresAt &&
        (order.status === 'Chờ thanh toán' ? (
          <HoldDeadline
            key={`${order.id}:${order.holdExpiresAt}`}
            deadline={order.holdExpiresAt}
            onElapsed={onHoldElapsed}
          />
        ) : (
          <p>Hạn giữ chỗ: {formatDateTime(order.holdExpiresAt)}</p>
        ))}
      <ResourceTable
        caption="Vé và giá snapshot"
        rows={order.tickets}
        rowKey="id"
        columns={[
          { key: 'code', label: 'Mã vé' },
          { key: 'label', label: 'Ghế' },
          { key: 'type', label: 'Loại ghế' },
          { key: 'price', label: 'Giá snapshot', render: (row) => money(row.price) },
          {
            key: 'status',
            label: 'Trạng thái',
            render: (row) => <StatusBadge status={row.status} />,
          },
        ]}
      />
      <ResourceTable
        caption="Lịch sử thanh toán"
        rows={order.payments}
        rowKey="id"
        emptyMessage="Chưa có lần thử thanh toán."
        columns={[
          { key: 'transactionCode', label: 'Mã giao dịch' },
          { key: 'method', label: 'Phương thức' },
          { key: 'amount', label: 'Số tiền', render: (row) => money(row.amount) },
          {
            key: 'createdAt',
            label: 'Ngày tạo',
            className: 'staff-bookings__secondary-column',
            render: (row) => formatDateTime(row.createdAt),
          },
          {
            key: 'status',
            label: 'Trạng thái',
            render: (row) => <StatusBadge status={row.status} />,
          },
        ]}
      />
      {order.products.length > 0 && (
        <ResourceTable
          caption="Sản phẩm trong đơn"
          rows={order.products}
          rowKey="id"
          columns={[
            { key: 'name', label: 'Sản phẩm' },
            { key: 'quantity', label: 'Số lượng' },
            { key: 'unitPrice', label: 'Đơn giá snapshot', render: (row) => money(row.unitPrice) },
          ]}
        />
      )}
      {order.promotionCode && (
        <p>
          Khuyến mãi: {order.promotionCode} · {order.promotionDescription}
        </p>
      )}
      {order.cancellationReason && <p>Lý do hủy: {order.cancellationReason}</p>}
      {order.cancellationNotice && <p>{order.cancellationNotice}</p>}
      {order.compensation && (
        <p>
          Bồi thường hủy suất: {order.compensation.points} điểm ·{' '}
          {formatDateTime(order.compensation.creditedAt)}
        </p>
      )}
      <div className="staff-bookings__actions">
        {order.canEdit && (
          <Button
            variant="secondary"
            disabled={busy || editing || !bookingCanEdit(order)}
            onClick={onEdit}
          >
            Sửa ghế
          </Button>
        )}
        {order.canCancel && (
          <Button variant="danger" disabled={busy || editing} onClick={onCancel}>
            Hủy đơn
          </Button>
        )}
        <Button variant="secondary" disabled={busy} onClick={onRefresh}>
          Tải lại chi tiết
        </Button>
      </div>
      {!order.canEdit && !order.canCancel && (
        <p role="status">Đơn chỉ đọc theo trạng thái và lịch sử hiện tại.</p>
      )}
      <p className="staff-bookings__help">
        Chỉ sửa ghế của đơn chưa thanh toán, còn hạn giữ, chưa thử thanh toán và không kèm sản
        phẩm/khuyến mãi. Hủy giữ lịch sử; chưa hỗ trợ hoàn tiền tự nguyện.
      </p>
    </section>
  );
}
