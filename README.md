# Hệ thống đặt vé xem phim — DBMS-first

React → REST API → Express → Stored Procedure → SQL Server. Baseline chính thức **45 UC: KH14, QLR9, CSKH6, Admin16**. Xem [baseline](docs/USE_CASE_BASELINE_45.md), [roadmap bắt buộc](ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md), [accepted constraints](docs/PROJECT_ACCEPTED_CONSTRAINTS.md) và [báo cáo R0](docs/R0_TASK_1_REPORT.md).

SQL Server `sa` được chấp nhận cho đồ án/local; kiến trúc Stored-Procedure-Only vẫn bắt buộc. Pricing có đúng Ngày thường / Cuối tuần / Tất cả. Source database và hướng dẫn chi tiết: [database/README.md](database/README.md). Các script `r1`…`r8` là tooling của các đợt trước, không tự chạy để triển khai Phase tiếp theo.

Kiểm tra ứng dụng từ repo root sau khi cài dependencies ở backend/frontend:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
node scripts/audit-no-sql.mjs
node scripts/db/contract-check.mjs
```

Kiểm tra R0 trên một database disposable **mới**, với cấu hình SQL local trong `backend/.env` hoặc environment:

```powershell
node scripts/db/run.mjs build --database=CinemaBookingDB_R0_MyFreshRun
node scripts/r0/verify.mjs --database=CinemaBookingDB_R0_MyFreshRun --apply
node scripts/r0/pricing-api.mjs --database=CinemaBookingDB_R0_MyFreshRun --stress
node scripts/r0/run-checks.mjs --database=CinemaBookingDB_R0_MyFreshRun
```

Test precondition cần một disposable khác, có seed và không dùng tiếp để kiểm thử contract mới:

```powershell
node scripts/db/run.mjs build --database=CinemaBookingDB_R0_MyLegacyFixture
node scripts/r0/verify.mjs --database=CinemaBookingDB_R0_MyLegacyFixture --exercise-precondition
```

Migration hiện hành: [database/13_migrations/r0_remove_holiday_pricing.sql](database/13_migrations/r0_remove_holiday_pricing.sql). Áp dụng local tại chỗ bằng `node scripts/r0/verify.mjs --database=CinemaBookingDB --apply` sau evidence disposable PASS; script backup/verify restore, kiểm tra dữ liệu legacy, transaction, parity và fingerprints. Không reset/seed database đang dùng. Nếu có dòng legacy, dừng và cần quyết định nghiệp vụ riêng, không tự đổi/xóa.

Tooling DB dùng `sqlcmd`; riêng lỗi khởi tạo TLS của client ODBC trước khi chạy SQL được fallback sang `mssql`, giữ UTF-8 và session qua GO. Backend không import tooling này. Evidence [R0](docs/r0-20261007/README.md) tách khỏi [snapshot audit lịch sử](docs/audit-20261007/README.md).
