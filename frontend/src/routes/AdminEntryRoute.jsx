import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NoWorkspaceAccess from '../components/NoWorkspaceAccess';
import { adminEntryPath } from './adminSectionRoutes';

export default function AdminEntryRoute() {
  const { user } = useAuth();
  const path = adminEntryPath(user);
  return path ? <Navigate to={path} replace /> : <NoWorkspaceAccess />;
}
