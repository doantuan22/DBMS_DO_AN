import MovieCard from './MovieCard';
import { recordMediaUrl } from '../features/public/mediaPolicy';

export default function MovieGrid({ movies, headingLevel = 2 }) {
  const artwork = movies.filter((movie) => recordMediaUrl(movie.posterUrl));
  const missing = movies.filter((movie) => !recordMediaUrl(movie.posterUrl));
  return (
    <div className="cp-movie-collection">
      {artwork.length > 0 && (
        <div className="movie-grid">
          {artwork.map((movie) => (
            <MovieCard key={movie.id} movie={movie} headingLevel={headingLevel} />
          ))}
        </div>
      )}
      {missing.length > 0 && (
        <div className="cp-film-announcements" role="group" aria-label="Phim chưa có poster">
          {missing.map((movie) => (
            <MovieCard key={movie.id} movie={movie} headingLevel={headingLevel} compact />
          ))}
        </div>
      )}
    </div>
  );
}
