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
