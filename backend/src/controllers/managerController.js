import { managerService } from '../services/managerService.js';
import * as v from '../validators/managerValidator.js';
import { HttpError } from '../utils/httpError.js';

const handle = (action, status = 200) => async (req, res, next) => { try { const body = await action(req); res.status(status).json(body); } catch (error) { next(error); } };

export const listCinemas = handle(async (req) => ({ cinemas: await managerService.listCinemas(req.user.userId) }));
export const listRooms = handle(async (req) => ({ rooms: await managerService.listRooms(req.user.userId, v.cinemaId(req.params.cinemaId)) }));
export const createRoom = handle(async (req) => ({ room: await managerService.createRoom(req.user.userId, v.cinemaId(req.params.cinemaId), v.roomCreate(req.body)) }), 201);
export const updateRoom = handle(async (req) => ({ room: await managerService.updateRoom(req.user.userId, v.roomId(req.params.roomId), v.roomUpdate(req.body)) }));
export const deleteRoom = handle(async (req) => { await managerService.deleteRoom(req.user.userId, v.roomId(req.params.roomId)); return { deleted: true }; });
export const listSeats = handle(async (req) => ({ seats: await managerService.listSeats(req.user.userId, v.roomId(req.params.roomId)) }));
export const createSeat = handle(async (req) => ({ seat: await managerService.createSeat(req.user.userId, v.roomId(req.params.roomId), v.seatCreate(req.body)) }), 201);
export const updateSeat = handle(async (req) => ({ seat: await managerService.updateSeat(req.user.userId, v.seatId(req.params.seatId), v.seatUpdate(req.body)) }));
export const deleteSeat = handle(async (req) => { await managerService.deleteSeat(req.user.userId, v.seatId(req.params.seatId)); return { deleted: true }; });
export const listShowtimes = handle(async (req) => ({ showtimes: await managerService.listShowtimes(req.user.userId, v.cinemaId(req.params.cinemaId), v.dateRange(req.query)) }));
export const createShowtime = handle(async (req) => ({ showtime: await managerService.createShowtime(req.user.userId, v.showtimeCreate(req.body)) }), 201);
export const updateShowtime = handle(async (req) => ({ showtime: await managerService.updateShowtime(req.user.userId, v.showtimeId(req.params.showtimeId), v.showtimeUpdate(req.body)) }));
export const cancelShowtime = handle(async (req) => { const body = req.body ?? {}; if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => key !== 'reason') || (body.reason !== undefined && (typeof body.reason !== 'string' || body.reason.length > 255))) throw new HttpError(400, 'INVALID_REQUEST', 'reason must be text up to 255 characters.'); await managerService.cancelShowtime(req.user.userId, v.showtimeId(req.params.showtimeId), body.reason); return { cancelled: true }; });
export const listPricing = handle(async (req) => ({ pricing: await managerService.listPricing(req.user.userId, v.cinemaId(req.params.cinemaId)) }));
export const createPricing = handle(async (req) => ({ pricing: await managerService.createPricing(req.user.userId, v.cinemaId(req.params.cinemaId), v.pricingCreate(req.body)) }), 201);
export const updatePricing = handle(async (req) => ({ pricing: await managerService.updatePricing(req.user.userId, v.pricingId(req.params.pricingId), v.pricingUpdate(req.body)) }));
export const dashboard = handle(async (req) => ({ dashboard: await managerService.dashboard(req.user.userId, v.cinemaId(req.params.cinemaId)) }));
export const revenue = handle(async (req) => ({ revenue: await managerService.revenue(req.user.userId, v.cinemaId(req.params.cinemaId), v.dateRange(req.query)) }));
