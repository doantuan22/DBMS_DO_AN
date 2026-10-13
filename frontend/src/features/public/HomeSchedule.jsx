import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getShowtimes } from '../../api/catalogApi';
import { businessDate } from '../../utils/dateTime';
import { EmptyState, ErrorState, LoadingState } from '../../components/CatalogStates';
import DateRail from './DateRail';
import ShowtimeTimeChip from './ShowtimeTimeChip';
import { showsByCinema } from './filmPresentation';
export default function HomeSchedule({ movie }) {
  const [state, setState] = useState({ status: 'loading' });
  const [date, setDate] = useState('');
  const [attempt, setAttempt] = useState(0);
  const key = `${movie.id}:${attempt}`;
  useEffect(() => {
    const controller = new AbortController();
    getShowtimes(movie.id, {}, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ status: data.length ? 'success' : 'empty', data, key });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ status: 'error', error, key });
      });
    return () => controller.abort();
  }, [movie.id, key]);
  const resource = state.key === key ? state : { status: 'loading' };
  const dates = resource.data
    ? [...new Set(resource.data.map((s) => s.date ?? businessDate(s.startsAt)))].sort()
    : [];
  const selected = dates.includes(date) ? date : dates[0];
  const rows =
    resource.data?.filter((s) => (s.date ?? businessDate(s.startsAt)) === selected) ?? [];
  return (
    <section
      id="home-schedule"
      className="cp-section cp-home-schedule"
      aria-labelledby="home-schedule-title"
    >
      <div className="catalog-section-heading">
        <div>
          <p className="catalog-eyebrow">HẸN BẠN TẠI RẠP</p>
          <h2 id="home-schedule-title">Chọn ngày. Chọn suất.</h2>
          <p className="cp-schedule-film">{movie.title}</p>
        </div>
        <Link to={`/movies/${movie.id}#showtimes-heading`}>Toàn bộ lịch chiếu ↗</Link>
      </div>
      {resource.status === 'loading' && <LoadingState>Đang tải lịch chiếu…</LoadingState>}
      {resource.status === 'error' && (
        <ErrorState error={resource.error} onRetry={() => setAttempt((n) => n + 1)} />
      )}
      {resource.status === 'empty' && (
        <EmptyState>
          Phim chưa có suất chiếu đang mở. <Link to={`/movies/${movie.id}`}>Xem chi tiết phim</Link>
        </EmptyState>
      )}
      {resource.status === 'success' && (
        <>
          <DateRail dates={dates} selected={selected} onSelect={setDate} />
          <div className="cp-show-groups">
            {showsByCinema(rows).map((group) => (
              <div key={group.key} className="cp-show-group">
                <h3>{group.name}</h3>
                <div className="cp-time-chips">
                  {group.shows.map((show) => (
                    <ShowtimeTimeChip key={show.id} showtime={show} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
