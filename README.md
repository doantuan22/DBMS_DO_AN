# Hệ thống đặt vé xem phim trực tuyến cho chuỗi rạp

Ứng dụng web đặt vé xem phim cho chuỗi rạp: xem phim và lịch chiếu, chọn ghế, mua đồ ăn, khuyến mãi, thanh toán, đánh giá, khiếu nại. Bốn vai trò: `KHACH_HANG`, `QUAN_LY_RAP`, `CSKH`, `ADMIN`. Thiết kế chi tiết: `Phân Tích _ Thiết Kế.md`.

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

## Quy tắc bắt buộc

1. **Stored-Procedure-only**: backend chỉ được `pool -> request() -> .input()/.output() -> .execute('dbo.sp_xxx')`. Table, View, Function không được truy cập trực tiếp; View đọc qua procedure bọc, Function gọi trong procedure.
2. **Không SQL thô trong backend**: không `SELECT/INSERT/UPDATE/DELETE/MERGE/JOIN/GROUP BY`, không transaction SQL, không `.query()`, không ORM/query builder (Prisma, Sequelize, TypeORM, Knex).
3. Tên procedure lấy từ whitelist `backend/src/db/procedures.js`, không nhận từ client.
4. Mọi file SQL nằm trong `database/`. Tài khoản ứng dụng chỉ có `EXECUTE`.
5. Kiểm tra tự động: `npm run audit:no-sql`.

## Thứ tự phát triển

**DBMS** (schema, constraint, trigger, procedure, test) -> **Backend** (API gọi procedure) -> **Frontend** (giao diện gọi API).

## Trạng thái

Mới ở mức foundation: cấu trúc thư mục, cấu hình, procedure client, route/layout theo vai trò và endpoint `/api/health`. Chưa có schema, use case hay xác thực hoàn chỉnh.
