# 🎬 CinemaStar - Hệ Thống Đặt Vé Xem Phim Trực Tuyến

Dự án môn học Hệ Cơ Sở Dữ Liệu (DBMS) — Hệ thống đặt vé xem phim trực tuyến gồm **Database (SQL Server)**, **Backend REST API (Node.js/Express)** và **Frontend (React 19 + Vite)**.

---

## 📋 Yêu cầu môi trường (Prerequisites)

Trước khi chạy dự án, máy tính cần cài sẵn:
1. **Node.js**: Phiên bản 20+ (Khuyên dùng Node.js 20 hoặc 22 LTS). Kiểm tra: `node -v`
2. **Microsoft SQL Server**: SQL Server 2019/2022 hoặc SQL Server Express đang chạy cổng mặc định `1433`.
3. **SQL Server Management Studio (SSMS)** *(Tùy chọn)*: Để quản lý và chạy script SQL.
4. **Git**: Để clone mã nguồn.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Bước 1: Clone dự án về máy
```bash
git clone <URL_REPO_CUA_BAN>
cd DBMS_DO_AN
```

### Bước 2: Cài đặt thư viện dependencies
Chạy lệnh cài đặt đồng thời cho cả Backend và Frontend:
```bash
npm run install:all
```
*(Hoặc vào từng thư mục để cài: `npm --prefix backend install` và `npm --prefix frontend install`)*.

---

### Bước 3: Cấu hình biến môi trường (`backend/.env`)

Tạo file `.env` bên trong thư mục `backend` (copy từ `backend/.env.example`):

- **PowerShell (Windows):**
  ```powershell
  Copy-Item backend\.env.example backend\.env
  ```
- **Bash / Linux / MacOS:**
  ```bash
  cp backend/.env.example backend/.env
  ```

Mở file `backend/.env` và cập nhật mật khẩu tài khoản `sa` của SQL Server trên máy bạn:

```env
PORT=4000
NODE_ENV=development

DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=CinemaBookingDB
DB_USER=sa
DB_PASSWORD=MatKhauSQLCuaBan   # <-- Thay bằng mật khẩu sa SQL Server của bạn
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

FRONTEND_URL=http://localhost:5173

JWT_SECRET=super_secret_jwt_key_cinema_booking_2026
JWT_EXPIRES_IN=1h
```

---

### Bước 4: Khởi tạo Cơ sở dữ liệu (Database Setup)

Bạn có thể chọn **1 trong 2 cách** sau:

#### Cách A: Dùng script tự động của dự án (Khuyên dùng)
Ngay tại thư mục gốc `DBMS_DO_AN`, chạy:
```bash
# 1. Tạo Database, Bảng, View, Stored Procedure, Trigger
npm run db:build

# 2. Nạp dữ liệu mẫu (Phim, Rạp, Suất chiếu, Ghế, Tài khoản mẫu)
npm run db:seed
```

#### Cách B: Chạy thủ công qua SSMS (SQL Server Management Studio)
1. Mở SSMS và kết nối đến SQL Server.
2. Mở file `database/run-all.sql` và nhấn **Execute (F5)** để tạo Database.
3. Mở file `database/10_seed/seed-all.sql` và nhấn **Execute (F5)** để nạp dữ liệu mẫu.

---

### Bước 5: Khởi động hệ thống

Mở **2 cửa sổ Terminal** riêng biệt:

#### 🟢 Terminal 1: Chạy Backend (Port 4000)
```powershell
npm run dev:backend
# Hoặc: npm.cmd --prefix backend run dev
```
Khi backend sẵn sàng sẽ báo: `API listening { port: 4000, environment: 'development' }`.

#### 🔵 Terminal 2: Chạy Frontend (Port 5173)
```powershell
npm run dev:frontend
# Hoặc: npm.cmd --prefix frontend run dev
```
Truy cập ứng dụng tại: **`http://localhost:5173`**

---

## 👥 Tài Khoản Mẫu Để Đăng Nhập Thử Nghiệm

Mật khẩu mặc định cho **tất cả** các tài khoản dưới đây là: **`123456`**

| Vai trò | Email đăng nhập | Mật khẩu | Quyền hạn / Khu vực truy cập |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@cinemadb.vn` | `123456` | Toàn quyền hệ thống, xem dashboard, phân công, quản lý rạp, phim, giá vé, người dùng |
| **Quản lý rạp (Manager)** | `manager.q1@cinemadb.vn` | `123456` | Quản lý phòng chiếu, ghế ngồi, xếp suất chiếu, bảng giá và doanh thu cụm rạp Q1 |
| **CSKH (Support)** | `cskh@cinemadb.vn` | `123456` | Tiếp nhận và xử lý hàng chờ khiếu nại, tra cứu đơn hàng, timeline giải quyết |
| **Khách hàng (Customer)** | `khachhang1@gmail.com` | `123456` | Xem lịch chiếu, đặt vé, chọn combo bắp nước, áp mã giảm giá, thanh toán, gửi khiếu nại |

---

## 🧪 Chạy Kiểm Thử (Tests)

- **Frontend tests (40 test cases):**
  ```bash
  npm --prefix frontend test
  ```
- **Backend tests:**
  ```bash
  npm run test:backend
  ```
- **Build Frontend production:**
  ```bash
  npm run build:frontend
  ```
