import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from '../../components/MovieCard';
export default function FilmRail({ label, movies, to }) {
  const ref = useRef(null);
  const [scroll, setScroll] = useState({ previous: false, next: false });
  useEffect(() => {
    const element = ref.current;
    const update = () =>
      setScroll({
        previous: element.scrollLeft > 2,
        next: element.scrollLeft + element.clientWidth < element.scrollWidth - 2,
      });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    element.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', update);
    };
  }, [movies]);
  const move = (direction) =>
    ref.current.scrollBy({
      left: direction * ref.current.clientWidth * 0.85,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  return (
    <section className="cp-section cp-film-section" aria-label={label}>
      <div className="catalog-section-heading">
        <h2>{label}</h2>
        <div className="cp-rail-actions">
          <Link to={to}>
            Xem tất cả <span aria-hidden="true">↗</span>
          </Link>
          {(scroll.previous || scroll.next) && (
            <>
              <button
                type="button"
                aria-label={`Cuộn ${label} về trước`}
                disabled={!scroll.previous}
                onClick={() => move(-1)}
              >
                ←
              </button>
              <button
                type="button"
                aria-label={`Cuộn ${label} tiếp theo`}
                disabled={!scroll.next}
                onClick={() => move(1)}
              >
                →
              </button>
            </>
          )}
        </div>
      </div>
      <div ref={ref} className="cp-film-rail" style={{ '--cp-available-films': movies.length }}>
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
