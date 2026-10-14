import { useEffect, useState } from 'react';
import { getComplaintAssignmentHistory } from '../api/supportApi';
import { formatDateTime } from '../utils/dateTime';
import { AsyncState } from './ui';

export default function CustomerAssignmentHistoryViewer({ complaintId }) {
  const [state, setState] = useState({ status: 'loading', history: [], error: null });

  useEffect(() => {
    let active = true;
    if (!complaintId) {
      setState({ status: 'empty', history: [], error: null });
      return;
    }
    setState({ status: 'loading', history: [], error: null });
    getComplaintAssignmentHistory(complaintId)
      .then((data) => {
        if (active) setState({ status: 'success', history: data.history || [], error: null });
      })
      .catch((error) => {
        if (active) setState({ status: 'error', history: [], error });
      });
    return () => {
      active = false;
    };
  }, [complaintId]);

  if (state.status === 'loading') {
    return <AsyncState status="loading" loadingMessage="Đang tải lịch sử phân công…" />;
  }
  if (state.status === 'error') {
    return <AsyncState status="error" error={state.error} />;
  }
  if (!state.history || state.history.length === 0) {
    return <p className="catalog-muted" style={{ fontSize: '0.875rem' }}>Chưa có lịch sử phân công.</p>;
  }

  return (
    <ol className="support-workspace__timeline" style={{ fontSize: '0.875rem' }}>
      {state.history.map((item, idx) => (
        <li key={item.id ?? idx}>
          <div>
            <strong>{item.previousStaffName ? `${item.previousStaffName} → ` : ''}{item.newStaffName || 'Thu hồi phân công'}</strong>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Bởi {item.actorName} · {formatDateTime(item.changedAt)}
            </span>
          </div>
          {item.reason && <p className="support-workspace__content" style={{ margin: '0.25rem 0' }}>{item.reason}</p>}
        </li>
      ))}
    </ol>
  );
}
