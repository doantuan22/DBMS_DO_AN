import { useEffect, useState } from 'react';
import { getSupportCustomerPoints } from '../api/supportApi';
import { formatDateTime } from '../utils/dateTime';
import { AsyncState } from './ui';

export default function CustomerPointsViewer({ customerId }) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let active = true;
    if (!customerId) {
      setState({ status: 'empty', data: null, error: null });
      return;
    }
    setState({ status: 'loading', data: null, error: null });
    getSupportCustomerPoints(customerId)
      .then((data) => {
        if (active) setState({ status: 'success', data, error: null });
      })
      .catch((error) => {
        if (active) setState({ status: 'error', data: null, error });
      });
    return () => {
      active = false;
    };
  }, [customerId]);

  if (state.status === 'loading') {
    return <AsyncState status="loading" loadingMessage="Đang tra cứu điểm thưởng…" />;
  }
  if (state.status === 'error') {
    return <AsyncState status="error" error={state.error} />;
  }
  if (!state.data) {
    return <p className="catalog-muted">Không có thông tin điểm thưởng.</p>;
  }

  const { currentPoints, totalAccumulated, totalUsed, totalCompensated, history } = state.data;

  return (
    <div className="support-points-viewer" style={{ display: 'grid', gap: '0.75rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.5rem',
          background: 'var(--color-surface-hover, #f8fafc)',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md, 0.375rem)',
          fontSize: '0.9625rem',
        }}
      >
        <div>
          <span style={{ color: 'var(--color-text-muted)' }}>Điểm hiện tại: </span>
          <strong>{Number(currentPoints || 0).toLocaleString('vi-VN')}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-muted)' }}>Tổng tích lũy: </span>
          <strong>{Number(totalAccumulated || 0).toLocaleString('vi-VN')}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-muted)' }}>Tổng đã dùng: </span>
          <strong>{Number(totalUsed || 0).toLocaleString('vi-VN')}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-muted)' }}>Điểm bồi thường: </span>
          <strong style={{ color: totalCompensated > 0 ? '#16a34a' : 'inherit' }}>
            {Number(totalCompensated || 0).toLocaleString('vi-VN')}
          </strong>
        </div>
      </div>

      {history && history.length > 0 ? (
        <details>
          <summary style={{ cursor: 'pointer', fontSize: '0.9625rem', fontWeight: 600 }}>
            Lịch sử biến động điểm ({history.length})
          </summary>
          <div style={{ maxHeight: '12rem', overflowY: 'auto', marginTop: '0.5rem' }}>
            <table style={{ width: '100%', fontSize: '0.88rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.25rem' }}>Thời gian</th>
                  <th style={{ padding: '0.25rem' }}>Loại</th>
                  <th style={{ padding: '0.25rem', textAlign: 'right' }}>Số điểm</th>
                  <th style={{ padding: '0.25rem', textAlign: 'right' }}>Số dư</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={item.id ?? idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.25rem' }}>{formatDateTime(item.createdAt)}</td>
                    <td style={{ padding: '0.25rem' }}>{item.type}</td>
                    <td
                      style={{
                        padding: '0.25rem',
                        textAlign: 'right',
                        color: item.points > 0 ? '#16a34a' : '#dc2626',
                        fontWeight: 600,
                      }}
                    >
                      {item.points > 0 ? `+${item.points}` : item.points}
                    </td>
                    <td style={{ padding: '0.25rem', textAlign: 'right' }}>{item.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : (
        <p className="catalog-muted" style={{ fontSize: '0.935rem' }}>
          Chưa có lịch sử biến động điểm.
        </p>
      )}
    </div>
  );
}
