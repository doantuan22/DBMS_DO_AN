# Phase 5 API: Payment and order history

All endpoints require a JWT belonging to role `KHACH_HANG`. The backend receives the caller identity only from the JWT and calls the existing SQL Server stored procedures through the procedure whitelist.

R2 supersedes the historical lifecycle notes below. The payment page has one
“Xác nhận thanh toán” action: it creates an attempt, then synchronously confirms
success using the existing two endpoints. There is no gateway or asynchronous
callback. Expired orders return `409 ORDER_HOLD_EXPIRED`; DB expires the order
and releases tickets. `409 SHOWTIME_NOT_PAYABLE` covers showtime eligibility.
The result endpoint still accepts failure for compatibility, but the UI does not
offer a failure simulation action.

Order detail now returns `cancellationReason`, `cancellationNotice`, and
`compensation: { points, creditedAt }` (or `null`). R2-FIX removes the intermediate
`ticketAmount` field; no frontend behavior relies on it. Compensation
values come from SQL Server. A cancelled paid order keeps its original successful
payments. No refund is created. Admin/manager cancellation with live holds returns
`409 SHOWTIME_HAS_HELD_ORDERS`. See [R2 report](../audit/remediation/r2/R2_REPORT.md).

## Endpoints

| Method | Endpoint | Body | Database contract |
| --- | --- | --- | --- |
| `GET` | `/api/orders` | — | `dbo.sp_Order_ListByCustomer` |
| `GET` | `/api/orders/:orderId` | — | `dbo.sp_Order_GetDetailByCustomer` |
| `POST` | `/api/orders/:orderId/payments` | `{ "paymentMethod": "MOMO" }` | ownership precheck via `sp_Order_GetDetailByCustomer`, then `dbo.sp_Payment_CreateAttempt` |
| `POST` | `/api/orders/:orderId/payments/:paymentId/result` | `{ "status": "Thành công" }` or `{ "status": "Thất bại" }` | ownership and payment membership precheck via `sp_Order_GetDetailByCustomer`, then `dbo.sp_Payment_UpdateResult` |

Supported payment methods are the exact `CK_THANHTOAN_PhuongThuc` values: `VNPAY`, `MOMO`, `ZALOPAY`, `THE_NOI_DIA`, `THE_QUOC_TE`, and `TIEN_MAT`.

`status` accepts only the two exact values accepted by `sp_Payment_UpdateResult`: `Thành công` and `Thất bại`. Amount, order state, seat hold, retry behavior and final state changes are not request fields; the database owns them.

There is no `sp_Order_GetPaymentStatus` in the database baseline. The order detail endpoint returns the authoritative `THANHTOAN` history from recordset four of `sp_Order_GetDetailByCustomer`, so no duplicate SQL object or derived payment-status endpoint was introduced.

## Ownership and errors

`sp_Order_GetDetailByCustomer` enforces owner access in SQL. The backend maps SQL error `50033` to `404 ORDER_NOT_FOUND` so it does not disclose another customer’s order. It also confirms `paymentId` belongs to the returned order before calling the payment-result procedure.

| API code | Meaning |
| --- | --- |
| `ORDER_NOT_FOUND` | unknown order or an order owned by another customer |
| `PAYMENT_NOT_FOUND` | unknown payment or payment outside the customer’s order |
| `ORDER_NOT_PAYABLE` | order is no longer payable |
| `ORDER_HOLD_EXPIRED` | database hold expired |
| `PAYMENT_FINALIZED` | attempt already has a different final result |

## SQL baseline observations

| Classification | Object | Observation |
| --- | --- | --- |
| CHANGED (migration 012) | `sp_Payment_CreateAttempt` | creates a `THANHTOAN` attempt and derives the amount from `DONDATVE`. It no longer extends the hold: `HanGiuCho` is set once at order creation (5 minutes) and no payment action moves it. |
| R2 | `sp_Payment_UpdateResult` | rechecks the DB clock after lifecycle locks, rejects expired confirmations, releases expired holds, preserves idempotent success and rejects conflicting final results. |
| MATCH | `sp_Order_GetDetailByCustomer` | SQL checks customer ownership and returns order, tickets, products and all payment attempts. |
| IMPLEMENTATION DETAIL | payment status endpoint | no dedicated `sp_Order_GetPaymentStatus` exists; the existing detail procedure already supplies the needed payment state. |

Phase 5 originally made no SQL changes. R2 updates the lifecycle procedures and
adds a compensation function/audit table to the reproducible baseline.
