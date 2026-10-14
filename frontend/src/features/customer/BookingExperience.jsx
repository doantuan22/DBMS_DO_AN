import { Link } from 'react-router-dom';
import { PageHeader, FormField, Input, Button, AsyncState, StatusBadge } from '../../components/ui';
import SeatMapPanel from '../public/SeatMapPanel';
import ProductPicker from '../../components/ProductPicker';
import HoldDeadline from '../../components/HoldDeadline';
import { formatDateTime, formatTime } from '../../utils/dateTime';
import { userCanAct } from '../../utils/authorization';
import './customer-journey.css';
import { customerMoney } from './customerFormatting';
import MediaFrame from './MediaFrame';

export default function BookingExperience({
  showtime,
  user,
  canBook,
  seats,
  seatsState,
  selectedSeatIds,
  selectedSeats,
  seatLimitNotice,
  toggleSeat,
  loadSeats,
  products,
  productsState,
  quantities,
  selectedProducts,
  changeQuantity,
  promotionCode,
  changePromotionCode,
  promotion,
  promotionBusy,
  applyPromotion,
  bookingState,
  submitBooking,
  pointsInput = '',
  changePointsInput = () => {},
  pointsInvalid = false,
  pricePreview = { status: 'idle' },
}) {
  const busy = bookingState.status === 'loading',
    success = bookingState.status === 'success',
    booking = bookingState.booking;
  const preview = pricePreview.status === 'success' ? pricePreview.data : null;
  const pointsError =
    pricePreview.status === 'error' &&
    /^POINTS|^INVALID_POINTS/.test(pricePreview.error?.code ?? '')
      ? pricePreview.error
      : null;
  const balance = preview?.pointsBalance ?? user?.loyaltyPoints ?? 0;
  return (
    <section className="catalog-page customer-journey booking-preparation">
      <PageHeader
        title={showtime.movieTitle}
        description={`${showtime.cinemaName} · ${showtime.roomName} · ${showtime.format}`}
        breadcrumbs={[
          { label: 'Phim', to: '/movies' },
          { label: 'Lịch chiếu', to: `/movies/${showtime.movieId}` },
          { label: 'Đặt vé' },
        ]}
      />
      <p className="customer-journey__context">
        {formatDateTime(showtime.startsAt)}
        {showtime.endsAt ? ` – ${formatTime(showtime.endsAt)}` : ''}
      </p>
      {success ? (
        <section className="customer-panel form-success" role="status">
          <h2>Đã tạo đơn, chờ thanh toán</h2>
          <p>
            Đơn #{booking.id} · <StatusBadge status={booking.status} />
          </p>
          {booking.pointsUsed > 0 && (
            <p>
              Đã dùng <strong>{booking.pointsUsed} điểm</strong> (giảm{' '}
              {customerMoney(booking.pointsDiscount)}).
            </p>
          )}
          <p>
            {booking.total > 0
              ? 'Số tiền còn phải thanh toán: '
              : 'Đơn đã được trả đủ bằng điểm, số tiền còn phải trả: '}
            <strong>{customerMoney(booking.total)}</strong>
          </p>
          <HoldDeadline deadline={booking.holdExpiresAt} />
          <p>Tiếp tục thanh toán trong thời gian giữ ghế để hoàn tất đơn.</p>
          <div className="catalog-actions">
            <Link className="catalog-button" to={`/orders/${booking.id}`}>
              Xem chi tiết đơn
            </Link>
            {userCanAct(user, 'KHACH_HANG', 'THANH_TOAN') && (
              <Link className="catalog-button" to={`/orders/${booking.id}/payment`}>
                Thanh toán đơn này
              </Link>
            )}
          </div>
        </section>
      ) : (
        <>
          <nav aria-label="Các bước đặt vé" className="customer-journey__steps">
            <a href="#seat-map-heading">1 · Chọn ghế</a>
            <a href="#products-heading">2 · Sản phẩm & ưu đãi</a>
            <a href="#booking-summary-heading">3 · Kiểm tra & đặt vé</a>
          </nav>
          <div className="customer-journey__layout">
            <div className="customer-journey__main">
              <p className="catalog-muted">
                Chọn vị trí xem phim. Ghế chỉ được giữ sau khi tạo đơn thành công.
              </p>
              <AsyncState
                status={
                  seatsState.status === 'success' && !seats.length ? 'empty' : seatsState.status
                }
                error={seatsState.error}
                loadingMessage="Đang tải sơ đồ ghế…"
                emptyMessage="Suất chiếu chưa có ghế để chọn."
                onRetry={() => loadSeats()}
              />
              {seatsState.status === 'success' && seats.length > 0 && (
                <SeatMapPanel
                  seats={seats}
                  selectedSeatIds={selectedSeatIds}
                  onToggle={toggleSeat}
                  limitNotice={seatLimitNotice}
                  disabled={busy}
                />
              )}
              <AsyncState
                status={productsState.status}
                error={productsState.error}
                loadingMessage="Đang tải sản phẩm…"
              />
              {productsState.status === 'success' && (
                <ProductPicker
                  products={products}
                  quantities={quantities}
                  onQuantityChange={changeQuantity}
                  disabled={busy}
                />
              )}
              <section className="customer-panel" aria-labelledby="promotion-heading">
                <h2 id="promotion-heading">Khuyến mãi</h2>
                <FormField
                  label="Mã khuyến mãi"
                  hint="Không bắt buộc. Mã sẽ được kiểm tra lại khi bạn tạo đơn."
                >
                  <Input
                    value={promotionCode}
                    maxLength={50}
                    disabled={busy}
                    onChange={(e) => changePromotionCode(e.target.value)}
                  />
                </FormField>
                <Button
                  variant="secondary"
                  onClick={applyPromotion}
                  loading={promotionBusy}
                  disabled={busy || !canBook}
                >
                  {promotionBusy ? 'Đang kiểm tra…' : 'Áp dụng'}
                </Button>
                {promotion && (
                  <p role="status" className={promotion.isValid ? 'form-success' : 'form-error'}>
                    {promotion.message}
                    {promotion.isValid
                      ? ` Giảm tạm tính: ${customerMoney(promotion.discountAmount)}.`
                      : ''}
                  </p>
                )}
              </section>
              {user && canBook && (
                <section className="customer-panel" aria-labelledby="points-heading">
                  <h2 id="points-heading">Dùng điểm</h2>
                  <p className="catalog-muted">
                    Số dư hiện có: <strong>{balance} điểm</strong>. 1 điểm = 1.000 ₫ và chỉ dùng để
                    giảm tiền vé. Điểm không đổi được thành tiền mặt.
                  </p>
                  <FormField
                    label="Số điểm muốn dùng"
                    hint="Hệ thống kiểm tra số dư và giá trị tiền vé khi tính tiền."
                  >
                    <Input
                      inputMode="numeric"
                      value={pointsInput}
                      disabled={busy}
                      onChange={(e) => changePointsInput(e.target.value)}
                    />
                  </FormField>
                  <Button
                    variant="secondary"
                    disabled={busy || !preview || preview.maxPoints <= 0}
                    onClick={() => changePointsInput(String(preview?.maxPoints ?? 0))}
                  >
                    Dùng tối đa
                  </Button>
                  {!selectedSeatIds.length && (
                    <p role="status">Chọn ghế để xem số điểm có thể dùng.</p>
                  )}
                  {pointsInvalid && (
                    <p className="form-error" role="alert">
                      Số điểm phải là số nguyên không âm.
                    </p>
                  )}
                  {pointsError && (
                    <p className="form-error" role="alert">
                      {pointsError.message}
                    </p>
                  )}
                  {preview && (
                    <p role="status" className="form-success">
                      Tối đa dùng được {preview.maxPoints} điểm cho đơn này. Dùng{' '}
                      {preview.pointsUsed} điểm: giảm {customerMoney(preview.pointsDiscount)}. Còn
                      phải thanh toán: <strong>{customerMoney(preview.total)}</strong>.
                    </p>
                  )}
                </section>
              )}
            </div>
            <aside
              className="customer-panel customer-journey__summary"
              aria-labelledby="booking-summary-heading"
            >
              <h2 id="booking-summary-heading">Kiểm tra & đặt vé</h2>
              <div className="cp-booking-film">
                {showtime.posterUrl && (
                  <MediaFrame
                    src={showtime.posterUrl}
                    title={showtime.movieTitle}
                    alt={`Poster ${showtime.movieTitle}`}
                  />
                )}
                <div>
                  <p>
                    <strong>{showtime.movieTitle}</strong>
                  </p>
                  <p>
                    {showtime.cinemaName} · {showtime.roomName}
                  </p>
                  <p>{formatDateTime(showtime.startsAt)}</p>
                </div>
              </div>
              <h3>Ghế đã chọn · {selectedSeats.length}</h3>
              {selectedSeats.length ? (
                <ul className="customer-lines">
                  {selectedSeats.map((s) => (
                    <li key={s.id}>
                      <span>
                        {s.label} · {s.type}
                      </span>
                      <strong>{customerMoney(s.price)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Chưa chọn ghế.</p>
              )}
              <h3>Sản phẩm</h3>
              {selectedProducts.length ? (
                <ul className="customer-lines">
                  {selectedProducts.map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    return (
                      <li key={item.productId}>
                        <span>
                          {item.quantity} × {product?.name ?? 'Sản phẩm đã chọn'}
                        </span>
                        <span>
                          {product ? `${customerMoney(product.price)} / sản phẩm` : 'Đang xác minh'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>Không có sản phẩm.</p>
              )}
              {Number.isFinite(promotion?.provisionalSubtotal) && (
                <p>
                  Tạm tính trước ưu đãi:{' '}
                  <strong>{customerMoney(promotion.provisionalSubtotal)}</strong>
                </p>
              )}
              {preview && (
                <>
                  {preview.discountTotal > 0 && (
                    <p>
                      Giảm khuyến mãi: <strong>{customerMoney(preview.discountTotal)}</strong>
                    </p>
                  )}
                  {preview.pointsUsed > 0 && (
                    <p>
                      Giảm bằng điểm ({preview.pointsUsed} điểm):{' '}
                      <strong>{customerMoney(preview.pointsDiscount)}</strong>
                    </p>
                  )}
                  <p>
                    Còn phải thanh toán: <strong>{customerMoney(preview.total)}</strong>
                  </p>
                </>
              )}
              <p className="catalog-muted">
                Giá ghế và sản phẩm hiển thị tại thời điểm tải. Hệ thống xác nhận tổng tiền, ưu đãi
                và thời gian giữ ghế khi tạo đơn.
              </p>
              {!user && (
                <Link
                  className="catalog-button"
                  to="/login"
                  state={{ from: `/booking/${showtime.id}` }}
                >
                  Đăng nhập để đặt vé
                </Link>
              )}
              {user && !canBook && (
                <p role="alert">Tài khoản hiện tại chưa được cấp quyền đặt vé khách hàng.</p>
              )}
              {['error', 'conflict'].includes(bookingState.status) && (
                <p className="form-error" role="alert">
                  {bookingState.message}
                  {bookingState.status === 'conflict'
                    ? ' Sơ đồ ghế đã được làm mới. Hãy chọn lại ghế trống.'
                    : ''}
                </p>
              )}
              <Button
                size="lg"
                loading={busy}
                disabled={
                  !canBook ||
                  !selectedSeatIds.length ||
                  seatsState.status !== 'success' ||
                  promotionBusy ||
                  pointsInvalid ||
                  Boolean(pointsError)
                }
                onClick={submitBooking}
              >
                {busy ? 'Đang tạo đơn…' : 'Đặt vé'}
              </Button>
              <p className="catalog-muted">
                Sau bước này, bạn sẽ nhận mã đơn để tiếp tục thanh toán.
              </p>
            </aside>
          </div>
          <div className="cp-booking-mobile-bar">
            <div>
              <strong>{selectedSeatIds.length} ghế đã chọn</strong>
              <small>
                {Number.isFinite(promotion?.provisionalSubtotal)
                  ? `Tạm tính trước ưu đãi: ${customerMoney(promotion.provisionalSubtotal)}`
                  : 'Tổng tiền xác nhận khi tạo đơn'}
              </small>
            </div>
            {!user ? (
              <Link
                className="catalog-button"
                to="/login"
                state={{ from: `/booking/${showtime.id}` }}
              >
                Đăng nhập
              </Link>
            ) : (
              <Button
                loading={busy}
                disabled={
                  !canBook ||
                  !selectedSeatIds.length ||
                  seatsState.status !== 'success' ||
                  promotionBusy ||
                  pointsInvalid ||
                  Boolean(pointsError)
                }
                onClick={submitBooking}
              >
                {busy ? 'Đang tạo đơn…' : 'Đặt vé'}
              </Button>
            )}
          </div>
        </>
      )}
      <Link className="catalog-back" to={`/movies/${showtime.movieId}`}>
        ← Quay lại lịch chiếu
      </Link>
    </section>
  );
}
