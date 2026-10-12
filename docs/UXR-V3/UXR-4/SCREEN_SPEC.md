# UXR-4 — Screen spec (12/10/2026)

User authorization: triển khai toàn bộ 4A → 4B → 4C → 4D trong frontend. Blueprint V3 §§2, 4, 5.11–12, 5.17, 6.5–7, 9, 11.5, 12.3 apply. Historical browser blockers remain open; no backend/schema/permission expansion.

## 4A — Showtimes

Existing canonical Admin/Manager routes render a shared list-first workspace: header, named cinema context, applied filter chips, curated paginated list, detail, dialog editor. Filters: cinema → room, movie, inclusive business-date range, status. Date range goes to existing SP; room/movie/status operate on the complete response for that range. Default seven days; require both bounds, maximum 31 days to avoid unbounded schedule reads. This is a UI read limit, not a booking rule. STT follows filtered/paged results; internal IDs remain keys/payloads. Date/time explicitly Asia/Ho_Chi_Minh (UTC+7).

Create requires a named cinema and room lookup permission; film uses existing authorized Admin catalogue or public catalogue. Edit keeps room fixed per API. Cancel has a separate confirmation with film/room/time/status and consequences; no invented held-order count. Backend handles overlap/history/held order rules and conflicts retain draft. No calendar required by this slice.

## 4B — Pricing

Reuse workspace with cinema, seat/day/format/status and effective-on date filters over the complete, non-paged cinema price-rule set. Display **Phụ thu (VND)** because the actual scheme adds surcharge to showtime base price; never relabel this as final ticket price. Exactly three day types from shared contract. Open-ended date displayed explicitly. Create/edit in dialog, cinema fixed for edit, nonnegative finite money/date validation. Ticket/order history is never recalculated by frontend.

## 4C — Booking transaction workspace

Preserve server search/status/cinema/paging and existing orderId deep-link. Include business order code, customer, movie/showtime/cinema/room, seat count, snapshot total, order/latest-payment status. Separate list, detail and mutation flow. Detail renders server ticket/product/payment snapshots and capability flags, created-at, hold expiry, cancellation/compensation history. Keep search PII in memory only; safe filters/page/orderId can use query. Manager uses persistent cinema owner and scopes every list/options/create to current assigned cinema; old detail/options are suppressed on change/revocation.

## 4D — Guided staff workflow

Existing approved staff SP/API supports active Customer lookup, create seats-only unpaid order, update seats with expected ticket IDs, business cancellation. Guided steps: Customer → cinema/showtime → seats → review/confirm → actual order. Seat preview is the sum of prices returned by server, provisional until transactional create. Hold starts only on server response. Edit never changes customer/showtime/price/payment and retains old ticket history; paid/used/canceled/expired orders use server capabilities. Product/promotion mutations, refunds and manual payment are unsupported and omitted.

## Shared behavior and validation

All reads: loading/empty/error/retry; 403/404 are errors. All writes: single synchronous lock, no auto-retry, response ownership by lifetime + request generation + Manager epoch, refresh current scope after success, retain draft on conflict/network failure. Manager drafts survive intra-Manager navigation in persistent store; cinema switch asks before discarding and pending writes block switching. Explicit filter actions preserve draft or ask before replacement. Native dialog keyboard/focus behavior uses shared Dialog/ConfirmDialog. White/blue tokens; table scroll regions and intentional lower-priority column hiding at 390 px. Automated controller/SSR/API/SP checks plus actual browser acceptance where renderer works.
