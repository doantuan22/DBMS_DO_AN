import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminWorkspaceProvider } from '../features/admin-workspace/AdminWorkspaceContext.jsx';

export default function AdminLayout() {
  const { user } = useAuth();
  const actor = `${user?.userId}:${user?.role}:${user?.permissions
    ?.map((p) => p.code)
    .sort()
    .join(',')}`;
  return (
    <AdminWorkspaceProvider key={actor}>
      <Outlet />
    </AdminWorkspaceProvider>
  );
}
