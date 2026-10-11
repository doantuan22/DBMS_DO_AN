# Use Case Matrix — 44 hoạt động / 3 RETIRED (47 ID truy vết)

## Bổ sung quản lý đặt vé nhân viên — baseline hiện hành

**44 Use Case hoạt động:** Customer 14, Manager 10, CSKH 6, Admin 14. `QLR-10` quản lý đặt vé trong rạp được phân công còn hiệu lực; `ADM-18` quản lý đặt vé toàn hệ thống. `ADM-17` vẫn là cấu hình hệ thống ngoài phạm vi. Giữ ba ID `ADM-03/04/05` RETIRED: tổng 47 ID truy vết; số 45 chỉ còn trong snapshot nghiệm thu cũ và tên file giữ để tương thích liên kết.

Bốn role và ma trận seed cố định giữ nguyên. Module mới yêu cầu role chính xác ADMIN/QUAN_LY_RAP và quyền `DAT_VE` hiện có; mọi SP tự kiểm tra actor còn hoạt động và Manager scope. Customer chỉ được chọn từ tài khoản KHACH_HANG đang hoạt động bằng tên/email/SĐT, không nhập ID hay tạo tài khoản thay trong luồng này.

**Quy tắc được chủ dự án chấp thuận:** tạo đơn Chờ thanh toán bằng nghiệp vụ booking hiện có (giới hạn giữ chỗ/ghế, khóa concurrency, giá snapshot); không tự thanh toán. Chỉ sửa ghế trong cùng suất chiếu khi đơn còn hạn giữ chỗ, chưa có bất kỳ lần thử thanh toán, không có khuyến mãi/đồ ăn hoặc vé đã sử dụng. Customer, suất chiếu, thời hạn giữ, tiền đồ ăn/giảm giá không sửa. Ghế giữ nguyên giữ snapshot/mã vé; ghế bỏ chuyển Đã hủy và giữ bản ghi; ghế mới tính giá hiện tại và mã vé mới. Không xóa vật lý. Hủy toàn bộ đơn Chờ thanh toán bằng quy tắc hiện có, giữ lịch sử vé/payment. Chặn hủy khi có thanh toán đang xử lý/thành công hoặc vé đã sử dụng để không đua với thanh toán. Đơn đã thanh toán/hoàn thành chỉ xem: source chưa có hoàn tiền tự nguyện; đây là blocker của hủy/hoàn tiền loại đơn này, không dùng hủy suất chiếu để giả lập.

**Kiến trúc triển khai:** route `/admin/bookings` và `/manager/bookings` riêng cho module mới, không refactor portal cũ. API dưới `/api/admin/bookings` và `/api/manager/bookings`: GET list (search/status/cinemaId/page/pageSize), GET customers (search tên/email/SĐT, tối thiểu 2 ký tự, tối đa 50 kết quả mỗi tìm kiếm), GET options (cinemaId/showtimeId/orderId khi sửa), GET `/:orderId`, POST create, PUT `/:orderId/seats`, POST `/:orderId/cancel`. DELETE bị từ chối 405, không ghi/xóa dữ liệu; không có API ghi payment/RBAC mới. Pagination danh sách thực hiện ở SQL; lookup suất tối đa 200 kết quả, trả total/truncated rõ và lọc theo rạp.

**Nghiệm thu bắt buộc:** hai role list/search/filter/detail/create/edit/cancel; Customer không tồn tại/sai role/khóa; Manager ngoài scope/hết hiệu lực; invalid show/room/seat; cùng ghế race/double-submit; paid/used/payment-in-flight từ chối và no-write; snapshot/history giữ nguyên; browser desktop/mobile, keyboard/modal/dirty/stale-request. Không kế thừa PASS lịch sử; ghi kết quả thực chạy trong FINAL_SYSTEM_AUDIT.md. Main deployment vẫn cần review và phê duyệt theo database/README.md.


> **Ghi chú lưu trữ (10/10/2026):** Theo yêu cầu thu gọn `docs`, evidence, contracts, archive và tài liệu hỗ trợ đã được xóa khỏi workspace. Các nhãn case/selector trong báo cáo là tham chiếu lịch sử, không còn liên kết tới raw artifact. Kết quả và verdict được ghi trong báo cáo không thay đổi.


**Trạng thái hiện hành:** fixed RBAC và quản lý đặt vé nhân viên, 44 UC hoạt động; R8.3 ACCEPTED/45 UC bên dưới là lịch sử, không phải PASS cho thay đổi mới. ADM-17 ngoài phạm vi.

**Quyết định RBAC cố định, baseline đã bổ sung đặt vé (11/10/2026):** 44 Use Case hoạt động: Customer 14, Manager 10, CSKH 6, Admin 14. `ADM-03`, `ADM-04`, `ADM-05` là **RETIRED**; giữ ID/evidence lịch sử; ma trận hiện hành có 47 ID. Chỉ có Customer (`KHACH_HANG`), Manager (`QUAN_LY_RAP`), CSKH và Admin (`ADMIN`). Vai trò xác định khi tạo tài khoản và bất biến sau đó; danh mục quyền và Role–Permission bất biến đối với ứng dụng. Customer tự đăng ký; Admin chỉ tạo Manager/CSKH/Admin. Admin tiếp tục phân công/chuyển rạp cho Manager bằng selector tên, hiển thị phân công hiện tại và xác nhận chuyển rạp; giữ scope/thời hạn và khả năng nhiều phân công hiện có.

## Baseline đang hoạt động

| Vai trò | UC hoạt động | RETIRED |
|---|---:|---:|
| Customer | 14 | 0 |
| Manager | 10 | 0 |
| CSKH | 6 | 0 |
| Admin | 14 | 3 |
| Tổng | 44 | 3 |

## Kết quả R8.3 theo vai trò — lịch sử trước retirement

| Vai trò | Tổng | PASS | PARTIAL | BROKEN | MISSING |
|---|---:|---:|---:|---:|---:|
| Customer | 14 | 14 | 0 | 0 | 0 |
| Manager | 9 | 9 | 0 | 0 | 0 |
| CSKH | 6 | 6 | 0 | 0 | 0 |
| Admin | 16 | 16 | 0 | 0 | 0 |
| **Tổng** | **45** | **45** | **0** | **0** | **0** |

Tại thời điểm nghiệm thu, 44 UC ngoài ADM-07 tái sử dụng evidence browser/API/SQL để đối chiếu source freshness; ADM-07 được chạy lại sau hotfix. Các dòng từng liên kết primary browser case và JSON Pointer trong acceptance manifest; manifest đã bị xóa khỏi `docs` trong đợt thu gọn ngày 10/10/2026.

Evidence types ???c gi? t?ch bi?t: primary journeys l? REAL_BROWSER_SQL; c?c test CONTROLLED_TRANSPORT ch? ???c t?nh cho race/retry checks m? kh?ng gi? l?m SQL mutation. ADM-07 fresh run c? 7 REAL_BROWSER_SQL v? 12 CONTROLLED_TRANSPORT checks; chi ti?t ? [R8.3 re-acceptance](R8_3_REACCEPTANCE_REPORT.md).

## Traceability theo Use Case

Các verdict của 42 UC có trước module này là snapshot lịch sử, không phải 42 browser journeys vừa chạy lại. Hai dòng QLR-10/ADM-18 ghi kết quả task trên DB kiểm thử riêng, theo đúng phạm vi sửa/hủy được chấp thuận. Main chưa có migration; không kết luận 44/44 end-to-end PASS.

| # | UC | Vai trò | Use Case | Trạng thái task / lịch sử | Primary evidence | R8.3 checkpoint trước hotfix |
|---:|---|---|---|---|---|---|
| 1 | KH-01 | Customer | Đăng ký | **PASS** | P3-KH01-REGISTER /checks/0; REAL_BROWSER_SQL | PASS |
| 2 | KH-02 | Customer | Đăng nhập | **PASS** | P3-KH02-LOGIN /checks/1; REAL_BROWSER_SQL | PASS |
| 3 | KH-03 | Customer | Profile | **PASS** | P3-KH03-PROFILE /checks/2; REAL_BROWSER_SQL | PASS |
| 4 | KH-04 | Customer | Xem phim/list/detail | **PASS** | P3-KH04-CATALOG /checks/3; REAL_BROWSER_SQL | PASS |
| 5 | KH-05 | Customer | Xem lịch chiếu | **PASS** | P3-KH05-SCHEDULE /checks/4; REAL_BROWSER_SQL | PASS |
| 6 | KH-06 | Customer | Chọn ghế | **PASS** | P3-KH06-SEATS /checks/5; REAL_BROWSER_SQL | PASS |
| 7 | KH-07 | Customer | Đặt vé | **PASS** | P3-KH07-BOOKING /checks/8; REAL_BROWSER_SQL | PASS |
| 8 | KH-08 | Customer | Đồ ăn kèm vé | **PASS** | P3-KH08-FOOD /checks/6; REAL_BROWSER_SQL | PASS |
| 9 | KH-09 | Customer | Khuyến mãi | **PASS** | P3-KH09-PROMOTION /checks/7; REAL_BROWSER_SQL | PASS |
| 10 | KH-10 | Customer | Thanh toán | **PASS** | P3-KH10-PAYMENT /checks/9; REAL_BROWSER_SQL | PASS |
| 11 | KH-11 | Customer | Lịch sử đơn | **PASS** | P3-KH11-ORDERS /checks/10; REAL_BROWSER_SQL | PASS |
| 12 | KH-12 | Customer | Chi tiết đơn | **PASS** | P3-KH12-ORDER-DETAIL /checks/11; REAL_BROWSER_SQL | PASS |
| 13 | KH-13 | Customer | Đánh giá | **PASS** | P3-KH13-ELIGIBILITY /checks/12; REAL_BROWSER_SQL | PASS |
| 14 | KH-14 | Customer | Khiếu nại | **PASS** | P3-KH14-COMPLAINT /checks/13; REAL_BROWSER_SQL | PASS |
| 15 | QLR-01 | Manager | Đăng nhập/rạp phân công | **PASS** | P3-QLR01-LOGIN-SCOPE /checks/40; REAL_BROWSER_SQL | PASS |
| 16 | QLR-02 | Manager | Quản lý phòng | **PASS** | P3-QLR02-ROOM /checks/41; REAL_BROWSER_SQL | PASS |
| 17 | QLR-03 | Manager | Quản lý sơ đồ ghế | **PASS** | P3-QLR03-SEAT /checks/42; REAL_BROWSER_SQL | PASS |
| 18 | QLR-04 | Manager | Tạo suất chiếu | **PASS** | P3-QLR04-CREATE-SHOW /checks/43; REAL_BROWSER_SQL | PASS |
| 19 | QLR-05 | Manager | Sửa suất chiếu | **PASS** | P3-QLR05-UPDATE-SHOW /checks/44; REAL_BROWSER_SQL | PASS |
| 20 | QLR-06 | Manager | Hủy suất chiếu | **PASS** | P3-QLR06-CANCEL-SHOW /checks/45; REAL_BROWSER_SQL | PASS |
| 21 | QLR-07 | Manager | Cấu hình bảng giá | **PASS** | P3-QLR07-PRICING /checks/46; REAL_BROWSER_SQL | PASS |
| 22 | QLR-08 | Manager | Dashboard hoạt động rạp | **PASS** | P3-QLR08-DASHBOARD /checks/47; REAL_BROWSER_SQL | PASS |
| 23 | QLR-09 | Manager | Doanh thu rạp | **PASS** | P3-QLR09-REVENUE /checks/48; REAL_BROWSER_SQL | PASS |
| 24 | CSKH-01 | CSKH | Đăng nhập | **PASS** | P3-CSKH01-LOGIN /checks/16; REAL_BROWSER_SQL | PASS |
| 25 | CSKH-02 | CSKH | Hàng chờ khiếu nại | **PASS** | P3-CSKH02-QUEUE /checks/17; REAL_BROWSER_SQL | PASS |
| 26 | CSKH-03 | CSKH | Chi tiết khiếu nại | **PASS** | P3-CSKH03-DETAIL /checks/18; REAL_BROWSER_SQL | PASS |
| 27 | CSKH-04 | CSKH | Đơn tham chiếu | **PASS** | P3-CSKH04-REFERENCE /checks/19; REAL_BROWSER_SQL | PASS |
| 28 | CSKH-05 | CSKH | Ghi lần xử lý | **PASS** | P3-CSKH05-PROCESS /checks/20; REAL_BROWSER_SQL | PASS |
| 29 | CSKH-06 | CSKH | Đổi trạng thái | **PASS** | P3-CSKH06-STATUS /checks/21; REAL_BROWSER_SQL | PASS |
| 30 | ADM-01 | Admin | Đăng nhập | **PASS** | P3-ADM01-LOGIN /checks/23; REAL_BROWSER_SQL | PASS |
| 31 | ADM-02 | Admin | Tài khoản người dùng | **PASS** | P3-ADM02-USERS /checks/24; REAL_BROWSER_SQL | PASS |
| 32 | ADM-03 | Admin | Vai trò | **RETIRED** | P3-ADM03-ROLES /checks/25; REAL_BROWSER_SQL | PASS |
| 33 | ADM-04 | Admin | Danh mục quyền | **RETIRED** | P3-ADM04-PERMISSIONS /checks/26; REAL_BROWSER_SQL | PASS |
| 34 | ADM-05 | Admin | Gán quyền vai trò | **RETIRED** | P3-ADM05-GRANTS /checks/27; REAL_BROWSER_SQL | PASS |
| 35 | ADM-06 | Admin | Phân công quản lý | **PASS** | P3-ADM06-ASSIGNMENTS /checks/28; REAL_BROWSER_SQL | PASS |
| 36 | ADM-07 | Admin | Rạp và hình ảnh | **PASS** | P3-ADM07-CINEMAS /checks/29; REAL_BROWSER_SQL | **BROKEN** |
| 37 | ADM-08 | Admin | Phòng và ghế toàn hệ | **PASS** | P3-ADM08-ROOM-SEAT /checks/30; REAL_BROWSER_SQL | PASS |
| 38 | ADM-09 | Admin | Phim và diễn viên | **PASS** | P3-ADM09-MOVIES-CAST /checks/32; REAL_BROWSER_SQL | PASS |
| 39 | ADM-10 | Admin | Thể loại | **PASS** | P3-ADM10-GENRES /checks/31; REAL_BROWSER_SQL | PASS |
| 40 | ADM-11 | Admin | Sản phẩm đồ ăn | **PASS** | P3-ADM11-PRODUCT-DECIMAL /checks/33; REAL_BROWSER_SQL | PASS |
| 41 | ADM-12 | Admin | Chương trình khuyến mãi | **PASS** | P3-ADM12-PROMOTION-DECIMAL /checks/34; REAL_BROWSER_SQL | PASS |
| 42 | ADM-13 | Admin | Bảng giá toàn hệ | **PASS** | P3-ADM13-PRICING-DECIMAL /checks/35; REAL_BROWSER_SQL | PASS |
| 43 | ADM-14 | Admin | Suất chiếu toàn hệ | **PASS** | P3-ADM14-SHOW-DECIMAL /checks/36; REAL_BROWSER_SQL | PASS |
| 44 | ADM-15 | Admin | Xử lý khiếu nại | **PASS** | P3-ADM15-COMPLAINT /checks/37; REAL_BROWSER_SQL | PASS |
| 45 | ADM-16 | Admin | Báo cáo toàn hệ | **PASS** | P3-ADM16-REVENUE /checks/38; REAL_BROWSER_SQL | PASS |

| 46 | QLR-10 | Manager | Quản lý đặt vé tại rạp phân công | **PASS — phạm vi đã duyệt trên Test DB** | REAL_BROWSER_HTTP_SQL + HTTP/SQL + SQL rollback assertions; xem FINAL_SYSTEM_AUDIT.md | Không tồn tại trong R8.3 |
| 47 | ADM-18 | Admin | Quản lý đặt vé toàn hệ thống | **PASS — phạm vi đã duyệt trên Test DB** | REAL_BROWSER_HTTP_SQL + HTTP/SQL + SQL rollback assertions; xem FINAL_SYSTEM_AUDIT.md | Không tồn tại trong R8.3 |

ADM-07 hi?n PASS sau hotfix; checkpoint l?ch s? ti?p t?c ghi BROKEN/44?45 theo th?i ?i?m c?. Kh?ng s?a verdict l?ch s? trong [R8.3 Final Acceptance](R8_3_FINAL_ACCEPTANCE_REPORT.md). Gap traceability theo 43 ID n?m trong [R8 Frontend Gap Matrix](R8_FRONTEND_GAP_MATRIX.md).
