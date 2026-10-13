import assert from 'node:assert/strict';
import test from 'node:test';
import { recordMediaUrl, trailerUrl } from '../src/features/public/mediaPolicy.js';

test('record artwork rejects stock hosts rather than labelling stock as a film or named cinema', () => {
  for (const url of [
    'https://images.unsplash.com/photo-123',
    'https://images.pexels.com/photos/123/a.jpg',
    'https://pixabay.com/cinema.jpg',
  ])
    assert.equal(recordMediaUrl(url), null);
  assert.equal(recordMediaUrl(null), null);
});
test('existing record URL transport and genuine source URLs remain unchanged without id mappings', () => {
  for (const url of ['https://studio.example/film/keyart.jpg', '/uploads/cinema-original.jpg'])
    assert.equal(recordMediaUrl(url), url);
  assert.equal(recordMediaUrl('javascript:alert(1)'), null);
  assert.equal(recordMediaUrl('data:image/svg+xml,bad'), null);
});
test('placeholder YouTube trailers do not become actionable controls', () => {
  assert.equal(trailerUrl('https://youtube.com/watch?v=exampleMai'), null);
  assert.equal(trailerUrl('https://youtube.com/watch?v=exampleConan'), null);
  assert.equal(trailerUrl('javascript:alert(1)'), null);
  assert.equal(
    trailerUrl('https://youtube.com/watch?v=Way9Dexny3w'),
    'https://youtube.com/watch?v=Way9Dexny3w',
  );
});
