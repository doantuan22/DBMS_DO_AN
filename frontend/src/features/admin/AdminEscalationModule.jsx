import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { formatDateTime } from '../../utils/dateTime';
import { Button, FormField, Select, AsyncState } from '../../components/ui';
import StatusBadge from '../../components/primitives/StatusBadge';
import '../support/support-chat.css';

const statuses = ['Chờ tiếp nhận', 'Đang xử lý', 'Đã giải quyết', 'Từ chối'];
const priorities = ['Khẩn cấp', 'Cao', 'Trung bình', 'Thấp'];

export default function AdminEscalationModule({ currentUser }) {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const mounted = useRef(true);

  const loadList = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await adminApi.escalations(params);
      if (mounted.current && res.escalations) {
        setEscalations(res.escalations);
      }
    } catch (err) {
      if (mounted.current) setError(err);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    void loadList();
    // Poll every 5s for real-time awareness of incoming CSKH escalations
    const timer = setInterval(() => {
      void loadList();
    }, 5000);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [loadList]);

  const loadDetail = async (id) => {
    setSelectedId(id);
    setDetailLoading(true);
    setNotice(null);
    try {
      const res = await adminApi.escalation(id);
      if (mounted.current) {
        setDetail(res);
        setResolutionText(res.escalation?.resolution || '');
      }
    } catch (err) {
      if (mounted.current) setNotice({ ok: false, text: err.message });
    } finally {
      if (mounted.current) setDetailLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!selectedId || submitting) return;
    setSubmitting(true);
    setNotice(null);
    try {
      await adminApi.claimEscalation(selectedId);
      await loadList();
      await loadDetail(selectedId);
      setNotice({ ok: true, text: 'Đã tiếp nhận yêu cầu chuyển cấp thành công.' });
    } catch (err) {
      setNotice({ ok: false, text: err.message || 'Không thể tiếp nhận yêu cầu.' });
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  };

  const handleProcess = async (nextStatus) => {
    if (!selectedId || !resolutionText.trim() || submitting) return;
    setSubmitting(true);
    setNotice(null);
    try {
      await adminApi.processEscalation(selectedId, {
        conclusion: resolutionText.trim(),
        resolution: resolutionText.trim(),
        status: nextStatus,
      });
      await loadList();
      await loadDetail(selectedId);
      setNotice({
        ok: true,
        text: `Đã cập nhật kết luận xử lý (${nextStatus}).`,
      });
    } catch (err) {
      setNotice({ ok: false, text: err.message || 'Không thể cập nhật kết quả.' });
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  };

  const pendingCount = escalations.filter((e) => e.status === 'Chờ tiếp nhận').length;

  return (
    <div className="admin-escalations" style={{ display: 'grid', gap: '1rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Yêu cầu hỗ trợ từ CSKH</h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Hàng đợi tiếp nhận và xử lý các vấn đề chuyển cấp vượt thẩm quyền của nhân viên CSKH.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span
            style={{
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              background: pendingCount > 0 ? '#fef3c7' : '#f1f5f9',
              color: pendingCount > 0 ? '#92400e' : '#475569',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            {pendingCount} yêu cầu chờ tiếp nhận
          </span>
          <Button variant="secondary" size="sm" onClick={loadList}>
            Làm mới
          </Button>
        </div>
      </div>

      {notice && (
        <p className={notice.ok ? 'form-success' : 'form-error'} role={notice.ok ? 'status' : 'alert'}>
          {notice.text}
        </p>
      )}

      {/* Filter toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          background: 'var(--color-surface, #fff)',
          padding: '0.75rem',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <FormField label="Lọc trạng thái">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Lọc mức ưu tiên">
          <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">Tất cả mức ưu tiên</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {/* Main split view */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedId ? 'minmax(20rem, 1fr) minmax(24rem, 1.3fr)' : '1fr',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* Escalations List */}
        <div
          style={{
            background: 'var(--color-surface, #fff)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            maxHeight: '40rem',
            overflowY: 'auto',
          }}
        >
          {loading && escalations.length === 0 ? (
            <AsyncState status="loading" loadingMessage="Đang tải danh sách yêu cầu…" />
          ) : escalations.length === 0 ? (
            <p className="catalog-muted">Không có yêu cầu chuyển cấp nào phù hợp.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
              {escalations.map((item) => (
                <li key={item.id}>
                  <Button
                    variant="quiet"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'grid',
                      gap: '0.375rem',
                      padding: '0.75rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      background: selectedId === item.id ? 'var(--color-primary-subtle, #eff6ff)' : 'transparent',
                      borderColor: selectedId === item.id ? 'var(--color-primary)' : 'var(--color-border)',
                    }}
                    onClick={() => loadDetail(item.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>Yêu cầu #{item.id}</strong>
                      <StatusBadge status={item.status} />
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span>Khiếu nại: #{item.complaintId} · {item.complaintTitle}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      <span>Lý do: {item.reason}</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <span>Ưu tiên: <strong>{item.priority}</strong></span>
                      <span>Từ: {item.requesterName}</span>
                      <span>{formatDateTime(item.createdAt)}</span>
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Escalation Detail Panel */}
        {selectedId && (
          <div
            style={{
              background: 'var(--color-surface, #fff)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              display: 'grid',
              gap: '1rem',
              maxHeight: '40rem',
              overflowY: 'auto',
            }}
          >
            {detailLoading ? (
              <AsyncState status="loading" loadingMessage="Đang tải chi tiết yêu cầu…" />
            ) : !detail ? (
              <p className="catalog-muted">Chọn một yêu cầu để xem chi tiết.</p>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>Chi tiết yêu cầu #{detail.escalation.id}</h3>
                  <Button variant="secondary" size="sm" onClick={() => setSelectedId(null)}>
                    Đóng
                  </Button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    padding: '0.75rem',
                    background: 'var(--color-surface-hover, #f8fafc)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <StatusBadge status={detail.escalation.status} />
                  <span>Ưu tiên: <strong>{detail.escalation.priority}</strong></span>
                  <span>Người gửi: <strong>{detail.escalation.requesterName}</strong></span>
                  <span>Gửi lúc: {formatDateTime(detail.escalation.createdAt)}</span>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.25rem' }}>Lý do chuyển cấp</h4>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{detail.escalation.reason}</p>
                </div>

                {/* Complaint Info */}
                {detail.complaint && (
                  <div
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      background: '#fafafa',
                    }}
                  >
                    <h4 style={{ margin: '0 0 0.5rem' }}>Hồ sơ khiếu nại gốc #{detail.complaint.id}</h4>
                    <p style={{ margin: '0.25rem 0', fontWeight: 600 }}>{detail.complaint.title}</p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>{detail.complaint.content}</p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Khách hàng: {detail.complaint.senderName} · Loại: {detail.complaint.type} · Trạng thái: {detail.complaint.status}
                    </p>
                  </div>
                )}

                {/* Exchange / Notes Log */}
                {detail.messages && detail.messages.length > 0 && (
                  <details>
                    <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                      Tin nhắn & Ghi chú liên quan ({detail.messages.length})
                    </summary>
                    <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {detail.messages.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: m.isInternal ? '#fffbeb' : '#f1f5f9',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <strong>{m.senderName} {m.isInternal ? '(Nội bộ)' : ''}</strong>
                            <span>{formatDateTime(m.createdAt)}</span>
                          </div>
                          <p style={{ margin: '0.25rem 0 0' }}>{m.content}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Admin Actions */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem' }}>Xử lý yêu cầu</h4>

                  {detail.escalation.status === 'Chờ tiếp nhận' && (
                    <div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Yêu cầu đang chờ quản trị viên tiếp nhận để bắt đầu xử lý.
                      </p>
                      <Button
                        variant="primary"
                        onClick={handleClaim}
                        disabled={submitting}
                        loading={submitting}
                      >
                        Tiếp nhận yêu cầu này
                      </Button>
                    </div>
                  )}

                  {detail.escalation.status === 'Đang xử lý' && (
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <p style={{ fontSize: '0.85rem', margin: 0 }}>
                        Admin đang tiếp nhận: <strong>{detail.escalation.adminName || 'Tôi'}</strong>
                      </p>
                      <FormField label="Kết luận xử lý / Chỉ đạo cho CSKH" required>
                        <textarea
                          className="ui-input"
                          rows={4}
                          placeholder="Nhập quyết định xử lý, phương án bồi hoàn điểm, hoặc chỉ đạo nghiệp vụ..."
                          value={resolutionText}
                          disabled={submitting}
                          onChange={(e) => setResolutionText(e.target.value)}
                        />
                      </FormField>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          variant="primary"
                          disabled={submitting || !resolutionText.trim()}
                          loading={submitting}
                          onClick={() => handleProcess('Đã giải quyết')}
                        >
                          ✓ Đã giải quyết
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={submitting || !resolutionText.trim()}
                          loading={submitting}
                          onClick={() => handleProcess('Từ chối')}
                        >
                          ✕ Từ chối yêu cầu
                        </Button>
                      </div>
                    </div>
                  )}

                  {(detail.escalation.status === 'Đã giải quyết' || detail.escalation.status === 'Từ chối') && (
                    <div
                      style={{
                        padding: '0.75rem',
                        background: '#f8fafc',
                        borderLeft: `4px solid ${detail.escalation.status === 'Đã giải quyết' ? '#16a34a' : '#dc2626'}`,
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: 600 }}>
                        Kết luận xử lý ({detail.escalation.status}):
                      </p>
                      <p style={{ margin: '0.25rem 0' }}>{detail.escalation.resolution}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Admin: {detail.escalation.adminName} · Hoàn tất lúc: {formatDateTime(detail.escalation.resolvedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
