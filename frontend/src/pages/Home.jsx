import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMovies, getMovieDetail, getCinemas, getGenres } from '../api/catalogApi';
import CinemaList from '../components/CinemaList';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import { loadResource } from '../services/catalogResource';
import { movieGroups } from '../features/customer/discoveryModel';
import FeaturedBillboard from '../features/public/FeaturedBillboard';
import FilmRail from '../features/public/FilmRail';
import HomeSchedule from '../features/public/HomeSchedule';
import '../features/customer/customer-discovery.css';

const moviesLoader = (options) => getMovies({}, options);
const cinemasLoader = (options) => getCinemas({}, options);
function useCollection(loader) {
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loadResource(() => loader({ signal: controller.signal })).then((result) => {
      if (!controller.signal.aborted) setState({ ...result, attempt });
    });
    return () => controller.abort();
  }, [loader, attempt]);
  return [
    state.attempt === attempt ? state : { status: 'loading' },
    () => setAttempt((n) => n + 1),
  ];
}
export default function Home() {
  const [movies, retryMovies] = useCollection(moviesLoader);
  const [cinemas, retryCinemas] = useCollection(cinemasLoader);
  const [genres, retryGenres] = useCollection(getGenres);
  const rows = movies.status === 'success' ? movies.data : [];
  const featured = rows.find((m) => m.status === 'Đang chiếu') ?? rows[0];
  const featuredMovieId = featured?.id;
  const [detail, setDetail] = useState(null);
  const [detailAttempt, setDetailAttempt] = useState(0);
  useEffect(() => {
    if (!featuredMovieId) return undefined;
    const controller = new AbortController();
    getMovieDetail(featuredMovieId, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setDetail(data.movie);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setDetail({ id: featuredMovieId, error });
      });
    return () => controller.abort();
  }, [featuredMovieId, detailAttempt]);
  const genreNames = new Set(rows.flatMap((m) => m.genres ?? []));
  const visibleGenres =
    genres.status === 'success' ? genres.data.filter((g) => genreNames.has(g.name)) : [];
  return (
    <div className="catalog-page customer-discovery cp-home">
      <FeaturedBillboard
        movie={featured}
        description={featured && detail?.id === featured.id ? detail.description : null}
      />
      {featured && detail?.id === featured.id && detail.error && (
        <div className="cp-section">
          <ErrorState error={detail.error} onRetry={() => setDetailAttempt((value) => value + 1)} />
        </div>
      )}
      {movies.status === 'loading' && (
        <div className="cp-section">
          <LoadingState>Đang tải danh sách phim…</LoadingState>
        </div>
      )}
      {movies.status === 'error' && (
        <div className="cp-section">
          <ErrorState error={movies.error} onRetry={retryMovies} />
        </div>
      )}
      {movies.status === 'empty' && (
        <div className="cp-section">
          <EmptyState>Hiện chưa có phim trong danh mục.</EmptyState>
        </div>
      )}
      {featured && <HomeSchedule key={featured.id} movie={featured} />}
      {movieGroups(rows).map(([label, films]) => (
        <FilmRail
          key={label}
          label={label}
          movies={films}
          to={`/movies${['Đang chiếu', 'Sắp chiếu'].includes(label) ? `?status=${encodeURIComponent(label)}` : ''}`}
        />
      ))}
      <section className="cp-section cp-home-cinemas" aria-labelledby="home-cinemas-title">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">KHÔNG GIAN ĐIỆN ẢNH</p>
            <h2 id="home-cinemas-title">Hẹn nhau tại CinemaStar</h2>
          </div>
          <Link to="/cinemas">Tất cả rạp ↗</Link>
        </div>
        {cinemas.status === 'loading' && <LoadingState>Đang tải rạp…</LoadingState>}
        {cinemas.status === 'error' && <ErrorState error={cinemas.error} onRetry={retryCinemas} />}
        {cinemas.status === 'empty' && <EmptyState>Chưa có rạp trong danh mục.</EmptyState>}
        {cinemas.status === 'success' && <CinemaList cinemas={cinemas.data.slice(0, 3)} />}
      </section>
      {(visibleGenres.length > 0 || genres.status === 'error') && (
        <section className="cp-section cp-home-genres" aria-labelledby="home-genres-title">
          <div className="catalog-section-heading">
            <div>
              <p className="catalog-eyebrow">MỖI THỂ LOẠI, MỘT THẾ GIỚI</p>
              <h2 id="home-genres-title">Bạn muốn xem gì?</h2>
            </div>
          </div>
          {genres.status === 'error' ? (
            <ErrorState error={genres.error} onRetry={retryGenres} />
          ) : (
            <div className="cp-genre-grid">
              {visibleGenres.map((genre) => (
                <Link key={genre.id} to={`/movies?genreId=${genre.id}`}>
                  <span>{genre.name}</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
