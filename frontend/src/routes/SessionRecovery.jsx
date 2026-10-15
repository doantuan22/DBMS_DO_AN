import { useAuth } from '../context/AuthContext';

export default function SessionRecovery() {
  const { initializing, refreshCurrentUser } = useAuth();
  return (
    <main className="system-state" aria-labelledby="session-recovery-heading">
      <h1 id="session-recovery-heading">Không thể xác minh tài khoản</h1>
      <p>Không tải được quyền truy cập hiện tại. Hãy thử tải lại thông tin tài khoản.</p>
      <button
        type="button"
        className="catalog-button"
        disabled={initializing}
        onClick={() => refreshCurrentUser().catch(() => {})}
      >
        {initializing ? 'Đang thử lại…' : 'Thử lại'}
      </button>
    </main>
  );
}
