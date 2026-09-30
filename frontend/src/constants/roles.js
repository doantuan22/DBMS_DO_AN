// Role codes as defined in the analysis document (bảng VAITRO).
export const ROLES = Object.freeze({
  CUSTOMER: 'KHACH_HANG',
  MANAGER: 'QUAN_LY_RAP',
  SUPPORT: 'CSKH',
  ADMIN: 'ADMIN',
});

// Base path of each application area.
export const AREA_PATHS = Object.freeze({
  PUBLIC: '/',
  CUSTOMER: '/account',
  MANAGER: '/manager',
  SUPPORT: '/support',
  ADMIN: '/admin',
});

export const ROLE_AREAS = Object.freeze({
  [ROLES.CUSTOMER]: { path: AREA_PATHS.CUSTOMER, label: 'Khách hàng', permission: 'DAT_VE' },
  [ROLES.MANAGER]: { path: AREA_PATHS.MANAGER, label: 'Quản lý rạp', permission: 'QL_PHONG' },
  [ROLES.SUPPORT]: { path: AREA_PATHS.SUPPORT, label: 'CSKH', permission: 'QL_KHIEUNAI' },
  [ROLES.ADMIN]: { path: AREA_PATHS.ADMIN, label: 'Quản trị', permission: 'QL_NGUOIDUNG' },
});
