# API/UI capability matrix

| Capability | Evidence | Verdict / decision |
|---|---|---|
| Physical seat layout | Seat_List: HangGhe/SoGhe/TenGhe or row/number/label, type/status | SUPPORTED; grid grouped by real row, numeric ordering; missing/duplicate positions → fallback BLOCKED map |
| Aisles, coordinates, pair shapes | No fields | BLOCKED; do not invent geometry, holes or joined seats |
| Row/type/name filter, zoom and list page | Complete scoped list | UI-ONLY POSSIBLE; highlight/mute nonmatches in fixed grid; page/filter complete list only |
| Seat create/update/delete | Existing admin/manager services + exact shared enums | SUPPORTED; create row≤10/number positive INT; update type/status only; DB decides history |
| Preemptive per-seat history lock | No history flag in list | BLOCKED mapping; neutral history notice, authoritative 409 preserved, no blanket fake disabled actions |
| Showtime occupancy observation | Scoped showtime list needs QL_SUAT_CHIEU; public showtime seats DTO provides roomId/status | SUPPORTED conditional, read-only after choosing an actual showtime in selected room; no sold status in configuration mode; unavailable/unbookable showtime displays error |
| Admin named cinema/room lookup | Cinemas QL_RAP, Rooms QL_PHONG | SUPPORTED with permissions; QL_PHONG-only derive cinemas from authorized complete rooms; empty cinema lookup still BLOCKED without QL_RAP |
| Manager scope | ManagerLayout assigned cinemas, epoch/capture/drafts/write tokens; SP scope checks | SUPPORTED; no global lookup or assignment override; forged context rejected |
| Manager rooms/count/CRUD | Manager Room DTO id/cinemaId/name/type/status/seatCount, Room_Delete outcome | SUPPORTED; list-first drawer; immutable cinema, real count |
| Cinema CRUD/filter | Cinema_List complete names/address/city/status; CinemaWrite fields | SUPPORTED CRUD; UI-ONLY local name/city/status filter and pagination |
| Cinema room count | Not in Cinema_List; complete Rooms with QL_PHONG | UI-ONLY POSSIBLE only when authorized lookup succeeds, otherwise unknown/permission message, never guessed zero |
| Gallery thumbnails/preview/alt | Real URL/description/status | SUPPORTED presentation; asset load failure shown as unavailable asset, not backend data error |
| Image URL CRUD/cover/order/status | CinemaImage APIs, whitelist statuses | SUPPORTED; numeric order in editor, scoped mutation/refetch; no drag/drop bulk transaction |
| Upload/storage/image kind | No contract | NEEDS APPROVAL / not implemented |
| Backend/SP/RBAC changes | Outside authorized UI scope | NEEDS APPROVAL; no changes made |
| Browser/DB acceptance | Current independent runs in TEST_EVIDENCE | DB/SP/HTTP PASS; browser BLOCKED / NOT VERIFIED; historical 2A/B/C/3A blockers remain separate |

Exact read contracts: Admin Rooms GET accepts cinemaId; Admin Seats GET accepts **roomId only**, with cinema/room pair validated by authorized room lookup first. Manager uses assigned-cinema rooms and room-ID seats endpoints. No query/API schema expansion. Cinema related Showtimes link remains the existing full list, with no cinema URL filter support.
