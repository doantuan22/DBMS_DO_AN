# Database guide

The database is authoritative for business rules, authorization, money, transaction boundaries and concurrency. The application calls typed stored procedures through the procedure client; business SQL does not belong in Backend code. Current project constraints are in [accepted constraints](../docs/FINAL_SYSTEM_AUDIT.md).

The canonical database contains **27 tables and 169 SQL modules**: 134 procedures, 6 views, 21 functions and 8 triggers. Source files and `baseline-manifest.json` are authoritative. The current system audit records the latest parity and safety checks in [FINAL_SYSTEM_AUDIT.md](../docs/FINAL_SYSTEM_AUDIT.md).

## Build and test

### Khởi tạo đầy đủ bằng một file điều phối

`run-all.sql` gọi các file SQL thành phần theo thứ tự: build schema và 169 module → nạp seed `demo-dynamic` → kiểm tra schema/quyền → kiểm tra toàn vẹn seed. Không gộp SQL nghiệp vụ vào file này, không chạy migration lịch sử hay test phá dữ liệu khi cài đặt.

Chạy từ thư mục `database/`, dùng kết nối có quyền tạo database:

```powershell
cd D:\DBMS_DO_AN\database
sqlcmd -S localhost -E -C -b -i run-all.sql
```

Các lệnh `:r` cần SQLCMD. Với SSMS, bật SQLCMD Mode và bảo đảm đường dẫn include được phân giải từ thư mục `database/`; lệnh `sqlcmd` trên có thư mục làm việc rõ ràng. `-E` dùng Windows Authentication; chọn phương thức đăng nhập phù hợp với SQL Server của bạn.

Installer chỉ tạo `CinemaBookingDB` khi chưa tồn tại. Nếu database đã có, script dừng trước bước build/seed và không xóa hoặc ghi đè. Seed trên Main mới yêu cầu GUID/ngày tạo của chính lượt cài đặt và database còn trống. Công cụ seed/reset/test thông thường vẫn chỉ chấp nhận hai target demo/test. Nếu cài đặt lỗi, không tự xóa database tạo dở; xem thông báo lỗi để xử lý.

Seed đầy đủ gồm catalog, lịch chiếu theo ngày hiện tại và các trạng thái giao dịch demo. Tài khoản `admin1@example.test`, mật khẩu demo `CinemaStarDemo!2026`; xem thêm [seed README](10_seed/README.md).

**Seed v2 đã có deployment Main được chủ dự án yêu cầu ngày 12/10/2026:** [quy trình SQL/backup/rollback](deployments/seed-v2-main/README.md), [báo cáo kết quả](../docs/seed/MAIN_SEED_PROMOTION_REPORT.md). Backend dùng DB chính như cấu hình hiện hữu; accounts demo mới ở seed README. Các lệnh reset/test thường vẫn chỉ chạy trên disposable targets.

Seed v2 hiện hành: [pipeline và accounts demo](10_seed/README.md), [reset guards](../docs/seed/RESET_PLAN.md), [verification evidence](../docs/seed/SEED_VERIFICATION_REPORT.md). Commands lịch sử bên dưới chỉ mô tả các đợt audit/migration cũ; seed/rebuild/test aliases hiện nay dùng exact targets và contract v2. Không chạy fixtures có identity/count của seed cũ trên dataset mới. Schema/SP/migrations được giữ nguyên.

Use a disposable SQL Server database for reset, seed, fixture, integration and concurrency tests. The [test pipeline](../scripts/db/TEST_PIPELINE.md) documents guarded preflight, build, seed, fixture verification and cleanup. Seed data and reproducible fixtures are documented in [seed](10_seed/README.md) and [fixture matrix](10_seed/test_fixture/fixture-matrix.md); concurrency cases are in [concurrency tests](11_tests/concurrency/README.md).

The npm commands are defined in the repository root `package.json`. Before running any command that writes to SQL Server, pass an explicitly named test database and satisfy its current target confirmation. Never use `CinemaBookingDB` as a regression target. Main-database verification is read-only except for an explicitly authorized, reviewed deployment.

## Source layout

### Fixed RBAC (11 October 2026)

Only Customer (`KHACH_HANG`), Manager (`QUAN_LY_RAP`), CSKH and Admin (`ADMIN`) are supported. Seed definitions remain 4 roles, 23 permission entries and 40 Role–Permission pairs. Historical permission codes are retained for dependencies; their presence does not expose retired management workflows. Account roles are immutable after creation. Customer registration creates Customer only; Admin creates Manager/CSKH/Admin only. Manager cinema assignments remain editable through existing procedures and scope checks.

`ADM-03`, `ADM-04` and `ADM-05` are RETIRED. With QLR-10 and ADM-18, the current baseline is 44 active Use Cases and 47 traceable IDs; the prior fixed-RBAC-only baseline was 42 active. The seven legacy RBAC write procedures keep their signatures but throw `50405`; `db_executor` is explicitly denied execution. The account-role trigger rejects changes with `50406`. No table, constraint or procedure is dropped.

The reviewed source migration is [r9_fixed_rbac.sql](13_migrations/r9_fixed_rbac.sql). It uses the connection's selected database, asserts the existing catalog/matrix before mutation and applies changes transactionally without reseeding. A catalog mismatch blocks deployment rather than replacing existing grants. Main deployment requires explicit authorization and target review under the rule above; repository changes alone do not protect direct SQL calls on an unmigrated database.

On an explicitly selected, seeded disposable database, run:

```powershell
node scripts/db/fixed-rbac-smoke.mjs --database=CinemaBookingDB_R0_FIXED_RBAC_20261011
node scripts/db/run.mjs test --database=CinemaBookingDB_R0_FIXED_RBAC_20261011
node scripts/db/run.mjs verify --database=CinemaBookingDB_R0_FIXED_RBAC_20261011
```

The smoke runner starts the real Backend against the selected test database, exercises HTTP/SQL authorization and assignment transfer, and applies the migration only to the validated test target. Evidence is written to ignored `.audit-output/`.

- `00_database/` — database creation, options and the reset entry's drop script.
- `01_schema/` — schema setup; current application objects use `dbo`.
- `02_tables/` — 27 canonical table definitions.
- `03_constraints/` — primary/unique keys, foreign keys, checks and defaults.
- `04_indexes/` — additional indexes, including filtered unique indexes.
- `05_functions/` — 21 business, authorization and time functions.
- `06_views/` — 6 read models.
- `07_triggers/` — 8 integrity and fixed-role triggers.
- `08_procedures/` — 134 procedures, including compatibility aliases and explicit RBAC refusal procedures.
- `09_security/` — the application's EXECUTE-only database role.
- `10_seed/` — current seed-v2 catalog, dynamic demo, test fixtures and verification/backup SQL.
- `11_tests/` — database and concurrency checks.
- `12_verify/` — canonical object and definition verification.
- `13_migrations/` — reviewed migrations; inspect the migration and its target guards before use.
- `deployments/seed-v2-main/` — reviewed Main seed promotion SQL and manual recovery, used by `scripts/db/promote-seed-main.mjs`. See its [deployment and recovery guide](deployments/seed-v2-main/README.md).

Folder cleanup (13 October 2026) removed two empty legacy-layout placeholders, two unreferenced R55 verification entries and five obsolete R7.2 deployment files. The R7.2 runner pinned a previous server/GUID, expected 159 modules and 192 tests, and required evidence no longer present in this checkout. Its two procedure sources remain in the canonical build. The current seed contract is `10_seed/verify/seed-v2.sql`; the retired R54 fixture counts are not used. Canonical build/seed/test/verify SQL, all 27 tables, all 169 modules, migrations, standalone regression/concurrency tests and seed-v2 deployment/recovery tools were retained. Historical names alone do not make a file safe to delete.

See [the final system audit](../docs/FINAL_SYSTEM_AUDIT.md) for current acceptance and verification status.

## Staff booking management — QLR-10 / ADM-18

Nine new procedures in `08_procedures/staff_booking/` perform actor authorization, active Customer validation, scope validation, parent locks, list/detail/lookups, pending creation, approved seat edits and logical cancellation. Creation delegates to the unchanged Customer booking SP. No fixed RBAC seed, Customer SP, table, constraint or payment contract changes. Inventory: 27 tables / 169 modules (134 SP, 6 views, 21 functions, 8 triggers).

The migration [r10_staff_booking.sql](13_migrations/r10_staff_booking.sql) verifies the fixed RBAC matrix and adds modules transactionally to the explicitly selected database; no reset/reseed, no hardcoded USE or physical deletion. Apply r9 first if the target has not yet received fixed RBAC. Main deployment still requires authorization and target review; this task verified only `CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2`.

Approved edit rules: same show; unexpired hold; pending order; no payment attempts, products, promotions or used tickets. Retained tickets keep code/price/ID; removed tickets remain canceled; new tickets use current authoritative prices. Expected active ticket IDs prevent concurrent edits overwriting each other. Owner/show/hold remain unchanged. Paid/used orders are read-only; no voluntary refund or physical deletion.

On a built/seeded isolated target, run sequentially:

```powershell
node scripts/db/run.mjs test --database=CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2
node scripts/db/staff-booking-smoke.mjs --database=CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2
node scripts/db/staff-booking-browser.mjs --database=CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2
node scripts/db/run.mjs verify --database=CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2
```

The SQL regression rolls fixtures back. HTTP smoke intentionally retains a paid order and canceled histories on the test target; its result provides the paid/foreign IDs consumed by the browser runner. Browser testing uses installed Edge and native CDP with a temporary profile under ignored `.audit-output/`, a real Backend, and a Vite proxy explicitly pointed to that Backend/Test DB. No browser/UI dependency is installed. Run canonical SQL tests before browser tests, because legacy smoke chooses the first seat without checking availability; a failed browser fixture can temporarily hold that seat. A failed first build target remains isolated and is not a valid test target. See the current [audit](../docs/FINAL_SYSTEM_AUDIT.md) for actual results and deployment limits.
