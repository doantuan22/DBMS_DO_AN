import { useEffect, useState } from 'react';
import { getCinemas } from '../api/catalogApi';
import CinemaList from '../components/CinemaList';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import { loadResource } from '../services/catalogResource';

export default function Cinemas() {
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loadResource(() => getCinemas({}, { signal: controller.signal })).then((result) => {
      if (!controller.signal.aborted) setState({ ...result, attempt });
    });
    return () => controller.abort();
  }, [attempt]);
  const resource = state.attempt === attempt ? state : { status: 'loading' };

  return (
    <section className="catalog-page">
      <div className="catalog-section-heading">
        <div>
          <p className="catalog-eyebrow">HỆ THỐNG RẠP</p>
          <h1>Rạp chiếu phim</h1>
        </div>
      </div>
      {resource.status === 'loading' && <LoadingState>Đang tải danh sách rạp…</LoadingState>}
      {resource.status === 'empty' && <EmptyState>Chưa có rạp đang hoạt động.</EmptyState>}
      {resource.status === 'error' && (
        <ErrorState error={resource.error} onRetry={() => setAttempt((value) => value + 1)} />
      )}
      {resource.status === 'success' && <CinemaList cinemas={resource.data} />}
    </section>
  );
}
