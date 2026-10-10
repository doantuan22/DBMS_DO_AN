import { Link } from 'react-router-dom';

const SHORTCUTS = [
  { to: '/orders', label: 'Đơn đặt vé của tôi' },
  { to: '/complaints', label: 'Khiếu nại' },
  { to: '/profile', label: 'Hồ sơ cá nhân' },
  { to: '/', label: 'Trang chủ' },
];

export default function CustomerArea() {
  return (
    <section className="catalog-page">
      <p className="catalog-eyebrow">TÀI KHOẢN</p>
      <h1>Tài khoản khách hàng</h1>
      <p className="catalog-muted">Chọn một tác vụ để tiếp tục.</p>
      <div className="catalog-actions">
        {SHORTCUTS.map(({ to, label }) => (
          <Link key={to} className="catalog-button catalog-button--secondary" to={to}>
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
