import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userCanAct, loadAuthorizedSections } from '../utils/authorization';
import { formatDateTime, formatDate } from '../utils/dateTime';
import * as api from '../api/managerApi';
import { bookingErrorMessage } from '../utils/bookingLimits';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import ManagerResourceForm from '../components/ManagerResourceForm';
import NamedResourceSelect from '../components/NamedResourceSelect';
import ManagerRevenue from '../components/ManagerRevenue';
import { RESOURCE_STATUSES } from '../../../shared/resourceContract.mjs';
import { getMovies } from '../api/catalogApi';

export default function ManagerPortal() {
  const { user } = useAuth();
  const [cinemas, setCinemas] = useState({ status: 'loading' });
  const [cinemaId, setCinemaId] = useState('');
  const [dirtyForms, setDirtyForms] = useState({});
  useEffect(() => {
    let active = true;
    api
      .getAssignedCinemas()
      .then((result) => {
        if (!active) return;
        setCinemas({ status: 'success', rows: result.cinemas });
        setCinemaId((current) =>
          result.cinemas.some((cinema) => String(cinema.id) === current)
            ? current
            : String(result.cinemas[0]?.id ?? ''),
        );
      })
      .catch((error) => {
        if (active) setCinemas({ status: 'error', error });
      });
    return () => {
      active = false;
    };
  }, [user?.cinemaAssignments]);
  if (cinemas.status === 'loading')
    return <LoadingState>Đang tải rạp được phân công…</LoadingState>;
  if (cinemas.status === 'error') return <ErrorState error={cinemas.error} />;
  const assigned = cinemas.rows.filter(
    (cinema) =>
      !user?.cinemaAssignments ||
      user.cinemaAssignments.some(
        (assignment) => String(assignment.cinemaId) === String(cinema.id),
      ),
  );
  if (!assigned.length) return <EmptyState>Bạn không có phân công rạp còn hiệu lực.</EmptyState>;
  const allowedCinema = assigned.some((cinema) => String(cinema.id) === cinemaId)
    ? cinemaId
    : String(assigned[0].id);
  const scopeKey = `${allowedCinema}:${user?.userId}:${user?.permissions
    ?.map((permission) => permission.code)
    .sort()
    .join(',')}`;
  const hasDirtyForms = Object.keys(dirtyForms).some((key) => key.startsWith(`${allowedCinema}:`));
  const changeCinema = (nextCinemaId) => {
    if (nextCinemaId === allowedCinema) return;
    if (
      hasDirtyForms &&
      !window.confirm('Bạn có thay đổi chưa lưu. Bỏ các thay đổi này và chuyển rạp?')
    )
      return;
    if (hasDirtyForms) {
      setDirtyForms((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([key]) => !key.startsWith(`${allowedCinema}:`)),
        ),
      );
    }
    setCinemaId(nextCinemaId);
  };
  const reportFormDirty = (scopeCinemaId, formKey, dirty) => {
    const key = `${scopeCinemaId}:${formKey}`;
    setDirtyForms((current) => {
      if (dirty) return { ...current, [key]: true };
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };
  return (
    <section className="catalog-page">
      <p className="catalog-eyebrow">QUẢN LÝ RẠP</p>
      <h1>Manager Portal</h1>
      <label>
        Rạp hiện tại
        <select
          aria-label="Rạp hiện tại"
          value={allowedCinema}
          onChange={(event) => changeCinema(event.target.value)}
        >
          {assigned.map((cinema) => (
            <option key={cinema.id} value={cinema.id}>
              {cinema.name} · {cinema.city}
            </option>
          ))}
        </select>
      </label>
      <ManagerWorkspace
        key={scopeKey}
        cinemaId={allowedCinema}
        user={user}
        onFormDirtyChange={reportFormDirty}
      />
    </section>
  );
}

function ManagerWorkspace({ cinemaId, user, onFormDirtyChange }) {
  const can = (permission) => userCanAct(user, 'QUAN_LY_RAP', permission);
  const [data, setData] = useState({ status: 'loading' });
  const [moviesLookup, setMoviesLookup] = useState({ status: 'loading', rows: [] });
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [roomId, setRoomId] = useState('');
  const [seats, setSeats] = useState({ status: 'idle', rows: [] });
  const [pricingStatus, setPricingStatus] = useState('');
  const generation = useRef(0);
  const seatGeneration = useRef(0);
  const movieGeneration = useRef(0);
  const movieController = useRef(null);
  const mounted = useRef(true);
  const writePending = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const load = useCallback(async () => {
    const current = ++generation.current;
    setData({ status: 'loading' });
    const sections = await loadAuthorizedSections(user, 'QUAN_LY_RAP', {
      rooms: { permission: 'QL_PHONG', load: () => api.getRooms(cinemaId) },
      showtimes: { permission: 'QL_SUAT_CHIEU', load: () => api.getManagerShowtimes(cinemaId) },
      pricing: { permission: 'QL_BANG_GIA', load: () => api.getPricing(cinemaId) },
      dashboard: { permission: 'XEM_BAO_CAO_RAP', load: () => api.getDashboard(cinemaId) },
    });
    if (mounted.current && current === generation.current) setData({ status: 'success', sections });
  }, [cinemaId, user]);
  const loadMovies = useCallback(async () => {
    movieController.current?.abort();
    const controller = new AbortController();
    movieController.current = controller;
    const current = ++movieGeneration.current;
    setMoviesLookup({ status: 'loading', rows: [] });
    try {
      const rows = await getMovies({}, { signal: controller.signal });
      if (mounted.current && current === movieGeneration.current)
        setMoviesLookup({ status: 'success', rows });
    } catch (error) {
      if (
        mounted.current &&
        current === movieGeneration.current &&
        error.name !== 'AbortError'
      )
        setMoviesLookup({ status: 'error', rows: [], error });
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadMovies();
    });
    return () => {
      active = false;
      movieGeneration.current += 1;
      movieController.current?.abort();
    };
  }, [loadMovies]);
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
      setSeats({ status: 'error', rows: [], error: new Error('Vui lòng chọn phòng thuộc rạp hiện tại.') });
      return;
    }
    const current = ++seatGeneration.current;
    setSeats({ status: 'loading', rows: [] });
    try {
      const result = await api.getSeats(id);
      if (mounted.current && current === seatGeneration.current) {
        setSeats({ status: 'success', rows: result.seats, roomId: String(id) });
        setRoomId(String(id));
        setEditing((selection) => (selection?.kind === 'seat' ? null : selection));
      }
    } catch (error) {
      if (mounted.current && current === seatGeneration.current)
        setSeats({ status: 'error', rows: [], error });
    }
  };
  const run = async (action, success, reloadSeats = false) => {
    if (writePending.current) return;
    writePending.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const result = await action();
      if (!mounted.current) return;
      setEditing(null);
      setNotice({ ok: true, text: typeof success === 'function' ? success(result) : success });
      await load();
      setRefresh((value) => value + 1);
      if (reloadSeats && seats.roomId) await loadSeats(seats.roomId);
    } catch (error) {
      if (mounted.current)
        setNotice({ ok: false, text: bookingErrorMessage(error) ?? error.message });
      throw error;
    } finally {
      writePending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const action = (fn, text, refreshSeats) => {
    void run(fn, text, refreshSeats).catch(() => {});
  };
  const list = (section) => data.sections?.[section]?.data?.[section] ?? [];
  const form = (kind, create, update) => {
    const row = editing?.kind === kind ? editing.row : null;
    return (
      <ManagerResourceForm
        key={`${kind}:${row?.id ?? 'create'}`}
        kind={kind}
        row={row}
        busy={busy}
        lookups={{ movies, rooms: roomsLookup }}
        onDirtyChange={(dirty) =>
          onFormDirtyChange(cinemaId, `${kind}:${row?.id ?? 'create'}`, dirty)
        }
        onCancel={() => setEditing(null)}
        onSave={(body) =>
          run(
            () => (row ? update(row.id, body) : create(body)),
            row ? 'Đã cập nhật.' : 'Đã tạo.',
            kind === 'seat',
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
          {can('XEM_BAO_CAO_RAP') && data.sections.dashboard?.status === 'success' && (
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
          {can('QL_PHONG') && (
            <section className="catalog-section" aria-label="Phòng chiếu" id="manager-rooms">
              <h2>Phòng chiếu</h2>
              {form('room', (body) => api.createRoom(cinemaId, body), api.updateRoom)}
              {data.sections.rooms?.status === 'success' &&
                (list('rooms').length ? (
                  <ul>
                    {list('rooms').map((room) => (
                      <li key={room.id}>
                        {room.name} · {room.type} · {room.status} · {room.seatCount} ghế
                        {can('QL_GHE') && (
                          <button type="button" onClick={() => void loadSeats(room.id)}>
                            Ghế
                          </button>
                        )}
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
          {can('QL_GHE') && (
            <section className="catalog-section" aria-label="Ghế" id="manager-seats">
              <h2>
                Ghế{seats.roomId
                  ? ` · ${roomOptions.find((room) => String(room.id) === seats.roomId)?.name ?? ''}`
                  : ''}
              </h2>
              <NamedResourceSelect
                label="Phòng xem ghế"
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
              {seats.status === 'success' && (
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
          {can('QL_SUAT_CHIEU') && (
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
          {can('QL_BANG_GIA') && (
            <section className="catalog-section" aria-label="Bảng giá" id="manager-pricing">
              <h2>Bảng giá</h2>
              {form('pricing', (body) => api.createPricing(cinemaId, body), api.updatePricing)}
              <label>
                Lọc trạng thái bảng giá
                <select
                  aria-label="Lọc trạng thái bảng giá"
                  value={pricingStatus}
                  onChange={(event) => setPricingStatus(event.target.value)}
                >
                  <option value="">Tất cả</option>
                  {RESOURCE_STATUSES.pricing.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
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
      {can('XEM_BAO_CAO_RAP') && (
        <div id="manager-revenue">
          <ManagerRevenue cinemaId={cinemaId} refresh={refresh} />
        </div>
      )}
    </>
  );
}
