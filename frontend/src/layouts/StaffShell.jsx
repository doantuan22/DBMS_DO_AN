import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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
      { key: 'bookings', label: 'Quản lý đặt vé', to: '/admin/bookings' },
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
      { key: 'bookings', label: 'Quản lý đặt vé', permission: 'DAT_VE', to: '/manager/bookings' },
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

const mobileViewportMatches = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 960px)').matches;

function drawerTransitionDelay(element) {
  const style = window.getComputedStyle(element);
  const times = (value) => value.split(',').map((time) => {
    const amount = Number.parseFloat(time);
    return time.trim().endsWith('ms') ? amount : amount * 1000;
  });
  const durations = times(style.transitionDuration);
  const delays = times(style.transitionDelay);
  return Math.max(0, ...durations.map((duration, index) => duration + (delays[index % delays.length] ?? 0))) + 20;
}

export default function StaffShell({ portal, children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const groups = groupsForUser(portal, user);
  const [isMobile, setIsMobile] = useState(mobileViewportMatches);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeAdminSection, setActiveAdminSection] = useState(
    () => groups[0]?.items[0]?.key ?? 'dashboard',
  );
  const menuToggleRef = useRef(null);
  const sidebarRef = useRef(null);
  const mainContentRef = useRef(null);
  const restoreToggleFocusRef = useRef(false);
  const initialFocusTimerRef = useRef(null);
  const mobileDialogOpen = isMobile && menuOpen;
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
  const closeMenu = useCallback(({ restoreFocus = true } = {}) => {
    restoreToggleFocusRef.current = restoreFocus && mobileViewportMatches();
    clearTimeout(initialFocusTimerRef.current);
    setMenuOpen(false);
  }, []);
  const openMenu = useCallback(() => {
    flushSync(() => setMenuOpen(true));
    const initialTarget = sidebarRef.current?.querySelector('nav a, nav button')
      ?? sidebarRef.current?.querySelector('.staff-shell__drawer-close');
    const sidebar = sidebarRef.current;
    clearTimeout(initialFocusTimerRef.current);
    if (sidebar && initialTarget) {
      initialFocusTimerRef.current = setTimeout(() => {
        if (mobileViewportMatches() && sidebar.classList.contains('is-open')) initialTarget.focus();
      }, drawerTransitionDelay(sidebar));
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 960px)');
    const onViewportChange = (event) => {
      const active = document.activeElement;
      const focusWasInDrawer = sidebarRef.current?.contains(active);
      const focusWasOnToggle = menuToggleRef.current === active;
      setIsMobile(event.matches);
      clearTimeout(initialFocusTimerRef.current);
      setMenuOpen(false);
      if (focusWasInDrawer || focusWasOnToggle) {
        requestAnimationFrame(() => {
          if (event.matches) menuToggleRef.current?.focus();
          else mainContentRef.current?.focus({ preventScroll: true });
        });
      }
    };
    media.addEventListener('change', onViewportChange);
    return () => media.removeEventListener('change', onViewportChange);
  }, []);

  useLayoutEffect(() => {
    if (menuOpen || !restoreToggleFocusRef.current) return;
    restoreToggleFocusRef.current = false;
    if (isMobile) menuToggleRef.current?.focus();
  }, [isMobile, menuOpen]);

  useLayoutEffect(() => {
    if (!mobileDialogOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableItems = [
        ...(sidebarRef.current?.querySelectorAll(
          'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ) ?? []),
      ].filter((item) => !item.closest('[inert]') && item.getClientRects().length > 0);
      const first = focusableItems[0];
      const last = focusableItems.at(-1);
      const focusIsInDrawer = sidebarRef.current?.contains(document.activeElement);
      if (!focusableItems.length) {
        event.preventDefault();
      } else if (event.shiftKey && (document.activeElement === first || !focusIsInDrawer)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !focusIsInDrawer)) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      clearTimeout(initialFocusTimerRef.current);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [mobileDialogOpen, closeMenu]);

  return (
    <StaffShellContext.Provider value={shellContext}>
      <div className={`staff-shell staff-shell--${portal}`}>
        <a className="skip-link" href="#main-content" inert={mobileDialogOpen}>
          Chuyển đến nội dung chính
        </a>
        <header className="staff-shell__header">
          <button
            ref={menuToggleRef}
            type="button"
            className="staff-shell__menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="staff-sidebar"
            aria-hidden={mobileDialogOpen ? 'true' : undefined}
            tabIndex={mobileDialogOpen ? -1 : undefined}
            onClick={() => (menuOpen ? closeMenu() : openMenu())}
          >
            <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
            <span className="ui-visually-hidden">
              {menuOpen ? 'Điều hướng nhân viên đang mở' : 'Mở điều hướng nhân viên'}
            </span>
          </button>
          <Link className="staff-shell__brand" to="/" inert={mobileDialogOpen}>
            <span className="area__brand-logo" aria-hidden="true">
              ★
            </span>
            <span>Cinema<span className="staff-shell__brand-accent">Star</span></span>
          </Link>
          <span className="staff-shell__portal-title" inert={mobileDialogOpen}>{PORTAL_LABELS[portal]}</span>
          <div className="staff-shell__account" inert={mobileDialogOpen}>
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
            aria-hidden="true"
            tabIndex={-1}
            onClick={closeMenu}
          />
        )}

        <div className="staff-shell__layout">
          <aside
            ref={sidebarRef}
            className={menuOpen ? 'staff-shell__sidebar is-open' : 'staff-shell__sidebar'}
            id="staff-sidebar"
            aria-label="Điều hướng nhân viên"
            role={mobileDialogOpen ? 'dialog' : undefined}
            aria-modal={mobileDialogOpen ? 'true' : undefined}
            aria-labelledby={mobileDialogOpen ? 'staff-sidebar-title' : undefined}
            aria-hidden={isMobile && !menuOpen ? 'true' : undefined}
            inert={isMobile && !menuOpen}
          >
            {mobileDialogOpen && (
              <div className="staff-shell__drawer-heading">
                <h2 id="staff-sidebar-title">Điều hướng · {PORTAL_LABELS[portal]}</h2>
                <button className="staff-shell__drawer-close" type="button" onClick={closeMenu}>
                  <span aria-hidden="true">×</span>
                  <span className="ui-visually-hidden">Đóng điều hướng nhân viên</span>
                </button>
              </div>
            )}
            <nav aria-label="Điều hướng nhân viên">
              {groups.map((group, groupIndex) => (
                <section className="staff-shell__nav-group" key={group.label}>
                  <h2 className="staff-shell__nav-heading">{group.label}</h2>
                  <ul>
                    {group.items.map((item) => {
                      const active =
                        portal === 'admin'
                          ? item.to ? location.pathname === item.to : location.pathname === '/admin' && activeAdminSection === item.key
                          : portal === 'manager'
                            ? item.to ? location.pathname === item.to : location.pathname === '/manager' && (location.hash === `#manager-${item.key}` ||
                              (!location.hash && item.key === groups[0]?.items[0]?.key))
                            : item.key === 'queue';
                      const className = navItemClass(active);
                      return (
                        <li key={item.key}>
                          {item.to || (portal === 'admin' && location.pathname !== '/admin') ? (
                            <Link className={className} to={item.to ?? '/admin'} aria-current={active ? 'page' : undefined}
                              onClick={() => { if (!item.to) navigateAdminSection(item.key); closeMenu(); }}>{item.label}</Link>
                          ) : portal === 'admin' ? (
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
                              href={portal === 'manager' ? `/manager#manager-${item.key}` : item.href}
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
              {groups.length === 0 && (
                <p className="staff-shell__nav-empty">Bạn không có mục điều hướng được cấp quyền.</p>
              )}
            </nav>
          </aside>
          <main id="main-content" ref={mainContentRef} tabIndex={-1} inert={mobileDialogOpen} className="staff-shell__main">
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
    </StaffShellContext.Provider>
  );
}
