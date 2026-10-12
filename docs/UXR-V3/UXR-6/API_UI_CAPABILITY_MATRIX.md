# UXR-6 capability matrix

Existing contracts only; implementation must keep the source of truth on API/SP. Each entry will be checked against actual responses during its slice.

| Area | Existing contract / scope | UI boundary |
|---|---|---|
| CSKH | Exact CSKH role; QL_KHIEUNAI list/detail, status/type/search/priority; XULY_KHIEUNAI processing/status; TRA_CUU_DON scoped order reference | Preserve session keyed drafts and UXR-1A ownership/generations/write lock; append-only timeline, no Admin impersonation or unsupported case date filter |
| Catalog | Public movie/genre/cinema/detail/showtime clients, abort signals and request context keys | Verify response status/city fields; no fabricated inventory/featured show or unreachable quick-book form |
| Booking | KHACH_HANG + DAT_VE create; public seats/products; promotion preview; backend creates prices/deadline/status | Keep seat/product limits and showtime scope; no manual pricing or optimistic reserve; total from create response |
| Orders | Own Customer list/detail | Show stored monetary/ticket/food/payment history; no Customer physical delete/refund/cancel unless an existing route actually supports it |
| Payment | Own order attempts, existing create/result methods and statuses | No new provider/card fields, no invented paid status; retain attempts and single-submit guards |
| Profile / auth | Existing field allowlists, immutable role and session/routing guards | No role selector in public register or permission controls; preserve UTF-8 password contract |
| Customer complaints | Own list/detail/create, optional own order reference | Use authorized own-order lookup by business label; no processing/delete/status mutation UI for Customer |

Backend/database/shared business contracts and UXR-0–5 evidence are protected. Missing capabilities are tracked without implementing a workaround that changes business semantics.
