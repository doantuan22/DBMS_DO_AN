import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createServer } from 'vite';

let vite;
let Home;
let Movies;
let Cinemas;
let MovieDetail;
let BookingPreparation;
let MovieCard;
let ShowtimeBrowser;
let AppRoutes;
let AuthProvider;

before(async () => {
  vite = await createServer({ configFile: 'vite.config.js', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  ({ default: Home } = await vite.ssrLoadModule('/src/pages/Home.jsx'));
  ({ default: Movies } = await vite.ssrLoadModule('/src/pages/Movies.jsx'));
  ({ default: Cinemas } = await vite.ssrLoadModule('/src/pages/Cinemas.jsx'));
  ({ default: MovieDetail } = await vite.ssrLoadModule('/src/pages/MovieDetail.jsx'));
  ({ default: BookingPreparation } = await vite.ssrLoadModule('/src/pages/BookingPreparation.jsx'));
  ({ default: MovieCard } = await vite.ssrLoadModule('/src/components/MovieCard.jsx'));
  ({ default: ShowtimeBrowser } = await vite.ssrLoadModule('/src/components/ShowtimeBrowser.jsx'));
  ({ default: AppRoutes } = await vite.ssrLoadModule('/src/routes/index.jsx'));
  ({ AuthProvider } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'));
});

after(async () => { await vite?.close(); });

function render(component) { return renderToStaticMarkup(component); }

test('home, movie list, and cinema list render loading states', () => {
  const inRouter = (page) => React.createElement(MemoryRouter, null, page);
  assert.match(render(inRouter(React.createElement(Home))), /Đang tải danh sách phim/);
  const movies = render(inRouter(React.createElement(Movies)));
  assert.match(movies, /Danh sách phim/);
  assert.match(movies, /Tìm phim hoặc đạo diễn/);
  assert.match(render(inRouter(React.createElement(Cinemas))), /Đang tải danh sách rạp/);
});

test('movie cards link to the real movie identifier', () => {
  const html = render(React.createElement(MemoryRouter, null, React.createElement(MovieCard, {
    movie: { id: 42, title: 'Database movie', durationMinutes: 100, posterUrl: null, genres: [] },
  })));
  assert.match(html, /href="\/movies\/42"/);
  assert.match(html, /Database movie/);
});

test('movie detail and selected-showtime route render loading shells for guests', () => {
  const detail = render(React.createElement(MemoryRouter, { initialEntries: ['/movies/4'] },
    React.createElement(Routes, null, React.createElement(Route, { path: '/movies/:movieId', element: React.createElement(MovieDetail) }))));
  const booking = render(React.createElement(MemoryRouter, { initialEntries: ['/booking/5'] },
    React.createElement(Routes, null, React.createElement(Route, { path: '/booking/:showtimeId', element: React.createElement(BookingPreparation) }))));
  assert.match(detail, /Đang tải thông tin phim/);
  assert.match(booking, /Đang xác nhận suất chiếu/);
});

test('cinema/date selectors render API-backed choices and showtime selection carries its ID', () => {
  const html = render(React.createElement(MemoryRouter, null, React.createElement(ShowtimeBrowser, {
    cinemas: [{ id: 9, name: 'Cinema Nine', city: 'Hanoi' }],
    cinemaId: '9', date: '2026-09-30', onCinemaChange() {}, onDateChange() {},
    state: { status: 'success', data: [{ id: 73, startTime: '19:30', endTime: '21:00', cinemaName: 'Cinema Nine', roomName: 'Room A', format: '2D', basePrice: 85000 }] },
  })));
  assert.match(html, /<option value="9" selected="">Cinema Nine/);
  assert.match(html, /type="date" value="2026-09-30"/);
  assert.match(html, /href="\/booking\/73"/);
});

test('showtime browser has empty and loading states', () => {
  const base = { cinemas: [], cinemaId: '', date: '', onCinemaChange() {}, onDateChange() {} };
  const loading = render(React.createElement(ShowtimeBrowser, { ...base, state: { status: 'loading' } }));
  const empty = render(React.createElement(ShowtimeBrowser, { ...base, state: { status: 'empty', data: [] } }));
  assert.match(loading, /Đang tải lịch chiếu/);
  assert.match(empty, /Không có suất chiếu phù hợp/);
});

test('guest can render the public movie route without authentication', () => {
  const html = render(React.createElement(MemoryRouter, { initialEntries: ['/movies'] },
    React.createElement(AuthProvider, null, React.createElement(AppRoutes))));
  assert.match(html, /Danh sách phim/);
  assert.match(html, /Đang tải danh sách phim/);
  assert.match(html, /Đăng nhập/);
});
