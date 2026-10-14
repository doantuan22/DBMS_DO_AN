import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StaffShellContext } from './StaffShellContext';
import { adminNavigation } from './adminNavigation';
import { managerNavigation } from './managerNavigation';
import AdminIcon from '../components/ui/AdminIcon';
import Dialog from '../components/ui/Dialog';

const readPreference = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};
const savePreference = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Storage can be unavailable. */
  }
};
const normalize = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

export default function AdminShell({ portal = 'admin', children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isManager = portal === 'manager';
  const groups = useMemo(
    () => (isManager ? managerNavigation(user) : adminNavigation(user)),
    [isManager, user],
  );
  const [collapsed, setCollapsed] = useState(
    () => readPreference(`cinema_${portal}_sidebar`, '') === 'collapsed',
  );
  const [theme, setTheme] = useState(() =>
    readPreference(`cinema_${portal}_theme`, 'light') === 'dark' ? 'dark' : 'light',
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const activeItem = groups
    .flatMap((group) => group.items)
    .find((item) => item.path === location.pathname);
  const searchResults = groups
    .flatMap((group) => group.items)
    .filter((item) => normalize(item.label).includes(normalize(query)));
  const defaultRoleTitle = isManager ? 'Quản lý rạp' : 'Quản trị viên';
  const userName = user?.name || user?.email || defaultRoleTitle;
  const initials = userName
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setQuery('');
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 961px)');
    const closeDrawer = (event) => {
      if (event.matches) setDrawerOpen(false);
    };
    media.addEventListener('change', closeDrawer);
    return () => media.removeEventListener('change', closeDrawer);
  }, []);

  const closeNavigation = () => {
    setDrawerOpen(false);
    setSearchOpen(false);
  };
  const renderNavigation = (compact = false) => (
    <nav aria-label={`Điều hướng ${isManager ? 'quản lý' : 'quản trị'}`}>
      {groups.map((group) => (
        <section className="staff-shell__nav-group" key={group.label}>
          <h2 className="staff-shell__nav-heading">
            {compact ? <span aria-hidden="true">···</span> : group.label}
          </h2>
          <ul>
            {group.items.map((item) => {
              const active = activeItem?.key === item.key;
              return (
                <li key={item.key}>
                  <Link
                    to={item.path}
                    onClick={closeNavigation}
                    title={compact ? item.label : undefined}
                    aria-label={compact ? item.label : undefined}
                    className={`staff-shell__nav-item${active ? ' is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <AdminIcon name={item.icon} />
                    <span className={compact ? 'ui-visually-hidden' : 'admin-nav-label'}>
                      {item.label}
                    </span>
                    {!compact && active && <span className="admin-nav-dot" aria-hidden="true" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {!groups.length && (
        <p className="admin-nav-empty">
          {isManager
            ? 'Bạn chưa được cấp quyền truy cập các mục quản lý.'
            : 'Bạn chưa được cấp quyền truy cập các mục quản trị.'}
        </p>
      )}
    </nav>
  );
  const brand = (
    <Link
      className="admin-brand"
      to={isManager ? '/manager/overview' : '/admin/overview'}
      aria-label={`CinemaStar · ${isManager ? 'Quản lý' : 'Tổng quan'}`}
    >
      <span className="admin-brand__symbol">
        <AdminIcon name={isManager ? 'grid' : 'videos'} />
      </span>
      <span className="admin-brand__name">
        CinemaStar<small>{isManager ? 'MANAGER WORKSPACE' : 'ADMIN WORKSPACE'}</small>
      </span>
    </Link>
  );

  return (
    <StaffShellContext.Provider value={{ portal }}>
      <div
        className={`staff-shell staff-shell--${portal}${collapsed ? ' admin-sidebar-collapsed' : ''}`}
        data-theme={theme}
      >
        <a className="skip-link" href="#main-content">
          Chuyển đến nội dung chính
        </a>
        <aside
          className="staff-shell__sidebar admin-desktop-sidebar"
          aria-label={`Thanh bên ${isManager ? 'quản lý' : 'quản trị'}`}
        >
          <div className="admin-sidebar-brand">{brand}</div>
          <div className="admin-sidebar-scroll">{renderNavigation(collapsed)}</div>
          <Link
            to="/"
            className="admin-sidebar-public"
            title={collapsed ? 'Xem trang khách hàng' : undefined}
          >
            <AdminIcon name="arrow-right" />
            <span className={collapsed ? 'ui-visually-hidden' : ''}>Xem trang khách hàng</span>
          </Link>
        </aside>

        <header className="staff-shell__header">
          <button
            className="admin-icon-button admin-desktop-toggle"
            type="button"
            aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
            aria-expanded={!collapsed}
            onClick={() => {
              setCollapsed(!collapsed);
              savePreference(`cinema_${portal}_sidebar`, collapsed ? 'expanded' : 'collapsed');
            }}
          >
            <AdminIcon name="menu" />
          </button>
          <button
            className="admin-icon-button admin-mobile-toggle"
            type="button"
            aria-label={`Mở điều hướng ${isManager ? 'quản lý' : 'quản trị'}`}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <AdminIcon name="menu" />
          </button>
          <span className="admin-header-location">
            {isManager ? 'Không gian quản lý' : 'Không gian quản trị'}
            <span> / </span>
            <strong>{activeItem?.label ?? (isManager ? 'Manager' : 'Admin')}</strong>
          </span>
          <button
            className="admin-search-trigger"
            type="button"
            aria-label="Tìm chức năng"
            onClick={() => {
              setQuery('');
              setSearchOpen(true);
            }}
          >
            <AdminIcon name="search" />
            <span>Tìm chức năng...</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="staff-shell__account">
            <button
              className="admin-icon-button"
              type="button"
              aria-label={theme === 'light' ? 'Chuyển giao diện tối' : 'Chuyển giao diện sáng'}
              onClick={() => {
                const next = theme === 'light' ? 'dark' : 'light';
                setTheme(next);
                savePreference(`cinema_${portal}_theme`, next);
              }}
            >
              <AdminIcon name={theme === 'light' ? 'moon' : 'sun'} />
            </button>
            <details className="admin-account-menu">
              <summary>
                <span className="admin-avatar">{initials}</span>
                <span className="admin-account-copy">
                  <strong>{userName}</strong>
                  <small>{defaultRoleTitle}</small>
                </span>
                <AdminIcon name="chevron-down" />
              </summary>
              <div className="admin-account-dropdown">
                <div className="admin-account-dropdown__header">
                  <p className="admin-account-dropdown__name">{userName}</p>
                  <p className="admin-account-dropdown__role">{defaultRoleTitle}</p>
                </div>
                <Link to="/profile">
                  <AdminIcon name="user-circle" />
                  Hồ sơ cá nhân
                </Link>
                <button type="button" className="admin-logout-btn" onClick={logout}>
                  <AdminIcon name="logout" />
                  Đăng xuất
                </button>
              </div>
            </details>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="staff-shell__main">
          {children ?? <Outlet />}
        </main>

        <Dialog
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title={`Điều hướng ${isManager ? 'quản lý' : 'quản trị'}`}
          size="admin-navigation"
        >
          {drawerOpen && (
            <>
              <div className="admin-drawer-brand">{brand}</div>
              {renderNavigation()}
              <Link to="/" className="admin-sidebar-public" onClick={closeNavigation}>
                <AdminIcon name="arrow-right" />
                Xem trang khách hàng
              </Link>
            </>
          )}
        </Dialog>
        <Dialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          title="Tìm chức năng"
          description="Đi đến nhanh các mục bạn được cấp quyền."
          initialFocusRef={searchRef}
        >
          <label className="admin-command-input">
            <AdminIcon name="search" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nhập tên chức năng..."
              aria-label={`Tìm chức năng ${isManager ? 'quản lý' : 'quản trị'}`}
            />
          </label>
          <ul className="admin-command-results">
            {searchResults.map((item) => (
              <li key={item.key}>
                <Link to={item.path} onClick={closeNavigation}>
                  <AdminIcon name={item.icon} />
                  <span>{item.label}</span>
                  <AdminIcon name="arrow-right" />
                </Link>
              </li>
            ))}
          </ul>
          {!searchResults.length && <p role="status">Không tìm thấy chức năng phù hợp.</p>}
        </Dialog>
      </div>
    </StaffShellContext.Provider>
  );
}
