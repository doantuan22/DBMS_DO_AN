# Backend test setup (R4.1)

Chạy từ một clone mới bằng Node.js 24.x và npm đi kèm (đã kiểm chứng với Node 24.21.0 / npm 11.19.0):

```powershell
cd backend
npm ci --no-audit --no-fund
npm test
npm test
```

`npm ci` dùng `package-lock.json` được version trong Git. Không cần `.env`, SQL Server, seed hay backup cho `npm test` (các runner `scripts/audit` mới cần SQL Server test). Giữ nguyên cấu trúc repository khi chạy: test import `shared/` và đọc canonical SQL ở `database/03_constraints`, `05_functions`, `07_triggers`, `08_procedures`.

Suite dùng `node:test` hiện có. Dữ liệu kiểm thử nằm trong test/source được version; service tests inject executor tại chỗ, JWT tests truyền secret/clock của test, HTTP tests dùng cổng tạm, date/time tests đặt múi giờ cho subprocess. SQL contract guards đọc source thực và phải phát hiện mã lỗi chưa mapping. Không tạo `known-contract-gaps.json` để đáp ứng test.

The R4.1 clean-clone replay runner has been retired with the phase tooling.
Run the maintained backend unit/contract suite with `npm test` from `backend`; the
recorded R4.1 acceptance result is historical and is not a replay command.

## Integration and browser acceptance (scripts/audit)

From the repository root, against the dedicated `CinemaBookingDB_Test` database only (configured in `backend/.env.test`):

```powershell
npm.cmd run audit:api   # real HTTP → Express → stored procedure → SQL, SQL read-back after every write
npm.cmd run audit:lifecycle # parallel-request concurrency, hold expiry, compensated showtime cancellation
npm.cmd run audit:e2e   # Playwright/Edge DOM interaction, SQL read-back, responsive + axe-core accessibility
npm.cmd run audit:db    # read-only integrity checks (constraints, orphans, seats, pricing, money)
npm.cmd run audit:all   # everything above plus backend/frontend unit tests and the production build
```

Each runner verifies `SELECT DB_NAME()` equals `CinemaBookingDB_Test` (and that the login is not `sa`) before any write and stops otherwise. They start the Backend/Frontend themselves with an explicit environment, so `backend/.env` can never redirect them to the main database. The Backend has no package build/lint scripts; use `node --check` for syntax and Oxlint for lint. Results and limitations: [FINAL_ACCEPTANCE_REPORT.md](../docs/audit/FINAL_ACCEPTANCE_REPORT.md).
