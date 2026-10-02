import { request } from './httpClient.js';

const get = (path, params = {}) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value != null && value !== '')).toString();
  return request(`/admin/${path}${query ? `?${query}` : ''}`);
};

export const adminApi = {
  dashboard: () => get('dashboard'),
  users: (params) => get('users', params),
  roles: () => get('roles'),
  rolePermissions: (id) => get(`roles/${id}/permissions`),
  permissions: () => get('permissions'),
  assignments: () => get('assignments'),
  cinemas: () => get('cinemas'),
  movies: () => get('movies'),
  genres: () => get('genres'),
  actors: () => get('actors'),
  products: () => get('products'),
  promotions: () => get('promotions'),
  complaints: (params) => get('complaints', params),
  complaint: (id) => get(`complaints/${id}`),
  complaintOrderReference: (id) => get(`complaints/${id}/order-reference`),
  addComplaintProcessing: (id, body) => request(`/admin/complaints/${id}/processings`, { method: 'POST', body }),
  updateComplaintStatus: (id, body) => request(`/admin/complaints/${id}/status`, { method: 'PUT', body }),
  revenue: (params) => get('reports/revenue', params),
  rooms: (params) => get('rooms', params),
  seats: (params) => get('seats', params),
  pricing: (params) => get('pricing', params),
  showtimes: (params) => get('showtimes', params),
  cinemaImages: (cinemaId) => get(`cinemas/${encodeURIComponent(cinemaId)}/images`),
  createCinemaImage: (cinemaId, body) => request(`/admin/cinemas/${encodeURIComponent(cinemaId)}/images`, { method: 'POST', body }),
  updateCinemaImage: (cinemaId, imageId, body) => request(`/admin/cinemas/${encodeURIComponent(cinemaId)}/images/${encodeURIComponent(imageId)}`, { method: 'PUT', body }),
  deleteCinemaImage: (cinemaId, imageId) => request(`/admin/cinemas/${encodeURIComponent(cinemaId)}/images/${encodeURIComponent(imageId)}`, { method: 'DELETE' }),
  setCinemaImageCover: (cinemaId, imageId) => request(`/admin/cinemas/${encodeURIComponent(cinemaId)}/images/${encodeURIComponent(imageId)}/cover`, { method: 'PATCH', body: { cover: true } }),
  create: (path, body) => request(`/admin/${path}`, { method: 'POST', body }),
  update: (path, body) => request(`/admin/${path}`, { method: 'PUT', body }),
  remove: (path) => request(`/admin/${path}`, { method: 'DELETE' }),
};
