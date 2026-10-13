import assert from 'node:assert/strict';
import test from 'node:test';
import { synopsisExcerpt, filmMetadata } from '../src/features/public/filmPresentation.js';

test('hero excerpt is a verbatim sentence and never rewrites or removes full API content', () => {
  const synopsis = 'Cô gái Sintel tìm kiếm chú rồng Scales trên một hành trình đầy mất mát.';
  const description =
    synopsis +
    ' [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2010.] Poster: Blender Foundation; CC BY 3.0; https://creativecommons.org/licenses/by/3.0';
  assert.equal(synopsisExcerpt(description), synopsis);
  assert.ok(description.startsWith(synopsisExcerpt(description)));
  assert.ok(description.includes('CC BY 3.0'));
});
test('plain/null/multiline descriptions need no seed ID map or fabricated synopsis', () => {
  assert.equal(synopsisExcerpt(null), null);
  assert.equal(synopsisExcerpt('   '), null);
  assert.equal(
    synopsisExcerpt('Một câu chuyện chưa có dấu kết thúc'),
    'Một câu chuyện chưa có dấu kết thúc',
  );
  assert.equal(synopsisExcerpt('Câu thứ nhất.\nCâu thứ hai.'), 'Câu thứ nhất.');
});
test('film metadata preserves real API values and omits unknown facts', () => {
  assert.deepEqual(
    filmMetadata({ ageRating: 'T18', durationMinutes: 131, genres: ['Tình cảm', 'Tâm lý'] }),
    ['T18', '131 phút', 'Tình cảm', 'Tâm lý'],
  );
  assert.deepEqual(filmMetadata({ durationMinutes: null, ageRating: null, genres: [] }), []);
  assert.deepEqual(filmMetadata(null), []);
});
