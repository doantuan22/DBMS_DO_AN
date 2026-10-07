import { useMemo } from 'react';
import { MAX_SEATS_PER_ORDER } from '../constants/bookingLimits';

const SELECTABLE_STATUS = 'Trống';

export default function SeatMap({ seats = [], selectedSeatIds = [], onToggle, limitNotice }) {
  const { groupedRows, rowsList } = useMemo(() => {
    const groups = {};
    const rowOrder = [];

    seats.forEach((seat) => {
      const row = seat.row || (seat.label ? seat.label.charAt(0) : 'Khác');
      if (!groups[row]) {
        groups[row] = [];
        rowOrder.push(row);
      }
      groups[row].push(seat);
    });

    Object.keys(groups).forEach((row) => {
      groups[row].sort((a, b) => {
        const numA = Number(a.number || (a.label ? a.label.slice(1) : 0)) || 0;
        const numB = Number(b.number || (b.label ? b.label.slice(1) : 0)) || 0;
        return numA - numB;
      });
    });

    return { groupedRows: groups, rowsList: rowOrder };
  }, [seats]);

  return (
    <section className="booking-section seat-map-container" aria-labelledby="seat-map-heading">
      <h2 id="seat-map-heading">Chọn ghế</h2>
      <p className="catalog-muted">Trống: có thể chọn. Đang giữ, Đã đặt và Bảo trì: không thể chọn.</p>
      <p className="catalog-muted">
        Đã chọn {selectedSeatIds.length}/{MAX_SEATS_PER_ORDER} ghế{selectedSeatIds.length >= MAX_SEATS_PER_ORDER ? ' — đã đạt tối đa' : ''}.
      </p>
      {limitNotice && <p className="form-error" role="alert">{limitNotice}</p>}

      {/* Screen Bar */}
      <div className="seat-map__screen">
        <div className="seat-map__screen-bar" />
        <span className="seat-map__screen-label">MÀN HÌNH CHIẾU / SCREEN</span>
      </div>

      <div className="seat-grid" aria-label="Sơ đồ ghế" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {rowsList.map((row) => (
          <div key={row} className="seat-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
            <span className="seat-row__label" style={{ fontWeight: 'bold', minWidth: '1.5rem', textAlign: 'center' }}>{row}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
              {groupedRows[row].map((seat) => {
                const selected = selectedSeatIds.includes(seat.id);
                const selectable = seat.status === SELECTABLE_STATUS;
                return (
                  <button
                    key={seat.id}
                    type="button"
                    className="seat-button"
                    data-type={seat.type}
                    data-status={seat.status}
                    aria-pressed={selected}
                    disabled={!selectable}
                    onClick={() => onToggle(seat.id)}
                  >
                    {seat.label} — {seat.status}
                  </button>
                );
              })}
            </div>
            <span className="seat-row__label" style={{ fontWeight: 'bold', minWidth: '1.5rem', textAlign: 'center' }}>{row}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="seat-map__legend" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 14, height: 14, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 3, display: 'inline-block' }} />
          <span>Ghế trống</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 14, height: 14, background: '#1e3a8a', borderRadius: 3, display: 'inline-block' }} />
          <span>Đang chọn</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 14, height: 14, background: '#94a3b8', borderRadius: 3, display: 'inline-block', opacity: 0.6 }} />
          <span>Đã đặt / Đang giữ</span>
        </div>
      </div>
    </section>
  );
}
