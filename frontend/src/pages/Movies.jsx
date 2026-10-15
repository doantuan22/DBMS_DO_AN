import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getGenres, getMovies } from '../api/catalogApi';
import MovieGrid from '../components/MovieGrid';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import { loadResource } from '../services/catalogResource';
import { PageHeader, Input, Select, AsyncState } from '../components/ui';
import { RESOURCE_STATUSES } from '../../../shared/resourceContract.mjs';
import '../features/customer/customer-discovery.css';

const movieStatuses = [
  { label: 'Tất cả phim', value: '' },
  { label: 'Đang chiếu', value: RESOURCE_STATUSES.movies[1] },
  { label: 'Sắp chiếu', value: RESOURCE_STATUSES.movies[0] },
];

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M5.6 5.6 9.9 9.9m4.2 4.2 4.3 4.3M18.4 5.6l-4.3 4.3m-4.2 4.2-4.3 4.3" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M3 11a9 9 0 1 1 2.7 6.4M3 4v7h7" />
    </svg>
  );
}

function popularity(movie) {
  const rating = Number(movie.averageRating) || 0;
  const reviews = Number(movie.reviewCount) || 0;
  return rating * Math.log10(reviews + 1);
}

export default function Movies() {
  return <MovieResults />;
}

function MovieResults() {
  const [params, setParams] = useSearchParams();
  const searchInputRef = useRef(null);
  const appliedSearch = params.get('search') ?? '';
  const routeGenre = params.get('genreId') ?? '';
  const routeStatus = params.get('status') ?? '';
  const [search, setSearch] = useState(appliedSearch);
  const [sortBy, setSortBy] = useState('popular');
  const [genresState, setGenresState] = useState({ status: 'loading' });
  const [moviesState, setMoviesState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [genreAttempt, setGenreAttempt] = useState(0);
  const hasSearchTarget = params.has('search');

  const updateFilterParam = useCallback(
    (key, value) => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      });
    },
    [setParams],
  );

  useEffect(() => {
    setSearch(appliedSearch);
  }, [appliedSearch]);

  useEffect(() => {
    if (hasSearchTarget) searchInputRef.current?.focus();
  }, [hasSearchTarget, appliedSearch]);

  useEffect(() => {
    if (search.trim() === appliedSearch) return undefined;
    const timer = window.setTimeout(() => updateFilterParam('search', search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search, appliedSearch, updateFilterParam]);

  useEffect(() => {
    const controller = new AbortController();
    loadResource(() => getGenres({ signal: controller.signal })).then((result) => {
      if (!controller.signal.aborted) setGenresState(result);
    });
    return () => controller.abort();
  }, [genreAttempt]);

  const filtersKey = `${appliedSearch.trim()}\u0000${routeGenre}\u0000${routeStatus}`;
  const requestKey = `${filtersKey}\u0000${attempt}`;
  useEffect(() => {
    const controller = new AbortController();
    loadResource(
      () =>
        getMovies(
          { search: appliedSearch.trim(), genreId: routeGenre, status: routeStatus },
          { signal: controller.signal },
        ),
    ).then((result) => {
      if (!controller.signal.aborted) setMoviesState({ ...result, key: requestKey });
    });
    return () => controller.abort();
  }, [appliedSearch, routeGenre, routeStatus, attempt, requestKey]);

  const moviesResource = moviesState.key === requestKey ? moviesState : { status: 'loading' };
  const sortedMovies = useMemo(() => {
    if (moviesResource.status !== 'success') return [];
    const movies = [...moviesResource.data];
    if (sortBy === 'popular') {
      return movies.sort((a, b) => popularity(b) - popularity(a));
    }
    if (sortBy === 'newest') {
      return movies.sort((a, b) => (Date.parse(b.releaseDate) || 0) - (Date.parse(a.releaseDate) || 0));
    }
    return movies.sort((a, b) => a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' }));
  }, [moviesResource, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setParams(new URLSearchParams());
  };

  const submitSearch = (event) => {
    event.preventDefault();
    updateFilterParam('search', search.trim());
  };

  const resultCount =
    moviesResource.status === 'success'
      ? moviesResource.data.length
      : moviesResource.status === 'empty'
        ? 0
        : null;

  return (
    <section className="catalog-page customer-discovery cp-catalog cp-movies-page">
      <PageHeader
        title="Phim tại CinemaStar"
        description="Một câu chuyện mới đang chờ bạn trên màn ảnh lớn."
      />

      <nav className="cp-movies-tabs" aria-label="Lọc phim theo trạng thái">
        {movieStatuses.map((item) => (
          <button
            key={item.label}
            type="button"
            className="cp-movies-tabs__item"
            aria-pressed={routeStatus === item.value}
            onClick={() => updateFilterParam('status', item.value)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="cp-movies-filterbar">
        <form className="cp-movies-search" role="search" onSubmit={submitSearch}>
          <SearchIcon />
          <Input
            ref={searchInputRef}
            type="text"
            value={search}
            maxLength={100}
            aria-label="Tìm tên phim hoặc đạo diễn"
            placeholder="Tìm tên phim hoặc đạo diễn..."
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              type="button"
              className="cp-movies-search__clear"
              aria-label="Xóa nội dung tìm kiếm"
              onClick={() => {
                setSearch('');
                updateFilterParam('search', '');
                searchInputRef.current?.focus();
              }}
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </form>

        <div className="cp-movies-genre">
          <FilmIcon />
          <Select
            aria-label="Lọc theo thể loại"
            value={routeGenre}
            disabled={genresState.status !== 'success'}
            onChange={(event) => updateFilterParam('genreId', event.target.value)}
          >
            <option value="">Tất cả thể loại</option>
            {genresState.status === 'success' &&
              genresState.data.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
          </Select>
        </div>

        <button type="button" className="cp-movies-reset" onClick={clearFilters}>
          <ResetIcon />
          <span>Xóa bộ lọc</span>
        </button>
      </div>

      {genresState.status === 'error' && (
        <AsyncState
          status="error"
          error={genresState.error}
          errorMessage="Không thể tải danh sách thể loại."
          onRetry={() => setGenreAttempt((value) => value + 1)}
        />
      )}

      <section className="cp-movies-results" aria-labelledby="cp-movies-results-title">
        <header className="cp-movies-results__header">
          <div>
            <h2 id="cp-movies-results-title">Khám phá phim</h2>
            <p aria-live="polite">
              {resultCount !== null
                ? `${resultCount} bộ phim`
                : moviesResource.status === 'error'
                  ? 'Không thể tải danh sách phim'
                  : 'Đang tải danh sách phim…'}
            </p>
          </div>
          <div className="cp-movies-sort">
            <span id="cp-movies-sort-label">Sắp xếp:</span>
            <Select
              aria-labelledby="cp-movies-sort-label"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="popular">Phổ biến</option>
              <option value="newest">Mới nhất</option>
              <option value="title">Tên phim A-Z</option>
            </Select>
          </div>
        </header>

        {moviesResource.status === 'loading' && <LoadingState>Đang tải danh sách phim…</LoadingState>}
        {moviesResource.status === 'empty' && <EmptyState>Không tìm thấy phim phù hợp.</EmptyState>}
        {moviesResource.status === 'error' && (
          <ErrorState error={moviesResource.error} onRetry={() => setAttempt((value) => value + 1)} />
        )}
        {moviesResource.status === 'success' && <MovieGrid movies={sortedMovies} />}
      </section>
    </section>
  );
}
