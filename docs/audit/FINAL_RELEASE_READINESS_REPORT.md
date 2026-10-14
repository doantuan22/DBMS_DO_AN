# Báo cáo Final Maintenance & Release Readiness Review

**Ngày:** 2026-10-14 · **CSDL ghi test:** `CinemaBookingDB_Test` (login `CinemaTestUser`; không truy cập được `CinemaBookingDB`)  
**Giữ nguyên:** 44 Use Case, DBMS-first, ERD, RBAC, UI. Không thay đổi nghiệp vụ, SQL nghiệp vụ hay schema.  
Báo cáo trước: [FINAL_HARDENING_REPORT.md](FINAL_HARDENING_REPORT.md).

---

## A. PASS đã được chứng minh (một lần chạy `npm.cmd run audit:all`, sau khi dọn dữ liệu test)

| Giai đoạn | PASS | FAIL |
|---|:---:|:---:|
| Backend unit/contract | 212 | 0 |
| Frontend unit/component | 238 | 0 |
| Frontend production build | ✓ | 0 |
| Database integrity (chỉ đọc) | 21 | 0 |
| API integration | 73 | 0 |
| Đối chiếu doanh thu F-11 (chỉ đọc, 4 nguồn) | ✓ | 0 |
| Lifecycle: concurrency / hết hạn / bồi thường | 39 (18 ca + 21 toàn vẹn) | 0 |
| Browser E2E + responsive + a11y (Edge) | 54 (33 kịch bản + 21 toàn vẹn) | 0 |
| **Tổng** | **639** (576 kiểm tra phân biệt; 21 bất biến được báo cáo 4 lần) | **0** |

Kiểm tra chất lượng mã: `frontend lint` (oxlint) **0 cảnh báo, exit 0**; `npm run format:check` "All matched files use Prettier code style".

### Chi tiết theo yêu cầu

| # | Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Phân tích F-11 | Hoàn thành; **không sửa nghiệp vụ** | [F-11_REVENUE_ANALYSIS.md](F-11_REVENUE_ANALYSIS.md); `scripts/audit/revenue-analysis.mjs` đối chiếu dashboard = báo cáo Admin = view = tổng nhóm vòng đời (3.560.000 VND / 27 đơn trên CSDL test) |
| 2 | F-12 lint | 3/3 cảnh báo xử lý, hành vi UI không đổi | `ProductFilters.jsx` (bỏ biến `priceLabel` + import `money` thừa), `AdminAnalytics.jsx` (bỏ tham số `can` không dùng và prop truyền thừa), `ShowtimeBrowser.jsx` (state dẫn xuất tại render thay vì `setState` trong effect — cùng điều kiện cập nhật `[state, date, cinemaId]`). 238 test frontend + E2E `E2E-CUST-BOOK`, 3 kịch bản a11y vẫn PASS |
| 3 | F-13 script concurrency cũ | **Loại bỏ chính thức** 10 script; thay bằng 5 ca mới + ánh xạ | `LC-CONC-09..13` (ảnh rạp/cover, ghi nhận khiếu nại song song, thay diễn viên song song, xóa phòng đua tạo suất, đổi giá đua đặt vé); bảng ánh xạ cũ → mới trong `database/11_tests/concurrency/README.md`. 7 script đã hỏng (`ERR_MODULE_NOT_FOUND`), 3 script chạy tay cần cấu hình riêng và để lại dữ liệu năm 2100 |
| 4 | F-14 fixture/reset | Phương án + công cụ + đã áp dụng | [TEST_DATABASE_FIXTURES.md](TEST_DATABASE_FIXTURES.md); `scripts/audit/test-db.mjs`; sandbox `E2E Sandbox`; dọn 381 người dùng/219 đơn/99 suất… có backup `CinemaBookingDB_Test_pre_purge_20261014073527.bak`; sau dọn 21/21 bất biến và toàn bộ `audit:all` PASS từ trạng thái sạch |
| 5 | Chạy lại | audit:all, lint, format:check, Git | Bảng trên + mục D |

### Các ca concurrency mới (đo ở lần chạy cuối)

| Ca | Kết quả đo |
|---|---|
| LC-CONC-09 | 15×200, 3×409 `CINEMA_IMAGE_INACTIVE`; ≤ 1 ảnh cover và cover đang hoạt động |
| LC-CONC-10 | 6×201; số dòng log = số yêu cầu thành công; trạng thái khiếu nại = dòng log mới nhất |
| LC-CONC-11 | 6×200; danh sách diễn viên cuối = đúng một danh sách đã gửi (không trộn) |
| LC-CONC-12 | xóa phòng 200 + tạo suất 201; phòng được giữ ở `Ngưng hoạt động` (không mồ côi) |
| LC-CONC-13 | cập nhật giá 409 `SHOWTIME_HAS_ORDERS` khi đã có đơn; giá vé = giá suất hiện hành |

---

## B. Lỗi / vấn đề còn mở (kỹ thuật, không cần quyết định nghiệp vụ)

| Mã | Nội dung | Mức | Ghi chú |
|---|---|---|---|
| R-01 | Bản sao lưu trước dọn dẹp chưa được **diễn tập khôi phục**: login test không có quyền `RESTORE`/`CREATE DATABASE`, nên `RESTORE VERIFYONLY` bị từ chối. Backup đã ghi với `CHECKSUM` (kiểm tra trang khi ghi) | Low | Cần DBA diễn tập một lần; lệnh nằm trong TEST_DATABASE_FIXTURES.md §5 |
| R-02 | Tệp `.bak` (và tệp thăm dò `CinemaBookingDB_Test_probe.bak`) nằm trong thư mục backup của SQL Server; login test không xóa được | Info | Dọn thủ công theo chính sách lưu trữ |
| R-03 | Phần dữ liệu kiểm thử **không truy vết được** còn lại (đơn đã hủy của khách seed trên suất seed, quy tắc giá tạm dừng trong rạp seed, dữ liệu `Audit` từ đợt trước) | Info | Có chủ đích không xóa (TEST_DATABASE_FIXTURES.md §7) |
| R-04 | Việc dọn dữ liệu (`purge`) giữ nguyên suất chiếu của phòng seed dù chỉ người dùng test từng đặt vé ở đó | Info | An toàn hơn là đoán; chỉ xóa đơn gắn nhãn |
| R-05 | Không còn bằng chứng *lock-wait* (`sys.dm_exec_requests`) mà các script SQL-session cũ từng ghi; runner mới chứng minh kết quả quan sát được (HTTP + SQL) chứ không chứng minh cơ chế khóa | Info | Có thể khôi phục từ Git history trên CSDL dùng một lần nếu cần |
| R-06 | `LC-CONC-08` bất định theo thời gian (nhánh "hủy thắng" không đảm bảo xuất hiện mỗi lần) | Info | Bất biến kiểm cả hai nhánh |

Không phát hiện lỗi chức năng mới trong đợt này.

---

## C. Quyết định nghiệp vụ cần phê duyệt (chưa thực hiện)

| # | Quyết định | Lựa chọn | Khuyến nghị |
|---|---|---|---|
| D-01 | **F-11:** Hiển thị/định nghĩa doanh thu khi đơn đã thu tiền bị hủy do hủy suất (hiện tính vào "tiền thực thu", không hoàn tiền, bồi thường bằng điểm) | A: giữ cash basis + thêm cột "trong đó đơn hủy do hủy suất"/"chưa chiếu" · B: thêm "doanh thu ghi nhận" · C: quy đổi điểm bồi thường thành tiền · D: hoàn tiền thật | A ngay; B khi có yêu cầu kế toán (chi tiết §5 F-11) |
| D-02 | Điểm bồi thường (1.000 VND = 1 điểm) hiện **chỉ tích lũy, không đổi được** — có cần cơ chế sử dụng điểm? | giữ / thêm nghiệp vụ đổi điểm | Quyết định cùng D-01 (phương án C) |
| D-03 | Trạng thái `Hoàn tiền` / `Đã hoàn tiền` tồn tại trong CHECK nhưng không có luồng ghi | giữ làm chỗ dự phòng / loại khỏi schema / hiện thực hóa (D-01.D) | Giữ cho tới khi có quyết định D-01 |
| D-04 | Có reset hoàn toàn CSDL test từ nguồn (`reset-database.sql` + seed) để loại cả dữ liệu `Audit` cũ? | không / có (sau backup) | Chưa cần; công cụ `purge` đủ cho vận hành |
| D-05 | Chính sách lưu trữ tệp backup trong `…\MSSQL\Backup` | giữ N bản / xóa sau X ngày | Theo quy định của nhóm vận hành |

---

## D. Thay đổi Git (không commit)

| Hạng mục | Số lượng |
|---|---|
| Tệp đã sửa (M) | 139 (gồm các sửa chưa commit có từ trước và 127 tệp được Prettier định dạng lại ở đợt trước) |
| Tệp mới (??) | 17 (`scripts/`, `docs/`, test mới, `database/baseline-manifest.json`, …) |
| Tệp xóa trong đợt này | 10 script `database/11_tests/concurrency/*.mjs` |
| Đã chạm trong đợt này | `frontend/src/components/ShowtimeBrowser.jsx`, `…/admin-analytics/AdminAnalytics.jsx`, `…/admin-resources/ProductFilters.jsx`; `scripts/audit/{lib,lifecycle,test-db,revenue-analysis,run-all,api-integration,browser-scenarios}.mjs`; `package.json` (+`audit:testdb`), README/`database/README.md`; `docs/audit/*` |

Ghi vào `CinemaBookingDB`: **không có** (login test `HAS_DBACCESS('CinemaBookingDB') = 0`; mọi runner kiểm tra `DB_NAME()` trước khi ghi và chặn login `sa`).

---

## E. Phạm vi KHÔNG được khẳng định

* **Trình duyệt/thiết bị/AT:** chỉ Edge (Chromium); không Firefox/Safari, thiết bị thật, NVDA/VoiceOver. axe-core chỉ phát hiện một phần lỗi WCAG và chỉ quét trang ở trạng thái vừa tải.
* **Concurrency:** 4–10 yêu cầu song song trong một tiến trình Node; không stress/soak, đa tiến trình/đa node, deadlock có chủ đích, failover.
* **Hết hạn giữ ghế:** hạn được kéo về quá khứ bằng SQL trên CSDL test; không chờ hết cửa sổ giữ thật; chưa thử job chồng tick hay khởi động lại giữa chừng.
* **Hủy suất có bồi thường:** chưa thử nhiều đơn/khách/suất, vé `Đã sử dụng`, hay hàng trăm đơn.
* **Khôi phục từ backup** (R-01), **reset toàn bộ** (D-04), migration/seed rebuild: chưa kiểm thử.
* **Fixture BR05** ("đã xem phim") vẫn dựng bằng SQL (ứng dụng không tạo được suất quá khứ).
* **Hiệu năng, tải, bảo mật xâm nhập (OWASP), backup/DR, thông báo (email/SMS), cổng thanh toán thật** — ngoài phạm vi.
* **CSDL chính `CinemaBookingDB`:** không được kiểm thử và không bị tác động.

**Kết luận được phép:** *mọi bộ kiểm thử đã định nghĩa trong repository đều PASS trên `CinemaBookingDB_Test` ngày 2026-10-14; không có lỗi chức năng mở; có 1 quyết định nghiệp vụ (F-11/D-01) và 5 mục vận hành cần xử lý trước khi coi là sẵn sàng phát hành.* Đây **không** phải tuyên bố FULL PASS cho các phạm vi ở mục E.
