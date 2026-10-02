import { catalogService } from '../services/catalogService.js';
import {
  validateCinemaListQuery,
  validateCinemaId,
  validateMovieId,
  validateMovieListQuery,
  validateShowtimeId,
  validateShowtimeListQuery,
} from '../validators/catalogValidator.js';

const handle = (action) => async (req, res, next) => {
  try {
    res.json(await action(req));
  } catch (error) {
    next(error);
  }
};

export const listGenres = handle(async () => ({ genres: await catalogService.listGenres() }));
export const listMovies = handle(async (req) => ({ movies: await catalogService.listMovies(validateMovieListQuery(req.query)) }));
export const getMovieDetail = handle((req) => catalogService.getMovieDetail(validateMovieId(req.params.movieId)));
export const listCinemas = handle(async (req) => ({ cinemas: await catalogService.listCinemas(validateCinemaListQuery(req.query)) }));
export const listCinemaImages = handle(async (req) => ({ images: await catalogService.listCinemaImages(validateCinemaId(req.params.cinemaId)) }));
export const listShowtimes = handle(async (req) => ({ showtimes: await catalogService.listShowtimes(validateShowtimeListQuery(req.params.movieId, req.query)) }));
export const getShowtimeDetail = handle((req) => catalogService.getShowtimeDetail(validateShowtimeId(req.params.showtimeId)));
