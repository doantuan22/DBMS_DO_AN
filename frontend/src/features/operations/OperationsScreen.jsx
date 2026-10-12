import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useManagerCinema } from '../manager/ManagerCinemaContext';
import useBookingDraftGuard from '../staff-bookings/useBookingDraftGuard';
import { operationsAdapter } from './operationsAdapters';
import { createOperationsController } from './operationsController';
import { money, operationsView, operationLabel } from './operationsModel';
import { formatDate, formatDateTime, BUSINESS_TIME_ZONE } from '../../utils/dateTime';
import { ROOM_TYPES, SEAT_TYPES, DAY_TYPES, RESOURCE_STATUSES } from '../../../../shared/resourceContract.mjs';
import ManagerResourceForm from '../../components/ManagerResourceForm';
import { AsyncState, Button, ConfirmDialog, Dialog, FilterBar, FormField, Input, PageHeader, ResourceSelect, ResourceTable, Select, StatusBadge } from '../../components/ui';
import Forbidden from '../../pages/Forbidden';
import './operations.css';

export default function OperationsScreen({ kind, manager = false }) {
  const { user } = useAuth(), context = useManagerCinema();
  const adapter = operationsAdapter(kind, user, manager ? context?.state : undefined);
  if (!adapter.allowed) return <Forbidden />;
  const actorKey = `${user.userId}:${user.permissions.map((p) => p.code).sort().join(',')}`;
  return manager ? <ManagerOperations key={actorKey} kind={kind} user={user} context={context} /> : <OperationsWorkspace key={`${actorKey}:${kind}`} adapter={adapter} />;
}

function ManagerOperations({ kind, user, context }) {
  const { state, store, changeCinema } = context;
  const [params, setParams] = useSearchParams();
  const [previousCinema, setPreviousCinema] = useState(state.cinemaId);
  const changed = previousCinema !== state.cinemaId;
  useEffect(() => {
    if (!changed) return;
    let active = true;
    void Promise.resolve().then(() => { if (active) { setPreviousCinema(state.cinemaId); setParams(state.cinemaId ? { cinemaId: state.cinemaId } : {}, { replace: true }); } });
    return () => { active = false; };
  }, [changed, state.cinemaId, setParams]);
  const requested = params.get('cinemaId');
  const assigned = !user.cinemaAssignments || user.cinemaAssignments.some((item) => String(item.cinemaId) === state.cinemaId);
  return <section className="operations">
    <div className="operations__context"><FormField label="Rạp hiện tại"><Select aria-label="Rạp hiện tại" value={state.cinemaId} disabled={state.pending || state.status !== 'success'} onChange={(e) => changeCinema(e.target.value)}>
      {state.cinemas.filter((row) => !user.cinemaAssignments || user.cinemaAssignments.some((assignment) => String(assignment.cinemaId) === String(row.id))).map((row) => <option key={row.id} value={row.id}>{row.name} · {row.city}</option>)}
    </Select></FormField></div>
    {state.status !== 'success' ? <><PageHeader title={kind === 'showtimes' ? 'Suất chiếu' : 'Bảng giá'} breadcrumbs={[{ label: 'Manager' }, { label: kind === 'showtimes' ? 'Suất chiếu' : 'Bảng giá' }]} /><AsyncState status={state.status} error={state.error} /></>
      : !state.cinemas.length ? <AsyncState status="empty" emptyMessage="Bạn không có phân công rạp còn hiệu lực." />
        : !assigned || changed ? <AsyncState status="loading" />
          : requested && requested !== state.cinemaId ? <><Forbidden /><Button variant="secondary" onClick={() => setParams({ cinemaId: state.cinemaId }, { replace: true })}>Dùng rạp hiện tại</Button></>
            : <OperationsWorkspace key={`${kind}:${state.cinemaId}:${state.epoch}`} adapter={operationsAdapter(kind, user, state)} managerStore={store} />}
  </section>;
}

function OperationsWorkspace({ adapter, managerStore }) {
  const [params, setParams] = useSearchParams(), query = params.toString();
  const queryRef = useRef(query);
  useLayoutEffect(() => { queryRef.current = query; }, [query]);
  const onQueryChange = useCallback((next) => { if (queryRef.current !== next) { queryRef.current = next; setParams(next); } }, [setParams]);
  // The pure initializer stores this callback; it only reads the ref in later events/effects.
  // oxlint-disable-next-line react/refs
  const [controller] = useState(() => createOperationsController({ adapter, managerStore, initialQuery: query, onQueryChange }));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const previousQuery = useRef(query);
  const safeDestination = useCallback((destination) => {
    const url = new URL(destination, window.location.href);
    return managerStore ? url.origin === window.location.origin && url.pathname.startsWith('/manager/') : url.origin === window.location.origin && url.pathname === window.location.pathname && (url.searchParams.get('cinemaId') ?? '') === controller.getSnapshot().cinemaId;
  }, [managerStore, controller]);
  useBookingDraftGuard(state.dirty, state.pending, { readState: controller.getSnapshot, isSafeDestination: safeDestination, message: 'Có thay đổi vận hành chưa lưu. Rời màn hình và bỏ bản nháp?' });
  useEffect(() => { void controller.start(); return () => controller.dispose(); }, [controller]);
  useEffect(() => { if (query !== previousQuery.current) { previousQuery.current = query; controller.syncQuery(query); } }, [query, controller]);
  return <OperationsView state={state} controller={controller} adapter={adapter} />;
}

export function OperationsView({ state, controller, adapter }) {
  const kind = adapter.kind, showtimes = kind === 'showtimes', title = showtimes ? 'Suất chiếu' : 'Bảng giá';
  const portal = adapter.manager ? 'manager' : 'admin';
  const view = operationsView(state, kind), busy = state.pending;
  const cinemas = state.cinemas.rows, cinemaName = cinemas.find((row) => String(row.id) === state.cinemaId)?.name;
  const roomRows = state.rooms.status === 'success' ? state.rooms.rows : [...new Map(state.resource.rows.map((row) => [row.roomId, { id: row.roomId, name: row.roomName }])).values()];
  const movies = state.movies.status === 'success' ? state.movies.rows : [...new Map(state.resource.rows.map((row) => [row.movieId, { id: row.movieId, title: row.movieTitle }])).values()];
  const schema = showtimes ? [{ key: 'roomId', label: 'Phòng', format: (id) => roomRows.find((r) => String(r.id) === id)?.name ?? 'Phòng đã chọn' }, { key: 'movieId', label: 'Phim', format: (id) => movies.find((r) => String(r.id) === id)?.title ?? 'Phim đã chọn' }, { key: 'fromDate', label: 'Từ ngày', format: formatDate }, { key: 'toDate', label: 'Đến ngày', format: formatDate }, { key: 'status', label: 'Trạng thái' }]
    : [{ key: 'seatType', label: 'Loại ghế' }, { key: 'dayType', label: 'Loại ngày' }, { key: 'format', label: 'Định dạng' }, { key: 'status', label: 'Trạng thái' }, { key: 'effectiveOn', label: 'Có hiệu lực ngày', format: formatDate }];
  const selectFilter = (key, label, options) => <FormField label={label}><Select value={state.filters[key]} disabled={busy} onChange={(e) => controller.setFilters({ [key]: e.target.value })}><option value="">Không giới hạn</option>{options.map((value) => <option key={value}>{value}</option>)}</Select></FormField>;
  const columns = showtimes ? [
    { key: 'movieTitle', label: 'Phim', render: (row) => <strong>{row.movieTitle}</strong> },
    { key: 'place', label: 'Rạp / Phòng', render: (row) => <>{row.cinemaName}<br />{row.roomName}</> },
    { key: 'startsAt', label: 'Bắt đầu (UTC+7)', render: (row) => formatDateTime(row.startsAt) },
    { key: 'endsAt', label: 'Kết thúc (UTC+7)', className: 'operations__secondary-column', render: (row) => formatDateTime(row.endsAt) },
    { key: 'format', label: 'Định dạng' }, { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
  ] : [
    { key: 'cinemaName', label: 'Rạp', render: (row) => row.cinemaName ?? cinemaName },
    { key: 'seatType', label: 'Loại ghế' }, { key: 'dayType', label: 'Loại ngày' }, { key: 'format', label: 'Định dạng', className: 'operations__secondary-column' },
    { key: 'surcharge', label: 'Phụ thu (VND)', render: (row) => money(row.surcharge) },
    { key: 'period', label: 'Thời gian áp dụng', render: (row) => <>{formatDate(row.startsOn)}<br />{row.endsOn ? formatDate(row.endsOn) : 'Không có ngày kết thúc'}</> },
    { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
  ];
  columns.push({ key: 'actions', label: 'Thao tác', render: (row) => <div className="operations__actions">
    <Button variant="secondary" size="sm" disabled={busy} aria-label={`Xem ${operationLabel(kind, row)}`} onClick={() => controller.select(row)}>Xem</Button>
    <Button variant="secondary" size="sm" disabled={busy || showtimes && state.movies.status !== 'success'} aria-label={`Sửa ${operationLabel(kind, row)}`} onClick={() => controller.openEditor(row)}>Sửa</Button>
    {showtimes && !['Đã hủy', 'Hoàn thành'].includes(row.status) && <Button variant="danger" size="sm" disabled={busy} aria-label={`Hủy ${operationLabel(kind, row)}`} onClick={() => controller.requestCancel(row)}>Hủy suất</Button>}
  </div> });
  const selected = state.selection, editor = state.editor;
  return <section className="operations">
    <PageHeader title={title} breadcrumbs={[{ label: adapter.manager ? 'Manager' : 'Admin', to: `/${portal}/overview` }, { label: title }]}
      description={showtimes ? `Lịch chiếu theo rạp, phòng và ngày · ${BUSINESS_TIME_ZONE} (UTC+7)` : 'Phụ thu cộng vào giá vé cơ bản của suất chiếu. Giá vé cũ giữ nguyên snapshot.'}
      actions={<Button disabled={busy || !state.cinemaId || state.resource.status !== 'success' || showtimes && (state.rooms.status !== 'success' || state.movies.status !== 'success')} onClick={() => controller.openEditor()}>Thêm {showtimes ? 'suất chiếu' : 'bảng giá'}</Button>} />
    {!adapter.manager && <ResourceSelect label="Rạp" scopeKey={`operations:${kind}`} value={state.cinemaId} required={false} placeholder="Tất cả rạp" options={cinemas.map((row) => ({ id: row.id, label: row.name }))} lookupStatus={state.cinemas.status} lookupError={state.cinemas.error} onRetry={() => void controller.start()} disabled={busy} onChange={(id) => controller.chooseCinema(id)} />}
    {!state.cinemaId && <p className="operations__help">Chọn rạp để thêm {showtimes ? 'suất chiếu' : 'bảng giá'}.</p>}
    {state.cinemas.limited && <p className="operations__help">Danh sách rạp lấy từ dữ liệu hiện có. Cần quyền tra cứu rạp để chọn rạp chưa có dữ liệu.</p>}
    {showtimes && state.cinemaId && !adapter.canRooms && <p role="status">Cần quyền tra cứu phòng để tạo suất chiếu bằng tên phòng.</p>}
    {state.notice && <p role={state.notice.error ? 'alert' : 'status'} className={state.notice.error ? 'operations__error' : 'operations__success'}>{state.notice.error?.status === 409 && 'Xung đột: '}{state.notice.error?.message ?? state.notice.text}</p>}
    <FilterBar label={`Bộ lọc ${title.toLowerCase()}`} schema={schema} draft={state.filters} applied={state.applied} pending={busy} error={state.filterError} onApply={() => controller.applyFilters()} onReset={() => controller.resetFilters()}>
      {showtimes ? <>
        <FormField label="Phòng lọc lịch"><Select value={state.filters.roomId} disabled={busy || !state.cinemaId} onChange={(e) => controller.setFilters({ roomId: e.target.value })}><option value="">Tất cả phòng</option>{roomRows.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</Select></FormField>
        <FormField label="Phim lọc lịch"><Select value={state.filters.movieId} disabled={busy} onChange={(e) => controller.setFilters({ movieId: e.target.value })}><option value="">Tất cả phim</option>{movies.map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</Select></FormField>
        <FormField label="Từ ngày" required><Input type="date" value={state.filters.fromDate} required disabled={busy} onChange={(e) => controller.setFilters({ fromDate: e.target.value })} /></FormField>
        <FormField label="Đến ngày" required><Input type="date" value={state.filters.toDate} required disabled={busy} onChange={(e) => controller.setFilters({ toDate: e.target.value })} /></FormField>
        {selectFilter('status', 'Trạng thái suất chiếu', RESOURCE_STATUSES.showtimes)}
      </> : <>
        {selectFilter('seatType', 'Loại ghế', [...SEAT_TYPES, 'Tất cả'])}{selectFilter('dayType', 'Loại ngày', DAY_TYPES)}{selectFilter('format', 'Định dạng', [...ROOM_TYPES, 'Tất cả'])}{selectFilter('status', 'Trạng thái bảng giá', RESOURCE_STATUSES.pricing)}
        <FormField label="Có hiệu lực ngày"><Input type="date" value={state.filters.effectiveOn} disabled={busy} onChange={(e) => controller.setFilters({ effectiveOn: e.target.value })} /></FormField>
      </>}
    </FilterBar>
    <p className="operations__help" role="status">{state.resource.status === 'success' ? `${view.total} kết quả · ${showtimes ? 'Toàn bộ lịch trong khoảng ngày đang áp dụng' : 'Toàn bộ quy tắc giá trong phạm vi rạp đang chọn'}` : 'Đang tra cứu dữ liệu…'}</p>
    <ResourceTable caption={`Danh sách ${title.toLowerCase()}`} columns={columns} rows={view.rows} rowKey="id" status={state.resource.status} error={state.resource.error} onRetry={() => void controller.reload()} pagination={{ page: view.page, pageSize: state.pageSize, total: view.total, disabled: busy, onPageChange: controller.setPage }} />
    <AsyncState status={state.rooms.status === 'error' ? 'error' : 'idle'} error={state.rooms.error} onRetry={() => void controller.reloadRooms()} />
    <AsyncState status={state.movies.status === 'error' ? 'error' : 'idle'} error={state.movies.error} onRetry={() => void controller.start()} />
    {selected && <section className="operations__panel" aria-label={`Chi tiết ${title.toLowerCase()}`}>
      <h2>{operationLabel(kind, selected)}</h2><p>{selected.cinemaName ?? cinemaName} · <StatusBadge status={selected.status} /></p>
      {showtimes ? <><p>{formatDateTime(selected.startsAt)} — {formatDateTime(selected.endsAt)} · {selected.format}</p><p>Giá vé cơ bản: <strong>{money(selected.basePrice)}</strong>. Phụ thu và giá vé cuối cùng do server xác định.</p></> : <><p>Phụ thu: <strong>{money(selected.surcharge)}</strong> · {formatDate(selected.startsOn)} — {selected.endsOn ? formatDate(selected.endsOn) : 'Không có ngày kết thúc'}</p><p>Thay đổi quy tắc giá áp dụng cho giao dịch tiếp theo; không tính lại giá vé trong lịch sử.</p></>}
      <Button variant="secondary" onClick={() => controller.closeDetail()}>Đóng chi tiết</Button>
    </section>}
    <Dialog open={Boolean(editor)} busy={busy} size="lg" title={`${editor?.row ? 'Sửa' : 'Thêm'} ${title.toLowerCase()}`} description={showtimes ? 'Chọn phim/phòng theo tên. Thời gian theo giờ Việt Nam (UTC+7).' : 'Phụ thu bằng VND. Rạp của bảng giá không thay đổi khi sửa.'} onOpenChange={(open) => { if (!open) controller.closeEditor(); }}>
      {editor && <><p><strong>{editor.row?.cinemaName ?? cinemaName}</strong>{editor.row && ' · Đang sửa tài nguyên hiện có'}</p><ManagerResourceForm key={`${kind}:${editor.row?.id ?? 'new'}:${editor.cinemaId}`} kind={showtimes ? 'showtime' : 'pricing'} row={editor.row} busy={busy} scopeKey={editor.cinemaId} draft={editor.draft} onDraftChange={controller.setDraft} onSave={controller.save} onRequestCancel={controller.closeEditor}
        lookups={{ movies: { status: state.movies.status, error: state.movies.error, options: state.movies.rows.map((row) => ({ id: row.id, label: row.title })), onRetry: () => void controller.start() }, rooms: { status: state.rooms.status, error: state.rooms.error, options: state.rooms.rows.map((row) => ({ id: row.id, label: row.name })), onRetry: () => void controller.reloadRooms() } }} />
        <Button variant="secondary" disabled={busy} onClick={controller.closeEditor}>Đóng form</Button></>}
    </Dialog>
    <ConfirmDialog open={Boolean(state.confirmation)} busy={busy} title="Bỏ thay đổi chưa lưu?" description="Thao tác này sẽ bỏ bản nháp đang mở." confirmLabel="Bỏ thay đổi" onOpenChange={(open) => { if (!open) controller.cancelDiscard(); }} onConfirm={controller.confirmDiscard} />
    <ConfirmDialog key={state.cancelTarget?.id ?? 'none'} open={Boolean(state.cancelTarget)} busy={busy} title="Hủy suất chiếu?" entityLabel={state.cancelTarget && operationLabel(kind, state.cancelTarget)} description={`Trạng thái: ${state.cancelTarget?.status ?? ''}. Server kiểm tra đơn giữ ghế và điều kiện hủy; lịch sử được giữ. Đơn/vé liên quan được xử lý theo nghiệp vụ hủy suất hiện có.`} confirmLabel="Hủy suất chiếu" onOpenChange={(open) => { if (!open) controller.closeCancel(); }} onConfirm={controller.cancel} />
  </section>;
}
