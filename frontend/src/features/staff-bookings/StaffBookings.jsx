import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userCanAct } from '../../utils/authorization';
import { formatDateTime } from '../../utils/dateTime';
import { createStaffBookingApi } from '../../api/staffBookingApi';
import { toggleSeatSelection, SEAT_LIMIT_MESSAGE } from '../../utils/bookingLimits';
import SeatMap from '../../components/SeatMap';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FormField from '../../components/ui/FormField';
import DataTable from '../../components/ui/DataTable';
import FilterBar from '../../components/ui/FilterBar';
import StatusBadge from '../../components/ui/StatusBadge';
import AsyncState from '../../components/ui/AsyncState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useBookingDraftGuard from './useBookingDraftGuard';
import './staff-bookings.css';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);
const idle = { status: 'idle' };
const emptyFilters = { search: '', status: '', cinemaId: '' };
const statuses = ['Chờ thanh toán', 'Đã thanh toán', 'Hoàn thành', 'Đã hủy', 'Hết hạn', 'Hoàn tiền'];
const activeTickets = (order) => (order?.tickets ?? []).filter((ticket) => ticket.status === 'Đã đặt');

export default function StaffBookings({ portal }) {
  const { user } = useAuth();
  const role = portal === 'admin' ? 'ADMIN' : 'QUAN_LY_RAP';
  if (!userCanAct(user, role, 'DAT_VE')) return <section role="alert"><h1>Quản lý đặt vé</h1><p>Bạn không đủ quyền quản lý đặt vé.</p></section>;
  return <BookingWorkspace key={`${portal}:${user.userId}:${user.permissions.map((p) => p.code).sort().join(',')}`} portal={portal} />;
}

function BookingWorkspace({ portal }) {
  const api = useMemo(() => createStaffBookingApi(portal), [portal]);
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('orderId');
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState({ ...emptyFilters, page: 1, pageSize: 20 });
  const [reload, setReload] = useState(0);
  const [list, setList] = useState({ status: 'loading' });
  const [metadata, setMetadata] = useState({ status: 'loading' });
  const [detail, setDetail] = useState(idle);
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState({ customer: null, cinemaId: '', showtimeId: '', seatIds: [] });
  const [options, setOptions] = useState(idle);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState(idle);
  const [notice, setNotice] = useState(null);
  const [limitNotice, setLimitNotice] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const customerRequest = useRef(0);
  const alive = useRef(true);
  const order = detail.status === 'success' ? detail.order : null;
  const dirty = editor === 'create'
    ? Boolean(draft.customer || draft.showtimeId || draft.seatIds.length)
    : editor === 'edit' && draft.seatIds.slice().sort().join(',') !== activeTickets(order).map((t) => t.seatId).sort().join(',');
  useBookingDraftGuard(dirty, busy);

  useEffect(() => {
    alive.current = true;
    const requests = customerRequest;
    return () => { alive.current = false; requests.current++; };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    api.options({}, controller.signal).then((data) => { if (!controller.signal.aborted) setMetadata({ status: 'success', data }); }).catch((error) => {
      if (!controller.signal.aborted) setMetadata({ status: 'error', error });
    });
    return () => controller.abort();
  }, [api, reload]);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => { if (!controller.signal.aborted) setList({ status: 'loading' }); });
    api.list(applied, controller.signal).then((data) => {
      if (!controller.signal.aborted) setList({ status: 'success', data });
    }).catch((error) => { if (!controller.signal.aborted) setList({ status: 'error', error }); });
    return () => controller.abort();
  }, [api, applied, reload]);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => { if (!controller.signal.aborted) setDetail(selectedId ? { status: 'loading' } : idle); });
    if (selectedId) api.detail(selectedId, controller.signal).then((data) => {
      if (!controller.signal.aborted) setDetail({ status: 'success', order: data.order });
    }).catch((error) => { if (!controller.signal.aborted) setDetail({ status: 'error', error }); });
    return () => controller.abort();
  }, [api, selectedId, reload]);
  useEffect(() => {
    if (!editor) return undefined;
    const controller = new AbortController();
    Promise.resolve().then(() => { if (!controller.signal.aborted) setOptions({ status: 'loading' }); });
    api.options({ cinemaId: draft.cinemaId, showtimeId: draft.showtimeId, orderId: editor === 'edit' ? selectedId : null }, controller.signal).then((data) => {
      if (!controller.signal.aborted) setOptions({ status: 'success', data, cinemaId: draft.cinemaId, showtimeId: draft.showtimeId, orderId: editor === 'edit' ? selectedId : null });
    }).catch((error) => { if (!controller.signal.aborted) setOptions({ status: 'error', error }); });
    return () => controller.abort();
  }, [api, editor, draft.cinemaId, draft.showtimeId, selectedId, reload]);

  const resetEditor = () => {
    customerRequest.current++;
    setEditor(null); setDraft({ customer: null, cinemaId: '', showtimeId: '', seatIds: [] });
    setCustomers(idle); setCustomerSearch(''); setOptions(idle); setLimitNotice(null);
  };
  const guarded = (action, replacingSeats = false) => {
    if (busyRef.current) return;
    if (replacingSeats ? draft.seatIds.length > 0 : dirty) setConfirm({ kind: 'discard', title: 'Bỏ thay đổi chưa lưu?', description: 'Các lựa chọn ghế chưa lưu sẽ bị bỏ.', action });
    else action();
  };
  const searchCustomers = async (event) => {
    event.preventDefault();
    const sequence = ++customerRequest.current;
    setCustomers({ status: 'loading' });
    try {
      const data = await api.customers(customerSearch.trim());
      if (alive.current && sequence === customerRequest.current) setCustomers({ status: 'success', data });
    } catch (error) {
      if (alive.current && sequence === customerRequest.current) setCustomers({ status: 'error', error });
    }
  };
  const showOrder = (id) => guarded(() => { resetEditor(); setParams(id ? { orderId: String(id) } : {}); });
  const startCreate = () => guarded(() => {
    resetEditor(); setParams({}); setNotice(null); setEditor('create');
    setDraft({ customer: null, cinemaId: applied.cinemaId, showtimeId: '', seatIds: [] });
  });
  const startEdit = () => {
    if (!order?.canEdit || busyRef.current) return;
    resetEditor(); setEditor('edit'); setNotice(null);
    setDraft({ customer: order.user, cinemaId: String(order.cinemaId), showtimeId: String(order.showtimeId), seatIds: activeTickets(order).map((t) => t.seatId) });
  };
  const mutate = async (kind, snapshot) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setNotice(null);
    try {
      const result = kind === 'create'
        ? await api.create({ customerId: snapshot.customer.NguoiDungID, showtimeId: Number(snapshot.showtimeId), seatIds: snapshot.seatIds })
        : kind === 'edit'
          ? await api.updateSeats(snapshot.orderId, { seatIds: snapshot.seatIds, expectedTicketIds: snapshot.expectedTicketIds })
          : await api.cancel(snapshot.orderId);
      if (!alive.current) return;
      resetEditor(); setConfirm(null);
      setNotice({ ok: true, text: kind === 'create' ? 'Đã tạo đơn Chờ thanh toán. Khách hàng thanh toán qua luồng hiện có.' : kind === 'edit' ? 'Đã cập nhật ghế; lịch sử vé và giá snapshot được giữ.' : 'Đã hủy đơn và giải phóng ghế; lịch sử được giữ.' });
      if (result.order) setDetail({ status: 'success', order: result.order });
      setParams({ orderId: String(result.orderId ?? result.order.id) }); setReload((v) => v + 1);
    } catch (error) {
      if (alive.current) setNotice({ ok: false, text: error.message, conflict: error.status === 409 });
      throw error;
    } finally {
      busyRef.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const optionsCurrent = options.status === 'success' && options.cinemaId === draft.cinemaId && options.showtimeId === draft.showtimeId && options.orderId === (editor === 'edit' ? selectedId : null);
  const seats = optionsCurrent ? options.data.seats : [];
  const validSelection = draft.seatIds.length > 0 && draft.seatIds.every((id) => seats.some((seat) => seat.id === id && seat.status === 'Trống'));
  const preview = seats.filter((seat) => draft.seatIds.includes(seat.id)).reduce((sum, seat) => sum + Number(seat.price), 0);
  const columns = [
    { key: 'DonDatVeID', label: 'Mã đơn' },
    { key: 'customer', label: 'Khách hàng', render: (row) => <><strong>{row.HoTenKhachHang}</strong><br />{row.Email}</> },
    { key: 'TenPhim', label: 'Phim' },
    { key: 'show', label: 'Suất / Rạp / Phòng', render: (row) => <>{formatDateTime(row.ThoiGianBatDau)}<br />{row.TenRap} · {row.TenPhong}</> },
    { key: 'DanhSachGhe', label: 'Ghế' },
    { key: 'SoLuongVe', label: 'Số vé' },
    { key: 'TongTienThanhToan', label: 'Tổng snapshot', render: (row) => money(row.TongTienThanhToan) },
    { key: 'TrangThaiDon', label: 'Trạng thái', render: (row) => <StatusBadge status={row.TrangThaiDon} /> },
    { key: 'action', label: 'Thao tác', render: (row) => <Button variant="secondary" size="sm" disabled={busy} onClick={() => showOrder(row.DonDatVeID)} aria-label={`Xem đơn ${row.DonDatVeID}`}>Xem chi tiết</Button> },
  ];
  const cinemas = metadata.status === 'success' ? metadata.data.cinemas : [];
  const confirmDescription = confirm?.description;
  const refresh = useCallback(() => setReload((v) => v + 1), []);
  return (
    <section className="staff-bookings">
      <PageHeader title="Quản lý đặt vé" description={portal === 'admin' ? 'Đơn đặt vé toàn hệ thống' : 'Đơn đặt vé tại rạp được phân công còn hiệu lực'}
        breadcrumbs={[{ label: portal === 'admin' ? 'Admin' : 'Manager', to: `/${portal}` }, { label: 'Quản lý đặt vé' }]}
        actions={<Button onClick={startCreate} disabled={busy || metadata.status !== 'success' || !cinemas.length}>Tạo đơn đặt vé</Button>} />
      <AsyncState status={metadata.status === 'error' ? 'error' : 'idle'} error={metadata.error} onRetry={refresh} />
      {portal === 'manager' && metadata.status === 'success' && !cinemas.length && <p role="alert">Bạn không có phân công rạp còn hiệu lực.</p>}
      {notice && <p role={notice.ok ? 'status' : 'alert'} className={notice.ok ? 'staff-bookings__success' : 'staff-bookings__error'}>{notice.conflict && 'Xung đột: '}{notice.text}</p>}
      <FilterBar label="Bộ lọc đơn đặt vé" onSubmit={(event) => { event.preventDefault(); guarded(() => { resetEditor(); setApplied({ ...filters, page: 1, pageSize: 20 }); }); }}
        onReset={(event) => { event.preventDefault(); guarded(() => { resetEditor(); setFilters(emptyFilters); setApplied({ ...emptyFilters, page: 1, pageSize: 20 }); }); }}
        actions={<Button type="submit" disabled={busy}>Áp dụng lọc</Button>}>
        <FormField label="Tìm đơn / vé / khách hàng / phim"><Input value={filters.search} maxLength={100} onChange={(e) => setFilters({ ...filters, search: e.target.value })} disabled={busy} /></FormField>
        <FormField label="Trạng thái đơn"><Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} disabled={busy}><option value="">Tất cả trạng thái</option>{statuses.map((status) => <option key={status}>{status}</option>)}</Select></FormField>
        <FormField label="Rạp lọc đơn"><Select value={filters.cinemaId} onChange={(e) => setFilters({ ...filters, cinemaId: e.target.value })} disabled={busy}><option value="">Tất cả rạp được phép</option>{cinemas.map((cinema) => <option key={cinema.RapID} value={cinema.RapID}>{cinema.TenRap}</option>)}</Select></FormField>
      </FilterBar>
      <DataTable columns={columns} rows={list.data?.orders ?? []} getRowKey={(row) => row.DonDatVeID} caption="Danh sách đơn đặt vé" status={list.status} error={list.error} onRetry={refresh} />
      {list.status === 'success' && <nav className="staff-bookings__actions" aria-label="Phân trang đơn đặt vé">
        <Button variant="secondary" disabled={busy || applied.page <= 1} onClick={() => guarded(() => setApplied({ ...applied, page: applied.page - 1 }))}>Trang trước</Button>
        <span>Trang {list.data.page} · {list.data.total} đơn</span>
        <Button variant="secondary" disabled={busy || applied.page * applied.pageSize >= list.data.total} onClick={() => guarded(() => setApplied({ ...applied, page: applied.page + 1 }))}>Trang sau</Button>
      </nav>}
      <AsyncState status={detail.status === 'success' ? 'idle' : detail.status} error={detail.error} onRetry={refresh} loadingMessage="Đang tải chi tiết đơn…" />
      {order && <section className="staff-bookings__detail" aria-label={`Chi tiết đơn ${order.id}`}>
        <h2>Đơn #{order.id} · <StatusBadge status={order.status} /></h2>
        <p><strong>{order.user.name}</strong> · {order.user.email} · {order.user.phone || 'Chưa có SĐT'}</p>
        <p>{order.movieTitle} · {formatDateTime(order.startsAt)} · {order.cinemaName} · {order.roomName} · {order.format}</p>
        <p>Tổng vé: {money(order.ticketTotal)} · Đồ ăn: {money(order.productTotal)} · Giảm giá: {money(order.discountTotal)} · Tổng đơn: <strong>{money(order.total)}</strong></p>
        {order.holdExpiresAt && <p>Hạn giữ chỗ: {formatDateTime(order.holdExpiresAt)}</p>}
        <DataTable caption="Vé và giá snapshot" rows={order.tickets} getRowKey={(row) => row.id} columns={[
          { key: 'code', label: 'Mã vé' }, { key: 'label', label: 'Ghế' }, { key: 'type', label: 'Loại ghế' },
          { key: 'price', label: 'Giá snapshot', render: (row) => money(row.price) }, { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
        ]} />
        <DataTable caption="Lịch sử thanh toán" rows={order.payments} getRowKey={(row) => row.id} emptyMessage="Chưa có lần thử thanh toán." columns={[
          { key: 'transactionCode', label: 'Mã giao dịch' }, { key: 'method', label: 'Phương thức' }, { key: 'amount', label: 'Số tiền', render: (row) => money(row.amount) }, { key: 'status', label: 'Trạng thái' },
        ]} />
        {order.products.length > 0 && <DataTable caption="Đồ ăn trong đơn" rows={order.products} getRowKey={(row) => row.id} columns={[{ key: 'name', label: 'Sản phẩm' }, { key: 'quantity', label: 'Số lượng' }, { key: 'unitPrice', label: 'Đơn giá', render: (row) => money(row.unitPrice) }]} />}
        {order.promotionCode && <p>Khuyến mãi: {order.promotionCode} · {order.promotionDescription}</p>}
        {order.cancellationNotice && <p>{order.cancellationNotice}</p>}
        <div className="staff-bookings__actions">
          <Button variant="secondary" disabled={busy || !order.canEdit || Boolean(editor)} onClick={startEdit}>Sửa ghế</Button>
          <Button variant="danger" disabled={busy || !order.canCancel || Boolean(editor)} onClick={() => setConfirm({ kind: 'cancel', title: `Hủy đơn #${order.id}?`, description: `${order.user.name} · ${order.movieTitle} · ${order.seatLabels}. Hủy toàn bộ đơn, giải phóng ghế và giữ lịch sử; không hoàn tiền.`, snapshot: { orderId: order.id } })}>Hủy đơn</Button>
        </div>
        <p>Chỉ sửa ghế của đơn còn hạn giữ chỗ, chưa thử thanh toán, không khuyến mãi/đồ ăn. Không sửa/xóa đơn đã thanh toán hoặc vé đã sử dụng; chưa hỗ trợ hoàn tiền tự nguyện.</p>
      </section>}
      {editor && <section className="staff-bookings__editor" aria-label={editor === 'create' ? 'Tạo đơn đặt vé' : 'Sửa ghế đơn đặt vé'}>
        <h2>{editor === 'create' ? 'Tạo đơn cho Customer có sẵn' : `Sửa ghế đơn #${order?.id}`}</h2>
        {editor === 'create' && <>
          <form onSubmit={searchCustomers} className="staff-bookings__actions">
            <FormField label="Tìm Customer bằng tên/email/SĐT" required hint="Nhập ít nhất 2 ký tự. Chỉ tài khoản Customer đang hoạt động."><Input value={customerSearch} minLength={2} maxLength={100} disabled={busy} onChange={(e) => { customerRequest.current++; setCustomerSearch(e.target.value); setCustomers(idle); }} /></FormField>
            <Button type="submit" disabled={busy || customerSearch.trim().length < 2}>Tìm khách hàng</Button>
          </form>
          <AsyncState status={customers.status === 'success' ? (customers.data.customers.length ? 'idle' : 'empty') : customers.status} error={customers.error} emptyMessage="Không có Customer đang hoạt động phù hợp." />
          {customers.status === 'success' && customers.data.customers.length > 0 && <FormField label="Khách hàng có sẵn" required><Select value={draft.customer?.NguoiDungID ?? ''} disabled={busy} onChange={(e) => setDraft({ ...draft, customer: customers.data.customers.find((row) => row.NguoiDungID === Number(e.target.value)) ?? null })}>
            <option value="">Chọn Customer</option>{customers.data.customers.map((row) => <option key={row.NguoiDungID} value={row.NguoiDungID}>{row.HoTen} · {row.Email} · {row.SoDienThoai || 'Chưa có SĐT'}</option>)}
          </Select></FormField>}
          {customers.status === 'success' && customers.data.total > 50 && <p>Hiển thị 50/{customers.data.total} Customer. Thu hẹp từ khóa để chọn đúng người.</p>}
        </>}
        {draft.customer && <p>Khách hàng đã chọn: <strong>{draft.customer.HoTen ?? draft.customer.name}</strong> · {draft.customer.Email ?? draft.customer.email}</p>}
        <FormField label="Rạp đặt vé" required><Select value={draft.cinemaId} disabled={busy || editor === 'edit'} onChange={(e) => { const value = e.target.value; guarded(() => setDraft({ ...draft, cinemaId: value, showtimeId: '', seatIds: [] }), true); }}><option value="">Chọn rạp</option>{cinemas.map((cinema) => <option key={cinema.RapID} value={cinema.RapID}>{cinema.TenRap}</option>)}</Select></FormField>
        <AsyncState status={options.status === 'success' ? 'idle' : options.status} error={options.error} onRetry={refresh} loadingMessage="Đang tải suất chiếu và ghế…" />
        <FormField label="Suất chiếu / phim / phòng" required><Select value={draft.showtimeId} disabled={busy || editor === 'edit' || !draft.cinemaId || !optionsCurrent} onChange={(e) => { const value = e.target.value; guarded(() => setDraft({ ...draft, showtimeId: value, seatIds: [] }), true); }}>
          <option value="">Chọn suất chiếu</option>{(options.data?.showtimes ?? []).map((show) => <option key={show.SuatChieuID} value={show.SuatChieuID}>{show.TenPhim} · {formatDateTime(show.ThoiGianBatDau)} · {show.TenPhong} · {show.DinhDang}</option>)}
        </Select></FormField>
        {options.status === 'success' && options.data.showtimeTotal > 200 && <p>Hiển thị 200/{options.data.showtimeTotal} suất gần nhất. Chọn rạp để thu hẹp.</p>}
        {options.status === 'success' && draft.cinemaId && !options.data.showtimes.length && <p role="status">Rạp chưa có suất chiếu đủ điều kiện đặt vé.</p>}
        {draft.showtimeId && optionsCurrent && <fieldset disabled={busy} className="staff-bookings__seat-fieldset"><SeatMap seats={seats} selectedSeatIds={draft.seatIds} limitNotice={limitNotice} onToggle={(id) => {
          const result = toggleSeatSelection(draft.seatIds, id); setDraft({ ...draft, seatIds: result.selectedIds }); setLimitNotice(result.limitReached ? SEAT_LIMIT_MESSAGE : null);
        }} /></fieldset>}
        <p>Giá vé dự kiến từ server: <strong>{money(preview)}</strong>. Giá và ghế được xác nhận lại khi lưu.</p>
        <div className="staff-bookings__actions">
          <Button loading={busy} disabled={!draft.customer || !validSelection || !optionsCurrent || (editor === 'edit' && !order?.canEdit)} onClick={() => {
            if (editor === 'create') void mutate('create', { ...draft, seatIds: [...draft.seatIds] }).catch(() => {});
            else setConfirm({ kind: 'edit', title: `Xác nhận đổi ghế đơn #${order.id}`, description: `${order.user.name}: ${order.seatLabels} → ${seats.filter((seat) => draft.seatIds.includes(seat.id)).map((seat) => seat.label).join(', ')}. Giữ vé bị bỏ trong lịch sử và không kéo dài hạn giữ chỗ.`, snapshot: { orderId: order.id, seatIds: [...draft.seatIds], expectedTicketIds: activeTickets(order).map((ticket) => ticket.id) } });
          }}>{editor === 'create' ? 'Tạo đơn Chờ thanh toán' : 'Lưu ghế'}</Button>
          <Button variant="secondary" disabled={busy} onClick={() => guarded(resetEditor)}>Đóng form</Button>
          {notice?.conflict && <Button variant="secondary" disabled={busy} onClick={() => guarded(() => { resetEditor(); refresh(); })}>Tải lại chi tiết và ghế</Button>}
        </div>
      </section>}
      <ConfirmDialog open={Boolean(confirm)} busy={busy} onOpenChange={(open) => { if (!open && !busyRef.current) setConfirm(null); }} title={confirm?.title} description={confirmDescription}
        confirmLabel={confirm?.kind === 'discard' ? 'Bỏ thay đổi' : 'Xác nhận'} onConfirm={async () => {
          if (confirm.kind === 'discard') { const action = confirm.action; setConfirm(null); action(); }
          else await mutate(confirm.kind, confirm.snapshot);
        }} />
    </section>
  );
}
