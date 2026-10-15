import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { visibleAreasFor } from '../utils/authorization';
import { ROLES } from '../constants/roles';
import '../styles/public/public.css';

const CURRENT_YEAR = new Date().getFullYear();
function Brand() {
  return (
    <>
      <svg className="area__brand-logo" viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="m16 2 4.1 9.1L30 12l-7.4 6.7 2.3 10L16 23.5 7.1 28.7l2.3-10L2 12l9.9-.9Z"
          fill="currentColor"
        />
      </svg>
      <span className="area__brand-text">
        Cinema<span>Star</span>
      </span>
    </>
  );
}
export default function PublicShell({ title, links = [], children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const staffProfile = location.pathname === '/profile' && user && user.role !== ROLES.CUSTOMER;
  const allowedAreas = visibleAreasFor(user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuToggleRef = useRef(null);
  const navigationRef = useRef(null);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    if (window.matchMedia('(max-width: 960px)').matches) menuToggleRef.current?.focus();
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 960px)');
    const onViewportChange = () => {
      const hadFocus =
        navigationRef.current?.contains(document.activeElement) ||
        document.activeElement === menuToggleRef.current;
      setMenuOpen(false);
      if (hadFocus)
        requestAnimationFrame(() => {
          if (media.matches) menuToggleRef.current?.focus();
          else document.getElementById('main-content')?.focus({ preventScroll: true });
        });
    };
    media.addEventListener('change', onViewportChange);
    return () => media.removeEventListener('change', onViewportChange);
  }, []);
  useEffect(() => {
    if (!menuOpen) return undefined;
    navigationRef.current?.querySelector('a')?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
      if (event.key === 'Tab' && window.matchMedia('(max-width: 960px)').matches) {
        const items = [
          menuToggleRef.current,
          ...navigationRef.current.querySelectorAll('a,button'),
        ].filter(Boolean);
        const first = items[0],
          last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, closeMenu]);
  const destinations = links.length
    ? links
    : [
        { to: '/', label: 'Trang chủ' },
        { to: '/movies', label: 'Phim' },
        { to: '/cinemas', label: 'Rạp chiếu' },
      ];
  const hasCustomerComplaintsLink = destinations.some(
    (link) =>
      link.to === '/complaints' && (!link.role || user?.role === link.role),
  );
  const navLink = (to, label) => (
    <NavLink key={to} to={to} end={to === '/'} className="area__nav-link" onClick={closeMenu}>
      {label}
    </NavLink>
  );
  return (
    <div
      className={`area public-shell${staffProfile ? '' : ' cinema-public'}${location.pathname === '/' ? ' is-home' : ''}`}
      data-cinema-theme={staffProfile ? undefined : 'dark'}
    >
      <a href="#main-content" className="skip-link">
        Chuyển đến nội dung chính
      </a>
      <header className="area__header" data-scrolled={scrolled}>
        <div className="area__heading">
          <Link to="/" className="area__brand" onClick={closeMenu}>
            <Brand />
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
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            {menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
          <span className="ui-visually-hidden">
            {menuOpen ? 'Đóng điều hướng' : 'Mở điều hướng'}
          </span>
        </button>
        <nav
          ref={navigationRef}
          id="public-navigation"
          className={menuOpen ? 'public-shell__navigation is-open' : 'public-shell__navigation'}
          aria-label="Điều hướng chính"
        >
          {destinations
            .filter((link) => !link.role || user?.role === link.role)
            .map((link) => navLink(link.to, link.label))}
          <Link to="/movies?search=" className="cp-header-search" onClick={closeMenu}>
            Tìm phim
          </Link>
          {user && navLink('/profile', 'Hồ sơ')}
          {user?.role === ROLES.CUSTOMER &&
            !hasCustomerComplaintsLink &&
            navLink('/complaints', 'Khiếu nại')}
          {allowedAreas.map(([, area]) => navLink(area.path, area.label))}
          <div className="cp-mobile-account">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  closeMenu();
                }}
              >
                Đăng xuất
              </button>
            ) : (
              <>
                {navLink('/login', 'Đăng nhập')}
                {navLink('/register', 'Đăng ký')}
              </>
            )}
          </div>
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
      <main id="main-content" className="area__main" tabIndex={-1} inert={menuOpen || undefined}>
        {children ?? <Outlet />}
      </main>
      <footer className="area__footer" inert={menuOpen || undefined}>
        <div className="area__footer-inner">
          <div>
            <Link className="area__brand" to="/">
              <Brand />
            </Link>
            <p>
              Phim hay. Suất chiếu đúng lúc.
              <br />
              Chỗ ngồi dành cho bạn.
            </p>
          </div>
          <nav aria-label="Điều hướng cuối trang">
            <Link to="/movies">Phim tại CinemaStar</Link>
            <Link to="/cinemas">Rạp & lịch chiếu</Link>
            {user?.role === ROLES.CUSTOMER ? (
              <>
                <Link to="/orders">Đơn của bạn</Link>
                <Link to="/complaints">Hỗ trợ & khiếu nại</Link>
              </>
            ) : (
              !user && <Link to="/login">Đăng nhập</Link>
            )}
          </nav>
          <p className="cp-copyright">© {CURRENT_YEAR} CinemaStar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
