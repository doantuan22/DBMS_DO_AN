import { feedbackService } from '../services/feedbackService.js';
import {
  complaintId,
  complaintInput,
  movieId,
  reviewInput,
} from '../validators/feedbackValidator.js';

export async function listReviews(req, res, next) {
  try {
    res.json({ reviews: await feedbackService.listReviews(movieId(req.params.movieId)) });
  } catch (error) {
    next(error);
  }
}

export async function createReview(req, res, next) {
  try {
    res.status(201).json({
      review: await feedbackService.createReview(
        req.user.userId,
        movieId(req.params.movieId),
        reviewInput(req.body),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function listComplaints(req, res, next) {
  try {
    res.json({ complaints: await feedbackService.listComplaints(req.user.userId) });
  } catch (error) {
    next(error);
  }
}

export async function createComplaint(req, res, next) {
  try {
    res.status(201).json({
      complaint: await feedbackService.createComplaint(req.user.userId, complaintInput(req.body)),
    });
  } catch (error) {
    next(error);
  }
}

export async function getComplaint(req, res, next) {
  try {
    res.json({
      complaint: await feedbackService.getComplaint(
        req.user.userId,
        complaintId(req.params.complaintId),
      ),
    });
  } catch (error) {
    next(error);
  }
}
