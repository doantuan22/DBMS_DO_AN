import { request } from './httpClient';

export const registerCustomer = (body) => request('/auth/register', { method: 'POST', body });
export const login = (body) => request('/auth/login', { method: 'POST', body });
export const getCurrentUser = (options) => request('/auth/me', options);
export const updateCurrentUser = (body) => request('/auth/me', { method: 'PUT', body });
export const getCurrentPermissions = (options) => request('/auth/permissions', options);
