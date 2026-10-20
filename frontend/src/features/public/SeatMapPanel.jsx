import { useEffect, useMemo, useRef, useState } from 'react';
import { MAX_SEATS_PER_ORDER } from '../../constants/bookingLimits';
import { customerMoney } from '../customer/customerFormatting';

// Public presentation only. Row/number/status/price and onToggle remain owned
// by the existing BookingPreparation and the server. No aisle is invented.
function seatRows(seats) {
  const rows = new Map();
  for (const seat of seats) {
    const row = seat.row ?? seat.label?.charAt(0) ?? '';
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row).push(seat);
  }
  const number = (seat) => seat.number ?? (parseInt(seat.label?.slice(1), 10) || 0);
  for (const row of rows.values()) row.sort((a, b) => number(a) - number(b));
  return [...rows];
}
export default function SeatMapPanel({
  seats,
  selectedSeatIds,
  onToggle,
  limitNotice,
  disabled = false,
}) {
  const rows = useMemo(() => seatRows(seats), [seats]);
  const canvas = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const el = canvas.current;
    const update = () => setOverflow(el.scrollWidth > el.clientWidth + 2);
    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();
    return () => observer.disconnect();
  }, [seats, zoom]);
  const scroll = (direction) =>
    canvas.current.scrollBy({
      left: direction * canvas.current.clientWidth * 0.65,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  const focusSeat = (event, rowIndex, seatIndex) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    let nextRow = rowIndex,
      nextSeat = seatIndex;
    if (event.key === 'Home') nextSeat = 0;
    else if (event.key === 'End') nextSeat = rows[rowIndex][1].length - 1;
    else if (event.key === 'ArrowLeft') nextSeat--;
    else if (event.key === 'ArrowRight') nextSeat++;
    else if (event.key === 'ArrowUp') nextRow--;
    else nextRow++;
    const direction = ['ArrowLeft', 'ArrowUp', 'End'].includes(event.key) ? -1 : 1;
    while (rows[nextRow]?.[1]?.[nextSeat]) {
      const next = rows[nextRow][1][nextSeat];
      if (next.status === 'Trống') {
        const button = canvas.current.querySelector(`[data-seat-id="${next.id}"]`);
        button?.focus();
        button?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        break;
      }
      if (['ArrowUp', 'ArrowDown'].includes(event.key)) nextRow += direction;
      else nextSeat += direction;
    }
  };
  const standardStatuses = ['Trống', 'Đang giữ', 'Đã đặt', 'Bảo trì'];
  const presentStatuses = new Set(seats.map((seat) => seat.status));
  const statuses = [
    ...standardStatuses,
    ...[...presentStatuses].filter((s) => s && !standardStatuses.includes(s)),
  ];
  const types = [...new Set(seats.map((seat) => seat.type).filter(Boolean))];
  return (
    <div className="cp-seat-panel">
      <section className="booking-section seat-map-container" aria-labelledby="seat-map-heading">
        <h2 id="seat-map-heading">Chọn ghế</h2>
        <p className="seat-map__counter" role="status">
          Đã chọn {selectedSeatIds.length}/{MAX_SEATS_PER_ORDER} ghế
          {selectedSeatIds.length >= MAX_SEATS_PER_ORDER ? ' — đã đạt tối đa' : ''}.
        </p>
        {limitNotice && (
          <p className="form-error" role="alert">
            {limitNotice}
          </p>
        )}
        <div className="seat-map__screen" aria-hidden="true">
          <div className="seat-map__screen-bar" />
          <span className="seat-map__screen-label">Màn hình</span>
        </div>
        <div className="cp-seat-controls" role="group" aria-label="Điều chỉnh sơ đồ ghế">
          <button
            type="button"
            aria-label="Thu nhỏ sơ đồ ghế"
            disabled={disabled || zoom <= 1}
            onClick={() => setZoom((value) => Math.max(1, value - 0.25))}
          >
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            aria-label="Phóng to sơ đồ ghế"
            disabled={disabled || zoom >= 1.5}
            onClick={() => setZoom((value) => Math.min(1.5, value + 0.25))}
          >
            +
          </button>
          {overflow && (
            <>
              <button type="button" aria-label="Xem phía trái sơ đồ ghế" onClick={() => scroll(-1)}>
                ←
              </button>
              <button type="button" aria-label="Xem phía phải sơ đồ ghế" onClick={() => scroll(1)}>
                →
              </button>
            </>
          )}
        </div>
        <p className="cp-seat-guide">
          {overflow ? 'Vuốt ngang hoặc dùng nút mũi tên để xem toàn bộ hàng ghế. ' : ''}Dùng phím
          mũi tên để di chuyển giữa các ghế.
        </p>
        <div
          ref={canvas}
          className="seat-map__rows"
          role="region"
          tabIndex={0}
          aria-label="Sơ đồ ghế"
          style={{ '--cp-seat-size': `${44 * zoom}px` }}
        >
          {rows.map(([row, seatsInRow], rowIndex) => (
            <div key={row} className="seat-row">
              <span className="seat-row__label" aria-hidden="true">
                {row}
              </span>
              <div className="seat-row__seats">
                {seatsInRow.map((seat, seatIndex) => (
                  <button
                    key={seat.id}
                    type="button"
                    className="cp-seat"
                    data-type={seat.type}
                    data-status={seat.status}
                    data-seat-id={seat.id}
                    aria-label={`${seat.label} — ${seat.status}${seat.type ? ` — ${seat.type}` : ''}${Number.isFinite(seat.price) ? ` — ${customerMoney(seat.price)}` : ''}`}
                    aria-pressed={selectedSeatIds.includes(seat.id)}
                    disabled={disabled || seat.status !== 'Trống'}
                    onClick={() => onToggle(seat.id)}
                    onKeyDown={(event) => focusSeat(event, rowIndex, seatIndex)}
                  >
                    {seat.label}
                  </button>
                ))}
              </div>
              <span className="seat-row__label" aria-hidden="true">
                {row}
              </span>
            </div>
          ))}
        </div>
      </section>
      <ul className="cp-seat-legend" aria-label="Trạng thái và loại ghế">
        <li data-status="selected">
          <span aria-hidden="true" />
          Đang chọn
        </li>
        {statuses.map((status) => (
          <li key={status} data-status={status}>
            <span aria-hidden="true" />
            {status}
          </li>
        ))}
        {types.length > 1 && <li>Loại ghế: {types.join(' · ')}</li>}
      </ul>
    </div>
  );
}
