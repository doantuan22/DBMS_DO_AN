import { request } from './httpClient';

export const getHealth = () => request('/health');
