import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// UX guard only. Authorization is enforced by the backend and the database.
export default function RequireRole({ role }) {
  const { user } = useAuth();
  if (!user || user.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}
