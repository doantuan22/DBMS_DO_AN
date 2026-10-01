import { request } from './httpClient';

export const getReviews = (movieId, options) => request(`/movies/${encodeURIComponent(movieId)}/reviews`, options);
export const createReview = (movieId, review) => request(`/movies/${encodeURIComponent(movieId)}/reviews`, { method: 'POST', body: review });
export const getComplaints = () => request('/complaints');
export const createComplaint = (complaint) => request('/complaints', { method: 'POST', body: complaint });
export const getComplaint = (complaintId) => request(`/complaints/${encodeURIComponent(complaintId)}`);
