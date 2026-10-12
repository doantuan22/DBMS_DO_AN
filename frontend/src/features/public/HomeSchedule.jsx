import { useEffect, useState } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { Link } from 'react-router-dom';
import { getShowtimes } from '../../api/catalogApi';
import { formatDate, formatTime, businessDate } from '../../utils/dateTime';
import { EmptyState, ErrorState, LoadingState } from '../../components/CatalogStates';
import { customerMoney } from '../customer/customerFormatting';
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
          <div className="cp-date-strip" aria-label="Ngày có suất chiếu">
            {dates.map((day) => (
              <button
                key={day}
                type="button"
                aria-pressed={day === selected}
                onClick={() => setDate(day)}
              >
                <span>
                  {day === businessDate()
                    ? 'Hôm nay'
                    : Temporal.PlainDate.from(day).toLocaleString('vi-VN', { weekday: 'short' })}
                </span>
                <strong>{formatDate(day)}</strong>
              </button>
            ))}
          </div>
          <div className="cp-quick-shows">
            {rows.map((show) => (
              <Link key={show.id} to={`/booking/${show.id}`} className="cp-quick-show">
                <strong>{formatTime(show.startsAt)}</strong>
                <span>
                  {show.cinemaName} · {show.roomName}
                </span>
                <small>
                  {show.format} · Giá cơ bản {customerMoney(show.basePrice)}
                </small>
                <span className="cp-quick-show__action">
                  Chọn suất <span aria-hidden="true">↗</span>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
