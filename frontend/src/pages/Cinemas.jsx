import { useEffect, useState } from 'react';
import { getCinemas } from '../api/catalogApi';
import CinemaList from '../components/CinemaList';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import { loadResource } from '../services/catalogResource';
import { useSearchParams } from 'react-router-dom';
import {
  PageHeader,
  FilterBar,
  FormField,
  Input,
  Select,
  AsyncState,
  Button,
} from '../components/ui';
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
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const totalPages = Math.ceil(rows.length / pageSize) || 1;
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [appliedSearch, params]);

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
        showChips={false}
        schema={[
          { key: 'search', label: 'Tìm kiếm' },
          { key: 'city', label: 'Thành phố' },
        ]}
        draft={filters}
        applied={applied}
        applyLabel="Tìm rạp"
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
          <div className="facility-filters__search-row">
            <Input
              type="search"
              placeholder="Nhập tên rạp hoặc địa chỉ..."
              value={filters.search}
              maxLength={100}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <Button type="submit" size="sm">
              Tìm
            </Button>
          </div>
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
            <>
              <CinemaList cinemas={pagedRows} />
              {totalPages > 1 && (
                <nav
                  className="catalog-actions"
                  aria-label="Phân trang danh sách rạp"
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 'var(--space-6)', gap: 'var(--space-3)' }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    ← Trang trước
                  </Button>
                  <span className="catalog-muted">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => {
                      setPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Trang sau →
                  </Button>
                </nav>
              )}
            </>
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
