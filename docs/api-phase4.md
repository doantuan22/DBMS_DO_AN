# Phase 4 API: Seat map and booking core

All endpoints use the existing Stored Procedure contract. The client sends IDs, quantities and an optional promotion code only. It never sends a price, discount amount, final total, role or user ID.

## `GET /api/showtimes/:showtimeId/seats`

Public. Executes `dbo.sp_Seat_ListByShowtime` and returns `{ seats }`. Every item preserves the DB seat state: `Trống`, `Đang giữ`, `Đã đặt`, or `Bảo trì`, together with the DB-calculated display `price`.

## `GET /api/products`

Public. Executes `dbo.sp_Product_ListActive` and returns `{ products }`. Product `price` is a display value from DB.

## `POST /api/promotions/validate`

Customer JWT required. Request:

```json
{
  "showtimeId": 5,
  "seatIds": [101, 102],
  "products": [{ "productId": 3, "quantity": 1 }],
  "promotionCode": "CHAOBANMOI"
}
```

The adapter obtains current seat and product display prices from their existing procedures, then calls `dbo.sp_Promotion_Validate`. Its response is a provisional preview only; `dbo.sp_Booking_Create` recalculates price and revalidates the promotion inside its transaction. A missing or no-longer-available selected seat returns `409`.

## `POST /api/bookings`

Customer JWT required. Request shape is identical to promotion validation. The authenticated identity is taken from JWT, never from the body. The route executes exactly one business entry point: `dbo.sp_Booking_Create`.

Success returns `201` and `{ booking }`, including DB snapshot totals, order status and hold expiry. `50025` / trigger error `50003` map to HTTP `409` with `error.code = SEAT_CONFLICT`. The client reloads the seat map and lets the customer choose again.

## Database authority

`dbo.sp_Booking_Create` owns availability locking, price snapshots, promotion revalidation, DONDATVE, CHITIETVE, CHITIETDOAN and commit/rollback. The final payable amount returned from the booking response is authoritative.
