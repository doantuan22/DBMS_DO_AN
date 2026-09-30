import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth() {
  const { user, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return <main className="system-state" aria-live="polite">Đang khôi phục phiên đăng nhập…</main>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
