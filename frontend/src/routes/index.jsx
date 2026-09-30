import { Route, Routes } from 'react-router-dom';
import AreaLayout from '../layouts/AreaLayout';
import Placeholder from '../pages/Placeholder';
import DatabaseHealth from '../components/DatabaseHealth';
import RequireRole from './RequireRole';
import { AREA_PATHS, ROLES } from '../constants/roles';

const area = (title, base) => (
  <AreaLayout title={title} links={[{ to: base, label: 'Tổng quan' }]} />
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AreaLayout title="Đặt vé xem phim" links={[{ to: '/', label: 'Trang chủ' }]} />}>
        <Route index element={<><Placeholder title="Public: danh sách phim" /><DatabaseHealth /></>} />
      </Route>

      <Route element={<RequireRole role={ROLES.CUSTOMER} />}>
        <Route path={AREA_PATHS.CUSTOMER} element={area('Khách hàng', AREA_PATHS.CUSTOMER)}>
          <Route index element={<Placeholder title="Customer area" />} />
        </Route>
      </Route>

      <Route element={<RequireRole role={ROLES.MANAGER} />}>
        <Route path={AREA_PATHS.MANAGER} element={area('Quản lý rạp', AREA_PATHS.MANAGER)}>
          <Route index element={<Placeholder title="Manager area" />} />
        </Route>
      </Route>

      <Route element={<RequireRole role={ROLES.SUPPORT} />}>
        <Route path={AREA_PATHS.SUPPORT} element={area('CSKH', AREA_PATHS.SUPPORT)}>
          <Route index element={<Placeholder title="CSKH area" />} />
        </Route>
      </Route>

      <Route element={<RequireRole role={ROLES.ADMIN} />}>
        <Route path={AREA_PATHS.ADMIN} element={area('Quản trị', AREA_PATHS.ADMIN)}>
          <Route index element={<Placeholder title="Admin area" />} />
        </Route>
      </Route>

      <Route path="*" element={<Placeholder title="404 - Không tìm thấy trang" />} />
    </Routes>
  );
}
