import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';
import { ADMIN_SECTION_PERMISSIONS, userCanAct } from '../utils/authorization';
import { StaffShellContext } from './StaffShellContext';
import { ADMIN_SECTION_ROUTES } from '../routes/adminSectionRoutes';
import { MANAGER_SECTION_ROUTES, resolveManagerSection } from '../routes/managerSectionRoutes';
import AdminShell from './AdminShell';

const adminNavItem = (key) => ({
  key,
  ...ADMIN_SECTION_ROUTES[key],
  to: ADMIN_SECTION_ROUTES[key].path,
});

const ADMIN_GROUPS = [
  {
    label: 'Tổng quan',
    items: [adminNavItem('dashboard')],
  },
  {
    label: 'Tài khoản & phân công',
    items: [adminNavItem('users'), adminNavItem('assignments')],
  },
  {
    label: 'Rạp & cơ sở vật chất',
    items: [
      adminNavItem('cinemas'),
      adminNavItem('cinemaImages'),
      adminNavItem('rooms'),
      adminNavItem('seats'),
    ],
  },
  {
    label: 'Nội dung',
    items: [adminNavItem('movies'), adminNavItem('genres'), adminNavItem('actors')],
  },
  {
    label: 'Kinh doanh & vận hành',
    items: [
      adminNavItem('products'),
      adminNavItem('promotions'),
      adminNavItem('pricing'),
      adminNavItem('showtimes'),
      adminNavItem('bookings'),
    ],
  },
  {
    label: 'Chăm sóc & báo cáo',
    items: [adminNavItem('complaints'), adminNavItem('revenue')],
  },
];

const managerNavItem = (key, label) => ({
  key,
  ...MANAGER_SECTION_ROUTES[key],
  label: label ?? MANAGER_SECTION_ROUTES[key].label,
  to: MANAGER_SECTION_ROUTES[key].path,
});
const MANAGER_GROUPS = [
  { label: 'Tổng quan', items: [managerNavItem('overview', 'Dashboard')] },
  {
    label: 'Cơ sở vật chất',
    items: [managerNavItem('rooms', 'Phòng'), managerNavItem('seats')],
  },
  {
    label: 'Lịch chiếu & giá',
    items: [managerNavItem('showtimes'), managerNavItem('pricing'), managerNavItem('bookings')],
  },
  { label: 'Báo cáo', items: [managerNavItem('revenue')] },
];

const SUPPORT_GROUPS = [
  { label: 'Khiếu nại', items: [{ key: 'queue', label: 'Hàng chờ', to: '/support/complaints' }] },
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
  const times = (value) =>
    value.split(',').map((time) => {
      const amount = Number.parseFloat(time);
      return time.trim().endsWith('ms') ? amount : amount * 1000;
    });
  const durations = times(style.transitionDuration);
  const delays = times(style.transitionDelay);
  return (
    Math.max(
      0,
      ...durations.map((duration, index) => duration + (delays[index % delays.length] ?? 0)),
    ) + 20
  );
}

export default function StaffShell({ portal, children }) {
  if (portal === 'admin' || portal === 'manager')
    return <AdminShell portal={portal}>{children}</AdminShell>;
  return <LegacyStaffShell portal={portal}>{children}</LegacyStaffShell>;
}

function LegacyStaffShell({ portal, children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const groups = groupsForUser(portal, user);
  const [isMobile, setIsMobile] = useState(mobileViewportMatches);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggleRef = useRef(null);
  const sidebarRef = useRef(null);
  const mainContentRef = useRef(null);
  const restoreToggleFocusRef = useRef(false);
  const initialFocusTimerRef = useRef(null);
  const mobileDialogOpen = isMobile && menuOpen;
  const shellContext = useMemo(
    () => ({
      portal,
    }),
    [portal],
  );
  const closeMenu = useCallback(({ restoreFocus = true } = {}) => {
    restoreToggleFocusRef.current = restoreFocus && mobileViewportMatches();
    clearTimeout(initialFocusTimerRef.current);
    setMenuOpen(false);
  }, []);
  const openMenu = useCallback(() => {
    flushSync(() => setMenuOpen(true));
    const initialTarget =
      sidebarRef.current?.querySelector('nav a, nav button') ??
      sidebarRef.current?.querySelector('.staff-shell__drawer-close');
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
            <span>
              Cinema<span className="staff-shell__brand-accent">Star</span>
            </span>
          </Link>
          <span className="staff-shell__portal-title" inert={mobileDialogOpen}>
            {PORTAL_LABELS[portal]}
          </span>
          <div className="staff-shell__account" inert={mobileDialogOpen}>
            <span className="staff-shell__user-name">{user?.name || user?.email}</span>
            <button
              className="ui-button ui-button--secondary ui-button--sm"
              type="button"
              onClick={logout}
            >
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
          <div
            ref={sidebarRef}
            className={menuOpen ? 'staff-shell__sidebar is-open' : 'staff-shell__sidebar'}
            id="staff-sidebar"
            aria-label="Điều hướng nhân viên"
            role={mobileDialogOpen ? 'dialog' : 'complementary'}
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
                          ? location.pathname === item.to
                          : portal === 'manager'
                            ? resolveManagerSection(location.pathname) === item.key
                            : item.key === 'queue';
                      const className = navItemClass(active);
                      return (
                        <li key={item.key}>
                          {item.to ? (
                            <Link
                              className={className}
                              to={item.to}
                              aria-current={active ? 'page' : undefined}
                              onClick={closeMenu}
                            >
                              {item.label}
                            </Link>
                          ) : (
                            <a
                              className={className}
                              href={item.href}
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
                <p className="staff-shell__nav-empty">
                  Bạn không có mục điều hướng được cấp quyền.
                </p>
              )}
            </nav>
          </div>
          <main
            id="main-content"
            ref={mainContentRef}
            tabIndex={-1}
            inert={mobileDialogOpen}
            className="staff-shell__main"
          >
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
    </StaffShellContext.Provider>
  );
}
