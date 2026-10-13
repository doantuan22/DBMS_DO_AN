import { supportService } from '../services/supportService.js';
import * as validators from '../validators/supportValidator.js';

const handle =
  (action, status = 200) =>
  async (req, res, next) => {
    try {
      res.status(status).json(await action(req));
    } catch (error) {
      next(error);
    }
  };

export const list = handle(async (req) => ({
  complaints: await supportService.list(req.user.userId, validators.listFilters(req.query)),
}));

export const detail = handle(async (req) => ({
  complaint: await supportService.detail(
    req.user.userId,
    validators.complaintId(req.params.complaintId),
  ),
}));

export const orderReference = handle(async (req) =>
  supportService.orderReference(req.user.userId, validators.complaintId(req.params.complaintId)),
);

export const addProcessing = handle(
  async (req) => ({
    processing: await supportService.addProcessing(
      req.user.userId,
      validators.complaintId(req.params.complaintId),
      validators.processing(req.body),
    ),
  }),
  201,
);

export const updateStatus = handle(async (req) => ({
  complaint: await supportService.updateStatus(
    req.user.userId,
    validators.complaintId(req.params.complaintId),
    validators.statusUpdate(req.body),
  ),
}));
