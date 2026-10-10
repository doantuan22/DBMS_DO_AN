import { useMemo } from 'react';
import { MAX_SEATS_PER_ORDER } from '../constants/bookingLimits';

const SELECTABLE_STATUS = 'Trống';
const LEGEND = [
  ['available', 'Ghế trống'],
  ['selected', 'Đang chọn'],
  ['taken', 'Đã đặt / Đang giữ / Bảo trì'],
  ['vip', 'VIP'],
  ['couple', 'Sweetbox / Đôi'],
];

// Seats arrive as a flat list; the backend provides row (HangGhe) and number (SoGhe).
const seatNumber = (seat) => seat.number ?? (parseInt(seat.label?.slice(1), 10) || 0);

function groupByRow(seats) {
  const rows = new Map();
  for (const seat of seats) {
    const row = seat.row ?? seat.label?.charAt(0) ?? '';
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row).push(seat);
  }
  for (const rowSeats of rows.values()) rowSeats.sort((a, b) => seatNumber(a) - seatNumber(b));
  return [...rows];
}

export default function SeatMap({ seats, selectedSeatIds, onToggle, limitNotice }) {
  const rows = useMemo(() => groupByRow(seats), [seats]);
  return (
    <section className="booking-section seat-map-container" aria-labelledby="seat-map-heading">
      <h2 id="seat-map-heading">Chọn ghế</h2>
      <p className="seat-map__counter">
        Đã chọn {selectedSeatIds.length}/{MAX_SEATS_PER_ORDER} ghế
        {selectedSeatIds.length >= MAX_SEATS_PER_ORDER ? ' — đã đạt tối đa' : ''}.
      </p>
      {limitNotice && (
        <p className="form-error seat-map__notice" role="alert">
          {limitNotice}
        </p>
      )}
      <div className="seat-map__screen" aria-hidden="true">
        <div className="seat-map__screen-bar" />
        <span className="seat-map__screen-label">Màn hình</span>
      </div>
      <div className="seat-map__rows" aria-label="Sơ đồ ghế">
        {rows.map(([row, rowSeats]) => (
          <div key={row} className="seat-row">
            <span className="seat-row__label" aria-hidden="true">
              {row}
            </span>
            <div className="seat-row__seats">
              {rowSeats.map((seat) => (
                <button
                  key={seat.id}
                  type="button"
                  className="seat-button"
                  data-type={seat.type}
                  data-status={seat.status}
                  aria-label={`${seat.label} — ${seat.status}`}
                  aria-pressed={selectedSeatIds.includes(seat.id)}
                  disabled={seat.status !== SELECTABLE_STATUS}
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
      <ul className="seat-map__legend" aria-label="Chú thích sơ đồ ghế">
        {LEGEND.map(([kind, label]) => (
          <li key={kind} className="seat-map__legend-item">
            <span className={`seat-map__legend-box seat-map__legend-box--${kind}`} />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
