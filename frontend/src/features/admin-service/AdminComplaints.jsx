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
import { useAdminWorkspace } from '../admin-workspace/AdminWorkspaceContext.js';
import { AdminWorkspaceProvider } from '../admin-workspace/AdminWorkspaceContext.jsx';
import { adminApi } from '../../api/adminApi';
import ComplaintOrderReference from '../../components/ComplaintOrderReference';
import {
  PageHeader,
  FilterBar,
  ResourceTable,
  FormField,
  Input,
  Select,
  Button,
  ConfirmDialog,
  Dialog,
  AsyncState,
  StatusBadge,
} from '../../components/ui';
import AdminComplaintAssignment from '../admin/AdminComplaintAssignment';
import { formatDateTime } from '../../utils/dateTime';
import Forbidden from '../../pages/Forbidden';
import { COMPLAINT_STATUSES, PRIORITIES, PROCESSING_STATUSES } from './complaintModel';
import { complaintAdapter } from './complaintAdapter';
import { createComplaintController } from './complaintController';
import '../admin-resources/admin-resources.css';
export default function AdminComplaints() {
  const { user } = useAuth(),
    store = useAdminWorkspace(),
    adapter = complaintAdapter(user);
  if (!adapter.allowed) return <Forbidden />;
  if (!store)
    return (
      <AdminWorkspaceProvider>
        <AdminComplaints />
      </AdminWorkspaceProvider>
    );
  return (
    <Workspace
      key={`${user.userId}:${user.permissions
        .map((p) => p.code)
        .sort()
        .join(',')}`}
      adapter={adapter}
      store={store}
    />
  );
}
function Workspace({ adapter, store }) {
  const [params, setParams] = useSearchParams(),
    query = params.toString(),
    ref = useRef(query);
  useLayoutEffect(() => {
    ref.current = query;
  }, [query]);
  const onQueryChange = useCallback(
    (next, options) => {
      if (ref.current !== next) {
        ref.current = next;
        setParams(next, options);
      }
    },
    [setParams],
  );
  // The initializer stores the callback without reading the ref.
  // oxlint-disable-next-line react/refs
  const [controller] = useState(() =>
    createComplaintController({ adapter, store, initialQuery: query, onQueryChange }),
  );
  const state = useSyncExternalStore(
      controller.subscribe,
      controller.getSnapshot,
      controller.getSnapshot,
    ),
    previous = useRef(query);
  useEffect(() => {
    void controller.start();
    return () => controller.dispose();
  }, [controller]);
  useEffect(() => {
    if (previous.current !== query) {
      previous.current = query;
      void controller.syncQuery(query);
    }
  }, [query, controller]);
  return <ComplaintView adapter={adapter} state={state} controller={controller} />;
}
export function ComplaintView({ adapter, state, controller }) {
  const complaint = state.detail.complaint,
    busy = state.pending,
    confirmation = state.confirmation;
  const options = (values) => values.map((v) => <option key={v}>{v}</option>);
  const total = state.queue.rows.length,
    page = Math.min(state.page, Math.max(1, Math.ceil(total / state.pageSize)));
  return (
    <section className="admin-resource">
      <PageHeader
        title="Khiếu nại Admin"
        description="Tra cứu hồ sơ toàn hệ thống theo quyền Admin; ghi nhận xử lý và lịch sử theo quyền được cấp."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Khiếu nại' }]}
      />
      {state.notice && (
        <p
          role={state.notice.error ? 'alert' : 'status'}
          className={state.notice.error ? 'admin-resource__error' : 'admin-resource__success'}
        >
          {state.notice.error?.message ?? state.notice.text}
        </p>
      )}
      <FilterBar
        schema={[
          { key: 'search', label: 'Tìm kiếm' },
          { key: 'status', label: 'Trạng thái' },
          { key: 'type', label: 'Loại' },
          { key: 'priority', label: 'Ưu tiên' },
        ]}
        draft={state.filters}
        applied={state.applied}
        pending={busy}
        onApply={() => void controller.applyFilters()}
        onReset={() => void controller.resetFilters()}
      >
        <FormField label="Tìm chủ đề / người gửi / email">
          <Input
            value={state.filters.search}
            maxLength={100}
            disabled={busy}
            onChange={(e) => controller.setFilters({ search: e.target.value })}
          />
        </FormField>
        <FormField label="Loại khiếu nại" hint="Tên loại chính xác theo hồ sơ.">
          <Input
            value={state.filters.type}
            maxLength={100}
            disabled={busy}
            onChange={(e) => controller.setFilters({ type: e.target.value })}
          />
        </FormField>
        <FormField label="Trạng thái lọc">
          <Select
            value={state.filters.status}
            disabled={busy}
            onChange={(e) => controller.setFilters({ status: e.target.value })}
          >
            <option value="">Tất cả</option>
            {options(COMPLAINT_STATUSES)}
          </Select>
        </FormField>
        <FormField label="Ưu tiên lọc">
          <Select
            value={state.filters.priority}
            disabled={busy}
            onChange={(e) => controller.setFilters({ priority: e.target.value })}
          >
            <option value="">Tất cả</option>
            {options(PRIORITIES)}
          </Select>
        </FormField>
      </FilterBar>
      {state.queue.status === 'success' && (
        <p role="status">Có {total} kết quả theo bộ lọc từ hệ thống.</p>
      )}
      <ResourceTable
        caption="Hàng đợi khiếu nại Admin"
        rowKey="id"
        rows={state.queue.rows.slice((page - 1) * state.pageSize, page * state.pageSize)}
        status={state.queue.status}
        error={state.queue.error}
        onRetry={controller.reload}
        pagination={{
          page,
          pageSize: state.pageSize,
          total,
          disabled: busy,
          onPageChange: controller.setPage,
        }}
        columns={[
          {
            key: 'title',
            label: 'Chủ đề / loại',
            render: (r) => (
              <>
                <strong>{r.title}</strong>
                <span className="admin-resource__secondary-text">{r.type}</span>
              </>
            ),
          },
          { key: 'senderName', label: 'Người gửi' },
          { key: 'createdAt', label: 'Ngày gửi', render: (r) => formatDateTime(r.createdAt) },
          { key: 'priority', label: 'Ưu tiên' },
          { key: 'status', label: 'Trạng thái', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'action',
            label: 'Thao tác',
            render: (r) => (
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                aria-label={`Xem khiếu nại ${r.title}`}
                onClick={() => void controller.select(r.id)}
              >
                Xem
              </Button>
            ),
          },
        ]}
      />
      <Dialog
        open={Boolean(state.selectedId)}
        size="inspector"
        title={complaint?.title ?? 'Chi tiết khiếu nại'}
        busy={busy}
        onOpenChange={(open) => {
          if (!open) void controller.select(null);
        }}
      >
        <AsyncState
          status={state.detail.status}
          error={state.detail.error}
          onRetry={controller.reloadDetail}
        />
        {state.detail.status === 'success' && complaint && (
          <section className="admin-resource__panel" aria-label="Hồ sơ khiếu nại">
          <p>
            {complaint.senderName} · {complaint.type} · {complaint.priority} ·{' '}
            {formatDateTime(complaint.createdAt)}
          </p>
          <StatusBadge status={complaint.status} />
          <p className="admin-resource__content">{complaint.content}</p>
          <ComplaintOrderReference
            key={complaint.id}
            complaintId={complaint.id}
            allowed={adapter.referenceAllowed}
            loadReference={adminApi.complaintOrderReference}
          />
          <AdminComplaintAssignment
            complaintId={complaint.id}
            currentStaffId={complaint.assignedStaffId}
            onAssigned={() => void controller.reload()}
          />
          <div>
            <h3>Lịch sử xử lý</h3>
            {complaint.processings?.length ? (
              <ol className="admin-resource__history">
                {complaint.processings.map((p) => (
                  <li key={p.id}>
                    <strong>{p.processorName}</strong> · {formatDateTime(p.processedAt)} ·{' '}
                    <StatusBadge status={p.status} />
                    <p className="admin-resource__content">{p.content}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p>Chưa có lượt xử lý.</p>
            )}
          </div>
          {adapter.writable && state.draft ? (
            <>
              <p>
                Bản nháp gắn với từng hồ sơ và được giữ khi đổi bộ lọc hoặc chuyển hồ sơ trong vùng
                Admin.
              </p>
              <form
                className="admin-resource__form"
                aria-label="Ghi nhận xử lý Admin"
                onSubmit={(e) => {
                  e.preventDefault();
                  controller.request('processing');
                }}
              >
                <FormField label="Nội dung xử lý" required>
                  <textarea
                    className="ui-input"
                    rows={5}
                    value={state.draft.processing.content}
                    required
                    disabled={busy}
                    onChange={(e) => controller.changeProcessing({ content: e.target.value })}
                  />
                </FormField>
                <FormField label="Trạng thái sau xử lý">
                  <Select
                    value={state.draft.processing.nextStatus}
                    disabled={busy}
                    onChange={(e) => controller.changeProcessing({ nextStatus: e.target.value })}
                  >
                    {options(PROCESSING_STATUSES)}
                  </Select>
                </FormField>
                <Button type="submit" loading={busy}>
                  Ghi nhận xử lý
                </Button>
              </form>
              <form
                className="admin-resource__form"
                aria-label="Cập nhật trạng thái Admin"
                onSubmit={(e) => {
                  e.preventDefault();
                  controller.request('status');
                }}
              >
                <FormField label="Trạng thái hồ sơ">
                  <Select
                    value={state.draft.status}
                    disabled={busy}
                    onChange={(e) => controller.changeStatus(e.target.value)}
                  >
                    {options(PROCESSING_STATUSES)}
                  </Select>
                </FormField>
                <div className="admin-resource__actions">
                  <Button type="submit" loading={busy}>
                    Cập nhật trạng thái
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => controller.request('discard')}
                  >
                    Bỏ bản nháp hồ sơ
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <p>
              Bạn có quyền tra cứu hồ sơ; cần quyền xử lý để ghi nhận nội dung hoặc đổi trạng thái.
            </p>
          )}
          </section>
        )}
      </Dialog>
      <ConfirmDialog
        key={`${confirmation?.id ?? 'none'}:${confirmation?.action ?? 'none'}`}
        open={Boolean(confirmation)}
        busy={busy}
        title={
          confirmation?.action === 'discard'
            ? 'Bỏ bản nháp hồ sơ?'
            : confirmation?.action === 'processing'
              ? 'Ghi nhận xử lý khiếu nại?'
              : 'Cập nhật trạng thái khiếu nại?'
        }
        description={`${confirmation?.title ?? ''}${confirmation?.body ? ` · ${confirmation.body.nextStatus ?? confirmation.body.status}. ${confirmation.action === 'processing' ? 'Thêm một lượt vào lịch sử xử lý.' : 'Nội dung xử lý nháp được giữ.'}` : ' · Chỉ bỏ bản nháp của hồ sơ này.'}`}
        confirmLabel={confirmation?.action === 'discard' ? 'Bỏ bản nháp' : 'Xác nhận'}
        onOpenChange={(open) => {
          if (!open) controller.cancelConfirmation();
        }}
        onConfirm={() => void controller.confirm()}
      />
    </section>
  );
}
