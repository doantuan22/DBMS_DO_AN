import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { visibleAreasFor } from '../utils/authorization';

const CURRENT_YEAR = new Date().getFullYear();

function PublicNavLink({ to, end = false, children, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="area__nav-link"
      onClick={onNavigate}
    >
      {children}
    </NavLink>
  );
}

export default function PublicShell({ title, links = [], children }) {
  const { user, logout } = useAuth();
  const allowedAreas = visibleAreasFor(user);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggleRef = useRef(null);
  const navigationRef = useRef(null);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    if (window.matchMedia('(max-width: 960px)').matches) menuToggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    navigationRef.current?.querySelector('a')?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, closeMenu]);

  return (
    <div className="area public-shell">
      <a href="#main-content" className="skip-link">
        Chuyển đến nội dung chính
      </a>
      <header className="area__header">
        <div className="area__heading">
          <Link to="/" className="area__brand" onClick={closeMenu}>
            <span className="area__brand-logo" aria-hidden="true">
              ★
            </span>
            <span className="area__brand-text">
              Cinema<span>Star</span>
            </span>
          </Link>
          {title && <span className="area__section-title">{title}</span>}
        </div>

        <button
          ref={menuToggleRef}
          className="public-shell__menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="public-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
          <span className="ui-visually-hidden">{menuOpen ? 'Đóng điều hướng' : 'Mở điều hướng'}</span>
        </button>

        <nav
          ref={navigationRef}
          id="public-navigation"
          className={menuOpen ? 'public-shell__navigation is-open' : 'public-shell__navigation'}
          aria-label="Điều hướng chính"
        >
          {links
            .filter((link) => !link.role || user?.role === link.role)
            .map((link) => (
              <PublicNavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onNavigate={closeMenu}
              >
                {link.label}
              </PublicNavLink>
            ))}
          {user && (
            <PublicNavLink to="/profile" onNavigate={closeMenu}>
              Hồ sơ
            </PublicNavLink>
          )}
          {allowedAreas.map(([role, area]) => (
            <PublicNavLink key={role} to={area.path} onNavigate={closeMenu}>
              {area.label}
            </PublicNavLink>
          ))}
        </nav>

        <div className="area__account public-shell__account">
          {user ? (
            <>
              <span className="area__user-name">{user.name || user.email}</span>
              <button
                type="button"
                className="catalog-button catalog-button--secondary catalog-button--sm"
                onClick={logout}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="catalog-button catalog-button--secondary catalog-button--sm"
              >
                Đăng nhập
              </Link>
              <Link to="/register" className="catalog-button catalog-button--sm">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </header>
      <main id="main-content" className="area__main">
        {children ?? <Outlet />}
      </main>
      <footer className="area__footer">
        <div className="area__footer-inner">
          <p>
            <strong>CinemaStar Vietnam</strong> · Hệ thống rạp chiếu phim hiện đại
          </p>
          <p>© {CURRENT_YEAR} CinemaStar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
