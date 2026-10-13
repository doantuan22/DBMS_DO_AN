import { request } from './httpClient';

export function createStaffBookingApi(portal) {
  if (!['admin', 'manager'].includes(portal)) throw new Error('Unsupported booking portal');
  const base = `/${portal}/bookings`;
  const query = (values) => {
    const params = new URLSearchParams(Object.entries(values).filter(([, value]) => value != null && value !== ''));
    return params.size ? `?${params}` : '';
  };
  return {
    list: (filters, signal) => request(base + query(filters), { signal }),
    customers: (search, signal) => request(`${base}/customers${query({ search })}`, { signal }),
    options: (values, signal) => request(`${base}/options${query(values)}`, { signal }),
    detail: (id, signal) => request(`${base}/${id}`, { signal }),
    create: (body) => request(base, { method: 'POST', body }),
    updateSeats: (id, body) => request(`${base}/${id}/seats`, { method: 'PUT', body }),
    cancel: (id) => request(`${base}/${id}/cancel`, { method: 'POST', body: {} }),
  };
}
