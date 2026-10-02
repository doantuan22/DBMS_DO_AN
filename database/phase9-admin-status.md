# Phase 9 Admin Portal — working traceability

Scope: ADM-01..ADM-16 only (16 Admin UC; project total 45 UC). Migration 008 is deployed to the active `CinemaBookingDB`. Phase 9 integration verification is **DONE**: the remaining live DB and HTTP checks below passed on 2026-10-01.

| ADM | DB contract | Backend | Frontend | SQL Server integration | Status / remaining |
| --- | --- | --- | --- | --- | --- |
| ADM-01 | `sp_Auth_Login` (existing) | Existing auth API | Existing login | Prior phase baseline | Baseline PASS |
| ADM-02 | User List/Create/UpdateStatus (existing) | List/create/status; password bcrypt-hashed | Create + lock/unlock | Create and lock/unlock inside rollback transaction PASS | Implemented; unit + live DB verified |
| ADM-03 | Role List/Create/Update/Delete (existing) | CRUD endpoints | CRUD form | Create/update/delete inside rollback transaction PASS | Implemented; live DB verified |
| ADM-04 | Permission List/Create/Update/Delete (existing) | CRUD endpoints | CRUD form | Create/delete inside rollback transaction PASS | Implemented; live DB verified |
| ADM-05 | `sp_Admin_RolePermission_Set` (existing; transactional) | Replace-set endpoint | Permission ID set form | Replace/remove inside rollback transaction PASS | Implemented; live DB verified |
| ADM-06 | Assignment List/Create (existing), Update (`usp_Admin_Assignment_Update`, migration 008) | List/create/update | Create/edit form | Create through `adminService` and DB verification inside rollback transaction PASS; manager/cinema/FK details verified; non-manager denied with 50071 | PASS |
| ADM-07 | Cinema Create/Update/Delete (existing), all-status List (`usp_Admin_Cinema_List`, migration 008); cinema images (`usp_Admin_CinemaImage_*`, migration 009) | CRUD plus route-scoped image CRUD/cover endpoints | Cinema CRUD plus image URL/metadata section | Existing cinema CRUD PASS; migration 009 image integration pending deployment-account run | Source implemented; image DB verification pending |
| ADM-08 | Global Room/Seat CRUD (`usp_Admin_Room_*`, `usp_Admin_Seat_*`, migration 008) | CRUD endpoints; separate from Manager scope | Create/edit/delete controls | No-history seat update/delete PASS inside rollback transaction; ticket-history update/delete denied with 50207; API returns 409 and DB state unchanged | PASS |
| ADM-09 | Movie/Actor CRUD and actor relation (existing); full Admin Movie List (`usp_Admin_Movie_List`, migration 008) | CRUD + relation endpoints | Movie/actor forms | Real Admin API create/add/update/remove relation; Admin Movie List confirmed parent and JSON bridge data; test movie deleted afterward | PASS |
| ADM-10 | Genre CRUD (existing) | CRUD endpoints | CRUD form | Create/update/delete inside rollback transaction PASS | Implemented; live DB verified |
| ADM-11 | Product CRUD (existing); all-status List (`usp_Admin_Product_List`, migration 008) | CRUD endpoints | CRUD form | Create/update/delete inside rollback transaction PASS; all-status list PASS | Implemented; live DB verified |
| ADM-12 | Promotion CRUD (existing) | CRUD endpoints | CRUD form | Create/update/delete inside rollback transaction PASS | Implemented; live DB verified |
| ADM-13 | Global Pricing CRUD (`usp_Admin_Pricing_*`, migration 008) | List/create/update endpoints | Create/edit/status controls | Real booking snapshot 55,000 remained unchanged after pricing update; subsequent booking used 62,000; DB order details verified | PASS |
| ADM-14 | Global Showtime List/Create/Update/Cancel (`usp_Admin_Showtime_*`, migration 008) | CRUD/cancel endpoints | Create/edit/cancel controls | Held-order cancellation denied with 50118 and status remained `Mở bán`; empty showtime cancellation passed and status became `Đã hủy`; overlap denial 50001 PASS | PASS |
| ADM-15 | Shared Support complaint procedures (existing) | Admin queue/detail/reference/process/status endpoints; identity from `req.user` | Detail/timeline/reference/process/status forms | Processing/status/history consistency inside rollback transaction PASS | Implemented; live DB verified |
| ADM-16 | `sp_Admin_Dashboard`/`sp_Admin_Report_Revenue` (existing) | Dashboard + global revenue | Dashboard/report view and date range | Real reads PASS | Implemented; live DB verified |

## Database environment evidence

- Active backend connection verified by SQL: instance `DESKTOP-E67DPCV`, database `CinemaBookingDB`, login `CinemaAppUser` (application execution account; configured server alias is `localhost`).
- After the corrected 008 rerun, all 20 `usp_Admin_*` procedures are present (`OBJECT_ID` non-NULL) on `DESKTOP-E67DPCV.CinemaBookingDB`.
- Admin list integrations pass: Cinema 3 rows, Product 5, Movie 4, Room 8, Seat 240, Pricing 8, Showtime 8; RolePermission list returned 23 Admin-role permissions. Config objects remain absent.
- `sp_Admin_Permission_List` returns 23 permissions; the obsolete `CAU_HINH_HETHONG` permission is absent.
- `CinemaAppUser` has execute-only application access; direct SELECT from `dbo.QUYEN` is denied as expected. All DB checks below used the stored-procedure contracts.

## Final integration verification

- Backend unit suite: 66/66 PASS.
- Frontend unit suite: 19/19 PASS, including Admin portal SSR/navigation smoke test; Oxlint PASS; Vite production build PASS.
- Real SQL Server reads: Admin dashboard, users, roles, permissions, assignments, genres, actors, promotions, revenue, and Admin complaint queue all callable.
- Real SQL Server rollback-only writes: staff account lock/unlock, role/permission CRUD and replacement, Cinema CRUD, Genre CRUD, Actor CRUD, Movie CRUD, Product CRUD, Promotion CRUD, Room create/update/delete, Seat create/update/delete, Pricing create/update, Assignment update, Showtime create/update/cancel, and Complaint processing/status/history passed. These test writes were rolled back.
- Manager scope regression: assigned cinema allowed; foreign cinema denied with SQL error 50050.
- Real HTTP authorization: anonymous and invalid-token requests returned 401; Manager, CSKH, and Customer returned 403 `ADMIN_REQUIRED`; Admin without `QL_PHONG` returned 403 `FORBIDDEN`; Admin with restored complete grants returned 200. The temporary permission change was restored and the full set of 23 grants was verified.
- Real HTTP seat-history update/delete returned 409 `SEAT_HAS_TICKET_HISTORY`; Admin Movie/Actor relation add/update/remove persisted and was read back through the actual Admin list endpoint.
- Assignment Create was executed by the current `adminService` against the real stored procedure within a rollback transaction. The resulting assignment row verified manager ID, cinema ID/name and status; transaction rollback removed it.
- Snapshot, active hold, valid cancellation, and no-history seat cases were executed against the active SQL Server using real stored procedures and booking/order procedures. Each write group used an explicit transaction and was rolled back; test room absence was confirmed afterward.
- No database object or migration was changed in this verification pass. Backend change: map Admin SQL errors 50207, 50118, and 50071 into safe HTTP business errors; matching unit coverage added.
- Commands: backend `npm.cmd test` (66/66), frontend `npm.cmd test` (19/19), `npm.cmd run lint` (PASS), and `npm.cmd run build` (PASS). Live HTTP requests used the local server at port 4317; live SQL integration used the configured `CinemaBookingDB` stored procedures.
- The user supplied migration errors: `CREATE OR ALTER PROCEDURE dbo.sp_Admin_*` batches failed with Msg 208 State 6, and `sp_Admin_Showtime_Cancel` failed near bare `THROW`. The contracts now use `usp_Admin_*`, and bare rethrows are `;THROW;`; the corrected migration is deployed and its 20 procedure contracts are present.

ADM-17 is not an Admin use case and has no application API, UI, or stored procedure. Its obsolete permission row is already absent from the active DB; no System Config feature is introduced.
