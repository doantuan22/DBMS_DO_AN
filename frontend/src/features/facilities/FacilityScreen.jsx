import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Link, MemoryRouter, useInRouterContext, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useManagerCinema } from '../manager/ManagerCinemaContext';
import useBookingDraftGuard from '../staff-bookings/useBookingDraftGuard';
import { getSeats as getShowtimeSeats } from '../../api/catalogApi';
import { formatDateTime } from '../../utils/dateTime';
import PageHeader from '../../components/ui/PageHeader';
import ResourceSelect from '../../components/ui/ResourceSelect';
import ResourceTable from '../../components/ui/ResourceTable';
import FilterBar from '../../components/ui/FilterBar';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Button from '../../components/ui/Button';
import AsyncState from '../../components/ui/AsyncState';
import StatusBadge from '../../components/ui/StatusBadge';
import RoomIcon from '../../components/ui/RoomIcon';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Dialog from '../../components/ui/Dialog';
import Forbidden from '../../pages/Forbidden';
import { facilityAdapter } from './facilityAdapters';
import { createFacilityController } from './facilityController';
import { resourceView, seatRows, facilityLabels } from './facilityModel';
import FacilityEditor from './FacilityEditor';
import SeatLayout from './SeatLayout';
import SeatInspector from './SeatInspector';
import './facilities.css';
// Manager rooms reuses the Admin rooms surface so both portals present the same design.
import '../admin-rooms/admin-rooms.css';
import { loadOccupancy } from './occupancyRead';
import { ROOM_TYPES, SEAT_TYPES, RESOURCE_STATUSES } from '../../../../shared/resourceContract.mjs';

export default function FacilityScreen({ kind, manager = false }) {
  const { user } = useAuth();
  const context = useManagerCinema(),
    inRouter = useInRouterContext();
  if (!inRouter)
    return (
      <MemoryRouter>
        <FacilityScreen kind={kind} manager={manager} />
      </MemoryRouter>
    );
  const adapter = facilityAdapter(kind, user, manager ? context?.state : undefined);
  if (!adapter.allowed)
    return kind === 'images' ? <p>Bạn chưa được cấp quyền quản lý ảnh rạp.</p> : <Forbidden />;
  const actorKey = `${user.userId}:${user.permissions
    .map((permission) => permission.code)
    .sort()
    .join(',')}`;
  return manager ? (
    <ManagerFacilities key={actorKey} kind={kind} context={context} user={user} />
  ) : (
    <FacilityWorkspace key={`${actorKey}:${kind}`} adapter={adapter} />
  );
}

function ManagerFacilities({ kind, context, user }) {
  const [params, setParams] = useSearchParams();
  const { state, store, changeCinema } = context;
  const [lastCinema, setLastCinema] = useState(state.cinemaId),
    changedCinema = lastCinema !== state.cinemaId;
  useLayoutEffect(() => {
    if (lastCinema === state.cinemaId) return;
    void Promise.resolve().then(() => setLastCinema(state.cinemaId));
    setParams(state.cinemaId ? { cinemaId: state.cinemaId } : {}, { replace: true });
  }, [state.cinemaId, setParams, lastCinema]);
  const requested = params.get('cinemaId');
  const assignment =
    !user.cinemaAssignments ||
    user.cinemaAssignments.some((item) => String(item.cinemaId) === state.cinemaId);
  const adapter = facilityAdapter(kind, user, state);
  return (
    <section className="facility-manager">
      <div className="facility-context">
        <FormField label="Rạp hiện tại">
          <Select
            aria-label="Rạp hiện tại"
            value={state.cinemaId}
            disabled={state.pending || state.status !== 'success'}
            onChange={(event) => changeCinema(event.target.value)}
          >
            {state.cinemas
              .filter(
                (cinema) =>
                  !user.cinemaAssignments ||
                  user.cinemaAssignments.some(
                    (item) => String(item.cinemaId) === String(cinema.id),
                  ),
              )
              .map((cinema) => (
                <option key={cinema.id} value={cinema.id}>
                  {cinema.name} · {cinema.city}
                </option>
              ))}
          </Select>
        </FormField>
      </div>
      {state.status !== 'success' ? (
        <>
          <PageHeader
            title={kind === 'rooms' ? 'Phòng chiếu' : 'Ghế'}
            breadcrumbs={[
              { label: 'Manager' },
              { label: kind === 'rooms' ? 'Phòng chiếu' : 'Ghế' },
            ]}
          />
          <AsyncState status={state.status} error={state.error} />
        </>
      ) : !state.cinemas.length ? (
        <AsyncState status="empty" emptyMessage="Bạn không có phân công rạp còn hiệu lực." />
      ) : !assignment || changedCinema ? (
        <AsyncState status="loading" />
      ) : requested && requested !== state.cinemaId ? (
        <>
          <Forbidden />
          <Button
            variant="secondary"
            onClick={() => setParams({ cinemaId: state.cinemaId }, { replace: true })}
          >
            Dùng rạp hiện tại
          </Button>
        </>
      ) : (
        <FacilityWorkspace
          key={`${state.cinemaId}:${state.epoch}:${kind}`}
          adapter={adapter}
          managerStore={store}
        />
      )}
    </section>
  );
}

function FacilityWorkspace({ adapter, managerStore }) {
  const [params, setParams] = useSearchParams(),
    query = params.toString();
  const [controller] = useState(() =>
    createFacilityController({
      adapter,
      managerStore,
      initialQuery: query,
      onQueryChange: (next) => setParams(next),
    }),
  );
  const [ownerAdapter] = useState(adapter);
  const lastQuery = useRef(query);
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const isSafeDestination = useCallback(
    (destination) => {
      const url = new URL(destination, window.location.href),
        scope = controller.getSnapshot().scope;
      return managerStore
        ? url.origin === window.location.origin && url.pathname.startsWith('/manager/')
        : url.pathname === window.location.pathname &&
            (url.searchParams.get('cinemaId') ?? '') === scope.cinemaId &&
            (url.searchParams.get('roomId') ?? '') === scope.roomId &&
            (url.searchParams.get('showtimeId') ?? '') === controller.getSnapshot().showtimeId;
    },
    [controller, managerStore],
  );
  useBookingDraftGuard(state.dirty, state.pending, {
    readState: controller.getSnapshot,
    isSafeDestination,
    message: 'Có thay đổi cơ sở vật chất chưa lưu. Rời màn hình và bỏ bản nháp?',
  });
  useEffect(() => {
    void controller.start();
    return () => controller.dispose();
  }, [controller]);
  useEffect(() => {
    if (query !== lastQuery.current) {
      lastQuery.current = query;
      void controller.syncQuery(query);
    }
  }, [controller, query]);
  void controller.syncQuery;
  return <FacilityView state={state} controller={controller} adapter={ownerAdapter} />;
}

export function FacilityFilters({ state, controller, adapter, kind, rows }) {
  const keys =
    kind === 'seats'
      ? ['row', 'type', 'status']
      : kind === 'rooms'
        ? ['type', 'status']
        : kind === 'cinemas'
          ? ['city', 'status']
          : ['status'];
  // PA-3b single-box pages: images keeps search capability inside one searchable select.
  const isSingleBox = kind === 'images',
    seats = kind === 'seats',
    manager = Boolean(adapter?.managerCinemaId),
    roomChosen = Boolean(state.scope?.roomId);
  const singleBoxOptions = isSingleBox
    ? [
        ...new Map(
          (state.resource.status === 'success' ? state.resource.rows : []).map((row) => [
            String(row.id),
            String(row.description || 'Chưa có chú thích'),
          ]),
        ).entries(),
      ].map(([value, label]) => ({ value, label }))
    : [];
  const labels = {
    search:
      kind === 'seats'
        ? 'Tên ghế'
        : kind === 'images'
          ? 'Chú thích'
          : kind === 'cinemas'
            ? 'Tìm rạp'
            : kind === 'rooms'
              ? 'Tên / số phòng'
              : 'Tên',
    row: 'Hàng ghế',
    type: kind === 'rooms' ? 'Loại phòng' : 'Loại',
    status: 'Trạng thái',
    city: 'Thành phố',
  };
  const filterOptions = {
    row: [...new Set(rows.map((row) => row.row).filter(Boolean))],
    type: kind === 'seats' ? SEAT_TYPES : ROOM_TYPES,
    status: RESOURCE_STATUSES[kind === 'images' ? 'cinemaImages' : kind] ?? [],
    city: [...new Set(rows.map((row) => row.city).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'vi'),
    ),
  };
  const filterFields = isSingleBox ? (
    <>
      {!manager && (
        <ResourceSelect
          label="Rạp chiếu"
          value={state.scope?.cinemaId ?? ''}
          scopeKey="image-filter-cinemas"
          options={(state.lookup?.rows ?? []).map((row) => ({ id: row.id, label: row.name }))}
          lookupStatus={state.lookup?.status ?? 'idle'}
          lookupError={state.lookup?.error}
          onRetry={() => void controller.start?.()}
          required={false}
          disabled={state.pending}
          onChange={(id) => void controller.chooseCinema?.(id)}
          emptyMessage="Chưa có rạp để chọn."
        />
      )}
      {Boolean(state.scope?.cinemaId) && (
        <FormField label="Chọn ảnh rạp">
          <SearchableSelect
            ariaLabel="Chọn ảnh rạp"
            value={state.filters?.search ?? ''}
            disabled={state.pending}
            textValue
            placeholder={
              state.resource?.status === 'loading'
                ? 'Đang tải danh sách…'
                : singleBoxOptions.length
                  ? 'Chọn ảnh rạp'
                  : 'Chưa có lựa chọn'
            }
            searchPlaceholder="Gõ để lọc chú thích..."
            allLabel="Tất cả"
            options={singleBoxOptions}
            emptyMessage="Chưa có lựa chọn."
            noMatchMessage="Không tìm thấy kết quả khớp từ khóa."
            onChange={(value) => {
              controller.setFilters({ search: value, status: '' });
              requestAnimationFrame(() => controller.applyFilters());
            }}
          />
        </FormField>
      )}
    </>
  ) : (
    <>
      {seats && !manager && (
        <ResourceSelect
          label="Rạp chiếu"
          value={state.scope.cinemaId}
          scopeKey="seat-filter-cinemas"
          options={state.lookup.rows.map((row) => ({ id: row.id, label: row.name }))}
          lookupStatus={state.lookup.status}
          lookupError={state.lookup.error}
          onRetry={() => void controller.start()}
          required={false}
          disabled={state.pending}
          onChange={(id) => void controller.chooseCinema(id)}
          emptyMessage="Chưa có rạp để chọn."
        />
      )}
      {seats && (
        <ResourceSelect
          label="Phòng"
          scopeKey={state.scope.cinemaId}
          value={state.scope.roomId}
          options={state.rooms.rows.map((row) => ({ id: row.id, label: row.name }))}
          lookupStatus={state.rooms.status === 'idle' ? 'success' : state.rooms.status}
          lookupError={state.rooms.error}
          onRetry={() => void controller.reloadRooms()}
          disabled={state.pending || !state.scope.cinemaId}
          required={false}
          onChange={(id) => void controller.chooseRoom(id)}
          emptyMessage={state.scope.cinemaId ? 'Rạp này chưa có phòng để chọn.' : 'Chọn rạp trước.'}
        />
      )}
      <FormField
        label={labels.search}
        hint={kind === 'rooms' ? 'Tìm theo tên phòng, ví dụ Phòng 01.' : undefined}
      >
        <div className="facility-filters__search-row">
          <Input
            type="search"
            disabled={state.pending || (seats && !roomChosen)}
            placeholder={
              kind === 'seats'
                ? 'Ví dụ: A1'
                : kind === 'cinemas'
                  ? 'Nhập tên rạp, địa chỉ...'
                  : kind === 'rooms'
                    ? 'Nhập tên hoặc số trong tên phòng'
                    : 'Nhập từ khóa'
            }
            value={state.filters.search}
            maxLength={150}
            onChange={(event) => controller.setFilters({ search: event.target.value })}
          />
        </div>
      </FormField>
      {keys.map((key) => (
        <FormField key={key} label={labels[key]}>
          <Select
            disabled={state.pending || (seats && !roomChosen)}
            value={state.filters[key]}
            onChange={(event) => controller.setFilters({ [key]: event.target.value })}
          >
            <option value="">
              {kind === 'rooms' && key === 'type'
                ? 'Tất cả loại phòng'
                : kind === 'rooms' && key === 'status'
                  ? 'Tất cả trạng thái'
                  : 'Tất cả'}
            </option>
            {filterOptions[key]?.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Select>
        </FormField>
      ))}
    </>
  );
  const filterBar = (
    <FilterBar
      label={`Bộ lọc ${facilityLabels[kind]}`}
      schema={
        isSingleBox
          ? [
              {
                key: 'search',
                label: 'Ảnh rạp',
                format: (value) =>
                  singleBoxOptions.find((option) => option.value === String(value))?.label ?? value,
              },
            ]
          : ['search', ...keys].map((key) => ({ key, label: labels[key] }))
      }
      draft={isSingleBox ? { search: state.filters.search } : state.filters}
      applied={isSingleBox ? { search: state.applied.search } : state.applied}
      applyLabel={
        kind === 'seats'
          ? 'Tìm ghế'
          : kind === 'cinemas'
            ? 'Tìm rạp'
            : kind === 'rooms'
              ? 'Tìm phòng'
              : 'Tìm'
      }
      pending={state.pending}
      onRemoveFilter={(key) => controller.removeFilter(key)}
      onApply={() => controller.applyFilters()}
      onReset={() => controller.resetFilters()}
    >
      {filterFields}
    </FilterBar>
  );
  if (!seats) return filterBar;
  // Seat search reuses the Admin/Manager rooms filter panel; Rạp/Phòng live inside the bar.
  return (
    <section
      className="admin-rooms__panel facility-seats__filters"
      aria-labelledby="seat-filter-title"
    >
      <h2 id="seat-filter-title">Tìm ghế</h2>
      {filterBar}
      {state.lookup.limited && (
        <p className="admin-rooms__muted">
          Chỉ có rạp xuất hiện trong danh sách phòng được cấp quyền; rạp chưa có phòng cần quyền tra
          cứu rạp.
        </p>
      )}
      <AsyncState
        status={state.lookup.status === 'error' ? 'error' : 'idle'}
        error={state.lookup.error}
      />
    </section>
  );
}

function RoomsWorkspace({ state, controller, adapter, cinema }) {
  const view = resourceView(state),
    cinemaName = cinema?.name ?? 'Chưa chọn rạp',
    seatPath = (row) =>
      `/manager/seats?${new URLSearchParams({ cinemaId: String(row.cinemaId), roomId: String(row.id) })}`;
  const columns = [
    {
      key: 'name',
      label: 'Tên phòng',
      render: (row) => (
        <div className="admin-rooms__room">
          <span className="admin-rooms__room-icon">
            <RoomIcon />
          </span>
          <strong>{row.name}</strong>
        </div>
      ),
    },
    { key: 'cinemaName', label: 'Rạp', render: (row) => row.cinemaName ?? cinemaName },
    {
      key: 'type',
      label: 'Loại phòng',
      render: (row) => <span className="admin-rooms__format">{row.type ?? '—'}</span>,
    },
    {
      key: 'seatCount',
      label: 'Số ghế',
      align: 'right',
      render: (row) =>
        row.seatCount == null ? (
          <span className="admin-rooms__muted">Chưa có dữ liệu</span>
        ) : (
          <span className="admin-rooms__seat-count">
            {row.seatCount}
            <span className="admin-rooms__muted"> ghế</span>
          </span>
        ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <div className="admin-rooms__row-actions">
          {adapter.can('QL_GHE') && (
            <Link
              className="ui-button ui-button--secondary ui-button--sm admin-rooms__seats-link"
              to={seatPath(row)}
              aria-label={`Xem sơ đồ ghế ${row.name} · ${row.cinemaName ?? cinemaName}`}
              aria-disabled={state.pending || undefined}
              onClick={(event) => {
                if (state.pending) event.preventDefault();
              }}
            >
              <RoomIcon />
              Xem sơ đồ ghế
            </Link>
          )}
          <div className="admin-rooms__edit-actions">
            <Button
              variant="secondary"
              size="sm"
              disabled={state.pending}
              onClick={() => controller.openEditor(row)}
              aria-label={`Sửa ${row.name} · ${row.cinemaName ?? cinemaName}`}
            >
              Sửa
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="admin-rooms__delete"
              disabled={state.pending}
              onClick={() => controller.requestDelete(row)}
              aria-label={`Xóa ${row.name} · ${row.cinemaName ?? cinemaName}`}
            >
              Xóa phòng
            </Button>
          </div>
        </div>
      ),
    },
  ];
  return (
    <>
      <section className="admin-rooms__panel" aria-labelledby="manager-room-filter-title">
        <h2 id="manager-room-filter-title">Tìm phòng chiếu</h2>
        <FacilityFilters
          state={state}
          controller={controller}
          adapter={adapter}
          kind="rooms"
          rows={view.all}
        />
      </section>
      <section
        className="admin-rooms__panel admin-rooms__list"
        aria-labelledby="manager-room-list-title"
      >
        <div className="admin-rooms__list-heading">
          <div>
            <h2 id="manager-room-list-title">Danh sách phòng</h2>
            <p className="admin-rooms__muted">
              {cinemaName}
              {state.resource.status === 'success' && ` · ${view.total} phòng phù hợp`}
            </p>
          </div>
          <div className="admin-rooms__list-tools">
            <Button
              variant="secondary"
              size="sm"
              disabled={!cinema || state.pending || state.resource.status === 'loading'}
              onClick={() => void controller.reload()}
            >
              Tải lại
            </Button>
          </div>
        </div>
        <ResourceTable
          columns={columns}
          rows={view.rows}
          rowKey="id"
          caption="Phòng chiếu tại rạp đang chọn"
          className="admin-rooms__table"
          status={state.resource.status}
          error={state.resource.error}
          onRetry={() => void controller.reload()}
          emptyMessage={
            view.all.length
              ? 'Không tìm thấy phòng khớp bộ lọc. Thử từ khóa khác hoặc xóa lọc.'
              : 'Rạp này chưa có phòng chiếu. Chọn Thêm phòng để bắt đầu.'
          }
          pagination={{
            page: view.page,
            pageSize: state.pageSize,
            total: view.total,
            disabled: state.pending,
            onPageChange: (page) => controller.setPage(page),
          }}
        />
      </section>
    </>
  );
}

export function FacilityView({ state, controller, adapter }) {
  const { kind } = adapter,
    manager = Boolean(adapter.managerCinemaId),
    view = resourceView(state);
  const cinema = state.lookup.rows.find((row) => String(row.id) === state.scope.cinemaId),
    room = state.rooms.rows.find((row) => String(row.id) === state.scope.roomId);
  const contextLabel = [room?.name, cinema?.name].filter(Boolean).join(' · ');
  const title = { seats: 'Ghế', rooms: 'Phòng chiếu', cinemas: 'Rạp', images: 'Ảnh rạp' }[kind];
  const ready =
    state.resource.status === 'success' && !state.pending && state.mode === 'configuration';
  const description = {
    seats: 'Cấu hình ghế theo phòng, xem thông tin và thao tác đúng context.',
    rooms: 'Quản lý phòng và sức chứa theo từng rạp.',
    cinemas: 'Quản lý rạp và thư viện hình ảnh liên quan.',
    images: 'Quản lý thư viện hình ảnh theo từng rạp.',
  }[kind];
  const rooms = kind === 'rooms';
  return (
    <section
      className={
        rooms ? 'admin-rooms facility-rooms' : `facility-workspace facility-workspace--${kind}`
      }
      aria-label={rooms ? 'Quản lý phòng chiếu' : `Quản lý ${facilityLabels[kind]}`}
    >
      {rooms && <p className="admin-rooms__eyebrow">CƠ SỞ VẬT CHẤT</p>}
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[
          {
            label: manager ? 'Manager' : 'Quản trị',
            to: manager ? '/manager' : '/admin',
          },
          { label: title },
        ]}
        primaryAction={
          <Button disabled={!ready} onClick={() => controller.openEditor()}>
            ＋ Thêm {facilityLabels[kind]}
          </Button>
        }
      />
      {state.notice &&
        (state.notice.error ? (
          <AsyncState
            status="error"
            error={state.notice.error}
            errorMessage={state.notice.error.message}
          />
        ) : (
          <p className={rooms ? 'admin-rooms__notice' : 'facility-success'} role="status">
            {state.notice.text}
          </p>
        ))}
      {kind === 'cinemas' && state.lookup.status === 'error' && (
        <AsyncState
          status="error"
          error={state.lookup.error}
          errorMessage={state.lookup.error.message}
        />
      )}
      {rooms ? (
        <RoomsWorkspace state={state} controller={controller} adapter={adapter} cinema={cinema} />
      ) : (
        <>
          <FacilityFilters
            state={state}
            controller={controller}
            adapter={adapter}
            kind={kind}
            rows={view.all}
          />
          {kind === 'seats' ? (
            <SeatWorkspace
              state={state}
              controller={controller}
              adapter={adapter}
              roomName={contextLabel}
            />
          ) : kind === 'images' ? (
            <GalleryWorkspace state={state} controller={controller} cinemaName={cinema?.name} />
          ) : (
            <ResourceWorkspace state={state} controller={controller} adapter={adapter} />
          )}
        </>
      )}
      {state.editor && (
        <FacilityEditor
          kind={kind}
          editor={state.editor}
          contextLabel={contextLabel}
          busy={state.pending}
          controller={controller}
        />
      )}
      <ConfirmDialog
        key={state.deleteTarget?.id ?? 'closed'}
        open={Boolean(state.deleteTarget)}
        title={`Xóa ${facilityLabels[kind]}?`}
        busy={state.pending}
        entityLabel={
          state.deleteTarget
            ? `${state.deleteTarget.label ?? state.deleteTarget.name ?? state.deleteTarget.description ?? 'Ảnh rạp'} · ${contextLabel} · ${state.deleteTarget.status}`
            : undefined
        }
        description={
          kind === 'seats'
            ? 'Ghế có lịch sử vé không thể xóa. Hệ thống từ chối nếu không đủ điều kiện.'
            : kind === 'rooms'
              ? 'Phòng có lịch sử suất chiếu sẽ chuyển Ngưng hoạt động để giữ lịch sử; phòng chưa có lịch sử được xóa cùng ghế.'
              : kind === 'cinemas'
                ? 'Rạp có dữ liệu liên quan không thể xóa. Có thể sửa trạng thái thành Tạm đóng.'
                : 'Ảnh sẽ bị xóa khỏi thư viện của rạp này.'
        }
        onOpenChange={(open) => {
          if (!open) controller.cancelDelete();
        }}
        onConfirm={() => controller.confirmDelete()}
      />
      <ConfirmDialog
        open={Boolean(state.confirmation)}
        title="Bỏ thay đổi chưa lưu?"
        description="Bản nháp hiện tại sẽ bị bỏ trước khi đổi context hoặc đóng form."
        confirmLabel="Bỏ thay đổi"
        busy={state.pending}
        onOpenChange={(open) => {
          if (!open) controller.cancelDiscard();
        }}
        onConfirm={() => controller.confirmDiscard()}
      />
    </section>
  );
}

function ResourceWorkspace({ state, controller, adapter }) {
  const view = resourceView(state),
    rooms = adapter.kind === 'rooms';
  const seatPath = (row) =>
    `/manager/seats?${new URLSearchParams({ cinemaId: String(row.cinemaId), roomId: String(row.id) })}`;
  const columns = rooms
    ? [
        { key: 'name', label: 'Phòng' },
        { key: 'type', label: 'Loại phòng' },
        { key: 'seatCount', label: 'Số ghế', render: (row) => row.seatCount ?? 'Chưa có dữ liệu' },
      ]
    : [
        {
          key: 'name',
          label: 'Tên rạp',
          render: (row) => (
            <Button variant="quiet" onClick={() => controller.select(row)} disabled={state.pending}>
              {row.name}
            </Button>
          ),
        },
        { key: 'address', label: 'Địa chỉ' },
        { key: 'city', label: 'Thành phố' },
        {
          key: 'roomCount',
          label: 'Số phòng',
          render: (row) =>
            state.counts.status === 'success'
              ? state.counts.rooms.filter((room) => String(room.cinemaId) === String(row.id)).length
              : state.counts.status === 'loading'
                ? 'Đang tải…'
                : 'Chưa có dữ liệu',
        },
      ];
  columns.push(
    { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <div className="facility-actions">
          {rooms ? (
            adapter.can('QL_GHE') && (
              <Link className="ui-button ui-button--secondary ui-button--sm" to={seatPath(row)}>
                Xem sơ đồ ghế
              </Link>
            )
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled={state.pending}
              onClick={() => controller.select(row)}
            >
              Chi tiết
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            disabled={state.pending}
            onClick={() => controller.openEditor(row)}
          >
            Sửa
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={state.pending}
            onClick={() => controller.requestDelete(row)}
            aria-label={`Xóa ${rooms ? 'phòng' : 'rạp'} ${row.name}`}
          >
            Xóa
          </Button>
        </div>
      ),
    },
  );
  return (
    <>
      <section className="facility-panel">
        <div className="facility-panel-heading">
          <h2>{rooms ? 'Danh sách phòng' : 'Danh sách rạp'}</h2>
          <Button
            size="sm"
            variant="secondary"
            disabled={state.pending || state.resource.status === 'loading'}
            onClick={() => void controller.reload()}
          >
            Tải lại
          </Button>
        </div>
        {!rooms && (
          <p className="facility-help">
            Số phòng gồm các trạng thái. Nếu chưa tra cứu được, số phòng hiển thị Chưa có dữ liệu.
          </p>
        )}
        {!rooms && state.counts.error && <AsyncState status="error" error={state.counts.error} />}
        <ResourceTable
          columns={columns}
          rows={view.rows}
          rowKey="id"
          caption={rooms ? 'Phòng tại rạp hiện tại' : 'Rạp trong hệ thống'}
          status={state.resource.status}
          error={state.resource.error}
          onRetry={() => void controller.reload()}
          emptyMessage="Không có dữ liệu phù hợp."
          pagination={{
            page: view.page,
            pageSize: state.pageSize,
            total: view.total,
            disabled: state.pending,
            onPageChange: (page) => controller.setPage(page),
          }}
        />
      </section>
      <Dialog
        open={Boolean(!rooms && state.selection)}
        size="lg"
        title={state.selection?.name ?? 'Chi tiết rạp'}
        busy={state.pending}
        onOpenChange={(open) => {
          if (!open) controller.closeDetail();
        }}
      >
        {!rooms && state.selection && (
          <CinemaDetail
            cinema={state.selection}
            adapter={adapter}
            controller={controller}
            busy={state.pending}
          />
        )}
      </Dialog>
    </>
  );
}

function CinemaDetail({ cinema, adapter, controller, busy }) {
  return (
    <section className="facility-panel" aria-label="Chi tiết rạp">
      <p className="facility-eyebrow">RẠP ĐANG CHỌN</p>
      <StatusBadge status={cinema.status} />
      <dl className="facility-details">
        <div>
          <dt>Địa chỉ</dt>
          <dd>{cinema.address}</dd>
        </div>
        <div>
          <dt>Thành phố</dt>
          <dd>{cinema.city}</dd>
        </div>
        <div>
          <dt>Điện thoại</dt>
          <dd>{cinema.phone || 'Chưa có thông tin'}</dd>
        </div>
        <div>
          <dt>Mô tả</dt>
          <dd>{cinema.description || 'Chưa có mô tả'}</dd>
        </div>
      </dl>
      <CinemaImagesPanel key={cinema.id} cinema={cinema} />
      <div className="facility-actions">
        {adapter.can('QL_PHONG') && (
          <Link
            className="ui-button ui-button--secondary"
            to={`/admin/facilities/rooms?cinemaId=${encodeURIComponent(cinema.id)}`}
          >
            Phòng chiếu
          </Link>
        )}
        {adapter.can('QL_SUAT_CHIEU') && (
          <Link className="ui-button ui-button--secondary" to="/admin/operations/showtimes">
            Danh sách suất chiếu
          </Link>
        )}
        <Button disabled={busy} onClick={() => controller.openEditor(cinema)}>
          Sửa thông tin rạp
        </Button>
      </div>
    </section>
  );
}

function CinemaImagesPanel({ cinema }) {
  const { user } = useAuth();
  const [controller] = useState(() => {
    const adapter = facilityAdapter('images', user);
    return createFacilityController({
      adapter: { ...adapter, cinemas: [{ id: cinema.id, name: cinema.name }] },
      initialQuery: `cinemaId=${encodeURIComponent(cinema.id)}`,
      cacheKey: `cinema-images:${cinema.id}`,
    });
  });
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  useEffect(() => {
    void controller.start();
    return () => controller.dispose();
  }, [controller]);
  const canAdd = state.resource.status === 'success' && !state.pending;
  return (
    <section
      className="facility-panel facility-panel--nested facility-cinema-images"
      aria-label={`Ảnh rạp ${cinema.name}`}
    >
      <div className="facility-panel-heading">
        <div>
          <h3>Ảnh rạp</h3>
          <p className="facility-help">Thêm, sửa hoặc xóa ảnh của rạp này.</p>
        </div>
        <div className="facility-actions">
          <Button
            size="sm"
            variant="secondary"
            disabled={state.pending || state.resource.status === 'loading'}
            onClick={() => void controller.reload()}
          >
            Tải lại
          </Button>
          <Button size="sm" disabled={!canAdd} onClick={() => controller.openEditor()}>
            ＋ Thêm ảnh
          </Button>
        </div>
      </div>
      {state.notice &&
        (state.notice.error ? (
          <AsyncState
            status="error"
            error={state.notice.error}
            errorMessage={state.notice.error.message}
          />
        ) : (
          <p className="facility-success" role="status">
            {state.notice.text}
          </p>
        ))}
      <CinemaImageGrid state={state} controller={controller} cinemaName={cinema.name} />
      {state.editor && (
        <FacilityEditor
          kind="images"
          editor={state.editor}
          contextLabel={cinema.name}
          busy={state.pending}
          controller={controller}
        />
      )}
      <ConfirmDialog
        key={state.deleteTarget?.id ?? 'closed'}
        open={Boolean(state.deleteTarget)}
        title="Xóa ảnh rạp?"
        busy={state.pending}
        entityLabel={
          state.deleteTarget
            ? `${state.deleteTarget.description || 'Ảnh rạp'} · ${cinema.name} · ${state.deleteTarget.status}`
            : undefined
        }
        description="Ảnh sẽ bị xóa khỏi thư viện của rạp này."
        onOpenChange={(open) => {
          if (!open) controller.cancelDelete();
        }}
        onConfirm={() => controller.confirmDelete()}
      />
      <ConfirmDialog
        open={Boolean(state.confirmation)}
        title="Bỏ thay đổi chưa lưu?"
        description="Bản nháp hiện tại sẽ bị bỏ trước khi đóng form."
        confirmLabel="Bỏ thay đổi"
        busy={state.pending}
        onOpenChange={(open) => {
          if (!open) controller.cancelDiscard();
        }}
        onConfirm={() => controller.confirmDiscard()}
      />
    </section>
  );
}

function useOccupancy(state, adapter) {
  const key = `${state.scope.cinemaId}:${state.scope.roomId}:${state.mode}:${state.showtimeId}`;
  const [resource, setResource] = useState({ status: 'idle' }),
    [showtimes, setShowtimes] = useState({ status: 'idle', rows: [] });
  useEffect(() => {
    if (
      state.mode !== 'occupancy' ||
      !adapter.canShowtimes ||
      state.rooms.status !== 'success' ||
      !state.rooms.rows.some(
        (room) =>
          String(room.id) === state.scope.roomId && String(room.cinemaId) === state.scope.cinemaId,
      )
    )
      return;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setShowtimes({ status: 'loading', rows: [], key: state.scope.roomId });
    });
    adapter
      .showtimes(state.scope)
      .then((rows) => {
        if (active) setShowtimes({ status: 'success', rows, key: state.scope.roomId });
      })
      .catch((error) => {
        if (active) setShowtimes({ status: 'error', rows: [], error, key: state.scope.roomId });
      });
    return () => {
      active = false;
    };
  }, [adapter, state.scope, state.rooms, state.mode]);
  useEffect(() => {
    if (
      state.mode !== 'occupancy' ||
      !state.showtimeId ||
      showtimes.status !== 'success' ||
      showtimes.key !== state.scope.roomId
    )
      return;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setResource({ status: 'loading', rows: [], key });
    });
    loadOccupancy({
      scope: state.scope,
      showtimeId: state.showtimeId,
      showtimes: showtimes.rows,
      readSeats: getShowtimeSeats,
      accepts: () => active,
    })
      .then((rows) => {
        if (active && rows) setResource({ status: 'success', rows, key });
      })
      .catch((error) => {
        if (active) setResource({ status: 'error', rows: [], error, key });
      });
    return () => {
      active = false;
    };
  }, [key, state.mode, state.showtimeId, state.scope, showtimes]);
  return {
    resource: resource.key === key ? resource : { status: 'idle', rows: [] },
    showtimes: showtimes.key === state.scope.roomId ? showtimes : { status: 'idle', rows: [] },
  };
}

function SeatWorkspace({ state, controller, adapter, roomName }) {
  const occupancy = useOccupancy(state, adapter),
    source = state.mode === 'occupancy' ? occupancy.resource : state.resource;
  const view = resourceView({ ...state, resource: source }),
    mapPossible = seatRows(view.all) !== null,
    selectedSeat = view.all.find((row) => String(row.id) === String(state.selection?.id));
  const columns = [
    { key: 'label', label: 'Ghế' },
    { key: 'row', label: 'Hàng' },
    { key: 'number', label: 'Số' },
    { key: 'type', label: 'Loại' },
    {
      key: 'status',
      label: state.mode === 'occupancy' ? 'Tình trạng suất' : 'Cấu hình',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          disabled={state.pending}
          onClick={() => controller.select(row)}
        >
          Xem {row.label}
        </Button>
      ),
    },
  ];
  return (
    <>
      <div className="facility-actions" aria-label="Chế độ sơ đồ ghế">
        <Button
          variant={state.mode === 'configuration' ? 'primary' : 'secondary'}
          disabled={state.pending}
          aria-pressed={state.mode === 'configuration'}
          onClick={() => controller.setMode('configuration')}
        >
          Cấu hình phòng
        </Button>
        {adapter.canShowtimes && (
          <Button
            variant={state.mode === 'occupancy' ? 'primary' : 'secondary'}
            disabled={state.pending || !state.scope.roomId}
            aria-pressed={state.mode === 'occupancy'}
            onClick={() => controller.setMode('occupancy')}
          >
            Theo suất chiếu · chỉ đọc
          </Button>
        )}
      </div>
      {state.mode === 'occupancy' && (
        <div className="facility-panel">
          <ResourceSelect
            label="Suất chiếu"
            scopeKey={state.scope.roomId}
            value={state.showtimeId}
            lookupStatus={occupancy.showtimes.status}
            lookupError={occupancy.showtimes.error}
            options={occupancy.showtimes.rows.map((row) => ({
              id: row.id,
              label: `${row.movieTitle} · ${formatDateTime(row.startsAt)}`,
            }))}
            onChange={(id) => controller.chooseShowtime(id)}
            required={false}
            disabled={state.pending}
          />
          <AsyncState
            status={occupancy.showtimes.status === 'error' ? 'error' : 'idle'}
            error={occupancy.showtimes.error}
          />
          <p className="facility-help">
            Tình trạng do API suất chiếu cung cấp, không chỉnh trạng thái bán vé từ workspace cấu
            hình.
          </p>
        </div>
      )}
      <section className="admin-rooms__panel admin-rooms__list" aria-labelledby="seat-list-title">
        <div className="admin-rooms__list-heading">
          <div>
            <h2 id="seat-list-title">{state.view === 'map' ? 'Sơ đồ ghế' : 'Danh sách ghế'}</h2>
            <p className="admin-rooms__muted">
              {roomName || 'Chọn rạp và phòng để xem ghế'}
              {source.status === 'success' && ` · ${view.total}/${view.all.length} ghế khớp lọc`}
            </p>
          </div>
          <div className="admin-rooms__list-tools">
            <Button
              variant="secondary"
              size="sm"
              aria-pressed={state.view === 'map'}
              onClick={() => controller.setView('map')}
            >
              Sơ đồ
            </Button>
            <Button
              variant="secondary"
              size="sm"
              aria-pressed={state.view === 'list'}
              onClick={() => controller.setView('list')}
            >
              Danh sách
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!state.scope.roomId || state.pending}
              onClick={() => void controller.reload()}
            >
              Tải lại cấu hình
            </Button>
          </div>
        </div>
        <div className="facility-seat-workspace">
          {source.status === 'success' && view.all.length ? (
            <>
              {!mapPossible && (
                <p role="alert">
                  Chưa đủ hàng/số ghế nhất quán để dựng sơ đồ. Hãy sử dụng danh sách bên dưới.
                </p>
              )}
              {state.view === 'map' && mapPossible ? (
                <SeatLayout
                  seats={view.all}
                  selectedId={state.selection?.id}
                  filters={state.applied}
                  mode={state.mode}
                  disabled={state.pending}
                  onSelect={(row) => controller.select(row)}
                />
              ) : (
                <ResourceTable
                  columns={columns}
                  rows={view.rows}
                  rowKey="id"
                  caption="Danh sách ghế theo phòng"
                  pagination={{
                    page: view.page,
                    pageSize: state.pageSize,
                    total: view.total,
                    disabled: state.pending,
                    onPageChange: (page) => controller.setPage(page),
                  }}
                  emptyMessage="Không có ghế khớp bộ lọc."
                />
              )}
            </>
          ) : (
            <div className="facility-seat-empty-container">
              <AsyncState
                status={
                  source.status === 'success'
                    ? 'empty'
                    : source.status === 'idle'
                      ? 'empty'
                      : source.status
                }
                error={source.error}
                emptyMessage={
                  state.mode === 'occupancy'
                    ? 'Chọn suất chiếu để xem tình trạng ghế.'
                    : state.scope.roomId
                      ? 'Phòng chưa có ghế.'
                      : state.scope.cinemaId
                        ? 'Chọn phòng trong bộ lọc để tải sơ đồ ghế.'
                        : 'Chọn rạp và phòng trong bộ lọc để tải sơ đồ ghế.'
                }
                onRetry={() => void controller.reload()}
              />
              {!state.scope.roomId && state.rooms.rows?.length > 0 && (
                <div
                  className="facility-room-quickselect"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    marginTop: 'var(--space-4)',
                    padding: 'var(--space-4)',
                    background: 'var(--color-surface-subtle, rgba(255,255,255,0.03))',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px dashed var(--color-border)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    Chọn nhanh phòng chiếu để mở sơ đồ ghế ngay:
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {state.rooms.rows.slice(0, 6).map((r) => (
                      <Button
                        key={r.id}
                        variant="secondary"
                        size="sm"
                        disabled={state.pending}
                        onClick={() => void controller.chooseRoom(r.id)}
                      >
                        Sơ đồ {r.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      <Dialog
        open={Boolean(selectedSeat)}
        size="md"
        title={selectedSeat ? `Chi tiết ghế · ${selectedSeat.label}` : 'Chi tiết ghế'}
        busy={state.pending}
        onOpenChange={(open) => {
          if (!open) controller.closeDetail();
        }}
      >
        {selectedSeat && (
          <SeatInspector
            seat={selectedSeat}
            roomName={roomName}
            mode={state.mode}
            busy={state.pending}
            onEdit={state.mode === 'configuration' ? (row) => controller.openEditor(row) : undefined}
            onDelete={
              state.mode === 'configuration' ? (row) => controller.requestDelete(row) : undefined
            }
          />
        )}
      </Dialog>
    </>
  );
}

export function FacilityImage({ image, cinemaName, large = false }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div
      className="facility-image-fallback"
      role="img"
      aria-label={`Không tải được ảnh của ${cinemaName}`}
    >
      <strong>Ảnh chưa tải được</strong>
      <span>Kiểm tra kết nối hoặc nguồn ảnh.</span>
    </div>
  ) : (
    <img
      className={large ? 'facility-preview-image' : 'facility-thumbnail'}
      src={image.url}
      alt={image.description || `Ảnh của ${cinemaName}`}
      loading={large ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
    />
  );
}

function CinemaImageGrid({ state, controller, cinemaName }) {
  const view = resourceView(state),
    [preview, setPreview] = useState(null);
  const currentPreview =
    preview &&
    preview.cinemaId === Number(state.scope.cinemaId) &&
    view.all.find((image) => image.id === preview.id);
  return (
    <>
      {state.resource.status === 'success' && view.total ? (
        <>
          <p>{view.total} ảnh phù hợp</p>
          <div className="facility-gallery">
            {view.rows.map((image, index) => (
              <article className="facility-image-card" key={`${state.scope.cinemaId}:${image.id}`}>
                <button
                  type="button"
                  className="facility-preview-trigger"
                  aria-label={`Xem ảnh ${image.description || index + 1} của ${cinemaName}`}
                  onClick={() => setPreview(image)}
                >
                  <FacilityImage key={image.url} image={image} cinemaName={cinemaName} />
                </button>
                <div className="facility-image-card__body">
                  <div className="facility-actions">
                    <StatusBadge status={image.status} />
                    {image.cover && <strong className="facility-cover-badge">Ảnh chính</strong>}
                  </div>
                  <h3>{image.description || 'Chưa có chú thích'}</h3>
                  <p>Thứ tự {image.displayOrder}</p>
                  <div className="facility-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={state.pending}
                      onClick={() => controller.openEditor(image)}
                    >
                      Sửa ảnh
                    </Button>
                    {!image.cover && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={state.pending || image.status !== 'Hoạt động'}
                        onClick={() => void controller.setCover(image)}
                      >
                        Đặt ảnh chính
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={state.pending}
                      onClick={() => controller.requestDelete(image)}
                      aria-label={`Xóa ảnh ${image.description || index + 1} của ${cinemaName}`}
                    >
                      Xóa ảnh
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <nav className="facility-actions" aria-label="Phân trang thư viện">
            <Button
              variant="secondary"
              disabled={view.page <= 1 || state.pending}
              onClick={() => controller.setPage(view.page - 1)}
            >
              Trang trước
            </Button>
            <span>
              Trang {view.page} / {Math.ceil(view.total / state.pageSize)}
            </span>
            <Button
              variant="secondary"
              disabled={view.page * state.pageSize >= view.total || state.pending}
              onClick={() => controller.setPage(view.page + 1)}
            >
              Trang sau
            </Button>
          </nav>
        </>
      ) : (
        <AsyncState
          status={state.resource.status === 'success' ? 'empty' : state.resource.status}
          error={state.resource.error}
          onRetry={() => void controller.reload()}
          emptyMessage={view.all.length ? 'Không có ảnh khớp bộ lọc.' : 'Rạp này chưa có ảnh.'}
        />
      )}
      <Dialog
        open={Boolean(currentPreview)}
        title="Xem ảnh rạp"
        description={currentPreview?.description || cinemaName}
        size="lg"
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        {currentPreview && (
          <FacilityImage
            key={currentPreview.url}
            image={currentPreview}
            cinemaName={cinemaName}
            large
          />
        )}
      </Dialog>
    </>
  );
}

function GalleryWorkspace({ state, controller, cinemaName }) {
  return (
    <section className="facility-panel" aria-label="Thư viện ảnh rạp">
      <div className="facility-panel-heading">
        <h2>{cinemaName ? `Thư viện ảnh · ${cinemaName}` : 'Quản lý hình ảnh rạp'}</h2>
        {Boolean(state.scope?.cinemaId) && (
          <Button
            size="sm"
            variant="secondary"
            disabled={state.pending || state.resource?.status === 'loading'}
            onClick={() => void controller.reload()}
          >
            Tải lại
          </Button>
        )}
      </div>
      {!state.scope?.cinemaId ? (
        <div className="facility-empty-context">
          <p
            className="facility-help"
            style={{ fontSize: '1rem', margin: '2.5rem 1rem', textAlign: 'center' }}
          >
            Vui lòng chọn một rạp chiếu từ bộ lọc phía trên để xem và quản lý danh sách hình ảnh.
          </p>
        </div>
      ) : (
        <CinemaImageGrid state={state} controller={controller} cinemaName={cinemaName} />
      )}
    </section>
  );
}
