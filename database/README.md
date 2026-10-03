# CinemaBookingDB — R0 reproducible baseline

SQL Server giữ toàn bộ SQL nghiệp vụ, integrity, concurrency, transaction, giá và booking authoritative. Backend chỉ bind input/output có type và execute procedure trong whitelist `backend/src/db/procedures.js`. Không raw SQL, query API, ORM, hoặc transaction SQL trong backend.

Baseline đã reconcile: **26 bảng, 6 view, 17 function, 7 trigger, 124 procedure, 61 index (gồm backing index), 157 constraint**. Bảng thứ 26 HINHANH_RAPCHIEUPHIM là bảng nghiệp vụ từ migration 009, được giữ. Xem [_audit/reconciliation-report.md](_audit/reconciliation-report.md).

## Folder và dependency

| Folder | Nội dung |
|---|---|
| 00_database | DROP riêng, CREATE fail nếu DB tồn tại, options/collation |
| 01_schema | dbo schema hiện hành |
| 02_tables | Một file/table, datatype/identity/computed |
| 03_constraints | PK/UQ/FK/CHECK/DEFAULT có tên ổn định |
| 04_indexes | Performance/filtered indexes, không lặp backing index |
| 05_functions | Một file/function, dependency order |
| 06_views | Một file/view, projection cột rõ ràng |
| 07_triggers | Một file/trigger |
| 08_procedures | Một file/SP theo auth/public/customer/booking/payment/manager/support/admin/system |
| 09_security | Role db_executor EXECUTE-only, map login có sẵn |
| 10_seed | Reference/demo fixtures |
| 11_tests | Smoke rollback, multirow trigger, integrity, permission, concurrency |
| 12_verify | Tên/cấu trúc/signature/binding/dependency/orphan/seed |
| _audit | Inventory, reconciliation, bằng chứng và deferred issues |
| _legacy_snapshot | Source/deployment/tests cũ, không được baseline include |

build-objects.sql liệt kê file theo thứ tự, không glob. run-all.sql = objects → seed → verify; reset-database.sql = DROP → run-all. Tám DEFAULT gọi fn_BayGio chạy **sau functions** qua 03_constraints/005_function_defaults.sql; constraint còn lại chạy trước index/function. Đây là dependency kỹ thuật, giữ nguyên policy thời gian.

## Setup và DEV sa

Cần SQL Server 2016 SP1+, Node ≥20.12, sqlcmd trên PATH. Baseline giữ options/compatibility 170 trên SQL Server 2025 đã inventory; trên bản cũ tự chọn compatibility tối đa của version đó (tối thiểu 130 cho OPENJSON). Các version cũ chưa được chạy integration trong phiên R0 này. Không hardcode MDF/LDF path.

Chạy npm run install:all, copy backend/.env.example sang backend/.env:

```dotenv
NODE_ENV=development
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=CinemaBookingDB
DB_USER=sa
DB_PASSWORD=
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
JWT_SECRET=
```

Điền password developer và JWT_SECRET riêng. Không commit .env. Backend đọc environment; runner truyền password cho sqlcmd bằng SQLCMDPASSWORD, không command argument/file/log. **sa chỉ cho DEV/R0**; production dùng application login quyền tối thiểu/EXECUTE-only. Security không tạo/reset server login/password. Nếu CinemaAppUser đã có trên server thì map user vào db_executor; clone mới dùng sa nên không cần login này.

## Commands

Từ repository root; **reset xóa toàn bộ database và dữ liệu**:

```powershell
npm run db:reset
# PowerShell wrapper tương đương:
powershell -ExecutionPolicy Bypass -File scripts/reset-db.ps1
# Build chỉ khi DB chưa tồn tại:
npm run db:build
npm run db:seed
npm run db:verify
npm run db:test
npm run db:smoke
npm run db:contracts
npm run audit:no-sql
npm run test:backend
```

Nếu PowerShell chặn npm.ps1, dùng npm.cmd. Fail SQL/verify trả nonzero và dừng pipeline. Rebuild fail có thể để lại DB dựng dở; sửa lỗi rồi reset. Không chạy trong NODE_ENV=production. Runner chỉ nhận CinemaBookingDB hoặc disposable CinemaBookingDB_R0_*.

SeedDate mặc định ngày hiện tại ở Việt Nam; `npm run db:reset -- --seed-date=2026-10-03` tái lập fixture chính xác. Suất demo là ngày sau SeedDate; ngày quá cũ thì smoke yêu cầu reset. Fixture ID cố định dùng explicit IDENTITY_INSERT trong DB trống, test tìm bằng business key, không phụ thuộc identity của DB cũ. Seed lặp không duplicate. Không import đơn/thanh toán/khiếu nại audit hay sửa DATA-001; promotion counter khởi tạo 0 vì chưa có đơn.

SQLCMD trực tiếp/SSMS SQLCMD Mode: working directory **database/**. Ví dụ Windows authentication:

```powershell
cd database
sqlcmd -S localhost -E -C -I -b -f 65001 -v SeedDate=2026-10-03 -i reset-database.sql
```

SQL authentication lấy -U từ environment, password qua SQLCMDPASSWORD; không dùng -P. Node runner resolve path độc lập CWD. --integrated hỗ trợ Windows authentication cho tooling, backend R0 vẫn kiểm tra sa. .bak chỉ recovery, không phải prerequisite; vị trí backup local bị Git ignore.

## Verify và tests

Verify so sánh hai chiều tên object, columns/type/length/precision/scale/identity/computed/default, PK/FK/UQ/CHECK, index key/include/filter, trigger enabled/events, signature/output parameter, dependency và mọi FK orphan. SP/view/trigger refresh; function bind không ALTER function đang được DEFAULT tham chiếu. Node db:verify thêm definition parity với từng source file; SQL verify trực tiếp kiểm tra cấu trúc. Manifest version-control không tự chấp nhận DB drift.

SQL smoke bao phủ auth/public/showtime/seat/booking/payment/order/review/complaint/manager/CSKH/admin/report, output và rollback fixture ghi. Trigger/integrity test kiểm tra lỗi thực. Permission user probe không login được xóa sau test. Rollback không trả identity sequence đã cấp; reset vẫn có fixture ID ổn định. HTTP smoke mở server tạm với mssql/procedure client thật, đăng nhập bốn vai trò rồi đóng server/pool. Demo accounts giữ password demo đã có trong source cũ, 123456.

Concurrency dùng disposable DB vì fixture có commit:

```powershell
npm run db:build -- --database=CinemaBookingDB_R0_Stress
npm run db:smoke -- --database=CinemaBookingDB_R0_Stress --stress
```

Không include legacy tests trong pipeline mới. Mapping lỗi thiếu từ DB cũ ghi ở _audit/known-contract-gaps.json; test phát hiện gap mới và giữ danh sách gap đã báo cáo, không coi các gap là đã remediation.

## Thêm/sửa object

Giữ tên table/column/status/permission và contract hiện hành. Module dùng CREATE OR ALTER, ANSI_NULLS/QUOTED_IDENTIFIER ON. SP có NOCOUNT, typed parameters, projection cột rõ ràng; transaction dùng TRY/CATCH và rollback theo ownership/savepoint. Không thêm transaction cho mọi SP.

1. Table: thêm 02_tables/table.sql; thêm PK/UQ/FK/CHECK/DEFAULT/index ở vùng tương ứng. Không đổi business constraint chỉ để test qua.
2. Function: thêm 05_functions/name.sql trước module phụ thuộc; function-backed DEFAULT chạy sau function.
3. View: thêm 06_views/name.sql với explicit columns; API đọc qua SP wrapper.
4. Trigger: thêm 07_triggers/name.sql, set-based, multirow test, THROW rõ ràng.
5. SP: thêm 08_procedures/module/name.sql. Ưu tiên sp_Module_Action, giữ tên usp_/legacy đang dùng; đổi contract thì update whitelist/service/test cùng change.
6. Thêm file vào build-objects.sql đúng dependency order; cập nhật seed/test.
7. Regenerate expectation từ **source trong database mới**, không từ DB đã sửa tay:

```powershell
npm run db:refresh-manifest -- --database=CinemaBookingDB_R0_Manifest01
```

Lệnh fail nếu target tồn tại, dựng objects từ source rồi ghi manifest và SQL verification. Review diff, clean reset, verify/test/smoke. generate-baseline.mjs/generate-seed.mjs chỉ là extraction R0 từ snapshot lịch sử, không dùng để bảo trì thường ngày vì sẽ ghi đè baseline.

Không sửa DB thủ công rồi quên commit SQL. Không include _audit/_legacy_snapshot vào build. Clone mới chỉ cần source, environment, SQL Server/sqlcmd và Node, không export SQL riêng hay .bak.
