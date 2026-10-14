# Báo cáo Final System Hardening

> Đã được tiếp nối bởi [FINAL_RELEASE_READINESS_REPORT.md](FINAL_RELEASE_READINESS_REPORT.md) (F-12, F-13, F-14 đã xử lý; F-11 đã phân tích).

**Ngày:** 2026-10-14 · **CSDL ghi test:** `CinemaBookingDB_Test` (login `CinemaTestUser`; `HAS_DBACCESS('CinemaBookingDB') = 0`)  
**Giữ nguyên:** kiến trúc DBMS-first, 44 Use Case, ERD, RBAC, thiết kế UI. Không đổi SQL/schema/nghiệp vụ.

## 1. Kết quả (`npm.cmd run audit:all`, một lần chạy liên tục)

| # | Giai đoạn | PASS | FAIL | Ghi chú |
|---|---|:---:|:---:|---|
| 1 | Backend unit/contract | **212** | 0 | +2 so với đợt trước (`adminDtoShape`) |
| 2 | Frontend unit/component | **238** | 0 | +3 (`errorMessages`) |
| 3 | Frontend production build | **PASS** | 0 | |
| 4 | Database integrity (chỉ đọc) | **21** | 0 | +3 bất biến mới |
| 5 | API integration | **73** | 0 | 52 nghiệp vụ + 21 toàn vẹn |
| 6 | Lifecycle (concurrency / hết hạn / bồi thường) | **34** | 0 | 13 ca + 21 toàn vẹn |
| 7 | Browser E2E + responsive + a11y | **54** | 0 | 33 kịch bản + 21 toàn vẹn |
| | **Tổng** | **633** | **0** | 633 kết quả, trong đó 21 bất biến toàn vẹn được báo cáo 4 lần (độc lập + sau API + sau lifecycle + sau Browser) ⇒ 570 kiểm tra phân biệt |

`npm run format:check` sạch; `frontend lint` còn 3 cảnh báo có từ trước (không thuộc F-07…F-10, §5).

## 2. Ưu tiên: F-07 → F-10

| Mã | Thay đổi | Kiểm chứng |
|---|---|---|
| **F-07** | `adminService.createShowtime/updateShowtime/updateMovie` trả dòng kết quả của SP thay vì envelope driver (`recordsets`, `rowsAffected`…). Frontend không đọc các trường này (xác minh trong `resourceController`/`operationsController`); script stress cũ `booking-stress.mjs` được cập nhật nhận cả hai dạng | `backend/tests/adminDtoShape.test.js` (2), `adminService.test.js` (đổi kỳ vọng "giữ nguyên result"), `API-ADM-05/06` khẳng định `recordsets === undefined` và `SuatChieuID`/`PhimID` đúng; Browser E2E tạo/sửa suất & phim qua UI vẫn PASS |
| **F-08** | Bỏ nhánh `50117 → SHOWTIME_ALREADY_CANCELLED` (SP không bao giờ ném mã này; hủy lặp là idempotent) ở `adminService`, `managerService`, bảng test và thông điệp `operationsModel.js` | Test quét "mọi mã lỗi SQL admin đều được map" vẫn PASS; `API-MGR-06`, `LC-CMP-02/03` chứng minh hủy lặp = 200 không đổi dữ liệu |
| **F-09** | `frontend/src/api/errorMessages.js`: bảng 115 mã lỗi → tiếng Việt, áp dụng ở `httpClient` (giữ nguyên `status`/`code`; giữ thông điệp tiếng Việt cụ thể do server trả; mã lạ rơi về thông điệp theo HTTP status). API vẫn trả thông điệp tiếng Anh ổn định | `frontend/tests/errorMessages.test.js` quét **toàn bộ** `HttpError(…, 'CODE')` của backend — thêm mã mới mà thiếu bản dịch sẽ làm test thất bại; E2E-ADM-COMMERCE thấy UI hiển thị "Khuyến mãi đã gắn với đơn hàng nên không thể xóa…". Test `auth-rate-limit` cập nhật kỳ vọng thông điệp (status/code vẫn được khẳng định) |
| **F-10** | `npm run format` trên backend/frontend/shared + `scripts/audit` (đã thêm vào glob) | `format:check` "All matched files use Prettier code style"; toàn bộ test chạy lại sau khi format |

## 3. Concurrency, hết hạn giữ ghế, hủy suất có bồi thường (`scripts/audit/lifecycle.mjs`)

Yêu cầu song song thật qua `Promise.all` trên HTTP → nhiều phiên SQL; mỗi ca kiểm tra cả mã HTTP lẫn trạng thái SQL. Kết quả đo ở lần chạy cuối:

| Ca | Tình huống | Kết quả đo |
|---|---|---|
| LC-CONC-01 | 8 khách đặt cùng 1 ghế | 1×201, 7×409 `SEAT_CONFLICT`; đúng 1 vé hiệu lực |
| LC-CONC-02 | 10 khách × 3 ghế ngẫu nhiên trong 6 ghế | 1×201, 9×409; không ghế nào bán hai lần; không 5xx |
| LC-CONC-03 | 1 khách bắn 6 đơn song song | đúng 3×201 (= `fn_GioiHanDonDangGiu`), 3×409 `ACTIVE_ORDER_LIMIT_REACHED` |
| LC-CONC-04 | 6 kết quả thanh toán "Thành công" cùng lúc | 6×200 idempotent; đúng 1 `THANHTOAN` thành công; đơn paid |
| LC-CONC-05 | 6 suất chồng giờ cùng phòng | 1×201, 5×409 `SHOWTIME_OVERLAP`; 0 chồng giờ trong SQL |
| LC-CONC-06 | Mã khuyến mãi 1 lượt, 6 khách | 1×201, 5×409 `PROMOTION_NOT_AVAILABLE`; `SoLuongDaDung` = 1 |
| LC-CONC-07 | 5 bảng giá trùng điều kiện | 1×201, 4×409 `PRICING_OVERLAP` |
| LC-CONC-08 | 6 đặt vé đua với hủy suất | không 5xx; không còn giữ chỗ nào trên suất đã hủy (lần chạy cuối hủy bị chặn 409 vì đơn thắng; nhánh "hủy thắng" là bất định theo thời gian và được bất biến kiểm cả hai nhánh) |
| LC-EXP-01 | Hết hạn giữ chỗ | ghế `Trống` ngay; thanh toán 409 `ORDER_HOLD_EXPIRED`; khách khác đặt được đúng các ghế đó |
| LC-EXP-02 | Job nền thật (chu kỳ 60 s) | đơn → `Hết hạn` ≤ 90 s, vé `Đã hủy`, lượt khuyến mãi 26 → 25 |
| LC-CMP-01 | Hủy khi còn giữ chỗ | 409 `SHOWTIME_HAS_HELD_ORDERS`, không đổi dữ liệu |
| LC-CMP-02 | Đơn đã thanh toán (vé 180.000, đồ ăn 70.000, giảm 20.000) bị hủy suất | đơn/vé `Đã hủy`; 1 dòng bồi thường = **165 điểm** (khớp công thức độc lập `floor((vé − giảm·vé/(vé+đồ ăn))/1000)`); số dư điểm +165; thanh toán vẫn `Thành công`; trả lượt khuyến mãi; hủy lại không cộng thêm |
| LC-CMP-03 | 4 yêu cầu hủy song song | 4×200; đúng 1 dòng bồi thường |

Ghi chú trung thực: các script cũ `database/11_tests/concurrency/*.mjs` **không chạy được** (thiếu `scripts/db/concurrency-support`, bị xóa khi dọn repo); README của thư mục đã ghi rõ và trỏ sang runner mới. Thử nghiệm `LC-EXP-*` dùng "du hành thời gian" trên CSDL test (cập nhật `HanGiuCho` về quá khứ) vì việc chờ 10 phút thật không thực tế; job nền và SP là mã thật.

## 4. Luồng Admin E2E còn thiếu, responsive, accessibility

| Kịch bản | Nội dung | Bằng chứng |
|---|---|---|
| E2E-ADM-DASHBOARD | 8 chỉ số tổng quan = SQL độc lập | `{revenue 15.535.000, orders 86, today 8, complaints 9, users 309, cinemas 38, rooms 37, movies 33}` khớp |
| E2E-ADM-REVENUE | Báo cáo theo tháng và lọc 1 ngày = SQL độc lập (theo ngày kinh doanh UTC+7) | doanh thu/đơn/vé/tiền vé/đồ ăn/giảm giá khớp ở cả hai khoảng |
| E2E-ADM-IMAGES | Thêm ảnh (cover) → thêm → đổi cover → ẩn → xóa | đúng 1 ảnh cover tại mọi thời điểm; trạng thái/xóa khớp SQL |
| E2E-ADM-COMPLAINT | Admin ghi nhận xử lý + đổi trạng thái bằng UI | log append-only do Admin ghi; trạng thái cuối `Đã giải quyết` |
| E2E-ADM-ROOMS-SEATS | Ghế (tạo → hỏng → xóa) và phòng (sửa → xóa) ở workspace Admin | khớp SQL |
| E2E-ADM-BOOKING-CRUD | Tạo đơn nhân viên qua wizard Admin → hủy | đúng ghế, vé giữ lịch sử |
| E2E-ADM-SHOWTIME-EDIT | Sửa giá suất qua Operations | `GiaVeCoBan` = 99.000 |
| E2E-EXP-HOLD | UI: đơn hết hạn không thanh toán được; job nền → `Hết hạn`; ghế `Trống` lại trên trang đặt vé | PASS (≈60 s) |
| E2E-CMP-CANCEL | Khách đặt+thanh toán (KM `DEMO20K`) → Admin hủy suất bằng UI → khách thấy "Suất chiếu đã bị hủy" và "Điểm bồi thường đã cộng: 182" | điểm khớp công thức; thanh toán giữ nguyên |
| E2E-A11Y-DESKTOP / TABLET / MOBILE | axe-core 4.10 (WCAG 2.0/2.1/2.2 A+AA) + không tràn ngang, 32 trang × 5 nhóm (khách vãng lai, Customer, Manager, CSKH, Admin) (1366×900, 768×1024, 390×844) | 0 vi phạm |
| E2E-RESP-MOBILE-FLOWS | Đặt vé bằng thanh dưới trên mobile (touch, ghế ≥ 24 px); ngăn kéo điều hướng Admin; không tràn ngang | PASS |
| E2E-A11Y-KEYBOARD | Mũi tên + Space trong sơ đồ ghế; skip link là tab đầu tiên; dialog modal: focus không rơi ra nội dung phía sau, Esc đóng, focus trả về nút mở | PASS |

**Lỗi a11y thật được phát hiện và sửa (trước đó axe báo `critical`/`serious`):**
1. `AdminShell.jsx`: nút "Tìm chức năng" mất chữ trên mobile ⇒ thêm `aria-label="Tìm chức năng"` (`button-name`, critical, 18 trang).
2. `AdminAnalytics.jsx`: `<span>` biểu tượng nằm trong `<dl>` ⇒ `aria-hidden="true"` (`definition-list`, serious, 4 vùng).
Không đổi bố cục, màu sắc hay thiết kế.

## 5. Vấn đề còn mở

| Mã | Nội dung | Mức |
|---|---|---|
| F-11 | "Tiền thực thu" (dashboard/báo cáo) vẫn tính các đơn bị hủy do hủy suất vì tiền không hoàn mà bồi thường bằng điểm. Đúng với SP và đã được kiểm chứng, nhưng cần chủ nghiệp vụ xác nhận có muốn tách "doanh thu đã bồi thường" | Info |
| F-12 | `frontend lint` (oxlint) còn 3 cảnh báo có sẵn: `ProductFilters.jsx` (biến `priceLabel` không dùng), `AdminAnalytics.jsx` (tham số `can` không dùng), `ShowtimeBrowser.jsx` (`setState` trong effect). Không sửa để tránh đụng UI ngoài phạm vi | Info |
| F-13 | Scripts `database/11_tests/concurrency/*.mjs` hỏng import (thiếu thư mục support). Đã ghi chú; có thể xóa hoặc khôi phục support ở đợt dọn dẹp riêng | Info |
| F-14 | Kiểm thử đã tích lũy dữ liệu `E2E …` trong CSDL test (không có cơ chế dọn vì lịch sử là đối tượng kiểm thử) | Info |

## 6. Phạm vi KHÔNG được khẳng định (chưa kiểm thử hoặc kiểm thử một phần)

- **Trình duyệt/thiết bị:** chỉ Microsoft Edge 155 (Chromium). Không có Firefox/Safari, thiết bị thật, màn hình đọc thực tế (NVDA/VoiceOver) hay thử nghiệm người dùng. Chế độ `isMobile`/`hasTouch` của Playwright chỉ giả lập.
- **Accessibility:** axe-core chỉ phát hiện một phần lỗi WCAG (thường ước tính ~30–50%). Chỉ quét trang ở trạng thái vừa tải (không quét từng dialog/trạng thái lỗi), chủ đề giao diện mặc định; không kiểm thử chế độ sáng/tối khác, phóng to 200–400%, `prefers-reduced-motion`, độ tương phản của mọi trạng thái hover/focus.
- **Concurrency:** song song ở mức HTTP trong một tiến trình Node (tối đa 10 kết nối trong pool) với số lượng nhỏ (4–10 yêu cầu). Không phải stress/soak, không kiểm thử deadlock có chủ đích, đa tiến trình/đa node, hay failover. Nhánh "hủy suất thắng đua với đặt vé" (LC-CONC-08) là bất định theo thời gian và không được đảm bảo xảy ra mỗi lần chạy.
- **Hết hạn giữ ghế:** hạn được kéo về quá khứ bằng SQL trên CSDL test; không chờ hết cửa sổ giữ thật; chưa kiểm thử khi nhiều job tick chồng nhau hoặc backend khởi động lại giữa chừng.
- **Hủy suất có bồi thường:** đã kiểm thử đơn đã thanh toán có khuyến mãi và đồ ăn; chưa kiểm thử nhiều đơn của cùng một khách trong một suất, đơn có `Hoàn thành`/vé `Đã sử dụng`, hoặc hủy suất có hàng trăm đơn.
- **Fixture BR05** ("đã xem phim") vẫn dựng bằng SQL vì ứng dụng không tạo được suất quá khứ.
- **Hiệu năng, bảo mật xâm nhập (OWASP), tải, backup/restore, migration/reset/seed, CSDL chính `CinemaBookingDB`** — không thuộc phạm vi và không được kiểm thử.
- **Thanh toán** là mô phỏng nội bộ, không có cổng thật; thông báo (email/SMS) không được kiểm thử.

Vì vậy kết luận được phép: *"mọi bộ kiểm thử đã định nghĩa trong repo đều PASS trên `CinemaBookingDB_Test` ngày 2026-10-14"*; **không** phải "FULL PASS" cho toàn bộ hệ thống hoặc cho các phạm vi nêu ở §6.

## 7. Tệp thay đổi

- Sản phẩm: `backend/src/services/adminService.js`, `backend/src/services/managerService.js`, `frontend/src/api/httpClient.js`, `frontend/src/api/errorMessages.js` (mới), `frontend/src/features/operations/operationsModel.js`, `frontend/src/layouts/AdminShell.jsx`, `frontend/src/features/admin-analytics/AdminAnalytics.jsx` (+ định dạng Prettier trên các tệp có sẵn không đạt).
- Test: `backend/tests/adminDtoShape.test.js`, `backend/tests/adminService.test.js`, `frontend/tests/errorMessages.test.js`, `frontend/tests/auth-rate-limit.test.js`.
- Runner: `scripts/audit/lifecycle.mjs`, `scripts/audit/browser-scenarios-hardening.mjs` (mới), cập nhật `lib.mjs`, `db-integrity.mjs`, `api-integration.mjs`, `run-all.mjs`, `browser-helpers.mjs`, `browser-scenarios*.mjs`; `package.json` (+`audit:lifecycle`, devDependency `axe-core@4.10.2`).
- Tài liệu: `docs/audit/*`, `README.md`, `backend/TESTING.md`, `database/11_tests/concurrency/README.md`.
