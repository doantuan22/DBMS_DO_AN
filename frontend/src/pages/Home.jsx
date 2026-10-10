import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMovies } from '../api/catalogApi';
import MovieGrid from '../components/MovieGrid';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import { loadResource } from '../services/catalogResource';

export default function Home() {
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loadResource(() => getMovies({}, { signal: controller.signal })).then((result) => {
      if (!controller.signal.aborted) setState({ ...result, attempt });
    });
    return () => controller.abort();
  }, [attempt]);
  const resource = state.attempt === attempt ? state : { status: 'loading' };

  return (
    <div className="catalog-page">
      <section className="catalog-hero">
        <p className="catalog-eyebrow">CINEMA STAR</p>
        <h1>Chọn phim hay, tìm suất chiếu phù hợp</h1>
        <p>Khám phá danh mục phim và lịch chiếu thực tế tại các rạp.</p>
        <Link className="catalog-button" to="/movies">
          Khám phá phim
        </Link>
      </section>
      <section className="catalog-section">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">DANH MỤC</p>
            <h2>Phim</h2>
          </div>
          <Link to="/movies">Xem tất cả</Link>
        </div>
        {resource.status === 'loading' && <LoadingState>Đang tải danh sách phim…</LoadingState>}
        {resource.status === 'empty' && <EmptyState>Hiện chưa có phim trong danh mục.</EmptyState>}
        {resource.status === 'error' && (
          <ErrorState error={resource.error} onRetry={() => setAttempt((value) => value + 1)} />
        )}
        {resource.status === 'success' && <MovieGrid movies={resource.data.slice(0, 8)} />}
      </section>
    </div>
  );
}
