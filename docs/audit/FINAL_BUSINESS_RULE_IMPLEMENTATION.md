# Báo cáo cuối — Chốt nghiệp vụ điểm, thanh toán và doanh thu

**Ngày:** 2026-10-14 · **CSDL kiểm thử duy nhất:** `CinemaBookingDB_Test` (login `CinemaTestUser`, không có quyền vào `CinemaBookingDB`; `DB_NAME()` được kiểm tra trước mọi lô ghi). **CSDL chính không bị thay đổi.**

## 1. Quy tắc nghiệp vụ đã áp dụng

| # | Quy tắc | Nơi thực thi |
|---|---|---|
| R1 | **Không có hoàn tiền** dưới bất kỳ hình thức nào. Không có refund API, transaction hay scheduler. | Không có thủ tục nào ghi `THANHTOAN = Đã hoàn tiền` / `DONDATVE = Hoàn tiền`; kiểm tra `POST-DB-REFUND-01` |
| R2 | Hủy suất chiếu có vé đã thanh toán → **tiền vé đủ điều kiện bồi thường quy đổi thành điểm** cộng vào tài khoản khách, đúng tỷ lệ hiện hành (`fn_TinhBoiThuongVe`: 1.000 VND giá trị vé sau khuyến mãi = 1 điểm). Tỷ lệ không bị đổi. | `sp_Showtime_CancelCascade` (không sửa) |
| R3 | Khách dùng điểm để giảm tiền vé ở lần đặt sau, một phần hoặc toàn bộ: **1 điểm = 1.000 VND** trên giá trị vé *sau khuyến mãi* (nghịch đảo của tỷ lệ bồi thường). Khuyến mãi + điểm không vượt giá trị vé. | `sp_Booking_Create` (`@DiemSuDung`, `@ChiXemTruoc`) |
| R4 | Điểm bị giữ khi tạo đơn (khóa `UPDLOCK, HOLDLOCK` trên `HOSOKHACHHANG`), **trả lại đúng số điểm** khi đơn hết hạn/bị hủy trước khi thanh toán — một lần duy nhất. Điểm không bao giờ âm. | `sp_Booking_Create`, `sp_Order_ExpirePending`, `sp_Order_Cancel`, `sp_StaffBooking_Cancel`; CHECK `DiemTichLuy >= 0` |
| R5 | **Tiền thực thu** = `TongTienVe + TongTienDoAn − TienGiamGia − TienGiamBangDiem` của đơn có ≥ 1 `THANHTOAN` thành công. Phần trả bằng điểm **không** vào doanh thu; vé 100 % bằng điểm đóng góp 0 đồng. | `vw_DoanhThuTheoRap`, `sp_Admin_Dashboard`, `sp_Admin_Report_Revenue`, `sp_Manager_Revenue` |
| R6 | Hủy suất **không trừ** doanh thu đã thu. Dùng điểm bồi thường mua vé khác **không** phát sinh doanh thu mới. | Cùng công thức R5; PT-13, PT-14, E2E-PTS-COMPENSATION |
| R7 | Đơn trả đủ bằng điểm hoàn tất bằng phương thức `DIEM`; `DIEM` bị từ chối nếu còn tiền phải trả, và các phương thức tiền bị từ chối nếu không còn tiền phải trả (50430/50431). Không tạo tiền thực thu giả. | `sp_Payment_CreateAttempt`, `sp_Payment_UpdateResult` |
| R8 | Điểm tích lũy chỉ được cộng trên **tiền thực trả** (1 điểm / 1.000 VND), không cộng trên phần trả bằng điểm. | `sp_Payment_UpdateResult` |

Snapshot lưu trên đơn: `TongTienVe`, `TongTienDoAn`, `TienGiamGia` (khuyến mãi), `DiemSuDung`, `TienGiamBangDiem`; tiền thực trả được suy ra từ snapshot (`THANHTOAN` không có cột số tiền — giữ 3NF). Tài liệu: `Phân Tích _ Thiết Kế.md` §3.1b, `README.md`, `database/README.md`, `F-11_REVENUE_ANALYSIS.md` (đã chốt).

## 2. Thay đổi

### Database (SQL Server là nơi quyết định)

* Bảng/ràng buộc: `DONDATVE.DiemSuDung int`, `DONDATVE.TienGiamBangDiem decimal(18,2)` (+ DEFAULT 0, CHECK `DiemSuDung ≥ 0`, `TienGiamBangDiem ≥ 0`, quy đổi nhất quán, tổng giảm ≤ tiền vé); `THANHTOAN.PhuongThuc` thêm `DIEM`. Migration idempotent: `13_migrations/20261014_points_payment.sql`.
* Thủ tục: `sp_Booking_Create` (tính, xem trước, khóa, trừ điểm, snapshot), `sp_Payment_CreateAttempt`, `sp_Payment_UpdateResult`, `sp_Order_ExpirePending`, `sp_Order_Cancel`, `sp_StaffBooking_Cancel/UpdateSeats/Detail`, `sp_Order_GetDetailByCustomer`, `sp_Order_ListByCustomer`, `sp_Support_Complaint_GetOrderReference`, `sp_Admin_Dashboard`, `sp_Admin_Report_Revenue`, `sp_Manager_Revenue`; hàm `fn_TinhTongTienDon`; view `vw_ChiTietDonDatVe`, `vw_LichSuDatVe`, `vw_DoanhThuTheoRap` (thêm `TongGiaTriThanhToanBangDiem`).
* Kiểm thử SQL: `11_tests/booking/points_payment.sql` (transaction + ROLLBACK); `12_verify/*` cập nhật.
* `sp_StaffBooking_UpdateSeats` từ chối sửa ghế của đơn đã dùng điểm (tránh lệch snapshot).

### Backend (chỉ gọi Stored Procedure)

* `POST /api/bookings/preview` (xem trước, không ghi); `POST /api/bookings` nhận `points`; validator `points` (`INVALID_POINTS`).
* DTO: `pointsUsed`, `pointsDiscount`, `pointsBalance`, `maxPoints`; mã lỗi 50410/50411/50412 và 50430/50431 → `POINTS_*`.
* Thanh toán chấp nhận `DIEM`; doanh thu Manager trả `pointsPaidValue`, `cancelledOrderCash`.

### Frontend (thay đổi tối thiểu, không tự tính tiền/điểm)

* Trang đặt vé: số dư điểm, ô "Số điểm muốn dùng", "Dùng tối đa", tiền còn phải trả lấy từ preview của server (debounce).
* Trang thanh toán: đơn 0 đồng → chỉ nút "Xác nhận thanh toán bằng điểm", không chọn phương thức tiền.
* Hóa đơn/đơn hàng: dòng điểm đã dùng, điểm bồi thường đã cộng; nhãn "Tiền phải trả / đã trả (không gồm điểm)".
* Dashboard/báo cáo Admin và Manager: `SoDonHopLe`, `SoDonCoTienThucThu`, `TienThuocDonHuy`, `TongGiaTriThanhToanBangDiem`.

## 3. Bằng chứng doanh thu và quy đổi điểm (đối chiếu SQL thực, CSDL test)

| Tình huống | Kết quả đã kiểm chứng | Test |
|---|---|---|
| Không dùng điểm, 2 vé 100.000 | tiền thực thu **+200.000**, tích **200 điểm** | PT-01 |
| Vé 100.000, dùng 30 điểm | điểm bị trừ 30; `TienGiamBangDiem = 30.000`; tiền thực thu **+70.000**; tích 70 điểm | PT-02, E2E-PTS-PARTIAL |
| Vé 100.000, dùng 100 điểm (100 %) | tiền thực thu **+0**; `THANHTOAN = DIEM:Thành công`; số dư 0 | PT-03, E2E-PTS-FULL |
| Khuyến mãi 10.000 + điểm trên 90.000 còn lại | điểm tối đa 90; cash 0; tổng giảm không vượt giá trị vé | PT-05 |
| Dùng điểm vượt số dư / quá giá trị vé | 4xx `POINTS_INSUFFICIENT`/`POINTS_EXCEED_TICKET_VALUE`, không ghi gì | PT-04, PT-10 |
| Hủy suất, vé 100.000 đã thanh toán | **+100 điểm** bồi thường (một lần), tiền thực thu **không đổi** | PT-13, LC-CMP-02/03, E2E-PTS-COMPENSATION |
| Dùng điểm bồi thường mua vé mới 100.000 | cash **+0**, không ghi nhận lại doanh thu | PT-14, E2E-PTS-COMPENSATION |
| Đối chiếu Admin dashboard = báo cáo Admin = tổng Manager theo rạp = `vw_DoanhThuTheoRap` = oracle SQL độc lập | cash 23.343.500, giá trị trả bằng điểm 3.660.000, tiền thuộc đơn hủy 3.672.500 | PT-15 |
| Bản đối chiếu chỉ đọc cuối cùng | Dashboard = Báo cáo = View = **21.443.500**; 197 đơn có tiền; 0 thanh toán/đơn "hoàn tiền" | `revenue-analysis.mjs` |

Ví dụ nghiệp vụ trong yêu cầu (đơn 100.000 dùng 30 điểm → 70.000; 100 % điểm → 0 đồng) được kiểm chứng đúng ở cả API, SQL và giao diện.

## 4. Kết quả kiểm thử (một lần chạy `npm run audit:all` cuối cùng, tất cả PASS)

| Giai đoạn | PASS / FAIL |
|---|---|
| Backend unit/contract | 216 / 0 |
| Frontend unit/component | 239 / 0 |
| Frontend production build | PASS |
| Toàn vẹn DB (26 bất biến, gồm DB-POINTS-01..04, DB-REFUND-01) | 26 / 0 |
| API integration | 78 / 0 |
| Đối chiếu doanh thu (chỉ đọc) | PASS |
| Điểm / bồi thường / doanh thu (PT-01..PT-17 + 26 bất biến + hồi quy SQL) | 43 / 0 |
| Lifecycle: đồng thời, hết hạn giữ chỗ, hủy suất | 44 / 0 |
| Browser E2E (Edge, tương tác thật, SQL oracle) | 62 / 0 |

Ngoài ra: `format:check` sạch, `oxlint` 0 cảnh báo, production build PASS. Phủ: không điểm / một phần / 100 % điểm; khuyến mãi + điểm; thanh toán thất bại; dùng điểm đồng thời (1 thành công, 5 bị từ chối); hết hạn trả điểm đúng một lần; hủy suất đồng thời (4 yêu cầu → cộng điểm đúng một lần); hủy lặp; snapshot lịch sử; báo cáo Admin và Manager.

**Hai lỗi xuất hiện giữa chừng và nguyên nhân (không chỉnh assertion để tạo PASS giả):**

* `E2E-ADM-BOOKING-CRUD`: wizard đặt vé của Admin chỉ liệt kê **200 suất gần nhất** của một rạp (`TOP(200)` trong `sp_StaffBooking_Options`); sandbox tích lũy 233 suất nên suất mới tạo nằm ngoài danh sách. Đây là hiện tượng dữ liệu kiểm thử, không phải lỗi nghiệp vụ. Sửa phía runner: kịch bản tạo một rạp/phòng cô lập mới (`isolated: true`), không đổi sản phẩm.
* `LC-EXP-02`: assertion giả định chỉ một đơn dùng mã `DEMO10` hết hạn trong lúc chờ job 60 s; các đơn khác cùng mã (từ giai đoạn trước) cũng hết hạn và trả lượt. Chạy riêng bài pass; sửa assertion để đếm chính xác số lượt trả (`usedWithOrder − 1 − othersExpired`), vẫn kiểm chứng thủ tục trả đúng từng lượt.

## 5. Xác nhận: không có hoàn tiền, không trừ doanh thu khi hủy suất

* Không có endpoint, thủ tục, transaction hay scheduler nào hoàn tiền; `THANHTOAN` không bị sửa/xóa khi hủy suất (lịch sử thanh toán giữ nguyên — LC-CMP-02).
* Trạng thái `Đã hoàn tiền` (`THANHTOAN`) và `Hoàn tiền` (`DONDATVE`) chỉ còn trong CHECK constraint như **trạng thái legacy, không thuộc nghiệp vụ hoạt động**; số dòng thực tế = 0 (`POST-DB-REFUND-01`, `revenue-analysis.mjs`).
* Hủy suất: tiền thực thu trước/sau bằng nhau (PT-13, PT-14, E2E-PTS-COMPENSATION: `cash` không đổi); đơn bị hủy vẫn nằm trong tổng thực thu và được hiển thị riêng ở `TienThuocDonHuy`.

## 6. Xác nhận: phần trả bằng điểm không vào doanh thu

Công thức R5 trừ `TienGiamBangDiem` ở cả bốn nơi báo cáo; đối chiếu PT-15 cho thấy 3.660.000 VND giá trị điểm hiển thị riêng (`TongGiaTriThanhToanBangDiem`) và không có trong tiền thực thu. Vé 100 % điểm: `cash +0` (PT-03, E2E-PTS-FULL).

## 7. Giới hạn xác minh và vấn đề cần chủ nghiệp vụ biết

1. **Phạm vi:** chỉ `CinemaBookingDB_Test`. Migration `20261014_points_payment.sql` **chưa** áp dụng lên `CinemaBookingDB` (chưa được ủy quyền); cần review và phê duyệt riêng.
2. **Tỷ lệ tích điểm = tỷ lệ tiêu điểm** (1 điểm / 1.000 VND thực trả và 1 điểm = 1.000 VND giảm). Hệ quả: mỗi khoản thanh toán tiền thực tạo giá trị điểm gần bằng 100 % số tiền đó, có thể dùng cho lần đặt sau. Theo yêu cầu, các tỷ lệ **không** bị đổi; đây là hệ quả kinh tế để chủ nghiệp vụ nắm.
3. Wizard đặt vé của Admin/Manager vẫn giới hạn 200 suất gần nhất của rạp (hành vi cũ, không thuộc phạm vi thay đổi này).
4. Chỉ số "đơn thành công" của Dashboard và "đơn có tiền thực thu" dùng hai mẫu số khác nhau, nay được gắn nhãn tách bạch (`SoDonHopLe` / `SoDonCoTienThucThu`).
5. E2E chạy trên Microsoft Edge (Playwright) tại viewport desktop/mobile đã định nghĩa; không kiểm thử trên trình duyệt/thiết bị khác, không có cổng thanh toán thật (phương thức tiền là mô phỏng như trước).
6. Không có vấn đề nào chưa hoàn tất trong phạm vi yêu cầu.
