import { Route, Routes } from 'react-router-dom';
import AreaLayout from '../layouts/AreaLayout';
import DatabaseHealth from '../components/DatabaseHealth';
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
import ManagerPortal from '../pages/ManagerPortal';
import SupportPortal from '../pages/SupportPortal';
import AdminPortal from '../pages/AdminPortal';
import { ROLE_AREAS, ROLES } from '../constants/roles';

const PUBLIC_LINKS = [{ to: '/', label: 'Trang chủ' }, { to: '/movies', label: 'Phim' }, { to: '/cinemas', label: 'Rạp chiếu' }, { to: '/orders', label: 'Đơn của tôi', role: ROLES.CUSTOMER }];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AreaLayout links={PUBLIC_LINKS} />}>
        <Route index element={<><Home /><DatabaseHealth /></>} />
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
        <Route path="/orders" element={<AreaLayout title="Đơn đặt vé" links={[{ to: '/', label: 'Trang chủ' }, { to: '/orders', label: 'Đơn của tôi', role: ROLES.CUSTOMER }]} />}>
          <Route index element={<Orders />} />
          <Route path=":orderId" element={<OrderDetail />} />
          <Route path=":orderId/payment" element={<PaymentPage />} />
        </Route>
        <Route path="/complaints" element={<AreaLayout title="Khiếu nại" links={[{ to: '/', label: 'Trang chủ' }, { to: '/complaints', label: 'Khiếu nại' }]} />}>
          <Route index element={<Complaints />} />
          <Route path=":complaintId" element={<ComplaintDetail />} />
        </Route>
      </Route>

      <Route element={<RequireRole role={ROLES.MANAGER} />}>
        <Route path="/manager" element={<AreaLayout title="Quản lý rạp" links={[{ to: '/', label: 'Trang chủ' }, { to: '/manager', label: 'Dashboard' }]} />}>
          <Route index element={<ManagerPortal />} />
        </Route>
      </Route>

      <Route element={<RequireRole role={ROLES.SUPPORT} permission={ROLE_AREAS[ROLES.SUPPORT].permission} />}>
        <Route path="/support" element={<AreaLayout title="Chăm sóc khách hàng" links={[{ to: '/', label: 'Trang chủ' }, { to: '/support', label: 'CSKH' }]} />}>
          <Route index element={<SupportPortal />} />
        </Route>
      </Route>

      <Route element={<RequireRole role={ROLES.CUSTOMER} permission={ROLE_AREAS[ROLES.CUSTOMER].permission} />}>
        <Route path={ROLE_AREAS[ROLES.CUSTOMER].path} element={<AreaLayout title={ROLE_AREAS[ROLES.CUSTOMER].label} />}>
          <Route index element={<CustomerArea />} />
        </Route>
      </Route>
      <Route element={<RequireRole role={ROLES.ADMIN} />}>
        <Route path="/admin" element={<AreaLayout title="Quản trị hệ thống" links={[{ to: '/', label: 'Trang chủ' }, { to: '/admin', label: 'Admin' }]} />}>
          <Route index element={<AdminPortal />} />
        </Route>
      </Route>
    </Routes>
  );
}
