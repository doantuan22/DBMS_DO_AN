import { useId, useRef, useState } from 'react';
import Button from '../../components/ui/Button';
import { matchesResource, seatRows } from './facilityModel';

export default function SeatLayout({
  seats,
  selectedId,
  filters,
  onSelect,
  mode = 'configuration',
  disabled = false,
}) {
  const heading = useId(),
    [zoom, setZoom] = useState(1);
  const scroll = useRef(null),
    [focused, setFocused] = useState(null);
  const rows = seatRows(seats);
  if (!rows)
    return <p role="alert">Chưa đủ hàng/số ghế nhất quán để dựng sơ đồ. Hãy sử dụng Danh sách.</p>;
  const legend = [...new Set(seats.map((seat) => `${seat.type} · ${seat.status}`))];
  const focusId = seats.some((seat) => seat.id === focused)
    ? focused
    : (selectedId ?? seats[0]?.id);
  const moveFocus = (event, rowIndex, index) => {
    const current = rows[rowIndex][1];
    let target;
    if (event.key === 'ArrowRight') target = current[index + 1];
    if (event.key === 'ArrowLeft') target = current[index - 1];
    if (event.key === 'Home') target = current[0];
    if (event.key === 'End') target = current.at(-1);
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown')
      target = rows[rowIndex + (event.key === 'ArrowUp' ? -1 : 1)]?.[1].find(
        (seat) => seat.number === current[index].number,
      );
    if (target) {
      event.preventDefault();
      [...scroll.current.querySelectorAll('button')]
        .find((button) => button.dataset.seatId === String(target.id))
        ?.focus();
    }
  };
  return (
    <section className="facility-seat-layout" aria-labelledby={heading}>
      <div className="facility-panel-heading">
        <div>
          <h2 id={heading}>
            {mode === 'configuration' ? 'Sơ đồ cấu hình phòng' : 'Tình trạng ghế theo suất'}
          </h2>
          <p>{seats.length} ghế · Theo hàng và số ghế thực</p>
        </div>
        <div className="facility-zoom" aria-label="Kích thước ghế">
          <Button
            size="sm"
            variant="secondary"
            disabled={zoom <= 1}
            onClick={() => setZoom((value) => Math.max(1, value - 0.25))}
            aria-label="Thu nhỏ ghế"
          >
            −
          </Button>
          <span>{Math.round(zoom * 100)}%</span>
          <Button
            size="sm"
            variant="secondary"
            disabled={zoom >= 2}
            onClick={() => setZoom((value) => Math.min(2, value + 0.25))}
            aria-label="Phóng to ghế"
          >
            ＋
          </Button>
        </div>
      </div>
      <p className="facility-help">
        Ghế ngoài bộ lọc giữ nguyên vị trí. Dùng phím mũi tên, Home/End để di chuyển; Enter để chọn.
        Có thể cuộn ngang.
      </p>
      <div
        ref={scroll}
        className="facility-seat-scroll"
        tabIndex={0}
        role="region"
        aria-label="Sơ đồ ghế có thể cuộn"
        style={{ '--seat-size': `${48 * zoom}px` }}
      >
        {rows.map(([label, seats], rowIndex) => (
          <div className="facility-seat-row" key={label}>
            <span className="facility-row-label">{label}</span>
            <div className="facility-seat-track">
              {seats.map((seat, index) => (
                <button
                  type="button"
                  key={seat.id}
                  className="facility-seat"
                  data-type={seat.type}
                  data-status={seat.status}
                  data-seat-id={seat.id}
                  tabIndex={String(focusId) === String(seat.id) ? 0 : -1}
                  onFocus={() => setFocused(seat.id)}
                  onKeyDown={(event) => moveFocus(event, rowIndex, index)}
                  data-match={matchesResource(seat, filters)}
                  aria-pressed={String(selectedId) === String(seat.id)}
                  disabled={disabled}
                  aria-label={`Ghế ${seat.label}, loại ${seat.type}, ${mode === 'configuration' ? 'cấu hình' : 'tình trạng suất'} ${seat.status}`}
                  onClick={() => onSelect(seat)}
                >
                  <strong>{seat.label}</strong>
                  <span>{seat.type}</span>
                  <small>{seat.status}</small>
                  {!matchesResource(seat, filters) && <small>Ngoài bộ lọc</small>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ul className="facility-legend" aria-label="Chú thích loại và trạng thái ghế">
        {legend.map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
    </section>
  );
}
