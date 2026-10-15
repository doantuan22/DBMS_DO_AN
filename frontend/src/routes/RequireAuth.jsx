import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SessionRecovery from './SessionRecovery';

export default function RequireAuth() {
  const { user, initializing, authIssue } = useAuth();
  const location = useLocation();
  if (initializing)
    return (
      <main className="system-state" aria-live="polite">
        Đang khôi phục phiên đăng nhập…
      </main>
    );
  if (!user && authIssue?.kind === 'unavailable') return <SessionRecovery />;
  if (!user)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, sessionExpired: authIssue?.kind === 'expired' }}
      />
    );
  return <Outlet />;
}
