# Database (Microsoft SQL Server)

All SQL lives here and nowhere else. The application reaches data **only** through stored procedures.

## Layout and deployment order

| Order | File | Content |
| --- | --- | --- |
| 1 | `schema/01_schema.sql` | Database `CinemaBookingDB`, 25 baseline tables, constraints, indexes (**drops and recreates all tables**) |
| 2 | `functions/02_functions.sql` | 5 baseline functions + 2 RBAC helpers + seat-hold helpers (`fn_ThoiGianGiuChoPhut`, `fn_ThoiGianGiaHanThanhToanPhut`, `fn_DonDangGiuGhe`). Must run before the views |
| 3 | `views/03_views.sql` | 5 baseline views + `vw_ThongKePhim`. `vw_DoanhThuTheoRap` counts only `THANHTOAN.TrangThai = N'Thành công'` |
| 4 | `triggers/04_triggers.sql` | 5 baseline triggers + complaint-status sync trigger |
| 5 | `procedures/{system,auth,customer,manager,support,admin}/<actor>_procedures.sql` | Stored procedure gateway, 94 procedures split by actor (1 / 7 / 22 / 20 / 6 / 38), deployed in that order |
| 6 | `security/06_security_rbac.sql` | Login `CinemaAppUser`, role `db_executor`: `GRANT EXECUTE`, `DENY SELECT/INSERT/UPDATE/DELETE`. Password comes from `-v AppPassword` |
| 7 | `seed/07_seed_data.sql` | Demo data. Every demo account has password `123456` stored as a bcrypt hash |
| - | `tests/08_tests_verification.sql` | Integration tests (creates an order; run only on a scratch database) |
| - | `tests/09_tests_revisions.sql` | Tests for phone/transaction-code uniqueness, nested-transaction behaviour of registration, revenue-by-payment, new procedures (rolls back) |
| - | `tests/10_tests_seat_hold.sql` | Tests for seat hold, hold expiry, payment window, showtime-cancel rule (rolls back) |
| - | `migrations/001_index_revision.sql` | Index revision for an existing database (see `docs/database-indexes.md`) |
| - | `migrations/002_seat_hold.sql` | Adds `DONDATVE.HanGiuCho`; then re-run functions, views, triggers, procedures |
| - | `migrations/003_complaint_order_ownership.sql` | Alters only `sp_Complaint_Create`: a supplied order reference must belong to the complaint sender. |
| - | `migrations/004_manager_showtime_list.sql` | Adds `sp_Manager_Showtime_List`, a manager-scoped alternative to raw showtime queries. |
| - | `migrations/005_support_status_history_atomicity.sql` | Makes a CSKH status update append a processing-history record atomically. |
| - | `migrations/006_support_procedure_authorization.sql` | Adds permission and not-found guards to CSKH detail, order-reference, and processing procedures. Run after 005 on an existing database. |
| - | `migrations/008_admin_global_portal.sql` | Removes the obsolete ADM-17 permission seed and adds Admin-global Cinema/Movie/Product lists, Room/Seat/Pricing/Showtime contracts, and Assignment Update (`usp_Admin_*` names avoid SQL Server's special `sp_` name resolution). Apply to `CinemaBookingDB` after base deployment. |
| - | `migrations/009_cinema_images.sql` | ADM-07 extension: adds `HINHANH_RAPCHIEUPHIM`, image constraints/indexes, public gallery read, Admin image CRUD and transactional cover selection. |
| - | `migrations/010_cinema_image_fixes.sql` | Cinema image fixes: Create/SetCover emit only the final image result set (lock no longer returns a result set); normalises out-of-domain `TrangThai` to `Tạm ẩn` and adds `CK_HINHANH_RAPCHIEUPHIM_TrangThai` (`Hoạt động`, `Tạm ẩn`). Run after 009; apply with `sqlcmd -f 65001`. |
| - | `migrations/011_cinema_image_update_lock.sql` | `usp_Admin_CinemaImage_Update` now takes the same cinema-wide key-range lock inside a transaction as Create/SetCover (fixes Update/SetCover deadlocks); contract unchanged. Run after 010; apply with `sqlcmd -f 65001`. |
| - | `migrations/012_booking_limits_and_pricing.sql` | Booking limits and pricing (audit round 4): max 10 seats per order and 10 units per product line (lines of one product are summed first), percent promotions in (0, 99] with `CK_KHUYENMAI_PhanTram99` and every discount capped at 99% of the subtotal, hold fixed at 5 minutes and never extended, at most 3 unpaid unexpired orders per customer (customer row lock before the showtime lock), and additive surcharges in `fn_TinhGiaVe`. New error numbers 50026/50027/50028. Existing orders keep their stored amounts. Run after 011; apply with `sqlcmd -f 65001`. |
| - | `tests/11_tests_complaint_order_ownership.sql` | Transactional DBR-01 verification for null, own, foreign and nonexistent order references. |
| - | `tests/12_tests_cinema_images.sql` | Transactional ADM-07 cinema image verification: FK, defaults, cover change, ordering, invalid cinema and deletion. |
| - | `tests/13_tests_cinema_image_fixes.sql` | Transactional verification of migration 010: single DTO result set from Create/SetCover, one cover per cinema, `TrangThai` CHECK. |
| - | `tests/14_tests_cinema_image_update_lock.sql` | Transactional verification of migration 011: single DTO result set from Update, one-cover rule over an Update/SetCover chain, 50230 for missing image, `TrangThai` CHECK. |
| - | `tests/15_tests_booking_limits.sql` | Transactional verification of migration 012 (promotion CHECK and cap, seat/product caps by direct procedure call, 5-minute hold, 3-order limit, additive surcharges). |
| - | `tests/stress/` | Manual stress tests run through the API (cinema image lock, booking concurrency); never part of an automated run. See `tests/stress/README.md`. |
| - | `deployment/deploy.ps1` | Runs the steps above in order (shared logic in `DeployCommon.ps1`; the default target is still `CinemaBookingDB` / `CinemaAppUser`) |
| - | `deployment/deploy-isolated.ps1` | Builds a disposable copy from the repository only, with its own database and login names; refuses the shared names (see Deploy) |

Empty folders (`constraints/`, `indexes/`, `tests/{procedures,triggers,concurrency}/`) are placeholders.

## Deploy

```powershell
.\database\deployment\deploy.ps1 -AppPassword '<strong password>'                 # schema..seed
.\database\deployment\deploy.ps1 -Database CinemaScratch -AppPassword '...' -RunTests   # scratch DB + tests
```

`-RunTests` runs tests 08-15 in numeric order after the migrations. Test 08 creates an order and `01_schema.sql` drops every table, so use a disposable database; the security step also resets the `CinemaAppUser` server login password to `-AppPassword`. Tests 11-14 roll back and can be run alone with `sqlcmd -S localhost -E -C -I -f 65001 -b -i <file>`.

To build a disposable copy next to a database that is in use (it refuses the shared database and login names, takes the password from `DEPLOY_APP_PASSWORD` only, and `-Recreate` drops an existing copy of the same name):

```powershell
$env:DEPLOY_APP_PASSWORD = '<password for the new login>'
.\database\deployment\deploy-isolated.ps1 -Database CinemaBookingDB_RepoCheck -AppLogin CinemaRepoUser -RunTests
```

Every step runs with `sqlcmd -d <database>`, so migrations without a `USE` line cannot land in `master`. Migrations 001-006 are replayed after the seed (idempotent) so that the result is identical to a database that was upgraded step by step. Remove a disposable copy with `ALTER DATABASE <db> SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE <db>;` and `DROP LOGIN <login>;`. The scripts need `-ExecutionPolicy Bypass` when script execution is disabled.

Put the same password in `backend/.env` (`DB_USER=CinemaAppUser`, `DB_PASSWORD=...`). `.env` is git-ignored.

## Design decisions

- 25 tables exactly as in the analysis document. System configuration is outside the approved Admin use-case scope.
- Passwords are hashed with bcrypt **in the backend**. `sp_Auth_Login(@Email)` returns the hash (`MatKhauHash`); it does not compare passwords. `sp_User_GetPasswordHash` + `sp_User_ChangePassword(@NewPasswordHash)` handle password changes.
- `NGUOIDUNG.SoDienThoai` and `THANHTOAN.MaGiaoDich` are unique only when not NULL (filtered unique indexes).
- `TRG_DanhGia_KiemTraDaXemPhim` requires a paid/completed order for a showtime of the movie that has already started; the analysis document was updated to say so.
- Procedures that can be called inside a caller transaction (e.g. `sp_Auth_RegisterCustomer`) use `SAVE TRANSACTION` and only roll back their own work. The other write procedures still roll back the whole transaction on error.
- **Seat hold (cinema-style):** `sp_DatVe` creates an order `Chờ thanh toán` that holds its seats until `DONDATVE.HanGiuCho` (now + `fn_ThoiGianGiuChoPhut()` = 10 min). The seat map shows `Trống` / `Đang giữ` / `Đã đặt` / `Bảo trì`. Starting a payment attempt extends the hold to at least now + 5 min; a payment cannot be started on an expired order. Availability never depends on a job: every query ignores expired holds through `fn_DonDangGiuGhe`. `sp_Order_ExpirePending` (called by the backend every minute and by `sp_Booking_Create` for its showtime) only marks such orders `Hết hạn`, cancels their tickets and gives back the promotion use.
- A payment result that arrives after the hold expired is accepted only if the showtime is still open and nobody else holds those seats; otherwise the attempt is recorded as failed. There is no refund feature, so a real gateway integration must void such a charge itself.
- There is no refund or cancellation of paid orders (`Hoàn tiền` / `Đã hoàn tiền` values stay in the CHECK constraints but are never set). A showtime can be cancelled only when no order holds or has bought a seat for it (`sp_Manager_Showtime_Cancel`, error 50118).
- Index rationale and the latest review: `docs/database-indexes.md`.
- Records that have history are never hard-deleted; the delete procedures raise an error that tells the caller to change the status instead.

## Stored-Procedure-only rules

- The backend never selects from tables, views or functions directly. A view is read through a wrapper procedure; a function is called from inside a procedure.
- The application login has `EXECUTE` only. Every procedure that writes uses `TRY...CATCH` and a transaction where appropriate.
- Each procedure the backend calls must be added to `backend/src/db/procedures.js`.
