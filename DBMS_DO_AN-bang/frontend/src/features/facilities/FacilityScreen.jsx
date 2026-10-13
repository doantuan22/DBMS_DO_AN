import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
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
import Button from '../../components/ui/Button';
import AsyncState from '../../components/ui/AsyncState';
import StatusBadge from '../../components/ui/StatusBadge';
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
import { loadOccupancy } from './occupancyRead';

export default function FacilityScreen({ kind, manager = false }) {
  const { user } = useAuth();
  const context = useManagerCinema(), inRouter = useInRouterContext();
  if (!inRouter) return <MemoryRouter><FacilityScreen kind={kind} manager={manager} /></MemoryRouter>;
  const adapter = facilityAdapter(kind, user, manager ? context?.state : undefined);
  if (!adapter.allowed) return kind === 'images' ? <p>Bạn chưa được cấp quyền quản lý ảnh rạp.</p> : <Forbidden />;
  const actorKey = `${user.userId}:${user.permissions.map((permission) => permission.code).sort().join(',')}`;
  return manager ? <ManagerFacilities key={actorKey} kind={kind} context={context} user={user} /> : <FacilityWorkspace key={`${actorKey}:${kind}`} adapter={adapter} />;
}

function ManagerFacilities({ kind, context, user }) {
  const [params, setParams] = useSearchParams();
  const { state, store, changeCinema } = context;
  const [lastCinema, setLastCinema] = useState(state.cinemaId), changedCinema = lastCinema !== state.cinemaId;
  useLayoutEffect(() => {
    if (lastCinema === state.cinemaId) return;
    void Promise.resolve().then(() => setLastCinema(state.cinemaId));
    setParams(state.cinemaId ? { cinemaId: state.cinemaId } : {}, { replace: true });
  }, [state.cinemaId, setParams, lastCinema]);
  const requested = params.get('cinemaId');
  const assignment = !user.cinemaAssignments || user.cinemaAssignments.some((item) => String(item.cinemaId) === state.cinemaId);
  const adapter = facilityAdapter(kind, user, state);
  return <section className="facility-manager">
    <div className="facility-context"><FormField label="Rạp hiện tại"><Select aria-label="Rạp hiện tại" value={state.cinemaId} disabled={state.pending || state.status !== 'success'} onChange={(event) => changeCinema(event.target.value)}>
      {state.cinemas.filter((cinema) => !user.cinemaAssignments || user.cinemaAssignments.some((item) => String(item.cinemaId) === String(cinema.id))).map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name} · {cinema.city}</option>)}
    </Select></FormField></div>
    {state.status !== 'success' ? <><PageHeader title={kind === 'rooms' ? 'Phòng chiếu' : 'Ghế'} breadcrumbs={[{ label: 'Manager' }, { label: kind === 'rooms' ? 'Phòng chiếu' : 'Ghế' }]} /><AsyncState status={state.status} error={state.error} /></> : !state.cinemas.length ? <AsyncState status="empty" emptyMessage="Bạn không có phân công rạp còn hiệu lực." /> : !assignment || changedCinema ? <AsyncState status="loading" /> : requested && requested !== state.cinemaId ? <><Forbidden /><Button variant="secondary" onClick={() => setParams({ cinemaId: state.cinemaId }, { replace: true })}>Dùng rạp hiện tại</Button></> :
      <FacilityWorkspace key={`${state.cinemaId}:${state.epoch}:${kind}`} adapter={adapter} managerStore={store} />}
  </section>;
}

function FacilityWorkspace({ adapter, managerStore }) {
  const [params, setParams] = useSearchParams(), query = params.toString();
  const [controller] = useState(() => createFacilityController({ adapter, managerStore, initialQuery: query, onQueryChange: (next) => setParams(next) }));
  const [ownerAdapter] = useState(adapter);
  const lastQuery = useRef(query);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const isSafeDestination = useCallback((destination) => {
    const url = new URL(destination, window.location.href), scope = controller.getSnapshot().scope;
    return managerStore ? url.origin === window.location.origin && url.pathname.startsWith('/manager/') : url.pathname === window.location.pathname && (url.searchParams.get('cinemaId') ?? '') === scope.cinemaId && (url.searchParams.get('roomId') ?? '') === scope.roomId && (url.searchParams.get('showtimeId') ?? '') === controller.getSnapshot().showtimeId;
  }, [controller, managerStore]);
  useBookingDraftGuard(state.dirty, state.pending, { readState: controller.getSnapshot, isSafeDestination, message: 'Có thay đổi cơ sở vật chất chưa lưu. Rời màn hình và bỏ bản nháp?' });
  useEffect(() => { void controller.start(); return () => controller.dispose(); }, [controller]);
  useEffect(() => { if (query !== lastQuery.current) { lastQuery.current = query; void controller.syncQuery(query); } }, [controller, query]);
  return <FacilityView state={state} controller={controller} adapter={ownerAdapter} />;
}

function NamedContext({ state, controller, adapter }) {
  return <section className="facility-panel facility-context-selectors" aria-label="Chọn context cơ sở vật chất">
    {!adapter.managerCinemaId && <div><ResourceSelect label="Rạp" value={state.scope.cinemaId} options={state.lookup.rows.map((row) => ({ id: row.id, label: row.name }))} scopeKey="facility-cinemas"
      lookupStatus={state.lookup.status} lookupError={state.lookup.error} onRetry={() => void controller.start()} required={false} disabled={state.pending} onChange={(id) => void controller.chooseCinema(id)} />
      {state.lookup.limited && <p className="facility-help">Chỉ có rạp xuất hiện trong danh sách phòng được cấp quyền; rạp chưa có phòng cần quyền tra cứu rạp.</p>}</div>}
    {adapter.kind === 'seats' && <ResourceSelect label="Phòng" scopeKey={state.scope.cinemaId} value={state.scope.roomId} options={state.rooms.rows.map((row) => ({ id: row.id, label: row.name }))}
      lookupStatus={state.rooms.status === 'idle' ? 'success' : state.rooms.status} lookupError={state.rooms.error} onRetry={() => void controller.reloadRooms()} disabled={state.pending || !state.scope.cinemaId} required={false} onChange={(id) => void controller.chooseRoom(id)} emptyMessage={state.scope.cinemaId ? 'Rạp này chưa có phòng để chọn.' : 'Chọn rạp trước.'} />}
    <AsyncState status={state.lookup.status === 'error' ? 'error' : 'idle'} error={state.lookup.error} errorMessage={state.lookup.error?.message} />
    <AsyncState status={state.lookup.status === 'loading' ? 'loading' : 'idle'} loadingMessage="Đang tải danh sách rạp…" />
    <AsyncState status={state.rooms.status === 'error' ? 'error' : 'idle'} error={state.rooms.error} errorMessage={state.rooms.error?.message} />
  </section>;
}

export function FacilityFilters({ state, controller, kind, rows }) {
  const keys = kind === 'seats' ? ['row', 'type', 'status'] : kind === 'rooms' ? ['type', 'status'] : kind === 'cinemas' ? ['city', 'status'] : ['status'];
  const labels = { search: kind === 'seats' ? 'Tên ghế' : kind === 'images' ? 'Chú thích' : kind === 'cinemas' ? 'Tìm rạp' : 'Tên', row: 'Hàng ghế', type: 'Loại', status: 'Trạng thái', city: 'Thành phố' };
  return <FilterBar label={`Bộ lọc ${facilityLabels[kind]}`} schema={['search', ...keys].map((key) => ({ key, label: labels[key] }))} draft={state.filters} applied={state.applied}
    applyLabel={kind === 'cinemas' ? 'Tìm rạp' : 'Tìm'}
    pending={state.pending} onApply={() => controller.applyFilters()} onReset={() => controller.resetFilters()}>
    <FormField label={labels.search}>
      <div className="facility-filters__search-row">
        <Input type="search" disabled={state.pending} placeholder={kind === 'seats' ? 'Ví dụ: A1' : kind === 'cinemas' ? 'Nhập tên rạp, địa chỉ...' : 'Nhập từ khóa'} value={state.filters.search} maxLength={150} onChange={(event) => controller.setFilters({ search: event.target.value })} />
        <Button type="submit" disabled={state.pending} size="sm">Tìm</Button>
      </div>
    </FormField>
    {keys.map((key) => <FormField key={key} label={labels[key]}><Select disabled={state.pending} value={state.filters[key]} onChange={(event) => controller.setFilters({ [key]: event.target.value })}>
      <option value="">Tất cả</option>{[...new Set([...rows.map((row) => row[key]), state.filters[key]].filter(Boolean))].map((value) => <option key={value}>{value}</option>)}
    </Select></FormField>)}
  </FilterBar>;
}

export function FacilityView({ state, controller, adapter }) {
  const { kind } = adapter, manager = Boolean(adapter.managerCinemaId), view = resourceView(state);
  const cinema = state.lookup.rows.find((row) => String(row.id) === state.scope.cinemaId), room = state.rooms.rows.find((row) => String(row.id) === state.scope.roomId);
  const contextLabel = [room?.name, cinema?.name].filter(Boolean).join(' · ');
  const title = { seats: 'Ghế', rooms: 'Phòng chiếu', cinemas: 'Rạp', images: 'Ảnh rạp' }[kind];
  const ready = state.resource.status === 'success' && !state.pending && state.mode === 'configuration';
  const description = { seats: 'Cấu hình ghế theo phòng, xem thông tin và thao tác đúng context.', rooms: 'Phòng chiếu và sức chứa tại rạp đang được phân công.', cinemas: 'Quản lý rạp và truy cập các tài nguyên liên quan.', images: 'Quản lý thư viện hình ảnh theo từng rạp.' }[kind];
  return <section className={`facility-workspace facility-workspace--${kind}`} aria-label={`Quản lý ${facilityLabels[kind]}`}>
    <PageHeader title={title} description={description} breadcrumbs={[{ label: manager ? 'Manager' : 'Quản trị', to: manager ? '/manager/overview' : '/admin/overview' }, { label: title }]}
      primaryAction={<Button disabled={!ready} onClick={() => controller.openEditor()}>＋ Thêm {facilityLabels[kind]}</Button>} />
    {state.notice && (state.notice.error ? <AsyncState status="error" error={state.notice.error} errorMessage={state.notice.error.message} /> : <p className="facility-success" role="status">{state.notice.text}</p>)}
    {kind !== 'cinemas' && (kind === 'seats' || !manager) && <NamedContext state={state} controller={controller} adapter={adapter} />}
    {kind === 'cinemas' && state.lookup.status === 'error' && <AsyncState status="error" error={state.lookup.error} errorMessage={state.lookup.error.message} />}
    {(kind !== 'images' || state.scope.cinemaId) && <FacilityFilters state={state} controller={controller} kind={kind} rows={view.all} />}
    {kind === 'seats' ? <SeatWorkspace state={state} controller={controller} adapter={adapter} roomName={contextLabel} /> : kind === 'images' ? <GalleryWorkspace state={state} controller={controller} cinemaName={cinema?.name} /> : <ResourceWorkspace state={state} controller={controller} adapter={adapter} />}
    {state.editor && <FacilityEditor kind={kind} editor={state.editor} contextLabel={contextLabel} busy={state.pending} controller={controller} />}
    <ConfirmDialog key={state.deleteTarget?.id ?? 'closed'} open={Boolean(state.deleteTarget)} title={`Xóa ${facilityLabels[kind]}?`} busy={state.pending}
      entityLabel={state.deleteTarget ? `${state.deleteTarget.label ?? state.deleteTarget.name ?? state.deleteTarget.description ?? 'Ảnh rạp'} · ${contextLabel} · ${state.deleteTarget.status}` : undefined}
      description={kind === 'seats' ? 'Ghế có lịch sử vé không thể xóa. Hệ thống từ chối nếu không đủ điều kiện.' : kind === 'rooms' ? 'Phòng có lịch sử suất chiếu sẽ chuyển Ngưng hoạt động để giữ lịch sử; phòng chưa có lịch sử được xóa cùng ghế.' : kind === 'cinemas' ? 'Rạp có dữ liệu liên quan không thể xóa. Có thể sửa trạng thái thành Tạm đóng.' : 'Ảnh sẽ bị xóa khỏi thư viện của rạp này.'}
      onOpenChange={(open) => { if (!open) controller.cancelDelete(); }} onConfirm={() => controller.confirmDelete()} />
    <ConfirmDialog open={Boolean(state.confirmation)} title="Bỏ thay đổi chưa lưu?" description="Bản nháp hiện tại sẽ bị bỏ trước khi đổi context hoặc đóng form." confirmLabel="Bỏ thay đổi" busy={state.pending}
      onOpenChange={(open) => { if (!open) controller.cancelDiscard(); }} onConfirm={() => controller.confirmDiscard()} />
  </section>;
}

function ResourceWorkspace({ state, controller, adapter }) {
  const view = resourceView(state), rooms = adapter.kind === 'rooms';
  const seatPath = (row) => `/manager/seats?${new URLSearchParams({ cinemaId: String(row.cinemaId), roomId: String(row.id) })}`;
  const columns = rooms ? [{ key: 'name', label: 'Phòng' }, { key: 'type', label: 'Loại phòng' }, { key: 'seatCount', label: 'Số ghế', render: (row) => row.seatCount ?? 'Chưa có dữ liệu' }] :
    [{ key: 'name', label: 'Tên rạp', render: (row) => <Button variant="quiet" onClick={() => controller.select(row)} disabled={state.pending}>{row.name}</Button> }, { key: 'address', label: 'Địa chỉ' }, { key: 'city', label: 'Thành phố' }, { key: 'roomCount', label: 'Số phòng', render: (row) => state.counts.status === 'success' ? state.counts.rooms.filter((room) => String(room.cinemaId) === String(row.id)).length : state.counts.status === 'loading' ? 'Đang tải…' : 'Chưa có dữ liệu' }];
  columns.push({ key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> }, { key: 'actions', label: 'Thao tác', render: (row) => <div className="facility-actions">
    {rooms ? adapter.can('QL_GHE') && <Link className="ui-button ui-button--secondary ui-button--sm" to={seatPath(row)}>Xem sơ đồ ghế</Link> : <Button variant="secondary" size="sm" disabled={state.pending} onClick={() => controller.select(row)}>Chi tiết</Button>}
    <Button variant="secondary" size="sm" disabled={state.pending} onClick={() => controller.openEditor(row)}>Sửa</Button><details><summary>Khác</summary><Button variant="danger" size="sm" disabled={state.pending} onClick={() => controller.requestDelete(row)}>Xóa</Button></details>
  </div> });
  return <>
    <section className="facility-panel"><div className="facility-panel-heading"><h2>{rooms ? 'Danh sách phòng' : 'Danh sách rạp'}</h2><Button size="sm" variant="secondary" disabled={state.pending || state.resource.status === 'loading'} onClick={() => void controller.reload()}>Tải lại</Button></div>
      {!rooms && <p className="facility-help">Số phòng gồm các trạng thái. Nếu chưa tra cứu được, số phòng hiển thị Chưa có dữ liệu.</p>}
      {!rooms && state.counts.error && <AsyncState status="error" error={state.counts.error} />}
      <ResourceTable columns={columns} rows={view.rows} rowKey="id" caption={rooms ? 'Phòng tại rạp hiện tại' : 'Rạp trong hệ thống'} status={state.resource.status} error={state.resource.error} onRetry={() => void controller.reload()} emptyMessage="Không có dữ liệu phù hợp."
        pagination={{ page: view.page, pageSize: state.pageSize, total: view.total, disabled: state.pending, onPageChange: (page) => controller.setPage(page) }} />
    </section>
    {!rooms && state.selection && <CinemaDetail cinema={state.selection} adapter={adapter} controller={controller} busy={state.pending} />}
  </>;
}

function CinemaDetail({ cinema, adapter, controller, busy }) {
  return <section className="facility-panel" aria-label="Chi tiết rạp"><p className="facility-eyebrow">RẠP ĐANG CHỌN</p><h2>{cinema.name}</h2><StatusBadge status={cinema.status} />
    <dl className="facility-details"><div><dt>Địa chỉ</dt><dd>{cinema.address}</dd></div><div><dt>Thành phố</dt><dd>{cinema.city}</dd></div><div><dt>Điện thoại</dt><dd>{cinema.phone || 'Chưa có thông tin'}</dd></div><div><dt>Mô tả</dt><dd>{cinema.description || 'Chưa có mô tả'}</dd></div></dl>
    <div className="facility-actions">{adapter.can('QL_PHONG') && <Link className="ui-button ui-button--secondary" to={`/admin/facilities/rooms?cinemaId=${encodeURIComponent(cinema.id)}`}>Phòng chiếu</Link>}
      <Link className="ui-button ui-button--secondary" to={`/admin/cinemas/images?cinemaId=${encodeURIComponent(cinema.id)}`}>Hình ảnh rạp</Link>
      {adapter.can('QL_SUAT_CHIEU') && <Link className="ui-button ui-button--secondary" to="/admin/operations/showtimes">Danh sách suất chiếu</Link>}
      <Button disabled={busy} onClick={() => controller.openEditor(cinema)}>Sửa thông tin rạp</Button>
    </div>
  </section>;
}

function useOccupancy(state, adapter) {
  const key = `${state.scope.cinemaId}:${state.scope.roomId}:${state.mode}:${state.showtimeId}`;
  const [resource, setResource] = useState({ status: 'idle' }), [showtimes, setShowtimes] = useState({ status: 'idle', rows: [] });
  useEffect(() => {
    if (state.mode !== 'occupancy' || !adapter.canShowtimes || state.rooms.status !== 'success' || !state.rooms.rows.some((room) => String(room.id) === state.scope.roomId && String(room.cinemaId) === state.scope.cinemaId)) return;
    let active = true;
    void Promise.resolve().then(() => { if (active) setShowtimes({ status: 'loading', rows: [], key: state.scope.roomId }); });
    adapter.showtimes(state.scope).then((rows) => { if (active) setShowtimes({ status: 'success', rows, key: state.scope.roomId }); }).catch((error) => { if (active) setShowtimes({ status: 'error', rows: [], error, key: state.scope.roomId }); });
    return () => { active = false; };
  }, [adapter, state.scope, state.rooms, state.mode]);
  useEffect(() => {
    if (state.mode !== 'occupancy' || !state.showtimeId || showtimes.status !== 'success' || showtimes.key !== state.scope.roomId) return;
    let active = true;
    void Promise.resolve().then(() => { if (active) setResource({ status: 'loading', rows: [], key }); });
    loadOccupancy({ scope: state.scope, showtimeId: state.showtimeId, showtimes: showtimes.rows, readSeats: getShowtimeSeats, accepts: () => active }).then((rows) => {
      if (active && rows) setResource({ status: 'success', rows, key });
    }).catch((error) => { if (active) setResource({ status: 'error', rows: [], error, key }); });
    return () => { active = false; };
  }, [key, state.mode, state.showtimeId, state.scope, showtimes]);
  return { resource: resource.key === key ? resource : { status: 'idle', rows: [] }, showtimes: showtimes.key === state.scope.roomId ? showtimes : { status: 'idle', rows: [] } };
}

function SeatWorkspace({ state, controller, adapter, roomName }) {
  const occupancy = useOccupancy(state, adapter), source = state.mode === 'occupancy' ? occupancy.resource : state.resource;
  const view = resourceView({ ...state, resource: source }), mapPossible = seatRows(view.all) !== null;
  const columns = [{ key: 'label', label: 'Ghế' }, { key: 'row', label: 'Hàng' }, { key: 'number', label: 'Số' }, { key: 'type', label: 'Loại' }, { key: 'status', label: state.mode === 'occupancy' ? 'Tình trạng suất' : 'Cấu hình', render: (row) => <StatusBadge status={row.status} /> }, { key: 'actions', label: 'Thao tác', render: (row) => <Button variant="secondary" size="sm" disabled={state.pending} onClick={() => controller.select(row)}>Xem {row.label}</Button> }];
  return <>
    <div className="facility-actions" aria-label="Chế độ sơ đồ ghế"><Button variant={state.mode === 'configuration' ? 'primary' : 'secondary'} disabled={state.pending} aria-pressed={state.mode === 'configuration'} onClick={() => controller.setMode('configuration')}>Cấu hình phòng</Button>
      {adapter.canShowtimes && <Button variant={state.mode === 'occupancy' ? 'primary' : 'secondary'} disabled={state.pending || !state.scope.roomId} aria-pressed={state.mode === 'occupancy'} onClick={() => controller.setMode('occupancy')}>Theo suất chiếu · chỉ đọc</Button>}
    </div>
    {state.mode === 'occupancy' && <div className="facility-panel"><ResourceSelect label="Suất chiếu" scopeKey={state.scope.roomId} value={state.showtimeId} lookupStatus={occupancy.showtimes.status} lookupError={occupancy.showtimes.error}
      options={occupancy.showtimes.rows.map((row) => ({ id: row.id, label: `${row.movieTitle} · ${formatDateTime(row.startsAt)}` }))} onChange={(id) => controller.chooseShowtime(id)} required={false} disabled={state.pending} />
      <AsyncState status={occupancy.showtimes.status === 'error' ? 'error' : 'idle'} error={occupancy.showtimes.error} />
      <p className="facility-help">Tình trạng do API suất chiếu cung cấp, không chỉnh trạng thái bán vé từ workspace cấu hình.</p></div>}
    <div className="facility-panel-heading"><p>{roomName || 'Chọn rạp và phòng để xem ghế'}{source.status === 'success' && ` · ${view.total}/${view.all.length} ghế khớp lọc`}</p><div className="facility-actions"><Button variant="secondary" size="sm" aria-pressed={state.view === 'map'} onClick={() => controller.setView('map')}>Sơ đồ</Button><Button variant="secondary" size="sm" aria-pressed={state.view === 'list'} onClick={() => controller.setView('list')}>Danh sách</Button><Button variant="secondary" size="sm" disabled={!state.scope.roomId || state.pending} onClick={() => void controller.reload()}>Tải lại cấu hình</Button></div></div>
    <div className="facility-seat-workspace"><section className="facility-panel">
      {source.status === 'success' && view.all.length ? <>{!mapPossible && <p role="alert">Chưa đủ hàng/số ghế nhất quán để dựng sơ đồ. Hãy sử dụng danh sách bên dưới.</p>}
        {state.view === 'map' && mapPossible ? <SeatLayout seats={view.all} selectedId={state.selection?.id} filters={state.applied} mode={state.mode} disabled={state.pending} onSelect={(row) => controller.select(row)} /> :
          <ResourceTable columns={columns} rows={view.rows} rowKey="id" caption="Danh sách ghế theo phòng" pagination={{ page: view.page, pageSize: state.pageSize, total: view.total, disabled: state.pending, onPageChange: (page) => controller.setPage(page) }} emptyMessage="Không có ghế khớp bộ lọc." />}</> : <AsyncState status={source.status === 'success' ? 'empty' : source.status === 'idle' ? 'empty' : source.status} error={source.error} emptyMessage={state.mode === 'occupancy' ? 'Chọn suất chiếu để xem tình trạng ghế.' : state.scope.roomId ? 'Phòng chưa có ghế.' : 'Chọn phòng để tải sơ đồ ghế.'} onRetry={() => void controller.reload()} />}
    </section><SeatInspector seat={view.all.find((row) => String(row.id) === String(state.selection?.id))} roomName={roomName} mode={state.mode} busy={state.pending} onEdit={state.mode === 'configuration' ? (row) => controller.openEditor(row) : undefined} onDelete={state.mode === 'configuration' ? (row) => controller.requestDelete(row) : undefined} /></div>
  </>;
}

export function FacilityImage({ image, cinemaName, large = false }) {
  const [failed, setFailed] = useState(false);
  return failed ? <div className="facility-image-fallback" role="img" aria-label={`Không tải được ảnh của ${cinemaName}`}><strong>Ảnh chưa tải được</strong><span>Kiểm tra kết nối hoặc nguồn ảnh.</span></div> :
    <img className={large ? 'facility-preview-image' : 'facility-thumbnail'} src={image.url} alt={image.description || `Ảnh của ${cinemaName}`} loading={large ? 'eager' : 'lazy'} onError={() => setFailed(true)} />;
}

function GalleryWorkspace({ state, controller, cinemaName }) {
  const view = resourceView(state), [preview, setPreview] = useState(null);
  const currentPreview = preview && preview.cinemaId === Number(state.scope.cinemaId) && view.all.find((image) => image.id === preview.id);
  return <section className="facility-panel" aria-label="Thư viện ảnh rạp"><div className="facility-panel-heading"><h2>{cinemaName || 'Chọn rạp để quản lý hình ảnh'}</h2><Button size="sm" variant="secondary" disabled={!state.scope.cinemaId || state.pending || state.resource.status === 'loading'} onClick={() => void controller.reload()}>Tải lại</Button></div>
    {state.resource.status === 'success' && view.total ? <><p>{view.total} ảnh phù hợp</p><div className="facility-gallery">{view.rows.map((image, index) => <article className="facility-image-card" key={`${state.scope.cinemaId}:${image.id}`}>
      <button type="button" className="facility-preview-trigger" aria-label={`Xem ảnh ${image.description || index + 1} của ${cinemaName}`} onClick={() => setPreview(image)}><FacilityImage key={image.url} image={image} cinemaName={cinemaName} /></button>
      <div className="facility-image-card__body"><div className="facility-actions"><StatusBadge status={image.status} />{image.cover && <strong className="facility-cover-badge">Ảnh chính</strong>}</div><h3>{image.description || 'Chưa có chú thích'}</h3><p>Thứ tự {image.displayOrder}</p>
        <div className="facility-actions"><Button variant="secondary" size="sm" disabled={state.pending} onClick={() => controller.openEditor(image)}>Sửa ảnh</Button>{!image.cover && <Button variant="secondary" size="sm" disabled={state.pending || image.status !== 'Hoạt động'} onClick={() => void controller.setCover(image)}>Đặt ảnh chính</Button>}<details><summary>Khác</summary><Button variant="danger" size="sm" disabled={state.pending} onClick={() => controller.requestDelete(image)}>Xóa ảnh</Button></details></div>
      </div></article>)}</div><nav className="facility-actions" aria-label="Phân trang thư viện"><Button variant="secondary" disabled={view.page <= 1 || state.pending} onClick={() => controller.setPage(view.page - 1)}>Trang trước</Button><span>Trang {view.page} / {Math.ceil(view.total / state.pageSize)}</span><Button variant="secondary" disabled={view.page * state.pageSize >= view.total || state.pending} onClick={() => controller.setPage(view.page + 1)}>Trang sau</Button></nav></> :
      <AsyncState status={state.resource.status === 'success' ? 'empty' : state.resource.status} error={state.resource.error} onRetry={() => void controller.reload()} emptyMessage={view.all.length ? 'Không có ảnh khớp bộ lọc.' : 'Rạp này chưa có ảnh.'} />}
    <Dialog open={Boolean(currentPreview)} title="Xem ảnh rạp" description={currentPreview?.description || cinemaName} size="lg" onOpenChange={(open) => { if (!open) setPreview(null); }}>{currentPreview && <FacilityImage key={currentPreview.url} image={currentPreview} cinemaName={cinemaName} large />}</Dialog>
  </section>;
}
