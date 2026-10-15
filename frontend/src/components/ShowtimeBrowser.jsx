import { businessDate, formatDate } from '../utils/dateTime';
import { EmptyState, ErrorState, LoadingState } from './CatalogStates';
import DateRail from '../features/public/DateRail';
import ShowtimeTimeChip from '../features/public/ShowtimeTimeChip';
import { showsByCinema } from '../features/public/filmPresentation';
import Select from './ui/Select';

const showDay = (show) => show.date ?? businessDate(show.startsAt);
const showDates = (rows) => [...new Set(rows.map(showDay))].sort();

function ShowtimeLoading() {
  return (
    <div className="cp-showtime-loading" aria-busy="true">
      <LoadingState>Đang tải lịch chiếu…</LoadingState>
      <div className="cp-showtime-loading__skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function ShowtimeList({ state, onRetry }) {
  if (state.status === 'loading') return <ShowtimeLoading />;
  if (state.status === 'error')
    return (
      <div className="cp-showtime-state">
        <ErrorState error={state.error} onRetry={onRetry} />
      </div>
    );
  if (state.status === 'empty')
    return (
      <div className="cp-showtime-state">
        <EmptyState>Không có suất chiếu phù hợp với lựa chọn này.</EmptyState>
      </div>
    );

  return (
    <div className="cp-show-groups">
      {showsByCinema(state.data).map((group) => (
        <section key={group.key} className="cp-show-group">
          <div className="cp-show-group__cinema">
            <h3>{group.name}</h3>
            {group.address && <p>{group.address}</p>}
          </div>
          <div className="cp-time-chips">
            {group.shows.map((show) => (
              <ShowtimeTimeChip key={show.id} showtime={show} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function UpcomingDates({ dates, rows, selected, onSelect }) {
  const today = businessDate();
  const pivot = selected > today ? selected : today;
  const upcoming = dates.filter((day) => day > pivot);
  if (upcoming.length === 0) return null;

  return (
    <aside className="cp-upcoming-dates" aria-labelledby="upcoming-dates-heading">
      <p className="catalog-eyebrow">LỊCH SẮP TỚI</p>
      <h3 id="upcoming-dates-heading">Ngày chiếu tiếp theo</h3>
      <p className="cp-upcoming-dates__description">Các ngày còn suất chiếu của phim.</p>
      <ul>
        {upcoming.slice(0, 6).map((day) => {
          const count = rows.filter((show) => showDay(show) === day).length;
          return (
            <li key={day}>
              <button type="button" onClick={() => onSelect(day)}>
                <span>
                  <strong>{formatDate(day)}</strong>
                  <small>{count} suất chiếu</small>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
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
  const rows = state.status === 'success' ? state.data : [];
  const dates = state.status === 'success' ? showDates(rows) : [];
  const today = businessDate();
  const selectedDate =
    dates.includes(date) && date >= today
      ? date
      : dates.includes(today)
        ? today
        : (dates.find((day) => day > today) ?? '');
  const nextDatePivot = selectedDate > today ? selectedDate : today;
  const hasUpcomingDates = dates.some((day) => day > nextDatePivot);
  const selectedRows = selectedDate ? rows.filter((show) => showDay(show) === selectedDate) : [];
  const listState =
    state.status === 'success' && (!selectedDate || selectedRows.length === 0)
      ? { status: 'empty', data: [] }
      : state.status === 'success'
        ? { ...state, data: selectedRows }
        : state;

  return (
    <section className="showtime-browser" aria-labelledby="showtimes-heading">
      <div className={`cp-showtime-layout${hasUpcomingDates ? '' : ' cp-showtime-layout--full'}`}>
        <div className="cp-showtime-layout__main">
          <div className="cp-showtime-heading">
            <div>
              <p className="catalog-eyebrow">LỊCH CHIẾU</p>
              <h2 id="showtimes-heading">Chọn suất chiếu</h2>
              <p>Chọn rạp và ngày phù hợp để xem các suất đang mở bán.</p>
            </div>
            {!cinemaReadOnly && (
              <label className="cp-cinema-filter">
                <span>Rạp chiếu</span>
                <Select
                  aria-label="Chọn rạp chiếu"
                  value={cinemaId}
                  onChange={(event) => onCinemaChange(event.target.value)}
                >
                  <option value="">Tất cả rạp</option>
                  {cinemas.map((cinema) => (
                    <option key={cinema.id} value={cinema.id}>
                      {cinema.name} · {cinema.city}
                    </option>
                  ))}
                </Select>
              </label>
            )}
          </div>

          {dates.length > 0 && (
            <DateRail
              dates={dates}
              selected={selectedDate}
              onSelect={onDateChange}
              label="Các ngày có suất chiếu"
            />
          )}

          {selectedDate && state.status === 'success' && (
            <h3 className="cp-showtime-date-title">Suất chiếu ngày {formatDate(selectedDate)}</h3>
          )}
          <ShowtimeList state={listState} onRetry={onRetry} />
        </div>
        {state.status === 'success' && hasUpcomingDates && (
          <UpcomingDates
            dates={dates}
            rows={rows}
            selected={selectedDate}
            onSelect={onDateChange}
          />
        )}
      </div>
    </section>
  );
}
