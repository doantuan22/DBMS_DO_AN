import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userCanAct } from '../utils/authorization';
import ManagerPortal from '../pages/ManagerPortal';
import Forbidden from '../pages/Forbidden';
import NotFound from '../pages/NotFound';
import { MANAGER_SECTION_ROUTES, managerEntryPath } from './managerSectionRoutes';
import FacilityScreen from '../features/facilities/FacilityScreen';

export function ManagerEntryRoute() {
  const { hash, search } = useLocation();
  return <Navigate to={`${managerEntryPath(hash)}${search}`} replace />;
}

export default function ManagerSectionRoute({ section }) {
  const { user } = useAuth();
  const route = MANAGER_SECTION_ROUTES[section];
  if (!route || section === 'bookings') return <NotFound />;
  if (!userCanAct(user, 'QUAN_LY_RAP', route.permission)) return <Forbidden />;
  if (section === 'rooms' || section === 'seats') return <FacilityScreen kind={section} manager />;
  return <ManagerPortal routeSection={section} />;
}
