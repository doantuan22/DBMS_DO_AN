import { useEffect, useState } from 'react';
import { formatDate, businessDate } from '../utils/dateTime';
import { EmptyState, ErrorState, LoadingState } from './CatalogStates';
import DateRail from '../features/public/DateRail';
import ShowtimeTimeChip from '../features/public/ShowtimeTimeChip';
import { showsByCinema } from '../features/public/filmPresentation';

const showDay = (show) => show.date ?? businessDate(show.startsAt);
const showDates = (rows) => [...new Set(rows.map(showDay))].sort();

export function ShowtimeList({ state, onRetry }) {
  if (state.status === 'loading') return <LoadingState>Đang tải lịch chiếu…</LoadingState>;
  if (state.status === 'error') return <ErrorState error={state.error} onRetry={onRetry} />;
  if (state.status === 'empty')
    return <EmptyState>Không có suất chiếu phù hợp với lựa chọn này.</EmptyState>;
  return (
    <div className="cp-schedule-days">
      {showDates(state.data).map((day) => (
        <section
          key={day}
          className="cp-schedule-day"
          aria-label={`Lịch chiếu ngày ${formatDate(day)}`}
        >
          <h3 className="cp-schedule-day__title">{formatDate(day)}</h3>
          <div className="cp-show-groups">
            {showsByCinema(state.data.filter((show) => showDay(show) === day)).map((group) => (
              <div key={group.key} className="cp-show-group">
                <h4>{group.name}</h4>
                <div className="cp-time-chips">
                  {group.shows.map((show) => (
                    <ShowtimeTimeChip key={show.id} showtime={show} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function ShowtimeBrowser({
  cinemas,
  cinemaId,
  date,
  onCinemaChange,
  onDateChange,
  state,
  cinemaReadOnly = false,
  onRetry,
}) {
  // Dates come only from the complete unfiltered-date response for this cinema.
  // Filtering remains in the parent's existing REST request and ownership guard.
  const [index, setIndex] = useState({ cinemaId, dates: [] });
  useEffect(() => {
    if (state.status === 'success' && !date) setIndex({ cinemaId, dates: showDates(state.data) });
  }, [state, date, cinemaId]);
  const dates =
    !date && state.status === 'success'
      ? showDates(state.data)
      : index.cinemaId === cinemaId
        ? index.dates
        : [];
  return (
    <section className="showtime-browser" aria-labelledby="showtimes-heading">
      <div className="catalog-section-heading">
        <div>
          <p className="catalog-eyebrow">LỊCH CHIẾU</p>
          <h2 id="showtimes-heading">{cinemaReadOnly ? 'Chọn ngày chiếu' : 'Chọn rạp và ngày'}</h2>
        </div>
      </div>
      <div className="catalog-filters cp-show-filters">
        {!cinemaReadOnly && (
          <label>
            Rạp chiếu
            <select value={cinemaId} onChange={(e) => onCinemaChange(e.target.value)}>
              <option value="">Tất cả rạp</option>
              {cinemas.map((cinema) => (
                <option key={cinema.id} value={cinema.id}>
                  {cinema.name} · {cinema.city}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Ngày chiếu
          <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
        </label>
        {date && (
          <button
            type="button"
            className="catalog-button catalog-button--secondary"
            onClick={() => onDateChange('')}
          >
            Tất cả ngày
          </button>
        )}
      </div>
      {dates.length > 0 && <DateRail dates={dates} selected={date} onSelect={onDateChange} />}
      <ShowtimeList state={state} onRetry={onRetry} />
    </section>
  );
}
