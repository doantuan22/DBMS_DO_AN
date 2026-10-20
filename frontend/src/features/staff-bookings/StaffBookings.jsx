import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useManagerCinema } from '../manager/ManagerCinemaContext';
import { ManagerCinemaProvider } from '../../layouts/ManagerLayout';
import { userCanAct } from '../../utils/authorization';
import { formatDateTime } from '../../utils/dateTime';
import { createStaffBookingApi } from '../../api/staffBookingApi';
import { createBookingController } from './bookingController';
import { bookingStatuses, bookingSelection } from './bookingModel';
import { money } from '../operations/operationsModel';
import {
  AsyncState,
  Button,
  ConfirmDialog,
  Dialog,
  FilterBar,
  FormField,
  Input,
  PageHeader,
  ResourceTable,
  Select,
  StatusBadge,
} from '../../components/ui';
import Forbidden from '../../pages/Forbidden';
import BookingDetail from './BookingDetail';
import BookingEditor from './BookingEditor';
import useBookingDraftGuard from './useBookingDraftGuard';
import './staff-bookings.css';

export default function StaffBookings({ portal }) {
  const { user } = useAuth(),
    context = useManagerCinema();
  const role = portal === 'admin' ? 'ADMIN' : 'QUAN_LY_RAP';
  if (!userCanAct(user, role, 'DAT_VE'))
    return (
      <section role="alert">
        <h1>Quản lý đặt vé</h1>
        <p>Bạn không đủ quyền quản lý đặt vé.</p>
      </section>
    );
  if (portal === 'manager' && !context)
    return (
      <ManagerCinemaProvider user={user}>
        <StaffBookings portal={portal} />
      </ManagerCinemaProvider>
    );
  const key = `${portal}:${user.userId}:${user.permissions
    .map((p) => p.code)
    .sort()
    .join(',')}`;
  return portal === 'manager' ? (
    <ManagerBookings key={key} user={user} context={context} />
  ) : (
    <BookingWorkspace key={key} portal={portal} />
  );
}

function ManagerBookings({ user, context }) {
  const { state, store, changeCinema } = context,
    [params, setParams] = useSearchParams();
  const [previousCinema, setPreviousCinema] = useState(state.cinemaId),
    changed = previousCinema !== state.cinemaId;
  useEffect(() => {
    if (!changed) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        setPreviousCinema(state.cinemaId);
        setParams(state.cinemaId ? { cinemaId: state.cinemaId } : {}, { replace: true });
      }
    });
    return () => {
      active = false;
    };
  }, [changed, state.cinemaId, setParams]);
  const requested = params.get('cinemaId'),
    assigned =
      !user.cinemaAssignments ||
      user.cinemaAssignments.some((item) => String(item.cinemaId) === state.cinemaId);
  return (
    <section className="staff-bookings">
      <div className="staff-bookings__context">
        <FormField label="Rạp hiện tại">
          <Select
            aria-label="Rạp hiện tại"
            value={state.cinemaId}
            disabled={state.pending || state.status !== 'success'}
            onChange={(e) => changeCinema(e.target.value)}
          >
            {state.cinemas
              .filter(
                (row) =>
                  !user.cinemaAssignments ||
                  user.cinemaAssignments.some((item) => String(item.cinemaId) === String(row.id)),
              )
              .map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name} · {row.city}
                </option>
              ))}
          </Select>
        </FormField>
      </div>
      {state.status !== 'success' ? (
        <>
          <PageHeader
            title="Quản lý đặt vé"
            breadcrumbs={[{ label: 'Manager' }, { label: 'Quản lý đặt vé' }]}
          />
          <AsyncState status={state.status} error={state.error} />
        </>
      ) : !state.cinemas.length ? (
        <AsyncState status="empty" emptyMessage="Bạn không có phân công rạp còn hiệu lực." />
      ) : !assigned || changed ? (
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
        <BookingWorkspace
          key={`${state.cinemaId}:${state.epoch}`}
          portal="manager"
          managerStore={store}
          cinemaId={state.cinemaId}
        />
      )}
    </section>
  );
}

function BookingWorkspace({ portal, managerStore, cinemaId }) {
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
  // The pure initializer stores this callback; it only reads the ref in later events/effects.
  // oxlint-disable-next-line react/refs
  const [controller] = useState(() =>
    createBookingController({
      api: createStaffBookingApi(portal),
      managerStore,
      cinemaId,
      initialQuery: query,
      onQueryChange,
    }),
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const previousQuery = useRef(query);
  const safeDestination = useCallback(
    (destination) => {
      const url = new URL(destination, window.location.href);
      return managerStore
        ? url.origin === window.location.origin && url.pathname.startsWith('/manager/')
        : url.origin === window.location.origin &&
            url.pathname === window.location.pathname &&
            (url.searchParams.get('orderId') ?? '') === controller.getSnapshot().selectedId;
    },
    [controller, managerStore],
  );
  useBookingDraftGuard(state.dirty, state.pending, {
    readState: controller.getSnapshot,
    isSafeDestination: safeDestination,
  });
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
  return <BookingView state={state} controller={controller} portal={portal} cinemaId={cinemaId} />;
}

export function BookingView({ state, controller, portal, cinemaId }) {
  const busy = state.pending,
    order = state.detail.status === 'success' ? state.detail.order : null;
  const cinemas = state.metadata.status === 'success' ? state.metadata.data.cinemas : [];
  const columns = [
    { key: 'DonDatVeID', label: 'Mã đơn', render: (row) => <strong>#{row.DonDatVeID}</strong> },
    {
      key: 'customer',
      label: 'Khách hàng',
      render: (row) => (
        <>
          <strong>{row.HoTenKhachHang}</strong>
          <span className="staff-bookings__secondary-text">{row.Email}</span>
        </>
      ),
    },
    {
      key: 'show',
      label: 'Phim / Suất / Rạp',
      render: (row) => (
        <>
          <strong>{row.TenPhim}</strong>
          <br />
          {formatDateTime(row.ThoiGianBatDau)}
          <br />
          {row.TenRap} · {row.TenPhong}
        </>
      ),
    },
    {
      key: 'seats',
      label: 'Vé / Ghế',
      render: (row) => (
        <>
          {row.SoLuongVe} vé
          <span className="staff-bookings__secondary-text">
            {row.DanhSachGhe || 'Không có vé hoạt động'}
          </span>
        </>
      ),
    },
    {
      key: 'TongTienThanhToan',
      label: 'Tổng snapshot',
      render: (row) => money(row.TongTienThanhToan),
    },
    {
      key: 'TrangThaiDon',
      label: 'Trạng thái đơn',
      render: (row) => <StatusBadge status={row.TrangThaiDon} />,
    },
    {
      key: 'TrangThaiThanhToanMoiNhat',
      label: 'Thanh toán gần nhất',
      className: 'staff-bookings__secondary-column',
      render: (row) =>
        row.TrangThaiThanhToanMoiNhat ? (
          <StatusBadge status={row.TrangThaiThanhToanMoiNhat} />
        ) : (
          'Chưa thử thanh toán'
        ),
    },
    {
      key: 'action',
      label: 'Thao tác',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => controller.showOrder(row.DonDatVeID)}
          aria-label={`Xem đơn #${row.DonDatVeID} của ${row.HoTenKhachHang}`}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];
  const confirmation = state.confirmation,
    selection = bookingSelection(state);
  let confirmTitle = 'Bỏ thay đổi chưa lưu?',
    confirmDescription = 'Các lựa chọn chưa lưu trong form sẽ bị bỏ.',
    entityLabel;
  if (confirmation?.kind === 'cancel') {
    confirmTitle = `Hủy đơn #${confirmation.order.id}?`;
    entityLabel = `${confirmation.order.user.name} · ${confirmation.order.movieTitle} · ${confirmation.order.seatLabels}`;
    confirmDescription =
      'Hủy toàn bộ đơn và giải phóng ghế; giữ lịch sử vé/thanh toán. Không hoàn tiền tự nguyện.';
  }
  if (confirmation?.kind === 'create') {
    confirmTitle = 'Xác nhận tạo đơn Chờ thanh toán';
    entityLabel = `${state.draft.customer.HoTen} · ${selection.selected.map((seat) => seat.label).join(', ')}`;
    confirmDescription = `Giá vé dự kiến ${money(selection.preview)}. Giá/ghế được kiểm tra lại khi tạo. Hạn giữ chỗ bắt đầu sau khi tạo thành công.`;
  }
  if (confirmation?.kind === 'edit') {
    confirmTitle = `Xác nhận đổi ghế đơn #${confirmation.order.id}`;
    entityLabel = `${confirmation.order.seatLabels} → ${selection.selected.map((seat) => seat.label).join(', ')}`;
    confirmDescription =
      'Giữ lịch sử vé bị bỏ và giá vé được giữ lại; không kéo dài hạn giữ chỗ. Đơn và ghế được kiểm tra lại khi lưu.';
  }
  return (
    <section className="staff-bookings">
      <PageHeader
        title="Quản lý đặt vé"
        description={
          portal === 'admin'
            ? 'Tra cứu đơn toàn hệ thống và hỗ trợ Customer hiện có.'
            : 'Đơn tại rạp hiện tại trong phân công còn hiệu lực.'
        }
        breadcrumbs={[
          { label: portal === 'admin' ? 'Admin' : 'Manager', to: `/${portal}` },
          { label: 'Quản lý đặt vé' },
        ]}
        actions={
          <Button
            onClick={controller.startCreate}
            disabled={busy || state.metadata.status !== 'success' || !cinemas.length}
          >
            Tạo đơn đặt vé
          </Button>
        }
      />
      <AsyncState
        status={state.metadata.status === 'error' ? 'error' : 'idle'}
        error={state.metadata.error}
        onRetry={() => void controller.refresh()}
      />
      {state.notice && (
        <p
          role={state.notice.error ? 'alert' : 'status'}
          className={state.notice.error ? 'staff-bookings__error' : 'staff-bookings__success'}
        >
          {state.notice.conflict && 'Xung đột: '}
          {state.notice.error?.message ?? state.notice.text}
        </p>
      )}
      {state.editor ? (
        <div className="staff-bookings__workspace">
          <div style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="secondary"
              onClick={controller.closeEditor}
              disabled={busy}
            >
              ← Quay lại danh sách đơn
            </Button>
            <span className="staff-bookings__secondary-text">Đang trong chế độ {state.editor === 'edit' ? 'sửa ghế' : 'tạo đơn'}</span>
          </div>
          <div>
            <BookingEditor state={state} controller={controller} cinemaId={cinemaId} />
          </div>
        </div>
      ) : (
        <>
          <FilterBar
            label="Bộ lọc đơn đặt vé"
            schema={[
              { key: 'search', label: 'Tìm kiếm' },
              { key: 'status', label: 'Trạng thái' },
              ...(!cinemaId
                ? [
                    {
                      key: 'cinemaId',
                      label: 'Rạp',
                      format: (id) =>
                        cinemas.find((row) => String(row.RapID) === id)?.TenRap ?? 'Rạp đã chọn',
                    },
                  ]
                : []),
            ]}
            draft={state.filters}
            applied={state.applied}
            pending={busy}
            onRemoveFilter={controller.removeFilter}
            onApply={controller.applyFilters}
            onReset={controller.resetFilters}
          >
            <FormField label="Tìm mã đơn / vé / khách hàng / phim">
              <Input
                value={state.filters.search}
                maxLength={100}
                disabled={busy}
                onChange={(e) => controller.setFilters({ search: e.target.value })}
              />
            </FormField>
            <FormField label="Trạng thái đơn">
              <Select
                value={state.filters.status}
                disabled={busy}
                onChange={(e) => controller.setFilters({ status: e.target.value })}
              >
                <option value="">Tất cả trạng thái</option>
                {bookingStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            </FormField>
            {!cinemaId && (
              <FormField label="Rạp lọc đơn">
                <Select
                  value={state.filters.cinemaId}
                  disabled={busy || state.metadata.status !== 'success'}
                  onChange={(e) => controller.setFilters({ cinemaId: e.target.value })}
                >
                  <option value="">Tất cả rạp được phép</option>
                  {cinemas.map((row) => (
                    <option key={row.RapID} value={row.RapID}>
                      {row.TenRap}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}
          </FilterBar>
          {state.list.status === 'success' && (
            <p role="status">Có {state.list.data.total} đơn phù hợp.</p>
          )}
          <ResourceTable
            caption="Danh sách đơn đặt vé"
            columns={columns}
            rows={state.list.data?.orders ?? []}
            rowKey="DonDatVeID"
            status={state.list.status}
            error={state.list.error}
            onRetry={() => void controller.reloadList()}
            pagination={
              state.list.status === 'success'
                ? {
                    page: state.list.data.page,
                    pageSize: state.list.data.pageSize,
                    total: state.list.data.total,
                    disabled: busy,
                    onPageChange: controller.setPage,
                  }
                : undefined
            }
          />
        </>
      )}
      <Dialog
        open={Boolean(state.selectedId) && !state.editor}
        size="lg"
        title={order ? `Chi tiết đơn #${order.id}` : 'Chi tiết đơn đặt vé'}
        busy={busy}
        onOpenChange={(open) => {
          if (!open) controller.closeDetail();
        }}
      >
        <AsyncState
          status={state.detail.status === 'success' ? 'idle' : state.detail.status}
          error={state.detail.error}
          onRetry={() => void controller.reloadDetail()}
          loadingMessage="Đang tải chi tiết đơn…"
        />
        {order && (
          <BookingDetail
            order={order}
            busy={busy}
            editing={Boolean(state.editor)}
            onEdit={controller.startEdit}
            onCancel={controller.requestCancel}
            onRefresh={controller.reloadDetail}
            onHoldElapsed={controller.onHoldElapsed}
          />
        )}
      </Dialog>
      <ConfirmDialog
        key={`${confirmation?.kind}:${confirmation?.snapshot?.orderId ?? ''}`}
        open={Boolean(confirmation)}
        busy={busy}
        title={confirmTitle}
        description={confirmDescription}
        entityLabel={entityLabel}
        confirmLabel={
          confirmation?.kind === 'discard'
            ? 'Bỏ thay đổi'
            : confirmation?.kind === 'cancel'
              ? 'Hủy đơn'
              : 'Xác nhận'
        }
        onOpenChange={(open) => {
          if (!open) controller.cancelConfirmation();
        }}
        onConfirm={
          confirmation?.kind === 'discard' ? controller.confirmDiscard : controller.confirmMutation
        }
      />
    </section>
  );
}
