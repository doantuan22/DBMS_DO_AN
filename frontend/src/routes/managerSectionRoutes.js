export const MANAGER_SECTION_ROUTES = Object.freeze({
  overview: { path: '/manager/overview', label: 'Tổng quan', permission: 'XEM_BAO_CAO_RAP' },
  rooms: { path: '/manager/rooms', label: 'Phòng chiếu', permission: 'QL_PHONG' },
  seats: { path: '/manager/seats', label: 'Ghế', permission: 'QL_GHE' },
  showtimes: { path: '/manager/showtimes', label: 'Suất chiếu', permission: 'QL_SUAT_CHIEU' },
  pricing: { path: '/manager/pricing', label: 'Bảng giá', permission: 'QL_BANG_GIA' },
  revenue: { path: '/manager/revenue', label: 'Doanh thu', permission: 'XEM_BAO_CAO_RAP' },
  bookings: { path: '/manager/bookings', label: 'Quản lý đặt vé', permission: 'DAT_VE' },
});

export const MANAGER_SCREEN_ROUTES = Object.entries(MANAGER_SECTION_ROUTES)
  .filter(([section]) => section !== 'bookings')
  .map(([section, route]) => ({ section, path: route.path.slice('/manager/'.length) }));

export const resolveManagerSection = (pathname) =>
  Object.entries(MANAGER_SECTION_ROUTES).find(
    ([, route]) => route.path === pathname.replace(/\/$/, ''),
  )?.[0] ?? null;

export const managerEntryPath = (hash) => {
  const section = hash?.replace(/^#manager-/, '');
  return MANAGER_SECTION_ROUTES[section]?.path ?? '/manager/overview';
};
