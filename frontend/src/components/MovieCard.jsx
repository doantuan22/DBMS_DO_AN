import { Link } from 'react-router-dom';

export default function MovieCard({ movie }) {
  return (
    <article className="movie-card">
      <Link className="movie-card__poster" to={`/movies/${movie.id}`} aria-label={`Xem chi tiết ${movie.title}`}>
        {movie.posterUrl && <img src={movie.posterUrl} alt={`Poster ${movie.title}`} loading="lazy" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling.hidden = false; }} />}
        <span className="movie-card__fallback" hidden={Boolean(movie.posterUrl)}>Chưa có poster</span>
      </Link>
      <div className="movie-card__body">
        <h2><Link to={`/movies/${movie.id}`}>{movie.title}</Link></h2>
        <p>{[movie.durationMinutes ? `${movie.durationMinutes} phút` : null, movie.ageRating, movie.status].filter(Boolean).join(' · ')}</p>
        {movie.genres?.length > 0 && <p className="catalog-muted">{movie.genres.join(' · ')}</p>}
        <Link className="catalog-button catalog-button--secondary" to={`/movies/${movie.id}`}>Xem chi tiết</Link>
      </div>
    </article>
  );
}
