import { useEffect, useState } from 'react';
import { createSupportEscalation, getSupportEscalations } from '../../api/supportApi';
import { formatDateTime } from '../../utils/dateTime';
import { Button, FormField, Select } from '../../components/ui';
import StatusBadge from '../../components/primitives/StatusBadge';

const priorities = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp'];

export default function SupportEscalationManager({ complaintId, onEscalated }) {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('Trung bình');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadEscalations = async () => {
    if (!complaintId) return;
    try {
      const res = await getSupportEscalations({ complaintId });
      setEscalations(res.escalations || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void loadEscalations();
  }, [complaintId]);

  const activeEscalation = escalations.find(
    (e) => e.status === 'Chờ tiếp nhận' || e.status === 'Đang xử lý',
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createSupportEscalation(complaintId, { reason: reason.trim(), priority });
      setReason('');
      setOpenForm(false);
      setSuccess('Đã gửi yêu cầu chuyển cấp lên Admin thành công.');
      await loadEscalations();
      if (onEscalated) onEscalated();
    } catch (err) {
      setError(err.message || 'Không thể gửi yêu cầu chuyển cấp.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="support-escalation-manager" style={{ display: 'grid', gap: '0.75rem' }}>
      {success && (
        <p className="form-success" role="status" style={{ fontSize: '0.935rem' }}>
          {success}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert" style={{ fontSize: '0.935rem' }}>
          {error}
        </p>
      )}

      {activeEscalation ? (
        <div
          style={{
            padding: '0.75rem',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md, 0.375rem)',
            fontSize: '0.9625rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Yêu cầu chuyển cấp</strong>
            <StatusBadge status={activeEscalation.status} />
          </div>
          <p style={{ margin: '0.5rem 0 0.25rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Lý do: </span>
            {activeEscalation.reason}
          </p>
          <p style={{ margin: '0.25rem 0', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
            Ưu tiên: <strong>{activeEscalation.priority}</strong> · Gửi: {formatDateTime(activeEscalation.createdAt)}
          </p>
          {activeEscalation.adminName && (
            <p style={{ margin: '0.25rem 0', fontSize: '0.88rem' }}>
              Admin phụ trách: <strong>{activeEscalation.adminName}</strong>
            </p>
          )}
        </div>
      ) : (
        <>
          {!openForm ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOpenForm(true)}
              style={{ width: '100%' }}
            >
              🚀 Chuyển cấp lên Admin
            </Button>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'grid',
                gap: '0.5rem',
                padding: '0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <strong>Chuyển cấp khiếu nại lên Admin</strong>
              <FormField label="Lý do chuyển cấp" required>
                <textarea
                  className="ui-input"
                  rows={3}
                  required
                  placeholder="Mô tả vấn đề vượt thẩm quyền (tài chính, lỗi vé, bồi thường lớn)..."
                  value={reason}
                  disabled={submitting}
                  onChange={(e) => setReason(e.target.value)}
                />
              </FormField>
              <FormField label="Mức độ ưu tiên">
                <Select
                  value={priority}
                  disabled={submitting}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </FormField>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={submitting}
                  onClick={() => setOpenForm(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" size="sm" loading={submitting} disabled={!reason.trim()}>
                  Xác nhận gửi
                </Button>
              </div>
            </form>
          )}
        </>
      )}

      {/* Finished escalations if any */}
      {escalations.filter((e) => e.status === 'Đã giải quyết' || e.status === 'Từ chối').length > 0 && (
        <details style={{ fontSize: '0.935rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
            Lịch sử phản hồi từ Admin ({escalations.filter((e) => e.status === 'Đã giải quyết' || e.status === 'Từ chối').length})
          </summary>
          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
            {escalations
              .filter((e) => e.status === 'Đã giải quyết' || e.status === 'Từ chối')
              .map((esc) => (
                <div
                  key={esc.id}
                  style={{
                    padding: '0.5rem',
                    background: 'var(--color-surface-hover, #f8fafc)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: `3px solid ${esc.status === 'Đã giải quyết' ? '#16a34a' : '#dc2626'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <StatusBadge status={esc.status} />
                    <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                      {formatDateTime(esc.resolvedAt)}
                    </span>
                  </div>
                  <p style={{ margin: '0.25rem 0', fontWeight: 500 }}>
                    Kết luận: {esc.resolution || 'Không có ghi chú'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    Bởi Admin: {esc.adminName || 'Admin'}
                  </p>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  );
}
