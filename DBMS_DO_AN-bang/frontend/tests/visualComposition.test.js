import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import { showsByCinema } from '../src/features/public/filmPresentation.js';

let vite, Hero, MovieCard, MovieGrid, ShowtimeBrowser, ShowtimeList, TimeChip, DateRail;
before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    cacheDir: '../.audit-output/vcr/ssr-cache',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ default: Hero } = await vite.ssrLoadModule('/src/features/public/FeaturedBillboard.jsx'));
  ({ default: MovieCard } = await vite.ssrLoadModule('/src/components/MovieCard.jsx'));
  ({ default: MovieGrid } = await vite.ssrLoadModule('/src/components/MovieGrid.jsx'));
  ({ default: ShowtimeBrowser, ShowtimeList } = await vite.ssrLoadModule(
    '/src/components/ShowtimeBrowser.jsx',
  ));
  ({ default: TimeChip } = await vite.ssrLoadModule('/src/features/public/ShowtimeTimeChip.jsx'));
  ({ default: DateRail } = await vite.ssrLoadModule('/src/features/public/DateRail.jsx'));
});
after(async () => {
  await vite?.close();
});
const render = (Page, props) =>
  renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Page, props)));
const movie = {
  id: 91,
  title: 'Một tựa phim Việt dài có nhiều dấu để kiểm tra bố cục',
  status: 'Đang chiếu',
  durationMinutes: 131,
  ageRating: 'T18',
  genres: ['Tình cảm'],
  posterUrl: 'https://studio.example/actual-record-poster.jpg',
};
const show = {
  id: 73,
  cinemaId: 9,
  cinemaName: 'Rạp thử nghiệm',
  roomName: 'Phòng A',
  format: '2D',
  startsAt: '2026-10-14T11:00:00Z',
  date: '2026-10-14',
  basePrice: 85000,
  availableSeats: 7,
};

test('poster hero uses the supplied record URL and keeps full original description/license accessible', () => {
  const description =
    'Nội dung nguyên văn từ API. [DEMO_SCENARIO: mô phỏng.] Poster: Tác giả; CC BY 4.0; https://creativecommons.org/licenses/by/4.0';
  const html = render(Hero, { movie, description });
  assert.match(html, /actual-record-poster\.jpg/);
  assert.match(html, /fetchPriority="high"/);
  assert.match(html, /href="#home-schedule"/);
  assert.match(html, /href="\/movies\/91"/);
  assert.match(html, /<details/);
  assert.match(html, /CC BY 4.0/);
  assert.doesNotMatch(html, /backdrop|IMDb|https:\/\/images\.unsplash/);
});
test('loading and empty hero cannot imply a film or bookable showtime exists', () => {
  const loading = render(Hero, { loading: true });
  assert.match(loading, /aria-busy="true"/);
  assert.doesNotMatch(loading, /Chọn suất chiếu/);
  const empty = render(Hero, {});
  assert.match(empty, /href="\/movies"/);
  assert.doesNotMatch(empty, /href="#home-schedule"/);
});
test('compact missing-artwork announcement retains the complete title and actual status without a fake poster', () => {
  const html = render(MovieCard, { movie: { ...movie, posterUrl: null }, compact: true });
  assert.match(html, new RegExp(movie.title));
  assert.match(html, /Đang chiếu/);
  assert.match(html, /Chưa có poster/);
  assert.match(html, /href="\/movies\/91"/);
  assert.doesNotMatch(html, /<img|customer-media/);
});
test('catalog artwork/announcement layout retains all supplied movies and does not fabricate missing art', () => {
  const html = render(MovieGrid, {
    movies: [
      movie,
      { ...movie, id: 92, title: 'Phim chưa có ảnh', posterUrl: null, status: 'Sắp chiếu' },
    ],
  });
  assert.match(html, /href="\/movies\/91"/);
  assert.match(html, /href="\/movies\/92"/);
  assert.equal((html.match(/<article/g) ?? []).length, 2);
  assert.equal((html.match(/<img/g) ?? []).length, 1);
});
test('cinema grouping preserves IDs, including cinemas that share the same display name', () => {
  const rows = [show, { ...show, id: 74 }, { ...show, id: 75, cinemaId: 10 }];
  const groups = showsByCinema(rows);
  assert.equal(groups.length, 2);
  assert.deepEqual(
    groups.map((g) => g.shows.map((s) => s.id)),
    [[73, 74], [75]],
  );
});
test('time chip links the actual showtime and displays only prices/counts supplied by the API', () => {
  const html = render(TimeChip, { showtime: show });
  assert.match(html, /href="\/booking\/73"/);
  assert.match(html, /85\.000/);
  assert.match(html, /7 ghế trống/);
  const unknown = render(TimeChip, {
    showtime: { ...show, basePrice: null, availableSeats: null },
  });
  assert.doesNotMatch(unknown, /Giá cơ bản|ghế trống/);
});
test('fixed cinema view removes redundant cinema control while preserving real booking links', () => {
  const html = render(ShowtimeBrowser, {
    cinemas: [{ id: 9, name: show.cinemaName }],
    cinemaId: '9',
    cinemaReadOnly: true,
    date: '',
    state: { status: 'success', data: [show] },
    onDateChange() {},
  });
  assert.doesNotMatch(html, /<select/);
  assert.match(html, /Chọn ngày chiếu/);
  assert.match(html, /href="\/booking\/73"/);
});
test('showtime grouping preserves every actual slot across different dates', () => {
  const html = render(ShowtimeList, {
    state: {
      status: 'success',
      data: [show, { ...show, id: 74, date: '2026-10-15', startsAt: '2026-10-15T11:00:00Z' }],
    },
  });
  assert.match(html, /14\/10\/2026/);
  assert.match(html, /15\/10\/2026/);
  assert.match(html, /href="\/booking\/73"/);
  assert.match(html, /href="\/booking\/74"/);
});
test('date rail renders exactly the supplied dates and marks only the controlled selection', () => {
  const html = render(DateRail, {
    dates: ['2026-10-14', '2026-10-15'],
    selected: '2026-10-15',
    onSelect() {},
  });
  assert.equal((html.match(/aria-pressed/g) ?? []).length, 2);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /16\/10\/2026/);
});
