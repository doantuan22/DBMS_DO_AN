import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/adminApi';
import { userCanAct } from '../../utils/authorization';
import Forbidden from '../../pages/Forbidden';
import PageHeader from '../../components/ui/PageHeader';
import ResourceSelect from '../../components/ui/ResourceSelect';
import ResourceTable from '../../components/ui/ResourceTable';
import FilterBar from '../../components/ui/FilterBar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FormField from '../../components/ui/FormField';
import StatusBadge from '../../components/ui/StatusBadge';
import AsyncState from '../../components/ui/AsyncState';
import Dialog from '../../components/ui/Dialog';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useBookingDraftGuard from '../staff-bookings/useBookingDraftGuard';
import { ROOM_TYPES, RESOURCE_STATUSES } from '../../../../shared/resourceContract.mjs';
import { createRoomsController } from './roomsController';
import { roomsView, roomSeatsPath, sameRoomsScope } from './roomsModel';
import './admin-rooms.css';

function RoomIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M3 3h18v8H3zM5 15h4v6H5zM15 15h4v6h-4zM3 18h8M13 18h8" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminRooms() {
  const { user } = useAuth();
  if (!userCanAct(user, 'ADMIN', 'QL_PHONG')) return <Forbidden />;
  return (
    <RoomsWorkspace
      key={`${user.userId}:${user.permissions
        .map((p) => p.code)
        .sort()
        .join(',')}`}
      user={user}
    />
  );
}

function RoomsWorkspace({ user }) {
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const [controller] = useState(() =>
    createRoomsController({
      api: adminApi,
      user,
      initialQuery: query,
      onQueryChange: (next) => setParams(next),
    }),
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const isSafeDestination = useCallback(
    (destination) => sameRoomsScope(destination, controller.getSnapshot().cinemaId),
    [controller],
  );
  useBookingDraftGuard(state.dirty, state.pending, {
    readState: controller.getSnapshot,
    isSafeDestination,
    message: 'Có thay đổi phòng chiếu chưa lưu. Rời màn hình và bỏ thay đổi?',
  });
  useEffect(() => {
    void controller.start();
    return () => controller.dispose();
  }, [controller]);
  useEffect(() => {
    void controller.syncQuery(query);
  }, [controller, query]);
  return <RoomsView state={state} controller={controller} />;
}

export function RoomsView({ state, controller }) {
  const view = roomsView(state);
  const filterTypes = [...new Set([...view.types, state.filters.type].filter(Boolean))];
  const cinema = state.lookup.rows.find((row) => String(row.RapID) === state.cinemaId);
  const ready = Boolean(
    cinema &&
    state.lookup.status === 'success' &&
    state.resource.status === 'success' &&
    !state.pending,
  );
  const schema = [
    { key: 'search', label: 'Tên phòng' },
    { key: 'type', label: 'Loại phòng' },
    { key: 'status', label: 'Trạng thái' },
  ];
  const columns = [
    {
      key: 'TenPhong',
      label: 'Tên phòng',
      render: (row) => (
        <div className="admin-rooms__room">
          <span className="admin-rooms__room-icon">
            <RoomIcon />
          </span>
          <strong>{row.TenPhong}</strong>
        </div>
      ),
    },
    { key: 'TenRap', label: 'Rạp' },
    {
      key: 'LoaiPhong',
      label: 'Loại phòng',
      render: (row) => <span className="admin-rooms__format">{row.LoaiPhong ?? '—'}</span>,
    },
    {
      key: 'TongSoGhe',
      label: 'Số ghế',
      align: 'right',
      render: (row) =>
        row.TongSoGhe == null ? (
          <span className="admin-rooms__muted">Chưa có dữ liệu</span>
        ) : (
          <span className="admin-rooms__seat-count">
            {row.TongSoGhe}
            <span className="admin-rooms__muted"> ghế</span>
          </span>
        ),
    },
    {
      key: 'TrangThai',
      label: 'Trạng thái',
      render: (row) => <StatusBadge status={row.TrangThai} />,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <div className="admin-rooms__row-actions">
          {controller.can('QL_GHE') && (
            <Link
              className="ui-button ui-button--secondary ui-button--sm admin-rooms__seats-link"
              to={roomSeatsPath(row)}
              aria-label={`Xem sơ đồ ghế ${row.TenPhong} · ${row.TenRap}`}
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
              onClick={() => controller.openEdit(row)}
              aria-label={`Sửa ${row.TenPhong} · ${row.TenRap}`}
            >
              Sửa
            </Button>
            <details className="admin-rooms__danger-actions">
              <summary
                className="ui-button ui-button--secondary ui-button--sm"
                aria-label={`Thao tác khác ${row.TenPhong} · ${row.TenRap}`}
              >
                Khác <span aria-hidden="true">⌄</span>
              </summary>
              <Button
                variant="quiet"
                size="sm"
                className="admin-rooms__delete"
                disabled={state.pending}
                onClick={() => controller.requestDelete(row)}
                aria-label={`Xóa ${row.TenPhong} · ${row.TenRap}`}
              >
                Xóa phòng
              </Button>
            </details>
          </div>
        </div>
      ),
    },
  ];
  return (
    <section className="admin-rooms" aria-label="Quản lý phòng chiếu">
      <div>
        <p className="admin-rooms__eyebrow">CƠ SỞ VẬT CHẤT</p>
        <PageHeader
          title="Phòng chiếu"
          description="Quản lý phòng và sức chứa theo từng rạp."
          breadcrumbs={[{ label: 'Quản trị', to: '/admin/overview' }, { label: 'Phòng chiếu' }]}
          primaryAction={
            <Button disabled={!ready} onClick={() => controller.openCreate()}>
              <span aria-hidden="true">＋</span> Thêm phòng
            </Button>
          }
        />
      </div>
      {state.notice && (
        <p className="admin-rooms__notice" role={state.notice.ok ? 'status' : 'alert'}>
          {state.notice.text}
        </p>
      )}
      <section className="admin-rooms__panel" aria-labelledby="room-filter-title">
        <h2 id="room-filter-title">Tìm phòng chiếu</h2>
        <FilterBar
          label="Bộ lọc phòng chiếu"
          schema={schema}
          draft={state.filters}
          applied={state.applied}
          pending={state.pending}
          onApply={() => controller.applyFilters()}
          onReset={() => controller.resetFilters()}
          applyLabel="Tìm phòng"
        >
          <ResourceSelect
            label="Rạp chiếu"
            value={state.cinemaId}
            scopeKey="admin-rooms-cinemas"
            options={state.lookup.rows.map((row) => ({ id: row.RapID, label: row.TenRap }))}
            lookupStatus={state.lookup.status}
            lookupError={state.lookup.error}
            onRetry={() => void controller.start()}
            disabled={state.pending}
            required={false}
            onChange={(id) => void controller.selectCinema(id)}
            emptyMessage="Chưa có rạp để chọn."
          />
          <FormField label="Tên / số phòng" hint="Tìm theo tên phòng, ví dụ Phòng 01.">
            <Input
              type="search"
              placeholder="Nhập tên hoặc số trong tên phòng"
              maxLength={100}
              value={state.filters.search}
              disabled={!cinema || state.pending}
              onChange={(event) => controller.setFilters({ search: event.target.value })}
            />
          </FormField>
          <FormField label="Loại phòng">
            <Select
              value={state.filters.type}
              disabled={!ready}
              onChange={(event) => controller.setFilters({ type: event.target.value })}
            >
              <option value="">Tất cả loại phòng</option>
              {filterTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Trạng thái">
            <Select
              value={state.filters.status}
              disabled={!ready}
              onChange={(event) => controller.setFilters({ status: event.target.value })}
            >
              <option value="">Tất cả trạng thái</option>
              {RESOURCE_STATUSES.rooms.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
          </FormField>
        </FilterBar>
        {state.lookup.limited && (
          <p className="admin-rooms__muted">
            Danh sách rạp được lấy từ các phòng bạn có quyền xem. Rạp chưa có phòng chưa xuất hiện
            trong danh sách này.
          </p>
        )}
        <AsyncState
          status={state.lookup.status === 'error' ? 'error' : 'idle'}
          error={state.lookup.error}
        />
      </section>
      <section className="admin-rooms__panel admin-rooms__list" aria-labelledby="room-list-title">
        <div className="admin-rooms__list-heading">
          <div>
            <h2 id="room-list-title">Danh sách phòng</h2>
            <p className="admin-rooms__muted">
              {cinema?.TenRap ?? 'Chưa chọn rạp'}
              {state.resource.status === 'success' && ` · ${view.total} phòng phù hợp`}
            </p>
          </div>
          <div className="admin-rooms__list-tools">
            <FormField label="Phòng mỗi trang">
              <Select
                value={state.pageSize}
                disabled={state.pending}
                onChange={(event) => controller.setPageSize(event.target.value)}
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </FormField>
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
        {!state.cinemaId ? (
          <div className="admin-rooms__choose">
            <span className="admin-rooms__choose-icon">
              <RoomIcon />
            </span>
            <h3>Chọn rạp để xem phòng chiếu</h3>
            <p>Danh sách phòng, số ghế và các thao tác sẽ hiển thị theo rạp bạn chọn.</p>
          </div>
        ) : (
          <ResourceTable
            columns={columns}
            rows={view.rows}
            rowKey="PhongID"
            caption="Phòng chiếu tại rạp đang chọn"
            className="admin-rooms__table"
            status={state.resource.status}
            error={state.resource.error}
            onRetry={() => void controller.reload()}
            emptyMessage={
              view.scopeTotal
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
        )}
      </section>
      {state.editor && (
        <RoomEditor
          editor={state.editor}
          cinemaName={cinema?.TenRap}
          pending={state.pending}
          controller={controller}
        />
      )}
      <ConfirmDialog
        key={state.deleteTarget?.PhongID ?? 'no-delete'}
        open={Boolean(state.deleteTarget)}
        busy={state.pending}
        title="Xóa phòng chiếu?"
        entityLabel={
          state.deleteTarget
            ? `${state.deleteTarget.TenPhong} · ${state.deleteTarget.TenRap} · ${state.deleteTarget.TrangThai}`
            : undefined
        }
        description="Phòng có lịch sử suất chiếu sẽ chuyển sang Ngưng hoạt động để giữ lịch sử. Phòng chưa có lịch sử sẽ được xóa cùng các ghế."
        confirmLabel="Xác nhận xử lý phòng"
        onOpenChange={(open) => {
          if (!open) controller.cancelDelete();
        }}
        onConfirm={() => controller.confirmDelete()}
      />
      <ConfirmDialog
        open={Boolean(state.confirmation)}
        title="Bỏ thay đổi chưa lưu?"
        entityLabel={state.editor?.values.name || 'Phòng đang tạo'}
        description={
          state.confirmation?.kind === 'cinema'
            ? 'Bản nháp phòng hiện tại sẽ bị bỏ khi chuyển rạp.'
            : 'Các thay đổi của phòng hiện tại chưa được lưu.'
        }
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

export function RoomEditor({ editor, cinemaName, pending, controller }) {
  const formId = useId();
  const nameRef = useRef(null);
  const editing = editor.mode === 'edit';
  return (
    <Dialog
      open
      size="room-drawer"
      title={editing ? 'Chỉnh sửa phòng chiếu' : 'Thêm phòng chiếu'}
      description={
        editing ? 'Cập nhật thông tin phòng tại rạp hiện tại.' : 'Tạo phòng mới tại rạp đã chọn.'
      }
      initialFocusRef={nameRef}
      busy={pending}
      onOpenChange={(open) => {
        if (!open) controller.closeEditor();
      }}
      closeLabel="Đóng form phòng chiếu"
      footer={
        <>
          <Button variant="secondary" disabled={pending} onClick={() => controller.closeEditor()}>
            Hủy
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {editing ? 'Lưu thay đổi' : 'Thêm phòng'}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="admin-room-editor"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void controller.save();
        }}
      >
        <FormField label="Rạp chiếu" hint="Phòng thuộc rạp này. Rạp được giữ nguyên khi chỉnh sửa.">
          <Input value={cinemaName ?? ''} readOnly />
        </FormField>
        <FormField
          label="Tên phòng"
          required
          error={editor.errors.name}
          hint="Tên phòng phải khác các phòng khác trong cùng rạp."
        >
          <Input
            ref={nameRef}
            value={editor.values.name}
            maxLength={100}
            disabled={pending}
            placeholder="Ví dụ: Phòng 01"
            onChange={(event) => controller.changeField('name', event.target.value)}
          />
        </FormField>
        <FormField label="Loại phòng" required error={editor.errors.type}>
          <Select
            value={editor.values.type}
            disabled={pending}
            onChange={(event) => controller.changeField('type', event.target.value)}
          >
            {ROOM_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </Select>
        </FormField>
        {editing ? (
          <FormField label="Trạng thái" required error={editor.errors.status}>
            <Select
              value={editor.values.status}
              disabled={pending}
              onChange={(event) => controller.changeField('status', event.target.value)}
            >
              {RESOURCE_STATUSES.rooms.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
          </FormField>
        ) : (
          <p className="admin-room-editor__info">
            Phòng mới có trạng thái <strong>Hoạt động</strong>. Sau khi tạo, bạn có thể cấu hình ghế
            cho phòng.
          </p>
        )}
        {Object.values(editor.errors).some(Boolean) && (
          <p role="alert" className="admin-room-editor__validation">
            Kiểm tra các trường được đánh dấu trước khi lưu.
          </p>
        )}
        {editor.error && (
          <AsyncState status="error" error={editor.error} errorMessage={editor.error.message} />
        )}
      </form>
    </Dialog>
  );
}
