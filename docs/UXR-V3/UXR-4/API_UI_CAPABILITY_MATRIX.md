# UXR-4 — API/UI capabilities

Inspected real frontend clients, controllers/validators/services, procedure registry and SQL source on 12/10/2026.

| Feature | Existing contract | UI mapping / limits |
|---|---|---|
| Admin schedule | GET /admin/showtimes, cinemaId/fromDate/toDate; usp_Admin_Showtime_List | Complete range, inclusive fn_NgayKinhDoanh; local room/movie/status on complete range only |
| Manager schedule | GET /manager/cinemas/:id/showtimes, fromDate/toDate; sp_Manager_Showtime_List | Same range; fn_KiemTraQuanLyRapScope authoritative |
| Showtime mutations | Existing POST/PUT, separate POST /:id/cancel | Movie/room ID from names; PUT omits roomId; no hard delete, no fake overlap check |
| Named cinemas/rooms | Admin cinemas QL_RAP / rooms QL_PHONG; Manager assigned cinemas / scoped rooms | Missing dependency permission is explicit; list can derive named filter options from response |
| Movies | Admin movies QL_PHIM or GET /movies public catalogue | Existing current movie name retained if absent from active catalogue |
| Pricing | Existing Admin/Manager list/create/update; complete non-paged BANGGIA response | cinema, seat/day/format/status/effective date local on complete price-rule set; surcharge not final price |
| Booking list | GET /:portal/bookings search/status/cinemaId/page/pageSize; sp_StaffBooking_List | Server global filtered total + paging; search matches code/ticket/customer/movie. Date/showtime/payment filter parameters **unsupported**; no local filter of one server page |
| Booking detail | GET /:portal/bookings/:id; sp_StaffBooking_Detail | Snapshot history, CanEdit/CanCancel computed server-side; Manager scope enforced |
| Customer lookup | GET /:portal/bookings/customers?search= (2–100 chars) | Active KHACH_HANG only, cap 50 + total; narrow search notice |
| Booking options | GET /:portal/bookings/options cinemaId/showtimeId/orderId | Authorized cinemas, nearest 200 bookable shows + total, all seats with server prices; edit retained ticket prices |
| Create | POST /:portal/bookings customerId/showtimeId/seatIds | Existing StaffBooking_Create + underlying transactional booking; 1–10 seats, no fake reservation |
| Seat edit | PUT /:portal/bookings/:id/seats seatIds/expectedTicketIds | Existing StaffBooking_UpdateSeats; unpaid, unexpired, no food/promo/payment attempt, optimistic ticket set + DB locking |
| Cancel | POST /:portal/bookings/:id/cancel {} | Existing StaffBooking_Cancel; keeps history, no refund or DELETE |
| Unsupported | Date/payment/movie-ID booking filters; staff food/promo edits; voluntary refund; extra showtime lookup pagination; held-order count | Capability gaps for separate approved backend/DB workstream. Do not add parameters/endpoints in this frontend slice |

Non-paged small catalogues/price rules and bounded schedule range must be checked against actual isolated data counts. Browser and live concurrency verdicts require their own evidence; source inspection does not establish PASS.
