import { NavLink } from 'react-router-dom';
export default function AccountNavigation() {
  return (
    <nav className="customer-account-nav" aria-label="Tài khoản khách hàng">
      <NavLink to="/orders">Đơn của tôi</NavLink>
      <NavLink to="/complaints">Khiếu nại</NavLink>
      <NavLink to="/profile">Hồ sơ</NavLink>
    </nav>
  );
}
