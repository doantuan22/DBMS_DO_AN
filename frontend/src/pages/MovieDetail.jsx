import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getCinemas, getMovieDetail, getShowtimes } from '../api/catalogApi';
import { ErrorState, LoadingState } from '../components/CatalogStates';
import ShowtimeBrowser from '../components/ShowtimeBrowser';
import MovieReviews from '../components/MovieReviews';
import { loadResource, showtimeFilters } from '../services/catalogResource';
import MediaFrame from '../features/customer/MediaFrame';
import { trailerUrl } from '../features/public/mediaPolicy';
import { filmMetadata, synopsisExcerpt } from '../features/public/filmPresentation';
import { formatDate } from '../utils/dateTime';
import '../features/customer/customer-discovery.css';

export default function MovieDetail() {
  const { movieId } = useParams();
  return <MovieDetailView key={movieId} movieId={movieId} />;
}
function MovieDetailView({ movieId }) {
  const location = useLocation();
  const [detailState, setDetailState] = useState({ status: 'loading', movieId: null });
  const [cinemas, setCinemas] = useState([]);
  const [cinemaError, setCinemaError] = useState(null);
  const [cinemaId, setCinemaId] = useState('');
  const [date, setDate] = useState('');
  const [showtimeAttempt, setShowtimeAttempt] = useState(0);
  const [showtimesState, setShowtimesState] = useState({ status: 'loading', key: null });
  useEffect(() => {
    if (location.hash === '#showtimes-heading' && detailState.status === 'success')
      document.getElementById('showtimes-heading')?.scrollIntoView();
  }, [location.hash, detailState.status]);

  useEffect(() => {
    const controller = new AbortController();
    getMovieDetail(movieId, { signal: controller.signal })
      .then((detail) => {
        if (!controller.signal.aborted)
          setDetailState({ status: 'success', data: detail, movieId });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setDetailState({ status: 'error', error, movieId });
      });
    getCinemas({}, { signal: controller.signal })
      .then((rows) => {
        if (!controller.signal.aborted) {
          setCinemas(rows);
          setCinemaError(null);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setCinemaError(error);
      });
    return () => controller.abort();
  }, [movieId]);

  const showtimeKey = `${movieId}\u0000${cinemaId}\u0000${date}\u0000${showtimeAttempt}`;
  useEffect(() => {
    const controller = new AbortController();
    loadResource(() =>
      getShowtimes(movieId, showtimeFilters(cinemaId, date), { signal: controller.signal }),
    ).then((result) => {
      if (!controller.signal.aborted) setShowtimesState({ ...result, key: showtimeKey });
    });
    return () => controller.abort();
  }, [movieId, cinemaId, date, showtimeAttempt, showtimeKey]);

  const movieResource = detailState.movieId === movieId ? detailState : { status: 'loading' };
  if (movieResource.status === 'loading')
    return <LoadingState>Đang tải thông tin phim…</LoadingState>;
  if (movieResource.status === 'error') return <ErrorState error={movieResource.error} />;

  const { movie, genres, actors } = movieResource.data;
  const facts = [
    ['Đạo diễn', movie.director],
    ['Ngôn ngữ', movie.language],
    ['Phụ đề', movie.subtitle],
    ['Độ tuổi', movie.ageRating],
    ['Khởi chiếu theo danh mục', movie.releaseDate ? formatDate(movie.releaseDate) : null],
  ].filter(([, value]) => value);
  const showtimeResource =
    showtimesState.key === showtimeKey ? showtimesState : { status: 'loading' };
  return (
    <article className="catalog-page movie-detail customer-discovery">
      <Link className="catalog-back" to="/movies">
        ← Danh sách phim
      </Link>
      <section className="movie-detail__intro">
        <div className="movie-detail__poster">
          <MediaFrame
            src={movie.posterUrl}
            title={movie.title}
            alt={`Poster ${movie.title}`}
            priority
          />
        </div>
        <div className="movie-detail__content">
          <p className="catalog-eyebrow">{movie.status}</p>
          <h1>{movie.title}</h1>
          <p className="catalog-muted">
            {filmMetadata({ ...movie, genres: genres.map((g) => g.name) }).join(' · ')}
          </p>
          {movie.description && (
            <p className="cp-film-intro-synopsis">{synopsisExcerpt(movie.description)}</p>
          )}
          <div className="catalog-actions">
            <a className="catalog-button" href="#showtimes-heading">
              Chọn lịch chiếu
            </a>
            {trailerUrl(movie.trailerUrl) && (
              <a
                className="catalog-button catalog-button--secondary"
                href={movie.trailerUrl}
                target="_blank"
                rel="noreferrer"
              >
                ▷ Xem trailer
              </a>
            )}
          </div>
        </div>
      </section>
      {cinemaError && <ErrorState error={cinemaError} />}
      {!cinemaError && (
        <ShowtimeBrowser
          cinemas={cinemas}
          cinemaId={cinemaId}
          date={date}
          onCinemaChange={(id) => {
            setCinemaId(id);
            setDate('');
          }}
          onDateChange={setDate}
          state={showtimeResource}
          onRetry={() => setShowtimeAttempt((n) => n + 1)}
        />
      )}
      {facts.length > 0 && (
        <section className="catalog-section">
          <h2>Thông tin phim</h2>
          <dl className="movie-facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {movie.description && (
        <section className="catalog-section">
          <h2>Nội dung phim & nguồn ảnh</h2>
          <p className="movie-detail__description">{movie.description}</p>
        </section>
      )}
      {genres.length > 0 && (
        <section className="catalog-section">
          <h2>Thể loại</h2>
          <div className="catalog-chips">
            {genres.map((genre) => (
              <span className="catalog-chip" key={genre.id}>
                {genre.name}
              </span>
            ))}
          </div>
        </section>
      )}
      {actors.length > 0 && (
        <section className="catalog-section">
          <h2>Diễn viên</h2>
          <div className="actor-list">
            {actors.map((actor) => (
              <article className="actor-card" key={actor.id}>
                <strong>{actor.name}</strong>
                {actor.role && <span>{actor.role}</span>}
                {actor.nationality && <small>{actor.nationality}</small>}
              </article>
            ))}
          </div>
        </section>
      )}
      <MovieReviews movieId={movie.id} />
    </article>
  );
}
