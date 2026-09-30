# Hệ thống đặt vé xem phim trực tuyến cho chuỗi rạp

Ứng dụng web đặt vé xem phim cho chuỗi rạp: xem phim và lịch chiếu, chọn ghế, mua đồ ăn, khuyến mãi, thanh toán, đánh giá, khiếu nại. Bốn vai trò: `KHACH_HANG`, `QUAN_LY_RAP`, `CSKH`, `ADMIN`. Thiết kế chi tiết: `Phân Tích _ Thiết Kế.md`.

Kế hoạch triển khai hiện hành: [Roadmap V2 DBMS-first](KeHoach_PhatTrien_DuAn_DatVeXemPhim_DBMS_First_v2%20(1).md).

Kiến trúc **DBMS-first**: SQL Server giữ toàn vẹn dữ liệu và nghiệp vụ; backend chỉ điều phối; frontend chỉ hiển thị. Xem [docs/architecture.md](docs/architecture.md).

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

Yêu cầu: Node.js >= 20, npm, SQL Server.

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

Auth dùng Bearer JWT, thời hạn mặc định `1h`; token chỉ lưu trong `sessionStorage` của tab trình duyệt. Tạo secret tối thiểu 32 byte cho `JWT_SECRET` bằng lệnh trong `backend/.env.example`. Đăng ký thành công tạo khách hàng và chuyển về màn hình đăng nhập; profile chỉ sửa họ tên, điện thoại, ngày sinh và giới tính.

Auth API hiện có `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/me` và `GET /api/auth/permissions`. Login trả `token` dạng Bearer; quyền được nạp từ `sp_Auth_Login` và làm mới từ `sp_RBAC_GetPermissionsByUser` cho mỗi request đã xác thực. Để kiểm tra giao diện, chạy `npm test` trong `frontend/`.

Phase 3 public catalog dùng dữ liệu SQL thật qua Stored Procedure: `GET /api/movies`, `GET /api/movies/:movieId`, `GET /api/genres`, `GET /api/cinemas`, `GET /api/movies/:movieId/showtimes`, `GET /api/showtimes/:showtimeId`. Hợp đồng tham số và response: [docs/api-phase3.md](docs/api-phase3.md). Các route này public, không yêu cầu JWT.

## Quy tắc bắt buộc

1. **Stored-Procedure-only**: backend chỉ được `pool -> request() -> .input()/.output() -> .execute('dbo.sp_xxx')`. Table, View, Function không được truy cập trực tiếp; View đọc qua procedure bọc, Function gọi trong procedure.
2. **Không SQL thô trong backend**: không `SELECT/INSERT/UPDATE/DELETE/MERGE/JOIN/GROUP BY`, không transaction SQL, không `.query()`, không ORM/query builder (Prisma, Sequelize, TypeORM, Knex).
3. Tên procedure lấy từ whitelist `backend/src/db/procedures.js`, không nhận từ client.
4. Mọi file SQL nằm trong `database/`. Tài khoản ứng dụng chỉ có `EXECUTE`.
5. Kiểm tra tự động: `npm run audit:no-sql`.

## Thứ tự phát triển

**DBMS** (schema, constraint, trigger, procedure, test) -> **Backend** (API gọi procedure) -> **Frontend** (giao diện gọi API).

## Trạng thái

Database baseline đã có schema, constraints, procedures, seed và SQL verification scripts; không triển khai lại schema từ ứng dụng. Phase 2 Authentication/RBAC và Phase 3 public movie/cinema/showtime catalog đã được triển khai ở Backend/Frontend. SeatMap, booking và các portal nghiệp vụ vẫn thuộc các phase tiếp theo. Mỗi môi trường local cần tự cấu hình `JWT_SECRET` và account demo theo quy trình Database đã được nhóm phê duyệt.
