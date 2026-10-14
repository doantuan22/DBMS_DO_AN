import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { formatDateTime } from '../../utils/dateTime';
import { Button, FormField, Select } from '../../components/ui';

export default function AdminComplaintAssignment({ complaintId, currentStaffId, onAssigned }) {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(currentStaffId ? String(currentStaffId) : '');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;
    adminApi
      .users({ role: 'CSKH' })
      .then((res) => {
        if (!active) return;
        const users = res.users || [];
        const cskh = users.filter((u) => u.MaVaiTro === 'CSKH' || u.TenVaiTro === 'CSKH');
        setStaffList(cskh.length > 0 ? cskh : users);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const loadHistory = async () => {
    if (!complaintId) return;
    try {
      const res = await adminApi.complaintAssignmentHistory(complaintId);
      setHistory(res.history || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setSelectedStaffId(currentStaffId ? String(currentStaffId) : '');
    void loadHistory();
  }, [complaintId, currentStaffId]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!complaintId || submitting) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const staffIdVal = selectedStaffId ? Number(selectedStaffId) : null;
      await adminApi.assignComplaint(complaintId, {
        staffId: staffIdVal,
        reason: reason.trim() || undefined,
      });
      setNotice({ ok: true, text: 'Đã cập nhật phân công nhân viên CSKH thành công.' });
      setReason('');
      await loadHistory();
      if (onAssigned) onAssigned();
    } catch (err) {
      setNotice({ ok: false, text: err.message || 'Không thể phân công nhân viên.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        margin: '1rem 0',
        background: '#f8fafc',
      }}
    >
      <h4 style={{ margin: '0 0 0.5rem' }}>Phân công / Chuyển giao nhân viên CSKH</h4>
      {notice && (
        <p className={notice.ok ? 'form-success' : 'form-error'} role={notice.ok ? 'status' : 'alert'}>
          {notice.text}
        </p>
      )}
      <form onSubmit={handleAssign} style={{ display: 'grid', gap: '0.75rem' }}>
        <FormField label="Chọn nhân viên CSKH phụ trách">
          <Select
            value={selectedStaffId}
            disabled={loading || submitting}
            onChange={(e) => setSelectedStaffId(e.target.value)}
          >
            <option value="">-- Chưa phân công (Để trống) --</option>
            {staffList.map((staff) => (
              <option key={staff.NguoiDungID ?? staff.id} value={staff.NguoiDungID ?? staff.id}>
                {staff.HoTen ?? staff.name} ({staff.Email ?? staff.email})
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Lý do phân công / chuyển giao (tùy chọn)">
          <input
            type="text"
            className="ui-input"
            placeholder="Lý do điều phối hoặc chuyển nhân viên…"
            value={reason}
            disabled={submitting}
            onChange={(e) => setReason(e.target.value)}
          />
        </FormField>
        <div>
          <Button type="submit" loading={submitting} disabled={submitting}>
            Lưu phân công
          </Button>
        </div>
      </form>

      {history.length > 0 && (
        <details style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
            Lịch sử phân công của khiếu nại này ({history.length})
          </summary>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
            {history.map((h, idx) => (
              <li key={h.id ?? idx} style={{ marginBottom: '0.25rem' }}>
                <strong>
                  {h.previousStaffName ? `${h.previousStaffName} → ` : ''}
                  {h.newStaffName || 'Thu hồi'}
                </strong>{' '}
                · {h.actorName} ({formatDateTime(h.changedAt)})
                {h.reason ? ` — "${h.reason}"` : ''}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
