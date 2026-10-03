import { formatDateTime as formatTime } from '../utils/dateTime';
import { useCallback, useEffect, useState } from 'react';
import * as api from '../api/supportApi';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';

const complaintStatuses = ['Mới', 'Đang xử lý', 'Đã giải quyết', 'Đã đóng', 'Từ chối'];
const processingStatuses = ['Đang xử lý', 'Đã giải quyết', 'Đã đóng', 'Từ chối'];


export default function SupportPortal() {
  const [filters, setFilters] = useState({ status: '', type: '', search: '' });
  const [queue, setQueue] = useState({ status: 'loading', rows: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState({ status: 'idle' });
  const [orderReference, setOrderReference] = useState({ status: 'idle' });
  const [processing, setProcessing] = useState({ content: '', nextStatus: 'Đang xử lý' });
  const [statusValue, setStatusValue] = useState('Đang xử lý');
  const [notice, setNotice] = useState(null);

  const loadQueue = useCallback(async () => {
    setQueue({ status: 'loading', rows: [] });
    try { const result = await api.getSupportComplaints(filters); setQueue({ status: 'success', rows: result.complaints }); }
    catch (error) { setQueue({ status: 'error', error, rows: [] }); }
  }, [filters]);
  const selectComplaint = useCallback(async (complaintId) => {
    setSelectedId(complaintId); setDetail({ status: 'loading' }); setOrderReference({ status: 'loading' }); setNotice(null);
    try {
      const [complaint, reference] = await Promise.all([api.getSupportComplaint(complaintId), api.getComplaintOrderReference(complaintId)]);
      setDetail({ status: 'success', complaint: complaint.complaint }); setOrderReference({ status: 'success', ...reference });
      setStatusValue(processingStatuses.includes(complaint.complaint.status) ? complaint.complaint.status : 'Đang xử lý');
    } catch (error) { setDetail({ status: 'error', error }); setOrderReference({ status: 'idle' }); }
  }, []);
  useEffect(() => { void Promise.resolve().then(loadQueue); }, [loadQueue]);
  const afterWrite = async (message) => { setNotice({ ok: true, text: message }); await loadQueue(); if (selectedId) await selectComplaint(selectedId); };
  const submitProcessing = async (event) => { event.preventDefault(); try { await api.addComplaintProcessing(selectedId, processing); setProcessing((value) => ({ ...value, content: '' })); await afterWrite('Đã thêm diễn biến xử lý.'); } catch (error) { setNotice({ ok: false, text: error.message }); } };
  const submitStatus = async (event) => { event.preventDefault(); try { await api.updateComplaintStatus(selectedId, { status: statusValue }); await afterWrite('Đã cập nhật trạng thái và ghi vào lịch sử.'); } catch (error) { setNotice({ ok: false, text: error.message }); } };

  return <section className="catalog-page"><p className="catalog-eyebrow">CHĂM SÓC KHÁCH HÀNG</p><h1>CSKH Portal</h1>
    <form className="catalog-form" onSubmit={(event) => { event.preventDefault(); void loadQueue(); }}>
      <select aria-label="Lọc trạng thái" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Mọi trạng thái</option>{complaintStatuses.map((value) => <option key={value}>{value}</option>)}</select>
      <input aria-label="Lọc loại khiếu nại" placeholder="Loại khiếu nại" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })} />
      <input aria-label="Tìm khiếu nại" placeholder="Tìm tiêu đề, nội dung, người gửi" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
      <button className="catalog-button">Lọc hàng chờ</button>
    </form>
    {queue.status === 'loading' && <LoadingState>Đang tải hàng chờ khiếu nại…</LoadingState>}{queue.status === 'error' && <ErrorState error={queue.error} onRetry={loadQueue} />}
    {queue.status === 'success' && (queue.rows.length ? <ul className="catalog-list">{queue.rows.map((item) => <li key={item.id}><button type="button" onClick={() => void selectComplaint(item.id)}><strong>#{item.id} · {item.title}</strong><br />{item.senderName} · {item.type} · ưu tiên {item.priority} · {item.status}</button></li>)}</ul> : <EmptyState>Không có khiếu nại phù hợp.</EmptyState>)}
    {notice && <p role={notice.ok ? 'status' : 'alert'}>{notice.text}</p>}
    {detail.status === 'loading' && <LoadingState>Đang tải chi tiết khiếu nại…</LoadingState>}{detail.status === 'error' && <ErrorState error={detail.error} onRetry={() => void selectComplaint(selectedId)} />}
    {detail.status === 'success' && <section className="catalog-section"><h2>#{detail.complaint.id} · {detail.complaint.title}</h2><p>{detail.complaint.senderName} · {detail.complaint.type} · {detail.complaint.status}</p><p>{detail.complaint.content}</p>
      <h3>Đơn hàng liên kết</h3>{orderReference.status === 'loading' ? <LoadingState>Đang tải tham chiếu đơn…</LoadingState> : orderReference.message ? <p>{orderReference.message}</p> : orderReference.order ? <p>Mã đơn #{orderReference.order.DonDatVeID ?? orderReference.order.id} · {orderReference.order.TrangThai ?? orderReference.order.status ?? 'Có tham chiếu'}</p> : <p>Không có đơn hàng liên kết.</p>}
      <h3>Timeline xử lý</h3>{detail.complaint.processings.length ? <ol>{detail.complaint.processings.map((item) => <li key={item.id}><strong>{item.processorName ?? `Nhân viên #${item.processorId}`}</strong> · {formatTime(item.processedAt)} · {item.status}<br />{item.content}</li>)}</ol> : <EmptyState>Chưa có diễn biến xử lý.</EmptyState>}
      <form className="catalog-form" onSubmit={submitProcessing}><h3>Thêm diễn biến</h3><textarea aria-label="Nội dung xử lý" value={processing.content} onChange={(event) => setProcessing({ ...processing, content: event.target.value })} required /><select aria-label="Trạng thái sau xử lý" value={processing.nextStatus} onChange={(event) => setProcessing({ ...processing, nextStatus: event.target.value })}>{processingStatuses.map((value) => <option key={value}>{value}</option>)}</select><button className="catalog-button">Ghi diễn biến</button></form>
      <form className="catalog-form" onSubmit={submitStatus}><h3>Đổi trạng thái</h3><select aria-label="Trạng thái mới" value={statusValue} onChange={(event) => setStatusValue(event.target.value)}>{processingStatuses.map((value) => <option key={value}>{value}</option>)}</select><button className="catalog-button">Cập nhật trạng thái</button></form>
    </section>}
  </section>;
}
