# Hệ thống đặt vé xem phim — DBMS-first

## Bổ sung quản lý đặt vé nhân viên — baseline hiện hành

**44 Use Case hoạt động:** Customer 14, Manager 10, CSKH 6, Admin 14. `QLR-10` quản lý đặt vé trong rạp được phân công còn hiệu lực; `ADM-18` quản lý đặt vé toàn hệ thống. `ADM-17` vẫn là cấu hình hệ thống ngoài phạm vi. Giữ ba ID `ADM-03/04/05` RETIRED: tổng 47 ID truy vết; số 45 chỉ còn trong snapshot nghiệm thu cũ và tên file giữ để tương thích liên kết.

Bốn role và ma trận seed cố định giữ nguyên. Module mới yêu cầu role chính xác ADMIN/QUAN_LY_RAP và quyền `DAT_VE` hiện có; mọi SP tự kiểm tra actor còn hoạt động và Manager scope. Customer chỉ được chọn từ tài khoản KHACH_HANG đang hoạt động bằng tên/email/SĐT, không nhập ID hay tạo tài khoản thay trong luồng này.

**Quy tắc được chủ dự án chấp thuận:** tạo đơn Chờ thanh toán bằng nghiệp vụ booking hiện có (giới hạn giữ chỗ/ghế, khóa concurrency, giá snapshot); không tự thanh toán. Chỉ sửa ghế trong cùng suất chiếu khi đơn còn hạn giữ chỗ, chưa có bất kỳ lần thử thanh toán, không có khuyến mãi/đồ ăn hoặc vé đã sử dụng. Customer, suất chiếu, thời hạn giữ, tiền đồ ăn/giảm giá không sửa. Ghế giữ nguyên giữ snapshot/mã vé; ghế bỏ chuyển Đã hủy và giữ bản ghi; ghế mới tính giá hiện tại và mã vé mới. Không xóa vật lý. Hủy toàn bộ đơn Chờ thanh toán bằng quy tắc hiện có, giữ lịch sử vé/payment. Chặn hủy khi có thanh toán đang xử lý/thành công hoặc vé đã sử dụng để không đua với thanh toán. Đơn đã thanh toán/hoàn thành chỉ xem: source chưa có hoàn tiền tự nguyện; đây là blocker của hủy/hoàn tiền loại đơn này, không dùng hủy suất chiếu để giả lập.

**Kiến trúc triển khai:** route `/admin/bookings` và `/manager/bookings` riêng cho module mới, không refactor portal cũ. API dưới `/api/admin/bookings` và `/api/manager/bookings`: GET list (search/status/cinemaId/page/pageSize), GET customers (search tên/email/SĐT, tối thiểu 2 ký tự, tối đa 50 kết quả mỗi tìm kiếm), GET options (cinemaId/showtimeId/orderId khi sửa), GET `/:orderId`, POST create, PUT `/:orderId/seats`, POST `/:orderId/cancel`. DELETE bị từ chối 405, không ghi/xóa dữ liệu; không có API ghi payment/RBAC mới. Pagination danh sách thực hiện ở SQL; lookup suất tối đa 200 kết quả, trả total/truncated rõ và lọc theo rạp.

**Nghiệm thu bắt buộc:** hai role list/search/filter/detail/create/edit/cancel; Customer không tồn tại/sai role/khóa; Manager ngoài scope/hết hiệu lực; invalid show/room/seat; cùng ghế race/double-submit; paid/used/payment-in-flight từ chối và no-write; snapshot/history giữ nguyên; browser desktop/mobile, keyboard/modal/dirty/stale-request. Không kế thừa PASS lịch sử; ghi kết quả thực chạy trong [docs/audit/FINAL_ACCEPTANCE_REPORT.md](docs/audit/FINAL_ACCEPTANCE_REPORT.md). Main deployment vẫn cần review và phê duyệt theo database/README.md.


Kiến trúc của dự án là React → REST API → Express → Stored Procedure → SQL Server. Baseline chính thức có 44 Use Case hoạt động: Customer 14, Manager 10, CSKH 6 và Admin 14; ADM-17 nằm ngoài phạm vi.

**Quyết định RBAC cố định (11/10/2026):** 44 Use Case hoạt động: Customer 14, Manager 10, CSKH 6, Admin 14. `ADM-03`, `ADM-04`, `ADM-05` là **RETIRED**; giữ ID/evidence lịch sử trong ma trận 47 ID. Chỉ có Customer (`KHACH_HANG`), Manager (`QUAN_LY_RAP`), CSKH và Admin (`ADMIN`). Vai trò xác định khi tạo tài khoản và bất biến sau đó; danh mục quyền và Role–Permission bất biến đối với ứng dụng. Customer tự đăng ký; Admin chỉ tạo Manager/CSKH/Admin. Admin tiếp tục phân công/chuyển rạp cho Manager bằng selector tên, hiển thị phân công hiện tại và xác nhận chuyển rạp; giữ scope/thời hạn và khả năng nhiều phân công hiện có.

Tài liệu chuẩn: [phân tích và thiết kế](<Phân Tích _ Thiết Kế.md>), [database](database/README.md), [ma trận 44 Use Case](docs/audit/FULL_SYSTEM_AUDIT.md), [báo cáo nghiệm thu cuối](docs/audit/FINAL_ACCEPTANCE_REPORT.md) và các runner kiểm định trong [scripts/audit](scripts/audit) (xem mục *Kiểm định tự động* bên dưới). Các tệp lịch sử `USE_CASE_MATRIX_45.md`, `R8_FRONTEND_GAP_MATRIX.md`, `FINAL_SYSTEM_AUDIT.md`, `R8_3_REACCEPTANCE_REPORT.md` đã được hợp nhất vào hai tài liệu trên và không còn trong repository.

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
```

`npm.cmd run format` áp dụng quy tắc Prettier cho Frontend, Backend, tests, shared contracts và JavaScript tooling. SQL Server scripts giữ nguyên batch `GO` và được kiểm tra bằng SQL verification/integration suites thay vì một formatter không hiểu batch semantics.

Các file kết quả audit mới được ghi dưới `.audit-output/` và không đưa vào Git. Không chạy lệnh reset, build, seed, migration hay test mutation trỏ tới database chính `CinemaBookingDB`; browser/integration tests phải xác minh target độc lập trước khi ghi dữ liệu.

## Database tooling

**Seed v2:** pipeline demo/test, URL ảnh đã xác minh và các lệnh có guard nằm ở `database/10_seed/` (SQL). `db:seed`, `db:reset`, `db:build`, `db:test` và các alias test cũ vẫn chỉ nhận hai DB demo/test được allowlist. Tài liệu seed lịch sử (`database/10_seed/README.md`, `docs/seed/*`) không còn trong repository; nguồn seed hiện hành là các tệp SQL trong `database/10_seed/`.

SQL Server local dùng cấu hình trong `backend/.env` hoặc biến môi trường. `db:inventory` chỉ đọc metadata của database đã chỉ định; output nằm ở `.audit-output/database/`. Lệnh reset/build/seed và phase scripts có thể thay đổi dữ liệu, vì vậy chỉ dùng với database disposable đã được xác minh.

## Quy tắc nghiệp vụ: điểm, thanh toán và doanh thu

* **Không có hoàn tiền** dưới bất kỳ hình thức nào (không refund API/transaction/scheduler). Hủy suất chiếu có vé đã thanh toán → tiền vé đủ điều kiện được quy đổi thành **điểm** cộng vào tài khoản khách (`fn_TinhBoiThuongVe`); tiền đã thu **không** bị trừ khỏi doanh thu.
* **1 điểm = 1.000 VND** giá trị vé sau khuyến mãi. Khách dùng điểm một phần hoặc toàn bộ ở lần đặt sau (`POST /api/bookings/preview` xem trước, `points` khi đặt). Điểm được giữ khi tạo đơn và trả lại nếu đơn hết hạn/bị hủy trước khi thanh toán.
* Đơn trả đủ bằng điểm hoàn tất bằng phương thức `DIEM` (không phát sinh tiền thực thu).
* **`TienGiamGia` là tổng mọi khoản giảm** (khuyến mãi và `DiemSuDung × 1.000 VND`). **Doanh thu = tiền thực thu** = `MAX(0, TongTienVe + TongTienDoAn − TienGiamGia)` của đơn có thanh toán thành công; dùng chung cho Dashboard Admin, báo cáo Admin/Manager và `vw_DoanhThuTheoRap`.
* Toàn bộ tính toán nằm trong SQL Server (Stored Procedure); backend/frontend không tự tính điểm hay tiền. Chi tiết: `docs/audit/FINAL_BUSINESS_RULE_IMPLEMENTATION.md`, `Phân Tích _ Thiết Kế.md` §3.1b.

## Kiểm định tự động (scripts/audit)

Mọi runner ghi dữ liệu **chỉ** chạy trên `CinemaBookingDB_Test` (đọc từ `backend/.env.test`); `SELECT DB_NAME()` được kiểm tra trước mỗi lô ghi và runner dừng nếu khác tên. Backend/Frontend được khởi động tự động với biến môi trường cố định, nên `backend/.env` (trỏ DB chính) không bao giờ được dùng.

```powershell
npm.cmd run audit:db     # kiểm tra toàn vẹn DB (chỉ đọc)
npm.cmd run audit:api    # API → SP → SQL integration, có đối chiếu SQL sau mỗi ghi
npm.cmd run audit:lifecycle  # concurrency, hết hạn giữ ghế, hủy suất có bồi thường
npm.cmd run audit:points # thanh toán bằng điểm, bồi thường hủy suất, doanh thu tiền thực thu (PT-01..PT-17)
npm.cmd run audit:migrate # áp dụng migration/đối tượng điểm lên CSDL test (có kiểm tra DB_NAME())
npm.cmd run audit:testdb -- inventory   # quản lý dữ liệu kiểm thử: inventory | purge (dry-run) | purge --execute --confirm=CinemaBookingDB_Test
npm.cmd run audit:e2e    # Playwright + Microsoft Edge: DOM thật, đối chiếu SQL, responsive, accessibility (axe-core)
npm.cmd run audit:all    # backend + frontend unit, build, DB, API, Browser E2E
```

Bằng chứng JSON và ảnh chụp màn hình nằm ở `.audit-output/acceptance/` (không đưa vào Git). Mật khẩu demo của DB test mặc định `123456`; đổi bằng biến môi trường `AUDIT_DEMO_PASSWORD`.

