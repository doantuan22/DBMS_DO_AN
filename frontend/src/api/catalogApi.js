import { request } from './httpClient';

function queryString(values) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export const getMovies = async (filters = {}, options = {}) => {
  const result = await request(`/movies${queryString(filters)}`, options);
  return result.movies;
};

export const getMovieDetail = (movieId, options = {}) =>
  request(`/movies/${encodeURIComponent(movieId)}`, options);

export const getGenres = async (options = {}) => {
  const result = await request('/genres', options);
  return result.genres;
};

export const getCinemas = async (filters = {}, options = {}) => {
  const result = await request(`/cinemas${queryString(filters)}`, options);
  return result.cinemas;
};

export const getCinemaImages = async (cinemaId, options = {}) => {
  const result = await request(`/cinemas/${encodeURIComponent(cinemaId)}/images`, options);
  return result.images;
};

export const getShowtimes = async (movieId, filters = {}, options = {}) => {
  const result = await request(
    `/movies/${encodeURIComponent(movieId)}/showtimes${queryString(filters)}`,
    options,
  );
  return result.showtimes;
};

export const getShowtimeDetail = (showtimeId, options = {}) =>
  request(`/showtimes/${encodeURIComponent(showtimeId)}`, options);

export const getSeats = async (showtimeId, options = {}) => {
  const result = await request(`/showtimes/${encodeURIComponent(showtimeId)}/seats`, options);
  return result.seats;
};

export const getProducts = async (options = {}) => {
  const result = await request('/products', options);
  return result.products;
};

export const validatePromotion = (body, options = {}) =>
  request('/promotions/validate', { method: 'POST', body, ...options });

export const createBooking = (body, options = {}) =>
  request('/bookings', { method: 'POST', body, ...options });
