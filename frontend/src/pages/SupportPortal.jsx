import { useAuth } from '../context/AuthContext';
import { userCanAct } from '../utils/authorization';
import { formatDateTime as formatTime } from '../utils/dateTime';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as api from '../api/supportApi';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import ComplaintOrderReference from '../components/ComplaintOrderReference';

const complaintStatuses = ['Mới', 'Đang xử lý', 'Đã giải quyết', 'Đã đóng', 'Từ chối'];
const processingStatuses = ['Đang xử lý', 'Đã giải quyết', 'Đã đóng', 'Từ chối'];

export default function SupportPortal() {
  const { user } = useAuth();
  const scope = `${user?.userId}:${user?.permissions
    ?.map((item) => item.code)
    .sort()
    .join(',')}`;
  return <SupportWorkspace key={scope} />;
}

function SupportWorkspace() {
  const { user } = useAuth();
  const canProcess = userCanAct(user, 'CSKH', 'QL_KHIEUNAI', 'XULY_KHIEUNAI');
  const canReference = userCanAct(user, 'CSKH', 'QL_KHIEUNAI', 'TRA_CUU_DON');
  const [filters, setFilters] = useState({ status: '', type: '', search: '', priority: '' });
  const [queue, setQueue] = useState({ status: 'loading', rows: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState({ status: 'idle' });
  const detailGeneration = useRef(0);
  const queueGeneration = useRef(0);
  const selection = useRef(null);
  const currentQueueLoader = useRef(null);
  const writePending = useRef(false);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState({ content: '', nextStatus: 'Đang xử lý' });
  const [statusValue, setStatusValue] = useState('Đang xử lý');
  const [notice, setNotice] = useState(null);

  const loadQueue = useCallback(async () => {
    const current = ++queueGeneration.current;
    setQueue({ status: 'loading', rows: [] });
    try {
      const result = await api.getSupportComplaints(filters);
      if (current !== queueGeneration.current || !mounted.current) return;
      setQueue({ status: 'success', rows: result.complaints });
      if (selection.current && !result.complaints.some((item) => item.id === selection.current)) {
        selection.current = null;
        detailGeneration.current++;
        setSelectedId(null);
        setDetail({ status: 'idle' });
      }
    } catch (error) {
      if (current === queueGeneration.current && mounted.current)
        setQueue({ status: 'error', error, rows: [] });
    }
  }, [filters]);
  useLayoutEffect(() => {
    currentQueueLoader.current = loadQueue;
  }, [loadQueue]);
  const changeFilter = (key, value) => {
    queueGeneration.current++;
    detailGeneration.current++;
    selection.current = null;
    setSelectedId(null);
    setDetail({ status: 'idle' });
    setNotice(null);
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const selectComplaint = useCallback(async (complaintId) => {
    const current = ++detailGeneration.current;
    selection.current = complaintId;
    setSelectedId(complaintId);
    setDetail({ status: 'loading' });
    setNotice(null);
    setProcessing({ content: '', nextStatus: 'Đang xử lý' });
    try {
      const complaint = await api.getSupportComplaint(complaintId);
      if (current !== detailGeneration.current) return;
      setDetail({ status: 'success', complaint: complaint.complaint });
      setStatusValue(
        processingStatuses.includes(complaint.complaint.status)
          ? complaint.complaint.status
          : 'Đang xử lý',
      );
    } catch (error) {
      if (current === detailGeneration.current) setDetail({ status: 'error', error });
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const requests = [detailGeneration, queueGeneration];
    return () => {
      mounted.current = false;
      requests.forEach((request) => {
        request.current++;
      });
    };
  }, []);
  useEffect(() => {
    void Promise.resolve().then(loadQueue);
  }, [loadQueue]);
  const writeComplaint = async (event, action) => {
    event.preventDefault();
    if (
      !canProcess ||
      writePending.current ||
      detail.status !== 'success' ||
      detail.complaint.id !== selectedId
    )
      return;
    const id = selectedId,
      generation = detailGeneration.current;
    writePending.current = true;
    setBusy(true);
    setNotice(null);
    try {
      if (action === 'processing') await api.addComplaintProcessing(id, { ...processing });
      else await api.updateComplaintStatus(id, { status: statusValue });
      if (!mounted.current) return;
      await currentQueueLoader.current();
      if (selection.current !== id || generation !== detailGeneration.current) return;
      await selectComplaint(id);
      if (selection.current !== id || detailGeneration.current !== generation + 1) return;
      setNotice({
        ok: true,
        text:
          action === 'processing'
            ? 'Đã thêm diễn biến xử lý.'
            : 'Đã cập nhật trạng thái và ghi vào lịch sử.',
      });
    } catch (error) {
      if (mounted.current && generation === detailGeneration.current)
        setNotice({ ok: false, text: error.message });
    } finally {
      writePending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <section className="catalog-page">
      <p className="catalog-eyebrow">CHĂM SÓC KHÁCH HÀNG</p>
      <h1>CSKH Portal</h1>
      <form
        className="catalog-form"
        onSubmit={(event) => {
          event.preventDefault();
          void loadQueue();
        }}
      >
        <select
          aria-label="Lọc trạng thái"
          value={filters.status}
          onChange={(event) => changeFilter('status', event.target.value)}
        >
          <option value="">Mọi trạng thái</option>
          {complaintStatuses.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          aria-label="Lọc mức ưu tiên"
          value={filters.priority}
          onChange={(event) => changeFilter('priority', event.target.value)}
        >
          <option value="">Mọi mức ưu tiên</option>
          {['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp'].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <input
          aria-label="Lọc loại khiếu nại"
          placeholder="Loại khiếu nại"
          value={filters.type}
          onChange={(event) => changeFilter('type', event.target.value)}
        />
        <input
          aria-label="Tìm khiếu nại"
          placeholder="Tìm tiêu đề, nội dung, người gửi"
          value={filters.search}
          onChange={(event) => changeFilter('search', event.target.value)}
        />
        <button className="catalog-button">Lọc hàng chờ</button>
      </form>
      {queue.status === 'loading' && <LoadingState>Đang tải hàng chờ khiếu nại…</LoadingState>}
      {queue.status === 'error' && <ErrorState error={queue.error} onRetry={loadQueue} />}
      {queue.status === 'success' &&
        (queue.rows.length ? (
          <ul className="catalog-list">
            {queue.rows.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => void selectComplaint(item.id)}>
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
              >
                <h3>Thêm diễn biến</h3>
                <textarea
                  aria-label="Nội dung xử lý"
                  value={processing.content}
                  onChange={(event) =>
                    setProcessing({ ...processing, content: event.target.value })
                  }
                  required
                  disabled={busy}
                />
                <select
                  aria-label="Trạng thái sau xử lý"
                  value={processing.nextStatus}
                  onChange={(event) =>
                    setProcessing({ ...processing, nextStatus: event.target.value })
                  }
                  disabled={busy}
                >
                  {processingStatuses.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <button className="catalog-button" disabled={busy}>
                  Ghi diễn biến
                </button>
              </form>
              <form
                className="catalog-form"
                onSubmit={(event) => void writeComplaint(event, 'status')}
              >
                <h3>Đổi trạng thái</h3>
                <select
                  aria-label="Trạng thái mới"
                  value={statusValue}
                  onChange={(event) => setStatusValue(event.target.value)}
                  disabled={busy}
                >
                  {processingStatuses.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <button className="catalog-button" disabled={busy}>
                  Cập nhật trạng thái
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </section>
  );
}
