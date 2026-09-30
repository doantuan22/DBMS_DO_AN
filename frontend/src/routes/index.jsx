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
      <Route path="/" element={<AreaLayout title="Đặt vé xem phim" links={[{ to: '/', label: 'Trang chủ' }]} />}>
        <Route index element={<><Placeholder title="Public: danh sách phim" /><DatabaseHealth /></>} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forbidden" element={<Forbidden />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/profile" element={<AreaLayout title="Hồ sơ cá nhân" />}>
          <Route index element={<Profile />} />
        </Route>
      </Route>

      {protectedArea(ROLES.CUSTOMER, ROLE_AREAS[ROLES.CUSTOMER], 'Customer area')}
      {protectedArea(ROLES.MANAGER, ROLE_AREAS[ROLES.MANAGER], 'Manager area')}
      {protectedArea(ROLES.SUPPORT, ROLE_AREAS[ROLES.SUPPORT], 'CSKH area')}
      {protectedArea(ROLES.ADMIN, ROLE_AREAS[ROLES.ADMIN], 'Admin area')}

      <Route path="*" element={<Placeholder title="404 - Không tìm thấy trang" />} />
    </Routes>
  );
}
