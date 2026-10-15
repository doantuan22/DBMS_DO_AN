import { useAuth } from '../context/AuthContext';
import Forbidden from '../pages/Forbidden';
import NotFound from '../pages/NotFound';
import AdminPortal from '../pages/AdminPortal';
import { ADMIN_SECTION_PERMISSIONS, userCanAct } from '../utils/authorization';
import { ADMIN_SECTION_ROUTES } from './adminSectionRoutes';
import AdminRooms from '../features/admin-rooms/AdminRooms';
import AdminSeatContextRoute from './AdminSeatContextRoute';
import FacilityScreen from '../features/facilities/FacilityScreen';
import CinemaImageManager from '../components/CinemaImageManager';
import OperationsScreen from '../features/operations/OperationsScreen';
import AdminResourceScreen from '../features/admin-resources/AdminResourceScreen';
import AdminComplaints from '../features/admin-service/AdminComplaints';
import AdminAnalytics from '../features/admin-analytics/AdminAnalytics';

export default function AdminSectionRoute({ section }) {
  if (!ADMIN_SECTION_ROUTES[section] || section === 'bookings') return <NotFound />;
  return <AuthorizedAdminSection section={section} />;
}

function AuthorizedAdminSection({ section }) {
  const { user } = useAuth();
  if (!userCanAct(user, 'ADMIN', ADMIN_SECTION_PERMISSIONS[section])) return <Forbidden />;
  if (
    ['users', 'assignments', 'movies', 'actors', 'genres', 'products', 'promotions'].includes(
      section,
    )
  )
    return <AdminResourceScreen kind={section} />;
  if (section === 'complaints') return <AdminComplaints />;
  if (section === 'revenue') return <AdminAnalytics kind="revenue" />;
  if (section === 'rooms') return <AdminRooms />;
  if (section === 'seats') return <AdminSeatContextRoute />;
  if (section === 'cinemas') return <FacilityScreen kind="cinemas" />;
  if (section === 'cinemaImages') return <CinemaImageManager />;
  if (section === 'showtimes' || section === 'pricing') return <OperationsScreen kind={section} />;
  return <AdminPortal routeSection={section} />;
}
