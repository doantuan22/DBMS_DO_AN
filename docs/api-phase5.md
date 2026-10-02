# Phase 5 API: Payment and order history

All endpoints require a JWT belonging to role `KHACH_HANG`. The backend receives the caller identity only from the JWT and calls the existing SQL Server stored procedures through the procedure whitelist.

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
| STRONGER THAN DESIGN | `sp_Payment_UpdateResult` | locks payment and order, is idempotent for an identical callback, rejects a conflicting final result, and protects late-payment seat availability. |
| MATCH | `sp_Order_GetDetailByCustomer` | SQL checks customer ownership and returns order, tickets, products and all payment attempts. |
| IMPLEMENTATION DETAIL | payment status endpoint | no dedicated `sp_Order_GetPaymentStatus` exists; the existing detail procedure already supplies the needed payment state. |

No SQL file, schema object, stored procedure, view, function, trigger, constraint, migration or seed was changed by Phase 5.
