import assert from 'node:assert/strict';
import test from 'node:test';
import { loadResource, localDateString, showtimeFilters } from '../src/services/catalogResource.js';

test('catalog resources represent success, empty results, and errors', async () => {
  assert.deepEqual(await loadResource(async () => [{ id: 1 }]), {
    status: 'success',
    data: [{ id: 1 }],
  });
  assert.deepEqual(await loadResource(async () => []), { status: 'empty', data: [] });
  const error = new Error('offline');
  assert.deepEqual(
    await loadResource(async () => {
      throw error;
    }),
    { status: 'error', error },
  );
});

test('showtime filters omit unselected values and use a stable local calendar date', () => {
  assert.deepEqual(showtimeFilters('', ''), {});
  assert.deepEqual(showtimeFilters('3', '2026-09-30'), { cinemaId: '3', date: '2026-09-30' });
  assert.equal(localDateString(new Date('2026-09-30T16:00:00Z')), '2026-09-30');
});
