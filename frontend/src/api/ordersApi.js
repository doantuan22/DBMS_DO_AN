import { request } from './httpClient';

export const getOrders = () => request('/orders');
export const getOrder = (orderId) => request(`/orders/${encodeURIComponent(orderId)}`);
export const createPaymentAttempt = (orderId, paymentMethod) => request(`/orders/${encodeURIComponent(orderId)}/payments`, { method: 'POST', body: { paymentMethod } });
export const submitPaymentResult = (orderId, paymentId, status) => request(`/orders/${encodeURIComponent(orderId)}/payments/${encodeURIComponent(paymentId)}/result`, { method: 'POST', body: { status } });
