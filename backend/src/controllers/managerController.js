import { managerService } from '../services/managerService.js';
import { HttpError } from '../utils/httpError.js';
import * as validators from '../validators/managerValidator.js';

const handle =
  (action, status = 200) =>
  async (req, res, next) => {
    try {
      res.status(status).json(await action(req));
    } catch (error) {
      next(error);
    }
  };

function cancelReason(body = {}) {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).some((key) => key !== 'reason') ||
    (body.reason !== undefined && (typeof body.reason !== 'string' || body.reason.length > 255))
  ) {
    throw new HttpError(400, 'INVALID_REQUEST', 'reason must be text up to 255 characters.');
  }
  return body.reason;
}

export const listCinemas = handle(async (req) => ({
  cinemas: await managerService.listCinemas(req.user.userId),
}));

export const listRooms = handle(async (req) => ({
  rooms: await managerService.listRooms(req.user.userId, validators.cinemaId(req.params.cinemaId)),
}));

export const createRoom = handle(
  async (req) => ({
    room: await managerService.createRoom(
      req.user.userId,
      validators.cinemaId(req.params.cinemaId),
      validators.roomCreate(req.body),
    ),
  }),
  201,
);

export const updateRoom = handle(async (req) => ({
  room: await managerService.updateRoom(
    req.user.userId,
    validators.roomId(req.params.roomId),
    validators.roomUpdate(req.body),
  ),
}));

export const deleteRoom = handle(async (req) =>
  managerService.deleteRoom(req.user.userId, validators.roomId(req.params.roomId)),
);

export const listSeats = handle(async (req) => ({
  seats: await managerService.listSeats(req.user.userId, validators.roomId(req.params.roomId)),
}));

export const createSeat = handle(
  async (req) => ({
    seat: await managerService.createSeat(
      req.user.userId,
      validators.roomId(req.params.roomId),
      validators.seatCreate(req.body),
    ),
  }),
  201,
);

export const updateSeat = handle(async (req) => ({
  seat: await managerService.updateSeat(
    req.user.userId,
    validators.seatId(req.params.seatId),
    validators.seatUpdate(req.body),
  ),
}));

export const deleteSeat = handle(async (req) => {
  await managerService.deleteSeat(req.user.userId, validators.seatId(req.params.seatId));
  return { deleted: true };
});

export const listShowtimes = handle(async (req) => ({
  showtimes: await managerService.listShowtimes(
    req.user.userId,
    validators.cinemaId(req.params.cinemaId),
    validators.dateRange(req.query),
  ),
}));

export const createShowtime = handle(
  async (req) => ({
    showtime: await managerService.createShowtime(
      req.user.userId,
      validators.showtimeCreate(req.body),
    ),
  }),
  201,
);

export const updateShowtime = handle(async (req) => ({
  showtime: await managerService.updateShowtime(
    req.user.userId,
    validators.showtimeId(req.params.showtimeId),
    validators.showtimeUpdate(req.body),
  ),
}));

export const cancelShowtime = handle(async (req) => {
  await managerService.cancelShowtime(
    req.user.userId,
    validators.showtimeId(req.params.showtimeId),
    cancelReason(req.body),
  );
  return { cancelled: true };
});

export const listPricing = handle(async (req) => ({
  pricing: await managerService.listPricing(
    req.user.userId,
    validators.cinemaId(req.params.cinemaId),
  ),
}));

export const createPricing = handle(
  async (req) => ({
    pricing: await managerService.createPricing(
      req.user.userId,
      validators.cinemaId(req.params.cinemaId),
      validators.pricingCreate(req.body),
    ),
  }),
  201,
);

export const updatePricing = handle(async (req) => ({
  pricing: await managerService.updatePricing(
    req.user.userId,
    validators.pricingId(req.params.pricingId),
    validators.pricingUpdate(req.body),
  ),
}));

export const dashboard = handle(async (req) => ({
  dashboard: await managerService.dashboard(
    req.user.userId,
    validators.cinemaId(req.params.cinemaId),
  ),
}));

export const revenue = handle(async (req) => ({
  revenue: await managerService.revenue(
    req.user.userId,
    validators.cinemaId(req.params.cinemaId),
    validators.dateRange(req.query),
  ),
}));
