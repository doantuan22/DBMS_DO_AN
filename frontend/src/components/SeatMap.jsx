const SELECTABLE_STATUS = 'Trống';

export default function SeatMap({ seats, selectedSeatIds, onToggle }) {
  return (
    <section className="booking-section" aria-labelledby="seat-map-heading">
      <h2 id="seat-map-heading">Chọn ghế</h2>
      <p className="catalog-muted">Trống: có thể chọn. Đang giữ, Đã đặt và Bảo trì: không thể chọn.</p>
      <div className="seat-grid" aria-label="Sơ đồ ghế">
        {seats.map((seat) => {
          const selected = selectedSeatIds.includes(seat.id);
          const selectable = seat.status === SELECTABLE_STATUS;
          return (
            <button key={seat.id} type="button" className="seat-button" data-status={seat.status} aria-pressed={selected} disabled={!selectable} onClick={() => onToggle(seat.id)}>
              {seat.label} — {seat.status}
            </button>
          );
        })}
      </div>
    </section>
  );
}
