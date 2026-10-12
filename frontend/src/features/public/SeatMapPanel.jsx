import { useMemo } from 'react';
import { MAX_SEATS_PER_ORDER } from '../../constants/bookingLimits';

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
  const statuses = [...new Set(seats.map((seat) => seat.status))];
  const types = [...new Set(seats.map((seat) => seat.type).filter(Boolean))];
  return (
    <div className="cp-seat-panel">
      <section className="booking-section seat-map-container" aria-labelledby="seat-map-heading">
        <h2 id="seat-map-heading">Chọn ghế</h2>
        <p className="seat-map__counter">
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
        <div className="seat-map__rows" aria-label="Sơ đồ ghế">
          {rows.map(([row, seatsInRow]) => (
            <div key={row} className="seat-row">
              <span className="seat-row__label" aria-hidden="true">
                {row}
              </span>
              <div className="seat-row__seats">
                {seatsInRow.map((seat) => (
                  <button
                    key={seat.id}
                    type="button"
                    className="cp-seat"
                    data-type={seat.type}
                    data-status={seat.status}
                    aria-label={`${seat.label} — ${seat.status}`}
                    aria-pressed={selectedSeatIds.includes(seat.id)}
                    disabled={disabled || seat.status !== 'Trống'}
                    onClick={() => onToggle(seat.id)}
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
