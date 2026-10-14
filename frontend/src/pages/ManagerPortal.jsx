import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userCanAct } from '../utils/authorization';
import { formatDateTime, formatDate } from '../utils/dateTime';
import * as api from '../api/managerApi';
import { bookingErrorMessage } from '../utils/bookingLimits';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import ManagerResourceForm from '../components/ManagerResourceForm';
import ResourceSelect from '../components/ui/ResourceSelect';
import FormField from '../components/ui/FormField';
import Select from '../components/ui/Select';
import ManagerRevenue from '../components/ManagerRevenue';
import { RESOURCE_STATUSES } from '../../../shared/resourceContract.mjs';
import { getMovies } from '../api/catalogApi';
import { Link, MemoryRouter, useInRouterContext } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import { useManagerCinema } from '../features/manager/ManagerCinemaContext';
import { ManagerCinemaProvider } from '../layouts/ManagerLayout';
import { MANAGER_SECTION_ROUTES } from '../routes/managerSectionRoutes';
import {
  createManagerRequestOwner,
  loadManagerScreen,
} from '../features/manager/managerScreenRequests';

export default function ManagerPortal({ routeSection }) {
  const context = useManagerCinema();
  const inRouter = useInRouterContext();
  const { user } = useAuth();
  // Keep standalone audit fixtures compatible, using the same state owner.
  if (!context) {
    const standalone = (
      <ManagerCinemaProvider user={user}>
        <ManagerPortal routeSection={routeSection} />
      </ManagerCinemaProvider>
    );
    return inRouter ? standalone : <MemoryRouter>{standalone}</MemoryRouter>;
  }
  const { state, store, changeCinema } = context;
  const route = MANAGER_SECTION_ROUTES[routeSection] ?? { label: 'Manager Portal' };
  const currentAssignment =
    !user?.cinemaAssignments ||
    user.cinemaAssignments.some((assignment) => String(assignment.cinemaId) === state.cinemaId);
  const scopeKey = `${state.cinemaId}:${state.epoch}:${user?.userId}:${user?.permissions
    ?.map((permission) => permission.code)
    .sort()
    .join(',')}`;
  return (
    <section className="catalog-page">
      <p className="catalog-eyebrow">QUẢN LÝ RẠP</p>
      <PageHeader
        title={route.label}
        breadcrumbs={
          routeSection
            ? [{ label: 'Manager', to: '/manager/overview' }, { label: route.label }]
            : []
        }
      />
      {state.status === 'loading' && <LoadingState>Đang tải rạp được phân công…</LoadingState>}
      {state.status === 'error' && <ErrorState error={state.error} />}
      {state.status === 'success' &&
        (!state.cinemas.length ? (
          <EmptyState>Bạn không có phân công rạp còn hiệu lực.</EmptyState>
        ) : !currentAssignment ? (
          <LoadingState>Đang cập nhật phân công rạp…</LoadingState>
        ) : (
          <>
            <div className="manager-context">
              <FormField label="Rạp hiện tại">
                <Select
                  aria-label="Rạp hiện tại"
                  value={state.cinemaId}
                  disabled={state.pending}
                  onChange={(event) => changeCinema(event.target.value)}
                >
                  {state.cinemas
                    .filter(
                      (cinema) =>
                        !user?.cinemaAssignments ||
                        user.cinemaAssignments.some(
                          (assignment) => String(assignment.cinemaId) === String(cinema.id),
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
            <ManagerWorkspace
              key={`${scopeKey}:${routeSection}`}
              cinemaId={state.cinemaId}
              user={user}
              section={routeSection}
              store={store}
            />
          </>
        ))}
    </section>
  );
}

function ManagerWorkspace({ cinemaId, user, section, store }) {
  const cached = store.getScreen(section);
  const can = (permission) => userCanAct(user, 'QUAN_LY_RAP', permission);
  const [data, setData] = useState({ status: 'loading' });
  const [moviesLookup, setMoviesLookup] = useState({ status: 'loading', rows: [] });
  const [editing, setEditing] = useState(() => cached?.editing ?? null);
  const [notice, setNotice] = useState(null);
  const [localBusy, setBusy] = useState(false);
  const busy = localBusy || store.getSnapshot().pending;
  const [refresh, setRefresh] = useState(0);
  const [roomId, setRoomId] = useState(() => cached?.roomId ?? '');
  const [seats, setSeats] = useState(() => cached?.seats ?? { status: 'idle', rows: [] });
  const [pricingStatus, setPricingStatus] = useState(() => cached?.pricingStatus ?? '');
  const generation = useRef(0);
  const seatGeneration = useRef(0);
  const movieGeneration = useRef(0);
  const movieController = useRef(null);
  const [requestOwner] = useState(() => createManagerRequestOwner(store));
  const ownsScreen = requestOwner.isCurrent;
  useEffect(() => {
    if (ownsScreen())
      store.setScreen(section, {
        editing,
        roomId,
        seats: seats.status === 'loading' ? { status: 'idle', rows: [] } : seats,
        pricingStatus,
      });
  }, [store, section, editing, roomId, seats, pricingStatus, ownsScreen]);
  const writePending = useRef(false);
  useEffect(() => {
    requestOwner.activate();
    return () => {
      requestOwner.dispose();
    };
  }, [requestOwner]);
  const load = useCallback(async () => {
    const current = ++generation.current;
    const accepts = requestOwner.begin('screen');
    setData({ status: 'loading' });
    const sections = await loadManagerScreen(user, section, cinemaId, api);
    if (accepts() && current === generation.current) setData({ status: 'success', sections });
  }, [cinemaId, user, section, requestOwner]);
  const loadMovies = useCallback(async () => {
    movieController.current?.abort();
    const controller = new AbortController();
    movieController.current = controller;
    const current = ++movieGeneration.current;
    const accepts = requestOwner.begin('movies');
    setMoviesLookup({ status: 'loading', rows: [] });
    try {
      const rows = await getMovies({}, { signal: controller.signal });
      if (accepts() && current === movieGeneration.current)
        setMoviesLookup({ status: 'success', rows });
    } catch (error) {
      if (accepts() && current === movieGeneration.current && error.name !== 'AbortError')
        setMoviesLookup({ status: 'error', rows: [], error });
    }
  }, [requestOwner]);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void load();
    });
    return () => {
      active = false;
      generation.current += 1;
    };
  }, [load]);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active && (!section || section === 'showtimes')) void loadMovies();
    });
    return () => {
      active = false;
      movieGeneration.current += 1;
      movieController.current?.abort();
    };
  }, [loadMovies, section]);
  const roomOptions = data.sections?.rooms?.data?.rooms ?? [];
  const roomsLookup = {
    status: can('QL_PHONG') ? (data.sections?.rooms?.status ?? 'loading') : 'error',
    error: can('QL_PHONG')
      ? data.sections?.rooms?.error
      : new Error('Tài khoản không có quyền tải danh sách phòng.'),
    options: roomOptions.map((room) => ({ id: room.id, label: room.name })),
    onRetry: load,
  };
  const movies = {
    status: moviesLookup.status,
    error: moviesLookup.error,
    options: moviesLookup.rows.map((movie) => ({ id: movie.id, label: movie.title })),
    onRetry: loadMovies,
  };
  const loadSeats = async (id) => {
    if (!can('QL_GHE')) return;
    if (!roomOptions.some((room) => String(room.id) === String(id))) {
      setSeats({
        status: 'error',
        rows: [],
        error: new Error('Vui lòng chọn phòng thuộc rạp hiện tại.'),
      });
      return;
    }
    const current = ++seatGeneration.current;
    const accepts = requestOwner.begin('seats');
    setSeats({ status: 'loading', rows: [] });
    try {
      const result = await api.getSeats(id);
      if (accepts() && current === seatGeneration.current) {
        setSeats({ status: 'success', rows: result.seats, roomId: String(id) });
        setRoomId(String(id));
        setEditing((selection) => (selection?.kind === 'seat' ? null : selection));
      }
    } catch (error) {
      if (accepts() && current === seatGeneration.current)
        setSeats({ status: 'error', rows: [], error });
    }
  };
  const run = async (action, success, reloadSeats = false, draftKey) => {
    if (writePending.current || store.getSnapshot().pending || !ownsScreen()) return;
    writePending.current = true;
    const ownsMutationContext = store.capture();
    const writeToken = store.beginWrite();
    setBusy(true);
    setNotice(null);
    try {
      const result = await action();
      if (ownsMutationContext() && draftKey) {
        store.setDraft(draftKey, null);
        const previous = store.getScreen(section);
        if (previous)
          store.setScreen(section, {
            ...previous,
            editing: null,
            seats: { status: 'idle', rows: [] },
          });
      }
      if (!ownsScreen()) return;
      setEditing(null);
      setNotice({ ok: true, text: typeof success === 'function' ? success(result) : success });
      await load();
      if (!ownsScreen()) return;
      setRefresh((value) => value + 1);
      if (reloadSeats && seats.roomId) await loadSeats(seats.roomId);
    } catch (error) {
      if (ownsScreen()) setNotice({ ok: false, text: bookingErrorMessage(error) ?? error.message });
      throw error;
    } finally {
      writePending.current = false;
      store.endWrite(writeToken);
      if (ownsScreen()) setBusy(false);
    }
  };
  const action = (fn, text, refreshSeats) => {
    void run(fn, text, refreshSeats).catch(() => {});
  };
  const list = (section) => data.sections?.[section]?.data?.[section] ?? [];
  const form = (kind, create, update) => {
    const row = editing?.kind === kind ? editing.row : null;
    const draftKey = `${section ?? 'legacy'}:${kind}:${kind === 'seat' ? `${seats.roomId}:` : ''}${row?.id ?? 'create'}`;
    return (
      <ManagerResourceForm
        key={`${kind}:${row?.id ?? 'create'}`}
        kind={kind}
        scopeKey={cinemaId}
        row={row}
        busy={busy}
        lookups={{ movies, rooms: roomsLookup }}
        draft={store.getDraft(draftKey)}
        onDraftChange={(draft) => {
          if (ownsScreen()) store.setDraft(draftKey, draft);
        }}
        onCancel={() => setEditing(null)}
        onSave={(body) =>
          run(
            () => (row ? update(row.id, body) : create(body)),
            row ? 'Đã cập nhật.' : 'Đã tạo.',
            kind === 'seat',
            draftKey,
          )
        }
      />
    );
  };
  return (
    <>
      {notice && <p role={notice.ok ? 'status' : 'alert'}>{notice.text}</p>}
      {data.status === 'loading' && <LoadingState>Đang tải dữ liệu quản lý…</LoadingState>}
      {data.status === 'success' && (
        <>
          {Object.entries(data.sections)
            .filter(([, section]) => section.status === 'error')
            .map(([name, section]) => (
              <ErrorState key={name} error={section.error} onRetry={load} />
            ))}
          {(!section || section === 'overview') &&
            can('XEM_BAO_CAO_RAP') &&
            data.sections.dashboard?.status === 'success' && (
              <section className="catalog-section" id="manager-overview">
                <h2>Dashboard</h2>
                <p>
                  Phòng hoạt động: {data.sections.dashboard.data.dashboard?.activeRooms ?? 0} · Ghế:{' '}
                  {data.sections.dashboard.data.dashboard?.activeSeats ?? 0} · Suất hôm nay:{' '}
                  {data.sections.dashboard.data.dashboard?.showtimesToday ?? 0} · Đơn đã thanh toán
                  hôm nay: {data.sections.dashboard.data.dashboard?.paidOrdersToday ?? 0}
                </p>
              </section>
            )}
          {(!section || section === 'rooms') && can('QL_PHONG') && (
            <section className="catalog-section" aria-label="Phòng chiếu" id="manager-rooms">
              <h2>Phòng chiếu</h2>
              {form('room', (body) => api.createRoom(cinemaId, body), api.updateRoom)}
              {data.sections.rooms?.status === 'success' &&
                (list('rooms').length ? (
                  <ul>
                    {list('rooms').map((room) => (
                      <li key={room.id}>
                        {room.name} · {room.type} · {room.status} · {room.seatCount} ghế
                        {can('QL_GHE') &&
                          (section ? (
                            <Link
                              to="/manager/seats"
                              onClick={() => {
                                if (store.getScreen('seats')?.roomId !== String(room.id))
                                  store.setScreen('seats', {
                                    roomId: String(room.id),
                                    seats: { status: 'idle', rows: [] },
                                  });
                              }}
                            >
                              Ghế
                            </Link>
                          ) : (
                            <button type="button" onClick={() => void loadSeats(room.id)}>
                              Ghế
                            </button>
                          ))}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setEditing({ kind: 'room', row: room })}
                        >
                          Sửa phòng
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            action(
                              () => api.deleteRoom(room.id),
                              (result) => result.message,
                            )
                          }
                        >
                          Xóa
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState>Chưa có phòng chiếu.</EmptyState>
                ))}
            </section>
          )}
          {(!section || section === 'seats') && can('QL_GHE') && (
            <section className="catalog-section" aria-label="Ghế" id="manager-seats">
              <h2>
                Ghế
                {seats.roomId
                  ? ` · ${roomOptions.find((room) => String(room.id) === seats.roomId)?.name ?? ''}`
                  : ''}
              </h2>
              <ResourceSelect
                label="Phòng xem ghế"
                scopeKey={cinemaId}
                value={roomId}
                options={roomsLookup.options}
                lookupStatus={roomsLookup.status}
                lookupError={roomsLookup.error}
                onRetry={roomsLookup.onRetry}
                onChange={(value) => {
                  seatGeneration.current += 1;
                  setRoomId(value);
                  setSeats({ status: 'idle', rows: [] });
                  setEditing((selection) => (selection?.kind === 'seat' ? null : selection));
                }}
                emptyMessage="Rạp hiện tại chưa có phòng để chọn."
              />
              <button
                type="button"
                disabled={
                  busy || !roomId || !roomOptions.some((room) => String(room.id) === roomId)
                }
                onClick={() => void loadSeats(roomId)}
              >
                Tải ghế
              </button>
              {seats.status === 'loading' && <LoadingState>Đang tải ghế…</LoadingState>}
              {seats.status === 'error' && (
                <ErrorState error={seats.error} onRetry={() => void loadSeats(roomId)} />
              )}
              {seats.status === 'success' &&
                roomOptions.some((room) => String(room.id) === seats.roomId) && (
                  <>
                    {form('seat', (body) => api.createSeat(seats.roomId, body), api.updateSeat)}
                    {seats.rows?.length ? (
                      <ul>
                        {seats.rows.map((seat) => (
                          <li key={seat.id}>
                            {seat.label} · {seat.type} · {seat.status}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setEditing({ kind: 'seat', row: seat })}
                            >
                              Sửa ghế
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                action(() => api.deleteSeat(seat.id), 'Đã xóa ghế.', true)
                              }
                            >
                              Xóa
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState>Chưa có ghế trong phòng.</EmptyState>
                    )}
                  </>
                )}
            </section>
          )}
          {(!section || section === 'showtimes') && can('QL_SUAT_CHIEU') && (
            <section className="catalog-section" aria-label="Suất chiếu" id="manager-showtimes">
              <h2>Suất chiếu</h2>
              {form('showtime', api.createManagerShowtime, api.updateManagerShowtime)}
              {data.sections.showtimes?.status === 'success' &&
                (list('showtimes').length ? (
                  <ul>
                    {list('showtimes').map((showtime) => (
                      <li key={showtime.id}>
                        {showtime.movieTitle} · {showtime.roomName} ·{' '}
                        {formatDateTime(showtime.startsAt)} · {showtime.format} ·{' '}
                        {showtime.basePrice} · {showtime.status}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setEditing({ kind: 'showtime', row: showtime })}
                        >
                          Sửa suất
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            action(
                              () => api.cancelManagerShowtime(showtime.id),
                              'Đã hủy suất chiếu.',
                            )
                          }
                        >
                          Hủy
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState>Chưa có suất chiếu.</EmptyState>
                ))}
            </section>
          )}
          {(!section || section === 'pricing') && can('QL_BANG_GIA') && (
            <section className="catalog-section" aria-label="Bảng giá" id="manager-pricing">
              <h2>Bảng giá</h2>
              {form('pricing', (body) => api.createPricing(cinemaId, body), api.updatePricing)}
              <label>
                Lọc trạng thái bảng giá
                <Select
                  aria-label="Lọc trạng thái bảng giá"
                  value={pricingStatus}
                  onChange={(event) => setPricingStatus(event.target.value)}
                >
                  <option value="">Tất cả</option>
                  {RESOURCE_STATUSES.pricing.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </Select>
              </label>
              {data.sections.pricing?.status === 'success' &&
                (list('pricing').filter((row) => !pricingStatus || row.status === pricingStatus)
                  .length ? (
                  <ul>
                    {list('pricing')
                      .filter((row) => !pricingStatus || row.status === pricingStatus)
                      .map((pricing) => (
                        <li key={pricing.id}>
                          {pricing.seatType} · {pricing.dayType} · {pricing.format} ·{' '}
                          {pricing.surcharge} · {formatDate(pricing.startsOn)} —{' '}
                          {formatDate(pricing.endsOn)} · {pricing.status}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setEditing({ kind: 'pricing', row: pricing })}
                          >
                            Sửa giá
                          </button>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <EmptyState>Không có bảng giá phù hợp.</EmptyState>
                ))}
            </section>
          )}
        </>
      )}
      {(!section || section === 'revenue') && can('XEM_BAO_CAO_RAP') && (
        <div id="manager-revenue">
          <ManagerRevenue
            cinemaId={cinemaId}
            refresh={refresh}
            cachedState={store.getScreen('revenueFilters')}
            onStateChange={(state) => {
              if (ownsScreen()) store.setScreen('revenueFilters', state);
            }}
          />
        </div>
      )}
    </>
  );
}
