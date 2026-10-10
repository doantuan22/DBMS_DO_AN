import { ROLE_AREAS } from '../constants/roles.js';

export const userHasPermission = (user, permission) =>
  Boolean(user?.permissions?.some((item) => item.code === permission));

export const userCanEnterArea = (user, role, permission) =>
  Boolean(user && user.role === role && (!permission || userHasPermission(user, permission)));

export const visibleAreasFor = (user) =>
  user
    ? Object.entries(ROLE_AREAS).filter(([role, area]) =>
        userCanEnterArea(user, role, area.permission),
      )
    : [];

export const userCanAct = (user, role, ...permissions) =>
  Boolean(
    user?.role === role && permissions.every((permission) => userHasPermission(user, permission)),
  );

export const ADMIN_SECTION_PERMISSIONS = Object.freeze({
  dashboard: 'XEM_BAO_CAO_TOANHE',
  revenue: 'XEM_BAO_CAO_TOANHE',
  users: 'QL_NGUOIDUNG',
  roles: 'QL_VAITRO',
  permissions: 'QL_QUYEN',
  assignments: 'PHANCONG_RAP',
  cinemas: 'QL_RAP',
  cinemaImages: 'QL_RAP',
  rooms: 'QL_PHONG',
  seats: 'QL_GHE',
  movies: 'QL_DANHMUC_PHIM',
  actors: 'QL_DANHMUC_PHIM',
  genres: 'QL_THELOAI',
  products: 'QL_SANPHAM',
  promotions: 'QL_KHUYENMAI',
  pricing: 'QL_BANG_GIA',
  showtimes: 'QL_SUAT_CHIEU',
  complaints: 'QL_KHIEUNAI',
});

// Only authorized sections are requested; each failure remains local to its section.
export async function loadAuthorizedSections(user, role, sections) {
  const entries = Object.entries(sections).filter(([, section]) =>
    userCanAct(user, role, section.permission),
  );
  const results = await Promise.allSettled(entries.map(([, section]) => section.load()));
  return Object.fromEntries(
    entries.map(([key], index) => [
      key,
      results[index].status === 'fulfilled'
        ? { status: 'success', data: results[index].value }
        : { status: 'error', error: results[index].reason },
    ]),
  );
}
