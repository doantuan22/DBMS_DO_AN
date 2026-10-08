# R4.7 — Order Detail read-only / expiry ownership

## Audit trước implementation

Baseline cuối Task14 trong `../evidence/r47/preserved-before.json`; main27 bảng/159 module, schema/constraints/signature/call graph trong `audit-before.json`. Before reproduction thật cả directSQL và HTTP GET: Detail gọi expiry cho toàn showtime, làm hết hạn cả đơn Customer khác, hủy vé, giảm promo usage2→0; cleanup toàn dữ liệu/metadata. Job hiện có hoạt động độc lập, không cần sửa production job.

## API / SQL contract

`GET /api/orders/:orderId`, authenticate→requireCustomer→orderController.getOrder→orderService.getOrderDetail→typed `ORDER_GET_DETAIL_BY_CUSTOMER`→`dbo.sp_Order_GetDetailByCustomer(@NguoiDungID INT,@DonDatVeID INT)`. Actor đến từ auth, không request body/query. SQL giữ guards50300/account,50301/role,50033/missing hoặc foreign order; HTTP live auth401/UNAUTHENTICATED, role middleware403/CUSTOMER_REQUIRED, missing/foreign404/ORDER_NOT_FOUND. Four resultsets giữ thứ tự: header, tickets, products, payments; response `{order}` giữ nguyên fields và types.

GET không ghi bất kỳ business row nào, không gọi expiry, không gọi write routines. Detail→`vw_ChiTietDonDatVe`→base tables/`fn_BayGio` là read-only; Backend/Auth và các read routines không mutate. Không Backend SQL/transaction, không expiry command từ GET.

## Persisted và effective status

Schema CHECK states: Chờ thanh toán, Đã thanh toán, Đã hủy, Hết hạn, Hoàn tiền, Hoàn thành. Hai state cuối tồn tại trong schema, không triển khai workflow mới. `HanGiuCho DATETIME2(7) NULL`, nhưng `CK_DONDATVE_HanGiuCho` bắt buộc NOT NULL cho pending. Clock `fn_BayGio()`=SYSUTCDATETIME, business/display timezone convention hiện hữu không đổi. Booking đặt deadline đúng5 phút, không gia hạn. Expiry eligible: persisted pending AND (deadline NULL OR deadline <= current DB time); NULL branch defensive, pending NULL không dựng được hợp lệ, không disable CHECK.

Đã có projection tương đương: view `TrangThaiDon` và DTO `status` là trạng thái hiệu lực, không phải cam kết stored status. Vì vậy **không thêm EffectiveStatus field**, không viết thêm CASE vào Detail hoặc sửa view. Trước deadline pending; đúng/sau deadline pending→effective Hết hạn; non-pending giữ nguyên dù deadline NULL/past. Với mọi dữ liệu hợp lệ theo CHECK, view và expiry predicate có cùng boundary `<=`. Stored `DONDATVE.TrangThai` không đổi qua GET. Sau khi xác minh CHECK, fix cuối chỉ xóa nested expiry và biến show lookup không còn dùng; kế hoạch ban đầu thêm NULL projection không cần thiết.

Ticket/payment/monetary fields phản ánh persisted data; effective expiry không phải bằng chứng quota đã được ghi hoàn hoặc ticket đã cancel. Seat availability đã bỏ qua past/NULL holds theo SQL rule hiện hữu, không phụ thuộc job cleanup. UI vẫn đọc `status` và deadline; không đổi field/API, không cần Frontend production change. Write payment SP tự kiểm tra status/deadline, không tin computed response.

## Read/write ownership matrix

| Operation | Owner | Business write |
|---|---|---|
| Detail/status read | Detail SP/view | Không |
| Effective status projection | Existing view + DB clock | Không |
| Expire pending | sp_Order_ExpirePending | Order→Hết hạn |
| Resource/quota cleanup | Expiry SP | Ticket→Đã hủy; decrement counted promo usage một lần; không physical GHE/payment/money write |
| Scheduler | existing expirePendingOrders job | Chỉ typed expiry invocation |
| Booking creation / availability | existing booking/catalog SQL | Giữ protocol hiện hành |
| Payment create/result | existing payment SP | Giữ authoritative lifecycle/checks |

Expiry SP giữ transaction/savepoint/rollback và transition eligibility hiện hữu. Retry chỉ chọn pending nên không double return; paid/canceled/future pending không expire. Không sửa payment rules hoặc hold timeout. Các explicit expiry invocation trong booking/payment/cancel command vẫn giữ nguyên.

## Job integration

`backend/src/server.js` start `startExpirePendingOrdersJob()` một lần; shutdown stop timer rồi close pool. Default60s setInterval/unref, running guard chống overlap, catch/log lỗi và finally release guard. Tick chỉ gọi whitelisted `EXPIRE_PENDING_ORDERS`; SQL quyết định thời gian. Job không cần GET. Không thêm scheduler/framework hoặc thay policy.

Non-mutation tests dùng createApp standalone không đăng ký job, để phân biệt read với independent writer; production server vẫn start job. Job tests dùng default typed client, timer test-only interval hoặc explicit tick hiện hữu, SQL thật, không request GET; full fingerprint kiểm tra transition/cleanup. Không dùng main cho fixture/fault/race.

## Reproduction và limits

```powershell
node scripts/r47/deploy.mjs --database=CinemaBookingDB_R0_R33_20261008_01 --apply
node scripts/r47/detail-tests.mjs --database=CinemaBookingDB_R0_R33_20261008_01
node scripts/r47/checks.mjs --database=CinemaBookingDB_R0_R33_20261008_01
```

Credentials từ môi trường hiện hữu; không commit secret. Before-audit là evidence đóng băng, không dependency của Backend suite hoặc integration replay. Fixture ownership/deterministic data, full cleanup fingerprints; không reset/reseed. GET nhiều SELECT theo isolation contract hiện hữu, không thêm cross-resultset snapshot guarantee khi writer commit xen kẽ. Exact equality predicate kiểm tra bằng SQL DB-time fixture; runtime GET trước/sau boundary riêng, không fake/freeze production clock.

Database hiện dùng READ_COMMITTED_SNAPSHOT: GET có thể đọc phiên bản đã commit trong lúc expiry transaction giữ khóa ghi; không buộc GET chờ writer. Tests kiểm tra read trước/sau writer commit và riêng caller SERIALIZABLE read-first/writer-blocking, không đổi production isolation. Main deploy chỉ sau test/regression, backup/VERIFYONLY và ALTER đúng Detail SP theo workflow được cho phép. R5–R9 không thực hiện; UC PARTIAL không tự nâng grade. Kết quả thật: `../evidence/R4_ORDER_DETAIL_READ_ONLY.md`.
