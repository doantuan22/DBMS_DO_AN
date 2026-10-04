# R3A — RBAC & Permission Audit

**R3A PASS: audit hoàn tất; các lỗi phân quyền vẫn giữ nguyên để review R3B.**
Ngày 04/10/2026 (Asia/Ho_Chi_Minh). Audit read-only trên `CinemaBookingDB`, probe
ghi dữ liệu trên fixture `CinemaBookingDB_R0_R3A_Audit20261004`, đã xóa fixture.
Không sửa source production, schema, SP nghiệp vụ, middleware hoặc FE guard.

Phạm vi: **45 use case, 118 endpoint (104 protected, 14 public), 4 role,
23 permission, 124 SP và 158 source module SQL**. Trace nguồn hiện tại và kiểm
registered Express routes thực tế; 112 service methods được capture với execution
stub, 119 calls, không có unresolved route/SP. DB chính và fixture đều khớp 158
module source trước probe.

Evidence tổng hợp: [R3A_STATUS.json](R3A_STATUS.json),
[endpoint inventory](evidence/endpoint-inventory.json),
[45 use cases](evidence/usecase-coverage.json),
[service trace](evidence/service-contracts.json).

## 1. Inventory Role / Permission

Inventory lấy từ DB chính, không suy ra chỉ từ seed:
[rbac-inventory.json](evidence/rbac-inventory.json). Hiện có **40 role-permission
grants, 8 tài khoản và 2 phân công rạp**.

| Role | Số permission | Tài khoản | Grant hiện tại |
| --- | --- | --- | --- |
| ADMIN | 23 | 1 | Tất cả permission catalog |
| QUAN_LY_RAP | 8 | 2 | XEM_PHIM, DAT_VE, THANH_TOAN, QL_PHONG, QL_GHE, QL_SUAT_CHIEU, QL_BANG_GIA, XEM_BAO_CAO_RAP |
| CSKH | 4 | 1 | XEM_PHIM, QL_KHIEUNAI, XULY_KHIEUNAI, TRA_CUU_DON |
| KHACH_HANG | 5 | 4 | XEM_PHIM, DAT_VE, THANH_TOAN, DANH_GIA, GUI_KHIEU_NAI |

| ID | Permission | Chức năng catalog | Backend guard hiện dùng |
| --- | --- | --- | --- |
| 1 | XEM_PHIM | Xem thông tin phim/lịch chiếu | Không; catalog public |
| 2 | DAT_VE | Đặt vé/chọn ghế/khuyến mãi | Không; Customer role guard |
| 3 | THANH_TOAN | Thanh toán đơn | Không; Customer role guard |
| 4 | DANH_GIA | Review phim đã xem | Không; Customer role guard |
| 5 | GUI_KHIEU_NAI | Tạo complaint | Không; Customer role guard |
| 6 | QL_PHONG | Rooms | Manager/Admin rooms |
| 7 | QL_GHE | Seats | Manager/Admin seats |
| 8 | QL_SUAT_CHIEU | Showtimes | Manager/Admin showtimes |
| 9 | QL_BANG_GIA | Pricing | Manager/Admin pricing |
| 10 | XEM_BAO_CAO_RAP | Dashboard/revenue rạp | Manager dashboard/revenue |
| 11 | QL_KHIEUNAI | Queue/detail complaint | Support/Admin read, kể cả order-reference |
| 12 | XULY_KHIEUNAI | Processing/status | Support/Admin processing/status |
| 13 | TRA_CUU_DON | Đơn tham chiếu complaint | Không; nhầm dùng QL_KHIEUNAI |
| 14 | QL_NGUOIDUNG | User accounts | Admin users |
| 15 | QL_VAITRO | Role catalog | Admin roles |
| 16 | QL_QUYEN | Permission/grant catalog | Admin permissions, role permission get/set |
| 17 | PHANCONG_RAP | Manager assignments | Admin assignments |
| 18 | QL_RAP | Cinemas/images | Admin cinemas/images |
| 19 | QL_DANHMUC_PHIM | Movies/actors/cast | Admin movies/actors/cast |
| 20 | QL_THELOAI | Genres | Admin genres |
| 21 | QL_SANPHAM | Products | Admin products |
| 22 | QL_KHUYENMAI | Promotions | Admin promotions |
| 23 | XEM_BAO_CAO_TOANHE | System reports | Admin dashboard/revenue |

Usage mỗi permission, grants, endpoint và SQL checks:
[permission-usage.json](evidence/permission-usage.json). Các bảng VAITRO, QUYEN,
VAITRO_QUYEN, NGUOIDUNG, PHANCONG_RAP có inventory/hashes đầy đủ; không export
password, email hoặc JWT của tài khoản vào evidence.

## 2. Permission Matrix

- [CSV đầy đủ, mở bằng Excel](PERMISSION_MATRIX.csv).
- [Markdown đầy đủ](PERMISSION_MATRIX.md).
- [JSON có trace source](evidence/endpoint-inventory.json).

Mỗi row chứa actor, use case, method/route, authentication/account status,
expected permission và căn cứ, permission Backend, role guard, ownership,
manager scope, SP, DB authorization, FE route/menu/action, status/flags và
references. Authentication SPs được ghi riêng khỏi operation SP.

Phân loại chính: MATCH **24**, MISSING **6**, MISMATCH **79**, ROLE-ONLY **3**,
BYPASS **6**. Một row có thể có nhiều flags; không cộng flags như số lỗi độc lập.
MATCH không khẳng định mọi SP đã kiểm authorization độc lập; cột DB vẫn ghi rõ
SP nào tin Backend. MISMATCH bao gồm UX gate khác quyền chức năng, không tự mang
nghĩa HTTP privilege escalation.

Có **5 row cần chốt expected mapping**: GET orders/list/detail, GET complaint
history/detail và manager assigned-cinema bootstrap. Đây là khoảng trống trong
catalog hoặc session contract đã được xác định, không phải trace bị thiếu. Không
tự gán permission mới hoặc dùng permission CSKH cho Customer để lấp matrix.

## 3. Backend findings

Authentication hiện tại là phần hoạt động đúng: `authenticate` verify JWT rồi gọi
`authService.getCurrentUser` ở mỗi request. Profile và permissions được đọc từ DB;
manager assignments cũng được đọc lại. `sp_User_GetCurrent` có thể trả row bị khóa,
nhưng service bắt buộc trạng thái `Hoạt động` trước khi middleware cho đi tiếp.
JWT chỉ có **sub/iat/exp**, không chứa role/permission snapshot.

Trace: [authenticate.js](../../../backend/src/middleware/authenticate.js),
[authService.js](../../../backend/src/services/authService.js),
[requirePermission.js](../../../backend/src/middleware/requirePermission.js).

**BUG-019 được nâng từ source-only thành runtime PROVEN.** Có 10 Customer
endpoint chỉ authenticate + requireCustomer, không requirePermission:

| Endpoint | Expected có căn cứ | Runtime sau thu hồi quyền, giữ JWT |
| --- | --- | --- |
| POST /api/bookings | DAT_VE | 201, tạo đơn |
| POST /api/promotions/validate | DAT_VE | 200, chạy preview (mã fixture không khớp) |
| POST /api/orders/:orderId/payments | THANH_TOAN | 201, tạo attempt |
| POST /api/orders/:orderId/payments/:paymentId/result | THANH_TOAN | 200, ghi thành công |
| POST /api/movies/:movieId/reviews | DANH_GIA | 201, ghi review đủ eligibility |
| POST /api/complaints | GUI_KHIEU_NAI | 201, ghi complaint |
| GET /api/orders và /api/orders/:orderId | Mapping đọc riêng chưa chốt | Role + ownership, không permission |
| GET /api/complaints và /api/complaints/:complaintId | Mapping đọc riêng chưa chốt | Role + ownership, không permission |

Trace: bookingRoutes, promotionRoutes, orderRoutes, movieRoutes, complaintRoutes;
đường dẫn và dòng chính xác trong matrix. Không coi ownership hợp lệ là thay thế
functional permission.

Manager có 17 operation routes kiểm đúng permission chức năng, cùng một
bootstrap `/manager/cinemas` chỉ role/self assignments. Support có 5 routes kiểm
permission; Admin có 68 routes đều kiểm permission riêng. Toàn bộ area vẫn có
hardcoded role guard (`requireCustomer/Manager/Support/Admin`). Manager giữ DAT_VE
nhưng POST bookings trả **403 CUSTOMER_REQUIRED**. Role change sau login cũng có
hiệu lực với token cũ.

Order-reference ở Support và Admin dùng **QL_KHIEUNAI**, dù catalog đã có
TRA_CUU_DON. CSKH chỉ QL, không TRA, vẫn đọc được reference; chỉ TRA lại bị 403.
Tổ hợp TRA và quyền nhìn complaint cần được review; chưa tự sửa.

## 4. Database findings

Danh sách **toàn bộ 124 SP**, functions/views/triggers, checks và delegates:
[database-authorization.json](evidence/database-authorization.json).

- **5 SP trực tiếp kiểm permission chức năng:** Support List/GetDetail/
  GetOrderReference dùng `QL_KHIEUNAI OR XULY_KHIEUNAI`; AddProcessing/UpdateStatus
  dùng `XULY_KHIEUNAI`. `sp_XuLyKhieuNai` delegate AddProcessing.
- **18 SP trực tiếp gọi scope helper:** 17 Manager room/seat/pricing/report/
  showtime SP (gồm Seat_BatchCreate ngoài HTTP hiện tại) và CancelCascade.
  `sp_Manager_Showtime_Cancel` delegate CancelCascade; `sp_ThemSuatChieu` delegate
  Manager_Showtime_Create. Phần lớn kiểm scope, không permission chức năng.
- `sp_Manager_ListAssignedCinemas` chỉ lọc assignments của user theo trạng thái/ngày;
  không permission riêng. Active account được Backend kiểm trước.
- Customer booking/payment/review/complaint SP không kiểm DAT_VE/THANH_TOAN/
  DANH_GIA/GUI_KHIEU_NAI. Booking có active-account check; review trigger kiểm đã
  mua vé và suất đã bắt đầu; private reads/create-reference kiểm owner.
- Payment_CreateAttempt/UpdateResult không nhận actor. Service kiểm order detail
  ownership trước, và payment membership trước UpdateResult. Không nói payment
  SP tự có ownership check.
- Admin operation SP chủ yếu không nhận actor và không kiểm functional permission;
  HTTP guard là authority. Assignment SP nhận NguoiDungID của **target manager**,
  kiểm target MaVaiTro=QUAN_LY_RAP; đó không phải authorization actor PHANCONG_RAP.
- RBAC_GetPermissionsByUser trả đúng grants của active user, **không Admin bypass**.
  Auth_Login cũng lấy grants thật, không trả mọi permission mặc định theo role.
- Role hardcode còn trong TRG_XuLyKhieuNai_KiemTraVaiTro (CSKH/ADMIN), assignment
  create/update (target QUAN_LY_RAP), customer registration provisioning và hai
  Admin helper branches. Trigger đã được probe: Manager có XULY vẫn bị **50005**.

DB chính có `db_executor`: GRANT EXECUTE schema dbo, DENY SELECT/INSERT/UPDATE/
DELETE schema dbo, CinemaAppUser thuộc role. Quyền SQL này không ánh xạ user JWT
vào VAITRO_QUYEN. Direct-SP probes dùng configured application connection trong
fixture; không suy diễn một end-user có thể gọi SQL trực tiếp hoặc có SQL injection.

## 5. Frontend findings

**BUG-020 PROVEN bằng source và runtime helper cùng user DTO của HTTP probe.**

| Phân hệ | Gate hiện tại | Mismatch |
| --- | --- | --- |
| Orders/payment/complaints | KHACH_HANG + DAT_VE | Payment phải THANH_TOAN; complaint-create phải GUI_KHIEU_NAI; own reads chưa có mapping riêng |
| Manager portal | QUAN_LY_RAP + QL_PHONG | Có QL_SUAT_CHIEU vẫn bị ẩn/chặn cả portal nếu thiếu QL_PHONG |
| Admin portal | ADMIN + QL_NGUOIDUNG | Chỉ XEM_BAO_CAO_TOANHE vẫn gọi report API được nhưng FE từ chối portal |
| Support portal | CSKH + QL_KHIEUNAI | Processing/status không guard XULY; order-reference không TRA guard |

`visibleAreasFor` lọc **permission nhưng không role**, còn RequireRole kiểm cả
role. Admin đầy đủ quyền hiện cả Customer/Manager/Support links nhưng các route
này từ chối role ADMIN. Manager có DAT_VE cũng có customer-area link bị route chặn.
Links tĩnh như Đơn của tôi không lọc permission.

AdminPortal hiện mọi section và action theo form/state, không kiểm permission của
section. Default section dashboard cần XEM_BAO_CAO_TOANHE dù portal gate chỉ
QL_NGUOIDUNG: user-only Admin vào portal nhưng default request bị 403.

ManagerPortal dùng một `Promise.all` tải rooms, showtimes, pricing, dashboard,
revenue. QL_PHONG-only Manager qua route gate, nhưng 4 request khác bị 403, khiến
toàn bộ data load lỗi. Không được sửa các chức năng chưa có UI ngoài audit RBAC.

Booking button chỉ login/Customer role, không DAT_VE. MovieReviews form chỉ
`Boolean(user)`, kể cả non-Customer, không DANH_GIA. Payment/complaint/action forms
chỉ kiểm state/loading, không functional permission. CinemaImageManager cũng
không tự kiểm QL_RAP, dựa vào admin portal nhưng portal dùng QL_NGUOIDUNG.

Frontend permission là profile snapshot trong state; không tự cập nhật sau revoke.
403 handler điều hướng forbidden nhưng không cập nhật permission snapshot. Đây
là UX stale state; các API có guard đúng vẫn từ chối. Không coi FE là security
boundary. [frontend-guards.json](evidence/frontend-guards.json) có mọi guard site;
probes có 7 helper cases. Không chạy browser end-to-end trong R3A; button/page
conditions được trace source, không trình bày như browser tests đã PASS.

## 6. Ownership / Manager scope findings

Ownership được map đầy đủ trong matrix:

- Orders list lọc user; detail xác minh order user trước trả kết quả.
- Payment service kiểm own order và paymentId membership; foreign attempt/result
  đều 404 ở runtime. SP payment tự thân không nhận user actor.
- Complaint list/detail lọc owner; create kiểm order tham chiếu thuộc sender.
  Foreign complaint và foreign order reference đều 404.
- Review author và booking owner lấy từ req.user.userId; review eligibility được
  trigger giữ nguyên, kể cả khi DANH_GIA thiếu.
- Support/Admin queue không cần Customer ownership; order reference chỉ lấy
  DonDatVeID liên kết complaint, không chấp nhận arbitrary orderId từ request.

Manager scope lấy resource → RapID → assignment authoritative trong SP. Helper
kiểm account active, status Hiệu lực, fn_HomNay >= NgayBatDau và <= NgayKetThuc
(nếu có). Có đúng 2 assignment trên DB chính. Các ngày dùng contract R1 hiện tại,
không thay timezone. Thu hồi status sau login khiến old JWT API rooms trả 403,
current assignments mất rạp và direct scope SP trả 50050.

Helper scope nhánh thường không tự kiểm MaVaiTro=QUAN_LY_RAP dù comment nói role;
nó tin assignment. API manager role guard và assignment provisioning đang cung
cấp ràng buộc đó. Không được bỏ các ràng buộc này trước khi chốt eligibility.

## 7. Admin bypass findings

**CONFLICT-005 xác minh chính xác ở ba lớp:**

1. [fn_KiemTraQuyenNguoiDung](../../../database/05_functions/fn_KiemTraQuyenNguoiDung.sql)
   trả 1 cho active ADMIN **trước** khi tra VAITRO_QUYEN; cả permission code không
   tồn tại cũng true. Không dựa vào grants thật.
2. [fn_KiemTraQuanLyRapScope](../../../database/05_functions/fn_KiemTraQuanLyRapScope.sql)
   trả 1 cho active ADMIN với mọi RapID, không cần assignment hoặc permission.
3. `usp_Admin_Showtime_Cancel` truyền actor NULL tới CancelCascade; CancelCascade
   chỉ kiểm scope khi actor không NULL. Đây là trusted wrapper path, không một
   permission/actor authorization check.

Sau khi clear toàn bộ grants của Admin trên fixture, giữ JWT:

- **68/68 Admin HTTP endpoints trả 403.** Backend không bypass Admin.
- DB helper cho missing XULY, unknown permission và unassigned cinema đều true.
- Direct Support List/AddProcessing và Manager_Room_List với actor Admin vẫn
  thành công; đã ghi một processing fixture dù thiếu XULY.
- Admin_User_List không có actor/permission check và vẫn executable qua application
  SQL connection.

FE không bypass permission, nhưng dùng QL_NGUOIDUNG để vào toàn Admin portal.
Không chứng minh HTTP privilege escalation bằng Admin JWT không có grants. Điểm
không thống nhất là DB bypass/trust-path so với HTTP current grants và FE coarse gate.

## 8. Revocation test results

[probes.json](evidence/probes.json): **242 HTTP requests**, 104 anonymous protected
checks, 68 zero-permission Admin checks, direct DB và 7 FE helper cases. JWT giữ
nguyên từ login ban đầu; grants thay đổi trên fixture đã commit trước request sau.

| Probe | Kết quả thực tế |
| --- | --- |
| Không JWT, toàn bộ protected endpoints | 104/104 trả 401 |
| Customer grant có quyền | Booking/payment/review/complaint hợp lệ |
| Customer DAT_VE revoked | Old JWT booking 201, preview 200 — thiếu permission guard |
| Customer THANH_TOAN revoked | Attempt 201, result 200 — thiếu permission guard |
| Customer DANH_GIA revoked | Eligible review 201; unwatched vẫn 403 |
| Customer GUI_KHIEU_NAI revoked | Complaint 201; foreign linked order vẫn 404 |
| Customer foreign order/complaint/payment | 404, không trả dữ liệu foreign |
| Manager đúng/sai cinema | 200 / 403 |
| Manager QL_PHONG revoked | HTTP 403; direct scope-only SP vẫn trả dữ liệu |
| Manager assignment revoked sau login | Old JWT HTTP 403, assignments cập nhật, direct SP 50050 |
| CSKH QL revoked nhưng còn XULY | HTTP read 403; direct DB read vẫn thành công vì OR |
| CSKH XULY revoked | HTTP processing 403; direct write 50060 |
| CSKH hết permissions | HTTP read 403; direct read 50060 |
| CSKH QL-only / TRA-only order reference | 200 thiếu TRA / 403 dù có TRA |
| Admin thiếu tất cả permissions | 68/68 HTTP 403, DB helper/SP bypass được reproduce |
| Account bị khóa, 4 actor giữ JWT cũ | 401 cho cả 4 actor |
| Role Manager đổi sau login | Old JWT manager route 403 |
| Role/permission catalog fixture | Không thêm/xóa/rename catalog trong probes |

Audit PASS nghĩa quan sát đúng current source và có evidence; các operation thiếu
permission **không được sửa để thành PASS**. Hai setup attempts được lưu riêng:
status enum assignment chưa đúng và so sánh catalog không sort; chỉ sửa harness,
rebuild fixture rồi chạy bản final. Không có production code change vì các lỗi này.

## 9. Mismatch theo P1/P2/P3

| ID | Mức | Finding / căn cứ |
| --- | --- | --- |
| BUG-019 / R3A-01 | P1 | 6 Customer functional endpoints chạy sau revoke; 4 private GET cũng chỉ role/owner nhưng permission đọc cần chốt |
| CONFLICT-005 / R3A-02 | P2 | Admin DB helper bypass grants/unknown permission và scope; actor NULL cancel path; HTTP vẫn deny đúng |
| R3A-03 | P2 | TRA_CUU_DON không dùng ở reference API/DB; QL-only được đọc, TRA-only bị chặn |
| R3A-04 | P2 | Support read DB QL OR XULY khác HTTP QL; direct DB read vẫn được sau QL revoke |
| BUG-020 / R3A-05 | P2 | DAT_VE/QL_PHONG/QL_NGUOIDUNG được dùng như portal-wide gate; partial grants bị chặn UX |
| R3A-06 | P2 | Menu lọc permission không role; section/action không guard từng quyền |
| R3A-07 | P2 | Manager Promise.all và Admin default dashboard yêu cầu quyền ngoài quyền mở portal |
| R3A-08 | P2 | Manager DB kiểm scope không permission; nhiều Admin SP tin Backend, actor contract chưa thống nhất |
| R3A-09 | P2 | Hardcoded area role, processing trigger, assignment target role là dependency phải chốt khi giảm role checks |
| R3A-10 | P3 | FE stale permissions/assignments sau revoke; API có guard đúng vẫn an toàn |
| R3A-11 | P3 | XEM_PHIM có grants nhưng public catalog không enforce; cần quyết định public exception |
| R3A-12 | P3 | Catalog chưa map own reads/bootstrap, không được tự đặt permission mới trong R3A |

Mức độ gắn với mismatch đã chứng minh; không gán P0 hoặc nói đã vượt quyền HTTP
Admin. Ownership và Manager scope revocation đang hoạt động đúng ở các nhánh đã probe.

## 10. Permission contract đề xuất cho R3B

[R3B_PERMISSION_CONTRACT_DRAFT.md](R3B_PERMISSION_CONTRACT_DRAFT.md) chứa contract,
mapping có căn cứ, acceptance tests và **8 quyết định cần review**. Authentication
→ active account → current permission → owner/scope → operation; deny by default;
Admin không tự bypass permission; FE chỉ UX.

Đặc biệt chưa chốt own-read mappings, self/bootstrap exceptions, public catalog,
QL/XULY read semantics, TRA + complaint visibility, global Admin eligibility và
business-role dependencies. Cùng một permission hiện cấp cả Admin/Manager: bỏ role
guard cơ học có thể mở global endpoints cho scoped Manager. Không làm việc đó.

## 11. File / SP / route dự kiến phải sửa ở R3B

Đây là dự kiến có điều kiện sau review, **chưa sửa bất kỳ file nào dưới đây**.

| Nhóm | File/SP/route dự kiến | Mục đích |
| --- | --- | --- |
| Customer BE | bookingRoutes.js, promotionRoutes.js, orderRoutes.js, movieRoutes.js, complaintRoutes.js | Functional guards; 4 private GET chờ mapping |
| Support/Admin BE | supportRoutes.js, adminRoutes.js | Reference permission; QL/XULY thống nhất |
| Role/actor BE | requireCustomer/Manager/Support/Admin.js, adminController.js, adminService.js, managerService.js, orderService.js, feedbackService.js, bookingService.js, procedures.js khi cần | Explicit eligibility + actor propagation; không raw SQL |
| DB permission | fn_KiemTraQuyenNguoiDung.sql, sp_RBAC_GetPermissionsByUser.sql nếu cần đồng bộ contract | Bỏ implicit Admin permission bypass, deny unknown |
| DB scope | fn_KiemTraQuanLyRapScope.sql, Manager operation SPs, sp_Manager_ListAssignedCinemas theo bootstrap policy | Permission + current assignment/global eligibility |
| DB support | 5 sp_Support_Complaint_*; sp_XuLyKhieuNai wrapper | Permission read/write/reference thống nhất |
| DB Customer | sp_Booking_Create, sp_Order_ListByCustomer/GetDetailByCustomer, payment CreateAttempt/UpdateResult, sp_Review_Create, sp_Complaint_* | Actor/permission/ownership theo mapping được duyệt; không đổi R2 business policy |
| DB Admin | Các sp_Admin_*/usp_Admin_* trong inventory | Actor + explicit permission đối với global operations nếu contract yêu cầu DB enforcement |
| DB cancel wrappers | usp_Admin_Showtime_Cancel, sp_Manager_Showtime_Cancel, sp_Showtime_CancelCascade | Xử lý actor NULL/global eligibility; giữ nguyên compensation/transaction/hold/payment policy R2 |
| Role dependencies | TRG_XuLyKhieuNai_KiemTraVaiTro, sp_Admin_Assignment_Create, usp_Admin_Assignment_Update, sp_PhanCongQuanLyRap | Chỉ đổi nếu eligibility policy được chốt; registration default role không tự bỏ |
| FE shell | constants/roles.js, utils/authorization.js, routes/index.jsx, RequireRole.jsx, AreaLayout.jsx | Portal/menu theo chức năng và eligibility đã chốt |
| FE pages/actions | ManagerPortal, AdminPortal, SupportPortal, BookingPreparation, MovieReviews, PaymentPage, Orders/OrderDetail, Complaints/ComplaintDetail, CinemaImageManager | Per-action guard, partial grants, không gọi API thiếu quyền |
| FE session UX | AuthContext.jsx, authSession.js, AccessErrorHandler.jsx | Refresh sau 403/revocation theo UX contract |
| Validation/artifacts | RBAC tests + baseline manifest/verify nếu SP thay đổi | Negative/partial-grant/revocation parity; giữ R1/R2 regression |

File nằm dưới backend/src, frontend/src và database tương ứng; đường dẫn SP và
route chính xác ở matrix/authorization inventory. Auth clock, tiền/điểm và các
BUG/GAP ngoài RBAC không thuộc thay đổi đề xuất.

## 12. Kết quả R3A

**PASS — audit đầy đủ, policy R3B vẫn DRAFT.** Toàn bộ protected API và permission
được inventory; 45 UC có trace; BE/DB/FE và owner/scope đối chiếu; BUG-019,
BUG-020, CONFLICT-005 có source/runtime evidence; token cũ sau revoke đã kiểm tra.

[before.json](evidence/before.json) và [after.json](evidence/after.json) đối chiếu
SHA-256 của production source, SQL modules/schema/SQL permissions và dữ liệu **27
bảng DB chính**: giữ nguyên. R1 timezone và R2 payment/cancellation không thay đổi.
[cleanup.json](evidence/cleanup.json) xác nhận fixture đã xóa; chỉ còn
CinemaBookingDB trong nhóm CinemaBooking DB.

Các file mới chỉ nằm ở `scripts/r3a/` và `audit/remediation/r3a/`. Không deploy,
không sửa role/permission/grant production, không thêm raw SQL vào Backend
application. Chưa bắt đầu R3B; cần review/chốt matrix và draft policy trước.
