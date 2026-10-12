# Hệ thống đặt vé xem phim — DBMS-first

## Bổ sung quản lý đặt vé nhân viên — baseline hiện hành

**44 Use Case hoạt động:** Customer 14, Manager 10, CSKH 6, Admin 14. `QLR-10` quản lý đặt vé trong rạp được phân công còn hiệu lực; `ADM-18` quản lý đặt vé toàn hệ thống. `ADM-17` vẫn là cấu hình hệ thống ngoài phạm vi. Giữ ba ID `ADM-03/04/05` RETIRED: tổng 47 ID truy vết; số 45 chỉ còn trong snapshot nghiệm thu cũ và tên file giữ để tương thích liên kết.

Bốn role và ma trận seed cố định giữ nguyên. Module mới yêu cầu role chính xác ADMIN/QUAN_LY_RAP và quyền `DAT_VE` hiện có; mọi SP tự kiểm tra actor còn hoạt động và Manager scope. Customer chỉ được chọn từ tài khoản KHACH_HANG đang hoạt động bằng tên/email/SĐT, không nhập ID hay tạo tài khoản thay trong luồng này.

**Quy tắc được chủ dự án chấp thuận:** tạo đơn Chờ thanh toán bằng nghiệp vụ booking hiện có (giới hạn giữ chỗ/ghế, khóa concurrency, giá snapshot); không tự thanh toán. Chỉ sửa ghế trong cùng suất chiếu khi đơn còn hạn giữ chỗ, chưa có bất kỳ lần thử thanh toán, không có khuyến mãi/đồ ăn hoặc vé đã sử dụng. Customer, suất chiếu, thời hạn giữ, tiền đồ ăn/giảm giá không sửa. Ghế giữ nguyên giữ snapshot/mã vé; ghế bỏ chuyển Đã hủy và giữ bản ghi; ghế mới tính giá hiện tại và mã vé mới. Không xóa vật lý. Hủy toàn bộ đơn Chờ thanh toán bằng quy tắc hiện có, giữ lịch sử vé/payment. Chặn hủy khi có thanh toán đang xử lý/thành công hoặc vé đã sử dụng để không đua với thanh toán. Đơn đã thanh toán/hoàn thành chỉ xem: source chưa có hoàn tiền tự nguyện; đây là blocker của hủy/hoàn tiền loại đơn này, không dùng hủy suất chiếu để giả lập.

**Kiến trúc triển khai:** route `/admin/bookings` và `/manager/bookings` riêng cho module mới, không refactor portal cũ. API dưới `/api/admin/bookings` và `/api/manager/bookings`: GET list (search/status/cinemaId/page/pageSize), GET customers (search tên/email/SĐT, tối thiểu 2 ký tự, tối đa 50 kết quả mỗi tìm kiếm), GET options (cinemaId/showtimeId/orderId khi sửa), GET `/:orderId`, POST create, PUT `/:orderId/seats`, POST `/:orderId/cancel`. DELETE bị từ chối 405, không ghi/xóa dữ liệu; không có API ghi payment/RBAC mới. Pagination danh sách thực hiện ở SQL; lookup suất tối đa 200 kết quả, trả total/truncated rõ và lọc theo rạp.

**Nghiệm thu bắt buộc:** hai role list/search/filter/detail/create/edit/cancel; Customer không tồn tại/sai role/khóa; Manager ngoài scope/hết hiệu lực; invalid show/room/seat; cùng ghế race/double-submit; paid/used/payment-in-flight từ chối và no-write; snapshot/history giữ nguyên; browser desktop/mobile, keyboard/modal/dirty/stale-request. Không kế thừa PASS lịch sử; ghi kết quả thực chạy trong FINAL_SYSTEM_AUDIT.md. Main deployment vẫn cần review và phê duyệt theo database/README.md.


Kiến trúc của dự án là React → REST API → Express → Stored Procedure → SQL Server. Baseline chính thức có 44 Use Case hoạt động: Customer 14, Manager 9, CSKH 6 và Admin 13; ADM-17 nằm ngoài phạm vi.

**Quyết định RBAC cố định (11/10/2026):** 44 Use Case hoạt động: Customer 14, Manager 10, CSKH 6, Admin 14. `ADM-03`, `ADM-04`, `ADM-05` là **RETIRED**; giữ ID/evidence lịch sử trong ma trận 47 ID. Chỉ có Customer (`KHACH_HANG`), Manager (`QUAN_LY_RAP`), CSKH và Admin (`ADMIN`). Vai trò xác định khi tạo tài khoản và bất biến sau đó; danh mục quyền và Role–Permission bất biến đối với ứng dụng. Customer tự đăng ký; Admin chỉ tạo Manager/CSKH/Admin. Admin tiếp tục phân công/chuyển rạp cho Manager bằng selector tên, hiển thị phân công hiện tại và xác nhận chuyển rạp; giữ scope/thời hạn và khả năng nhiều phân công hiện có.

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

**Seed v2 (12/10/2026):** pipeline demo/test, URL ảnh đã xác minh và các lệnh có guard nằm ở [database/10_seed/README.md](database/10_seed/README.md). Chủ dự án đã yêu cầu chuyển bộ demo sang Main bằng [deployment có backup](database/deployments/seed-v2-main/README.md); kết quả ở [báo cáo chuyển Main](docs/seed/MAIN_SEED_PROMOTION_REPORT.md). `db:seed`, `db:reset`, `db:build`, `db:test` và các alias test cũ vẫn chỉ nhận hai DB demo/test được allowlist. Đọc [báo cáo seed](docs/seed/SEED_VERIFICATION_REPORT.md) về media còn BLOCKED và evidence thật.

SQL Server local dùng cấu hình trong `backend/.env` hoặc biến môi trường. `db:inventory` chỉ đọc metadata của database đã chỉ định; output nằm ở `.audit-output/database/`. Lệnh reset/build/seed và phase scripts có thể thay đổi dữ liệu, vì vậy chỉ dùng với database disposable đã được xác minh.
