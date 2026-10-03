# Findings — audit only

Không áp dụng bất kỳ fix nào. PROVEN là có reproduction/evidence; HIGH-CONFIDENCE là source/metadata; SUSPECTED và BLOCKED không được xem là lỗi đã tái hiện.

## BUG-001

**Title:** DateTime2 local và UTC lệch 7 giờ

**Severity:** P1

**Confidence:** PROVEN

**Affected UC:** KH-05, KH-07, KH-10, QLR-04/05, ADM-12/14

**Layer:** DB / BE / Integration

**Business Rule:** Giờ chiếu và hạn giữ ghế phải cùng hợp đồng thời gian.

**Expected:** 10:00 +07 được lưu/hiển thị 10:00; hạn giữ ghế là đúng 5 phút theo cùng múi giờ.

**Actual:** Suất 57 gửi 10:00 +07 nhưng API startTime=03:00. Suất 60 gửi 17:00 +07 nhưng trả 10:00. bookedAt/HanGiuCho lưu giờ Việt Nam nhưng JSON gắn Z; ví dụ order 40 tạo thực tế 06:41 UTC, hạn giữ trả 13:46Z.

**Steps to Reproduce:** Xem request audit-showtime-create, wall-clock-contract-check và real-five-minute-expiry-order; so sánh với đồng hồ SQL local/UTC.

**Evidence:** [integration-transcript.json](./evidence/integration-transcript.json), [supplemental-transcript.json](./evidence/supplemental-transcript.json), [live-environment.json](./evidence/live-environment.json)

**DB Objects:** sp_Showtime_GetDetail, fn_BayGio, sp_Booking_Create

**Backend Files:** [backend/src/services/adminService.js:214](../../backend/src/services/adminService.js#L214), [backend/src/services/managerService.js:74](../../backend/src/services/managerService.js#L74), [backend/src/config/database.js:10](../../backend/src/config/database.js#L10)

**Frontend Files:** [frontend/src/pages/ManagerPortal.jsx:6](../../frontend/src/pages/ManagerPortal.jsx#L6), [frontend/src/pages/BookingPreparation.jsx:149](../../frontend/src/pages/BookingPreparation.jsx#L149)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Có thể đóng đặt/thanh toán trước giờ dự kiến 7 giờ; timestamp phía FE sai nghĩa.

**Root Cause:** new Date(offset) đổi sang UTC; driver useUTC mặc định truyền UTC components vào datetime2 mang nghĩa local; đọc local datetime2 như UTC.

**Recommended Fix:** Thống nhất UTC hoặc giờ rạp xuyên DB/driver/DTO; không sửa dữ liệu lịch sử hàng loạt trước khi xác định nguồn.

**Regression Tests Required:** +07/Z/datetime-local, qua nửa đêm, hold 5 phút, promo start/end và payment cutoff.

**DO NOT FIX IN THIS TASK.**

## BUG-002

**Title:** Manager không đóng bán được và enum sai gây 500

**Severity:** P2

**Confidence:** PROVEN

**Affected UC:** QLR-05

**Layer:** BE / Integration

**Business Rule:** Trạng thái suất theo CK_SUATCHIEU_TrangThai.

**Expected:** Đóng bán được chấp nhận; Tạm ngừng trả 400.

**Actual:** Đóng bán trả 400; Tạm ngừng vượt validator rồi SQL CHECK lỗi, HTTP 500.

**Steps to Reproduce:** Gọi manager-close-correct-domain và manager-pause-wrong-domain trên suất audit 58.

**Evidence:** [integration-transcript.json](./evidence/integration-transcript.json)

**DB Objects:** CK_SUATCHIEU_TrangThai, sp_Manager_Showtime_Update

**Backend Files:** [backend/src/validators/managerValidator.js:7](../../backend/src/validators/managerValidator.js#L7), [backend/src/services/managerService.js:8](../../backend/src/services/managerService.js#L8)

**Frontend Files:** [frontend/src/pages/ManagerPortal.jsx:1](../../frontend/src/pages/ManagerPortal.jsx#L1)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Không chứng minh sửa dữ liệu cũ qua hành vi này.

**Root Cause:** SHOWTIME_STATUSES chứa Tạm ngừng thay Đóng bán; thiếu mapping 547.

**Recommended Fix:** Đồng bộ domain và map CHECK thành lỗi client.

**Regression Tests Required:** Toàn bộ enum hợp lệ/không hợp lệ và trạng thái null.

**DO NOT FIX IN THIS TASK.**

## BUG-003

**Title:** Lỗi lifecycle database mới không được map

**Severity:** P2

**Confidence:** PROVEN

**Affected UC:** QLR-04/05, ADM-14

**Layer:** BE / Integration

**Business Rule:** Validation nghiệp vụ phải trả 400/409 với thông báo có thể xử lý.

**Expected:** Suất ngắn hơn phim bị từ chối bằng lỗi nghiệp vụ.

**Actual:** manager-short-duration trả 500 EREQUEST; live sp_Showtime_ValidateTimes có THROW mới mà service không xử lý.

**Steps to Reproduce:** POST suất dài 1 phút cho phim audit 90 phút.

**Evidence:** [integration-transcript.json](./evidence/integration-transcript.json), [live-objects.json](./evidence/live-objects.json)

**DB Objects:** sp_Showtime_ValidateTimes

**Backend Files:** [backend/src/services/managerService.js:8](../../backend/src/services/managerService.js#L8), [backend/src/services/adminService.js:28](../../backend/src/services/adminService.js#L28)

**Frontend Files:** [frontend/src/pages/ManagerPortal.jsx:1](../../frontend/src/pages/ManagerPortal.jsx#L1)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Không chứng minh sửa dữ liệu cũ qua hành vi này.

**Root Cause:** BE của commit 7c3562 không có đầy đủ error contract của DB 014/015.

**Recommended Fix:** Chọn baseline đồng bộ trước, rồi khai báo và kiểm tra mapping theo flow.

**Regression Tests Required:** Mọi THROW lifecycle; phân biệt lỗi nhập, 404, xung đột và 500.

**DO NOT FIX IN THIS TASK.**

## BUG-004

**Title:** Manager UI gửi trường roomId không được phép khi tạo ghế

**Severity:** P1

**Confidence:** PROVEN

**Affected UC:** QLR-03

**Layer:** FE / Integration

**Business Rule:** UI phải gọi đúng contract createSeat(roomId, body).

**Expected:** Body chỉ row, number, type.

**Actual:** UI trải {...seat} chứa roomId; API trả 400 UNKNOWN_REQUEST_FIELD; ghế không tạo.

**Steps to Reproduce:** Chọn phòng audit ManagerRoom → Ghế → nhập hàng UI → Tạo ghế.

**Evidence:** [browser-manager-seat-error.png](./evidence/browser-manager-seat-error.png), [browser-manager-seat-error.txt](./evidence/browser-manager-seat-error.txt), [browser-network.json](./evidence/browser-network.json), [integration-transcript.json](./evidence/integration-transcript.json)

**DB Objects:** sp_Manager_Seat_Create

**Backend Files:** [backend/src/validators/managerValidator.js:100](../../backend/src/validators/managerValidator.js#L100)

**Frontend Files:** [frontend/src/pages/ManagerPortal.jsx:17](../../frontend/src/pages/ManagerPortal.jsx#L17)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Không chứng minh sửa dữ liệu cũ qua hành vi này.

**Root Cause:** Spread cả state routing field vào payload.

**Recommended Fix:** Tạo payload theo contract; bổ sung busy/refresh cho form ghế.

**Regression Tests Required:** Browser tạo ghế thật và đọc lại DB; unknown-field âm.

**DO NOT FIX IN THIS TASK.**

## BUG-005

**Title:** Admin UI sửa ảnh rạp luôn gửi cover ngoài contract

**Severity:** P1

**Confidence:** PROVEN

**Affected UC:** ADM-07

**Layer:** FE / Integration

**Business Rule:** Sửa metadata ảnh và set cover là hai API contract.

**Expected:** PUT metadata không có cover.

**Actual:** Lưu ảnh đã chọn trả 400 UNKNOWN_REQUEST_FIELD.

**Steps to Reproduce:** Admin → Ảnh rạp → chọn rạp audit → Sửa → Lưu.

**Evidence:** [browser-admin-image-update-error.png](./evidence/browser-admin-image-update-error.png), [browser-network.json](./evidence/browser-network.json)

**DB Objects:** usp_Admin_CinemaImage_Update

**Backend Files:** [backend/src/validators/adminValidator.js:108](../../backend/src/validators/adminValidator.js#L108)

**Frontend Files:** [frontend/src/components/CinemaImageManager.jsx:1](../../frontend/src/components/CinemaImageManager.jsx#L1)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Không chứng minh sửa dữ liệu cũ qua hành vi này.

**Root Cause:** Update dùng spread form chứa cover, trong khi cover là PATCH riêng.

**Recommended Fix:** Tách payload create/update/setCover theo contract hiện hành.

**Regression Tests Required:** Sửa URL/mô tả/order/status, cover PATCH, cover đang ẩn.

**DO NOT FIX IN THIS TASK.**

## BUG-006

**Title:** 9 form sửa Admin không nạp trạng thái ban đầu

**Severity:** P1

**Confidence:** PROVEN

**Affected UC:** ADM-02/07/08/09/11/12/13/14

**Layer:** FE / Integration

**Business Rule:** Form edit phải nạp các trường editOnly của bản ghi đang chọn.

**Expected:** Trạng thái ban đầu phản ánh TrangThai hiện tại.

**Actual:** Tài khoản, rạp, phòng, ghế, phim, sản phẩm, khuyến mãi, bảng giá, suất đều có status rỗng; Lưu mặc định rạp trả 400.

**Steps to Reproduce:** Chọn Sửa/Trạng thái của các fixture ID trong browser-admin-extra-checks.

**Evidence:** [browser-admin-extra-checks.json](./evidence/browser-admin-extra-checks.json), [browser-admin-cinema-edit-error.png](./evidence/browser-admin-cinema-edit-error.png), [browser-network.json](./evidence/browser-network.json)

**DB Objects:** Các SP update Admin, Các CHECK TrangThai

**Backend Files:** [backend/src/validators/adminValidator.js:59](../../backend/src/validators/adminValidator.js#L59)

**Frontend Files:** [frontend/src/pages/AdminPortal.jsx:88](../../frontend/src/pages/AdminPortal.jsx#L88)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Không chứng minh sửa dữ liệu cũ qua hành vi này.

**Root Cause:** onSelect tính rowValues từ editableFields của render selected=null, trước khi setSelected có hiệu lực.

**Recommended Fix:** Tính trường edit trực tiếp từ definition và bản ghi; dùng enum/select.

**Regression Tests Required:** 9 resource: chọn edit → không đổi status → lưu trường khác → DB status giữ nguyên.

**DO NOT FIX IN THIS TASK.**

## BUG-007

**Title:** Sửa tên vai trò báo thành công nhưng không lưu

**Severity:** P1

**Confidence:** PROVEN

**Affected UC:** ADM-03

**Layer:** FE / Integration

**Business Rule:** Thay tên/mô tả vai trò phải UPDATE VAITRO.

**Expected:** Tên mới được lưu qua role update.

**Actual:** Tên UiRole không đổi; UI báo Đã lưu thay đổi và chỉ gọi role-permissions.

**Steps to Reproduce:** Admin → Vai trò → chọn audit UiRole → đổi tên → Lưu → GET roles.

**Evidence:** [browser-checks.json](./evidence/browser-checks.json), [browser-network.json](./evidence/browser-network.json)

**DB Objects:** sp_Admin_Role_Update, sp_Admin_RolePermission_Set

**Backend Files:** [backend/src/services/adminService.js:1](../../backend/src/services/adminService.js#L1)

**Frontend Files:** [frontend/src/pages/AdminPortal.jsx:115](../../frontend/src/pages/AdminPortal.jsx#L115)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Không chứng minh sửa dữ liệu cũ qua hành vi này.

**Root Cause:** Nhánh permissionIds !== undefined luôn thắng nhánh update role sau onSelect.

**Recommended Fix:** Tách thao tác role metadata và permissions; không báo thành công khi bỏ qua thay đổi.

**Regression Tests Required:** Sửa tên, mô tả, quyền độc lập và cùng lúc.

**DO NOT FIX IN THIS TASK.**

## BUG-008

**Title:** Admin UI không gỡ được toàn bộ quyền

**Severity:** P2

**Confidence:** PROVEN

**Affected UC:** ADM-05

**Layer:** FE / Integration

**Business Rule:** Danh sách quyền trống phải thành [].

**Expected:** Input trống gửi permissionIds: [].

**Actual:** split empty → Number('')=0 → [0], API trả 400. API trực tiếp [] hoạt động.

**Steps to Reproduce:** Xóa hết nội dung QuyenID cần gán rồi Lưu.

**Evidence:** [browser-admin-role-permission-error.png](./evidence/browser-admin-role-permission-error.png), [supplemental-transcript.json](./evidence/supplemental-transcript.json)

**DB Objects:** sp_Admin_RolePermission_Set

**Backend Files:** [backend/src/validators/adminValidator.js:100](../../backend/src/validators/adminValidator.js#L100)

**Frontend Files:** [frontend/src/pages/AdminPortal.jsx:116](../../frontend/src/pages/AdminPortal.jsx#L116)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Không chứng minh sửa dữ liệu cũ qua hành vi này.

**Root Cause:** Parser giữ số 0 vì Number.isSafeInteger(0) true.

**Recommended Fix:** Parse empty thành [] và kiểm tra ID > 0.

**Regression Tests Required:** Empty, whitespace, trùng ID, ID âm/0, permission đang xóa.

**DO NOT FIX IN THIS TASK.**

## BUG-009

**Title:** ID vượt SQL INT được nhận rồi trả 500

**Severity:** P2

**Confidence:** PROVEN

**Affected UC:** ADM-08 và các path dùng cùng validator

**Layer:** BE / Integration

**Business Rule:** ID phải nằm trong miền SQL INT.

**Expected:** 2147483648 trả 400.

**Actual:** POST rooms cinemaId 2147483648 trả 500 EPARAM.

**Steps to Reproduce:** Gọi integer-overflow trong transcript.

**Evidence:** [integration-transcript.json](./evidence/integration-transcript.json)

**DB Objects:** @RapID INT

**Backend Files:** [backend/src/validators/adminValidator.js:11](../../backend/src/validators/adminValidator.js#L11), [backend/src/services/adminService.js:202](../../backend/src/services/adminService.js#L202)

**Frontend Files:** —

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Không chứng minh sửa dữ liệu cũ qua hành vi này.

**Root Cause:** Number.isSafeInteger không bảo đảm miền int32; Admin không map numeric parameter error.

**Recommended Fix:** Giới hạn ID <=2147483647 và map lỗi parameter.

**Regression Tests Required:** Biên int32 trên body/path/query, Infinity, số phân số và string.

**DO NOT FIX IN THIS TASK.**

## BUG-010

**Title:** Số ghế phân số bị làm thành số nguyên

**Severity:** P2

**Confidence:** PROVEN

**Affected UC:** ADM-08

**Layer:** BE / DB / Integration

**Business Rule:** SoGhe là số nguyên dương.

**Expected:** 1.5 trả 400 và không có ghế mới.

**Actual:** API nhận number 1.5, driver INT tạo ghế F1 (GheID 302).

**Steps to Reproduce:** POST fractional-seat, đọc response và danh sách ghế.

**Evidence:** [integration-transcript.json](./evidence/integration-transcript.json)

**DB Objects:** GHE, usp_Admin_Seat_Create

**Backend Files:** [backend/src/validators/adminValidator.js:104](../../backend/src/validators/adminValidator.js#L104), [backend/src/services/adminService.js:206](../../backend/src/services/adminService.js#L206)

**Frontend Files:** [frontend/src/pages/AdminPortal.jsx:1](../../frontend/src/pages/AdminPortal.jsx#L1)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Request và giá trị được lưu khác nhau.

**Root Cause:** Rule positive kiểm tra số >0 nhưng không Number.isInteger.

**Recommended Fix:** Dùng rule integer cho số ghế, duration, quantity và display order.

**Regression Tests Required:** 1.5/-1/0/maxint, xác nhận không sinh dòng khi bị từ chối.

**DO NOT FIX IN THIS TASK.**

## BUG-011

**Title:** Giới hạn tên Admin không khớp SQL parameter

**Severity:** P2

**Confidence:** PROVEN

**Affected UC:** ADM-02/03/04/07/08/10/11

**Layer:** BE / Integration

**Business Rule:** Độ dài phải khớp contract từng resource.

**Expected:** Tên phòng >100 bị từ chối 400 trước RPC.

**Actual:** Tên phòng 124 ký tự qua validator name<=255 rồi RPC trả 500; các name parameter 100/150 khác cùng rủi ro.

**Steps to Reproduce:** POST overlength-room-name.

**Evidence:** [supplemental-transcript.json](./evidence/supplemental-transcript.json), [backend-sp-contract-capture.json](./evidence/backend-sp-contract-capture.json)

**DB Objects:** @TenPhong NVARCHAR(100)

**Backend Files:** [backend/src/validators/adminValidator.js:84](../../backend/src/validators/adminValidator.js#L84), [backend/src/services/adminService.js:202](../../backend/src/services/adminService.js#L202)

**Frontend Files:** [frontend/src/pages/AdminPortal.jsx:1](../../frontend/src/pages/AdminPortal.jsx#L1)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Không chứng minh sửa dữ liệu cũ qua hành vi này.

**Root Cause:** Một fieldMax name=255 dùng chung cho parameter 100/150; nhiều field khác thiếu bound tương ứng.

**Recommended Fix:** Schema validation riêng theo resource, gồm độ dài nvarchar/varchar và byte encoding.

**Regression Tests Required:** room100/101, product150/151, role100/101; text MAX và description500 hợp lệ.

**DO NOT FIX IN THIS TASK.**

## BUG-012

**Title:** Sửa rạp không tồn tại trả 200 null

**Severity:** P2

**Confidence:** PROVEN

**Affected UC:** ADM-07

**Layer:** DB / BE

**Business Rule:** UPDATE resource không tồn tại phải 404.

**Expected:** Không cập nhật và trả CINEMA_NOT_FOUND.

**Actual:** PUT /admin/cinemas/2147483647 trả 200 {cinema:null}.

**Steps to Reproduce:** Gọi missing-cinema trong transcript.

**Evidence:** [integration-transcript.json](./evidence/integration-transcript.json)

**DB Objects:** sp_Admin_Cinema_Update

**Backend Files:** [backend/src/controllers/adminController.js:34](../../backend/src/controllers/adminController.js#L34), [backend/src/services/adminService.js:187](../../backend/src/services/adminService.js#L187)

**Frontend Files:** [frontend/src/pages/AdminPortal.jsx:1](../../frontend/src/pages/AdminPortal.jsx#L1)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Không chứng minh sửa dữ liệu cũ qua hành vi này.

**Root Cause:** SP UPDATE không kiểm tra existence; service.write nhận null vẫn trả success.

**Recommended Fix:** Kiểm existence ở SP hoặc contract trả not-found rõ ràng.

**Regression Tests Required:** Missing ID từng CRUD, xác nhận UI không hiện saved thành công.

**DO NOT FIX IN THIS TASK.**

## BUG-013

**Title:** Ngày sinh tương lai được ghi vào hồ sơ

**Severity:** P2

**Confidence:** PROVEN

**Affected UC:** KH-03

**Layer:** BE / DB

**Business Rule:** Ngày sinh hợp lệ không được nằm trong tương lai.

**Expected:** 2999-01-01 bị từ chối.

**Actual:** PUT /auth/me trả 200 và lưu birthday tương lai cho fixture user 26; dữ liệu cũ user 17 cũng có cùng dạng lỗi.

**Steps to Reproduce:** Gọi future-birthday-profile.

**Evidence:** [supplemental-transcript.json](./evidence/supplemental-transcript.json), [data-invalid-born-dates.json](./evidence/data-invalid-born-dates.json)

**DB Objects:** HOSOKHACHHANG, sp_User_UpdateProfile

**Backend Files:** [backend/src/validators/authValidator.js:30](../../backend/src/validators/authValidator.js#L30)

**Frontend Files:** [frontend/src/pages/auth/Profile.jsx:8](../../frontend/src/pages/auth/Profile.jsx#L8)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Hồ sơ có thông tin ngày sinh không thực tế.

**Root Cause:** Validator chỉ kiểm tra calendar date; không giới hạn <= ngày hiện tại.

**Recommended Fix:** Áp business date rule ở BE/SP và xử lý dữ liệu cũ theo xác minh.

**Regression Tests Required:** Today, tomorrow, leap date, giới hạn tuổi theo chính sách đã duyệt.

**DO NOT FIX IN THIS TASK.**

## BUG-014

**Title:** Admin tạo mật khẩu 73 byte không đăng nhập được bằng mật khẩu gốc

**Severity:** P1

**Confidence:** PROVEN

**Affected UC:** ADM-02

**Layer:** BE / Security / Integration

**Business Rule:** Create/login/hash phải dùng cùng quy tắc mật khẩu bcrypt.

**Expected:** Từ chối >72 byte khi tạo hoặc hỗ trợ cùng hợp đồng xác thực.

**Actual:** Create user thành công; login mật khẩu gốc trả 400; login tiền tố 72 byte trả 200.

**Steps to Reproduce:** admin-73-byte-password-create → original-password-login → truncated-password-login.

**Evidence:** [additional-transcript.json](./evidence/additional-transcript.json), [additional-checks.json](./evidence/additional-checks.json)

**DB Objects:** sp_Admin_User_Create

**Backend Files:** [backend/src/validators/adminValidator.js:76](../../backend/src/validators/adminValidator.js#L76), [backend/src/validators/authValidator.js:93](../../backend/src/validators/authValidator.js#L93), [backend/src/utils/password.js:6](../../backend/src/utils/password.js#L6)

**Frontend Files:** [frontend/src/pages/AdminPortal.jsx:1](../../frontend/src/pages/AdminPortal.jsx#L1)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Mật khẩu được chấp nhận khác mật khẩu người dùng đã đặt.

**Data Integrity Impact:** Không thay đổi profile; tài khoản nội bộ bị kẹt login.

**Root Cause:** Admin chấp nhận 8..128 ký tự, bcrypt cắt 72 byte, Login từ chối >72 byte.

**Recommended Fix:** Dùng cùng validation 8..72 byte trên mọi đường tạo tài khoản.

**Regression Tests Required:** 72/73 ASCII byte, Unicode vượt byte dù ít ký tự, không trim password ngoài ý định.

**DO NOT FIX IN THIS TASK.**

## BUG-015

**Title:** Admin tạo tài khoản khách hàng thiếu hồ sơ mở rộng

**Severity:** P2

**Confidence:** PROVEN

**Affected UC:** ADM-02, KH-03

**Layer:** DB / BE

**Business Rule:** Luồng Admin tạo nhân sự và luồng register customer có contract riêng.

**Expected:** Chặn KHACH_HANG trên create staff hoặc tạo đầy đủ HOSOKHACHHANG trong transaction.

**Actual:** roleId4 tạo user 34 MaVaiTro KHACH_HANG nhưng không có HOSOKHACHHANG.

**Steps to Reproduce:** POST admin-customer-role-create; query customer-profile-missing-after.

**Evidence:** [supplemental-transcript.json](./evidence/supplemental-transcript.json), [customer-profile-missing-after.json](./evidence/customer-profile-missing-after.json)

**DB Objects:** sp_Admin_User_Create, NGUOIDUNG, HOSOKHACHHANG

**Backend Files:** [backend/src/validators/adminValidator.js:92](../../backend/src/validators/adminValidator.js#L92), [backend/src/services/adminService.js:166](../../backend/src/services/adminService.js#L166)

**Frontend Files:** [frontend/src/pages/AdminPortal.jsx:1](../../frontend/src/pages/AdminPortal.jsx#L1)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Customer mới không đủ aggregate hồ sơ.

**Root Cause:** SP tạo bất kỳ role tồn tại nhưng chỉ INSERT NGUOIDUNG.

**Recommended Fix:** Xác định rõ role được phép; tạo atomic hồ sơ nếu thực sự hỗ trợ customer.

**Regression Tests Required:** Allowed staff roles, customer role, custom role, profile/points invariants.

**DO NOT FIX IN THIS TASK.**

## BUG-016

**Title:** Booking bỏ silently sản phẩm không tồn tại

**Severity:** P2

**Confidence:** PROVEN

**Affected UC:** KH-07/08

**Layer:** DB / BE / Integration

**Business Rule:** Đơn hàng phải phản ánh các sản phẩm được chọn hoặc báo unavailable.

**Expected:** Sản phẩm ID không tồn tại bị từ chối và rollback.

**Actual:** POST unknown-product-booking trả 201 nhưng productTotal=0, không có sản phẩm yêu cầu. Preview promo cùng sản phẩm có validation chặn, create booking không chặn.

**Steps to Reproduce:** Đặt ghế audit với products=[{productId:2147483647,quantity:1}].

**Evidence:** [additional-transcript.json](./evidence/additional-transcript.json)

**DB Objects:** sp_Booking_Create, SANPHAM, CHITIETDOAN

**Backend Files:** [backend/src/services/bookingService.js:129](../../backend/src/services/bookingService.js#L129)

**Frontend Files:** [frontend/src/pages/BookingPreparation.jsx:92](../../frontend/src/pages/BookingPreparation.jsx#L92)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Đơn thiếu mặt hàng khách đã chọn.

**Root Cause:** INNER JOIN SANPHAM + WHERE Đang bán loại dòng sai mà không kiểm đủ cardinality.

**Recommended Fix:** Kiểm toàn bộ requested products tồn tại/đang bán trong cùng transaction.

**Regression Tests Required:** Unknown/inactive product, mất hiệu lực giữa preview và submit, không tạo order/ticket khi thất bại.

**DO NOT FIX IN THIS TASK.**

## BUG-017

**Title:** Hai request phân công giống nhau tạo hai dòng

**Severity:** P2

**Confidence:** PROVEN

**Affected UC:** ADM-06

**Layer:** DB / Integration

**Business Rule:** Không nhân đôi một phân công hoàn toàn giống nhau.

**Expected:** Một row, request còn lại conflict/idempotent.

**Actual:** Hai POST đồng thời đều200; PhanCongID13/14 cùng manager 29, rạp 41, bắt đầu2026-11-02, Hiệu lực.

**Steps to Reproduce:** assignment-create-concurrency-0/1; query assignment-duplicates-after.

**Evidence:** [additional-transcript.json](./evidence/additional-transcript.json), [assignment-duplicates-after.json](./evidence/assignment-duplicates-after.json)

**DB Objects:** PHANCONG_RAP, sp_Admin_Assignment_Create

**Backend Files:** [backend/src/services/adminService.js:184](../../backend/src/services/adminService.js#L184)

**Frontend Files:** [frontend/src/pages/AdminPortal.jsx:15](../../frontend/src/pages/AdminPortal.jsx#L15)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Phân công lặp; không chứng minh Manager vượt rạp khác.

**Root Cause:** Không unique key/business guard cho cùng user/rap/khoảng; SP INSERT đơn.

**Recommended Fix:** Chốt semantics overlap/historical assignment, thêm guard transaction và key phù hợp.

**Regression Tests Required:** Same duplicate concurrent, future/expired, overlapping periods nếu không cho phép.

**DO NOT FIX IN THIS TASK.**

## BUG-018

**Title:** Số lượt đánh giá phim bị nhân theo số suất chiếu

**Severity:** P2

**Confidence:** PROVEN

**Affected UC:** KH-04

**Layer:** DB / BE / Integration

**Business Rule:** Số lượt đánh giá phải bằng COUNT DANHGIAPHIM của phim.

**Expected:** Một đánh giá của phim audit trả reviewCount=1.

**Actual:** vw_ThongKePhim JOIN DANHGIAPHIM và SUATCHIEU cùng lúc rồi COUNT(dg.DanhGiaID); API phim audit trả số nhân theo số suất. Có 3 phim sai trong query.

**Steps to Reproduce:** So COUNT trực tiếp với view, gọi GET /movies/14.

**Evidence:** [movie-review-count-multiplication.json](./evidence/movie-review-count-multiplication.json), [aggregates-transcript.json](./evidence/aggregates-transcript.json)

**DB Objects:** vw_ThongKePhim, sp_Movie_List, sp_Movie_GetDetail

**Backend Files:** [backend/src/services/catalogService.js:11](../../backend/src/services/catalogService.js#L11)

**Frontend Files:** [frontend/src/pages/MovieDetail.jsx:38](../../frontend/src/pages/MovieDetail.jsx#L38)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Sai dữ liệu thống kê trả ra, không tăng actual review rows.

**Root Cause:** JOIN hai quan hệ 1-n trước aggregate; AVG không đổi khi lặp đồng đều, COUNT bị nhân.

**Recommended Fix:** Pre-aggregate từng nhánh hoặc COUNT DISTINCT reviewID.

**Regression Tests Required:** 0/1/n reviews ×0/1/n showtimes, list và detail consistency.

**DO NOT FIX IN THIS TASK.**

## BUG-019

**Title:** Các Customer API không kiểm permission chức năng

**Severity:** P1

**Confidence:** HIGH-CONFIDENCE

**Affected UC:** KH-07/10/13/14, ADM-05

**Layer:** BE / Security

**Business Rule:** VAITRO_QUYEN xác định quyền chức năng theo thiết kế §1.1.

**Expected:** Thu hồi DAT_VE/THANH_TOAN/DANH_GIA/GUI_KHIEU_NAI phải chặn API tương ứng.

**Actual:** Routes chỉ authenticate + requireCustomer; SP booking kiểm active account, không kiểm DAT_VE. Chưa thu hồi quyền của role KHACH_HANG dùng chung để thử trên DB thật.

**Steps to Reproduce:** Đọc route compositions và core SP; không gọi kết quả là runtime bypass đã chứng minh.

**Evidence:** [api-chain-inventory.json](./evidence/api-chain-inventory.json), [live-objects.json](./evidence/live-objects.json)

**DB Objects:** sp_Booking_Create, sp_Payment_CreateAttempt, sp_Review_Create

**Backend Files:** [backend/src/routes/bookingRoutes.js:4](../../backend/src/routes/bookingRoutes.js#L4), [backend/src/routes/orderRoutes.js:4](../../backend/src/routes/orderRoutes.js#L4), [backend/src/routes/movieRoutes.js:5](../../backend/src/routes/movieRoutes.js#L5), [backend/src/routes/complaintRoutes.js:4](../../backend/src/routes/complaintRoutes.js#L4)

**Frontend Files:** [frontend/src/constants/roles.js:19](../../frontend/src/constants/roles.js#L19)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Rủi ro thu hồi quyền không có hiệu lực ở API customer; chưa chứng minh khai thác real DB.

**Data Integrity Impact:** Không chứng minh sửa dữ liệu cũ qua hành vi này.

**Root Cause:** Customer role guard được dùng thay functional permission guard.

**Recommended Fix:** Định nghĩa permission từng endpoint, kiểm ở BE và SP có identity khi phù hợp.

**Regression Tests Required:** Fresh isolated RBAC role: revoke permission→oldJWT denied; giữ role unchanged.

**DO NOT FIX IN THIS TASK.**

## BUG-020

**Title:** FE chặn cả portal bằng một permission đại diện

**Severity:** P2

**Confidence:** HIGH-CONFIDENCE

**Affected UC:** ADM-03..16, QLR-03..09, KH-10/14

**Layer:** FE / Security

**Business Rule:** Quyền từng chức năng độc lập với quyền vào một phân hệ khác.

**Expected:** User giữ quyền chức năng được vào màn hình tương ứng.

**Actual:** Orders/payment/complaints đều gated DAT_VE; Manager toàn portal QL_PHONG; Admin toàn portal QL_NGUOIDUNG. Không chạy đổi seeded permissions.

**Steps to Reproduce:** Đọc routes/ROLE_AREAS/RequireRole và so endpoint permission matrix.

**Evidence:** [api-chain-inventory.json](./evidence/api-chain-inventory.json)

**DB Objects:** VAITRO_QUYEN

**Backend Files:** [backend/src/routes/adminRoutes.js:1](../../backend/src/routes/adminRoutes.js#L1), [backend/src/routes/managerRoutes.js:1](../../backend/src/routes/managerRoutes.js#L1)

**Frontend Files:** [frontend/src/routes/index.jsx:5](../../frontend/src/routes/index.jsx#L5), [frontend/src/constants/roles.js:18](../../frontend/src/constants/roles.js#L18)

**Affected Data:** Chỉ các fixture mới dùng cho reproduction; các dòng tồn tại trước audit được ghi riêng trong DATA findings.

**Security Impact:** Không chứng minh truy cập trái quyền.

**Data Integrity Impact:** Không chứng minh sửa dữ liệu cũ qua hành vi này.

**Root Cause:** Area permission coarse được gán cho nhiều chức năng có permission khác.

**Recommended Fix:** Guard/chọn navigation theo từng function; server vẫn là authority.

**Regression Tests Required:** Khách chỉ có GUI_KHIEU_NAI; Manager chỉ QL_SUATCHIEU; Admin chỉ report/role.

**DO NOT FIX IN THIS TASK.**

# Functional gaps

## GAP-001

**Severity / Confidence:** P1 / PROVEN

**UC:** QLR-05

**Required feature:** UI sửa suất chiếu

**DB:** COMPLETE

**Backend:** PARTIAL

**Frontend:** MISSING

**Integration:** VERIFIED

**Impact:** Không có action/form sửa; BE có route nhưng enum BUG-002.

**Evidence:** [browser-checks.json](./evidence/browser-checks.json)

## GAP-002

**Severity / Confidence:** P2 / PROVEN

**UC:** QLR-02/03

**Required feature:** Sửa tên/loại phòng và loại ghế theo đặc tả

**DB:** COMPLETE

**Backend:** COMPLETE

**Frontend:** PARTIAL

**Integration:** VERIFIED

**Impact:** UI chỉ đổi trạng thái phòng/ghế; tạo ghế còn BUG-004.

**Evidence:** [browser-manager-seat-error.txt](./evidence/browser-manager-seat-error.txt)

## GAP-003

**Severity / Confidence:** P2 / HIGH-CONFIDENCE

**UC:** QLR-07

**Required feature:** Chọn loại ngày, định dạng, ngày kết thúc và sửa phụ thu

**DB:** COMPLETE

**Backend:** COMPLETE

**Frontend:** PARTIAL

**Integration:** VERIFIED

**Impact:** UI chỉ expose seatType/surcharge/start; dayType=Ngày thường, format=2D cố định, endsOn rỗng; update chỉ toggle status.

**Evidence:** [browser-checks.json](./evidence/browser-checks.json)

## GAP-004

**Severity / Confidence:** P2 / PROVEN

**UC:** QLR-09

**Required feature:** Chọn khoảng ngày báo cáo

**DB:** COMPLETE

**Backend:** COMPLETE

**Frontend:** MISSING

**Integration:** VERIFIED

**Impact:** Manager UI không có date filter; API đã hỗ trợ range.

**Evidence:** [browser-checks.json](./evidence/browser-checks.json)

## GAP-005

**Severity / Confidence:** P2 / PROVEN

**UC:** CSKH-04

**Required feature:** Đối chiếu đầy đủ đơn tham chiếu: tiền, suất, ghế, giao dịch

**DB:** PARTIAL

**Backend:** PARTIAL

**Frontend:** PARTIAL

**Integration:** VERIFIED

**Impact:** API trả row view với money/seat summary; không recordsets tickets/payments. CSKH UI chỉ id và status.

**Evidence:** [browser-support-detail.txt](./evidence/browser-support-detail.txt)

## GAP-006

**Severity / Confidence:** P2 / HIGH-CONFIDENCE

**UC:** ADM-07 / KH-05

**Required feature:** Public gallery ảnh rạp

**DB:** COMPLETE

**Backend:** COMPLETE

**Frontend:** MISSING

**Integration:** VERIFIED

**Impact:** API GET cinema/images có dữ liệu thật; FE public chỉ cover/fallback, export getCinemaImages không có component gallery sử dụng.

**Evidence:** [integration-transcript.json](./evidence/integration-transcript.json)

## GAP-007

**Severity / Confidence:** P2 / PROVEN

**UC:** Nhiều UC

**Required feature:** Real DB/browser regression suite trong repo

**DB:** PARTIAL

**Backend:** PARTIAL

**Frontend:** PARTIAL

**Integration:** NOT VERIFIED

**Impact:** 116 test có sẵn chủ yếu stub/source assertion/SSR. SQL suites có direct INSERT và stress sweeper không phù hợp database đang dùng; không chạy nguyên bản.

**Evidence:** [backend-tests.txt](./evidence/backend-tests.txt)

# Business rule conflicts

## CONFLICT-001

**Severity / Confidence:** P1 / PROVEN

**Rule:** KH-10 / QLR-06 / ADM-14: không refund, không hủy đơn đã thanh toán

**DB behavior:** sp_Showtime_CancelCascade hủy paid order, đổi payment Thành công→Đã hoàn tiền, giảm points.

**Backend behavior:** BE commit 7c3562 cho phép gọi cancel wrapper DB mới và trả200.

**Frontend behavior:** Confirmation nói active hold sẽ từ chối; order/payment DTO không giải thích refund lifecycle mới.

**Documentation:** KH-10 hiện hành nói không refund; source 013 cancel guard. Đoạn mô hình §3.6 có nhắc refund, tự mâu thuẫn.

**Conflict:** Test hủy suất57 đã paid order36 trả200; payment lịch sử bị đổi trạng thái.

**Correct rule based on current design:** Theo scope hiện hành và KH-10: không hủy paid order, không refund; nếu thay đổi phải cập nhật thiết kế và bảo toàn event lịch sử.

**Impact:** Sai lifecycle/scope hoặc không thể xác nhận tương thích deployment.

**Evidence:** [integration-transcript.json](./evidence/integration-transcript.json)

## CONFLICT-002

**Severity / Confidence:** P1 / PROVEN

**Rule:** KH-10: success đến muộn được ghi nhận nếu ghế còn trống/suất còn mở

**DB behavior:** Live sp_Payment_UpdateResult014 từ chối mọi late success với50111.

**Backend behavior:** Map409 ORDER_HOLD_EXPIRED.

**Frontend behavior:** Khách không hoàn tất attempt đã bắt đầu trước hạn.

**Documentation:** KH-10 nêu rõ cho phép late success có kiểm seat collision; source002 có policy này.

**Conflict:** Order40 attempt18 trước hạn; callback sau hơn5phút nhận409 dù ghế chưa bán cho người khác.

**Correct rule based on current design:** Áp policy late callback hiện hành hoặc sửa scope có quyết định rõ ràng; mô phỏng hiện tại không phải gateway thật.

**Impact:** Sai lifecycle/scope hoặc không thể xác nhận tương thích deployment.

**Evidence:** [additional-transcript.json](./evidence/additional-transcript.json)

## CONFLICT-003

**Severity / Confidence:** P1 / PROVEN

**Rule:** Baseline source phải phản ánh database deploy

**DB behavior:** 35module khác và6DB-only,2cột order mới.

**Backend behavior:** BE/source dừng migration013, DB definitions ghi014/015.

**Frontend behavior:** Portal/form/enum theo contract trước.

**Documentation:** DeployCommon chỉ001..013,007 intentionally absent.

**Conflict:** Git rollback chỉ rollback code; không rollback SQL Server.

**Correct rule based on current design:** Chọn version DB tương ứng commit hoặc khôi phục migration mới qua task riêng có review; audit không deploy/reset DB.

**Impact:** Sai lifecycle/scope hoặc không thể xác nhận tương thích deployment.

**Evidence:** [module-drift.json](./evidence/module-drift.json)

## CONFLICT-004

**Severity / Confidence:** P3 / PROVEN

**Rule:** 45 UC, ADM-17 đã bị gỡ

**DB behavior:** Không CAUHINH_HE_THONG hoặc sp_Admin_Config.

**Backend behavior:** Không route config.

**Frontend behavior:** Không mục Cấu hình hệ thống.

**Documentation:** Actor overview §2.1 vẫn có mục thứ17; UCtables và roadmap45. README mô tả Phase2/3 và portal còn là tương lai.

**Conflict:** Documentation chậm hơn implementation và scope.

**Correct rule based on current design:** 45UC; bỏ mục obsolete trong task docs riêng, giữ lời giải thích removal.

**Impact:** Sai lifecycle/scope hoặc không thể xác nhận tương thích deployment.

**Evidence:** [documentation-inventory.json](./evidence/documentation-inventory.json)

## CONFLICT-005

**Severity / Confidence:** P2 / HIGH-CONFIDENCE

**Rule:** Phân quyền theo VAITRO_QUYEN và vai trò

**DB behavior:** fn_KiemTraQuyenNguoiDung cho ADMIN bypass; nhiều Admin SP không nhận actor id.

**Backend behavior:** HTTP Admin vẫn requirePermission, Customer thiếu permission guard (BUG-019).

**Frontend behavior:** Coarse area permission (BUG-020).

**Documentation:** Thiết kế §1.1 xác định permission chức năng; Admin global nghĩa phạm vi tất cả rạp, chưa đồng nghĩa bypass mọi functional permission.

**Conflict:** Ba tầng không có một policy thống nhất với partial grants.

**Correct rule based on current design:** Chốt semantics Admin bypass và functional grant; kiểm cả API và DB caller theo policy đã duyệt.

**Impact:** Sai lifecycle/scope hoặc không thể xác nhận tương thích deployment.

**Evidence:** [api-chain-inventory.json](./evidence/api-chain-inventory.json)

# Data defects and observations

## DATA-001

**Severity / Confidence:** P0 / PROVEN

**Table:** DONDATVE

**Rows affected:** 1 dòng: DonDatVeID20 (đã tồn tại trước audit)

**Invalid condition:** 80,000+0−120,000 = −40,000

**Expected rule:** 0<=discount<=subtotal, tổng dương

**Likely source:** Không đủ evidence xác định nguồn; current SP có clamp99% nhưng CHECK chỉ từng cột.

**Affected UC:** KH-07/09/10/11/12

**Risk:** Giá trị tài chính không hợp lệ; order hiện đã Hết hạn, chưa chứng minh đã thu tiền âm.

**Suggested remediation:** Đối chiếu chứng từ/log trước khi sửa; không tự sửa discount lịch sử.

**Evidence:** [data-order-totals.json](./evidence/data-order-totals.json)

## DATA-002

**Severity / Confidence:** P1 / PROVEN

**Table:** DONDATVE/SUATCHIEU

**Rows affected:** 3 dòng cũ: orders26,27,28; show34

**Invalid condition:** Paid orders gắn show Đã hủy

**Expected rule:** Không hủy suất có paid order theo KH-10

**Likely source:** Nguồn chưa chứng minh; rollback source không đổi DB/data.

**Affected UC:** KH-10/12, QLR-06, ADM-14

**Risk:** Vé đã bán của lịch hủy; lifecycle và report không nhất quán.

**Suggested remediation:** Đối chiếu từng transaction; xác định chính sách xử lý trước khi sửa.

**Evidence:** [data-paid-cancelled-showtime.json](./evidence/data-paid-cancelled-showtime.json)

## DATA-003

**Severity / Confidence:** P2 / PROVEN

**Table:** SUATCHIEU/PHIM

**Rows affected:** 15 dòng cũ: IDs6,7,8,28,33,34,35,36,39,40,41,43,44,45,48

**Invalid condition:** Dài ngắn hơn ThoiLuong phim; có cả cancelled/history và Mở bán

**Expected rule:** Rule duration theo live ValidateTimes/đặc tả lịch chiếu

**Likely source:** Seed/test cũ hoặc thay đổi phim; chưa có mutation log.

**Affected UC:** KH-05, QLR-04/05, ADM-14

**Risk:** Lịch đang mở có thể không đủ thời lượng; đừng sửa cancelled history như lịch tương lai.

**Suggested remediation:** Phân loại current/history, xác minh duration đúng và lineage trước sửa.

**Evidence:** [data-showtime-duration.json](./evidence/data-showtime-duration.json)

## DATA-004

**Severity / Confidence:** P2 / PROVEN

**Table:** SUATCHIEU/PHIM

**Rows affected:** 4 dòng cũ: IDs6,7,8,43

**Invalid condition:** Chiếu ngoài releaseDate/endDate

**Expected rule:** Ngày chiếu trong thời gian phát hành theo live validator

**Likely source:** Chưa xác định;3show đã hủy và1show ngoài thời gian phim.

**Affected UC:** KH-05, QLR-04/05, ADM-14

**Risk:** Dữ liệu lịch không hợp lệ theo rule mới.

**Suggested remediation:** Đánh giá riêng lịch đã hủy và lịch còn mở, giữ evidence lịch sử.

**Evidence:** [data-showtime-movie-dates.json](./evidence/data-showtime-movie-dates.json)

## DATA-005

**Severity / Confidence:** P2 / PROVEN

**Table:** HOSOKHACHHANG

**Rows affected:** 1 dòng cũ user 17;1 fixture user 26 được API chấp nhận

**Invalid condition:** Ngày sinh2999-01-01

**Expected rule:** Ngày sinh<=ngày hiện tại

**Likely source:** BUG-013 tái hiện qua API; nguồn user 17 chưa xác định.

**Affected UC:** KH-03

**Risk:** Hồ sơ sai ngày sinh.

**Suggested remediation:** Xác minh chủ hồ sơ; không tự suy diễn ngày đúng.

**Evidence:** [data-invalid-born-dates.json](./evidence/data-invalid-born-dates.json)

## DATA-006

**Severity / Confidence:** P2 / PROVEN

**Table:** NGUOIDUNG/HOSOKHACHHANG

**Rows affected:** 2 dòng lúc kết thúc: user 21ngoài manifest và user 34fixture

**Invalid condition:** Role KHACH_HANG không có profile

**Expected rule:** Customer aggregate có HOSOKHACHHANG

**Likely source:** User34: Admin create trực tiếp role 4, BUG-015; user 21nguồn chưa xác định.

**Affected UC:** ADM-02, KH-03

**Risk:** Profile/loyalty thiếu; account21đã có trước run này theo ID/email khác prefix.

**Suggested remediation:** Đối chiếu luồng tạo tài khoản và thông tin profile trước backfill.

**Evidence:** [customer-profile-missing-after.json](./evidence/customer-profile-missing-after.json)

## DATA-007

**Severity / Confidence:** P2 / PROVEN

**Table:** PHANCONG_RAP

**Rows affected:** 1 nhóm active fixture gồm13/14;1 nhóm cancelled cũ user 3 / rap 3 cũng lặp hoàn toàn

**Invalid condition:** Cùng user,cinema,start,end,status hai dòng

**Expected rule:** Không duplicate cùng assignment identity

**Likely source:** Activefixture chứng minh BUG-017; nhóm cancelled cũ không nằm trong query active baseline.

**Affected UC:** ADM-06, QLR-01..09

**Risk:** List/scope có dữ liệu lặp; chưa chứng minh breach phạm vi.

**Suggested remediation:** Chốt identity/overlap semantics rồi hợp nhất có lưu audit trail.

**Evidence:** [assignment-duplicates-after.json](./evidence/assignment-duplicates-after.json)

## DATA-008

**Severity / Confidence:** P3 / SUSPECTED

**Table:** KHUYENMAI

**Rows affected:** 3 dòng cũ:1counter16vs2orders;2counter20vs0;3counter5vs0

**Invalid condition:** Counter khác số đơn hiện lưu

**Expected rule:** Phải giải thích được counter theo lifetime usage/seed/history

**Likely source:** Seed đã có counters5/20; current rows không chứng minh toàn bộ lifetime usage.

**Affected UC:** KH-09, ADM-12

**Risk:** Chưa đủ bằng chứng gọi là counter corrupt.

**Suggested remediation:** Đối chiếu seed, expired/cancelled policy và history; không reset counter theo COUNT hiện tại.

**Evidence:** [data-promotion-counter.json](./evidence/data-promotion-counter.json)

## DATA-009

**Severity / Confidence:** P3 / PROVEN

**Table:** SUATCHIEU

**Rows affected:** 6 dòng cũ đã qua giờ kết thúc vẫn Mở bán

**Invalid condition:** Lifecycle status chưa đóng lịch cũ

**Expected rule:** Phân biệt sale availability với status materialized

**Likely source:** Booking có time guard nên vẫn chặn; không có job hoàn tất suất tương ứng.

**Affected UC:** KH-05, QLR-08, ADM-14

**Risk:** Stale trạng thái; chưa chứng minh vẫn bán được suất quá giờ.

**Suggested remediation:** Quyết định materialized lifecycle/derived availability và bảo toàn lịch sử.

**Evidence:** [data-stale-open-showtimes.json](./evidence/data-stale-open-showtimes.json)
