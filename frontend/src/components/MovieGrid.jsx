import MovieCard from './MovieCard';

export default function MovieGrid({ movies, headingLevel = 2 }) {
  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} headingLevel={headingLevel} />
      ))}
    </div>
  );
}
