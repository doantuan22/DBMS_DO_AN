# Database (Microsoft SQL Server)

All SQL lives here and nowhere else. The application reaches data **only** through stored procedures.

## Layout and deployment order

| Order | File | Content |
| --- | --- | --- |
| 1 | `schema/01_schema.sql` | Database `CinemaBookingDB`, 25 tables, constraints, indexes (**drops and recreates all tables**) |
| 2 | `views/02_views.sql` | 5 baseline views + `vw_ThongKePhim`. `vw_DoanhThuTheoRap` counts only `THANHTOAN.TrangThai = N'Thành công'` |
| 3 | `functions/03_functions.sql` | 5 baseline functions + 2 RBAC helpers |
| 4 | `triggers/04_triggers.sql` | 5 baseline triggers + complaint-status sync trigger |
| 5 | `procedures/{system,auth,customer,manager,support,admin}/<actor>_procedures.sql` | Stored procedure gateway, 93 procedures split by actor (1 / 7 / 22 / 19 / 6 / 38), deployed in that order |
| 6 | `security/06_security_rbac.sql` | Login `CinemaAppUser`, role `db_executor`: `GRANT EXECUTE`, `DENY SELECT/INSERT/UPDATE/DELETE`. Password comes from `-v AppPassword` |
| 7 | `seed/07_seed_data.sql` | Demo data. Every demo account has password `123456` stored as a bcrypt hash |
| - | `tests/08_tests_verification.sql` | Integration tests (creates an order; run only on a scratch database) |
| - | `tests/09_tests_revisions.sql` | Tests for phone/transaction-code uniqueness, nested-transaction behaviour of registration, revenue-by-payment, new procedures (rolls back) |
| - | `migrations/001_index_revision.sql` | Index revision for an existing database (see `docs/database-indexes.md`) |
| - | `deployment/deploy.ps1` | Runs the steps above in order |

Empty folders (`constraints/`, `indexes/`, `tests/{procedures,triggers,concurrency}/`) are placeholders.

## Deploy

```powershell
.\database\deployment\deploy.ps1 -AppPassword '<strong password>'                 # schema..seed
.\database\deployment\deploy.ps1 -Database CinemaScratch -AppPassword '...' -RunTests   # scratch DB + tests
```

Put the same password in `backend/.env` (`DB_USER=CinemaAppUser`, `DB_PASSWORD=...`). `.env` is git-ignored.

## Design decisions

- 25 tables exactly as in the analysis document. There is no configuration table, so ADM-17 (system configuration) has no procedures yet.
- Passwords are hashed with bcrypt **in the backend**. `sp_Auth_Login(@Email)` returns the hash (`MatKhauHash`); it does not compare passwords. `sp_User_GetPasswordHash` + `sp_User_ChangePassword(@NewPasswordHash)` handle password changes.
- `NGUOIDUNG.SoDienThoai` and `THANHTOAN.MaGiaoDich` are unique only when not NULL (filtered unique indexes).
- `TRG_DanhGia_KiemTraDaXemPhim` requires a paid/completed order for a showtime of the movie that has already started; the analysis document was updated to say so.
- Procedures that can be called inside a caller transaction (e.g. `sp_Auth_RegisterCustomer`) use `SAVE TRANSACTION` and only roll back their own work. The other write procedures still roll back the whole transaction on error.
- Index rationale and the latest review: `docs/database-indexes.md`.
- Records that have history are never hard-deleted; the delete procedures raise an error that tells the caller to change the status instead.

## Stored-Procedure-only rules

- The backend never selects from tables, views or functions directly. A view is read through a wrapper procedure; a function is called from inside a procedure.
- The application login has `EXECUTE` only. Every procedure that writes uses `TRY...CATCH` and a transaction where appropriate.
- Each procedure the backend calls must be added to `backend/src/db/procedures.js`.
