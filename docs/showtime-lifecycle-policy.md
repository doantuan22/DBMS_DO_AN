# Showtime lifecycle policy (migration 014)

This policy applies to disposable database builds first. Do not run the repository SQL file directly against a database name other than `CinemaBookingDB`: deployment prepares a temporary copy with the target name substituted. Use `deploy-isolated.ps1` for scratch databases.

## Cancellation

- A showtime can be cancelled only before its start. Already-cancelled, completed, or started showtimes return HTTP 409 (`SHOWTIME_CANNOT_CANCEL`).
- Manager and admin cancel routes call the shared `sp_Showtime_CancelCascade` procedure.
- Active holds, paid orders, and expired holds on that showtime become `Đã hủy`; tickets become `Đã hủy`. Successful simulated payments on paid orders become `Đã hoàn tiền`, points granted for those successful payments are withdrawn, and promo uses for active holds/paid orders are released.
- The order stores the operator reason and the customer message: “Suất chiếu đã bị hủy, tiền sẽ được hoàn về thông qua nền tảng thanh toán”. This is a simulated refund; no payment platform is contacted.

## Edits and payment

- PUT cannot set `Đã hủy`; use the cancel route.
- While a showtime has an unexpired `Chờ thanh toán` order or a `Đã thanh toán` order, PUT cannot change movie, start/end time, or format. The current update contract has no room field, so room reassignment is not exposed by either update route.
- A payment attempt or successful result requires an open showtime whose start time is still in the future. A successful result after the five-minute seat hold expires returns 409 `ORDER_HOLD_EXPIRED` and never marks the order paid.
- Manager and admin seat updates share the future active-ticket guard and return 409 `SEAT_HAS_TICKET_HISTORY`.

## SQL status values

| Entity | Before cancellation | After cancellation |
|---|---|---|
| Pending order with a live hold | `Chờ thanh toán` | `Đã hủy` |
| Paid order | `Đã thanh toán` | `Đã hủy` |
| Expired order | `Hết hạn` | `Đã hủy` |
| Active ticket | `Đã đặt` | `Đã hủy` |
| Successful payment for a paid order | `Thành công` | `Đã hoàn tiền` |

## Conflict codes

| Code | HTTP / API code | Meaning |
|---|---|---|
| 50119 | 409 `SHOWTIME_CANNOT_CANCEL` | Showtime has started, completed, or is already cancelled |
| 50120 | 409 `SHOWTIME_HAS_ACTIVE_ORDERS` | A protected showtime field would change while an active order exists |
| 50121 | 409 `SHOWTIME_UNAVAILABLE_FOR_PAYMENT` | Showtime is closed, cancelled, or has started |
| 50123 | 409 `SHOWTIME_CANCEL_ROUTE_REQUIRED` | PUT attempted to set the cancelled status directly |
| 50207 | 409 `SEAT_HAS_TICKET_HISTORY` | Future active ticket references the seat |
| 50111 | 409 `ORDER_HOLD_EXPIRED` | The five-minute hold expired before payment completion |
