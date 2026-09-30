import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateCinemaListQuery,
  validateMovieId,
  validateMovieListQuery,
  validateShowtimeId,
  validateShowtimeListQuery,
} from '../src/validators/catalogValidator.js';

test('movie list maps only supported filters and permits an unfiltered public request', () => {
  assert.deepEqual(validateMovieListQuery({}), { status: null, genreId: null, search: null });
  assert.deepEqual(validateMovieListQuery({ status: 'Đang chiếu', genreId: '3', search: 'Dune' }), {
    status: 'Đang chiếu', genreId: 3, search: 'Dune',
  });
});

test('catalog IDs must be positive safe integers', () => {
  assert.equal(validateMovieId('12'), 12);
  assert.equal(validateShowtimeId('9'), 9);
  for (const value of ['0', '-1', '1.5', '1e2', '9007199254740992', '']) {
    assert.throws(() => validateMovieId(value), { status: 400, code: 'INVALID_REQUEST' });
  }
});

test('filters not supported by the database contract are rejected', () => {
  assert.throws(() => validateMovieListQuery({ page: '1' }), { status: 400, code: 'UNKNOWN_QUERY_PARAMETER' });
  assert.throws(() => validateCinemaListQuery({ sort: 'name' }), { status: 400, code: 'UNKNOWN_QUERY_PARAMETER' });
});

test('cinema and showtime filters normalize and validate the SQL-supported inputs', () => {
  assert.deepEqual(validateCinemaListQuery({ city: ' Hà Nội ' }), { city: 'Hà Nội' });
  assert.deepEqual(validateShowtimeListQuery('4', { cinemaId: '2', date: '2026-09-30' }), {
    movieId: 4, cinemaId: 2, date: '2026-09-30',
  });
  assert.deepEqual(validateShowtimeListQuery('4', {}), { movieId: 4, cinemaId: null, date: null });
  assert.throws(() => validateShowtimeListQuery('4', { date: '2026-02-30' }), { status: 400, code: 'INVALID_REQUEST' });
  assert.throws(() => validateShowtimeListQuery('4', { cinemaId: '0' }), { status: 400, code: 'INVALID_REQUEST' });
});
