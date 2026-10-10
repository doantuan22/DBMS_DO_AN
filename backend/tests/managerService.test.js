import assert from 'node:assert/strict';
import test from 'node:test';
import { createManagerService } from '../src/services/managerService.js';
import {
  dateRange,
  roomCreate,
  seatCreate,
  showtimeCreate,
} from '../src/validators/managerValidator.js';

const sqlError = (number) => Object.assign(new Error('SQL'), { number });

test('R2 cancellation with active holds maps to 409 and a stable reason', async () => {
  const service = createManagerService({
    execute: async () => {
      throw sqlError(50118);
    },
  });
  await assert.rejects(service.cancelShowtime(2, 1), {
    status: 409,
    code: 'SHOWTIME_HAS_HELD_ORDERS',
  });
});

test('manager services pass the authenticated manager identity to scoped procedures', async () => {
  const calls = [];
  const service = createManagerService({
    execute: async (key, params) => {
      calls.push({ key, params });
      return {
        recordset: [
          {
            PhongID: 8,
            RapID: 1,
            TenPhong: 'Room',
            LoaiPhong: '2D',
            TrangThai: 'Hoạt động',
            TongSoGhe: 10,
          },
        ],
      };
    },
  });
  const rooms = await service.listRooms(2, 1);
  assert.equal(calls[0].key, 'MANAGER_ROOM_LIST');
  assert.equal(calls[0].params.NguoiDungID.value, 2);
  assert.equal(calls[0].params.RapID.value, 1);
  assert.deepEqual(rooms[0], {
    id: 8,
    cinemaId: 1,
    cinemaName: undefined,
    name: 'Room',
    type: '2D',
    status: 'Hoạt động',
    seatCount: 10,
  });
});

test('database scope and showtime conflict errors become safe business errors', async () => {
  await assert.rejects(
    createManagerService({
      execute: async () => {
        throw sqlError(50050);
      },
    }).listRooms(2, 2),
    { status: 403, code: 'MANAGER_CINEMA_FORBIDDEN' },
  );
  await assert.rejects(
    createManagerService({
      execute: async () => {
        throw sqlError(50001);
      },
    }).createShowtime(2, {
      movieId: 1,
      roomId: 1,
      startsAt: '2027-01-01T10:00:00Z',
      endsAt: '2027-01-01T12:00:00Z',
      format: '2D',
      basePrice: 1,
    }),
    { status: 409, code: 'SHOWTIME_OVERLAP' },
  );
});

test('manager validators use only database contract fields and valid date ranges', () => {
  assert.deepEqual(roomCreate({ name: 'A', type: 'IMAX' }), { name: 'A', type: 'IMAX' });
  assert.deepEqual(seatCreate({ row: 'A', number: 1 }), { row: 'A', number: 1, type: 'Thường' });
  assert.equal(
    showtimeCreate({
      movieId: 1,
      roomId: 1,
      startsAt: '2027-01-01T10:00:00Z',
      endsAt: '2027-01-01T12:00:00Z',
      basePrice: 1,
    }).format,
    '2D',
  );
  assert.deepEqual(dateRange({ fromDate: '2027-01-01', toDate: '2027-01-02' }), {
    fromDate: '2027-01-01',
    toDate: '2027-01-02',
  });
  assert.throws(() => dateRange({ fromDate: '2027-01-03', toDate: '2027-01-02' }), {
    code: 'INVALID_REQUEST',
  });
});

test('overlapping active pricing rules become 409 for managers too', async () => {
  const failing = createManagerService({
    execute: async () => {
      throw sqlError(50215);
    },
  });
  const input = {
    seatType: 'VIP',
    dayType: 'Tất cả',
    format: '2D',
    surcharge: 1000,
    startsOn: '2030-01-01',
    endsOn: null,
    status: 'Áp dụng',
  };
  await assert.rejects(failing.createPricing(2, 1, input), {
    status: 409,
    code: 'PRICING_OVERLAP',
  });
  await assert.rejects(failing.updatePricing(2, 5, input), {
    status: 409,
    code: 'PRICING_OVERLAP',
  });
});
