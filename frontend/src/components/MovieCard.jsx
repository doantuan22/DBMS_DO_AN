import { Link } from 'react-router-dom';
import MediaFrame from '../features/customer/MediaFrame';
import { formatDate } from '../utils/dateTime';

export default function MovieCard({ movie, headingLevel = 2, compact = false }) {
  const Heading = `h${headingLevel}`;
  if (compact)
    return (
      <article className="cp-film-announcement">
        <div>
          <p className="catalog-eyebrow">
            {movie.status}
            {movie.status === 'Sắp chiếu' && movie.releaseDate
              ? ` · ${formatDate(movie.releaseDate)}`
              : ''}
          </p>
          <Heading>
            <Link to={`/movies/${movie.id}`}>{movie.title}</Link>
          </Heading>
          <p className="cp-film-announcement__meta">
            {movie.durationMinutes ? `${movie.durationMinutes} phút` : ''}
            {movie.ageRating ? ` · ${movie.ageRating}` : ''} · Chưa có poster
          </p>
        </div>
        <Link
          className="cp-film-announcement__link"
          to={`/movies/${movie.id}`}
          aria-label={`Chi tiết ${movie.title}`}
        >
          Chi tiết <span aria-hidden="true">↗</span>
        </Link>
      </article>
    );
  return (
    <article className="movie-card">
      <div className="movie-card__art">
        <Link
          className="movie-card__poster"
          to={`/movies/${movie.id}`}
          aria-label={`Xem chi tiết ${movie.title}`}
        >
          <MediaFrame src={movie.posterUrl} alt={`Poster ${movie.title}`} />
        </Link>
        {movie.status && <span className="movie-card__status">{movie.status}</span>}
        <Link
          className="movie-card__action"
          to={`/movies/${movie.id}${movie.status === 'Đang chiếu' ? '#showtimes-heading' : ''}`}
        >
          {movie.status === 'Đang chiếu' ? 'Xem lịch chiếu' : 'Chi tiết phim'}{' '}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className="movie-card__body">
        <Heading>
          <Link to={`/movies/${movie.id}`}>{movie.title}</Link>
        </Heading>
        <p>
          {[movie.durationMinutes ? `${movie.durationMinutes} phút` : null, movie.ageRating]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {movie.genres?.length > 0 && <p className="catalog-muted">{movie.genres.join(' · ')}</p>}
      </div>
    </article>
  );
}
