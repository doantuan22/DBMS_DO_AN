# R6 Group A — Checkpoint A (2026-10-09)

Scope: only R6.1–R6.3 in the current post-audit roadmap. The older
`scripts/r6a` / historical-data R6A report belongs to a different task and is not
evidence for these 26 scenarios.

Reviewed: roadmap R6.1–R6.3; R5.1–R5.5 reports and fixture matrix/SQL;
`BUSINESS_RULE_OWNERSHIP` and `ORDER_DETAIL_READ_ONLY` contracts; accepted
constraints; R1/R2 booking/locking evidence; R4.4 ownership and R4.7 detail evidence;
canonical booking/payment/expiry SPs, pricing/limit/hold functions, show/order
views, ticket triggers, table CHECK/FK/UNIQUE constraints; routes, auth/permission
middleware, controllers, validators, services, typed procedure client and whitelist;
existing Backend tests and SQL integration/concurrency tools.

## Trace and contract

| API | Route/controller/service | Actual SQL entry |
|---|---|---|
| GET /api/movies, /api/movies/:id | movieRoutes → catalogController → catalogService | sp_Movie_List / sp_Movie_GetDetail |
| GET /api/movies/:id/showtimes, /api/showtimes/:id | movieRoutes/showtimeRoutes → catalogController → catalogService | sp_Showtime_ListByMovie / sp_Showtime_GetDetail |
| GET /api/showtimes/:id/seats | showtimeRoutes → bookingController.listSeats → bookingService | sp_Seat_ListByShowtime |
| GET /api/products | productRoutes → bookingController.listProducts → bookingService | sp_Product_ListActive |
| POST /api/promotions/validate | auth/customer/DAT_VE → bookingController → bookingService | sp_Promotion_Validate (preview, read-only) |
| POST /api/bookings | auth/customer/DAT_VE → bookingController.createBooking → bookingValidator → bookingService | sp_Booking_Create |
| POST /api/orders/:id/payments | auth/customer/THANH_TOAN → orderController → orderValidator → orderService | sp_Order_GetDetailByCustomer → sp_Payment_CreateAttempt |
| POST /api/orders/:id/payments/:paymentId/result | same middleware → orderController → orderService | detail ownership + payment membership → sp_Payment_UpdateResult → detail |
| GET /api/orders/:id | auth/customer → orderController → orderService | sp_Order_GetDetailByCustomer (four read-only resultsets) |

All calls use the whitelist and typed `.execute()`. No business SQL is added to
Backend. Actor identity is authenticated. The order/payment membership guard in
orderService complements SQL payment ownership; the SQL result SP accepts
PaymentID, not a separate OrderID.

Booking owns its transaction or caller savepoint; locks customer → movie/cinema →
room → show → seats → products → promotion. `IsBookable` checks SQL time, parents
and release dates, twice before writes. SQL owns ticket/food snapshots and promo
quota. Limits are 10 distinct seats, 10 units/product, 3 live unpaid orders and
5-minute hold. Invalid requested promo is 409 PROMOTION_NOT_AVAILABLE, never a
full-price fallback. Effective expiry can appear in read-only detail before expiry
is persisted; booking/payment invoke existing expiry explicitly.

Payment locks customer/show/order/attempt, stores the order snapshot amount.
Failure preserves pending order/history. Success clears hold, pays order and adds
loyalty once in one transaction. Same terminal result is idempotent (200, no
writes); different result is 409 PAYMENT_FINALIZED. Foreign order is concealed
as 404 ORDER_NOT_FOUND; payment from another specified order is 404
PAYMENT_NOT_FOUND; expired hold is 409 ORDER_HOLD_EXPIRED; paid order is 409
ORDER_NOT_PAYABLE. Existing orderService comment claiming payment SP has no user
parameter is stale; signature and typed implementation already agree. No behavior
change is required for that comment.

## Survey matrix before implementation

Existing coverage below describes available tests, not newly executed PASS results.
The missing column is the evidence the new suite must provide.

| Test Scenario | API | Stored Procedure | Existing Test | Missing Test | Risk |
|---|---|---|---|---|---|
| R6.1-01 Normal | booking + public catalog + detail | Booking_Create, public reads | R21/R22 HTTP, R54 fixture | complete R5-seed HTTP flow + persisted snapshot | HIGH |
| R6.1-02 No food | booking | Booking_Create | service tests, R54 | explicit HTTP + zero food rows | MEDIUM |
| R6.1-03 Food | booking + detail | Booking_Create | R22/R54 | multi-quantity HTTP + SQL unit snapshot | HIGH |
| R6.1-04 Promo | preview + booking | Promotion_Validate, Booking_Create | R22/R44 | R5 seed preview/final/quota assertions | HIGH |
| R6.1-05 No promo | booking | Booking_Create | R22 | explicit SQL null/zero + unchanged quotas | MEDIUM |
| R6.1-06 Wrong room | booking | Booking_Create | bookability.sql | exact HTTP SEAT_UNAVAILABLE + full no-write hashes | HIGH |
| R6.1-07 Inactive seat | booking | Booking_Create | bookability.sql | HTTP maintenance/broken variants + no writes | HIGH |
| R6.1-08 Duplicate | booking + payment | Booking_Create | booking-stress | paid-seat conflict + no partial rows | HIGH |
| R6.1-09 Held | booking + seats | Booking_Create | booking-stress | live hold conflict + no writes | HIGH |
| R6.1-10 Expired | seats + booking + detail | Booking_Create → Order_ExpirePending | R47 | same-seat reuse, canceled old ticket, quota release once | HIGH |
| R6.1-11 Seats limit | booking | Booking_Create | R22/validator | HTTP 10 boundary / 11 reject, SQL second enforcement | HIGH |
| R6.1-12 Food limit | booking | Booking_Create | R44/validator | HTTP 10 boundary / 11 reject, aggregate SQL enforcement | HIGH |
| R6.1-13 Parent | booking | Booking_Create / bookable view | R21 parents | cinema, room, movie variants + no writes | HIGH |
| R6.1-14 Past | booking | Booking_Create | bookability.sql | actual R5 past show HTTP rejection + no writes | HIGH |
| R6.2-01 Same seat | simultaneous booking | Booking_Create | booking-stress | SQL-observed simultaneous HTTP executions + final rows | HIGH |
| R6.2-02 Overlap | simultaneous booking | Booking_Create | booking-stress | SQL barrier, losing exclusive seat stays free, no partial | HIGH |
| R6.2-03 Different | simultaneous booking | Booking_Create | booking-stress | SQL-observed overlap and both commits | HIGH |
| R6.2-04 Hold limit | simultaneous booking | Booking_Create | booking-stress | four overlapping calls, exactly three commits | HIGH |
| R6.2-05 Last quota | simultaneous booking | Booking_Create → Promotion_Validate | R22 quota HTTP | different rooms/shows, promo-only barrier, one commit | HIGH |
| R6.3-01 Retry | booking/pay/result/detail | both Payment SPs | R54 fixture, orderService | read SQL after every HTTP step, preserved failed attempt | HIGH |
| R6.3-02 Owner | pay/result/detail | detail + Payment SPs | R44 authorization | foreign HTTP calls + SQL unchanged | HIGH |
| R6.3-03 Membership | result on another order | detail membership, Payment_UpdateResult | orderService | two owned orders + unchanged payment/order rows | HIGH |
| R6.3-04 Same replay | result | Payment_UpdateResult | fixture/idempotency | failed and successful replay, exact full hash equality | HIGH |
| R6.3-05 Flip replay | result | Payment_UpdateResult | service tests | both terminal directions + exact no-write hashes | HIGH |
| R6.3-06 Expired | pay/result/detail | Payment SPs → Order_ExpirePending | R47 | aged fixture, effective vs persisted expiry, no success | HIGH |
| R6.3-07 Paid | pay/result | Payment SPs | orderService | no new attempt/no second completion, loyalty once | HIGH |

## Fixture and execution decision

Preflight confirmed SQL Server DESKTOP-E67DPCV, SQL 17, and absent
`CinemaBookingDB_R0_R6A_20261009_01`; task authorizes isolated test setup. Create
this new target via R5.5 build-test, canonical schema/base/dynamic seed using SQL
business date. Do not reset existing CinemaBookingDB_Test or dev main.

Reuse R5 base actors/products/promos and dynamic future/past shows. Start from
empty transactions; each scenario records owned orders and cleans them after
persisted assertions. Controlled aging only changes fixture order timestamps,
then uses the existing expiry lifecycle. Restore only recorded fixture changes
(parent/seat status, quota and loyalty) and verify all 27 data hashes and metadata.
Never load R54 committed fixture over data or extend the real hold timeout.

Concurrency: real HTTP requests on separate pooled SQL sessions. A test SQL
transaction holds room or promotion row locks; DMV blocking-chain observations
must prove every contender is executing/waiting inside Booking_Create before
release. Run each race three times with clean fixtures. Final SQL invariants and
responses both asserted. Failure to observe overlap is a failure, not PASS.

Supplementary regressions: invalid promotions/products and client identity/money
spoofing, direct SP limits, booking post-write fault rollback and payment
post-write rollback; existing Backend/SQL regression, No-SQL and module parity.
No R6.4–R6.10, UI/browser work, gateway or production refactor.
