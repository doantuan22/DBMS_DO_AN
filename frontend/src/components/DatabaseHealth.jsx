import { useEffect, useState } from 'react';
import { getDatabaseHealth } from '../api/healthApi';

export default function DatabaseHealth() {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    getDatabaseHealth({ signal: controller.signal })
      .then((result) => setState({ status: result.ok ? 'healthy' : 'unavailable', result }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ status: 'unavailable', error });
      });
    return () => controller.abort();
  }, []);

  if (state.status === 'loading') {
    return (
      <section className="health-card" aria-live="polite">
        Đang kiểm tra kết nối cơ sở dữ liệu…
      </section>
    );
  }

  const healthy = state.status === 'healthy';
  return (
    <section
      className={`health-card health-card--${healthy ? 'healthy' : 'unavailable'}`}
      aria-live="polite"
    >
      <h2>Trạng thái hệ thống</h2>
      <p>
        <strong>API:</strong> đang hoạt động
      </p>
      <p>
        <strong>SQL Server:</strong> {healthy ? 'sẵn sàng' : 'chưa kết nối được'}
      </p>
      {healthy && (
        <p>
          <strong>Cơ sở dữ liệu:</strong> {state.result.database}
        </p>
      )}
      {!healthy && <p>Kiểm tra lại cấu hình kết nối hoặc thử tải lại sau.</p>}
    </section>
  );
}
