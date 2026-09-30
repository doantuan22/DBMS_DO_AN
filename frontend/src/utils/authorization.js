import { ROLE_AREAS } from '../constants/roles.js';

export const userHasPermission = (user, permission) =>
  Boolean(user?.permissions?.some((item) => item.code === permission));

export const userCanEnterArea = (user, role, permission) =>
  Boolean(user && user.role === role && (!permission || userHasPermission(user, permission)));

export const visibleAreasFor = (user) => user
  ? Object.entries(ROLE_AREAS).filter(([, area]) => userHasPermission(user, area.permission))
  : [];
