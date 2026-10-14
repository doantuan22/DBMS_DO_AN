import { useAuth } from '../context/AuthContext';
import { userCanAct } from '../utils/authorization';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as api from '../api/supportApi';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useLocation, useNavigate } from 'react-router-dom';
import NotFound from './NotFound';
import SupportWorkspaceView from '../features/support/SupportWorkspaceView';
import {
  supportCasePath,
  supportDestination,
  supportRoute,
} from '../features/support/supportNavigation';
import useBookingDraftGuard from '../features/staff-bookings/useBookingDraftGuard';
import {
  createSupportDraftStore,
  DEFAULT_PROCESSING_STATUS,
  EMPTY_SUPPORT_FILTERS,
  PROCESSING_STATUSES,
} from '../features/support/supportDraftStore';

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
  const location = useLocation();
  const scope = `${user?.userId}:${user?.permissions
    ?.map((item) => item.code)
    .sort()
    .join(',')}`;
  return supportRoute(location.pathname).kind === 'notFound' ? (
    <NotFound />
  ) : (
    <SupportWorkspace key={scope} scope={scope} />
  );
}

function SupportWorkspace({ scope }) {
  const { user } = useAuth();
  const location = useLocation(),
    navigate = useNavigate(),
    route = supportRoute(location.pathname);
  const canProcess = userCanAct(user, 'CSKH', 'QL_KHIEUNAI', 'XULY_KHIEUNAI');
  const canReference = userCanAct(user, 'CSKH', 'QL_KHIEUNAI', 'TRA_CUU_DON');
  const draftStore = useMemo(() => createSupportDraftStore(scope), [scope]);
  const [initialWorkspace] = useState(() => {
    const saved = draftStore.readWorkspace(),
      params = new URLSearchParams(location.search);
    const appliedFilters = {
      ...saved.appliedFilters,
      ...Object.fromEntries(
        ['status', 'priority']
          .filter((key) => params.has(key))
          .map((key) => [key, params.get(key)]),
      ),
    };
    return {
      ...saved,
      appliedFilters,
      draftFilters: {
        ...saved.draftFilters,
        ...Object.fromEntries(
          ['status', 'priority']
            .filter((key) => params.has(key))
            .map((key) => [key, params.get(key)]),
        ),
      },
      selectedId: route.kind === 'case' ? route.id : saved.selectedId,
    };
  });
  const previousRoute = useRef(`${location.pathname}${location.search}`);
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
  const [actionConfirmation, setActionConfirmation] = useState(null);
  const readGuard = useCallback(
    () => ({
      dirty: hasUnsavedRef.current || draftStore.hasDrafts(),
      pending: writePending.current,
    }),
    [draftStore],
  );
  useBookingDraftGuard(false, busy, {
    readState: readGuard,
    isSafeDestination: supportDestination,
    message: 'Có bản nháp CSKH chưa lưu. Rời khu vực hỗ trợ?',
  });

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
        if (error.status === 401 || error.status === 403) {
          detailGeneration.current++;
          setDetail({ status: 'error', error });
        }
      }
    }
  }, []);

  const reloadAppliedQueue = useCallback(() => loadQueue(appliedFiltersRef.current), [loadQueue]);

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
        if (complaint?.id !== complaintId)
          throw new Error('Hồ sơ trả về không khớp khiếu nại đã chọn.');
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
    const nextLocation = `${location.pathname}${location.search}`;
    if (previousRoute.current === nextLocation) return;
    previousRoute.current = nextLocation;
    if (writePending.current) return;
    const nextRoute = supportRoute(location.pathname),
      params = new URLSearchParams(location.search);
    const next = {
      ...appliedFiltersRef.current,
      status: params.get('status') ?? '',
      priority: params.get('priority') ?? '',
    };
    if (!filtersEqual(next, appliedFiltersRef.current)) {
      appliedFiltersRef.current = next;
      setAppliedFilters(next);
      setDraftFilters(next);
      persistWorkspace({ appliedFilters: next, draftFilters: next });
      void loadQueue(next);
    }
    if (nextRoute.kind === 'case' && nextRoute.id !== selection.current) {
      setDiscardDialogOpen(false);
      setActionConfirmation(null);
      void selectComplaint(nextRoute.id);
    }
  }, [location.pathname, location.search, persistWorkspace, selectComplaint, loadQueue]);

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
    navigate(supportCasePath(route.kind === 'case' ? selection.current : null, nextFilters));
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
    navigate(supportCasePath(route.kind === 'case' ? selection.current : null, reset));
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

  const requestWrite = (event, action) => {
    event.preventDefault();
    if (!canProcess || writePending.current || detail.status !== 'success') return;
    if (action === 'processing' && !processing.content.trim()) {
      setNotice({ ok: false, text: 'Vui lòng nhập nội dung xử lý.' });
      return;
    }
    setActionConfirmation({
      action,
      id: selection.current,
      title: detail.complaint.title,
      generation: detailGeneration.current,
      processing: { ...processing },
      status: statusValue,
    });
  };
  const writeComplaint = async (event, action, confirmed) => {
    event.preventDefault();
    if (
      !canProcess ||
      writePending.current ||
      detail.status !== 'success' ||
      detail.complaint.id !== selection.current ||
      confirmed?.id !== selection.current ||
      confirmed.generation !== detailGeneration.current
    )
      return;
    const complaintId = selection.current;
    const generation = detailGeneration.current;
    const processingToSave = { ...confirmed.processing };
    const statusToSave = confirmed.status;
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
          Boolean(processingToSave.content) || processingToSave.nextStatus !== processingBaseStatus;
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
      if (mounted.current) {
        setBusy(false);
        setActionConfirmation(null);
      }
    }
  };

  return (
    <>
      <SupportWorkspaceView
        queue={queue}
        detail={detail}
        selectedId={selectedId}
        draftFilters={draftFilters}
        appliedFilters={appliedFilters}
        processing={processing}
        statusValue={statusValue}
        busy={busy}
        canProcess={canProcess}
        canReference={canReference}
        routeCase={route.kind === 'case'}
        notice={notice}
        processingModified={processingModified}
        discardDialogOpen={discardDialogOpen}
        changeFilter={changeFilter}
        applyFilters={applyFilters}
        resetFilters={resetFilters}
        reloadQueue={() => void reloadAppliedQueue()}
        openCase={(id) => {
          if (!writePending.current) navigate(supportCasePath(id, appliedFiltersRef.current));
        }}
        retryDetail={() => void selectComplaint(selectedId)}
        updateProcessing={updateProcessing}
        updateStatusValue={updateStatusValue}
        requestWrite={requestWrite}
        setDiscardDialogOpen={setDiscardDialogOpen}
        discardProcessingDraft={discardProcessingDraft}
      />
      <ConfirmDialog
        key={`write:${actionConfirmation?.id ?? 'none'}:${actionConfirmation?.action ?? 'none'}`}
        open={Boolean(actionConfirmation)}
        busy={busy}
        title={
          actionConfirmation?.action === 'processing'
            ? 'Ghi diễn biến vào hồ sơ?'
            : 'Cập nhật trạng thái hồ sơ?'
        }
        description={`${actionConfirmation?.title ?? ''} · ${actionConfirmation?.action === 'processing' ? actionConfirmation.processing.nextStatus : (actionConfirmation?.status ?? '')}. ${actionConfirmation?.action === 'processing' ? 'Thêm một diễn biến vào lịch sử xử lý.' : 'Giữ nội dung xử lý chưa lưu.'}`}
        confirmLabel="Xác nhận"
        onOpenChange={(open) => {
          if (!open && !writePending.current) setActionConfirmation(null);
        }}
        onConfirm={() =>
          writeComplaint({ preventDefault() {} }, actionConfirmation.action, actionConfirmation)
        }
      />
    </>
  );
}
