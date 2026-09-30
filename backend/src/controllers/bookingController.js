import { bookingService } from '../services/bookingService.js';
import { validateBooking, validatePromotion as validatePromotionBody } from '../validators/bookingValidator.js';
import { validateShowtimeId } from '../validators/catalogValidator.js';

export async function listSeats(req, res, next) {
  try {
    res.json({ seats: await bookingService.listSeats(validateShowtimeId(req.params.showtimeId)) });
  } catch (error) { next(error); }
}

export async function listProducts(req, res, next) {
  try { res.json({ products: await bookingService.listProducts() }); } catch (error) { next(error); }
}

export async function validatePromotion(req, res, next) {
  try { res.json({ promotion: await bookingService.validatePromotion(validatePromotionBody(req.body)) }); } catch (error) { next(error); }
}

export async function createBooking(req, res, next) {
  try {
    const booking = await bookingService.createBooking(req.user.userId, validateBooking(req.body));
    res.status(201).json({ booking });
  } catch (error) { next(error); }
}
