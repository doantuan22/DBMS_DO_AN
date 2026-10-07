import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { visibleAreasFor } from '../utils/authorization';

// Evaluated once per page load instead of on every render.
const CURRENT_YEAR = new Date().getFullYear();

// NavLink appends the "active" class (and aria-current) by itself.
const NavItem = ({ to, end, children }) => <NavLink to={to} end={end} className="area__nav-link">{children}</NavLink>;

export default function AreaLayout({ title, links = [] }) {
  const { user, logout } = useAuth();
  const allowedAreas = visibleAreasFor(user);
  return (
    <div className="area">
      <a href="#main-content" className="skip-link">Chuyển đến nội dung chính</a>
      <header className="area__header">
        <div className="area__heading">
          <Link to="/" className="area__brand">
            <span className="area__brand-logo" aria-hidden="true">★</span>
            <span className="area__brand-text">Cinema<span>Star</span></span>
          </Link>
          {title && <span className="area__section-title">{title}</span>}
        </div>
        <nav aria-label="Điều hướng chính">
          {links.filter((link) => !link.role || user?.role === link.role).map((l) => (
            <NavItem key={l.to} to={l.to} end={l.to === '/'}>{l.label}</NavItem>
          ))}
          {user && <NavItem to="/profile">Hồ sơ</NavItem>}
          {allowedAreas.map(([role, area]) => (
            <NavItem key={role} to={area.path}>{area.label}</NavItem>
          ))}
        </nav>
        <div className="area__account">
          {user ? (
            <>
              <span className="area__user-name">{user.name || user.email}</span>
              <button type="button" className="catalog-button catalog-button--secondary catalog-button--sm" onClick={logout}>Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login" className="catalog-button catalog-button--secondary catalog-button--sm">Đăng nhập</Link>
              <Link to="/register" className="catalog-button catalog-button--sm">Đăng ký</Link>
            </>
          )}
        </div>
      </header>
      <main id="main-content" className="area__main"><Outlet /></main>
      <footer className="area__footer">
        <div className="area__footer-inner">
          <p><strong>CinemaStar Vietnam</strong> · Hệ thống rạp chiếu phim hiện đại</p>
          <p>© {CURRENT_YEAR} CinemaStar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
