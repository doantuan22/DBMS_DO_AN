import { useEffect, useState } from 'react';
import { getCinemas } from '../api/catalogApi';
import CinemaList from '../components/CinemaList';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import { loadResource } from '../services/catalogResource';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, FilterBar, FormField, Input, Select, AsyncState } from '../components/ui';
import { cinemaView } from '../features/customer/discoveryModel';
import '../features/customer/customer-discovery.css';

export default function Cinemas() {
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({ search: '', city: params.get('city') ?? '' }),
    [appliedSearch, setAppliedSearch] = useState('');
  const applied = { search: appliedSearch, city: params.get('city') ?? '' };
  useEffect(() => {
    const controller = new AbortController();
    loadResource(() => getCinemas({}, { signal: controller.signal })).then((result) => {
      if (!controller.signal.aborted) setState({ ...result, attempt });
    });
    return () => controller.abort();
  }, [attempt]);
  const resource = state.attempt === attempt ? state : { status: 'loading' };
  const rows = resource.status === 'success' ? cinemaView(resource.data, applied) : [];
  const cities =
    resource.status === 'success'
      ? [...new Set(resource.data.map((r) => r.city).filter(Boolean))]
      : [];

  return (
    <section className="catalog-page customer-discovery cp-catalog cp-cinemas">
      <PageHeader
        title="Rạp chiếu phim"
        description="Chọn không gian xem phim, khám phá hình ảnh và lịch chiếu tại rạp."
        breadcrumbs={[{ label: 'Trang chủ', to: '/' }, { label: 'Rạp chiếu' }]}
      />
      <FilterBar
        schema={[
          { key: 'search', label: 'Tìm kiếm' },
          { key: 'city', label: 'Thành phố' },
        ]}
        draft={filters}
        applied={applied}
        onApply={() => {
          setAppliedSearch(filters.search);
          setParams(filters.city ? { city: filters.city } : {});
        }}
        onReset={() => {
          const empty = { search: '', city: '' };
          setFilters(empty);
          setAppliedSearch('');
          setParams({});
        }}
      >
        <FormField label="Tên rạp / địa chỉ">
          <Input
            type="search"
            value={filters.search}
            maxLength={100}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </FormField>
        <FormField label="Thành phố">
          <Select
            value={filters.city}
            disabled={resource.status !== 'success'}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          >
            <option value="">Tất cả thành phố</option>
            {cities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </Select>
        </FormField>
      </FilterBar>
      {resource.status === 'loading' && <LoadingState>Đang tải danh sách rạp…</LoadingState>}
      {resource.status === 'empty' && <EmptyState>Chưa có rạp đang hoạt động.</EmptyState>}
      {resource.status === 'error' && (
        <ErrorState error={resource.error} onRetry={() => setAttempt((value) => value + 1)} />
      )}
      {resource.status === 'success' && (
        <>
          <p role="status">{rows.length} rạp theo bộ lọc · toàn bộ danh sách đang hoạt động</p>
          {rows.length ? (
            <CinemaList cinemas={rows} />
          ) : (
            <AsyncState
              status="empty"
              emptyMessage="Không tìm thấy rạp phù hợp. Thử đổi tên hoặc thành phố."
            />
          )}
        </>
      )}
    </section>
  );
}
