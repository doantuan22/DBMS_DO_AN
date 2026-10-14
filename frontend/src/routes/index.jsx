import { Navigate, Route, Routes } from 'react-router-dom';
import AreaLayout from '../layouts/AreaLayout';
import StaffShell from '../layouts/StaffShell';
import RequireRole from './RequireRole';
import RequireAuth from './RequireAuth';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Profile from '../pages/auth/Profile';
import Forbidden from '../pages/Forbidden';
import NotFound from '../pages/NotFound';
import CustomerArea from '../pages/CustomerArea';
import Home from '../pages/Home';
import Movies from '../pages/Movies';
import MovieDetail from '../pages/MovieDetail';
import Cinemas from '../pages/Cinemas';
import CinemaDetail from '../pages/CinemaDetail';
import BookingPreparation from '../pages/BookingPreparation';
import Orders from '../pages/Orders';
import OrderDetail from '../pages/OrderDetail';
import PaymentPage from '../pages/PaymentPage';
import Complaints from '../pages/Complaints';
import ComplaintDetail from '../pages/ComplaintDetail';
import ManagerLayout from '../layouts/ManagerLayout';
import AdminLayout from '../layouts/AdminLayout';
import ManagerSectionRoute, { ManagerEntryRoute } from './ManagerSectionRoute';
import { MANAGER_SCREEN_ROUTES } from './managerSectionRoutes';
import SupportPortal from '../pages/SupportPortal';
import AdminSectionRoute from './AdminSectionRoute';
import StaffBookings from '../features/staff-bookings/StaffBookings';
import { ADMIN_SCREEN_ROUTES } from './adminSectionRoutes';
import { ROLE_AREAS, ROLES } from '../constants/roles';

const PUBLIC_LINKS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/movies', label: 'Phim' },
  { to: '/cinemas', label: 'Rạp chiếu' },
  { to: '/orders', label: 'Đơn của tôi', role: ROLES.CUSTOMER },
];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AreaLayout links={PUBLIC_LINKS} />}>
        <Route index element={<Home />} />
        <Route path="movies" element={<Movies />} />
        <Route path="movies/:movieId" element={<MovieDetail />} />
        <Route path="cinemas" element={<Cinemas />} />
        <Route path="cinemas/:cinemaId" element={<CinemaDetail />} />
        <Route path="booking/:showtimeId" element={<BookingPreparation />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forbidden" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/profile" element={<AreaLayout title="Hồ sơ cá nhân" />}>
          <Route index element={<Profile />} />
        </Route>
      </Route>

      <Route element={<RequireRole role={ROLES.CUSTOMER} />}>
        <Route
          path="/orders"
          element={
            <AreaLayout
              title="Đơn đặt vé"
              links={[
                { to: '/', label: 'Trang chủ' },
                { to: '/orders', label: 'Đơn của tôi', role: ROLES.CUSTOMER },
              ]}
            />
          }
        >
          <Route index element={<Orders />} />
          <Route path=":orderId" element={<OrderDetail />} />
          <Route path=":orderId/payment" element={<PaymentPage />} />
        </Route>
        <Route
          path="/complaints"
          element={
            <AreaLayout
              title="Khiếu nại"
              links={[
                { to: '/', label: 'Trang chủ' },
                { to: '/complaints', label: 'Khiếu nại' },
              ]}
            />
          }
        >
          <Route index element={<Complaints />} />
          <Route path=":complaintId" element={<ComplaintDetail />} />
        </Route>
      </Route>

      <Route element={<RequireRole role={ROLES.MANAGER} />}>
        <Route path="/manager" element={<StaffShell portal="manager" />}>
          <Route element={<ManagerLayout />}>
            <Route index element={<ManagerEntryRoute />} />
            <Route path="bookings" element={<StaffBookings portal="manager" />} />
            {MANAGER_SCREEN_ROUTES.map(({ section, path }) => (
              <Route
                key={section}
                path={path}
                element={<ManagerSectionRoute section={section} />}
              />
            ))}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Route>

      <Route
        element={
          <RequireRole role={ROLES.SUPPORT} permission={ROLE_AREAS[ROLES.SUPPORT].permission} />
        }
      >
        <Route path="/support" element={<StaffShell portal="support" />}>
          <Route path="*" element={<SupportPortal />} />
        </Route>
      </Route>

      <Route
        element={
          <RequireRole role={ROLES.CUSTOMER} permission={ROLE_AREAS[ROLES.CUSTOMER].permission} />
        }
      >
        <Route
          path={ROLE_AREAS[ROLES.CUSTOMER].path}
          element={<AreaLayout title={ROLE_AREAS[ROLES.CUSTOMER].label} />}
        >
          <Route index element={<CustomerArea />} />
        </Route>
      </Route>
      <Route element={<RequireRole role={ROLES.ADMIN} />}>
        <Route path="/admin" element={<StaffShell portal="admin" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="bookings" element={<StaffBookings portal="admin" />} />
            {ADMIN_SCREEN_ROUTES.map(({ section, path }) => (
              <Route key={section} path={path} element={<AdminSectionRoute section={section} />} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
