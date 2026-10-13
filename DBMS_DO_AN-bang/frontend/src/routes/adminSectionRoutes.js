export const ADMIN_SECTION_ROUTES = Object.freeze({
  dashboard: { path: '/admin/overview', label: 'Tổng quan' },
  users: { path: '/admin/access/users', label: 'Tài khoản' },
  assignments: { path: '/admin/access/assignments', label: 'Phân công' },
  cinemas: { path: '/admin/cinemas', label: 'Rạp' },
  cinemaImages: { path: '/admin/cinemas/images', label: 'Ảnh rạp' },
  rooms: { path: '/admin/facilities/rooms', label: 'Phòng' },
  seats: { path: '/admin/facilities/seats', label: 'Ghế' },
  movies: { path: '/admin/catalog/movies', label: 'Phim' },
  genres: { path: '/admin/catalog/genres', label: 'Thể loại' },
  actors: { path: '/admin/catalog/actors', label: 'Diễn viên' },
  products: { path: '/admin/commerce/products', label: 'Sản phẩm' },
  promotions: { path: '/admin/commerce/promotions', label: 'Khuyến mãi' },
  pricing: { path: '/admin/operations/pricing', label: 'Bảng giá' },
  showtimes: { path: '/admin/operations/showtimes', label: 'Suất chiếu' },
  bookings: { path: '/admin/bookings', label: 'Quản lý đặt vé' },
  complaints: { path: '/admin/service/complaints', label: 'Khiếu nại' },
  revenue: { path: '/admin/reports/revenue', label: 'Doanh thu' },
});

export const ADMIN_SCREEN_ROUTES = Object.freeze(
  Object.entries(ADMIN_SECTION_ROUTES)
    .filter(([section]) => section !== 'bookings')
    .map(([section, route]) => ({
      section,
      path: route.path.replace(/^\/admin\//, ''),
    })),
);

const SECTION_BY_PATH = new Map(
  Object.entries(ADMIN_SECTION_ROUTES).map(([section, route]) => [route.path, section]),
);

export function resolveAdminSection(pathname) {
  return SECTION_BY_PATH.get(pathname) ?? null;
}
