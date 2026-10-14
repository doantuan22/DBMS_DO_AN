import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { Button, FormField, Select } from '../../components/ui';

export default function AdminComplaintAssignment({ complaintId, currentStaffId, onAssigned }) {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;
    adminApi
      .users({ status: 'Hoạt động' })
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

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!complaintId || submitting || !selectedStaffId) return;
    setSubmitting(true);
    setNotice(null);
    try {
      await adminApi.assignComplaint(complaintId, {
        staffId: Number(selectedStaffId),
        reason: reason.trim() || undefined,
      });
      setNotice({ ok: true, text: 'Đã phân công nhân viên CSKH thành công.' });
      setReason('');
      if (onAssigned) onAssigned();
    } catch (err) {
      setNotice({ ok: false, text: err.message || 'Không thể phân công nhân viên.' });
    } finally {
      setSubmitting(false);
    }
  };

  const assignedStaff = currentStaffId
    ? staffList.find((s) => (s.NguoiDungID ?? s.id) === currentStaffId)
    : null;

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
      <h4 style={{ margin: '0 0 0.5rem' }}>Nhân viên CSKH phụ trách</h4>

      {notice && (
        <p className={notice.ok ? 'form-success' : 'form-error'} role={notice.ok ? 'status' : 'alert'}>
          {notice.text}
        </p>
      )}

      {currentStaffId ? (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div
            style={{
              padding: '0.75rem',
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              borderRadius: 'var(--radius-sm)',
              color: '#0369a1',
            }}
          >
            <strong>Đã phân công cho nhân viên:</strong>{' '}
            {assignedStaff ? `${assignedStaff.HoTen ?? assignedStaff.name} (${assignedStaff.Email ?? assignedStaff.email})` : `Nhân viên #${currentStaffId}`}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Quy tắc nghiệp vụ: Mỗi khiếu nại chỉ được phân công một lần duy nhất. Nhân viên được giao chịu trách nhiệm xử lý từ đầu đến cuối và không thể thay đổi hoặc thu hồi.
          </p>
        </div>
      ) : (
        <form onSubmit={handleAssign} style={{ display: 'grid', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Khiếu nại chưa có người tiếp nhận. Quản trị viên có thể phân công nhân viên CSKH phụ trách lần đầu.
          </p>
          <FormField label="Chọn nhân viên CSKH phụ trách">
            <Select
              value={selectedStaffId}
              disabled={loading || submitting}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              required
            >
              <option value="">-- Chọn nhân viên CSKH phụ trách --</option>
              {staffList.map((staff) => (
                <option key={staff.NguoiDungID ?? staff.id} value={staff.NguoiDungID ?? staff.id}>
                  {staff.HoTen ?? staff.name} ({staff.Email ?? staff.email})
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Lý do phân công (tùy chọn)">
            <input
              type="text"
              className="ui-input"
              placeholder="Ghi chú phân công…"
              value={reason}
              disabled={submitting}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
          <div>
            <Button type="submit" loading={submitting} disabled={submitting || !selectedStaffId}>
              Xác nhận phân công
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
