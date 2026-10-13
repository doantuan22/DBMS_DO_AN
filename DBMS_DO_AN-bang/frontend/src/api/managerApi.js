import { request } from './httpClient';
const id = encodeURIComponent;
export const getAssignedCinemas = () => request('/manager/cinemas');
export const getRooms = (cinemaId) => request(`/manager/cinemas/${id(cinemaId)}/rooms`);
export const createRoom = (cinemaId, body) =>
  request(`/manager/cinemas/${id(cinemaId)}/rooms`, { method: 'POST', body });
export const updateRoom = (roomId, body) =>
  request(`/manager/rooms/${id(roomId)}`, { method: 'PUT', body });
export const deleteRoom = (roomId) => request(`/manager/rooms/${id(roomId)}`, { method: 'DELETE' });
export const getSeats = (roomId) => request(`/manager/rooms/${id(roomId)}/seats`);
export const createSeat = (roomId, body) =>
  request(`/manager/rooms/${id(roomId)}/seats`, { method: 'POST', body });
export const updateSeat = (seatId, body) =>
  request(`/manager/seats/${id(seatId)}`, { method: 'PUT', body });
export const deleteSeat = (seatId) => request(`/manager/seats/${id(seatId)}`, { method: 'DELETE' });
export const getManagerShowtimes = (cinemaId, query = '') =>
  request(`/manager/cinemas/${id(cinemaId)}/showtimes${query}`);
export const createManagerShowtime = (body) =>
  request('/manager/showtimes', { method: 'POST', body });
export const updateManagerShowtime = (showtimeId, body) =>
  request(`/manager/showtimes/${id(showtimeId)}`, { method: 'PUT', body });
export const cancelManagerShowtime = (showtimeId, reason) =>
  request(`/manager/showtimes/${id(showtimeId)}/cancel`, {
    method: 'POST',
    body: reason ? { reason } : {},
  });
export const getPricing = (cinemaId) => request(`/manager/cinemas/${id(cinemaId)}/pricing`);
export const createPricing = (cinemaId, body) =>
  request(`/manager/cinemas/${id(cinemaId)}/pricing`, { method: 'POST', body });
export const updatePricing = (pricingId, body) =>
  request(`/manager/pricing/${id(pricingId)}`, { method: 'PUT', body });
export const getDashboard = (cinemaId) => request(`/manager/cinemas/${id(cinemaId)}/dashboard`);
export const getRevenue = (cinemaId, query = '') =>
  request(`/manager/cinemas/${id(cinemaId)}/revenue${query}`);
