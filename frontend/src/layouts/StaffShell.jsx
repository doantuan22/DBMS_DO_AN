import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';
import { ADMIN_SECTION_PERMISSIONS, userCanAct } from '../utils/authorization';
import { StaffShellContext } from './StaffShellContext';

const ADMIN_GROUPS = [
  {
    label: 'Tổng quan',
    items: [{ key: 'dashboard', label: 'Tổng quan' }],
  },
  {
    label: 'Tài khoản & phân công',
    items: [
      { key: 'users', label: 'Tài khoản' },
      { key: 'assignments', label: 'Phân công' },
    ],
  },
  {
    label: 'Rạp & cơ sở vật chất',
    items: [
      { key: 'cinemas', label: 'Rạp' },
      { key: 'cinemaImages', label: 'Ảnh rạp' },
      { key: 'rooms', label: 'Phòng' },
      { key: 'seats', label: 'Ghế' },
    ],
  },
  {
    label: 'Nội dung',
    items: [
      { key: 'movies', label: 'Phim' },
      { key: 'genres', label: 'Thể loại' },
      { key: 'actors', label: 'Diễn viên' },
    ],
  },
  {
    label: 'Kinh doanh & vận hành',
    items: [
      { key: 'products', label: 'Sản phẩm' },
      { key: 'promotions', label: 'Khuyến mãi' },
      { key: 'pricing', label: 'Bảng giá' },
      { key: 'showtimes', label: 'Suất chiếu' },
    ],
  },
  {
    label: 'Chăm sóc & báo cáo',
    items: [
      { key: 'complaints', label: 'Khiếu nại' },
      { key: 'revenue', label: 'Doanh thu' },
    ],
  },
];

const MANAGER_GROUPS = [
  { label: 'Tổng quan', items: [{ key: 'overview', label: 'Dashboard', permission: 'XEM_BAO_CAO_RAP' }] },
  {
    label: 'Cơ sở vật chất',
    items: [
      { key: 'rooms', label: 'Phòng', permission: 'QL_PHONG' },
      { key: 'seats', label: 'Ghế', permission: 'QL_GHE' },
    ],
  },
  {
    label: 'Lịch chiếu & giá',
    items: [
      { key: 'showtimes', label: 'Suất chiếu', permission: 'QL_SUAT_CHIEU' },
      { key: 'pricing', label: 'Bảng giá', permission: 'QL_BANG_GIA' },
    ],
  },
  { label: 'Báo cáo', items: [{ key: 'revenue', label: 'Doanh thu', permission: 'XEM_BAO_CAO_RAP' }] },
];

const SUPPORT_GROUPS = [
  { label: 'Khiếu nại', items: [{ key: 'queue', label: 'Hàng chờ', href: '#support-queue' }] },
];

const PORTAL_LABELS = {
  admin: 'Quản trị hệ thống',
  manager: 'Vận hành rạp',
  support: 'Chăm sóc khách hàng',
};

function groupsForUser(portal, user) {
  const groups =
    portal === 'admin'
      ? ADMIN_GROUPS.map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            userCanAct(user, ROLES.ADMIN, ADMIN_SECTION_PERMISSIONS[item.key]),
          ),
        }))
      : portal === 'manager'
        ? MANAGER_GROUPS.map((group) => ({
            ...group,
            items: group.items.filter((item) => userCanAct(user, ROLES.MANAGER, item.permission)),
          }))
        : SUPPORT_GROUPS.map((group) => ({
            ...group,
            items: group.items.filter(() => userCanAct(user, ROLES.SUPPORT, 'QL_KHIEUNAI')),
          }));

  return groups.filter((group) => group.items.length > 0);
}

function navItemClass(active) {
  return active ? 'staff-shell__nav-item is-active' : 'staff-shell__nav-item';
}

export default function StaffShell({ portal, children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const groups = groupsForUser(portal, user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeAdminSection, setActiveAdminSection] = useState(
    () => groups[0]?.items[0]?.key ?? 'dashboard',
  );
  const menuToggleRef = useRef(null);
  const sidebarRef = useRef(null);
  const adminNavigationHandler = useRef(null);
  const registerAdminNavigation = useCallback((handler) => {
    adminNavigationHandler.current = handler;
    return () => {
      if (adminNavigationHandler.current === handler) adminNavigationHandler.current = null;
    };
  }, []);
  const navigateAdminSection = useCallback((key) => {
    setActiveAdminSection(key);
    adminNavigationHandler.current?.(key);
  }, []);
  const shellContext = useMemo(
    () => ({
      portal,
      activeAdminSection,
      setActiveAdminSection,
      registerAdminNavigation,
      navigateAdminSection,
    }),
    [portal, activeAdminSection, registerAdminNavigation, navigateAdminSection],
  );
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    if (window.matchMedia('(max-width: 960px)').matches) menuToggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    sidebarRef.current?.querySelector('a, button')?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab' || !window.matchMedia('(max-width: 960px)').matches) return;

      const sidebarItems = [...(sidebarRef.current?.querySelectorAll('a, button') ?? [])];
      const focusableItems = [menuToggleRef.current, ...sidebarItems].filter(Boolean);
      const first = focusableItems[0];
      const last = focusableItems.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, closeMenu]);

  return (
    <StaffShellContext.Provider value={shellContext}>
      <div className={`staff-shell staff-shell--${portal}`}>
        <a className="skip-link" href="#main-content">
          Chuyển đến nội dung chính
        </a>
        <header className="staff-shell__header">
          <button
            ref={menuToggleRef}
            type="button"
            className="staff-shell__menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="staff-sidebar"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
            <span className="ui-visually-hidden">
              {menuOpen ? 'Đóng điều hướng nhân viên' : 'Mở điều hướng nhân viên'}
            </span>
          </button>
          <Link className="staff-shell__brand" to="/">
            <span className="area__brand-logo" aria-hidden="true">
              ★
            </span>
            <span>Cinema<span className="staff-shell__brand-accent">Star</span></span>
          </Link>
          <span className="staff-shell__portal-title">{PORTAL_LABELS[portal]}</span>
          <div className="staff-shell__account">
            <span className="staff-shell__user-name">{user?.name || user?.email}</span>
            <button className="ui-button ui-button--secondary ui-button--sm" type="button" onClick={logout}>
              Đăng xuất
            </button>
          </div>
        </header>

        {menuOpen && (
          <button
            className="staff-shell__scrim"
            type="button"
            aria-label="Đóng điều hướng"
            onClick={closeMenu}
          />
        )}

        <div className="staff-shell__layout">
          <aside
            ref={sidebarRef}
            className={menuOpen ? 'staff-shell__sidebar is-open' : 'staff-shell__sidebar'}
            id="staff-sidebar"
            aria-label="Điều hướng nhân viên"
          >
            <nav aria-label="Điều hướng nhân viên">
              {groups.map((group, groupIndex) => (
                <section className="staff-shell__nav-group" key={group.label}>
                  <h2 className="staff-shell__nav-heading">{group.label}</h2>
                  <ul>
                    {group.items.map((item) => {
                      const active =
                        portal === 'admin'
                          ? activeAdminSection === item.key
                          : portal === 'manager'
                            ? location.hash === `#manager-${item.key}` ||
                              (!location.hash && item.key === groups[0]?.items[0]?.key)
                            : item.key === 'queue';
                      const className = navItemClass(active);
                      return (
                        <li key={item.key}>
                          {portal === 'admin' ? (
                            <button
                              type="button"
                              className={className}
                              aria-current={active ? 'page' : undefined}
                              onClick={() => {
                                navigateAdminSection(item.key);
                                closeMenu();
                              }}
                            >
                              {item.label}
                            </button>
                          ) : (
                            <a
                              className={className}
                              href={portal === 'manager' ? `#manager-${item.key}` : item.href}
                              aria-current={active ? 'location' : undefined}
                              onClick={closeMenu}
                            >
                              {item.label}
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {groupIndex < groups.length - 1 && <div className="staff-shell__nav-divider" />}
                </section>
              ))}
            </nav>
          </aside>
          <main id="main-content" className="staff-shell__main">
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
    </StaffShellContext.Provider>
  );
}
