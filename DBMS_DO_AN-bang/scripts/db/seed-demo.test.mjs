import assert from 'node:assert/strict';
import test from 'node:test';
import { main, targets } from './seed-demo.mjs';
import { read, dbRoot, expandSql } from './lib.mjs';
import path from 'node:path';
for (const database of [
  undefined,
  'CinemaBookingDB',
  'CinemaBookingDB_Production',
  'CinemaBookingDB_R0_UNKNOWN',
  'CinemaBookingDB_R0_REAL_MEDIA_TEST_20261012;DROP DATABASE CinemaBookingDB',
])
  test('Reject unapproved target ' + database, async () => {
    await assert.rejects(
      main(['reset', ...(database ? ['--database=' + database] : [])]),
      /allowlist/,
    );
  });
test('Only two exact configured disposable targets', () => assert.equal(targets.length, 2));
test('Canonical seed refuses Main before starting transaction', () => {
  const source = expandSql('10_seed/seed-all.sql');
  assert.ok(source.indexOf('Seed refuses Main') < source.indexOf('BEGIN TRANSACTION'));
  assert.ok(!/USE\s+CinemaBookingDB\s*;/i.test(source));
  assert.ok(!source.includes('admin@cinemadb.vn'));
  assert.ok(!/NOCHECK|DISABLE TRIGGER|TRUNCATE TABLE/i.test(source));
});
test('Every seeded movie URL comes from a visually verified licensed manifest', () => {
  const movies = JSON.parse(read(path.join(dbRoot, '10_seed/media/movie-media-manifest.json')));
  assert.equal(movies.length, 18);
  for (const f of movies.filter((f) => f.posterUrl)) {
    assert.equal(f.status, 'VALID');
    assert.equal(f.visualVerified, true);
    assert.ok(
      f.transport.status === 200 &&
        f.transport.width >= 400 &&
        f.transport.contentType.startsWith('image/'),
    );
    assert.ok(f.sourcePage.startsWith('https://commons.wikimedia.org/wiki/File:'));
    assert.ok(!/unsplash|pexels/.test(f.posterUrl));
  }
  assert.equal(movies.filter((f) => f.posterUrl).length, 9);
  assert.ok(
    movies.filter((f) => f.status === 'BLOCKED_LICENSE').every((f) => f.posterUrl === null),
  );
});
test('Lifecycle is sourced once by the dynamic wrapper', () => {
  const wrapper = read(path.join(dbRoot, '10_seed/seed_demo_dynamic/070_transactions.sql'));
  assert.ok(wrapper.includes(':r ./10_seed/test_fixture/lifecycle-v2.sql'));
  assert.ok(!wrapper.includes('INSERT INTO dbo.DONDATVE'));
});
