import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCinemas, getMovieDetail, getShowtimes } from '../api/catalogApi';
import { ErrorState, LoadingState } from '../components/CatalogStates';
import ShowtimeBrowser from '../components/ShowtimeBrowser';
import MovieReviews from '../components/MovieReviews';
import { loadResource, showtimeFilters } from '../services/catalogResource';
import MediaFrame from '../features/customer/MediaFrame';
import { formatDate } from '../utils/dateTime';
import '../features/customer/customer-discovery.css';

export default function MovieDetail() {
  const { movieId } = useParams();
  const [detailState, setDetailState] = useState({ status: 'loading', movieId: null });
  const [cinemas, setCinemas] = useState([]);
  const [cinemaError, setCinemaError] = useState(null);
  const [cinemaId, setCinemaId] = useState('');
  const [date, setDate] = useState('');
  const [showtimeAttempt, setShowtimeAttempt] = useState(0);
  const [showtimesState, setShowtimesState] = useState({ status: 'loading', key: null });

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
  const showtimeResource =
    showtimesState.key === showtimeKey ? showtimesState : { status: 'loading' };
  return (
    <article className="catalog-page movie-detail customer-discovery">
      <Link className="catalog-back" to="/movies">
        ← Danh sách phim
      </Link>
      <section className="movie-detail__intro">
        <div className="movie-detail__poster">
          <MediaFrame src={movie.posterUrl} alt={`Poster ${movie.title}`} priority />
        </div>
        <div className="movie-detail__content">
          <p className="catalog-eyebrow">{movie.status}</p>
          <h1>{movie.title}</h1>
          <p className="catalog-muted">
            {[
              movie.durationMinutes ? `${movie.durationMinutes} phút` : null,
              movie.ageRating,
              movie.releaseDate ? formatDate(movie.releaseDate) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <a className="catalog-button" href="#showtimes-heading">Chọn lịch chiếu</a>
          <dl className="movie-facts">
            {movie.director && (
              <div>
                <dt>Đạo diễn</dt>
                <dd>{movie.director}</dd>
              </div>
            )}
            {movie.language && (
              <div>
                <dt>Ngôn ngữ</dt>
                <dd>{movie.language}</dd>
              </div>
            )}
            {movie.subtitle && (
              <div>
                <dt>Phụ đề</dt>
                <dd>{movie.subtitle}</dd>
              </div>
            )}
            {movie.ageRating && (
              <div>
                <dt>Độ tuổi</dt>
                <dd>{movie.ageRating}</dd>
              </div>
            )}
          </dl>
          {movie.trailerUrl && (
            <a
              className="catalog-button catalog-button--secondary"
              href={movie.trailerUrl}
              target="_blank"
              rel="noreferrer"
            >
              Xem trailer
            </a>
          )}
        </div>
      </section>
      {cinemaError && <ErrorState error={cinemaError} />}
      {!cinemaError && <ShowtimeBrowser cinemas={cinemas} cinemaId={cinemaId} date={date} onCinemaChange={setCinemaId} onDateChange={setDate} state={showtimeResource} onRetry={() => setShowtimeAttempt((n) => n + 1)} />}
      {movie.description && <section className="catalog-section"><h2>Nội dung phim</h2><p className="movie-detail__description">{movie.description}</p></section>}
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
