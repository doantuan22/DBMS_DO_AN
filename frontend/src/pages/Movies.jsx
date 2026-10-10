import { useEffect, useState } from 'react';
import { getGenres, getMovies } from '../api/catalogApi';
import MovieGrid from '../components/MovieGrid';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import { loadResource } from '../services/catalogResource';

export default function Movies() {
  const [search, setSearch] = useState('');
  const [genreId, setGenreId] = useState('');
  const [genresState, setGenresState] = useState({ status: 'loading' });
  const [moviesState, setMoviesState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    loadResource(() => getGenres({ signal: controller.signal })).then((result) => {
      if (!controller.signal.aborted) setGenresState(result);
    });
    return () => controller.abort();
  }, []);

  const filtersKey = `${search.trim()}\u0000${genreId}`;
  const requestKey = `${filtersKey}\u0000${attempt}`;
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadResource(() =>
        getMovies({ search: search.trim(), genreId }, { signal: controller.signal }),
      ).then((result) => {
        if (!controller.signal.aborted) setMoviesState({ ...result, key: requestKey });
      });
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, genreId, attempt, requestKey]);
  const moviesResource = moviesState.key === requestKey ? moviesState : { status: 'loading' };

  return (
    <section className="catalog-page">
      <div className="catalog-section-heading">
        <div>
          <p className="catalog-eyebrow">KHÁM PHÁ</p>
          <h1>Danh sách phim</h1>
        </div>
      </div>
      <div className="catalog-filters">
        <label>
          Tìm phim hoặc đạo diễn
          <input
            type="search"
            value={search}
            maxLength="100"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nhập từ khóa"
          />
        </label>
        <label>
          Thể loại
          <select value={genreId} onChange={(event) => setGenreId(event.target.value)}>
            <option value="">Tất cả thể loại</option>
            {genresState.status === 'success' &&
              genresState.data.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
          </select>
        </label>
      </div>
      {genresState.status === 'loading' && (
        <p className="catalog-muted" role="status">
          Đang tải thể loại…
        </p>
      )}
      {genresState.status === 'error' && (
        <p className="form-error" role="alert">
          Không thể tải danh sách thể loại.
        </p>
      )}
      {moviesResource.status === 'loading' && <LoadingState>Đang tải danh sách phim…</LoadingState>}
      {moviesResource.status === 'empty' && <EmptyState>Không tìm thấy phim phù hợp.</EmptyState>}
      {moviesResource.status === 'error' && (
        <ErrorState error={moviesResource.error} onRetry={() => setAttempt((value) => value + 1)} />
      )}
      {moviesResource.status === 'success' && <MovieGrid movies={moviesResource.data} />}
    </section>
  );
}
