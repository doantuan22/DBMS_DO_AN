import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdminService } from '../src/services/adminService.js';

// F-07: admin write responses are procedure rows, never the mssql driver envelope.
const envelope = (row) => ({
  recordsets: [[row]],
  recordset: [row],
  output: {},
  rowsAffected: [1],
});
const service = (row) => createAdminService({ execute: async () => envelope(row) });
const showtime = {
  movieId: 1,
  roomId: 2,
  startsAt: '2031-01-01T10:00:00Z',
  endsAt: '2031-01-01T12:00:00Z',
  format: '2D',
  basePrice: 50000,
  status: 'Mở bán',
};
const movie = {
  title: 'M',
  durationMinutes: 100,
  releaseDate: '2031-01-01',
  genreIds: [1],
  status: 'Đang chiếu',
};

test('createShowtime / updateShowtime / updateMovie return the first result row', async () => {
  assert.deepEqual(await service({ SuatChieuID: 7 }).createShowtime(1, showtime), {
    SuatChieuID: 7,
  });
  assert.deepEqual(await service({ SuatChieuID: 7 }).updateShowtime(1, 7, showtime), {
    SuatChieuID: 7,
  });
  assert.deepEqual(await service({ PhimID: 3 }).updateMovie(1, 3, movie), { PhimID: 3 });
});

test('an empty result set becomes null, not a driver envelope', async () => {
  const empty = createAdminService({
    execute: async () => ({ recordsets: [[]], recordset: [], rowsAffected: [0] }),
  });
  assert.equal(await empty.updateShowtime(1, 7, showtime), null);
});
