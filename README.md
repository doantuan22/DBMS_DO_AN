# Hệ thống đặt vé xem phim trực tuyến cho chuỗi rạp

Ứng dụng web đặt vé xem phim cho chuỗi rạp: xem phim và lịch chiếu, chọn ghế, mua đồ ăn, khuyến mãi, thanh toán, đánh giá, khiếu nại. Bốn vai trò: `KHACH_HANG`, `QUAN_LY_RAP`, `CSKH`, `ADMIN`. Thiết kế chi tiết: `Phân Tích _ Thiết Kế.md`.

Kế hoạch triển khai hiện hành: [Roadmap V2 DBMS-first](KeHoach_PhatTrien_DuAn_DatVeXemPhim_DBMS_First_v2%20%281%29.md).

Kiến trúc **DBMS-first**: SQL Server giữ toàn vẹn dữ liệu và nghiệp vụ; backend chỉ điều phối; frontend chỉ hiển thị. Xem [docs/architecture.md](docs/architecture.md).

Policy R2: xác nhận thanh toán mô phỏng trong hạn giữ ghế; chặn hủy suất có
đơn giữ hợp lệ; bồi thường điểm phần vé khi hủy suất đã có khách thanh toán.
Xem [báo cáo R2 và kiểm thử](audit/remediation/r2/R2_REPORT.md).
Ledger bồi thường đã chuẩn hóa theo
[R2-FIX 3NF](audit/remediation/r2fix/R2_FIX_REPORT.md), giữ nguyên policy R2.

```
React.js -> REST -> Express (Route > Middleware > Controller > Service)
         -> DB Procedure Client (mssql) -> EXEC Stored Procedure -> SQL Server
```

## Ba module độc lập

| Thư mục | Công nghệ |
| --- | --- |
| `frontend/` | React 19, Vite (tooling), React Router |
| `backend/` | Node.js, Express 5, `mssql` (ES modules) |
| `database/` | Microsoft SQL Server (T-SQL) |

## Cài đặt và chạy

Yêu cầu: Node.js >= 20.12, npm, SQL Server và sqlcmd cho database tooling.

```bash
npm run install:all        # hoặc: npm install trong backend/ và frontend/
```

Backend:

```bash
cd backend
cp .env.example .env       # điền DB_USER, DB_PASSWORD, ...
npm run dev                # http://localhost:4000/api/health
npm test
```

Frontend:

```bash
cd frontend
cp .env.example .env       # VITE_API_BASE_URL
npm run dev                # http://localhost:5173
npm run build
```

Biến môi trường backend: `PORT`, `NODE_ENV`, `DB_SERVER`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `DB_ENCRYPT`, `DB_TRUST_SERVER_CERTIFICATE`, `FRONTEND_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`. Không commit file `.env`.

Dựng DEV từ source bằng `npm.cmd run db:build -- --database=CinemaBookingDB_R0_R8Clean`, rồi kiểm tra bằng `db:verify`, `db:test`, `db:smoke` với cùng target. `db:reset` DROP/CREATE toàn bộ target; chỉ dùng trên DB fixture có tên rõ ràng, không reset/seed DB chính đã có dữ liệu. Backend DEV phải trỏ DB_DATABASE vào target muốn chạy. Cấu trúc, SQLCMD và migration: [database/README.md](database/README.md); backup/restore và deployment: [release guide](docs/RELEASE_READINESS.md). Production dùng application login EXECUTE-only.

Auth dùng Bearer JWT, thời hạn mặc định `1h`; token chỉ lưu trong `sessionStorage` của tab trình duyệt. Tạo secret tối thiểu 32 byte cho `JWT_SECRET` bằng lệnh trong `backend/.env.example`. Đăng ký thành công tạo khách hàng và chuyển về màn hình đăng nhập; profile chỉ sửa họ tên, điện thoại, ngày sinh và giới tính.

Auth API hiện có `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/me` và `GET /api/auth/permissions`. Login trả `token` dạng Bearer; quyền được nạp từ `sp_Auth_Login` và làm mới từ `sp_RBAC_GetPermissionsByUser` cho mỗi request đã xác thực. Để kiểm tra giao diện, chạy `npm test` trong `frontend/`.

Phase 3 public catalog dùng dữ liệu SQL thật qua Stored Procedure: `GET /api/movies`, `GET /api/movies/:movieId`, `GET /api/genres`, `GET /api/cinemas`, `GET /api/movies/:movieId/showtimes`, `GET /api/showtimes/:showtimeId`. Hợp đồng tham số và response: [docs/api-phase3.md](docs/api-phase3.md). Các route này public, không yêu cầu JWT.

## Quy tắc bắt buộc

1. **Stored-Procedure-only**: backend chỉ được `pool -> request() -> .input()/.output() -> .execute('dbo.sp_xxx')`. Table, View, Function không được truy cập trực tiếp; View đọc qua procedure bọc, Function gọi trong procedure.
2. **Không SQL thô trong backend**: không `SELECT/INSERT/UPDATE/DELETE/MERGE/JOIN/GROUP BY`, không transaction SQL, không `.query()`, không ORM/query builder (Prisma, Sequelize, TypeORM, Knex).
3. Tên procedure lấy từ whitelist `backend/src/db/procedures.js`, không nhận từ client.
4. SQL nghiệp vụ và baseline nằm trong `database/`. Production application login chỉ có `EXECUTE`; DEV/R0 dùng `sa` từ environment.
5. Kiểm tra tự động: `npm run audit:no-sql`.

## Thứ tự phát triển

**DBMS** (schema, constraint, trigger, procedure, test) -> **Backend** (API gọi procedure) -> **Frontend** (giao diện gọi API).

## Trạng thái

R0–R7 đã hoàn thành; phạm vi nghiệm thu hiện hành là **45 UC: Customer 14, Manager 9, CSKH 6, Admin 16**. SeatMap, booking/payment, khiếu nại và cả ba portal đã có trong source. R8 kiểm tra bản build production với API/SQL thật trên DB fixture; không thêm nghiệp vụ.

Hướng dẫn bàn giao: [Release readiness](docs/RELEASE_READINESS.md). Kết quả cuối: [R8 acceptance](audit/final/r8/FINAL_ACCEPTANCE_REPORT.md), [45 UC](audit/final/r8/UC_TRACEABILITY_FINAL.md), [permission matrix](audit/final/r8/PERMISSION_MATRIX.md). Các báo cáo audit cũ là evidence lịch sử, không đại diện trạng thái release hiện tại.
