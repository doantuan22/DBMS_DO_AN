import { userCanAct } from '../utils/authorization';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  createBooking,
  getProducts,
  getSeats,
  getShowtimeDetail,
  validatePromotion,
} from '../api/catalogApi';
import { ErrorState, LoadingState } from '../components/CatalogStates';
import BookingExperience from '../features/customer/BookingExperience';
import useBookingDraftGuard from '../features/staff-bookings/useBookingDraftGuard';
import { useAuth } from '../context/AuthContext';
import {
  SEAT_LIMIT_MESSAGE,
  bookingErrorMessage,
  clampQuantity,
  toggleSeatSelection,
} from '../utils/bookingLimits';

function toProducts(quantities) {
  return Object.entries(quantities)
    .map(([productId, quantity]) => ({ productId: Number(productId), quantity: Number(quantity) }))
    .filter(
      (item) =>
        Number.isSafeInteger(item.productId) &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0,
    );
}

export default function BookingPreparation() {
  const { showtimeId } = useParams();
  const { user } = useAuth();
  const scope = `${user?.userId ?? 'guest'}:${
    user?.permissions
      ?.map((item) => item.code)
      .sort()
      .join(',') ?? ''
  }`;
  return <BookingContext key={`${showtimeId}:${scope}`} showtimeId={showtimeId} />;
}

function BookingContext({ showtimeId }) {
  const { user } = useAuth();
  const canBook = userCanAct(user, 'KHACH_HANG', 'DAT_VE');
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
  const previewVersion = useRef(0);
  const [bookingState, setBookingState] = useState({ status: 'idle' });
  const [seatLimitNotice, setSeatLimitNotice] = useState(null);
  const mounted = useRef(true);
  const seatRequest = useRef(0);
  const bookingPending = useRef(false);
  const promotionRequest = useRef(0);
  useEffect(() => {
    mounted.current = true;
    const requests = [seatRequest, previewVersion, promotionRequest];
    return () => {
      mounted.current = false;
      requests.forEach((request) => {
        request.current++;
      });
    };
  }, []);

  const loadSeats = useCallback(
    async (signal) => {
      if (signal?.aborted || !mounted.current) return;
      const request = ++seatRequest.current;
      previewVersion.current += 1;
      setPromotion(null);
      setSeatsState({ status: 'loading' });
      try {
        const rows = await getSeats(showtimeId, { signal });
        if (!mounted.current || signal?.aborted || request !== seatRequest.current) return;
        setSeats(rows);
        setSelectedSeatIds((previous) =>
          previous.filter((id) => rows.some((seat) => seat.id === id && seat.status === 'Trống')),
        );
        setSeatsState({ status: 'success' });
      } catch (error) {
        if (mounted.current && request === seatRequest.current && error.name !== 'AbortError') {
          setSeats([]);
          setSelectedSeatIds([]);
          setSeatsState({ status: 'error', error });
        }
      }
    },
    [showtimeId],
  );

  useEffect(() => {
    const controller = new AbortController();
    getShowtimeDetail(showtimeId, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setState({ status: 'success', data: result });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ status: 'error', error });
      });
    return () => controller.abort();
  }, [showtimeId]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadSeats(controller.signal));
    getProducts({ signal: controller.signal })
      .then((rows) => {
        if (!controller.signal.aborted) {
          setProducts(rows);
          setProductsState({ status: 'success' });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setProductsState({ status: 'error', error });
      });
    return () => controller.abort();
  }, [loadSeats]);

  const selectedSeats = useMemo(
    () => seats.filter((seat) => selectedSeatIds.includes(seat.id)),
    [seats, selectedSeatIds],
  );
  const selectedProducts = useMemo(() => toProducts(quantities), [quantities]);

  const safeAnchor = useCallback((destination) => {
    const target = new URL(destination, window.location.href);
    return target.origin === window.location.origin && target.pathname === window.location.pathname && target.search === window.location.search && Boolean(target.hash);
  }, []);
  useBookingDraftGuard(bookingState.status !== 'success' && (selectedSeatIds.length > 0 || selectedProducts.length > 0 || Boolean(promotionCode)), bookingState.status === 'loading', { isSafeDestination: safeAnchor });

  function toggleSeat(id) {
    if (bookingPending.current) return;
    previewVersion.current += 1;
    setPromotion(null);
    const result = toggleSeatSelection(selectedSeatIds, id);
    setSeatLimitNotice(result.limitReached ? SEAT_LIMIT_MESSAGE : null);
    setSelectedSeatIds(result.selectedIds);
  }

  function changeQuantity(productId, value) {
    if (bookingPending.current) return;
    previewVersion.current += 1;
    const { quantity } = clampQuantity(value);
    setPromotion(null);
    setQuantities((previous) => ({ ...previous, [productId]: quantity }));
  }

  async function applyPromotion() {
    if (!canBook || promotionBusy || bookingPending.current) return;
    if (selectedSeatIds.length === 0) {
      setPromotion({
        isValid: false,
        message: 'Hãy chọn ít nhất một ghế trước khi áp dụng khuyến mãi.',
      });
      return;
    }
    setPromotionBusy(true);
    const request = ++promotionRequest.current;
    const version = ++previewVersion.current;
    try {
      const result = await validatePromotion({
        showtimeId: Number(showtimeId),
        seatIds: selectedSeatIds,
        products: selectedProducts,
        promotionCode,
      });
      if (mounted.current && version === previewVersion.current) setPromotion(result.promotion);
    } catch (error) {
      if (mounted.current && version === previewVersion.current)
        setPromotion({ isValid: false, message: error.message });
    } finally {
      if (mounted.current && request === promotionRequest.current) setPromotionBusy(false);
    }
  }

  async function submitBooking() {
    if (!canBook || bookingPending.current) return;
    if (selectedSeatIds.length === 0) {
      setBookingState({ status: 'error', message: 'Hãy chọn ít nhất một ghế.' });
      return;
    }
    bookingPending.current = true;
    setBookingState({ status: 'loading' });
    previewVersion.current += 1;
    try {
      const result = await createBooking({
        showtimeId: Number(showtimeId),
        seatIds: selectedSeatIds,
        products: selectedProducts,
        promotionCode: promotionCode.trim() || undefined,
      });
      if (!mounted.current) return;
      setBookingState({ status: 'success', booking: result.booking });
      setSelectedSeatIds([]);
      await loadSeats();
    } catch (error) {
      if (!mounted.current) return;
      const friendly = bookingErrorMessage(error);
      if (error.code === 'PROMOTION_NOT_AVAILABLE') {
        setPromotion({ isValid: false, message: friendly });
        setBookingState({ status: 'error', message: friendly });
      } else if (error.code === 'SHOWTIME_UNAVAILABLE') {
        setSelectedSeatIds([]);
        setPromotion(null);
        setBookingState({ status: 'error', message: friendly });
        await loadSeats();
      } else if (error.status === 409 && !friendly) {
        setSelectedSeatIds([]);
        setBookingState({ status: 'conflict', message: error.message });
        await loadSeats();
      } else setBookingState({ status: 'error', message: friendly ?? error.message });
    } finally {
      bookingPending.current = false;
    }
  }

  if (state.status === 'loading') return <LoadingState>Đang xác nhận suất chiếu…</LoadingState>;
  if (state.status === 'error') return <ErrorState error={state.error} />;
  return <BookingExperience showtime={state.data} user={user} canBook={canBook} seats={seats} seatsState={seatsState} selectedSeatIds={selectedSeatIds} selectedSeats={selectedSeats} seatLimitNotice={seatLimitNotice} toggleSeat={toggleSeat} loadSeats={loadSeats} products={products} productsState={productsState} quantities={quantities} selectedProducts={selectedProducts} changeQuantity={changeQuantity} promotionCode={promotionCode} changePromotionCode={(value) => { if (bookingPending.current) return; previewVersion.current++; setPromotionCode(value); setPromotion(null); }} promotion={promotion} promotionBusy={promotionBusy} applyPromotion={applyPromotion} bookingState={bookingState} submitBooking={submitBooking} />;
}
