import { useAuth } from '../context/AuthContext';
import { userCanAct } from '../utils/authorization';
import { formatDateTime as formatTime } from '../utils/dateTime';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as api from '../api/supportApi';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import ComplaintOrderReference from '../components/ComplaintOrderReference';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  createSupportDraftStore,
  DEFAULT_PROCESSING_STATUS,
  EMPTY_SUPPORT_FILTERS,
  PROCESSING_STATUSES,
} from '../features/support/supportDraftStore';

const complaintStatuses = ['Mới', ...PROCESSING_STATUSES];
const priorities = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp'];

function filtersEqual(left, right) {
  return Object.keys(EMPTY_SUPPORT_FILTERS).every((key) => left[key] === right[key]);
}

function initialActionStatus(complaintStatus) {
  return PROCESSING_STATUSES.includes(complaintStatus)
    ? complaintStatus
    : DEFAULT_PROCESSING_STATUS;
}

export default function SupportPortal() {
  const { user } = useAuth();
  const scope = `${user?.userId}:${user?.permissions
    ?.map((item) => item.code)
    .sort()
    .join(',')}`;
  return <SupportWorkspace key={scope} scope={scope} />;
}

function SupportWorkspace({ scope }) {
  const { user } = useAuth();
  const canProcess = userCanAct(user, 'CSKH', 'QL_KHIEUNAI', 'XULY_KHIEUNAI');
  const canReference = userCanAct(user, 'CSKH', 'QL_KHIEUNAI', 'TRA_CUU_DON');
  const draftStore = useMemo(() => createSupportDraftStore(scope), [scope]);
  const initialWorkspace = useMemo(() => draftStore.readWorkspace(), [draftStore]);
  const workspace = useRef(initialWorkspace);
  const appliedFiltersRef = useRef(initialWorkspace.appliedFilters);
  const [draftFilters, setDraftFilters] = useState(initialWorkspace.draftFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialWorkspace.appliedFilters);
  const [queue, setQueue] = useState({ status: 'loading', rows: [] });
  const [selectedId, setSelectedId] = useState(initialWorkspace.selectedId);
  const [detail, setDetail] = useState(() =>
    initialWorkspace.selectedId === null ? { status: 'idle' } : { status: 'loading' },
  );
  const detailGeneration = useRef(0);
  const queueGeneration = useRef(0);
  const selection = useRef(initialWorkspace.selectedId);
  const currentQueueLoader = useRef(null);
  const writePending = useRef(false);
  const mounted = useRef(true);
  const hasUnsavedRef = useRef(false);
  const [processingBaseStatus, setProcessingBaseStatus] = useState(DEFAULT_PROCESSING_STATUS);
  const [statusBaseValue, setStatusBaseValue] = useState(DEFAULT_PROCESSING_STATUS);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState({
    content: '',
    nextStatus: DEFAULT_PROCESSING_STATUS,
  });
  const [statusValue, setStatusValue] = useState(DEFAULT_PROCESSING_STATUS);
  const [notice, setNotice] = useState(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const persistWorkspace = useCallback(
    (changes) => {
      workspace.current = { ...workspace.current, ...changes };
      draftStore.writeWorkspace(workspace.current);
    },
    [draftStore],
  );

  const loadQueue = useCallback(async (queryFilters) => {
    const current = ++queueGeneration.current;
    setQueue((existing) => ({ ...existing, status: 'loading', error: undefined }));
    try {
      const result = await api.getSupportComplaints(queryFilters);
      if (current !== queueGeneration.current || !mounted.current) return;
      setQueue({ status: 'success', rows: result.complaints });
    } catch (error) {
      if (current === queueGeneration.current && mounted.current) {
        setQueue((existing) => ({ status: 'error', error, rows: existing.rows }));
      }
    }
  }, []);

  const reloadAppliedQueue = useCallback(
    () => loadQueue(appliedFiltersRef.current),
    [loadQueue],
  );

  const selectComplaint = useCallback(
    async (complaintId) => {
      if (complaintId === null || complaintId === undefined) return;
      const current = ++detailGeneration.current;
      selection.current = complaintId;
      setSelectedId(complaintId);
      persistWorkspace({ selectedId: complaintId });
      setDetail({ status: 'loading' });
      setNotice(null);
      try {
        const result = await api.getSupportComplaint(complaintId);
        if (
          current !== detailGeneration.current ||
          selection.current !== complaintId ||
          !mounted.current
        )
          return;
        const complaint = result.complaint;
        const defaultStatus = initialActionStatus(complaint.status);
        const savedDraft = draftStore.readComplaintDraft(complaintId);
        const nextProcessing = savedDraft.processing ?? {
          content: '',
          nextStatus: defaultStatus,
        };
        const nextStatusValue = savedDraft.statusValue ?? defaultStatus;
        setProcessingBaseStatus(defaultStatus);
        setStatusBaseValue(defaultStatus);
        setProcessing(nextProcessing);
        setStatusValue(nextStatusValue);
        hasUnsavedRef.current =
          Boolean(nextProcessing.content) ||
          nextProcessing.nextStatus !== defaultStatus ||
          nextStatusValue !== defaultStatus;
        setDetail({ status: 'success', complaint });
      } catch (error) {
        if (
          current === detailGeneration.current &&
          selection.current === complaintId &&
          mounted.current
        ) {
          setDetail({ status: 'error', error });
        }
      }
    },
    [draftStore, persistWorkspace],
  );

  useLayoutEffect(() => {
    currentQueueLoader.current = reloadAppliedQueue;
  }, [reloadAppliedQueue]);

  useEffect(() => {
    mounted.current = true;
    const requests = [detailGeneration, queueGeneration];
    void loadQueue(appliedFiltersRef.current);
    if (selection.current !== null) void selectComplaint(selection.current);
    return () => {
      mounted.current = false;
      requests.forEach((request) => {
        request.current++;
      });
    };
  }, [loadQueue, selectComplaint]);

  useEffect(() => {
    const beforeUnload = (event) => {
      if (!hasUnsavedRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);

  const filtersModified = !filtersEqual(draftFilters, appliedFilters);
  const processingModified =
    detail.status === 'success' &&
    (Boolean(processing.content) || processing.nextStatus !== processingBaseStatus);

  const changeFilter = (key, value) => {
    const nextFilters = { ...draftFilters, [key]: value };
    setDraftFilters(nextFilters);
    persistWorkspace({ draftFilters: nextFilters });
  };

  const applyFilters = (event) => {
    event.preventDefault();
    if (!filtersModified) return;
    const nextFilters = { ...draftFilters };
    appliedFiltersRef.current = nextFilters;
    setAppliedFilters(nextFilters);
    persistWorkspace({ appliedFilters: nextFilters });
    void loadQueue(nextFilters);
  };

  const resetFilters = () => {
    const reset = { ...EMPTY_SUPPORT_FILTERS };
    setDraftFilters(reset);
    persistWorkspace({ draftFilters: reset });
    if (filtersEqual(appliedFiltersRef.current, reset)) return;
    appliedFiltersRef.current = reset;
    setAppliedFilters(reset);
    persistWorkspace({ draftFilters: reset, appliedFilters: reset });
    void loadQueue(reset);
  };

  const saveCurrentDraft = (nextProcessing, nextStatusValue = statusValue) => {
    const complaintId = selection.current;
    if (complaintId === null || detail.status !== 'success') return;
    const processingIsDirty =
      Boolean(nextProcessing.content) || nextProcessing.nextStatus !== processingBaseStatus;
    const statusIsDirty = nextStatusValue !== statusBaseValue;
    hasUnsavedRef.current = processingIsDirty || statusIsDirty;
    draftStore.writeComplaintDraft(complaintId, {
      processing: processingIsDirty ? nextProcessing : null,
      statusValue: statusIsDirty ? nextStatusValue : null,
    });
  };

  const updateProcessing = (nextProcessing) => {
    setProcessing(nextProcessing);
    saveCurrentDraft(nextProcessing);
  };

  const updateStatusValue = (nextStatusValue) => {
    setStatusValue(nextStatusValue);
    saveCurrentDraft(processing, nextStatusValue);
  };

  const discardProcessingDraft = () => {
    const complaintId = selection.current;
    if (complaintId === null) return;
    draftStore.clearProcessingDraft(complaintId);
    const nextProcessing = {
      content: '',
      nextStatus: processingBaseStatus,
    };
    setProcessing(nextProcessing);
    hasUnsavedRef.current = statusValue !== statusBaseValue;
    setDiscardDialogOpen(false);
  };

  const writeComplaint = async (event, action) => {
    event.preventDefault();
    if (
      !canProcess ||
      writePending.current ||
      detail.status !== 'success' ||
      detail.complaint.id !== selection.current
    )
      return;
    const complaintId = selection.current;
    const generation = detailGeneration.current;
    const processingToSave = { ...processing };
    const statusToSave = statusValue;
    writePending.current = true;
    setBusy(true);
    setNotice(null);
    try {
      if (action === 'processing') {
        await api.addComplaintProcessing(complaintId, processingToSave);
        draftStore.clearProcessingDraft(complaintId);
        setProcessingBaseStatus(processingToSave.nextStatus);
        setProcessing({ content: '', nextStatus: processingToSave.nextStatus });
        hasUnsavedRef.current = statusToSave !== statusBaseValue;
      } else {
        await api.updateComplaintStatus(complaintId, { status: statusToSave });
        draftStore.clearStatusDraft(complaintId);
        setStatusBaseValue(statusToSave);
        hasUnsavedRef.current =
          Boolean(processingToSave.content) ||
          processingToSave.nextStatus !== processingBaseStatus;
      }
      if (!mounted.current) return;
      await currentQueueLoader.current?.();
      if (
        selection.current !== complaintId ||
        generation !== detailGeneration.current ||
        !mounted.current
      )
        return;
      await selectComplaint(complaintId);
      if (
        selection.current !== complaintId ||
        detailGeneration.current !== generation + 1 ||
        !mounted.current
      )
        return;
      setNotice({
        ok: true,
        text:
          action === 'processing'
            ? 'Đã thêm diễn biến xử lý.'
            : 'Đã cập nhật trạng thái và ghi vào lịch sử.',
      });
    } catch (error) {
      if (mounted.current && generation === detailGeneration.current) {
        setNotice({ ok: false, text: error.message });
      }
    } finally {
      writePending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <section className="catalog-page" id="support-queue">
      <p className="catalog-eyebrow">CHĂM SÓC KHÁCH HÀNG</p>
      <h1>CSKH Portal</h1>
      <form
        className="catalog-form"
        onSubmit={applyFilters}
        aria-label="Bộ lọc hàng chờ khiếu nại"
      >
        <select
          aria-label="Lọc trạng thái"
          value={draftFilters.status}
          onChange={(event) => changeFilter('status', event.target.value)}
        >
          <option value="">Mọi trạng thái</option>
          {complaintStatuses.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          aria-label="Lọc mức ưu tiên"
          value={draftFilters.priority}
          onChange={(event) => changeFilter('priority', event.target.value)}
        >
          <option value="">Mọi mức ưu tiên</option>
          {priorities.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <input
          aria-label="Lọc loại khiếu nại"
          placeholder="Loại khiếu nại"
          maxLength={100}
          value={draftFilters.type}
          onChange={(event) => changeFilter('type', event.target.value)}
        />
        <input
          aria-label="Tìm khiếu nại"
          placeholder="Tìm tiêu đề, nội dung, người gửi"
          maxLength={100}
          value={draftFilters.search}
          onChange={(event) => changeFilter('search', event.target.value)}
        />
        <div className="catalog-actions">
          <button className="catalog-button" type="submit" disabled={!filtersModified}>
            Áp dụng bộ lọc
          </button>
          <button className="catalog-button catalog-button--secondary" type="button" onClick={resetFilters}>
            Đặt lại
          </button>
          <button
            className="catalog-button catalog-button--secondary"
            type="button"
            onClick={() => void reloadAppliedQueue()}
            aria-label="Làm mới hàng chờ"
          >
            Làm mới
          </button>
        </div>
        {filtersModified && (
          <p role="status" aria-live="polite">
            Bộ lọc đang nhập chưa được áp dụng.
          </p>
        )}
      </form>

      {queue.status === 'loading' && <LoadingState>Đang tải hàng chờ khiếu nại…</LoadingState>}
      {queue.status === 'error' && (
        <ErrorState error={queue.error} onRetry={() => void reloadAppliedQueue()} />
      )}
      {queue.status === 'success' &&
        (queue.rows.length ? (
          <ul className="catalog-list">
            {queue.rows.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void selectComplaint(item.id)}
                  aria-pressed={selectedId === item.id}
                  disabled={busy}
                >
                  <strong>
                    #{item.id} · {item.title}
                  </strong>
                  <br />
                  {item.senderName} · {item.type} · ưu tiên {item.priority} · {item.status}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Không có khiếu nại phù hợp.</EmptyState>
        ))}

      {notice && <p role={notice.ok ? 'status' : 'alert'}>{notice.text}</p>}
      {detail.status === 'loading' && <LoadingState>Đang tải chi tiết khiếu nại…</LoadingState>}
      {detail.status === 'error' && (
        <ErrorState error={detail.error} onRetry={() => void selectComplaint(selectedId)} />
      )}
      {detail.status === 'success' && (
        <section className="catalog-section">
          <h2>
            #{detail.complaint.id} · {detail.complaint.title}
          </h2>
          <p>
            {detail.complaint.senderName} · {detail.complaint.type} · {detail.complaint.status}
          </p>
          <p>{detail.complaint.content}</p>
          <ComplaintOrderReference
            key={`${selectedId}:${canReference}`}
            complaintId={selectedId}
            allowed={canReference}
          />
          <h3>Timeline xử lý</h3>
          {detail.complaint.processings.length ? (
            <ol>
              {detail.complaint.processings.map((item) => (
                <li key={item.id}>
                  <strong>{item.processorName ?? `Nhân viên #${item.processorId}`}</strong> ·{' '}
                  {formatTime(item.processedAt)} · {item.status}
                  <br />
                  {item.content}
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState>Chưa có diễn biến xử lý.</EmptyState>
          )}
          {canProcess && (
            <>
              <form
                className="catalog-form"
                onSubmit={(event) => void writeComplaint(event, 'processing')}
                aria-label="Ghi diễn biến xử lý"
              >
                <h3>Thêm diễn biến</h3>
                <textarea
                  aria-label="Nội dung xử lý"
                  value={processing.content}
                  onChange={(event) =>
                    updateProcessing({ ...processing, content: event.target.value })
                  }
                  required
                  disabled={busy}
                />
                <select
                  aria-label="Trạng thái sau xử lý"
                  value={processing.nextStatus}
                  onChange={(event) =>
                    updateProcessing({ ...processing, nextStatus: event.target.value })
                  }
                  disabled={busy}
                >
                  {PROCESSING_STATUSES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <div className="catalog-actions">
                  <button className="catalog-button" disabled={busy}>
                    {busy ? 'Đang lưu…' : 'Ghi diễn biến'}
                  </button>
                  {processingModified && (
                    <button
                      className="catalog-button catalog-button--secondary"
                      type="button"
                      disabled={busy}
                      onClick={() => setDiscardDialogOpen(true)}
                    >
                      Bỏ bản nháp
                    </button>
                  )}
                </div>
              </form>
              <form
                className="catalog-form"
                onSubmit={(event) => void writeComplaint(event, 'status')}
                aria-label="Cập nhật trạng thái khiếu nại"
              >
                <h3>Đổi trạng thái</h3>
                <select
                  aria-label="Trạng thái mới"
                  value={statusValue}
                  onChange={(event) => updateStatusValue(event.target.value)}
                  disabled={busy}
                >
                  {PROCESSING_STATUSES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <button className="catalog-button" disabled={busy}>
                  {busy ? 'Đang lưu…' : 'Cập nhật trạng thái'}
                </button>
              </form>
            </>
          )}
          <ConfirmDialog
            open={discardDialogOpen}
            onOpenChange={setDiscardDialogOpen}
            title="Bỏ bản nháp xử lý?"
            description="Nội dung chưa lưu của khiếu nại này sẽ bị xóa khỏi phiên hiện tại."
            confirmLabel="Bỏ bản nháp"
            cancelLabel="Tiếp tục chỉnh sửa"
            variant="danger"
            busy={busy}
            onConfirm={discardProcessingDraft}
          />
        </section>
      )}
    </section>
  );
}
