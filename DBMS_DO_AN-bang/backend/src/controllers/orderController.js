import { orderService } from '../services/orderService.js';
import { orderId, paymentAttempt, paymentId, paymentResult } from '../validators/orderValidator.js';

export async function listOrders(req, res, next) {
  try {
    res.json({ orders: await orderService.listOrders(req.user.userId) });
  } catch (error) {
    next(error);
  }
}

export async function getOrder(req, res, next) {
  try {
    res.json({
      order: await orderService.getOrderDetail(req.user.userId, orderId(req.params.orderId)),
    });
  } catch (error) {
    next(error);
  }
}

export async function createPayment(req, res, next) {
  try {
    const payment = await orderService.createPaymentAttempt(
      req.user.userId,
      orderId(req.params.orderId),
      paymentAttempt(req.body),
    );
    res.status(201).json({ payment });
  } catch (error) {
    next(error);
  }
}

export async function updatePayment(req, res, next) {
  try {
    const result = await orderService.updatePaymentResult(
      req.user.userId,
      orderId(req.params.orderId),
      paymentId(req.params.paymentId),
      paymentResult(req.body),
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}
