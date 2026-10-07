import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { visibleAreasFor } from '../utils/authorization';

export default function AreaLayout({ title, links = [] }) {
  const { user, logout } = useAuth();
  const allowedAreas = visibleAreasFor(user);

  return (
    <div className="area" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <a href="#main-content" className="skip-link">Chuyển đến nội dung chính</a>
      <header className="area__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/" className="area__brand">
            <div className="area__brand-logo">★</div>
            <div className="area__brand-text">
              Cinema<span>Star</span>
            </div>
          </Link>
          {title && title !== 'Đặt vé xem phim' && (
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', borderLeft: '1px solid var(--color-border)', paddingLeft: '0.75rem', fontWeight: 600 }}>
              {title}
            </span>
          )}
        </div>

        <nav aria-label="Điều hướng chính" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {links.filter((link) => !link.role || user?.role === link.role).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => `area__nav-link ${isActive ? 'active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
          {user && (
            <NavLink
              to="/profile"
              className={({ isActive }) => `area__nav-link ${isActive ? 'active' : ''}`}
            >
              Hồ sơ
            </NavLink>
          )}
          {allowedAreas.map(([role, area]) => (
            <NavLink
              key={role}
              to={area.path}
              className={({ isActive }) => `area__nav-link ${isActive ? 'active' : ''}`}
            >
              {area.label}
            </NavLink>
          ))}
        </nav>

        <div className="area__account">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-text)' }}>{user.name || user.email}</span>
              <button
                type="button"
                className="catalog-button catalog-button--secondary"
                style={{ minHeight: '2.1rem', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                onClick={logout}
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="catalog-button catalog-button--secondary" style={{ minHeight: '2.1rem', padding: '0.35rem 0.85rem', fontSize: '0.88rem' }}>
                Đăng nhập
              </Link>
              <Link to="/register" className="catalog-button" style={{ minHeight: '2.1rem', padding: '0.35rem 0.85rem', fontSize: '0.88rem' }}>
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </header>

      <main id="main-content" className="area__main" style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: '1.75rem 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
        <div style={{ maxWidth: '76rem', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>CinemaStar Vietnam</span>
            <span>· Hệ thống rạp chiếu phim hiện đại</span>
          </div>
          <div>© {new Date().getFullYear()} CinemaStar. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
