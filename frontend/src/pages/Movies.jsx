import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getGenres, getMovies } from '../api/catalogApi';
import MovieGrid from '../components/MovieGrid';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import { loadResource } from '../services/catalogResource';
import { PageHeader, FilterBar, FormField, Input, Select, AsyncState } from '../components/ui';
import { RESOURCE_STATUSES } from '../../../shared/resourceContract.mjs';
import '../features/customer/customer-discovery.css';

export default function Movies() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [genreId, setGenreId] = useState(params.get('genreId') ?? '');
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [appliedSearch, setAppliedSearch] = useState('');
  const routeGenre = params.get('genreId') ?? '', routeStatus = params.get('status') ?? '';
  const applied = useMemo(() => ({ search: appliedSearch, genreId: routeGenre, status: routeStatus }), [appliedSearch, routeGenre, routeStatus]);
  const [genresState, setGenresState] = useState({ status: 'loading' });
  const [moviesState, setMoviesState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [genreAttempt, setGenreAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    loadResource(() => getGenres({ signal: controller.signal })).then((result) => {
      if (!controller.signal.aborted) setGenresState(result);
    });
    return () => controller.abort();
  }, [genreAttempt]);

  const filtersKey = `${applied.search.trim()}\u0000${applied.genreId}\u0000${applied.status}`;
  const requestKey = `${filtersKey}\u0000${attempt}`;
  useEffect(() => {
    const controller = new AbortController();
      loadResource(() =>
        getMovies({ search: applied.search.trim(), genreId: applied.genreId, status: applied.status }, { signal: controller.signal }),
      ).then((result) => {
        if (!controller.signal.aborted) setMoviesState({ ...result, key: requestKey });
      });
    return () => {
      controller.abort();
    };
  }, [applied, attempt, requestKey]);
  const moviesResource = moviesState.key === requestKey ? moviesState : { status: 'loading' };

  return (
    <section className="catalog-page customer-discovery">
      <PageHeader title="Danh sách phim" description="Tìm câu chuyện bạn muốn xem, rồi chọn rạp và lịch chiếu phù hợp." breadcrumbs={[{ label: 'Trang chủ', to: '/' }, { label: 'Phim' }]} />
      <FilterBar schema={[{ key: 'search', label: 'Tìm kiếm' }, { key: 'genreId', label: 'Thể loại', format: (id) => genresState.data?.find((g) => String(g.id) === id)?.name ?? 'Thể loại đã chọn' }, { key: 'status', label: 'Trạng thái' }]} draft={{ search, genreId, status }} applied={applied} onApply={() => { setAppliedSearch(search); setParams(Object.fromEntries(Object.entries({ genreId, status }).filter(([, v]) => v))); }} onReset={() => { setSearch(''); setGenreId(''); setStatus(''); setAppliedSearch(''); setParams({}); }}>
        <FormField label="Tìm phim hoặc đạo diễn"><Input type="search" value={search} maxLength={100} onChange={(e) => setSearch(e.target.value)} /></FormField><FormField label="Thể loại"><Select value={genreId} disabled={genresState.status !== 'success'} onChange={(e) => setGenreId(e.target.value)}><option value="">Tất cả thể loại</option>{genresState.status === 'success' && genresState.data.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></FormField><FormField label="Trạng thái phim"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Tất cả trạng thái</option>{RESOURCE_STATUSES.movies.map((s) => <option key={s}>{s}</option>)}</Select></FormField>
      </FilterBar>
      {genresState.status === 'loading' && (
        <p className="catalog-muted" role="status">
          Đang tải thể loại…
        </p>
      )}
      {genresState.status === 'error' && (
        <AsyncState status="error" error={genresState.error} errorMessage="Không thể tải danh sách thể loại." onRetry={() => setGenreAttempt((value) => value + 1)} />
      )}
      {moviesResource.status === 'loading' && <LoadingState>Đang tải danh sách phim…</LoadingState>}
      {moviesResource.status === 'empty' && <EmptyState>Không tìm thấy phim phù hợp.</EmptyState>}
      {moviesResource.status === 'error' && (
        <ErrorState error={moviesResource.error} onRetry={() => setAttempt((value) => value + 1)} />
      )}
      {moviesResource.status === 'success' && <><p role="status">{moviesResource.data.length} phim theo bộ lọc</p><MovieGrid movies={moviesResource.data} /></>}
    </section>
  );
}
