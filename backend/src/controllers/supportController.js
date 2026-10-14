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

export const listUnassigned = handle(async (req) => ({
  complaints: await supportService.listUnassigned(req.user.userId),
}));

export const claimComplaint = handle(async (req) => ({
  claim: await supportService.claimComplaint(
    req.user.userId,
    validators.complaintId(req.params.complaintId),
  ),
}));

export const listMessages = handle(async (req) => ({
  messages: await supportService.listMessages(
    req.user.userId,
    validators.complaintId(req.params.complaintId),
    true, // staff can see internal notes
  ),
}));

export const sendMessage = handle(
  async (req) => ({
    message: await supportService.sendMessage(
      req.user.userId,
      validators.complaintId(req.params.complaintId),
      validators.chatMessage(req.body).content,
    ),
  }),
  201,
);

export const addInternalNote = handle(
  async (req) => ({
    note: await supportService.addInternalNote(
      req.user.userId,
      validators.complaintId(req.params.complaintId),
      validators.internalNote(req.body).content,
    ),
  }),
  201,
);

export const createEscalation = handle(
  async (req) => ({
    escalation: await supportService.createEscalation(
      req.user.userId,
      validators.complaintId(req.params.complaintId),
      validators.escalationCreate(req.body),
    ),
  }),
  201,
);

export const listEscalations = handle(async (req) => ({
  escalations: await supportService.listEscalationsCSKH(
    req.user.userId,
    validators.escalationFilters(req.query),
  ),
}));

export const escalationDetail = handle(async (req) =>
  supportService.getEscalationDetail(
    req.user.userId,
    validators.escalationId(req.params.escalationId),
  ),
);

export const customerPoints = handle(async (req) =>
  supportService.getCustomerPoints(
    req.user.userId,
    validators.customerUserId(req.params.userId),
  ),
);
