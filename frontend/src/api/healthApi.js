import { request } from './httpClient';

export const getHealth = () => request('/health');
export const getDatabaseHealth = (options) => request('/health/db', options);
