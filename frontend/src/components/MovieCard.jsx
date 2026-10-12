import { Link } from 'react-router-dom';
import MediaFrame from '../features/customer/MediaFrame';

export default function MovieCard({ movie, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  return (
    <article className="movie-card">
      <Link
        className="movie-card__poster"
        to={`/movies/${movie.id}`}
        aria-label={`Xem chi tiết ${movie.title}`}
      >
        <MediaFrame src={movie.posterUrl} alt={`Poster ${movie.title}`} />
      </Link>
      <div className="movie-card__body">
        <Heading>
          <Link to={`/movies/${movie.id}`}>{movie.title}</Link>
        </Heading>
        <p>
          {[
            movie.durationMinutes ? `${movie.durationMinutes} phút` : null,
            movie.ageRating,
            movie.status,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {movie.genres?.length > 0 && <p className="catalog-muted">{movie.genres.join(' · ')}</p>}
        <Link className="catalog-button catalog-button--secondary" to={`/movies/${movie.id}`}>
          Xem chi tiết & lịch chiếu
        </Link>
      </div>
    </article>
  );
}
