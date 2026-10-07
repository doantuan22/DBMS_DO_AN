import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { visibleAreasFor } from '../utils/authorization';

export default function AreaLayout({ title, links = [] }) {
  const { user, logout } = useAuth();
  const allowedAreas = visibleAreasFor(user);
  return (
    <div className="area">
      <a href="#main-content" className="skip-link">Chuyển đến nội dung chính</a>
      <header className="area__header">
        <strong>{title}</strong>
        <nav aria-label="Điều hướng chính">
          {links.filter((link) => !link.role || user?.role === link.role).map((l) => (
            <NavLink key={l.to} to={l.to} end>{l.label}</NavLink>
          ))}
          {user && <NavLink to="/profile">Hồ sơ</NavLink>}
          {allowedAreas.map(([role, area]) => (
            <NavLink key={role} to={area.path}>{area.label}</NavLink>
          ))}
          {!user && (
            <>
              <NavLink to="/login">Đăng nhập</NavLink>
              <NavLink to="/register">Đăng ký</NavLink>
            </>
          )}
        </nav>
        {user && (
          <div className="area__account">
            <span>{user.name}</span>
            <button type="button" onClick={logout}>Đăng xuất</button>
          </div>
        )}
      </header>
      <main id="main-content" className="area__main">
        <Outlet />
      </main>
    </div>
  );
}
