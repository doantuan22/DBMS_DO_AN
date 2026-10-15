import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userCanEnterArea } from '../utils/authorization';
import SessionRecovery from './SessionRecovery';

// UX guard only. Authorization is enforced by the backend and the database.
export default function RequireRole({ role, permission }) {
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
  if (!userCanEnterArea(user, role, permission)) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
