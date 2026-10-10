# Hệ thống đặt vé xem phim — DBMS-first

Kiến trúc của dự án là React → REST API → Express → Stored Procedure → SQL Server. Baseline chính thức có 45 Use Case: Customer 14, Manager 9, CSKH 6 và Admin 16; ADM-17 nằm ngoài phạm vi.

Tài liệu chuẩn: [phân tích và thiết kế](<Phân Tích _ Thiết Kế.md>), [database](database/README.md), [Use Case matrix](docs/USE_CASE_MATRIX_45.md), [Frontend gap matrix](docs/R8_FRONTEND_GAP_MATRIX.md), [final system audit](docs/FINAL_SYSTEM_AUDIT.md) và [R8.3 re-acceptance](docs/R8_3_REACCEPTANCE_REPORT.md).

Backend chỉ gọi Stored Procedure đã whitelist bằng tham số SQL có kiểu. Quy tắc nghiệp vụ, tiền, trạng thái booking, quyền, phạm vi rạp, transaction và concurrency do SQL Server quyết định. Không thêm ORM, query builder hay SQL nghiệp vụ vào Backend.

## Cài đặt và kiểm tra

Từ thư mục gốc, cài formatter và dependencies của ứng dụng:

```powershell
npm.cmd run install:all
```

Các lệnh kiểm tra source, unit tests và production build:

```powershell
npm.cmd run format:check
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
node scripts/audit-no-sql.mjs
node scripts/db/contract-check.mjs
```

`npm.cmd run format` áp dụng quy tắc Prettier cho Frontend, Backend, tests, shared contracts và JavaScript tooling. SQL Server scripts giữ nguyên batch `GO` và được kiểm tra bằng SQL verification/integration suites thay vì một formatter không hiểu batch semantics.

Các file kết quả audit mới được ghi dưới `.audit-output/` và không đưa vào Git. Không chạy lệnh reset, build, seed, migration hay test mutation trỏ tới database chính `CinemaBookingDB`; browser/integration tests phải xác minh target độc lập trước khi ghi dữ liệu.

## Database tooling

SQL Server local dùng cấu hình trong `backend/.env` hoặc biến môi trường. `db:inventory` chỉ đọc metadata của database đã chỉ định; output nằm ở `.audit-output/database/`. Lệnh reset/build/seed và phase scripts có thể thay đổi dữ liệu, vì vậy chỉ dùng với database disposable đã được xác minh.
