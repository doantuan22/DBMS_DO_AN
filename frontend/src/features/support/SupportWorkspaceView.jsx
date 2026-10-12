import { Link } from 'react-router-dom';
import { PageHeader, FilterBar, FormField, Input, Select, Button, AsyncState, StatusBadge, ConfirmDialog } from '../../components/ui';
import ComplaintOrderReference from '../../components/ComplaintOrderReference';
import { formatDateTime } from '../../utils/dateTime';
import { PROCESSING_STATUSES } from './supportDraftStore';
import { supportCasePath } from './supportNavigation';
import './support-workspace.css';
const priorities = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp'];
export default function SupportWorkspaceView({ queue, detail, selectedId, draftFilters, appliedFilters, processing, statusValue, busy, canProcess, canReference, routeCase, notice, processingModified, discardDialogOpen, changeFilter, applyFilters, resetFilters, reloadQueue, openCase, retryDetail, updateProcessing, updateStatusValue, requestWrite, setDiscardDialogOpen, discardProcessingDraft }) {
  const complaint = detail.complaint;
  const options = (values) => values.map((value) => <option key={value}>{value}</option>);
  return <section className="support-workspace" id="support-queue" data-case={routeCase}>
    <PageHeader title="CSKH Portal" description="Hàng chờ, hồ sơ và công cụ xử lý khiếu nại trong một không gian làm việc." breadcrumbs={[{ label: 'CSKH', to: '/support/complaints' }, { label: routeCase ? 'Hồ sơ khiếu nại' : 'Hàng chờ' }]} />
    {notice && <p className={notice.ok ? 'form-success' : 'form-error'} role={notice.ok ? 'status' : 'alert'}>{notice.text}</p>}
    <div className="support-workspace__panes">
      <section className="support-workspace__pane support-workspace__queue" aria-label="Hàng chờ khiếu nại">
        <div className="support-workspace__heading"><h2>Hàng chờ</h2><Button variant="secondary" size="sm" disabled={busy} onClick={reloadQueue} aria-label="Làm mới hàng chờ">Làm mới</Button></div>
        <FilterBar label="Bộ lọc hàng chờ khiếu nại" schema={[{ key: 'status', label: 'Trạng thái' }, { key: 'priority', label: 'Ưu tiên' }, { key: 'type', label: 'Loại' }, { key: 'search', label: 'Tìm kiếm' }]} draft={draftFilters} applied={appliedFilters} pending={busy} applyLabel="Áp dụng bộ lọc" resetLabel="Đặt lại" onApply={(_, event) => applyFilters(event)} onReset={resetFilters}>
          <FormField label="Tìm khiếu nại" hint="Tiêu đề, người gửi hoặc email."><Input type="search" value={draftFilters.search} maxLength={100} disabled={busy} onChange={(e) => changeFilter('search', e.target.value)} /></FormField>
          <FormField label="Lọc trạng thái"><Select value={draftFilters.status} disabled={busy} onChange={(e) => changeFilter('status', e.target.value)}><option value="">Mọi trạng thái</option>{options(['Mới', ...PROCESSING_STATUSES])}</Select></FormField>
          <FormField label="Lọc mức ưu tiên"><Select value={draftFilters.priority} disabled={busy} onChange={(e) => changeFilter('priority', e.target.value)}><option value="">Mọi mức ưu tiên</option>{options(priorities)}</Select></FormField>
          <FormField label="Lọc loại khiếu nại" hint="Nhập tên loại chính xác."><Input value={draftFilters.type} maxLength={100} disabled={busy} onChange={(e) => changeFilter('type', e.target.value)} /></FormField>
        </FilterBar>
        <AsyncState status={queue.status} error={queue.error} onRetry={reloadQueue} loadingMessage="Đang tải hàng chờ khiếu nại…" />
        {queue.status === 'success' && <><p role="status">{queue.rows.length} hồ sơ theo bộ lọc</p>{queue.rows.length ? <ul className="support-workspace__cases">{queue.rows.map((item) => <li key={item.id}><Button variant="quiet" className="support-workspace__case" disabled={busy} aria-pressed={selectedId === item.id} onClick={() => openCase(item.id)}><strong>{item.title}</strong><span>{item.senderName} · {item.type}</span><span>{item.priority} · {formatDateTime(item.createdAt)}</span><StatusBadge status={item.status} /></Button></li>)}</ul> : <AsyncState status="empty" emptyMessage="Không có khiếu nại phù hợp." />}</>}
      </section>
      <section className="support-workspace__pane support-workspace__detail" aria-label="Hồ sơ khiếu nại">
        <Link className="support-workspace__back catalog-back" to={supportCasePath(null, appliedFilters)}>← Về hàng chờ</Link>
        <AsyncState status={detail.status} error={detail.error} onRetry={retryDetail} loadingMessage="Đang tải chi tiết khiếu nại…" />
        {detail.status === 'idle' && <div className="support-workspace__placeholder"><h2>Chọn một hồ sơ</h2><p>Mở khiếu nại từ hàng chờ để xem nội dung và lịch sử xử lý.</p></div>}
        {detail.status === 'success' && <><p className="catalog-eyebrow">HỒ SƠ ĐANG XEM</p><h2>{complaint.title}</h2><StatusBadge status={complaint.status} /><dl className="support-workspace__facts"><div><dt>Người gửi</dt><dd>{complaint.senderName}</dd></div><div><dt>Loại</dt><dd>{complaint.type}</dd></div><div><dt>Ưu tiên</dt><dd>{complaint.priority}</dd></div><div><dt>Ngày gửi</dt><dd>{formatDateTime(complaint.createdAt)}</dd></div></dl><div><h3>Nội dung khiếu nại</h3><p className="support-workspace__content">{complaint.content}</p></div><div><h3>Timeline xử lý</h3>{complaint.processings.length ? <ol className="support-workspace__timeline">{complaint.processings.map((item) => <li key={item.id}><strong>{item.processorName ?? 'Nhân viên'}</strong><span>{formatDateTime(item.processedAt)}</span><StatusBadge status={item.status} /><p className="support-workspace__content">{item.content}</p></li>)}</ol> : <AsyncState status="empty" emptyMessage="Chưa có diễn biến xử lý." />}</div></>}
      </section>
      <aside className="support-workspace__pane support-workspace__actions" aria-label="Tham chiếu và hành động">
        <h2>Tham chiếu & xử lý</h2>
        {detail.status !== 'success' ? <p>Thông tin đơn và công cụ xử lý xuất hiện sau khi hồ sơ được xác nhận.</p> : <><details className="support-workspace__reference" open><summary>Đơn tham chiếu</summary><ComplaintOrderReference key={`${selectedId}:${canReference}`} complaintId={selectedId} allowed={canReference} /></details>
          {canProcess ? <><form className="support-workspace__form" aria-label="Ghi diễn biến xử lý" onSubmit={(e) => requestWrite(e, 'processing')}><h3>Thêm diễn biến</h3><p>Bản nháp được giữ theo từng hồ sơ trong phiên hiện tại.</p><FormField label="Nội dung xử lý" required><textarea className="ui-input" rows={5} value={processing.content} required disabled={busy} onChange={(e) => updateProcessing({ ...processing, content: e.target.value })} /></FormField><FormField label="Trạng thái sau xử lý"><Select value={processing.nextStatus} disabled={busy} onChange={(e) => updateProcessing({ ...processing, nextStatus: e.target.value })}>{options(PROCESSING_STATUSES)}</Select></FormField><div className="support-workspace__heading"><Button type="submit" loading={busy}>Ghi diễn biến</Button>{processingModified && <Button variant="secondary" disabled={busy} onClick={() => setDiscardDialogOpen(true)}>Bỏ bản nháp</Button>}</div></form><form className="support-workspace__form" aria-label="Cập nhật trạng thái khiếu nại" onSubmit={(e) => requestWrite(e, 'status')}><h3>Đổi trạng thái</h3><FormField label="Trạng thái mới"><Select value={statusValue} disabled={busy} onChange={(e) => updateStatusValue(e.target.value)}>{options(PROCESSING_STATUSES)}</Select></FormField><Button type="submit" loading={busy}>Cập nhật trạng thái</Button></form></> : <p>Bạn có quyền xem hồ sơ; cần quyền xử lý để ghi diễn biến hoặc đổi trạng thái.</p>}
        </>}
      </aside>
    </div>
    <ConfirmDialog key={`discard:${discardDialogOpen ? selectedId : 'none'}`} open={discardDialogOpen} onOpenChange={setDiscardDialogOpen} title="Bỏ bản nháp xử lý?" description={`${complaint?.title ?? ''}. Chỉ bỏ nội dung xử lý chưa lưu của hồ sơ này; giữ bản nháp trạng thái riêng.`} confirmLabel="Bỏ bản nháp" cancelLabel="Tiếp tục chỉnh sửa" busy={busy} onConfirm={discardProcessingDraft} />
  </section>;
}
