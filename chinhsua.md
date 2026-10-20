# Đối chiếu `docs/Bao_Cao_Do_An_Hoan_Chinh.docx` với dự án thực tế

Ngày đối chiếu: 19/10/2026. Nguồn đối chiếu: mã nguồn trong `database/`, `backend/`, `frontend/`, `scripts/audit/`, kết quả chạy trong `.audit-output/acceptance/`.

## Kết luận nhanh

Phần kỹ thuật của báo cáo **khớp rất sát với dự án**. Đã kiểm tra bằng script và không phát hiện sai lệch ở các mục sau:

- Số lượng đối tượng CSDL: 29 bảng, 37 FK, 65 CHECK, 42 DEFAULT, 11 UNIQUE, 29 PK, 31 index (5 unique filtered), 9 trigger, 6 view, 21 function (19 scalar + 2 TVF), 147 stored procedure.
- Danh sách 147 tên procedure ở mục 3.6 trùng 100% với `CREATE OR ALTER PROCEDURE` trong `database/08_procedures/`.
- Danh sách 31 tên index ở mục 3.5 trùng 100% với `database/04_indexes/`.
- Toàn bộ cột/kiểu dữ liệu/NULL/IDENTITY của 29 bảng ở mục 2.3 và 215 tên ràng buộc/index (PK, UQ, FK, CK, DF, IX, UX) khớp với `database/02_tables`, `03_constraints`, `04_indexes`.
- 33 mã quyền, 59 cặp vai trò–quyền (Khách 7, Quản lý 8, CSKH 11, Admin 33) khớp `database/10_seed/seed_base/002_reference.sql` và `003_reference.sql`.
- `READ_COMMITTED_SNAPSHOT`, SQL Server 2016 SP1+, `fn_BayGio` trả UTC, `db_executor` + DENY + 7 SP RBAC bị từ chối, `DB_USER=sa` trong `.env.example`, `TABLOCKX` ở phân công rạp, SAVE TRAN ở `sp_Booking_Create`/`sp_Payment_UpdateResult`/`sp_Order_ExpirePending`, `sp_Manager_Room_Delete` chuyển "Ngưng hoạt động", tên CHECK/phương thức thanh toán (có `DIEM`), phiên bản thư viện ở Bảng 5.1, whitelist `PROCEDURES`, job hết hạn đơn, sessionStorage cho JWT, proxy `/api`.
- Số liệu kiểm thử ở mục 4.1.5 và 4.2.6 (78/78 API, 26/26 DB, 41/41 CSKH, 64/65 E2E, LC-CONC-01…12 PASS, chạy lại E2E-A11Y-KEYBOARD 1/1) khớp file JSON trong `.audit-output/acceptance/`.

Các điểm lệch thực sự được liệt kê bên dưới.

---

## A. Nội dung báo cáo đang thiếu / lệch so với dự án (cần sửa trong báo cáo)

### A1. Chương 6 hoàn toàn trống

- **Báo cáo hiện tại:** Chương 6 "KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN" chỉ có 3 tiêu đề (6.1 Kết quả đạt được, 6.2 Hạn chế, 6.3 Hướng phát triển), không có nội dung.
- **Nội dung đúng (đề xuất, bám sát dự án):**
  - **6.1 Kết quả đạt được:** CSDL SQL Server 29 bảng, 37 FK, 65 CHECK, 9 trigger, 6 view, 21 function, 147 stored procedure, kiến trúc DBMS-first (Backend chỉ gọi SP trong whitelist `backend/src/db/procedures.js`); đặt vé an toàn đồng thời (8 khách cùng đặt 1 ghế → 1 thành công, 7 nhận 409); chốt giá tại thời điểm đặt; RBAC cố định 4 vai trò, 33 quyền, 59 cặp, phạm vi rạp qua `PHANCONG_RAP`; 44 Use Case hoạt động (47 mã truy vết, ADM-03/04/05 ngừng); thanh toán mô phỏng (kể cả bằng điểm `DIEM`); bồi thường bằng điểm khi hủy suất; kết quả kiểm thử: backend 216/216, frontend 239/239, DB integrity 26/26, API integration 78/78, CSKH lifecycle 41/41, lifecycle 44/44, points-revenue 44/44, Browser E2E 64/65.
  - **6.2 Hạn chế:** thanh toán chỉ mô phỏng, chưa có cổng thanh toán thật; không có hoàn tiền (chỉ bồi thường bằng điểm); RBAC cố định, không sửa được vai trò/quyền; môi trường dev dùng `sa` (chưa có bằng chứng chạy kiểm thử `db_executor`/EXECUTE-only); chưa có chính sách retry deadlock thống nhất; chưa có benchmark/execution plan cho index; Browser E2E đầy đủ còn 1/65 FAIL (E2E-A11Y-KEYBOARD, chạy lại riêng thì PASS) và chưa chạy lại trên snapshot mã hiện tại; chưa có ứng dụng mobile native; chưa chứng minh 3NF đầy đủ bằng phân tích phụ thuộc hàm (các cột snapshot/số dư như `TongTienVe`, `DiemTichLuy`, `SoLuongDaDung`).
  - **6.3 Hướng phát triển:** tích hợp cổng thanh toán thật (VNPay/MoMo/ZaloPay – đã có sẵn giá trị trong CHECK `CK_THANHTOAN_PhuongThuc`); cơ chế hoàn tiền; dùng login ứng dụng EXECUTE-only (`db_executor`) khi triển khai và chạy `database/11_tests/permissions/*`; chính sách retry deadlock; benchmark index; ứng dụng mobile; cho phép cấu hình RBAC động (nếu thay đổi yêu cầu); báo cáo BI.

### A2. Các hình minh họa (Hình 5.1 → 5.11) chưa có ảnh; mục 5.3.6 đang là lời hướng dẫn chứ không phải nội dung

- **Báo cáo hiện tại:** chỉ có 11 dòng chú thích dạng `[Hình 5.x …]`; file `.docx` chỉ chứa 2 ảnh (`word/media/image1.png`, `image2.png`, là ảnh trang bìa). Mục 5.3.6 viết kiểu hướng dẫn: "có thể sử dụng…", "Các hình ảnh được lựa chọn nên là ảnh chụp trực tiếp…".
- **Nội dung đúng:** chèn ảnh chụp thật từ ứng dụng đang chạy (seed demo, tài khoản trong `note.md`, mật khẩu `CinemaStarDemo!2026`) và viết lại 5.3.6 thành mô tả các ảnh đã chèn (ví dụ: danh sách phim, chọn ghế `SeatMap`, thanh toán, quản lý phòng/ghế/suất, doanh thu rạp, xử lý khiếu nại CSKH, quản lý tài khoản/phân công, báo cáo doanh thu Admin). Hình 5.1 (kiến trúc) và 5.2 (sơ đồ tuần tự đặt vé) cần vẽ mới: React → REST API Express → `procedureClient` → Stored Procedure → SQL Server; luồng `sp_Booking_Create` (xem trước `@ChiXemTruoc` → tạo đơn → `sp_Payment_CreateAttempt` → `sp_Payment_UpdateResult`).
- Các ảnh chụp có sẵn trong `.audit-output/acceptance/screenshots/` có thể dùng làm nguồn.

### A3. Mục lục (MỤC LỤC) chỉ có tiêu đề, không có mục lục thật

- **Báo cáo hiện tại:** sau chữ "MỤC LỤC" không có trường TOC (không có `TOC` field/`w:sdt` trong `document.xml`); cũng chưa có danh mục bảng/hình.
- **Nội dung đúng:** chèn mục lục tự động theo Heading 1–3 (Word: References → Table of Contents) và danh mục Bảng 3.1–3.6, 4.1–4.3, 5.1, Hình 5.1–5.11.

### A4. Mã số sinh viên của Đoàn Anh Tuấn không thống nhất giữa hai tài liệu

- **Báo cáo hiện tại (trang bìa):** Đoàn Anh Tuấn – **24110368**.
- **`Phân Tích _ Thiết Kế.md` (tài liệu của dự án):** Đoàn Anh Tuấn – **24110366**.
- **Cần làm:** đối chiếu MSSV thật (thẻ sinh viên) rồi thống nhất hai tài liệu. Tôi không xác định được con số nào đúng từ mã nguồn. Các MSSV còn lại (Trí 24110361, Thịnh 24110337, Bằng 24110166, Huân 24110220) khớp nhau.
- Ngoài ra ngày trên bìa khác nhau: báo cáo ghi "tháng 10 năm 2026", tài liệu phân tích ghi "tháng 09 năm 2026" (chỉ cần xác nhận cho đúng bản nộp).

### A5. Mục 2.1.2 trích dẫn các file ERD không còn trong dự án

- **Báo cáo hiện tại:** liệt kê `erd/ERD_DATABASE_CINEMABOOKING.mmd`, `.dbml`, `.drawio`, `.svg`.
- **Thực tế:** thư mục `erd/` không tồn tại; các file này từng nằm ở `docs/report/erd/` và đã bị xóa khỏi cây làm việc (commit `c076986`). Không có sơ đồ ERD nào được chèn vào báo cáo.
- **Nội dung đúng:** hoặc khôi phục 4 file ERD từ git (`git show c076986^:docs/report/erd/<tên file>`) và đặt vào `docs/report/erd/` rồi sửa đường dẫn trong báo cáo; hoặc chèn hình ERD (xuất từ `.svg`/`.drawio`) vào mục 2.1.2 và bỏ đường dẫn không còn tồn tại. Hiện mục 2.1.2 không có hình ERD, trong khi đây là phần cốt lõi của chương thiết kế CSDL.

### A6. Mâu thuẫn nội bộ về số nhóm bảng: "sáu nhóm" (mục 2.1.1) và "bốn nhóm" (mục 3.1)

- **Báo cáo hiện tại:** 2.1.1.b chia 29 bảng thành **sáu nhóm** (6 + 4 + 5 + 2 + 7 + 5 bảng); 3.1 viết "được tổ chức thành **bốn nhóm** nghiệp vụ" và Bảng 3.1 gộp "Rạp, phim và lịch chiếu" (11 bảng) thành một nhóm.
- **Nội dung đúng:** cả hai cách chia đều tổng 29 bảng, nhưng cần thống nhất. Đề xuất sửa câu ở mục 3.1 thành: "Danh mục 29 bảng được trình bày theo bốn nhóm nghiệp vụ (gộp từ sáu nhóm dữ liệu ở mục 2.1.1)", hoặc đổi Bảng 3.1 sang đúng sáu nhóm như 2.1.1.

### A7. Mục 5.2.1 (giao diện/font) chưa phản ánh đúng mã nguồn Frontend

- **Báo cáo hiện tại:** "Font chữ Inter và các tài nguyên giao diện được quản lý trong thư mục tài nguyên… Thay vì phụ thuộc vào một thư viện UI lớn, dự án sử dụng các thành phần đã được xây dựng…".
- **Thực tế:**
  - Font Inter (`/assets/fonts/InterVariable.woff2`, `font-family: 'Cinema Inter'`) chỉ dùng cho khu vực công khai (`frontend/src/styles/public/public-tokens.css`). `frontend/src/styles/tokens.css` dùng `'Plus Jakarta Sans'` (Inter chỉ là font dự phòng) cho khu vực nội bộ.
  - Khu vực Admin/Manager dùng bộ icon SVG và CSS từ mẫu **TailAdmin** (`frontend/src/vendor/tailadmin/icons/*.svg`, `frontend/src/styles/admin-tailadmin.css`, nạp qua `components/ui/AdminIcon.jsx`).
- **Nội dung đúng (đề xuất thay thế):** "Giao diện khu vực công khai dùng font Inter (variable font, tự lưu trong `public/assets/fonts`), khu vực quản trị/nội bộ dùng Plus Jakarta Sans kết hợp bộ icon và CSS lấy từ mẫu TailAdmin (thư mục `src/vendor/tailadmin`); phần còn lại là các component nội bộ, không dùng thư viện UI lớn như MUI/Ant Design."

### A8. Mục 5.1.2 liệt kê chưa đủ module Frontend

- **Báo cáo hiện tại:** nêu 7 module `customer, facilities, operations, staff-bookings, support, admin-resources, admin-analytics`.
- **Thực tế (`frontend/src/features/`):** có 13 thư mục: `admin`, `admin-analytics`, `admin-resources`, `admin-rooms`, `admin-service`, `admin-workspace`, `customer`, `facilities`, `manager`, `operations`, `public`, `staff-bookings`, `support`.
- **Nội dung đúng:** bổ sung `public`, `manager`, `admin`, `admin-rooms`, `admin-service`, `admin-workspace`, hoặc đổi câu thành "gồm các module tiêu biểu như …".

### A9. Bảng 5.1 / mục 5.2.4 thiếu thông tin công cụ kiểm thử và lint

- **Báo cáo hiện tại:** Kiểm thử = "Node.js Test Runner, Playwright, axe-core"; không nêu phiên bản; không nhắc lint.
- **Thực tế:** `@playwright/test ^1.64.0`, `axe-core ^4.10.2` (ở `package.json` gốc); Frontend có `oxlint` (`npm --prefix frontend run lint`); Prettier (`npm run format:check`); Backend/Frontend đều dùng `node --test`.
- **Nội dung đúng:** thêm các phiên bản trên vào Bảng 5.1 và thêm dòng "Chất lượng mã: Prettier, oxlint".

---

## B. Điểm cần lưu ý nhưng báo cáo hiện đang đúng (không cần sửa)

- Báo cáo ghi rõ đây là số liệu từ bộ script chứ không phải truy vấn SQL Server trực tiếp (mục 3, đoạn đầu) – giữ nguyên.
- Báo cáo ghi đúng việc `THANH_TOAN` được gán cho Quản lý rạp trong ma trận nhưng nghiệp vụ thanh toán vẫn giới hạn cho khách hàng.
- Báo cáo ghi đúng là hệ thống không có hoàn tiền, chỉ có bồi thường bằng điểm (khớp `README.md` gốc).

## C. Ngược lại: tài liệu của dự án đang lỗi thời so với báo cáo (nên sửa phía dự án)

Báo cáo đúng, còn các tài liệu dưới đây sai/cũ:

| Tài liệu | Đang ghi | Thực tế (và báo cáo ghi đúng) |
|---|---|---|
| `database/README.md` | "27 tables and 169 SQL modules: 134 procedures, 6 views, 21 functions and 8 triggers" | 29 bảng, 147 procedure (63+7+2+9+19+3+10+9+19+6 file trong `08_procedures/*`), 6 view, 21 function, 9 trigger |
| `database/README.md` | "02_tables — 27 canonical table definitions", "07_triggers — 8 integrity and fixed-role triggers" | thư mục có 29 file bảng, 9 file trigger |
| `database/README.md` | "4 roles, 23 permission entries and 40 Role–Permission pairs" | 33 quyền, 59 cặp vai trò–quyền (seed `002_reference.sql`, `003_reference.sql`) |
| `Phân Tích _ Thiết Kế.md` §1.4 | "Database: 25 bảng" | 29 bảng |
| `Phân Tích _ Thiết Kế.md` (bìa) | MSSV Đoàn Anh Tuấn 24110366, "tháng 09 năm 2026" | xem mục A4 |
| `README.md` (gốc) | đang bị xóa trắng trong working tree (`git status`: ` M README.md`, nội dung 0 byte) | cần khôi phục (`git checkout -- README.md`) hoặc viết lại trước khi nộp |
