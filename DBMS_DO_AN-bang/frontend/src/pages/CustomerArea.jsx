import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountNavigation from '../features/customer/AccountNavigation';

const SHORTCUTS = [
  { to: '/orders', label: 'Đơn đặt vé của tôi' },
  { to: '/complaints', label: 'Khiếu nại' },
  { to: '/profile', label: 'Hồ sơ cá nhân' },
  { to: '/', label: 'Trang chủ' },
];

export default function CustomerArea() {
  const { user } = useAuth();
  return (
    <section className="catalog-page">
      <AccountNavigation />
      <p className="catalog-eyebrow">TÀI KHOẢN / CINEMASTAR</p>
      <h1>Chào {user?.name || 'bạn'}.</h1>
      <p className="catalog-muted">Những buổi hẹn điện ảnh của bạn, trong một nơi.</p>
      <div className="cp-account-contact">
        <span>{user?.email}</span>
        {user?.loyaltyPoints != null && <span>{user.loyaltyPoints} điểm tích lũy</span>}
      </div>
      <div className="cp-account-shortcuts">
        {SHORTCUTS.map(({ to, label }) => (
          <Link key={to} to={to}>
            {label} <span aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
