import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdminWorkspace } from '../admin-workspace/AdminWorkspaceContext.js';
import { AdminWorkspaceProvider } from '../admin-workspace/AdminWorkspaceContext.jsx';
import { resourceAdapter } from './resourceAdapter';
import { createResourceController } from './resourceController';
import {
  resourceDefinitions,
  resourceFields,
  resourceView,
  movieRelations,
  linkedMovies,
  money,
  discount,
} from './resourceModel';
import { formatDate, formatDateTime } from '../../utils/dateTime';
import {
  RESOURCE_STATUSES,
  PRODUCT_TYPES,
  DISCOUNT_TYPES,
} from '../../../../shared/resourceContract.mjs';
import { ManagerAssignmentsContext } from '../../components/ManagerAssignmentFields';
import {
  PageHeader,
  FilterBar,
  ResourceTable,
  ResourceSelect,
  SearchableSelect,
  FormField,
  Input,
  Select,
  Button,
  Dialog,
  ConfirmDialog,
  AsyncState,
  StatusBadge,
} from '../../components/ui';
import Forbidden from '../../pages/Forbidden';
import './admin-resources.css';
import ProductFilters from './ProductFilters';

export default function AdminResourceScreen({ kind }) {
  const { user } = useAuth(),
    store = useAdminWorkspace();
  const adapter = resourceAdapter(kind, user);
  if (!adapter.allowed) return <Forbidden />;
  if (!store)
    return (
      <AdminWorkspaceProvider>
        <AdminResourceScreen kind={kind} />
      </AdminWorkspaceProvider>
    );
  return (
    <ResourceWorkspace
      key={`${kind}:${user.userId}:${user.permissions
        .map((p) => p.code)
        .sort()
        .join(',')}`}
      kind={kind}
      adapter={adapter}
      store={store}
    />
  );
}
function ResourceWorkspace({ kind, adapter, store }) {
  const [params, setParams] = useSearchParams(),
    query = params.toString();
  const queryRef = useRef(query);
  useLayoutEffect(() => {
    queryRef.current = query;
  }, [query]);
  const onQueryChange = useCallback(
    (next, options) => {
      if (queryRef.current !== next) {
        queryRef.current = next;
        setParams(next, options);
      }
    },
    [setParams],
  );
  // Initializer only stores the callback; it does not read a ref during render.
  // oxlint-disable-next-line react/refs
  const [controller] = useState(() =>
    createResourceController({ adapter, store, initialQuery: query, onQueryChange }),
  );
  const state = useSyncExternalStore(
      controller.subscribe,
      controller.getSnapshot,
      controller.getSnapshot,
    ),
    previousQuery = useRef(query);
  useEffect(() => {
    void controller.start();
    return () => controller.dispose();
  }, [controller]);
  useEffect(() => {
    if (query !== previousQuery.current) {
      previousQuery.current = query;
      controller.syncQuery(query);
    }
  }, [query, controller]);
  return <ResourceView kind={kind} state={state} controller={controller} can={adapter.can} />;
}

export function ResourceView({ kind, state, controller, can = () => false }) {
  const definition = resourceDefinitions[kind],
    view = resourceView(state, kind),
    busy = state.pending;
  const roles = state.lookups.roles?.rows ?? [
    ...new Map(
      state.resource.rows.map((r) => [r.VaiTroID, { id: r.VaiTroID, label: r.TenVaiTro }]),
    ).values(),
  ];
  const managers =
    state.lookups.managers?.status === 'success'
      ? state.lookups.managers.rows
      : [
          ...new Map(
            state.resource.rows.map((r) => [
              r.NguoiDungID,
              { id: r.NguoiDungID, label: r.TenQuanLy },
            ]),
          ).values(),
        ];
  const cinemas =
    state.lookups.cinemas?.status === 'success'
      ? state.lookups.cinemas.rows
      : [
          ...new Map(
            state.resource.rows.map((r) => [r.RapID, { id: r.RapID, label: r.TenRap }]),
          ).values(),
        ];
  const filterLookupNames = {
    roleId: 'roles',
    userId: 'managers',
    cinemaId: 'cinemas',
    genreId: 'genres',
    movieId: 'movies',
  };
  const namedFilter = (key, label, options) => {
    const lookupName = filterLookupNames[key];
    const lookup = lookupName ? (state.lookups[lookupName] ?? { status: 'loading' }) : null;
    const lookupPending = lookup && lookup.status !== 'success';
    // PA-3b: single-box searchable select. Click opens the full list, typing filters inline.
    const searchable = ['movieId'].includes(key);
    if (searchable) {
      return (
        <FormField label={label}>
          <SearchableSelect
            ariaLabel={label}
            value={state.filters[key]}
            disabled={busy || lookupPending}
            placeholder={
              lookup?.status === 'loading'
                ? 'Đang tải danh mục…'
                : lookup?.status === 'error'
                  ? 'Danh mục chưa tải được'
                  : options.length
                    ? `Chọn ${label.toLocaleLowerCase()}`
                    : 'Chưa có lựa chọn'
            }
            searchPlaceholder={`Gõ để lọc ${label.toLocaleLowerCase()}...`}
            allLabel="Tất cả"
            options={options.map((r) => ({ value: r.id, label: r.label }))}
            emptyMessage="Chưa có lựa chọn."
            onChange={(value) => controller.setFilters({ [key]: value })}
          />
        </FormField>
      );
    }
    const emptyLabel =
      lookup?.status === 'loading'
        ? 'Đang tải danh mục…'
        : lookup?.status === 'error'
          ? 'Danh mục chưa tải được'
          : options.length
            ? 'Tất cả'
            : 'Chưa có lựa chọn';
    return (
      <FormField label={label}>
        <Select
          value={state.filters[key]}
          disabled={busy || lookupPending}
          onChange={(e) => controller.setFilters({ [key]: e.target.value })}
        >
          <option value="">{emptyLabel}</option>
          {options.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </Select>
      </FormField>
    );
  };
  const statusColumn = {
    key: 'TrangThai',
    label: 'Trạng thái',
    render: (row) => <StatusBadge status={row.TrangThai} />,
  };
  const catalog = ['movies', 'actors', 'genres'].includes(kind);
  // PA-3b single-box pages: keep search capability, merge into exactly one searchable select.
  const singleBoxKinds = ['actors'];
  const isSingleBox = singleBoxKinds.includes(kind);
  const singleBoxOptions =
    kind === 'actors'
      ? (state.resource.status === 'success'
          ? state.resource.rows.map((row) => ({
              value: String(row[definition.id]),
              label: String(definition.name(row)),
            }))
          : []
        ).filter(
          (option, index, list) => list.findIndex((item) => item.value === option.value) === index,
        )
      : [];
  const singleBoxLabel = kind === 'actors' ? 'Diễn viên' : definition.title;
  const columns =
    kind === 'users'
      ? [
          { key: 'HoTen', label: 'Họ tên', render: (row) => <strong>{row.HoTen}</strong> },
          { key: 'Email', label: 'Email', className: 'admin-resource__wrap' },
          {
            key: 'SoDienThoai',
            label: 'Số điện thoại',
            className: 'admin-resource__secondary-column',
          },
          { key: 'TenVaiTro', label: 'Vai trò' },
          {
            key: 'TrangThai',
            label: 'Trạng thái',
            render: (row) => <StatusBadge status={row.TrangThai} />,
          },
        ]
      : kind === 'assignments'
        ? [
            {
              key: 'manager',
              label: 'Manager',
              render: (row) => (
                <>
                  <strong>{row.TenQuanLy}</strong>
                  <span className="admin-resource__secondary-text">{row.Email}</span>
                </>
              ),
            },
            { key: 'TenRap', label: 'Rạp phân công' },
            {
              key: 'period',
              label: 'Thời gian phân công',
              render: (row) => (
                <>
                  {formatDate(row.NgayBatDau)}
                  <br />
                  {row.NgayKetThuc ? formatDate(row.NgayKetThuc) : 'Không có ngày kết thúc'}
                </>
              ),
            },
            {
              key: 'TrangThai',
              label: 'Trạng thái',
              render: (row) => <StatusBadge status={row.TrangThai} />,
            },
          ]
        : kind === 'movies'
          ? [
              {
                key: 'movie',
                label: 'Phim',
                render: (r) => (
                  <div className="admin-resource__media">
                    <ResourceImage url={r.PosterURL} label={r.TenPhim} />
                    <span>
                      <strong>{r.TenPhim}</strong>
                      <span className="admin-resource__secondary-text">
                        {r.DaoDien || 'Chưa có đạo diễn'} · {r.DoTuoi}
                      </span>
                    </span>
                  </div>
                ),
              },
              {
                key: 'genres',
                label: 'Thể loại',
                render: (r) => (
                  <MovieNames row={r} lookup={state.lookups.genres} relation="genreIds" />
                ),
              },
              { key: 'ThoiLuong', label: 'Thời lượng', render: (r) => `${r.ThoiLuong} phút` },
              {
                key: 'NgayKhoiChieu',
                label: 'Khởi chiếu',
                render: (r) => formatDate(r.NgayKhoiChieu),
              },
              statusColumn,
            ]
          : kind === 'products'
            ? [
                {
                  key: 'product',
                  label: 'Sản phẩm',
                  render: (r) => (
                    <div className="admin-resource__media">
                      <ResourceImage url={r.HinhAnh} label={r.TenSanPham} />
                      <strong>{r.TenSanPham}</strong>
                    </div>
                  ),
                },
                { key: 'LoaiSanPham', label: 'Loại' },
                { key: 'Gia', label: 'Giá bán', render: (r) => money(r.Gia) },
                statusColumn,
              ]
            : kind === 'promotions'
              ? [
                  {
                    key: 'MaCode',
                    label: 'Khuyến mãi',
                    render: (r) => (
                      <>
                        <strong>{r.MaCode}</strong>
                        <span className="admin-resource__secondary-text">{r.MoTa}</span>
                      </>
                    ),
                  },
                  { key: 'discount', label: 'Mức giảm', render: discount },
                  {
                    key: 'conditions',
                    label: 'Điều kiện',
                    render: (r) => (
                      <>
                        Đơn từ {money(r.DonHangToiThieu)}
                        <span className="admin-resource__secondary-text">
                          {r.GiamToiDa == null
                            ? 'Không đặt trần giảm'
                            : `Giảm tối đa ${money(r.GiamToiDa)}`}
                        </span>
                      </>
                    ),
                  },
                  {
                    key: 'period',
                    label: 'Thời gian (Việt Nam)',
                    render: (r) => (
                      <>
                        {formatDateTime(r.NgayBatDau)}
                        <br />
                        {formatDateTime(r.NgayKetThuc)}
                      </>
                    ),
                  },
                  {
                    key: 'quota',
                    label: 'Lượt đã dùng / tổng',
                    render: (r) => `${r.SoLuongDaDung} / ${r.SoLuong}`,
                  },
                  statusColumn,
                ]
              : [
                  {
                    key: 'name',
                    label: kind === 'actors' ? 'Diễn viên' : 'Thể loại',
                    render: (r) => <strong>{definition.name(r)}</strong>,
                  },
                  {
                    key: 'links',
                    label: 'Phim liên kết',
                    render: (r) => {
                      const movies = linkedMovies(kind, r, state.lookups.movies);
                      return movies === null ? 'Chưa tra cứu được' : `${movies.length} phim`;
                    },
                  },
                  ...(kind === 'actors'
                    ? [
                        {
                          key: 'QuocTich',
                          label: 'Quốc tịch',
                          className: 'admin-resource__secondary-column',
                          render: (r) => r.QuocTich || '—',
                        },
                        {
                          key: 'NgaySinh',
                          label: 'Ngày sinh',
                          className: 'admin-resource__secondary-column',
                          render: (r) => (r.NgaySinh ? formatDate(r.NgaySinh) : 'Chưa có dữ liệu'),
                        },
                      ]
                    : []),
                ];
  columns.push({
    key: 'actions',
    label: 'Thao tác',
    render: (row) => (
      <div className="admin-resource__actions">
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          aria-label={`Xem ${definition.name(row)}`}
          onClick={() => controller.select(row)}
        >
          Xem
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          aria-label={`Sửa ${definition.name(row)}`}
          onClick={() => controller.openEditor(row)}
        >
          {kind === 'users'
            ? 'Đổi trạng thái'
            : kind === 'assignments'
              ? 'Sửa / Chuyển rạp'
              : 'Sửa'}
        </Button>
        {kind === 'movies' && (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            aria-label={`Diễn viên ${definition.name(row)}`}
            onClick={() => controller.openCast(row)}
          >
            Diễn viên
          </Button>
        )}
        {definition.removable && (
          <Button
            variant="danger"
            size="sm"
            disabled={busy}
            aria-label={`Xóa ${definition.name(row)}`}
            onClick={() => controller.requestDelete(row)}
          >
            Xóa
          </Button>
        )}
      </div>
    ),
  });
  const filterOptions = {
    roleId: state.lookups.roles?.status === 'success' ? state.lookups.roles.rows : [],
    userId: state.lookups.managers?.status === 'success' ? state.lookups.managers.rows : [],
    cinemaId: state.lookups.cinemas?.status === 'success' ? state.lookups.cinemas.rows : [],
    genreId: state.lookups.genres?.status === 'success' ? state.lookups.genres.rows : [],
    movieId: state.lookups.movies?.status === 'success' ? state.lookups.movies.rows : [],
    type: PRODUCT_TYPES.map((v) => ({ id: v, label: v })),
    discountType: DISCOUNT_TYPES.map((v) => ({ id: v, label: v })),
  };
  const filterLabels = {
    search: 'Tìm kiếm',
    roleId: 'Vai trò',
    userId: 'Manager',
    cinemaId: 'Rạp',
    effectiveOn: 'Trong kỳ ngày',
    genreId: 'Thể loại',
    movieId: 'Phim',
    status: 'Trạng thái',
    minDuration: 'Phút tối thiểu',
    maxDuration: 'Phút tối đa',
    minPrice: 'Giá tối thiểu',
    maxPrice: 'Giá tối đa',
    type: 'Loại sản phẩm',
    discountType: 'Loại giảm giá',
    fromDate: 'Giao kỳ từ',
    toDate: 'Giao kỳ đến',
  };
  const schema = Object.keys(definition.filters).map((key) => ({
    key,
    label: filterLabels[key],
    ...(filterOptions[key]
      ? {
          format: (id) =>
            filterOptions[key].find((r) => String(r.id) === id)?.label ??
            `${filterLabels[key]} đã chọn`,
        }
      : key === 'effectiveOn'
        ? { format: formatDate }
        : {}),
  }));
  const filterLookupErrors = Object.keys(definition.filters)
    .map((key) => {
      const lookupName = filterLookupNames[key];
      return lookupName ? [key, state.lookups[lookupName]] : null;
    })
    .filter((entry) => entry?.[1]?.status === 'error');
  const extraFilterCount = Object.keys(definition.filters).filter((key) => key !== 'search').length;
  const appliedExtraFilterCount = Object.entries(state.applied).filter(
    ([key, value]) => key !== 'search' && value !== '' && value != null,
  ).length;
  const renderAdditionalFilters = () => (
    <>
      {Object.entries(filterOptions)
        .filter(([key]) => Object.hasOwn(definition.filters, key))
        .map(([key, options]) => (
          <div key={key}>{namedFilter(key, `${filterLabels[key]} lọc`, options)}</div>
        ))}
      {Object.hasOwn(definition.filters, 'effectiveOn') && (
        <FormField label="Trong kỳ phân công ngày">
          <Input
            type="date"
            value={state.filters.effectiveOn}
            disabled={busy}
            onChange={(e) => controller.setFilters({ effectiveOn: e.target.value })}
          />
        </FormField>
      )}
      {['minDuration', 'maxDuration', 'minPrice', 'maxPrice']
        .filter((key) => Object.hasOwn(definition.filters, key))
        .map((key) => (
          <FormField key={key} label={filterLabels[key]}>
            <Input
              type="number"
              min={key.includes('Price') ? 0 : 1}
              step={key.includes('Price') ? '0.01' : 1}
              value={state.filters[key]}
              disabled={busy}
              onChange={(e) => controller.setFilters({ [key]: e.target.value })}
            />
          </FormField>
        ))}
      {['fromDate', 'toDate']
        .filter((key) => Object.hasOwn(definition.filters, key))
        .map((key) => (
          <FormField
            key={key}
            label={filterLabels[key]}
            hint="Lọc khuyến mãi có khoảng hiệu lực giao với kỳ ngày Việt Nam đã chọn."
          >
            <Input
              type="date"
              value={state.filters[key]}
              disabled={busy}
              onChange={(e) => controller.setFilters({ [key]: e.target.value })}
            />
          </FormField>
        ))}
      {RESOURCE_STATUSES[kind] &&
        namedFilter(
          'status',
          'Trạng thái lọc',
          RESOURCE_STATUSES[kind].map((status) => ({ id: status, label: status })),
        )}
    </>
  );
  const confirmation = state.confirmation,
    editor = state.editor;
  const from = confirmation?.row?.TenRap,
    target =
      confirmation?.body &&
      state.lookups.cinemas?.rows.find((r) => r.id === confirmation.body.cinemaId)?.label;
  let title = 'Bỏ thay đổi chưa lưu?',
    description = 'Bản nháp đang mở sẽ bị bỏ.';
  if (confirmation?.kind === 'save') {
    title =
      kind === 'users'
        ? 'Xác nhận đổi trạng thái tài khoản?'
        : from && from !== target
          ? 'Xác nhận chuyển phân công?'
          : 'Xác nhận lưu phân công?';
    description =
      kind === 'users'
        ? `${confirmation.row.HoTen} · ${confirmation.row.Email}: ${confirmation.row.TrangThai} → ${confirmation.body.status}. Vai trò ${confirmation.row.TenVaiTro} được giữ nguyên.`
        : `${confirmation.row?.TenQuanLy ?? managers.find((r) => r.id === confirmation.body.userId)?.label}: ${from ?? 'Phân công mới'} → ${target}. ${formatDate(confirmation.body.startsOn)} — ${confirmation.body.endsOn ? formatDate(confirmation.body.endsOn) : 'Không có ngày kết thúc'}. Chỉ lưu phân công này; giữ các phân công khác.`;
    if (kind === 'products') {
      title = `Lưu sản phẩm ${definition.name(confirmation.row)}?`;
      description = `Giá ${money(confirmation.row.Gia)} → ${money(confirmation.body.price)}. Trạng thái ${confirmation.row.TrangThai} → ${confirmation.body.status}. Giá snapshot trong đơn đã đặt được giữ nguyên.`;
    }
    if (kind === 'promotions') {
      title = `Lưu khuyến mãi ${definition.name(confirmation.row)}?`;
      description = `Giữ nguyên mã và ${confirmation.row.SoLuongDaDung} lượt đã dùng. Tổng hạn mức ${confirmation.body.quantity} lượt; trạng thái ${confirmation.body.status}. Điều kiện giảm và thời gian được cập nhật cho việc áp dụng tiếp theo.`;
    }
  }
  if (confirmation?.kind === 'delete') {
    title = `Xóa ${definition.name(confirmation.row)}?`;
    description = definition.deleteNotice;
  }
  if (confirmation?.kind === 'cast') {
    title = `Thay danh sách diễn viên của ${definition.name(confirmation.row)}?`;
    description = `${confirmation.body.cast.length} diễn viên sẽ được lưu. Toàn bộ danh sách hiện tại được thay bằng danh sách trong form; thông tin phim và thể loại được giữ nguyên.`;
  }
  return (
    <section className="admin-resource">
      <PageHeader
        title={definition.title}
        description={definition.description}
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: definition.title }]}
        actions={
          <Button
            disabled={busy || state.resource.status !== 'success'}
            onClick={() => controller.openEditor()}
          >
            {kind === 'users'
              ? 'Tạo tài khoản nội bộ'
              : kind === 'assignments'
                ? 'Thêm phân công'
                : `Thêm ${definition.title.toLowerCase()}`}
          </Button>
        }
      />
      {state.notice && (
        <p
          role={state.notice.error ? 'alert' : 'status'}
          className={state.notice.error ? 'admin-resource__error' : 'admin-resource__success'}
        >
          {state.notice.error?.status === 409 && 'Xung đột: '}
          {state.notice.error?.message ?? state.notice.text}
        </p>
      )}
      {kind === 'products' ? (
        <ProductFilters state={state} controller={controller} />
      ) : isSingleBox ? (
        <FilterBar
          label={`Bộ lọc ${definition.title.toLowerCase()}`}
          schema={[
            {
              key: 'search',
              label: singleBoxLabel,
              format: (value) =>
                singleBoxOptions.find((option) => option.value === String(value))?.label ?? value,
            },
          ]}
          draft={{ search: state.filters.search }}
          applied={{ search: state.applied.search }}
          pending={busy}
          onRemoveFilter={(key) => controller.setFilters({ [key]: '' })}
          onApply={controller.applyFilters}
          onReset={controller.resetFilters}
        >
          <FormField label={`Chọn ${singleBoxLabel.toLocaleLowerCase()}`}>
            <SearchableSelect
              ariaLabel={`Chọn ${singleBoxLabel.toLocaleLowerCase()}`}
              value={state.filters.search}
              disabled={busy}
              textValue
              placeholder={
                state.resource.status === 'loading'
                  ? 'Đang tải danh sách…'
                  : singleBoxOptions.length
                    ? `Chọn ${singleBoxLabel.toLocaleLowerCase()}`
                    : 'Chưa có lựa chọn'
              }
              searchPlaceholder={`Gõ để lọc ${singleBoxLabel.toLocaleLowerCase()}...`}
              allLabel="Tất cả"
              options={singleBoxOptions}
              emptyMessage="Chưa có lựa chọn."
              noMatchMessage="Không tìm thấy kết quả khớp từ khóa."
              onChange={(value) => {
                controller.setFilters({ search: value, movieId: '' });
                requestAnimationFrame(() => controller.applyFilters());
              }}
            />
          </FormField>
        </FilterBar>
      ) : (
        <FilterBar
          label={`Bộ lọc ${definition.title.toLowerCase()}`}
          schema={schema}
          draft={state.filters}
          applied={state.applied}
          pending={busy}
          onRemoveFilter={controller.removeFilter}
          onApply={controller.applyFilters}
          onReset={controller.resetFilters}
        >
          <FormField
            label={
              kind === 'users'
                ? 'Tìm tên / email / số điện thoại'
                : kind === 'assignments'
                  ? 'Tìm Manager / email / rạp'
                  : kind === 'movies'
                    ? 'Tìm tên phim / đạo diễn'
                    : `Tìm ${definition.title.toLowerCase()}`
            }
          >
            <Input
              value={state.filters.search}
              maxLength={100}
              disabled={busy}
              onChange={(e) => controller.setFilters({ search: e.target.value })}
            />
          </FormField>
          {extraFilterCount > 2 ? (
            <details className="admin-resource__advanced-filters">
              <summary>
                <span>Bộ lọc nâng cao</span>
                {appliedExtraFilterCount > 0 && (
                  <span>{appliedExtraFilterCount} điều kiện đang áp dụng</span>
                )}
              </summary>
              <div className="admin-resource__advanced-fields">{renderAdditionalFilters()}</div>
            </details>
          ) : (
            renderAdditionalFilters()
          )}
        </FilterBar>
      )}
      {filterLookupErrors.map(([key, lookup]) => (
        <AsyncState
          key={key}
          status="error"
          error={lookup.error}
          errorMessage={`Không tải được danh mục ${filterLabels[key].toLowerCase()}.`}
          onRetry={() => void controller.reloadLookups()}
        />
      ))}
      {state.resource.status === 'success' && (
        <p role="status">Có {view.total} kết quả · Tra cứu toàn bộ danh sách được phép.</p>
      )}
      <ResourceTable
        caption={`Danh sách ${definition.title.toLowerCase()}`}
        rowKey={definition.id}
        columns={columns}
        rows={view.rows}
        status={state.resource.status}
        error={state.resource.error}
        onRetry={() => void controller.reload()}
        pagination={{
          page: view.page,
          pageSize: state.pageSize,
          total: view.total,
          disabled: busy,
          onPageChange: controller.setPage,
        }}
      />
      <Dialog
        open={Boolean(state.selectedId)}
        size="lg"
        title={
          state.selection
            ? definition.name(state.selection)
            : `Chi tiết ${definition.title.toLowerCase()}`
        }
        busy={busy}
        onOpenChange={(open) => {
          if (!open) controller.closeDetail();
        }}
      >
        {state.selectionError && <AsyncState status="error" error={state.selectionError} />}
        {state.selectedId && !state.selection && !state.selectionError && (
          <AsyncState status="loading" loadingMessage="Đang tải chi tiết…" />
        )}
        {state.selection && (
          <section
            className="admin-resource__panel"
            aria-label={`Chi tiết ${definition.title.toLowerCase()}`}
          >
            {state.selection.TrangThai && <StatusBadge status={state.selection.TrangThai} />}
            {kind === 'products' && state.selection.HinhAnh && (
              <div style={{ margin: 'var(--space-3) 0', textAlign: 'center' }}>
                <img
                  src={state.selection.HinhAnh}
                  alt={state.selection.TenSanPham}
                  style={{
                    maxWidth: '160px',
                    maxHeight: '160px',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <dl className="admin-resource__details">
              {definition.details
                .filter(([, key]) => state.selection[key] != null)
                .map(([label, key, format]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{format ? format(state.selection[key]) : state.selection[key]}</dd>
                  </div>
                ))}
            </dl>
            {kind === 'users' && (
              <p>Vai trò chỉ xác định khi tạo. Màn hình này cập nhật trạng thái tài khoản.</p>
            )}
            {catalog && (
              <CatalogDetails kind={kind} row={state.selection} lookups={state.lookups} can={can} />
            )}
          </section>
        )}
      </Dialog>
      <Dialog
        key={
          editor
            ? `editor:${editor.mode}:${editor.row?.[definition.id] ?? 'create'}`
            : 'editor:none'
        }
        open={Boolean(editor)}
        busy={busy}
        title={
          editor?.mode === 'cast'
            ? `Diễn viên · ${definition.name(editor.row)}`
            : `${editor?.row ? 'Sửa' : 'Tạo'} ${definition.title.toLowerCase()}`
        }
        size="lg"
        onOpenChange={(open) => {
          if (!open) controller.closeEditor();
        }}
      >
        {editor && <ResourceEditor kind={kind} state={state} controller={controller} />}
      </Dialog>
      <ConfirmDialog
        key={confirmation?.kind ?? 'none'}
        open={Boolean(confirmation)}
        busy={busy}
        title={title}
        description={description}
        confirmLabel={confirmation?.kind === 'discard' ? 'Bỏ thay đổi' : 'Xác nhận'}
        onOpenChange={(open) => {
          if (!open) controller.cancelConfirmation();
        }}
        onConfirm={controller.confirm}
      />
    </section>
  );
}
export function ResourceEditor({ kind, state, controller }) {
  const editor = state.editor,
    editing = Boolean(editor.row),
    busy = state.pending;
  return (
    <form
      className="admin-resource__form"
      aria-label={`Biểu mẫu ${resourceDefinitions[kind].title.toLowerCase()}`}
      onSubmit={(event) => {
        event.preventDefault();
        void controller.requestSave();
      }}
    >
      {editor.mode === 'cast' ? (
        <CastEditor state={state} controller={controller} />
      ) : (
        <>
          {kind === 'promotions' && editing && (
            <p>
              Mã: <strong>{editor.row.MaCode}</strong> · Đã dùng: {editor.row.SoLuongDaDung} lượt.
              Mã và bộ đếm đã dùng không chỉnh sửa trong form.
            </p>
          )}
          {kind === 'users' && editing && (
            <p>
              <strong>{editor.row.HoTen}</strong> · {editor.row.Email} · Vai trò:{' '}
              <strong>{editor.row.TenVaiTro}</strong> (không thay đổi).
            </p>
          )}
          {resourceFields(kind, editing).map((f) => {
            if (f.type === 'multi-resource')
              return (
                <ResourceMultiSelect
                  key={f.name}
                  label={f.label}
                  selected={editor.values[f.name]}
                  lookup={state.lookups[f.lookup]}
                  scopeKey={editor.row?.PhimID ?? 'create'}
                  disabled={busy}
                  error={editor.errors[f.name]}
                  onRetry={controller.reloadLookups}
                  onChange={(ids) => controller.changeField(f.name, ids)}
                />
              );
            if (f.type === 'resource') {
              const lookup = state.lookups[f.lookup] ?? { status: 'loading', rows: [] };
              const options =
                f.lookup === 'roles'
                  ? lookup.rows.filter((r) => ['ADMIN', 'CSKH', 'QUAN_LY_RAP'].includes(r.code))
                  : lookup.rows;
              return (
                <div key={f.name}>
                  <ResourceSelect
                    scopeKey={`${kind}:${editor.row?.[resourceDefinitions[kind].id] ?? 'create'}`}
                    label={f.label}
                    value={editor.values[f.name]}
                    options={options}
                    lookupStatus={lookup.status}
                    lookupError={lookup.error}
                    onRetry={() => void controller.reloadLookups()}
                    readOnly={editing && f.immutable}
                    readOnlyHint="Manager được giữ cố định trong phân công này."
                    fallbackOption={
                      editing && f.immutable
                        ? { id: editor.row[f.column], label: editor.row.TenQuanLy }
                        : undefined
                    }
                    disabled={busy}
                    onChange={(value) => controller.changeField(f.name, value)}
                  />
                  {editor.errors[f.name] && (
                    <p role="alert" className="admin-resource__error">
                      {editor.errors[f.name]}
                    </p>
                  )}
                </div>
              );
            }
            const props = {
              value: editor.values[f.name],
              disabled: busy || (editing && f.immutable),
              required: !f.optional,
              maxLength: f.maxLength,
              onChange: (e) => controller.changeField(f.name, e.target.value),
            };
            const fieldLabel =
              kind === 'promotions' && f.name === 'discountValue'
                ? ['Phần trăm', 'PERCENT'].includes(editor.values.discountType)
                  ? 'Giá trị giảm (%)'
                  : 'Giá trị giảm (VND)'
                : f.label;
            let fieldHint;
            if (f.type === 'datetime-local' && editor.values[f.name]) {
              try {
                fieldHint = `Thời gian (UTC+7): ${formatDateTime(businessLocalToInstant(editor.values[f.name]))}`;
              } catch {
                fieldHint = undefined;
              }
            }
            return (
              <div key={f.name}>
                <FormField
                  label={fieldLabel}
                  required={!f.optional}
                  error={editor.errors[f.name]}
                  hint={fieldHint}
                >
                  {f.type === 'select' ? (
                    <Select {...props}>
                      {f.options.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </Select>
                  ) : f.type === 'textarea' ? (
                    <textarea className="ui-input" rows={4} {...props} />
                  ) : (
                    <Input
                      {...props}
                      type={f.type}
                      min={f.min}
                      max={f.max}
                      step={
                        f.type === 'number'
                          ? f.integer
                            ? 1
                            : '0.01'
                          : f.type === 'datetime-local'
                            ? '0.001'
                            : undefined
                      }
                      minLength={f.minLength}
                      autoComplete={f.type === 'password' ? 'new-password' : undefined}
                    />
                  )}
                </FormField>
                {kind === 'products' && f.name === 'image' && editor.values[f.name] && (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <img
                      src={editor.values[f.name]}
                      alt="Xem trước ảnh sản phẩm"
                      style={{
                        maxWidth: '120px',
                        maxHeight: '120px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {kind === 'assignments' && (
            <ManagerAssignmentsContext
              managerId={editor.values.userId}
              assignments={state.resource.rows}
            />
          )}
        </>
      )}
      {editor.error && (
        <p role="alert" className="admin-resource__error">
          {editor.error.message}
        </p>
      )}
      <div className="admin-resource__actions">
        <Button type="submit" loading={busy}>
          {editing ? 'Lưu thay đổi' : 'Tạo mới'}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={controller.closeEditor}>
          Đóng form
        </Button>
      </div>
    </form>
  );
}
function ResourceImage({ url, label }) {
  const [failedUrl, setFailedUrl] = useState(null);
  return url && failedUrl !== url ? (
    <img
      className="admin-resource__image"
      src={url}
      alt={`Ảnh ${label}`}
      loading="lazy"
      onError={() => setFailedUrl(url)}
    />
  ) : (
    <span className="admin-resource__image admin-resource__image--empty" aria-label="Chưa có ảnh">
      Ảnh
    </span>
  );
}
function MovieNames({ row, lookup, relation }) {
  const data = movieRelations(row);
  if (data.error) return <span role="alert">{data.error.message}</span>;
  const ids = relation === 'cast' ? data.cast.map((c) => c.actorId) : data.genreIds;
  if (!ids.length) return 'Chưa liên kết';
  if (lookup?.status !== 'success') return 'Chưa tra cứu được tên';
  return ids
    .map((id) => lookup.rows.find((r) => r.id === id)?.label ?? 'Tên chưa tra cứu được')
    .join(', ');
}
function CatalogDetails({ kind, row, lookups, can }) {
  if (kind !== 'movies') {
    const movies = linkedMovies(kind, row, lookups.movies);
    return (
      <div>
        <h3>Phim liên kết</h3>
        {movies === null ? (
          <AsyncState status={lookups.movies?.status ?? 'loading'} error={lookups.movies?.error} />
        ) : movies.length ? (
          <ul>
            {movies.map((m) => (
              <li key={m.id}>
                <Link to={`/admin/catalog/movies?selectedId=${m.id}`}>{m.label}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>Chưa có phim liên kết.</p>
        )}
      </div>
    );
  }
  const data = movieRelations(row);
  return (
    <>
      <p>
        <strong>Thể loại:</strong>{' '}
        <MovieNames row={row} lookup={lookups.genres} relation="genreIds" />
      </p>
      <div>
        <h3>Diễn viên và vai diễn</h3>
        {data.error ? (
          <p role="alert">{data.error.message}</p>
        ) : !data.cast.length ? (
          <p>Chưa có diễn viên.</p>
        ) : (
          <ul>
            {data.cast.map((c) => (
              <li key={c.actorId}>
                {lookups.actors?.rows.find((a) => a.id === c.actorId)?.label ??
                  'Chưa tra cứu được tên'}{' '}
                · {c.role || 'Chưa ghi vai diễn'}
              </li>
            ))}
          </ul>
        )}
      </div>
      {row.TrailerURL && /^https?:\/\//i.test(row.TrailerURL) && (
        <a href={row.TrailerURL} target="_blank" rel="noreferrer">
          Xem trailer
        </a>
      )}
      {can('QL_SUAT_CHIEU') && (
        <Link to={`/admin/operations/showtimes?movieId=${row.PhimID}`}>
          Tra cứu suất chiếu của phim
        </Link>
      )}
    </>
  );
}
function ResourceMultiSelect({
  label,
  selected,
  lookup,
  scopeKey,
  disabled,
  error,
  onRetry,
  onChange,
}) {
  return (
    <fieldset className="admin-resource__fieldset">
      <legend>{label}</legend>
      <ResourceSelect
        label={`Thêm ${label.toLowerCase()}`}
        scopeKey={scopeKey}
        required={false}
        value=""
        options={(lookup?.rows ?? []).filter((r) => !selected.includes(r.id))}
        lookupStatus={lookup?.status ?? 'loading'}
        lookupError={lookup?.error}
        disabled={disabled}
        onRetry={onRetry}
        onChange={(id) => {
          if (id) onChange([...selected, Number(id)]);
        }}
      />
      {selected.length ? (
        <ul className="admin-resource__choices">
          {selected.map((id) => (
            <li key={id}>
              {lookup?.rows.find((r) => r.id === id)?.label ?? 'Tên chưa tra cứu được'}
              <Button
                variant="secondary"
                size="sm"
                disabled={disabled || lookup?.status !== 'success'}
                onClick={() => onChange(selected.filter((value) => value !== id))}
              >
                Bỏ thể loại
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Chưa chọn thể loại.</p>
      )}
      {error && <p role="alert">{error}</p>}
    </fieldset>
  );
}
function CastEditor({ state, controller }) {
  const cast = state.editor.values.cast,
    lookup = state.lookups.actors;
  return (
    <>
      <p>
        Chọn diễn viên bằng tên và nhập vai diễn. Lưu sẽ thay toàn bộ danh sách diễn viên của phim;
        kiểm tra các mục trước khi xác nhận.
      </p>
      <ResourceSelect
        label="Thêm diễn viên"
        scopeKey={state.editor.row.PhimID}
        required={false}
        value=""
        options={(lookup?.rows ?? []).filter((a) => !cast.some((c) => c.actorId === a.id))}
        lookupStatus={lookup?.status ?? 'loading'}
        lookupError={lookup?.error}
        onRetry={controller.reloadLookups}
        disabled={state.pending}
        onChange={controller.addCastActor}
      />
      {cast.length ? (
        cast.map((c) => (
          <fieldset className="admin-resource__fieldset" key={c.actorId}>
            <legend>
              {lookup?.rows.find((a) => a.id === c.actorId)?.label ?? 'Tên chưa tra cứu được'}
            </legend>
            <FormField
              label={`Vai diễn của ${lookup?.rows.find((a) => a.id === c.actorId)?.label ?? 'diễn viên'}`}
            >
              <Input
                value={c.role}
                maxLength={150}
                disabled={state.pending}
                onChange={(e) => controller.changeCastRole(c.actorId, e.target.value)}
              />
            </FormField>
            <Button
              variant="secondary"
              disabled={state.pending || lookup?.status !== 'success'}
              onClick={() => controller.removeCastActor(c.actorId)}
            >
              Bỏ diễn viên
            </Button>
          </fieldset>
        ))
      ) : (
        <p>Danh sách diễn viên đang trống.</p>
      )}
    </>
  );
}
