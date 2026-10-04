# R2 — Payment / Showtime Cancellation / Compensation Policy

**Kết quả: PASS** — mã nguồn, baseline dựng lại, SQL/HTTP/browser tests và regression.
Ngày kiểm tra: 04/10/2026 (Asia/Ho_Chi_Minh).
Database xác minh: `CinemaBookingDB_R0_R1_R2_Final20261004` (database thử nghiệm riêng).
Sau kiểm thử, người dùng cho phép triển khai: đã áp dụng R2 + R2-FIX lên
`CinemaBookingDB` tại chỗ và xóa 16 DB thử nghiệm CinemaBooking. Không reset DB
chính. Xem [báo cáo triển khai](../r2fix/MAIN_DEPLOYMENT_REPORT.md).

## 1. Audit và SP/file đã sửa

| Luồng | Audit trước R2 | Sau R2 |
| --- | --- | --- |
| Hold/booking | `sp_Booking_Create`, `fn_DonDangGiuGhe`, `fn_ThoiGianGiuChoPhut`: hold 5 phút, khóa khách → suất → ghế, DB chốt giá/promotion | Giữ nguyên; chạy booking concurrency regression |
| Expiry | `sp_Order_ExpirePending`, job backend, `sp_Seat_ListByShowtime`, hai view đơn: DB lọc hold quá hạn; detail đọc state từ view | Expiry xử lý cả deadline NULL không hợp lệ; detail cleanup bằng SP trước khi đọc; payment từ chối đồng thời cleanup |
| Payment | Có check expiry nhưng lấy clock trước khi chờ khóa; lỗi có thể để đơn/ticket chưa cleanup; UI yêu cầu tạo attempt và chọn thành công/thất bại | Clock lấy sau khóa; đơn hết hạn không thể tạo/confirm payment; một nút xác nhận đồng bộ |
| Hủy suất | `sp_Showtime_CancelCascade` hủy cả live hold, trừ điểm thưởng cũ và ghi đè payment thành hoàn tiền | Chặn live hold bằng 50118; paid order hủy + cộng điểm bồi thường; không viết THANHTOAN |
| Payment history | `vw_LichSuDatVe`, `vw_ChiTietDonDatVe`, detail SP trả payment recordset thứ tư | Giữ nguyên payment recordset, bổ sung DTO bồi thường từ audit DB |
| Điểm | `HOSOKHACHHANG.DiemTichLuy` và payment SP cộng điểm thưởng thanh toán | Giữ điểm thưởng cũ; cộng bồi thường phần vé trong transaction hủy |

SQL sửa:

- `database/08_procedures/payment/sp_Payment_CreateAttempt.sql`.
- `database/08_procedures/payment/sp_Payment_UpdateResult.sql`.
- `database/08_procedures/customer/sp_Order_ExpirePending.sql`.
- `database/08_procedures/customer/sp_Order_GetDetailByCustomer.sql`.
- `database/08_procedures/system/sp_Showtime_CancelCascade.sql`.
- Mới: `database/02_tables/boithuong_huysuat.sql`, `database/05_functions/fn_TinhBoiThuongVe.sql`.
- Baseline: `database/build-objects.sql`, `database/baseline-manifest.json`, các verify objects/schema/constraints/orphans/procedures được tái sinh từ database mới chỉ dựng bằng source.

Backend sửa: `orderService.js`, `adminService.js`, `managerService.js`; giữ whitelist/SP-only.
Map 50118 → `409 SHOWTIME_HAS_HELD_ORDERS` cho cả Admin/Manager; 50111 →
`409 ORDER_HOLD_EXPIRED`; 50121 → `409 SHOWTIME_NOT_PAYABLE`; 50119 →
`409 SHOWTIME_NOT_CANCELLABLE`. Xóa ba gap tương ứng đã xử lý khỏi inventory gap R0.

Frontend sửa: `PaymentPage.jsx`, `OrderDetail.jsx`, `HoldDeadline.jsx`,
`AdminPortal.jsx`, `ManagerPortal.jsx`, `bookingLimits.js`.
Thêm/sửa unit tests backend/frontend, SQL compensation fixtures và scripts
`scripts/r2/{integration,browser,checks}.mjs`, `frontend/tests/r2-browser-fixtures.jsx`.
Tài liệu cập nhật: README gốc/database và `docs/api-phase5.md`.

Không sửa booking/promotion SP/function, timezone helpers/shared contract, RBAC,
seed, wrappers `sp_XuLyThanhToan`/`sp_DatVe`/Admin/Manager cancel.
`fn_ThoiGianGiaHanThanhToanPhut` là object legacy không được luồng payment sử dụng;
không có gia hạn hold, gateway hay late callback trong luồng R2.

## 2. State flow sau R2

```text
Booking → Chờ thanh toán, HanGiuCho = deadline UTC từ DB
  ├─ DB now < deadline + suất hợp lệ + xác nhận
  │    → payment Thành công → đơn Đã thanh toán, HanGiuCho NULL
  └─ DB now >= deadline (hoặc deadline NULL không hợp lệ)
       → đơn Hết hạn → vé Đã hủy → ghế được giải phóng
       → tạo/confirm payment trả ORDER_HOLD_EXPIRED

Hủy suất trong transaction:
  ├─ còn live hold → 50118 → rollback → HTTP 409
  └─ không còn live hold
       → cleanup expired holds (giữ đơn ở Hết hạn)
       → ledger + cộng điểm các đơn đã thanh toán thành công
       → vé/đơn đã thanh toán Đã hủy → suất Đã hủy
       → payment thành công và điểm thưởng cũ giữ nguyên

Retry suất Đã hủy → success/no-op, SoDonDaHuy = 0
```

Frontend lấy `holdExpiresAt` từ server, khóa nút khi countdown hết rồi đọc lại
đơn/ghế. Không tự đổi trạng thái đơn thành Hết hạn. Nếu đồng hồ trình duyệt đi
trước và server còn báo Chờ thanh toán, UI tiếp tục kiểm tra với server.
Một click xác nhận gọi create attempt và confirm success nối tiếp; DB kiểm tra
hạn ở cả hai SP. Endpoint kết quả thất bại được giữ tương thích API cũ; UI không
còn cho chọn kết quả mô phỏng và không có điều khiển refund.

## 3. Công thức tính điểm

```text
TongTruocGiam = TongTienVe + TongTienDoAn
GiamChoVe = TienGiamGia × TongTienVe / TongTruocGiam
TienVeThucTra = MAX(0, TongTienVe - GiamChoVe)
DiemCong = FLOOR(TienVeThucTra / 1000)
```

Tổng bằng 0 trả tiền/điểm bằng 0. SQL dùng DECIMAL; số tiền audit có 6 chữ số
thập phân, không làm tròn về VNĐ hay về cent trong phân bổ. Điểm được tính từ
tỷ lệ chính xác của các snapshot cent DECIMAL và phần dư để tránh division
rounding đẩy một số ngay dưới 1.000 lên thành 1 điểm. Chỉ dùng FLOOR ở bước
điểm cuối; không FLOAT, không tính điểm trong JavaScript.

| Vé | Đồ ăn | Giảm chung | Tiền vé thực trả | Điểm bồi thường |
| ---: | ---: | ---: | ---: | ---: |
| 120.000 | 0 | 0 | 120.000 | 120 |
| 120.000 | 80.000 | 0 | 120.000 | 120 |
| 120.000 | 80.000 | 50.000 | 90.000 | 90 |
| 120.000 | 0 | 20.000 | 100.000 | 100 |
| 0 | 80.000 | 0 | 0 | 0 |

## 4. Xử lý promotion

Chỉ `fn_TinhBoiThuongVe` phân bổ giảm chung theo tỷ trọng vé để bồi thường.
Booking vẫn chốt snapshot và dùng promotion như trước. Phần đồ ăn không được
chuyển thành điểm bồi thường. Việc trả lượt promotion cho đơn bị expiry/hủy
giữ hành vi hiện hữu, trong transaction; retry hủy không trả lượt lần nữa.
Điểm thưởng thanh toán hiện hữu không bị tính lại hay trừ đi khi hủy suất.

## 5. Chống double-credit và transaction

- Giữ thứ tự khóa khách → suất → đơn từ baseline. Cancel dùng customer scan
  UPDLOCK/HOLDLOCK và khóa suất để serialize với booking/payment/cancel.
- Chặn live hold trước mọi ghi dữ liệu. Nếu bị chặn, transaction rollback.
- `BOITHUONG_HUYSUAT` dùng PK `DonDatVeID`: tối đa một ledger/order, gồm user,
  suất, snapshot vé/đồ ăn/giảm, tiền vé thực trả, điểm, timestamp UTC, người thực
  hiện khi wrapper truyền vào. Lý do hủy lưu tại DONDATVE.
- Chỉ OUTPUT những ledger vừa insert vào tập cộng điểm; SUM theo khách.
  EXISTS payment Thành công tránh nhân điểm khi join nhiều payment attempts.
- Ledger, điểm, vé, đơn, promotion và suất cùng commit/rollback. Khách thiếu
  HOSOKHACHHANG được tạo profile điểm trước khi cộng trong transaction.
- Retry suất Đã hủy trả no-op trước khi tính điểm. PK vẫn là lớp chặn bổ sung.
- Payment SP lấy now sau khi chờ khóa; khi tự sở hữu transaction, commit cleanup
  expiry rồi mới báo 50111. Nếu gọi trong outer transaction, transaction của
  caller vẫn quyết định commit/rollback; API gọi SP độc lập.

## 6. Test đã chạy

Tổng hợp máy đọc được: [evidence/checks.json](evidence/checks.json), **16/16 PASS**.

| Kiểm tra | Kết quả / bằng chứng |
| --- | --- |
| Clean `npm.cmd run db:reset -- --database=CinemaBookingDB_R0_R1_R2_Final20261004` | PASS; [reset](evidence/db-reset.txt) |
| DB SQL tests: smoke, timezone, compensation, triggers, integrity, execute-only | PASS; [SQL log](evidence/r2-sql.txt) |
| R2 live HTTP/SQL | **14 checks, 103 requests PASS**; [integration](evidence/integration.json) |
| Một/nhiều live holds, rollback blocked cancel; expired → release → cancel | PASS |
| Payment trước/sau expiry; retry expired; direct SP cleanup | PASS |
| Payment bắt đầu trước hạn nhưng chờ khóa qua hạn | PASS: 50111 sau khóa |
| Paid-only cancel; 4 ví dụ điểm; food-only; nhiều khách | PASS |
| 12 concurrent Admin/Manager cancels + retry | PASS: 1 ledger/order, điểm đúng một lần |
| Payment history từng cột giữ nguyên; không refund | PASS: deep equality SQL payment snapshots |
| Outer rollback; nhiều paid orders cùng khách | PASS |
| Overflow điểm gây lỗi ghi | PASS: rollback ledger/đơn/suất toàn bộ |
| Booking vs cancel race | PASS: booking thắng → cancel 409, hoặc cancel thắng → booking 409 |
| DECIMAL fractions, tổng 0, discount vượt tổng, final FLOOR sát 1.000 | PASS |
| Backend | **99/99 PASS**; [log](evidence/backend.txt) |
| Frontend | **32/32 PASS**; [log](evidence/frontend.txt) |
| Real Chrome R2 với HTTP fixtures | PASS: disable, server authority, refresh, một click, Admin/Manager 409; [browser](evidence/browser.json) |
| Frontend build / lint | PASS; lint sạch; [build](evidence/frontend-build.txt), [lint](evidence/frontend-lint.txt) |
| Backend SP-only / procedure contracts | PASS: 112 methods, 120 captured calls, 0 problems |
| R1 fixed-clock expiry/report boundary | PASS; [fixed clock](evidence/r1-fixed-clock.json) |
| R1 HTTP/SQL timezone UTC, Asia/Ho_Chi_Minh, America/Los_Angeles | PASS: mỗi múi giờ 10 checks / 29 requests |
| R1 Chrome timezone/forms | PASS; [R1 browser](evidence/r1-browser.json) |
| Booking concurrency + pricing overlap + cinema image lock | PASS; [log](evidence/booking-concurrency.txt) |
| Final DB verify | PASS: **158 source modules**, schema/constraint/security/dependency parity; [log](evidence/db-verify.txt) |

R1 evidence lịch sử được giữ nguyên; các lần regression mới được sao chép vào
thư mục evidence R2. Credentials và JWT không được ghi vào evidence.

## 7. Vấn đề còn lại

Không còn test R2 thất bại. Regression thực hiện trên database thử nghiệm riêng;
sau đó đã deploy SQL R2 cùng schema R2-FIX lên `CinemaBookingDB`. DB verify trên
DB chính PASS, 158 module khớp source và dữ liệu 26 bảng cũ giữ nguyên.
Các DB thử nghiệm đã xóa; evidence regression được giữ trong repository.

Các giới hạn giữ từ hệ thống trước: các khóa customer/showtime trong cancel
có thể làm thao tác hủy chờ booking/payment; `DiemTichLuy` vẫn INT nên vượt trần sẽ
làm rollback toàn bộ cancellation (đã kiểm thử). Các gap R0 ngoài payment/cancel
vẫn nằm trong `database/_audit/known-contract-gaps.json`, không mở rộng sang RBAC
hay nghiệp vụ update showtime/seat trong R2. Build vẫn báo chunk >500 kB như
trước; build thành công.

## 8. Kết luận

**R2 PASS** trong phạm vi triển khai source/baseline và xác minh trên SQL Server
thật, backend/frontend và Chrome. Không refund; lịch sử payment thành công giữ
nguyên; tiền vé thực trả và điểm authoritative tại DB; retry/concurrency không
cộng điểm trùng; timezone R1 và booking regressions PASS.
