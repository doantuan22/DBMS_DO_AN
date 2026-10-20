import { formatDateTime } from '../../utils/dateTime';
import { StatusBadge } from '../../components/ui';
import { customerMoney as money } from './customerFormatting';
export function OrderAmounts({ order }) {
  const isCancelled = order.status === 'Đã hủy';
  const hasSuccessfulPayment = order.payments?.some((p) => p.status === 'Thành công');
  return (
    <section className="customer-panel" aria-label="Giá trị đơn đã xác nhận">
      <h2>Giá trị đơn</h2>
      <dl className="customer-facts">
        <div>
          <dt>Tiền vé</dt>
          <dd>{money(order.ticketTotal)}</dd>
        </div>
        <div>
          <dt>Đồ ăn & thức uống</dt>
          <dd>{money(order.productTotal)}</dd>
        </div>
        <div>
          <dt>Tổng giảm giá</dt>
          <dd>{money(order.discountTotal)}</dd>
        </div>
        {order.pointsUsed > 0 && (
          <div>
            <dt>Trong đó bằng điểm ({order.pointsUsed} điểm)</dt>
            <dd>{money(order.pointsDiscount)}</dd>
          </div>
        )}
        {order.promotionCode && (
          <div>
            <dt>Mã ưu đãi</dt>
            <dd>{order.promotionCode}</dd>
          </div>
        )}
        <div className="customer-facts__total">
          <dt>{isCancelled ? 'Số tiền cần thanh toán' : 'Tiền phải trả / đã trả (không gồm điểm)'}</dt>
          <dd>{isCancelled ? money(0) : money(order.total)}</dd>
        </div>
      </dl>
      {isCancelled ? (
        <p className="catalog-muted" style={{ color: 'var(--color-danger-text, #ef4444)' }}>
          Đơn hàng đã hủy. Không phát sinh thanh toán cho đơn này.
        </p>
      ) : hasSuccessfulPayment ? (
        <p className="catalog-muted">Khoản tiền đã được xác nhận cho đơn này.</p>
      ) : (
        <p className="catalog-muted">Số tiền cần thanh toán theo đơn đã đặt.</p>
      )}
    </section>
  );
}
export function OrderItems({ order }) {
  const cancelledTickets = order.tickets?.filter((ticket) => ticket.status === 'Đã hủy') ?? [];
  return (
    <>
      <section className="customer-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h2>Vé & ghế</h2>
          {cancelledTickets.length > 0 && (
            <span style={{ fontSize: '0.875rem', color: 'var(--color-danger-text, #ef4444)' }}>
              ({cancelledTickets.length} vé đã hủy · không tính vào tổng tiền)
            </span>
          )}
        </div>
        {order.tickets?.length ? (
          <ul className="customer-lines">
            {order.tickets.map((ticket) => {
              const isCancelled = ticket.status === 'Đã hủy';
              return (
                <li key={ticket.id} style={isCancelled ? { opacity: 0.75 } : undefined}>
                  <div>
                    <strong style={isCancelled ? { textDecoration: 'line-through' } : undefined}>
                      {ticket.label}
                    </strong> · {ticket.type}
                    <p>
                      {ticket.code && <>Mã vé: {ticket.code} · </>}
                      <StatusBadge status={ticket.status} />
                    </p>
                  </div>
                  <div>
                    {isCancelled ? (
                      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <del style={{ opacity: 0.6 }}>{money(ticket.price)}</del>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-danger-text, #ef4444)' }}>(Vé đã hủy)</span>
                      </span>
                    ) : (
                      <strong>{money(ticket.price)}</strong>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>Đơn này chưa có vé.</p>
        )}
      </section>
      <section className="customer-panel">
        <h2>Đồ ăn & thức uống</h2>
        {order.products.length ? (
          <ul className="customer-lines">
            {order.products.map((p) => (
              <li key={p.id}>
                <span>
                  {p.quantity} × {p.name}
                </span>
                <strong>{money(p.total)}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p>Không có đồ ăn.</p>
        )}
      </section>
    </>
  );
}
export function PaymentHistory({ payments, title = 'Lịch sử thanh toán' }) {
  return (
    <section className="customer-panel">
      <h2>{title}</h2>
      {payments.length ? (
        <ol className="customer-timeline">
          {payments.map((p, index) => (
            <li key={p.id}>
              <div className="customer-timeline__heading">
                <strong>
                  Lần {index + 1} · {p.method}
                </strong>
                <StatusBadge status={p.status} />
              </div>
              <p>
                {money(p.amount)} · {formatDateTime(p.createdAt)}
              </p>
              {p.transactionCode && <p>Mã giao dịch: {p.transactionCode}</p>}
              {p.paidAt && <p>Thanh toán lúc: {formatDateTime(p.paidAt)}</p>}
              {p.note && <p>{p.note}</p>}
            </li>
          ))}
        </ol>
      ) : (
        <p>Chưa có giao dịch thanh toán.</p>
      )}
    </section>
  );
}
