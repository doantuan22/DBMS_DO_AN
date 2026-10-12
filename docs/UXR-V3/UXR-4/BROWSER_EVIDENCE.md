# UXR-4 — Browser evidence

Final `browser-acceptance.json`: **62 PASS** using Chrome headless/CDP with actual React/Vite, authenticated Express routes and existing SQL Server SP on isolated DB ID 9. Runtime exceptions: zero. No application HTTP 5xx in the executed scenarios. Network records include responses and mutation request events; they are not a unique-request count. Intentional 409 overlap/seat conflicts are part of successful negative tests.

`browser-baseline.json`: **30 OBSERVED before captures** using source HEAD `306290f454a807bd81f16feb6a9bad7ad6fd827e` copied into a separate audit directory (136 tracked source/config files); no working-tree reset/checkout and no DB writes. Before captures demonstrate the old form-first/raw-ID presentation. They were captured after implementation from the committed baseline, not relabeled as current source.

## Routes and widths

Admin `/admin/operations/showtimes`, `/admin/operations/pricing`, `/admin/bookings`; Manager `/manager/showtimes`, `/manager/pricing`, `/manager/bookings`. Each has 390/768/1280/1440/1920 px captures. Current layouts have no document overflow; tables and seat maps use explicit scroll regions. Width emulation uses desktop browser rendering at that width, not a real touch device.

| Before | After |
|---|---|
| [Admin Showtimes 390](./screenshots/before/admin-showtimes-390.png) | [Admin Showtimes 390](./screenshots/admin-showtimes-390.png) |
| [Admin Pricing 1440](./screenshots/before/admin-pricing-1440.png) | [Admin Pricing 1440](./screenshots/admin-pricing-1440.png) |
| [Admin Bookings 1440](./screenshots/before/admin-bookings-1440.png) | [Admin Bookings 1440](./screenshots/admin-bookings-1440.png) |
| [Manager Showtimes 390](./screenshots/before/manager-showtimes-390.png) | [Manager Showtimes 390](./screenshots/manager-showtimes-390.png) |
| [Manager Pricing 1440](./screenshots/before/manager-pricing-1440.png) | [Manager Pricing 1440](./screenshots/manager-pricing-1440.png) |
| [Manager Bookings 1440](./screenshots/before/manager-bookings-1440.png) | [Manager Bookings 1440](./screenshots/manager-bookings-1440.png) |

## Actual user flows verified for each portal

1. Deep-link/reload, active sidebar, STT; five widths; search/empty/reset on actual server-backed bookings.
2. Showtime room/status filter, detail, immutable room/name selector, save. Native confirm focus/Tab/Shift+Tab/Escape. Named create at overlapping time returns actual 409 and retains form; corrected time creates; separate cancel succeeds.
3. Pricing three-day filter/reset; create a test price rule, edit surcharge/status, clear end date; named cinema is fixed. [Admin editor 390](./screenshots/admin-pricing-editor-390.png), [Manager editor 390](./screenshots/manager-pricing-editor-390.png).
4. Existing Customer search/select, show/seat selection, native Enter toggles seat, discard Cancel retains draft, four-step review, confirmation Escape retains choices, double click produces one create POST and server unpaid detail.
5. Seat edit retains canceled ticket history, cancellation Cancel/confirm works, canceled and paid orders are read-only. Real competing staff request reserves selected seat; UI receives 409, keeps draft, reloads seats and can remove unavailable selection.
6. Manager sidebar navigation and actual history Back/Forward retain Customer draft, then deliberate discard clears it.

Booking images: [Admin review 390](./screenshots/admin-wizard-review-390.png), [Manager review 390](./screenshots/manager-wizard-review-390.png), [Admin conflict 390](./screenshots/admin-seat-conflict-390.png), [Manager conflict 390](./screenshots/manager-seat-conflict-390.png), [Admin history](./screenshots/admin-edited-history-390.png), [Manager history](./screenshots/manager-edited-history-390.png), [paid read-only](./screenshots/admin-paid-readonly-390.png), [Manager navigation](./screenshots/manager-navigation-1440.png).

Browser setup authenticated seeded actors using isolated ephemeral tokens. Tokens are not written to reports; screenshots show existing seed Customer names/email, not production data. All browser-owned test rooms/shows/seats/orders/price rules were cleaned and checked. Edge renderer preflight also passed, but full journey is Chrome only.

## Scope limits

No claim of exhaustive 401/403/404/network/expiry/used-ticket/inactive-Customer browser journeys, real multi-assignment switching, accessibility conformance/axe or touch acceptance. Those are distinguished from controller/API/SP coverage in the final report. `failure.png` and `before-mobile-overflow.png` are diagnostic captures from early attempts, not final-state screenshots. Historical UXR-2/3 reports are preserved separately.
