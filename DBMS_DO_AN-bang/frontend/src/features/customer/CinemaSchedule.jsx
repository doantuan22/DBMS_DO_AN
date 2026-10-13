import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMovies, getShowtimes } from '../../api/catalogApi';
import { loadResource, showtimeFilters } from '../../services/catalogResource';
import { AsyncState, FormField, Select } from '../../components/ui';
import ShowtimeBrowser from '../../components/ShowtimeBrowser';
export default function CinemaSchedule({ cinema }) {
  const [params, setParams] = useSearchParams(),
    date = params.get('date') ?? '';
  const [movies, setMovies] = useState({ status: 'loading' }),
    [shows, setShows] = useState({ status: 'idle' }),
    [attempt, setAttempt] = useState(0);
  const movieId =
    params.get('movieId') ??
    String(movies.data?.find((movie) => movie.status === 'Đang chiếu')?.id ?? '');
  const key = `${cinema.id}:${movieId}:${date}:${attempt}`;
  useEffect(() => {
    const c = new AbortController();
    loadResource(() => getMovies({}, { signal: c.signal })).then((result) => {
      if (!c.signal.aborted) setMovies(result);
    });
    return () => c.abort();
  }, [attempt]);
  useEffect(() => {
    if (!movieId) return;
    const c = new AbortController();
    loadResource(() =>
      getShowtimes(movieId, showtimeFilters(cinema.id, date), { signal: c.signal }),
    ).then((result) => {
      if (!c.signal.aborted) setShows({ ...result, key });
    });
    return () => c.abort();
  }, [cinema.id, movieId, date, attempt, key]);
  const change = (patch) =>
    setParams(Object.fromEntries(Object.entries({ movieId, date, ...patch }).filter(([, v]) => v)));
  return (
    <section className="catalog-section cp-cinema-schedule" aria-label="Lịch chiếu tại rạp">
      <h2>Lịch chiếu tại rạp</h2>
      <AsyncState
        status={movies.status}
        error={movies.error}
        onRetry={() => setAttempt((n) => n + 1)}
      />
      <FormField label="Chọn phim tại rạp">
        <Select
          value={movieId}
          disabled={movies.status !== 'success'}
          onChange={(e) => change({ movieId: e.target.value, date: '' })}
        >
          <option value="">Chọn phim để xem lịch</option>
          {movies.status === 'success' &&
            movies.data.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} · {m.status}
              </option>
            ))}
        </Select>
      </FormField>
      {movieId ? (
        <ShowtimeBrowser
          key={movieId}
          cinemas={[cinema]}
          cinemaId={String(cinema.id)}
          cinemaReadOnly
          onRetry={() => setAttempt((n) => n + 1)}
          date={date}
          onDateChange={(value) => change({ date: value })}
          state={shows.key === key ? shows : { status: 'loading' }}
        />
      ) : (
        <p>Chọn phim để tra cứu suất chiếu tại rạp này.</p>
      )}
    </section>
  );
}
