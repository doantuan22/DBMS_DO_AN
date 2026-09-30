import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createBooking, getProducts, getSeats, getShowtimeDetail, validatePromotion } from '../api/catalogApi';
import { ErrorState, LoadingState } from '../components/CatalogStates';
import ProductPicker from '../components/ProductPicker';
import SeatMap from '../components/SeatMap';
import { useAuth } from '../context/AuthContext';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);

function toProducts(quantities) {
  return Object.entries(quantities)
    .map(([productId, quantity]) => ({ productId: Number(productId), quantity: Number(quantity) }))
    .filter((item) => Number.isSafeInteger(item.productId) && Number.isSafeInteger(item.quantity) && item.quantity > 0);
}

export default function BookingPreparation() {
  const { showtimeId } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'loading' });
  const [seats, setSeats] = useState([]);
  const [seatsState, setSeatsState] = useState({ status: 'loading' });
  const [products, setProducts] = useState([]);
  const [productsState, setProductsState] = useState({ status: 'loading' });
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [promotionCode, setPromotionCode] = useState('');
  const [promotion, setPromotion] = useState(null);
  const [promotionBusy, setPromotionBusy] = useState(false);
  const [bookingState, setBookingState] = useState({ status: 'idle' });

  const loadSeats = useCallback(async (signal) => {
    try {
      const rows = await getSeats(showtimeId, { signal });
      setSeats(rows);
      setSelectedSeatIds((previous) => previous.filter((id) => rows.some((seat) => seat.id === id && seat.status === 'Trống')));
      setSeatsState({ status: 'success' });
    } catch (error) {
      if (error.name !== 'AbortError') setSeatsState({ status: 'error', error });
    }
  }, [showtimeId]);

  useEffect(() => {
    const controller = new AbortController();
    getShowtimeDetail(showtimeId, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setState({ status: 'success', data: result }); })
      .catch((error) => { if (!controller.signal.aborted) setState({ status: 'error', error }); });
    return () => controller.abort();
  }, [showtimeId]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadSeats(controller.signal));
    getProducts({ signal: controller.signal })
      .then((rows) => { if (!controller.signal.aborted) { setProducts(rows); setProductsState({ status: 'success' }); } })
      .catch((error) => { if (!controller.signal.aborted) setProductsState({ status: 'error', error }); });
    return () => controller.abort();
  }, [loadSeats]);

  const selectedSeats = useMemo(() => seats.filter((seat) => selectedSeatIds.includes(seat.id)), [seats, selectedSeatIds]);
  const selectedProducts = useMemo(() => toProducts(quantities), [quantities]);

  function toggleSeat(id) {
    setPromotion(null);
    setSelectedSeatIds((previous) => previous.includes(id) ? previous.filter((seatId) => seatId !== id) : [...previous, id]);
  }

  function changeQuantity(productId, value) {
    const quantity = Math.max(0, Number.parseInt(value, 10) || 0);
    setPromotion(null);
    setQuantities((previous) => ({ ...previous, [productId]: quantity }));
  }

  async function applyPromotion() {
    if (selectedSeatIds.length === 0) {
      setPromotion({ isValid: false, message: 'Hãy chọn ít nhất một ghế trước khi áp dụng khuyến mãi.' });
      return;
    }
    setPromotionBusy(true);
    try {
      const result = await validatePromotion({ showtimeId: Number(showtimeId), seatIds: selectedSeatIds, products: selectedProducts, promotionCode });
      setPromotion(result.promotion);
    } catch (error) {
      setPromotion({ isValid: false, message: error.message });
    } finally { setPromotionBusy(false); }
  }

  async function submitBooking() {
    if (selectedSeatIds.length === 0) {
      setBookingState({ status: 'error', message: 'Hãy chọn ít nhất một ghế.' });
      return;
    }
    setBookingState({ status: 'loading' });
    try {
      const result = await createBooking({ showtimeId: Number(showtimeId), seatIds: selectedSeatIds, products: selectedProducts, promotionCode: promotionCode.trim() || undefined });
      setBookingState({ status: 'success', booking: result.booking });
      setSelectedSeatIds([]);
      await loadSeats();
    } catch (error) {
      if (error.status === 409) {
        setSelectedSeatIds([]);
        setBookingState({ status: 'conflict', message: error.message });
        await loadSeats();
      } else setBookingState({ status: 'error', message: error.message });
    }
  }

  if (state.status === 'loading') return <LoadingState>Đang xác nhận suất chiếu…</LoadingState>;
  if (state.status === 'error') return <ErrorState error={state.error} />;
  const showtime = state.data;
  return (
    <section className="catalog-page booking-preparation">
      <p className="catalog-eyebrow">SUẤT CHIẾU ĐÃ CHỌN</p>
      <h1>{showtime.movieTitle}</h1>
      <p>{showtime.cinemaName} · {showtime.roomName} · {showtime.format}</p>
      <p>{showtime.date} · {showtime.startTime}{showtime.endTime ? ` – ${showtime.endTime}` : ''}</p>
      <p className="catalog-muted">Mã suất chiếu: {showtime.id}</p>

      {seatsState.status === 'loading' && <LoadingState>Đang tải sơ đồ ghế…</LoadingState>}
      {seatsState.status === 'error' && <ErrorState error={seatsState.error} />}
      {seatsState.status === 'success' && <SeatMap seats={seats} selectedSeatIds={selectedSeatIds} onToggle={toggleSeat} />}
      {productsState.status === 'loading' && <LoadingState>Đang tải sản phẩm…</LoadingState>}
      {productsState.status === 'error' && <ErrorState error={productsState.error} />}
      {productsState.status === 'success' && <ProductPicker products={products} quantities={quantities} onQuantityChange={changeQuantity} />}

      <section className="booking-section" aria-labelledby="promotion-heading">
        <h2 id="promotion-heading">Khuyến mãi</h2>
        <label>Mã khuyến mãi
          <input value={promotionCode} maxLength="50" onChange={(event) => { setPromotionCode(event.target.value); setPromotion(null); }} />
        </label>
        <button type="button" onClick={applyPromotion} disabled={promotionBusy || !user}>{promotionBusy ? 'Đang kiểm tra…' : 'Áp dụng'}</button>
        {promotion && <p role="status">{promotion.message}{promotion.isValid ? ` Giảm tạm tính: ${money(promotion.discountAmount)}.` : ''}</p>}
      </section>

      <section className="booking-section" aria-labelledby="booking-summary-heading">
        <h2 id="booking-summary-heading">Xác nhận đặt vé</h2>
        <p>Ghế đã chọn: {selectedSeats.length ? selectedSeats.map((seat) => `${seat.label} (${money(seat.price)})`).join(', ') : 'Chưa chọn'}</p>
        <p>Sản phẩm: {selectedProducts.length ? selectedProducts.map((item) => `${item.quantity} × ${products.find((product) => product.id === item.productId)?.name ?? item.productId}`).join(', ') : 'Không có'}</p>
        <p className="catalog-muted">Giá cuối cùng, giảm giá và hạn giữ ghế sẽ do Database xác nhận khi tạo đơn.</p>
        {!user && <p><Link to="/login">Đăng nhập bằng tài khoản khách hàng để đặt vé</Link></p>}
        {user && user.role !== 'KHACH_HANG' && <p role="alert">Chỉ tài khoản khách hàng được đặt vé.</p>}
        {bookingState.status === 'conflict' && <p className="form-error" role="alert">{bookingState.message} Sơ đồ ghế đã được làm mới.</p>}
        {bookingState.status === 'error' && <p className="form-error" role="alert">{bookingState.message}</p>}
        {bookingState.status === 'success' && <div className="form-success" role="status">Đặt vé thành công. Mã đơn: {bookingState.booking.id}. Tổng thanh toán do DB chốt: {money(bookingState.booking.total)}. Giữ ghế đến: {bookingState.booking.holdExpiresAt}.</div>}
        <button type="button" onClick={submitBooking} disabled={bookingState.status === 'loading' || !user || user.role !== 'KHACH_HANG'}>{bookingState.status === 'loading' ? 'Đang tạo đơn…' : 'Đặt vé'}</button>
      </section>
      <Link className="catalog-button catalog-button--secondary" to={`/movies/${showtime.movieId}`}>Quay lại lịch chiếu</Link>
    </section>
  );
}
