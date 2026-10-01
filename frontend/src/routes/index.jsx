import { Route, Routes } from 'react-router-dom';
import AreaLayout from '../layouts/AreaLayout';
import Placeholder from '../pages/Placeholder';
import DatabaseHealth from '../components/DatabaseHealth';
import RequireRole from './RequireRole';
import RequireAuth from './RequireAuth';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Profile from '../pages/auth/Profile';
import Forbidden from '../pages/Forbidden';
import Home from '../pages/Home';
import Movies from '../pages/Movies';
import MovieDetail from '../pages/MovieDetail';
import Cinemas from '../pages/Cinemas';
import BookingPreparation from '../pages/BookingPreparation';
import Orders from '../pages/Orders';
import OrderDetail from '../pages/OrderDetail';
import PaymentPage from '../pages/PaymentPage';
import Complaints from '../pages/Complaints';
import ComplaintDetail from '../pages/ComplaintDetail';
import ManagerPortal from '../pages/ManagerPortal';
import { ROLE_AREAS, ROLES } from '../constants/roles';

const protectedArea = (role, area, title) => (
  <Route key={role} element={<RequireRole role={role} permission={area.permission} />}>
    <Route path={area.path} element={<AreaLayout title={area.label} />}>
      <Route index element={<Placeholder title={title} />} />
    </Route>
  </Route>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AreaLayout title="Đặt vé xem phim" links={[{ to: '/', label: 'Trang chủ' }, { to: '/movies', label: 'Phim' }, { to: '/cinemas', label: 'Rạp chiếu' }, { to: '/orders', label: 'Đơn của tôi' }]} />}>
        <Route index element={<><Home /><DatabaseHealth /></>} />
        <Route path="movies" element={<Movies />} />
        <Route path="movies/:movieId" element={<MovieDetail />} />
        <Route path="cinemas" element={<Cinemas />} />
        <Route path="booking/:showtimeId" element={<BookingPreparation />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forbidden" element={<Forbidden />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/profile" element={<AreaLayout title="Hồ sơ cá nhân" />}>
          <Route index element={<Profile />} />
        </Route>
      </Route>

      <Route element={<RequireRole role={ROLES.CUSTOMER} permission={ROLE_AREAS[ROLES.CUSTOMER].permission} />}>
        <Route path="/orders" element={<AreaLayout title="Đơn đặt vé" links={[{ to: '/', label: 'Trang chủ' }, { to: '/orders', label: 'Đơn của tôi' }]} />}>
          <Route index element={<Orders />} />
          <Route path=":orderId" element={<OrderDetail />} />
          <Route path=":orderId/payment" element={<PaymentPage />} />
        </Route>
        <Route path="/complaints" element={<AreaLayout title="Khiếu nại" links={[{ to: '/', label: 'Trang chủ' }, { to: '/complaints', label: 'Khiếu nại' }]} />}>
          <Route index element={<Complaints />} />
          <Route path=":complaintId" element={<ComplaintDetail />} />
        </Route>
      </Route>

      <Route element={<RequireRole role={ROLES.MANAGER} permission={ROLE_AREAS[ROLES.MANAGER].permission} />}>
        <Route path="/manager" element={<AreaLayout title="Quản lý rạp" links={[{ to: '/', label: 'Trang chủ' }, { to: '/manager', label: 'Dashboard' }]} />}>
          <Route index element={<ManagerPortal />} />
        </Route>
      </Route>

      {protectedArea(ROLES.CUSTOMER, ROLE_AREAS[ROLES.CUSTOMER], 'Customer area')}
      {protectedArea(ROLES.SUPPORT, ROLE_AREAS[ROLES.SUPPORT], 'CSKH area')}
      {protectedArea(ROLES.ADMIN, ROLE_AREAS[ROLES.ADMIN], 'Admin area')}

      <Route path="*" element={<Placeholder title="404 - Không tìm thấy trang" />} />
    </Routes>
  );
}
