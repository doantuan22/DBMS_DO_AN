import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from './CatalogStates';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);

export function ShowtimeList({ state }) {
  if (state.status === 'loading') return <LoadingState>Đang tải lịch chiếu…</LoadingState>;
  if (state.status === 'error') return <ErrorState error={state.error} />;
  if (state.status === 'empty') return <EmptyState>Không có suất chiếu phù hợp với lựa chọn này.</EmptyState>;
  return (
    <div className="showtime-grid">
      {state.data.map((showtime) => (
        <article className="showtime-card" key={showtime.id}>
          <div>
            <strong>{showtime.startTime}</strong>
            <span>{showtime.endTime ? ` – ${showtime.endTime}` : ''}</span>
          </div>
          <p>{showtime.cinemaName} · {showtime.roomName} · {showtime.format}</p>
          <p className="catalog-muted">Giá vé cơ bản: {money(showtime.basePrice)}</p>
          <Link className="catalog-button" to={`/booking/${showtime.id}`}>Chọn suất này</Link>
        </article>
      ))}
    </div>
  );
}

export default function ShowtimeBrowser({ cinemas, cinemaId, date, onCinemaChange, onDateChange, state }) {
  return (
    <section className="showtime-browser" aria-labelledby="showtimes-heading">
      <div className="catalog-section-heading">
        <div><p className="catalog-eyebrow">LỊCH CHIẾU</p><h2 id="showtimes-heading">Chọn rạp và ngày</h2></div>
      </div>
      <div className="catalog-filters">
        <label>Rạp chiếu
          <select value={cinemaId} onChange={(event) => onCinemaChange(event.target.value)}>
            <option value="">Tất cả rạp</option>
            {cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name} · {cinema.city}</option>)}
          </select>
        </label>
        <label>Ngày chiếu
          <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} />
        </label>
      </div>
      <ShowtimeList state={state} />
    </section>
  );
}
