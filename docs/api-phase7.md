# Phase 7 API: Manager Portal

All endpoints require an authenticated `QUAN_LY_RAP` user. The backend reloads role and permissions from SQL, then each procedure enforces the active `PHANCONG_RAP` cinema scope through `fn_KiemTraQuanLyRapScope`. Client-supplied cinema, room, seat, showtime and pricing IDs are inputs, never authorization evidence. A foreign or expired scope maps SQL `50050` to `403 MANAGER_CINEMA_FORBIDDEN`.

| Area | Endpoints | Permission | Procedure contract |
| --- | --- | --- | --- |
| Assigned cinemas | `GET /api/manager/cinemas` | manager role | `sp_Manager_ListAssignedCinemas` only returns active, date-effective assignments. |
| Rooms | `GET, POST /cinemas/:cinemaId/rooms`; `PUT, DELETE /rooms/:roomId` | `QL_PHONG` | Room procedures scope the cinema/current room before list, create, update or delete. |
| Seats | `GET, POST /rooms/:roomId/seats`; `PUT, DELETE /seats/:seatId` | `QL_GHE` | Seat procedures derive cinema from room/seat and scope-check it. |
| Showtimes | `GET /cinemas/:cinemaId/showtimes`; `POST /showtimes`; `PUT /showtimes/:showtimeId`; `POST /showtimes/:showtimeId/cancel` | `QL_SUAT_CHIEU` | Manager list/create/update/cancel procedures. SQL trigger blocks overlap (`50001`). |
| Pricing | `GET, POST /cinemas/:cinemaId/pricing`; `PUT /pricing/:pricingId` | `QL_BANG_GIA` | Pricing procedures scope the cinema/pricing row. |
| Dashboard | `GET /cinemas/:cinemaId/dashboard` | `XEM_BAO_CAO_RAP` | `sp_Manager_Dashboard` returns SQL-computed operational metrics only for that cinema. |
| Revenue | `GET /cinemas/:cinemaId/revenue?fromDate&toDate` | `XEM_BAO_CAO_RAP` | `sp_Manager_Revenue` aggregates successful payments for the scoped cinema. |

## Request shapes

- Room create: `{ "name", "type" }`; update adds `status`.
- Seat create: `{ "row", "number", "type" }`; update: `{ "type", "status" }`.
- Showtime create: `{ "movieId", "roomId", "startsAt", "endsAt", "format", "basePrice" }`; update has the same fields except `roomId`, plus `status`.
- Pricing create: `{ "seatType", "dayType", "format", "surcharge", "startsOn", "endsOn": null }`; update: `{ "seatType", "dayType", "format", "surcharge", "startsOn", "endsOn": null, "status" }`. Minimal updates containing surcharge/status remain supported; omitted conditions retain their current values. Date fields are DATE_ONLY.

`fromDate`/`toDate` are optional `YYYY-MM-DD` values and must be chronological. The server validates shape; database constraints, triggers and procedures own business integrity. No endpoint accepts manager identity, assignment identity, or an arbitrary procedure name.

Showtime room is immutable during update. Cancellation uses its dedicated action; closed/cancelled/historical bookings remain guarded by SQL. Current exact authorization and routes: [R8 matrix](../audit/final/r8/PERMISSION_MATRIX.md).

## Historical SQL change: DBR-02

`database/migrations/004_manager_showtime_list.sql` adds `dbo.sp_Manager_Showtime_List`. The baseline had manager-scoped showtime writes but no scoped list procedure, which would otherwise force a prohibited backend query. The procedure checks assignment scope before selecting showtimes for one cinema and optional date range.
